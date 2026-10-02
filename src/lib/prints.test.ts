import { describe, expect, it } from 'vitest';
import { fluencePrints, fluenceRedlines, FLUENCE_PRINT_V1, FLUENCE_PRINT_V2 } from '@/data/fluencePrints';
import { fluenceProject } from '@/store/seed';
import { ANALYSIS_JSON_SHAPE, buildAnalysisPrompt, currentPrint, openFindingCount, openRedlineCount, parseAnalysis, printsFor, redlineAgenda, redlinesFor, sortFindings } from './prints';

describe('print ordering and counts', () => {
  const prints = fluencePrints();
  const reds = fluenceRedlines();

  it('puts the newest print first and picks the newest non-superseded one as current', () => {
    const list = printsFor(prints, 'prj_fluence');
    expect(list.map((p) => p.id)).toEqual([FLUENCE_PRINT_V2, FLUENCE_PRINT_V1]);
    expect(currentPrint(list)?.id).toBe(FLUENCE_PRINT_V2);
  });

  it('seeds the 13 redlines from the review PDF against print 2, all open', () => {
    expect(reds).toHaveLength(13);
    expect(redlinesFor(reds, FLUENCE_PRINT_V2)).toHaveLength(13);
    expect(redlinesFor(reds, FLUENCE_PRINT_V1)).toHaveLength(0);
    expect(openRedlineCount(reds, 'prj_fluence')).toBe(13);
    expect(new Set(reds.map((r) => r.id)).size).toBe(13);
  });

  it('seeds an analysis whose basis says what it could not see, with unique finding ids', () => {
    const a = prints.find((p) => p.id === FLUENCE_PRINT_V2)!.analysis!;
    expect(a.basis).toMatch(/could not see/i);
    expect(a.findings.length).toBeGreaterThan(5);
    expect(new Set(a.findings.map((f) => f.id)).size).toBe(a.findings.length);
    // The project-number finding was fixed in the tracker, so it ships as done; the rest are open.
    expect(openFindingCount(a)).toBe(a.findings.length - 1);
    expect(a.findings.find((f) => f.id === 'fnd_fluence_v2_01')?.status).toBe('done');
    expect(sortFindings(a.findings)[0].severity).toBe('high');
  });

  it('flags the project number mismatch the print shows', () => {
    const a = prints.find((p) => p.id === FLUENCE_PRINT_V2)!.analysis!;
    expect(a.findings.some((f) => f.issue.includes('26-0009') && f.issue.includes(fluenceProject().number))).toBe(true);
  });
});

describe('redline agenda and the analysis prompt', () => {
  const [v2, v1] = fluencePrints();
  const reds = fluenceRedlines();

  it('lists only open redlines, marking checks', () => {
    const list = reds.map((r, i) => (i === 0 ? { ...r, status: 'addressed' as const } : r));
    const text = redlineAgenda(v2, list);
    expect(text).toContain('(12)');
    expect(text).not.toContain('Add DIG stamp');
    expect(text).toContain('CHECK: remove UDOT?');
  });

  it('builds a prompt with the print, the previous print, the redlines and the JSON shape', () => {
    const text = buildAnalysisPrompt(fluenceProject(), v2, reds, v1);
    expect(text).toContain('2026-10-01_Fluence_2.pdf');
    expect(text).toContain('Previous print: 2026-10-01_Fluence.pdf');
    expect(text).toContain('Add DIG stamp at least once');
    expect(text).toContain(ANALYSIS_JSON_SHAPE);
  });
});

describe('parseAnalysis', () => {
  const good = { summary: 'Looks close.', changes: ['Index fixed'], findings: [{ severity: 'HIGH', sheet: 'NOTES01', issue: 'Placeholder left in note 1', recommendation: 'Fill it in' }], basis: 'Text layer only' };

  it('reads plain JSON, normalizes severity and gives every finding an id and open status', () => {
    const res = parseAnalysis(JSON.stringify(good));
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.analysis.findings[0]).toMatchObject({ severity: 'high', sheet: 'NOTES01', status: 'open' });
    expect(res.analysis.findings[0].id).toMatch(/^fnd_/);
    expect(res.analysis.by).toBe('Claude');
  });

  it('reads JSON inside a code fence with chatter around it', () => {
    const res = parseAnalysis('Here you go:\n```json\n' + JSON.stringify(good) + '\n```\nLet me know.');
    expect(res.ok).toBe(true);
  });

  it('falls back to medium for an unknown severity and "All sheets" for a missing sheet', () => {
    const res = parseAnalysis(JSON.stringify({ ...good, findings: [{ severity: 'urgent', issue: 'x' }] }));
    expect(res.ok && res.analysis.findings[0]).toMatchObject({ severity: 'medium', sheet: 'All sheets' });
  });

  it('explains what is wrong instead of throwing', () => {
    expect(parseAnalysis('nothing here')).toEqual({ ok: false, error: 'No JSON object found in the pasted text.' });
    expect(parseAnalysis('{ nope }')).toMatchObject({ ok: false });
    expect(parseAnalysis('{"findings": []}')).toEqual({ ok: false, error: 'Missing "summary".' });
    expect(parseAnalysis('{"summary":"s"}')).toEqual({ ok: false, error: 'Missing "findings" list.' });
    expect(parseAnalysis('{"summary":"s","findings":[{"severity":"low"}]}')).toEqual({ ok: false, error: 'Finding 1 has no "issue".' });
  });
});
