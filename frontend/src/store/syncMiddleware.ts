import { api } from '../api/client';
import { API_BASE } from '../config';
import { STORAGE_KEY, BC_CHANNEL } from '../components/dashboard/DashboardUtils';
import { parseSelectedDate } from '../components/dashboard/DashboardUtils';
import { saveLocalState, addToSyncQueue, getSyncQueue, clearSyncQueue } from '../db/localDb';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let persistTimeout: ReturnType<typeof setTimeout> | null = null;
let isApplyingFromBC = false;
let isApplyingFromBCQueue: unknown[] = [];  // Buffer BC updates while applying
let bc: BroadcastChannel | null = null;

/** Latest built full state, captured before the debounced PUT fires.
 *  Used by beforeunload/visibilitychange to flush via sendBeacon so ticks
 *  aren't lost when the tab closes during the 4-second debounce window. */
let pendingFullState: Record<string, unknown> | null = null;
let hasPendingPut = false;

/** Call before resetting/reloading to prevent beforeunload beacon from re-uploading stale state. */
export function cancelPendingSync(): void {
  pendingFullState = null;
  hasPendingPut = false;
  if (syncTimeout) { clearTimeout(syncTimeout); syncTimeout = null; }
  if (persistTimeout) { clearTimeout(persistTimeout); persistTimeout = null; }
}

function flushPendingPutViaBeacon(): void {
  if (!hasPendingPut || !pendingFullState) return;
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
  try {
    const url = `${API_BASE}/training/dashboard-state`;
    // sendBeacon only supports POST, but the backend endpoint is PUT. Fall
    // back to fetch(keepalive: true) which survives page unload for small
    // payloads (<64KB typical per browser).
    const body = JSON.stringify({ data: pendingFullState });
    const token = localStorage.getItem('km-admin-token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, 'x-km-access': token } : {}),
    };
    if (typeof fetch === 'function') {
      void fetch(url, {
        method: 'PUT',
        headers,
        body,
        credentials: 'include',
        keepalive: true,
      }).catch(() => {});
    }
    hasPendingPut = false;
  } catch {
    // swallow — page is unloading
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushPendingPutViaBeacon);
  window.addEventListener('pagehide', flushPendingPutViaBeacon);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushPendingPutViaBeacon();
  });
}

function normalizeIncomingState(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const next = { ...(payload as Record<string, unknown>) };
  // selectedDate is UI-only navigation state — never overwrite from BC/sync
  delete next.selectedDate;
  return next;
}

/** Keys whose values are date-keyed dictionaries; these must be merged, not
 *  wholesale-replaced, to avoid losing local mutations that haven't yet been
 *  reflected in cross-tab broadcasts. */
const DATE_KEYED_DICT_KEYS = new Set([
  'prayerLogs',
  'dailyTaskLogs',
  'dailyCompletionLog',
  'timelineRoutines',
]);

/** Keys whose values are flat dictionaries (not date-keyed). Merge by key —
 *  incoming fills in missing keys, local wins for anything already set. */
const FLAT_DICT_MERGE_KEYS = new Set([
  'projectExpandedState',
  'sectionOrder',
]);

/** Keys whose values are arrays with id fields; merge by id, local wins. */
const ARRAY_MERGE_KEYS = new Set([
  'quickTasks',
  'projects',
  'dailyTaskTemplates',
]);

/** Flat dict merge: local wins per-key; incoming only fills missing keys. */
function mergeFlatDict(
  local: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(local || {}) };
  if (!incoming || typeof incoming !== 'object') return out;
  for (const key of Object.keys(incoming)) {
    if (!(key in out) || out[key] == null) {
      out[key] = incoming[key];
    }
    // else: local wins
  }
  return out;
}

/** Merge sharedDashboards arrays by share_id. Local entries win; incoming
 *  fills in dashboards local doesn't have yet. Preserves per-share_id local
 *  edits (tick state, lifeGoalId, etc.) against stale broadcasts. */
