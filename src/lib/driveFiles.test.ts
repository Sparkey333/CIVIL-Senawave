import { describe, expect, it } from 'vitest';
import { classify, diffSnapshots, evidenceFor, findProjectFolder, parseFolderId, recentChanges, under } from './driveFiles';
import { FLUENCE_DRIVE_SNAPSHOT } from '@/data/fluenceDrive';

const snap = FLUENCE_DRIVE_SNAPSHOT;
const node = (path: string) => snap.nodes.find((n) => n.path === path)!;

describe('classify', () => {
  it('sorts the Fluence files into the right buckets', () => {
    expect(classify(node('Projects/Fluence/CAD/Fluence.dwg'))).toBe('drawing');
    expect(classify(node('Projects/Fluence/CAD/xref/SheetIndex.dwg'))).toBe('xref');
    expect(classify(node('Projects/Fluence/CAD/xref/imagery/PLAN-01.png'))).toBe('imagery');
    expect(classify(node('Projects/Fluence/ArcGIS/Fluence.aprx'))).toBe('gis');
    expect(classify(node('Projects/Fluence/ArcGIS/Shared/ProposedBuriedFiber_Senawave.pdf'))).toBe('doc');
    expect(classify(node('Templates/CAD/Support/SENACLIP.lsp'))).toBe('script');
    expect(classify(node('Templates/CAD/SENAWAVE-11x17-TEMPLATE.dwt'))).toBe('template');
    expect(classify(node('Projects/Fluence/CAD/Fluence.bak'))).toBe('backup');
  });
});

describe('project folder and evidence', () => {
  it('finds the Fluence folder by name and lists what is under it', () => {
    const f = findProjectFolder(snap, 'Fluence');
    expect(f?.path).toBe('Projects/Fluence');
    const files = under(snap, f!.path).filter((n) => !n.isFolder);
    expect(files.length).toBeGreaterThan(30);
    expect(files.every((n) => n.path.startsWith('Projects/Fluence/'))).toBe(true);
  });

  it('turns xref exports and imagery into workflow evidence', () => {
    const ev = evidenceFor(under(snap, 'Projects/Fluence'));
    expect(ev.get('gis-index')).toContain('SheetIndex.dwg');
    expect(ev.get('gis-utilities')).toEqual(expect.arrayContaining(['Power.dwg', 'Water.dwg', 'Gas.dwg']));
    expect(ev.get('gis-qc')).toContain('SheetIndex.dwg');
    expect(ev.has('cad-points-imagery')).toBe(false);
    expect(ev.has('cad-attach-index')).toBe(false);
    expect(ev.get('start-new')).toContain('Fluence.dwg');
    expect(ev.has('fin-plot')).toBe(false);
  });
});

describe('diff and recency', () => {
  it('reports added, modified and removed files', () => {
    const before = { ...snap, nodes: snap.nodes.filter((n) => n.name !== 'Gas.dwg').map((n) => (n.name === 'Fluence.dwg' ? { ...n, modifiedTime: '2026-09-29T00:00:00Z' } : n)) };
    before.nodes.push({ ...node('Projects/Fluence/CAD/Fluence.bak'), id: 'gone', name: 'Old.dwg', path: 'Projects/Fluence/CAD/Old.dwg' });
    const d = diffSnapshots(before, snap);
    expect(d.find((c) => c.node.name === 'Gas.dwg')?.kind).toBe('added');
    expect(d.find((c) => c.node.name === 'Fluence.dwg')?.kind).toBe('modified');
    expect(d.find((c) => c.node.name === 'Old.dwg')?.kind).toBe('removed');
    expect(diffSnapshots(null, snap)).toEqual([]);
  });

  it('recentChanges uses the clock it is given and skips backups', () => {
    const now = Date.parse('2026-10-01T00:00:00Z');
    const r = recentChanges(snap, 24, now);
    expect(r.map((n) => n.name)).toContain('Gas.dwg');
    expect(r.map((n) => n.name)).not.toContain('Fluence.bak');
    expect(r[0].name).toBe('Gas.dwg'); // newest first
  });

  it('parses folder ids from links', () => {
    expect(parseFolderId('https://drive.google.com/drive/folders/1bv7lYrdYL5X57lFT_amiBk2kMN23XtAD?usp=sharing')).toBe('1bv7lYrdYL5X57lFT_amiBk2kMN23XtAD');
    expect(parseFolderId('  abc123def456  ')).toBe('abc123def456');
  });
});
