import React, { memo, useEffect, useMemo, useState } from 'react';
import { CardV3 } from '../ui/CardV3';
import { useDashboardStore } from '../../../store/dashboardStore';
import { useGlobalConfig } from '../../../context/GlobalConfigContext';
import { countTreeStats, resolveTop3Slots, toDateKey, addDays, startOfDay } from '../../../components/dashboard/DashboardUtils';
import type { DailyTaskTemplate, DailyTaskLogEntry, DayCompletionPayload } from '../../../types/dashboard';

interface Stat {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: string;
  bgColorVar: string;
}

export const StatsMiniV3 = memo(function StatsMiniV3() {
  const globalConfig = useGlobalConfig() as { config?: { PRAYERS?: string[] } } | null;
  const config = globalConfig?.config;
  const PRAYERS = useMemo(() => config?.PRAYERS || ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], [config]);

  const dailyTaskTemplates = (useDashboardStore((s) => s.dailyTaskTemplates) ?? []) as DailyTaskTemplate[];
  const dailyTaskLogs = (useDashboardStore((s) => s.dailyTaskLogs) ?? {}) as Record<string, DailyTaskLogEntry[]>;
  const projects = useDashboardStore((s) => s.projects) ?? [];
  const prayerLogs = (useDashboardStore((s) => s.prayerLogs) ?? {}) as Record<string, Record<string, boolean>>;
  const top3Manual = useDashboardStore((s) => s.top3Manual) ?? [null, null, null];
  const quickTasks = useDashboardStore((s) => s.quickTasks) ?? [];
  const sharedDashboards = useDashboardStore((s) => s.sharedDashboards) ?? [];
  const dailyCompletionLog = (useDashboardStore((s) => s.dailyCompletionLog) ?? {}) as Record<string, DayCompletionPayload>;
  const lifeGoals = useDashboardStore((s) => s.lifeGoals) ?? { tiers: [] };

  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const todayKey = toDateKey(now);
  const todayTaskLogMap = useMemo(() => {
    const entries = dailyTaskLogs[todayKey] || [];
    const map: Record<string, boolean> = {};
    entries.forEach((entry) => {
      map[entry.id] = entry.done;
    });
    return map;
  }, [dailyTaskLogs, todayKey]);
  const todayPrayerLog = prayerLogs[todayKey] || {};

  const allQuickTasks = useMemo(() => quickTasks.filter((t: any) => !t.parentId), [quickTasks]);
  const top3Resolved = useMemo(
    () => resolveTop3Slots(projects, top3Manual as any[], allQuickTasks as any[], lifeGoals as any, sharedDashboards as any[]),
    [projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards]
  );

  const completedToday = useMemo(() => {
    const habitsDone = activeHabits.reduce((acc: number, t) => acc + (todayTaskLogMap[t.id] ? 1 : 0), 0);
    const prayersDone = PRAYERS.reduce((acc: number, p: string) => acc + (todayPrayerLog[p] ? 1 : 0), 0);
    const top3Done = top3Resolved.filter((slot: any) => slot && !slot.missing && slot.done).length;
    const total = activeHabits.length + PRAYERS.length + 3;
    return {
      habitsDone,
      prayersDone,
      top3Done,
      total,
      pct: total ? (habitsDone + prayersDone + top3Done) / total : 0,
    };
  }, [activeHabits, PRAYERS, todayPrayerLog, top3Resolved, todayTaskLogMap]);

  const projectRatio = useMemo(() => {
    const stats = projects.map((p: any) => countTreeStats(p.tasks));
    const total = stats.reduce((acc: number, cur: { total: number }) => acc + cur.total, 0);
    const completed = stats.reduce((acc: number, cur: { completed: number }) => acc + cur.completed, 0);
    return total ? completed / total : 0;
  }, [projects]);

  const focusStreak = useMemo(() => {
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const logs = (dailyTaskLogs[key] || []) as DailyTaskLogEntry[];
      const taskLogMap: Record<string, boolean> = {};
      logs.forEach((entry) => {
        taskLogMap[entry.id] = entry.done;
      });
      const prayerLog = prayerLogs[key] || {};
      const completion = (dailyCompletionLog[key] as { quick?: string[]; project?: string[] }) || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((acc: number, t) => acc + (taskLogMap[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc: number, p: string) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (completion.quick?.length || 0) + (completion.project?.length || 0));
      const score = activeHabits.length + PRAYERS.length + 3 > 0
        ? (habitsDone + prayersDone + tasksDone) / (activeHabits.length + PRAYERS.length + 3)
        : 0;
      if (score >= 0.8) streak++;
      else break;
    }
    return streak;
  }, [activeHabits, PRAYERS, dailyCompletionLog, dailyTaskLogs, now, prayerLogs]);

  const STATS: Stat[] = [
    {
      label: 'Focus Score',
      value: `${Math.round(completedToday.pct * 100)}%`,
      change: completedToday.pct >= 0.7 ? '+ live' : '—',
      trend: completedToday.pct >= 0.7 ? 'up' : completedToday.pct >= 0.45 ? 'neutral' : 'down',
      icon: '🎯',
      bgColorVar: 'var(--d3-primary-bg)',
    },
    {
      label: 'Tasks Done',
      value: String(completedToday.habitsDone + completedToday.prayersDone + completedToday.top3Done),
      change: `${activeHabits.length + PRAYERS.length + 3}`,
      trend: 'up',
      icon: '✓',
      bgColorVar: 'var(--d3-success-bg)',
    },
    {
      label: 'Streak',
      value: `${focusStreak}d`,
      change: focusStreak > 0 ? 'keep going' : 'start now',
      trend: focusStreak > 0 ? 'up' : 'neutral',
      icon: '🔥',
      bgColorVar: 'var(--d3-warning-bg)',
    },
    {
      label: 'Projects',
      value: `${Math.round(projectRatio * 100)}%`,
      change: `${projects.length} active`,
      trend: projectRatio >= 0.7 ? 'up' : projectRatio >= 0.4 ? 'neutral' : 'down',
      icon: '📈',
      bgColorVar: 'var(--d3-danger-bg)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {STATS.map((stat) => (
        <CardV3 key={stat.label} padding="sm" className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-[var(--d3-radius-md)] flex items-center justify-center text-lg"
            style={{ backgroundColor: stat.bgColorVar }}
          >
            {stat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[var(--d3-text-muted)] truncate">{stat.label}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-[var(--d3-text)]">{stat.value}</span>
              <span
                className={`text-xs ${
                  stat.trend === 'up'
                    ? 'text-[var(--d3-success)]'
                    : stat.trend === 'down'
                    ? 'text-[var(--d3-danger)]'
                    : 'text-[var(--d3-text-muted)]'
                }`}
              >
                {stat.change}
              </span>
            </div>
          </div>
        </CardV3>
      ))}
    </div>
  );
});
