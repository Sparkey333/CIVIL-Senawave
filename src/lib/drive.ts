// Google Drive JSON-file sync. The whole tracker is one file (senawave-tracker.json) inside a
// folder in the signed-in user's My Drive, or an explicit shared file id when the team shares one.
import type { AppData } from './types';

const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
export const SYNC_FILE_NAME = 'senawave-tracker.json';

export interface DriveFileRef {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
}

export async function driveFetch(token: string, url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  if (res.status === 401) throw new Error('Google session expired — sign in again.');
  if (res.status === 403) {
    const body = await res.text();
    throw new Error(`Drive refused the request (403). Check the Drive API is enabled and the scope covers this file. ${body.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`Drive error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

export async function findFolder(token: string, name: string): Promise<DriveFileRef | null> {
  const q = encodeURIComponent(`name = '${name.replace(/'/g, "\\'")}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const res = await driveFetch(token, `${API}/files?q=${q}&fields=files(id,name,modifiedTime,webViewLink)&spaces=drive`);
  const j = (await res.json()) as { files: DriveFileRef[] };
  return j.files[0] || null;
}

export async function ensureFolder(token: string, name: string): Promise<DriveFileRef> {
  const existing = await findFolder(token, name);
  if (existing) return existing;
  const res = await driveFetch(token, `${API}/files?fields=id,name,webViewLink`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder' }),
  });
  return (await res.json()) as DriveFileRef;
}

export async function findSyncFile(token: string, folderId: string): Promise<DriveFileRef | null> {
  const q = encodeURIComponent(`name = '${SYNC_FILE_NAME}' and '${folderId}' in parents and trashed = false`);
  const res = await driveFetch(token, `${API}/files?q=${q}&fields=files(id,name,modifiedTime,webViewLink)`);
  const j = (await res.json()) as { files: DriveFileRef[] };
  return j.files[0] || null;
}

export async function getFileMeta(token: string, fileId: string): Promise<DriveFileRef> {
  const res = await driveFetch(token, `${API}/files/${fileId}?fields=id,name,modifiedTime,webViewLink`);
  return (await res.json()) as DriveFileRef;
}

export async function createSyncFile(token: string, folderId: string, data: AppData): Promise<DriveFileRef> {
  const meta = { name: SYNC_FILE_NAME, parents: [folderId], mimeType: 'application/json' };
  const body = multipart(meta, JSON.stringify(data));
  const res = await driveFetch(token, `${UPLOAD}/files?uploadType=multipart&fields=id,name,modifiedTime,webViewLink`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary=${BOUNDARY}` },
    body,
  });
  return (await res.json()) as DriveFileRef;
}

export async function readSyncFile(token: string, fileId: string): Promise<AppData> {
  const res = await driveFetch(token, `${API}/files/${fileId}?alt=media`);
  return (await res.json()) as AppData;
}

export async function writeSyncFile(token: string, fileId: string, data: AppData): Promise<DriveFileRef> {
  const res = await driveFetch(token, `${UPLOAD}/files/${fileId}?uploadType=media&fields=id,name,modifiedTime,webViewLink`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return (await res.json()) as DriveFileRef;
}

const BOUNDARY = 'senawave_tracker_boundary';

function multipart(meta: object, content: string): string {
  return (
    `--${BOUNDARY}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n` +
    `--${BOUNDARY}\r\nContent-Type: application/json\r\n\r\n${content}\r\n--${BOUNDARY}--`
  );
}

/** Accepts a raw id or a Drive share link and returns the file id. */
export function parseDriveId(input: string): string {
  const s = input.trim();
  const m = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : s;
}
