import { describe, expect, it } from 'vitest';
import { nextStepFor, sectionTab, setupChecklist } from './guidance';
import { fluenceProject, sampleProject, seedData } from '@/store/seed';
import { QC_CHECKLIST, WORKFLOW_STEPS } from '@/data/guide';

describe('nextStepFor', () => {
  it('asks for the route length first', () => {
    const p = { ...fluenceProject(), routeLengthFt: null };
    expect(nextStepFor(p).kind).toBe('route');
  });

  it('points at the first unchecked workflow step in guide order', () => {
    const p = { ...fluenceProject(), workflow: { 'start-new': true, 'gis-index': true } as Record<string, boolean> };
    const s = nextStepFor(p);
    expect(s.kind).toBe('workflow');
    expect(s.stepId).toBe(WORKFLOW_STEPS.find((w) => !p.workflow[w.id])!.id);
    expect(s.guideTo).toMatch(/^\/reference\//);
  });

  it('moves to per-sheet work once layouts are copied and sheets exist', () => {
    const p = sampleProject();
    const wf: Record<string, boolean> = {};
    for (const w of WORKFLOW_STEPS) if (!/^(sheet-|fin-)/.test(w.id)) wf[w.id] = true;
    const s = nextStepFor({ ...p, workflow: wf });
    expect(s.kind).toBe('sheet-work');
    expect(s.title).toMatch(/^PLAN-03/); // first sheet not fully done in the sample is PLAN-03 (titleblock)
  });

  it('asks for the sheet tracker when layouts are copied but no rows exist', () => {
    const p = { ...fluenceProject(), sheets: [], workflow: { 'cad-layouts': true } };
    expect(nextStepFor(p).kind).toBe('sheets');
  });

  it('falls through to QC, then review, then done', () => {
    const all: Record<string, boolean> = Object.fromEntries(WORKFLOW_STEPS.map((w) => [w.id, true]));
    const doneSheets = fluenceProject().sheets.map((s) => ({ ...s, aligned: true, clipped: true, sidePanel: true, titleblock: true, qcDone: true }));
    const p = { ...fluenceProject(), workflow: all, sheets: doneSheets };
    expect(nextStepFor(p).kind).toBe('qc');
    const qc: Record<string, boolean> = Object.fromEntries(QC_CHECKLIST.map((q) => [q.id, true]));
    expect(nextStepFor({ ...p, qc }).kind).toBe('review');
    expect(nextStepFor({ ...p, qc, status: 'sealed' }).kind).toBe('done');
    expect(nextStepFor({ ...p, status: 'closed' }).kind).toBe('done');
  });

  it('maps guide sections to reference tabs', () => {
    expect(sectionTab('4.6–4.7')).toBe('arcgis');
    expect(sectionTab('6.2')).toBe('sheets');
    expect(sectionTab('10–11')).toBe('plot');
    expect(sectionTab('x')).toBe('workflow');
  });
});

describe('setupChecklist', () => {
  const base = { isOwner: true, googleConfigured: false, driveSnapshot: false, backupAt: null, sharedWithTeam: false };

  it('claude.ai mode: shared store, connectors, sharing with Jesse (owner only), rate and a backup', () => {
    const d = seedData();
    const items = setupChecklist(d, { ...base, mode: 'claude', cloud: { state: 'connecting', others: 0 }, connectors: { drive: { ready: false, missing: false }, gmail: { ready: false, missing: true } } });
    expect(items.map((i) => i.id)).toEqual(['shared', 'drive', 'design', 'gmail', 'share', 'rate', 'backup']);
    expect(items.find((i) => i.id === 'gmail')?.hint).toMatch(/Connectors/);
    const later = setupChecklist(
      { ...d, settings: { ...d.settings, hourlyRate: 90 } },
      { ...base, mode: 'claude', cloud: { state: 'live', others: 1 }, connectors: { drive: { ready: true, missing: false }, gmail: { ready: true, missing: false } }, driveSnapshot: true, backupAt: new Date().toISOString() },
    );
    expect(later.every((i) => i.done)).toBe(true);
    // Jesse sees no "share" step.
    expect(setupChecklist(d, { ...base, isOwner: false, mode: 'claude', cloud: { state: 'live', others: 0 } }).some((i) => i.id === 'share')).toBe(false);
  });

  it('offline mode asks for a backup this week and the rate; a week-old backup is due again', () => {
    const d = seedData();
    const now = Date.parse('2026-10-10T12:00:00Z');
    const items = setupChecklist(d, { ...base, mode: 'offline', backupAt: '2026-10-01T12:00:00Z', now });
    expect(items.map((i) => [i.id, i.done])).toEqual([['backup', false], ['rate', false]]);
    expect(setupChecklist(d, { ...base, mode: 'offline', backupAt: '2026-10-09T12:00:00Z', now })[0].done).toBe(true);
  });

  it('google mode follows the Drive file, the folder and Gmail switches', () => {
    const d = seedData();
    d.settings.driveFileId = 'abc';
    d.settings.hourlyRate = 75;
    expect(setupChecklist(d, { ...base, mode: 'google', driveSnapshot: true }).filter((i) => !i.done).map((i) => i.id)).toEqual(['gmail']);
  });
});
