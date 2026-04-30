import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardStats } from '../context/DashboardStatsContext';
import { useGlobalConfig } from '../context/GlobalConfigContext';
import { useDashboardStore } from '../store/dashboardStore';
import { useNotificationReminders } from '../hooks/useNotificationReminders';

import { PomodoroCompact } from '../components/dashboard/PomodoroCompact';
import { FocusHeatmap } from '../components/dashboard/FocusHeatmap';
import { PrayersCountdownsV2 } from '../components/dashboard/PrayersCountdownsV2';
import { DailyTimelineWidget2 } from '../components/dashboard/DailyTimelineWidget2';
import { QuickTasksSectionV2 } from '../components/dashboard/QuickTasksSectionV2';
import { Top3SectionV2 } from '../components/dashboard/Top3SectionV2';
import { HabitsSection } from '../components/dashboard/HabitsSection';
import { ProjectsSectionV2 } from '../components/dashboard/ProjectsSectionV2';
import { LifeGoalsSection } from '../components/dashboard/LifeGoalsSection';
import { TodayCardDashboard } from '../components/dashboard/TodayCardDashboard';
import { DayNavigationButtons } from '../components/dashboard/DayNavigationButtons';
import { ConfirmModal } from '../components/ConfirmModal';
import { HabitSkeleton, ProjectSkeleton, Top3Skeleton, QuickTaskSkeleton } from '../components/dashboard/SkeletonSection';

import {
  STORAGE_KEY,
  toDateKey,
  startOfDay,
  addDays,
  startOfWeek,
  startOfMonth,
  formatCountdown,
  resolveTop3Slots,
  POMODORO_STORAGE,
} from '../components/dashboard/DashboardUtils';
import { useDashboardSync } from '../hooks/useDashboardSync';
import { DASHBOARD_CONTENT_CLASS } from '../constants/layout';

const PROJECT_ACCENTS = ['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose'];
const ConfirmModalComponent = ConfirmModal as unknown as React.ComponentType<any>;

