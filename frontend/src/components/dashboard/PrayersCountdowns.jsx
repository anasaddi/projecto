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
    <div className="shrink-0 px-6 pt-6 pb-3">
      <div className="overflow-hidden rounded-[28px] border border-zinc-200/70 bg-white/[0.9] px-4 py-4 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#141922]/85 dark:shadow-[0_26px_60px_-40px_rgba(0,0,0,0.58)] sm:px-5">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Prayers */}
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center">
            <h3 className="flex shrink-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-500 dark:text-emerald-400">
              <Icons.CheckCircle className="w-3.5 h-3.5" /> Prayers
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap xl:gap-3">
              {PRAYERS.map((prayer) => {
                const isDone = todayPrayerLog[prayer];
                return (
                  <label key={prayer} className={`flex h-10 cursor-pointer items-center gap-2 rounded-2xl border px-3 transition-all ${isDone ? 'border-emerald-400/40 bg-emerald-500/12 dark:border-emerald-500/20 dark:bg-emerald-500/8' : 'border-zinc-200/60 hover:border-zinc-300 hover:bg-zinc-50 dark:border-white/[0.05] dark:hover:border-white/[0.08] dark:hover:bg-white/[0.03]'}`}>
                    <TaskCheckbox done={isDone} onClick={() => togglePrayer(prayer, !isDone)} />
                    <span className={`text-xs sm:text-sm font-medium ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{prayer}</span>
                    <input type="checkbox" className="hidden" checked={!!isDone} readOnly />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-12 w-px shrink-0 bg-zinc-200 dark:bg-white/[0.06]" />

          {/* Progress Bar & Info */}
          <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
             <div className="flex items-center gap-3 w-full max-w-[200px]">
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700/80">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                    style={{ width: `${Math.round(todayFocusScore * 100)}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
                  {Math.round(todayFocusScore * 100)}%
                </span>
             </div>
             
             <div className="flex items-center gap-3">
               {focusStreak > 0 && (
                 <div className="flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 text-amber-700 dark:text-amber-300 ring-1 ring-amber-200/60 dark:ring-amber-700/30">
                   <Icons.Flame className="h-3 w-3 shrink-0" />
                   <span className="text-[10px] font-bold tabular-nums">{focusStreak}d</span>
                 </div>
               )}
               {now && (
                 <time className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 tabular-nums">
                   {now.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })}
                 </time>
               )}
               <button
                  type="button"
                  onClick={onReset}
                  className="rounded-lg p-1 text-zinc-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
                  title="Reset dashboard"
                >
                  <Icons.X className="h-3.5 w-3.5" />
                </button>
             </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-12 w-px shrink-0 bg-zinc-200 dark:bg-white/[0.06]" />

          {/* Time Remaining — ancorato a destra */}
          <div className="hidden xl:flex shrink-0 items-center justify-end gap-6">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Remaining</h3>
            <div className="flex items-center gap-6">
              {countdowns.map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-10 shrink-0 font-semibold">{c.label}</span>
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 tabular-nums shrink-0">{c.remaining}</span>
                  <div className="w-16 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden shrink-0">
                    <div className="h-full bg-zinc-400 dark:bg-zinc-500 rounded-full transition-all" style={{ width: `${c.pct * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tablet Countdown (lg) */}
          <div className="hidden lg:flex xl:hidden shrink-0 items-center gap-4">
            {countdowns.map(c => (
              <div key={c.label} className="flex items-center gap-2 px-3 py-1 rounded-lg bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.05]">
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase">{c.label[0]}</span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 tabular-nums">{c.remaining}</span>
              </div>
            ))}
          </div>

          {/* Mobile Countdown (below lg) */}
          <div className="mt-1 flex items-center justify-between gap-2 overflow-x-auto border-t border-zinc-100 py-2 dark:border-white/5 lg:hidden">
            <div className="flex w-full items-center justify-around gap-2">
              {countdowns.map(c => (
                <div key={c.label} className="flex items-center gap-1.5 whitespace-nowrap bg-zinc-50 dark:bg-white/[0.03] px-2 py-1 rounded-md border border-zinc-100 dark:border-white/5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">{c.label[0]}</span>
                  <span className="text-[11px] font-medium text-zinc-800 dark:text-zinc-200">{c.remaining}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
