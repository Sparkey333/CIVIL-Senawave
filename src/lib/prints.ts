// Helpers for the "Prints & reviews" section: ordering, counts, the prompt that asks an AI for an
// analysis, and the parser that reads the answer back in.

import type { AnalysisFinding, FindingSeverity, PrintAnalysis, PrintSet, Project, Redline } from './types';
import { fmtDate } from './ids';

/** Newest print first (by issue date, then by when it was logged). */
export function printsFor(prints: PrintSet[], projectId: string): PrintSet[] {
  return prints
    .filter((p) => p.projectId === projectId)
    .sort((a, b) => b.issuedOn.localeCompare(a.issuedOn) || b.createdAt.localeCompare(a.createdAt) || b.label.localeCompare(a.label));
}

export function redlinesFor(redlines: Redline[], printId: string): Redline[] {
  return redlines.filter((r) => r.printId === printId).sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

export function openRedlineCount(redlines: Redline[], projectId: string): number {
  return redlines.filter((r) => r.projectId === projectId && r.status === 'open').length;
}

/** The print to show first: the newest one that is not superseded, else the newest. */
export function currentPrint(list: PrintSet[]): PrintSet | undefined {
  return list.find((p) => p.status !== 'superseded') || list[0];
}

const SEVERITY_ORDER: FindingSeverity[] = ['high', 'medium', 'low', 'info'];

export function sortFindings(findings: AnalysisFinding[]): AnalysisFinding[] {
  return [...findings].sort((a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity));
}

export function openFindingCount(analysis: PrintAnalysis | null | undefined): number {
  return analysis ? analysis.findings.filter((f) => f.status === 'open').length : 0;
}

/** The open redlines as plain text, for pasting into an email or reading out on a call. */
export function redlineAgenda(print: PrintSet, redlines: Redline[]): string {
  const open = redlines.filter((r) => r.status === 'open');
  const lines = open.map((r, i) => `${i + 1}. ${r.sheet ? `[${r.sheet}] ` : ''}${r.kind === 'check' ? 'CHECK: ' : ''}${r.text}`);
  return [`Open redlines on ${print.label} (${open.length})`, ...lines].join('\n');
}

export const ANALYSIS_JSON_SHAPE = `{
  "summary": "two or three sentences",
  "changes": ["what is different from the previous print", "..."],
  "findings": [
    { "severity": "high | medium | low | info", "sheet": "NOTES01", "issue": "what is wrong or missing", "recommendation": "what to do about it" }
  ],
  "basis": "what you read, and what you could not see"
}`;

/** The text to paste into Claude chat (or any AI with access to the PDFs) to get an analysis for this print. */
export function buildAnalysisPrompt(project: Project, print: PrintSet, redlines: Redline[], previous?: PrintSet): string {
  const reds = redlines.length
    ? redlines.map((r, i) => `${i + 1}. [${r.sheet || 'sheet?'}] (${r.kind}, ${r.status}) ${r.text}${r.response ? ` → ${r.response}` : ''}`).join('\n')
    : 'None logged yet.';
  return [
    `Analyze this plan-set print for a fiber civil design project and give notes and recommendations.`,
    ``,
    `Project: ${project.number || '(no number)'} ${project.name} — ${project.municipality}${project.county ? `, ${project.county} County` : ''}`,
    `Print: ${print.label} (${fmtDate(print.issuedOn)}, made by ${print.by || 'unknown'}, ${print.sheetCount ?? '?'} sheets)${print.fileUrl ? `\nPDF: ${print.fileUrl}` : ''}`,
    previous ? `Previous print: ${previous.label}${previous.fileUrl ? `\nPDF: ${previous.fileUrl}` : ''}` : 'Previous print: none logged.',
    print.reviewFileUrl ? `Reviewer's marked-up PDF (${print.reviewBy || 'reviewer'}, ${fmtDate(print.reviewOn)}): ${print.reviewFileUrl}` : '',
    print.summary ? `What this print is: ${print.summary}` : '',
    ``,
    `Redlines so far:`,
    reds,
    ``,
    `Please: 1) say what changed since the previous print, 2) check the print against the redlines and against the permitting agency's published requirements, 3) list findings the redlines do not already cover, each with the sheet and a recommended action, 4) be clear about what you could and could not see (text layer only versus linework).`,
    ``,
    `Answer with JSON only, in this shape:`,
    ANALYSIS_JSON_SHAPE,
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');
}

const SEVERITIES: FindingSeverity[] = ['high', 'medium', 'low', 'info'];

/** Pull the first JSON object out of a pasted answer (it may sit inside a ``` fence or have chatter around it). */
function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf('{');
  const end = body.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object found in the pasted text.');
  return JSON.parse(body.slice(start, end + 1));
}

const str = (x: unknown) => (typeof x === 'string' ? x.trim() : '');

export function parseAnalysis(text: string, by = 'Claude', at = new Date().toISOString()): { ok: true; analysis: PrintAnalysis } | { ok: false; error: string } {
  let raw: unknown;
  try {
    raw = extractJson(text);
  } catch (err) {
    return { ok: false, error: (err as Error).message.startsWith('No JSON') ? (err as Error).message : 'That is not valid JSON. Ask the AI to answer with JSON only.' };
  }
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'The JSON should be an object.' };
  const o = raw as Record<string, unknown>;
  const summary = str(o.summary);
  if (!summary) return { ok: false, error: 'Missing "summary".' };
  if (!Array.isArray(o.findings)) return { ok: false, error: 'Missing "findings" list.' };
  const stamp = Date.now().toString(36);
  const findings: AnalysisFinding[] = [];
  for (const [i, item] of (o.findings as unknown[]).entries()) {
    if (!item || typeof item !== 'object') return { ok: false, error: `Finding ${i + 1} is not an object.` };
    const f = item as Record<string, unknown>;
    const issue = str(f.issue);
    if (!issue) return { ok: false, error: `Finding ${i + 1} has no "issue".` };
    const sev = str(f.severity).toLowerCase() as FindingSeverity;
    findings.push({
      id: `fnd_${stamp}_${String(i + 1).padStart(2, '0')}`,
      severity: SEVERITIES.includes(sev) ? sev : 'medium',
      sheet: str(f.sheet) || 'All sheets',
      issue,
      recommendation: str(f.recommendation),
      status: 'open',
    });
  }
  const changes = Array.isArray(o.changes) ? (o.changes as unknown[]).map(str).filter(Boolean) : [];
  return { ok: true, analysis: { summary, changes, findings, basis: str(o.basis) || 'No basis was given with this analysis.', by, at } };
}