export default function DashboardV2(): React.ReactElement {
  const dailyTaskTemplates = useDashboardStore((s) => s.dailyTaskTemplates) ?? [];
  const dailyTaskLogs = useDashboardStore((s) => s.dailyTaskLogs) ?? {};
  const projects = useDashboardStore((s) => s.projects) ?? [];
  const prayerLogs = useDashboardStore((s) => s.prayerLogs) ?? {};
  const top3Manual = useDashboardStore((s) => s.top3Manual) ?? [null, null, null];
  const quickTasks = useDashboardStore((s) => s.quickTasks) ?? [];
  const dailyCompletionLog = useDashboardStore((s) => s.dailyCompletionLog) ?? {};
  const lifeGoals = useDashboardStore((s) => s.lifeGoals) ?? { tiers: [] };
  const sharedDashboards = useDashboardStore((s) => s.sharedDashboards) ?? [];
  const isLoaded = useDashboardStore((s) => s.isLoaded);
  const lastSavedAt = useDashboardStore((s) => s.lastSavedAt);
  const confirmState = useDashboardStore((s) => s.confirmState);
  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const setSelectedDate = useDashboardStore((s) => s.setSelectedDate);
  const setIsLoaded = useDashboardStore((s) => s.setIsLoaded);
  const setLastSavedAt = useDashboardStore((s) => s.setLastSavedAt);
  const setConfirmState = useDashboardStore((s) => s.setConfirmState);
  const deleteProject = useDashboardStore((s) => s.deleteProject);
  const deleteGoal = useDashboardStore((s) => s.deleteGoal);
  const deleteSharedDashboardProject = useDashboardStore((s) => s.deleteSharedDashboardProject);
  const togglePrayer = useDashboardStore((s) => s.togglePrayer);
  useDashboardSync();
  // useNotificationReminders(); // TODO: Fix infinite loop

  const dashboardStats = useDashboardStats() as { updateStats?: (done: number, total: number) => void } | null;
  const updateStats = dashboardStats?.updateStats;
  const globalConfig = useGlobalConfig() as { config?: { PRAYERS?: string[] } } | null;
  const config = globalConfig?.config;
  const PRAYERS = useMemo(() => config?.PRAYERS || ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], [config]);

  const [now, setNow] = useState(new Date());
  // Track "today" separately so streak/habits don't recalculate every second
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      const next = new Date();
      setNow(next);
      // Only update "today" when the date actually changes (not every second)
      if (toDateKey(next) !== toDateKey(today)) {
        setToday(next);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [today]);

  const todayKey = toDateKey(selectedDate);
  const todayTaskLog = useMemo(() => {
    const logs = (dailyTaskLogs[todayKey] as { id: string; done: boolean }[]) || [];
    const map: Record<string, boolean> = {};
    logs.forEach((l) => (map[l.id] = l.done));
    return map;
  }, [dailyTaskLogs, todayKey]);
  const todayPrayerLog = (prayerLogs[todayKey] as Record<string, boolean>) || {};

  const activeHabits = useMemo(() => (dailyTaskTemplates as any[]).filter((t: any) => !t.locked), [dailyTaskTemplates]);
  const todayDone = useMemo(
    () => (activeHabits as any[]).reduce((acc: number, t: any) => acc + (todayTaskLog[t.id] ? 1 : 0), 0),
    [activeHabits, todayTaskLog]
  );
  const prayerDone = useMemo(
    () => PRAYERS.reduce((acc: number, p: string) => acc + (todayPrayerLog[p] ? 1 : 0), 0),
    [PRAYERS, todayPrayerLog]
  );

  const allQuickTasks = useMemo(() => {
    const local = (quickTasks as any[]).filter((t: any) => !t.parentId).map((t: any) => ({ ...t, shareId: null }));
    const fromShared = (sharedDashboards as any[]).flatMap((sd: any) => {
      const list = Array.isArray((sd.data || {}).quickTasks) ? (sd.data as { quickTasks: unknown[] }).quickTasks : [];
      return list
        .filter((t: any) => !t.parentId)
        .map((t: any) => ({ ...t, shareId: sd.share_id, sharedTitle: sd.title }));
    });
    return [...local, ...fromShared];
  }, [quickTasks, sharedDashboards]);

  const top3Resolved = useMemo(
    () => resolveTop3Slots(projects, top3Manual as any[], allQuickTasks, lifeGoals as any, sharedDashboards as any[]),
    [projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards]
  );
  
  const isToday = toDateKey(selectedDate) === toDateKey(today);

  const top3DoneCount = useMemo(
    () => (top3Resolved as any[]).filter((s: any) => s && !s.missing && s.done).length,
    [top3Resolved]
  );
  const totalFocusItems = activeHabits.length + PRAYERS.length + 3;
  const doneFocusItems = todayDone + prayerDone + top3DoneCount;

  useEffect(() => {
    if (updateStats) updateStats(doneFocusItems, totalFocusItems);
  }, [doneFocusItems, totalFocusItems, updateStats]);

  const confirmId = confirmState && typeof confirmState === 'object' && 'id' in confirmState ? (confirmState as { id: string }).id : undefined;
  const confirmPayload = confirmState && typeof confirmState === 'object' && 'payload' in confirmState ? (confirmState as { payload?: { shareId?: string; projectId?: string; goalId?: string } }).payload : undefined;

  return (
    <div className="min-h-full w-full flex flex-col overflow-y-auto font-sans font-normal select-none selection:bg-indigo-500/30 antialiased bg-white dark:bg-[#0b0e14] relative">
      {/* Subtle grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz4KPC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')] z-0" />
      
      {/* Day Navigation Component */}
      <DayNavigationButtons />
      
      <div className={`${DASHBOARD_CONTENT_CLASS} flex flex-col gap-4 py-4 pb-[calc(6rem+env(safe-area-inset-bottom))] md:gap-5 md:pb-6 md:py-6 flex-1 min-h-0 relative z-10`}>
        <PrayersCountdownsV2 />

        <DailyTimelineWidget2 PRAYERS={PRAYERS} todayKey={todayKey} todayPrayerLog={todayPrayerLog} togglePrayer={togglePrayer} isToday={isToday} />

        {/* Training Section - Full Width */}
        <TodayCardDashboard />

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 pb-1 md:gap-4">
          <div className="flex flex-col gap-4 min-h-0 lg:w-1/4">
            <PomodoroCompact />
            {isLoaded ? <QuickTasksSectionV2 /> : <QuickTaskSkeleton />}
            <FocusHeatmap dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
          <div className="flex flex-col gap-4 min-h-0 lg:w-1/4">
            {isLoaded ? <Top3SectionV2 /> : <Top3Skeleton />}
            {isLoaded ? <HabitsSection /> : <HabitSkeleton />}
          </div>
          <div className="flex flex-col gap-4 min-h-0 lg:w-2/4">
            {isLoaded ? <ProjectsSectionV2 PROJECT_ACCENTS={PROJECT_ACCENTS} /> : <ProjectSkeleton />}
          </div>
        </div>

        <LifeGoalsSection />
      </div>

      <ConfirmModalComponent
        open={!!confirmState}
        title={
          confirmId === 'deleteShared'
            ? 'Elimina progetto condiviso'
            : confirmId === 'deleteGoal'
              ? 'Elimina obiettivo'
              : confirmId === 'deleteProject'
                ? 'Elimina progetto'
                : 'Reset dashboard'
        }
        message={
          confirmId === 'deleteShared'
            ? 'Sei sicuro di voler eliminare questo progetto condiviso?'
            : confirmId === 'deleteGoal'
              ? 'Sei sicuro di voler eliminare questo obiettivo?'
              : confirmId === 'deleteProject'
                ? 'Il progetto e tutti i suoi task verranno eliminati. Questa azione non si può annullare.'
                : 'Azzerare tutto? Verranno eliminati progetti, task, abitudini e dati della dashboard. Ricarica la pagina.'
        }
        variant={
          confirmId === 'reset' || confirmId === 'deleteProject' || confirmId === 'deleteGoal' || confirmId === 'deleteShared'
            ? 'danger'
            : 'default'
        }
        onConfirm={() => {
          if (confirmId === 'deleteShared' && confirmPayload?.shareId && confirmPayload?.projectId) {
            deleteSharedDashboardProject(confirmPayload.shareId, confirmPayload.projectId);
          } else if (confirmId === 'deleteGoal' && confirmPayload?.goalId) {
            deleteGoal(confirmPayload.goalId);
          } else if (confirmId === 'deleteProject' && confirmPayload?.projectId) {
            deleteProject(confirmPayload.projectId);
          } else if (confirmId === 'reset') {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(POMODORO_STORAGE);
            window.location.reload();
          }
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />
    </div>
  );
}
