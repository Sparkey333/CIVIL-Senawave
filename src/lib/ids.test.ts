import { describe, expect, it } from 'vitest';
import { daysUntil, fmtFt, slug } from './ids';
import { parseDriveId } from './drive';

describe('helpers', () => {
  it('parses a Drive share link or raw id', () => {
    expect(parseDriveId('https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view?usp=sharing')).toBe('1AbCdEfGhIjKlMnOp');
    expect(parseDriveId('https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp')).toBe('1AbCdEfGhIjKlMnOp');
    expect(parseDriveId('  1AbCdEfGhIjKlMnOp ')).toBe('1AbCdEfGhIjKlMnOp');
  });
  it('formats feet and slugs', () => {
    expect(fmtFt(4200)).toBe('4,200 ft');
    expect(fmtFt(null)).toBe('—');
    expect(slug('PLAN-01 Sheet index!')).toBe('plan-01-sheet-index');
  });
  it('daysUntil handles blank and invalid dates', () => {
    expect(daysUntil('')).toBeNull();
    expect(daysUntil('not a date')).toBeNull();
    expect(typeof daysUntil('2030-01-01')).toBe('number');
  });
});
