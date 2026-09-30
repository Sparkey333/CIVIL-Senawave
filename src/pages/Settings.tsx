import { useRef, useState } from 'react';
import { exportJson, hasSampleData, importJson, removeSampleData, resetToSeed, updateSettings, useAppData } from '@/store/store';
import { useAuth } from '@/lib/auth';
import { parseDriveId } from '@/lib/drive';
import { syncWithDrive } from '@/lib/sync';
import { GOOGLE_CLIENT_ID } from '@/lib/google';
import { Badge, Callout, Card, ConfirmButton, Field } from '@/components/ui';
import { toast } from '@/components/Toast';
import { fmtDateTime } from '@/lib/ids';

export default function Settings() {
  const data = useAppData();
  const s = data.settings;
  const { user, signInWithGoogle, signOut, getToken, googleConfigured, busy } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [driveInput, setDriveInput] = useState(s.driveFileId);
  const [syncing, setSyncing] = useState(false);

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `senawave-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (f: File | undefined) => {
    if (!f) return;
    const r = importJson(await f.text(), importMode);
    toast(r.ok ? `Imported (${importMode}).` : `Import failed: ${r.error}`, r.ok ? 'ok' : 'bad');
    if (fileRef.current) fileRef.current.value = '';
  };

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await syncWithDrive(getToken);
      toast(r.pulled ? 'Synced with Drive.' : 'Created the sync file in Drive.');
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
            <div className="row between"><span>Google client id</span>{googleConfigured ? <Badge kind="ok" mono>{GOOGLE_CLIENT_ID.slice(0, 14)}…</Badge> : <Badge kind="warn">not configured</Badge>}</div>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            {user?.mode !== 'google' && googleConfigured && <button className="btn primary sm" onClick={() => void signInWithGoogle()} disabled={busy}>Sign in with Google</button>}
            <button className="btn sm" onClick={signOut}>Sign out</button>
          </div>
          {!googleConfigured && (
            <Callout kind="info">
              <p><strong>To enable Google sign-in and Drive sync:</strong> create an OAuth 2.0 Web client in Google Cloud Console (enable the Google Drive API, add this site's origin), put the client id in <code>.env.local</code> as <code>VITE_GOOGLE_CLIENT_ID</code>, add yourself, David and Jesse as test users on the consent screen, and rebuild. Step-by-step in the README.</p>
            </Callout>
          )}
        </Card>

        <Card title="Owner & access" subtitle="Who may sign in. Empty list = only the owner. Google sign-in checks this list; offline mode does not.">
          <div className="form-grid">
            <Field label="Owner name"><input value={s.ownerName} onChange={(e) => updateSettings({ ownerName: e.target.value })} /></Field>
            <Field label="Owner Google email"><input type="email" value={s.ownerEmail} onChange={(e) => updateSettings({ ownerEmail: e.target.value })} /></Field>
            <Field label="Also allowed (one email per line)" className="span-all" hint="Add David's and Jesse's Google emails here when you share the tool.">
              <textarea value={s.allowedEmails.join('\n')} onChange={(e) => updateSettings({ allowedEmails: e.target.value.split('\n').map((x) => x.trim()).filter(Boolean) })} style={{ minHeight: 70 }} />
            </Field>
            <Field label="Your hourly rate ($/h)" hint="Only used to total the time log; never leaves this file.">
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
            <Field label="Sync file id or share link" className="span-all" hint="Leave blank to auto-create. To share with David and Jesse: share the file in Drive, they paste the link here with scope = drive.">
              <div className="row">
                <input value={driveInput} onChange={(e) => setDriveInput(e.target.value)} placeholder="https://drive.google.com/file/d/…/view" />
                <button className="btn sm" onClick={() => { updateSettings({ driveFileId: parseDriveId(driveInput) }); toast('Sync file set.'); }}>Set</button>
                <button className="btn sm ghost" onClick={() => { updateSettings({ driveFileId: '' }); setDriveInput(''); }}>Clear</button>
              </div>
            </Field>
            <Field label="Auto-sync">
              <select value={s.autoSync ? 'on' : 'off'} onChange={(e) => updateSettings({ autoSync: e.target.value === 'on' })}>
                <option value="off">Manual (Sync button)</option>
                <option value="on">Push 20 s after each edit</option>
              </select>
            </Field>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button className="btn primary sm" onClick={() => void sync()} disabled={syncing || user?.mode !== 'google'}>{syncing ? 'Syncing…' : 'Sync now'}</button>
            {user?.mode !== 'google' && <span className="muted" style={{ fontSize: 12.5 }}>Sign in with Google to sync.</span>}
            {s.driveFileId && <a className="btn sm ghost" href={`https://drive.google.com/file/d/${s.driveFileId}/view`} target="_blank" rel="noopener noreferrer">Open file in Drive ↗</a>}
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Data last changed {fmtDateTime(data.updatedAt)}.</p>
        </Card>

        <Card title="Backup, import, sample data">
          <div className="row">
            <button className="btn sm" onClick={download}>Export JSON</button>
            <select value={importMode} onChange={(e) => setImportMode(e.target.value as typeof importMode)} style={{ width: 'auto' }}>
              <option value="merge">Import: merge (newest wins)</option>
              <option value="replace">Import: replace everything</option>
            </select>
            <input ref={fileRef} type="file" accept="application/json,.json" style={{ width: 'auto' }} onChange={(e) => void onImport(e.target.files?.[0])} />
          </div>
          <hr />
          <div className="row">
            {hasSampleData(data) ? (
              <ConfirmButton label="Delete the sample project & its notes" confirmLabel="Delete sample data" className="btn sm" onConfirm={() => { removeSampleData(); toast('Sample data removed.'); }} />
            ) : (
              <Badge kind="ok">no sample data</Badge>
            )}
            <ConfirmButton label="Reset everything to defaults" confirmLabel="Yes, wipe and reseed" onConfirm={() => { resetToSeed(true); toast('Reset to seed data (settings kept).'); }} />
          </div>
          <p className="faint" style={{ fontSize: 12, marginTop: 8 }}>Data is stored in this browser (localStorage) and, when synced, in your Drive file. Export before clearing browser data.</p>
        </Card>
      </div>
    </div>
  );
}
