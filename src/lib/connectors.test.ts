import { describe, expect, it } from 'vitest';
import { connectorFix, connectorLabel, eventFromMcp, mailFromMcp, MCP_MANIFEST } from './connectors';

describe('connectors', () => {
  it('declares only the tools the tracker calls', () => {
    expect(MCP_MANIFEST.servers).toEqual([
      { server: 'Google Drive', tools: ['search_files', 'read_file_content', 'get_file_metadata', 'create_file'] },
      { server: 'Gmail', tools: ['search_threads', 'get_thread'] },
      { server: 'Google Calendar', tools: ['list_events'] },
    ]);
  });

  it('maps a Gmail message from the connector into the inbox shape', () => {
    const m = mailFromMcp({ id: 'm1', threadId: 't1', sender: 'A Person <A@Senawave.com>', subject: 'Hi', snippet: 'it&#39;s fine', internalDate: '1790000000000', labelIds: ['UNREAD'], toRecipients: ['me@x.com', 'b@x.com'] }, { id: 't1' }, 'me@x.com');
    expect(m).toMatchObject({ id: 'm1', threadId: 't1', from: 'A Person', fromEmail: 'a@senawave.com', snippet: "it's fine", unread: true, isMine: false, to: 'me@x.com, b@x.com' });
    expect(m.date).toBe(new Date(1790000000000).toISOString());
    expect(mailFromMcp({ id: 'm2', sender: 'me@x.com' }, { id: 't2' }, 'ME@x.com').isMine).toBe(true);
  });

  it('maps calendar events, all-day included', () => {
    expect(eventFromMcp({ id: 'e', summary: 'Call', start: { dateTime: '2026-10-02T19:00:00Z' }, end: { dateTime: '2026-10-02T19:30:00Z' }, htmlLink: 'L' })).toMatchObject({ title: 'Call', allDay: false, link: 'L' });
    expect(eventFromMcp({ id: 'e', start: { date: '2026-10-02' } })).toMatchObject({ title: '(no title)', allDay: true, start: '2026-10-02' });
  });

  it('tells the viewer how to fix each failure, not a generic error', () => {
    expect(connectorFix('needs_reauth', 'Gmail')).toMatch(/Reconnect/);
    expect(connectorFix('server_not_connected', 'Gmail')).toMatch(/Settings → Connectors/);
    expect(connectorFix('not_in_manifest', 'Gmail')).toMatch(/Allow/);
    expect(connectorFix('tool_error', 'Gmail', 'quota')).toMatch(/quota/);
  });

  it('labels connector states', () => {
    expect(connectorLabel({ permission: 'granted', auth: 'connected' }).ready).toBe(true);
    expect(connectorLabel({ permission: 'prompt', auth: 'unknown' }).text).toBe('not allowed yet');
    expect(connectorLabel({ permission: 'granted', auth: 'missing' }).ready).toBe(false);
    expect(connectorLabel({ permission: 'granted', auth: 'needs_reauth' }).text).toBe('needs reconnecting');
  });
});
