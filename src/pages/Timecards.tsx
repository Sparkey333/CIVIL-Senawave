import { useEffect, useMemo, useState } from 'react';
import type { TimeEntry } from '@/lib/types';
import { PAY_METHODS, PAY_STATUSES } from '@/lib/types';
import { addDays, cardFor, dayName, sentCards, shortDate, timecardSubject, timecardText, weekDays, weekRange, weekStart, type CardState } from '@/lib/timecard';
import { todayIso, nowIso } from '@/lib/ids';
import { addTimeEntry, deleteTimeEntry, localDay, newTimeEntry, updateSettings, updateTimeEntry, useAppData } from '@/store/store';
import { toast } from '@/components/Toast';

const CHECKLIST = [
  { id: 'w9', label: 'W-9 sent to Senawave' },
  { id: 'ach', label: 'ACH / direct-deposit details on file (Gusto)' },
  { id: 'eo', label: 'E&O / liability certificate provided' },
  { id: 'es', label: 'Quarterly estimated taxes set aside (1040-ES)' },
  { id: '1099', label: '1099-NEC received in January' },
];

const STATE_LABEL: Record<CardState, string> = { empty: 'Not sent', 'not-sent': 'Not sent', changed: 'Changed since sent', sent: 'Sent', paid: 'Paid' };

