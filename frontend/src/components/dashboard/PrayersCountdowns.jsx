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
      <CardBody padding="normal" className="flex items-center gap-8 py-4">
        {/* Section 1: Progress Score (Expanded) */}
        <div className="flex flex-col flex-1 gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Focus Score</span>
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{Math.round(todayFocusScore * 100)}%</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <ProgressBar value={todayFocusScore * 100} max={100} size="md" color="emerald" />
            </div>
            {focusStreak > 0 && (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 shrink-0 shadow-sm shadow-orange-500/5">
                <Icons.Flame className="h-3.5 w-3.5 text-orange-500" />
                <span className="text-xs font-black text-orange-600 dark:text-orange-400 tabular-nums">{focusStreak}</span>
              </div>
            )}
          </div>
        </div>

        <div className="h-10 w-px bg-zinc-100 dark:bg-white/[0.04] shrink-0" />

        {/* Section 2: Periodic Countdowns (Expanded) */}
        <div className="flex items-center gap-8 shrink-0">
          {Array.isArray(countdowns) && countdowns.map((c) => (
            <div key={c.label} className="flex flex-col items-center min-w-[80px]">
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
                {c.label}
              </span>
              <span className="text-base font-bold tabular-nums text-zinc-900 dark:text-zinc-50 tracking-tight">
                {c.remaining}
              </span>
              <div className="w-12 h-[3px] bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden mt-1.5">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" 
                  style={{ width: `${(c.pct || 0) * 100}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
