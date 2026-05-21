import { useMemo } from 'react';
import { useDashboardStore } from '../store/dashboardStore';
import { computeFocusMetrics } from '../utils/focusMetrics';

export function useFocusMetrics() {
  const dailyTaskTemplates = useDashboardStore((s) => s.dailyTaskTemplates) ?? [];
  const dailyTaskLogs = useDashboardStore((s) => s.dailyTaskLogs) ?? {};
  const prayerLogs = useDashboardStore((s) => s.prayerLogs) ?? {};
  const dailyCompletionLog = useDashboardStore((s) => s.dailyCompletionLog) ?? {};

  return useMemo(
    () =>
      computeFocusMetrics({
        dailyTaskTemplates,
        dailyTaskLogs,
        prayerLogs,
        dailyCompletionLog,
      }),
    [dailyTaskTemplates, dailyTaskLogs, prayerLogs, dailyCompletionLog]
  );
}
