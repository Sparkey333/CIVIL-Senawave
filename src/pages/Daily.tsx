import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { activityOn, addNote, newNote, useAppData } from '@/store/store';
import { nextStepFor, openItems } from '@/lib/guidance';
import { loadSnapshot, recentChanges } from '@/lib/driveFiles';
import { useSetup } from '@/lib/useSetup';
import { nextBabySteps, projectSteps } from '@/lib/nextSteps';
import { BabySteps } from '@/components/BabySteps';
import { CalendarCard } from '@/components/CalendarCard';
import { currentPrint, openFindingCount, printsFor } from '@/lib/prints';
import { FLUENCE_DRIVE_SNAPSHOT } from '@/data/fluenceDrive';
import { daysUntil, fmtDate, todayIso } from '@/lib/ids';
import { Badge, Callout, Card, Tabs, useLocalTab } from '@/components/ui';
import { toast } from '@/components/Toast';

type Tab = 'morning' | 'evening';

export default function Daily() {
  const data = useAppData();
  const { user } = useAuth();
  const defaultTab: Tab = new Date().getHours() >= (data.settings.eveningHour ?? 16) ? 'evening' : 'morning';
  const [tab, setTab] = useLocalTab<Tab>('daily', defaultTab, ['morning', 'evening']);
  const [day, setDay] = useState(todayIso());
  const snap = loadSnapshot() || FLUENCE_DRIVE_SNAPSHOT;

  const active = data.projects.filter((p) => p.status !== 'closed' && !p.sample);
  const items = openItems(data.notes);
  const dueToday = items.filter((n) => n.dueOn && n.dueOn <= day);
  const meetings = data.notes.filter((n) => n.type === 'meeting' && n.dueOn === day);
  const driveRecent = recentChanges(snap, 24);
  const todaysActivity = activityOn(data, day);
  const hoursToday = data.timeEntries.filter((t) => t.date === day).reduce((a, t) => a + t.hours, 0);
  const setup = useSetup();
  const setupLeft = setup.filter((s) => !s.done);
  const steps = nextBabySteps(data, { today: day, setup: [] });
  const projectNames = Object.fromEntries(data.projects.map((p) => [p.id, p.number || p.name]));

  const eveningText = useMemo(
    () =>
      buildEveningText(
        day,
        active.map((p) => ({ p, next: projectSteps(data, p, day)[0]?.title || nextStepFor(p).title })),
        todaysActivity.map((a) => a.label),
        hoursToday,
        items.slice(0, 6).map((n) => `${n.title}${n.dueOn ? ` (due ${fmtDate(n.dueOn)})` : ''}`),
      ),
    [day, data, active, todaysActivity, hoursToday, items],
  );

  const saveLog = () => {
    addNote(newNote(user?.name || 'me', { type: 'note', title: `Evening log — ${fmtDate(day)}`, body: eveningText, tags: ['daily-log'], projectId: active.length === 1 ? active[0].id : null }));
    toast('Evening log saved as a note.');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(eveningText);
      toast('Copied. Paste it into an email to Jesse or your own notes.');
    } catch {
      toast('Clipboard blocked; select the text and copy it.', 'bad');
    }
  };

  return (
    <>
      <div className="row between" style={{ marginBottom: 8 }}>
        <Tabs<Tab> active={tab} onChange={setTab} tabs={[{ id: 'morning', label: 'Morning brief' }, { id: 'evening', label: 'Evening log' }]} />
        <label className="row" style={{ gap: 6, fontSize: 12.5 }}><span className="muted">day</span><input type="date" value={day} onChange={(e) => setDay(e.target.value)} style={{ width: 'auto' }} /></label>
      </div>

      {tab === 'morning' && (
        <>
          {setupLeft.length > 0 && (
            <Callout kind="warn">
              <strong>Setup, {setup.length - setupLeft.length} of {setup.length} done.</strong> Next: <Link to={setupLeft[0].to}>{setupLeft[0].label}</Link> <span className="muted">· {setupLeft[0].hint}</span>
            </Callout>
          )}
          <div className="grid cols-2">
            <div>
              <Card title="Today" subtitle={fmtDate(day)}>
                {meetings.length === 0 && dueToday.length === 0 && <p className="muted">No meetings or due items for this day.</p>}
                {meetings.map((n) => (
                  <div key={n.id} className="row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <Badge kind="info">meeting</Badge> <span>{n.title}</span>
                  </div>
                ))}
                {dueToday.map((n) => (
                  <div key={n.id} className="row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <Badge kind={n.dueOn < day ? 'bad' : 'warn'}>{n.dueOn < day ? 'overdue' : 'due'}</Badge> <span>{n.title}</span>
                  </div>
                ))}
              </Card>
              <Card title="Next baby steps" subtitle="The same list as the Dashboard, for this day. Do them in order.">
                <BabySteps steps={steps} limit={8} projectNames={projectNames} />
              </Card>
              <CalendarCard day={day} />
            </div>
            <div>
              <Card title="Open items" subtitle="Actions, redlines, agency comments, issues — soonest due first." actions={<Link className="btn sm" to="/notes">All notes</Link>}>
                {items.length === 0 ? <p className="muted">Nothing open.</p> : (
                  <ul className="timeline">
                    {items.slice(0, 10).map((n) => {
                      const d = n.dueOn ? daysUntil(n.dueOn) : null;
                      return (
                        <li key={n.id}>
                          <span className="when">{n.dueOn ? fmtDate(n.dueOn) : '—'}</span>
                          <span><Link to={n.projectId ? `/projects/${n.projectId}?tab=notes` : '/notes'}>{n.title}</Link>{d !== null && <span className="faint"> · {d < 0 ? `${-d} d overdue` : d === 0 ? 'today' : `in ${d} d`}</span>}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
              <Card title="Prints and redlines" subtitle="Latest print per project, what is still open on it.">
                {active.every((p) => printsFor(data.prints, p.id).length === 0) ? <p className="muted">No prints logged yet. Log one from a project's Prints &amp; reviews tab.</p> : active.map((p) => {
                  const cur = currentPrint(printsFor(data.prints, p.id));
                  if (!cur) return null;
                  const open = data.redlines.filter((r) => r.printId === cur.id && r.status === 'open');
                  return (
                    <div key={p.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <div><Link to={`/projects/${p.id}?tab=prints`} style={{ fontWeight: 600, color: 'var(--fg)' }}>{cur.label}</Link></div>
                      <div className="muted" style={{ fontSize: 12.5 }}>
                        {open.length} open redline{open.length === 1 ? '' : 's'}
                        {cur.analysis ? ` · ${openFindingCount(cur.analysis)} open AI note${openFindingCount(cur.analysis) === 1 ? '' : 's'}` : ' · no AI analysis yet'}
                      </div>
                      {open.slice(0, 3).map((r) => <div key={r.id} className="faint" style={{ fontSize: 12 }}>• {r.sheet ? `${r.sheet}: ` : ''}{r.text.slice(0, 80)}</div>)}
                    </div>
                  );
                })}
              </Card>
              <Card title="Drive: changed in the last 24 h" actions={<Link className="btn sm" to="/files">Files</Link>}>
                {driveRecent.length === 0 ? <p className="muted">No file changes in the Design folder snapshot. Refresh it on the Files page.</p> : (
                  <ul className="timeline">
                    {driveRecent.slice(0, 8).map((n) => <li key={n.id}><span className="when">{fmtDate(n.modifiedTime)}</span><span><a href={n.webViewLink} target="_blank" rel="noopener noreferrer">{n.name}</a> <span className="faint">{n.modifiedBy}</span></span></li>)}
                  </ul>
                )}
              </Card>
              <Card title="Mail" actions={<Link className="btn sm" to="/inbox">Senawave inbox</Link>}>
                <p className="muted" style={{ marginBottom: 0 }}>Read the Senawave inbox for anything new from Jesse or David, then file what matters as a meeting note, decision or action with a due date.</p>
              </Card>
            </div>
          </div>
        </>
      )}

      {tab === 'evening' && (
        <div className="grid cols-2">
          <div>
            <Card title={`Done on ${fmtDate(day)}`} subtitle="Pulled from what you ticked, added and logged in the tracker today.">
              {todaysActivity.length === 0 ? <p className="muted">Nothing recorded yet. Ticks on workflow / QC / sheets, new notes, permits and time entries all land here.</p> : (
                <ul className="timeline">
                  {todaysActivity.map((a) => <li key={a.id}><span className="when">{new Date(a.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span><span><Badge>{a.kind}</Badge> {a.label}</span></li>)}
                </ul>
              )}
              <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>Hours logged today: <strong>{hoursToday.toFixed(2)}</strong> · <Link to="/time">log time</Link></p>
            </Card>
          </div>
          <div>
            <Card title="Evening log (text)" subtitle="What got done, what is next, what is blocked. Save it as a note or paste it into an email." actions={<span className="row"><button className="btn sm" onClick={() => void copy()}>Copy</button><button className="btn sm primary" onClick={saveLog}>Save as note</button></span>}>
              <textarea readOnly value={eveningText} style={{ minHeight: 320, fontFamily: 'var(--mono)', fontSize: 12.5 }} />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

export function buildEveningText(day: string, projects: { p: { number: string; name: string; status: string }; next: string }[], done: string[], hours: number, open: string[]): string {
  const lines: string[] = [`Evening log — ${fmtDate(day)}`, ''];
  lines.push('DONE TODAY');
  lines.push(...(done.length ? done.map((d) => `- ${d}`) : ['- (nothing recorded in the tracker)']));
  lines.push('', `HOURS: ${hours.toFixed(2)}`, '', 'NEXT');
  lines.push(...(projects.length ? projects.map(({ p, next }) => `- ${p.number} ${p.name} [${p.status}]: ${next}`) : ['- no active projects']));
  lines.push('', 'OPEN / WAITING ON');
  lines.push(...(open.length ? open.map((o) => `- ${o}`) : ['- nothing open']));
  return lines.join('\n');
}
