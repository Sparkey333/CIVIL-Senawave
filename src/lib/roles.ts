// Who may do what. Roles are checked in the app, and the real lock is the Google Drive file's own
// sharing: a viewer is given view-only access to the file, so Google refuses their writes.
// Offline mode has no accounts: the person at the keyboard is the admin of the data on this device.

import type { Member, Role, Settings } from './types';

export const emailKey = (e: string) => e.trim().toLowerCase();

export interface RoleUser {
  email: string;
  mode: 'google' | 'offline';
}

export function normalizeMembers(list: Member[], ownerEmail = ''): Member[] {
  const seen = new Set<string>([emailKey(ownerEmail)]);
  const out: Member[] = [];
  for (const m of list) {
    const email = emailKey(m.email || '');
    if (!email || !email.includes('@') || seen.has(email)) continue;
    seen.add(email);
    out.push({ email, name: (m.name || '').trim(), role: m.role === 'admin' || m.role === 'viewer' ? m.role : 'editor', addedAt: m.addedAt });
  }
  return out;
}

/** The role this user has, or null when a Google account is not allowed in. */
export function roleFor(settings: Settings, user: RoleUser | null): Role | null {
  if (!user) return null;
  if (user.mode === 'offline') return 'admin';
  const email = emailKey(user.email);
  const owner = emailKey(settings.ownerEmail || '');
  const members = settings.members || [];
  // A fresh install with nobody listed lets the first Google account in; that account then becomes the owner.
  if (!owner && members.length === 0) return 'admin';
  if (email === owner) return 'admin';
  return members.find((m) => emailKey(m.email) === email)?.role ?? null;
}

export const canWrite = (role: Role | null) => role === 'admin' || role === 'editor';

/** Drive permission that matches an app role. */
export function driveRoleFor(role: Role): 'writer' | 'reader' {
  return role === 'viewer' ? 'reader' : 'writer';
}

export function roleLabel(role: Role | null, mode: 'google' | 'offline' = 'google'): string {
  if (!role) return 'No access';
  if (mode === 'offline') return 'Offline (this device)';
  return role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Viewer';
}

/** Like roleFor, but a person who arrived by invite link and has not pulled the shared file yet is a viewer, not refused. */
export function roleWithInvite(settings: Settings, user: RoleUser | null, provisional: boolean): Role | null {
  const role = roleFor(settings, user);
  if (role === null && provisional && user?.mode === 'google') return 'viewer';
  return role;
}
