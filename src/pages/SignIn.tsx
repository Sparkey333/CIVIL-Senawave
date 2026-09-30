import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useAppData } from '@/store/store';

export default function SignIn() {
  const { signInWithGoogle, continueOffline, busy, error, googleConfigured } = useAuth();
  const data = useAppData();
  const [name, setName] = useState(data.settings.ownerName);

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
            <div className="muted">Fiber plan production · projects, notes, QC, reference</div>
          </div>
        </div>
        <p className="muted">
          Internal tool for the Senawave civil design work (ArcGIS Pro → BricsCAD 11×17 plan sets). Sign in with the Google account that holds the
          CAD/Templates Drive so the tracker can sync a JSON file there, or work offline in this browser only.
        </p>
        {googleConfigured ? (
          <button className="btn primary lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => void signInWithGoogle()} disabled={busy}>
            {busy ? 'Opening Google…' : 'Sign in with Google'}
          </button>
        ) : (
          <div className="callout warn">
            <p>
              <strong>Google sign-in is not configured yet.</strong> Add <code>VITE_GOOGLE_CLIENT_ID</code> to <code>.env.local</code> (see README → Google setup) and
              rebuild. Until then the tool runs in offline mode with data saved in this browser.
            </p>
          </div>
        )}
        {error && <div className="callout bad" style={{ marginTop: 12 }}>{error}</div>}
        <hr />
        <label className="field">
          <span>Your name (offline mode)</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name shown on notes and time entries" />
        </label>
        <button className="btn lg" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => continueOffline(name.trim() || undefined)}>
          Continue offline
        </button>
        <p className="faint" style={{ fontSize: 12, marginTop: 14, marginBottom: 0 }}>
          Owner: {data.settings.ownerEmail || 'not set'}. Access is limited to the owner and the emails listed under Settings → Access.
        </p>
      </div>
    </div>
  );
}
