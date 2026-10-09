import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { roleLabel } from '@/lib/roles';
import { useAppData } from '@/store/store';
import { SyncButton } from '@/components/SyncButton';
import { ToastHost } from '@/components/Toast';

const NAV = [
  { to: '/', label: 'Dashboard', ico: '◫', end: true },
  { to: '/daily', label: 'Daily brief & log', ico: '☀' },
  { to: '/projects', label: 'Projects', ico: '▤' },
  { to: '/notes', label: 'Notes & log', ico: '✎' },
  { to: '/timecards', label: 'Timecards', ico: '▦' },
  { to: '/time', label: 'Time log', ico: '◷' },
  { to: '/files', label: 'Files (Drive)', ico: '▣' },
  { to: '/inbox', label: 'Senawave inbox', ico: '✉' },
];
const NAV2 = [
  { to: '/reference', label: 'Plan Production Guide', ico: '§' },
  { to: '/pe-stamp', label: 'PE stamp', ico: '◉' },
  { to: '/team', label: 'Team & company', ico: '⚇' },
  { to: '/tools', label: 'Tools & integrations', ico: '⚙' },
  { to: '/connections', label: 'Connections', ico: '⇄' },
  { to: '/settings', label: 'Settings', ico: '≡' },
];

const TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/notes': 'Notes & log',
  '/time': 'Time log',
  '/daily': 'Daily brief & evening log',
  '/files': 'Files — Senawave Design folder',
  '/inbox': 'Senawave inbox (read-only)',
  '/reference': 'Plan Production Guide — Rev 5',
  '/pe-stamp': 'PE stamp — Utah and Colorado seal rules',
  '/team': 'Team & company',
  '/tools': 'Tools & integrations',
  '/connections': 'Connections',
  '/settings': 'Settings',
};

export function Layout() {
  const { user, signOut, role, claude } = useAuth();
  const data = useAppData();
  const loc = useLocation();
  const openActions = data.notes.filter((n) => n.type === 'action' && !n.done).length;
  const activeProjects = data.projects.filter((p) => !['closed'].includes(p.status)).length;
  const title = TITLES[loc.pathname] || (loc.pathname.startsWith('/projects/') ? 'Project' : loc.pathname.startsWith('/reference') ? TITLES['/reference'] : 'Senawave Civil Tracker');

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 64 64">
              <path d="M10 40c8 0 8-16 16-16s8 16 16 16 8-16 16-16" fill="none" stroke="#ff6600" strokeWidth="6" strokeLinecap="round" />
              <rect x="26" y="44" width="12" height="9" rx="1.5" fill="#ff6600" />
            </svg>
          </div>
          <div>
            <div className="brand-title">SENAWAVE · Civil</div>
            <div className="brand-sub">Fiber plan production tracker</div>
          </div>
        </div>
        <nav className="nav">
          <div className="nav-section">Work</div>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>
              <span className="ico">{n.ico}</span>
              {n.label}
              {n.to === '/projects' && activeProjects > 0 && <span className="nav-badge">{activeProjects}</span>}
              {n.to === '/notes' && openActions > 0 && <span className="nav-badge">{openActions}</span>}
            </NavLink>
          ))}
          <div className="nav-section">Reference</div>
          {NAV2.map((n) => (
            <NavLink key={n.to} to={n.to}>
              <span className="ico">{n.ico}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user">
            <span className="avatar">{user?.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : initials(user?.name || '?')}</span>
            <span style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.mode === 'claude' ? `${roleLabel(role, 'claude')}${claude?.isOwner ? ' · owner' : ''} · claude.ai` : user?.mode === 'google' ? `${roleLabel(role)} · ${user.email}` : 'Offline mode'}
              </div>
            </span>
          </div>
          {user?.mode === 'claude' ? (
            <NavLink className="btn sm ghost" style={{ color: '#94a3b8' }} to="/connections">
              Connections
            </NavLink>
          ) : (
            <button className="btn sm ghost" style={{ color: '#94a3b8' }} onClick={signOut}>
              Sign out
            </button>
          )}
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <div className="spacer" />
          <SyncButton />
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
      <ToastHost />
    </div>
  );
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}
