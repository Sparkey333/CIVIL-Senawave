import { describe, expect, it } from 'vitest';
import { extractTasks, groupThreads, parseAddress, type MailMessage } from './gmail';

describe('extractTasks', () => {
  it('pulls requests and commitments out of Jesse-style emails', () => {
    const t = extractTasks("Let's try and finish out Fluence first and then we can move on to BEAD. When do you want to meet tomorrow? Thanks, Jesse");
    expect(t.some((s) => /finish out Fluence/.test(s))).toBe(true);
    expect(t.some((s) => /meet tomorrow\?$/.test(s))).toBe(true);
    expect(t.some((s) => /^Thanks/.test(s))).toBe(false);
  });

  it('ignores quoted headers and short lines', () => {
    expect(extractTasks('On Wed, Sep 30, 2026 at 2:51 PM Brandon wrote: > please send it')).toEqual([]);
    expect(extractTasks('ok')).toEqual([]);
  });
});

describe('threads', () => {
  const m = (id: string, threadId: string, date: string, subject: string, unread = false): MailMessage => ({ id, threadId, date, subject, from: 'J', fromEmail: 'jessem@senawave.com', to: '', snippet: '', unread, isMine: false, link: '' });
  it('groups by thread, newest thread first, strips Re:/Fwd:', () => {
    const g = groupThreads([m('1', 'a', '2026-09-30T10:00:00Z', 'Hours'), m('2', 'a', '2026-09-30T12:00:00Z', 'Re: Hours', true), m('3', 'b', '2026-10-01T10:00:00Z', 'Fwd: Meeting')]);
    expect(g.map((t) => t.threadId)).toEqual(['b', 'a']);
    expect(g[1].subject).toBe('Hours');
    expect(g[1].unread).toBe(true);
    expect(g[1].latest.id).toBe('2');
  });
  it('parses display-name addresses', () => {
    expect(parseAddress('Jesse Montgomery <jessem@senawave.com>')).toEqual({ name: 'Jesse Montgomery', email: 'jessem@senawave.com' });
    expect(parseAddress('david@senawave.com')).toEqual({ name: 'david@senawave.com', email: 'david@senawave.com' });
  });
});
