import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { exportJson, hasSampleData, importJson, listBackups, removeSampleData, resetToSeed, restoreBackup, updateSettings, useAppData } from '@/store/store';
import { useAuth } from '@/lib/auth';
import { parseDriveId } from '@/lib/drive';
import { syncWithDrive } from '@/lib/sync';
import { copyText, saveFile, saveMessage } from '@/lib/download';
import { backupFileName, recordBackup } from '@/lib/backups';
import { isPermanentAdmin, roleLabel } from '@/lib/roles';
import { PeopleCard } from '@/components/PeopleCard';
import { Badge, Callout, Card, ConfirmButton, Field } from '@/components/ui';
import { toast } from '@/components/Toast';
import { fmtDateTime } from '@/lib/ids';

export default function Settings() {
  const data = useAppData();
  const s = data.settings;
  const { user, claude, signInWithGoogle, signOut, getToken, googleConfigured, busy, role, isAdmin, canEdit, finishJoin } = useAuth();
  const shared = user?.mode === 'claude';
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [driveInput, setDriveInput] = useState(s.driveFileId);
  const [syncing, setSyncing] = useState(false);
  const [backups, setBackups] = useState(() => listBackups());
  const refreshBackups = () => setBackups(listBackups());
  // In the shared tracker an import can only add and update rows: replacing or resetting would not reach the team's copy.
  const canReplace = isAdmin && !shared;

  const download = async () => {
    const name = backupFileName();
    const outcome = await saveFile(name, exportJson());
    if (outcome === 'saved') recordBackup({ where: 'file', name });
    const m = saveMessage(outcome, 'Backup file');
    toast(m.text, m.ok ? 'ok' : 'bad');
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const mode = canReplace ? importMode : 'merge';
    const r = importJson(await f.text(), mode);
    if (!r.ok) toast(`Import failed: ${r.error}`, 'bad');
    else if (r.archive) toast(`Project archive "${r.archive}" merged in: ${r.changes?.added ?? 0} new, ${r.changes?.updated ?? 0} updated.`);
    else if (r.changes) toast(`Merged: ${r.changes.added} new, ${r.changes.updated} updated. Newest edit wins on each row.`);
    else toast('Imported (everything replaced; the old data was backed up first).');
    refreshBackups();
    if (fileRef.current) fileRef.current.value = '';
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await syncWithDrive(getToken, { pullOnly: !canEdit });
      finishJoin();
      toast(!r.pushed ? 'Updated from Drive (view only).' : r.pulled ? 'Synced with Drive.' : 'Created the sync file in Drive.');
      setDriveInput(r.file.id);
    } catch (err) {
      toast(`Drive sync failed: ${(err as Error).message}`, 'bad');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="grid cols-2">
      <div>
        <Card title="Account">
          <div className="stack">
            <div className="row between">
              <span>Signed in as</span>
              <span>
                {user?.name}{' '}
                {shared ? <Badge kind="ok">claude.ai{claude?.isOwner ? ' · owner' : ''}</Badge> : user?.mode === 'google' ? <Badge kind="ok">{user.email}</Badge> : <Badge kind="warn">offline mode</Badge>}
              </span>
            </div>
            <div className="row between"><span>Your access</span><Badge kind={role === 'viewer' ? 'info' : 'ok'}>{roleLabel(role, user?.mode)}</Badge></div>
            {isPermanentAdmin(user?.email) && <div className="row between"><span>Admin</span><span className="muted" style={{ fontSize: 12.5 }}>permanent: cannot be removed from inside the app</span></div>}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            {shared ? (
              <Link className="btn sm" to="/connections">Connections</Link>
            ) : (
              <>
                {user?.mode !== 'google' && googleConfigured && <button className="btn primary sm" onClick={() => void signInWithGoogle()} disabled={busy}>Sign in with Google</button>}
                <button className="btn sm" onClick={signOut}>Sign out</button>
                <Link className="btn sm ghost" to="/connections">Connections</Link>
              </>
            )}
          </div>
          {shared && <p className="faint" style={{ fontSize: 12, marginBottom: 0 }}>claude.ai signs you in. Who can open and edit the tracker is set in claude.ai's Share menu; Google comes from your claude.ai connectors.</p>}
        </Card>

        <PeopleCard />

        <Card title="You and this device" subtitle="Rate, theme and the evening hour are yours: they never reach the team's copy.">
          <div className="form-grid">
            <Field label="Owner name"><input value={s.ownerName} disabled={!isAdmin} onChange={(e) => updateSettings({ ownerName: e.target.value })} /></Field>
            <Field label="Owner email" hint="Admin in the Google mode. brandonlbarkey@gmail.com stays an admin whatever this says.">
              <input type="email" value={s.ownerEmail} disabled={!isAdmin} onChange={(e) => updateSettings({ ownerEmail: e.target.value })} />
            </Field>
            <Field label="Your hourly rate ($/h)" hint={shared ? 'Private to you: kept in your own part of the shared tracker, which nobody else can read.' : 'Totals the time log. Stays on this device: never written to the Drive file.'}>
              <input type="number" min={0} step={1} value={s.hourlyRate ?? ''} onChange={(e) => updateSettings({ hourlyRate: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Theme">
              <select value={s.theme} onChange={(e) => updateSettings({ theme: e.target.value as typeof s.theme })}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </Field>
            <Field label="Evening log starts at (hour, 0–23)" hint="The Daily page opens on the evening log from this hour.">
              <input type="number" min={0} max={23} value={s.eveningHour ?? 16} onChange={(e) => updateSettings({ eveningHour: Math.max(0, Math.min(23, Number(e.target.value) || 0)) })} />
            </Field>
          </div>
        </Card>
      </div>

      <div>
        {!shared && (
          <Card title="Google Drive sync" subtitle="One JSON file in Drive holds everything. Sync pulls it, merges newest-wins per record, and pushes the result.">
            <div className="form-grid">
              <Field label="Folder name (auto-created in My Drive)"><input value={s.driveFolderName} onChange={(e) => updateSettings({ driveFolderName: e.target.value })} /></Field>
              <Field label="Drive scope" hint="drive.file = only files this app created (fine for solo use). drive = full Drive access, needed to open a file someone else shared with you.">
                <select value={s.driveScope} onChange={(e) => updateSettings({ driveScope: e.target.value as typeof s.driveScope })}>
                  <option value="drive.file">drive.file (recommended)</option>
                  <option value="drive">drive (shared team file)</option>
                </select>
              </Field>
              <Field label="Sync file id or share link" className="span-all" hint="Leave blank to auto-create. To work on a file someone shared with you, paste its link here with scope = drive (an invite link does this for you).">
                <div className="row">
                  <input value={driveInput} onChange={(e) => setDriveInput(e.target.value)} placeholder="https://drive.google.com/file/d/…/view" />
                  <button className="btn sm" onClick={() => { updateSettings({ driveFileId: parseDriveId(driveInput) }); toast('Sync file set.'); }}>Set</button>
                  <button className="btn sm ghost" onClick={() => { updateSettings({ driveFileId: '' }); setDriveInput(''); }}>Clear</button>
                </div>
              </Field>
              <Field label="Time log in the Drive file" hint="Off = your hours stay on this device and are left out of the shared file. Turn off before sharing the file with Senawave.">
                <select value={s.syncTimeEntries ? 'on' : 'off'} onChange={(e) => updateSettings({ syncTimeEntries: e.target.value === 'on' })}>
                  <option value="on">Included (my own devices)</option>
                  <option value="off">Kept private (shared team file)</option>
                </select>
              </Field>
              <Field label="Auto-sync">
                <select value={s.autoSync ? 'on' : 'off'} onChange={(e) => updateSettings({ autoSync: e.target.value === 'on' })}>
                  <option value="off">Manual (Sync button)</option>
                  <option value="on">Push 20 s after each edit</option>
                </select>
              </Field>
            </div>
            <div className="row" style={{ marginTop: 10 }}>
              <button className="btn primary sm" onClick={() => void sync()} disabled={syncing || user?.mode !== 'google'}>{syncing ? 'Syncing…' : canEdit ? 'Sync now' : 'Update from Drive'}</button>
              {user?.mode !== 'google' && <span className="muted" style={{ fontSize: 12.5 }}>{googleConfigured ? 'Sign in with Google to sync.' : 'Needs the one-time Google setup (Connections).'}</span>}
              {s.driveFileId && <a className="btn sm ghost" href={`https://drive.google.com/file/d/${s.driveFileId}/view`} target="_blank" rel="noopener noreferrer">Open file in Drive ↗</a>}
            </div>
            <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Data last changed {fmtDateTime(data.updatedAt)}. Rate, theme, auto-sync and this device's sync settings never leave this browser; deletes travel as hidden markers so the other copy drops them too.</p>
          </Card>
        )}

        <Card title="Archive and update (works offline)" subtitle="Keep a copy and bring changes in. None of this needs Google or a network.">
          <ol className="plain-list" style={{ marginBottom: 12 }}>
            <li><strong>Archive everything:</strong> one backup file of all projects, notes, prints, redlines and settings (your rate and time log included).</li>
            <li><strong>Archive one project:</strong> on a project's Overview, save just that project as a file to keep or send. It never includes your rate or the people list.</li>
            <li><strong>Update:</strong> import a file. Merge keeps both sides and the newest edit wins on each row.{canReplace ? ' Replace swaps everything (admin only; the old data is backed up first).' : ''}</li>
            <li><strong>Local backups:</strong> the three newest copies stay in this browser, plus one before every risky step.</li>
          </ol>
          <div className="row">
            <button className="btn sm" onClick={() => void download()}>Save backup file</button>
            <button className="btn sm" onClick={() => void copyText(exportJson()).then((ok) => toast(ok ? 'Backup copied to the clipboard.' : 'Clipboard blocked.', ok ? 'ok' : 'bad'))}>Copy to clipboard</button>
          </div>
          <hr />
          <div className="row">
            {canReplace && (
              <select value={importMode} onChange={(e) => setImportMode(e.target.value as typeof importMode)} style={{ width: 'auto' }} aria-label="Import mode">
                <option value="merge">Import: merge (newest wins)</option>
                <option value="replace">Import: replace everything</option>
              </select>
            )}
            <input ref={fileRef} type="file" accept="application/json,.json" style={{ width: 'auto' }} disabled={!canEdit} onChange={(e) => void onImport(e.target.files?.[0])} aria-label="Import a backup or project archive file" />
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>{shared ? 'In the shared tracker an import always merges; what it adds or updates is shared with the team.' : 'A project archive file is always merged, whatever the mode says.'}</p>
          <hr />
          <div className="row">
            {hasSampleData(data) ? (
              <ConfirmButton label="Delete the sample project & its notes" confirmLabel="Delete sample data" className="btn sm" onConfirm={() => { removeSampleData(); toast('Sample data removed.'); }} />
            ) : (
              <Badge kind="ok">no sample data</Badge>
            )}
            {canReplace && <ConfirmButton label="Reset everything to defaults" confirmLabel="Yes, wipe and reseed" onConfirm={() => { resetToSeed(true); toast('Reset to seed data (settings kept).'); }} />}
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>{shared ? 'This browser keeps a working copy of the shared tracker; the team copy lives on claude.ai.' : 'Data is stored in this browser (localStorage) and, when synced, in your Drive file. Save a backup file before clearing browser data.'}</p>
        </Card>

        <Card title="Local backups" subtitle="A copy is kept once a day and before any import-replace, reset or restore. The three newest stay in this browser." actions={<button className="btn sm ghost" onClick={refreshBackups}>Refresh</button>}>
          {backups.length === 0 ? (
            <p className="muted">No backups yet. One is written with the first change each day.</p>
          ) : (
            <div className="tbl-wrap">
              <table className="tbl compact">
                <thead><tr><th>Saved</th><th>Why</th><th className="num">Projects</th><th className="num">Notes</th><th /></tr></thead>
                <tbody>
                  {backups.map((b) => (
                    <tr key={b.key}>
                      <td className="nowrap">{fmtDateTime(b.savedAt)}</td>
                      <td><Badge>{b.reason}</Badge></td>
                      <td className="num">{b.projects}</td>
                      <td className="num">{b.notes}</td>
                      <td>{!shared && <ConfirmButton label="Restore" confirmLabel="Replace current data" className="btn sm" onConfirm={() => { const r = restoreBackup(b.key); toast(r.ok ? 'Backup restored (the data you replaced was backed up first).' : `Restore failed: ${r.error}`, r.ok ? 'ok' : 'bad'); refreshBackups(); }} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {shared && <Callout kind="info">These are snapshots of this browser's copy. In the shared tracker, roll something back by importing a saved backup file (merge), so the change reaches the team.</Callout>}
        </Card>
      </div>
    </div>
  );
}
