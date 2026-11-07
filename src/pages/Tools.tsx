import { useState } from 'react';
import { Link } from 'react-router-dom';
import { setScratch, updateSettings, useAppData } from '@/store/store';
import { useAuth } from '@/lib/auth';
import { BRICSCAD_SETUP } from '@/data/guide';
import { Badge, Callout, Card, ExtLink, Field, Tabs, useLocalTab } from '@/components/ui';
import { fmtDateTime } from '@/lib/ids';

type Tab = 'overview' | 'drive' | 'gusto' | 'bricscad' | 'arcgis' | 'agencies';

const SETUP_KEYS = {
  bricscad: ['bc-license', 'bc-support-path', 'bc-startup', 'bc-check', 'bc-pagesetup', 'bc-scalelist'],
  arcgis: ['ag-license', 'ag-python', 'ag-scripts', 'ag-seed', 'ag-crs', 'ag-imagery'],
};

const BRICS_STEPS: { id: string; label: string; hint?: string }[] = [
  { id: 'bc-license', label: 'BricsCAD V24+ licence active (Bricsys account, Pro or higher for LISP/xref workflow)', hint: 'Subscription is on the way per Senawave — confirm the edition includes LISP (Pro/Mechanical/BIM/Ultimate).' },
  { id: 'bc-support-path', label: BRICSCAD_SETUP[0].title + ' — ' + BRICSCAD_SETUP[0].body },
  { id: 'bc-startup', label: BRICSCAD_SETUP[1].title + ' — ' + BRICSCAD_SETUP[1].body },
  { id: 'bc-check', label: BRICSCAD_SETUP[2].title + ' — ' + BRICSCAD_SETUP[2].body },
  { id: 'bc-pagesetup', label: 'Named page setup SENAWAVE-11X17 saved from a good layout (Print As PDF, 17 × 11 in, margins ≤ .05) — guide 2.2' },
  { id: 'bc-scalelist', label: 'Scale list has 1" = 50\' (SCALELISTEDIT → Add → paper 1, drawing 50) and the Model tab annotation scale is set to it — guide 2.2' },
];

const ARC_STEPS: { id: string; label: string; hint?: string }[] = [
  { id: 'ag-license', label: 'ArcGIS Pro 3.x licensed (ArcGIS Basic is enough for everything in the guide — 4.1)' },
  { id: 'ag-python', label: 'Python window works: View → Python window → Load Code… loads a script and prints "SENAWAVE-SheetIndex loaded"' },
  { id: 'ag-scripts', label: 'Templates\\ArcGIS folder reachable from the Google Drive mount (SENAWAVE-SheetIndex.py, SENAWAVE-SheetImagery.py, SENAWAVE-KeyMapBasemap.py)' },
  { id: 'ag-seed', label: 'Export To CAD always uses Templates\\ArcGIS\\SENAWAVE-ARCGIS-SEED.dwg (a .dxf seed forces DXF; an inch seed gives 5040 ft polygons)' },
  { id: 'ag-crs', label: 'Every map/layer in the project CRS (EPSG 3566 / 3560 / 6625…) — never Web Mercator; route Merged then Dissolved with "unsplit lines"' },
  { id: 'ag-imagery', label: 'An imagery-only map exists in the drawing CRS for SENAWAVE-SheetImagery.py (Esri World Imagery is fine)' },
];

export default function Tools() {
  const [tab, setTab] = useLocalTab<Tab>('tools', 'overview');
  return (
    <>
      <Tabs<Tab>
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Quick links' },
          { id: 'drive', label: 'Google Drive' },
          { id: 'gusto', label: 'Gusto' },
          { id: 'bricscad', label: 'BricsCAD' },
          { id: 'arcgis', label: 'ArcGIS Pro' },
          { id: 'agencies', label: 'Agencies & permits' },
        ]}
      />
      {tab === 'overview' && <QuickLinks />}
      {tab === 'drive' && <Drive />}
      {tab === 'gusto' && <Gusto />}
      {tab === 'bricscad' && <SetupChecklist title="BricsCAD setup — once per computer" steps={BRICS_STEPS} keys={SETUP_KEYS.bricscad} scratchKey="bricscad" intro="From guide 1.2 and 2.2. Tick these on each machine you draw on; the Templates\\Support folder lives in Google Drive so the path differs per mount." />}
      {tab === 'arcgis' && <SetupChecklist title="ArcGIS Pro setup" steps={ARC_STEPS} keys={SETUP_KEYS.arcgis} scratchKey="arcgis" intro="From guide 4 and 5.3. The three scripts define commands when loaded; nothing inside them points at a particular project." />}
      {tab === 'agencies' && <Agencies />}
    </>
  );
}