function mergeSharedDashboards(
  local: unknown,
  incoming: unknown
): unknown[] {
  const localArr = Array.isArray(local) ? local : [];
  const incomingArr = Array.isArray(incoming) ? incoming : [];
  const byId = new Map<string, unknown>();
  for (const entry of incomingArr) {
    const id = (entry as { share_id?: string })?.share_id;
    if (id) byId.set(id, entry);
  }
  // Local wins — overlay over incoming
  for (const entry of localArr) {
    const id = (entry as { share_id?: string })?.share_id;
    if (id) byId.set(id, entry);
  }
  return Array.from(byId.values());
}

/** Merge arrays of objects by their id field. Local entries win over incoming.
 *  This prevents server data (potentially stale) from overwriting recent local
 *  changes like checkbox toggles, task edits, etc. */
function mergeById(local: unknown, incoming: unknown): unknown[] {
  const localArr = Array.isArray(local) ? local : [];
  const incomingArr = Array.isArray(incoming) ? incoming : [];
  const byId = new Map<string, unknown>();
  // First add all incoming entries
  for (const entry of incomingArr) {
    const id = (entry as { id?: string })?.id;
    if (id) byId.set(id, entry);
  }
  // Local wins — overlay over incoming
  for (const entry of localArr) {
    const id = (entry as { id?: string })?.id;
    if (id) byId.set(id, entry);
  }
  return Array.from(byId.values());
}

/** Merge date-keyed dict: local wins per inner-key when local is truthy,
 *  server/other-tab fills in missing inner keys. */
function mergeDateKeyedDict(
  local: Record<string, unknown> | undefined,
  incoming: Record<string, unknown> | undefined
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(local || {}) };
  if (!incoming || typeof incoming !== 'object') return out;
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
      incomingEntry && typeof incomingEntry === 'object' && !Array.isArray(incomingEntry) &&
      localEntry && typeof localEntry === 'object' && !Array.isArray(localEntry)
    ) {
      const merged: Record<string, unknown> = { ...(localEntry as Record<string, unknown>) };
      for (const innerKey of Object.keys(incomingEntry as Record<string, unknown>)) {
        const localVal = merged[innerKey];
        // CRITICAL FIX: Only overwrite if local key is completely missing (undefined)
        // null/false are valid explicit values (unchecked prayer) and must win over incoming
        if (localVal === undefined) {
          merged[innerKey] = (incomingEntry as Record<string, unknown>)[innerKey];
        }
        // else: keep local value (even if null/false - user explicitly unchecked)
      }
      out[dateKey] = merged;
    }
    // else: keep local
  }
  return out;
}

/** Apply incoming state by mutating the immer draft key-by-key instead of
 *  replacing the whole state, which could drop in-flight local mutations. */
function applyIncomingState(set: SetState, data: unknown): void {
  if (!data || typeof data !== 'object') return;
  const incoming = data as Record<string, unknown>;
  set((s: unknown) => {
    const draft = s as Record<string, unknown>;
    for (const key of Object.keys(incoming)) {
      if (DATE_KEYED_DICT_KEYS.has(key)) {
        // Merge, never replace — protects local ticks from stale BC snapshots
        draft[key] = mergeDateKeyedDict(
          draft[key] as Record<string, unknown> | undefined,
          incoming[key] as Record<string, unknown> | undefined
        );
      } else if (FLAT_DICT_MERGE_KEYS.has(key)) {
        // Merge by key — protects UI state (expand/collapse, section order)
        draft[key] = mergeFlatDict(
          draft[key] as Record<string, unknown> | undefined,
          incoming[key] as Record<string, unknown> | undefined
        );
      } else if (key === 'activePomodoroTask') {
        // Only clobber if local has no active session — don't let a stale BC
        // message reset an in-progress pomodoro on this tab.
        const localVal = draft[key];
        const incomingVal = incoming[key];
        if (localVal == null && incomingVal != null) {
          draft[key] = incomingVal;
        }
        // else: keep local (even if incoming is null)
      } else if (key === 'sharedDashboards') {
        draft[key] = mergeSharedDashboards(draft[key], incoming[key]);
      } else if (ARRAY_MERGE_KEYS.has(key)) {
        // Merge arrays by id — local wins over incoming to prevent race conditions
        // where server data (stale) overwrites recent local checkbox toggles
        draft[key] = mergeById(draft[key], incoming[key]);
      } else {
        draft[key] = incoming[key];
      }
    }
    return draft; // Must return the state for the raw Zustand set
  });
}

