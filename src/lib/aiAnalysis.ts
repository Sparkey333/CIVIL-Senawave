// "Analyze with Claude" for a print, inside claude.ai: read the PDFs' text from Drive with the viewer's own
// connector, ask Claude on the viewer's own account, and read the answer with the same parser as a pasted one.

import type { PrintAnalysis, PrintSet, Project, Redline } from './types';
import { ANALYSIS_JSON_SHAPE, parseAnalysis } from './prints';
import { parseDriveId } from './drive';
import { driveReadText } from './connectors';
import { cap, type SampleError } from './claude/runtime';
import { fmtDate } from './ids';

/** Text budget per document, in characters. Claude's input limit is 256 KiB in total. */
const BUDGET = { print: 90_000, previous: 40_000, review: 30_000 };

export class AnalysisError extends Error {
  readonly code: string;
  /** Raw answer when it came back but could not be read. */
  readonly raw?: string;
  constructor(code: string, message: string, raw?: string) {
    super(message);
    this.code = code;
    this.raw = raw;
  }
}

export function analysisFix(code: string): string {
  switch (code) {
    case 'not_granted':
    case 'sampling_disabled':
    case 'not_declared':
    case 'capability_disabled':
    case 'capability_removed':
      return 'Claude is not available to this tracker in your account. Use "Copy prompt" and a Claude chat instead.';
    case 'rate_limited':
      return 'Too many requests, or your Claude usage limit was reached. Try again later.';
    case 'session_expired':
      return 'Your claude.ai session expired. Sign in again, then retry.';
    case 'prompt_too_large':
      return 'The PDFs are too long to send at once. Remove the previous print link and try again.';
    case 'refused':
      return 'Claude declined to answer this one. Change what is sent (for example the links) and try again.';
    case 'empty_completion':
      return 'No answer came back. Try again.';
    case 'cancelled':
      return 'Stopped.';
    default:
      return 'The analysis was interrupted (connection or service problem). Try again.';
  }
}

function trimText(text: string, max: number): string {
  const clean = text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max)}\n[… cut here: the rest of the text did not fit]`;
}

/** The instruction plus everything Claude may read. Claude cannot open links, so the PDF text is included. */
export function buildInAppPrompt(project: Project, print: PrintSet, redlines: Redline[], previous: PrintSet | undefined, texts: { print: string; previous?: string; review?: string }): string {
  const reds = redlines.length
    ? redlines.map((r, i) => `${i + 1}. [${r.sheet || 'sheet?'}] (${r.kind}, ${r.status}) ${r.text}${r.response ? ` → ${r.response}` : ''}`).join('\n')
    : 'None logged yet.';
  return [
    'You are reviewing a plan-set print for a buried fiber (telecom) civil design project, as a careful civil engineer would. Give notes and recommendations the design team can act on.',
    '',
    `Project: ${project.number || '(no number)'} ${project.name} — ${project.municipality}${project.county ? `, ${project.county} County` : ''}. Status: ${project.status}.`,
    `Print: ${print.label} (${fmtDate(print.issuedOn)}, made by ${print.by || 'unknown'}, ${print.sheetCount ?? '?'} sheets).`,
    print.summary ? `What this print is: ${print.summary}` : '',
    previous ? `Previous print: ${previous.label} (${fmtDate(previous.issuedOn)}).` : 'Previous print: none logged.',
    print.reviewNote ? `Reviewer's summary (${print.reviewBy || 'reviewer'}, ${fmtDate(print.reviewOn)}): ${print.reviewNote}` : '',
    '',
    'Redlines logged so far:',
    reds,
    '',
    'You can only read the text below, extracted from the PDFs. You cannot see linework, symbols, images, stamps or markup shapes, and you cannot open links. Say so where it matters, and never present a guess about geometry as a finding.',
    '',
    'Please: 1) list what changed since the previous print, 2) check the print against the redlines and against the requirements printed in the set (agency notes), 3) give findings the redlines do not already cover, each with the sheet, a severity and one recommended action, 4) state in "basis" exactly what you read and what you could not see.',
    '',
    'Answer with one JSON object only, in this shape:',
    ANALYSIS_JSON_SHAPE,
    '',
    `=== TEXT OF THE PRINT (${print.label}) ===`,
    texts.print,
    texts.previous ? `\n=== TEXT OF THE PREVIOUS PRINT (${previous?.label}) ===\n${texts.previous}` : '',
    texts.review ? `\n=== TEXT OF THE REVIEWER'S MARKED-UP PDF (${print.reviewFileName || 'review'}), including markup comments ===\n${texts.review}` : '',
  ]
    .filter((l, i, a) => l !== '' || a[i - 1] !== '')
    .join('\n');
}

const isDriveLink = (url: string) => /drive\.google\.com|docs\.google\.com/.test(url);

/**
 * Read the print (and the previous print and the review, when linked), ask Claude, and return the parsed analysis.
 * `onStage` says what is happening; `onText` streams the raw answer as it is written.
 */
export async function analyzePrint(
  project: Project,
  print: PrintSet,
  redlines: Redline[],
  previous: PrintSet | undefined,
  opts: { signal?: AbortSignal; onStage?: (s: string) => void; onText?: (text: string) => void; by?: string } = {},
): Promise<PrintAnalysis> {
  const sample = await cap('sample');
  if (!sample) throw new AnalysisError('capability_disabled', analysisFix('capability_disabled'));
  if (!print.fileUrl || !isDriveLink(print.fileUrl)) throw new AnalysisError('no_pdf', 'Add the Drive link to this print\'s PDF first (Print card → Drive link).');

  const read = async (url: string, max: number) => trimText(await driveReadText(parseDriveId(url), opts.signal), max);
  opts.onStage?.('Reading the print from your Drive…');
  const printText = await read(print.fileUrl, BUDGET.print);
  if (!printText) throw new AnalysisError('empty_pdf', 'Drive returned no text for this PDF (a scan without a text layer?). Use "Copy prompt" with a chat that can see the pages.');
  let previousText = '';
  if (previous?.fileUrl && isDriveLink(previous.fileUrl)) {
    opts.onStage?.('Reading the previous print…');
    previousText = await read(previous.fileUrl, BUDGET.previous).catch(() => '');
  }
  let reviewText = '';
  if (print.reviewFileUrl && isDriveLink(print.reviewFileUrl)) {
    opts.onStage?.('Reading the marked-up review…');
    reviewText = await read(print.reviewFileUrl, BUDGET.review).catch(() => '');
  }

  opts.onStage?.('Claude is reading the set. This usually takes 30 seconds to 2 minutes…');
  const prompt = buildInAppPrompt(project, print, redlines, previous, { print: printText, previous: previousText, review: reviewText });
  let text: string;
  try {
    const res = await sample(prompt, { modelTier: 'complex', cache: false, signal: opts.signal, onText: (u) => opts.onText?.(u.text) });
    text = res.text;
  } catch (e) {
    const err = e as SampleError;
    throw new AnalysisError(err?.code || 'upstream_error', analysisFix(err?.code || 'upstream_error'), err?.text);
  }
  const parsed = parseAnalysis(text, opts.by || 'Claude (in the tracker)');
  if (!parsed.ok) throw new AnalysisError('invalid_json', `The answer could not be read (${parsed.error}). Try again.`, text);
  const read2 = [print.label, previousText ? previous?.label : '', reviewText ? print.reviewFileName || 'the review PDF' : ''].filter(Boolean).join(', ');
  if (!/text/i.test(parsed.analysis.basis)) parsed.analysis.basis = `${parsed.analysis.basis} (Read from the PDF text of ${read2}.)`;
  return parsed.analysis;
}
