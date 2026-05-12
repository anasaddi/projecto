import { logAndToast } from '../utils/errorLog';
import type { LoginResponse } from '../types/api';
import { API_BASE } from '../config';

const BASE = API_BASE;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

export function clearAuthAndRedirect(): void {
  localStorage.removeItem('km-admin-token');
  localStorage.removeItem('km-user-role');
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

export function isTokenExpired(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || '{}')) as { exp?: number };
    const exp = payload.exp;
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return false;
  }
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number },
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeoutMs);
  const res = await fetch(url, { ...options, signal: ctrl.signal });
  clearTimeout(id);
  return res;
}

export async function request<T = unknown>(path: string, options: RequestOptions = {}): Promise<T | void> {
  const token = localStorage.getItem('km-admin-token');
  if (token && isTokenExpired(token)) {
    clearAuthAndRedirect();
    throw new Error('Token expired');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}`, 'x-km-access': token } : {}),
    ...options.headers,
  };
  const url = BASE + path;
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  let lastErr: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url,
        { ...options, headers } as RequestInit & { timeout?: number },
        timeoutMs
      );
      if (res.status === 401) {
        clearAuthAndRedirect();
        throw new Error('Unauthorized');
      }
      if (!res.ok) {
        const body = await res.text();
        const err = new Error(`Request failed with status ${res.status}: ${res.statusText}`) as Error & {
          status?: number;
          body?: string;
        };
        err.status = res.status;
        err.body = body;
        logAndToast(
          { api: path, action: 'request' },
          err,
          `Errore di rete (${res.status}). Riprova.`,
          { status: res.status }
        );
        throw err;
      }
      if (res.status === 204) return;
      return res.json() as Promise<T>;
    } catch (err) {
      lastErr = err as Error;
      if ((err as Error).name === 'AbortError') {
        const timeoutErr = new Error(`Request timeout after ${timeoutMs}ms`);
        timeoutErr.name = 'TimeoutError';
        throw timeoutErr;
      }
      if ((err as Error).message === 'Token expired' || (err as Error).message === 'Unauthorized') throw err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        logAndToast({ api: path, action: 'request' }, err as Error, 'Connessione fallita. Controlla la rete e riprova.');
        throw err;
      }
    }
  }
  throw lastErr;
}

export const api = {
  sources: {
    list: () => request<unknown[]>('/sources/'),
    get: (id: string) => request<unknown>(`/sources/${id}`),
    createFile: (
      file: File,
      tipo: string,
      title: string | undefined,
      trust_score: number | undefined
    ) => {
      const form = new FormData();
      form.append('file', file);
      form.append('tipo', tipo || 'note');
      if (title) form.append('title', title);
      form.append('trust_score', String(trust_score ?? 7));
      const token = localStorage.getItem('km-admin-token');
      return fetch(BASE + '/sources/', {
        method: 'POST',
        headers: token ? { 'x-km-access': token } : {},
        body: form
      }).then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      });
    },
    createUrl: (
      url: string,
      tipo: string,
      title: string | undefined,
      trust_score: number | undefined
    ) => {
      const form = new FormData();
      form.append('url', url);
      form.append('tipo', tipo || 'article');
      if (title) form.append('title', title);
      form.append('trust_score', String(trust_score ?? 7));
      const token = localStorage.getItem('km-admin-token');
      return fetch(BASE + '/sources/', {
        method: 'POST',
        headers: token ? { 'x-km-access': token } : {},
        body: form
      }).then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      });
    },
  },
  content: {
    getBySource: (sourceId: string) => request<unknown>(`/content/source/${sourceId}`),
    get: (id: string) => request<unknown>(`/content/${id}`),
  },
  insights: {
    list: (params?: { content_id?: string; skip?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.content_id != null) q.set('content_id', String(params.content_id));
      if (params?.skip != null) q.set('skip', String(params.skip));
      if (params?.limit != null) q.set('limit', String(params.limit));
      return request<unknown[]>('/insights/?' + q.toString());
    },
    create: (data: unknown) => request<unknown>('/insights/', { method: 'POST', body: JSON.stringify(data) }),
    get: (id: string) => request<unknown>(`/insights/${id}`),
    update: (id: string, data: unknown) =>
      request<unknown>(`/insights/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => request(`/insights/${id}`, { method: 'DELETE' }),
  },
  search: {
    semantic: (
      query: string,
      limit = 10,
      intent: string | null = null,
      min_weight = 0.3
    ) =>
      request<unknown>('/search/semantic', {
        method: 'POST',
        body: JSON.stringify({ query, limit, intent, min_weight }),
      }),
  },
  youtube: {
    transcriptStart: (
      url: string,
      speakers = 2,
      language = 'auto',
      forceRefresh = false,
      useAssembly = false
    ) =>
      request<unknown>('/youtube/transcript', {
        method: 'POST',
        body: JSON.stringify({
          url,
          speakers,
          language,
          force_refresh: forceRefresh,
          use_assembly: useAssembly,
        }),
      }),
    transcriptStatus: (jobId: string) => request<unknown>(`/youtube/transcript/status/${jobId}`),
  },
  training: {
    getToday: (forDate?: string) =>
      request<unknown>('/training/today' + (forDate ? `?for_date=${encodeURIComponent(forDate)}` : '')),
    getWeek: () => request<unknown>('/training/week'),
    updateWeek: (days: unknown) =>
      request('/training/week', { method: 'PUT', body: JSON.stringify({ days }) }),
    updateDayExercise: (data: unknown) =>
      request('/training/day-exercise', { method: 'PATCH', body: JSON.stringify(data) }),
    updateExerciseActive: (exerciseId: string, isActive: boolean) =>
      request('/training/exercise/active', {
        method: 'PATCH',
        body: JSON.stringify({ exercise_id: exerciseId, is_active: isActive ? 1 : 0 }),
      }),
    log: (data: unknown) => request('/training/log', { method: 'POST', body: JSON.stringify(data) }),
    getHistory: (exerciseId: string, limit = 15) =>
      request<unknown>(`/training/history?exercise_id=${encodeURIComponent(exerciseId)}&limit=${limit}`),
    getAwProgram: () => request<unknown>('/training/aw-program'),
    getExercises: () => request<unknown>('/training/exercises'),
    updateExercisePrimaryMuscles: (exerciseId: string, primaryMuscles: unknown) =>
      request(`/training/exercises/${encodeURIComponent(exerciseId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ primary_muscles: primaryMuscles }),
      }),
    getAllProgressions: () => request<unknown>('/training/progression'),
    getProgression: (exerciseId: string) =>
      request<unknown>(`/training/progression/${encodeURIComponent(exerciseId)}`),
    updateProgression: (exerciseId: string, data: unknown) =>
      request(`/training/progression/${encodeURIComponent(exerciseId)}`, {
        method: 'POST',
        body: JSON.stringify({ data }),
      }),
    getSchedule: (startDate?: string, daysCount?: number) => {
      let url = '/training/schedule';
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (daysCount) params.append('days_count', String(daysCount));
      if (params.toString()) url += `?${params.toString()}`;
      return request(url);
    },
    updateSchedule: (date: string, isCompleted: boolean) =>
      request(`/training/schedule/${date}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_completed: isCompleted }),
      }),
    skipToday: () =>
      request('/training/schedule/skip-today', {
        method: 'POST',
      }),
    getDashboardState: (opts?: RequestOptions) =>
      request<{ data?: unknown }>('/training/dashboard-state', opts ?? {}),
    getDashboardStateAt: (at: string, opts?: RequestOptions) =>
      request<{ data?: unknown }>(`/training/dashboard-state/at?at=${encodeURIComponent(at)}`, opts ?? {}),
    updateDashboardState: (data: unknown, opts?: { timeout?: number }) =>
      request('/training/dashboard-state', {
        method: 'PUT',
        body: JSON.stringify({ data }),
        ...opts,
      }),
    resetDailyLogs: () =>
      request('/training/dashboard-reset-daily', {
        method: 'POST',
      }),
    getSharedDashboard: (shareId: string) =>
      request<unknown>(`/training/shared-dashboard/${encodeURIComponent(shareId)}`),
    listSharedDashboards: (opts?: RequestOptions) => request<unknown>('/training/shared-dashboards', opts ?? {}),
    updateSharedDashboard: (shareId: string, data: unknown, title?: string) =>
      request(`/training/shared-dashboard/${encodeURIComponent(shareId)}`, {
        method: 'PUT',
        body: JSON.stringify({ data, title }),
      }),
  },
  config: {
    getConstants: () => request<unknown>('/config/constants'),
  },
  auth: {
    login: (key: string) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ key }) }),
    verify: () => request<unknown>('/auth/verify'),
  },
};