function getBroadcastChannel(): BroadcastChannel | null {
  if (bc) return bc;
  try {
    bc = new BroadcastChannel(BC_CHANNEL);
    return bc;
  } catch {
    return null;
  }
}

// Handle reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const queue = await getSyncQueue();
    if (queue.length > 0) {
      console.log('Reconnected! Flushing sync queue...');
      const dashboardUpdates = queue.filter((i: { type?: string }) => i.type === 'dashboard_update');
      if (dashboardUpdates.length > 0) {
        const latest = dashboardUpdates.sort((a: { timestamp?: number }, b: { timestamp?: number }) => (b.timestamp ?? 0) - (a.timestamp ?? 0))[0];
        try {
          await api.training.updateDashboardState(latest.data);
          console.log('Sync queue flushed successfully');
        } catch (err) {
          console.error('Failed to flush sync queue:', err);
        }
      }
      await clearSyncQueue(queue.map((i: { id: string }) => i.id));
    }
  });
}

/** State slice used by sync middleware for persistence */
interface SyncStateSlice {
  isLoaded?: boolean;
  dailyTaskTemplates?: unknown[];
  dailyTaskLogs?: Record<string, unknown>;
  projects?: unknown[];
  prayerLogs?: Record<string, unknown>;
  selectedDate?: Date | string;
  top3Manual?: unknown[];
  quickTasks?: unknown[];
  dailyCompletionLog?: Record<string, unknown>;
  lifeGoals?: unknown;
  timelineRoutines?: Record<string, unknown>;
  projectExpandedState?: Record<string, boolean>;
  activePomodoroTask?: unknown;
  sectionOrder?: Record<string, string[]>;
  lastSavedAt?: number | null;
  timelinePanelExpanded?: boolean;
  todayTrainingExpanded?: boolean;
  lockedHabitsCollapsed?: boolean;
}

type SetState = (args: unknown) => void;
type GetState = () => SyncStateSlice & Record<string, unknown>;

/**
 * Zustand middleware for multi-layer sync:
 * 1. IndexedDB / Dexie (instant)
 * 2. BroadcastChannel (instant cross-tab)
 * 3. REST API or Sync Queue (debounced 500ms)
 */
