import { useMemo, useState } from 'react';
import type { AnalysisFinding, FindingSeverity, PrintSet, PrintStatus, Project, Redline, RedlineKind, RedlineStatus } from '@/lib/types';
import { PRINT_STATUSES } from '@/lib/types';
import {
  addPrint, addRedline, deletePrint, deleteRedline, newPrint, newRedline, restoreEntity, restorePrint, setPrintAnalysis, updateFinding, updatePrint, updateRedline,
} from '@/store/store';
import { buildAnalysisPrompt, currentPrint, openFindingCount, parseAnalysis, printsFor, redlineAgenda, redlinesFor, sortFindings } from '@/lib/prints';
import { fmtDate } from '@/lib/ids';
import { Badge, Callout, Card, ConfirmButton, Empty, Field, Progress } from '@/components/ui';
import { toast } from '@/components/Toast';

const SEV_KIND: Record<FindingSeverity, '' | 'bad' | 'warn' | 'info'> = { high: 'bad', medium: 'warn', low: 'info', info: '' };
const STATUS_KIND = (s: PrintStatus): '' | 'ok' | 'warn' | 'info' => (s === 'issued' ? 'ok' : s === 'redlined' ? 'warn' : s === 'in-review' || s === 'revised' ? 'info' : '');

async function copyText(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast(done);
  } catch {
    toast('Clipboard blocked; select the text and copy it.', 'bad');
  }
}

