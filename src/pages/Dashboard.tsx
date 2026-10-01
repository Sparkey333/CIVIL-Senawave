import { Link } from 'react-router-dom';
import { useAppData } from '@/store/store';
import { PROJECT_STATUSES } from '@/lib/types';
import { QC_CHECKLIST, WORKFLOW_STEPS, TWO_NUMBERS } from '@/data/guide';
import { daysUntil, fmtDate, todayIso } from '@/lib/ids';
import { Badge, Card, Progress, Stat } from '@/components/ui';
import { StatusBadge } from '@/components/StatusBadge';
import { NextStep } from '@/components/NextStep';
import { setupChecklist } from '@/lib/guidance';
import { useAuth } from '@/lib/auth';
import { loadSnapshot } from '@/lib/driveFiles';

export default function Dashboard() {
  const data = useAppData();
  const { user, googleConfigured } = useAuth();
  const setup = setupChecklist(data, { googleSignedIn: user?.mode === 'google', googleConfigured, driveSnapshot: !!loadSnapshot() });
  const setupDone = setup.filter((s) => s.done).length;
  const active = data.projects.filter((p) => p.status !== 'closed');
  const openActions = data.notes.filter((n) => (n.type === 'action' || n.type === 'redline' || n.type === 'agency-comment') && !n.done);
  const sheetsTotal = active.reduce((a, p) => a + p.sheets.length, 0);
  const sheetsDone = active.reduce((a, p) => a + p.sheets.filter((s) => s.qcDone).length, 0);
  const openPermits = data.permits.filter((p) => !['approved', 'closed', 'denied'].includes(p.status));
  const dueSoon = [
    ...active.filter((p) => p.dueDate).map((p) => ({ kind: 'Plan set', label: `${p.number} ${p.name}`, date: p.dueDate, to: `/projects/${p.id}` })),
    ...openPermits.filter((p) => p.dueOn).map((p) => ({ kind: 'Permit', label: `${p.agencyName || p.agency} — ${p.type}`, date: p.dueOn, to: `/projects/${p.projectId}` })),
    ...openActions.filter((n) => n.dueOn).map((n) => ({ kind: 'Action', label: n.title, date: n.dueOn, to: n.projectId ? `/projects/${n.projectId}` : '/notes' })),
  ]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 8);
  const hoursThisMonth = data.timeEntries.filter((t) => t.date.slice(0, 7) === todayIso().slice(0, 7)).reduce((a, t) => a + t.hours, 0);
  const recentNotes = [...data.notes].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);

  return (
    <>
      {setupDone < setup.length && (
        <Card title={`Getting set up · ${setupDone}/${setup.length}`} subtitle="Baby steps, in order. Each one is a link; the hint says where to click." className="tight">
          <ul className="check-list">
            {setup.map((s) => (
              <li key={s.id} className={s.done ? 'done' : ''}>
                <input type="checkbox" checked={s.done} readOnly />
                <label><Link to={s.to}>{s.label}</Link><span className="meta" style={{ fontFamily: 'inherit' }}>{s.done ? '' : s.hint}</span></label>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <div className="grid cols-4" style={{ marginBottom: 16 }}>
        <Card className="tight"><Stat value={active.length} label="active projects" /></Card>
        <Card className="tight"><Stat value={`${sheetsDone}/${sheetsTotal}`} label="plan sheets through QC" /></Card>
        <Card className="tight"><Stat value={openActions.length} label="open actions / redlines / comments" /></Card>
        <Card className="tight"><Stat value={hoursThisMonth.toFixed(1)} label="hours logged this month" /></Card>
      </div>

      <div className="grid cols-2">
        <Card title="Projects" actions={<Link className="btn sm" to="/projects">All projects</Link>}>
          {active.length === 0 && <p className="muted">No active projects. Create one from the Projects page.</p>}
          {active.map((p) => {
            const wfDone = WORKFLOW_STEPS.filter((s) => p.workflow[s.id]).length;
            const qcDone = QC_CHECKLIST.filter((q) => p.qc[q.id]).length;
            return (
              <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div className="row between">
                  <Link to={`/projects/${p.id}`} style={{ fontWeight: 600, color: 'var(--fg)' }}>
                    <span className="mono muted" style={{ marginRight: 8 }}>{p.number || '—'}</span>
                    {p.name || 'Untitled project'}
                  </Link>
                  <StatusBadge status={p.status} />
                </div>
                <div className="row" style={{ fontSize: 12, color: 'var(--fg-muted)', marginTop: 4 }}>
                  <span>{[p.municipality, p.county && `${p.county} County`].filter(Boolean).join(' · ') || 'Location not set'}</span>
                  {p.funding && <Badge kind="info">{p.funding}</Badge>}
                  <span>{p.sheets.length} sheets</span>
                  {p.dueDate && <span>due {fmtDate(p.dueDate)}</span>}
                </div>
                <div className="grid cols-2" style={{ gap: 8, marginTop: 6 }}>
                  <div><small>Workflow</small><Progress value={wfDone} total={WORKFLOW_STEPS.length} /></div>
                  <div><small>QC</small><Progress value={qcDone} total={QC_CHECKLIST.length} /></div>
                </div>
                {!p.sample && <NextStep project={p} compact />}
              </div>
            );
          })}
        </Card>

        <div>
          <Card title="Due soon">
            {dueSoon.length === 0 && <p className="muted">Nothing with a date. Add due dates to projects, permits and action items.</p>}
            <ul className="timeline">
              {dueSoon.map((d, i) => {
                const days = daysUntil(d.date);
                const kind = days === null ? '' : days < 0 ? 'bad' : days <= 7 ? 'warn' : '';
                return (
                  <li key={i}>
                    <span className="when">{fmtDate(d.date)}</span>
                    <span>
                      <Badge kind={kind as '' | 'bad' | 'warn'}>{d.kind}</Badge> <Link to={d.to}>{d.label}</Link>
                      {days !== null && <span className="faint"> · {days < 0 ? `${-days} d overdue` : days === 0 ? 'today' : `in ${days} d`}</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>
          <Card title="Recent notes" actions={<Link className="btn sm" to="/notes">All notes</Link>}>
            <ul className="timeline">
              {recentNotes.map((n) => (
                <li key={n.id}>
                  <span className="when">{fmtDate(n.updatedAt)}</span>
                  <span>
                    <Link to={n.projectId ? `/projects/${n.projectId}` : '/notes'}>{n.title || '(untitled)'}</Link>
                    <span className="faint"> · {n.type}{n.done ? ' · done' : ''}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid cols-2">
        <Card title="Pipeline">
          <div className="status-strip">
            {PROJECT_STATUSES.map((s) => {
              const n = data.projects.filter((p) => p.status === s.id).length;
              return (
                <span key={s.id} className={n ? 'on' : ''} title={s.hint}>
                  {s.label} {n ? `· ${n}` : ''}
                </span>
              );
            })}
          </div>
        </Card>
        <Card title="Two numbers to memorise" subtitle="Plan Production Guide, section 3">
          <ul>
            {TWO_NUMBERS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <Link to="/reference/numbers" className="btn sm">Open the numbers</Link>
        </Card>
      </div>
    </>
  );
}
