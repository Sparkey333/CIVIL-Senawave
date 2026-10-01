import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Note, NoteType } from '@/lib/types';
import { NOTE_TYPES } from '@/lib/types';
import { addNote, deleteNote, newNote, restoreEntity, updateNote, useAppData } from '@/store/store';
import { toast } from './Toast';
import { useAuth } from '@/lib/auth';
import { fmtDate, fmtDateTime } from '@/lib/ids';
import { Badge, ConfirmButton, Empty, Field } from './ui';

const TYPE_KIND: Record<NoteType, '' | 'ok' | 'warn' | 'bad' | 'info' | 'accent'> = {
  note: '',
  action: 'warn',
  redline: 'bad',
  'agency-comment': 'info',
  meeting: '',
  decision: 'ok',
  issue: 'accent',
};

export function NoteComposer({ projectId, onDone }: { projectId?: string | null; onDone?: () => void }) {
  const { user } = useAuth();
  const data = useAppData();
  const [draft, setDraft] = useState(() => newNote(user?.name || 'me', { projectId: projectId ?? null }));
  const [tags, setTags] = useState('');
  const project = data.projects.find((p) => p.id === draft.projectId);

  const submit = () => {
    if (!draft.title.trim() && !draft.body.trim()) return;
    addNote({
      ...draft,
      title: draft.title.trim() || draft.body.trim().slice(0, 60),
      tags: tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean),
      author: user?.name || draft.author,
    });
    setDraft(newNote(user?.name || 'me', { projectId: projectId ?? null }));
    setTags('');
    onDone?.();
  };

  return (
    <div className="card tight" style={{ background: 'var(--bg-sunken)' }}>
      <div className="form-grid">
        <Field label="Type">
          <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as NoteType })}>
            {NOTE_TYPES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </Field>
        {projectId === undefined && (
          <Field label="Project">
            <select value={draft.projectId ?? ''} onChange={(e) => setDraft({ ...draft, projectId: e.target.value || null, sheetNo: null })}>
              <option value="">— general —</option>
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>{p.number} {p.name}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Sheet (PLAN-nn)">
          <select value={draft.sheetNo ?? ''} onChange={(e) => setDraft({ ...draft, sheetNo: e.target.value ? Number(e.target.value) : null })} disabled={!project}>
            <option value="">—</option>
            {project?.sheets.map((s) => (
              <option key={s.id} value={s.pageNumber}>PLAN-{String(s.pageNumber).padStart(2, '0')}</option>
            ))}
          </select>
        </Field>
        <Field label="Due (actions / redlines)">
          <input type="date" value={draft.dueOn} onChange={(e) => setDraft({ ...draft, dueOn: e.target.value })} />
        </Field>
        <Field label="Title" className="span-2">
          <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Short summary" onKeyDown={(e) => e.key === 'Enter' && submit()} />
        </Field>
        <Field label="Tags (comma separated)" className="span-2">
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="depth-of-cover, udot, blue-stakes" />
        </Field>
        <Field label="Details" className="span-all">
          <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} placeholder="What was said / decided / needs doing. Ctrl+Enter to save." onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === 'Enter' && submit()} />
        </Field>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn primary" onClick={submit}>Add note</button>
        <span className="faint" style={{ fontSize: 12 }}>as {user?.name}</span>
      </div>
    </div>
  );
}

