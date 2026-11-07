import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { syncWithDrive } from '@/lib/sync';
import { getState, useAppData } from '@/store/store';
import { useCloudStatus, type CloudStatus } from '@/lib/cloud';
import { toast } from './Toast';

/** The shared tracker's state in a few words, for the top bar. */
export function cloudChip(c: CloudStatus): { text: string; title: string; cls: string } {
  switch (c.state) {
    case 'live':
      return c.pending > 0
        ? { text: `⟳ Saving ${c.pending}…`, title: 'Saving your changes to the shared tracker', cls: 'chip-busy' }
        : { text: '● Shared · saved', title: c.lastSavedAt ? `Everything is saved. Last save ${new Date(c.lastSavedAt).toLocaleTimeString()}.` : 'Everything is saved. Changes from the team appear live.', cls: 'chip-ok' };
    case 'connecting':
      return { text: '○ Connecting…', title: c.message || 'Connecting to the shared tracker', cls: 'chip-busy' };
    case 'empty':
      return { text: '○ Shared tracker empty', title: c.message, cls: 'chip-warn' };
    case 'readonly':
      return { text: '◐ View only', title: c.message, cls: 'chip-info' };
    case 'error':
      return { text: '⚠ Not saving', title: c.message, cls: 'chip-bad' };
    case 'stopped':
      return { text: '⚠ Not shared', title: c.message, cls: 'chip-bad' };
    default:
      return { text: '● Local only', title: 'Changes stay in this browser', cls: '' };
  }
}

export function SyncButton() {
  const { user, getToken, googleConfigured, canEdit, finishJoin } = useAuth();
  const data = useAppData();
  const cloud = useCloudStatus();
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const lastPushedAt = useRef<string>(data.updatedAt);

  const run = async (quiet = false) => {
    if (!user || user.mode !== 'google') return;
    setBusy(true);
    try {
      const r = await syncWithDrive(getToken, { pullOnly: !canEdit });
      finishJoin();
      lastPushedAt.current = getState().updatedAt;
      setLast(new Date().toLocaleTimeString());
      if (!quiet) toast(!r.pushed ? 'Updated from Google Drive (view only).' : r.pulled ? (r.retries ? `Synced with Google Drive (merged ${r.retries} concurrent edit${r.retries > 1 ? 's' : ''}).` : 'Synced with Google Drive.') : 'Created the sync file in Google Drive.');
    } catch (err) {
      toast(`Drive sync failed: ${(err as Error).message}`, 'bad');
    } finally {
      setBusy(false);
    }
  };

  // Debounced auto-sync when enabled: push 20 s after the last edit.
  useEffect(() => {
    if (!data.settings.autoSync || user?.mode !== 'google' || !canEdit) return;
    if (data.updatedAt === lastPushedAt.current) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void run(true), 20_000);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.updatedAt, data.settings.autoSync, user?.mode]);

  if (!user) return null;
  if (user.mode === 'claude') {
    const chip = cloudChip(cloud);
    return (
      <Link to="/connections" className={`btn sm status-chip ${chip.cls}`} title={chip.title}>
        {chip.text}
      </Link>
    );
  }
  if (user.mode !== 'google') {
    return (
      <Link to="/settings" className="btn sm" title={googleConfigured ? 'Sign in with Google to sync' : 'Add a Google client id to enable Drive sync'}>
        ● Local only
      </Link>
    );
  }
  return (
    <button className="btn sm" onClick={() => void run()} disabled={busy} title={canEdit ? 'Pull + merge + push senawave-tracker.json in Google Drive' : 'Pull the latest from Google Drive (view only)'}>
      {busy ? '⟳ Syncing…' : `⟳ ${canEdit ? 'Sync Drive' : 'Update from Drive'}${last ? ` · ${last}` : ''}`}
    </button>
  );
}
