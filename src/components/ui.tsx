import { useState, type ReactNode } from 'react';

export function Card({ title, children, actions, className = '', subtitle }: { title?: ReactNode; subtitle?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={`card ${className}`}>
      {(title || actions) && (
        <div className="card-head">
          <div>
            {title && <h2>{title}</h2>}
            {subtitle && <div className="muted" style={{ fontSize: 12.5 }}>{subtitle}</div>}
          </div>
          <div className="spacer" />
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ kind = '', children, mono = false, title }: { kind?: '' | 'ok' | 'warn' | 'bad' | 'info' | 'accent'; children: ReactNode; mono?: boolean; title?: string }) {
  return (
    <span className={`badge ${kind} ${mono ? 'mono' : ''}`} title={title}>
      {children}
    </span>
  );
}

export function Field({ label, children, required, hint, className = '' }: { label: string; children: ReactNode; required?: boolean; hint?: string; className?: string }) {
  return (
    <label className={`field ${className}`}>
      <span className={required ? 'req' : ''}>{label}</span>
      {children}
      {hint && <small style={{ fontWeight: 400 }}>{hint}</small>}
    </label>
  );
}

export function Tabs<T extends string>({ tabs, active, onChange }: { tabs: { id: T; label: string; count?: number }[]; active: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={active === t.id} className={active === t.id ? 'active' : ''} onClick={() => onChange(t.id)}>
          {t.label}
          {t.count !== undefined && <span className="count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Progress({ value, total, ok }: { value: number; total: number; ok?: boolean }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100);
  return (
    <div className="row" style={{ gap: 10 }}>
      <div className="progress" style={{ flex: 1 }} aria-label={`${value} of ${total}`}>
        <div className={ok || pct === 100 ? 'ok' : ''} style={{ width: `${pct}%`, background: pct === 100 ? 'var(--ok)' : undefined }} />
      </div>
      <span className="muted mono" style={{ fontSize: 12, minWidth: 54, textAlign: 'right' }}>
        {value}/{total}
      </span>
    </div>
  );
}

export function Stat({ value, label, hint }: { value: ReactNode; label: string; hint?: string }) {
  return (
    <div className="stat" title={hint}>
      <span className="v">{value}</span>
      <span className="l">{label}</span>
    </div>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

export function ConfirmButton({ label, confirmLabel = 'Confirm', onConfirm, className = 'btn danger sm' }: { label: string; confirmLabel?: string; onConfirm: () => void; className?: string }) {
  const [arm, setArm] = useState(false);
  if (!arm)
    return (
      <button className={className} onClick={() => setArm(true)}>
        {label}
      </button>
    );
  return (
    <span className="row" style={{ gap: 4 }}>
      <button className="btn danger sm" onClick={() => { onConfirm(); setArm(false); }}>
        {confirmLabel}
      </button>
      <button className="btn sm ghost" onClick={() => setArm(false)}>
        Cancel
      </button>
    </span>
  );
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: 'contents' }}>
          <dt>{k}</dt>
          <dd>{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Callout({ kind = '', children }: { kind?: '' | 'info' | 'warn' | 'ok' | 'bad'; children: ReactNode }) {
  return <div className={`callout ${kind}`}>{children}</div>;
}

export function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function VerifiedBadge({ level }: { level: 'verified' | 'partial' | 'unverified' }) {
  if (level === 'verified') return <Badge kind="ok" title="Confirmed by a primary or two independent sources">Verified</Badge>;
  if (level === 'partial') return <Badge kind="warn" title="From search snippets or a single secondary source — open the link to confirm">Partly verified</Badge>;
  return <Badge kind="bad" title="Not found in any public source">Unverified</Badge>;
}

export function Swatch({ rgb }: { rgb: string }) {
  if (!/^\d+,\d+,\d+$/.test(rgb)) return null;
  return <span className="swatch" style={{ background: `rgb(${rgb})` }} />;
}

export function useLocalTab<T extends string>(key: string, initial: T): [T, (t: T) => void] {
  const [tab, setTabState] = useState<T>(() => {
    try {
      return (localStorage.getItem(`senawave-tracker:tab:${key}`) as T) || initial;
    } catch {
      return initial;
    }
  });
  const setTab = (t: T) => {
    setTabState(t);
    try {
      localStorage.setItem(`senawave-tracker:tab:${key}`, t);
    } catch {
      /* ignore */
    }
  };
  return [tab, setTab];
}
