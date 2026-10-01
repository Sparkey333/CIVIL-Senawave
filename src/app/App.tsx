import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { useAuth } from '@/lib/auth';
import { useAppData } from '@/store/store';
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

export default function App() {
  const { user } = useAuth();
  const data = useAppData();

  useEffect(() => {
    const t = data.settings.theme;
    if (t === 'system') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }, [data.settings.theme]);

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
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