function QuickLinks() {
  const data = useAppData();
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const links = data.settings.quickLinks;
  const add = () => {
    if (!label.trim() || !url.trim()) return;
    updateSettings({ quickLinks: [...links, { label: label.trim(), url: url.trim() }] });
    setLabel('');
    setUrl('');
  };
  const remove = (i: number) => updateSettings({ quickLinks: links.filter((_, k) => k !== i) });
  const color = (l: string) => (/drive/i.test(l) ? '#1a73e8' : /gusto/i.test(l) ? '#f45d48' : /brics/i.test(l) ? '#1f4e79' : /arcgis/i.test(l) ? '#2c7ac9' : /udot/i.test(l) ? '#b7791f' : /blue stakes|811/i.test(l) ? '#1f5fbf' : '#475569');
  return (
    <div className="grid cols-2">
      <Card title="Quick links" subtitle="The tools the work runs on. Edit the list below; it syncs with the rest of your data.">
        <div className="link-list">
          {links.map((l, i) => (
            <a key={l.url + i} href={l.url} target="_blank" rel="noopener noreferrer">
              <span className="ico" style={{ background: color(l.label) }}>{l.label.slice(0, 2).toUpperCase()}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                {l.label}
                <small style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.url}</small>
              </span>
              <button className="btn sm ghost" onClick={(e) => { e.preventDefault(); remove(i); }} title="Remove">×</button>
            </a>
          ))}
        </div>
        <div className="form-grid" style={{ marginTop: 10 }}>
          <Field label="Label"><input value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
          <Field label="URL"><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></Field>
        </div>
        <button className="btn sm" style={{ marginTop: 8 }} onClick={add} disabled={!label.trim() || !url.trim()}>+ Add link</button>
      </Card>
      <div>
        <Card title="How the stack fits together">
          <ul>
            <li><strong>Google Drive</strong> — holds CAD\Templates (the standard) and every project folder; this tracker can sync its JSON file there too.</li>
            <li><strong>ArcGIS Pro</strong> — route, sheet index, utility data, imagery; exports DWG via the seed file.</li>
            <li><strong>BricsCAD</strong> — the drawing: xrefs, layouts, side panels, titleblocks, PDF plot.</li>
            <li><strong>Gusto</strong> — how Senawave pays contractors; your Time log exports the hours for the invoice.</li>
            <li><strong>This tracker</strong> — projects, sheet tracker, workflow/QC, permits, notes, team, guide reference.</li>
          </ul>
        </Card>
        <Card title="Status" className="tight">
          <div className="stack">
            <ToolStatus name="Google Drive sync" ok={!!data.settings.driveFileId} okText="sync file linked" badText="not linked — Settings" to="/settings" />
            <ToolStatus name="BricsCAD setup" ok={SETUP_KEYS.bricscad.every((k) => data.scratch[`setup:${k}`]?.body === '1')} okText="checklist complete" badText={`${SETUP_KEYS.bricscad.filter((k) => data.scratch[`setup:${k}`]?.body === '1').length}/${SETUP_KEYS.bricscad.length} steps`} />
            <ToolStatus name="ArcGIS Pro setup" ok={SETUP_KEYS.arcgis.every((k) => data.scratch[`setup:${k}`]?.body === '1')} okText="checklist complete" badText={`${SETUP_KEYS.arcgis.filter((k) => data.scratch[`setup:${k}`]?.body === '1').length}/${SETUP_KEYS.arcgis.length} steps`} />
          </div>
        </Card>
      </div>
    </div>
  );
}

