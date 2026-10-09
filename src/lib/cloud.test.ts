import { afterEach, describe, expect, it } from 'vitest';
import type { AppData } from './types';
import type { ClaudeDb, CollectionRef, DbError, DocRef, DocSnap, QueryRef, QuerySnap } from './claude/runtime';
import { flushCloud, getCloudStatus, pushEverythingToCloud, resetCloudForTests, safeSegment, startCloud, stableStringify, type StoreBridge } from './cloud';
import { seedData, seedRowKeys } from '@/store/seed';

// ---------- an in-memory stand-in for the artifact's document store ----------

type Body = Record<string, unknown>;

function deepFreeze<T>(o: T): T {
  if (o && typeof o === 'object') {
    Object.freeze(o);
    for (const v of Object.values(o as object)) deepFreeze(v);
  }
  return o;
}

class FakeDb implements ClaudeDb {
  docs = new Map<string, Body>();
  writes: string[] = [];
  private listeners = new Set<() => void>();
  /** Return an error to refuse a write to that path. */
  refuse: ((path: string) => DbError | null) | null = null;

  doc(path: string): DocRef {
    const db = this;
    const snap = (): DocSnap => {
      const body = db.docs.get(path);
      return { id: path.split('/').pop()!, exists: !!body, data: () => (body ? deepFreeze(structuredClone(body)) : undefined), metadata: { fromCache: false, hasPendingWrites: false } };
    };
    return {
      id: path.split('/').pop()!,
      path,
      get: async () => snap(),
      set: async (data: Body) => {
        await Promise.resolve();
        const err = db.refuse?.(path);
        if (err) throw err;
        db.docs.set(path, structuredClone(data));
        db.writes.push(path);
        db.notify();
      },
      delete: async () => {
        db.docs.delete(path);
        db.notify();
      },
      onSnapshot: (next) => db.listen(() => next(snap())),
      collection: (sub: string) => db.collection(`${path}/${sub}`),
    };
  }

  collection(path: string): CollectionRef {
    const q = this.query(path, []);
    return { ...q, path, doc: (id?: string) => this.doc(`${path}/${id ?? Math.random().toString(36).slice(2)}`) };
  }

  private query(path: string, filters: [string, string, unknown][]): QueryRef {
    const db = this;
    const snap = (): QuerySnap => {
      const docs: DocSnap[] = [];
      for (const [p, body] of db.docs) {
        if (!p.startsWith(`${path}/`) || p.slice(path.length + 1).includes('/')) continue;
        if (!filters.every(([f, op, v]) => (op === '>=' ? String(body[f]) >= String(v) : body[f] === v))) continue;
        docs.push({ id: p.split('/').pop()!, exists: true, data: () => deepFreeze(structuredClone(body)), metadata: { fromCache: false, hasPendingWrites: false } });
      }
      return { docs, size: docs.length, empty: docs.length === 0, metadata: { fromCache: false, hasPendingWrites: false } };
    };
    return {
      where: (f, op, v) => db.query(path, [...filters, [f, op, v]]),
      orderBy: () => db.query(path, filters),
      limit: () => db.query(path, filters),
      get: async () => snap(),
      onSnapshot: (next) => db.listen(() => next(snap())),
    };
  }

  private listen(fire: () => void) {
    this.listeners.add(fire);
    setTimeout(fire, 0);
    return () => void this.listeners.delete(fire);
  }

  private notify() {
    for (const l of [...this.listeners]) setTimeout(l, 0);
  }

  /** Someone else writes a document. */
  remoteSet(path: string, body: object) {
    this.docs.set(path, structuredClone(body) as Body);
    this.notify();
  }
}

function memBridge(initial: AppData) {
  let st = initial;
  const ls = new Set<() => void>();
  const seedKeys = seedRowKeys();
  const b: StoreBridge & { locked: boolean; edit(fn: (d: AppData) => AppData): void } = {
    locked: false,
    getState: () => st,
    replaceState: (n) => {
      st = n;
      for (const l of ls) l();
    },
    subscribe: (fn) => {
      ls.add(fn);
      return () => ls.delete(fn);
    },
    setWriteLock: (v) => {
      b.locked = v;
    },
    isSeedRow: (c, id) => seedKeys.has(`${c}:${id}`),
    edit: (fn) => {
      st = fn(st);
      for (const l of ls) l();
    },
  };
  return b;
}

const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const opts = { uid: 'u_brandon', deviceKey: 'dev_1', canWrite: true as boolean | null, isOwner: true, flushDelayMs: 1, initialWaitMs: 40 };

afterEach(() => resetCloudForTests());

