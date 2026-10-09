import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addProject, newProject, useAppData } from '@/store/store';
import { PROJECT_STATUSES, type ProjectStatus } from '@/lib/types';
import { QC_CHECKLIST, WORKFLOW_STEPS, sheetsForRun } from '@/data/guide';
import { fmtDate, fmtFt } from '@/lib/ids';
import { Badge, Card, Empty, Progress } from '@/components/ui';
import { ProjectForm } from '@/components/ProjectForm';
import { StatusBadge } from '@/components/StatusBadge';

export default function Projects() {
  const data = useAppData();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | ProjectStatus>('active');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(() => newProject({ designer: data.settings.ownerName }));

  const rows = useMemo(() => {
    let xs = data.projects;
    if (status === 'active') xs = xs.filter((p) => p.status !== 'closed');
    else if (status !== 'all') xs = xs.filter((p) => p.status === status);
    if (q.trim()) {
      const s = q.toLowerCase();
      xs = xs.filter((p) => [p.number, p.name, p.municipality, p.county, p.pm, p.engineer].some((f) => f.toLowerCase().includes(s)));
    }
    return [...xs].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [data.projects, q, status]);

  const create = () => {
    if (!draft.name.trim()) return;
    const p = { ...draft, name: draft.name.trim(), number: draft.number.trim() };
    addProject(p);
    setCreating(false);
    setDraft(newProject({ designer: data.settings.ownerName }));
    nav(`/projects/${p.id}`);
  };

  return (
    <>
      <div className="toolbar">
        <input className="search" placeholder="Search number, name, city, county, people…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} style={{ width: 'auto' }}>
          <option value="active">Active</option>
          <option value="all">All</option>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <div className="spacer" />
        <button className="btn primary" onClick={() => setCreating((v) => !v)}>{creating ? 'Close' : '+ New project'}</button>
      </div>

      {creating && (
        <Card title="New project" subtitle="One project = one drawing = one plan set. The sheet tracker, workflow and QC lists are created with it.">
          <ProjectForm value={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} />
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={create} disabled={!draft.name.trim()}>Create project</button>
            {draft.routeLengthFt ? <span className="muted">≈ {sheetsForRun(draft.routeLengthFt)} plan sheets for a straight {fmtFt(draft.routeLengthFt)} run (÷ 685, rounded up)</span> : null}
          </div>
        </Card>
      )}

      {rows.length === 0 ? (
        <Empty title="No projects here">
          <p>Create one with “+ New project”, or change the filter.</p>
        </Empty>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>No.</th>
                <th>Project</th>
                <th>Where</th>
                <th>Status</th>
                <th>Sheets</th>
                <th>Workflow</th>
                <th>QC</th>
                <th>EOR / PM</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const wf = WORKFLOW_STEPS.filter((s) => p.workflow[s.id]).length;
                const qc = QC_CHECKLIST.filter((s) => p.qc[s.id]).length;
                const sheetsQc = p.sheets.filter((s) => s.qcDone).length;
                return (
                  <tr key={p.id} className="clickable" onClick={() => nav(`/projects/${p.id}`)}>
                    <td className="mono nowrap">{p.number || '—'}</td>
                    <td>
                      <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: 'var(--fg)' }} onClick={(e) => e.stopPropagation()}>{p.name || 'Untitled'}</Link>
                      {p.sample && <Badge title="Seeded demo data">sample</Badge>}
                      <div className="faint" style={{ fontSize: 12 }}>{p.funding && <span>{p.funding} · </span>}{p.crs} · {fmtFt(p.routeLengthFt)}</div>
                    </td>
                    <td>{[p.municipality, p.county && `${p.county} Co.`].filter(Boolean).join(', ') || '—'}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td className="num">{sheetsQc}/{p.sheets.length}</td>
                    <td style={{ minWidth: 120 }}><Progress value={wf} total={WORKFLOW_STEPS.length} /></td>
                    <td style={{ minWidth: 120 }}><Progress value={qc} total={QC_CHECKLIST.length} /></td>
                    <td style={{ fontSize: 12.5 }}>{p.engineer || '—'}<br /><span className="muted">{p.pm || '—'}</span></td>
                    <td className="nowrap">{fmtDate(p.dueDate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
