import { describe, expect, it } from 'vitest';
import { cardFor, sentCards, timecardSubject, timecardText, weekDays, weekRange, weekStart } from './timecard';
import type { TimeEntry } from './types';

const entry = (date: string, hours: number, extra: Partial<TimeEntry> = {}): TimeEntry => ({
  id: `t-${date}-${hours}`,
  projectId: null,
  date,
  hours,
  description: '',
  billable: true,
  invoiced: false,
  createdAt: `${date}T12:00:00Z`,
  updatedAt: `${date}T12:00:00Z`,
  ...extra,
});

describe('timecard weeks', () => {
  it('runs Saturday to Friday', () => {
    expect(weekStart('2026-10-03')).toBe('2026-10-03'); // Sat
    expect(weekStart('2026-10-06')).toBe('2026-10-03'); // Tue
    expect(weekStart('2026-10-09')).toBe('2026-10-03'); // Fri
    expect(weekStart('2026-10-10')).toBe('2026-10-10'); // next Sat
    expect(weekDays('2026-10-03')).toHaveLength(7);
    expect(weekRange('2026-10-03')).toBe('Oct 3 – Oct 9');
  });

  it('crosses month and year boundaries', () => {
    expect(weekStart('2026-10-02')).toBe('2026-09-26');
    expect(weekStart('2027-01-01')).toBe('2026-12-26');
  });
});

describe('timecard state', () => {
  it('moves from not sent to sent to paid, and flags edits after sending', () => {
    const a = entry('2026-10-05', 8);
    const b = entry('2026-10-06', 8);
    expect(cardFor('2026-10-03', []).state).toBe('empty');
    expect(cardFor('2026-10-03', [a, b]).state).toBe('not-sent');
    const sent = [a, b].map((t) => ({ ...t, sentAt: '2026-10-09T20:00:00Z', invoiced: true }));
    expect(cardFor('2026-10-03', sent).state).toBe('sent');
    expect(cardFor('2026-10-03', [...sent, entry('2026-10-08', 2)]).state).toBe('changed');
    expect(cardFor('2026-10-03', [{ ...sent[0], invoiced: false }, sent[1]]).state).toBe('changed');
    expect(cardFor('2026-10-03', sent.map((t) => ({ ...t, paidAt: '2026-10-12T00:00:00Z' }))).state).toBe('paid');
  });

  it('ignores deleted entries and other weeks', () => {
    const card = cardFor('2026-10-03', [entry('2026-10-05', 8), entry('2026-10-06', 3, { deletedAt: '2026-10-06T13:00:00Z' }), entry('2026-10-10', 5)]);
    expect(card.hours).toBe(8);
  });

  it('lists sent weeks newest first', () => {
    const list = sentCards([entry('2026-09-22', 2, { sentAt: 'x', paidAt: 'y', invoiced: true }), entry('2026-09-29', 28, { sentAt: 'x', invoiced: true }), entry('2026-10-05', 8)]);
    expect(list.map((c) => [c.start, c.hours, c.state])).toEqual([
      ['2026-09-26', 28, 'sent'],
      ['2026-09-19', 2, 'paid'],
    ]);
  });
});

describe('timecard text', () => {
  it('has one line per day, extra lines for extra entries, and the total', () => {
    const card = cardFor('2026-10-03', [entry('2026-10-05', 8, { description: 'Fluence review' }), entry('2026-10-05', 1.5, { description: 'Email setup', createdAt: '2026-10-05T13:00:00Z' })]);
    const text = timecardText(card, { name: 'Brandon Barkey', status: 'Contract (1099)' });
    expect(text).toContain('SENAWAVE · WEEKLY TIMECARD');
    expect(text).toContain('Sat Oct 3    0.00 h');
    expect(text).toContain('Mon Oct 5    8.00 h  Fluence review');
    expect(text).toContain('             1.50 h  Email setup');
    expect(text).toContain('TOTAL        9.50 h');
    expect(text.split('\n').filter((l) => / h/.test(l))).toHaveLength(9);
    expect(timecardSubject(card, 'Brandon Barkey')).toBe('Timecard — Brandon Barkey — week ending Oct 9');
  });
});
