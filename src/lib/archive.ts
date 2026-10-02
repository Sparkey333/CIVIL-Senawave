// One project as a single file you can keep, email or hand over, and merge back in later.
// This is the offline way to archive a project and to bring someone else's edits in. It carries the
// project and its notes, permits, prints, redlines and, only if you choose, its time entries. It never
// carries settings, your rate or the people list.

import type { AppData, Note, Permit, PrintSet, Project, Redline, TimeEntry } from './types';
import { mergeById } from './merge';

export const ARCHIVE_KIND = 'senawave-project-archive';

export interface ProjectArchive {
  kind: typeof ARCHIVE_KIND;
  format: 1;
  exportedAt: string;
  exportedBy: string;
  includesTime: boolean;
  project: Project;
  notes: Note[];
  permits: Permit[];
  prints: PrintSet[];
  redlines: Redline[];
  timeEntries: TimeEntry[];
}

/** Built from the raw state so deletes (hidden rows) travel too and merge in correctly. */
export function buildProjectArchive(state: AppData, projectId: string, opts: { by: string; includeTime: boolean; now?: string }): ProjectArchive | null {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return null;
  return {
    kind: ARCHIVE_KIND,
    format: 1,
    exportedAt: opts.now || new Date().toISOString(),
    exportedBy: opts.by,
    includesTime: opts.includeTime,
    project,
    notes: state.notes.filter((n) => n.projectId === projectId),
    permits: state.permits.filter((p) => p.projectId === projectId),
    prints: (state.prints || []).filter((p) => p.projectId === projectId),
    redlines: (state.redlines || []).filter((r) => r.projectId === projectId),
    timeEntries: opts.includeTime ? state.timeEntries.filter((t) => t.projectId === projectId) : [],
  };
}

export function isProjectArchive(x: unknown): x is ProjectArchive {
  return !!x && typeof x === 'object' && (x as { kind?: unknown }).kind === ARCHIVE_KIND;
}

export function validateArchive(x: unknown): string | null {
  if (!isProjectArchive(x)) return 'Not a project archive file.';
  const a = x as Partial<ProjectArchive>;
  if (!a.project || typeof a.project !== 'object' || typeof a.project.id !== 'string') return 'The archive has no project.';
  for (const key of ['notes', 'permits', 'prints', 'redlines', 'timeEntries'] as const) {
    if (a[key] !== undefined && !Array.isArray(a[key])) return `Field "${key}" in the archive should be a list.`;
  }
  return null;
}

/** Merge an archive into the data: rows are matched by id and the newer one wins. Settings are never touched. */
export function mergeArchive(state: AppData, a: ProjectArchive): AppData {
  return {
    ...state,
    projects: mergeById(state.projects, [a.project]),
    notes: mergeById(state.notes, a.notes || []),
    permits: mergeById(state.permits, a.permits || []),
    prints: mergeById(state.prints || [], a.prints || []),
    redlines: mergeById(state.redlines || [], a.redlines || []),
    timeEntries: mergeById(state.timeEntries, a.timeEntries || []),
  };
}

export interface ChangeCounts {
  added: number;
  updated: number;
}

const KINDS = ['projects', 'notes', 'permits', 'prints', 'redlines', 'timeEntries', 'team'] as const;

/** How many rows a merge added and how many it changed, so the person knows what an import did. */
export function diffCounts(before: AppData, after: AppData): ChangeCounts {
  let added = 0;
  let updated = 0;
  for (const k of KINDS) {
    const prev = new Map(((before[k] as { id: string; updatedAt: string }[]) || []).map((r) => [r.id, r.updatedAt]));
    for (const r of (after[k] as { id: string; updatedAt: string }[]) || []) {
      if (!prev.has(r.id)) added += 1;
      else if (prev.get(r.id) !== r.updatedAt) updated += 1;
    }
  }
  return { added, updated };
}

export function archiveFileName(a: ProjectArchive): string {
  const slug = (a.project.number || a.project.name || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `senawave-archive-${slug}-${a.exportedAt.slice(0, 10)}.json`;
}
