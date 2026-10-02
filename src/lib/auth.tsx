import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { SCOPES, fetchProfile, getGoogleClientId, readStoredToken, requestToken, revokeToken, setGoogleClientId, storeToken, type GoogleProfile, type TokenInfo } from './google';
import { getState, setActor, setState, setWriteLock, subscribe, updateSettings, useAppData } from '@/store/store';
import { seedRowKeys } from '@/store/seed';
import { canWrite, emailKey, roleFor, roleForClaude, roleWithInvite } from './roles';
import { clearProvisional, isProvisional } from './provisional';
import { cap, inClaude } from './claude/runtime';
import { markCloudUnavailable, startCloud, stopCloud, useCloudStatus, type StoreBridge } from './cloud';
import { uid as newId } from './ids';
import type { Role, Settings } from './types';

/** google = Google sign-in + Drive file; offline = this browser only; claude = the shared tracker on claude.ai. */
export type AuthMode = 'google' | 'offline' | 'claude';

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  mode: AuthMode;
}

/** What claude.ai says about the person viewing the tracker (claude.ai mode only). */
export interface ClaudeViewerInfo {
  /** Opaque id for this viewer's private part of the shared store; null for some invited guests. */
  uid: string | null;
  isOwner: boolean;
  /** May write the shared data: true, false, or null when claude.ai did not say (a refused save decides). */
  canWrite: boolean | null;
  email: string | null;
  name: string;
  avatarUrl: string;
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
  /** claude.ai mode: the viewer as claude.ai reports them. */
  claude: ClaudeViewerInfo | null;
  /** True for the moment it takes to ask claude.ai who is viewing. */
  claudeChecking: boolean;
  /** The page runs inside claude.ai, so the shared tracker is possible here. */
  claudeAvailable: boolean;
  /** Use the shared claude.ai tracker on this device (again). */
  joinSharedTracker: () => void;
  /** Stop using the shared tracker on this device; work from this browser's copy (offline or Google). */
  leaveSharedTracker: () => void;
}

const AuthContext = createContext<AuthState | null>(null);
const USER_KEY = 'senawave-tracker:user';
const CLAUDE_OFF_KEY = 'senawave-tracker:claude-off';
const DEVICE_KEY = 'senawave-tracker:device';

function readUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    const u = raw ? (JSON.parse(raw) as AuthUser) : null;
    // A claude.ai session is never restored from storage: claude.ai says who is viewing on every visit.
    return u && u.mode !== 'claude' ? u : null;
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

function claudeOptedOut(): boolean {
  try {
    return localStorage.getItem(CLAUDE_OFF_KEY) === '1';
  } catch {
    return false;
  }
}

function setClaudeOptOut(off: boolean) {
  try {
    if (off) localStorage.setItem(CLAUDE_OFF_KEY, '1');
    else localStorage.removeItem(CLAUDE_OFF_KEY);
  } catch {
    /* ignore */
  }
}