function ToolStatus({ name, ok, okText, badText, to }: { name: string; ok: boolean; okText: string; badText: string; to?: string }) {
  return (
    <div className="row between">
      <span>{name}</span>
      {ok ? <Badge kind="ok">{okText}</Badge> : to ? <Link to={to}><Badge kind="warn">{badText}</Badge></Link> : <Badge kind="warn">{badText}</Badge>}
    </div>
  );
}

function Drive() {
  const data = useAppData();
  const { user, googleConfigured } = useAuth();
  return (
    <>
      <Card title="Google Drive">
        <p>Senawave's CAD standard lives in Google Drive (<code>My Drive\CAD\Templates</code>, mounted as <code>C:\Users\&lt;you&gt;\My Drive</code> or <code>G:\My Drive</code>). Project folders sit beside it. This tracker can keep its own data file there as well so it follows you between machines and can be shared with David and Jesse.</p>
        <div className="stack">
          <div className="row between"><span>Signed in with Google</span>{user?.mode === 'google' ? <Badge kind="ok">{user.email}</Badge> : <Badge kind="warn">offline mode</Badge>}</div>
          <div className="row between"><span>Google client id configured</span>{googleConfigured ? <Badge kind="ok">yes</Badge> : <Badge kind="warn">no — see README</Badge>}</div>
          <div className="row between"><span>Sync file</span>{data.settings.driveFileId ? <Badge kind="ok" mono>{data.settings.driveFileId.slice(0, 12)}…</Badge> : <Badge>not created yet</Badge>}</div>
          <div className="row between"><span>Scope</span><Badge mono>{data.settings.driveScope}</Badge></div>
        </div>
        <p style={{ marginTop: 12 }}><Link className="btn sm" to="/settings">Drive sync settings</Link></p>
      </Card>
      <Card title="Drive layout the guide expects">
        <pre>{`My Drive\\CAD\\
  Templates\\                 the standard (guide, .dwt, Support\\, ArcGIS\\, Archive\\)
  Projects\\<Project>\\        one folder per plan set (see a project's Overview tab)
  Senawave Tracker\\          this tool's senawave-tracker.json (created on first sync)`}</pre>
        <p className="muted" style={{ fontSize: 12.5 }}>Folder paths are never hard-coded in the procedure — the scripts find their files on the BricsCAD support path. If you move the folder, only that path needs updating (guide 14).</p>
      </Card>
    </>
  );
}

function Gusto() {
  const data = useAppData();
  const body = data.scratch['gusto']?.body || '';
  return (
    <>
      <Card title="Gusto — contractor pay">
        <p>Senawave runs payroll and contractor payments through Gusto. As a 1099 contractor you are paid per invoice or per the hourly/per-project arrangement, entered by Senawave's admin in Gusto; you receive the contractor invite, complete the W-9 and bank details in your Gusto contractor account, and get paid by direct deposit.</p>
        <ul>
          <li>Log hours per project in the <Link to="/time">Time log</Link>; export the month as CSV and attach it to (or paste it into) the invoice.</li>
          <li>Set your rate in <Link to="/settings">Settings</Link> so the log shows the open invoice amount.</li>
          <li>Keep the invoice number and date in the note below once sent, and mark those hours invoiced.</li>
        </ul>
        <div className="row">
          <ExtLink href="https://app.gusto.com/"><span className="btn sm">Open Gusto ↗</span></ExtLink>
          <ExtLink href="https://support.gusto.com/"><span className="btn sm ghost">Gusto help ↗</span></ExtLink>
        </div>
      </Card>
      <Card title="Invoicing notes" subtitle="Free text — invoice numbers, rate agreed, who approves, payment terms.">
        <textarea value={body} onChange={(e) => setScratch('gusto', e.target.value)} placeholder="e.g. Rate agreed with David: $__/h. Invoice monthly by the 5th. Approver: …" style={{ minHeight: 140 }} />
        {data.scratch['gusto'] && <small>Saved {fmtDateTime(data.scratch['gusto'].updatedAt)}</small>}
      </Card>
    </>
  );
}

