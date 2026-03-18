import { logAndToast } from '../utils/errorLog'

// Su Vercel (produzione), usiamo il proxy configurato in vercel.json (/api)
// In locale, usiamo '/api' che viene gestito dal proxy di Vite (vite.config.js)
const BASE = '/api'
const DEFAULT_TIMEOUT_MS = 30_000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 500

function clearAuthAndRedirect() {
  localStorage.removeItem('km-admin-token')
  localStorage.removeItem('km-user-role')
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

function isTokenExpired(token) {
  if (!token || typeof token !== 'string') return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1] || '{}'))
    const exp = payload.exp
    if (!exp) return false
    return Date.now() >= exp * 1000
  } catch {
    return false
  }
}

async function fetchWithTimeout(url, options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), timeoutMs)
  const res = await fetch(url, { ...options, signal: ctrl.signal })
  clearTimeout(id)
  return res
}

async function request(path, options = {}) {
  const token = localStorage.getItem('km-admin-token')
  if (token && isTokenExpired(token)) {
    clearAuthAndRedirect()
    throw new Error('Token expired')
  }
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}`, 'x-km-access': token } : {}),
    ...options.headers,
  }
  const url = BASE + path
  const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS
  let lastErr
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { ...options, headers }, timeoutMs)
      if (res.status === 401) {
        clearAuthAndRedirect()
        throw new Error('Unauthorized')
      }
      if (!res.ok) {
        const body = await res.text()
        const err = new Error(`Request failed with status ${res.status}: ${res.statusText}`)
        err.status = res.status
        err.body = body
        logAndToast({ api: path, action: 'request' }, err, `Errore di rete (${res.status}). Riprova.`, { status: res.status })
        throw err
      }
      if (res.status === 204) return
      return res.json()
    } catch (err) {
      lastErr = err
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Request timeout after ${timeoutMs}ms`)
        timeoutErr.name = 'TimeoutError'
        throw timeoutErr
      }
      if (err.message === 'Token expired' || err.message === 'Unauthorized') throw err
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, RETRY_DELAY_MS))
      } else {
        logAndToast({ api: path, action: 'request' }, err, 'Connessione fallita. Controlla la rete e riprova.')
        throw err
      }
    }
  }
  throw lastErr
}

export { isTokenExpired, clearAuthAndRedirect }

export const api = {
  sources: {
    list: () => request('/sources/'),
    get: (id) => request(`/sources/${id}`),
    createFile: (file, tipo, title, trust_score) => {
      const form = new FormData()
      form.append('file', file)
      form.append('tipo', tipo || 'note')
      if (title) form.append('title', title)
      form.append('trust_score', String(trust_score ?? 7))
      return fetch(BASE + '/sources/', { method: 'POST', body: form }).then(r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
    },
    createUrl: (url, tipo, title, trust_score) => {
      const form = new FormData()
      form.append('url', url)
      form.append('tipo', tipo || 'article')
      if (title) form.append('title', title)
      form.append('trust_score', String(trust_score ?? 7))
      return fetch(BASE + '/sources/', { method: 'POST', body: form }).then(r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
    },
  },
  content: {
    getBySource: (sourceId) => request(`/content/by-source/${sourceId}`),
    get: (id) => request(`/content/${id}`),
  },
  insights: {
    list: (params) => {
      const q = new URLSearchParams()
      if (params?.content_id != null) q.set('content_id', params.content_id)
      if (params?.skip != null) q.set('skip', params.skip)
      if (params?.limit != null) q.set('limit', params.limit)
      return request('/insights/?' + q.toString())
    },
    create: (data) => request('/insights/', { method: 'POST', body: JSON.stringify(data) }),
    get: (id) => request(`/insights/${id}`),
    update: (id, data) => request(`/insights/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => request(`/insights/${id}`, { method: 'DELETE' }),
  },
  search: {
    semantic: (query, limit = 10, intent = null, min_weight = 0.3) =>
      request('/search/semantic', {
        method: 'POST',
        body: JSON.stringify({ query, limit, intent, min_weight }),
      }),
  },
  youtube: {
    transcriptStart: (url, speakers = 2, language = 'auto', forceRefresh = false, useAssembly = false) =>
      request('/youtube/transcript', {
        method: 'POST',
        body: JSON.stringify({ url, speakers, language, force_refresh: forceRefresh, use_assembly: useAssembly }),
      }),
    transcriptStatus: (jobId) => request(`/youtube/transcript/status/${jobId}`),
  },
  training: {
    getToday: (forDate) =>
      request('/training/today' + (forDate ? `?for_date=${encodeURIComponent(forDate)}` : '')),
    getWeek: () => request('/training/week'),
    updateWeek: (days) => request('/training/week', { method: 'PUT', body: JSON.stringify({ days }) }),
    updateDayExercise: (data) =>
      request('/training/day-exercise', { method: 'PATCH', body: JSON.stringify(data) }),
    updateExerciseActive: (exerciseId, isActive) =>
      request('/training/exercise/active', {
        method: 'PATCH',
        body: JSON.stringify({ exercise_id: exerciseId, is_active: isActive ? 1 : 0 }),
      }),
    log: (data) =>
      request('/training/log', { method: 'POST', body: JSON.stringify(data) }),
    getHistory: (exerciseId, limit = 15) =>
      request(`/training/history?exercise_id=${encodeURIComponent(exerciseId)}&limit=${limit}`),
    getAwProgram: () => request('/training/aw-program'),
    getExercises: () => request('/training/exercises'),
    updateExercisePrimaryMuscles: (exerciseId, primaryMuscles) =>
      request(`/training/exercises/${encodeURIComponent(exerciseId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ primary_muscles: primaryMuscles }),
      }),
    getAllProgressions: () => request('/training/progression'),
    getProgression: (exerciseId) => request(`/training/progression/${encodeURIComponent(exerciseId)}`),
    updateProgression: (exerciseId, data) =>
      request(`/training/progression/${encodeURIComponent(exerciseId)}`, {
        method: 'POST',
        body: JSON.stringify({ data }),
      }),
    getSchedule: (startDate, daysCount) => {
      let url = '/training/schedule';
      const params = new URLSearchParams();
      if (startDate) params.append('start_date', startDate);
      if (daysCount) params.append('days_count', daysCount);
      if (params.toString()) url += `?${params.toString()}`;
      return request(url);
    },
    updateSchedule: (date, isCompleted) =>
      request(`/training/schedule/${date}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_completed: isCompleted }),
      }),
    skipToday: () =>
      request('/training/schedule/skip-today', {
        method: 'POST'
      }),
    // --- Dashboard ---
    getDashboardState: (opts) => request('/training/dashboard-state', opts ?? {}),
    updateDashboardState: (data, opts) =>
      request('/training/dashboard-state', {
        method: 'PUT',
        body: JSON.stringify({ data }),
        ...opts,
      }),
    getSharedDashboard: (shareId) => request(`/training/shared-dashboard/${encodeURIComponent(shareId)}`),
    listSharedDashboards: (opts) => request('/training/shared-dashboards', opts ?? {}),
    updateSharedDashboard: (shareId, data, title) =>
      request(`/training/shared-dashboard/${encodeURIComponent(shareId)}`, {
        method: 'PUT',
        body: JSON.stringify({ data, title }),
      }),
  },
  config: {
    getConstants: () => request('/config/constants'),
  },
  auth: {
    login: (key) => request('/auth/login', { method: 'POST', body: JSON.stringify({ key }) }),
    verify: () => request('/auth/verify'),
  }
}
