// Google Identity Services (OAuth 2.0 token flow) without an SDK dependency.
// Loads https://accounts.google.com/gsi/client on demand. When no client id is configured the
// app runs in offline mode and none of this is called.

export const GOOGLE_CLIENT_ID: string = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || '';

export const SCOPES = {
  identity: 'openid email profile',
  driveFile: 'https://www.googleapis.com/auth/drive.file',
  driveFull: 'https://www.googleapis.com/auth/drive',
  driveReadonly: 'https://www.googleapis.com/auth/drive.readonly',
  gmailReadonly: 'https://www.googleapis.com/auth/gmail.readonly',
};

export interface GoogleProfile {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export interface TokenInfo {
  accessToken: string;
  expiresAt: number; // epoch ms
  scope: string;
}

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: '' | 'consent' | 'select_account'; hint?: string }) => void;
}

interface GoogleOAuth2 {
  initTokenClient: (cfg: {
    client_id: string;
    scope: string;
    prompt?: string;
    callback: (resp: { access_token?: string; expires_in?: number; scope?: string; error?: string; error_description?: string }) => void;
    error_callback?: (err: { type: string; message?: string }) => void;
  }) => TokenClient;
  revoke: (token: string, done?: () => void) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { oauth2?: GoogleOAuth2 } };
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadGsi(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Could not load Google Identity Services. Check your network / ad blocker.'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

const TOKEN_KEY = 'senawave-tracker:token';

export function readStoredToken(): TokenInfo | null {
  try {
    const raw = sessionStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as TokenInfo;
    if (t.expiresAt - Date.now() < 30_000) return null;
    return t;
  } catch {
    return null;
  }
}

export function storeToken(t: TokenInfo | null) {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, JSON.stringify(t));
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** Request an access token for the given scopes. `silent` tries without a consent popup first. */
export async function requestToken(scope: string, opts: { silent?: boolean; hint?: string } = {}): Promise<TokenInfo> {
  if (!GOOGLE_CLIENT_ID) throw new Error('No Google client id configured (VITE_GOOGLE_CLIENT_ID).');
  await loadGsi();
  const oauth2 = window.google?.accounts?.oauth2;
  if (!oauth2) throw new Error('Google Identity Services did not initialise.');
  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope,
      callback: (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || 'Sign-in was cancelled.'));
          return;
        }
        const token: TokenInfo = {
          accessToken: resp.access_token,
          expiresAt: Date.now() + (resp.expires_in ?? 3600) * 1000,
          scope: resp.scope || scope,
        };
        storeToken(token);
        resolve(token);
      },
      error_callback: (err) => reject(new Error(err.message || err.type || 'Sign-in failed.')),
    });
    client.requestAccessToken({ prompt: opts.silent ? '' : 'consent', hint: opts.hint });
  });
}

export async function fetchProfile(accessToken: string): Promise<GoogleProfile> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Could not read Google profile (${res.status}).`);
  const j = (await res.json()) as GoogleProfile;
  return { sub: j.sub, email: j.email, name: j.name || j.email, picture: j.picture };
}

export function revokeToken(token: string) {
  try {
    window.google?.accounts?.oauth2?.revoke(token);
  } catch {
    /* ignore */
  }
  storeToken(null);
}
