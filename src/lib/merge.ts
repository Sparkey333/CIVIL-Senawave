import type { AppData } from './types';

interface Stamped {
  id: string;
  updatedAt: string;
}

/**
 * Entity-level last-write-wins merge. Used when pulling a Drive copy of the data
 * that may have been edited by someone else (or by you on another machine).
 * Rows present on only one side are kept; rows present on both keep the newer updatedAt.
 */
export function mergeById<T extends Stamped>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of local) byId.set(row.id, row);
  for (const row of remote) {
    const mine = byId.get(row.id);
    if (!mine || (row.updatedAt || '') > (mine.updatedAt || '')) byId.set(row.id, row);
  }
  return [...byId.values()];
}

export function mergeData(local: AppData, remote: AppData): AppData {
  const newerSettings = (remote.updatedAt || '') > (local.updatedAt || '') ? remote.settings : local.settings;
  const scratch: AppData['scratch'] = { ...local.scratch };
  for (const [k, v] of Object.entries(remote.scratch || {})) {
    const mine = scratch[k];
    if (!mine || v.updatedAt > mine.updatedAt) scratch[k] = v;
  }
  return {
    ...local,
    version: Math.max(local.version, remote.version || 0),
    projects: mergeById(local.projects, remote.projects || []),
    notes: mergeById(local.notes, remote.notes || []),
    permits: mergeById(local.permits, remote.permits || []),
    timeEntries: mergeById(local.timeEntries, remote.timeEntries || []),
    team: mergeById(local.team, remote.team || []),
    settings: { ...local.settings, ...newerSettings },
    scratch,
    updatedAt: (remote.updatedAt || '') > (local.updatedAt || '') ? remote.updatedAt : local.updatedAt,
  };
}
