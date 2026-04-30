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
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col gap-4 sm:gap-6">

          {/* Section 1: Focus Score */}
          <div className="flex flex-col items-center justify-center gap-4 w-full sm:flex-row sm:justify-start sm:gap-6">
            <div className="relative h-32 w-32 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-zinc-100 dark:text-dark-borderSubtle" />
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
                    <stop offset="0%" stopColor="#7C5CFF" />
                    <stop offset="100%" stopColor="#9B82FF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-zinc-900 dark:text-white tabular-nums tracking-tighter">{percentage}%</span>
              </div>
            </div>
            
            <div className="text-center sm:text-left flex flex-col justify-center">
              <h4 className="text-[18px] font-bold text-zinc-800 dark:text-dark-textPrimary leading-tight">
                {percentage === 100 ? 'Giornata perfetta!' : percentage > 70 ? 'Ottimo lavoro finora!' : percentage > 30 ? 'Sei sulla buona strada.' : 'Pronto per iniziare'}
              </h4>
            </div>
          </div>

          {/* Section 2: Time Period Progress Bars - 2x2 grid on mobile, row on desktop */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:w-full sm:justify-between sm:gap-3 mt-2">
            {allBars.map((bar) => {
              const pct = Math.min(1, Math.max(0, bar.pct ?? 0));
              return (
                <div key={bar.label} className="flex flex-col gap-1.5 rounded-2xl bg-zinc-50 dark:bg-dark-surface2 p-3 sm:flex-1 sm:min-w-0 border border-zinc-100 dark:border-dark-borderSubtle">
                  <div className="flex items-center justify-between gap-1 whitespace-nowrap">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500 dark:text-dark-textSecondary">{bar.label}</span>
                    <span className="text-[10px] font-[650] tabular-nums text-zinc-400 dark:text-dark-textMuted">{bar.remaining}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-dark-surface3 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-indigo-500 dark:bg-dark-violet"
                      initial={false}
                      animate={{ width: `${Math.max(2, pct * 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                    />
                  </div>
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

