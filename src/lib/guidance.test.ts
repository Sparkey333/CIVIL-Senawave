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
    const p = fluenceProject();
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
  it('reflects the state it is given', () => {
    const d = seedData();
    const items = setupChecklist(d, { googleSignedIn: false, googleConfigured: false, driveSnapshot: false });
    expect(items.find((i) => i.id === 'project')?.done).toBe(true); // Fluence is seeded
    expect(items.find((i) => i.id === 'google')?.done).toBe(false);
    d.settings.hourlyRate = 75;
    expect(setupChecklist(d, { googleSignedIn: true, googleConfigured: true, driveSnapshot: true }).filter((i) => !i.done).map((i) => i.id)).toEqual(['gmail', 'sync']);
  });
});
