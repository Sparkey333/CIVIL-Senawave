import { describe, expect, it } from 'vitest';
import { nextBabySteps, projectSteps, whoLabel } from './nextSteps';
import { seedData } from '@/store/seed';
import type { AppData } from './types';

const fluence = (d: AppData) => d.projects.find((p) => p.id === 'prj_fluence')!;

describe('next baby steps for a project', () => {
  it('Fluence on 2 Oct: redlines (Jesse), decisions (Brandon), this week\'s actions, QC, then undated actions', () => {
    const d = seedData();
    const steps = projectSteps(d, fluence(d), '2026-10-02');
    expect(steps.map((s) => s.id)).toEqual([
      'redlines:prt_fluence_2026-10-01_v2',
      'decide:prt_fluence_2026-10-01_v2',
      'action:note_fl_action_licences',
      'action:note_fl_action_tcp',
      'production:prj_fluence',
      'action:note_fl_action_route',
    ]);
    const [redlines, decide] = steps;
    expect(redlines.title).toBe('Work the 13 open redlines on 2026-10-01_Fluence_2.pdf');
    expect(redlines.detail).toMatch(/^Start with COVER: "Add DIG stamp/);
    expect(redlines.who).toBe('Jesse Montgomery');
    expect(decide.title).toBe('Decide 3 high-priority AI notes on 2026-10-01_Fluence_2.pdf');
    expect(decide.who).toBe('Brandon Barkey');
    expect(steps.every((s) => s.to.startsWith('/projects/prj_fluence'))).toBe(true);
  });

  it('a day later the licence follow-up is overdue and comes first', () => {
    const d = seedData();
    expect(projectSteps(d, fluence(d), '2026-10-03')[0]).toMatchObject({ id: 'overdue:note_fl_action_licences', tag: 'overdue' });
  });

  it('when every redline is handled it asks for the next print instead', () => {
    const d = seedData();
    d.redlines = d.redlines.map((r) => ({ ...r, status: 'addressed' as const }));
    const ids = projectSteps(d, fluence(d), '2026-10-02').map((s) => s.id);
    expect(ids).toContain('nextprint:prt_fluence_2026-10-01_v2');
    expect(ids.some((i) => i.startsWith('redlines:'))).toBe(false);
  });

  it('asks for a review when a new print has no redlines yet, and for the AI analysis', () => {
    const d = seedData();
    d.prints = [{ ...d.prints[0], id: 'prt_new', label: 'print3.pdf', issuedOn: '2026-10-05', status: 'in-review', analysis: null }, ...d.prints];
    const ids = projectSteps(d, fluence(d), '2026-10-05').map((s) => s.id);
    expect(ids).toContain('review:prt_new');
    expect(ids).toContain('analysis:prt_new');
  });
});

describe('the whole list', () => {
  it('starts with the next setup step and today\'s meeting, and leaves the sample project out', () => {
    const d = seedData();
    const steps = nextBabySteps(d, { today: '2026-10-02', setup: [{ id: 'drive', label: 'Allow Google Drive', done: false, to: '/connections', hint: 'Connections → Allow' }] });
    expect(steps[0]).toMatchObject({ id: 'setup:drive', tag: 'setup' });
    expect(steps[1]).toMatchObject({ id: 'today:note_fl_meet_1002', tag: 'today' });
    expect(steps.some((s) => s.projectId === 'prj_sample_1')).toBe(false);
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
  });

  it('names "you" for the viewer\'s own steps', () => {
    expect(whoLabel('Brandon Barkey', 'Brandon Barkey')).toBe('you');
    expect(whoLabel('Jesse Montgomery', 'Brandon Barkey')).toBe('Jesse');
    expect(whoLabel(undefined, 'x')).toBe('');
  });
});
