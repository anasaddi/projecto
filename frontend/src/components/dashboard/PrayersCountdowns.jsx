import React from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';

export function PrayersCountdowns({
  todayPrayerLog,
  togglePrayer,
  PRAYERS,
  countdowns,
  todayFocusScore = 0,
  focusStreak = 0,
  onReset,
  now
}) {
  return (
    <div className="shrink-0 px-6 pt-5 pb-2">
      <Card className="p-1">
        <CardBody className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 py-3 px-5">
          
          {/* Section 1: Prayers (Icons only) */}
          <div className="flex items-center gap-4 shrink-0">
            {PRAYERS.map((p) => (
              <div key={p} className="flex items-center gap-2 group cursor-pointer" onClick={() => togglePrayer(p, !todayPrayerLog[p])}>
                <TaskCheckbox
                  done={!!todayPrayerLog[p]}
                  onClick={() => {}}
                  className="h-4.5 w-4.5"
                />
                <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${todayPrayerLog[p] ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500'}`}>
                  {p.slice(0, 3)}
                </span>
              </div>
            ))}
          </div>

          {/* Section 2: Progress Bar (Wider) */}
          <div className="flex flex-1 items-center gap-6 min-w-[300px] border-x border-zinc-100 dark:border-white/5 px-8">
            <div className="flex items-center gap-4 w-full">
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/5 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 transition-all duration-700 ease-out"
                  style={{ width: `${Math.round(todayFocusScore * 100)}%` }}
                />
              </div>
              <span className="text-xs font-black tabular-nums text-indigo-600 dark:text-indigo-400 min-w-[36px]">
                {Math.round(todayFocusScore * 100)}%
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {focusStreak > 0 && (
                <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20">
                  <Icons.Flame className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-black">{focusStreak}d</span>
                </div>
              )}
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                title="Reset"
              >
                <Icons.X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Section 3: Time Remaining (Wider) */}
          <div className="flex items-center gap-8 shrink-0">
            {countdowns.map((c) => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">{c.label === 'Next' ? 'Prox' : c.label}</span>
                <span className="text-base font-bold tabular-nums tracking-tighter text-zinc-800 dark:text-zinc-100">{c.remaining}</span>
              </div>
            ))}
          </div>
          
        </CardBody>
      </Card>
    </div>
  );
}
