import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { exportJson, updateSettings, useAppData } from '@/store/store';
import { flushCloud, pushEverythingToCloud, restartCloud, useCloudStatus } from '@/lib/cloud';
import { CONNECTORS, CONNECTOR_IDS, allowConnectors, calendarDay, connectorLabel, driveBackupFolder, driveSaveJson, gmailSenawave, refreshConnectors, useConnectors, ConnectorError, type ConnectorId } from '@/lib/connectors';
import { cap, inClaude, type McpError } from '@/lib/claude/runtime';
import { backupFileName, lastBackup, recordBackup, setSharedWithTeam, sharedWithTeam } from '@/lib/backups';
import { DESIGN_FOLDER_ID } from '@/data/fluenceDrive';
import { parseFolderId } from '@/lib/driveFiles';
import { SCOPES, clientIdFromBuild, getGoogleClientId, isValidClientId } from '@/lib/google';
import { copyText, saveFile, saveMessage } from '@/lib/download';
import { fmtDateTime, todayIso } from '@/lib/ids';
import { cloudChip } from '@/components/SyncButton';
import { Badge, Callout, Card, ConfirmButton, Field } from '@/components/ui';
import { toast } from '@/components/Toast';

export default function Connections() {
  const { user, claude, claudeAvailable } = useAuth();
  const mode = user?.mode ?? 'offline';
  return (
    <>
      <ModeCard />
      {mode === 'claude' && (
        <div className="grid cols-2">
          <div>
            <SharedTrackerCard />
            {claude?.isOwner && <ShareCard />}
          </div>
          <div>
            <ConnectorsCard />
            <BackupCard />
          </div>
        </div>
      )}
      {mode !== 'claude' && claudeAvailable && <ReturnToSharedCard />}
      <GoogleSetupCard collapsed={mode === 'claude'} />
      <OfflineCard />
    </>
  );
}

// ---------- the three ways to run the tracker ----------

