import { useSyncExternalStore } from 'react';
import type { ActivityEntry, ActivityKind, AppData, EntityKind, Note, Permit, PrintAnalysis, PrintSet, Project, Redline, Settings, Sheet, TeamMember, TimeEntry } from '@/lib/types';
import { PROJECT_STATUSES, PERMIT_STATUSES, PRINT_STATUSES, PRIVATE_SETTING_KEYS } from '@/lib/types';
import { archiveFileName, buildProjectArchive, diffCounts, isProjectArchive, mergeArchive, validateArchive, type ChangeCounts } from '@/lib/archive';
import { normalizeMembers } from '@/lib/roles';
import { WORKFLOW_STEPS, QC_CHECKLIST } from '@/data/guide';
import { DATA_VERSION } from '@/lib/types';
import { nowIso, uid } from '@/lib/ids';
import { capActivity, mergeData, purgeTombstones } from '@/lib/merge';
import { toast } from '@/components/Toast';
import { FLUENCE_ID, SEED_REVISION, fluenceNotes, fluencePermits, fluenceProject, seedData } from './seed';
import { fluencePrints, fluenceRedlines } from '@/data/fluencePrints';

export const STORAGE_KEY = 'senawave-tracker:v1';
const BACKUP_PREFIX = 'senawave-tracker:backup:';
const BACKUP_DAY_KEY = 'senawave-tracker:backup-day';
export const BACKUPS_KEPT = 3;
let snapshotSeq = 0;

type Listener = () => void;

/** Raw state: includes tombstoned rows so deletes survive a sync. Pages read `view` instead. */
let state: AppData = load();
/** What the UI sees: the same data with tombstones filtered out. Rebuilt on every change. */
let view: AppData = project(state);
const listeners = new Set<Listener>();
let actor = '';

/** Name stamped on every edit as `updatedBy` (set from the signed-in user). */
export function setActor(name: string) {
  actor = name;
}

interface Stamped {
  id: string;
  updatedAt: string;
  deletedAt?: string | null;
}

function live<T extends Stamped>(xs: T[]): T[] {
  return xs.filter((x) => !x.deletedAt);
}

