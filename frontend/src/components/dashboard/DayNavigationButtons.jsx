import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { useDashboardStore } from '../../store/dashboardStore';
import { startOfDay, addDays, toDateKey } from './DashboardUtils';

const MAX_FUTURE_DAYS = 7; // Allow navigating up to 7 days into the future

export function DayNavigationButtons() {
  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const navigateToPreviousDay = useDashboardStore((s) => s.navigateToPreviousDay);
  const navigateToNextDay = useDashboardStore((s) => s.navigateToNextDay);
  const setSelectedDate = useDashboardStore((s) => s.setSelectedDate);

  const [hoverLeft, setHoverLeft] = useState(false);
  const [hoverRight, setHoverRight] = useState(false);

  const today = new Date();
  const todayKey = toDateKey(today);
  const selectedKey = toDateKey(selectedDate);

  // Calculate limits
  const minDate = startOfDay(addDays(today, -365)); // 1 year back
  const maxDate = startOfDay(addDays(today, MAX_FUTURE_DAYS)); // 7 days forward

  const canGoBack = startOfDay(selectedDate) > minDate;
  const canGoForward = startOfDay(selectedDate) < maxDate;

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
        {hoverLeft && canGoBack && (
          <motion.button
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handlePreviousDay}
            onMouseEnter={() => setHoverLeft(true)}
            onMouseLeave={() => setHoverLeft(false)}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-r border-zinc-200 dark:border-zinc-700 shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            aria-label="Giorno precedente"
          >
            <Icons.ChevronLeft className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Right Navigation Button */}
      <AnimatePresence>
        {hoverRight && canGoForward && (
          <motion.button
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleNextDay}
            onMouseEnter={() => setHoverRight(true)}
            onMouseLeave={() => setHoverRight(false)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 p-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-l border-zinc-200 dark:border-zinc-700 shadow-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
            aria-label="Giorno successivo"
          >
            <Icons.ChevronRight className="w-6 h-6 text-zinc-600 dark:text-zinc-300" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Hover detection zones (invisible) */}
      <div
        className="fixed left-0 top-0 bottom-0 w-20 z-40"
        onMouseEnter={() => setHoverLeft(true)}
        onMouseLeave={() => setHoverLeft(false)}
      />
      <div
        className="fixed right-0 top-0 bottom-0 w-20 z-40"
        onMouseEnter={() => setHoverRight(true)}
        onMouseLeave={() => setHoverRight(false)}
      />

      {/* Back to Today Button (shown when not on today) */}
      <AnimatePresence>
        {!isToday && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleBackToToday}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg text-sm font-semibold transition-colors flex items-center gap-2"
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
