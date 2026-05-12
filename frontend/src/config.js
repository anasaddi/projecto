/**
 * Centralized config for API and WebSocket URLs.
 * Override via env: VITE_API_BASE, VITE_WS_HOST
 */
const isDev = Boolean(import.meta.env.DEV);

// Production backend URL on Render
const PRODUCTION_API_BASE = 'https://projecto-backend-7we9.onrender.com/api';

export const API_BASE = import.meta.env.VITE_API_BASE || (isDev ? '/api' : PRODUCTION_API_BASE);

const browserHostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

export const WS_HOST = import.meta.env.VITE_WS_HOST || (isDev ? `${browserHostname}:8000` : 'projecto-backend-7we9.onrender.com');

export function getSharedDashboardWsUrl(shareId) {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${WS_HOST}/api/training/ws/shared-dashboard/${encodeURIComponent(shareId)}`;
}
