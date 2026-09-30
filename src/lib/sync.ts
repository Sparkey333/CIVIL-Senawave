import { createSyncFile, ensureFolder, findSyncFile, getFileMeta, readSyncFile, writeSyncFile, type DriveFileRef } from './drive';
import { SCOPES } from './google';
import { applyRemote, getState, updateSettings } from '@/store/store';

export interface SyncResult {
  file: DriveFileRef;
  pulled: boolean;
  pushed: boolean;
}

/**
 * Two-way sync: pull the Drive copy, merge it entity-by-entity (newest wins), then push the merged result.
 * Creates the folder and file on first use when no shared file id is configured.
 */
export async function syncWithDrive(getToken: (scope: string) => Promise<string>): Promise<SyncResult> {
  const settings = getState().settings;
  const scope = settings.driveScope === 'drive' ? SCOPES.driveFull : SCOPES.driveFile;
  const token = await getToken(scope);

  let file: DriveFileRef | null = null;
  if (settings.driveFileId) {
    file = await getFileMeta(token, settings.driveFileId);
  } else {
    const folder = await ensureFolder(token, settings.driveFolderName || 'Senawave Tracker');
    file = await findSyncFile(token, folder.id);
    if (!file) {
      file = await createSyncFile(token, folder.id, getState());
      updateSettings({ driveFileId: file.id });
      return { file, pulled: false, pushed: true };
    }
    updateSettings({ driveFileId: file.id });
  }

  const remote = await readSyncFile(token, file.id);
  applyRemote(remote);
  const updated = await writeSyncFile(token, file.id, getState());
  return { file: updated, pulled: true, pushed: true };
}

export async function pushToDrive(getToken: (scope: string) => Promise<string>): Promise<DriveFileRef> {
  const settings = getState().settings;
  const scope = settings.driveScope === 'drive' ? SCOPES.driveFull : SCOPES.driveFile;
  const token = await getToken(scope);
  if (!settings.driveFileId) return (await syncWithDrive(getToken)).file;
  return writeSyncFile(token, settings.driveFileId, getState());
}
