// The viewer's own claude.ai connectors (Google Drive, Gmail, Google Calendar), called from the page with the
// viewer's credentials. This is how the tracker reaches Google in claude.ai mode, without a Google Cloud setup.
// Each person allows their own connectors; nothing here is shared between people.

import { useEffect, useSyncExternalStore } from 'react';
import { cap, inClaude, permissionState, requestPermissions, type McpError, type PermissionState } from './claude/runtime';
import type { DriveNode, DriveSnapshot } from './types';
import { FOLDER_MIME, OPAQUE } from './driveFiles';
import { SENAWAVE_QUERY, parseAddress, type MailMessage } from './gmail';

export const CONNECTORS = {
  drive: { server: 'Google Drive', tools: ['search_files', 'read_file_content', 'get_file_metadata', 'create_file'], use: 'Files page (Design folder), reading print PDFs for the AI analysis, backups to your Drive' },
  gmail: { server: 'Gmail', tools: ['search_threads', 'get_thread'], use: 'Senawave inbox page: reads @senawave.com threads, never sends' },
  calendar: { server: 'Google Calendar', tools: ['list_events'], use: "Today's meetings in the morning brief" },
} as const;

export type ConnectorId = keyof typeof CONNECTORS;
export const CONNECTOR_IDS = Object.keys(CONNECTORS) as ConnectorId[];

/** The capabilities manifest the published page declares for these connectors. */
export const MCP_MANIFEST = { servers: CONNECTOR_IDS.map((id) => ({ server: CONNECTORS[id].server, tools: [...CONNECTORS[id].tools] })) };

export class ConnectorError extends Error {
  readonly code: string;
  readonly server: string;
  constructor(e: Partial<McpError> | undefined, server: string) {
    const code = e?.code || 'upstream_error';
    super(connectorFix(code, server, e?.message));
    this.code = code;
    this.server = server;
  }
}

