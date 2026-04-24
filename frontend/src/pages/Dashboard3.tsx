import React, { Suspense, useEffect, useMemo, useState } from 'react';
import '../components/dashboard3/styles/design-tokens.css';

import {
  PrayerCountdownV3,
  StatsMiniV3,
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
const TodayCardDashboard = React.lazy(() =>
  import('../components/dashboard/TodayCardDashboard').then((mod) => ({ default: mod.TodayCardDashboard }))
);

const DEFAULT_SECTION_ORDER = {
  left: ['pomodoro', 'quickTasks', 'focusHeatmap'],
  center: ['top3', 'habits'],
  right: ['projects'],
};

export default function Dashboard3(): React.ReactElement {
  useDashboardSync();
  const sectionOrder = useDashboardStore((s: any) => s.sectionOrder) ?? DEFAULT_SECTION_ORDER;
  const reorderSection = useDashboardStore((s: any) => s.reorderSection);

  const [now, setNow] = useState(() => new Date());
  const [canDragSections, setCanDragSections] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(pointer: fine)');
    const update = () => setCanDragSections(query.matches);
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }, []);

  const greeting = useMemo(() => {
    const hour = now.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, [now]);

  const dateFormatted = useMemo(() => {
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [now]);

  const renderSection = (sectionId: string) => {
    if (sectionId === 'pomodoro') return <PomodoroV3 />;
    if (sectionId === 'quickTasks') return <QuickTasksV3 />;
    if (sectionId === 'focusHeatmap') return <FocusHeatmapV3 />;
    if (sectionId === 'top3') return <Top3V3 />;
    if (sectionId === 'habits') return <HabitsV3 />;
    if (sectionId === 'projects') return <ProjectsV3 />;
    return null;
  };

  const renderColumn = (column: 'left' | 'center' | 'right') => {
    const sections = (sectionOrder[column] || DEFAULT_SECTION_ORDER[column]) as string[];
    return sections.map((sectionId, idx) => (
      <div
        key={`${column}-${sectionId}`}
        draggable={canDragSections}
        onDragStart={canDragSections ? (e) => {
          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'section', column, fromIndex: idx }));
          e.dataTransfer.effectAllowed = 'move';
        } : undefined}
        onDragOver={canDragSections ? (e) => e.preventDefault() : undefined}
        onDrop={canDragSections ? (e) => {
          try {
            const payload = JSON.parse(e.dataTransfer.getData('application/json'));
            if (payload?.type === 'section' && payload.column === column) {
              reorderSection(column, payload.fromIndex, idx);
            }
          } catch {
            // ignore malformed drag payloads
          }
        } : undefined}
        className="transition-all duration-300 min-h-[260px] md:min-h-[360px]"
      >
        {renderSection(sectionId)}
      </div>
    ));
  };

  return (
    <div className="d3-container min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--d3-text)]">{greeting}</h1>
          <p className="text-[var(--d3-text-muted)] mt-1">{dateFormatted}</p>
        </header>

        {/* Stats Row */}
        <section className="mb-6">
          <StatsMiniV3 />
        </section>

        {/* Prayer Countdown */}
        <section className="mb-6">
          <PrayerCountdownV3 />
        </section>

        {/* Timeline */}
        <section className="mb-6">
          <TimelineV3 />
        </section>

        {/* Training */}
        <section className="mb-6">
          <Suspense
            fallback={
              <div className="rounded-[var(--d3-radius-lg)] border border-[var(--d3-border)] bg-[var(--d3-surface)] p-5 min-h-[280px] md:min-h-[320px] animate-pulse">
                <div className="h-4 w-24 rounded bg-[var(--d3-border)] mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="h-52 rounded-[var(--d3-radius-md)] bg-[var(--d3-surface-elevated)]" />
                  <div className="h-52 rounded-[var(--d3-radius-md)] bg-[var(--d3-surface-elevated)]" />
                  <div className="h-52 rounded-[var(--d3-radius-md)] bg-[var(--d3-surface-elevated)]" />
                </div>
              </div>
            }
          >
            <TodayCardDashboard />
          </Suspense>
        </section>

        {/* Main Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 mb-6">
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            {renderColumn('left')}
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            {renderColumn('center')}
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
            {renderColumn('right')}
          </div>
        </section>

        {/* Life Goals */}
        <section className="mb-6">
          <LifeGoalsV3 />
        </section>
      </div>
    </div>
  );
}
