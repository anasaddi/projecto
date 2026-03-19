import { api } from '../api/client';
import { STORAGE_KEY, BC_CHANNEL } from '../components/dashboard/DashboardUtils';
import { saveLocalState, addToSyncQueue, getSyncQueue, clearSyncQueue } from '../db/localDb';

let syncTimeout: ReturnType<typeof setTimeout> | null = null;
let isApplyingFromBC = false;

// Handle reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const queue = await getSyncQueue();
    if (queue.length > 0) {
      console.log('Reconnected! Flushing sync queue...');
      const dashboardUpdates = queue.filter((i) => i.type === 'dashboard_update');
      if (dashboardUpdates.length > 0) {
        const latest = dashboardUpdates.sort((a, b) => b.timestamp - a.timestamp)[0];
        try {
          await api.training.updateDashboardState(latest.data);
          console.log('Sync queue flushed successfully');
        } catch (err) {
          console.error('Failed to flush sync queue:', err);
        }
      }
      await clearSyncQueue(queue.map((i) => i.id));
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
  top3Manual?: unknown[];
  quickTasks?: unknown[];
  dailyCompletionLog?: Record<string, unknown>;
  lifeGoals?: unknown;
  timelineRoutines?: Record<string, unknown>;
  timelinePanelExpanded?: boolean;
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
export function syncMiddleware<T>(config: (set: SetState, get: GetState, api_store: unknown) => T): (set: SetState, get: GetState, api_store: unknown) => T {
  const bc = new BroadcastChannel(BC_CHANNEL);

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
        top3Manual: state.top3Manual,
        quickTasks: state.quickTasks,
        dailyCompletionLog: state.dailyCompletionLog,
        lifeGoals: state.lifeGoals,
        timelineRoutines: state.timelineRoutines ?? {},
        timelinePanelExpanded: state.timelinePanelExpanded !== false,
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
      } catch (_) {}

      saveLocalState(fullState);

      try {
        bc.postMessage(fullState);
      } catch (_) {}

      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(async () => {
        if (navigator.onLine) {
          // #region agent log
          const _payloadJson = JSON.stringify(fullState);
          const _payloadKb = Math.round(_payloadJson.length / 1024);
          let _t0sync = Date.now();
          fetch('http://127.0.0.1:7646/ingest/71e75ef7-a5d2-4c85-97a5-ec2ed680869f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6bd187'},body:JSON.stringify({sessionId:'6bd187',location:'syncMiddleware.ts:PUT_start',message:'PUT start',data:{payloadKb:_payloadKb,keys:Object.keys(fullState)},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          try {
            await api.training.updateDashboardState(fullState, { timeout: 15_000 });
            // #region agent log
            fetch('http://127.0.0.1:7646/ingest/71e75ef7-a5d2-4c85-97a5-ec2ed680869f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6bd187'},body:JSON.stringify({sessionId:'6bd187',location:'syncMiddleware.ts:PUT_done',message:'PUT done',data:{elapsedMs:Date.now()-_t0sync,payloadKb:_payloadKb},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
            isApplyingFromBC = true;
            set((s: unknown) => ({ ...(s as object), lastSavedAt: Date.now() }));
            setTimeout(() => {
              isApplyingFromBC = false;
            }, 0);
          } catch (err) {
            // #region agent log
            fetch('http://127.0.0.1:7646/ingest/71e75ef7-a5d2-4c85-97a5-ec2ed680869f',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6bd187'},body:JSON.stringify({sessionId:'6bd187',location:'syncMiddleware.ts:PUT_error',message:'PUT error',data:{error:String(err),elapsedMs:Date.now()-_t0sync,payloadKb:_payloadKb},timestamp:Date.now()})}).catch(()=>{});
            // #endregion
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

    bc.onmessage = (e: MessageEvent) => {
      const s = e?.data;
      if (!s || isApplyingFromBC) return;
      isApplyingFromBC = true;
      wrappedSet(s);
      setTimeout(() => {
        isApplyingFromBC = false;
      }, 0);
    };

    return config(wrappedSet, get, api_store);
  };
}
