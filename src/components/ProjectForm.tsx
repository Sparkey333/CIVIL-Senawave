import type { Project } from '@/lib/types';
import { PROJECT_STATUSES } from '@/lib/types';
import { CRS_OPTIONS } from '@/data/guide';
import { useAppData } from '@/store/store';
import { Field } from './ui';

export function ProjectForm({ value, onChange }: { value: Project; onChange: (patch: Partial<Project>) => void }) {
  const data = useAppData();
  const people = data.team.map((t) => t.name).filter(Boolean);
  const set = <K extends keyof Project>(k: K, v: Project[K]) => onChange({ [k]: v } as Partial<Project>);
  return (
    <div className="form-grid">
      <Field label="Project number" required hint='Titleblock number, e.g. 26-0001 (the template placeholder is "26-0000")'>
        <input value={value.number} onChange={(e) => set('number', e.target.value)} placeholder="26-0001" />
      </Field>
      <Field label="Project name" required className="span-2">
        <input value={value.name} onChange={(e) => set('name', e.target.value)} placeholder="Corridor / route name as it appears on the titleblock" />
      </Field>
      <Field label="Status">
        <select value={value.status} onChange={(e) => set('status', e.target.value as Project['status'])}>
          {PROJECT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </Field>
      <Field label="Client">
        <input value={value.client} onChange={(e) => set('client', e.target.value)} />
      </Field>
      <Field label="Municipality">
        <input value={value.municipality} onChange={(e) => set('municipality', e.target.value)} placeholder="Brigham City, Tremonton, Logan…" />
      </Field>
      <Field label="County">
        <input value={value.county} onChange={(e) => set('county', e.target.value)} placeholder="Box Elder, Cache, Weber…" />
      </Field>
      <Field label="Funding">
        <select value={value.funding} onChange={(e) => set('funding', e.target.value as Project['funding'])}>
          <option value="">—</option>
          <option value="BEAD">BEAD</option>
          <option value="Private">Private</option>
          <option value="Municipal">Municipal</option>
          <option value="Other">Other</option>
        </select>
      </Field>
      <Field label="Project CRS" hint="Same one everywhere: route, exports, imagery, epsg= for the scripts. Never Web Mercator.">
        <select value={value.crs} onChange={(e) => set('crs', e.target.value)}>
          {CRS_OPTIONS.map((c) => (
            <option key={c.code} value={c.code}>{c.code} — {c.label}</option>
          ))}
          {!CRS_OPTIONS.some((c) => c.code === value.crs) && value.crs && <option value={value.crs}>{value.crs}</option>}
        </select>
      </Field>
      <Field label="Route length (ft)" hint="Dissolved route length; drives the sheet estimate">
        <input type="number" min={0} step={1} value={value.routeLengthFt ?? ''} onChange={(e) => set('routeLengthFt', e.target.value === '' ? null : Number(e.target.value))} />
      </Field>
      <Field label="Project manager (PM)">
        <input list="people" value={value.pm} onChange={(e) => set('pm', e.target.value)} />
      </Field>
      <Field label="Engineer of Record">
        <input list="people" value={value.engineer} onChange={(e) => set('engineer', e.target.value)} />
      </Field>
      <Field label="Designer">
        <input list="people" value={value.designer} onChange={(e) => set('designer', e.target.value)} />
      </Field>
      <Field label="Design date">
        <input type="date" value={value.designDate} onChange={(e) => set('designDate', e.target.value)} />
      </Field>
      <Field label="Field date">
        <input type="date" value={value.fieldDate} onChange={(e) => set('fieldDate', e.target.value)} />
      </Field>
      <Field label="Due date">
        <input type="date" value={value.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
      </Field>
      <Field label="Drawing path" className="span-2" hint="<Project>\<Project>.dwg — one drawing: model space + every layout">
        <input value={value.drawingPath} onChange={(e) => set('drawingPath', e.target.value)} placeholder="G:\My Drive\CAD\Projects\26-0001\26-0001.dwg" className="mono" />
      </Field>
      <Field label="Google Drive folder link" className="span-2">
        <input value={value.driveFolderUrl} onChange={(e) => set('driveFolderUrl', e.target.value)} placeholder="https://drive.google.com/drive/folders/…" />
      </Field>
      <Field label="ArcGIS project / web map link" className="span-2">
        <input value={value.arcgisProjectUrl} onChange={(e) => set('arcgisProjectUrl', e.target.value)} placeholder="https://…arcgis.com/… or local .aprx path" />
      </Field>
      <Field label="Scope / description" className="span-all">
        <textarea value={value.description} onChange={(e) => set('description', e.target.value)} placeholder="Route description, construction method (trench / bore / plow), crossings, special agency requirements…" />
      </Field>
      <datalist id="people">
        {people.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
    </div>
  );
}