/** What to tell the viewer for each failure: the one thing that fixes it. */
export function connectorFix(code: string, server: string, detail = ''): string {
  switch (code) {
    case 'needs_reauth':
      return `${server} needs to be reconnected: claude.ai → Settings → Connectors → ${server} → Reconnect. Then try again.`;
    case 'server_not_connected':
    case 'server_not_found':
      return `${server} is not connected to your claude.ai account. Add it under claude.ai → Settings → Connectors, then reload this page.`;
    case 'selection_required':
      return `You have more than one ${server} connector. Reload the page and pick one when claude.ai asks.`;
    case 'not_in_manifest':
    case 'consent_required':
      return `${server} is not allowed for this tracker yet. Press Allow on the Connections page, or switch it on in the artifact's Permissions menu.`;
    case 'blocked_by_policy':
      return `Your organization's policy blocks ${server} here.`;
    case 'approval_required':
      return `Your organization requires approval for each ${server} call, which this page cannot ask for yet.`;
    case 'server_unavailable':
      return `${server} did not answer. Try again in a minute.`;
    case 'rate_limited':
      return `Too many ${server} calls just now. Wait a few seconds, then try again.`;
    case 'tool_error':
      return `${server} said no${detail ? `: ${detail.slice(0, 200)}` : '.'}`;
    case 'cancelled':
      return 'Stopped.';
    case 'not_granted':
    case 'capability_disabled':
    case 'capability_removed':
      return 'Connectors are not available in this view of the tracker. Open it from claude.ai.';
    default:
      return `${server} call failed (${code})${detail ? `: ${detail.slice(0, 160)}` : ''}. Try again.`;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** One tool call. Reads that fail with a retryable error are tried once more; writes never are. */
async function call<T>(id: ConnectorId, tool: string, input: Record<string, unknown>, opts: { signal?: AbortSignal; write?: boolean } = {}): Promise<T> {
  const server = CONNECTORS[id].server;
  const mcp = await cap('mcp');
  if (!mcp) throw new ConnectorError({ code: 'capability_disabled' }, server);
  const run = () => mcp.callTool(server, tool, input, opts.signal ? { signal: opts.signal } : undefined);
  try {
    return (await run()).payload as T;
  } catch (e) {
    const err = e as McpError;
    if (!opts.write && err?.retryable && !opts.signal?.aborted) {
      await sleep(Math.min(err.retryAfterMs ?? 600 + Math.random() * 900, 8000));
      try {
        return (await run()).payload as T;
      } catch (e2) {
        throw new ConnectorError(e2 as McpError, server);
      }
    }
    throw new ConnectorError(err, server);
  }
}

// ---------- connection state (shared by Connections, Dashboard and the setup checklist) ----------

export type ConnectorAuth = 'connected' | 'needs_reauth' | 'unknown' | 'missing';
export interface ConnectorInfo {
  /** The viewer's consent for this tracker: "prompt" means the first use will ask. */
  permission: PermissionState;
  /** Whether the viewer's claude.ai account has the connector at all, and if it is signed in. */
  auth: ConnectorAuth;
}
export interface ConnectorsState {
  loaded: boolean;
  /** The page can call connectors at all (inside claude.ai, mcp declared). */
  available: boolean;
  info: Record<ConnectorId, ConnectorInfo>;
}

const UNKNOWN: ConnectorInfo = { permission: 'unavailable', auth: 'unknown' };
let state: ConnectorsState = { loaded: false, available: false, info: { drive: UNKNOWN, gmail: UNKNOWN, calendar: UNKNOWN } };
const listeners = new Set<() => void>();
let inflight: Promise<void> | null = null;

function setConnectors(next: ConnectorsState) {
  state = next;
  for (const l of listeners) l();
}

/** Re-read consent and connection state for the three connectors. Never prompts. */
export function refreshConnectors(): Promise<void> {
  if (inflight) return inflight;
  inflight = (async () => {
    if (!inClaude()) return setConnectors({ loaded: true, available: false, info: state.info });
    const mcp = await cap('mcp');
    if (!mcp) return setConnectors({ loaded: true, available: false, info: state.info });
    const perms = await Promise.all(CONNECTOR_IDS.map((id) => permissionState(`mcp:${CONNECTORS[id].server}`)));
    const auth: Record<string, ConnectorAuth> = {};
    let listed = false;
    try {
      const res = await mcp.listTools();
      listed = true;
      for (const s of res.servers || []) {
        const a = s.authStatus === 'connected' || s.authStatus === 'needs_reauth' ? s.authStatus : 'unknown';
        // Listed with no tools: not connected yet, or two connectors with this name and none picked.
        auth[s.server] = s.tools && s.tools.length === 0 && a !== 'needs_reauth' ? 'missing' : a;
      }
    } catch {
      /* listing failed: every connector reads "unknown" and the calls themselves decide */
    }
    const info = Object.fromEntries(
      CONNECTOR_IDS.map((id, i) => [id, { permission: perms[i], auth: listed ? (auth[CONNECTORS[id].server] ?? 'missing') : 'unknown' }]),
    ) as Record<ConnectorId, ConnectorInfo>;
    setConnectors({ loaded: true, available: true, info });
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

/** Ask the viewer, in one claude.ai dialog, to allow these connectors for the tracker. */
export async function allowConnectors(ids: ConnectorId[]): Promise<Record<ConnectorId, PermissionState>> {
  const res = await requestPermissions(ids.map((id) => `mcp:${CONNECTORS[id].server}`));
  await refreshConnectors();
  return Object.fromEntries(ids.map((id) => [id, res[`mcp:${CONNECTORS[id].server}`] ?? 'unavailable'])) as Record<ConnectorId, PermissionState>;
}

export function useConnectors(): ConnectorsState {
  const snap = useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => state,
    () => state,
  );
  useEffect(() => {
    if (!state.loaded) void refreshConnectors();
  }, []);
  return snap;
}

/** Short label for a connector's state, and whether it is ready to use. */
export function connectorLabel(i: ConnectorInfo): { text: string; kind: '' | 'ok' | 'warn' | 'bad' | 'info'; ready: boolean } {
  if (i.auth === 'missing') return { text: 'not connected in claude.ai', kind: 'warn', ready: false };
  if (i.auth === 'needs_reauth') return { text: 'needs reconnecting', kind: 'bad', ready: false };
  if (i.permission === 'granted') return { text: 'allowed', kind: 'ok', ready: true };
  if (i.permission === 'prompt') return { text: 'not allowed yet', kind: 'info', ready: false };
  if (i.permission === 'denied') return { text: 'blocked for this tracker', kind: 'bad', ready: false };
  return { text: 'not available here', kind: '', ready: false };
}

// ---------- Google Drive ----------

interface McpFile {
  id: string;
  title?: string;
  name?: string;
  mimeType?: string;
  modifiedTime?: string;
  fileSize?: string | number;
  parentId?: string;
  viewUrl?: string;
}

const q = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
export const folderUrl = (id: string) => `https://drive.google.com/drive/folders/${id}`;
export const fileUrl = (id: string) => `https://drive.google.com/file/d/${id}/view`;

/** Everything directly inside one Drive folder (all pages). */
export async function driveChildren(folderId: string, signal?: AbortSignal): Promise<McpFile[]> {
  const out: McpFile[] = [];
  let pageToken = '';
  for (let page = 0; page < 40; page++) {
    const input: Record<string, unknown> = { query: `parentId = '${q(folderId)}'`, pageSize: 100, excludeContentSnippets: true };
    if (pageToken) input.pageToken = pageToken;
    const res = await call<{ files?: McpFile[]; nextPageToken?: string }>('drive', 'search_files', input, { signal });
    const files = res?.files || [];
    out.push(...files.filter((f) => f && typeof f.id === 'string'));
    pageToken = res?.nextPageToken || '';
    if (!pageToken || files.length === 0) break;
  }
  return out;
}

function toNode(f: McpFile, parentId: string | null, path: string): DriveNode {
  const isFolder = f.mimeType === FOLDER_MIME;
  const size = f.fileSize === undefined || f.fileSize === null || f.fileSize === '' ? null : Number(f.fileSize);
  return {
    id: f.id,
    name: f.title || f.name || '(untitled)',
    mimeType: f.mimeType || '',
    isFolder,
    parentId,
    path,
    modifiedTime: f.modifiedTime || '',
    modifiedBy: '',
    size: Number.isFinite(size) ? size : null,
    webViewLink: f.viewUrl || (isFolder ? folderUrl(f.id) : fileUrl(f.id)),
  };
}

/** Walk a folder tree (three folders at a time, at most 8 deep, never inside geodatabases or caches). */
export async function driveSnapshot(rootId: string, onProgress?: (n: number) => void, signal?: AbortSignal): Promise<DriveSnapshot> {
  const meta = await call<McpFile>('drive', 'get_file_metadata', { fileId: rootId, excludeContentSnippets: true }, { signal });
  const root = toNode({ ...meta, id: rootId, mimeType: FOLDER_MIME }, null, meta?.title || meta?.name || 'Design');
  const nodes: DriveNode[] = [root];
  const queue: { id: string; path: string; depth: number }[] = [{ id: rootId, path: '', depth: 0 }];
  while (queue.length) {
    const batch = queue.splice(0, 3);
    const results = await Promise.all(batch.map(async (f) => ({ f, kids: await driveChildren(f.id, signal) })));
    for (const { f, kids } of results) {
      for (const k of kids) {
        const name = k.title || k.name || '(untitled)';
        const node = toNode(k, f.id, f.path ? `${f.path}/${name}` : name);
        nodes.push(node);
        if (node.isFolder && f.depth < 8 && !OPAQUE.test(name)) queue.push({ id: k.id, path: node.path, depth: f.depth + 1 });
      }
    }
    onProgress?.(nodes.length);
  }
  return { rootId, takenAt: new Date().toISOString(), nodes, source: 'live' };
}

/** The text Drive extracts from a file (PDF text layer, Docs text). */
export async function driveReadText(fileId: string, signal?: AbortSignal): Promise<string> {
  const res = await call<{ fileContent?: string; content?: string } | string>('drive', 'read_file_content', { fileId }, { signal });
  if (typeof res === 'string') return res;
  return res?.fileContent || res?.content || '';
}

function pickId(x: unknown): string {
  if (!x || typeof x !== 'object') return '';
  const o = x as { id?: unknown; file?: { id?: unknown }; files?: { id?: unknown }[] };
  const id = o.id ?? o.file?.id ?? o.files?.[0]?.id;
  return typeof id === 'string' ? id : '';
}

/** The viewer's own backup folder in My Drive, created the first time. */
export async function driveBackupFolder(title = 'Senawave Tracker'): Promise<{ id: string; url: string; created: boolean }> {
  const find = async () => {
    const res = await call<{ files?: McpFile[] }>('drive', 'search_files', { query: `title = '${q(title)}' and mimeType = '${FOLDER_MIME}' and owner = 'me'`, pageSize: 5, excludeContentSnippets: true });
    return (res?.files || []).find((f) => f.mimeType === FOLDER_MIME && (f.title || f.name) === title);
  };
  const hit = await find();
  if (hit) return { id: hit.id, url: hit.viewUrl || folderUrl(hit.id), created: false };
  const made = await call<unknown>('drive', 'create_file', { title, contentMimeType: FOLDER_MIME }, { write: true });
  const id = pickId(made) || (await find())?.id || '';
  if (!id) throw new ConnectorError({ code: 'tool_error', message: 'the folder was created but its id did not come back; press Back up again' }, CONNECTORS.drive.server);
  return { id, url: folderUrl(id), created: true };
}

/** Save a JSON file into a Drive folder as a new file (backups never overwrite each other). */
export async function driveSaveJson(folderId: string, fileName: string, text: string): Promise<{ id: string; url: string }> {
  const made = await call<unknown>('drive', 'create_file', { title: fileName, parentId: folderId, textContent: text, contentMimeType: 'application/json', disableConversionToGoogleType: true }, { write: true });
  const id = pickId(made);
  return { id, url: id ? fileUrl(id) : folderUrl(folderId) };
}

// ---------- Gmail ----------

interface McpMessage {
  id: string;
  threadId?: string;
  date?: string;
  internalDate?: string | number;
  labelIds?: string[];
  sender?: string;
  snippet?: string;
  subject?: string;
  toRecipients?: string[] | string;
  viewUrl?: string;
}
interface McpThread {
  id: string;
  messages?: McpMessage[];
  viewUrl?: string;
}

function decode(s: string): string {
  return s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

export function mailFromMcp(m: McpMessage, t: McpThread, myEmail: string): MailMessage {
  const from = parseAddress(m.sender || '');
  const ms = m.internalDate !== undefined ? Number(m.internalDate) : NaN;
  const date = Number.isFinite(ms) ? new Date(ms).toISOString() : m.date ? new Date(m.date).toISOString() : '';
  return {
    id: m.id,
    threadId: m.threadId || t.id,
    date,
    from: from.name,
    fromEmail: from.email,
    to: Array.isArray(m.toRecipients) ? m.toRecipients.join(', ') : m.toRecipients || '',
    subject: m.subject || '(no subject)',
    snippet: decode(m.snippet || ''),
    unread: (m.labelIds || []).includes('UNREAD'),
    isMine: !!myEmail && from.email === myEmail.toLowerCase(),
    link: m.viewUrl || t.viewUrl || `https://mail.google.com/mail/u/0/#all/${m.threadId || t.id}`,
  };
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

/** Recent threads with anyone @senawave.com, read in full (search results only preview the oldest messages). */
export async function gmailSenawave(myEmail: string, opts: { days?: number; max?: number } = {}): Promise<MailMessage[]> {
  const res = await call<{ threads?: McpThread[] }>('gmail', 'search_threads', { query: `${SENAWAVE_QUERY} newer_than:${opts.days ?? 45}d`, pageSize: Math.min(opts.max ?? 25, 50) });
  const threads = (res?.threads || []).filter((t) => t && typeof t.id === 'string');
  const full = await mapLimit(threads, 4, (t) => call<McpThread>('gmail', 'get_thread', { threadId: t.id, messageFormat: 'MINIMAL' }).catch(() => t));
  return full
    .flatMap((t) => (t.messages || []).filter((m) => m && typeof m.id === 'string').map((m) => mailFromMcp(m, t, myEmail)))
    .sort((a, b) => b.date.localeCompare(a.date));
}

// ---------- Google Calendar ----------

export interface CalEvent {
  id: string;
  title: string;
  start: string; // ISO date-time, or YYYY-MM-DD for all-day
  end: string;
  allDay: boolean;
  link: string;
}

interface McpEvent {
  id: string;
  summary?: string;
  status?: string;
  start?: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export function eventFromMcp(e: McpEvent): CalEvent {
  return {
    id: e.id,
    title: e.summary || '(no title)',
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
    allDay: !e.start?.dateTime,
    link: e.htmlLink || '',
  };
}

/** The viewer's primary-calendar events on one local day (YYYY-MM-DD). */
export async function calendarDay(day: string): Promise<CalEvent[]> {
  const start = new Date(`${day}T00:00:00`);
  const end = new Date(start.getTime() + 86400000);
  const res = await call<{ events?: McpEvent[] }>('calendar', 'list_events', { startTime: start.toISOString(), endTime: end.toISOString(), orderBy: 'startTime', pageSize: 50 });
  return (res?.events || []).filter((e) => e && typeof e.id === 'string' && e.status !== 'cancelled').map(eventFromMcp);
}
