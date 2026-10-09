// "What do I do next?" — turns a project's state into one concrete next step with its guide link,
// plus the setup checklist for a fresh install. Small, pure, tested.
import type { AppData, Note, Project } from './types';
import { QC_CHECKLIST, WORKFLOW_STEPS, type WorkflowStep } from '@/data/guide';
import { sheetProgress } from './sheets';

export interface NextStep {
  kind: 'route' | 'sheets' | 'workflow' | 'sheet-work' | 'qc' | 'review' | 'done';
  title: string;
  detail: string;
  to: string; // in-app link
  guideTo?: string; // /reference/... link
  commands?: string[];
  stepId?: string; // workflow step id when kind === 'workflow'
}

const SHEET_STAGES: [keyof ReturnType<typeof stageFlags>, string, string][] = [
  ['aligned', 'align', 'UCS → Z → angle → PLAN, ZOOM window, ZOOM 0.02XP, UCS Save (guide 6.2 steps 1–7)'],
  ['clipped', 'clip', 'RECTANG ClipX0,2.10 ClipX1,10.50 → VPCLIP, or SENACLIP once for all aligned sheets'],
  ['sidePanel', 'side panel', 'SENASIDE: legend, key map, north arrow (guide 7)'],
  ['titleblock', 'titleblock', 'Per-sheet titleblock fields (guide 10)'],
  ['qcDone', 'QC', 'Section 11 pass on the plotted PDF'],
];

function stageFlags(s: Project['sheets'][number]) {
  return { aligned: s.aligned, clipped: s.clipped, sidePanel: s.sidePanel, titleblock: s.titleblock, qcDone: s.qcDone };
}

export function nextStepFor(p: Project): NextStep {
  const base = `/projects/${p.id}`;
  if (p.status === 'closed') return { kind: 'done', title: 'Closed', detail: 'Nothing to do.', to: base };
  if (!p.routeLengthFt) return { kind: 'route', title: 'Enter the route length', detail: 'Dissolved route length in feet drives the sheet estimate (÷ 685).', to: base, guideTo: '/reference/arcgis' };

  const firstOpen: WorkflowStep | undefined = WORKFLOW_STEPS.find((s) => !p.workflow[s.id]);
  // Sheet work sits between the "cad-layouts" step and the side-panel steps in the guide order.
  const sheetPhaseReached = !!p.workflow['cad-layouts'];
  if (sheetPhaseReached && p.sheets.length === 0)
    return { kind: 'sheets', title: 'Build the sheet index tracker', detail: 'Generate rows from the route length or copy the SheetIndex table from ArcGIS.', to: `${base}?tab=sheets`, guideTo: '/reference/arcgis' };
  if (sheetPhaseReached) {
    const todo = p.sheets.filter((s) => sheetProgress(s) < 5).sort((a, b) => a.pageNumber - b.pageNumber);
    if (todo.length && (!firstOpen || /^(sheet-|fin-)/.test(firstOpen.id))) {
      const s = todo[0];
      const flags = stageFlags(s);
      const stage = SHEET_STAGES.find(([k]) => !flags[k])!;
      return {
        kind: 'sheet-work',
        title: `PLAN-${String(s.pageNumber).padStart(2, '0')}: ${stage[1]}`,
        detail: `${todo.length} of ${p.sheets.length} sheets still open. ${stage[2]}`,
        to: `${base}?tab=sheets`,
        guideTo: '/reference/sheets',
        commands: stage[0] === 'clipped' ? ['SENACLIP'] : stage[0] === 'sidePanel' ? ['SENASIDE'] : stage[0] === 'titleblock' ? ['SENATITLE'] : undefined,
      };
    }
  }
  if (firstOpen)
    return {
      kind: 'workflow',
      title: firstOpen.label,
      detail: `${firstOpen.phase} · guide §${firstOpen.section}`,
      to: `${base}?tab=workflow`,
      guideTo: `/reference/${sectionTab(firstOpen.section)}`,
      commands: firstOpen.commands,
      stepId: firstOpen.id,
    };
  const qcOpen = QC_CHECKLIST.filter((q) => !p.qc[q.id]);
  if (qcOpen.length) return { kind: 'qc', title: `QC: ${qcOpen[0].label}`, detail: `${qcOpen.length} checklist items left (guide 11). Run them on the plotted PDF.`, to: `${base}?tab=qc`, guideTo: '/reference/qc' };
  if (p.status !== 'sealed' && p.status !== 'construction') return { kind: 'review', title: 'Hand to the Engineer of Record', detail: 'Workflow and QC are complete; set status to PE review, then log each print and its redlines.', to: `${base}?tab=prints` };
  return { kind: 'done', title: 'Plan set out the door', detail: 'Track permits and construction support here.', to: `${base}?tab=permits` };
}

/** Guide section number → Reference tab id. */
export function sectionTab(section: string): string {
  const n = parseInt(section, 10);
  const map: Record<number, string> = { 1: 'start', 2: 'start', 3: 'numbers', 4: 'arcgis', 5: 'bricscad', 6: 'sheets', 7: 'sidepanel', 8: 'sidepanel', 9: 'sidepanel', 10: 'plot', 11: 'qc', 12: 'trouble', 13: 'commands', 14: 'maintain' };
  return map[n] || 'workflow';
}

