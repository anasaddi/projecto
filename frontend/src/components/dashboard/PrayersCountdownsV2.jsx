import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Badge } from '../ui/CardV2';
import { Text, Label, Numeric } from '../ui/Typography';
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
    <Card variant="glass" radius="xl" className="overflow-hidden">
      <CardBody className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Section 1: Focus Score - Animated SVG Circle */}
          <div className="flex items-center gap-4 w-full sm:flex-1 sm:min-w-0">
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-zinc-200 dark:text-zinc-800"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="url(#gradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="drop-shadow-lg"
                />
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Numeric className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {percentage}%
                </Numeric>
              </div>
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <Label>Focus Score</Label>
              {focusStreak > 0 && (
                <Badge variant="warning" size="sm" className="w-fit">
                  <Icons.Flame className="h-3 w-3 mr-1" />
                  {focusStreak} giorni
                </Badge>
              )}
            </div>
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block h-12 w-px bg-white/10 dark:bg-white/5 shrink-0" />

          {/* Section 2: Prayer Pills */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {PRAYERS.map((prayer) => {
              const done = todayPrayerLog[prayer];
              return (
                <button
                  key={prayer}
                  onClick={() => togglePrayer(prayer, !done)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200
                    ${done 
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                      : 'bg-white/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-white/10 dark:border-white/5 hover:bg-white/10'
                    }
                  `}
                >
                  {prayer}
                </button>
              );
            })}
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block h-12 w-px bg-white/10 dark:bg-white/5 shrink-0" />

          {/* Section 3: Countdowns - Minimal */}
          <div className="grid grid-cols-3 sm:flex items-center gap-3 w-full sm:w-auto">
            {Array.isArray(countdowns) && countdowns.slice(0, 3).map((c) => (
              <div key={c.label} className="text-center">
                <Text variant="overline" color="muted" className="text-[10px]">
                  {c.label}
                </Text>
                <Text variant="h5" className="tabular-nums">
                  {c.remaining}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default PrayersCountdownsV2;
