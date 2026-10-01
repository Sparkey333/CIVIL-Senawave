import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteProject, newSheet, updateProject, useAppData, addPermit, newPermit, updatePermit, deletePermit, restoreProject, restoreEntity } from '@/store/store';
import type { Permit, PermitAgencyType, PermitStatus, Project, Sheet } from '@/lib/types';
import { PERMIT_STATUSES, PROJECT_STATUSES } from '@/lib/types';
import { QC_CHECKLIST, QC_GROUPS, WORKFLOW_PHASES, WORKFLOW_STEPS, SHEET_MAX_ALONG_FT, clipExtents, sheetsForRun } from '@/data/guide';
import { checkSheets, generateSheets, sheetProgress } from '@/lib/sheets';
import { daysUntil, fmtDate, fmtFt } from '@/lib/ids';
import { Badge, Callout, Card, ConfirmButton, Empty, Field, KV, Progress, Tabs, useLocalTab } from '@/components/ui';
import { ProjectForm } from '@/components/ProjectForm';
import { NoteComposer, NoteList } from '@/components/NoteList';
import { TimeTable } from '@/components/TimeTable';
import { StatusBadge } from '@/components/StatusBadge';
import { NextStep } from '@/components/NextStep';
import { toast } from '@/components/Toast';

type Tab = 'overview' | 'sheets' | 'workflow' | 'qc' | 'permits' | 'notes' | 'time';

export default function ProjectDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const data = useAppData();
  const project = data.projects.find((p) => p.id === id);
  const [tab, setTab] = useLocalTab<Tab>('project', 'overview', ['overview', 'sheets', 'workflow', 'qc', 'permits', 'notes', 'time']);

  if (!project) {
    return (
      <Empty title="Project not found">
        <Link to="/projects" className="btn">Back to projects</Link>
      </Empty>
    );
  }

  const notesCount = data.notes.filter((n) => n.projectId === project.id && !n.done).length;
  const permitsCount = data.permits.filter((p) => p.projectId === project.id && !['approved', 'closed', 'denied'].includes(p.status)).length;
  const wfDone = WORKFLOW_STEPS.filter((s) => project.workflow[s.id]).length;
  const qcDone = QC_CHECKLIST.filter((s) => project.qc[s.id]).length;

  return (
    <>
      <div className="row between" style={{ marginBottom: 12 }}>
        <div>
          <div className="row">
            <Link to="/projects" className="muted">Projects</Link>
            <span className="faint">/</span>
            <span className="mono muted">{project.number || '—'}</span>
            <StatusBadge status={project.status} />
            {project.funding && <Badge kind="info">{project.funding}</Badge>}
            {project.sample && <Badge title="Seeded demo data — delete from Settings">sample</Badge>}
          </div>
          <h1 style={{ marginTop: 4 }}>{project.name || 'Untitled project'}</h1>
        </div>
        <div className="row">
          <label className="row" style={{ gap: 6, fontSize: 12.5 }} title="Change the project status">
            <span className="muted">Status</span>
            <select value={project.status} onChange={(e) => updateProject(project.id, { status: e.target.value as Project['status'] })} style={{ width: 'auto' }} aria-label="Project status">
              {PROJECT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          {project.driveFolderUrl && <a className="btn sm" href={project.driveFolderUrl} target="_blank" rel="noopener noreferrer">Drive folder ↗</a>}
          <Link className="btn sm" to="/files">Files</Link>
          {project.arcgisProjectUrl && <a className="btn sm" href={project.arcgisProjectUrl} target="_blank" rel="noopener noreferrer">ArcGIS ↗</a>}
        </div>
      </div>

      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'sheets', label: 'Sheet index', count: project.sheets.length },
          { id: 'workflow', label: 'Workflow', count: wfDone },
          { id: 'qc', label: 'QC checklist', count: qcDone },
          { id: 'permits', label: 'Permits', count: permitsCount },
          { id: 'notes', label: 'Notes', count: notesCount },
          { id: 'time', label: 'Time' },
        ]}
      />

      {tab === 'overview' && (
        <Overview
          project={project}
          onDelete={() => {
            const id = project.id;
            deleteProject(id);
            nav('/projects');
            toast(`Deleted ${project.number || project.name || 'project'}.`, 'ok', { label: 'Undo', onClick: () => { restoreProject(id); nav(`/projects/${id}`); } });
          }}
        />
      )}
      {tab === 'sheets' && <Sheets project={project} />}
      {tab === 'workflow' && <Workflow project={project} />}
      {tab === 'qc' && <Qc project={project} />}
      {tab === 'permits' && <Permits project={project} permits={data.permits.filter((p) => p.projectId === project.id)} />}
      {tab === 'notes' && (
        <>
          <Card title="Add a note to this project"><NoteComposer projectId={project.id} /></Card>
          <NoteList projectId={project.id} />
        </>
      )}
      {tab === 'time' && (
        <Card title="Time on this project"><TimeTable projectId={project.id} /></Card>
      )}
    </>
  );
}

