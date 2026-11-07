// "What do I do next?" across the whole tracker: one ordered list of small, concrete steps. Each step is one
// action with a link straight to where it is done, says who usually does it when the data knows, and why now.
// Pure and tested; the Dashboard, the morning brief and each project's Overview show it.

import type { AppData, Note, Project } from './types';
import { nextStepFor, openItems, type SetupItem } from './guidance';
import { currentPrint, printsFor, redlinesFor } from './prints';
import { fmtDate } from './ids';

export type StepTag = 'setup' | 'overdue' | 'today' | 'redlines' | 'decide' | 'review' | 'print' | 'action' | 'permit' | 'analysis' | 'production';

export const STEP_TAG_LABEL: Record<StepTag, string> = {
  setup: 'setup',
  overdue: 'overdue',
  today: 'today',
  redlines: 'redlines',
  decide: 'decide',
  review: 'review',
  print: 'print',
  action: 'action',
  permit: 'permit',
  analysis: 'AI',
  production: 'production',
};

export interface BabyStep {
  id: string;
  tag: StepTag;
  /** The action, as an instruction. */
  title: string;
  /** What exactly, or why now. */
  detail: string;
  to: string;
  projectId: string | null;
  /** Who usually does it, when the data says (the print's maker, the reviewer). */
  who?: string;
  due?: string;
}

const short = (s: string, n = 90) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(`${b}T00:00:00`).getTime() - new Date(`${a}T00:00:00`).getTime()) / 86400000);
}

function noteLink(n: Note): string {
  return n.projectId ? `/projects/${n.projectId}?tab=notes` : '/notes';
}

/** The steps for one project, most urgent first. */
export function projectSteps(d: AppData, p: Project, today: string): BabyStep[] {
  const base = `/projects/${p.id}`;
  const prints = `${base}?tab=prints`;
  const open = openItems(d.notes).filter((n) => n.projectId === p.id);
  const steps: BabyStep[] = [];

  for (const n of open.filter((x) => x.dueOn && x.dueOn < today)) steps.push({ id: `overdue:${n.id}`, tag: 'overdue', title: n.title, detail: `Was due ${fmtDate(n.dueOn)}. Do it, or move the date.`, to: noteLink(n), projectId: p.id, due: n.dueOn });

  const list = printsFor(d.prints, p.id);
  const cur = currentPrint(list);
  if (cur) {
    const reds = redlinesFor(d.redlines, cur.id);
    const openReds = reds.filter((r) => r.status === 'open');
    const decide = cur.analysis ? cur.analysis.findings.filter((f) => f.status === 'open' && f.severity === 'high') : [];
    if (openReds.length) {
      const first = openReds[0];
      steps.push({
        id: `redlines:${cur.id}`,
        tag: 'redlines',
        title: `Work the ${plural(openReds.length, 'open redline')} on ${cur.label}`,
        detail: `Start with ${first.sheet ? `${first.sheet}: ` : ''}"${short(first.text, 70)}". Mark each one Addressed with what was done, then log the next print.`,
        to: prints,
        projectId: p.id,
        who: cur.by || p.designer || undefined,
      });
    }
    if (decide.length)
      steps.push({
        id: `decide:${cur.id}`,
        tag: 'decide',
        title: `Decide ${plural(decide.length, 'high-priority AI note')} on ${cur.label}`,
        detail: decide.slice(0, 3).map((f) => `${f.sheet}: ${short(f.issue, 60)}`).join(' · '),
        to: prints,
        projectId: p.id,
        who: cur.reviewBy || p.engineer || undefined,
      });
    if (!openReds.length && reds.length && cur.status === 'redlined')
      steps.push({ id: `nextprint:${cur.id}`, tag: 'print', title: 'Log the next print', detail: `All ${reds.length} redlines on ${cur.label} are handled. Plot it, then log it with its Drive link.`, to: prints, projectId: p.id, who: cur.by || p.designer || undefined });
    if (!reds.length && (cur.status === 'in-review' || cur.status === 'draft'))
      steps.push({ id: `review:${cur.id}`, tag: 'review', title: `Review ${cur.label} and log the redlines`, detail: 'One line per markup, with the sheet. Then send the open list to whoever plots the next print.', to: prints, projectId: p.id, who: cur.reviewBy || p.engineer || undefined });
    if (!cur.analysis && cur.status !== 'superseded' && cur.status !== 'issued')
      steps.push({ id: `analysis:${cur.id}`, tag: 'analysis', title: `Run the AI analysis of ${cur.label}`, detail: 'Prints & reviews → AI analysis. It reads the PDF text and lists what the redlines do not cover.', to: prints, projectId: p.id });
  } else if (['qc', 'review', 'permitting'].includes(p.status)) {
    steps.push({ id: `firstprint:${p.id}`, tag: 'print', title: 'Log the plotted print', detail: 'Prints & reviews → Log a new print, with the Drive link to the PDF.', to: prints, projectId: p.id, who: p.designer || undefined });
  }

  for (const n of open.filter((x) => x.dueOn && x.dueOn >= today && daysBetween(today, x.dueOn) <= 7))
    steps.push({ id: `action:${n.id}`, tag: 'action', title: n.title, detail: `Due ${n.dueOn === today ? 'today' : fmtDate(n.dueOn)}.`, to: noteLink(n), projectId: p.id, due: n.dueOn });

  for (const x of d.permits.filter((y) => y.projectId === p.id && !['approved', 'closed', 'denied'].includes(y.status))) {
    const who = x.agencyName || x.agency;
    if (x.status === 'comments') steps.push({ id: `permit:${x.id}`, tag: 'permit', title: `Answer ${who}'s comments on the ${x.type}`, detail: 'Log each comment as an agency-comment note, fix, then resubmit.', to: `${base}?tab=permits`, projectId: p.id });
    else if (x.dueOn && daysBetween(today, x.dueOn) <= 7) steps.push({ id: `permit:${x.id}`, tag: 'permit', title: `${x.type}: ${who}`, detail: `Due ${fmtDate(x.dueOn)} · ${x.status.replace('-', ' ')}`, to: `${base}?tab=permits`, projectId: p.id, due: x.dueOn });
  }

  const ns = nextStepFor(p);
  if (ns.kind !== 'done' && !(ns.kind === 'review' && cur)) steps.push({ id: `production:${p.id}`, tag: 'production', title: ns.title, detail: ns.detail, to: ns.to, projectId: p.id });

  for (const n of open.filter((x) => !x.dueOn)) steps.push({ id: `action:${n.id}`, tag: 'action', title: n.title, detail: 'No date yet: give it one, or do it now.', to: noteLink(n), projectId: p.id });

  return steps;
}

