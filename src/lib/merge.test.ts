import { describe, expect, it } from 'vitest';
import { mergeById, mergeData } from './merge';
import { seedData } from '@/store/seed';

describe('mergeById', () => {
  it('keeps rows from both sides and prefers the newer updatedAt', () => {
    const local = [
      { id: 'a', updatedAt: '2026-09-01T00:00:00Z', v: 'local-a' },
      { id: 'b', updatedAt: '2026-09-05T00:00:00Z', v: 'local-b' },
    ];
    const remote = [
      { id: 'b', updatedAt: '2026-09-02T00:00:00Z', v: 'remote-b' },
      { id: 'c', updatedAt: '2026-09-03T00:00:00Z', v: 'remote-c' },
    ];
    const out = mergeById(local, remote).sort((x, y) => x.id.localeCompare(y.id));
    expect(out.map((r) => r.v)).toEqual(['local-a', 'local-b', 'remote-c']);
  });
});

describe('mergeData', () => {
  it('merges every collection and takes the newer shared settings', () => {
    const local = seedData();
    const remote = seedData();
    remote.updatedAt = '2099-01-01T00:00:00Z';
    remote.settings = { ...remote.settings, ownerName: 'Remote Owner' };
    remote.notes = [{ ...remote.notes[0], id: 'note_remote', title: 'from remote' }];
    const i = remote.projects.findIndex((p) => p.id === 'prj_sample_1');
    remote.projects[i] = { ...remote.projects[i], name: 'renamed remotely', updatedAt: '2099-01-01T00:00:00Z' };
    const out = mergeData(local, remote);
    expect(out.settings.ownerName).toBe('Remote Owner');
    expect(out.notes.some((n) => n.id === 'note_remote')).toBe(true);
    expect(out.notes.length).toBe(local.notes.length + 1);
    expect(out.projects.find((p) => p.id === 'prj_sample_1')?.name).toBe('renamed remotely');
  });

  it('keeps local settings when the local copy is newer', () => {
    const local = seedData();
    local.updatedAt = '2099-01-01T00:00:00Z';
    local.settings.ownerName = 'Local Owner';
    const remote = seedData();
    remote.settings.ownerName = 'Remote Owner';
    expect(mergeData(local, remote).settings.ownerName).toBe('Local Owner');
  });
});
