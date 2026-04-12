import React from 'react';
import { Card, CardBody, ProgressBar, Badge } from '../ui/CardV2';
import { Text, Label, Numeric } from '../ui/Typography';
import { Icons } from './Icons';

/**
 * PrayersCountdowns V2 - Con Design System
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
  
  return (
    <Card variant="elevated" radius="xl" className="overflow-hidden">
      <CardBody className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
          {/* Section 1: Focus Score */}
          <div className="flex flex-col gap-2 w-full sm:flex-1 sm:min-w-0">
            <div className="flex items-center justify-between">
              <Label>Focus Score</Label>
              <Numeric className="text-emerald-600 dark:text-emerald-400 font-bold">
                {percentage}%
              </Numeric>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar 
                  value={percentage} 
                  max={100} 
                  size="lg" 
                  color="emerald"
                  animated={false}
                />
              </div>
              {focusStreak > 0 && (
                <Badge variant="warning" size="md" className="shrink-0">
                  <Icons.Flame className="h-3.5 w-3.5 mr-1" />
                  {focusStreak}
                </Badge>
              )}
            </div>
          </div>

          {/* Divider - hidden on mobile */}
          <div className="hidden sm:block h-12 w-px bg-zinc-200 dark:bg-zinc-700 shrink-0" />

          {/* Section 2: Countdowns - wraps on smaller screens */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-x-4 sm:gap-x-5 lg:gap-x-6 gap-y-3 w-full sm:w-auto">
            {Array.isArray(countdowns) && countdowns.map((c) => (
              <div key={c.label} className="flex flex-col items-center min-w-0 flex-1 sm:flex-initial sm:min-w-[80px] max-w-[120px] sm:max-w-none">
                <Text variant="overline" color="muted" className="truncate w-full text-center" title={c.label}>
                  {c.label}
                </Text>
                <Text variant="h4" className="tabular-nums text-center">
                  {c.remaining}
                </Text>
                <div className="w-full sm:w-12 h-1 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000" 
                    style={{ width: `${(c.pct || 0) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export default PrayersCountdownsV2;
