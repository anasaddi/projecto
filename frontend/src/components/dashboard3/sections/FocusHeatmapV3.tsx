import React, { memo, useEffect, useMemo, useState } from 'react';
import { CardV3 } from '../ui/CardV3';
import { useDashboardStore } from '../../../store/dashboardStore';
import { toDateKey, addDays, startOfDay } from '../../../components/dashboard/DashboardUtils';
import type { DailyTaskTemplate, DayCompletionPayload, DailyTaskLogEntry } from '../../../types/dashboard';

export const FocusHeatmapV3 = memo(function FocusHeatmapV3() {
  const dailyTaskTemplates = (useDashboardStore((s) => s.dailyTaskTemplates) ?? []) as DailyTaskTemplate[];
  const dailyTaskLogs = (useDashboardStore((s) => s.dailyTaskLogs) ?? {}) as Record<string, DailyTaskLogEntry[]>;
  const prayerLogs = (useDashboardStore((s) => s.prayerLogs) ?? {}) as Record<string, Record<string, boolean>>;
  const dailyCompletionLog = (useDashboardStore((s) => s.dailyCompletionLog) ?? {}) as Record<string, DayCompletionPayload>;
  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const totalItems = activeHabits.length + prayers.length + 3;

  const days = useMemo(() => {
    const arr: Array<{ key: string; score: number; isToday: boolean }> = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || [];
      const taskLogMap: Record<string, boolean> = {};
      taskLog.forEach((l) => (taskLogMap[l.id] = l.done));
      const prayerLog = prayerLogs[key] || {};
      const cl = dailyCompletionLog[key] || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((acc: number, t) => acc + (taskLogMap[t.id] ? 1 : 0), 0);
      const prayersDone = prayers.reduce((acc: number, p: string) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      arr.push({ key, score, isToday: key === toDateKey(now) });
    }
    return arr;
  }, [activeHabits, dailyTaskLogs, prayerLogs, dailyCompletionLog, now, totalItems]);

  const streak = useMemo(() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].score >= 0.8) s++;
      else break;
    }
    return s;
  }, [days]);

  const getColor = (score: number) => {
    if (score >= 0.9) return 'bg-emerald-600';
    if (score >= 0.65) return 'bg-emerald-500';
    if (score >= 0.4) return 'bg-amber-400';
    if (score > 0) return 'bg-amber-200';
    return 'bg-zinc-100 dark:bg-white/[0.04]';
  };

  return (
    <CardV3 className="h-full flex flex-col" elevated>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Focus Heatmap</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">Last 30 days performance</p>
        </div>
        {streak > 0 && <span className="text-xs font-medium px-2 py-1 rounded-full text-[var(--d3-success)]" style={{ backgroundColor: 'var(--d3-success-bg)' }}>{streak}d streak</span>}
      </div>

      <div className="grid grid-cols-10 gap-2">
        {days.map(({ key, score, isToday }) => (
          <div
            key={key}
            title={`${Math.round(score * 100)}% · ${key}`}
            className={`w-5 h-5 rounded-md ${getColor(score)} ${isToday ? 'ring-2 ring-offset-2 ring-[var(--d3-primary)]' : ''}`}
          />
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-[var(--d3-text-muted)]">
        <span>Meno</span>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-[2px] bg-zinc-100 dark:bg-white/[0.04]" />
          <div className="w-3 h-3 rounded-[2px] bg-amber-200" />
          <div className="w-3 h-3 rounded-[2px] bg-amber-400" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-600" />
        </div>
        <span>Più</span>
      </div>
    </CardV3>
  );
});
