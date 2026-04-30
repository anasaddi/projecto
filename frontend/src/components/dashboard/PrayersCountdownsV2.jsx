import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, Badge } from './Card';
import { Icons } from './Icons';
import { MS } from '../../constants';
import { useDashboardStore } from '../../store/dashboardStore';
import { toDateKey, addDays, startOfDay, startOfWeek, startOfMonth, formatCountdown, parseSelectedDate } from './DashboardUtils';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export function PrayersCountdownsV2() {
  const selectedDateRaw = useDashboardStore((s) => s.selectedDate);
  const dailyTaskTemplates = useDashboardStore((s) => s.dailyTaskTemplates) ?? [];
  const dailyTaskLogs = useDashboardStore((s) => s.dailyTaskLogs) ?? {};
  const prayerLogs = useDashboardStore((s) => s.prayerLogs) ?? {};
  const dailyCompletionLog = useDashboardStore((s) => s.dailyCompletionLog) ?? {};

  const selectedDate = useMemo(() => parseSelectedDate(selectedDateRaw, new Date()), [selectedDateRaw]);
  const todayKey = useMemo(() => toDateKey(selectedDate), [selectedDate]);
  const isToday = useMemo(() => toDateKey(new Date()) === todayKey, [todayKey]);

  // Focus Score logic
  const activeHabits = useMemo(() => dailyTaskTemplates.filter(t => !t.locked), [dailyTaskTemplates]);
  
  const todayTaskLogMap = useMemo(() => {
    const logs = dailyTaskLogs[todayKey] || [];
    const map = {};
    logs.forEach(l => map[l.id] = l.done);
    return map;
  }, [dailyTaskLogs, todayKey]);

  const todayPrayerLog = useMemo(() => prayerLogs[todayKey] || {}, [prayerLogs, todayKey]);
  
  const cl = useMemo(() => dailyCompletionLog[todayKey] || { quick: [], project: [] }, [dailyCompletionLog, todayKey]);
  
  const todayDone = useMemo(() => activeHabits.reduce((acc, t) => acc + (todayTaskLogMap[t.id] ? 1 : 0), 0), [activeHabits, todayTaskLogMap]);
  const prayerDone = useMemo(() => PRAYERS.reduce((acc, p) => acc + (todayPrayerLog[p] ? 1 : 0), 0), [todayPrayerLog]);
  const tasksDone = useMemo(() => Math.min(3, (cl.quick?.length || 0) + (cl.project?.length || 0)), [cl]);
  
  const totalFocusItems = activeHabits.length + PRAYERS.length + 3;
  const doneFocusItems = todayDone + prayerDone + tasksDone;
  const todayFocusScore = totalFocusItems ? doneFocusItems / totalFocusItems : 0;
  
  const percentage = Math.round(todayFocusScore * 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const focusStreak = useMemo(() => {
    let s = 0;
    const totalItems = activeHabits.length + PRAYERS.length + 3;
    for (let i = 0; i < 30; i++) {
      const d = addDays(startOfDay(selectedDate), -i);
      const key = toDateKey(d);
      const taskLog = (dailyTaskLogs[key]) || [];
      const taskLogMap = {};
      taskLog.forEach((l) => (taskLogMap[l.id] = l.done));
      const prayerLog = (prayerLogs[key]) || {};
      const complLog = (dailyCompletionLog[key]) || { quick: [], project: [] };
      const hDone = activeHabits.reduce((acc, t) => acc + (taskLogMap[t.id] ? 1 : 0), 0);
      const pDone = PRAYERS.reduce((acc, p) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tDone = Math.min(3, (complLog.quick?.length || 0) + (complLog.project?.length || 0));
      const score = totalItems ? (hDone + pDone + tDone) / totalItems : 0;
      if (score >= 0.8) s++;
      else break;
    }
    return s;
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, selectedDate]);

  const countdowns = useMemo(() => {
    const n = new Date();
    const eod = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
    const eow = addDays(startOfWeek(n), 7);
    const eom = new Date(n.getFullYear(), n.getMonth() + 1, 1);
    return [
      { label: 'Day',   remaining: formatCountdown(eod.getTime() - n.getTime()), pct: (n.getTime() - startOfDay(n).getTime()) / (eod.getTime() - startOfDay(n).getTime()) },
      { label: 'Week',  remaining: formatCountdown(eow.getTime() - n.getTime()), pct: (n.getTime() - startOfWeek(n).getTime()) / (eow.getTime() - startOfWeek(n).getTime()) },
      { label: 'Month', remaining: formatCountdown(eom.getTime() - n.getTime()), pct: (n.getTime() - startOfMonth(n).getTime()) / (eom.getTime() - startOfMonth(n).getTime()) },
    ];
  }, []);

  const yearRef = selectedDate;
  const startOfYearDate = new Date(yearRef.getFullYear(), 0, 1);
  const endOfYearDate = new Date(yearRef.getFullYear() + 1, 0, 1);
  const yearPct = (yearRef.getTime() - startOfYearDate.getTime()) / (endOfYearDate.getTime() - startOfYearDate.getTime());
  const yearRemaining = endOfYearDate.getTime() - yearRef.getTime();
  const yearDays = Math.floor(yearRemaining / MS.DAY);
  
  const dateLabel = useMemo(() => selectedDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }), [selectedDate]);

  const allBars = [
    ...countdowns,
    { label: 'Year', remaining: `${yearDays}d`, pct: yearPct },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        icon={Icons.Zap}
        iconColor="text-indigo-500"
        title="Focus Score"
        subtitle={isToday ? "Progressi giornalieri" : dateLabel || "Progressi"}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="default" size="sm" className="whitespace-nowrap">
              <Icons.Calendar className="h-3 w-3 mr-1" />
              {dateLabel}
            </Badge>
            {focusStreak > 0 ? (
              <Badge variant="warning" size="sm" className="whitespace-nowrap">
                <Icons.Flame className="h-3 w-3 mr-1" />
                {focusStreak} giorni
              </Badge>
            ) : null}
          </div>
        }
      />
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="flex flex-col items-center justify-center gap-4 w-full sm:flex-row sm:justify-start sm:gap-6">
            <div className="relative h-32 w-32 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-100 dark:text-white/[0.04]" />
                <motion.circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke="url(#focusGradient)"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="drop-shadow-lg"
                />
                <defs>
                  <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7C5CFF" />
                    <stop offset="100%" stopColor="#9B82FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tighter">{percentage}%</span>
              </div>
            </div>
            
            <div className="text-center sm:text-left flex flex-col justify-center">
              <h4 className="text-[18px] font-bold text-zinc-800 dark:text-zinc-100 leading-tight">
                {percentage === 100 ? 'Giornata perfetta!' : percentage > 70 ? 'Ottimo lavoro finora!' : percentage > 30 ? 'Sei sulla buona strada.' : 'Pronto per iniziare'}
              </h4>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-full sm:justify-between sm:gap-3 mt-2">
            {allBars.map((bar) => {
              const pct = Math.min(1, Math.max(0, bar.pct ?? 0));
              return (
                <div key={bar.label} className="flex flex-col gap-1.5 rounded-2xl bg-zinc-50 dark:bg-white/[0.02] p-3 sm:flex-1 sm:min-w-0 border border-zinc-100 dark:border-white/[0.04]">
                  <div className="flex items-center justify-between gap-1 whitespace-nowrap">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{bar.label}</span>
                    <span className="text-[10px] font-[650] tabular-nums text-zinc-400 dark:text-zinc-500">{bar.remaining}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-white/[0.04] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-indigo-500"
                      initial={false}
                      animate={{ width: `${Math.max(2, pct * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default PrayersCountdownsV2;
