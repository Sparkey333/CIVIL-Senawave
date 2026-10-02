import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SCOPES, fetchProfile, getGoogleClientId, readStoredToken, requestToken, revokeToken, setGoogleClientId, storeToken, type GoogleProfile, type TokenInfo } from './google';
import { getState, setActor, setWriteLock, updateSettings, useAppData } from '@/store/store';
import { canWrite, roleFor, roleWithInvite } from './roles';
import { clearProvisional, isProvisional } from './provisional';
import type { Role } from './types';

export type AuthMode = 'google' | 'offline';

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  mode: AuthMode;
}

interface AuthState {
  user: AuthUser | null;
  token: TokenInfo | null;
  busy: boolean;
  error: string | null;
  googleConfigured: boolean;
  /** What this person may do: admin, editor, viewer. Offline mode is admin of this device's data. */
  role: Role | null;
  isAdmin: boolean;
  canEdit: boolean;
  /** Call after the first successful pull of a shared file: the synced people list now decides access. */
  finishJoin: () => void;
  /** Save a Google client id on this device (ignored when one is baked into the build). */
  saveClientId: (id: string) => void;
  signInWithGoogle: () => Promise<void>;
  continueOffline: (name?: string, email?: string) => void;
  signOut: () => void;
  /** Ensure we hold a token covering the given scope; prompts when needed. */
  getToken: (scope: string) => Promise<string>;
}

const AuthContext = createContext<AuthState | null>(null);
const USER_KEY = 'senawave-tracker:user';

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeUser(u: AuthUser | null) {
  try {
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* ignore */
  }
}

export function isAllowed(email: string): boolean {
  return roleFor(getState().settings, { email, mode: 'google' }) !== null;
}

function driveScope(): string {
  const s = getState().settings;
  const scopes = [s.driveScope === 'drive' ? SCOPES.driveFull : SCOPES.driveFile];
  if (s.driveFilesEnabled && s.driveScope !== 'drive') scopes.push(SCOPES.driveReadonly);
  if (s.gmailEnabled) scopes.push(SCOPES.gmailReadonly);
  return scopes.join(' ');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readUser());
  const [token, setToken] = useState<TokenInfo | null>(() => readStoredToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientIdState] = useState(() => getGoogleClientId());
  const data = useAppData();
  const [provisional, setProvisionalState] = useState(() => isProvisional());
  const role = roleWithInvite(data.settings, user, provisional);
  const finishJoin = useCallback(() => {
    clearProvisional();
    setProvisionalState(false);
  }, []);

  const saveClientId = useCallback((id: string) => {
    setGoogleClientId(id);
    setClientIdState(getGoogleClientId());
    setError(null);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const scope = `${SCOPES.identity} ${driveScope()}`;
      const t = await requestToken(scope, { hint: getState().settings.ownerEmail || undefined });
      const profile: GoogleProfile = await fetchProfile(t.accessToken);
      if (!isAllowed(profile.email) && !isProvisional()) {
        revokeToken(t.accessToken);
        throw new Error(`${profile.email} is not on the people list yet. Ask ${getState().settings.ownerName || 'the owner'} to add it under Settings → People and access.`);
      }
      const u: AuthUser = { email: profile.email, name: profile.name, picture: profile.picture, mode: 'google' };
      // First Google sign-in on a fresh install claims ownership.
      const s = getState().settings;
      if (!s.ownerEmail) updateSettings({ ownerEmail: profile.email, ownerName: s.ownerName || profile.name });
      writeUser(u);
      setUser(u);
      setToken(t);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }, []);

  const continueOffline = useCallback((name?: string, email?: string) => {
    const s = getState().settings;
    const u: AuthUser = {
      email: email || s.ownerEmail || 'offline@local',
      name: name || s.ownerName || 'Offline user',
      mode: 'offline',
    };
    writeUser(u);
    setUser(u);
    setError(null);
  }, []);

  const signOut = useCallback(() => {
    if (token) revokeToken(token.accessToken);
    storeToken(null);
    writeUser(null);
    setToken(null);
    setUser(null);
  }, [token]);

  const getToken = useCallback(
    async (scope: string): Promise<string> => {
      const wanted = scope.split(' ').filter(Boolean);
      const has = (t: TokenInfo | null) => !!t && t.expiresAt - Date.now() > 60_000 && wanted.every((s) => t.scope.includes(s));
      if (has(token)) return token!.accessToken;
      const stored = readStoredToken();
      if (has(stored)) {
        setToken(stored);
        return stored!.accessToken;
      }
      const fresh = await requestToken(`${SCOPES.identity} ${scope}`, { silent: !!user, hint: user?.email });
      setToken(fresh);
      return fresh.accessToken;
    },
    [token, user],
  );

  useEffect(() => {
    setActor(user?.name || '');
  }, [user]);

  // View-only access: every edit on this device is refused in the store.
  useEffect(() => {
    setWriteLock(!!user && role === 'viewer');
  }, [user, role]);

  useEffect(() => {
    // Drop a stale Google session when the client id was removed.
    if (user?.mode === 'google' && !clientId) {
      writeUser(null);
      setUser(null);
    }
  }, [user, clientId]);

  useEffect(() => {
    // Taken off the people list while signed in: back to the sign-in page.
    if (user?.mode === 'google' && role === null) {
      if (token) revokeToken(token.accessToken);
      storeToken(null);
      writeUser(null);
      setToken(null);
      setUser(null);
      setError(`${user.email} is no longer on the people list. Ask ${data.settings.ownerName || 'the owner'} to add it again.`);
    }
  }, [user, role, token, data.settings.ownerName]);

  const value = useMemo<AuthState>(
    () => ({ user, token, busy, error, googleConfigured: !!clientId, role, isAdmin: role === 'admin', canEdit: canWrite(role), finishJoin, saveClientId, signInWithGoogle, continueOffline, signOut, getToken }),
    [user, token, busy, error, clientId, role, finishJoin, saveClientId, signInWithGoogle, continueOffline, signOut, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
