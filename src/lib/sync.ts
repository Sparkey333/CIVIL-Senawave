import { createSyncFile, ensureFolder, findSyncFile, getFileMeta, readSyncFile, writeSyncFile, type DriveFileRef } from './drive';
import { SCOPES } from './google';
import { stripForSync } from './merge';
import { applyRemote, getState, updateSettings } from '@/store/store';

export interface SyncResult {
  file: DriveFileRef;
  pulled: boolean;
  pushed: boolean;
  /** How many times the file changed under us and had to be re-merged before the push. */
  retries: number;
}

let lastSyncedAt: string | null = null;
export function getLastSyncedAt(): string | null {
  return lastSyncedAt;
}

function scopeFor(): string {
  return getState().settings.driveScope === 'drive' ? SCOPES.driveFull : SCOPES.driveFile;
}

/**
 * Two-way sync: pull the Drive copy, merge it entity-by-entity (newest wins), then push the merged
 * result. Before the push the file's modifiedTime is checked again; if someone else wrote in between,
 * their copy is pulled and merged first, so a concurrent edit is never overwritten blind.
 * Creates the folder and file on first use when no shared file id is configured.
 */
export async function syncWithDrive(getToken: (scope: string) => Promise<string>): Promise<SyncResult> {
  const settings = getState().settings;
  const token = await getToken(scopeFor());

  let file: DriveFileRef | null = null;
  if (settings.driveFileId) {
    file = await getFileMeta(token, settings.driveFileId);
  } else {
    const folder = await ensureFolder(token, settings.driveFolderName || 'Senawave Tracker');
    file = await findSyncFile(token, folder.id);
    if (!file) {
      file = await createSyncFile(token, folder.id, stripForSync(getState()));
      updateSettings({ driveFileId: file.id });
      lastSyncedAt = new Date().toISOString();
      return { file, pulled: false, pushed: true, retries: 0 };
    }
    updateSettings({ driveFileId: file.id });
  }

  let retries = 0;
  let seen = file.modifiedTime;
  for (;;) {
    const remote = await readSyncFile(token, file.id);
    applyRemote(remote);
    const latest = await getFileMeta(token, file.id);
    if (latest.modifiedTime === seen || retries >= 3) {
      const updated = await writeSyncFile(token, file.id, stripForSync(getState()));
      lastSyncedAt = new Date().toISOString();
      return { file: updated, pulled: true, pushed: true, retries };
    }
    // Someone wrote between our read and now: merge their copy too before pushing.
    seen = latest.modifiedTime;
    retries += 1;
  }
}

export async function pushToDrive(getToken: (scope: string) => Promise<string>): Promise<DriveFileRef> {
  const settings = getState().settings;
  if (!settings.driveFileId) return (await syncWithDrive(getToken)).file;
  const token = await getToken(scopeFor());
  const ref = await writeSyncFile(token, settings.driveFileId, stripForSync(getState()));
  lastSyncedAt = new Date().toISOString();
  return ref;
}
