// Share the tracker's Drive file with teammates, and see or remove who has access.
// This is what actually controls who can read and write the shared data.

import { driveFetch } from './drive';
import type { Role } from './types';
import { driveRoleFor, emailKey } from './roles';

const API = 'https://www.googleapis.com/drive/v3';

export interface DrivePermission {
  id: string;
  type: string;
  role: string; // owner | writer | commenter | reader
  emailAddress?: string;
  displayName?: string;
}

export async function listPermissions(token: string, fileId: string): Promise<DrivePermission[]> {
  const res = await driveFetch(token, `${API}/files/${encodeURIComponent(fileId)}/permissions?fields=permissions(id,type,role,emailAddress,displayName)&supportsAllDrives=true`);
  const j = (await res.json()) as { permissions?: DrivePermission[] };
  return j.permissions || [];
}

export async function shareFile(token: string, fileId: string, email: string, role: Role, opts: { notify: boolean; message?: string }): Promise<DrivePermission> {
  const qs = new URLSearchParams({ supportsAllDrives: 'true', sendNotificationEmail: String(opts.notify) });
  if (opts.notify && opts.message) qs.set('emailMessage', opts.message);
  const res = await driveFetch(token, `${API}/files/${encodeURIComponent(fileId)}/permissions?${qs.toString()}&fields=id,type,role,emailAddress,displayName`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'user', role: driveRoleFor(role), emailAddress: emailKey(email) }),
  });
  return (await res.json()) as DrivePermission;
}

export async function removePermission(token: string, fileId: string, permissionId: string): Promise<void> {
  await driveFetch(token, `${API}/files/${encodeURIComponent(fileId)}/permissions/${encodeURIComponent(permissionId)}?supportsAllDrives=true`, { method: 'DELETE' });
}

/** The permission for an email, if the file is shared with them. */
export function permissionFor(perms: DrivePermission[], email: string): DrivePermission | undefined {
  const key = emailKey(email);
  return perms.find((p) => emailKey(p.emailAddress || '') === key);
}

/** Does the Drive permission match what the app role should have? */
export function matchesRole(perm: DrivePermission, role: Role): boolean {
  if (perm.role === 'owner') return true;
  return perm.role === driveRoleFor(role) || (role === 'viewer' && perm.role === 'commenter');
}

export function inviteText(opts: { appUrl: string; fileUrl: string; fromName: string; role: Role; joinUrl: string }): string {
  return [
    `Hi,`,
    ``,
    `I shared the Senawave Civil Tracker with you as ${opts.role === 'admin' ? 'an admin' : opts.role === 'editor' ? 'an editor' : 'a viewer'}. It tracks plan sets, prints, redlines and QC, and keeps one data file in Google Drive.`,
    ``,
    `1. Open ${opts.joinUrl}`,
    `2. Press "Sign in with Google" and use your @senawave.com account.`,
    `3. Press the Sync button at the top right.`,
    ``,
    `The data file: ${opts.fileUrl}`,
    ``,
    `${opts.fromName}`,
  ].join('\n');
}

export async function updatePermissionRole(token: string, fileId: string, permissionId: string, role: Role): Promise<void> {
  await driveFetch(token, `${API}/files/${encodeURIComponent(fileId)}/permissions/${encodeURIComponent(permissionId)}?supportsAllDrives=true`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: driveRoleFor(role) }),
  });
}
