import { describe, expect, it } from 'vitest';
import { defaultSettings } from '@/store/seed';
import { canWrite, driveRoleFor, normalizeMembers, roleFor, roleLabel, roleWithInvite } from './roles';
import { isValidClientId } from './google';

const settings = () => ({ ...defaultSettings(), ownerEmail: 'Brandon@Example.com', members: [{ email: 'jessem@senawave.com', name: 'Jesse', role: 'editor' as const, addedAt: 'x' }, { email: 'view@x.com', name: '', role: 'viewer' as const, addedAt: 'x' }] });

describe('roleFor', () => {
  it('makes the owner an admin whatever the case of their email', () => {
    expect(roleFor(settings(), { email: 'brandon@example.com', mode: 'google' })).toBe('admin');
  });
  it('gives listed people their role and refuses everyone else', () => {
    expect(roleFor(settings(), { email: 'JesseM@senawave.com', mode: 'google' })).toBe('editor');
    expect(roleFor(settings(), { email: 'view@x.com', mode: 'google' })).toBe('viewer');
    expect(roleFor(settings(), { email: 'stranger@x.com', mode: 'google' })).toBeNull();
  });
  it('treats offline mode as the admin of this device, and nobody as nothing', () => {
    expect(roleFor(settings(), { email: 'offline@local', mode: 'offline' })).toBe('admin');
    expect(roleFor(settings(), null)).toBeNull();
  });
  it('lets the first Google account into a fresh install with nobody listed', () => {
    const fresh = { ...settings(), ownerEmail: '', members: [] };
    expect(roleFor(fresh, { email: 'anyone@x.com', mode: 'google' })).toBe('admin');
  });
});

describe('role helpers', () => {
  it('only viewers cannot write, and viewers get a read-only Drive permission', () => {
    expect(canWrite('admin')).toBe(true);
    expect(canWrite('editor')).toBe(true);
    expect(canWrite('viewer')).toBe(false);
    expect(canWrite(null)).toBe(false);
    expect(driveRoleFor('viewer')).toBe('reader');
    expect(driveRoleFor('editor')).toBe('writer');
    expect(driveRoleFor('admin')).toBe('writer');
  });
  it('cleans the member list: lower case, no duplicates, no owner, no junk, unknown roles become editor', () => {
    const out = normalizeMembers(
      [
        { email: ' Jesse@Senawave.com ', name: ' Jesse ', role: 'editor', addedAt: 'a' },
        { email: 'jesse@senawave.com', name: 'dup', role: 'viewer', addedAt: 'b' },
        { email: 'owner@x.com', name: 'owner', role: 'editor', addedAt: 'c' },
        { email: 'nope', name: '', role: 'editor', addedAt: 'd' },
        { email: 'x@y.com', name: '', role: 'boss' as never, addedAt: 'e' },
      ],
      'Owner@x.com',
    );
    expect(out.map((m) => [m.email, m.name, m.role])).toEqual([['jesse@senawave.com', 'Jesse', 'editor'], ['x@y.com', '', 'editor']]);
  });
  it('labels roles for the sidebar', () => {
    expect(roleLabel('editor')).toBe('Editor');
    expect(roleLabel('admin', 'offline')).toBe('Offline (this device)');
    expect(roleLabel(null)).toBe('No access');
  });
});

describe('client id check', () => {
  it('accepts a Google web client id and rejects look-alikes', () => {
    expect(isValidClientId('1234567890-abc123def.apps.googleusercontent.com')).toBe(true);
    expect(isValidClientId(' 1234567890-abc_123.apps.googleusercontent.com ')).toBe(true);
    expect(isValidClientId('abc.apps.googleusercontent.com')).toBe(false);
    expect(isValidClientId('1234567890-abc123def')).toBe(false);
    expect(isValidClientId('')).toBe(false);
  });
});

describe('invite arrivals', () => {
  it('makes an unlisted Google account a viewer only while the invite is unconfirmed', () => {
    const stranger = { email: 'david@senawave.com', mode: 'google' as const };
    expect(roleWithInvite(settings(), stranger, true)).toBe('viewer');
    expect(roleWithInvite(settings(), stranger, false)).toBeNull();
  });
  it('never downgrades someone who is on the list, and never lets offline or signed-out through', () => {
    expect(roleWithInvite(settings(), { email: 'jessem@senawave.com', mode: 'google' }, true)).toBe('editor');
    expect(roleWithInvite(settings(), null, true)).toBeNull();
  });
});
