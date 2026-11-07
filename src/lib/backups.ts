// Small per-browser records that drive the setup checklist: the last backup, and whether the owner has invited the team.

const BACKUP_KEY = 'senawave-tracker:last-backup';
const SHARED_KEY = 'senawave-tracker:shared-with-team';

export interface BackupRecord {
  at: string;
  where: 'file' | 'drive';
  url?: string;
  name?: string;
}

export function lastBackup(): BackupRecord | null {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    return raw ? (JSON.parse(raw) as BackupRecord) : null;
  } catch {
    return null;
  }
}

export function recordBackup(r: Omit<BackupRecord, 'at'>) {
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({ ...r, at: new Date().toISOString() }));
  } catch {
    /* ignore */
  }
}

export function sharedWithTeam(): boolean {
  try {
    return localStorage.getItem(SHARED_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSharedWithTeam(v: boolean) {
  try {
    if (v) localStorage.setItem(SHARED_KEY, '1');
    else localStorage.removeItem(SHARED_KEY);
  } catch {
    /* ignore */
  }
}

/** Backup file name with the local date and time, e.g. senawave-tracker-2026-10-02-1704.json. */
export function backupFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `senawave-tracker-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.json`;
}
