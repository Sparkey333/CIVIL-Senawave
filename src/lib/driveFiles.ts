// Read-only view of the shared Senawave "Design" folder: list it recursively, classify files,
// diff two snapshots, and map files to Plan Production Guide steps.
import type { DriveNode, DriveSnapshot } from './types';

const API = 'https://www.googleapis.com/drive/v3';
const FIELDS = 'nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,parents,lastModifyingUser(displayName,emailAddress))';
export const FOLDER_MIME = 'application/vnd.google-apps.folder';

/** Folders whose contents are ArcGIS internals, not design files: listed, never descended into. */
export const OPAQUE = /\.gdb$|^\.backups$|^GpMessages$|^Index$|^\.git$/i;

export type FileClass = 'drawing' | 'xref' | 'imagery' | 'gis' | 'script' | 'template' | 'doc' | 'backup' | 'other';

export function classify(node: DriveNode): FileClass {
  const n = node.name.toLowerCase();
  const p = node.path.toLowerCase();
  if (node.isFolder) return 'other';
  if (/\.(bak|ini)$|\.pyhistory$/.test(n) || /\/\.backups\//.test(p)) return 'backup';
  if (/\.(png|pgw|tif|tfw|jpg|jgw)$/.test(n) || /\/imagery\//.test(p) || /\/keymap\//.test(p)) return 'imagery';
  if (/\.(lsp|lin|lst|py|ipynb)$/.test(n)) return 'script';
  if (/\.(dwt)$/.test(n) || /\/templates\//.test(p) && /\.(dxf|dwg)$/.test(n)) return 'template';
  if (/\/xref\//.test(p) && /\.(dwg|dxf)$/.test(n)) return 'xref';
  if (/\.(dwg|dxf)$/.test(n)) return 'drawing';
  if (/\.(aprx|atbx|gpkg|kmz|kml|shp|dbf|shx|prj|cpg|sbn|sbx|gdbtable|gdbtablx|gdbindexes|spx|xml)$/.test(n)) return 'gis';
  if (/\.(pdf|docx|doc|txt|md|xlsx|csv)$/.test(n)) return 'doc';
  return 'other';
}

export const CLASS_LABEL: Record<FileClass, string> = {
  drawing: 'Project drawing',
  xref: 'Xrefs (exports from ArcGIS)',
  imagery: 'Aerial imagery',
  gis: 'GIS data',
  script: 'Scripts & LISP',
  template: 'Templates',
  doc: 'Documents',
  backup: 'Backups / housekeeping',
  other: 'Other',
};

async function driveGet(token: string, url: string): Promise<Response> {
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status === 401) throw new Error('Google session expired; sign in again.');
  if (res.status === 403) throw new Error('Drive refused the request. The read-only Drive scope is needed to see the shared Design folder; turn it on in Settings and sign in again.');
  if (res.status === 404) throw new Error('Folder not found. Check the Design folder link in Settings and that it is shared with your Google account.');
  if (!res.ok) throw new Error(`Drive error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

interface RawFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  parents?: string[];
  lastModifyingUser?: { displayName?: string; emailAddress?: string };
}

async function listChildren(token: string, folderId: string): Promise<RawFile[]> {
  const out: RawFile[] = [];
  let pageToken = '';
  do {
    const q = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const url = `${API}/files?q=${q}&fields=${encodeURIComponent(FIELDS)}&pageSize=1000&supportsAllDrives=true&includeItemsFromAllDrives=true${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const j = (await (await driveGet(token, url)).json()) as { files: RawFile[]; nextPageToken?: string };
    out.push(...(j.files || []));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out;
}

/** Walk the folder tree breadth-first (max depth 8), skipping the insides of geodatabases and caches. */
export async function snapshotFolder(token: string, rootId: string, onProgress?: (n: number) => void): Promise<DriveSnapshot> {
  const rootMeta = (await (await driveGet(token, `${API}/files/${rootId}?fields=id,name,mimeType,modifiedTime,webViewLink&supportsAllDrives=true`)).json()) as RawFile;
  const nodes: DriveNode[] = [
    { id: rootMeta.id, name: rootMeta.name, mimeType: rootMeta.mimeType, isFolder: true, parentId: null, path: rootMeta.name, modifiedTime: rootMeta.modifiedTime, modifiedBy: '', size: null, webViewLink: rootMeta.webViewLink || `https://drive.google.com/drive/folders/${rootId}` },
  ];
  const queue: { id: string; path: string; depth: number }[] = [{ id: rootId, path: '', depth: 0 }];
  while (queue.length) {
    const cur = queue.shift()!;
    const kids = await listChildren(token, cur.id);
    for (const f of kids) {
      const isFolder = f.mimeType === FOLDER_MIME;
      const path = cur.path ? `${cur.path}/${f.name}` : f.name;
      nodes.push({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        isFolder,
        parentId: cur.id,
        path,
        modifiedTime: f.modifiedTime,
        modifiedBy: f.lastModifyingUser?.emailAddress || f.lastModifyingUser?.displayName || '',
        size: f.size ? Number(f.size) : null,
        webViewLink: f.webViewLink || (isFolder ? `https://drive.google.com/drive/folders/${f.id}` : `https://drive.google.com/file/d/${f.id}/view`),
      });
      if (isFolder && cur.depth < 8 && !OPAQUE.test(f.name)) queue.push({ id: f.id, path, depth: cur.depth + 1 });
    }
    onProgress?.(nodes.length);
  }
  return { rootId, takenAt: new Date().toISOString(), nodes, source: 'live' };
}

export interface DriveChange {
  kind: 'added' | 'modified' | 'removed';
  node: DriveNode;
}

/** What changed between two snapshots of the same folder (by file id, then by modifiedTime). */
export function diffSnapshots(before: DriveSnapshot | null, after: DriveSnapshot): DriveChange[] {
  if (!before) return [];
  const prev = new Map(before.nodes.map((n) => [n.id, n]));
  const next = new Map(after.nodes.map((n) => [n.id, n]));
  const out: DriveChange[] = [];
  for (const n of after.nodes) {
    const p = prev.get(n.id);
    if (!p) out.push({ kind: 'added', node: n });
    else if (p.modifiedTime !== n.modifiedTime && !n.isFolder) out.push({ kind: 'modified', node: n });
  }
  for (const p of before.nodes) if (!next.has(p.id)) out.push({ kind: 'removed', node: p });
  return out.sort((a, b) => b.node.modifiedTime.localeCompare(a.node.modifiedTime));
}

/** Files changed in the last `hours` hours, newest first (works without a previous snapshot). */
export function recentChanges(snap: DriveSnapshot, hours: number, now = Date.now()): DriveNode[] {
  const cutoff = new Date(now - hours * 3600000).toISOString();
  return snap.nodes.filter((n) => !n.isFolder && n.modifiedTime > cutoff && classify(n) !== 'backup').sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
}

/** Nodes under a given path prefix (a project folder), excluding the folder itself. */
export function under(snap: DriveSnapshot, pathPrefix: string): DriveNode[] {
  const pre = pathPrefix.replace(/\/+$/, '') + '/';
  return snap.nodes.filter((n) => n.path.startsWith(pre));
}

/** The project folder in the snapshot whose name matches, e.g. "Fluence" under Projects/. */
export function findProjectFolder(snap: DriveSnapshot, name: string): DriveNode | null {
  const want = name.trim().toLowerCase();
  if (!want) return null;
  return snap.nodes.find((n) => n.isFolder && n.name.toLowerCase() === want && /(^|\/)projects\//i.test(n.path + '/')) || snap.nodes.find((n) => n.isFolder && n.name.toLowerCase() === want) || null;
}

/**
 * Evidence rules: when a file like this exists in the project folder, the matching guide step has
 * probably been done. Used to suggest ticks on the workflow, never to tick them silently.
 */
export const FILE_EVIDENCE: { test: RegExp; stepId: string; what: string }[] = [
  // Only steps whose *output is a file* are inferred. BricsCAD-side steps (attach, bind, place imagery) leave no
  // separate file, so they are never suggested from the folder.
  { test: /\/xref\/sheetindex\.dwg$/i, stepId: 'gis-index', what: 'SheetIndex.dwg exported to xref\\' },
  { test: /\/xref\/sheetindex\.dwg$/i, stepId: 'gis-qc', what: 'SheetIndex.dwg is the Export To CAD result' },
  { test: /\/xref\/(power|power-ug|othercomm|sewer|storm|water|gas|buildings)\.dwg$/i, stepId: 'gis-utilities', what: 'utility exports in xref\\' },
  { test: /\/cad\/[^/]+\.dwg$/i, stepId: 'start-new', what: 'project drawing exists' },
  { test: /\/arcgis\/[^/]+\.aprx$/i, stepId: 'gis-index', what: 'ArcGIS project exists' },
  { test: /\/keymap\/keymap-\d+\.(tif|png)$/i, stepId: 'fin-keymap', what: 'key map tiles present' },
  { test: /\/pdf\/.+\.pdf$/i, stepId: 'fin-plot', what: 'a plotted set is in PDF\\' },
];

export function evidenceFor(nodes: DriveNode[]): Map<string, string[]> {
  const out = new Map<string, string[]>();
  for (const n of nodes) {
    if (n.isFolder) continue;
    for (const r of FILE_EVIDENCE) {
      if (r.test.test('/' + n.path)) {
        const list = out.get(r.stepId) || [];
        if (!list.includes(n.name)) list.push(n.name);
        out.set(r.stepId, list);
      }
    }
  }
  return out;
}

export function fmtSize(n: number | null): string {
  if (n === null) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function parseFolderId(input: string): string {
  const s = input.trim();
  const m = s.match(/\/folders\/([a-zA-Z0-9_-]{10,})/) || s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : s;
}

const SNAP_KEY = 'senawave-tracker:drive-snapshot';
export function loadSnapshot(): DriveSnapshot | null {
  try {
    const raw = localStorage.getItem(SNAP_KEY);
    return raw ? (JSON.parse(raw) as DriveSnapshot) : null;
  } catch {
    return null;
  }
}
export function saveSnapshot(s: DriveSnapshot) {
  try {
    localStorage.setItem(SNAP_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
