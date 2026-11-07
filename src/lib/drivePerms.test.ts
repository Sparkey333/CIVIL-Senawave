import { afterEach, describe, expect, it, vi } from 'vitest';
import { inviteText, listPermissions, matchesRole, permissionFor, removePermission, shareFile, updatePermissionRole } from './drivePerms';

function mockFetch(body: unknown = {}, status = 200) {
  const fn = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal('fetch', fn);
  return fn;
}
const call = (fn: ReturnType<typeof mockFetch>) => {
  const [url, init] = fn.mock.calls[0] as unknown as [string, RequestInit];
  return { url: new URL(url), init, body: init.body ? JSON.parse(init.body as string) : null };
};

afterEach(() => vi.unstubAllGlobals());

describe('Drive permissions', () => {
  it('shares with an editor as writer and sends the notification flag and message', async () => {
    const fn = mockFetch({ id: 'p1', role: 'writer', emailAddress: 'jessem@senawave.com' });
    const p = await shareFile('tok', 'FILE1', ' JesseM@Senawave.com ', 'editor', { notify: true, message: 'hello' });
    const { url, init, body } = call(fn);
    expect(url.pathname).toBe('/drive/v3/files/FILE1/permissions');
    expect(url.searchParams.get('sendNotificationEmail')).toBe('true');
    expect(url.searchParams.get('emailMessage')).toBe('hello');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(body).toEqual({ type: 'user', role: 'writer', emailAddress: 'jessem@senawave.com' });
    expect(p.id).toBe('p1');
  });

  it('shares a viewer as reader and leaves the message off when not notifying', async () => {
    const fn = mockFetch({ id: 'p2' });
    await shareFile('tok', 'F', 'v@x.com', 'viewer', { notify: false, message: 'ignored' });
    const { url, body } = call(fn);
    expect(body.role).toBe('reader');
    expect(url.searchParams.get('sendNotificationEmail')).toBe('false');
    expect(url.searchParams.has('emailMessage')).toBe(false);
  });

  it('lists, changes and removes permissions with the right verbs', async () => {
    let fn = mockFetch({ permissions: [{ id: 'a', type: 'user', role: 'owner', emailAddress: 'me@x.com' }] });
    expect(await listPermissions('t', 'F')).toHaveLength(1);
    expect(call(fn).url.searchParams.get('fields')).toContain('emailAddress');
    fn = mockFetch({});
    await updatePermissionRole('t', 'F', 'p9', 'viewer');
    expect(call(fn).init.method).toBe('PATCH');
    expect(call(fn).body).toEqual({ role: 'reader' });
    fn = mockFetch({});
    await removePermission('t', 'F', 'p9');
    expect(call(fn).init.method).toBe('DELETE');
    expect(call(fn).url.pathname).toBe('/drive/v3/files/F/permissions/p9');
  });

  it('turns a refusal into a readable error', async () => {
    mockFetch({ error: 'nope' }, 403);
    await expect(shareFile('t', 'F', 'a@b.com', 'editor', { notify: false })).rejects.toThrow(/403/);
  });

  it('finds a person\'s permission by email and checks it matches the role', () => {
    const perms = [{ id: '1', type: 'user', role: 'writer', emailAddress: 'Jessem@senawave.com' }, { id: '2', type: 'user', role: 'reader', emailAddress: 'v@x.com' }];
    expect(permissionFor(perms, 'jessem@senawave.com')?.id).toBe('1');
    expect(permissionFor(perms, 'nobody@x.com')).toBeUndefined();
    expect(matchesRole(perms[0], 'editor')).toBe(true);
    expect(matchesRole(perms[0], 'viewer')).toBe(false);
    expect(matchesRole(perms[1], 'viewer')).toBe(true);
    expect(matchesRole({ id: '3', type: 'user', role: 'owner' }, 'admin')).toBe(true);
  });

  it('writes an invite with the join link and the file link', () => {
    const t = inviteText({ appUrl: 'https://x.test', fileUrl: 'https://drive.google.com/file/d/F/view', fromName: 'Brandon', role: 'editor', joinUrl: 'https://x.test/?join=F' });
    expect(t).toContain('https://x.test/?join=F');
    expect(t).toContain('https://drive.google.com/file/d/F/view');
    expect(t).toContain('an editor');
  });
});
