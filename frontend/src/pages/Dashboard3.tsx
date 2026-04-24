import React, { useMemo } from 'react';
import '../components/dashboard3/styles/design-tokens.css';

import {
  PrayerCountdownV3,
  StatsMiniV3,
  TimelineV3,
  PomodoroV3,
  Top3V3,
  HabitsV3,
  ProjectsV3,
} from '../components/dashboard3/sections';

export default function Dashboard3(): React.ReactElement {
  const today = useMemo(() => new Date(), []);
  const greeting = useMemo(() => {
    const hour = today.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, [today]);

  const dateFormatted = useMemo(() => {
    return today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [today]);

  return (
    <div className="d3-container min-h-screen overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--d3-text)]">{greeting}</h1>
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

        {/* Main Grid: Pomodoro | Top3 | Habits */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <div className="h-[320px]">
            <PomodoroV3 />
          </div>
          <div className="h-[320px]">
            <Top3V3 />
          </div>
          <div className="h-[320px]">
            <HabitsV3 />
          </div>
        </section>

        {/* Projects */}
        <section className="mb-6">
          <ProjectsV3 />
        </section>
      </div>
    </div>
  );
}
