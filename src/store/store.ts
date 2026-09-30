import { useSyncExternalStore } from 'react';
import type { AppData, Note, Permit, Project, Settings, Sheet, TeamMember, TimeEntry } from '@/lib/types';
import { DATA_VERSION } from '@/lib/types';
import { nowIso, uid } from '@/lib/ids';
import { mergeData } from '@/lib/merge';
import { seedData } from './seed';

const STORAGE_KEY = 'senawave-tracker:v1';

type Listener = () => void;

let state: AppData = load();
const listeners = new Set<Listener>();

function load(): AppData {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw) as AppData;
      return migrate(parsed);
    }
  } catch (err) {
    console.warn('Could not read saved data, starting from seed', err);
  }
  return seedData();
}

function migrate(data: AppData): AppData {
  const seed = seedData();
  const merged: AppData = {
    ...seed,
    ...data,
    settings: { ...seed.settings, ...(data.settings || {}) },
    scratch: data.scratch || {},
    version: DATA_VERSION,
  };
  // Team members from the seed that are new since the data was saved are added, never overwritten.
  const haveIds = new Set(merged.team.map((t) => t.id));
  for (const t of seed.team) if (!haveIds.has(t.id)) merged.team.push(t);
  return merged;
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Could not persist data', err);
  }
}

function emit() {
  for (const l of listeners) l();
}

export function getState(): AppData {
  return state;
}

export function setState(next: AppData, opts: { touch?: boolean } = {}) {
  state = opts.touch === false ? next : { ...next, updatedAt: nowIso() };
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
  return useSyncExternalStore(subscribe, getState, getState);
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
    ...partial,
  };
}

export function addProject(p: Project) {
  update((d) => ({ ...d, projects: [p, ...d.projects] }));
}

export function updateProject(id: string, patch: Partial<Project> | ((p: Project) => Partial<Project>)) {
  update((d) => ({
    ...d,
    projects: d.projects.map((p) => {
      if (p.id !== id) return p;
      const delta = typeof patch === 'function' ? patch(p) : patch;
      return { ...p, ...delta, updatedAt: nowIso() };
    }),
  }));
}

export function deleteProject(id: string) {
  update((d) => ({
    ...d,
    projects: d.projects.filter((p) => p.id !== id),
    notes: d.notes.map((n) => (n.projectId === id ? { ...n, projectId: null, updatedAt: nowIso() } : n)),
    permits: d.permits.filter((x) => x.projectId !== id),
    timeEntries: d.timeEntries.map((t) => (t.projectId === id ? { ...t, projectId: null, updatedAt: nowIso() } : t)),
  }));
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
    ...partial,
  };
}

export function addNote(n: Note) {
  update((d) => ({ ...d, notes: [n, ...d.notes] }));
}

export function updateNote(id: string, patch: Partial<Note>) {
  update((d) => ({ ...d, notes: d.notes.map((n) => (n.id === id ? { ...n, ...patch, updatedAt: nowIso() } : n)) }));
}

export function deleteNote(id: string) {
  update((d) => ({ ...d, notes: d.notes.filter((n) => n.id !== id) }));
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
    ...partial,
  };
}

export function addPermit(p: Permit) {
  update((d) => ({ ...d, permits: [...d.permits, p] }));
}

export function updatePermit(id: string, patch: Partial<Permit>) {
  update((d) => ({ ...d, permits: d.permits.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: nowIso() } : p)) }));
}

export function deletePermit(id: string) {
  update((d) => ({ ...d, permits: d.permits.filter((p) => p.id !== id) }));
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
    ...partial,
  };
}

export function addTimeEntry(t: TimeEntry) {
  update((d) => ({ ...d, timeEntries: [t, ...d.timeEntries] }));
}

export function updateTimeEntry(id: string, patch: Partial<TimeEntry>) {
  update((d) => ({ ...d, timeEntries: d.timeEntries.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t)) }));
}

export function deleteTimeEntry(id: string) {
  update((d) => ({ ...d, timeEntries: d.timeEntries.filter((t) => t.id !== id) }));
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
    ...partial,
  };
}

export function addTeamMember(t: TeamMember) {
  update((d) => ({ ...d, team: [...d.team, t] }));
}

export function updateTeamMember(id: string, patch: Partial<TeamMember>) {
  update((d) => ({ ...d, team: d.team.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: nowIso() } : t)) }));
}

export function deleteTeamMember(id: string) {
  update((d) => ({ ...d, team: d.team.filter((t) => t.id !== id) }));
}

// ---------- settings / scratch ----------

export function updateSettings(patch: Partial<Settings>) {
  update((d) => ({ ...d, settings: { ...d.settings, ...patch } }));
}

export function setScratch(key: string, body: string) {
  update((d) => ({ ...d, scratch: { ...d.scratch, [key]: { body, updatedAt: nowIso() } } }));
}

// ---------- import / export / reset ----------

export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string, mode: 'replace' | 'merge'): { ok: boolean; error?: string } {
  try {
    const parsed = JSON.parse(text) as AppData;
    if (!parsed || !Array.isArray(parsed.projects)) return { ok: false, error: 'Not a tracker export (no projects array).' };
    const incoming = migrate(parsed);
    setState(mode === 'replace' ? incoming : mergeData(state, incoming), { touch: false });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

export function applyRemote(remote: AppData) {
  setState(mergeData(state, migrate(remote)), { touch: false });
}

export function resetToSeed(keepSettings: boolean) {
  const seed = seedData();
  setState(keepSettings ? { ...seed, settings: state.settings } : seed);
}

export function removeSampleData() {
  update((d) => {
    const sampleIds = new Set(d.projects.filter((p) => p.sample).map((p) => p.id));
    return {
      ...d,
      projects: d.projects.filter((p) => !p.sample),
      notes: d.notes.filter((n) => !(n.projectId && sampleIds.has(n.projectId)) && !n.tags.includes('sample')),
      permits: d.permits.filter((p) => !sampleIds.has(p.projectId)),
      timeEntries: d.timeEntries.filter((t) => !(t.projectId && sampleIds.has(t.projectId))),
    };
  });
}

export function hasSampleData(d: AppData): boolean {
  return d.projects.some((p) => p.sample);
}
