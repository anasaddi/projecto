// Su Vercel (produzione), usiamo il proxy configurato in vercel.json (/api)
// In locale, usiamo '/api' che viene gestito dal proxy di Vite (vite.config.js)
const BASE = '/api'

async function request(path, options = {}) {
  const token = localStorage.getItem('km-admin-token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}`, 'x-km-access': token } : {}),
    ...options.headers,
  }
  const url = BASE + path
  try {
    const res = await fetch(url, {
      ...options,
      headers,
    })
    if (res.status === 401) {
      localStorage.removeItem('km-admin-token');
      localStorage.removeItem('km-user-role');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    if (!res.ok) {
      const err = new Error(`Request failed with status ${res.status}: ${res.statusText}`)
      err.status = res.status
      err.body = await res.text()
      console.error(`[API] Error fetching ${url}:`, err)
      throw err
    }
    if (res.status === 204) return
    return res.json()
  } catch (err) {
    console.error(`[API] Failed to fetch ${url}:`, err)
    throw err
  }
}

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
    getDashboardState: () => request('/training/dashboard-state'),
    updateDashboardState: (data) =>
      request('/training/dashboard-state', {
        method: 'PUT',
        body: JSON.stringify({ data }),
      }),
    getSharedDashboard: (shareId) => request(`/training/shared-dashboard/${encodeURIComponent(shareId)}`),
    listSharedDashboards: () => request('/training/shared-dashboards'),
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
