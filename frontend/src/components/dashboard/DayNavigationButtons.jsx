import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { useDashboardStore } from '../../store/dashboardStore';
import { startOfDay, addDays, toDateKey, parseSelectedDate } from './DashboardUtils';

const MAX_FUTURE_DAYS = 7; // Allow navigating up to 7 days into the future

export function DayNavigationButtons() {
  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const navigateToPreviousDay = useDashboardStore((s) => s.navigateToPreviousDay);
  const navigateToNextDay = useDashboardStore((s) => s.navigateToNextDay);
  const setSelectedDate = useDashboardStore((s) => s.setSelectedDate);

  const today = new Date();
  const todayKey = toDateKey(today);
  const safeSelectedDate = selectedDate instanceof Date ? selectedDate : new Date(selectedDate ?? today);
  const selectedKey = toDateKey(safeSelectedDate);

  // Calculate limits
  const minDate = startOfDay(addDays(today, -365)); // 1 year back
  const maxDate = startOfDay(addDays(today, MAX_FUTURE_DAYS)); // 7 days forward

  const canGoBack = startOfDay(safeSelectedDate) > minDate;
  const canGoForward = startOfDay(safeSelectedDate) < maxDate;

  const isToday = selectedKey === todayKey;

  const handlePreviousDay = () => {
    if (canGoBack) {
      navigateToPreviousDay();
    }
  };

  const handleNextDay = () => {
    if (canGoForward) {
      navigateToNextDay();
    }
  };

  const handleBackToToday = () => {
    setSelectedDate(new Date());
  };

  return (
    <>
      {/* Left Navigation Button */}
      <AnimatePresence>
        {canGoBack && (
          <div className="group fixed left-0 top-0 bottom-0 z-50 hidden w-20 md:block">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1">
              <motion.button
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.04, x: 4 }}
                onClick={handlePreviousDay}
                className="pointer-events-none relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-r-[22px] border border-l-0 border-white/70 bg-gradient-to-b from-white/95 via-white/90 to-zinc-50/90 text-zinc-600 opacity-0 shadow-[0_14px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl ring-1 ring-black/5 transition-all duration-200 ease-out hover:bg-indigo-50 dark:border-white/[0.08] dark:from-zinc-950/95 dark:via-zinc-900/90 dark:to-zinc-900/80 dark:text-zinc-300 dark:ring-white/[0.06] dark:hover:bg-indigo-500/10 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-14px]"
                aria-label="Giorno precedente"
              >
                <span className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-indigo-400/40 to-transparent opacity-70" />
                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/8 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <Icons.ChevronLeft className="h-6 w-6" />
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Navigation Button */}
      <AnimatePresence>
        {canGoForward && (
          <div className="group fixed right-0 top-0 bottom-0 z-50 hidden w-20 md:block">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1">
              <motion.button
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.04, x: -4 }}
                onClick={handleNextDay}
                className="pointer-events-none relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-l-[22px] border border-r-0 border-white/70 bg-gradient-to-b from-white/95 via-white/90 to-zinc-50/90 text-zinc-600 opacity-0 shadow-[0_14px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl ring-1 ring-black/5 transition-all duration-200 ease-out hover:bg-indigo-50 dark:border-white/[0.08] dark:from-zinc-950/95 dark:via-zinc-900/90 dark:to-zinc-900/80 dark:text-zinc-300 dark:ring-white/[0.06] dark:hover:bg-indigo-500/10 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 translate-x-[14px]"
                aria-label="Giorno successivo"
              >
                <span className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-indigo-400/40 to-transparent opacity-70" />
                <span className="absolute inset-0 bg-gradient-to-l from-indigo-500/8 via-transparent to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                <Icons.ChevronRight className="h-6 w-6" />
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Back to Today Button (shown when not on today) */}
      <AnimatePresence>
        {!isToday && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleBackToToday}
            className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white shadow-[0_12px_32px_rgba(79,70,229,0.35)] transition-colors hover:bg-indigo-700 sm:bottom-6 sm:px-4 sm:py-2 sm:text-sm"
            aria-label="Torna a oggi"
          >
            <Icons.Calendar className="w-4 h-4" />
            <span>Torna a oggi</span>
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
