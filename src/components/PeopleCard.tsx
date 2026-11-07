import { useState } from 'react';
import { updateSettings, useAppData } from '@/store/store';
import { useAuth } from '@/lib/auth';
import { SCOPES } from '@/lib/google';
import { PERMANENT_ADMINS, emailKey, normalizeMembers } from '@/lib/roles';
import { Link } from 'react-router-dom';
import { inviteText, listPermissions, matchesRole, permissionFor, removePermission, shareFile, updatePermissionRole, type DrivePermission } from '@/lib/drivePerms';
import { copyText } from '@/lib/download';
import { ROLES, type Member, type Role } from '@/lib/types';
import { Badge, Callout, Card, ConfirmButton, Field } from '@/components/ui';
import { toast } from '@/components/Toast';

const ROLE_KIND: Record<Role, '' | 'ok' | 'info' | 'accent'> = { admin: 'accent', editor: 'ok', viewer: 'info' };

/** Who can use this tracker and what they may do. Admins manage it; everyone else sees the list. */
export function PeopleCard() {
  const { user } = useAuth();
  return user?.mode === 'claude' ? <SharedPeopleCard /> : <GooglePeopleCard />;
}

/** claude.ai mode: claude.ai's Share menu decides who gets in; this explains how its levels map to the app. */
function SharedPeopleCard() {
  const { role, claude } = useAuth();
  return (
    <Card title="People and access" subtitle="In the shared tracker, claude.ai's Share menu decides who can open it and who can change it.">
      <div className="row" style={{ marginBottom: 10 }}>
        <span>You are</span>
        <Badge kind={role ? ROLE_KIND[role] : 'warn'}>{role ?? 'no access'}</Badge>
        {claude?.isOwner && <Badge kind="accent">owner</Badge>}
      </div>
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>In claude.ai's Share menu</th><th>In the tracker</th></tr></thead>
          <tbody>
            <tr><td>Owner (the person who published it)</td><td><Badge kind="accent">admin</Badge></td></tr>
            <tr><td>{PERMANENT_ADMINS.join(', ')}</td><td><Badge kind="accent">admin</Badge> <span className="faint">always</span></td></tr>
            <tr><td>Editor (for people outside your organization: only while there is no public link)</td><td><Badge kind="ok">editor</Badge></td></tr>
            <tr><td>Viewer, Commenter, or anyone claude.ai will not let save</td><td><Badge kind="info">viewer</Badge></td></tr>
          </tbody>
        </table>
      </div>
      {claude?.isOwner && <p style={{ marginBottom: 0 }}><Link to="/connections">Connections → Share with Jesse</Link> has the steps and a message to send him.</p>}
    </Card>
  );
}

