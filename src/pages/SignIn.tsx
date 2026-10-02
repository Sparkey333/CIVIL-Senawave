import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useAppData } from '@/store/store';
import { GoogleSetupSteps } from './Connections';

export default function SignIn() {
  const { signInWithGoogle, continueOffline, joinSharedTracker, claudeAvailable, busy, error, googleConfigured } = useAuth();
  const data = useAppData();
  const [name, setName] = useState(data.settings.ownerName);
  const [setup, setSetup] = useState(false);

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

        {claudeAvailable && (
          <>
            <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Shared tracker on claude.ai</h2>
            <p className="muted" style={{ marginTop: 0 }}>You are inside claude.ai: open the team's shared copy. No Google setup needed.</p>
            <button className="btn primary lg" style={{ width: '100%', justifyContent: 'center' }} onClick={joinSharedTracker}>
              Open the shared tracker
            </button>
            <hr />
          </>
        )}

        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Google account (your own site)</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          One data file in Google Drive, shared with the team. The owner ({data.settings.ownerEmail || 'first person to sign in'}) is the admin and decides who else gets in.
        </p>
        {googleConfigured ? (
          <button className={`btn ${claudeAvailable ? '' : 'primary'} lg`} style={{ width: '100%', justifyContent: 'center' }} onClick={() => void signInWithGoogle()} disabled={busy}>
            {busy ? 'Opening Google…' : 'Sign in with Google'}
          </button>
        ) : (
          <div className="callout warn">
            <p style={{ marginTop: 0 }}><strong>Needs a one-time Google setup</strong> (about ten minutes). {claudeAvailable ? 'Not needed for the shared tracker above.' : ''}</p>
            <button className="btn sm" onClick={() => setSetup((v) => !v)}>{setup ? 'Hide the steps' : 'Show the steps'}</button>
            {setup && <GoogleSetupSteps />}
          </div>
        )}
        {error && <div className="callout bad" style={{ marginTop: 12 }}>{error}</div>}

        <hr />
        <h2 style={{ fontSize: 15, margin: '0 0 4px' }}>Offline: this browser only</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          Nothing leaves this device and you are the admin of what is stored here. Archive and update with files: a full backup, one project at a time, merge or replace (Settings).
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
