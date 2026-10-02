import { describe, expect, it } from 'vitest';
import { seedData } from '@/store/seed';
import { archiveFileName, buildProjectArchive, diffCounts, isProjectArchive, mergeArchive, validateArchive } from './archive';

describe('project archive', () => {
  const state = seedData();

  it('holds the project with its notes, permits, prints and redlines, and no time unless asked', () => {
    const a = buildProjectArchive(state, 'prj_fluence', { by: 'Brandon', includeTime: false, now: '2026-10-02T12:00:00Z' })!;
    expect(isProjectArchive(a)).toBe(true);
    expect(a.project.id).toBe('prj_fluence');
    expect(a.prints).toHaveLength(2);
    expect(a.redlines).toHaveLength(13);
    expect(a.notes.every((n) => n.projectId === 'prj_fluence')).toBe(true);
    expect(a.timeEntries).toEqual([]);
    expect(JSON.stringify(a)).not.toContain('hourlyRate');
    expect(JSON.stringify(a)).not.toContain('"members"');
  });

  it('includes the project\'s time entries only on request, and never another project\'s', () => {
    const withTime = { ...state, timeEntries: [{ ...state.timeEntries[0], id: 't_f', projectId: 'prj_fluence' }, { ...state.timeEntries[0], id: 't_o', projectId: 'other' }] };
    expect(buildProjectArchive(withTime, 'prj_fluence', { by: 'b', includeTime: true })!.timeEntries.map((t) => t.id)).toEqual(['t_f']);
  });

  it('returns null for an unknown project and names the file from the project number and date', () => {
    expect(buildProjectArchive(state, 'nope', { by: 'b', includeTime: false })).toBeNull();
    const a = buildProjectArchive(state, 'prj_fluence', { by: 'b', includeTime: false, now: '2026-10-02T12:00:00Z' })!;
    expect(archiveFileName(a)).toBe('senawave-archive-26-0009-2026-10-02.json');
  });

  it('validates the shape', () => {
    expect(validateArchive({ kind: 'other' })).toMatch(/Not a project archive/);
    expect(validateArchive({ kind: 'senawave-project-archive' })).toMatch(/no project/);
    expect(validateArchive({ kind: 'senawave-project-archive', project: { id: 'p' }, notes: 'x' })).toMatch(/notes/);
  });

  it('merges newest-wins without touching settings, and counts what changed', () => {
    const a = buildProjectArchive(state, 'prj_fluence', { by: 'b', includeTime: false })!;
    const edited = JSON.parse(JSON.stringify(a)) as typeof a;
    edited.redlines[0] = { ...edited.redlines[0], status: 'addressed', updatedAt: '2099-01-01T00:00:00.000Z' };
    edited.redlines.push({ ...edited.redlines[1], id: 'red_new', text: 'new one' });
    const target = { ...state, settings: { ...state.settings, hourlyRate: 123 } };
    const merged = mergeArchive(target, edited);
    expect(merged.settings).toEqual(target.settings);
    expect(merged.redlines.find((r) => r.id === edited.redlines[0].id)?.status).toBe('addressed');
    expect(merged.redlines.some((r) => r.id === 'red_new')).toBe(true);
    expect(diffCounts(target, merged)).toEqual({ added: 1, updated: 1 });
    expect(diffCounts(target, mergeArchive(target, a))).toEqual({ added: 0, updated: 0 });
  });
});
