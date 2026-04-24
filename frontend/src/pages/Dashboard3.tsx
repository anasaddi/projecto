import React from 'react';
import '../components/dashboard3/styles/design-tokens.css';
import { DASHBOARD_CONTENT_CLASS } from '../constants/layout';

import {
  PrayerCountdownV3,
  TimelineV3,
  PomodoroV3,
  Top3V3,
  HabitsV3,
  ProjectsV3,
  QuickTasksV3,
  LifeGoalsV3,
  FocusHeatmapV3,
} from '../components/dashboard3/sections';
import { useDashboardSync } from '../hooks/useDashboardSync';
import { useDashboardStore } from '../store/dashboardStore';
import { TodayCardDashboard } from '../components/dashboard/TodayCardDashboard';

const DEFAULT_SECTION_ORDER = {
  left: ['pomodoro', 'quickTasks', 'focusHeatmap'],
  center: ['top3', 'habits'],
  right: ['projects'],
};

export default function Dashboard3(): React.ReactElement {
  useDashboardSync();
  const sectionOrder = useDashboardStore((s: any) => s.sectionOrder) ?? DEFAULT_SECTION_ORDER;
  const reorderSection = useDashboardStore((s: any) => s.reorderSection);
  const isLoaded = useDashboardStore((s: any) => s.isLoaded);

  const makeDragProps = (column: 'left' | 'center' | 'right', idx: number) => ({
    draggable: true as const,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'section', column, fromIndex: idx }));
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      try {
        const p = JSON.parse(e.dataTransfer.getData('application/json'));
        if (p?.type === 'section' && p.column === column) reorderSection(column, p.fromIndex, idx);
      } catch (_) {}
    },
  });

  const renderSection = (sectionId: string) => {
    if (sectionId === 'pomodoro') return <PomodoroV3 />;
    if (sectionId === 'quickTasks') return <QuickTasksV3 />;
    if (sectionId === 'focusHeatmap') return <FocusHeatmapV3 />;
    if (sectionId === 'top3') return <Top3V3 />;
    if (sectionId === 'habits') return <HabitsV3 />;
    if (sectionId === 'projects') return <ProjectsV3 />;
    return null;
  };

  return (
    <div className="d3-container min-h-full w-full flex flex-col overflow-y-auto font-sans select-none antialiased">
      <div className={`${DASHBOARD_CONTENT_CLASS} flex flex-col gap-3 py-3 md:py-4 flex-1 min-h-0`}>

        {/* Prayers + Countdowns */}
        <PrayerCountdownV3 />

        {/* Timeline */}
        <TimelineV3 />

        {/* Training - Full Width */}
        <TodayCardDashboard defaultExpanded={false} />

        {/* Main columns: 1/4 | 1/4 | 2/4 — mirrors DashboardV2 exactly */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 pb-1">
          {/* Left col: Pomodoro / QuickTasks / FocusHeatmap */}
          <div className="flex flex-col gap-3 min-h-0 lg:w-1/4">
            {(sectionOrder.left || DEFAULT_SECTION_ORDER.left).map((sectionId: string, idx: number) => (
              <div key={sectionId} {...makeDragProps('left', idx)} className="transition-all duration-300">
                {renderSection(sectionId)}
              </div>
            ))}
          </div>

          {/* Center col: Top3 / Habits */}
          <div className="flex flex-col gap-3 min-h-0 lg:w-1/4">
            {(sectionOrder.center || DEFAULT_SECTION_ORDER.center).map((sectionId: string, idx: number) => (
              <div key={sectionId} {...makeDragProps('center', idx)} className="transition-all duration-300">
                {renderSection(sectionId)}
              </div>
            ))}
          </div>

          {/* Right col: Projects (wide) */}
          <div className="flex flex-col gap-3 min-h-0 lg:w-2/4">
            {(sectionOrder.right || DEFAULT_SECTION_ORDER.right).map((sectionId: string, idx: number) => (
              <div key={sectionId} {...makeDragProps('right', idx)} className="transition-all duration-300">
                {renderSection(sectionId)}
              </div>
            ))}
          </div>
        </div>

        {/* Life Goals - full width at bottom */}
        <LifeGoalsV3 />
      </div>
    </div>
  );
}
