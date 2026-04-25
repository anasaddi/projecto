import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardBody, Badge } from '../ui/CardV2';
import { Text, Label, Numeric } from '../ui/Typography';
import { Icons } from './Icons';

type CountdownItem = {
  label: string;
  remaining: string;
  pct: number;
};

type Props = {
  todayPrayerLog: Record<string, boolean>;
  togglePrayer: (name: string, val: boolean) => void;
  PRAYERS: string[];
  countdowns?: CountdownItem[];
  todayFocusScore?: number;
  focusStreak?: number;
};

export function PrayersOptimizedV2({
  todayPrayerLog,
  togglePrayer,
  PRAYERS,
  countdowns = [],
  todayFocusScore = 0,
  focusStreak = 0,
}: Props): React.ReactElement {
  const doneCount = useMemo(
    () => PRAYERS.filter((p) => todayPrayerLog[p]).length,
    [PRAYERS, todayPrayerLog]
  );
  const prayerPct = Math.round((doneCount / (PRAYERS.length || 1)) * 100);
  const focusPct = Math.round(todayFocusScore * 100);
  const nextPrayer = useMemo(
    () => PRAYERS.find((p) => !todayPrayerLog[p]) ?? null,
    [PRAYERS, todayPrayerLog]
  );
  const dayCountdown = countdowns.find((c) => c.label === 'Day') ?? countdowns[0];
  const allDone = doneCount === PRAYERS.length && PRAYERS.length > 0;

  return (
    <Card
      variant="glass"
      radius="xl"
      glow={allDone}
      glowColor="success"
      className="overflow-hidden border-emerald-500/10 dark:border-emerald-400/10"
    >
      <CardBody className="relative p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_35%)]" />

        <div className="relative z-10 grid gap-4 lg:grid-cols-[1.1fr_2fr_1fr] lg:items-center">

          {/* Left — counter + progress */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="relative grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-emerald-500/20 bg-emerald-500/10 shadow-inner shadow-emerald-500/10">
              <div className="absolute inset-2 rounded-2xl border border-white/40 dark:border-white/10" />
              <Numeric className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {doneCount}
              </Numeric>
              <span className="absolute bottom-3 text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700/60 dark:text-emerald-300/60">
                /{PRAYERS.length}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Label>Prayer Flow</Label>
                {focusStreak > 0 && (
                  <Badge variant="warning" size="sm" className="w-fit">
                    <Icons.Flame className="mr-1 h-3 w-3" />
                    {focusStreak} giorni
                  </Badge>
                )}
              </div>
              <Text variant="body-sm" color="muted" className="mt-1 leading-snug">
                {nextPrayer
                  ? `Prossima: ${nextPrayer}`
                  : 'Tutte completate oggi'}
              </Text>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-200/70 dark:bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"
                  initial={false}
                  animate={{ width: `${Math.max(4, prayerPct)}%` }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>

          {/* Center — prayer cards */}
          <div className="grid grid-cols-5 gap-2">
            {PRAYERS.map((prayer, index) => {
              const done = !!todayPrayerLog[prayer];
              const isNext = nextPrayer === prayer;
              return (
                <motion.button
                  key={prayer}
                  type="button"
                  onClick={() => togglePrayer(prayer, !done)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className={[
                    'group relative min-h-[5.75rem] overflow-hidden rounded-2xl border px-2 py-3 text-left transition-all duration-200',
                    done
                      ? 'border-emerald-400/40 bg-emerald-500/15 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.9)]'
                      : isNext
                        ? 'border-indigo-400/50 bg-indigo-500/10 shadow-[0_10px_30px_-18px_rgba(99,102,241,0.9)]'
                        : 'border-zinc-200/70 bg-white/50 hover:border-zinc-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.14]',
                  ].join(' ')}
                >
                  <div className="flex h-full flex-col justify-between gap-3">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={[
                          'grid h-7 w-7 shrink-0 place-items-center rounded-xl border text-xs font-black',
                          done
                            ? 'border-emerald-400/40 bg-emerald-500 text-white'
                            : isNext
                              ? 'border-indigo-400/40 bg-indigo-500 text-white'
                              : 'border-zinc-200 text-zinc-400 dark:border-white/10',
                        ].join(' ')}
                      >
                        {done ? <Icons.Check className="h-4 w-4" /> : index + 1}
                      </span>
                      {isNext && !done && (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={[
                          'truncate text-sm font-black',
                          done
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : isNext
                              ? 'text-indigo-700 dark:text-indigo-300'
                              : 'text-zinc-800 dark:text-zinc-200',
                        ].join(' ')}
                      >
                        {prayer}
                      </div>
                      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                        {done ? 'Done' : isNext ? 'Next' : 'Pending'}
                      </div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Right — stats */}
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-zinc-200/70 bg-white/50 p-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <Text variant="overline" color="muted">Preghiere</Text>
              <Text variant="h4" className="tabular-nums">{prayerPct}%</Text>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white/50 p-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <Text variant="overline" color="muted">Focus</Text>
              <Text variant="h4" className="tabular-nums">{focusPct}%</Text>
            </div>
            <div className="rounded-2xl border border-zinc-200/70 bg-white/50 p-3 dark:border-white/[0.08] dark:bg-white/[0.03]">
              <Text variant="overline" color="muted">Day left</Text>
              <Text variant="h5" className="tabular-nums">{dayCountdown?.remaining ?? '—'}</Text>
            </div>
          </div>

        </div>
      </CardBody>
    </Card>
  );
}

export default PrayersOptimizedV2;
