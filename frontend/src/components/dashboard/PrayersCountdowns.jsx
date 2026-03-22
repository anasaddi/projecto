import React from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { Card, CardBody, ProgressBar } from './Card';

export function PrayersCountdowns({
  todayPrayerLog,
  togglePrayer,
  PRAYERS,
  countdowns = [],
  todayFocusScore = 0,
  focusStreak = 0
}) {
  return (
    <Card className="flex flex-col min-h-0 bg-white/80 dark:bg-[#0b0e14]/80 backdrop-blur-xl border-zinc-200/50 dark:border-white/[0.06] shadow-sm dark:shadow-black/50">
      <CardBody padding="normal" className="flex items-center gap-4 py-2.5">
        {/* Section 1: Prayers icons only */}
        <div className="flex items-center gap-1.5 shrink-0 px-2">
          {PRAYERS.map((p) => (
            <div key={p} className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                {p[0]}
              </span>
              <TaskCheckbox
                done={!!todayPrayerLog[p]}
                onClick={() => togglePrayer(p, !todayPrayerLog[p])}
                className="scale-[0.85]"
              />
            </div>
          ))}
        </div>

        <div className="h-6 w-px bg-zinc-100 dark:bg-white/[0.04] shrink-0 mx-1" />

        {/* Section 2: Progress Score */}
        <div className="flex flex-1 items-center gap-4 px-2 min-w-[120px]">
          <div className="flex-1">
            <ProgressBar value={todayFocusScore * 100} max={100} size="md" color="emerald" showLabel />
          </div>
          {focusStreak > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 shrink-0">
              <Icons.Flame className="h-3 w-3 text-orange-500" />
              <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 tabular-nums">{focusStreak}</span>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-zinc-100 dark:bg-white/[0.04] shrink-0 mx-1" />

        {/* Section 3: Periodic Countdowns */}
        <div className="flex items-center gap-5 shrink-0 px-2 min-w-[180px]">
          {Array.isArray(countdowns) && countdowns.map((c) => (
            <div key={c.label} className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                {c.label}
              </span>
              <span className="text-xs font-bold tabular-nums text-zinc-800 dark:text-zinc-200 leading-none mt-0.5">
                {c.remaining}
              </span>
              <div className="w-8 h-[2px] bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden mt-1">
                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(c.pct || 0) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
