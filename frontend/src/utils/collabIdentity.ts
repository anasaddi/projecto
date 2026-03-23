/** Chi sei su questo dispositivo (per "in lavorazione" sui task condivisi con Othmane). */
const KEY = 'projecto:collab-identity';

export type CollabIdentity = 'anas' | 'othmane';

export function getCollabIdentity(): CollabIdentity {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'othmane' ? 'othmane' : 'anas';
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
  return id === 'anas' ? 'Anas' : 'Othmane';
}
