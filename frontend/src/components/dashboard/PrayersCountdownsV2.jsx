import React from 'react';
import { motion } from 'framer-motion';
import { Card, Badge } from './Card';
import { Icons } from './Icons';

/**
 * PrayersCountdowns V3 - Dark Glass Theme con SVG Circle
 * @param {{
 *   todayPrayerLog: Record<string, boolean>;
 *   togglePrayer: (name: string, val: boolean) => void;
 *   PRAYERS: string[];
 *   countdowns?: Array<{ label: string; remaining: string; pct: number }>;
 *   todayFocusScore?: number;
 *   focusStreak?: number;
 * }} props
 */
export function PrayersCountdownsV2({
  todayPrayerLog,
  togglePrayer,
  PRAYERS,
  countdowns = [],
  todayFocusScore = 0,
  focusStreak = 0
}) {
  const percentage = Math.round(todayFocusScore * 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">

          {/* Section 1: Focus Score - Animated SVG Circle */}
          <div className="flex items-center gap-4 w-full sm:flex-1 sm:min-w-0">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-200 dark:text-zinc-800" />
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
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">{percentage}%</span>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Focus Score</span>
              {focusStreak > 0 && (
                <Badge variant="warning" size="sm" className="w-fit">
                  <Icons.Flame className="h-3 w-3 mr-1" />
                  {focusStreak} giorni
                </Badge>
              )}
            </div>
          </div>

          <div className="hidden sm:block h-12 w-px bg-zinc-200 dark:bg-white/[0.06] shrink-0" />

          {/* Section 2: Prayer Pills */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {PRAYERS.map((prayer) => {
              const done = !!todayPrayerLog[prayer];
              return (
                <button
                  key={prayer}
                  onClick={() => togglePrayer(prayer, !done)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                    done
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                      : 'bg-zinc-100/80 dark:bg-white/[0.04] text-zinc-600 dark:text-zinc-400 border border-zinc-200/70 dark:border-white/[0.08] hover:border-zinc-300 dark:hover:border-white/[0.14]'
                  }`}
                >
                  {prayer}
                </button>
              );
            })}
          </div>

          <div className="hidden sm:block h-12 w-px bg-zinc-200 dark:bg-white/[0.06] shrink-0" />

          {/* Section 3: Countdowns */}
          <div className="grid grid-cols-3 sm:flex items-center gap-4 w-full sm:w-auto">
            {Array.isArray(countdowns) && countdowns.slice(0, 3).map((c) => (
              <div key={c.label} className="text-center flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">{c.label}</span>
                <span className="text-sm font-black tabular-nums text-zinc-900 dark:text-zinc-100">{c.remaining}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </Card>
  );
}

export default PrayersCountdownsV2;

