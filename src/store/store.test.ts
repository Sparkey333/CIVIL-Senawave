import { beforeEach, describe, expect, it } from 'vitest';
import * as S from './store';
import { seedData } from './seed';

beforeEach(() => {
  localStorage.clear();
  S.setState(seedData(), { touch: false });
});

describe('soft delete and undo', () => {
  it('hides a deleted note from the view but keeps it in the raw state as a tombstone', () => {
    const id = S.getView().notes[0].id;
    S.deleteNote(id);
    expect(S.getView().notes.some((n) => n.id === id)).toBe(false);
    const raw = S.getState().notes.find((n) => n.id === id);
    expect(raw?.deletedAt).toBeTruthy();
    S.restoreEntity('notes', id);
    expect(S.getView().notes.some((n) => n.id === id)).toBe(true);
    expect(S.getState().notes.find((n) => n.id === id)?.deletedAt).toBeNull();
  });

  it('deleting a project buries its permits and restoring brings them back together', () => {
    const p = S.getView().projects.find((x) => x.id === 'prj_sample_1')!;
    const permitIds = S.getView().permits.filter((x) => x.projectId === p.id).map((x) => x.id);
    expect(permitIds.length).toBeGreaterThan(0);
    const before = S.getView().projects.length;
    S.deleteProject(p.id);
    expect(S.getView().projects.length).toBe(before - 1);
    expect(S.getView().permits.filter((x) => x.projectId === p.id)).toEqual([]);
    S.restoreProject(p.id);
    expect(S.getView().projects.some((x) => x.id === p.id)).toBe(true);
    expect(S.getView().permits.filter((x) => x.projectId === p.id).map((x) => x.id).sort()).toEqual(permitIds.sort());
  });

  it('removeSampleData tombstones instead of dropping, so the removal syncs', () => {
    S.removeSampleData();
    expect(S.hasSampleData(S.getView())).toBe(false);
    expect(S.getView().projects.some((p) => p.sample)).toBe(false);
    expect(S.getView().projects.some((p) => p.id === 'prj_fluence')).toBe(true);
    expect(S.getState().projects.find((p) => p.id === 'prj_sample_1')?.deletedAt).toBeTruthy();
    expect(S.getView().notes.some((n) => n.id === 'note_welcome')).toBe(true);
  });

  it('stamps updatedBy with the current actor', () => {
    S.setActor('Jesse Montgomery');
    const id = S.getView().notes[0].id;
    S.updateNote(id, { title: 'edited' });
    expect(S.getView().notes.find((n) => n.id === id)?.updatedBy).toBe('Jesse Montgomery');
    S.setActor('');
  });
});

describe('import validation and migration', () => {
  it('refuses JSON that is not a tracker file', () => {
    expect(S.importJson('{"hello":1}', 'merge').ok).toBe(false);
    expect(S.importJson('[1,2]', 'merge').ok).toBe(false);
    expect(S.importJson('{"projects":[{"name":"no id"}]}', 'merge').ok).toBe(false);
    expect(S.importJson('not json', 'merge').ok).toBe(false);
  });

  it('migrate tolerates garbage and fills defaults', () => {
    expect(S.migrate(null).projects.length).toBe(2);
    const m = S.migrate({ projects: [], settings: { ownerName: 'X' } });
    expect(m.settings.ownerName).toBe('X');
    expect(m.settings.syncTimeEntries).toBe(true);
    expect(m.team.length).toBe(4);
    expect(m.version).toBe(3);
  });

  it('applyRemote throws on a broken Drive file instead of merging it', () => {
    expect(() => S.applyRemote({ nope: true })).toThrow(/not a tracker file/);
  });
});

describe('backups', () => {
  it('snapshots before a destructive import, keeps only the newest few, and restores', () => {
    const originalTitle = S.getView().notes[0].title;
    S.importJson(JSON.stringify({ ...seedData(), notes: [] }), 'replace');
    expect(S.getView().notes.length).toBe(0);
    const backups = S.listBackups();
    expect(backups.length).toBe(1);
    expect(backups[0].reason).toBe('before-import-replace');
    const r = S.restoreBackup(backups[0].key);
    expect(r.ok).toBe(true);
    expect(S.getView().notes[0].title).toBe(originalTitle);
    for (let i = 0; i < 5; i++) S.snapshot(`extra-${i}`);
    expect(S.listBackups().length).toBe(S.BACKUPS_KEPT);
  });

  it('persists to localStorage after the debounce', () => {
    S.updateSettings({ ownerName: 'Persisted Name' });
    S.flushPersist();
    expect(JSON.parse(localStorage.getItem(S.STORAGE_KEY) || '{}').settings.ownerName).toBe('Persisted Name');
  });
});

describe('activity log', () => {
  it('records status, workflow, sheet and note changes for the evening log', () => {
    S.setState(seedData(), { touch: false });
    const p = S.getView().projects.find((x) => x.id === 'prj_fluence')!;
    S.updateProject(p.id, { status: 'qc' });
    S.updateProject(p.id, (x) => ({ workflow: { ...x.workflow, 'start-units': true } }));
    S.updateProject(p.id, (x) => ({ sheets: x.sheets.map((s) => ({ ...s, aligned: true })) }));
    S.addNote(S.newNote('me', { title: 'hello', projectId: p.id, type: 'action' }));
    S.addTimeEntry(S.newTimeEntry({ projectId: p.id, hours: 2, description: 'work' }));
    const today = S.localDay(new Date().toISOString());
    const labels = S.activityOn(S.getView(), today).map((a) => a.label);
    expect(labels.some((l) => /status → QC/.test(l))).toBe(true);
    expect(labels.some((l) => /done — SENAUNITS/.test(l))).toBe(true);
    expect(labels.some((l) => /PLAN-01 aligned/.test(l))).toBe(true);
    expect(labels.some((l) => /action: hello/.test(l))).toBe(true);
    expect(labels.some((l) => /2 h — work/.test(l))).toBe(true);
  });

  it('adds the Fluence project once to older data, but not after it was deleted', () => {
    const old = { ...seedData(), projects: [], notes: [] };
    expect(S.migrate(old).projects.some((p) => p.id === 'prj_fluence')).toBe(true);
    const deleted = { ...seedData(), projects: [{ ...seedData().projects[0], deletedAt: new Date().toISOString() }] };
    const m = S.migrate(deleted);
    expect(m.projects.filter((p) => p.id === 'prj_fluence').length).toBe(1);
    expect(m.projects[0].deletedAt).toBeTruthy();
  });
});