/** A stable random key for this browser: names this device's diary documents when claude.ai gives no viewer id. */
function deviceKey(): string {
  try {
    const have = localStorage.getItem(DEVICE_KEY);
    if (have) return have;
    const fresh = newId('dev');
    localStorage.setItem(DEVICE_KEY, fresh);
    return fresh;
  } catch {
    return newId('dev');
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

/** The name the team knows this viewer by: the owner's name, their entry on the people list, else claude.ai's. */
export function claudeDisplayName(v: ClaudeViewerInfo, s: Settings): string {
  const email = v.email ? emailKey(v.email) : '';
  if (v.isOwner || (email && email === emailKey(s.ownerEmail || ''))) return s.ownerName || v.name || 'Owner';
  const listed = email ? (s.members || []).find((m) => emailKey(m.email) === email) : undefined;
  return listed?.name || v.name || 'Teammate';
}

function storeBridge(): StoreBridge {
  const seedKeys = seedRowKeys();
  return {
    getState,
    replaceState: (next) => setState(next, { touch: false }),
    subscribe,
    setWriteLock,
    isSeedRow: (collection, id) => seedKeys.has(`${collection}:${id}`),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [storedUser, setStoredUser] = useState<AuthUser | null>(() => readUser());
  const [token, setToken] = useState<TokenInfo | null>(() => readStoredToken());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientId, setClientIdState] = useState(() => getGoogleClientId());
  const data = useAppData();
  const [provisional, setProvisionalState] = useState(() => isProvisional());
  const claudeAvailable = inClaude();
  const [claudePhase, setClaudePhase] = useState<'checking' | 'ready' | 'absent'>(() => (claudeAvailable && !claudeOptedOut() ? 'checking' : 'absent'));
  const [claude, setClaude] = useState<ClaudeViewerInfo | null>(null);
  const cloud = useCloudStatus();

  // Inside claude.ai: ask who is viewing. Outside it (or when this device opted out) this never runs.
  useEffect(() => {
    if (claudePhase !== 'checking') return;
    let cancelled = false;
    (async () => {
      const u = await cap('user');
      if (!u) return cancelled ? undefined : setClaudePhase('absent');
      const [me, write] = await Promise.all([u.me(), u.can('data.write').catch(() => null)]);
      if (cancelled) return;
      setClaude({ uid: me.id ?? null, isOwner: !!me.isOwner, canWrite: write, email: me.email ?? null, name: me.name || '', avatarUrl: me.avatarUrl || '' });
      setClaudePhase('ready');
    })().catch(() => {
      if (!cancelled) setClaudePhase('absent');
    });
    return () => {
      cancelled = true;
    };
  }, [claudePhase]);

  // claude.ai mode: keep this browser's copy in step with the shared tracker.
  useEffect(() => {
    if (claudePhase !== 'ready' || !claude) return;
    let cancelled = false;
    let stop: (() => void) | null = null;
    void cap('db').then((db) => {
      if (cancelled) return;
      if (!db) return markCloudUnavailable('The shared tracker cannot be opened in this view. Changes stay in this browser; open the tracker from claude.ai to share them.');
      stop = startCloud(db, storeBridge(), { uid: claude.uid, deviceKey: deviceKey(), canWrite: claude.canWrite, isOwner: claude.isOwner });
    });
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [claudePhase, claude]);

  const ownerName = data.settings.ownerName;
  const ownerEmail = data.settings.ownerEmail;
  const members = data.settings.members;
  const claudeUser = useMemo<AuthUser | null>(() => {
    if (claudePhase !== 'ready' || !claude) return null;
    const s = { ...getState().settings, ownerName, ownerEmail, members };
    return { email: claude.email || (claude.isOwner ? ownerEmail : ''), name: claudeDisplayName(claude, s), picture: claude.avatarUrl || undefined, mode: 'claude' };
  }, [claudePhase, claude, ownerName, ownerEmail, members]);

  const user = claudeUser ?? (claudePhase === 'ready' ? null : storedUser);
  const role: Role | null =
    user?.mode === 'claude' && claude
      ? roleForClaude({ isOwner: claude.isOwner, email: claude.email, canWrite: claude.canWrite, readOnly: cloud.state === 'readonly' })
      : roleWithInvite(data.settings, user, provisional);

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
      setStoredUser(u);
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
    setStoredUser(u);
    setError(null);
  }, []);

  const signOut = useCallback(() => {
    if (token) revokeToken(token.accessToken);
    storeToken(null);
    writeUser(null);
    setToken(null);
    setStoredUser(null);
  }, [token]);

  const joinSharedTracker = useCallback(() => {
    setClaudeOptOut(false);
    if (inClaude()) setClaudePhase('checking');
  }, []);

  const leaveSharedTracker = useCallback(() => {
    setClaudeOptOut(true);
    stopCloud();
    setWriteLock(false);
    setClaude(null);
    setClaudePhase('absent');
  }, []);

  const getToken = useCallback(
    async (scope: string): Promise<string> => {
      if (user?.mode === 'claude') throw new Error('In claude.ai the tracker uses your claude.ai connectors (Connections page), not a Google sign-in.');
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
    if (storedUser?.mode === 'google' && !clientId) {
      writeUser(null);
      setStoredUser(null);
    }
  }, [storedUser, clientId]);

  useEffect(() => {
    // Taken off the people list while signed in: back to the sign-in page.
    if (user?.mode === 'google' && role === null) {
      if (token) revokeToken(token.accessToken);
      storeToken(null);
      writeUser(null);
      setToken(null);
      setStoredUser(null);
      setError(`${user.email} is no longer on the people list. Ask ${data.settings.ownerName || 'the owner'} to add it again.`);
    }
  }, [user, role, token, data.settings.ownerName]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      busy,
      error,
      googleConfigured: !!clientId,
      role,
      isAdmin: role === 'admin',
      canEdit: canWrite(role),
      finishJoin,
      saveClientId,
      signInWithGoogle,
      continueOffline,
      signOut,
      getToken,
      claude: claudePhase === 'ready' ? claude : null,
      claudeChecking: claudePhase === 'checking',
      claudeAvailable,
      joinSharedTracker,
      leaveSharedTracker,
    }),
    [user, token, busy, error, clientId, role, finishJoin, saveClientId, signInWithGoogle, continueOffline, signOut, getToken, claudePhase, claude, claudeAvailable, joinSharedTracker, leaveSharedTracker],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