export interface SetupItem {
  id: string;
  label: string;
  done: boolean;
  to: string;
  hint: string;
}

/** Where this copy of the tracker lives, and what the setup checklist needs to know about it. */
export interface SetupContext {
  mode: 'claude' | 'google' | 'offline';
  /** claude.ai mode: this person owns the shared tracker (shares it, seeds it). */
  isOwner: boolean;
  /** claude.ai mode: the shared store's state and how many other people have written to it. */
  cloud?: { state: string; others: number; message?: string };
  /** claude.ai mode: each connector is allowed and connected (ready) or not in the account at all (missing). */
  connectors?: Partial<Record<'drive' | 'gmail' | 'calendar', { ready: boolean; missing: boolean }>>;
  googleConfigured: boolean;
  /** The Files page holds a live read of the Design folder (not the built-in snapshot). */
  driveSnapshot: boolean;
  /** When the last backup was made (file or Drive), if ever. */
  backupAt: string | null;
  /** The owner said they have invited the team. */
  sharedWithTeam: boolean;
  now?: number;
}

/** The "get the tool working" checklist for this mode, in the order to do it. Shown until everything is green. */
export function setupChecklist(d: AppData, ctx: SetupContext): SetupItem[] {
  const rate: SetupItem = { id: 'rate', label: 'Set your hourly rate', done: !!d.settings.hourlyRate, to: '/settings', hint: 'Settings → You and this device. Private to you; it totals the time log for invoices.' };
  const backupFresh = !!ctx.backupAt && (ctx.now ?? Date.now()) - new Date(ctx.backupAt).getTime() < 7 * 86400000;

  if (ctx.mode === 'claude') {
    const c = ctx.cloud?.state || 'connecting';
    const drive = ctx.connectors?.drive;
    const gmail = ctx.connectors?.gmail;
    const items: SetupItem[] = [
      {
        id: 'shared',
        label: 'Shared tracker connected',
        done: c === 'live' || c === 'readonly',
        to: '/connections',
        hint:
          c === 'empty'
            ? ctx.isOwner
              ? 'Connections → "Copy this device into the shared tracker".'
              : 'The owner has not filled the shared tracker yet.'
            : c === 'error' || c === 'stopped'
              ? ctx.cloud?.message || 'Reload the page.'
              : 'Connecting… this takes a few seconds.',
      },
      { id: 'drive', label: 'Allow Google Drive for the tracker', done: !!drive?.ready, to: '/connections', hint: drive?.missing ? 'First add the Google Drive connector: claude.ai → Settings → Connectors.' : 'Connections → Allow. Reads the Design folder and print PDFs; writes only backups you ask for.' },
      { id: 'design', label: 'Read the Design folder from Drive', done: ctx.driveSnapshot, to: '/files', hint: 'Files → Refresh from Drive.' },
      { id: 'gmail', label: 'Allow Gmail (reads @senawave.com mail, never sends)', done: !!gmail?.ready, to: '/connections', hint: gmail?.missing ? 'First add the Gmail connector: claude.ai → Settings → Connectors.' : 'Connections → Allow.' },
    ];
    if (ctx.isOwner)
      items.push({ id: 'share', label: 'Share the tracker with Jesse as Editor', done: (ctx.cloud?.others ?? 0) > 0 || ctx.sharedWithTeam, to: '/connections', hint: 'claude.ai Share menu → invite jessem@senawave.com as Editor. No public link.' });
    items.push(rate, { id: 'backup', label: 'Back up to your Drive', done: backupFresh, to: '/connections', hint: 'Connections → Back up now. A dated copy in a "Senawave Tracker" folder; do it weekly.' });
    return items;
  }

  if (ctx.mode === 'google') {
    return [
      { id: 'sync', label: 'Create or link the shared Drive file', done: !!d.settings.driveFileId, to: '/settings', hint: 'Settings → Google Drive sync → Sync now.' },
      { id: 'design', label: 'Read the Senawave Design folder', done: ctx.driveSnapshot, to: '/files', hint: 'Connections → turn on the Design folder switch, sign in again, then Files → Refresh.' },
      { id: 'gmail', label: 'Turn on Gmail (read-only)', done: d.settings.gmailEnabled, to: '/connections', hint: 'Connections → Google sign-in (this site) → Gmail switch.' },
      rate,
    ];
  }

  return [
    { id: 'backup', label: 'Save a backup file this week', done: backupFresh, to: '/settings', hint: 'Settings → Archive and update → Save backup file. Offline, this browser is the only copy.' },
    rate,
  ];
}

/** Notes that count as "my open work": actions, redlines, agency comments, issues. */
export function openItems(notes: Note[]): Note[] {
  return notes.filter((n) => !n.done && ['action', 'redline', 'agency-comment', 'issue'].includes(n.type)).sort((a, b) => (a.dueOn || '9999').localeCompare(b.dueOn || '9999') || b.createdAt.localeCompare(a.createdAt));
}
