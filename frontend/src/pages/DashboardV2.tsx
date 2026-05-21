import React, { useState, useEffect, useMemo } from 'react';
import { useDashboardStats } from '../context/DashboardStatsContext';
import { useGlobalConfig } from '../context/GlobalConfigContext';
import { useDashboardStore } from '../store/dashboardStore';
import { useFocusMetrics } from '../hooks/useFocusMetrics';

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
import { performDashboardDailyLogsReset } from '../utils/resetDashboardDailyLogs';

import {
  toDateKey,
  startOfDay,
  addDays,
  resolveTop3Slots,
  parseSelectedDate,
} from '../components/dashboard/DashboardUtils';
import { useDashboardSync } from '../hooks/useDashboardSync';
import { DASHBOARD_CONTENT_CLASS } from '../constants/layout';

const PROJECT_ACCENTS = ['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose'];

export default function DashboardV2(): React.ReactElement {
  const dailyTaskTemplates = useDashboardStore((s) => s.dailyTaskTemplates) ?? [];
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
  const selectedDateRaw = useDashboardStore((s) => s.selectedDate);
  const sectionOrder = useDashboardStore((s) => s.sectionOrder) ?? {
    left: ['pomodoro', 'quickTasks', 'focusHeatmap'],
    center: ['top3', 'habits'],
    right: ['projects'],
  };
  const reorderSection = useDashboardStore((s) => s.reorderSection);

  useDashboardSync();

  const { updateStats } = (useDashboardStats() as any) || { updateStats: (_d?: number, _t?: number) => {} };
  const { config } = (useGlobalConfig() as any) || { config: null as any };
  const PRAYERS: string[] = useMemo(() => config?.PRAYERS || ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], [config]);

  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const tick = () => {
      const next = new Date();
      setToday((prev) => (toDateKey(next) !== toDateKey(prev) ? next : prev));
    };
    tick();
    const timer = setInterval(tick, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const todayKey = toDateKey(today);
  // Selected day (may differ from actual today when user navigates past days)
  const selectedDate = useMemo(() => parseSelectedDate(selectedDateRaw, today), [selectedDateRaw, today]);
  const selectedDateKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const isSelectedToday = selectedDateKey === todayKey;
  const viewPrayerLog = useMemo(
    () => (prayerLogs[selectedDateKey] as Record<string, any>) || {},
    [prayerLogs, selectedDateKey]
  );

  const activeHabits = useMemo(() => (dailyTaskTemplates as any[]).filter((t: any) => !t.locked), [dailyTaskTemplates]);

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
    () => (resolveTop3Slots as any)(projects, top3Manual as any[], allQuickTasks, lifeGoals as any, sharedDashboards as any[]),
    [projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards]
  );

  const { doneFocusItems, totalFocusItems } = useFocusMetrics();

  useEffect(() => {
    if (updateStats) updateStats(doneFocusItems, totalFocusItems);
  }, [doneFocusItems, totalFocusItems, updateStats]);

  const confirmId = confirmState && typeof confirmState === 'object' && 'id' in confirmState ? (confirmState as { id: string }).id : undefined;
  const confirmPayload = confirmState && typeof confirmState === 'object' && 'payload' in confirmState ? (confirmState as { payload?: { shareId?: string; projectId?: string; goalId?: string } }).payload : undefined;

  return (
    <div className="min-h-full w-full flex flex-col overflow-y-auto font-sans font-normal select-none selection:bg-indigo-500/30 antialiased bg-white dark:bg-[#0b0e14]">
      {/* Redundant header removed - items moved to Layout and PrayersCountdowns */}

      <div className={`${DASHBOARD_CONTENT_CLASS} flex flex-col gap-5 py-5 md:py-6 flex-1 min-h-0`}>
        <PrayersCountdownsV2 />

        <DailyTimelineWidget2
          PRAYERS={PRAYERS}
          todayKey={selectedDateKey}
          todayPrayerLog={viewPrayerLog}
          togglePrayer={togglePrayer}
          isToday={isSelectedToday}
        />

        {/* Training Section - Full Width */}
        <TodayCardDashboard />

        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 pb-1">
          <div className="order-3 flex flex-col gap-4 min-h-0 lg:order-1 lg:w-1/4">
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
              if (sectionId === 'focusHeatmap') return <div {...sectionProps} className="transition-all duration-300"><FocusHeatmap /></div>;
              return null;
            })}
          </div>
          <div className="order-2 flex flex-col gap-4 min-h-0 lg:order-2 lg:w-1/4">
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
          <div className="order-1 flex flex-col gap-4 min-h-0 lg:order-3 lg:w-2/4">
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

      {/* @ts-expect-error ConfirmModal is JSX, props not inferred in TSX */}
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
                : 'Vuoi resettare solo i log giornalieri (habits, preghiere, completamenti timeline)? Progetti e struttura restano invariati.'
        }
        variant={
          confirmId === 'reset' || confirmId === 'deleteProject' || confirmId === 'deleteGoal' || confirmId === 'deleteShared'
            ? 'danger'
            : 'default'
        }
        onConfirm={async () => {
          if (confirmId === 'deleteShared' && confirmPayload?.shareId && confirmPayload?.projectId) {
            deleteSharedDashboardProject(confirmPayload.shareId, confirmPayload.projectId);
          } else if (confirmId === 'deleteGoal' && confirmPayload?.goalId) {
            deleteGoal(confirmPayload.goalId);
          } else if (confirmId === 'deleteProject' && confirmPayload?.projectId) {
            deleteProject(confirmPayload.projectId);
          } else if (confirmId === 'reset') {
            try {
              await performDashboardDailyLogsReset();
              window.location.reload();
            } catch (err) {
              console.error('Dashboard reset failed:', err);
            }
          }
          setConfirmState(null);
        }}
        onCancel={() => setConfirmState(null)}
      />

      <DayNavigationButtons />
    </div>
  );
}