export function syncMiddleware(config: any): any {
  const channel = getBroadcastChannel();

  return (set: SetState, get: GetState, api_store: unknown) => {
    /** Build a plain snapshot of the persistable state from the live store. */
    function buildFullState(): Record<string, unknown> {
      const s = get() as SyncStateSlice & Record<string, unknown>;
      return {
        dailyTaskTemplates: s.dailyTaskTemplates,
        dailyTaskLogs: s.dailyTaskLogs,
        projects: s.projects,
        projectOrder: Array.isArray(s.projects) ? (s.projects as { id?: string }[]).map((p) => p.id) : [],
        prayerLogs: s.prayerLogs,
        top3Manual: s.top3Manual,
        quickTasks: s.quickTasks,
        dailyCompletionLog: s.dailyCompletionLog,
        lifeGoals: s.lifeGoals,
        timelineRoutines: s.timelineRoutines ?? {},
        timelinePanelExpanded: s.timelinePanelExpanded !== false,
        todayTrainingExpanded: s.todayTrainingExpanded !== false,
        lockedHabitsCollapsed: !!s.lockedHabitsCollapsed,
        projectExpandedState: s.projectExpandedState ?? {},
        sectionOrder: s.sectionOrder,
        activePomodoroTask: s.activePomodoroTask ?? null,
      };
    }

    const wrappedSet: SetState = (args) => {
      // Ensure functional updates return the state to avoid setting store to undefined
      const functionalArg = typeof args === 'function' 
        ? (s: any) => {
            const res = (args as Function)(s);
            return res === undefined ? s : res;
          }
        : args;

      const result = set(functionalArg);
      const state = get() as SyncStateSlice & Record<string, unknown>;
      if (!state || !state.isLoaded || isApplyingFromBC) return result;

      if (persistTimeout) clearTimeout(persistTimeout);
      persistTimeout = setTimeout(() => {
        const fullState = buildFullState();
        /* 
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
          } catch (err) {
            console.error('Failed to save to localStorage:', err);
          }
        }
        */
        saveLocalState(fullState);
        try {
          if (channel) channel.postMessage(fullState);
        } catch (err) {
          console.error('Failed to post to BroadcastChannel:', err);
        }
      }, 500);

      if (syncTimeout) clearTimeout(syncTimeout);
      // Capture the latest state up-front so beforeunload/visibilitychange can
      // flush via keepalive fetch if the user closes the tab before 4s elapse.
      pendingFullState = buildFullState();
      hasPendingPut = true;
      syncTimeout = setTimeout(async () => {
        const fullState = buildFullState();
        pendingFullState = fullState;
        hasPendingPut = true;
        if (navigator.onLine) {
          try {
            await api.training.updateDashboardState(fullState, { timeout: 60_000 });
            hasPendingPut = false;
            isApplyingFromBC = true;
            set((s: any) => ({ ...s, lastSavedAt: Date.now() }));
            queueMicrotask(() => {
              isApplyingFromBC = false;
              if (isApplyingFromBCQueue.length > 0 && channel) {
                const queued = isApplyingFromBCQueue.splice(0);
                for (const data of queued) {
                  applyIncomingState(set, data);
                }
              }
            });
          } catch (err) {
            const { logError, showErrorToast } = await import('../utils/errorLog');
            logError({ action: 'sync', api: 'dashboard-state' }, err as Error, { offline: !navigator.onLine });
            if (navigator.onLine) showErrorToast('Sync non riuscito. Modifiche salvate in coda.');
            await addToSyncQueue('dashboard_update', fullState);
          }
        } else {
          await addToSyncQueue('dashboard_update', fullState);
        }
      }, 2000);
    };

    if (channel) {
      channel.onmessage = (e: MessageEvent) => {
        const s = e?.data;
        if (!s) return;
        if (isApplyingFromBC) {
          isApplyingFromBCQueue.push(normalizeIncomingState(s));
          return;
        }
        // Defer to next task to avoid blocking the message handler
        setTimeout(() => {
          isApplyingFromBC = true;
          applyIncomingState(set, normalizeIncomingState(s));
          queueMicrotask(() => {
            isApplyingFromBC = false;
            if (isApplyingFromBCQueue.length > 0) {
              const queued = isApplyingFromBCQueue.splice(0);
              for (const data of queued) applyIncomingState(set, data);
            }
            // Fix #13: Trigger fresh persist after BC application to ensure
            // any local mutations made during the BC application window are captured
            if (persistTimeout) clearTimeout(persistTimeout);
            persistTimeout = setTimeout(() => {
              const fullState = buildFullState();
              saveLocalState(fullState);
              try {
                if (channel) channel.postMessage(fullState);
              } catch (err) {
                console.error('Failed to post to BroadcastChannel:', err);
              }
            }, 100);
          });
        }, 0);
      };
    }

    return config(wrappedSet, get, api_store);
  };
}