function project(d: AppData): AppData {
  return {
    ...d,
    activity: live(d.activity || []),
    projects: live(d.projects),
    notes: live(d.notes),
    permits: live(d.permits),
    prints: live(d.prints || []),
    redlines: live(d.redlines || []),
    timeEntries: live(d.timeEntries),
    team: live(d.team),
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

function load(): AppData {
  try {
    const raw = storage()?.getItem(STORAGE_KEY) ?? null;
    if (raw) return migrate(JSON.parse(raw));
  } catch (err) {
    console.warn('Could not read saved data, starting from seed', err);
  }
  return seedData();
}

function asArray<T>(x: unknown): T[] {
  return Array.isArray(x) ? (x as T[]) : [];
}

/** Fill anything missing from the seed so data saved by an older build keeps working. */
export function migrate(input: unknown): AppData {
  const seed = seedData();
  if (!input || typeof input !== 'object') return seed;
  const data = input as Partial<AppData>;
  const merged: AppData = {
    ...seed,
    ...data,
    activity: asArray<ActivityEntry>(data.activity),
    projects: asArray<Project>(data.projects),
    notes: asArray<Note>(data.notes),
    permits: asArray<Permit>(data.permits),
    prints: asArray<PrintSet>(data.prints),
    redlines: asArray<Redline>(data.redlines),
    timeEntries: asArray<TimeEntry>(data.timeEntries),
    team: asArray<TeamMember>(data.team),
    settings: { ...seed.settings, ...(data.settings || {}) },
    scratch: data.scratch && typeof data.scratch === 'object' ? data.scratch : {},
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : seed.updatedAt,
    version: DATA_VERSION,
    seedRevision: typeof data.seedRevision === 'string' ? data.seedRevision : undefined,
  };
  // Older data listed allowed sign-in emails; they become editors. The list is cleaned up and the owner removed from it.
  const legacy = asArray<string>((data.settings as { allowedEmails?: unknown } | undefined)?.allowedEmails);
  const members = [...asArray<Settings['members'][number]>(merged.settings.members)];
  for (const email of legacy) if (typeof email === 'string' && !members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) members.push({ email, name: '', role: 'editor', addedAt: merged.updatedAt });
  merged.settings = { ...merged.settings, members: normalizeMembers(members, merged.settings.ownerEmail) };
  delete (merged.settings as { allowedEmails?: unknown }).allowedEmails;
  // Team members from the seed that are new since the data was saved are added, never overwritten.
  const haveIds = new Set(merged.team.map((t) => t.id));
  for (const t of seed.team) if (!haveIds.has(t.id)) merged.team.push(t);
  // The first real project (Fluence) is added once to data saved before it existed. A tombstone counts as present,
  // so deleting it stays deleted.
  if (!merged.projects.some((p) => p.id === FLUENCE_ID)) {
    merged.projects.unshift(fluenceProject());
    const noteIds = new Set(merged.notes.map((n) => n.id));
    for (const n of fluenceNotes()) if (!noteIds.has(n.id)) merged.notes.push(n);
    const permitIds = new Set(merged.permits.map((x) => x.id));
    for (const x of fluencePermits()) if (!permitIds.has(x.id)) merged.permits.push(x);
  }
  // Fluence's two prints and the redlines from the 2 Oct review are added once, the same way. A tombstone counts as present.
  if (!merged.prints.some((x) => fluencePrints().some((f) => f.id === x.id))) {
    merged.prints.push(...fluencePrints());
    const have = new Set(merged.redlines.map((r) => r.id));
    for (const r of fluenceRedlines()) if (!have.has(r.id)) merged.redlines.push(r);
  }
  if (merged.seedRevision !== SEED_REVISION) upgradeSeedRows(merged, seed);
  return purgeTombstones(merged);
}

/** A built-in row as it came with the app: no person has edited it (every edit stamps the editor's name). */
function untouched(row: { updatedBy?: string; deletedAt?: string | null }): boolean {
  return !row.deletedAt && (!row.updatedBy || row.updatedBy === 'Tracker');
}

/**
 * Bring a copy saved by an older build up to the current built-in data, once per revision: built-in rows nobody
 * edited take the new version (corrections such as the Fluence project number travel this way), and new built-in
 * rows for live real projects are added. Rows a person changed, and rows they deleted, are left alone.
 */
function upgradeSeedRows(merged: AppData, seed: AppData) {
  const liveReal = new Set(merged.projects.filter((p) => !p.deletedAt && !p.sample).map((p) => p.id));
  for (const c of ['projects', 'notes', 'permits', 'prints', 'redlines', 'team'] as const) {
    const list = [...(merged[c] as Stamped[])];
    const index = new Map(list.map((r, i) => [r.id, i]));
    for (const row of seed[c] as (Stamped & { projectId?: string | null; tags?: string[]; sample?: boolean })[]) {
      const i = index.get(row.id);
      if (i === undefined) {
        const belongs = c === 'projects' || c === 'team' ? false : row.projectId ? liveReal.has(row.projectId) : !(row.tags || []).includes('sample');
        if (belongs) list.push(row);
        continue;
      }
      const mine = list[i] as Stamped & { updatedBy?: string };
      if (untouched(mine) && (mine.updatedAt || '') < (row.updatedAt || '')) list[i] = row;
    }
    (merged as unknown as Record<string, Stamped[]>)[c] = list;
  }
  merged.seedRevision = SEED_REVISION;
}

/** Shape check for imported / pulled files: enough to refuse a random JSON without being fussy. */
export function validateAppData(x: unknown): string | null {
  if (!x || typeof x !== 'object') return 'Not a tracker file (not a JSON object).';
  const d = x as Record<string, unknown>;
  if (!Array.isArray(d.projects)) return 'Not a tracker export (no projects array).';
  for (const key of ['notes', 'permits', 'prints', 'redlines', 'timeEntries', 'team'] as const) {
    if (d[key] !== undefined && !Array.isArray(d[key])) return `Field "${key}" should be a list.`;
  }
  const bad = (d.projects as unknown[]).find((p) => !p || typeof p !== 'object' || typeof (p as { id?: unknown }).id !== 'string');
  if (bad) return 'A project row has no id; this is not a tracker file.';
  return null;
}

// ---------- persistence (debounced, with daily rolling backups) ----------

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let quotaWarned = false;

function writeNow() {
  persistTimer = null;
  const s = storage();
  if (!s) return;
  try {
    s.setItem(STORAGE_KEY, JSON.stringify(state));
    maybeDailyBackup(s);
  } catch (err) {
    console.warn('Could not persist data', err);
    if (!quotaWarned) {
      quotaWarned = true;
      toast('Browser storage is full or blocked; changes are not being saved. Export your data from Settings.', 'bad');
    }
  }
}

function persist() {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(writeNow, 200);
}

/** Write any pending change immediately (tab closing, tests). */
export function flushPersist() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    writeNow();
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', flushPersist);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPersist();
  });
}