function ModeCard() {
  const { user } = useAuth();
  const mode = user?.mode ?? 'offline';
  const ways: { id: 'claude' | 'google' | 'offline'; title: string; body: ReactNode }[] = [
    {
      id: 'claude',
      title: 'Shared on claude.ai',
      body: 'Everyone you share the tracker with sees the same projects, prints, redlines and notes, live. Sign-in, access and Google go through claude.ai, so there is no Google Cloud setup. Your time log and rate stay private to you.',
    },
    {
      id: 'google',
      title: 'Google Drive file (your own site)',
      body: 'One data file in a Drive folder; Sync pulls, merges and pushes. For running the tracker outside claude.ai. Needs a one-time Google Cloud setup (below).',
    },
    {
      id: 'offline',
      title: 'This browser only',
      body: 'Nothing leaves this device. Archive and update with files: a full backup, one project at a time, merge or replace.',
    },
  ];
  return (
    <Card title="How this copy is connected" subtitle="Three ways to run the same tracker. The highlighted one is this copy.">
      <div className="mode-grid">
        {ways.map((w) => (
          <div key={w.id} className={`mode-card ${mode === w.id ? 'on' : ''}`}>
            <div className="row between">
              <strong>{w.title}</strong>
              {mode === w.id && <Badge kind="ok">this copy</Badge>}
            </div>
            <p className="muted" style={{ margin: '6px 0 0', fontSize: 13 }}>{w.body}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ---------- claude.ai: the shared store ----------

function SharedTrackerCard() {
  const { claude, role, leaveSharedTracker } = useAuth();
  const cloud = useCloudStatus();
  const chip = cloudChip(cloud);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await flushCloud();
      toast('Saved.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card title="Shared tracker" subtitle="This browser keeps a working copy. Your changes are saved to the shared tracker a moment after you stop typing; the team's changes arrive within seconds (at most about half a minute).">
      <div className="stack">
        <div className="row between"><span>Status</span><span className={`status-chip ${chip.cls}`}>{chip.text}</span></div>
        {cloud.message && <div className="muted" style={{ fontSize: 12.5 }}>{cloud.message}</div>}
        <div className="row between"><span>You</span><span>{role === 'admin' ? 'Admin' : role === 'editor' ? 'Editor' : 'Viewer'}{claude?.isOwner ? ' · owner' : ''}</span></div>
        <div className="row between"><span>Last saved</span><span className="muted">{cloud.lastSavedAt ? fmtDateTime(cloud.lastSavedAt) : 'nothing changed yet this visit'}</span></div>
        <div className="row between"><span>Others working in it (30 days)</span><span className="muted">{cloud.others === 0 ? 'nobody yet' : `${cloud.others} other ${cloud.others === 1 ? 'person' : 'people'}`}</span></div>
        <div className="row between"><span>Your time log and rate</span><span className="muted">{cloud.privateSync ? 'private to you, on every device' : 'private, kept in this browser'}</span></div>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        {cloud.state === 'live' && cloud.pending > 0 && <button className="btn sm" onClick={() => void save()} disabled={saving}>Save now</button>}
        {(cloud.state === 'error' || cloud.state === 'stopped') && <button className="btn sm primary" onClick={() => restartCloud()}>Reconnect</button>}
        {cloud.state === 'empty' && claude?.isOwner && (
          <button className="btn sm primary" onClick={() => toast(`Copying ${pushEverythingToCloud()} rows into the shared tracker. The sample project stays out.`)}>Copy this device into the shared tracker</button>
        )}
      </div>
      {role === 'viewer' && (
        <Callout kind="info">
          You can read everything. To make changes, ask the owner to share the tracker with you as an <strong>Editor</strong> (claude.ai Share menu). Anything you type now stays in this browser.
        </Callout>
      )}
      <hr />
      <div className="row between" style={{ flexWrap: 'wrap' }}>
        <span className="faint" style={{ fontSize: 12, maxWidth: 420 }}>
          Working offline on this device instead? Your browser copy stays; changes you make while away are not shared until you come back.
        </span>
        <ConfirmButton label="Work offline on this device" confirmLabel="Stop sharing on this device" className="btn sm ghost" onConfirm={leaveSharedTracker} />
      </div>
    </Card>
  );
}

function ReturnToSharedCard() {
  const { joinSharedTracker } = useAuth();
  return (
    <Callout kind="info">
      <div className="row between">
        <span>
          <strong>This page is open in claude.ai, but this device is set to work on its own copy.</strong> Join the shared tracker to see the team's data and share your changes.
        </span>
        <button className="btn sm primary" onClick={joinSharedTracker}>Use the shared tracker</button>
      </div>
    </Callout>
  );
}

// ---------- claude.ai: the viewer's own Google connectors ----------

async function testConnector(id: ConnectorId, myEmail: string, designFolderUrl: string): Promise<string> {
  if (id === 'drive') {
    const folder = parseFolderId(designFolderUrl) || DESIGN_FOLDER_ID;
    const mcp = await cap('mcp');
    if (!mcp) throw new ConnectorError({ code: 'capability_disabled' }, CONNECTORS.drive.server);
    try {
      const r = await mcp.callTool(CONNECTORS.drive.server, 'get_file_metadata', { fileId: folder, excludeContentSnippets: true });
      const p = r.payload as { title?: string } | undefined;
      return `Drive works: can see the "${p?.title || 'Design'}" folder.`;
    } catch (e) {
      throw new ConnectorError(e as McpError, CONNECTORS.drive.server);
    }
  }
  if (id === 'gmail') {
    const mail = await gmailSenawave(myEmail, { days: 14, max: 5 });
    return `Gmail works: ${mail.length} Senawave message${mail.length === 1 ? '' : 's'} in the last two weeks.`;
  }
  const events = await calendarDay(todayIso());
  return `Calendar works: ${events.length} event${events.length === 1 ? '' : 's'} today.`;
}

function ConnectorsCard() {
  const conn = useConnectors();
  const { user } = useAuth();
  const data = useAppData();
  const [busy, setBusy] = useState<string>('');
  const [result, setResult] = useState<Partial<Record<ConnectorId, { ok: boolean; text: string }>>>({});
  const notAllowed = CONNECTOR_IDS.filter((id) => conn.info[id].permission === 'prompt' && conn.info[id].auth !== 'missing');

  const allow = async (ids: ConnectorId[]) => {
    setBusy('allow');
    try {
      const res = await allowConnectors(ids);
      const denied = ids.filter((id) => res[id] === 'denied');
      toast(denied.length ? `Not allowed: ${denied.map((id) => CONNECTORS[id].server).join(', ')}. You can switch them on later from the Permissions menu.` : 'Allowed.', denied.length ? 'bad' : 'ok');
    } finally {
      setBusy('');
    }
  };
  const test = async (id: ConnectorId) => {
    setBusy(id);
    try {
      setResult((r) => ({ ...r, [id]: { ok: true, text: 'Checking…' } }));
      const text = await testConnector(id, user?.email || '', data.settings.designFolderUrl);
      setResult((r) => ({ ...r, [id]: { ok: true, text } }));
    } catch (e) {
      setResult((r) => ({ ...r, [id]: { ok: false, text: (e as Error).message } }));
    } finally {
      setBusy('');
      void refreshConnectors();
    }
  };
  const manage = async () => {
    const p = await cap('permissions');
    try {
      if (!p) throw new Error('no panel');
      await p.manage();
    } catch {
      toast('Open the Permissions menu on the artifact (top of the page in claude.ai) to switch connectors on or off.', 'bad');
    }
    void refreshConnectors();
  };

  return (
    <Card
      title="Google, through your claude.ai connectors"
      subtitle="Each person allows their own; nobody sees another person's mail or Drive. The tracker reads with them and writes only the backup files you ask for."
      actions={notAllowed.length > 1 ? <button className="btn sm primary" disabled={!!busy} onClick={() => void allow(notAllowed)}>Allow {notAllowed.length === 3 ? 'all three' : 'both'}</button> : undefined}
    >
      {!conn.available && conn.loaded && <Callout kind="warn">Connectors are not available in this view. Open the tracker from claude.ai.</Callout>}
      <div className="stack">
        {CONNECTOR_IDS.map((id) => {
          const i = conn.info[id];
          const l = connectorLabel(i);
          const r = result[id];
          return (
            <div key={id} className="conn-row">
              <div className="row between">
                <strong>{CONNECTORS[id].server}</strong>
                <Badge kind={conn.loaded ? l.kind : ''}>{conn.loaded ? l.text : 'checking…'}</Badge>
              </div>
              <div className="faint" style={{ fontSize: 12 }}>{CONNECTORS[id].use}</div>
              {i.auth === 'missing' && <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Add it first: claude.ai → Settings → Connectors → {CONNECTORS[id].server}. Then reload this page.</div>}
              {i.auth === 'needs_reauth' && <div className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>Reconnect it: claude.ai → Settings → Connectors → {CONNECTORS[id].server} → Reconnect.</div>}
              <div className="row" style={{ gap: 6, marginTop: 6 }}>
                {i.permission === 'prompt' && i.auth !== 'missing' && <button className="btn sm primary" disabled={!!busy} onClick={() => void allow([id])}>Allow</button>}
                {i.permission === 'denied' && <button className="btn sm" onClick={() => void manage()}>Open Permissions</button>}
                {i.auth !== 'missing' && <button className="btn sm ghost" disabled={!!busy} onClick={() => void test(id)}>{busy === id ? 'Testing…' : 'Test'}</button>}
              </div>
              {r && <div className={`conn-result ${r.ok ? '' : 'bad'}`}>{r.text}</div>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BackupCard() {
  const conn = useConnectors();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(() => lastBackup());
  const driveReady = connectorLabel(conn.info.drive).ready || conn.info.drive.permission === 'prompt';
  const toDrive = async () => {
    setBusy(true);
    try {
      const folder = await driveBackupFolder();
      const name = backupFileName();
      const file = await driveSaveJson(folder.id, name, exportJson());
      recordBackup({ where: 'drive', url: file.url, name });
      setLast(lastBackup());
      toast(`Backed up to Drive: ${folder.created ? 'made the "Senawave Tracker" folder and ' : ''}saved ${name}.`);
    } catch (e) {
      toast((e as Error).message, 'bad');
    } finally {
      setBusy(false);
      void refreshConnectors();
    }
  };
  const toFile = async () => {
    const name = backupFileName();
    const outcome = await saveFile(name, exportJson());
    if (outcome === 'saved') {
      recordBackup({ where: 'file', name });
      setLast(lastBackup());
    }
    const m = saveMessage(outcome, 'Backup file');
    toast(m.text, m.ok ? 'ok' : 'bad');
  };
  return (
    <Card title="Back up" subtitle="A dated copy of everything you can see, plus your own time log. Restore or merge it any time with Settings → Import.">
      <div className="row">
        <button className="btn primary sm" disabled={busy || !driveReady} onClick={() => void toDrive()}>{busy ? 'Backing up…' : 'Back up to my Drive'}</button>
        <button className="btn sm" onClick={() => void toFile()}>Save a backup file</button>
      </div>
      <p className="faint" style={{ fontSize: 12, marginBottom: 0 }}>
        Drive backups go to a "Senawave Tracker" folder in your own My Drive; each one is a new file, nothing is overwritten.{' '}
        {last ? (
          <>Last backup {fmtDateTime(last.at)} ({last.where === 'drive' ? 'Drive' : 'file'}){last.url && <> · <a href={last.url} target="_blank" rel="noopener noreferrer">open ↗</a></>}.</>
        ) : (
          'No backup yet from this browser.'
        )}
      </p>
    </Card>
  );
}

const INVITE_TEXT = `Hi Jesse,

I set up our Senawave civil tracker (projects, prints, redlines and the AI review notes) as a shared page on claude.ai, and shared it with you as an Editor.

1. Open the link I sent you and sign in to claude.ai with jessem@senawave.com.
2. You should see Fluence with its latest print and redlines. If the top bar says "View only", tell me and I'll fix your access.
3. Optional: on the Connections page, allow Google Drive (Files page, print PDFs) and Gmail (Senawave inbox). They use your own Google account and nobody else sees them.

Changes save on their own and show up for both of us.`;

function ShareCard() {
  const cloud = useCloudStatus();
  const [ticked, setTicked] = useState(() => sharedWithTeam());
  const joined = cloud.others > 0;
  return (
    <Card title="Share with Jesse" subtitle="Only the owner can share. Do this once." actions={<button className="btn sm" onClick={() => void copyText(INVITE_TEXT).then((ok) => toast(ok ? 'Message for Jesse copied.' : 'Clipboard blocked.', ok ? 'ok' : 'bad'))}>Copy a message for Jesse</button>}>
      <ol className="plain-list numbered">
        <li>In claude.ai, open this tracker and press <strong>Share</strong>.</li>
        <li>Invite <code>jessem@senawave.com</code> with <strong>Editor</strong> access. Viewer and Commenter can only read.</li>
        <li>Leave the public link <strong>off</strong>. claude.ai lets people from outside your organization save changes only while there is no public link.</li>
        <li>Jesse signs in to claude.ai as jessem@senawave.com (he needs a claude.ai account under that address) and opens the link.</li>
        <li>His first change shows up here as "1 other person". His time log and connectors stay his own.</li>
      </ol>
      <div className="row between" style={{ marginTop: 8 }}>
        {joined ? <Badge kind="ok">✓ {cloud.others} other {cloud.others === 1 ? 'person has' : 'people have'} worked in the tracker</Badge> : <span className="muted" style={{ fontSize: 12.5 }}>Nobody else has worked in it yet.</span>}
        <label className="row" style={{ gap: 6, fontSize: 12.5 }}>
          <input
            type="checkbox"
            checked={ticked}
            onChange={(e) => {
              setTicked(e.target.checked);
              setSharedWithTeam(e.target.checked);
            }}
            style={{ width: 'auto' }}
          />
          I have sent the invite
        </label>
      </div>
    </Card>
  );
}

// ---------- your own site: Google sign-in ----------

const GSETUP_KEY = 'senawave-tracker:google-setup';

function readTicks(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(GSETUP_KEY) || '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

function CopyValue({ value, label }: { value: string; label?: string }) {
  return (
    <span className="copy-value">
      <code>{value}</code>
      <button className="btn sm ghost" onClick={() => void copyText(value).then((ok) => toast(ok ? `${label || 'Value'} copied.` : 'Clipboard blocked; select it and copy.', ok ? 'ok' : 'bad'))} aria-label={`Copy ${label || value}`}>Copy</button>
    </span>
  );
}

/** The one-time Google Cloud setup for running the tracker on your own site, as ticked steps with exact values. */
export function GoogleSetupSteps() {
  const { user, googleConfigured, saveClientId, signInWithGoogle, busy, isAdmin } = useAuth();
  const [ticks, setTicks] = useState(readTicks);
  const [clientId, setClientId] = useState('');
  const tick = (id: string, v: boolean) => {
    const next = { ...ticks, [id]: v };
    setTicks(next);
    try {
      localStorage.setItem(GSETUP_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };
  const origin = inClaude() ? 'https://your-site.example' : window.location.origin;
  const scopes = [SCOPES.identity, SCOPES.driveFile, SCOPES.driveReadonly, SCOPES.gmailReadonly].join(' ');
  const steps: { id: string; title: string; link?: string; body: ReactNode }[] = [
    { id: 'project', title: 'Create a Google Cloud project', link: 'https://console.cloud.google.com/projectcreate', body: <>Name it <CopyValue value="Senawave Tracker" label="Project name" />. Use the Google account that will own the data file.</> },
    { id: 'apis', title: 'Turn on the Drive and Gmail APIs', link: 'https://console.cloud.google.com/flows/enableapi?apiid=drive.googleapis.com,gmail.googleapis.com', body: 'The link turns on both for the project you pick. Gmail is only needed for the Senawave inbox page.' },
    {
      id: 'consent',
      title: 'Set up the consent screen',
      link: 'https://console.cloud.google.com/apis/credentials/consent',
      body: (
        <>
          (Google now calls this "Google Auth Platform".) Audience <strong>External</strong>, status <strong>Testing</strong>. App name <CopyValue value="Senawave Civil Tracker" label="App name" />. Under Data access add these scopes: <CopyValue value={scopes} label="Scopes" /> Under Test users add both: <CopyValue value="brandonlbarkey@gmail.com" label="Email" /> <CopyValue value="jessem@senawave.com" label="Email" />
        </>
      ),
    },
    {
      id: 'client',
      title: 'Create the OAuth client',
      link: 'https://console.cloud.google.com/apis/credentials/oauthclient',
      body: (
        <>
          Application type <strong>Web application</strong>. Authorized JavaScript origins: <CopyValue value={origin} label="Origin" /> (the address you open the tracker at). No redirect URI. Copy the client ID it shows.
        </>
      ),
    },
  ];
  return (
    <ol className="setup-steps">
      {steps.map((x) => (
        <li key={x.id} className={ticks[x.id] ? 'done' : ''}>
          <label className="row" style={{ gap: 8, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
            <input type="checkbox" checked={!!ticks[x.id]} onChange={(e) => tick(x.id, e.target.checked)} style={{ width: 'auto', marginTop: 3 }} />
            <span style={{ minWidth: 0 }}>
              <strong>{x.title}</strong>
              {x.link && <> · <a href={x.link} target="_blank" rel="noopener noreferrer">open ↗</a></>}
              <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>{x.body}</div>
            </span>
          </label>
        </li>
      ))}
      <li className={googleConfigured ? 'done' : ''}>
        <strong>Paste the client ID</strong> {googleConfigured && <Badge kind="ok" mono>{getGoogleClientId().slice(0, 14)}…{clientIdFromBuild ? ' (from the build)' : ''}</Badge>}
        {!clientIdFromBuild && (isAdmin || !googleConfigured) && (
          <div className="row" style={{ marginTop: 6 }}>
            <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="1234567890-abc….apps.googleusercontent.com" aria-label="Google client id" />
            <button className="btn sm primary" disabled={!isValidClientId(clientId)} onClick={() => { saveClientId(clientId); setClientId(''); toast('Client ID saved on this device.'); }}>Save</button>
          </div>
        )}
        {clientId && !isValidClientId(clientId) && <div className="faint" style={{ fontSize: 12 }}>That does not look like a client ID yet (it ends in .apps.googleusercontent.com).</div>}
      </li>
      <li className={user?.mode === 'google' ? 'done' : ''}>
        <strong>Sign in with Google</strong>{' '}
        {user?.mode === 'google' ? <Badge kind="ok">{user.email}</Badge> : googleConfigured && !inClaude() && <button className="btn sm primary" disabled={busy} onClick={() => void signInWithGoogle()}>Sign in with Google</button>}
        <div className="muted" style={{ fontSize: 13 }}>Then Settings → Google Drive sync → Sync now creates the shared data file, and Settings → People shares it with Jesse.</div>
      </li>
    </ol>
  );
}

function GoogleSetupCard({ collapsed }: { collapsed: boolean }) {
  const { user, googleConfigured } = useAuth();
  const data = useAppData();
  const s = data.settings;
  const [open, setOpen] = useState(!collapsed && !(googleConfigured && user?.mode === 'google'));
  const done = Object.values(readTicks()).filter(Boolean).length + (googleConfigured ? 1 : 0) + (user?.mode === 'google' ? 1 : 0);

  return (
    <Card
      title="Google sign-in on your own site (optional)"
      subtitle={collapsed ? 'Only for running the tracker outside claude.ai. Not needed here.' : `For the Google Drive mode. ${Math.min(done, 6)} of 6 steps done; about ten minutes, once.`}
      actions={<button className="btn sm ghost" onClick={() => setOpen((v) => !v)}>{open ? 'Hide' : 'Show the steps'}</button>}
    >
      {open && (
        <>
          <GoogleSetupSteps />
          <hr />
          <h3 style={{ margin: '0 0 6px' }}>Read-only extras for the Google mode</h3>
          <p className="faint" style={{ fontSize: 12, marginTop: 0 }}>Each switch adds one read-only Google permission at the next sign-in. Changed one? Sign out and in again.</p>
          <div className="form-grid">
            <Field label="Design folder (read-only Drive)" hint="Files page: list the shared Design folder and spot changes.">
              <select value={s.driveFilesEnabled ? 'on' : 'off'} onChange={(e) => updateSettings({ driveFilesEnabled: e.target.value === 'on' })}>
                <option value="off">Off</option>
                <option value="on">On — drive.readonly</option>
              </select>
            </Field>
            <Field label="Gmail (read-only, @senawave.com only)" hint="Senawave inbox page: file threads as notes and actions.">
              <select value={s.gmailEnabled ? 'on' : 'off'} onChange={(e) => updateSettings({ gmailEnabled: e.target.value === 'on' })}>
                <option value="off">Off</option>
                <option value="on">On — gmail.readonly</option>
              </select>
            </Field>
          </div>
        </>
      )}
    </Card>
  );
}

// ---------- offline ----------

function OfflineCard() {
  return (
    <Card title="Offline and archives" subtitle="Works in every mode, with no network.">
      <ul className="plain-list">
        <li><strong>Working copy:</strong> this browser always holds the full tracker. If the connection drops, keep working; changes are sent when the tracker reconnects (reload if the status stays on "Not saving").</li>
        <li><strong>Archive everything:</strong> Settings → Archive and update → Save backup file (or Back up to my Drive above).</li>
        <li><strong>Archive one project:</strong> the project's Overview → Save archive file. It never includes anyone's rate or the people list.</li>
        <li><strong>Update from a file:</strong> Settings → Import. Merge keeps both sides, newest edit wins per row.</li>
      </ul>
      <Link className="btn sm" to="/settings">Archive and update</Link>
    </Card>
  );
}
