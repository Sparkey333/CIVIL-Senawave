import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { SCOPES } from '@/lib/google';
import { extractTasks, groupThreads, listSenawaveMail, type MailMessage } from '@/lib/gmail';
import { addNote, logActivity, newNote, useAppData } from '@/store/store';
import type { NoteType } from '@/lib/types';
import { Badge, Callout, Card, Empty } from '@/components/ui';
import { fmtDateTime } from '@/lib/ids';
import { toast } from '@/components/Toast';

const CACHE_KEY = 'senawave-tracker:mail-cache';

function loadCache(): { at: string; messages: MailMessage[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as { at: string; messages: MailMessage[] }) : null;
  } catch {
    return null;
  }
}

export default function Inbox() {
  const data = useAppData();
  const { user, getToken } = useAuth();
  const [cache, setCache] = useState(() => loadCache());
  const [busy, setBusy] = useState(false);
  const [projectId, setProjectId] = useState(() => data.projects.find((p) => !p.sample)?.id || '');
  const threads = useMemo(() => groupThreads(cache?.messages || []), [cache]);
  const unread = threads.filter((t) => t.unread).length;

  const refresh = async () => {
    if (!user || user.mode !== 'google') return toast('Sign in with Google first.', 'bad');
    if (!data.settings.gmailEnabled) return toast('Turn on the Gmail connection in Settings → Connections first.', 'bad');
    setBusy(true);
    try {
      const token = await getToken(SCOPES.gmailReadonly);
      const messages = await listSenawaveMail(token, user.email, { days: 45, max: 60 });
      const next = { at: new Date().toISOString(), messages };
      localStorage.setItem(CACHE_KEY, JSON.stringify(next));
      const newCount = messages.filter((m) => !cache?.messages.some((x) => x.id === m.id) && !m.isMine).length;
      setCache(next);
      toast(newCount ? `${newCount} new Senawave message${newCount > 1 ? 's' : ''}.` : 'Mailbox refreshed; nothing new from Senawave.');
      if (newCount) logActivity('email', `${newCount} new Senawave email${newCount > 1 ? 's' : ''}`, null);
    } catch (err) {
      toast((err as Error).message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  const fileAs = (m: MailMessage, type: NoteType, title: string, body: string) => {
    addNote(newNote(user?.name || 'me', { type, title, body: `${body}\n\nFrom ${m.from} <${m.fromEmail}> · ${fmtDateTime(m.date)}\n${m.link}`, tags: ['email', m.fromEmail.split('@')[0]], projectId: projectId || null }));
    toast(`Filed as ${type}.`, 'ok', { label: 'Open notes', onClick: () => (window.location.href = projectId ? `/projects/${projectId}?tab=notes` : '/notes') });
  };

  return (
    <>
      <Callout kind="info">
        <div className="row between">
          <span>
            <strong>Mail from @senawave.com only</strong> (Jesse, David, anyone on the domain), read-only. {cache ? `Last read ${fmtDateTime(cache.at)} · ${threads.length} threads${unread ? ` · ${unread} unread` : ''}.` : 'Not read yet.'}
          </span>
          <span className="row">
            <label className="row" style={{ gap: 4, fontSize: 12.5 }}>
              <span className="muted">file into</span>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 'auto' }}>
                <option value="">— general —</option>
                {data.projects.map((p) => <option key={p.id} value={p.id}>{p.number} {p.name}</option>)}
              </select>
            </label>
            <a className="btn sm" href="https://mail.google.com/mail/u/0/#search/senawave.com" target="_blank" rel="noopener noreferrer">Open in Gmail ↗</a>
            <button className="btn sm primary" onClick={() => void refresh()} disabled={busy}>{busy ? 'Reading…' : 'Refresh'}</button>
          </span>
        </div>
      </Callout>
      {!cache && (
        <Empty title="No Senawave mail loaded yet">
          <p>Settings → Connections → Gmail (read-only), sign in with Google, then Refresh. The threads Jesse and David have sent so far (introduction, geopackage, getting started, stamped plans, hours, meetings) were already turned into notes on the Fluence project — see <Link to="/projects">Projects</Link>.</p>
        </Empty>
      )}
      {threads.map((t) => (
        <Card key={t.threadId} className="tight" title={<span>{t.subject} {t.unread && <Badge kind="accent">unread</Badge>}</span>} subtitle={`${t.messages.length} message${t.messages.length > 1 ? 's' : ''} · latest ${fmtDateTime(t.latest.date)} from ${t.latest.from}`} actions={<a className="btn sm ghost" href={t.latest.link} target="_blank" rel="noopener noreferrer">Open ↗</a>}>
          {t.messages.slice(0, 3).map((m) => (
            <MessageRow key={m.id} m={m} onFile={fileAs} />
          ))}
          {t.messages.length > 3 && <p className="faint" style={{ fontSize: 12 }}>… {t.messages.length - 3} older in this thread</p>}
        </Card>
      ))}
    </>
  );
}

function MessageRow({ m, onFile }: { m: MailMessage; onFile: (m: MailMessage, type: NoteType, title: string, body: string) => void }) {
  const tasks = useMemo(() => (m.isMine ? [] : extractTasks(m.snippet)), [m]);
  return (
    <div style={{ padding: '6px 0', borderTop: '1px solid var(--border)' }}>
      <div className="row between">
        <span style={{ fontSize: 12.5 }}><strong>{m.isMine ? 'You' : m.from}</strong> <span className="faint">{fmtDateTime(m.date)}</span></span>
        <span className="row" style={{ gap: 4 }}>
          <button className="btn sm ghost" onClick={() => onFile(m, 'meeting', m.subject, m.snippet)}>Meeting note</button>
          <button className="btn sm ghost" onClick={() => onFile(m, 'decision', m.subject, m.snippet)}>Decision</button>
          <button className="btn sm ghost" onClick={() => onFile(m, 'action', m.subject, m.snippet)}>Action</button>
        </span>
      </div>
      <div className="muted" style={{ fontSize: 13 }}>{m.snippet}</div>
      {tasks.length > 0 && (
        <div className="row" style={{ gap: 4, marginTop: 4 }}>
          <span className="faint" style={{ fontSize: 11.5 }}>looks like a task:</span>
          {tasks.map((t) => (
            <button key={t} className="tag" style={{ cursor: 'pointer', border: 0 }} title="Add as an action item" onClick={() => onFile(m, 'action', t.slice(0, 80), t)}>+ {t.slice(0, 60)}{t.length > 60 ? '…' : ''}</button>
          ))}
        </div>
      )}
    </div>
  );
}
