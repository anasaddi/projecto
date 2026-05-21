/** Client-side session flags (JWT lives in httpOnly cookie only). */

export function isAdminRole(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem('km-user-role') === 'admin';
}

export function isTrainingAllowed(): boolean {
  return localStorage.getItem('km-training-allowed') === '1';
}

export function clearAuthSessionFlags(): void {
  localStorage.removeItem('km-user-role');
  localStorage.removeItem('km-training-allowed');
  localStorage.removeItem('km-admin-token');
}

export function setAdminSession(training: boolean): void {
  localStorage.setItem('km-user-role', 'admin');
  if (training) localStorage.setItem('km-training-allowed', '1');
  else localStorage.removeItem('km-training-allowed');
  localStorage.removeItem('km-admin-token');
}
