import type { AppData, Settings } from './types';
import { PRIVATE_SETTING_KEYS } from './types';

interface Stamped {
  id: string;
  updatedAt: string;
  deletedAt?: string | null;
}

/**
 * Entity-level last-write-wins merge. Used when pulling a Drive copy of the data
 * that may have been edited by someone else (or by you on another machine).
 * Rows present on only one side are kept; rows present on both keep the newer updatedAt.
 * A delete is a tombstone (deletedAt set, updatedAt bumped), so it wins like any other edit
 * instead of being resurrected by the other side's copy.
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

/** Settings fields that stay on this device, taken from `local` whatever the remote says. */
export function pickPrivate(settings: Settings): Partial<Settings> {
  const out: Partial<Settings> = {};
  for (const k of PRIVATE_SETTING_KEYS) (out as Record<string, unknown>)[k] = settings[k];
  return out;
}

export function mergeData(local: AppData, remote: AppData): AppData {
  const remoteNewer = (remote.updatedAt || '') > (local.updatedAt || '');
  const newerSettings = remoteNewer ? remote.settings || {} : local.settings;
  const scratch: AppData['scratch'] = { ...local.scratch };
  for (const [k, v] of Object.entries(remote.scratch || {})) {
    const mine = scratch[k];
    if (!mine || v.updatedAt > mine.updatedAt) scratch[k] = v;
  }
  const shareTime = local.settings.syncTimeEntries !== false;
  return {
    ...local,
    version: Math.max(local.version, remote.version || 0),
    activity: capActivity(mergeById(local.activity || [], remote.activity || [])),
    projects: mergeById(local.projects, remote.projects || []),
    notes: mergeById(local.notes, remote.notes || []),
    permits: mergeById(local.permits, remote.permits || []),
    timeEntries: shareTime ? mergeById(local.timeEntries, remote.timeEntries || []) : local.timeEntries,
    team: mergeById(local.team, remote.team || []),
    settings: { ...local.settings, ...newerSettings, ...pickPrivate(local.settings) },
    scratch,
    updatedAt: remoteNewer ? remote.updatedAt : local.updatedAt,
  };
}

/**
 * The payload that leaves this device (Drive file). Private settings are dropped and, when the
 * time log is not shared, time entries are dropped too. Tombstones are kept so deletes propagate.
 */
export function stripForSync(data: AppData): AppData {
  const settings = { ...data.settings } as Partial<Settings>;
  for (const k of PRIVATE_SETTING_KEYS) delete settings[k];
  return {
    ...data,
    settings: settings as Settings,
    timeEntries: data.settings.syncTimeEntries === false ? [] : data.timeEntries,
  };
}

export const ACTIVITY_CAP = 600;

/** Newest `ACTIVITY_CAP` activity lines; the log is a diary, not an audit trail. */
export function capActivity<T extends { at: string }>(xs: T[]): T[] {
  return [...xs].sort((a, b) => b.at.localeCompare(a.at)).slice(0, ACTIVITY_CAP);
}

export const TOMBSTONE_TTL_DAYS = 90;

/** Drop tombstones older than the TTL; every live copy has had time to see the delete by then. */
export function purgeTombstones(data: AppData, now = Date.now(), ttlDays = TOMBSTONE_TTL_DAYS): AppData {
  const cutoff = new Date(now - ttlDays * 86400000).toISOString();
  const keep = <T extends Stamped>(xs: T[]) => xs.filter((x) => !x.deletedAt || x.deletedAt > cutoff);
  return {
    ...data,
    activity: keep(data.activity || []),
    projects: keep(data.projects),
    notes: keep(data.notes),
    permits: keep(data.permits),
    timeEntries: keep(data.timeEntries),
    team: keep(data.team),
  };
}
