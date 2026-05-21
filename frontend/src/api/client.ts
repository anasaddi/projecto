import { logAndToast } from '../utils/errorLog';
import type { LoginResponse } from '../types/api';
import { API_BASE } from '../config';
import { clearAuthSessionFlags } from '../utils/authSession';

const BASE = API_BASE;
const DEFAULT_TIMEOUT_MS = 30_000;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
const DASHBOARD_ETAG_KEY = 'km-dashboard-etag';

export interface DashboardStateResponse {
  notModified?: boolean;
  key?: string;
  data?: unknown;
  updated_at?: string;
}

function resolveApiUrl(path: string): string {
  return BASE + path;
}

export async function clearAuthAndRedirect(): Promise<void> {
  try {
    await fetch(resolveApiUrl('/auth/logout'), { method: 'POST', credentials: 'include' });
  } catch {
    /* ignore */
  }
  clearAuthSessionFlags();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  /** Skip toast on errors (e.g. expected 403 on shared poll). */
  silent?: boolean;
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
  const silent = options.silent === true;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  const url = resolveApiUrl(path);
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;
  let lastErr: Error | undefined;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        url,
        { ...options, headers, credentials: 'include' } as RequestInit & { timeout?: number },
        timeoutMs
      );
      if (res.headers.get('X-Degraded') === 'true') {
        throw new Error('Degraded server response');
      }
      if (res.status === 401) {
        await clearAuthAndRedirect();
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
        if (!silent && attempt >= MAX_RETRIES) {
          logAndToast(
            { api: path, action: 'request' },
            err,
            `Errore di rete (${res.status}). Riprova.`,
            { status: res.status }
          );
        }
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
      if ((err as Error).message === 'Unauthorized') throw err;
      const status = (err as Error & { status?: number }).status;
      if (status != null && status >= 400 && status < 500) throw err;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
      } else {
        if (!silent) {
          logAndToast({ api: path, action: 'request' }, err as Error, 'Connessione fallita. Controlla la rete e riprova.');
        }
        throw err;
      }
    }
  }
  throw lastErr;
}

export interface BootstrapResponse {
  notModified?: boolean;
  dashboard?: DashboardStateResponse | null;
  shared_dashboards?: unknown[];
  config?: Record<string, unknown>;
}

async function fetchBootstrap(timeoutMs: number): Promise<BootstrapResponse> {
  const etag = typeof localStorage !== 'undefined' ? localStorage.getItem(DASHBOARD_ETAG_KEY) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (etag) headers['If-None-Match'] = etag;

  const url = resolveApiUrl('/bootstrap');
  const res = await fetchWithTimeout(url, { method: 'GET', headers, credentials: 'include' }, timeoutMs);

  if (res.status === 304) return { notModified: true };
  if (res.status === 401) {
    await clearAuthAndRedirect();
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`Bootstrap failed with status ${res.status}`);

  const newEtag = res.headers.get('ETag');
  if (newEtag && typeof localStorage !== 'undefined') {
    localStorage.setItem(DASHBOARD_ETAG_KEY, newEtag);
  }
  return (await res.json()) as BootstrapResponse;
}

async function fetchDashboardState(path: string, timeoutMs: number): Promise<DashboardStateResponse> {
  const etag = typeof localStorage !== 'undefined' ? localStorage.getItem(DASHBOARD_ETAG_KEY) : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (etag) headers['If-None-Match'] = etag;

  const url = resolveApiUrl(path);
  const res = await fetchWithTimeout(
    url,
    { method: 'GET', headers, credentials: 'include' },
    timeoutMs
  );

  if (res.status === 304) {
    return { notModified: true };
  }
  if (res.status === 401) {
    await clearAuthAndRedirect();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  const newEtag = res.headers.get('ETag');
  if (newEtag && typeof localStorage !== 'undefined') {
    localStorage.setItem(DASHBOARD_ETAG_KEY, newEtag);
  }
  return (await res.json()) as DashboardStateResponse;
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
      return fetch(resolveApiUrl('/sources/'), {
        method: 'POST',
        credentials: 'include',
        body: form,
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
      return fetch(resolveApiUrl('/sources/'), {
        method: 'POST',
        credentials: 'include',
        body: form,
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
      fetchDashboardState('/training/dashboard-state', opts?.timeout ?? DEFAULT_TIMEOUT_MS),
    getDashboardStateAt: (at: string, opts?: RequestOptions) =>
      request<{ data?: unknown }>(`/training/dashboard-state/at?at=${encodeURIComponent(at)}`, opts ?? {}),
    updateDashboardState: (data: unknown, opts?: { timeout?: number }) =>
      request('/training/dashboard-state', {
        method: 'PUT',
        body: JSON.stringify({ data }),
        ...opts,
      }),
    patchDashboardState: (events: unknown[]) =>
      request('/training/dashboard-state', {
        method: 'PATCH',
        body: JSON.stringify({ events }),
      }),
    resetDailyLogs: () =>
      request('/training/dashboard-reset-daily', {
        method: 'POST',
      }),
    getSharedDashboard: (shareId: string, opts?: RequestOptions) =>
      request<unknown>(`/training/shared-dashboard/${encodeURIComponent(shareId)}`, opts ?? {}),
    unlockSharedDashboard: (shareId: string, password: string, opts?: RequestOptions) =>
      request<{ token?: string }>(`/training/shared-dashboard/${encodeURIComponent(shareId)}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ password }),
        ...opts,
      }),
    listSharedDashboards: (opts?: RequestOptions) => request<unknown>('/training/shared-dashboards', opts ?? {}),
    updateSharedDashboard: (shareId: string, data: unknown, title?: string, opts?: RequestOptions) =>
      request(`/training/shared-dashboard/${encodeURIComponent(shareId)}`, {
        method: 'PUT',
        body: JSON.stringify({ data, title }),
        ...opts,
      }),
  },
  config: {
    getConstants: () => request<unknown>('/config/constants'),
  },
  bootstrap: {
    get: (opts?: RequestOptions) => fetchBootstrap(opts?.timeout ?? DEFAULT_TIMEOUT_MS),
  },
  auth: {
    login: (key: string) =>
      request<LoginResponse>('/auth/login', { method: 'POST', body: JSON.stringify({ key }) }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
    verify: () => request<{ status?: string; training?: boolean }>('/auth/verify'),
  },
};
