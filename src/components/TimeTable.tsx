import { useMemo, useState } from 'react';
import type { TimeEntry } from '@/lib/types';
import { addTimeEntry, deleteTimeEntry, newTimeEntry, updateTimeEntry, useAppData } from '@/store/store';
import { todayIso } from '@/lib/ids';
import { Callout, ConfirmButton, Field } from './ui';
import { toast } from './Toast';

export function csvForEntries(entries: TimeEntry[], projectName: (id: string | null) => string, rate: number | null): string {
  const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
  const head = ['Date', 'Project', 'Description', 'Hours', 'Billable', 'Invoiced', 'Rate', 'Amount'];
  const rows = entries.map((t) => [t.date, projectName(t.projectId), t.description, t.hours, t.billable ? 'yes' : 'no', t.invoiced ? 'yes' : 'no', rate ?? '', rate && t.billable ? (t.hours * rate).toFixed(2) : '']);
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}

export function TimeTable({ projectId }: { projectId?: string }) {
  const data = useAppData();
  const [draft, setDraft] = useState(() => newTimeEntry({ projectId: projectId ?? null, date: todayIso() }));
  const [month, setMonth] = useState<string>('all');
  const rate = data.settings.hourlyRate;
  const projectName = (id: string | null) => {
    const p = data.projects.find((x) => x.id === id);
    return p ? `${p.number} ${p.name}`.trim() : '(general)';
  };
  const months = useMemo(() => [...new Set(data.timeEntries.map((t) => t.date.slice(0, 7)))].sort().reverse(), [data.timeEntries]);
  const entries = useMemo(
    () =>
      [...data.timeEntries]
        .filter((t) => (projectId ? t.projectId === projectId : true))
        .filter((t) => (month === 'all' ? true : t.date.slice(0, 7) === month))
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
    [data.timeEntries, projectId, month],
  );
  const total = entries.reduce((a, t) => a + t.hours, 0);
  const billable = entries.filter((t) => t.billable).reduce((a, t) => a + t.hours, 0);
  const uninvoiced = entries.filter((t) => t.billable && !t.invoiced).reduce((a, t) => a + t.hours, 0);

  const add = () => {
    if (!draft.hours || draft.hours <= 0) return;
    addTimeEntry({ ...draft, description: draft.description.trim() });
    setDraft(newTimeEntry({ projectId: projectId ?? draft.projectId, date: draft.date }));
  };

  const exportCsv = () => {
    const csv = csvForEntries(entries, projectName, rate);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `senawave-time-${month === 'all' ? 'all' : month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('CSV exported — attach it to your Gusto invoice or timesheet.');
  };

  const markInvoiced = () => {
    for (const t of entries) if (t.billable && !t.invoiced) updateTimeEntry(t.id, { invoiced: true });
    toast('Marked all shown billable hours as invoiced.');
  };

  return (
    <>
      <div className="card tight" style={{ background: 'var(--bg-sunken)' }}>
        <div className="form-grid">
          <Field label="Date">
            <input type="date" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
          </Field>
          {!projectId && (
            <Field label="Project">
              <select value={draft.projectId ?? ''} onChange={(e) => setDraft({ ...draft, projectId: e.target.value || null })}>
                <option value="">— general —</option>
                {data.projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.number} {p.name}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Hours">
            <input type="number" min={0.25} step={0.25} value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: Number(e.target.value) })} />
          </Field>
          <Field label="Description" className="span-2">
            <input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Sheet index, PLAN-03..05 alignment, PE redlines…" onKeyDown={(e) => e.key === 'Enter' && add()} />
          </Field>
          <Field label="Billable">
            <select value={draft.billable ? 'yes' : 'no'} onChange={(e) => setDraft({ ...draft, billable: e.target.value === 'yes' })}>
              <option value="yes">Billable</option>
              <option value="no">Non-billable</option>
            </select>
          </Field>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={add}>Log time</button>
        </div>
      </div>

      <div className="toolbar">
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ width: 'auto' }}>
          <option value="all">All months</option>
          {months.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <span className="muted" style={{ fontSize: 12.5 }}>
          {total.toFixed(2)} h total · {billable.toFixed(2)} h billable · {uninvoiced.toFixed(2)} h not yet invoiced
          {rate ? ` · $${(uninvoiced * rate).toLocaleString(undefined, { maximumFractionDigits: 2 })} open at $${rate}/h` : ''}
        </span>
        <div className="spacer" />
        <button className="btn sm" onClick={exportCsv} disabled={entries.length === 0}>Export CSV</button>
        <button className="btn sm" onClick={markInvoiced} disabled={uninvoiced === 0}>Mark shown as invoiced</button>
      </div>
      {!rate && <Callout kind="info"><p>Set your hourly rate in Settings to see invoice totals here. Gusto contractor payments are entered by the payer; this log is your own record and the CSV is what you attach or copy into the invoice.</p></Callout>}
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead>
            <tr>
              <th>Date</th>
              {!projectId && <th>Project</th>}
              <th>Description</th>
              <th className="num">Hours</th>
              <th>Billable</th>
              <th>Invoiced</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map((t) => (
              <tr key={t.id}>
                <td className="nowrap">{t.date}</td>
                {!projectId && <td>{projectName(t.projectId)}</td>}
                <td>{t.description}</td>
                <td className="num">{t.hours.toFixed(2)}</td>
                <td><input type="checkbox" checked={t.billable} onChange={(e) => updateTimeEntry(t.id, { billable: e.target.checked })} /></td>
                <td><input type="checkbox" checked={t.invoiced} onChange={(e) => updateTimeEntry(t.id, { invoiced: e.target.checked })} /></td>
                <td><ConfirmButton label="×" className="btn sm ghost" onConfirm={() => deleteTimeEntry(t.id)} /></td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} className="muted" style={{ textAlign: 'center', padding: 20 }}>No time logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
