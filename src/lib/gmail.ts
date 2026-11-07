// Read-only Gmail: the Senawave threads (jessem@ / david@ / anyone @senawave.com), newest first,
// plus a small heuristic that pulls likely tasks out of a message so they can become action items.

const API = 'https://gmail.googleapis.com/gmail/v1/users/me';
export const SENAWAVE_DOMAIN = 'senawave.com';
export const SENAWAVE_QUERY = `(from:${SENAWAVE_DOMAIN} OR to:${SENAWAVE_DOMAIN} OR cc:${SENAWAVE_DOMAIN}) -in:spam -in:trash`;

export interface MailMessage {
  id: string;
  threadId: string;
  date: string; // ISO
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  snippet: string;
  unread: boolean;
  isMine: boolean; // sent by the signed-in user
  link: string;
}

async function gmailGet(token: string, url: string): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new Error('Google session expired; sign in again.');
  if (res.status === 403) throw new Error('Gmail refused the request. Turn on the Gmail (read-only) connection in Settings and sign in again so the scope is granted.');
  if (!res.ok) throw new Error(`Gmail error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

interface RawMsg {
  id: string;
  threadId: string;
  snippet?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: { headers?: { name: string; value: string }[] };
}

function header(m: RawMsg, name: string): string {
  return m.payload?.headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

export function parseAddress(s: string): { name: string; email: string } {
  const m = s.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1].trim() || m[2].trim(), email: m[2].trim().toLowerCase() };
  return { name: s.trim(), email: s.trim().toLowerCase() };
}

function decodeEntities(s: string): string {
  return s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
}

/** The last `max` Senawave messages (query is fixed to the domain; `days` limits how far back). */
export async function listSenawaveMail(token: string, myEmail: string, opts: { days?: number; max?: number } = {}): Promise<MailMessage[]> {
  const days = opts.days ?? 30;
  const max = Math.min(opts.max ?? 40, 100);
  const q = encodeURIComponent(`${SENAWAVE_QUERY} newer_than:${days}d`);
  const list = (await (await gmailGet(token, `${API}/messages?q=${q}&maxResults=${max}`)).json()) as { messages?: { id: string; threadId: string }[] };
  const ids = list.messages || [];
  const out: MailMessage[] = [];
  // Fetch metadata in small parallel batches.
  for (let i = 0; i < ids.length; i += 8) {
    const batch = ids.slice(i, i + 8);
    const msgs = await Promise.all(
      batch.map(async ({ id }) => (await (await gmailGet(token, `${API}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`)).json()) as RawMsg),
    );
    for (const m of msgs) {
      const from = parseAddress(header(m, 'From'));
      out.push({
        id: m.id,
        threadId: m.threadId,
        date: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : header(m, 'Date'),
        from: from.name,
        fromEmail: from.email,
        to: header(m, 'To'),
        subject: header(m, 'Subject') || '(no subject)',
        snippet: decodeEntities(m.snippet || ''),
        unread: (m.labelIds || []).includes('UNREAD'),
        isMine: from.email === myEmail.toLowerCase(),
        link: `https://mail.google.com/mail/u/0/#all/${m.threadId}`,
      });
    }
  }
  return out.sort((a, b) => b.date.localeCompare(a.date));
}

/** Group messages into threads (newest message first inside each thread, threads newest first). */
export function groupThreads(msgs: MailMessage[]): { threadId: string; subject: string; messages: MailMessage[]; latest: MailMessage; unread: boolean }[] {
  const by = new Map<string, MailMessage[]>();
  for (const m of msgs) by.set(m.threadId, [...(by.get(m.threadId) || []), m]);
  return [...by.entries()]
    .map(([threadId, messages]) => {
      const sorted = [...messages].sort((a, b) => b.date.localeCompare(a.date));
      return { threadId, subject: sorted[sorted.length - 1].subject.replace(/^(re|fwd?):\s*/i, ''), messages: sorted, latest: sorted[0], unread: sorted.some((m) => m.unread) };
    })
    .sort((a, b) => b.latest.date.localeCompare(a.latest.date));
}

/**
 * Sentences that read like a request or a commitment. Deliberately simple: the user confirms each
 * one before it becomes an action item, so a false positive costs one click.
 */
export function extractTasks(text: string): string[] {
  const clean = decodeEntities(text).replace(/\s+/g, ' ');
  const sentences = clean.split(/(?<=[.?!])\s+/).map((s) => s.trim()).filter((s) => s.length > 12 && s.length < 240);
  const cue = /\b(please|can you|could you|would you|need(s|ed)? (you|to)|let me know|send (me|over|us)|when (do|can|will) you|try and|let'?s (try|finish|meet|start)|finish out|move on to|meet(ing)? (tomorrow|today|at)|due|by (monday|tuesday|wednesday|thursday|friday|tomorrow|end of)|confirm|review|update|redline)\b/i;
  const out: string[] = [];
  for (const s of sentences) {
    if (/^(on|from|sent|subject|date|to):/i.test(s) || /wrote:$/i.test(s) || />/.test(s)) continue;
    if (cue.test(s) || /\?$/.test(s)) out.push(s);
  }
  return [...new Set(out)].slice(0, 6);
}
