import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import * as G from '@/data/guide';
import { Badge, Callout, Card, Swatch } from '@/components/ui';

type Tab = 'start' | 'numbers' | 'workflow' | 'arcgis' | 'bricscad' | 'sheets' | 'sidepanel' | 'plot' | 'qc' | 'trouble' | 'commands' | 'layers' | 'symbols' | 'migration' | 'maintain' | 'calc';

const TABS: { id: Tab; label: string }[] = [
  { id: 'start', label: 'Start here' },
  { id: 'numbers', label: 'The numbers' },
  { id: 'workflow', label: 'Whole job' },
  { id: 'arcgis', label: 'ArcGIS' },
  { id: 'bricscad', label: 'BricsCAD data' },
  { id: 'sheets', label: 'Cut & align' },
  { id: 'sidepanel', label: 'Side panel & vicinity' },
  { id: 'plot', label: 'Titleblocks & plot' },
  { id: 'qc', label: 'QC' },
  { id: 'trouble', label: 'Troubleshooting' },
  { id: 'commands', label: 'Commands' },
  { id: 'layers', label: 'Layers' },
  { id: 'symbols', label: 'Symbols' },
  { id: 'migration', label: 'Old layers' },
  { id: 'maintain', label: 'Maintaining' },
  { id: 'calc', label: 'Calculator' },
];

export default function Reference() {
  const { tab: tabParam } = useParams();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const tab = (TABS.some((t) => t.id === tabParam) ? tabParam : 'start') as Tab;
  const [q, setQ] = useState(sp.get('q') || '');

  return (
    <>
      <Callout>
        <p style={{ marginBottom: 4 }}>
          <strong>{G.GUIDE_META.title}</strong> · {G.GUIDE_META.revision} · {G.GUIDE_META.date} · {G.GUIDE_META.software}
        </p>
        <p className="muted" style={{ fontSize: 12.5 }}>{G.GUIDE_META.summary} Source file: docs/source/SENAWAVE-Plan-Production-Guide-Rev5.docx.</p>
      </Callout>
      <div className="pill-nav">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => nav(`/reference/${t.id}`)}>{t.label}</button>
        ))}
      </div>
      {(tab === 'commands' || tab === 'layers' || tab === 'trouble' || tab === 'migration' || tab === 'symbols') && (
        <div className="toolbar">
          <input className="search" placeholder="Filter…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}
      {tab === 'start' && <Start />}
      {tab === 'numbers' && <Numbers />}
      {tab === 'workflow' && <Workflow />}
      {tab === 'arcgis' && <ArcGis />}
      {tab === 'bricscad' && <BricsCad />}
      {tab === 'sheets' && <CutAlign />}
      {tab === 'sidepanel' && <SidePanel />}
      {tab === 'plot' && <Plot />}
      {tab === 'qc' && <Qc />}
      {tab === 'trouble' && <Trouble q={q} />}
      {tab === 'commands' && <Commands q={q} />}
      {tab === 'layers' && <Layers q={q} />}
      {tab === 'symbols' && <Symbols q={q} />}
      {tab === 'migration' && <Migration q={q} />}
      {tab === 'maintain' && <Maintain />}
      {tab === 'calc' && <Calc />}
    </>
  );
}

function match(q: string, ...fields: string[]) {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(s));
}