export function NoteItem({ note, showProject }: { note: Note; showProject?: boolean }) {
  const data = useAppData();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const project = data.projects.find((p) => p.id === note.projectId);
  const kind = TYPE_KIND[note.type];
  const canToggle = note.type === 'action' || note.type === 'redline' || note.type === 'agency-comment' || note.type === 'issue';

  if (editing) {
    return (
      <div className="note-item">
        <div className="form-grid">
          <Field label="Type">
            <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as NoteType })}>
              {NOTE_TYPES.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Due">
            <input type="date" value={draft.dueOn} onChange={(e) => setDraft({ ...draft, dueOn: e.target.value })} />
          </Field>
          <Field label="Title" className="span-2">
            <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          </Field>
          <Field label="Tags" className="span-2">
            <input value={draft.tags.join(', ')} onChange={(e) => setDraft({ ...draft, tags: e.target.value.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean) })} />
          </Field>
          <Field label="Details" className="span-all">
            <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
          </Field>
        </div>
        <div className="row" style={{ marginTop: 8 }}>
          <button className="btn primary sm" onClick={() => { updateNote(note.id, draft); setEditing(false); }}>Save</button>
          <button className="btn sm ghost" onClick={() => { setDraft(note); setEditing(false); }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`note-item ${note.done ? 'done' : ''}`}>
      <div className="row between">
        <div className="row">
          {canToggle && <input type="checkbox" checked={note.done} onChange={(e) => updateNote(note.id, { done: e.target.checked })} title="Mark done" />}
          <Badge kind={kind}>{NOTE_TYPES.find((t) => t.id === note.type)?.label}</Badge>
          <span className="title">{note.title}</span>
        </div>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn sm ghost" onClick={() => setEditing(true)}>Edit</button>
          <ConfirmButton label="Delete" className="btn sm ghost" onConfirm={() => { deleteNote(note.id); toast('Note deleted.', 'ok', { label: 'Undo', onClick: () => restoreEntity('notes', note.id) }); }} />
        </div>
      </div>
      {note.body && <div className="body">{note.body}</div>}
      <div className="foot">
        <span>{note.author}</span>
        <span>{fmtDateTime(note.createdAt)}</span>
        {note.dueOn && <span>due {fmtDate(note.dueOn)}</span>}
        {showProject && project && (
          <Link to={`/projects/${project.id}`}>{project.number} {project.name}</Link>
        )}
        {note.sheetNo && <span className="mono">PLAN-{String(note.sheetNo).padStart(2, '0')}</span>}
        <span>{note.tags.map((t) => <span key={t} className="tag">{t}</span>)}</span>
      </div>
    </div>
  );
}

export function NoteList({ projectId, showProject }: { projectId?: string | null; showProject?: boolean }) {
  const data = useAppData();
  const [q, setQ] = useState('');
  const [type, setType] = useState<'all' | NoteType | 'open'>('all');
  const [tag, setTag] = useState('');
  const notes = useMemo(() => {
    let xs = data.notes;
    if (projectId !== undefined) xs = xs.filter((n) => (projectId === null ? n.projectId === null : n.projectId === projectId));
    if (type === 'open') xs = xs.filter((n) => !n.done && n.type !== 'note' && n.type !== 'meeting' && n.type !== 'decision');
    else if (type !== 'all') xs = xs.filter((n) => n.type === type);
    if (tag) xs = xs.filter((n) => n.tags.includes(tag));
    if (q.trim()) {
      const s = q.toLowerCase();
      xs = xs.filter((n) => n.title.toLowerCase().includes(s) || n.body.toLowerCase().includes(s) || n.tags.some((t) => t.includes(s)));
    }
    return [...xs].sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt.localeCompare(a.createdAt));
  }, [data.notes, projectId, type, tag, q]);
  const allTags = useMemo(() => [...new Set(data.notes.flatMap((n) => n.tags))].sort(), [data.notes]);

  return (
    <>
      <div className="toolbar">
        <input className="search" placeholder="Search notes…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value as typeof type)} style={{ width: 'auto' }}>
          <option value="all">All types</option>
          <option value="open">Open items</option>
          {NOTE_TYPES.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
        <select value={tag} onChange={(e) => setTag(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All tags</option>
          {allTags.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="muted" style={{ fontSize: 12 }}>{notes.length} shown</span>
      </div>
      {notes.length === 0 ? <Empty title="No notes match">Add one above, or clear the filters.</Empty> : notes.map((n) => <NoteItem key={n.id} note={n} showProject={showProject} />)}
    </>
  );
}