export interface BackupInfo {
  key: string;
  savedAt: string;
  reason: string;
  projects: number;
  notes: number;
}

function maybeDailyBackup(s: Storage) {
  const today = nowIso().slice(0, 10);
  if (s.getItem(BACKUP_DAY_KEY) === today) return;
  s.setItem(BACKUP_DAY_KEY, today);
  snapshot('daily');
}

/** Keep a copy of the current data under a timestamped key; the oldest beyond BACKUPS_KEPT are dropped. */
export function snapshot(reason: string): string | null {
  const s = storage();
  if (!s) return null;
  // Timestamp plus a sequence so two snapshots in the same millisecond never share a key.
  const key = `${BACKUP_PREFIX}${nowIso()}-${String(++snapshotSeq).padStart(4, '0')}`;
  try {
    s.setItem(key, JSON.stringify({ reason, savedAt: nowIso(), data: state }));
  } catch (err) {
    console.warn('Could not write backup', err);
    return null;
  }
  const keys = backupKeys(s).sort();
  while (keys.length > BACKUPS_KEPT) s.removeItem(keys.shift()!);
  return key;
}

function backupKeys(s: Storage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k && k.startsWith(BACKUP_PREFIX)) keys.push(k);
  }
  return keys;
}

export function listBackups(): BackupInfo[] {
  const s = storage();
  if (!s) return [];
  return backupKeys(s)
    .sort()
    .reverse()
    .map((key) => {
      try {
        const b = JSON.parse(s.getItem(key) || '') as { reason: string; savedAt: string; data: AppData };
        return { key, savedAt: b.savedAt, reason: b.reason, projects: live(b.data.projects || []).length, notes: live(b.data.notes || []).length };
      } catch {
        return null;
      }
    })
    .filter((b): b is BackupInfo => !!b);
}

