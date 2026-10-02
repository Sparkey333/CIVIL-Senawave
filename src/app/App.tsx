import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { useAuth } from '@/lib/auth';
import { updateSettings, useAppData } from '@/store/store';
import { parseDriveId } from '@/lib/drive';
import { toast } from '@/components/Toast';
import { setProvisional } from '@/lib/provisional';
import SignIn from '@/pages/SignIn';
import Dashboard from '@/pages/Dashboard';
import Projects from '@/pages/Projects';
import ProjectDetail from '@/pages/ProjectDetail';
import Notes from '@/pages/Notes';
import Reference from '@/pages/Reference';
import Team from '@/pages/Team';
import Tools from '@/pages/Tools';
import Settings from '@/pages/Settings';
import TimeLog from '@/pages/TimeLog';
import Files from '@/pages/Files';
import Inbox from '@/pages/Inbox';
import Daily from '@/pages/Daily';
import Connections from '@/pages/Connections';

const JOIN_KEY = 'senawave-tracker:join';

export default function App() {
  const { user, claudeChecking } = useAuth();
  const data = useAppData();

  useEffect(() => {
    const t = data.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }, [data.settings.theme]);

  // An invite link (?join=<Drive file id>) points this device at the shared data file once the person has signed in.
  useEffect(() => {
    try {
      const join = new URLSearchParams(window.location.search).get('join');
      if (join) {
        sessionStorage.setItem(JOIN_KEY, parseDriveId(join));
        setProvisional();
        const url = new URL(window.location.href);
        url.searchParams.delete('join');
        window.history.replaceState(null, '', url.pathname + url.search + url.hash);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (user?.mode !== 'google') return;
    try {
      const id = sessionStorage.getItem(JOIN_KEY);
      if (!id) return;
      sessionStorage.removeItem(JOIN_KEY);
      // A file someone else owns can only be opened with the full Drive scope.
      updateSettings({ driveFileId: id, driveScope: 'drive' });
      toast('Linked to the shared tracker file. Press \"Update from Drive\" (top right) and allow Drive access when Google asks. Until then you have view-only access.');
    } catch {
      /* ignore */
    }
  }, [user]);

  if (claudeChecking) {
    return (
      <div className="signin">
        <div className="card" style={{ textAlign: 'center' }} role="status" aria-live="polite">
          <h1 style={{ margin: '0 0 6px' }}>Senawave Civil Tracker</h1>
          <p className="muted" style={{ margin: 0 }}>Opening the shared tracker through claude.ai…</p>
        </div>
      </div>
    );
  }

  if (!user) return <SignIn />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="daily" element={<Daily />} />
        <Route path="files" element={<Files />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="projects" element={<Projects />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
        <Route path="notes" element={<Notes />} />
        <Route path="time" element={<TimeLog />} />
        <Route path="reference" element={<Reference />} />
        <Route path="reference/:tab" element={<Reference />} />
        <Route path="team" element={<Team />} />
        <Route path="tools" element={<Tools />} />
        <Route path="connections" element={<Connections />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