export default function Timecards() {
  const data = useAppData();
  const s = data.settings;
  const [start, setStart] = useState(() => weekStart(todayIso()));
  const thisWeek = weekStart(todayIso());
  const card = useMemo(() => cardFor(start, data.timeEntries), [start, data.timeEntries]);
  const history = useMemo(() => sentCards(data.timeEntries), [data.timeEntries]);
  const awaiting = history.filter((c) => c.state !== 'paid');
  const name = s.ownerName || 'Brandon Barkey';
  const status = PAY_STATUSES.find((p) => p.id === s.payStatus)?.label ?? 'Contract (1099)';
  const to = s.timecardTo || 'david@senawave.com';
  const text = timecardText(card, { name, status });
  const subject = timecardSubject(card, name);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  const payer = s.timecardToName || to.split('@')[0].replace(/^\w/, (c) => c.toUpperCase());

  const markSent = () => {
    if (!card.entries.length) return;
    const at = nowIso();
    for (const t of card.entries) if (!t.sentAt || !t.invoiced) updateTimeEntry(t.id, { sentAt: at, invoiced: true });
    toast(`Timecard for ${weekRange(card.start)} marked sent.`, 'ok', { label: 'Undo', onClick: () => card.entries.forEach((t) => (!t.sentAt || !t.invoiced) && updateTimeEntry(t.id, { sentAt: t.sentAt ?? null, invoiced: t.invoiced })) });
  };
  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Timecard copied — paste it into an email to ' + to + '.');
    } catch {
      toast('Could not reach the clipboard here; use Other mail app instead.', 'bad');
    }
  };
  const setPaid = (weekStartIso: string, paid: boolean) => {
    const at = paid ? nowIso() : null;
    for (const t of cardFor(weekStartIso, data.timeEntries).entries) if (t.sentAt) updateTimeEntry(t.id, { paidAt: at });
    toast(paid ? `${weekRange(weekStartIso)} marked paid.` : `${weekRange(weekStartIso)} back to pending.`);
  };

  return (
    <div className="tc">
      <div className="tc-head">
        <h1>Weekly timecards</h1>
        <p className="muted">Due Fridays to {payer} ({to}). Weeks run Saturday → Friday.</p>
      </div>

      <div className="tc-stats">
        <div className="tc-stat">
          <div className="tc-label">This card</div>
          <div className="tc-big">{card.hours.toFixed(2)} h</div>
          <div className="muted">{weekRange(start)}</div>
        </div>
        <div className="tc-stat">
          <div className="tc-label">Cards sent</div>
          <div className="tc-big">{history.length}</div>
        </div>
        <div className="tc-stat">
          <div className="tc-label">Awaiting pay</div>
          <div className="tc-big">{awaiting.length}</div>
          {awaiting.length > 0 && <div className="muted">{awaiting.reduce((a, c) => a + c.hours, 0).toFixed(2)} h</div>}
        </div>
      </div>

      <section className="tc-panel">
        <div className="tc-panel-head">
          <span className="tc-label">Timecard</span>
          <div className="spacer" />
          <button className="tc-link" onClick={() => setStart(addDays(start, -7))}>← Prev</button>
          <button className="tc-link" onClick={() => setStart(thisWeek)} disabled={start === thisWeek}>This week</button>
          <button className="tc-link" onClick={() => setStart(addDays(start, 7))}>Next →</button>
        </div>

        <div className="tc-card">
          <div className="tc-band">
            <div>
              <div className="tc-band-title">Senawave · Timecard</div>
              <div className="tc-band-sub">{name} · {status}</div>
            </div>
            <span className={`tc-pill ${card.state}`}>{STATE_LABEL[card.state]}</span>
          </div>
          {weekDays(start).map((day) => (
            <DayRows key={day} day={day} entries={card.entries.filter((t) => t.date === day)} />
          ))}
          <div className="tc-total">
            <span className="tc-label">Total</span>
            <span className="tc-big-sm">{card.hours.toFixed(2)} h</span>
          </div>
        </div>

        <div className="tc-actions">
          <a className={`btn tc-send ${card.entries.length ? '' : 'disabled'}`} href={card.entries.length ? gmailUrl : undefined} target="_blank" rel="noopener noreferrer" onClick={markSent} aria-disabled={!card.entries.length}>
            Email to {payer} (Gmail)
          </a>
          <a className="tc-link" href={card.entries.length ? mailtoUrl : undefined} onClick={markSent} aria-disabled={!card.entries.length}>Other mail app</a>
          <button className="tc-link" onClick={copyText} disabled={!card.entries.length}>Copy text</button>
        </div>
        <p className="muted tc-note">Opens a ready-to-send email from your own account; the card is marked sent when you click (Undo in the toast if you don't send it).</p>
      </section>

      <div className="tc-two">
        <section className="tc-panel">
          <div className="tc-panel-head"><span className="tc-label">Pay &amp; tax setup</span></div>
          <div className="tc-body">
            <div className="tc-pair">
              <label>
                <span className="tc-label">Status</span>
                <select value={s.payStatus} onChange={(e) => updateSettings({ payStatus: e.target.value as typeof s.payStatus })}>
                  {PAY_STATUSES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </label>
              <label>
                <span className="tc-label">Paid by</span>
                <select value={s.payMethod} onChange={(e) => updateSettings({ payMethod: e.target.value as typeof s.payMethod })}>
                  {PAY_METHODS.map((m) => <option key={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <div className="tc-pair tc-to">
              <label>
                <span className="tc-label">Timecards go to</span>
                <input value={s.timecardToName} onChange={(e) => updateSettings({ timecardToName: e.target.value })} placeholder="Dave" />
              </label>
              <label>
                <span className="tc-label">Email</span>
                <input type="email" value={to} onChange={(e) => updateSettings({ timecardTo: e.target.value.trim() })} />
              </label>
            </div>
            <ul className="tc-checks">
              {CHECKLIST.map((c) => (
                <li key={c.id}>
                  <label>
                    <input type="checkbox" checked={!!s.payChecklist?.[c.id]} onChange={(e) => updateSettings({ payChecklist: { ...s.payChecklist, [c.id]: e.target.checked } })} />
                    {c.label}
                  </label>
                </li>
              ))}
            </ul>
            <p className="muted tc-note">Switching to W-2 later means new onboarding in Gusto and withholding instead of self-employment tax — confirm the change with {payer} and your tax advisor. Kept on this device only.</p>
          </div>
        </section>

        <section className="tc-panel">
          <div className="tc-panel-head"><span className="tc-label">Timecard history</span></div>
          <table className="tc-hist">
            <thead>
              <tr><th>Week</th><th>Hours</th><th>Sent</th><th>Pay</th><th /></tr>
            </thead>
            <tbody>
              {history.map((c) => (
                <tr key={c.start}>
                  <td><button className="tc-link plain" onClick={() => setStart(c.start)}>{weekRange(c.start)}</button></td>
                  <td className="mono">{c.hours.toFixed(2)}</td>
                  <td className="mono">{c.sentAt ? shortDate(localDay(c.sentAt)) : '—'}</td>
                  <td><span className={`tc-pill ${c.state === 'paid' ? 'paid' : c.state === 'changed' ? 'changed' : 'pending'}`}>{c.state === 'paid' ? 'Paid' : c.state === 'changed' ? 'Changed' : 'Pending'}</span></td>
                  <td className="right">
                    {c.state === 'paid'
                      ? <button className="tc-link" onClick={() => setPaid(c.start, false)}>Undo</button>
                      : <button className="tc-link" onClick={() => setPaid(c.start, true)}>Mark paid</button>}
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan={5} className="muted" style={{ textAlign: 'center', padding: 20 }}>No timecards sent yet.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
      <p className="tc-foot">Your own record · pay and tax setup stay on this device · hours sync with your time log</p>
    </div>
  );
}

/** One day of the card: a row per entry already logged that day, or one blank row to fill in. */
function DayRows({ day, entries }: { day: string; entries: TimeEntry[] }) {
  const rows: (TimeEntry | null)[] = entries.length ? entries : [null];
  return (
    <>
      {rows.map((t, i) => (
        <DayRow key={t?.id ?? `new-${day}`} day={day} entry={t} first={i === 0} />
      ))}
    </>
  );
}

function DayRow({ day, entry, first }: { day: string; entry: TimeEntry | null; first: boolean }) {
  const [hours, setHours] = useState(entry ? String(entry.hours) : '');
  const [desc, setDesc] = useState(entry?.description ?? '');
  // A change from elsewhere (sync, the time log) refreshes the row.
  useEffect(() => {
    if (!entry) return;
    setHours(String(entry.hours));
    setDesc(entry.description);
  }, [entry?.updatedAt]); // eslint-disable-line react-hooks/exhaustive-deps
  const dirty = entry ? Number(hours || 0) !== entry.hours || desc !== entry.description : Number(hours || 0) > 0 || desc.trim() !== '';

  const save = () => {
    const h = Number(hours || 0);
    if (!Number.isFinite(h) || h < 0 || h > 24) {
      toast('Hours must be between 0 and 24.', 'bad');
      return;
    }
    if (entry) {
      if (h === 0 && !desc.trim()) {
        deleteTimeEntry(entry.id);
        toast(`${dayName(day)} ${shortDate(day)} cleared.`);
      } else updateTimeEntry(entry.id, { hours: h, description: desc.trim(), ...(entry.sentAt ? { invoiced: false } : {}) });
    } else if (h > 0) {
      addTimeEntry(newTimeEntry({ date: day, hours: h, description: desc.trim() }));
      setHours('');
      setDesc('');
    }
  };

  return (
    <div className="tc-row">
      <div className="tc-day">{first && (<><b>{dayName(day)}</b><span>{shortDate(day)}</span></>)}</div>
      <input className="tc-hours" inputMode="decimal" placeholder="0" value={hours} onChange={(e) => setHours(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && dirty && save()} aria-label={`Hours ${dayName(day)} ${shortDate(day)}`} />
      <input className="tc-desc" placeholder="What you worked on" value={desc} onChange={(e) => setDesc(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && dirty && save()} aria-label={`Work ${dayName(day)} ${shortDate(day)}`} />
      <button className="tc-link" onClick={save} disabled={!dirty}>Save</button>
    </div>
  );
}
