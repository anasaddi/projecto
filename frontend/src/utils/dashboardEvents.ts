import type { DashboardEvent } from '../../../shared/dashboard';

type StateSlice = Record<string, unknown>;

function jsonStable(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return '';
  }
}

function structuralKeysChanged(prev: StateSlice, next: StateSlice): boolean {
  for (const key of ['dailyTaskTemplates', 'projects', 'lifeGoals'] as const) {
    const p = prev[key];
    const n = next[key];
    if (key === 'lifeGoals') {
      const pt = (p as { tiers?: unknown[] })?.tiers?.length ?? 0;
      const nt = (n as { tiers?: unknown[] })?.tiers?.length ?? 0;
      if (pt !== nt) return true;
      continue;
    }
    const pLen = Array.isArray(p) ? p.length : 0;
    const nLen = Array.isArray(n) ? n.length : 0;
    if (pLen !== nLen) return true;
  }
  return false;
}

export function detectDashboardEvents(prev: StateSlice, next: StateSlice): DashboardEvent[] {
  const events: DashboardEvent[] = [];

  const prevPrayer = (prev.prayerLogs || {}) as Record<string, Record<string, unknown>>;
  const nextPrayer = (next.prayerLogs || {}) as Record<string, Record<string, unknown>>;
  for (const date of new Set([...Object.keys(prevPrayer), ...Object.keys(nextPrayer)])) {
    const pDay = prevPrayer[date] || {};
    const nDay = nextPrayer[date] || {};
    for (const name of new Set([...Object.keys(pDay), ...Object.keys(nDay)])) {
      if (jsonStable(pDay[name]) !== jsonStable(nDay[name])) {
        const entry = nDay[name];
        const completed =
          typeof entry === 'object' && entry !== null
            ? !!(entry as { completedAt?: string }).completedAt
            : !!entry;
        events.push({
          type: 'toggle_prayer',
          date,
          prayerName: name,
          completed,
          completedAt:
            typeof entry === 'object' && entry !== null
              ? ((entry as { completedAt?: string }).completedAt ?? null)
              : completed
                ? new Date().toISOString()
                : null,
        });
      }
    }
  }

  const prevHabits = (prev.dailyTaskLogs || {}) as Record<string, Array<{ id: string; done: boolean }>>;
  const nextHabits = (next.dailyTaskLogs || {}) as Record<string, Array<{ id: string; done: boolean }>>;
  for (const date of new Set([...Object.keys(prevHabits), ...Object.keys(nextHabits)])) {
    const pDay = prevHabits[date] || [];
    const nDay = nextHabits[date] || [];
    const pMap = Object.fromEntries(pDay.map((l) => [l.id, l.done]));
    const nMap = Object.fromEntries(nDay.map((l) => [l.id, l.done]));
    for (const id of new Set([...Object.keys(pMap), ...Object.keys(nMap)])) {
      if (pMap[id] !== nMap[id]) {
        events.push({ type: 'toggle_habit', date, habitId: id, done: !!nMap[id] });
      }
    }
  }

  const prevQuick = (prev.quickTasks || []) as Array<{ id: string; done?: boolean }>;
  const nextQuick = (next.quickTasks || []) as Array<{ id: string; done?: boolean }>;
  const pQ = Object.fromEntries(prevQuick.map((q) => [q.id, !!q.done]));
  const nQ = Object.fromEntries(nextQuick.map((q) => [q.id, !!q.done]));
  for (const id of new Set([...Object.keys(pQ), ...Object.keys(nQ)])) {
    if (pQ[id] !== nQ[id]) {
      events.push({ type: 'toggle_quick_task', quickTaskId: id, done: !!nQ[id] });
    }
  }

  const prevCompl = (prev.dailyCompletionLog || {}) as Record<string, unknown>;
  const nextCompl = (next.dailyCompletionLog || {}) as Record<string, unknown>;
  for (const date of new Set([...Object.keys(prevCompl), ...Object.keys(nextCompl)])) {
    if (jsonStable(prevCompl[date]) !== jsonStable(nextCompl[date])) {
      events.push({
        type: 'set_completion_log',
        date,
        completion: nextCompl[date] as DashboardEvent['completion'],
      });
    }
  }

  return events;
}

/** PATCH only for toggles/completion; structural changes (templates/projects/lifeGoals) need full PUT. */
export function canPatchDashboardEvents(prev: StateSlice, next: StateSlice, events: DashboardEvent[]): boolean {
  if (events.length === 0 || events.length > 12) return false;
  if (structuralKeysChanged(prev, next)) return false;
  return true;
}

export function clearDashboardEtag(): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('km-dashboard-etag');
  }
}
