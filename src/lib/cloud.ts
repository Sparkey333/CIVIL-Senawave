// The shared team store for the claude.ai mode. When the tracker runs as a published artifact, its
// data lives in the artifact's own document store, shared by everyone the artifact is shared with:
//
//   projects/<id>, notes/<id>, permits/<id>, prints/<id>, redlines/<id>, team/<id>   one row per document
//   config/shared                                                                    shared settings
//   activity/<day>_<person>                                                          one diary doc per person per day
//   data/users/<viewer id>/private            device-free private settings (rate, theme) + scratch
//   data/users/<viewer id>/private/time/<id>  the viewer's own time log, private even from the owner
//
// The browser store stays the working copy (and the offline cache). This engine keeps the two in step:
// remote rows are merged in newest-wins (the same rule as the Drive sync), local edits are written back
// one document at a time after a short pause, and deletes travel as tombstones like everywhere else.

import { useSyncExternalStore } from 'react';
import type { ActivityEntry, AppData, Settings } from './types';
import { PRIVATE_SETTING_KEYS } from './types';
import { capActivity } from './merge';
import type { ClaudeDb, DbError, DocSnap, QueryRef, QuerySnap, Unsubscribe } from './claude/runtime';

export const SHARED_COLLECTIONS = ['projects', 'notes', 'permits', 'prints', 'redlines', 'team'] as const;
export type SharedCollection = (typeof SHARED_COLLECTIONS)[number];
export const CONFIG_PATH = 'config/shared';
export const ACTIVITY_COLLECTION = 'activity';
export const ACTIVITY_WINDOW_DAYS = 30;
export const ACTIVITY_PER_DOC = 300;

interface Row {
  id: string;
  updatedAt: string;
  createdAt?: string;
  deletedAt?: string | null;
  projectId?: string | null;
  tags?: string[];
  sample?: boolean;
}

export type CloudState = 'off' | 'connecting' | 'live' | 'empty' | 'readonly' | 'error' | 'stopped';

export interface CloudStatus {
  state: CloudState;
  /** Changes waiting to be saved or being saved. */
  pending: number;
  lastSavedAt: string | null;
  /** Plain-language detail for the connecting, empty, read-only and error states. */
  message: string;
  /** How many other people wrote to the tracker in the activity window. */
  others: number;
  /** Whether this viewer has a private subtree (time log and rate sync across their devices). */
  privateSync: boolean;
}

const OFF: CloudStatus = { state: 'off', pending: 0, lastSavedAt: null, message: '', others: 0, privateSync: false };
let status: CloudStatus = OFF;
const listeners = new Set<() => void>();

function setStatus(patch: Partial<CloudStatus>) {
  status = { ...status, ...patch };
  for (const l of listeners) l();
}

export function getCloudStatus(): CloudStatus {
  return status;
}

