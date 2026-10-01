import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { syncWithDrive } from '@/lib/sync';
import { getState, useAppData } from '@/store/store';
import { toast } from './Toast';

export function SyncButton() {
  const { user, getToken, googleConfigured } = useAuth();
  const data = useAppData();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const lastPushedAt = useRef<string>(data.updatedAt);

  const run = async (quiet = false) => {
    if (!user || user.mode !== 'google') return;
    setBusy(true);
    try {
      const r = await syncWithDrive(getToken);
      lastPushedAt.current = getState().updatedAt;
      setLast(new Date().toLocaleTimeString());
      if (!quiet) toast(r.pulled ? (r.retries ? `Synced with Google Drive (merged ${r.retries} concurrent edit${r.retries > 1 ? 's' : ''}).` : 'Synced with Google Drive.') : 'Created the sync file in Google Drive.');
    } catch (err) {
      toast(`Drive sync failed: ${(err as Error).message}`, 'bad');
    } finally {
      setBusy(false);
    }
  };

  // Debounced auto-sync when enabled: push 20 s after the last edit.
  useEffect(() => {
    if (!data.settings.autoSync || user?.mode !== 'google') return;
    if (data.updatedAt === lastPushedAt.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void run(true), 20_000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.updatedAt, data.settings.autoSync, user?.mode]);

  if (!user) return null;
  if (user.mode !== 'google') {
    return (
      <Link to="/settings" className="btn sm" title={googleConfigured ? 'Sign in with Google to sync' : 'Add a Google client id to enable Drive sync'}>
        ● Local only
      </Link>
    );
  }
  return (
    <button className="btn sm" onClick={() => void run()} disabled={busy} title="Pull + merge + push senawave-tracker.json in Google Drive">
      {busy ? '⟳ Syncing…' : `⟳ Sync Drive${last ? ` · ${last}` : ''}`}
    </button>
  );
}
