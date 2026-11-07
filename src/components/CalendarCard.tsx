import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { calendarDay, useConnectors, type CalEvent } from '@/lib/connectors';
import { Card } from './ui';

/** The viewer's own meetings for one day, from their claude.ai Google Calendar connector (claude.ai mode only). */
export function CalendarCard({ day }: { day: string }) {
  const { user } = useAuth();
  const conn = useConnectors();
  const [events, setEvents] = useState<CalEvent[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const info = conn.info.calendar;
  const granted = info.permission === 'granted' && info.auth !== 'missing';

  const load = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      setEvents(await calendarDay(day));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [day]);

  // Read on its own only once the person has allowed the calendar; before that, the button asks.
  useEffect(() => {
    if (user?.mode === 'claude' && granted) void load();
  }, [user?.mode, granted, load]);

  if (user?.mode !== 'claude' || !conn.available || info.auth === 'missing') return null;
  const time = (iso: string) => new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  return (
    <Card title="Your calendar" subtitle="From your Google Calendar, through claude.ai. Only you see it." actions={<button className="btn sm ghost" onClick={() => void load()} disabled={busy}>{busy ? 'Reading…' : events ? 'Refresh' : 'Show my day'}</button>}>
      {error && <p className="muted" style={{ margin: 0 }}>{error}</p>}
      {!error && events === null && !busy && <p className="muted" style={{ margin: 0 }}>Press "Show my day" to list today's meetings. The first time, claude.ai asks you to allow Google Calendar.</p>}
      {events && events.length === 0 && <p className="muted" style={{ margin: 0 }}>Nothing on the calendar for this day.</p>}
      {events && events.length > 0 && (
        <ul className="timeline">
          {events.map((e) => (
            <li key={e.id}>
              <span className="when">{e.allDay ? 'all day' : time(e.start)}</span>
              <span>{e.link ? <a href={e.link} target="_blank" rel="noopener noreferrer">{e.title}</a> : e.title}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
