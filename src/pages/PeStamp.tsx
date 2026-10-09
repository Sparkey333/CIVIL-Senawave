import { useState } from 'react';
import { SEAL_SPECS, SEALING_STEPS, type SealSpec } from '@/data/peStamp';
import { updateSettings, useAppData } from '@/store/store';
import { Card, Callout } from '@/components/ui';
import { toast } from '@/components/Toast';

/** Your own seal image per state lives in this browser only: never synced, exported or shared. */
const IMAGE_KEY = (state: string) => `senawave.peSealImage.${state}`;
const MAX_BYTES = 1.5 * 1024 * 1024;

function readImage(state: string): string | null {
  try {
    return localStorage.getItem(IMAGE_KEY(state));
  } catch {
    return null;
  }
}

export default function PeStamp() {
  const [state, setState] = useState<SealSpec['state']>('UT');
  const spec = SEAL_SPECS.find((s) => s.state === state)!;
  return (
    <>
      <div className="tabs" role="tablist">
        {SEAL_SPECS.map((s) => (
          <button key={s.state} role="tab" aria-selected={s.state === state} className={s.state === state ? 'active' : ''} onClick={() => setState(s.state)}>
            {s.name}{s.state === 'UT' ? ' (Senawave work)' : ''}
          </button>
        ))}
      </div>
      <Licenses />
      <div className="grid cols-2 pe-grid">
        <Card title={`${spec.name} PE seal requirements`} subtitle={spec.summary}>
          <dl className="pe-dl">
            <dt>Shape</dt><dd>{spec.shape}</dd>
            <dt>Size</dt><dd>{spec.size}</dd>
            <dt>Must show</dt><dd><ul>{spec.wording.map((w) => <li key={w}>{w}</li>)}</ul></dd>
            <dt>Signature and date</dt><dd><ul>{spec.signing.map((w) => <li key={w}>{w}</li>)}</ul></dd>
            <dt>Where it goes</dt><dd><ul>{spec.where.map((w) => <li key={w}>{w}</li>)}</ul></dd>
            <dt>Electronic seals</dt><dd><ul>{spec.electronic.map((w) => <li key={w}>{w}</li>)}</ul></dd>
            <dt>Also</dt><dd><ul>{spec.other.map((w) => <li key={w}>{w}</li>)}</ul></dd>
            <dt>Renewal</dt><dd>{spec.renewal}</dd>
          </dl>
        </Card>
        <div className="stack">
          <Card title="Layout reference" subtitle="Drawn to the rule's proportions with placeholder text. Not a seal: order your real seal from a vendor below.">
            <SealLayout spec={spec} />
          </Card>
          <MySealImage spec={spec} />
        </div>
      </div>
      <div className="grid cols-2 pe-grid">
        <Card title="Rule sources" subtitle="Check the official text before a submittal; mirrors can lag the current rule.">
          <ul className="pe-links">
            {spec.sources.map((s) => (
              <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>{s.note && <span className="muted"> · {s.note}</span>}</li>
            ))}
          </ul>
        </Card>
        <Card title="Where to get the stamp and digital seal" subtitle="Vendors build the seal to the state rule and send a proof to check.">
          <ul className="pe-links">
            {spec.vendors.map((v) => (
              <li key={v.url + v.label}><a href={v.url} target="_blank" rel="noopener noreferrer">{v.label}</a><div className="muted">{v.note}</div></li>
            ))}
          </ul>
        </Card>
      </div>
      <Card title="Sealing a PDF plan set" subtitle="The order that keeps the set compliant and the seal secure.">
        <ol className="pe-steps">{SEALING_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
      </Card>
    </>
  );
}

function Licenses() {
  const { settings } = useAppData();
  const list = settings.peLicenses ?? [];
  const set = (i: number, patch: Partial<(typeof list)[number]>) => updateSettings({ peLicenses: list.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  return (
    <Card title="Your licenses" subtitle="From your résumé. The state lookup is the source of truth: check the number and status there before you seal. Kept with your private settings.">
      <div className="tbl-wrap">
        <table className="tbl compact">
          <thead><tr><th>State</th><th>License number</th><th>Expires</th><th>Look it up</th></tr></thead>
          <tbody>
            {list.map((l, i) => {
              const spec = SEAL_SPECS.find((s) => s.state === l.state);
              const days = l.expires ? Math.round((new Date(l.expires + 'T00:00:00').getTime() - Date.now()) / 86_400_000) : null;
              return (
                <tr key={l.state}>
                  <td className="nowrap"><b>{spec?.name ?? l.state}</b></td>
                  <td><input value={l.number} onChange={(e) => set(i, { number: e.target.value.trim() })} aria-label={`${l.state} license number`} style={{ fontFamily: 'var(--mono)' }} /></td>
                  <td className="nowrap">
                    <input type="date" value={l.expires} onChange={(e) => set(i, { expires: e.target.value })} aria-label={`${l.state} expiry`} />
                    {days !== null && days < 120 && <span className="badge warn" style={{ marginLeft: 6 }}>{days < 0 ? 'expired' : `${days} days`}</span>}
                  </td>
                  <td>
                    {spec && <a className="btn sm" href={spec.lookup.url} target="_blank" rel="noopener noreferrer">{spec.lookup.label}</a>}
                    {spec && <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{spec.lookup.how}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/** A schematic of the seal layout from the rule's dimensions. Placeholder text only. */
function SealLayout({ spec }: { spec: SealSpec }) {
  const ut = spec.state === 'UT';
  // 100 units = 1 inch. Utah: 1.5" min (drawn at 1.75" common size); Colorado: 1-5/8" outer, 15/16" inner.
  const outer = ut ? 87.5 : 81.25;
  const ring = ut ? outer * 0.74 : 46.9;
  const textR = (outer + ring) / 2;
  const id = `arc-${spec.state}`;
  return (
    <figure className="pe-layout">
      <svg viewBox="-110 -110 220 245" role="img" aria-label={`${spec.name} seal layout reference`}>
        <defs>
          <path id={`${id}-top`} d={`M ${-textR},0 A ${textR},${textR} 0 0 1 ${textR},0`} />
          <path id={`${id}-bot`} d={`M ${-textR},0 A ${textR},${textR} 0 0 0 ${textR},0`} />
        </defs>
        <circle r={outer} className="pe-ring" />
        <circle r={outer - 4} className="pe-ring thin" />
        <circle r={ring} className="pe-ring thin" />
        <text className="pe-arc"><textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">{spec.arcs.top}</textPath></text>
        <text className="pe-arc" dy="7"><textPath href={`#${id}-bot`} startOffset="50%" textAnchor="middle">{spec.arcs.bottom}</textPath></text>
        {ut ? (
          <>
            <text className="pe-centre" y="-8">LICENSEE NAME</text>
            <text className="pe-centre small" y="10">No. 0000000-2202</text>
          </>
        ) : (
          <>
            <text className="pe-centre small" y={-ring - 4}>LICENSEE NAME</text>
            <text className="pe-centre" y="5">0000000</text>
          </>
        )}
        <text className="pe-sample" y={ut ? 40 : 34}>SAMPLE</text>
        <line x1={-outer} x2={outer} y1={outer + 14} y2={outer + 14} className="pe-dim" />
        <text className="pe-dimtext" y={outer + 24}>{ut ? '1-1/2" min (1-3/4" typical)' : '1-5/8" outer · 15/16" inner'}</text>
      </svg>
      <figcaption className="muted">Sign and date {ut ? 'across the face of' : 'through'} the seal.</figcaption>
    </figure>
  );
}

function MySealImage({ spec }: { spec: SealSpec }) {
  const [img, setImg] = useState<string | null>(() => readImage(spec.state));
  const [forState, setForState] = useState(spec.state);
  if (forState !== spec.state) {
    setForState(spec.state);
    setImg(readImage(spec.state));
  }
  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|svg\+xml)$/.test(file.type)) return toast('Use a PNG, JPG, WebP or SVG image.', 'bad');
    if (file.size > MAX_BYTES) return toast('That image is over 1.5 MB. Export a smaller PNG (600 dpi at 1-3/4" is about 1050 px).', 'bad');
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      try {
        localStorage.setItem(IMAGE_KEY(spec.state), url);
        setImg(url);
        toast(`${spec.name} seal image saved in this browser only.`);
      } catch {
        toast('This browser would not store the image (private window or storage full).', 'bad');
      }
    };
    reader.readAsDataURL(file);
  };
  const remove = () => {
    try { localStorage.removeItem(IMAGE_KEY(spec.state)); } catch { /* ignore */ }
    setImg(null);
  };
  return (
    <Card title={`Your ${spec.name} seal image`} subtitle="Stored in this browser only. Never synced, backed up, exported or shared with Jesse.">
      {img ? (
        <div className="pe-mine">
          <img src={img} alt={`Your ${spec.name} PE seal`} />
          <div className="row">
            <a className="btn sm" href={img} download={`PE-seal-${spec.state}.png`}>Download</a>
            <button className="btn sm danger" onClick={remove}>Remove from this browser</button>
          </div>
        </div>
      ) : (
        <Callout kind="info">
          <p>Add the seal image your stamp vendor sends (or a scan of your wet stamp) to keep it with the rules. Check it against the requirements on the left before you use it.</p>
        </Callout>
      )}
      <label className="btn sm" style={{ marginTop: 8 }}>
        {img ? 'Replace image' : 'Add seal image'}
        <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
    </Card>
  );
}
