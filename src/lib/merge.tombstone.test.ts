import { describe, expect, it } from 'vitest';
import { mergeById, mergeData, purgeTombstones, stripForSync } from './merge';
import { seedData } from '@/store/seed';

type Row = { id: string; updatedAt: string; deletedAt?: string | null };

describe('tombstones', () => {
  it('a delete on one side wins over an older edit on the other and is not resurrected', () => {
    const local: Row[] = [{ id: 'a', updatedAt: '2026-09-10T00:00:00Z', deletedAt: '2026-09-10T00:00:00Z' }];
    const remote: Row[] = [{ id: 'a', updatedAt: '2026-09-01T00:00:00Z' }];
    expect(mergeById(local, remote)[0].deletedAt).toBe('2026-09-10T00:00:00Z');
    expect(mergeById(remote, local)[0].deletedAt).toBe('2026-09-10T00:00:00Z');
  });

  it('a newer edit on the other side undoes the delete (last writer wins both ways)', () => {
    const local: Row[] = [{ id: 'a', updatedAt: '2026-09-10T00:00:00Z', deletedAt: '2026-09-10T00:00:00Z' }];
    const remote: Row[] = [{ id: 'a', updatedAt: '2026-09-11T00:00:00Z', deletedAt: null }];
    expect(mergeById(local, remote)[0].deletedAt).toBeNull();
  });

  it('purges tombstones older than the TTL and keeps recent ones', () => {
    const d = seedData();
    const now = Date.parse('2026-10-01T00:00:00Z');
    d.notes = [
      { ...d.notes[0], id: 'old', deletedAt: '2026-01-01T00:00:00Z' },
      { ...d.notes[0], id: 'recent', deletedAt: '2026-09-28T00:00:00Z' },
      { ...d.notes[0], id: 'live' },
    ];
    const out = purgeTombstones(d, now);
    expect(out.notes.map((n) => n.id)).toEqual(['recent', 'live']);
  });
});

describe('private settings and the time log', () => {
  it('never takes rate, theme or device sync settings from the remote copy', () => {
    const local = seedData();
    local.settings = { ...local.settings, hourlyRate: 90, theme: 'dark', driveFileId: 'mine', syncTimeEntries: true };
    const remote = seedData();
    remote.updatedAt = '2099-01-01T00:00:00Z';
    remote.settings = { ...remote.settings, hourlyRate: 10, theme: 'light', driveFileId: 'theirs', ownerName: 'Remote Owner' };
    const out = mergeData(local, remote);
    expect(out.settings.hourlyRate).toBe(90);
    expect(out.settings.theme).toBe('dark');
    expect(out.settings.driveFileId).toBe('mine');
    expect(out.settings.ownerName).toBe('Remote Owner');
  });

  it('stripForSync drops private settings and, when the time log is private, the time entries', () => {
    const d = seedData();
    d.settings = { ...d.settings, hourlyRate: 90, syncTimeEntries: false };
    const out = stripForSync(d);
    expect('hourlyRate' in out.settings).toBe(false);
    expect('theme' in out.settings).toBe(false);
    expect(out.timeEntries).toEqual([]);
    expect(out.settings.ownerName).toBe(d.settings.ownerName);
    expect(stripForSync({ ...d, settings: { ...d.settings, syncTimeEntries: true } }).timeEntries.length).toBe(d.timeEntries.length);
  });

  it('ignores remote time entries when the time log is private', () => {
    const local = seedData();
    local.settings = { ...local.settings, syncTimeEntries: false };
    const remote = seedData();
    remote.timeEntries = [{ ...remote.timeEntries[0], id: 'tme_remote' }];
    const out = mergeData(local, remote);
    expect(out.timeEntries.some((t) => t.id === 'tme_remote')).toBe(false);
    expect(out.timeEntries.length).toBe(local.timeEntries.length);
  });
});