/** Google mode: the people list in the data file decides who can sign in, and the Drive file's sharing enforces it. */
function GooglePeopleCard() {
  const data = useAppData();
  const s = data.settings;
  const { user, isAdmin, role, getToken } = useAuth();
  const online = user?.mode === 'google';
  const fileId = s.driveFileId;
  const [perms, setPerms] = useState<DrivePermission[] | null>(null);
  const [busy, setBusy] = useState('');
  const [draft, setDraft] = useState<{ email: string; name: string; role: Role; share: boolean; notify: boolean }>({ email: '', name: '', role: 'editor', share: true, notify: true });
  const canDrive = isAdmin && online && !!fileId;
  const scope = s.driveScope === 'drive' ? SCOPES.driveFull : SCOPES.driveFile;
  const setMembers = (members: Member[]) => updateSettings({ members: normalizeMembers(members, s.ownerEmail) });

  const run = async (label: string, fn: (token: string) => Promise<void>) => {
    setBusy(label);
    try {
      await fn(await getToken(scope));
    } catch (err) {
      toast(`${label} failed: ${(err as Error).message}`, 'bad');
    } finally {
      setBusy('');
    }
  };
  const refresh = (token: string) => listPermissions(token, fileId).then(setPerms);

  const share = (m: Member, notify: boolean) =>
    run(`Sharing with ${m.email}`, async (token) => {
      const existing = perms ? permissionFor(perms, m.email) : undefined;
      if (existing) await updatePermissionRole(token, fileId, existing.id, m.role);
      else await shareFile(token, fileId, m.email, m.role, { notify, message: `${s.ownerName || 'Senawave'} shared the Senawave Civil Tracker data file with you.` });
      await refresh(token);
      toast(`Drive file shared with ${m.email} as ${m.role === 'viewer' ? 'viewer' : 'editor'}.`);
    });

  const unshare = (email: string) =>
    run(`Removing Drive access for ${email}`, async (token) => {
      const list = perms ?? (await listPermissions(token, fileId));
      const p = permissionFor(list, email);
      if (p && p.role !== 'owner') await removePermission(token, fileId, p.id);
      await refresh(token);
      toast(`${email} no longer has the Drive file.`);
    });

  const add = async () => {
    const email = emailKey(draft.email);
    if (!email.includes('@')) return toast('Enter a full email address.', 'bad');
    if (email === emailKey(s.ownerEmail) || s.members.some((m) => emailKey(m.email) === email)) return toast('That person is already on the list.', 'bad');
    const member: Member = { email, name: draft.name.trim(), role: draft.role, addedAt: new Date().toISOString() };
    setMembers([...s.members, member]);
    setDraft({ ...draft, email: '', name: '' });
    if (draft.share && canDrive) await share(member, draft.notify);
    else toast(`${email} added. ${canDrive ? 'Press "Share Drive file" on their row to give them the data file.' : 'They still need the Drive file shared once you have synced.'}`);
  };

  const inviteMessage = () => {
    const joinUrl = `${window.location.origin}${window.location.pathname}?join=${fileId}`;
    return inviteText({ appUrl: window.location.origin, fileUrl: `https://drive.google.com/file/d/${fileId}/view`, fromName: s.ownerName || 'Brandon', role: 'editor', joinUrl });
  };

  const rows: { member: Member | null; email: string; name: string; role: Role; permanent?: boolean }[] = [
    { member: null, email: s.ownerEmail, name: s.ownerName, role: 'admin' },
    ...PERMANENT_ADMINS.filter((e) => e !== emailKey(s.ownerEmail || '')).map((e) => ({ member: null, email: e, name: '', role: 'admin' as Role, permanent: true })),
    ...s.members.map((m) => ({ member: m, email: m.email, name: m.name, role: m.role })),
  ];

  return (
    <Card
      title="People and access"
      subtitle="Who can sign in with Google, and what they may do. Online only: offline mode on a device has no accounts."
      actions={fileId && isAdmin ? <button className="btn sm" onClick={() => void copyText(inviteMessage()).then((ok) => toast(ok ? 'Invite message copied. Paste it into an email.' : 'Clipboard blocked; use Share on the Drive file instead.', ok ? 'ok' : 'bad'))}>Copy invite message</button> : undefined}
    >
      <div className="row" style={{ marginBottom: 10 }}>
        <span>You are</span>
        {online ? <Badge kind={role ? ROLE_KIND[role] : 'warn'}>{role ?? 'no access'}</Badge> : <Badge kind="warn">offline admin of this device</Badge>}
        {online && !isAdmin && <span className="faint" style={{ fontSize: 12 }}>Only an admin can change this list.</span>}
      </div>

      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>Person</th><th>Role</th><th>Drive file</th><th /></tr></thead>
          <tbody>
            {rows.map(({ member, email, name, role: r, permanent }) => {
              const perm = perms ? permissionFor(perms, email) : undefined;
              return (
                <tr key={email}>
                  <td><div>{name || email}</div><div className="faint" style={{ fontSize: 12 }}>{name ? email : ''}{permanent ? ' · permanent admin' : !member ? ' · owner' : ''}</div></td>
                  <td>
                    {member && isAdmin ? (
                      <select value={r} style={{ minWidth: 104 }} onChange={(e) => setMembers(s.members.map((m) => (m.email === email ? { ...m, role: e.target.value as Role } : m)))} aria-label={`Role for ${email}`}>
                        {ROLES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
                      </select>
                    ) : <Badge kind={ROLE_KIND[r]}>{r}</Badge>}
                  </td>
                  <td>
                    {permanent ? (perm ? <Badge kind="ok">shared · {perm.role === 'writer' || perm.role === 'owner' ? 'can edit' : 'can view'}</Badge> : <span className="faint">—</span>) : !member ? <Badge kind="ok">owns the file</Badge> : perms === null ? <span className="faint">{canDrive ? 'not checked' : '—'}</span> : !perm ? <Badge kind="warn">not shared</Badge> : matchesRole(perm, r) ? <Badge kind="ok">shared · {perm.role === 'writer' ? 'can edit' : 'can view'}</Badge> : <Badge kind="warn">{perm.role} (role differs)</Badge>}
                  </td>
                  <td>
                    {member && isAdmin && (
                      <div className="row" style={{ gap: 6 }}>
                        {canDrive && <button className="btn sm" disabled={!!busy} onClick={() => void share(member, true)}>{perm ? 'Match Drive to role' : 'Share Drive file'}</button>}
                        <ConfirmButton
                          label="Remove"
                          confirmLabel="Remove and stop sharing"
                          className="btn sm danger"
                          onConfirm={() => {
                            setMembers(s.members.filter((m) => m.email !== email));
                            if (canDrive) void unshare(email);
                          }}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {canDrive && <div className="row" style={{ marginTop: 8 }}><button className="btn sm ghost" disabled={!!busy} onClick={() => void run('Checking Drive access', refresh)}>{perms ? 'Refresh Drive access' : 'Check who has the Drive file'}</button>{busy && <span className="muted">{busy}…</span>}</div>}
      {isAdmin && online && !fileId && <Callout kind="info">Press <strong>Sync now</strong> once (Google Drive sync card) to create the data file. Then you can share it with people from this list.</Callout>}
      {isAdmin && !online && <Callout kind="info">Sign in with Google to share the Drive file. Offline you can still send someone a project archive file (Settings → Archive and update).</Callout>}

      {isAdmin && (
        <>
          <hr />
          <h3 style={{ margin: '0 0 8px' }}>Add a person</h3>
          <div className="form-grid">
            <Field label="Google email"><input type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} placeholder="name@senawave.com" /></Field>
            <Field label="Name (optional)"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
            <Field label="Role" hint={ROLES.find((x) => x.id === draft.role)?.hint}>
              <select value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value as Role })}>{ROLES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</select>
            </Field>
          </div>
          {canDrive && (
            <div className="stack" style={{ marginTop: 8 }}>
              <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={draft.share} onChange={(e) => setDraft({ ...draft, share: e.target.checked })} style={{ width: 'auto' }} /> Also share the Drive data file with them now</label>
              {draft.share && <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={draft.notify} onChange={(e) => setDraft({ ...draft, notify: e.target.checked })} style={{ width: 'auto' }} /> Let Google email them the invite</label>}
            </div>
          )}
          <div className="row" style={{ marginTop: 10 }}><button className="btn primary" onClick={() => void add()} disabled={!draft.email.trim() || !!busy}>Add person</button></div>
        </>
      )}
      <p className="faint" style={{ fontSize: 12, marginBottom: 0, marginTop: 10 }}>
        The roles are enforced in this app. The Drive file's own sharing is what Google enforces: viewers get view-only access to the file, so they cannot change it even from another tool. Anyone with edit access to the file can change this list, so share edit access only with people you trust.
      </p>
    </Card>
  );
}
