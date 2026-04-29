import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, Badge } from './Card';
import { Icons } from './Icons';
import { MS } from '../../constants';

const TIME_BAR_CONFIGS = [
  { key: 'Day',   gradient: 'from-indigo-500 to-violet-500',   bg: 'bg-transparent',   label: 'Day',   ring: 'ring-zinc-200 dark:ring-white/[0.08]' },
  { key: 'Week',  gradient: 'from-indigo-500 to-violet-500',  bg: 'bg-transparent',  label: 'Week',  ring: 'ring-zinc-200 dark:ring-white/[0.08]' },
  { key: 'Month', gradient: 'from-indigo-500 to-violet-500',  bg: 'bg-transparent',  label: 'Month', ring: 'ring-zinc-200 dark:ring-white/[0.08]' },
  { key: 'Year',  gradient: 'from-indigo-500 to-violet-500',  bg: 'bg-transparent',  label: 'Year',  ring: 'ring-zinc-200 dark:ring-white/[0.08]' },
];

/**
 * PrayersCountdowns V3 - Dark Glass Theme con SVG Circle
 * @param {{
 *   todayFocusScore?: number;
 *   focusStreak?: number;
 *   countdowns?: Array<{ label: string; remaining: string; pct: number }>;
 *   selectedDate?: Date;
 *   formattedDate?: string;
 *   isToday?: boolean;
 * }} props
 */
export function PrayersCountdownsV2({
  todayFocusScore = 0,
  focusStreak = 0,
  countdowns = [],
  selectedDate,
  formattedDate,
  isToday = true,
}) {
  const percentage = Math.round(todayFocusScore * 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Build year progress from selectedDate (falls back to now for today)
  const yearRef = selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime()) ? selectedDate : new Date();
  const startOfYear = new Date(yearRef.getFullYear(), 0, 1);
  const endOfYear = new Date(yearRef.getFullYear() + 1, 0, 1);
  const yearPct = (yearRef.getTime() - startOfYear.getTime()) / (endOfYear.getTime() - startOfYear.getTime());
  const yearRemaining = endOfYear.getTime() - yearRef.getTime();
  const yearDays = Math.floor(yearRemaining / MS.DAY);
  const dateLabel = selectedDate instanceof Date && !Number.isNaN(selectedDate.getTime())
    ? selectedDate.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' })
    : (formattedDate || (isToday ? 'Oggi' : 'Data selezionata'));

  const allBars = [
    ...(Array.isArray(countdowns) ? countdowns : []),
    { label: 'Year', remaining: `${yearDays}d`, pct: yearPct },
  ];

  return (
    <Card className="overflow-hidden">
      <CardHeader
        icon={Icons.Zap}
        iconColor="text-indigo-500"
        title="Focus Score"
        subtitle={isToday ? "Progressi giornalieri" : formattedDate || "Progressi"}
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="default" size="sm" className="whitespace-nowrap">
              <Icons.Calendar className="h-3 w-3 mr-1" />
              {dateLabel}
            </Badge>
            {focusStreak > 0 ? (
              <Badge variant="warning" size="sm" className="whitespace-nowrap">
                <Icons.Flame className="h-3 w-3 mr-1" />
                {focusStreak} giorni
              </Badge>
            ) : null}
          </div>
        }
      />
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:gap-6">

          {/* Section 1: Focus Score - Animated SVG Circle */}
          <div className="flex items-center justify-center gap-4 w-full">
            <div className="relative h-20 w-20 shrink-0">
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
            <div className="flex flex-col gap-1 flex-1 sm:hidden">
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{percentage}%</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">completato oggi</span>
            </div>
          </div>

          {/* Section 2: Time Period Progress Bars - compact, no scroll */}
          <div className="flex w-full justify-between gap-1 sm:gap-2">
            {allBars.map((bar) => {
              const cfg = TIME_BAR_CONFIGS.find(c => c.key === bar.label) || TIME_BAR_CONFIGS[0];
              const pct = Math.min(1, Math.max(0, bar.pct ?? 0));
              return (
                <div key={bar.label} className="flex flex-1 min-w-0 flex-col gap-1 rounded-xl ring-1 px-2 py-1.5 sm:px-4 sm:py-2.5">
                  <div className="flex items-center justify-between gap-1 whitespace-nowrap">
                    <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{bar.label}</span>
                    <span className="text-[9px] sm:text-[11px] font-bold tabular-nums text-zinc-400 dark:text-zinc-500">{Math.round(pct * 100)}%</span>
                  </div>
                  <div className="h-1 sm:h-2 w-full rounded-full bg-zinc-200/70 dark:bg-zinc-800/80 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full bg-gradient-to-r ${cfg.gradient}`}
                      initial={false}
                      animate={{ width: `${Math.max(2, pct * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-[10px] sm:text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">{bar.remaining}</span>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </Card>
  );
}

export default PrayersCountdownsV2;