/**
 * Everything, in order: the next setup step, today's meetings, overdue general actions, then each active real
 * project's steps (newest-changed project first).
 */
export function nextBabySteps(d: AppData, opts: { today: string; setup?: SetupItem[] }): BabyStep[] {
  const out: BabyStep[] = [];
  const nextSetup = opts.setup?.find((s) => !s.done);
  if (nextSetup) out.push({ id: `setup:${nextSetup.id}`, tag: 'setup', title: nextSetup.label, detail: nextSetup.hint, to: nextSetup.to, projectId: null });

  for (const n of d.notes.filter((x) => x.type === 'meeting' && !x.done && x.dueOn === opts.today))
    out.push({ id: `today:${n.id}`, tag: 'today', title: n.title, detail: short(n.body, 120) || 'Meeting today.', to: noteLink(n), projectId: n.projectId });

  const general = openItems(d.notes).filter((n) => !n.projectId);
  for (const n of general.filter((x) => x.dueOn && x.dueOn < opts.today)) out.push({ id: `overdue:${n.id}`, tag: 'overdue', title: n.title, detail: `Was due ${fmtDate(n.dueOn)}.`, to: '/notes', projectId: null, due: n.dueOn });

  const projects = d.projects.filter((p) => !p.sample && !['closed', 'on-hold'].includes(p.status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  for (const p of projects) out.push(...projectSteps(d, p, opts.today));

  for (const n of general.filter((x) => x.dueOn && x.dueOn >= opts.today && daysBetween(opts.today, x.dueOn) <= 7)) out.push({ id: `action:${n.id}`, tag: 'action', title: n.title, detail: `Due ${fmtDate(n.dueOn)}.`, to: '/notes', projectId: null, due: n.dueOn });

  const seen = new Set<string>();
  return out.filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true)));
}

/** "you" when the step is the viewer's, else the first name. */
export function whoLabel(who: string | undefined, me: string | undefined): string {
  if (!who) return '';
  const first = (s: string) => s.trim().split(/\s+/)[0]?.toLowerCase() || '';
  if (me && (who.trim().toLowerCase() === me.trim().toLowerCase() || (first(who) && first(who) === first(me)))) return 'you';
  return who.trim().split(/\s+/)[0] || who;
}
