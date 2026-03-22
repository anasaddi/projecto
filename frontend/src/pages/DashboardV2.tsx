import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardStats } from '../context/DashboardStatsContext';
import { useGlobalConfig } from '../context/GlobalConfigContext';
import { useDashboardStore } from '../store/dashboardStore';

import { Icons } from '../components/dashboard/Icons';
import { PomodoroCompact } from '../components/dashboard/PomodoroCompact';
import { FocusHeatmap } from '../components/dashboard/FocusHeatmap';
import { PrayersCountdowns } from '../components/dashboard/PrayersCountdowns';
import { DailyTimelineWidget2 } from '../components/dashboard/DailyTimelineWidget2';
import { QuickTasksSection } from '../components/dashboard/QuickTasksSection';
import { Top3Section } from '../components/dashboard/Top3Section';
import { HabitsSection } from '../components/dashboard/HabitsSection';
import { ProjectsSection } from '../components/dashboard/ProjectsSection';
import { LifeGoalsSection } from '../components/dashboard/LifeGoalsSection';
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

const PROJECT_ACCENTS = ['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose'];

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
  const setIsLoaded = useDashboardStore((s) => s.setIsLoaded);
  const setLastSavedAt = useDashboardStore((s) => s.setLastSavedAt);
  const setConfirmState = useDashboardStore((s) => s.setConfirmState);
  const deleteProject = useDashboardStore((s) => s.deleteProject);
  const deleteGoal = useDashboardStore((s) => s.deleteGoal);
  const deleteSharedDashboardProject = useDashboardStore((s) => s.deleteSharedDashboardProject);
  const togglePrayer = useDashboardStore((s) => s.togglePrayer);

  useDashboardSync();

  const { updateStats } = useDashboardStats() || { updateStats: () => {} };
  const { config } = useGlobalConfig();
  const PRAYERS = useMemo(() => config?.PRAYERS || ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], [config]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = toDateKey(now);
  const todayTaskLog = useMemo(() => {
    const logs = (dailyTaskLogs[todayKey] as { id: string; done: boolean }[]) || [];
    const map: Record<string, boolean> = {};
    logs.forEach((l) => (map[l.id] = l.done));
    return map;
  }, [dailyTaskLogs, todayKey]);
  const todayPrayerLog = (prayerLogs[todayKey] as Record<string, boolean>) || {};

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const todayDone = useMemo(
    () => activeHabits.reduce((acc, t) => acc + (todayTaskLog[t.id] ? 1 : 0), 0),
    [activeHabits, todayTaskLog]
  );
  const prayerDone = useMemo(
    () => PRAYERS.reduce((acc, p) => acc + (todayPrayerLog[p] ? 1 : 0), 0),
    [PRAYERS, todayPrayerLog]
  );

  const allQuickTasks = useMemo(() => {
    const local = quickTasks.filter((t) => !t.parentId).map((t) => ({ ...t, shareId: null }));
    const fromShared = sharedDashboards.flatMap((sd) => {
      const list = Array.isArray((sd.data || {}).quickTasks) ? (sd.data as { quickTasks: unknown[] }).quickTasks : [];
      return list
        .filter((t: { parentId?: string }) => !t.parentId)
        .map((t: unknown) => ({ ...t, shareId: sd.share_id, sharedTitle: sd.title }));
    });
    return [...local, ...fromShared];
  }, [quickTasks, sharedDashboards]);

  const top3Resolved = useMemo(
    () => resolveTop3Slots(projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards),
    [projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards]
  );
  const top3DoneCount = useMemo(
    () => top3Resolved.filter((s) => s && !s.missing && s.done).length,
    [top3Resolved]
  );

  const totalFocusItems = activeHabits.length + PRAYERS.length + 3;
  const doneFocusItems = todayDone + prayerDone + top3DoneCount;
  const todayFocusScore = totalFocusItems ? doneFocusItems / totalFocusItems : 0;

  useEffect(() => {
    if (updateStats) updateStats(doneFocusItems, totalFocusItems);
  }, [doneFocusItems, totalFocusItems, updateStats]);

  // lastSavedAt is now handled in Layout.tsx

  const countdowns = useMemo(() => {
    const n = new Date(now);
    const eod = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    const eow = addDays(startOfWeek(n), 7);
    const eom = new Date(n.getFullYear(), n.getMonth() + 1, 1);
    return [
      {
        label: 'Day',
        remaining: formatCountdown(eod.getTime() - n.getTime()),
        pct: (n.getTime() - startOfDay(n).getTime()) / (eod.getTime() - startOfDay(n).getTime()),
      },
      {
        label: 'Week',
        remaining: formatCountdown(eow.getTime() - n.getTime()),
        pct: (n.getTime() - startOfWeek(n).getTime()) / (eow.getTime() - startOfWeek(n).getTime()),
      },
      {
        label: 'Month',
        remaining: formatCountdown(eom.getTime() - n.getTime()),
        pct: (n.getTime() - startOfMonth(n).getTime()) / (eom.getTime() - startOfMonth(n).getTime()),
      },
    ];
  }, [now]);

  const focusStreak = useMemo(() => {
    const totalItems = activeHabits.length + PRAYERS.length + 3;
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = (dailyTaskLogs[key] as { id: string; done: boolean }[]) || [];
      const taskLogMap: Record<string, boolean> = {};
      taskLog.forEach((l) => (taskLogMap[l.id] = l.done));
      const prayerLog = (prayerLogs[key] as Record<string, boolean>) || {};
      const cl = (dailyCompletionLog[key] as { quick?: string[]; project?: string[] }) || {
        quick: [],
        project: [],
      };
      const habitsDone = activeHabits.reduce((acc, t) => acc + (taskLogMap[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc, p) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      if (score >= 0.8) s++;
      else break;
    }
    return s;
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now, PRAYERS]);

  const confirmId = confirmState && typeof confirmState === 'object' && 'id' in confirmState ? (confirmState as { id: string }).id : undefined;
  const confirmPayload = confirmState && typeof confirmState === 'object' && 'payload' in confirmState ? (confirmState as { payload?: { shareId?: string; projectId?: string; goalId?: string } }).payload : undefined;

  return (
    <div className="min-h-full w-full flex flex-col overflow-y-auto overflow-x-hidden font-sans font-normal select-none selection:bg-indigo-500/30 antialiased bg-white dark:bg-[#0b0e14]">
      {/* Redundant header removed - items moved to Layout and PrayersCountdowns */}

      <PrayersCountdowns 
        todayPrayerLog={todayPrayerLog} 
        togglePrayer={togglePrayer} 
        PRAYERS={PRAYERS} 
        countdowns={countdowns} 
        todayFocusScore={todayFocusScore}
        focusStreak={focusStreak}
        onReset={() => setConfirmState({ id: 'reset' })}
        now={now}
      />

      <DailyTimelineWidget2 PRAYERS={PRAYERS} todayKey={todayKey} todayPrayerLog={todayPrayerLog} togglePrayer={togglePrayer} />

      <div className="flex-1 min-h-0 px-6 pt-3 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 overflow-x-hidden overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col gap-4 min-h-0 lg:col-span-3">
          <PomodoroCompact />
          {isLoaded ? <QuickTasksSection /> : <QuickTaskSkeleton />}
          <FocusHeatmap
            dailyTaskLogs={dailyTaskLogs}
            prayerLogs={prayerLogs}
            dailyCompletionLog={dailyCompletionLog}
            activeHabits={activeHabits}
            now={now}
          />
        </div>
        <div className="flex flex-col gap-4 min-h-0 lg:col-span-3">
          {isLoaded ? <Top3Section /> : <Top3Skeleton />}
          {isLoaded ? <HabitsSection /> : <HabitSkeleton />}
        </div>
        {isLoaded ? <ProjectsSection PROJECT_ACCENTS={PROJECT_ACCENTS} /> : <ProjectSkeleton />}
      </div>

      <ConfirmModal
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

      <LifeGoalsSection />
    </div>
  );
}