describe('shared tracker sync', () => {
  it('reports an empty store, and the owner copies this device in without the sample project', async () => {
    const db = new FakeDb();
    const bridge = memBridge(seedData());
    startCloud(db, bridge, opts);
    await tick(60);
    expect(getCloudStatus().state).toBe('empty');
    expect(db.writes).toEqual([]);

    const n = pushEverythingToCloud();
    expect(n).toBeGreaterThan(10);
    await tick(60);
    await flushCloud();
    expect(getCloudStatus().state).toBe('live');
    expect(db.docs.has('projects/prj_fluence')).toBe(true);
    expect(db.docs.has('projects/prj_sample_1')).toBe(false);
    expect(db.docs.has('notes/note_sample_redline')).toBe(false);
    expect(db.docs.has('redlines/red_fluence_v2_01')).toBe(true);
    expect(db.docs.has('config/shared')).toBe(true);
    // The rate and theme never reach the shared settings; they go to the owner's private document.
    const shared = db.docs.get('config/shared')!.settings as Record<string, unknown>;
    expect('hourlyRate' in shared).toBe(false);
    expect('theme' in shared).toBe(false);
    expect(db.docs.has('data/users/u_brandon/private')).toBe(true);
    // ...and the demo project leaves this copy, so the owner sees what the team sees.
    expect(bridge.getState().projects.some((p) => p.id === 'prj_sample_1')).toBe(false);
    expect(bridge.getState().timeEntries.some((t) => t.projectId === 'prj_sample_1')).toBe(false);
  });

  it('joins a store that has data: remote wins unless this device is newer, seed rows the team lacks are dropped', async () => {
    const db = new FakeDb();
    const remote = seedData();
    const fluence = { ...remote.projects.find((p) => p.id === 'prj_fluence')!, name: 'Fluence (renamed by Jesse)', updatedAt: '2030-01-01T00:00:00.000Z' };
    db.remoteSet('projects/prj_fluence', fluence);
    db.remoteSet('config/shared', { settings: { ownerName: 'Brandon Barkey', designFolderUrl: 'https://x' } });

    const local = seedData();
    local.notes = [...local.notes, { ...local.notes[0], id: 'note_mine', title: 'only on this device', updatedAt: '2026-10-02T21:00:00.000Z' }];
    const bridge = memBridge(local);
    startCloud(db, bridge, opts);
    await tick(80);
    await flushCloud();

    const st = bridge.getState();
    expect(getCloudStatus().state).toBe('live');
    expect(st.projects.find((p) => p.id === 'prj_fluence')?.name).toBe('Fluence (renamed by Jesse)');
    expect(st.projects.some((p) => p.id === 'prj_sample_1')).toBe(false); // seed row the team does not have
    expect(st.notes.some((n) => n.id === 'note_mine')).toBe(true); // made here: kept and shared
    expect(db.docs.has('notes/note_mine')).toBe(true);
    expect(st.settings.designFolderUrl).toBe('https://x');
    // Snapshots arrive frozen; the store must get copies it can change.
    expect(Object.isFrozen(st.projects.find((p) => p.id === 'prj_fluence'))).toBe(false);
  });

  it('writes local edits and applies other people\'s edits as they arrive', async () => {
    const db = new FakeDb();
    db.remoteSet('projects/prj_fluence', seedData().projects[0]);
    const bridge = memBridge(seedData());
    startCloud(db, bridge, opts);
    await tick(80);

    bridge.edit((d) => ({ ...d, projects: d.projects.map((p) => (p.id === 'prj_fluence' ? { ...p, status: 'permitting', updatedAt: '2031-01-01T00:00:00.000Z' } : p)) }));
    await tick(30);
    await flushCloud();
    expect((db.docs.get('projects/prj_fluence') as { status: string }).status).toBe('permitting');

    db.remoteSet('projects/prj_fluence', { ...(db.docs.get('projects/prj_fluence') as object), status: 'sealed', updatedAt: '2032-01-01T00:00:00.000Z' });
    await tick(30);
    expect(bridge.getState().projects.find((p) => p.id === 'prj_fluence')?.status).toBe('sealed');
  });

  it('goes read-only when claude.ai refuses a save and did not say whether this person may write', async () => {
    const db = new FakeDb();
    db.remoteSet('projects/prj_fluence', seedData().projects[0]);
    db.refuse = () => ({ code: 'invalid_argument', message: 'below the write level' });
    const bridge = memBridge(seedData());
    startCloud(db, bridge, { ...opts, canWrite: null, isOwner: false, uid: null });
    await tick(80);
    bridge.edit((d) => ({ ...d, projects: d.projects.map((p) => (p.id === 'prj_fluence' ? { ...p, status: 'qc', updatedAt: '2031-01-01T00:00:00.000Z' } : p)) }));
    await tick(30);
    await flushCloud();
    expect(getCloudStatus().state).toBe('readonly');
    expect(bridge.locked).toBe(true);
  });

  it('keeps the time log and rate private to the person, and writes the diary per person per day', async () => {
    const db = new FakeDb();
    db.remoteSet('projects/prj_fluence', seedData().projects[0]);
    const bridge = memBridge(seedData());
    startCloud(db, bridge, opts);
    await tick(80);
    const at = new Date().toISOString();
    bridge.edit((d) => ({
      ...d,
      settings: { ...d.settings, hourlyRate: 95 },
      timeEntries: [...d.timeEntries, { id: 'tme_real', projectId: 'prj_fluence', date: at.slice(0, 10), hours: 2, description: 'review', billable: true, invoiced: false, createdAt: at, updatedAt: at }],
      activity: [{ id: 'act_1', at, kind: 'time', label: '2 h — review', projectId: 'prj_fluence', by: 'Brandon Barkey', updatedAt: at }],
    }));
    await tick(30);
    await flushCloud();
    expect((db.docs.get('data/users/u_brandon/private') as { settings: { hourlyRate: number } }).settings.hourlyRate).toBe(95);
    expect(db.docs.has('data/users/u_brandon/private/time/tme_real')).toBe(true);
    expect([...db.docs.keys()].some((k) => k.startsWith('timeEntries/'))).toBe(false);
    const diary = [...db.docs.keys()].find((k) => k.startsWith('activity/'));
    expect(diary).toMatch(/^activity\/\d{4}-\d{2}-\d{2}_u_brandon$/);
  });
});

describe('helpers', () => {
  it('makes document ids safe and stable JSON for fingerprints', () => {
    expect(safeSegment('prt_fluence_2026-10-01_v2')).toBe('prt_fluence_2026-10-01_v2');
    expect(safeSegment('a/b c')).toBe('a_b_c');
    expect(safeSegment('..')).toBe('_..');
    expect(stableStringify({ b: 1, a: [2, { d: 1, c: undefined }] })).toBe('{"a":[2,{"d":1}],"b":1}');
  });
});
