import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import App from './app/App';
import { AuthProvider } from './lib/auth';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles/global.css';

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
// VITE_HASH_ROUTER=1 builds for static hosts that cannot rewrite deep links (for example a published artifact).
const Router = import.meta.env.VITE_HASH_ROUTER ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router basename={import.meta.env.VITE_HASH_ROUTER ? undefined : base || undefined}>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </Router>
  </StrictMode>,
);