function Overview({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const est = project.routeLengthFt ? sheetsForRun(project.routeLengthFt) : null;
  const sheetsQc = project.sheets.filter((s) => s.qcDone).length;
  const due = daysUntil(project.dueDate);
  return (
    <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(280px, 1fr)' }}>
      <Card title="Project record" subtitle="Saved as you type. These are the titleblock project-wide fields SENATITLE writes (name, location, number, engineer, PM, design/field dates).">
        <ProjectForm value={project} onChange={(patch) => updateProject(project.id, patch)} />
        <hr />
        <div className="row between">
          <span className="faint" style={{ fontSize: 12 }}>Created {fmtDate(project.createdAt)} · updated {fmtDate(project.updatedAt)}{project.updatedBy ? ` by ${project.updatedBy}` : ''}</span>
          <ConfirmButton label="Delete project" confirmLabel="Yes, delete it" onConfirm={onDelete} />
        </div>
      </Card>
      <div>
        <Card title="What to do next" className="tight"><NextStep project={project} /></Card>
        <Card title="At a glance">
          <KV
            rows={[
              ['Route', fmtFt(project.routeLengthFt)],
              ['Sheets (est.)', est !== null ? `${est} for a straight run (÷ 685)` : 'set the route length'],
              ['Sheets tracked', `${project.sheets.length} (${sheetsQc} through QC)`],
              ['CRS', project.crs],
              ['Due', project.dueDate ? `${fmtDate(project.dueDate)}${due !== null ? ` (${due < 0 ? `${-due} d overdue` : `${due} d`})` : ''}` : '—'],
              ['Drawing', project.drawingPath ? <code>{project.drawingPath}</code> : '—'],
            ]}
          />
        </Card>
        <Card title="Progress">
          <small>Workflow (guide 1.4)</small>
          <Progress value={WORKFLOW_STEPS.filter((s) => project.workflow[s.id]).length} total={WORKFLOW_STEPS.length} />
          <small style={{ display: 'block', marginTop: 8 }}>QC checklist (guide 11)</small>
          <Progress value={QC_CHECKLIST.filter((s) => project.qc[s.id]).length} total={QC_CHECKLIST.length} />
          <small style={{ display: 'block', marginTop: 8 }}>Sheets through QC</small>
          <Progress value={sheetsQc} total={project.sheets.length} />
        </Card>
        <Card title="Project folder" subtitle="Guide 2.1 — several commands write next to the drawing and expect this layout.">
          <pre style={{ fontSize: 11.5 }}>{`${project.number || '<Project>'}\\
  ${project.number || '<Project>'}.dwg
  xref\\          SheetIndex.dwg, utility exports, aerial tiles
  keymap\\        KEYMAP-01.tif … KEYMAP-VICINITY.tif
  keymap-windows.csv
  PDF\\           plotted sets
  Archived\\      older copies of the .dwg`}</pre>
        </Card>
      </div>
    </div>
  );
}

function Sheets({ project }: { project: Project }) {
  const [angle, setAngle] = useState(0);
  const issues = useMemo(() => checkSheets(project.sheets), [project.sheets]);
  const sheets = [...project.sheets].sort((a, b) => a.pageNumber - b.pageNumber);
  const setSheets = (sheets: Sheet[]) => updateProject(project.id, { sheets });
  const patch = (sid: string, p: Partial<Sheet>) =>
    setSheets(
      project.sheets.map((s) => {
        if (s.id !== sid) return s;
        const next = { ...s, ...p };
        if ('cellFt' in p) {
          if (next.cellFt !== null && next.cellFt < SHEET_MAX_ALONG_FT) {
            const c = clipExtents(next.cellFt);
            next.clipX0 = c.x0;
            next.clipX1 = c.x1;
          } else {
            next.clipX0 = null;
            next.clipX1 = null;
          }
        }
        return next;
      }),
    );
  const add = () => setSheets([...project.sheets, newSheet(project.sheets.length ? Math.max(...project.sheets.map((s) => s.pageNumber)) + 1 : 1)]);
  const remove = (sid: string) => setSheets(project.sheets.filter((s) => s.id !== sid));
  const generate = () => {
    if (!project.routeLengthFt) return toast('Set the route length on the Overview tab first.', 'bad');
    setSheets(generateSheets(project.routeLengthFt, angle));
    toast(`Generated ${sheetsForRun(project.routeLengthFt)} even sheets — edit angles and seams to match the real index.`);
  };
  const setAll = (key: keyof Sheet, v: boolean) => setSheets(project.sheets.map((s) => ({ ...s, [key]: v })));
  const errors = issues.filter((i) => i.level === 'error');
  const warns = issues.filter((i) => i.level === 'warn');

  return (
    <>
      <Card
        title="Sheet index tracker"
        subtitle="One row per SheetIndex polygon / PLAN-nn layout. Mirror the fields SENAWAVE-SheetIndex.py writes, then tick the per-sheet steps as you go (guide 6.2)."
        actions={
          <div className="row">
            <label className="row" style={{ gap: 4, fontSize: 12.5 }}>
              <span className="muted">angle</span>
              <input type="number" value={angle} onChange={(e) => setAngle(Number(e.target.value))} style={{ width: 70 }} step={90} min={-90} max={90} />
            </label>
            <ConfirmButton label={project.sheets.length ? 'Regenerate from route length' : 'Generate from route length'} confirmLabel="Replace all rows" className="btn sm" onConfirm={generate} />
            <button className="btn sm" onClick={add}>+ Sheet</button>
          </div>
        }
      >
        {project.sheets.length === 0 ? (
          <Empty title="No sheets yet">
            <p>Generate a straight-run estimate from the route length (n = ⌈length ÷ 685⌉, even cells), or add rows by hand from the ArcGIS SheetIndex table.</p>
          </Empty>
        ) : (
          <>
            {errors.length > 0 && (
              <Callout kind="bad">
                <strong>{errors.length} index error{errors.length > 1 ? 's' : ''}</strong>
                <ul style={{ marginBottom: 0 }}>{errors.map((i, k) => <li key={k}>{i.pageNumber ? <b>PLAN-{String(i.pageNumber).padStart(2, '0')}: </b> : null}{i.message}</li>)}</ul>
              </Callout>
            )}
            {warns.length > 0 && (
              <Callout kind="warn">
                <ul style={{ marginBottom: 0 }}>{warns.map((i, k) => <li key={k}>{i.pageNumber ? <b>PLAN-{String(i.pageNumber).padStart(2, '0')}: </b> : null}{i.message}</li>)}</ul>
              </Callout>
            )}
            {errors.length === 0 && warns.length === 0 && <Callout kind="ok"><p>Index checks pass: contiguous numbering, cells ≤ 685 ft, angles in range, matchline pairs agree both ways.</p></Callout>}
            <div className="tbl-wrap">
              <table className="tbl compact">
                <thead>
                  <tr>
                    <th>PLAN</th>
                    <th title="UCS Z rotation, −90…90">Angle</th>
                    <th title="Length along the route, ≤ 685 ft">CellFt</th>
                    <th title="Paper X of the clip rectangle (auto from CellFt)">Clip X0–X1</th>
                    <th title="SEE SHEET across the Left border">L</th>
                    <th>R</th>
                    <th>T</th>
                    <th>B</th>
                    <th title="6.2 steps 1–7">Aligned</th>
                    <th title="SENACLIP / 6.2 steps 8–10">Clipped</th>
                    <th title="SENASIDE">Side</th>
                    <th title="Per-sheet titleblock fields">Title</th>
                    <th title="Section 11 pass on this sheet">QC</th>
                    <th>Notes</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {sheets.map((s) => (
                    <tr key={s.id}>
                      <td className="mono nowrap">
                        <input type="number" value={s.pageNumber} min={1} onChange={(e) => { const n = Number(e.target.value); if (e.target.value !== '' && Number.isInteger(n) && n >= 1) patch(s.id, { pageNumber: n }); }} style={{ width: 58 }} />
                      </td>
                      <td><input type="number" value={s.angle ?? ''} step={90} min={-90} max={90} onChange={(e) => patch(s.id, { angle: e.target.value === '' ? null : Number(e.target.value) })} style={{ width: 64 }} /></td>
                      <td><input type="number" value={s.cellFt ?? ''} min={0} max={SHEET_MAX_ALONG_FT} onChange={(e) => patch(s.id, { cellFt: e.target.value === '' ? null : Number(e.target.value) })} style={{ width: 70 }} /></td>
                      <td className="mono nowrap muted">{s.clipX0 !== null ? `${s.clipX0.toFixed(2)}–${s.clipX1?.toFixed(2)}` : 'full'}</td>
                      <td><input value={s.matchL} onChange={(e) => patch(s.id, { matchL: e.target.value })} style={{ width: 44 }} /></td>
                      <td><input value={s.matchR} onChange={(e) => patch(s.id, { matchR: e.target.value })} style={{ width: 44 }} /></td>
                      <td><input value={s.matchT} onChange={(e) => patch(s.id, { matchT: e.target.value })} style={{ width: 44 }} /></td>
                      <td><input value={s.matchB} onChange={(e) => patch(s.id, { matchB: e.target.value })} style={{ width: 44 }} /></td>
                      <td><input type="checkbox" checked={s.aligned} onChange={(e) => patch(s.id, { aligned: e.target.checked })} /></td>
                      <td><input type="checkbox" checked={s.clipped} onChange={(e) => patch(s.id, { clipped: e.target.checked })} /></td>
                      <td><input type="checkbox" checked={s.sidePanel} onChange={(e) => patch(s.id, { sidePanel: e.target.checked })} /></td>
                      <td><input type="checkbox" checked={s.titleblock} onChange={(e) => patch(s.id, { titleblock: e.target.checked })} /></td>
                      <td><input type="checkbox" checked={s.qcDone} onChange={(e) => patch(s.id, { qcDone: e.target.checked })} /></td>
                      <td><input value={s.notes} onChange={(e) => patch(s.id, { notes: e.target.value })} placeholder="seam moved, corner sheet…" style={{ minWidth: 160 }} /></td>
                      <td><ConfirmButton label="×" className="btn sm ghost" onConfirm={() => remove(s.id)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="row" style={{ marginTop: 10, fontSize: 12.5 }}>
              <span className="muted">Bulk:</span>
              {(['aligned', 'clipped', 'sidePanel', 'titleblock'] as const).map((k) => (
                <button key={k} className="btn sm ghost" onClick={() => setAll(k, true)}>all {k}</button>
              ))}
              <span className="spacer" />
              <span className="muted">{project.sheets.filter((s) => sheetProgress(s) === 5).length} of {project.sheets.length} sheets complete</span>
            </div>
          </>
        )}
      </Card>
      <Card title="Per-sheet recipe (guide 6.2)" className="tight">
        <ol style={{ marginBottom: 0, fontSize: 13 }}>
          <li>Open layout PLAN-nn → MSPACE</li>
          <li>UCS → Z → &lt;Angle&gt; → PLAN ↵ (no Angle: UCS → Entity → pick the edge along the route; north bottom/left → UCS Z 180)</li>
          <li>ZOOM Window (two diagonal corners) → ZOOM 0.02XP → UCS Save PLAN-nn</li>
          <li>PSPACE. Clip if CellFt &lt; 685: G-VPORT current, RECTANG ClipX0,2.10 ClipX1,10.50, VPCLIP — or run SENACLIP once for every aligned sheet</li>
          <li>Matchlines + SEE SHEET labels (0.14"), then Display locked = Yes. Lock last.</li>
        </ol>
      </Card>
    </>
  );
}

function Workflow({ project }: { project: Project }) {
  const toggle = (id: string, v: boolean) => updateProject(project.id, (p) => ({ workflow: { ...p.workflow, [id]: v } }));
  const done = WORKFLOW_STEPS.filter((s) => project.workflow[s.id]).length;
  return (
    <Card title="Your first plan set — the whole job on one page" subtitle="Guide 1.4. Tick through it in order; each line points at the section with the detail.">
      <Progress value={done} total={WORKFLOW_STEPS.length} />
      {WORKFLOW_PHASES.map((phase) => (
        <div key={phase}>
          <div className="group-title">{phase}</div>
          <ul className="check-list">
            {WORKFLOW_STEPS.filter((s) => s.phase === phase).map((s) => (
              <li key={s.id} className={project.workflow[s.id] ? 'done' : ''}>
                <input id={`wf-${s.id}`} type="checkbox" checked={!!project.workflow[s.id]} onChange={(e) => toggle(s.id, e.target.checked)} />
                <label htmlFor={`wf-${s.id}`}>
                  {s.label}
                  <span className="meta">§{s.section}</span>
                  {s.commands?.map((c) => <Link key={c} to={`/reference/commands?q=${c}`} className="tag" style={{ marginLeft: 4 }}>{c}</Link>)}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn sm ghost" onClick={() => updateProject(project.id, { workflow: {} })}>Clear all</button>
        <Link to="/reference/workflow" className="btn sm">Open in the guide</Link>
      </div>
    </Card>
  );
}

function Qc({ project }: { project: Project }) {
  const toggle = (id: string, v: boolean) => updateProject(project.id, (p) => ({ qc: { ...p.qc, [id]: v } }));
  const done = QC_CHECKLIST.filter((s) => project.qc[s.id]).length;
  return (
    <Card title="QC checklist — everything to check before a set leaves" subtitle="Guide section 11. Run it on the plotted PDF, not on screen.">
      <Progress value={done} total={QC_CHECKLIST.length} />
      {QC_GROUPS.map((g) => (
        <div key={g}>
          <div className="group-title">{g}</div>
          <ul className="check-list">
            {QC_CHECKLIST.filter((q) => q.group === g).map((q) => (
              <li key={q.id} className={project.qc[q.id] ? 'done' : ''}>
                <input id={`qc-${q.id}`} type="checkbox" checked={!!project.qc[q.id]} onChange={(e) => toggle(q.id, e.target.checked)} />
                <label htmlFor={`qc-${q.id}`}>{q.label}</label>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div className="row" style={{ marginTop: 10 }}>
        <button className="btn sm ghost" onClick={() => updateProject(project.id, { qc: {} })}>Clear all</button>
        {done === QC_CHECKLIST.length && <Badge kind="ok">QC complete — ready for the Engineer of Record</Badge>}
      </div>
    </Card>
  );
}

const AGENCIES: PermitAgencyType[] = ['Municipal', 'County', 'UDOT', 'Railroad', 'Private easement', 'Blue Stakes / 811', 'Other'];

function Permits({ project, permits }: { project: Project; permits: Permit[] }) {
  const [draft, setDraft] = useState(() => newPermit(project.id, { agencyName: project.municipality }));
  const add = () => {
    addPermit({ ...draft, agencyName: draft.agencyName.trim(), type: draft.type.trim() });
    setDraft(newPermit(project.id, { agencyName: project.municipality }));
  };
  const kind = (s: PermitStatus) => (s === 'approved' ? 'ok' : s === 'denied' ? 'bad' : s === 'comments' ? 'warn' : s === 'submitted' || s === 'resubmitted' ? 'info' : '');
  return (
    <>
      <Card title="Permits & submittals" subtitle="One row per agency review: municipal ROW, county, UDOT encroachment, railroad, private easements, Blue Stakes. Track comment rounds here and the comments themselves as notes (type: Agency comment).">
        <div className="form-grid">
          <Field label="Agency type">
            <select value={draft.agency} onChange={(e) => setDraft({ ...draft, agency: e.target.value as PermitAgencyType })}>
              {AGENCIES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Agency name">
            <input value={draft.agencyName} onChange={(e) => setDraft({ ...draft, agencyName: e.target.value })} placeholder="Brigham City / UDOT Region 1 / Box Elder County" />
          </Field>
          <Field label="Permit / submittal type">
            <input value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} placeholder="Encroachment permit, ROW excavation permit…" />
          </Field>
          <Field label="Due / target">
            <input type="date" value={draft.dueOn} onChange={(e) => setDraft({ ...draft, dueOn: e.target.value })} />
          </Field>
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          <button className="btn primary" onClick={add} disabled={!draft.type.trim()}>Add permit</button>
        </div>
      </Card>
      {permits.length === 0 ? (
        <Empty title="No permits tracked" />
      ) : (
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead>
              <tr>
                <th>Agency</th>
                <th>Type</th>
                <th>Status</th>
                <th>Permit no.</th>
                <th>Submitted</th>
                <th>Due</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {permits.map((p) => (
                <tr key={p.id}>
                  <td><Badge>{p.agency}</Badge><div>{p.agencyName}</div></td>
                  <td><input value={p.type} onChange={(e) => updatePermit(p.id, { type: e.target.value })} /></td>
                  <td>
                    <select value={p.status} onChange={(e) => updatePermit(p.id, { status: e.target.value as PermitStatus })}>
                      {PERMIT_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <div style={{ marginTop: 4 }}><Badge kind={kind(p.status)}>{PERMIT_STATUSES.find((s) => s.id === p.status)?.label}</Badge></div>
                  </td>
                  <td><input value={p.permitNo} onChange={(e) => updatePermit(p.id, { permitNo: e.target.value })} style={{ width: 110 }} /></td>
                  <td><input type="date" value={p.submittedOn} onChange={(e) => updatePermit(p.id, { submittedOn: e.target.value })} /></td>
                  <td><input type="date" value={p.dueOn} onChange={(e) => updatePermit(p.id, { dueOn: e.target.value })} /></td>
                  <td><textarea value={p.notes} onChange={(e) => updatePermit(p.id, { notes: e.target.value })} style={{ minHeight: 44, minWidth: 200 }} /></td>
                  <td><ConfirmButton label="×" className="btn sm ghost" onConfirm={() => { deletePermit(p.id); toast('Permit removed.', 'ok', { label: 'Undo', onClick: () => restoreEntity('permits', p.id) }); }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
