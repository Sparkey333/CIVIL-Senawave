// A person who opens an invite link has not pulled the shared file yet, so this device does not know the real
// people list. Until their first successful pull they get view-only access; then the synced list decides.

const KEY = 'senawave-tracker:provisional';

export function isProvisional(): boolean {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function setProvisional() {
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* ignore */
  }
}

export function clearProvisional() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
