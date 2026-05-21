/** Fire-and-forget ping to wake Render before heavy dashboard calls. */
export function warmBackend(): void {
  if (typeof window === 'undefined') return;
  fetch('/keepalive', { method: 'GET', credentials: 'omit' }).catch(() => {});
}
