import { useSyncExternalStore } from 'react';
import type { ActivityEntry, ActivityKind, AppData, EntityKind, Note, Permit, Project, Settings, Sheet, TeamMember, TimeEntry } from '@/lib/types';
import { PROJECT_STATUSES, PERMIT_STATUSES } from '@/lib/types';
import { WORKFLOW_STEPS, QC_CHECKLIST } from '@/data/guide';
import { DATA_VERSION } from '@/lib/types';
import { nowIso, uid } from '@/lib/ids';
import { capActivity, mergeData, purgeTombstones } from '@/lib/merge';
import { toast } from '@/components/Toast';
import { FLUENCE_ID, fluenceNotes, fluenceProject, seedData } from './seed';

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
    timeEntries: asArray<TimeEntry>(data.timeEntries),
    team: asArray<TeamMember>(data.team),
    settings: { ...seed.settings, ...(data.settings || {}) },
    scratch: data.scratch && typeof data.scratch === 'object' ? data.scratch : {},
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : seed.updatedAt,
    version: DATA_VERSION,
  };
  // Team members from the seed that are new since the data was saved are added, never overwritten.
  const haveIds = new Set(merged.team.map((t) => t.id));
  for (const t of seed.team) if (!haveIds.has(t.id)) merged.team.push(t);
  // The first real project (Fluence) is added once to data saved before it existed. A tombstone counts as present,
  // so deleting it stays deleted.
  if (!merged.projects.some((p) => p.id === FLUENCE_ID)) {
    merged.projects.unshift(fluenceProject());
    const noteIds = new Set(merged.notes.map((n) => n.id));
    for (const n of fluenceNotes()) if (!noteIds.has(n.id)) merged.notes.push(n);
  }
  return purgeTombstones(merged);
}

/** Shape check for imported / pulled files: enough to refuse a random JSON without being fussy. */
export function validateAppData(x: unknown): string | null {
  if (!x || typeof x !== 'object') return 'Not a tracker file (not a JSON object).';
  const d = x as Record<string, unknown>;
  if (!Array.isArray(d.projects)) return 'Not a tracker export (no projects array).';
  for (const key of ['notes', 'permits', 'timeEntries', 'team'] as const) {
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

export function setState(next: AppData, opts: { touch?: boolean } = {}) {
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

export function importJson(text: string, mode: 'replace' | 'merge'): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(text) as unknown;
    const err = validateAppData(parsed);
    if (err) return { ok: false, error: err };
    const incoming = migrate(parsed);
    if (mode === 'replace') snapshot('before-import-replace');
    setState(mode === 'replace' ? incoming : mergeData(state, incoming), { touch: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
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
      timeEntries: bury(d.timeEntries, (t) => !!t.projectId && sampleIds.has(t.projectId)),
    };
  });
}

export function hasSampleData(d: AppData): boolean {
  return d.projects.some((p) => p.sample && !p.deletedAt);
}
