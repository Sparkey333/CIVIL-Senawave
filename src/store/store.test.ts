import { beforeEach, describe, expect, it } from 'vitest';
import * as S from './store';
import { seedData } from './seed';
import { parseAnalysis } from '@/lib/prints';
import { DATA_VERSION } from '@/lib/types';

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
    expect(m.version).toBe(DATA_VERSION);
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

describe('prints, redlines and analysis', () => {
  it('seeds Fluence with two prints, 13 open redlines and an analysis on the latest print', () => {
    const v = S.getView();
    expect(v.prints.filter((p) => p.projectId === 'prj_fluence')).toHaveLength(2);
    expect(v.redlines.filter((r) => r.status === 'open')).toHaveLength(13);
    expect(v.prints.find((p) => p.status === 'redlined')?.analysis?.findings.length).toBeGreaterThan(5);
  });

  it('adds a print and a redline, logs them for the evening log, and tracks status changes', () => {
    const p = S.newPrint('prj_fluence', { label: '2026-10-02_Fluence_3.pdf' });
    S.addPrint(p);
    const r = S.newRedline('prj_fluence', p.id, { sheet: 'COVER', text: 'Add seal block' });
    S.addRedline(r);
    S.updateRedline(r.id, { status: 'addressed', response: 'Done in print 3' });
    S.updatePrint(p.id, { status: 'issued' });
    const labels = S.getView().activity.map((a) => a.label);
    expect(labels.some((l) => l.startsWith('Print logged: 2026-10-02_Fluence_3.pdf'))).toBe(true);
    expect(labels.some((l) => l.includes('Redline on COVER: Add seal block'))).toBe(true);
    expect(labels.some((l) => l.includes('Redline addressed on COVER'))).toBe(true);
    expect(labels.some((l) => l.includes('Issued'))).toBe(true);
    expect(S.getView().redlines.find((x) => x.id === r.id)).toMatchObject({ status: 'addressed', response: 'Done in print 3' });
  });

  it('deleting a print buries its redlines and undo brings them back; other prints keep theirs', () => {
    const v1 = 'prt_fluence_2026-10-01_v1';
    const v2 = 'prt_fluence_2026-10-01_v2';
    S.addRedline(S.newRedline('prj_fluence', v1, { text: 'old note' }));
    S.deletePrint(v2);
    expect(S.getView().prints.some((p) => p.id === v2)).toBe(false);
    expect(S.getView().redlines.filter((r) => r.printId === v2)).toEqual([]);
    expect(S.getView().redlines.filter((r) => r.printId === v1)).toHaveLength(1);
    S.restorePrint(v2);
    expect(S.getView().prints.some((p) => p.id === v2)).toBe(true);
    expect(S.getView().redlines.filter((r) => r.printId === v2)).toHaveLength(13);
  });

  it('deleting a project buries its prints and redlines, restoring brings them back', () => {
    S.deleteProject('prj_fluence');
    expect(S.getView().prints.filter((p) => p.projectId === 'prj_fluence')).toEqual([]);
    expect(S.getView().redlines.filter((r) => r.projectId === 'prj_fluence')).toEqual([]);
    S.restoreProject('prj_fluence');
    expect(S.getView().prints.filter((p) => p.projectId === 'prj_fluence')).toHaveLength(2);
    expect(S.getView().redlines.filter((r) => r.projectId === 'prj_fluence')).toHaveLength(13);
  });

  it('stores a pasted analysis, lets findings be ticked off, and keeps the rest', () => {
    const id = 'prt_fluence_2026-10-01_v1';
    const parsed = parseAnalysis(JSON.stringify({ summary: 'ok', changes: [], findings: [{ severity: 'low', issue: 'a' }, { severity: 'high', issue: 'b' }], basis: 'text only' }));
    if (!parsed.ok) throw new Error(parsed.error);
    S.setPrintAnalysis(id, parsed.analysis);
    const a = S.getView().prints.find((p) => p.id === id)!.analysis!;
    expect(a.findings).toHaveLength(2);
    S.updateFinding(id, a.findings[0].id, { status: 'done' });
    const after = S.getView().prints.find((p) => p.id === id)!.analysis!;
    expect(after.findings.map((f) => f.status)).toEqual(['done', 'open']);
    expect(S.getView().activity.some((x) => x.label.includes('AI analysis added'))).toBe(true);
  });

  it('adds the Fluence prints once to older data, and not again after they were deleted', () => {
    const old = { ...seedData(), prints: [], redlines: [] };
    const m = S.migrate(old);
    expect(m.prints).toHaveLength(2);
    expect(m.redlines).toHaveLength(13);
    const deleted = { ...seedData(), prints: seedData().prints.map((p) => ({ ...p, deletedAt: new Date().toISOString() })), redlines: [] };
    const m2 = S.migrate(deleted);
    expect(m2.prints).toHaveLength(2);
    expect(m2.redlines).toHaveLength(0);
  });

  it('survives data saved by an older build that has no prints or redlines at all', () => {
    const legacy = { ...seedData() } as Record<string, unknown>;
    delete legacy.prints;
    delete legacy.redlines;
    expect(S.validateAppData(legacy)).toBeNull();
    expect(() => S.applyRemote(legacy)).not.toThrow();
  });
});
