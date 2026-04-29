import { api } from '../api/client';
import { STORAGE_KEY, BC_CHANNEL } from '../components/dashboard/DashboardUtils';
import { parseSelectedDate } from '../components/dashboard/DashboardUtils';
import { saveLocalState, addToSyncQueue, getSyncQueue, clearSyncQueue } from '../db/localDb';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let persistTimeout: ReturnType<typeof setTimeout> | null = null;
let isApplyingFromBC = false;
let isApplyingFromBCQueue: unknown[] = [];  // Buffer BC updates while applying
let bc: BroadcastChannel | null = null;

function normalizeIncomingState(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  const next = { ...(payload as Record<string, unknown>) };
  // selectedDate is UI-only navigation state — never overwrite from BC/sync
  delete next.selectedDate;
  return next;
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
    const wrappedSet: SetState = (args) => {
      set(args);
      const state = get() as SyncStateSlice & Record<string, unknown>;
      if (!state.isLoaded || isApplyingFromBC) return;

      const fullState = {
        dailyTaskTemplates: state.dailyTaskTemplates,
        dailyTaskLogs: state.dailyTaskLogs,
        projects: state.projects,
        projectOrder: Array.isArray(state.projects) ? (state.projects as { id?: string }[]).map((p) => p.id) : [],
        prayerLogs: state.prayerLogs,
        // selectedDate è UI-only: non salvare, al refresh è sempre oggi
        top3Manual: state.top3Manual,
        quickTasks: state.quickTasks,
        dailyCompletionLog: state.dailyCompletionLog,
        lifeGoals: state.lifeGoals,
        timelineRoutines: state.timelineRoutines ?? {},
        projectExpandedState: state.projectExpandedState ?? {},
        sectionOrder: state.sectionOrder,
        activePomodoroTask: state.activePomodoroTask ?? null,
      };

      if (persistTimeout) clearTimeout(persistTimeout);
      persistTimeout = setTimeout(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
          } catch (err) {
            console.error('Failed to save to localStorage:', err);
          }
        }
        saveLocalState(fullState);
        try {
          if (channel) channel.postMessage(fullState);
        } catch (err) {
          console.error('Failed to post to BroadcastChannel:', err);
        }
      }, 300);

      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(async () => {
        if (navigator.onLine) {
          try {
            await api.training.updateDashboardState(fullState, { timeout: 30_000 });
            // Use queueing microtask to reliably sequence the flag reset after state propagation
            isApplyingFromBC = true;
            set((s: unknown) => ({ ...(s as object), lastSavedAt: Date.now() }));
            queueMicrotask(() => {
              isApplyingFromBC = false;
              // Flush any buffered BC updates that arrived during the sync
              if (isApplyingFromBCQueue.length > 0 && channel) {
                const queued = isApplyingFromBCQueue.splice(0);
                for (const data of queued) {
                  set((_: unknown) => normalizeIncomingState(data));
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
      }, 500);
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
          set(normalizeIncomingState(s));
          queueMicrotask(() => {
            isApplyingFromBC = false;
            if (isApplyingFromBCQueue.length > 0) {
              const queued = isApplyingFromBCQueue.splice(0);
              for (const data of queued) set(normalizeIncomingState(data));
            }
          });
        }, 0);
      };
    }

    return config(wrappedSet, get, api_store);
  };
}
