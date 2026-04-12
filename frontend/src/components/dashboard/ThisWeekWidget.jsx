import React, { useMemo } from 'react';

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

function startOfWeek(date = new Date()) {
  const d = startOfDay(date);
  const mondayOffset = (d.getDay() + 6) % 7;
  return addDays(d, -mondayOffset);
}

export function ThisWeekWidget({ dailyTaskLogs, activeHabits, now }) {
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
      const pct = activeHabits.length ? done / activeHabits.length : 0;
      const labels = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];
      return { key, label: labels[i], pct, isToday: key === todayKey };
    });
  }, [dailyTaskLogs, activeHabits, now]);

  const weekPct = useMemo(() => {
    const done = weekDays.reduce((acc, d) => acc + d.pct, 0);
    return weekDays.length ? Math.round((done / weekDays.length) * 100) : 0;
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
        {weekDays.map(({ key, label, pct, isToday }) => (
          <div key={key} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800/80 rounded-[2px] overflow-hidden" title={`${Math.round(pct * 100)}%`}>
              <div className={`h-full transition-all ${pct >= 0.8 ? 'bg-emerald-500' : pct >= 0.5 ? 'bg-sky-500' : pct > 0 ? 'bg-amber-400' : 'bg-transparent'}`} style={{ width: `${pct * 100}%` }} />
            </div>
            <span className={`text-xs scale-90 font-medium ${isToday ? 'text-sky-500 dark:text-sky-400 font-bold' : 'text-zinc-400'}`}>{label}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-zinc-400 italic">{quote}</p>
    </div>
  );
}
