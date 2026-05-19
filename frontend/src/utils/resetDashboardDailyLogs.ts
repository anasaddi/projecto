import { saveLocalState, clearAllSyncQueue } from '../db/localDb';
import { cancelPendingSync } from '../store/syncMiddleware';
import { STORAGE_KEY, POMODORO_STORAGE } from '../components/dashboard/DashboardUtils';
import { agentDebugLog, sampleMayDayLogs } from './agentDebugLog';

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

  // #region agent log
  agentDebugLog('resetDashboardDailyLogs.ts', 'local caches cleared', {
    localStorageCleared: !localStorage.getItem(STORAGE_KEY),
    storeMay: {
      prayer: sampleMayDayLogs(cleanState.prayerLogs),
      habits: sampleMayDayLogs(cleanState.dailyTaskLogs),
      completion: sampleMayDayLogs(cleanState.dailyCompletionLog),
    },
  }, 'A', 'post-fix');
  // #endregion

  const { api } = await import('../api/client');
  const resetRes = await api.training.resetDailyLogs();

  // #region agent log
  agentDebugLog('resetDashboardDailyLogs.ts', 'backend reset response', {
    serverMay: {
      prayer: sampleMayDayLogs(resetRes?.data?.prayerLogs ?? resetRes?.prayerLogs),
      habits: sampleMayDayLogs(resetRes?.data?.dailyTaskLogs ?? resetRes?.dailyTaskLogs),
      completion: sampleMayDayLogs(resetRes?.data?.dailyCompletionLog ?? resetRes?.dailyCompletionLog),
    },
    resetOk: !!resetRes,
  }, 'C', 'post-fix');
  // #endregion

  sessionStorage.setItem(DASHBOARD_LOGS_RESET_FLAG, '1');
}
