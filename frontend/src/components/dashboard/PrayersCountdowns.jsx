import React from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';

export function PrayersCountdowns({ 
  todayPrayerLog, 
  togglePrayer, 
  PRAYERS, 
  countdowns 
}) {
  return (
    <div className="shrink-0 px-6 pt-6 pb-3">
      <div className="dashboard-panel px-3 sm:px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          {/* Prayers */}
          <div className="flex flex-col sm:flex-row flex-1 sm:items-center gap-3 sm:gap-4 min-w-0">
            <h3 className="flex shrink-0 items-center gap-2 dashboard-section-title text-emerald-500 dark:text-emerald-400">
              <Icons.CheckCircle className="w-3.5 h-3.5" /> Prayers
            </h3>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {PRAYERS.map((prayer) => {
                const isDone = todayPrayerLog[prayer];
                return (
                  <label key={prayer} className={`flex h-8 sm:h-9 cursor-pointer items-center gap-2 rounded-lg border px-2 sm:px-3 transition-all ${isDone ? 'border-emerald-400/40 bg-emerald-500/12 dark:border-emerald-500/20 dark:bg-emerald-500/8' : 'border-transparent hover:border-zinc-200 hover:bg-zinc-50 dark:hover:border-white/5 dark:hover:bg-white/[0.03]'}`}>
                    <TaskCheckbox done={isDone} onClick={() => togglePrayer(prayer, !isDone)} />
                    <span className={`text-xs sm:text-sm font-medium ${isDone ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{prayer}</span>
                    <input type="checkbox" className="hidden" checked={!!isDone} readOnly />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block h-8 w-px shrink-0 bg-zinc-200 dark:bg-white/[0.06]" />

          {/* Time Remaining — ancorato a destra */}
          <div className="hidden xl:flex shrink-0 items-center justify-end gap-6">
            <h3 className="dashboard-section-title">Remaining</h3>
            <div className="flex items-center gap-6">
              {countdowns.map(c => (
                <div key={c.label} className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 w-10 shrink-0 font-semibold">{c.label}</span>
                  <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 tabular-nums shrink-0">{c.remaining}</span>
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
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 tabular-nums">{c.remaining}</span>
              </div>
            ))}
          </div>

          {/* Mobile Countdown (below lg) */}
          <div className="flex lg:hidden items-center justify-between gap-2 overflow-x-auto no-scrollbar py-2 border-t border-zinc-100 dark:border-white/5 mt-1">
            <div className="flex w-full items-center justify-around gap-2">
              {countdowns.map(c => (
                <div key={c.label} className="flex items-center gap-1.5 whitespace-nowrap bg-zinc-50 dark:bg-white/[0.03] px-2 py-1 rounded-md border border-zinc-100 dark:border-white/5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">{c.label[0]}</span>
                  <span className="text-[11px] font-black text-zinc-800 dark:text-zinc-200">{c.remaining}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
