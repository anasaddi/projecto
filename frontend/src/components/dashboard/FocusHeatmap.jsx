import React, { useMemo } from 'react';
import { Icons } from './Icons';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function LightAnalyticsInner({ dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now }) {
  const totalItems = activeHabits.length + PRAYERS.length + 3;
  const { weekAvg, monthAvg, bestDay, worstDay } = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || {};
      const prayerLog = prayerLogs[key] || {};
      const cl = dailyCompletionLog[key] || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((a, t) => a + (taskLog[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((a, p) => a + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      days.push({ key, score });
    }
    const weekDays = days.slice(-7);
    const monthDays = days;
    const weekAvg = weekDays.length ? weekDays.reduce((a, d) => a + d.score, 0) / weekDays.length : 0;
    const monthAvg = monthDays.length ? monthDays.reduce((a, d) => a + d.score, 0) / monthDays.length : 0;
    const withScore = days.filter(d => d.score > 0);
    const bestDay = withScore.length ? withScore.reduce((a, b) => a.score >= b.score ? a : b, { key: '', score: 0 }) : null;
    const worstDay = withScore.length ? withScore.reduce((a, b) => a.score <= b.score ? a : b, { key: '', score: 1 }) : null;
    return { weekAvg, monthAvg, bestDay, worstDay };
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now, totalItems]);
  
  return (
    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-wrap gap-x-3 gap-y-1 text-[9px]">
      <span className="text-zinc-500">Week: <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(weekAvg * 100)}%</strong></span>
      <span className="text-zinc-500">Month: <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(monthAvg * 100)}%</strong></span>
      {bestDay && <span className="text-emerald-600 dark:text-emerald-400">Best: {bestDay.key} ({Math.round(bestDay.score * 100)}%)</span>}
      {worstDay && worstDay.key !== bestDay?.key && <span className="text-amber-600 dark:text-amber-400">Worst: {worstDay.key} ({Math.round(worstDay.score * 100)}%)</span>}
    </div>
  );
}

export function FocusHeatmap({ dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now }) {
  const totalItems = activeHabits.length + PRAYERS.length + 3;
  const heatmapDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(startOfDay(now), -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || {};
      const prayerLog = prayerLogs[key] || {};
      const completionLog = dailyCompletionLog[key] || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((acc, t) => acc + (taskLog[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc, p) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (completionLog.quick?.length || 0) + (completionLog.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      days.push({ key, date: d, score, isToday: key === toDateKey(now) });
    }
    return days;
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, now, totalItems]);

  const getColor = (score) => {
    if (score >= 0.9) return 'bg-emerald-600 dark:bg-emerald-500';
    if (score >= 0.65) return 'bg-emerald-500 dark:bg-emerald-400';
    if (score >= 0.4) return 'bg-amber-400 dark:bg-amber-500';
    if (score > 0) return 'bg-amber-200 dark:bg-amber-500/40';
    return 'bg-zinc-100 dark:bg-white/[0.04]';
  };

  const streak = useMemo(() => {
    let s = 0;
    for (let i = heatmapDays.length - 1; i >= 0; i--) {
      if (heatmapDays[i].score >= 0.8) s++;
      else break;
    }
    return s;
  }, [heatmapDays]);

  return (
    <div className="dashboard-panel p-5 flex flex-col gap-4 select-none">
      <div className="flex justify-between items-center">
        <h3 className="flex items-center gap-1.5 dashboard-section-title text-emerald-500 dark:text-emerald-400">
          <Icons.Flame className="w-3.5 h-3.5" /> Ultimi 30 giorni
        </h3>
        {streak > 0 && (
          <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            {streak}d streak
          </span>
        )}
      </div>
      <div className="grid grid-cols-10 gap-2">
        {heatmapDays.map(({ key, score, isToday }) => (
          <div
            key={key}
            title={`${Math.round(score * 100)}% · ${key}`}
            className={`w-5 h-5 rounded-md ${getColor(score)} ${isToday ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-white dark:ring-offset-[#161920]' : ''} transition-colors`}
          />
        ))}
      </div>
      <div className="flex items-center gap-2 text-[9px] text-zinc-500 dark:text-zinc-400">
        <span>Meno</span>
        <div className="flex items-center gap-0.5">
          <div className="w-3 h-3 rounded-[2px] bg-zinc-100 dark:bg-white/[0.04]" title="0%" />
          <div className="w-3 h-3 rounded-[2px] bg-amber-200 dark:bg-amber-500/40" title="&gt;0%" />
          <div className="w-3 h-3 rounded-[2px] bg-amber-400 dark:bg-amber-500" title="&ge;40%" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-400" title="&ge;65%" />
          <div className="w-3 h-3 rounded-[2px] bg-emerald-600 dark:bg-emerald-500" title="&ge;90%" />
        </div>
        <span>Più</span>
      </div>
      <LightAnalyticsInner dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} now={now} />
    </div>
  );
}
