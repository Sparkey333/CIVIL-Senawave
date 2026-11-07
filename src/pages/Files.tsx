import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { SCOPES } from '@/lib/google';
import { CLASS_LABEL, classify, diffSnapshots, evidenceFor, findProjectFolder, fmtSize, loadSnapshot, parseFolderId, recentChanges, saveSnapshot, snapshotFolder, under, type FileClass } from '@/lib/driveFiles';
import type { DriveNode, DriveSnapshot } from '@/lib/types';
import { FLUENCE_DRIVE_SNAPSHOT } from '@/data/fluenceDrive';
import { WORKFLOW_STEPS } from '@/data/guide';
import { logActivity, updateProject, updateSettings, useAppData } from '@/store/store';
import { driveSnapshot } from '@/lib/connectors';
import { Badge, Callout, Card, Empty } from '@/components/ui';
import { fmtDateTime } from '@/lib/ids';
import { toast } from '@/components/Toast';

const ORDER: FileClass[] = ['drawing', 'xref', 'imagery', 'gis', 'doc', 'script', 'template', 'backup', 'other'];

export default function Files() {
  const data = useAppData();
  const { user, getToken } = useAuth();
  const [snap, setSnap] = useState<DriveSnapshot>(() => loadSnapshot() || FLUENCE_DRIVE_SNAPSHOT);
  const [changes, setChanges] = useState<ReturnType<typeof diffSnapshots>>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [projectId, setProjectId] = useState(() => data.projects.find((p) => !p.sample)?.id || data.projects[0]?.id || '');
  const [showHousekeeping, setShowHousekeeping] = useState(false);
  const project = data.projects.find((p) => p.id === projectId) || null;
  const rootId = parseFolderId(data.settings.designFolderUrl || '');

  const viaClaude = user?.mode === 'claude';
  const refresh = async () => {
    if (!rootId) return toast('Paste the Design folder link in the box on the right first.', 'bad');
    if (!viaClaude) {
      if (!user || user.mode !== 'google') return toast('Open the tracker in claude.ai, or sign in with Google, to read the Design folder.', 'bad');
      if (!data.settings.driveFilesEnabled) return toast('Turn on "Design folder (read-only Drive)" on the Connections page first, then sign in again.', 'bad');
    }
    setBusy(true);
    setProgress(0);
    try {
      const fresh = viaClaude ? await driveSnapshot(rootId, setProgress) : await snapshotFolder(await getToken(SCOPES.driveReadonly), rootId, setProgress);
      const prev = loadSnapshot();
      const diff = diffSnapshots(prev && prev.rootId === rootId ? prev : null, fresh);
      saveSnapshot(fresh);
      setSnap(fresh);
      setChanges(diff);
      const real = diff.filter((c) => classify(c.node) !== 'backup');
      toast(real.length ? `Design folder refreshed: ${real.length} change${real.length > 1 ? 's' : ''} since last check.` : 'Design folder refreshed: no changes since last check.');
      if (real.length) logActivity('file', `Drive: ${real.length} file change${real.length > 1 ? 's' : ''} in the Design folder`, null);
    } catch (err) {
      toast((err as Error).message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  // Which folder to show for the chosen project: its Drive link, else its name under Projects/.
  const projectFolder = useMemo(() => {
    if (!project) return null;
    const byId = project.driveFolderUrl ? snap.nodes.find((n) => n.id === parseFolderId(project.driveFolderUrl)) : null;
    return byId || findProjectFolder(snap, project.name.split(/[—–-]/)[0]) || findProjectFolder(snap, project.number) || null;
  }, [project, snap]);
  const projectNodes = useMemo(() => (projectFolder ? under(snap, projectFolder.path) : []), [projectFolder, snap]);
  const evidence = useMemo(() => evidenceFor(projectNodes), [projectNodes]);
  const recent = useMemo(() => recentChanges(snap, 72), [snap]);
  const templates = useMemo(() => snap.nodes.filter((n) => /^Templates\//.test(n.path) && !n.isFolder && !/\/Archive\//.test(n.path)), [snap]);

  useEffect(() => {
    if (project && projectFolder && !project.driveFolderUrl) updateProject(project.id, { driveFolderUrl: projectFolder.webViewLink });
  }, [project, projectFolder]);

  const suggest = evidence.size && project ? WORKFLOW_STEPS.filter((s) => evidence.has(s.id) && !project.workflow[s.id]) : [];
  const acceptSuggestions = () => {
    if (!project) return;
    updateProject(project.id, (p) => ({ workflow: { ...p.workflow, ...Object.fromEntries(suggest.map((s) => [s.id, true])) } }));
    toast(`Ticked ${suggest.length} step${suggest.length > 1 ? 's' : ''} from what is in the folder.`);
  };

  return (
    <>
      <Callout kind={snap.source === 'seed' ? 'info' : ''}>
        <div className="row between">
          <span>
            <strong>{snap.source === 'seed' ? 'Snapshot of the Design folder taken 1 Oct 2026' : `Live snapshot from Drive, ${fmtDateTime(snap.takenAt)}`}</strong>
            <span className="muted"> · {snap.nodes.filter((n) => !n.isFolder).length} files in {snap.nodes.filter((n) => n.isFolder).length} folders · owner jessem@senawave.com</span>
          </span>
          <span className="row">
            <a className="btn sm" href={data.settings.designFolderUrl || FLUENCE_DRIVE_SNAPSHOT.nodes[0].webViewLink} target="_blank" rel="noopener noreferrer">Open in Drive ↗</a>
            <button className="btn sm primary" onClick={() => void refresh()} disabled={busy}>{busy ? `Reading… ${progress}` : 'Refresh from Drive'}</button>
          </span>
        </div>
        {snap.source === 'seed' && (
          <p className="muted" style={{ fontSize: 12.5, margin: '6px 0 0' }}>
            {viaClaude
              ? 'Press "Refresh from Drive" to read the folder now with your Google Drive connector (the first time, claude.ai asks you to allow it). Until then this is what the folder held on 1 Oct.'
              : 'To make this live: Connections → Google sign-in → turn on the Design folder switch, sign in again, then Refresh. Until then this is what the folder held on 1 Oct.'}
          </p>
        )}
      </Callout>

      {changes.length > 0 && (
        <Card title="Changed since your last check" className="tight">
          <ul className="timeline">
            {changes.filter((c) => showHousekeeping || classify(c.node) !== 'backup').slice(0, 30).map((c) => (
              <li key={c.node.id + c.kind}>
                <span className="when">{fmtDateTime(c.node.modifiedTime)}</span>
                <span><Badge kind={c.kind === 'removed' ? 'bad' : c.kind === 'added' ? 'ok' : 'warn'}>{c.kind}</Badge> <a href={c.node.webViewLink} target="_blank" rel="noopener noreferrer">{c.node.path}</a> <span className="faint">{c.node.modifiedBy}</span></span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(300px, 1fr)' }}>
        <div>
          <Card
            title="Project folder"
            subtitle={projectFolder ? <a href={projectFolder.webViewLink} target="_blank" rel="noopener noreferrer">{projectFolder.path} ↗</a> : 'Pick a project; its folder is matched by Drive link or by name under Projects\\.'}
            actions={
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} style={{ width: 'auto' }}>
                {data.projects.map((p) => <option key={p.id} value={p.id}>{p.number} {p.name}</option>)}
              </select>
            }
          >
            {!projectFolder ? (
              <Empty title="No folder found for this project"><p>Paste the project's Drive folder link on its Overview tab, or refresh the snapshot.</p></Empty>
            ) : (
              <>
                {suggest.length > 0 && (
                  <Callout kind="ok">
                    <div className="row between">
                      <span><strong>Files say {suggest.length} workflow step{suggest.length > 1 ? 's are' : ' is'} done:</strong> {suggest.map((s) => s.id).join(', ')}</span>
                      <button className="btn sm" onClick={acceptSuggestions}>Tick them</button>
                    </div>
                    <ul style={{ margin: '6px 0 0', fontSize: 12.5 }}>
                      {suggest.map((s) => <li key={s.id}>{s.label.slice(0, 90)} <span className="faint">← {evidence.get(s.id)?.join(', ')}</span></li>)}
                    </ul>
                  </Callout>
                )}
                <label className="row" style={{ fontSize: 12.5, marginBottom: 8 }}>
                  <input type="checkbox" checked={showHousekeeping} onChange={(e) => setShowHousekeeping(e.target.checked)} /> show backups, .ini and caches
                </label>
                {ORDER.map((cls) => {
                  const rows = projectNodes.filter((n) => !n.isFolder && classify(n) === cls && (showHousekeeping || cls !== 'backup')).sort((a, b) => a.path.localeCompare(b.path));
                  if (!rows.length) return null;
                  return <FileGroup key={cls} title={CLASS_LABEL[cls]} rows={rows} base={projectFolder.path} />;
                })}
                <div className="group-title">Folders</div>
                <div className="row" style={{ gap: 6 }}>
                  {projectNodes.filter((n) => n.isFolder).map((n) => (
                    <a key={n.id} className="tag" href={n.webViewLink} target="_blank" rel="noopener noreferrer" title={n.path}>{n.path.slice(projectFolder.path.length + 1)}/</a>
                  ))}
                </div>
              </>
            )}
          </Card>
        </div>
        <div>
          <Card title="Recently changed (72 h)" className="tight">
            {recent.length === 0 ? <p className="muted">Nothing changed in the last three days.</p> : (
              <ul className="timeline">
                {recent.slice(0, 15).map((n) => (
                  <li key={n.id}>
                    <span className="when">{fmtDateTime(n.modifiedTime)}</span>
                    <span><a href={n.webViewLink} target="_blank" rel="noopener noreferrer">{n.name}</a><br /><span className="faint" style={{ fontSize: 11.5 }}>{n.path.replace(/\/[^/]+$/, '')}</span></span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="Templates (current)" className="tight" subtitle="Templates\\CAD: guide, .dwt, Support\\ LISP and ArcGIS\\ scripts. Archive\\ is history only.">
            <ul style={{ fontSize: 12.5, paddingLeft: 16 }}>
              {templates.map((n) => (
                <li key={n.id}><a href={n.webViewLink} target="_blank" rel="noopener noreferrer">{n.name}</a> <span className="faint">{n.path.replace(/\/[^/]+$/, '').replace(/^Templates\/CAD\/?/, '') || 'CAD'} · {fmtDateTime(n.modifiedTime)}</span></li>
              ))}
            </ul>
            <p className="faint" style={{ fontSize: 12 }}>Setup checklists for these live under <Link to="/tools">Tools → BricsCAD / ArcGIS Pro</Link>.</p>
          </Card>
          <Card title="Design folder link" className="tight">
            <input value={data.settings.designFolderUrl} onChange={(e) => updateSettings({ designFolderUrl: e.target.value })} placeholder="https://drive.google.com/drive/folders/…" />
            <p className="faint" style={{ fontSize: 12, marginTop: 6 }}>Shared setting. Projects are matched to subfolders of Projects\ by name.</p>
          </Card>
        </div>
      </div>
    </>
  );
}

function FileGroup({ title, rows, base }: { title: string; rows: DriveNode[]; base: string }) {
  return (
    <>
      <div className="group-title">{title} <span className="faint">· {rows.length}</span></div>
      <div className="tbl-wrap" style={{ marginBottom: 10 }}>
        <table className="tbl compact">
          <tbody>
            {rows.map((n) => (
              <tr key={n.id}>
                <td><a href={n.webViewLink} target="_blank" rel="noopener noreferrer">{n.name}</a><div className="faint" style={{ fontSize: 11.5 }}>{n.path.slice(base.length + 1).replace(/\/[^/]+$/, '') || '.'}</div></td>
                <td className="nowrap muted" style={{ fontSize: 12 }}>{fmtDateTime(n.modifiedTime)}</td>
                <td className="num muted" style={{ fontSize: 12 }}>{fmtSize(n.size)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
