/** Sync status for offline banner (portable). */
export type SyncStatus = 'online' | 'offline' | 'syncing' | 'queued';

let syncStatus: SyncStatus = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'online';
const listeners = new Set<(s: SyncStatus) => void>();

export function getSyncStatus(): SyncStatus {
  return syncStatus;
}

export function setSyncStatus(next: SyncStatus): void {
  if (syncStatus === next) return;
  syncStatus = next;
  listeners.forEach((fn) => fn(next));
}

export function subscribeSyncStatus(fn: (s: SyncStatus) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => setSyncStatus('online'));
  window.addEventListener('offline', () => setSyncStatus('offline'));
}
