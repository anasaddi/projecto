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
  const sectionOrder = useDashboardStore((s) => s.sectionOrder) ?? {
    left: ['pomodoro', 'quickTasks', 'focusHeatmap'],
    center: ['top3', 'habits'],
    right: ['projects'],
  };
  const reorderSection = useDashboardStore((s) => s.reorderSection);

  useDashboardSync();
  useNotificationReminders();

  const { updateStats } = useDashboardStats() || { updateStats: () => {} };
  const { config } = useGlobalConfig() || { config: null };
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

  const todayKey = toDateKey(today);
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
  const top3DoneCount = useMemo(
    () => (top3Resolved as any[]).filter((s: any) => s && !s.missing && s.done).length,
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
    ] as any[];
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
      const habitsDone = (activeHabits as any[]).reduce((acc: number, t: any) => acc + (taskLogMap[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc: number, p: string) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      if (score >= 0.8) s++;
      else break;
    }
    return s;
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, today, PRAYERS]);

  const confirmId = confirmState && typeof confirmState === 'object' && 'id' in confirmState ? (confirmState as { id: string }).id : undefined;
  const confirmPayload = confirmState && typeof confirmState === 'object' && 'payload' in confirmState ? (confirmState as { payload?: { shareId?: string; projectId?: string; goalId?: string } }).payload : undefined;

  return (
    <div className="min-h-full w-full flex flex-col overflow-y-auto font-sans font-normal select-none selection:bg-indigo-500/30 antialiased bg-white dark:bg-[#0b0e14] relative">
      {/* Subtle grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiLz4KPC9zdmc+')] dark:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')] z-0" />
      
      {/* Redundant header removed - items moved to Layout and PrayersCountdowns */}

      <div className={`${DASHBOARD_CONTENT_CLASS} flex flex-col gap-5 py-5 md:py-6 flex-1 min-h-0 relative z-10`}>
        <PrayersCountdownsV2
          todayPrayerLog={todayPrayerLog}
          togglePrayer={togglePrayer}
          PRAYERS={PRAYERS}
          countdowns={countdowns as { label: string; remaining: string; pct: number }[]}
          todayFocusScore={todayFocusScore}
          focusStreak={focusStreak}
        />

        <DailyTimelineWidget2 PRAYERS={PRAYERS} todayKey={todayKey} todayPrayerLog={todayPrayerLog} togglePrayer={togglePrayer} />

        {/* Training Section - Full Width */}
        <TodayCardDashboard />

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 pb-1">
          <div className="flex flex-col gap-4 min-h-0 lg:w-1/4">
            {(sectionOrder.left || ['pomodoro', 'quickTasks', 'focusHeatmap']).map((sectionId: string, idx: number) => {
              const sectionProps = {
                key: sectionId,
                draggable: true,
                onDragStart: (e: React.DragEvent) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'section', column: 'left', fromIndex: idx }));
                  e.dataTransfer.effectAllowed = 'move';
                },
                onDragOver: (e: React.DragEvent) => e.preventDefault(),
                onDrop: (e: React.DragEvent) => {
                  try {
                    const p = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (p.type === 'section' && p.column === 'left') reorderSection('left', p.fromIndex, idx);
                  } catch (_) {}
                },
              };
              if (sectionId === 'pomodoro') return <div {...sectionProps} className="transition-all duration-300"><PomodoroCompact /></div>;
              if (sectionId === 'quickTasks') return <div {...sectionProps} className="transition-all duration-300">{isLoaded ? <QuickTasksSectionV2 /> : <QuickTaskSkeleton />}</div>;
              if (sectionId === 'focusHeatmap') return <div {...sectionProps} className="transition-all duration-300"><FocusHeatmap dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} now={now} /></div>;
              return null;
            })}
          </div>
          <div className="flex flex-col gap-4 min-h-0 lg:w-1/4">
            {(sectionOrder.center || ['top3', 'habits']).map((sectionId: string, idx: number) => {
              const sectionProps = {
                key: sectionId,
                draggable: true,
                onDragStart: (e: React.DragEvent) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'section', column: 'center', fromIndex: idx }));
                  e.dataTransfer.effectAllowed = 'move';
                },
                onDragOver: (e: React.DragEvent) => e.preventDefault(),
                onDrop: (e: React.DragEvent) => {
                  try {
                    const p = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (p.type === 'section' && p.column === 'center') reorderSection('center', p.fromIndex, idx);
                  } catch (_) {}
                },
              };
              if (sectionId === 'top3') return <div {...sectionProps} className="transition-all duration-300">{isLoaded ? <Top3SectionV2 /> : <Top3Skeleton />}</div>;
              if (sectionId === 'habits') return <div {...sectionProps} className="transition-all duration-300">{isLoaded ? <HabitsSection /> : <HabitSkeleton />}</div>;
              return null;
            })}
          </div>
          <div className="flex flex-col gap-4 min-h-0 lg:w-2/4">
            {(sectionOrder.right || ['projects']).map((sectionId: string, idx: number) => {
              const sectionProps = {
                key: sectionId,
                draggable: true,
                onDragStart: (e: React.DragEvent) => {
                  e.dataTransfer.setData('application/json', JSON.stringify({ type: 'section', column: 'right', fromIndex: idx }));
                  e.dataTransfer.effectAllowed = 'move';
                },
                onDragOver: (e: React.DragEvent) => e.preventDefault(),
                onDrop: (e: React.DragEvent) => {
                  try {
                    const p = JSON.parse(e.dataTransfer.getData('application/json'));
                    if (p.type === 'section' && p.column === 'right') reorderSection('right', p.fromIndex, idx);
                  } catch (_) {}
                },
              };
              if (sectionId === 'projects') return <div {...sectionProps} className="transition-all duration-300">{isLoaded ? <ProjectsSectionV2 PROJECT_ACCENTS={PROJECT_ACCENTS} /> : <ProjectSkeleton />}</div>;
              return null;
            })}
          </div>
        </div>

        <LifeGoalsSection />
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
    </div>
  );
}
