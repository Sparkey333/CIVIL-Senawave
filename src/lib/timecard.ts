import type { TimeEntry } from './types';

/** Senawave timecards run Saturday → Friday and are due to the payer on Fridays. */
const DAY = 86_400_000;
const NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parse(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** The Saturday that starts the timecard week holding `dateIso`. */
export function weekStart(dateIso: string): string {
  const d = parse(dateIso);
  return iso(new Date(d.getTime() - ((d.getUTCDay() + 1) % 7) * DAY));
}

export function addDays(dateIso: string, n: number): string {
  return iso(new Date(parse(dateIso).getTime() + n * DAY));
}

/** The seven dates of the week, Saturday first. */
export function weekDays(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** "Sat" */
export function dayName(dateIso: string): string {
  return NAMES[parse(dateIso).getUTCDay()];
}
/** "Oct 3" */
export function shortDate(dateIso: string): string {
  const d = parse(dateIso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
/** "Oct 3 – Oct 9" */
export function weekRange(start: string): string {
  return `${shortDate(start)} – ${shortDate(addDays(start, 6))}`;
}

export function hours(entries: TimeEntry[]): number {
  return entries.reduce((a, t) => a + (Number.isFinite(t.hours) ? t.hours : 0), 0);
}

export type CardState = 'empty' | 'not-sent' | 'changed' | 'sent' | 'paid';

/** One week's entries and where its timecard stands. */
export interface WeekCard {
  start: string;
  entries: TimeEntry[];
  hours: number;
  state: CardState;
  sentAt: string | null;
  paidAt: string | null;
}

export function cardFor(start: string, all: TimeEntry[]): WeekCard {
  const end = addDays(start, 6);
  const entries = all.filter((t) => !t.deletedAt && t.date >= start && t.date <= end).sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt));
  const sent = entries.map((t) => t.sentAt).filter((x): x is string => !!x).sort();
  const paid = entries.map((t) => t.paidAt).filter((x): x is string => !!x).sort();
  const sentAt = sent.length ? sent[sent.length - 1] : null;
  const paidAt = paid.length ? paid[paid.length - 1] : null;
  let state: CardState;
  if (!entries.length) state = 'empty';
  else if (!sentAt) state = 'not-sent';
  // An entry added or edited after sending has no send stamp, or is no longer marked invoiced.
  else if (entries.some((t) => !t.sentAt || !t.invoiced)) state = 'changed';
  else if (entries.every((t) => t.paidAt)) state = 'paid';
  else state = 'sent';
  return { start, entries, hours: hours(entries), state, sentAt, paidAt };
}

/** Every week that has been sent, newest first: the timecard history. */
export function sentCards(all: TimeEntry[]): WeekCard[] {
  const starts = new Set(all.filter((t) => !t.deletedAt && t.sentAt).map((t) => weekStart(t.date)));
  return [...starts].sort().reverse().map((s) => cardFor(s, all));
}

/** The plain-text card emailed to the payer, one line per day (and one per extra entry on a day). */
export function timecardText(card: WeekCard, opts: { name: string; status: string }): string {
  const rule = '─'.repeat(28);
  const lines = ['SENAWAVE · WEEKLY TIMECARD', rule, `${opts.name} · ${opts.status}`, `Week: ${dayName(card.start)} ${weekRange(card.start)}`, ''];
  for (const day of weekDays(card.start)) {
    const label = `${dayName(day)} ${shortDate(day)}`.padEnd(11);
    const rows = card.entries.filter((t) => t.date === day);
    if (!rows.length) lines.push(`${label} ${(0).toFixed(2).padStart(5)} h`);
    for (const [i, t] of rows.entries()) lines.push(`${i ? ' '.repeat(11) : label} ${t.hours.toFixed(2).padStart(5)} h${t.description ? `  ${t.description}` : ''}`);
  }
  lines.push(rule, `${'TOTAL'.padEnd(11)} ${card.hours.toFixed(2).padStart(5)} h`);
  return lines.join('\n');
}

export function timecardSubject(card: WeekCard, name: string): string {
  return `Timecard — ${name} — week ending ${shortDate(addDays(card.start, 6))}`;
}