function Start() {
  return (
    <>
      <Card title="If you read nothing else">
        <ul>{G.READ_NOTHING_ELSE.map((t) => <li key={t}>{t}</li>)}</ul>
      </Card>
      <div className="grid cols-2">
        <Card title="Three rules that explain most problems (1.3)">
          {G.THREE_RULES.map((r) => (
            <p key={r.rule}><strong>{r.rule}.</strong> {r.meaning}</p>
          ))}
        </Card>
        <Card title="Set up BricsCAD once, per computer (1.2)">
          <ol>{G.BRICSCAD_SETUP.map((s) => <li key={s.id}><strong>{s.title}.</strong> {s.body}</li>)}</ol>
        </Card>
      </div>
      <div className="grid cols-2">
        <Card title="What is in the Templates folder (1.1)"><pre>{G.TEMPLATES_FOLDER}</pre></Card>
        <Card title="The project folder (2.1)">
          <pre>{G.PROJECT_FOLDER}</pre>
          <p className="muted" style={{ fontSize: 12.5 }}>Keep one folder per project — several commands write next to the drawing and expect to find things there.</p>
        </Card>
      </div>
      <Card title="Support files">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>File</th><th>What it is for</th></tr></thead>
            <tbody>{G.SUPPORT_FILES.map((f) => <tr key={f.file}><td className="mono nowrap">{f.file}</td><td>{f.purpose}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <Card title="Day-one health check (2.2)" subtitle="Do this on every new drawing and on any older drawing before you trust it. Both commands only report.">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>You see</th><th>Expected</th><th>If not</th></tr></thead>
            <tbody>{G.HEALTH_CHECK.map((h) => <tr key={h.see}><td className="nowrap">{h.see}</td><td>{h.expected}</td><td>{h.ifNot}</td></tr>)}</tbody>
          </table>
        </div>
        <div className="group-title" style={{ marginTop: 14 }}>Page setup fix</div>
        <ol>{G.PAGE_SETUP_FIX.map((t) => <li key={t}>{t}</li>)}</ol>
        <div className="group-title">How the linetypes work (2.3)</div>
        <ul>{G.LINETYPE_NOTES.map((t) => <li key={t}>{t}</li>)}</ul>
      </Card>
    </>
  );
}

function Numbers() {
  return (
    <>
      <Callout kind="info"><strong>Two numbers to memorise.</strong> {G.TWO_NUMBERS.join(' ')}</Callout>
      <Card title="The numbers (3)" subtitle="Measured from the template, layout PLAN-01. Everything else is derived from these — use them, do not re-derive them.">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Property</th><th>Value</th><th>What it drives</th></tr></thead>
            <tbody>{G.NUMBERS.map((n) => <tr key={n.property}><td>{n.property}</td><td className="mono">{n.value}</td><td>{n.drives}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <div className="grid cols-2">
        {[G.PAPER_COORDS.sidePanel, G.PAPER_COORDS.vicinity].map((blk) => (
          <Card key={blk.title} title={blk.title} subtitle='Paper inches, origin at the bottom-left of the 17 × 11 sheet; content inset 0.10" inside each cell.'>
            <div className="tbl-wrap">
              <table className="tbl compact">
                <tbody>{blk.rows.map((r) => <tr key={r.cell}><td>{r.cell}</td><td className="mono nowrap">{r.extent}</td><td className="muted mono">{r.note}</td></tr>)}</tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Text heights (6.5)" subtitle="Decide the plotted height first. Model-space height = plotted inches × 50.">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Use</th><th>Plotted height</th><th>Model-space height</th></tr></thead>
            <tbody>{G.TEXT_HEIGHTS.map((t) => <tr key={t.use}><td>{t.use}</td><td className="mono">{t.paper}</td><td className="mono">{t.model}</td></tr>)}</tbody>
          </table>
        </div>
        <ul style={{ marginTop: 10 }}>{G.TEXT_RULES.map((t) => <li key={t}>{t}</li>)}</ul>
      </Card>
      <Card title="System variables (6.3)">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Variable</th><th>Set to</th><th>Why</th></tr></thead>
            <tbody>{G.SYSVARS.map((v) => <tr key={v.variable}><td className="mono">{v.variable}</td><td className="mono">{v.value}</td><td>{v.why}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Workflow() {
  return (
    <Card title="Your first plan set — the whole job on one page (1.4)" subtitle="Each line points at the section with the detail. Tick through it in order — per project, on the project's Workflow tab.">
      {G.WORKFLOW_PHASES.map((phase) => (
        <div key={phase}>
          <div className="group-title">{phase}</div>
          <ul className="check-list">
            {G.WORKFLOW_STEPS.filter((s) => s.phase === phase).map((s) => (
              <li key={s.id}>
                <span className="mono muted" style={{ minWidth: 48, fontSize: 12 }}>§{s.section}</span>
                <span>{s.label}{s.commands?.map((c) => <span key={c} className="tag" style={{ marginLeft: 6 }}>{c}</span>)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}

function ArcGis() {
  return (
    <>
      <Card title="ArcGIS — the sheet index and the data (4)">
        <p>Before any sheet is cut, make the sheet index: one polygon per PLAN sheet that says which stretch of route that sheet owns. Sheets are edge-to-edge — each polygon at most 685 ft along × 420 ft across, neighbours share an edge but never overlap. In BricsCAD each plan viewport is clipped to its polygon, so the viewport border is the matchline, every foot of route is drawn on exactly one sheet, and the same polygons give you the key maps.</p>
        <div className="group-title">Prerequisites (4.1)</div>
        <ul>{G.CRS_RULES.map((t) => <li key={t}>{t}</li>)}</ul>
        <div className="row">{G.CRS_OPTIONS.map((c) => <Badge key={c.code} mono>{c.code} {c.label}</Badge>)}</div>
      </Card>
      <Card title="Three ways to make the index (4.2)">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Method</th><th>Use it for</th><th>§</th></tr></thead>
            <tbody>{G.INDEX_METHODS.map((m) => <tr key={m.method}><td className="mono">{m.method}</td><td>{m.use}</td><td>{m.section}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <div className="grid cols-2">
        <Card title="SENAWAVE-SheetIndex.py (4.3)">
          <ol>{G.SHEET_INDEX_RUN.map((t) => <li key={t}>{t}</li>)}</ol>
          <p className="muted" style={{ fontSize: 12.5 }}>It never deletes your data: the only thing it will replace is a sheet index it made itself, and only with overwrite=True. Sheets per run = run length ÷ 685, rounded up — a 24,917 ft straight corridor is 37 sheets.</p>
          <div className="tbl-wrap">
            <table className="tbl compact">
              <thead><tr><th>Option</th><th>Default</th><th>What it does</th></tr></thead>
              <tbody>{G.SHEET_INDEX_OPTIONS.map((o) => <tr key={o.option}><td className="mono">{o.option}</td><td className="mono">{o.def}</td><td>{o.what}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
        <Card title="Fields it writes on every polygon">
          <div className="tbl-wrap">
            <table className="tbl compact">
              <thead><tr><th>Field</th><th>Use</th></tr></thead>
              <tbody>{G.SHEET_INDEX_FIELDS.map((f) => <tr key={f.field}><td className="mono nowrap">{f.field}</td><td>{f.use}</td></tr>)}</tbody>
            </table>
          </div>
        </Card>
      </div>
      <div className="grid cols-2">
        <Card title="By hand (4.4) and Strip Map (4.5)">
          <ul>
            <li>Each polygon is a rectangle no larger than 685 × 420 ft, long side along the route. Keep the full 420 ft across; shorten only along the route.</li>
            <li>Neighbours share an edge exactly — edit with vertex and edge snapping on.</li>
            <li>Put seams on straight runs, clear of handholes, splices, bore pits and intersections. At a corner, one sheet owns the whole corner.</li>
            <li>Renumber PageNumber 1…N in reading order and update MatchL/R/T/B if you moved a seam.</li>
            <li>Strip Map: 0 % overlap, 685 × 420 ft, horizontal, WE_NS. Pages follow the local trend of the line, so fix bends by hand; use LeftPage/RightPage for neighbours and never its Angle field for CAD rotation.</li>
          </ul>
          <pre>{G.STRIP_MAP_SNIPPET}</pre>
        </Card>
        <Card title="QC the index, then export (4.6–4.7)">
          <ul>{G.INDEX_QC.map((t) => <li key={t}>{t}</li>)}</ul>
          <pre>{G.EXPORT_INDEX_SNIPPET}</pre>
          <ul>
            <li>SENAWAVE-SheetIndex.py already writes Layer = TB-GRID — skip AddField / CalculateField and run only ExportCAD.</li>
            <li>Always use the .dwg seed; a .dxf seed forces DXF output.</li>
            <li>Keep the file name SheetIndex.dwg — the side panel and vicinity commands look for an xref named SheetIndex.</li>
          </ul>
        </Card>
      </div>
      <Card title="Export the utility data so it lands on the right layers (4.8)">
        <p>In CAD, meaning lives in the layer. Every distinction that matters must become its own layer before export, or it flattens and cannot be recovered. Export To CAD honours these reserved fields:</p>
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Field</th><th>Type</th><th>Drives</th></tr></thead>
            <tbody>{G.CAD_FIELDS.map((f) => <tr key={f.field}><td className="mono">{f.field}</td><td>{f.type}</td><td>{f.drives}</td></tr>)}</tbody>
          </table>
        </div>
        <pre style={{ marginTop: 10 }}>{G.LAYER_FIELD_SNIPPET}</pre>
        <p className="muted" style={{ fontSize: 12.5 }}>Export each dataset with the same seed to &lt;Project&gt;\xref\. Old names (SW-POWER-DISTRIBUTION…) can be renamed with SENAMIGRATE, but that cannot tell buried from overhead — fix those at the source.</p>
      </Card>
      <Card title="Aerial imagery behind the plan (5.3)">
        <ol>{G.IMAGERY_RUN.map((t) => <li key={t}>{t}</li>)}</ol>
      </Card>
    </>
  );
}

function BricsCad() {
  return (
    <>
      <Card title="Attach the sheet index (5.1)">
        <ul>
          <li>UCS → World. XATTACH inserts in the current UCS, and a rotated UCS gives you an xref you cannot find.</li>
          <li>XATTACH → xref\SheetIndex.dwg, insertion 0,0,0, scale 1, rotation 0. Leave it attached (do not bind) so it can be reloaded when the index changes.</li>
          <li>Check with DIST that a polygon measures 420 ft across and no more than 685 ft along. 5040 across means an inch seed; tiny numbers mean metric. Fix the export, never scale the geometry.</li>
          <li>Set layer TB-GRID to no-plot.</li>
        </ul>
        <Callout kind="warn"><strong>Keep SheetIndex as an xref.</strong> It is the one attachment you do not bind or explode: SENACLIP, SENAKEYMAP and SENAVICINITY read the polygons from it, and Reload picks up an edited index.</Callout>
      </Card>
      <Card title="Utility linework and point features (5.2)">
        <ul>
          <li>XATTACH each utility export at 0,0,0 in World UCS, then Attachments panel → Bind → Insert so the layers come in with clean names.</li>
          <li>Bind leaves the whole file as one block: select it and EXPLODE it <strong>once</strong>. (Shortcut: INSERT the .dwg at 0,0,0 with Explode ticked.) A second EXPLODE breaks up the symbol blocks.</li>
          <li>Old layer names (SW-*, GAS, WATER…): SENAMIGRATE on a copy; check anything it maps to PWR-OH-E.</li>
          <li>SENACOLOR then REGENALL — re-applies colours, SW_* linetypes and lineweights.</li>
          <li>Points arrive as one-pixel CAD points: PT2BLK, block name from Appendix B, scale 1, then Layer to convert every point on a layer. Points exported with a RefName are already blocks.</li>
          <li>Older drawing without the symbol blocks: SENAWAVELOAD first.</li>
        </ul>
      </Card>
      <Card title="Draw order (5.4)">
        <p>Proposed fiber must be the top linework and annotation must sit above it. After binding data or attaching imagery, run DRAWORDERBYLAYER and point it at Support\SENAWAVE-11x17-DRAWORDER.lst. Draw order is stored per object, so re-run it after every large import.</p>
      </Card>
    </>
  );
}

function CutAlign() {
  return (
    <>
      <Card title="Make the layouts (6.1)">
        <p>Right-click the PLAN-01 tab → Copy, once per sheet index polygon, and rename the copies PLAN-02, PLAN-03 … Never draw a plan viewport by hand. Layout PLAN-nn always shows polygon nn.</p>
      </Card>
      <Card title="The per-sheet recipe (6.2)" subtitle="Turn the UCS to the polygon, ask for the plan view of that UCS, centre and scale it, then clip the viewport to the polygon.">
        <ol>{G.PER_SHEET_RECIPE.map((t) => <li key={t}>{t}</li>)}</ol>
        <Callout kind="ok"><strong>Shortcut: SENACLIP does steps 8–10 on every sheet.</strong> Align every PLAN sheet with steps 1–7, then run SENACLIP once. Re-run it after moving a seam; SENACLIPCLEAN takes it all off again. Do at least one sheet by hand first so you know what it is doing.</Callout>
        <Callout kind="warn"><strong>Lock last.</strong> A locked viewport cannot be rotated, scaled or panned. The order is always rotate → scale → centre → clip → lock.</Callout>
        <p className="muted" style={{ fontSize: 12.5 }}>Why UCS + PLAN: MVSETUP Align sets no UCS (annotation still crooked); DVIEW TWist inverts the sign; rotating the viewport frame depends on a registry setting that does not travel with the template.</p>
      </Card>
      <Card title="Matchlines (6.4)">
        <ul>{G.MATCHLINE_RULES.map((t) => <li key={t}>{t}</li>)}</ul>
      </Card>
      <Card title="Annotation in a rotated view (6.5)">
        <ul>{G.TEXT_RULES.map((t) => <li key={t}>{t}</li>)}</ul>
        <p>Sheet-fixed items — north arrow, legend, key map, matchlines and their labels — live in paper space, where the twist cannot touch them.</p>
      </Card>
    </>
  );
}

function SidePanel() {
  return (
    <>
      <Card title="The side panel (7)" subtitle="The right-hand column of every PLAN sheet is block TB_SIDEPANEL: north arrow, LEGEND, KEY MAP. SENASIDE.lsp fills it; every command is safe to re-run.">
        <pre>{`SENASIDE        whole panel on every PLAN sheet - runs the four below, in order
  SENASIDECLEAN   strip placeholder text out of TB_SIDEPANEL
  SENALEGEND      build TB_LEGEND and place it on every PLAN sheet
  SENAKEYMAP      key map on every PLAN sheet
  SENANORTH       north arrow on every PLAN sheet, rotated -theta`}</pre>
        <p>SENAKEYMAP and SENANORTH read the plan viewports, so run SENASIDE after section 6, and again whenever you re-cut or realign a sheet.</p>
        <div className="group-title">Legend (7.1)</div>
        <ul>
          <li>Rows live at the top of Support\SENASIDE.lsp: *ss-legend-rows* (layer, label) and *ss-legend-syms* (layer, block, label). Delete rows you do not use; add IRR-UG-E only on jobs with irrigation.</li>
          <li>After editing: APPLOAD SENASIDE.lsp again, then SENALEGEND and SENAVICINITY — both legends are snapshots.</li>
          <li>SENALEGDIAG reports every row (ok / marginal / SOLID); SENALEGSYM reports symbol rows and unlisted blocks; SENALEGWIPE then SENALEGEND + SENAVICINITY for a clean rebuild.</li>
        </ul>
        <div className="group-title">Key map (7.2)</div>
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Setting (top of SENASIDE.lsp)</th><th>Values</th><th>Effect</th></tr></thead>
            <tbody>{G.KEYMAP_SETTINGS.map((k) => <tr key={k.setting}><td className="mono">{k.setting}</td><td className="mono">{k.values}</td><td>{k.effect}</td></tr>)}</tbody>
          </table>
        </div>
        <p style={{ marginTop: 8 }}>Numbers come from the layout name, so PLAN-04 is always key map 4. A sheet that is not aligned yet is left blank rather than guessed.</p>
        <div className="group-title">North arrow (7.3)</div>
        <p>If a sheet's UCS is turned θ, the paper-space north arrow must be turned −θ. SENANORTH prints θ and the arrow rotation for every sheet — a free QC pass: on a grid-snapped index every θ is a multiple of 90°.</p>
      </Card>
      <Card title="The VICINITY sheet (8)" subtitle="Page 2 of the set, after the COVER. The only place that shows the whole route, the only full-size legend and the only sheet index.">
        <pre>{`SENAVICINITY    build or rebuild the sheet (needs SENASIDE loaded first)
SENAVICCLEAN    empty it, keep the layout`}</pre>
        <ul>
          <li>Key map: the SheetIndex rectangles, whole corridor, north up, fitted to the 7.60 × 7.30" cell — run SENAKEYMAP first.</li>
          <li>SHEET INDEX: the layout tab order, PLAN layouts collapsed to "PLAN-01 THRU PLAN-nn". FIRM: the TB_11X17 attributes (SENATITLE). LEGEND: the same rows, three columns.</li>
          <li>Missing VICINITY layout: copy COVER, rename VICINITY, drag after COVER, delete the extra viewport, run SENAVICINITY.</li>
        </ul>
      </Card>
      <Card title="Basemaps behind the key maps (9)">
        <pre>{`BricsCAD     SENAKEYMAP       framing decided here
             SENAVICINITY     adds the VICINITY row to the window list
             SENAKEYWIN       writes keymap-windows.csv beside the .dwg
ArcGIS Pro   Load Code... ArcGIS\\SENAWAVE-KeyMapBasemap.py, then
             keymap_basemaps(r"<Project>\\keymap-windows.csv", epsg=3566)
             -> KEYMAP-01.tif ... KEYMAP-nn.tif, KEYMAP-VICINITY.tif
BricsCAD     SENAIMG          both basemaps; asks once for the keymap folder
             SENAKEYMAP       again: "you are here" switches from fill to bold`}</pre>
        <Callout kind="warn"><strong>Order matters.</strong> SENAKEYWIN writes the VICINITY row only after SENAVICINITY has run. Export before that and the vicinity map stays empty.</Callout>
        <p className="muted" style={{ fontSize: 12.5 }}>By hand: IMAGEATTACH at scale 1, rotation 0, insertion 14.30,2.20 (key map) or 0.60,3.10 (vicinity); layer TB-KEYMAP-IMG, Fade 25, DRAWORDER Back, IMAGEFRAME 0.</p>
      </Card>
    </>
  );
}

function Plot() {
  return (
    <Card title="Titleblocks, numbering and plotting (10)">
      <ul>{G.TITLEBLOCK_RULES.map((t) => <li key={t}>{t}</li>)}</ul>
    </Card>
  );
}

function Qc() {
  return (
    <Card title="QC checklist (11)" subtitle="Everything to check before a set leaves. Tick it per project on the project's QC tab.">
      {G.QC_GROUPS.map((g) => (
        <div key={g}>
          <div className="group-title">{g}</div>
          <ul>{G.QC_CHECKLIST.filter((q) => q.group === g).map((q) => <li key={q.id}>{q.label}</li>)}</ul>
        </div>
      ))}
    </Card>
  );
}

function Trouble({ q }: { q: string }) {
  const rows = G.TROUBLESHOOTING.filter((r) => match(q, r.symptom, r.fix));
  return (
    <Card title="Troubleshooting (12)" subtitle="Symptom → cause → fix. Every row happened on a real job.">
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th style={{ width: '38%' }}>Symptom</th><th>Cause and fix</th></tr></thead>
          <tbody>{rows.map((r) => <tr key={r.symptom}><td>{r.symptom}</td><td>{r.fix}</td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  );
}

function Commands({ q }: { q: string }) {
  const rows = G.COMMANDS.filter((c) => match(q, c.command, c.file, c.what));
  const files = [...new Set(rows.map((c) => c.file))];
  return (
    <>
      <Card title="Command reference (13)" subtitle="All commands are loaded by SENAWAVE-LOADALL.lsp. File = the .lsp in Templates\Support that defines it.">
        {files.map((f) => (
          <div key={f}>
            <div className="group-title">{f}.lsp</div>
            <div className="tbl-wrap" style={{ marginBottom: 8 }}>
              <table className="tbl compact">
                <tbody>{rows.filter((c) => c.file === f).map((c) => <tr key={c.command}><td className="mono nowrap" style={{ width: 170 }}>{c.command}</td><td>{c.what}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="muted">No command matches.</p>}
      </Card>
      <Card title="Retired — do not use">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <tbody>{G.RETIRED_COMMANDS.map((c) => <tr key={c.command}><td className="mono nowrap">{c.command}</td><td>{c.replacedBy}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Layers({ q }: { q: string }) {
  const rows = G.LAYERS.filter((l) => match(q, l.layer, l.linetype, l.use, l.group));
  const groups = [...new Set(rows.map((l) => l.group))];
  return (
    <Card title="Appendix A — Layer standard" subtitle={G.LAYER_NAMING}>
      {groups.map((g) => (
        <div key={g}>
          <div className="group-title">{g}</div>
          <div className="tbl-wrap" style={{ marginBottom: 8 }}>
            <table className="tbl compact">
              <thead><tr><th>Layer</th><th>Colour (RGB)</th><th>Linetype (code)</th><th>LW</th><th>Use</th></tr></thead>
              <tbody>
                {rows.filter((l) => l.group === g).map((l) => (
                  <tr key={l.layer}>
                    <td className="mono nowrap">{l.layer}</td>
                    <td className="nowrap"><Swatch rgb={l.rgb} /><span className="mono">{l.rgb}</span></td>
                    <td className="mono">{l.linetype}</td>
                    <td className="mono">{l.lw}</td>
                    <td>{l.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </Card>
  );
}

function Symbols({ q }: { q: string }) {
  const rows = G.SYMBOLS.filter((s) => match(q, s.blocks, s.layer, s.note));
  return (
    <>
      <Card title="Appendix B — Symbol library" subtitle={G.SYMBOL_RULES}>
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Block(s)</th><th>Layer</th><th>Note</th></tr></thead>
            <tbody>{rows.map((s) => <tr key={s.blocks}><td className="mono">{s.blocks}</td><td className="mono nowrap">{s.layer}</td><td>{s.note}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <Card title="Symbol sheet" subtitle="From the guide — colours shown are the library file's own; in a project drawing each symbol takes the colour of its layer.">
        <img className="symbol-sheet" src={`${import.meta.env.BASE_URL}symbol-library.png`} alt="SENAWAVE fiber symbol library: handholes, manholes, poles, valves, cabinets, splices and more" />
      </Card>
    </>
  );
}

function Migration({ q }: { q: string }) {
  const rows = G.MIGRATION.filter((m) => match(q, m.old, m.std));
  return (
    <Card title="Appendix C — Old and ArcGIS layer names" subtitle="What SENAMIGRATE does to layers with old names. Anything mapped to PWR-OH-E must be checked: those old names carried no buried/overhead flag. Always follow SENAMIGRATE with SENALT and SENACOLOR.">
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>Old layer</th><th>Standard</th></tr></thead>
          <tbody>{rows.map((m) => <tr key={m.old}><td className="mono">{m.old}</td><td className="mono">{m.std}</td></tr>)}</tbody>
        </table>
      </div>
    </Card>
  );
}

function Maintain() {
  return (
    <>
      <Card title="Maintaining the package (14)" subtitle="The source files in Support\ are authoritative; every drawing holds a copy made by a command, and nothing updates itself.">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Element</th><th>Lives in</th><th>Copied into a drawing by</th></tr></thead>
            <tbody>{G.MAINTAIN.map((m) => <tr key={m.element}><td>{m.element}</td><td className="mono">{m.livesIn}</td><td className="mono">{m.copiedBy}</td></tr>)}</tbody>
          </table>
        </div>
      </Card>
      <Card title="Rules">
        <ul>{G.MAINTAIN_RULES.map((r) => <li key={r}>{r}</li>)}</ul>
      </Card>
    </>
  );
}

function Calc() {
  const [len, setLen] = useState(4200);
  const [paperIn, setPaperIn] = useState(0.1);
  const [cell, setCell] = useState(600);
  const [scale, setScale] = useState(50);
  const n = G.sheetsForRun(len);
  const even = G.evenCellFt(len);
  const clip = G.clipExtents(cell);
  const model = G.modelTextHeightFt(paperIn);
  const symbolScale = useMemo(() => +(scale / G.FT_PER_INCH).toFixed(3), [scale]);
  return (
    <div className="grid cols-2">
      <Card title="Sheets for a straight run" subtitle="Guide 4.3: run length ÷ 685, rounded up; even=True makes equal cells.">
        <label className="field"><span>Run length (ft)</span><input type="number" value={len} onChange={(e) => setLen(Number(e.target.value))} /></label>
        <p style={{ marginTop: 10 }}><strong>{n}</strong> sheets · even cells of <strong>{even.toFixed(1)} ft</strong> · ground per sheet {G.SHEET_MAX_ALONG_FT} × {G.SHEET_MAX_ACROSS_FT} ft</p>
      </Card>
      <Card title="Clip rectangle for a short cell" subtitle="ClipX0/X1 for a cell centred in the viewport (a 685 ft cell is 0.50 to 14.20 — no clip needed).">
        <label className="field"><span>CellFt</span><input type="number" value={cell} max={685} onChange={(e) => setCell(Number(e.target.value))} /></label>
        <p style={{ marginTop: 10 }}>RECTANG <code>{clip.x0.toFixed(2)},2.10</code> → <code>{clip.x1.toFixed(2)},10.50</code> (width {(Math.min(cell, 685) * G.ZOOM_XP).toFixed(2)}")</p>
      </Card>
      <Card title="Text height" subtitle='Model-space height = plotted inches × 50. Below 0.07" becomes unreadable at letter size.'>
        <label className="field"><span>Plotted height (in)</span><input type="number" step={0.01} value={paperIn} onChange={(e) => setPaperIn(Number(e.target.value))} /></label>
        <p style={{ marginTop: 10 }}>Model-space text height <strong>{model} ft</strong> · paper-space text height <strong>{paperIn}"</strong>{paperIn < 0.07 ? <Badge kind="bad">too small</Badge> : null}</p>
      </Card>
      <Card title="Symbol insert scale at another plot scale" subtitle="Appendix B: scale = target feet-per-inch ÷ 50.">
        <label className="field"><span>Plot scale (feet per inch)</span><input type="number" value={scale} onChange={(e) => setScale(Number(e.target.value))} /></label>
        <p style={{ marginTop: 10 }}>INSERT scale <strong>{symbolScale}</strong> · ZOOM <strong>{(1 / scale).toFixed(4)}XP</strong> · ground per sheet {(13.7 * scale).toFixed(0)} × {(8.4 * scale).toFixed(0)} ft</p>
        <p className="muted" style={{ fontSize: 12 }}>The standard set is 1" = 50' only — this is for a one-off detail or exhibit.</p>
      </Card>
    </div>
  );
}
