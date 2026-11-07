import { useAppData } from '@/store/store';
import { useAuth } from './auth';
import { useCloudStatus } from './cloud';
import { connectorLabel, useConnectors } from './connectors';
import { loadSnapshot } from './driveFiles';
import { setupChecklist, type SetupItem } from './guidance';
import { emailKey } from './roles';
import { lastBackup, sharedWithTeam } from './backups';

/** The setup checklist for however this copy is running (claude.ai, Google, offline). */
export function useSetup(): SetupItem[] {
  const data = useAppData();
  const { user, claude, googleConfigured } = useAuth();
  const cloud = useCloudStatus();
  const conn = useConnectors();
  const mode = user?.mode ?? 'offline';
  const ready = (id: 'drive' | 'gmail' | 'calendar') => {
    const i = conn.info[id];
    return { ready: connectorLabel(i).ready, missing: i.auth === 'missing' };
  };
  return setupChecklist(data, {
    mode,
    isOwner: mode === 'claude' ? !!claude?.isOwner : !!user && emailKey(user.email) === emailKey(data.settings.ownerEmail || ''),
    cloud: { state: cloud.state, others: cloud.others, message: cloud.message },
    connectors: conn.available ? { drive: ready('drive'), gmail: ready('gmail'), calendar: ready('calendar') } : undefined,
    googleConfigured,
    driveSnapshot: loadSnapshot()?.source === 'live',
    backupAt: lastBackup()?.at ?? null,
    sharedWithTeam: sharedWithTeam(),
  });
}
