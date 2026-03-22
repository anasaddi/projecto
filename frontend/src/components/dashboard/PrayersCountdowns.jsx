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
      <div className="overflow-hidden rounded-xl border border-zinc-200/60 bg-white shadow-sm backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#0b0e14]/70 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          
          {/* Section 1: Prayers */}
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="flex shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-500 dark:text-emerald-400/90">
              <Icons.CheckCircle className="w-3 h-3" /> Prayers
            </h3>
            <div className="flex items-center gap-3">
              {PRAYERS.map((p) => (
                <div key={p} className="flex items-center gap-1.5 shrink-0">
                  <TaskCheckbox
                    done={!!todayPrayerLog[p]}
                    onClick={() => togglePrayer(p, !todayPrayerLog[p])}
                    className="h-3.5 w-3.5"
                  />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${todayPrayerLog[p] ? 'text-zinc-300 dark:text-zinc-600' : 'text-zinc-500 dark:text-zinc-400'}`}>
                    {p.slice(0, 3)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Loading Bar & Stats */}
          <div className="flex items-center gap-4 flex-1 min-w-[200px] justify-center px-4 border-x border-zinc-100 dark:border-white/5">
            <div className="flex items-center gap-2 w-full max-w-[120px]">
              <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${Math.round(todayFocusScore * 100)}%` }}
                />
              </div>
              <span className="text-[10px] font-black tabular-nums text-zinc-400 dark:text-zinc-500">
                {Math.round(todayFocusScore * 100)}%
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {focusStreak > 0 && (
                <div className="flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-amber-600 dark:text-amber-400/90 ring-1 ring-amber-500/20">
                  <Icons.Flame className="h-2.5 w-2.5" />
                  <span className="text-[9px] font-black">{focusStreak}d</span>
                </div>
              )}
              <button
                type="button"
                onClick={onReset}
                className="rounded-lg p-1 text-zinc-300 hover:text-red-500 transition-colors"
                title="Reset"
              >
                <Icons.X className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Section 3: Time Remaining */}
          <div className="flex items-center gap-5 shrink-0">
            {countdowns.map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{c.label === 'Next' ? 'Prox' : c.label}</span>
                <span className="text-sm font-bold tabular-nums tracking-tighter text-indigo-600 dark:text-indigo-400">{c.remaining}</span>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    </div>
  );
}
