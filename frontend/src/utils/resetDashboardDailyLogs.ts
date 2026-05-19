import { saveLocalState, clearAllSyncQueue } from '../db/localDb';
import { cancelPendingSync } from '../store/syncMiddleware';
import { STORAGE_KEY, POMODORO_STORAGE } from '../components/dashboard/DashboardUtils';

/** Set before reload so syncWithServer replaces log dicts instead of mergeByDate. */
export const DASHBOARD_LOGS_RESET_FLAG = 'dashboard_logs_reset';

export async function performDashboardDailyLogsReset(): Promise<void> {
  cancelPendingSync();
  const { useDashboardStore } = await import('../store/dashboardStore');
  useDashboardStore.getState().resetDailyLogs();

  const s = useDashboardStore.getState();
  const cleanState = {
    dailyTaskTemplates: s.dailyTaskTemplates,
    dailyTaskLogs: {},
    projects: s.projects,
    prayerLogs: {},
    top3Manual: s.top3Manual,
    quickTasks: s.quickTasks,
    dailyCompletionLog: {},
    lifeGoals: s.lifeGoals,
    timelineRoutines: {},
    timelinePanelExpanded: s.timelinePanelExpanded,
    todayTrainingExpanded: s.todayTrainingExpanded,
    lockedHabitsCollapsed: s.lockedHabitsCollapsed,
    projectExpandedState: s.projectExpandedState,
    sectionOrder: s.sectionOrder,
    activePomodoroTask: s.activePomodoroTask ?? null,
  };

  await saveLocalState(cleanState);
  await clearAllSyncQueue();
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(POMODORO_STORAGE);

  const { api } = await import('../api/client');
  await api.training.resetDailyLogs();

  sessionStorage.setItem(DASHBOARD_LOGS_RESET_FLAG, '1');
}
