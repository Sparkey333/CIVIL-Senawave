import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { clientIdFromBuild, isValidClientId } from '@/lib/google';
import { useAppData } from '@/store/store';

export default function SignIn() {
  const { signInWithGoogle, continueOffline, saveClientId, busy, error, googleConfigured } = useAuth();
  const data = useAppData();
  const [name, setName] = useState(data.settings.ownerName);
  const [clientId, setClientId] = useState('');
  const [setup, setSetup] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const idOk = isValidClientId(clientId);

  return (
    <div className="signin">
      <div className="card">
        <div className="row" style={{ gap: 12, marginBottom: 14 }}>
          <div className="brand-mark" style={{ background: '#0f172a' }}>
            <svg width="22" height="22" viewBox="0 0 64 64">
              <path d="M10 40c8 0 8-16 16-16s8 16 16 16 8-16 16-16" fill="none" stroke="#ff6600" strokeWidth="6" strokeLinecap="round" />
              <rect x="26" y="44" width="12" height="9" rx="1.5" fill="#ff6600" />
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0 }}>Senawave Civil Tracker</h1>
            <div className="muted">Fiber plan production · projects, prints, redlines, QC</div>
          </div>
        </div>

        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Online: your Google account</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Sign in to share one data file in Google Drive with the team. The owner ({data.settings.ownerEmail || 'first person to sign in'}) is the admin and decides who else gets in and what they can do.
        </p>
        {googleConfigured ? (
          <button className="btn primary lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => void signInWithGoogle()} disabled={busy}>
            {busy ? 'Opening Google…' : 'Sign in with Google'}
          </button>
        ) : (
          <div className="callout warn">
            <p style={{ marginTop: 0 }}><strong>One-time setup before Google sign-in works.</strong> Google needs to know this app. It takes about five minutes and you only do it once.</p>
            <button className="btn sm" onClick={() => setSetup((v) => !v)}>{setup ? 'Hide the steps' : 'Show the steps'}</button>
            {setup && (
              <ol style={{ paddingLeft: 18, marginBottom: 8 }}>
                <li>Open <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">Google Cloud Console → Credentials ↗</a> and create or pick a project.</li>
                <li>Under APIs &amp; Services → Library, turn on <strong>Google Drive API</strong> (and <strong>Gmail API</strong> if you want the inbox page).</li>
                <li>Under OAuth consent screen, choose External, add the scopes you need, and add the emails that will sign in as <strong>test users</strong> (yours and jessem@senawave.com).</li>
                <li>Create credentials → <strong>OAuth client ID</strong> → Web application. Under Authorized JavaScript origins add <code>{origin}</code>.</li>
                <li>Copy the client ID (it ends in <code>.apps.googleusercontent.com</code>) and paste it below.</li>
              </ol>
            )}
            {!clientIdFromBuild && (
              <div className="row" style={{ marginTop: 8 }}>
                <input value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="1234567890-abc….apps.googleusercontent.com" aria-label="Google client id" />
                <button className="btn primary sm" disabled={!idOk} onClick={() => saveClientId(clientId)}>Save</button>
              </div>
            )}
            {clientId && !idOk && <div className="faint" style={{ fontSize: 12, marginTop: 4 }}>That does not look like a client ID yet.</div>}
          </div>
        )}
        {error && <div className="callout bad" style={{ marginTop: 12 }}>{error}</div>}

        <hr />
        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Offline: this browser only</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Nothing leaves this device. You are the admin of what is stored here. Archive and update by exporting a file, importing a file (merge or replace), per-project archive files and automatic local backups, all under Settings.
        </p>
        <label className="field">
          <span>Your name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name shown on notes and time entries" />
        </label>
        <button className="btn lg" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => continueOffline(name.trim() || undefined)}>
          Continue offline
        </button>
      </div>
    </div>
  );
}