export function subscribeCloud(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useCloudStatus(): CloudStatus {
  return useSyncExternalStore(subscribeCloud, getCloudStatus, getCloudStatus);
}

/** What the engine needs from the app's store. */
export interface StoreBridge {
  getState(): AppData;
  /** Replace the working copy with merged data. Never blocked by the view-only lock. */
  replaceState(next: AppData): void;
  subscribe(fn: () => void): () => void;
  setWriteLock(locked: boolean): void;
  /** True for rows that came with the app; such rows are not pushed unless someone edited them. */
  isSeedRow(collection: string, id: string): boolean;
}

export interface CloudOptions {
  /** The viewer's id from the user capability; null = no private subtree this visit. */
  uid: string | null;
  /** Stable per-browser key, used for the viewer's activity documents when there is no uid. */
  deviceKey: string;
  /** user.can("data.write"): true, false, or null when the platform did not say. */
  canWrite: boolean | null;
  isOwner: boolean;
  now?: () => Date;
  flushDelayMs?: number;
  initialWaitMs?: number;
}

interface PendingWrite {
  body: Record<string, unknown>;
  /** What `known` records once this write lands: a row's updatedAt or a content fingerprint. */
  fp: string;
}

/** JSON with sorted keys, so two equal objects always give the same string. */
export function stableStringify(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v ?? null);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(',')}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
    .join(',')}}`;
}

/** Plain JSON copy: drops undefined, functions and prototypes, as the store requires. */
function plain<T>(v: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(v)) as Record<string, unknown>;
}

export function sharedSettings(s: Settings): Partial<Settings> {
  const out = { ...s } as Partial<Settings>;
  for (const k of PRIVATE_SETTING_KEYS) delete out[k];
  return out;
}

export function privateSettings(s: Settings): Partial<Settings> {
  const out: Partial<Settings> = {};
  for (const k of PRIVATE_SETTING_KEYS) (out as Record<string, unknown>)[k] = s[k];
  return out;
}

/** Document ids allow letters, digits and _ - . ~ : @ + only. */
export function safeSegment(s: string): string {
  const out = s.replace(/[^A-Za-z0-9_\-.~:@+]/g, '_').slice(0, 180);
  return out === '.' || out === '..' || out === '' ? `_${out}` : out;
}

export function localDayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayOf(iso: string): string {
  const t = new Date(iso);
  return Number.isNaN(t.getTime()) ? iso.slice(0, 10) : localDayKey(t);
}

function mergeNewest<T extends { id: string; updatedAt: string }>(local: T[], incoming: T[]): { rows: T[]; changed: boolean } {
  const byId = new Map(local.map((r) => [r.id, r]));
  let changed = false;
  for (const r of incoming) {
    const mine = byId.get(r.id);
    if (!mine || (r.updatedAt || '') > (mine.updatedAt || '')) {
      byId.set(r.id, r);
      changed = true;
    }
  }
  return { rows: changed ? [...byId.values()] : local, changed };
}

/** Rows that belong to the demo project; never copied into the shared store. */
function sampleFilter(d: AppData): (collection: string, r: Row) => boolean {
  const sampleIds = new Set(d.projects.filter((p) => p.sample).map((p) => p.id));
  return (collection, r) => {
    if (collection === 'projects') return !!r.sample;
    if (collection === 'notes') return (!!r.projectId && sampleIds.has(r.projectId)) || (r.tags || []).includes('sample');
    return !!r.projectId && sampleIds.has(r.projectId);
  };
}

/** Rows from a query snapshot as plain copies (delivered snapshots are frozen; the app edits its rows). */
function rowsOf(snap: QuerySnap): Row[] {
  const rows: Row[] = [];
  for (const d of snap.docs) {
    const body = d.data();
    if (body && typeof body.id === 'string' && typeof body.updatedAt === 'string') rows.push(plain(body) as unknown as Row);
  }
  return rows;
}

class CloudSync {
  private unsubs: Unsubscribe[] = [];
  private storeUnsub: (() => void) | null = null;
  private known = new Map<string, string>();
  private pending = new Map<string, PendingWrite>();
  private inflight = new Set<string>();
  private retries = new Map<string, number>();
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private waitTimer: ReturnType<typeof setTimeout> | null = null;
  private remoteRows = Object.fromEntries(SHARED_COLLECTIONS.map((c) => [c, new Map<string, Row>()])) as Record<SharedCollection, Map<string, Row>>;
  private remoteTime = new Map<string, Row>();
  private remoteConfig: Record<string, unknown> | null = null;
  private remotePrivate: Record<string, unknown> | null = null;
  private activityDocs = new Map<string, { day: string; by: string; entries: ActivityEntry[] }>();
  private knownActivity = new Set<string>();
  private expected = new Set<string>();
  private heard = new Set<string>();
  private ready = false;
  private empty = false;
  private readOnly = false;
  private stopped = false;
  private applying = false;
  private readonly myKey: string;
  private readonly privatePath: string | null;

  constructor(
    private db: ClaudeDb,
    private bridge: StoreBridge,
    private opts: CloudOptions,
  ) {
    this.myKey = safeSegment(opts.uid || opts.deviceKey);
    this.privatePath = opts.uid ? `data/users/${opts.uid}/private` : null;
  }

  private now(): Date {
    return this.opts.now ? this.opts.now() : new Date();
  }

  private rowPath(c: string, id: string) {
    return `${c}/${safeSegment(id)}`;
  }

  private timePath(id: string) {
    return `${this.privatePath}/time/${safeSegment(id)}`;
  }

  start() {
    this.readOnly = this.opts.canWrite === false;
    setStatus({ ...OFF, state: 'connecting', message: 'Connecting to the shared tracker…', privateSync: !!this.privatePath });
    for (const c of SHARED_COLLECTIONS) this.listen(c, this.db.collection(c), (snap) => this.onShared(c, snap));
    this.listenDoc('config', CONFIG_PATH, (snap) => this.onConfig(snap));
    const cutoff = localDayKey(new Date(this.now().getTime() - ACTIVITY_WINDOW_DAYS * 86400000));
    this.listen('activity', this.db.collection(ACTIVITY_COLLECTION).where('day', '>=', cutoff), (snap) => this.onActivity(snap));
    if (this.privatePath) {
      this.listenDoc('private', this.privatePath, (snap) => this.onPrivate(snap));
      this.listen('time', this.db.doc(this.privatePath).collection('time'), (snap) => this.onTime(snap));
    }
    this.waitTimer = setTimeout(() => this.onWaitTimeout(), this.opts.initialWaitMs ?? 8000);
    this.storeUnsub = this.bridge.subscribe(() => this.onLocalChange());
  }

  stop(final: Partial<CloudStatus> = OFF) {
    if (this.stopped) return;
    this.stopped = true;
    for (const u of this.unsubs) {
      try {
        u();
      } catch {
        /* ignore */
      }
    }
    this.unsubs = [];
    this.storeUnsub?.();
    if (this.flushTimer) clearTimeout(this.flushTimer);
    if (this.waitTimer) clearTimeout(this.waitTimer);
    setStatus(final);
  }

  // ---------- reading ----------

  private listen(key: string, q: QueryRef, onSnap: (snap: QuerySnap) => void) {
    this.expected.add(key);
    try {
      this.unsubs.push(
        q.onSnapshot(
          (snap) => {
            if (this.stopped) return;
            onSnap(snap);
            if (!snap.metadata?.fromCache) this.markHeard(key);
          },
          (e) => this.onListenError(key, e),
        ),
      );
    } catch (e) {
      this.onListenError(key, e as DbError);
    }
  }

  private listenDoc(key: string, path: string, onSnap: (snap: DocSnap) => void) {
    this.expected.add(key);
    try {
      this.unsubs.push(
        this.db.doc(path).onSnapshot(
          (snap) => {
            if (this.stopped) return;
            onSnap(snap);
            if (!snap.metadata?.fromCache) this.markHeard(key);
          },
          (e) => this.onListenError(key, e),
        ),
      );
    } catch (e) {
      this.onListenError(key, e as DbError);
    }
  }

  private markHeard(key: string) {
    this.heard.add(key);
    if (!this.ready && [...this.expected].every((k) => this.heard.has(k))) this.reconcile();
  }

  private onWaitTimeout() {
    if (this.ready || this.stopped) return;
    // Reconcile with what arrived as long as every shared collection answered; otherwise keep waiting.
    if (SHARED_COLLECTIONS.every((c) => this.heard.has(c))) this.reconcile();
    else {
      setStatus({ message: 'Still connecting to the shared tracker…' });
      this.waitTimer = setTimeout(() => this.onWaitTimeout(), 8000);
    }
  }

  private onListenError(key: string, e: DbError) {
    const code = e?.code || 'unavailable';
    if (code === 'revoked') return this.stop({ ...status, state: 'stopped', pending: 0, message: 'Access to the shared tracker ended for this visit. Reload the page.' });
    if (code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') return this.stop({ ...status, state: 'stopped', pending: 0, message: 'The shared tracker is not available in this view.' });
    // A private part that cannot be read must not hold up the shared data.
    if (key === 'private' || key === 'time') {
      this.markHeard(key);
      return;
    }
    setStatus({ state: 'error', message: `Could not read ${key} from the shared tracker (${code}). Reload the page to try again.` });
    this.markHeard(key);
  }

  private onShared(c: SharedCollection, snap: QuerySnap) {
    const rows = rowsOf(snap);
    this.remoteRows[c] = new Map(rows.map((r) => [r.id, r]));
    if (!this.ready) return;
    const changed: Row[] = [];
    for (const r of rows) {
      const p = this.rowPath(c, r.id);
      if (this.known.get(p) === r.updatedAt) continue;
      const queued = this.pending.get(p);
      if (queued && queued.fp > r.updatedAt) continue; // our newer edit is on its way
      this.known.set(p, r.updatedAt);
      changed.push(r);
    }
    if (changed.length) this.applyRows(c, changed);
  }

  private applyRows(c: SharedCollection | 'timeEntries', rows: Row[]) {
    const s = this.bridge.getState();
    const { rows: merged, changed } = mergeNewest(s[c] as unknown as Row[], rows);
    if (!changed) return;
    this.applying = true;
    try {
      this.bridge.replaceState({ ...s, [c]: merged } as AppData);
    } finally {
      this.applying = false;
    }
  }

  private onConfig(snap: DocSnap) {
    const body = snap.exists && snap.data() ? plain(snap.data()) : null;
    this.remoteConfig = body;
    if (!this.ready || !body || typeof body.settings !== 'object' || !body.settings) return;
    const shared = body.settings as Partial<Settings>;
    const fp = stableStringify(shared);
    if (this.known.get(CONFIG_PATH) === fp || this.pending.has(CONFIG_PATH)) return;
    this.known.set(CONFIG_PATH, fp);
    const s = this.bridge.getState();
    this.applying = true;
    try {
      this.bridge.replaceState({ ...s, settings: { ...s.settings, ...sharedSettings({ ...s.settings, ...shared } as Settings) } });
    } finally {
      this.applying = false;
    }
  }

  private onPrivate(snap: DocSnap) {
    const body = snap.exists && snap.data() ? plain(snap.data()) : null;
    this.remotePrivate = body;
    if (!this.ready || !body || !this.privatePath) return;
    const content = { settings: body.settings || {}, scratch: body.scratch || {} };
    const fp = stableStringify(content);
    if (this.known.get(this.privatePath) === fp || this.pending.has(this.privatePath)) return;
    this.known.set(this.privatePath, fp);
    const s = this.bridge.getState();
    this.applying = true;
    try {
      this.bridge.replaceState({ ...s, settings: { ...s.settings, ...(content.settings as Partial<Settings>) }, scratch: content.scratch as AppData['scratch'] });
    } finally {
      this.applying = false;
    }
  }

  private onTime(snap: QuerySnap) {
    const rows = rowsOf(snap);
    this.remoteTime = new Map(rows.map((r) => [r.id, r]));
    if (!this.ready) return;
    const changed = rows.filter((r) => {
      const p = this.timePath(r.id);
      if (this.known.get(p) === r.updatedAt) return false;
      const queued = this.pending.get(p);
      if (queued && queued.fp > r.updatedAt) return false;
      this.known.set(p, r.updatedAt);
      return true;
    });
    if (changed.length) this.applyRows('timeEntries', changed);
  }

  private onActivity(snap: QuerySnap) {
    const fresh: ActivityEntry[] = [];
    const people = new Set<string>();
    for (const d of snap.docs) {
      const raw = d.data();
      const body = raw ? (plain(raw) as { day?: string; by?: string; entries?: ActivityEntry[] }) : undefined;
      if (!body || !Array.isArray(body.entries)) continue;
      const entries = body.entries.filter((e) => e && typeof e.id === 'string');
      this.activityDocs.set(d.id, { day: String(body.day || ''), by: String(body.by || ''), entries });
      if (body.by && body.by !== this.myKey) people.add(String(body.by));
      for (const e of entries) {
        if (!this.knownActivity.has(e.id)) fresh.push(e);
        this.knownActivity.add(e.id);
      }
    }
    setStatus({ others: people.size });
    if (!this.ready || !fresh.length) return;
    const s = this.bridge.getState();
    const { rows, changed } = mergeNewest(s.activity, fresh);
    if (!changed) return;
    this.applying = true;
    try {
      this.bridge.replaceState({ ...s, activity: capActivity(rows) });
    } finally {
      this.applying = false;
    }
  }

  // ---------- first connection ----------

  private reconcile() {
    if (this.ready || this.stopped) return;
    if (this.waitTimer) clearTimeout(this.waitTimer);
    const s = this.bridge.getState();
    const anyRemote = SHARED_COLLECTIONS.some((c) => this.remoteRows[c].size > 0) || !!this.remoteConfig;
    if (!anyRemote) {
      this.ready = true;
      this.empty = true;
      setStatus({
        state: 'empty',
        message: this.opts.isOwner
          ? 'The shared tracker is empty. Copy this device’s data into it to start sharing.'
          : 'The shared tracker has no data yet. The owner sets it up from Connections.',
      });
      return;
    }

    const next: AppData = { ...s };
    for (const c of SHARED_COLLECTIONS) {
      const remote = this.remoteRows[c];
      const local = s[c] as unknown as Row[];
      const localById = new Map(local.map((r) => [r.id, r]));
      const out: Row[] = [];
      for (const r of remote.values()) {
        this.known.set(this.rowPath(c, r.id), r.updatedAt);
        const mine = localById.get(r.id);
        if (mine && (mine.updatedAt || '') > (r.updatedAt || '')) {
          out.push(mine);
          this.enqueue(this.rowPath(c, mine.id), mine, mine.updatedAt);
        } else out.push(r);
      }
      // Rows only this device has: keep and share the ones someone made; drop seed rows the team removed.
      for (const mine of local) {
        if (remote.has(mine.id) || this.bridge.isSeedRow(c, mine.id)) continue;
        out.push(mine);
        this.enqueue(this.rowPath(c, mine.id), mine, mine.updatedAt);
      }
      (next as unknown as Record<string, Row[]>)[c] = out;
    }

    const remoteShared = this.remoteConfig && typeof this.remoteConfig.settings === 'object' ? (this.remoteConfig.settings as Partial<Settings>) : null;
    if (remoteShared) {
      next.settings = { ...s.settings, ...sharedSettings({ ...s.settings, ...remoteShared } as Settings) };
      this.known.set(CONFIG_PATH, stableStringify(remoteShared));
    }

    if (this.privatePath) {
      if (this.remotePrivate) {
        const content = { settings: this.remotePrivate.settings || {}, scratch: this.remotePrivate.scratch || {} };
        next.settings = { ...next.settings, ...(content.settings as Partial<Settings>) };
        next.scratch = content.scratch as AppData['scratch'];
        this.known.set(this.privatePath, stableStringify(content));
      }
      const out: Row[] = [];
      const local = s.timeEntries as unknown as Row[];
      const localById = new Map(local.map((r) => [r.id, r]));
      for (const r of this.remoteTime.values()) {
        this.known.set(this.timePath(r.id), r.updatedAt);
        const mine = localById.get(r.id);
        if (mine && (mine.updatedAt || '') > (r.updatedAt || '')) {
          out.push(mine);
          this.enqueue(this.timePath(mine.id), mine, mine.updatedAt);
        } else out.push(r);
      }
      for (const mine of local) {
        if (this.remoteTime.has(mine.id) || this.bridge.isSeedRow('timeEntries', mine.id)) continue;
        out.push(mine);
        this.enqueue(this.timePath(mine.id), mine, mine.updatedAt);
      }
      next.timeEntries = out as unknown as AppData['timeEntries'];
    }

    const remoteEntries = [...this.activityDocs.values()].flatMap((d) => d.entries);
    next.activity = capActivity(mergeNewest(s.activity, remoteEntries).rows);

    this.applying = true;
    try {
      this.bridge.replaceState(next);
    } finally {
      this.applying = false;
    }
    this.ready = true;
    // Settings, private data and diary entries this device has that the store does not.
    this.onLocalChange();
    setStatus(this.readOnly ? { state: 'readonly', message: 'You can read the shared tracker; changes need Editor access.' } : { state: 'live', message: '' });
    if (this.readOnly) this.bridge.setWriteLock(true);
    this.scheduleFlush(0);
  }

  // ---------- writing ----------

  private onLocalChange() {
    if (!this.ready || this.applying || this.stopped || this.empty || this.readOnly) return;
    const s = this.bridge.getState();
    for (const c of SHARED_COLLECTIONS) {
      for (const r of s[c] as unknown as Row[]) {
        const p = this.rowPath(c, r.id);
        const k = this.known.get(p);
        if (k !== r.updatedAt && (!k || (r.updatedAt || '') > k)) this.enqueue(p, r, r.updatedAt);
      }
    }
    const shared = sharedSettings(s.settings);
    const sharedFp = stableStringify(plain(shared));
    if (sharedFp !== this.known.get(CONFIG_PATH)) this.enqueue(CONFIG_PATH, { settings: shared, updatedAt: this.now().toISOString() }, sharedFp);
    if (this.privatePath) {
      const content = { settings: privateSettings(s.settings), scratch: s.scratch || {} };
      const fp = stableStringify(plain(content));
      if (fp !== this.known.get(this.privatePath)) this.enqueue(this.privatePath, { ...content, updatedAt: this.now().toISOString() }, fp);
      for (const r of s.timeEntries as unknown as Row[]) {
        const p = this.timePath(r.id);
        const k = this.known.get(p);
        if (k !== r.updatedAt && (!k || (r.updatedAt || '') > k)) this.enqueue(p, r, r.updatedAt);
      }
    }
    const fresh = s.activity.filter((a) => !this.knownActivity.has(a.id));
    if (fresh.length) this.queueActivity(fresh);
  }

  private queueActivity(entries: ActivityEntry[]) {
    const cutoff = localDayKey(new Date(this.now().getTime() - ACTIVITY_WINDOW_DAYS * 86400000));
    const byDay = new Map<string, ActivityEntry[]>();
    for (const e of entries) {
      const day = dayOf(e.at);
      if (day < cutoff) continue;
      byDay.set(day, [...(byDay.get(day) || []), e]);
    }
    for (const [day, list] of byDay) {
      const docId = `${day}_${this.myKey}`;
      const path = `${ACTIVITY_COLLECTION}/${docId}`;
      const have = this.activityDocs.get(docId)?.entries || [];
      const queued = (this.pending.get(path)?.body.entries as ActivityEntry[] | undefined) || [];
      const merged = mergeNewest(mergeNewest(have, queued).rows, list)
        .rows.sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, ACTIVITY_PER_DOC);
      this.enqueue(path, { day, by: this.myKey, entries: merged }, `activity:${merged.length}:${merged[0]?.id || ''}`);
    }
  }

  private enqueue(path: string, body: unknown, fp: string) {
    if (this.readOnly || this.stopped) return;
    this.pending.set(path, { body: plain(body), fp });
    setStatus({ pending: this.pending.size + this.inflight.size });
    this.scheduleFlush();
  }

  private scheduleFlush(delay = this.opts.flushDelayMs ?? 1200) {
    if (this.stopped || !this.ready) return;
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.flush(), delay);
  }

  /** Write everything queued, at most four documents at once and never two writes to one document. */
  async flush(): Promise<void> {
    this.flushTimer = null;
    if (this.readOnly || this.stopped) return;
    const queue = [...this.pending.entries()].filter(([p]) => !this.inflight.has(p));
    const worker = async () => {
      for (;;) {
        const next = queue.shift();
        if (!next) return;
        const [path, item] = next;
        if (this.pending.get(path) !== item || this.inflight.has(path)) continue;
        this.pending.delete(path);
        this.inflight.add(path);
        setStatus({ pending: this.pending.size + this.inflight.size });
        try {
          await this.db.doc(path).set(item.body);
          this.onWritten(path, item);
        } catch (e) {
          this.onWriteError(path, item, e as DbError);
        } finally {
          this.inflight.delete(path);
          setStatus({ pending: this.pending.size + this.inflight.size });
        }
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    if (this.pending.size && !this.stopped && !this.readOnly) this.scheduleFlush();
  }

  private onWritten(path: string, item: PendingWrite) {
    this.retries.delete(path);
    if (path.startsWith(`${ACTIVITY_COLLECTION}/`)) {
      const docId = path.slice(ACTIVITY_COLLECTION.length + 1);
      const entries = (item.body.entries as ActivityEntry[]) || [];
      this.activityDocs.set(docId, { day: String(item.body.day), by: this.myKey, entries });
      for (const e of entries) this.knownActivity.add(e.id);
    } else {
      // Keep the newer of what landed and what the store already confirmed.
      const k = this.known.get(path);
      if (!k || item.fp >= k || !/^\d{4}-/.test(item.fp)) this.known.set(path, item.fp);
    }
    if (status.state === 'error') setStatus({ state: 'live', message: '' });
    setStatus({ lastSavedAt: this.now().toISOString() });
  }

  private requeue(path: string, item: PendingWrite, delay: number) {
    if (!this.pending.has(path)) this.pending.set(path, item);
    setStatus({ pending: this.pending.size + this.inflight.size });
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.flush(), delay);
  }

  private onWriteError(path: string, item: PendingWrite, e: DbError) {
    const code = e?.code || 'unavailable';
    if (code === 'invalid_argument') {
      if (this.opts.canWrite !== true) return this.goReadOnly('Your access to this tracker is view-only, so changes stay on this device. Ask the owner to share it with you as an Editor.');
      setStatus({ state: 'error', message: `One change could not be saved (${path.split('/')[0]}): ${e.message || code}.` });
      return;
    }
    if (code === 'quota_exceeded') {
      setStatus({ state: 'error', message: 'The shared tracker is full. Delete old activity or ask the owner to archive finished projects.' });
      return;
    }
    if (code === 'revoked') return this.stop({ ...status, state: 'stopped', pending: 0, message: 'Access to the shared tracker ended for this visit. Reload the page.' });
    if (code === 'not_granted' || code === 'capability_disabled' || code === 'capability_removed') return this.stop({ ...status, state: 'stopped', pending: 0, message: 'Saving to the shared tracker is not available in this view.' });
    if (code === 'resource_exhausted') return this.requeue(path, item, 10_000);
    const n = (this.retries.get(path) || 0) + 1;
    this.retries.set(path, n);
    if (n <= 3) return this.requeue(path, item, 1500 * n + Math.floor(Math.random() * 1000));
    setStatus({ state: 'error', message: 'Saving to the shared tracker keeps failing. Your changes are kept on this device; reload the page to try again.' });
  }

  private goReadOnly(message: string) {
    this.readOnly = true;
    this.pending.clear();
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.bridge.setWriteLock(true);
    setStatus({ state: 'readonly', message, pending: 0 });
  }

  /** Owner action: copy everything on this device (except the demo project) into the shared store. */
  pushEverything(): number {
    if (this.readOnly || this.stopped) return 0;
    this.empty = false;
    this.ready = true;
    const s = this.bridge.getState();
    const isSample = sampleFilter(s);
    let n = 0;
    for (const c of SHARED_COLLECTIONS) {
      for (const r of s[c] as unknown as Row[]) {
        if (isSample(c, r)) continue;
        this.enqueue(this.rowPath(c, r.id), r, r.updatedAt);
        n += 1;
      }
    }
    const shared = sharedSettings(s.settings);
    this.enqueue(CONFIG_PATH, { settings: shared, updatedAt: this.now().toISOString() }, stableStringify(plain(shared)));
    if (this.privatePath) {
      const content = { settings: privateSettings(s.settings), scratch: s.scratch || {} };
      this.enqueue(this.privatePath, { ...content, updatedAt: this.now().toISOString() }, stableStringify(plain(content)));
      for (const r of s.timeEntries as unknown as Row[]) if (!isSample('timeEntries', r)) this.enqueue(this.timePath(r.id), r, r.updatedAt);
    }
    this.queueActivity(s.activity);
    // The demo project never goes into the shared tracker, so it leaves this copy too: everyone sees the same thing.
    const next = { ...s } as unknown as Record<string, Row[]>;
    for (const c of [...SHARED_COLLECTIONS, 'timeEntries'] as const) next[c] = (s[c] as unknown as Row[]).filter((r) => !isSample(c, r));
    this.applying = true;
    try {
      this.bridge.replaceState(next as unknown as AppData);
    } finally {
      this.applying = false;
    }
    setStatus({ state: 'live', message: '' });
    this.scheduleFlush(0);
    return n;
  }
}

let active: CloudSync | null = null;
let lastArgs: [ClaudeDb, StoreBridge, CloudOptions] | null = null;

/** Start keeping the store in step with the shared tracker. Returns a stop function. */
export function startCloud(db: ClaudeDb, bridge: StoreBridge, opts: CloudOptions): () => void {
  active?.stop();
  lastArgs = [db, bridge, opts];
  const sync = new CloudSync(db, bridge, opts);
  active = sync;
  sync.start();
  return () => {
    if (active === sync) {
      sync.stop();
      active = null;
    }
  };
}

/** Owner action from Connections: copy this device's data into an empty (or behind) shared store. */
export function pushEverythingToCloud(): number {
  return active ? active.pushEverything() : 0;
}

/** Save queued changes now (tests, "Save now"). */
export async function flushCloud(): Promise<void> {
  await active?.flush();
}

/** Reconnect from scratch, e.g. after an error. */
export function restartCloud() {
  if (!lastArgs) return;
  startCloud(...lastArgs);
}

/** Stop syncing (leaving the shared tracker on this device). The local copy stays as it is. */
export function stopCloud() {
  active?.stop();
  active = null;
  lastArgs = null;
}

/** The view could not open the shared store at all (db capability missing). */
export function markCloudUnavailable(message: string) {
  setStatus({ ...OFF, state: 'stopped', message });
}

/** Tests only: forget every engine and status. */
export function resetCloudForTests() {
  active?.stop();
  active = null;
  lastArgs = null;
  status = OFF;
}
