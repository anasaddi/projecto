/**
 * Centralized config for API and WebSocket URLs.
 * Override via env: VITE_API_BASE, VITE_WS_HOST
 */
const isDev = Boolean(import.meta.env.DEV);
const browserHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const isVercelFrontend = browserHostname.endsWith('vercel.app');

// Default to same-origin API so Vercel rewrites can proxy to backend reliably.
const DEFAULT_API_BASE = '/api';

export const API_BASE = isVercelFrontend
  ? DEFAULT_API_BASE
  : (import.meta.env.VITE_API_BASE || DEFAULT_API_BASE);

export const WS_HOST = import.meta.env.VITE_WS_HOST || (isDev ? `${browserHostname}:8000` : 'projecto-backend-7we9.onrender.com');

export function getSharedDashboardWsUrl(shareId) {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${WS_HOST}/api/training/ws/shared-dashboard/${encodeURIComponent(shareId)}`;
}
