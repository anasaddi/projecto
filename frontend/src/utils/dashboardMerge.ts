import { mergeSharedDashboardData, type SharedDashboardData } from './mergeSharedDashboard';

export type MergePayload = Record<string, unknown>;

const DATE_KEYED = new Set(['prayerLogs', 'dailyTaskLogs', 'dailyCompletionLog', 'timelineRoutines']);
const FLAT_DICT = new Set(['projectExpandedState', 'sectionOrder']);
const ARRAY_KEYS = new Set(['quickTasks', 'projects', 'dailyTaskTemplates']);

function mergeFlatDict(local?: Record<string, unknown>, incoming?: Record<string, unknown>) {
  const out = { ...(local || {}) };
  if (!incoming) return out;
  for (const key of Object.keys(incoming)) {
    if (!(key in out) || out[key] == null) out[key] = incoming[key];
  }
  return out;
}

function mergeById(local: unknown, incoming: unknown): unknown[] {
  const localArr = Array.isArray(local) ? local : [];
  const incomingArr = Array.isArray(incoming) ? incoming : [];
  const byId = new Map<string, unknown>();
  for (const entry of incomingArr) {
    const id = (entry as { id?: string })?.id;
    if (id) byId.set(id, entry);
  }
  for (const entry of localArr) {
    const id = (entry as { id?: string })?.id;
    if (id) byId.set(id, entry);
  }
  return Array.from(byId.values());
}

function mergeDateKeyedDict(
  local?: Record<string, unknown>,
  incoming?: Record<string, unknown>
): Record<string, unknown> {
  const out = { ...(local || {}) };
  if (!incoming) return out;
  for (const dateKey of Object.keys(incoming)) {
    const localEntry = out[dateKey];
    const incomingEntry = incoming[dateKey];
    const localIsEmpty =
      localEntry == null ||
      (typeof localEntry === 'object' && !Array.isArray(localEntry) && Object.keys(localEntry as object).length === 0) ||
      (Array.isArray(localEntry) && localEntry.length === 0);
    if (localIsEmpty) {
      out[dateKey] = incomingEntry;
      continue;
    }
    if (
      incomingEntry &&
      typeof incomingEntry === 'object' &&
      !Array.isArray(incomingEntry) &&
      localEntry &&
      typeof localEntry === 'object' &&
      !Array.isArray(localEntry)
    ) {
      const merged = { ...(localEntry as Record<string, unknown>) };
      for (const innerKey of Object.keys(incomingEntry as Record<string, unknown>)) {
        if (merged[innerKey] === undefined) {
          merged[innerKey] = (incomingEntry as Record<string, unknown>)[innerKey];
        }
      }
      out[dateKey] = merged;
    }
  }
  return out;
}

/** Pure merge used by main thread and Web Worker. */
export function mergeDashboardServerPayload(local: MergePayload, incoming: MergePayload): MergePayload {
  const out = { ...local };
  for (const key of Object.keys(incoming)) {
    if (key === 'selectedDate') continue;
    if (DATE_KEYED.has(key)) {
      out[key] = mergeDateKeyedDict(
        out[key] as Record<string, unknown>,
        incoming[key] as Record<string, unknown>
      );
    } else if (FLAT_DICT.has(key)) {
      out[key] = mergeFlatDict(
        out[key] as Record<string, unknown>,
        incoming[key] as Record<string, unknown>
      );
    } else if (key === 'sharedDashboards') {
      out[key] = mergeById(out[key], incoming[key]);
    } else if (ARRAY_KEYS.has(key)) {
      out[key] = mergeById(out[key], incoming[key]);
    } else if (key === 'activePomodoroTask') {
      if (out[key] == null && incoming[key] != null) out[key] = incoming[key];
    } else {
      out[key] = incoming[key];
    }
  }
  return out;
}

export function mergeSharedInWorker(
  prev: SharedDashboardData,
  incoming: SharedDashboardData
): SharedDashboardData {
  return mergeSharedDashboardData(prev, incoming);
}
