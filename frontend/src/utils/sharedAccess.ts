const SHARE_TOKEN_PREFIX = 'km-shared-token-';
const SHARE_SECTION_PREFIX = 'km-shared-section-';
const SHARE_EXPANDED_PREFIX = 'km-shared-expanded-';
const PASSWORD_SALT = 'km-shared:';

export async function hashSharedPassword(pw: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`${PASSWORD_SALT}${pw}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function getShareToken(shareId: string): string | null {
  if (!shareId) return null;
  try {
    return localStorage.getItem(`${SHARE_TOKEN_PREFIX}${shareId}`);
  } catch {
    return null;
  }
}

export function setShareToken(shareId: string, token: string): void {
  if (!shareId || !token) return;
  try {
    localStorage.setItem(`${SHARE_TOKEN_PREFIX}${shareId}`, token);
  } catch {
    /* ignore */
  }
}

export function clearShareToken(shareId: string): void {
  if (!shareId) return;
  try {
    localStorage.removeItem(`${SHARE_TOKEN_PREFIX}${shareId}`);
  } catch {
    /* ignore */
  }
}

export function getSectionUnlockHash(shareId: string, section: string): string | null {
  if (!shareId || !section) return null;
  try {
    return localStorage.getItem(`${SHARE_SECTION_PREFIX}${shareId}-${section}`);
  } catch {
    return null;
  }
}

export function setSectionUnlockHash(shareId: string, section: string, hash: string): void {
  if (!shareId || !section || !hash) return;
  try {
    localStorage.setItem(`${SHARE_SECTION_PREFIX}${shareId}-${section}`, hash);
  } catch {
    /* ignore */
  }
}

export function sharedFetchOpts(shareId: string): { silent: true; headers?: Record<string, string> } {
  const token = getShareToken(shareId);
  return {
    silent: true,
    ...(token ? { headers: { 'x-share-token': token } } : {}),
  };
}

export function isShareUnlocked(shareId: string, isAdmin = false): boolean {
  if (!shareId) return true;
  if (isAdmin) return true;
  return !!getShareToken(shareId);
}

export function isSectionUnlocked(shareId: string, section: string, passwordHash: string | null): boolean {
  if (!shareId || !section || !passwordHash) return true;
  return getSectionUnlockHash(shareId, section) === passwordHash;
}

export { SHARE_EXPANDED_PREFIX };
