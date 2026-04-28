import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { useDashboardStore } from '../../store/dashboardStore';
import { startOfDay, addDays, toDateKey, parseSelectedDate } from './DashboardUtils';

export function DayNavigationButtons() {
  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const navigateToPreviousDay = useDashboardStore((s) => s.navigateToPreviousDay);
  const navigateToNextDay = useDashboardStore((s) => s.navigateToNextDay);
  const setSelectedDate = useDashboardStore((s) => s.setSelectedDate);

  const today = new Date();
  const todayKey = toDateKey(today);
  const safeSelectedDate = parseSelectedDate(selectedDate, today);
  const selectedKey = toDateKey(safeSelectedDate);

  // Calculate limits
  const minDate = startOfDay(addDays(today, -365)); // 1 year back
  const maxDate = startOfDay(today); // never allow future dates

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
          <div className="group fixed left-0 top-1/2 z-50 hidden h-44 w-14 -translate-y-1/2 md:block">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-[82%]">
              <motion.button
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.03, x: 10 }}
                onClick={handlePreviousDay}
                className="pointer-events-none relative flex h-40 w-14 items-center justify-center overflow-hidden rounded-r-[34px] border border-l-0 border-white/70 bg-gradient-to-b from-white/95 via-zinc-50/95 to-zinc-100/95 text-white opacity-0 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl ring-1 ring-black/5 transition-all duration-300 ease-out hover:bg-indigo-50 dark:border-white/[0.08] dark:from-zinc-950/95 dark:via-zinc-900/90 dark:to-zinc-900/80 dark:text-white dark:ring-white/[0.06] dark:hover:bg-indigo-500/10 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 translate-x-[-14px]"
                aria-label="Giorno precedente"
              >
                <span className="absolute inset-y-3 left-0 w-px bg-gradient-to-b from-transparent via-indigo-400/50 to-transparent opacity-80" />
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.16),transparent_62%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex h-20 w-8 items-center justify-center rounded-[999px] bg-indigo-600/95 shadow-[0_10px_24px_rgba(79,70,229,0.35)] ring-1 ring-white/15 dark:bg-indigo-500/90 dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                  <Icons.ChevronLeft className="h-6 w-6 text-white drop-shadow-[0_1px_1px_rgba(15,23,42,0.35)]" />
                </div>
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Navigation Button */}
      <AnimatePresence>
        {canGoForward && (
          <div className="group fixed right-0 top-1/2 z-50 hidden h-44 w-14 -translate-y-1/2 md:block">
            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-[82%]">
              <motion.button
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.03, x: -10 }}
                onClick={handleNextDay}
                className="pointer-events-none relative flex h-40 w-14 items-center justify-center overflow-hidden rounded-l-[34px] border border-r-0 border-white/70 bg-gradient-to-b from-white/95 via-zinc-50/95 to-zinc-100/95 text-white opacity-0 shadow-[0_18px_40px_rgba(15,23,42,0.16)] backdrop-blur-xl ring-1 ring-black/5 transition-all duration-300 ease-out hover:bg-indigo-50 dark:border-white/[0.08] dark:from-zinc-950/95 dark:via-zinc-900/90 dark:to-zinc-900/80 dark:text-white dark:ring-white/[0.06] dark:hover:bg-indigo-500/10 group-hover:pointer-events-auto group-hover:opacity-100 group-hover:translate-x-0 translate-x-[14px]"
                aria-label="Giorno successivo"
              >
                <span className="absolute inset-y-3 right-0 w-px bg-gradient-to-b from-transparent via-indigo-400/50 to-transparent opacity-80" />
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(99,102,241,0.16),transparent_62%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="relative flex h-20 w-8 items-center justify-center rounded-[999px] bg-indigo-600/95 shadow-[0_10px_24px_rgba(79,70,229,0.35)] ring-1 ring-white/15 dark:bg-indigo-500/90 dark:shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
                  <Icons.ChevronRight className="h-6 w-6 text-white drop-shadow-[0_1px_1px_rgba(15,23,42,0.35)]" />
                </div>
              </motion.button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Navigation Bar */}
      <div className="fixed inset-x-3 bottom-3 z-50 md:hidden">
        <div className="mx-auto flex max-w-[320px] items-center gap-1 rounded-full border border-white/10 bg-zinc-950/76 px-1 py-1 shadow-[0_10px_24px_rgba(15,23,42,0.22)] backdrop-blur-xl">
          <button
            type="button"
            onClick={handlePreviousDay}
            disabled={!canGoBack}
            className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-white/5 px-2 text-[10px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Giorno precedente"
          >
            <Icons.ChevronLeft className="h-3 w-3" />
            <span>Indietro</span>
          </button>
          {!isToday ? (
            <button
              type="button"
              onClick={handleBackToToday}
              className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-indigo-600 px-2 text-[10px] font-semibold text-white transition-colors hover:bg-indigo-500"
              aria-label="Torna a oggi"
            >
              <Icons.Calendar className="h-3 w-3" />
              <span>Oggi</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleNextDay}
            disabled={!canGoForward}
            className="flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-white/5 px-2 text-[10px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-30"
            aria-label="Giorno successivo"
          >
            <span>Avanti</span>
            <Icons.ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Back to Today Button (shown when not on today) */}
      <AnimatePresence>
        {!isToday && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleBackToToday}
            className="hidden md:flex fixed bottom-4 left-1/2 z-50 -translate-x-1/2 items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-600 px-3 py-2 text-[11px] font-semibold text-white shadow-[0_12px_32px_rgba(79,70,229,0.35)] transition-colors hover:bg-indigo-700 sm:bottom-6 sm:px-4 sm:py-2 sm:text-sm"
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
