import { useRef, useState } from 'react';
import { exportJson, hasSampleData, importJson, listBackups, removeSampleData, resetToSeed, restoreBackup, updateSettings, useAppData } from '@/store/store';
import { useAuth } from '@/lib/auth';
import { parseDriveId } from '@/lib/drive';
import { syncWithDrive } from '@/lib/sync';
import { clientIdFromBuild, getGoogleClientId, isValidClientId } from '@/lib/google';
import { copyText, downloadText } from '@/lib/download';
import { roleLabel } from '@/lib/roles';
import { PeopleCard } from '@/components/PeopleCard';
import { Badge, Callout, Card, ConfirmButton, Field } from '@/components/ui';
import { toast } from '@/components/Toast';
import { fmtDateTime } from '@/lib/ids';

export default function Settings() {
  const data = useAppData();
  const s = data.settings;
  const { user, signInWithGoogle, signOut, getToken, googleConfigured, busy, role, isAdmin, canEdit, saveClientId, finishJoin } = useAuth();
  const [clientIdDraft, setClientIdDraft] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [driveInput, setDriveInput] = useState(s.driveFileId);
  const [syncing, setSyncing] = useState(false);
  const [backups, setBackups] = useState(() => listBackups());
  const refreshBackups = () => setBackups(listBackups());

  const download = () => {
    const ok = downloadText(`senawave-tracker-${new Date().toISOString().slice(0, 10)}.json`, exportJson());
    toast(ok ? 'Backup file saved.' : 'This view blocks downloads. Use "Copy to clipboard" instead.', ok ? 'ok' : 'bad');
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const mode = isAdmin ? importMode : 'merge';
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
            <div className="row between"><span>Signed in as</span><span>{user?.name} {user?.mode === 'google' ? <Badge kind="ok">{user.email}</Badge> : <Badge kind="warn">offline mode</Badge>}</span></div>
            <div className="row between"><span>Your access</span><Badge kind={role === 'viewer' ? 'info' : 'ok'}>{roleLabel(role, user?.mode)}</Badge></div>
            <div className="row between"><span>Google client id</span>{googleConfigured ? <Badge kind="ok" mono>{getGoogleClientId().slice(0, 14)}…{clientIdFromBuild ? ' (from build)' : ''}</Badge> : <Badge kind="warn">not set up</Badge>}</div>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            {user?.mode !== 'google' && googleConfigured && <button className="btn primary sm" onClick={() => void signInWithGoogle()} disabled={busy}>Sign in with Google</button>}
            <button className="btn sm" onClick={signOut}>Sign out</button>
          </div>
          {!clientIdFromBuild && isAdmin && (
            <div style={{ marginTop: 12 }}>
              <Field label={googleConfigured ? 'Replace the Google client id' : 'Google client id'} hint={`From Google Cloud Console → Credentials → OAuth client ID (Web). Add ${typeof window !== 'undefined' ? window.location.origin : 'this site'} under Authorized JavaScript origins. Saved on this device only.`}>
                <div className="row">
                  <input value={clientIdDraft} onChange={(e) => setClientIdDraft(e.target.value)} placeholder="1234567890-abc….apps.googleusercontent.com" />
                  <button className="btn sm primary" disabled={!isValidClientId(clientIdDraft)} onClick={() => { saveClientId(clientIdDraft); setClientIdDraft(''); toast('Client id saved. Sign in with Google to continue.'); }}>Save</button>
                </div>
              </Field>
            </div>
          )}
          {!googleConfigured && (
            <Callout kind="info">
              <p><strong>To turn on the online mode:</strong> create an OAuth client in Google Cloud Console (Drive API on, consent screen with you and jessem@senawave.com as test users), paste its client id above, then sign in. The sign-in page lists each step. Offline mode keeps working without any of this.</p>
            </Callout>
          )}
        </Card>

        <Card title="Connections" subtitle="Each switch adds one read-only Google permission the next time you sign in. Nothing is written to Drive or Gmail by these.">
          <div className="form-grid">
            <Field label="Senawave Design folder (read-only Drive)" hint="Lets the Files page list the shared folder Jesse owns (Templates + Projects) and spot changes.">
              <select value={s.driveFilesEnabled ? 'on' : 'off'} onChange={(e) => updateSettings({ driveFilesEnabled: e.target.value === 'on' })}>
                <option value="off">Off</option>
                <option value="on">On — drive.readonly</option>
              </select>
            </Field>
            <Field label="Gmail (read-only, @senawave.com only)" hint="The Senawave inbox page lists threads from the domain so you can file them as notes and actions.">
              <select value={s.gmailEnabled ? 'on' : 'off'} onChange={(e) => updateSettings({ gmailEnabled: e.target.value === 'on' })}>
                <option value="off">Off</option>
                <option value="on">On — gmail.readonly</option>
              </select>
            </Field>
            <Field label="Design folder link" className="span-all">
              <input value={s.designFolderUrl} onChange={(e) => updateSettings({ designFolderUrl: e.target.value })} placeholder="https://drive.google.com/drive/folders/…" />
            </Field>
            <Field label="Evening log starts at (hour, 0–23)" hint="The Daily page opens on the evening log from this hour.">
              <input type="number" min={0} max={23} value={s.eveningHour ?? 16} onChange={(e) => updateSettings({ eveningHour: Math.max(0, Math.min(23, Number(e.target.value) || 0)) })} />
            </Field>
          </div>
          {user?.mode === 'google' && (s.driveFilesEnabled || s.gmailEnabled) && (
            <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Changed a switch? Sign out and back in once so Google asks for the new permission.</p>
          )}
        </Card>

        <PeopleCard />

        <Card title="You and this device" subtitle="The owner is the admin. Rate and theme stay on this device.">
          <div className="form-grid">
            <Field label="Owner name"><input value={s.ownerName} disabled={!isAdmin} onChange={(e) => updateSettings({ ownerName: e.target.value })} /></Field>
            <Field label="Owner Google email" hint="The owner is always an admin and owns the Drive file."><input type="email" value={s.ownerEmail} disabled={!isAdmin} onChange={(e) => updateSettings({ ownerEmail: e.target.value })} /></Field>
            <Field label="Your hourly rate ($/h)" hint="Totals the time log. Stays on this device: it is never written to the Drive file.">
              <input type="number" min={0} step={1} value={s.hourlyRate ?? ''} onChange={(e) => updateSettings({ hourlyRate: e.target.value === '' ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Theme">
              <select value={s.theme} onChange={(e) => updateSettings({ theme: e.target.value as typeof s.theme })}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </Field>
          </div>
        </Card>
      </div>

      <div>
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
            <Field label="Time log in the Drive file" hint="Off = your hours and invoices stay on this device and are left out of the shared file. Turn off before sharing the file with Senawave.">
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
            {user?.mode !== 'google' && <span className="muted" style={{ fontSize: 12.5 }}>Sign in with Google to sync.</span>}
            {s.driveFileId && <a className="btn sm ghost" href={`https://drive.google.com/file/d/${s.driveFileId}/view`} target="_blank" rel="noopener noreferrer">Open file in Drive ↗</a>}
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Data last changed {fmtDateTime(data.updatedAt)}. Rate, theme, auto-sync and this device's sync settings never leave this browser; deletes travel as hidden markers so the other copy drops them too.</p>
        </Card>

        <Card title="Archive and update (works offline)" subtitle="Four ways to keep a copy and to bring changes in. None of them need Google or a network.">
          <ol className="plain-list" style={{ marginBottom: 12 }}>
            <li><strong>Archive everything:</strong> save one backup file of all projects, notes, prints, redlines and settings (your rate included).</li>
            <li><strong>Archive one project:</strong> on a project's Overview, save just that project as a file to keep or send. It never includes your rate or the people list.</li>
            <li><strong>Update:</strong> import a file. Merge keeps both sides and the newest edit wins on each row. Replace swaps everything (admin only, and the old data is backed up first).</li>
            <li><strong>Local backups:</strong> the app keeps the three newest copies in this browser and writes one before every risky step.</li>
          </ol>
          <div className="row">
            <button className="btn sm" onClick={download}>Save backup file</button>
            <button className="btn sm" onClick={() => void copyText(exportJson()).then((ok) => toast(ok ? 'Backup copied to the clipboard.' : 'Clipboard blocked.', ok ? 'ok' : 'bad'))}>Copy to clipboard</button>
          </div>
          <hr />
          <div className="row">
            <select value={isAdmin ? importMode : 'merge'} disabled={!isAdmin} onChange={(e) => setImportMode(e.target.value as typeof importMode)} style={{ width: 'auto' }} aria-label="Import mode">
              <option value="merge">Import: merge (newest wins)</option>
              <option value="replace">Import: replace everything</option>
            </select>
            <input ref={fileRef} type="file" accept="application/json,.json" style={{ width: 'auto' }} disabled={!canEdit} onChange={(e) => void onImport(e.target.files?.[0])} aria-label="Import a backup or project archive file" />
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>A project archive file is always merged, whatever the mode says.</p>
          <hr />
          <div className="row">
            {hasSampleData(data) ? (
              <ConfirmButton label="Delete the sample project & its notes" confirmLabel="Delete sample data" className="btn sm" onConfirm={() => { removeSampleData(); toast('Sample data removed.'); }} />
            ) : (
              <Badge kind="ok">no sample data</Badge>
            )}
            {isAdmin && <ConfirmButton label="Reset everything to defaults" confirmLabel="Yes, wipe and reseed" onConfirm={() => { resetToSeed(true); toast('Reset to seed data (settings kept).'); }} />}
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Data is stored in this browser (localStorage) and, when synced, in your Drive file. Save a backup file before clearing browser data.</p>
        </Card>

        <Card title="Local backups" subtitle="A copy is kept once a day and before any import-replace, reset or restore. The three newest are kept in this browser." actions={<button className="btn sm ghost" onClick={refreshBackups}>Refresh</button>}>
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
                      <td><ConfirmButton label="Restore" confirmLabel="Replace current data" className="btn sm" onConfirm={() => { const r = restoreBackup(b.key); toast(r.ok ? 'Backup restored (the data you replaced was backed up first).' : `Restore failed: ${r.error}`, r.ok ? 'ok' : 'bad'); refreshBackups(); }} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
