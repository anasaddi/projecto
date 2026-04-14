/**
 * Centralized config for API and WebSocket URLs.
 * Override via env: VITE_API_BASE, VITE_WS_HOST
 */
function isLocalHost() {
  return typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
}

// Production backend URL on Railway
const PRODUCTION_API_BASE = 'https://projecto-production-feda.up.railway.app/api';

export const API_BASE = isLocalHost()
  ? (import.meta.env.VITE_API_BASE || '/api')
  : (import.meta.env.VITE_API_BASE || PRODUCTION_API_BASE);

export const WS_HOST = isLocalHost()
  ? 'localhost:8000'
  : (import.meta.env.VITE_WS_HOST || 'projecto-production-feda.up.railway.app');

export function getSharedDashboardWsUrl(shareId) {
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${WS_HOST}/api/training/ws/shared-dashboard/${encodeURIComponent(shareId)}`;
}
