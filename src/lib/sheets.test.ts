import { describe, expect, it } from 'vitest';
import { checkSheets, generateSheets } from './sheets';
import { clipExtents, evenCellFt, modelTextHeightFt, sheetsForRun } from '@/data/guide';
import { seedData } from '@/store/seed';

describe('guide arithmetic', () => {
  it('sheets per run = length ÷ 685 rounded up (guide 4.3: 24,917 ft → 37 sheets)', () => {
    expect(sheetsForRun(24917)).toBe(37);
    expect(sheetsForRun(1500)).toBe(3);
    expect(sheetsForRun(685)).toBe(1);
    expect(sheetsForRun(0)).toBe(0);
  });
  it('even cells: a 1,500 ft run becomes three 500 ft sheets', () => {
    expect(evenCellFt(1500)).toBe(500);
  });
  it('a 685 ft cell fills the viewport 0.50–14.20', () => {
    expect(clipExtents(685)).toEqual({ x0: 0.5, x1: 14.2 });
  });
  it('model text height = plotted inches × 50', () => {
    expect(modelTextHeightFt(0.14)).toBe(7);
    expect(modelTextHeightFt(0.07)).toBe(3.5);
  });
});

describe('generateSheets', () => {
  it('chains sheets left to right with agreeing matchlines', () => {
    const sheets = generateSheets(1500);
    expect(sheets.map((s) => s.pageNumber)).toEqual([1, 2, 3]);
    expect(sheets.map((s) => s.cellFt)).toEqual([500, 500, 500]);
    expect(sheets[0].matchR).toBe('2');
    expect(sheets[1].matchL).toBe('1');
    expect(sheets[2].matchR).toBe('');
    expect(checkSheets(sheets).filter((i) => i.level === 'error')).toEqual([]);
  });
});

describe('checkSheets', () => {
  it('passes the seeded sample index', () => {
    const errors = checkSheets(seedData().projects[0].sheets).filter((i) => i.level === 'error');
    expect(errors).toEqual([]);
  });
  it('flags a matchline pair that does not agree both ways', () => {
    const sheets = generateSheets(1500);
    sheets[1].matchL = '';
    const errors = checkSheets(sheets).filter((i) => i.level === 'error');
    expect(errors.some((e) => e.pageNumber === 1 && /no matchline back/.test(e.message))).toBe(true);
  });
  it('flags a cell longer than 685 ft, a gap in numbering and an out-of-range angle', () => {
    const sheets = generateSheets(1500);
    sheets[0].cellFt = 700;
    sheets[2].pageNumber = 4;
    sheets[1].angle = 135;
    const msgs = checkSheets(sheets).map((i) => i.message).join('\n');
    expect(msgs).toMatch(/exceeds 685/);
    expect(msgs).toMatch(/no gaps/);
    expect(msgs).toMatch(/outside −90…90/);
  });
});
