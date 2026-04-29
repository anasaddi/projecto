/** Chi sei su questo dispositivo (per "in lavorazione" sui task condivisi con Othmane).
 * Auto-detects identity from admin role:
 *  - Admin (km-user-role='admin' + km-admin-token) → Anas
 *  - Guest/no-admin → Othmane
 */

const KEY = 'projecto:collab-identity';

export type CollabIdentity = 'anas' | 'othmane';

/** Detect identity from login state: admin = Anas, guest/non-admin = Othmane. */
function detectFromLoginState(): CollabIdentity {
  try {
    const role = localStorage.getItem('km-user-role');
    const hasAdminToken = !!localStorage.getItem('km-admin-token');
    // If logged in as admin → Anas
    if (role === 'admin' && hasAdminToken) return 'anas';
    // Otherwise (guest or no admin token) → Othmane
    return 'othmane';
  } catch {
    return 'anas'; // fallback
  }
}

export function getCollabIdentity(): CollabIdentity {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'othmane' || v === 'anas') return v;
    // Auto-detect from login state on first run
    const detected = detectFromLoginState();
    localStorage.setItem(KEY, detected);
    return detected;
  } catch {
    return 'anas';
  }
}

export function setCollabIdentity(id: CollabIdentity): void {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}

export function collabDisplayName(id: CollabIdentity): string {
  return id === 'anas' ? '' : 'Othmane';
}
