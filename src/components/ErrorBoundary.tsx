import { Component, type ErrorInfo, type ReactNode } from 'react';
import { exportJson } from '@/store/store';

interface State {
  error: Error | null;
}

/**
 * Last line of defence: a render crash must never take the data with it. Shows the error,
 * offers a JSON export of what is in the browser, and a reload.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Render error', error, info.componentStack);
  }

  download = () => {
    try {
      const blob = new Blob([exportJson()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `senawave-tracker-recovery-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      alert(`Could not export: ${(err as Error).message}`);
    }
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="signin">
        <div className="card">
          <h1>Something broke on this page</h1>
          <p className="muted">Your data is still saved in this browser. Export it now if you want a copy, then reload.</p>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{this.state.error.message}</pre>
          <div className="row">
            <button className="btn primary" onClick={this.download}>Export data (JSON)</button>
            <button className="btn" onClick={() => window.location.reload()}>Reload</button>
            <button className="btn ghost" onClick={() => { window.location.hash = ''; window.location.assign(window.location.pathname.replace(/\/[^/]*$/, '/') ); }}>Go to dashboard</button>
          </div>
        </div>
      </div>
    );
  }
}
