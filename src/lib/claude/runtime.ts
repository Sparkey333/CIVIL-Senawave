// The claude.ai artifact runtime. When the tracker runs as a published artifact inside claude.ai,
// `window.claude.use(name)` resolves a capability's namespace (or null where this view cannot run it).
// Anywhere else (local dev, a self-hosted copy) there is no `window.claude`, and every helper here
// answers null, so the app falls back to its Google or offline modes.
//
// Only the members the tracker uses are typed here; the platform's own type definitions are the
// authority for the full surface.

export interface DbError {
  code: string;
  message: string;
}

export interface DocSnap {
  id: string;
  exists: boolean;
  data(): Record<string, unknown> | undefined;
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
}

export interface DocChange {
  type: 'added' | 'modified' | 'removed';
  doc: DocSnap;
}

export interface QuerySnap {
  docs: DocSnap[];
  size: number;
  empty: boolean;
  docChanges?(): DocChange[];
  metadata: { fromCache: boolean; hasPendingWrites: boolean };
}

export type Unsubscribe = () => void;

export interface DocRef {
  id: string;
  path: string;
  get(): Promise<DocSnap>;
  set(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
  onSnapshot(next: (snap: DocSnap) => void, error?: (e: DbError) => void): Unsubscribe;
  collection(path: string): CollectionRef;
}

export interface QueryRef {
  where(field: string, op: string, value: unknown): QueryRef;
  orderBy(field: string, dir?: 'asc' | 'desc'): QueryRef;
  limit(n: number): QueryRef;
  get(): Promise<QuerySnap>;
  onSnapshot(next: (snap: QuerySnap) => void, error?: (e: DbError) => void): Unsubscribe;
}

export interface CollectionRef extends QueryRef {
  path: string;
  doc(id?: string): DocRef;
}

export interface ClaudeDb {
  doc(path: string): DocRef;
  collection(path: string): CollectionRef;
}

export interface ClaudeViewer {
  id: string | null;
  name: string;
  avatarUrl: string;
  color: string;
  email: string | null;
  isOwner: boolean;
  canEdit: boolean;
}

export interface ClaudeUser {
  isOwner(): Promise<boolean>;
  canEdit(): Promise<boolean>;
  can(capability: string): Promise<boolean | null>;
  me(): Promise<ClaudeViewer>;
  id(): Promise<string | null>;
}

export interface McpError {
  code: string;
  server?: string;
  message: string;
  retryable?: boolean;
  retryAfterMs?: number;
}

export interface CallToolResult {
  content: unknown[];
  structuredContent?: unknown;
  payload?: unknown;
  cache?: { storedAt: number; revalidating: boolean };
}

export interface ClaudeMcp {
  callTool(
    server: string,
    tool: string,
    input?: unknown,
    options?: { cache?: false | { staleTime?: number; gcTime?: number; refresh?: boolean }; signal?: AbortSignal },
  ): Promise<CallToolResult>;
  listTools(server?: string): Promise<{ servers: { server: string; kind?: string; authStatus: string; tools: { name: string }[] }[] }>;
}

export interface SampleError {
  code: string;
  message: string;
  text?: string;
}

export interface SampleOptions {
  onText?: (update: { text: string; delta: string }) => void;
  signal?: AbortSignal;
  modelTier?: 'default' | 'complex' | 'quick';
  cache?: boolean | { gcTime?: number; refresh?: boolean };
}

export interface ClaudeSample {
  (input: string, options?: SampleOptions): Promise<{ text: string; truncated: boolean; modelTierApplied: string }>;
  json<T = unknown>(input: string, options?: SampleOptions): Promise<T>;
}

export interface ClaudeDownloads {
  save(request: { filename: string; data: string | Blob }): Promise<{ status: 'saved' | 'delivered' }>;
}

export type PermissionState = 'granted' | 'prompt' | 'denied' | 'unavailable';

export interface ClaudePermissions {
  state(name?: string): Promise<PermissionState | Record<string, PermissionState>>;
  request(names?: string[]): Promise<Record<string, PermissionState>>;
  manage(): Promise<void>;
}

export interface CapabilityMap {
  db: ClaudeDb;
  user: ClaudeUser;
  mcp: ClaudeMcp;
  sample: ClaudeSample;
  downloads: ClaudeDownloads;
  permissions: ClaudePermissions;
}

interface ClaudeGlobal {
  use(name: string): Promise<unknown>;
}

function runtime(): ClaudeGlobal | null {
  if (typeof window === 'undefined') return null;
  const c = (window as unknown as { claude?: ClaudeGlobal }).claude;
  return c && typeof c.use === 'function' ? c : null;
}

/** True when the page is running inside the claude.ai artifact viewer (or a test shim of it). */
export function inClaude(): boolean {
  return runtime() !== null;
}

const memo = new Map<string, Promise<unknown>>();

/** A capability's namespace, or null where this view cannot run it. Memoized per name. */
export function cap<K extends keyof CapabilityMap>(name: K): Promise<CapabilityMap[K] | null> {
  const rt = runtime();
  if (!rt) return Promise.resolve(null);
  let p = memo.get(name);
  if (!p) {
    p = rt.use(name).then(
      (ns) => ns ?? null,
      () => null,
    );
    memo.set(name, p);
  }
  return p as Promise<CapabilityMap[K] | null>;
}

/** Tests: forget memoized namespaces so a new shim is picked up. */
export function resetCapabilities() {
  memo.clear();
}

/** Read one permission state without asking. Resolves 'unavailable' on any failure. */
export async function permissionState(name: string): Promise<PermissionState> {
  const p = await cap('permissions');
  if (!p) return 'unavailable';
  try {
    const s = await p.state(name);
    return typeof s === 'string' ? s : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/** Ask for one or more permissions with at most one dialog. Resolves the states (never rejects). */
export async function requestPermissions(names: string[]): Promise<Record<string, PermissionState>> {
  const p = await cap('permissions');
  if (!p) return Object.fromEntries(names.map((n) => [n, 'unavailable' as PermissionState]));
  try {
    return await p.request(names);
  } catch {
    return Object.fromEntries(names.map((n) => [n, 'unavailable' as PermissionState]));
  }
}
