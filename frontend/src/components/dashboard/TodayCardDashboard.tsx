import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, ChevronDown, ChevronUp } from 'lucide-react';
import { useTodayTraining } from '../../hooks/useTodayTraining';
import { useDashboardStore } from '../../store/dashboardStore';
import TodayCard from '../training/TodayCard';
import { Card, CardHeader, Badge } from './Card';

interface TodayCardDashboardProps {
  defaultExpanded?: boolean;
}

// Skeleton for loading state
const TodayCardSkeleton = () => (
  <div className="flex flex-col gap-4">
    {/* Header skeleton */}
    <div className="flex items-end justify-between px-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        <div className="flex flex-col gap-2">
          <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          <div className="h-8 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2">
        <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-2 w-36 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
      </div>
    </div>

    {/* Card skeleton */}
    <div className="rounded-[30px] border border-zinc-200/60 dark:border-white/[0.08] bg-white/95 dark:bg-[#090a0b]/90 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col min-h-[300px] border-r border-zinc-100 dark:border-white/[0.04] last:border-r-0">
            {/* Section header skeleton */}
            <div className="flex items-center justify-between px-5 py-4 bg-zinc-50/80 dark:bg-white/[0.03] border-b border-zinc-200/50 dark:border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
            {/* Exercise rows skeleton */}
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-white/[0.04]">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3 py-3.5 px-4">
                  <div className="h-6 w-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                    <div className="h-3 w-12 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
                    <div className="h-6 w-6 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export function TodayCardDashboard({ defaultExpanded = true }: TodayCardDashboardProps): React.ReactElement {
  const isExpanded = useDashboardStore((s) =>
    typeof s.todayTrainingExpanded === 'boolean' ? s.todayTrainingExpanded : defaultExpanded
  );
  const setTodayTrainingExpanded = useDashboardStore((s) => s.setTodayTrainingExpanded);
  const dashboardSelectedDate = useDashboardStore((s) => s.selectedDate);
  const toggleTodayTrainingExpanded = () => {
    const current = useDashboardStore.getState().todayTrainingExpanded;
    setTodayTrainingExpanded(!current);
  };
  const selectedDateKey = dashboardSelectedDate instanceof Date
    ? dashboardSelectedDate.toISOString().slice(0, 10)
    : (typeof dashboardSelectedDate === 'string' ? dashboardSelectedDate.slice(0, 10) : undefined);
  const {
    selectedDay,
    allProgressions,
    awProgram,
    selectedDate,
    progressPercent,
    loading,
    error,
    onProgressionChange,
  } = useTodayTraining(selectedDateKey);

  // Show visible fallback when there's no workout today or if an error occurs
  if ((error && !loading) || (!loading && !selectedDay?.exercises?.length && !error)) {
    return (
      <Card className="flex flex-col overflow-hidden">
        <CardHeader
          icon={Dumbbell}
          iconColor="text-indigo-500"
          title="Training"
          subtitle={error ? 'Unable to load workout' : 'Rest day / no workout scheduled'}
          action={
            <Badge variant="primary" size="sm">
              {error ? '--' : 'REST'}
            </Badge>
          }
        />
        <div className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
          <p>
            {error
              ? 'Could not load today\'s training data. The server may be unavailable.'
              : 'No training session is scheduled for today. You can still review your workout history or keep the card collapsed.'}
          </p>
        </div>
      </Card>
    );
  }

  const todayDateStr = new Date().toISOString().slice(0, 10);
  const isToday = selectedDate?.slice(0, 10) === todayDateStr;

  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader
        icon={Dumbbell}
        iconColor="text-indigo-500"
        title="Training"
        subtitle="Today's workout session"
        action={
          <div className="flex items-center gap-2">
            {!loading && (
              <Badge variant={progressPercent === 100 ? 'success' : 'primary'} size="sm">
                {progressPercent}%
              </Badge>
            )}
            <button
              onClick={toggleTodayTrainingExpanded}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
              )}
            </button>
          </div>
        }
      />

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0">
              {loading ? (
                <TodayCardSkeleton />
              ) : (
                <TodayCard
                  selectedDay={selectedDay}
                  allProgressions={allProgressions}
                  selectedDate={selectedDate}
                  progressPercent={progressPercent}
                  isToday={isToday}
                  onProgressionChange={onProgressionChange}
                  awProgram={awProgram}
                  embedded
                  anasOnly
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
