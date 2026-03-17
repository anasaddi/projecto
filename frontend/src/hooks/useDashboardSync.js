import { useEffect, useRef } from 'react';
import { api } from '../api/client';
import { STORAGE_KEY, BC_CHANNEL } from '../components/dashboard/DashboardUtils';

/**
 * Syncs dashboard state to localStorage, BroadcastChannel (cross-tab), and DB.
 * Also subscribes to BC for updates from other tabs.
 */
export function useDashboardSync(
  isLoaded,
  setLastSavedAt,
  setters,
  dailyTaskTemplates,
  dailyTaskLogs,
  projects,
  prayerLogs,
  top3Manual,
  quickTasks,
  dailyCompletionLog,
  lifeGoals
) {
  const syncTimeoutRef = useRef(null);
  const applyingFromBCRef = useRef(false);

  useEffect(() => {
    if (!isLoaded) return;
    const fullState = {
      dailyTaskTemplates,
      dailyTaskLogs,
      projects,
      projectOrder: Array.isArray(projects) ? projects.map((p) => p.id) : [],
      prayerLogs,
      top3Manual,
      quickTasks,
      dailyCompletionLog,
      lifeGoals,
    };
    const skipBroadcast = applyingFromBCRef.current;
    if (applyingFromBCRef.current) applyingFromBCRef.current = false;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fullState));
    } catch (_) {}

    if (!skipBroadcast) {
      try {
        const bc = new BroadcastChannel(BC_CHANNEL);
        bc.postMessage(fullState);
        bc.close();
      } catch (_) {}
    }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      try {
        await api.training.updateDashboardState(fullState);
        setLastSavedAt?.(Date.now());
      } catch (err) {
        console.error('Failed to sync dashboard to DB:', err);
      }
    }, 500);
  }, [isLoaded, setLastSavedAt, dailyTaskTemplates, dailyTaskLogs, projects, prayerLogs, top3Manual, quickTasks, dailyCompletionLog, lifeGoals]);

  const settersRef = useRef(setters);
  settersRef.current = setters;

  useEffect(() => {
    if (!isLoaded || !setters) return;
    const bc = new BroadcastChannel(BC_CHANNEL);
    bc.onmessage = (e) => {
      const s = e?.data;
      const set = settersRef.current;
      if (!s || !set || applyingFromBCRef.current) return;
      applyingFromBCRef.current = true;
      if (Array.isArray(s.dailyTaskTemplates)) set.setDailyTaskTemplates(s.dailyTaskTemplates);
      if (s.dailyTaskLogs && typeof s.dailyTaskLogs === 'object') set.setDailyTaskLogs(s.dailyTaskLogs);
      if (Array.isArray(s.projects)) set.setProjects(s.projects);
      if (s.prayerLogs && typeof s.prayerLogs === 'object') set.setPrayerLogs(s.prayerLogs);
      if (Array.isArray(s.top3Manual)) set.setTop3Manual(s.top3Manual);
      if (Array.isArray(s.quickTasks)) set.setQuickTasks(s.quickTasks);
      if (s.dailyCompletionLog && typeof s.dailyCompletionLog === 'object') set.setDailyCompletionLog(s.dailyCompletionLog);
      if (s.lifeGoals) set.setLifeGoals(s.lifeGoals);
    };
    return () => bc.close();
  }, [isLoaded]);
}
