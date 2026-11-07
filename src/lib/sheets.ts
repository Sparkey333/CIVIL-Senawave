import type { Sheet } from './types';
import { SHEET_MAX_ALONG_FT, clipExtents, evenCellFt, sheetsForRun } from '@/data/guide';
import { uid } from './ids';

export interface SheetIssue {
  pageNumber: number | null;
  level: 'error' | 'warn';
  message: string;
}

/**
 * Checks the sheet index the way guide 4.6 and 6.4 ask for: contiguous numbering, cell length ≤ 685 ft,
 * Angle within −90..90, and matchline pairs that agree in both directions.
 */
export function checkSheets(sheets: Sheet[]): SheetIssue[] {
  const issues: SheetIssue[] = [];
  const byNo = new Map<number, Sheet>();
  const sorted = [...sheets].sort((a, b) => a.pageNumber - b.pageNumber);
  for (const s of sorted) {
    if (byNo.has(s.pageNumber)) issues.push({ pageNumber: s.pageNumber, level: 'error', message: `PageNumber ${s.pageNumber} is used twice.` });
    byNo.set(s.pageNumber, s);
  }
  sorted.forEach((s, i) => {
    if (s.pageNumber !== i + 1 && !issues.some((x) => x.pageNumber === s.pageNumber && x.message.includes('used twice')))
      issues.push({ pageNumber: s.pageNumber, level: 'error', message: `PageNumber runs 1…N with no gaps — expected ${i + 1} here.` });
    if (s.cellFt !== null && s.cellFt > SHEET_MAX_ALONG_FT) issues.push({ pageNumber: s.pageNumber, level: 'error', message: `CellFt ${s.cellFt} exceeds ${SHEET_MAX_ALONG_FT} ft — split the cell.` });
    if (s.angle !== null && (s.angle < -90 || s.angle > 90)) issues.push({ pageNumber: s.pageNumber, level: 'error', message: `Angle ${s.angle}° is outside −90…90 (north would be upside down).` });
    if (s.angle !== null && s.angle % 90 !== 0) issues.push({ pageNumber: s.pageNumber, level: 'warn', message: `Angle ${s.angle}° is not a multiple of 90° — fine off-grid, check it on a street grid.` });
    const pairs: [keyof Sheet, keyof Sheet, string][] = [
      ['matchR', 'matchL', 'right'],
      ['matchL', 'matchR', 'left'],
      ['matchT', 'matchB', 'top'],
      ['matchB', 'matchT', 'bottom'],
    ];
    for (const [mine, theirs, side] of pairs) {
      const raw = String(s[mine] || '').trim();
      if (!raw) continue;
      for (const token of raw.split(/[,\s/]+/).filter(Boolean)) {
        const n = Number(token);
        if (!Number.isInteger(n)) {
          issues.push({ pageNumber: s.pageNumber, level: 'warn', message: `${side} matchline "${token}" is not a sheet number.` });
          continue;
        }
        const other = byNo.get(n);
        if (!other) {
          issues.push({ pageNumber: s.pageNumber, level: 'error', message: `${side} border says SEE SHEET ${n} but there is no sheet ${n} (label would read "??").` });
          continue;
        }
        const back = String(other[theirs] || '').split(/[,\s/]+/).map(Number);
        if (!back.includes(s.pageNumber))
          issues.push({ pageNumber: s.pageNumber, level: 'error', message: `${side} border → sheet ${n}, but sheet ${n} has no matchline back to ${s.pageNumber}.` });
      }
    }
    if (s.clipped && !s.aligned) issues.push({ pageNumber: s.pageNumber, level: 'warn', message: 'Marked clipped but not aligned — order is rotate → scale → centre → clip → lock.' });
    if (s.qcDone && !(s.aligned && s.clipped && s.sidePanel && s.titleblock)) issues.push({ pageNumber: s.pageNumber, level: 'warn', message: 'QC ticked before align / clip / side panel / titleblock are all done.' });
  });
  const anyMatch = sorted.some((s) => s.matchL || s.matchR || s.matchT || s.matchB);
  if (sorted.length > 1 && !anyMatch) issues.push({ pageNumber: null, level: 'warn', message: 'No matchline neighbours entered yet (MatchL/R/T/B).' });
  return issues;
}

/** Build an even-cell straight-run index for a route length: n = ceil(len/685), each cell len/n, chained left→right. */
export function generateSheets(routeLengthFt: number, angle = 0): Sheet[] {
  const n = sheetsForRun(routeLengthFt);
  const cell = +evenCellFt(routeLengthFt).toFixed(1);
  const clip = clipExtents(cell);
  return Array.from({ length: n }, (_, i) => {
    const page = i + 1;
    return {
      id: uid('sht'),
      pageNumber: page,
      angle,
      cellFt: cell,
      clipX0: cell < SHEET_MAX_ALONG_FT ? clip.x0 : null,
      clipX1: cell < SHEET_MAX_ALONG_FT ? clip.x1 : null,
      matchL: page > 1 ? String(page - 1) : '',
      matchR: page < n ? String(page + 1) : '',
      matchT: '',
      matchB: '',
      aligned: false,
      clipped: false,
      sidePanel: false,
      titleblock: false,
      qcDone: false,
      notes: '',
    };
  });
}

export function sheetProgress(s: Sheet): number {
  return [s.aligned, s.clipped, s.sidePanel, s.titleblock, s.qcDone].filter(Boolean).length;
}
