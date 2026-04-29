import React, { useMemo } from 'react';
import { Icons } from './Icons';

import { useGlobalConfig } from '../../context/GlobalConfigContext';
import { Card, CardHeader, CardBody } from './Card';
import { toDateKey, addDays, startOfDay, parseSelectedDate } from './DashboardUtils';
import { DASHBOARD } from '../../constants';

const DEFAULT_PRAYERS = DASHBOARD.DEFAULT_PRAYERS;

function LightAnalyticsInner({ dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, anchorDate, PRAYERS = DEFAULT_PRAYERS }) {
  const totalItems = activeHabits.length + PRAYERS.length + 3;
  const { weekAvg, monthAvg, bestDay, worstDay } = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(startOfDay(anchorDate), -i);
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
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, anchorDate, totalItems]);
  
  return (
    <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-wrap gap-x-3 gap-y-1 text-xs">
      <span className="text-zinc-500">Week: <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(weekAvg * 100)}%</strong></span>
      <span className="text-zinc-500">Month: <strong className="text-zinc-700 dark:text-zinc-300">{Math.round(monthAvg * 100)}%</strong></span>
      {bestDay && <span className="text-emerald-600 dark:text-emerald-400">Best: {bestDay.key} ({Math.round(bestDay.score * 100)}%)</span>}
      {worstDay && worstDay.key !== bestDay?.key && <span className="text-amber-600 dark:text-amber-400">Worst: {worstDay.key} ({Math.round(worstDay.score * 100)}%)</span>}
    </div>
  );
}

export function FocusHeatmap({ dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, selectedDate, onSelectDate }) {
  const { config } = useGlobalConfig();
  const PRAYERS = config?.PRAYERS || ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const safeSelectedDate = parseSelectedDate(selectedDate, new Date());
  const selectedDateKey = toDateKey(startOfDay(safeSelectedDate));
  const anchorDate = startOfDay(new Date());

  const totalItems = activeHabits.length + PRAYERS.length + 3;
  const heatmapDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(anchorDate, -i);
      const key = toDateKey(d);
      const taskLog = dailyTaskLogs[key] || {};
      const prayerLog = prayerLogs[key] || {};
      const completionLog = dailyCompletionLog[key] || { quick: [], project: [] };
      const habitsDone = activeHabits.reduce((acc, t) => acc + (taskLog[t.id] ? 1 : 0), 0);
      const prayersDone = PRAYERS.reduce((acc, p) => acc + (prayerLog[p] ? 1 : 0), 0);
      const tasksDone = Math.min(3, (completionLog.quick?.length || 0) + (completionLog.project?.length || 0));
      const score = totalItems ? (habitsDone + prayersDone + tasksDone) / totalItems : 0;
      days.push({
        key,
        date: d,
        score,
        habitsDone,
        habitsTotal: activeHabits.length,
        prayersDone,
        prayersTotal: PRAYERS.length,
        tasksDone,
        tasksTotal: 3,
        isSelected: key === selectedDateKey,
      });
    }
    return days;
  }, [dailyTaskLogs, prayerLogs, dailyCompletionLog, activeHabits, selectedDateKey, totalItems, anchorDate]);

  const getColor = (score) => {
    if (score >= 0.85) return 'bg-emerald-500 dark:bg-emerald-500';
    if (score >= 0.55) return 'bg-amber-500 dark:bg-amber-500';
    if (score > 0) return 'bg-rose-500 dark:bg-rose-500';
    return 'bg-zinc-100 dark:bg-zinc-800';
  };

  const getDayStatus = (score) => {
    if (score >= 0.85) return 'Completa';
    if (score >= 0.55) return 'Parziale';
    if (score > 0) return 'Critica';
    return 'Vuota';
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
    <Card className="flex flex-col select-none">
      <CardHeader
        icon={Icons.Calendar}
        iconColor="text-emerald-500"
        title="Ultimi 30 giorni"
        action={
          streak > 0 && (
            <span className="text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              {streak}d streak
            </span>
          )
        }
      />
      <CardBody padding="normal" className="flex flex-col gap-4">
        <div className="overflow-x-auto pb-1 -mx-1 px-1 sm:mx-0 sm:px-0">
          <div className="grid min-w-[280px] grid-cols-10 gap-2">
          {heatmapDays.map(({ key, date, score, isSelected, habitsDone, habitsTotal, prayersDone, prayersTotal, tasksDone, tasksTotal }) => (
            <button
              key={key}
              type="button"
              title={`${key}\nStato: ${getDayStatus(score)} (${Math.round(score * 100)}%)\nAbitudini: ${habitsDone}/${habitsTotal}\nPreghiere: ${prayersDone}/${prayersTotal}\nTop3: ${tasksDone}/${tasksTotal}`}
              onClick={() => onSelectDate?.(date)}
              className={`h-5 w-5 rounded-md ${getColor(score)} ${isSelected ? 'ring-4 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 ring-offset-white dark:ring-offset-[#131820] shadow-[0_0_0_1px_rgba(99,102,241,0.35)]' : ''} transition-colors hover:scale-[1.04] focus:outline-none focus:ring-2 focus:ring-indigo-400/70 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#131820]`}
              aria-label={`Seleziona il giorno ${key}`}
            />
          ))}
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>Meno</span>
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-3 rounded-[2px] bg-zinc-100 dark:bg-zinc-800" title="0%" />
            <div className="w-3 h-3 rounded-[2px] bg-rose-500 dark:bg-rose-500" title="1-54% (Critica)" />
            <div className="w-3 h-3 rounded-[2px] bg-amber-500 dark:bg-amber-500" title="55-84% (Parziale)" />
            <div className="w-3 h-3 rounded-[2px] bg-emerald-500 dark:bg-emerald-500" title="≥85% (Completa)" />
          </div>
          <span>Più</span>
        </div>
        <LightAnalyticsInner dailyTaskLogs={dailyTaskLogs} prayerLogs={prayerLogs} dailyCompletionLog={dailyCompletionLog} activeHabits={activeHabits} anchorDate={anchorDate} PRAYERS={PRAYERS} />
      </CardBody>
    </Card>
  );
}
