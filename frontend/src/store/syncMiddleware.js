import { api } from '../api/client';
import { STORAGE_KEY, BC_CHANNEL } from '../components/dashboard/DashboardUtils';
import { saveLocalState, addToSyncQueue, getSyncQueue, clearSyncQueue } from '../db/localDb';

let syncTimeout = null;
let isApplyingFromBC = false;

// Handle reconnection
if (typeof window !== 'undefined') {
  window.addEventListener('online', async () => {
    const queue = await getSyncQueue();
    if (queue.length > 0) {
      console.log('Reconnected! Flushing sync queue...');
      // To simplify, we only sync the latest state if we have multiple updates
      const dashboardUpdates = queue.filter(i => i.type === 'dashboard_update');
      if (dashboardUpdates.length > 0) {
        const latest = dashboardUpdates.sort((a, b) => b.timestamp - a.timestamp)[0];
        try {
          await api.training.updateDashboardState(latest.data);
          console.log('Sync queue flushed successfully');
        } catch (err) {
          console.error('Failed to flush sync queue:', err);
        }
      }
      await clearSyncQueue(queue.map(i => i.id));
    }
  });
}

/**
 * Zustand middleware for handling multi-layer sync:
 * 1. IndexedDB / Dexie (instant)
 * 2. BroadcastChannel (instant cross-tab)
 * 3. REST API or Sync Queue (debounced 500ms)
 */
export const syncMiddleware = (config) => (set, get, api_store) => {
  const bc = new BroadcastChannel(BC_CHANNEL);
  
  bc.onmessage = (e) => {
    const s = e?.data;
    if (!s || isApplyingFromBC) return;
    
    isApplyingFromBC = true;
    set(s);
    setTimeout(() => { isApplyingFromBC = false; }, 0);
  };

  return config(
    (args) => {
      set(args);
      
      const state = get();
      if (!state.isLoaded || isApplyingFromBC) return;

      const fullState = {
        dailyTaskTemplates: state.dailyTaskTemplates,
        dailyTaskLogs: state.dailyTaskLogs,
        projects: state.projects,
        projectOrder: Array.isArray(state.projects) ? state.projects.map((p) => p.id) : [],
        prayerLogs: state.prayerLogs,
        top3Manual: state.top3Manual,
        quickTasks: state.quickTasks,
        dailyCompletionLog: state.dailyCompletionLog,
        lifeGoals: state.lifeGoals,
        timelineRoutines: state.timelineRoutines ?? {},
      };

      // 1. localStorage — usato da loadState() al reload, deve essere aggiornato sempre
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
      } catch (_) {}

      // 2. IndexedDB (Dexie) - backup / sync queue
      saveLocalState(fullState);

      // 3. BroadcastChannel - Cross-tab sync
      try {
        bc.postMessage(fullState);
      } catch (_) {}

      // 4. REST API (Debounced) with offline fallback
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(async () => {
        if (navigator.onLine) {
          try {
            await api.training.updateDashboardState(fullState, { timeout: 15_000 });
            isApplyingFromBC = true;
            set((s) => ({ ...s, lastSavedAt: Date.now() }));
            setTimeout(() => { isApplyingFromBC = false; }, 0);
          } catch (err) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('Sync to server failed (using local queue):', err?.message || err);
            }
            await addToSyncQueue('dashboard_update', fullState);
          }
        } else {
          await addToSyncQueue('dashboard_update', fullState);
        }
      }, 500);
    },
    get,
    api_store
  );
};
