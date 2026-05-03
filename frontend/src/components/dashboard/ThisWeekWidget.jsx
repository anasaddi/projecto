import React, { useMemo } from 'react';
import { toDateKey, addDays, startOfDay, startOfWeek } from './DashboardUtils';

export function ThisWeekWidget({ dailyTaskLogs, activeHabits, now, prayerLogs = {}, PRAYERS = [] }) {
  // Helper to check if prayer is completed (handles both old boolean and new object format)
  const isPrayerCompleted = (prayerLogEntry) => {
    if (typeof prayerLogEntry === 'object') {
      return !!prayerLogEntry?.completedAt;
    }
    return !!prayerLogEntry;
  };
  
  const weekDays = useMemo(() => {
    const start = startOfWeek(now);
    const todayKey = toDateKey(now);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const key = toDateKey(d);
      const logsRaw = dailyTaskLogs[key] || [];
      const taskMap = {};
      logsRaw.forEach(l => { if (l && l.id) taskMap[l.id] = l.done; });
      const done = activeHabits.reduce((acc, t) => acc + (taskMap[t.id] ? 1 : 0), 0);
      // Fix #1 & #5: Only count up to today, and include prayers if provided
      const isFutureDay = key > todayKey;
      const prayerDone = !isFutureDay && PRAYERS.length > 0 
        ? PRAYERS.reduce((acc, p) => acc + (isPrayerCompleted((prayerLogs[key] || {})[p]) ? 1 : 0), 0)
        : 0;
      const totalForDay = activeHabits.length + PRAYERS.length;
      const pct = totalForDay ? (done + prayerDone) / totalForDay : 0;
      const labels = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
      return { key, label: labels[i], pct, isToday: key === todayKey, isFutureDay };
    });
  }, [dailyTaskLogs, activeHabits, now, prayerLogs, PRAYERS]);

  const weekPct = useMemo(() => {
    // Fix #5: Only average days up to today (exclude future days)
    const pastAndToday = weekDays.filter(d => !d.isFutureDay);
    const done = pastAndToday.reduce((acc, d) => acc + d.pct, 0);
    return pastAndToday.length ? Math.round((done / pastAndToday.length) * 100) : 0;
  }, [weekDays]);

  const QUOTES = [
    'Piccoli passi, grandi risultati.',
    'La disciplina batte la motivazione.',
    'Oggi conta.',
    'Consistency is key.',
  ];
  const quote = QUOTES[Math.floor(now.getDate() % QUOTES.length)];

  return (
    <div className="mt-1 pt-3 border-t border-zinc-100 dark:border-white/[0.04] shrink-0 px-[15px] pb-[15px]">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-bold text-sky-500 dark:text-sky-400 uppercase tracking-wider">This week</span>
        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 tabular-nums">{weekPct}%</span>
      </div>
      <div className="flex gap-0.5 mb-1.5">
        {weekDays.map(({ key, label, pct, isToday, isFutureDay }) => (
          <div key={key} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800/80 rounded-[2px] overflow-hidden" title={`${Math.round(pct * 100)}%`}>
              <div className={`h-full transition-all ${isFutureDay ? 'bg-zinc-200 dark:bg-zinc-700' : pct >= 0.8 ? 'bg-emerald-500' : pct >= 0.5 ? 'bg-sky-500' : pct > 0 ? 'bg-amber-400' : 'bg-transparent'}`} style={{ width: `${isFutureDay ? 100 : pct * 100}%` }} />
            </div>
            <span className={`text-xs scale-90 font-medium ${isToday ? 'text-sky-500 dark:text-sky-400 font-bold' : isFutureDay ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-400'}`}>{label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-400 italic">{quote}</p>
    </div>
  );
}