/** Latest prints, what reviewers marked on them, and the AI analysis: one project's "Prints & reviews" tab. */
export function PrintsTab({ project, prints, redlines }: { project: Project; prints: PrintSet[]; redlines: Redline[] }) {
  const list = useMemo(() => printsFor(prints, project.id), [prints, project.id]);
  const [pickedId, setPickedId] = useState<string>('');
  const selected = list.find((p) => p.id === pickedId) || currentPrint(list);
  const reds = selected ? redlinesFor(redlines, selected.id) : [];
  const previous = selected ? list[list.indexOf(selected) + 1] : undefined;

  return (
    <>
      <Callout kind="info">
        <strong>Three steps for every new print.</strong> 1. Log the print and its Drive link. 2. Add the redlines from the review PDF, one line each. 3. Ask for the AI analysis and paste it in. Newest print is on the left, the checklist for it is on the right.
      </Callout>

      <div className="prints-layout">
        <div className="prints-list">
          <PrintAdder project={project} onAdded={setPickedId} />
          {list.length === 0 && <Empty title="No prints logged yet">Add the first one above. A print is one PDF of the plan set.</Empty>}
          {list.map((p) => {
            const open = redlines.filter((r) => r.printId === p.id && r.status === 'open').length;
            return (
              <button key={p.id} className={`print-pick ${selected?.id === p.id ? 'active' : ''}`} onClick={() => setPickedId(p.id)} aria-pressed={selected?.id === p.id}>
                <span className="print-pick-name">{p.label || 'Untitled print'}</span>
                <span className="row" style={{ gap: 6 }}>
                  <Badge kind={STATUS_KIND(p.status)}>{PRINT_STATUSES.find((s) => s.id === p.status)?.label}</Badge>
                  <span className="faint" style={{ fontSize: 12 }}>{fmtDate(p.issuedOn)}</span>
                </span>
                <span className="faint" style={{ fontSize: 12 }}>
                  {open} open redline{open === 1 ? '' : 's'}{p.analysis ? ` · ${openFindingCount(p.analysis)} open AI finding${openFindingCount(p.analysis) === 1 ? '' : 's'}` : ' · no AI analysis yet'}
                </span>
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="prints-detail">
            <PrintCard print={selected} />
            <ReviewCard project={project} print={selected} reds={reds} />
            <AnalysisCard project={project} print={selected} previous={previous} reds={reds} />
          </div>
        )}
      </div>
    </>
  );
}

function PrintAdder({ project, onAdded }: { project: Project; onAdded: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => newPrint(project.id));
  if (!open) return <button className="btn primary" onClick={() => setOpen(true)}>+ Log a new print</button>;
  const save = () => {
    addPrint({ ...draft, label: draft.label.trim(), status: 'in-review' });
    onAdded(draft.id);
    setDraft(newPrint(project.id));
    setOpen(false);
    toast('Print logged. Next: add the redlines, then ask for the analysis.');
  };
  return (
    <Card title="Log a new print" className="tight">
      <div className="form-grid">
        <Field label="PDF name" required><input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="2026-10-02_Fluence_3.pdf" /></Field>
        <Field label="Made on"><input type="date" value={draft.issuedOn} onChange={(e) => setDraft({ ...draft, issuedOn: e.target.value })} /></Field>
        <Field label="Made by"><input value={draft.by} onChange={(e) => setDraft({ ...draft, by: e.target.value })} placeholder="Jesse Montgomery" /></Field>
        <Field label="Drive link to the PDF"><input value={draft.fileUrl} onChange={(e) => setDraft({ ...draft, fileUrl: e.target.value })} placeholder="https://drive.google.com/file/d/…" /></Field>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" onClick={save} disabled={!draft.label.trim()}>Save print</button>
        <button className="btn ghost" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </Card>
  );
}

function PrintCard({ print }: { print: PrintSet }) {
  const set = (patch: Partial<PrintSet>) => updatePrint(print.id, patch);
  return (
    <Card
      title="Print"
      subtitle="The PDF this review is about."
      actions={print.fileUrl ? <a className="btn sm" href={print.fileUrl} target="_blank" rel="noopener noreferrer">Open PDF ↗</a> : undefined}
    >
      <div className="form-grid">
        <Field label="PDF name"><input value={print.label} onChange={(e) => set({ label: e.target.value })} /></Field>
        <Field label="Status" hint={PRINT_STATUSES.find((s) => s.id === print.status)?.hint}>
          <select value={print.status} onChange={(e) => set({ status: e.target.value as PrintStatus })}>
            {PRINT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </Field>
        <Field label="Made on"><input type="date" value={print.issuedOn} onChange={(e) => set({ issuedOn: e.target.value })} /></Field>
        <Field label="Made by"><input value={print.by} onChange={(e) => set({ by: e.target.value })} /></Field>
        <Field label="Sheets in the PDF"><input type="number" min={0} value={print.sheetCount ?? ''} onChange={(e) => set({ sheetCount: e.target.value === '' ? null : Number(e.target.value) })} /></Field>
        <Field label="Drive link to the PDF"><input value={print.fileUrl} onChange={(e) => set({ fileUrl: e.target.value })} /></Field>
        <Field label="What this print is" className="span-all"><textarea rows={2} value={print.summary} onChange={(e) => set({ summary: e.target.value })} /></Field>
      </div>
      <div className="row between" style={{ marginTop: 10 }}>
        <span className="faint" style={{ fontSize: 12 }}>Saved as you type.</span>
        <ConfirmButton
          label="Delete print"
          confirmLabel="Yes, delete it and its redlines"
          onConfirm={() => {
            const id = print.id;
            deletePrint(id);
            toast(`Deleted ${print.label || 'print'}.`, 'ok', { label: 'Undo', onClick: () => restorePrint(id) });
          }}
        />
      </div>
    </Card>
  );
}

function ReviewCard({ project, print, reds }: { project: Project; print: PrintSet; reds: Redline[] }) {
  const [draft, setDraft] = useState<{ sheet: string; kind: RedlineKind; text: string; by: string }>({ sheet: '', kind: 'fix', text: '', by: '' });
  const [openOnly, setOpenOnly] = useState(false);
  const set = (patch: Partial<PrintSet>) => updatePrint(print.id, patch);
  const done = reds.filter((r) => r.status !== 'open').length;
  const shown = openOnly ? reds.filter((r) => r.status === 'open') : reds;
  const add = () => {
    addRedline(newRedline(project.id, print.id, { sheet: draft.sheet.trim().toUpperCase(), kind: draft.kind, text: draft.text.trim(), by: draft.by.trim() || print.reviewBy }));
    setDraft({ ...draft, text: '' });
  };
  return (
    <Card
      title="Reviews and redlines"
      subtitle="The reviewer's marked-up PDF, then each markup as one line so none get lost."
      actions={reds.some((r) => r.status === 'open') ? <button className="btn sm" onClick={() => copyText(redlineAgenda(print, reds), 'Open redlines copied. Paste into an email or read them out on the call.')}>Copy open redlines</button> : undefined}
    >
      <div className="form-grid">
        <Field label="Marked-up PDF name"><input value={print.reviewFileName} onChange={(e) => set({ reviewFileName: e.target.value })} placeholder="…_REVIEW-BB.pdf" /></Field>
        <Field label="Drive link"><input value={print.reviewFileUrl} onChange={(e) => set({ reviewFileUrl: e.target.value })} /></Field>
        <Field label="Reviewed by"><input value={print.reviewBy} onChange={(e) => set({ reviewBy: e.target.value })} placeholder="Brandon Barkey" /></Field>
        <Field label="Reviewed on"><input type="date" value={print.reviewOn} onChange={(e) => set({ reviewOn: e.target.value })} /></Field>
        <Field label="Summary of the review" className="span-all"><textarea rows={2} value={print.reviewNote} onChange={(e) => set({ reviewNote: e.target.value })} placeholder="What you told the team, when you are meeting…" /></Field>
      </div>
      {print.reviewFileUrl && <div style={{ marginTop: 8 }}><a className="btn sm" href={print.reviewFileUrl} target="_blank" rel="noopener noreferrer">Open marked-up PDF ↗</a></div>}

      <hr />
      <div className="row between" style={{ marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{reds.length === 0 ? 'No redlines logged' : `${done} of ${reds.length} redlines handled`}</div>
          {reds.length > 0 && <Progress value={done} total={reds.length} ok={done === reds.length} />}
        </div>
        {reds.length > 0 && (
          <label className="row" style={{ gap: 6, fontSize: 12.5 }}>
            <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} style={{ width: 'auto' }} /> Open only
          </label>
        )}
      </div>

      {shown.length > 0 && (
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead>
              <tr><th>Sheet</th><th>Redline</th><th>Status</th><th>What was done</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id} className={r.status !== 'open' ? 'row-done' : ''}>
                  <td className="mono">{r.sheet || '—'}<div><Badge kind={r.kind === 'check' ? 'warn' : ''}>{r.kind === 'check' ? 'check' : 'fix'}</Badge></div></td>
                  <td>
                    <textarea rows={2} value={r.text} onChange={(e) => updateRedline(r.id, { text: e.target.value })} aria-label="Redline text" />
                    {r.by && <div className="faint" style={{ fontSize: 11.5 }}>{r.by}</div>}
                  </td>
                  <td>
                    <select value={r.status} onChange={(e) => updateRedline(r.id, { status: e.target.value as RedlineStatus })} aria-label="Redline status">
                      <option value="open">Open</option>
                      <option value="addressed">Addressed</option>
                      <option value="declined">Declined</option>
                    </select>
                  </td>
                  <td><input value={r.response} onChange={(e) => updateRedline(r.id, { response: e.target.value })} placeholder="Fixed in print 3, or why not" aria-label="What was done" /></td>
                  <td>
                    <button
                      className="btn sm ghost"
                      title="Delete this redline"
                      onClick={() => {
                        deleteRedline(r.id);
                        toast('Redline deleted.', 'ok', { label: 'Undo', onClick: () => restoreEntity('redlines', r.id) });
                      }}
                    >✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="form-grid" style={{ marginTop: 12 }}>
        <Field label="Sheet"><input value={draft.sheet} onChange={(e) => setDraft({ ...draft, sheet: e.target.value })} placeholder="PLAN-01" /></Field>
        <Field label="Type">
          <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as RedlineKind })}>
            <option value="fix">Fix: do this</option>
            <option value="check">Check: verify or decide first</option>
          </select>
        </Field>
        <Field label="Reviewer"><input value={draft.by} onChange={(e) => setDraft({ ...draft, by: e.target.value })} placeholder={print.reviewBy || 'Who marked it'} /></Field>
        <Field label="Redline" className="span-all"><input value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && draft.text.trim() && add()} placeholder="Add DIG stamp at least once" /></Field>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <button className="btn primary" onClick={add} disabled={!draft.text.trim()}>Add redline</button>
      </div>
    </Card>
  );
}

function AnalysisCard({ project, print, previous, reds }: { project: Project; print: PrintSet; previous?: PrintSet; reds: Redline[] }) {
  const [pasting, setPasting] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const a = print.analysis;

  const prompt = () => copyText(buildAnalysisPrompt(project, print, reds, previous), 'Prompt copied. Paste it into a Claude chat that can open your Drive, then paste the JSON answer back here.');
  const save = () => {
    const res = parseAnalysis(text);
    if (!res.ok) return setError(res.error);
    setPrintAnalysis(print.id, res.analysis);
    setText('');
    setError('');
    setPasting(false);
    toast('AI analysis saved on this print.');
  };
  const toRedline = (f: AnalysisFinding) => {
    addRedline(newRedline(project.id, print.id, { sheet: f.sheet, kind: 'check', text: f.recommendation || f.issue, by: 'AI analysis' }));
    updateFinding(print.id, f.id, { status: 'done' });
    toast('Added as a redline.');
  };

  return (
    <Card
      title="AI analysis"
      subtitle="Notes and recommendations on this print and what changed since the last one. Always check them against the PDF."
      actions={
        <div className="row" style={{ gap: 6 }}>
          <button className="btn sm" onClick={prompt}>Copy prompt for a new analysis</button>
          <button className="btn sm" onClick={() => setPasting((v) => !v)}>{pasting ? 'Cancel' : 'Paste an analysis'}</button>
        </div>
      }
    >
      {pasting && (
        <div style={{ marginBottom: 12 }}>
          <Field label="Paste the JSON answer" hint="Replaces the analysis below. Findings start as open.">
            <textarea rows={8} value={text} onChange={(e) => { setText(e.target.value); setError(''); }} placeholder='{ "summary": "…", "changes": [], "findings": [] }' className="mono" />
          </Field>
          {error && <Callout kind="bad">{error}</Callout>}
          <div className="row" style={{ marginTop: 6 }}><button className="btn primary" onClick={save} disabled={!text.trim()}>Save analysis</button></div>
        </div>
      )}

      {!a ? (
        <Empty title="No analysis for this print yet">
          Step 1: press "Copy prompt for a new analysis". Step 2: paste it into a Claude chat that can open your Drive. Step 3: press "Paste an analysis" and paste the answer here.
        </Empty>
      ) : (
        <>
          <p style={{ marginTop: 0 }}>{a.summary}</p>
          <Callout kind="info"><strong>What this is based on.</strong> {a.basis} <span className="faint">({a.by}, {fmtDate(a.at)})</span></Callout>

          {a.changes.length > 0 && (
            <>
              <h3 style={{ marginBottom: 6 }}>What changed since the last print</h3>
              <ul className="plain-list">{a.changes.map((c, i) => <li key={i}>{c}</li>)}</ul>
            </>
          )}

          <h3 style={{ margin: '14px 0 6px' }}>Notes and recommendations <span className="faint">({openFindingCount(a)} open of {a.findings.length})</span></h3>
          <div className="findings">
            {sortFindings(a.findings).map((f) => (
              <div key={f.id} className={`finding ${f.status !== 'open' ? 'finding-done' : ''}`}>
                <div className="row" style={{ gap: 6 }}>
                  <Badge kind={SEV_KIND[f.severity]}>{f.severity}</Badge>
                  <span className="mono muted" style={{ fontSize: 12 }}>{f.sheet}</span>
                  {f.status !== 'open' && <Badge kind="ok">{f.status}</Badge>}
                </div>
                <div className="finding-issue">{f.issue}</div>
                {f.recommendation && <div className="finding-rec"><strong>Do:</strong> {f.recommendation}</div>}
                <div className="row" style={{ gap: 6, marginTop: 6 }}>
                  {f.status === 'open' ? (
                    <>
                      <button className="btn sm" onClick={() => updateFinding(print.id, f.id, { status: 'done' })}>Done</button>
                      <button className="btn sm ghost" onClick={() => updateFinding(print.id, f.id, { status: 'dismissed' })}>Dismiss</button>
                      <button className="btn sm ghost" onClick={() => toRedline(f)} title="Log the recommendation as a redline on this print">Make it a redline</button>
                    </>
                  ) : (
                    <button className="btn sm ghost" onClick={() => updateFinding(print.id, f.id, { status: 'open' })}>Reopen</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