function SetupChecklist({ title, steps, keys, scratchKey, intro }: { title: string; steps: { id: string; label: string; hint?: string }[]; keys: string[]; scratchKey: string; intro: string }) {
  const data = useAppData();
  const done = keys.filter((k) => data.scratch[`setup:${k}`]?.body === '1').length;
  const notes = data.scratch[scratchKey]?.body || '';
  return (
    <>
      <Card title={title} subtitle={intro} actions={<Badge kind={done === keys.length ? 'ok' : 'warn'}>{done}/{keys.length}</Badge>}>
        <ul className="check-list">
          {steps.map((s) => {
            const on = data.scratch[`setup:${s.id}`]?.body === '1';
            return (
              <li key={s.id} className={on ? 'done' : ''}>
                <input id={s.id} type="checkbox" checked={on} onChange={(e) => setScratch(`setup:${s.id}`, e.target.checked ? '1' : '0')} />
                <label htmlFor={s.id}>{s.label}{s.hint && <div className="faint" style={{ fontSize: 12 }}>{s.hint}</div>}</label>
              </li>
            );
          })}
        </ul>
        {scratchKey === 'bricscad' && <Callout kind="warn" ><p>Never work inside the template. NEW → SENAWAVE-11x17-TEMPLATE.dwt → SAVEAS into the project folder. Open the .dwt itself only to change the standard (guide 14), after copying the previous one to Archive.</p></Callout>}
      </Card>
      <Card title="Notes" subtitle="Licence keys go in your password manager, not here. Machine names, support-path strings, gotchas are fine.">
        <textarea value={notes} onChange={(e) => setScratch(scratchKey, e.target.value)} style={{ minHeight: 120 }} />
      </Card>
    </>
  );
}

function Agencies() {
  const data = useAppData();
  const body = data.scratch['agencies']?.body || '';
  return (
    <>
      <Card title="Agencies you will permit with" subtitle="From the job posting and Senawave's franchise agreements. Franchise ≠ permit — each set still needs its excavation / encroachment permit.">
        <div className="tbl-wrap">
          <table className="tbl compact">
            <thead><tr><th>Agency</th><th>What</th><th>Link</th></tr></thead>
            <tbody>
              <tr><td><strong>UDOT</strong></td><td>Encroachment permits for work in state highway ROW (crossings, longitudinal installs). Region 1 covers Box Elder, Cache, Rich, Weber, Davis, Morgan.</td><td><ExtLink href="https://www.udot.utah.gov/connect/business/permits/">UDOT permits ↗</ExtLink></td></tr>
              <tr><td><strong>Municipalities</strong></td><td>ROW excavation permits under the city franchise (Brigham City, Tremonton, Willard, South Ogden, Cottonwood Heights, Riverton…). Traffic control plans usually required.</td><td>—</td></tr>
              <tr><td><strong>Counties</strong></td><td>Unincorporated ROW — Box Elder County Ord. 643 franchise (Jan 2026); county road excavation permits.</td><td>—</td></tr>
              <tr><td><strong>Blue Stakes of Utah (811)</strong></td><td>Design locate requests and existing-utility conflict resolution; buried power vs fiber trench separation is the recurring conflict.</td><td><ExtLink href="https://www.bluestakes.org/">bluestakes.org ↗</ExtLink></td></tr>
              <tr><td><strong>Railroads</strong></td><td>UPRR / UTA crossings need their own permit and bore profile; long lead time.</td><td>—</td></tr>
              <tr><td><strong>Utah Broadband Center</strong></td><td>BEAD subgrant requirements (locations, documentation) for BEAD-funded routes.</td><td><ExtLink href="https://connecting.utah.gov/">connecting.utah.gov ↗</ExtLink></td></tr>
              <tr><td><strong>Utah DOPL</strong></td><td>Verify the Engineer of Record's PE licence before the first seal.</td><td><ExtLink href="https://secure.utah.gov/llv/search/index.html">licence lookup ↗</ExtLink></td></tr>
            </tbody>
          </table>
        </div>
      </Card>
      <Card title="Agency contacts & submittal notes" subtitle="Who to send to, portal logins (no passwords), typical turnaround, what each reviewer asks for.">
        <textarea value={body} onChange={(e) => setScratch('agencies', e.target.value)} style={{ minHeight: 140 }} />
      </Card>
    </>
  );
}