export function restoreBackup(key: string): { ok: boolean; error?: string } {
  const s = storage();
  if (!s) return { ok: false, error: 'No browser storage.' };
  try {
    const b = JSON.parse(s.getItem(key) || '') as { data: AppData };
    const err = validateAppData(b.data);
    if (err) return { ok: false, error: err };
    snapshot('before-restore');
    setState(migrate(b.data), { touch: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

// ---------- core ----------

function emit() {
  for (const l of listeners) l();
}

/** Raw data including tombstones: for sync, export and tests. UI code should use `useAppData`. */
export function getState(): AppData {
  return state;
}

/** Data as the UI sees it (tombstones hidden). */
export function getView(): AppData {
  return view;
}

// A viewer can read and pull but not change anything. Edits made on this device are refused in one place,
// here; pulling someone else's changes in (touch: false) is still allowed.
let writeLocked = false;
let lastLockToast = 0;

export function setWriteLock(locked: boolean) {
  writeLocked = locked;
}

export function isWriteLocked(): boolean {
  return writeLocked;
}

export function setState(next: AppData, opts: { touch?: boolean } = {}) {
  if (writeLocked && opts.touch !== false) {
    if (Date.now() - lastLockToast > 3000) {
      lastLockToast = Date.now();
      toast('You have view-only access, so this change was not saved. Ask an admin for editor access.', 'bad');
    }
    return;
  }
  state = opts.touch === false ? next : { ...next, updatedAt: nowIso() };
  view = project(state);
  persist();
  emit();
}

function update(fn: (draft: AppData) => AppData) {
  setState(fn(state));
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getView, getView);
}

function stamp<T extends Stamped>(row: T, patch: Partial<T>): T {
  return { ...row, ...patch, updatedAt: nowIso(), updatedBy: actor || (row as { updatedBy?: string }).updatedBy };
}

function patchIn<T extends Stamped>(xs: T[], id: string, patch: Partial<T> | ((row: T) => Partial<T>)): T[] {
  return xs.map((row) => (row.id === id ? stamp(row, typeof patch === 'function' ? patch(row) : patch) : row));
}

// ---------- activity log (feeds the evening log) ----------

export function logActivity(kind: ActivityKind, label: string, projectId: string | null = null) {
  const ts = nowIso();
  const entry: ActivityEntry = { id: uid('act'), at: ts, kind, label, projectId, by: actor || 'me', updatedAt: ts };
  update((d) => ({ ...d, activity: capActivity([entry, ...(d.activity || [])]) }));
}

/** Activity lines whose local date is `day` (YYYY-MM-DD). */
export function activityOn(d: AppData, day: string): ActivityEntry[] {
  return d.activity.filter((a) => localDay(a.at) === day).sort((a, b) => b.at.localeCompare(a.at));
}

export function localDay(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return iso.slice(0, 10);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
}

function describeProjectChange(before: Project, after: Project): { kind: ActivityKind; label: string }[] {
  const out: { kind: ActivityKind; label: string }[] = [];
  const tag = after.number || after.name || 'project';
  if (before.status !== after.status) out.push({ kind: 'status', label: `${tag}: status → ${PROJECT_STATUSES.find((s) => s.id === after.status)?.label || after.status}` });
  for (const s of WORKFLOW_STEPS) {
    if (!before.workflow[s.id] && after.workflow[s.id]) out.push({ kind: 'workflow', label: `${tag}: done — ${s.label.slice(0, 80)}` });
  }
  for (const q of QC_CHECKLIST) {
    if (!before.qc[q.id] && after.qc[q.id]) out.push({ kind: 'qc', label: `${tag}: QC ✓ ${q.label.slice(0, 80)}` });
  }
  const prev = new Map(before.sheets.map((s) => [s.id, s]));
  for (const s of after.sheets) {
    const p = prev.get(s.id);
    const flags = ['aligned', 'clipped', 'sidePanel', 'titleblock', 'qcDone'] as const;
    const newly = flags.filter((f) => s[f] && !(p && p[f]));
    if (newly.length) out.push({ kind: 'sheet', label: `${tag}: PLAN-${String(s.pageNumber).padStart(2, '0')} ${newly.join(', ')}` });
  }
  if (before.sheets.length === 0 && after.sheets.length > 0) out.push({ kind: 'sheet', label: `${tag}: sheet index created (${after.sheets.length} sheets)` });
  return out;
}

/** Soft delete: the row stays, hidden, so the delete syncs to other copies and can be undone. */
export function deleteEntity(kind: EntityKind, id: string) {
  const ts = nowIso();
  update((d) => ({ ...d, [kind]: patchIn(d[kind] as Stamped[], id, { deletedAt: ts }) }));
}

export function restoreEntity(kind: EntityKind, id: string) {
  update((d) => ({ ...d, [kind]: patchIn(d[kind] as Stamped[], id, { deletedAt: null }) }));
}

// ---------- projects ----------

export function newProject(partial: Partial<Project> = {}): Project {
  const ts = nowIso();
  return {
    id: uid('prj'),
    number: '',
    name: '',
    client: 'Senawave',
    municipality: '',
    county: '',
    status: 'intake',
    funding: '',
    crs: 'EPSG:3566',
    routeLengthFt: null,
    pm: '',
    engineer: '',
    designer: '',
    designDate: '',
    fieldDate: '',
    dueDate: '',
    driveFolderUrl: '',
    arcgisProjectUrl: '',
    drawingPath: '',
    description: '',
    workflow: {},
    qc: {},
    sheets: [],
    createdAt: ts,
    updatedAt: ts,
    updatedBy: actor || undefined,
    ...partial,
  };
}

export function addProject(p: Project) {
  update((d) => ({ ...d, projects: [p, ...d.projects] }));
  logActivity('project', `Created project ${p.number || p.name}`, p.id);
}

export function updateProject(id: string, patch: Partial<Project> | ((p: Project) => Partial<Project>)) {
  const before = state.projects.find((p) => p.id === id);
  update((d) => ({ ...d, projects: patchIn(d.projects, id, patch) }));
  const after = state.projects.find((p) => p.id === id);
  if (before && after) for (const c of describeProjectChange(before, after)) logActivity(c.kind, c.label, id);
}

/** Tombstones the project and its permits together; notes and time stay linked for the undo. */
export function deleteProject(id: string) {
  const ts = nowIso();
  update((d) => ({
    ...d,
    projects: patchIn(d.projects, id, { deletedAt: ts }),
    permits: d.permits.map((x) => (x.projectId === id && !x.deletedAt ? stamp(x, { deletedAt: ts }) : x)),
    prints: (d.prints || []).map((x) => (x.projectId === id && !x.deletedAt ? stamp(x, { deletedAt: ts }) : x)),
    redlines: (d.redlines || []).map((x) => (x.projectId === id && !x.deletedAt ? stamp(x, { deletedAt: ts }) : x)),
  }));
}

export function restoreProject(id: string) {
  update((d) => {
    const p = d.projects.find((x) => x.id === id);
    if (!p) return d;
    return {
      ...d,
      projects: patchIn(d.projects, id, { deletedAt: null }),
      permits: d.permits.map((x) => (x.projectId === id && x.deletedAt && x.deletedAt === p.deletedAt ? stamp(x, { deletedAt: null }) : x)),
      prints: (d.prints || []).map((x) => (x.projectId === id && x.deletedAt && x.deletedAt === p.deletedAt ? stamp(x, { deletedAt: null }) : x)),
      redlines: (d.redlines || []).map((x) => (x.projectId === id && x.deletedAt && x.deletedAt === p.deletedAt ? stamp(x, { deletedAt: null }) : x)),
    };
  });
}

export function newSheet(pageNumber: number): Sheet {
  return {
    id: uid('sht'),
    pageNumber,
    angle: null,
    cellFt: null,
    clipX0: null,
    clipX1: null,
    matchL: '',
    matchR: '',
    matchT: '',
    matchB: '',
    aligned: false,
    clipped: false,
    sidePanel: false,
    titleblock: false,
    qcDone: false,
    notes: '',
  };
}

// ---------- notes ----------

export function newNote(author: string, partial: Partial<Note> = {}): Note {
  const ts = nowIso();
  return {
    id: uid('note'),
    projectId: null,
    sheetNo: null,
    type: 'note',
    title: '',
    body: '',
    tags: [],
    done: false,
    dueOn: '',
    author,
    createdAt: ts,
    updatedAt: ts,
    updatedBy: actor || undefined,
    ...partial,
  };
}

export function addNote(n: Note) {
  update((d) => ({ ...d, notes: [n, ...d.notes] }));
  if (!n.tags.includes('daily-log')) logActivity('note', `${n.type}: ${n.title || n.body.slice(0, 60)}`, n.projectId);
}

export function updateNote(id: string, patch: Partial<Note>) {
  const before = state.notes.find((n) => n.id === id);
  update((d) => ({ ...d, notes: patchIn(d.notes, id, patch) }));
  if (before && patch.done === true && !before.done) logActivity('note', `Done: ${before.title}`, before.projectId);
}

export function deleteNote(id: string) {
  deleteEntity('notes', id);
}

// ---------- permits ----------

export function newPermit(projectId: string, partial: Partial<Permit> = {}): Permit {
  const ts = nowIso();
  return {
    id: uid('pmt'),
    projectId,
    agency: 'Municipal',
    agencyName: '',
    type: 'ROW excavation permit',
    status: 'not-started',
    permitNo: '',
    submittedOn: '',
    dueOn: '',
    notes: '',
    createdAt: ts,
    updatedAt: ts,
    updatedBy: actor || undefined,
    ...partial,
  };
}

export function addPermit(p: Permit) {
  update((d) => ({ ...d, permits: [...d.permits, p] }));
  logActivity('permit', `Permit added: ${p.agencyName || p.agency} — ${p.type}`, p.projectId);
}

export function updatePermit(id: string, patch: Partial<Permit>) {
  const before = state.permits.find((p) => p.id === id);
  update((d) => ({ ...d, permits: patchIn(d.permits, id, patch) }));
  if (before && patch.status && patch.status !== before.status) logActivity('permit', `${before.agencyName || before.agency} ${before.type}: ${PERMIT_STATUSES.find((s) => s.id === patch.status)?.label || patch.status}`, before.projectId);
}

export function deletePermit(id: string) {
  deleteEntity('permits', id);
}

// ---------- prints, redlines and AI analysis ----------

export function newPrint(projectId: string, partial: Partial<PrintSet> = {}): PrintSet {
  const ts = nowIso();
  return {
    id: uid('prt'),
    projectId,
    label: '',
    issuedOn: ts.slice(0, 10),
    by: '',
    fileUrl: '',
    sheetCount: null,
    status: 'draft',
    summary: '',
    reviewFileName: '',
    reviewFileUrl: '',
    reviewBy: '',
    reviewOn: '',
    reviewNote: '',
    analysis: null,
    createdAt: ts,
    updatedAt: ts,
    updatedBy: actor || undefined,
    ...partial,
  };
}

export function addPrint(p: PrintSet) {
  update((d) => ({ ...d, prints: [p, ...(d.prints || [])] }));
  logActivity('print', `Print logged: ${p.label || 'untitled'}`, p.projectId);
}

export function updatePrint(id: string, patch: Partial<PrintSet>) {
  const before = state.prints.find((p) => p.id === id);
  update((d) => ({ ...d, prints: patchIn(d.prints || [], id, patch) }));
  if (before && patch.status && patch.status !== before.status) logActivity('print', `${before.label}: ${PRINT_STATUSES.find((s) => s.id === patch.status)?.label || patch.status}`, before.projectId);
}

/** Tombstones the print and the redlines written on it together. */
export function deletePrint(id: string) {
  const ts = nowIso();
  update((d) => ({
    ...d,
    prints: patchIn(d.prints || [], id, { deletedAt: ts }),
    redlines: (d.redlines || []).map((r) => (r.printId === id && !r.deletedAt ? stamp(r, { deletedAt: ts }) : r)),
  }));
}

export function restorePrint(id: string) {
  update((d) => {
    const p = (d.prints || []).find((x) => x.id === id);
    if (!p) return d;
    return {
      ...d,
      prints: patchIn(d.prints || [], id, { deletedAt: null }),
      redlines: (d.redlines || []).map((r) => (r.printId === id && r.deletedAt && r.deletedAt === p.deletedAt ? stamp(r, { deletedAt: null }) : r)),
    };
  });
}

/** Stores the analysis on the print (replacing any earlier one) and logs it. */
export function setPrintAnalysis(id: string, analysis: PrintAnalysis) {
  const p = state.prints.find((x) => x.id === id);
  if (!p) return;
  update((d) => ({ ...d, prints: patchIn(d.prints || [], id, { analysis }) }));
  logActivity('print', `AI analysis added to ${p.label} (${analysis.findings.length} findings)`, p.projectId);
}

export function updateFinding(printId: string, findingId: string, patch: Partial<{ status: 'open' | 'done' | 'dismissed' }>) {
  const p = state.prints.find((x) => x.id === printId);
  if (!p || !p.analysis) return;
  const analysis = { ...p.analysis, findings: p.analysis.findings.map((f) => (f.id === findingId ? { ...f, ...patch } : f)) };
  update((d) => ({ ...d, prints: patchIn(d.prints || [], printId, { analysis }) }));
}

export function newRedline(projectId: string, printId: string, partial: Partial<Redline> = {}): Redline {
  const ts = nowIso();
  return {
    id: uid('red'),
    projectId,
    printId,
    sheet: '',
    kind: 'fix',
    text: '',
    by: actor || '',
    status: 'open',
    response: '',
    createdAt: ts,
    updatedAt: ts,
    updatedBy: actor || undefined,
    ...partial,
  };
}

export function addRedline(r: Redline) {
  update((d) => ({ ...d, redlines: [...(d.redlines || []), r] }));
  logActivity('print', `Redline${r.sheet ? ` on ${r.sheet}` : ''}: ${r.text.slice(0, 70)}`, r.projectId);
}

export function updateRedline(id: string, patch: Partial<Redline>) {
  const before = state.redlines.find((r) => r.id === id);
  update((d) => ({ ...d, redlines: patchIn(d.redlines || [], id, patch) }));
  if (before && patch.status && patch.status !== before.status) logActivity('print', `Redline ${patch.status}${before.sheet ? ` on ${before.sheet}` : ''}: ${before.text.slice(0, 60)}`, before.projectId);
}

export function deleteRedline(id: string) {
  deleteEntity('redlines', id);
}

// ---------- time ----------

export function newTimeEntry(partial: Partial<TimeEntry> = {}): TimeEntry {
  const ts = nowIso();
  return {
    id: uid('tme'),
    projectId: null,
    date: ts.slice(0, 10),
    hours: 1,
    description: '',
    billable: true,
    invoiced: false,
    createdAt: ts,
    updatedAt: ts,
    updatedBy: actor || undefined,
    ...partial,
  };
}

export function addTimeEntry(t: TimeEntry) {
  update((d) => ({ ...d, timeEntries: [t, ...d.timeEntries] }));
  logActivity('time', `${t.hours} h — ${t.description || 'time logged'}`, t.projectId);
}

export function updateTimeEntry(id: string, patch: Partial<TimeEntry>) {
  update((d) => ({ ...d, timeEntries: patchIn(d.timeEntries, id, patch) }));
}

export function deleteTimeEntry(id: string) {
  deleteEntity('timeEntries', id);
}

// ---------- team ----------

export function newTeamMember(partial: Partial<TeamMember> = {}): TeamMember {
  return {
    id: uid('tm'),
    name: '',
    role: '',
    org: 'Senawave',
    email: '',
    phone: '',
    responsibilities: '',
    notes: '',
    links: [],
    verified: 'unverified',
    updatedAt: nowIso(),
    updatedBy: actor || undefined,
    ...partial,
  };
}

export function addTeamMember(t: TeamMember) {
  update((d) => ({ ...d, team: [...d.team, t] }));
}

export function updateTeamMember(id: string, patch: Partial<TeamMember>) {
  update((d) => ({ ...d, team: patchIn(d.team, id, patch) }));
}

export function deleteTeamMember(id: string) {
  deleteEntity('team', id);
}

// ---------- settings / scratch ----------

export function updateSettings(patch: Partial<Settings>) {
  // Settings that never leave this device (theme, sync target...) can be changed even with view-only access.
  const privateOnly = Object.keys(patch).every((k) => (PRIVATE_SETTING_KEYS as readonly string[]).includes(k));
  if (writeLocked && privateOnly) {
    setState({ ...state, settings: { ...state.settings, ...patch } }, { touch: false });
    return;
  }
  update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
}

export function setScratch(key: string, body: string) {
  update((d) => ({ ...d, scratch: { ...d.scratch, [key]: { body, updatedAt: nowIso() } } }));
}

// ---------- import / export / reset ----------

/** Full copy of what is in this browser, tombstones and private settings included (it is your backup). */
export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}

export interface ImportResult {
  ok: boolean;
  error?: string;
  /** Present for merges: how many rows were added and how many changed. */
  changes?: ChangeCounts;
  /** Present when the file was a single-project archive. */
  archive?: string;
}

export function importJson(text: string, mode: 'replace' | 'merge'): ImportResult {
  try {
    const parsed = JSON.parse(text) as unknown;
    // A project archive is always merged in: it can add or update that project, never replace your data.
    if (isProjectArchive(parsed)) {
      const err = validateArchive(parsed);
      if (err) return { ok: false, error: err };
      const merged = mergeArchive(state, parsed);
      const changes = diffCounts(state, merged);
      if (changes.added + changes.updated > 0) {
        snapshot('before-archive-import');
        setState(merged);
      }
      return { ok: true, changes, archive: parsed.project.number || parsed.project.name };
    }
    const err = validateAppData(parsed);
    if (err) return { ok: false, error: err };
    const incoming = migrate(parsed);
    if (mode === 'replace') {
      snapshot('before-import-replace');
      setState(incoming, { touch: false });
      return { ok: true };
    }
    const merged = mergeData(state, incoming);
    const changes = diffCounts(state, merged);
    setState(merged, { touch: changes.added + changes.updated === 0 });
    return { ok: true, changes };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

/** One project as a file (see lib/archive). Returns null when the project does not exist. */
export function exportProjectArchive(projectId: string, includeTime: boolean): { text: string; fileName: string } | null {
  const a = buildProjectArchive(state, projectId, { by: actor || 'me', includeTime });
  return a ? { text: JSON.stringify(a, null, 2), fileName: archiveFileName(a) } : null;
}

export function applyRemote(remote: unknown) {
  const err = validateAppData(remote);
  if (err) throw new Error(`The Drive file is not a tracker file: ${err}`);
  setState(mergeData(state, migrate(remote)), { touch: false });
}

export function resetToSeed(keepSettings: boolean) {
  snapshot('before-reset');
  const seed = seedData();
  setState(keepSettings ? { ...seed, settings: state.settings } : seed);
}

/** Tombstones the seeded demo rows (so the removal syncs too) instead of dropping them. */
export function removeSampleData() {
  const ts = nowIso();
  update((d) => {
    const sampleIds = new Set(d.projects.filter((p) => p.sample).map((p) => p.id));
    const bury = <T extends Stamped>(xs: T[], isSample: (x: T) => boolean) => xs.map((x) => (!x.deletedAt && isSample(x) ? stamp(x, { deletedAt: ts } as Partial<T>) : x));
    return {
      ...d,
      projects: bury(d.projects, (p) => !!p.sample),
      notes: bury(d.notes, (n) => (!!n.projectId && sampleIds.has(n.projectId)) || n.tags.includes('sample')),
      permits: bury(d.permits, (p) => sampleIds.has(p.projectId)),
      prints: bury(d.prints || [], (p) => sampleIds.has(p.projectId)),
      redlines: bury(d.redlines || [], (r) => sampleIds.has(r.projectId)),
      timeEntries: bury(d.timeEntries, (t) => !!t.projectId && sampleIds.has(t.projectId)),
    };
  });
}

export function hasSampleData(d: AppData): boolean {
  return d.projects.some((p) => p.sample && !p.deletedAt);
}
