import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { PRAYER_SLOTS, getCurrentSlotKey } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { Card, CardHeader } from './Card';

// Confirmation Dialog for Future Prayer Completion
function PrayerConfirmationDialog({ isOpen, onClose, onConfirm, prayerName, prayerTime }) {
  if (!isOpen) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm mx-4 bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl p-6 border border-zinc-200 dark:border-zinc-700"
      >
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
            <Icons.Clock className="w-8 h-8 text-sky-600 dark:text-sky-400" />
          </div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Completare {prayerName} in anticipo?
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
            L'orario di {prayerName} è alle <span className="font-mono font-bold">{prayerTime}</span>. Sei sicuro di volerla completare ora?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={() => { onConfirm(); onClose(); }}
              className="flex-1 px-4 py-3 rounded-xl font-semibold text-sm bg-sky-500 text-white hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/30"
            >
              Conferma
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// Mock degli orari di default
const DEFAULT_PRAYER_TIMES = {
  Fajr: '05:24', Dhuhr: '12:31', Asr: '15:47', Maghrib: '18:22', Isha: '19:48'
};

// Hook orari preghiere (Mantenuto per la logica perfetta)
function usePrayerTimes() {
  const [times, setTimes] = useState(DEFAULT_PRAYER_TIMES);
  const [locationName, setLocationName] = useState('');
  const [usingFallback, setUsingFallback] = useState(true);
  
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const date = new Date();
        // Format: DD-MM-YYYY with zero padding
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const dateStr = `${day}-${month}-${year}`;
        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=3&school=1`
        );
        const data = await response.json();
        if (data.code === 200 && data.data) {
          const timings = data.data.timings;
          setUsingFallback(false);
          setTimes({
            Fajr: timings.Fajr?.substring(0, 5) || DEFAULT_PRAYER_TIMES.Fajr,
            Dhuhr: timings.Dhuhr?.substring(0, 5) || DEFAULT_PRAYER_TIMES.Dhuhr,
            Asr: timings.Asr?.substring(0, 5) || DEFAULT_PRAYER_TIMES.Asr,
            Maghrib: timings.Maghrib?.substring(0, 5) || DEFAULT_PRAYER_TIMES.Maghrib,
            Isha: timings.Isha?.substring(0, 5) || DEFAULT_PRAYER_TIMES.Isha
          });
          try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=it`);
            const geoData = await geoRes.json();
            setLocationName(geoData.city || geoData.locality || '');
          } catch (e) {
            // Silently fail - location name is optional feature
          }
        }
      } catch (err) {
        console.warn('Failed to fetch prayer times:', err);
      }
    }, () => {
      // Geolocation denied or failed - use default prayer times
      setUsingFallback(true);
    });
  }, []);
  
  return { times, locationName, usingFallback };
}

function getSlotLabel(slotKey) {
  const [from, to] = slotKey.split('-');
  return `${from} → ${to}`;
}

// Converte "HH:MM" in minuti totali dalla mezzanotte
function parseMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return NaN;
  const [h, m] = timeStr.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}


// --- HABIT SELECTOR (UX/UI Ultra-Premium) - Portal per evitare clip nella card ---
function HabitSelector({ activeHabits, onSelect, onClose, triggerEl }) {
  const ref = useRef(null);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    if (triggerEl) {
      const rect = triggerEl.getBoundingClientRect();
      const popupWidth = 260;
      const margin = 8;

      // Measure actual popup height after render, fallback to estimate
      const popupHeight = ref.current?.offsetHeight || 280;

      // Prefer opening below, fall back to above if not enough space
      const spaceBelow = window.innerHeight - rect.bottom;
      let top = spaceBelow >= popupHeight + margin
        ? rect.bottom + margin
        : rect.top - popupHeight - margin;

      // Clamp so popup stays fully visible vertically
      top = Math.max(margin, Math.min(top, window.innerHeight - popupHeight - margin));

      // Center popup horizontally relative to the trigger button
      let left = rect.left + rect.width / 2 - popupWidth / 2;
      // Clamp so it doesn't go off-screen
      left = Math.max(margin, Math.min(left, window.innerWidth - popupWidth - margin));

      setPosition({ top, left });
    }
  }, [triggerEl]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target) && triggerEl && !triggerEl.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerEl]);

  if (!position) return null;

  const content = (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed w-[260px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl z-[9999] p-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
      style={{ position: 'fixed', top: position.top, left: position.left }}
    >
      <div className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest px-3 py-2 mb-1">
        Aggiungi Micro-Vittoria
      </div>
      <div className="max-h-[220px] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
        {activeHabits.length === 0 ? (
          <div className="px-3 py-4 text-xs text-center text-zinc-500 italic">Nessuna abitudine sbloccata</div>
        ) : (
          activeHabits.map((h, i) => (
            <motion.button
              key={h.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => { onSelect(h.id); onClose(); }}
              className="group flex items-center justify-between w-full px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200 active:scale-[0.98]"
            >
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate pr-2">
                {h.title}
              </span>
              <Icons.Plus className="w-4 h-4 text-zinc-300 dark:text-zinc-600 group-hover:text-indigo-500 shrink-0 transition-colors" />
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );

  return createPortal(content, document.body);
}

// --- WIDGET PRINCIPALE ---
export function DailyTimelineWidget2({ PRAYERS, todayKey, todayPrayerLog, togglePrayer, isToday = true }) {
  const timelineRoutines = useDashboardStore((s) => s.timelineRoutines) ?? {};
  const addTimelineRoutine = useDashboardStore((s) => s.addTimelineRoutine);
  const toggleTimelineRoutine = useDashboardStore((s) => s.toggleTimelineRoutine);
  const removeTimelineRoutine = useDashboardStore((s) => s.removeTimelineRoutine);
  const dailyTaskTemplates = useDashboardStore((s) => s.dailyTaskTemplates) ?? [];
  const dailyCompletionLog = useDashboardStore((s) => s.dailyCompletionLog) ?? {};
  const timelinePanelExpanded = useDashboardStore((s) => s.timelinePanelExpanded);
  const setTimelinePanelExpanded = useDashboardStore((s) => s.setTimelinePanelExpanded);

  const [selectorOpenSlot, setSelectorOpenSlot] = useState(null);
  const [selectorOpenEl, setSelectorOpenEl] = useState(null);
  const winTriggerEls = useRef(new Map());
  const { times: PRAYER_TIMES, locationName, usingFallback: prayerFallback } = usePrayerTimes();
  const [currentPrayerIndex, setCurrentPrayerIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  // Tick every 60s so time-dependent memos stay fresh
  const [minuteTick, setMinuteTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMinuteTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  // Calculate oldest missing prayer as starting point - ONLY on mount or date change
  useEffect(() => {
    if (!isToday) {
      setCurrentPrayerIndex(0);
      return;
    }
    
    // Find the oldest missing prayer
    let oldestMissingIndex = 0;
    for (let i = 0; i < PRAYERS.length; i++) {
      if (!todayPrayerLog[PRAYERS[i]]) {
        oldestMissingIndex = i;
        break;
      }
    }
    setCurrentPrayerIndex(oldestMissingIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday, todayKey]);

  // Handle swipe navigation
  const handlePrevious = () => {
    if (currentPrayerIndex > 0) {
      setDirection(-1);
      setCurrentPrayerIndex(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (currentPrayerIndex < PRAYERS.length - 1) {
      setDirection(1);
      setCurrentPrayerIndex(prev => prev + 1);
    }
  };
  
  // Handle prayer toggle — always toggle directly, no confirmation modal
  const handlePrayerToggle = (prayer, currentlyDone) => {
    togglePrayer?.(prayer, !currentlyDone);
  };
  
  // Calculate timeline progress based on actual prayer times
  const timelineProgress = useMemo(() => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    // Convert prayer times to minutes
    const toMinutes = (timeStr) => {
      const [h, m] = timeStr.split(':').map(Number);
      return h * 60 + m;
    };
    
    const prayerMinutes = [
      toMinutes(PRAYER_TIMES.Fajr),
      toMinutes(PRAYER_TIMES.Dhuhr),
      toMinutes(PRAYER_TIMES.Asr),
      toMinutes(PRAYER_TIMES.Maghrib),
      toMinutes(PRAYER_TIMES.Isha),
      toMinutes(PRAYER_TIMES.Fajr) + 24 * 60 // Next day Fajr
    ];
    
    // Find current position in the day cycle
    let progress = 0;
    
    for (let i = 0; i < prayerMinutes.length - 1; i++) {
      const start = prayerMinutes[i];
      const end = prayerMinutes[i + 1];
      const slotDuration = end - start;
      
      if (currentMinutes >= start && currentMinutes < end) {
        // Current time is within this slot
        const elapsed = currentMinutes - start;
        const slotProgress = elapsed / slotDuration;
        // Progress = (completed slots + current slot progress) / total slots
        progress = (i + slotProgress) / (PRAYERS.length - 1);
        break;
      } else if (currentMinutes < start && i === 0) {
        // Before Fajr (late night, in Isha-Fajr slot)
        const elapsed = currentMinutes + (24 * 60 - prayerMinutes[4]);
        const slotDuration2 = prayerMinutes[5] - prayerMinutes[4];
        const slotProgress = elapsed / slotDuration2;
        progress = (4 + slotProgress) / (PRAYERS.length - 1);
        break;
      }
    }
    
    return Math.min(1, Math.max(0, progress));
  }, [PRAYER_TIMES, minuteTick]);
  
  const activeHabits = useMemo(() => dailyTaskTemplates.filter(t => !t.locked), [dailyTaskTemplates]);
  const habitMap = useMemo(() => {
    const m = {};
    (dailyTaskTemplates || []).forEach(h => { m[h.id] = h.title; });
    return m;
  }, [dailyTaskTemplates]);
  const eventsToday = useMemo(() => dailyCompletionLog[todayKey]?.events || [], [dailyCompletionLog, todayKey]);
  const slotsForDay = useMemo(() => timelineRoutines[todayKey] || {}, [timelineRoutines, todayKey]);
  const currentSlotKey = isToday ? getCurrentSlotKey(new Date(), PRAYER_TIMES) : null;
  const isCollapsed = !timelinePanelExpanded;
  const toggleTimelinePanel = () => {
    const current = useDashboardStore.getState().timelinePanelExpanded;
    setTimelinePanelExpanded(!current);
  };
  const nowMinutes = useMemo(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }, [minuteTick]);

  const prayerMinutes = useMemo(() => {
    const values = PRAYERS.map((p) => parseMinutes(PRAYER_TIMES[p]));
    if (values.length) values.push(values[0] + 24 * 60);
    return values;
  }, [PRAYERS, PRAYER_TIMES]);

  const getPrayerState = (idx, isDone, completedAtTimestamp = null) => {
    const start = prayerMinutes[idx];
    const end = prayerMinutes[idx + 1];

    // PAST DAYS: classify by timestamp vs slot end
    if (!isToday) {
      if (isDone && completedAtTimestamp && Number.isFinite(end)) {
        const completedAt = new Date(completedAtTimestamp);
        const completedMinutes = completedAt.getHours() * 60 + completedAt.getMinutes();
        const wasLate = completedMinutes > end;
        return {
          badge: wasLate ? 'In ritardo' : 'Completata',
          checkboxClass: wasLate
            ? 'bg-orange-500 border-orange-400 text-white shadow-[0_0_15px_rgba(249,115,22,0.35)]'
            : 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]',
          labelClass: wasLate ? 'text-orange-600 dark:text-orange-400' : 'text-emerald-600 dark:text-emerald-400',
        };
      }
      return {
        badge: isDone ? 'Completata' : 'Mancante',
        checkboxClass: isDone
          ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
          : 'bg-rose-500 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]',
        labelClass: isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      };
    }

    // TODAY: fallback when slot times aren’t available
    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return {
        badge: isDone ? 'Completata' : 'In attesa',
        checkboxClass: isDone
          ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)]'
          : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-indigo-400 hover:text-indigo-500',
        labelClass: isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400',
      };
    }

    // TODAY, not yet done
    if (!isDone) {
      if (nowMinutes > end) {
        return {
          badge: 'Mancante',
          checkboxClass: 'bg-rose-500 border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]',
          labelClass: 'text-rose-600 dark:text-rose-400',
        };
      }
      if (nowMinutes >= start && nowMinutes < end) {
        return {
          badge: 'Ora',
          checkboxClass: 'bg-amber-500 border-amber-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]',
          labelClass: 'text-amber-600 dark:text-amber-400',
        };
      }
      return {
        badge: 'In attesa',
        checkboxClass: 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-indigo-400 hover:text-indigo-500',
        labelClass: 'text-zinc-600 dark:text-zinc-400',
      };
    }

    // TODAY, done: classify by completion timestamp (late / early / on time)
    if (completedAtTimestamp) {
      const completedAt = new Date(completedAtTimestamp);
      const completedMinutes = completedAt.getHours() * 60 + completedAt.getMinutes();
      if (completedMinutes > end) {
        return {
          badge: 'In ritardo',
          checkboxClass: 'bg-orange-500 border-orange-400 text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]',
          labelClass: 'text-orange-600 dark:text-orange-400',
        };
      }
      if (completedMinutes < start) {
        return {
          badge: 'In anticipo',
          checkboxClass: 'bg-sky-500 border-sky-400 text-white shadow-[0_0_15px_rgba(14,165,233,0.35)]',
          labelClass: 'text-sky-600 dark:text-sky-400',
        };
      }
    } else if (nowMinutes > end) {
      return {
        badge: 'In ritardo',
        checkboxClass: 'bg-orange-500 border-orange-400 text-white shadow-[0_0_12px_rgba(249,115,22,0.3)]',
        labelClass: 'text-orange-600 dark:text-orange-400',
      };
    } else if (nowMinutes < start) {
      return {
        badge: 'In anticipo',
        checkboxClass: 'bg-sky-500 border-sky-400 text-white shadow-[0_0_15px_rgba(14,165,233,0.35)]',
        labelClass: 'text-sky-600 dark:text-sky-400',
      };
    }

    return {
      badge: 'In orario',
      checkboxClass: 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]',
      labelClass: 'text-emerald-600 dark:text-emerald-400',
    };
  };

  // Calcolo progresso
  const progress = useMemo(() => {
    const prayerCount = PRAYERS.filter(p => todayPrayerLog[p]).length;
    let routineDone = 0;
    let routineTotal = 0;
    PRAYER_SLOTS.forEach(slotKey => {
      const list = slotsForDay[slotKey];
      if (Array.isArray(list)) {
        list.forEach(r => { routineTotal++; if (r.done) routineDone++; });
      }
    });
    const totalSteps = PRAYERS.length + routineTotal;
    const doneSteps = prayerCount + routineDone;
    return { doneSteps, totalSteps, pct: totalSteps ? doneSteps / totalSteps : 0 };
  }, [PRAYERS, todayPrayerLog, slotsForDay]);

  const timelineFill = isToday ? timelineProgress : progress.pct;

  return (
    <div className="relative z-10 w-full min-w-0">
      <Card className="flex flex-col overflow-hidden rounded-3xl">
        
        {/* HEADER */}
        <div>
          <CardHeader
            icon={Icons.LayoutList}
            iconColor="text-violet-500"
            title="Preghiere & Timeline"
            subtitle={locationName ? locationName : prayerFallback ? '⚠️ Orari stimati — abilita posizione' : 'Timeline giornaliera'}
            action={
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-400">
                    {Math.round(progress.pct * 100)}%
                  </span>
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                      initial={false}
                      animate={{ width: `${Math.max(2, progress.pct * 100)}%` }}
                      transition={{ duration: 1, ease: 'circOut' }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); toggleTimelinePanel(); }}
                  className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors"
                  aria-label={isCollapsed ? 'Espandi' : 'Comprimi'}
                >
                  {isCollapsed
                    ? <Icons.ChevronDown className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    : <Icons.ChevronUp className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />}
                </button>
              </div>
            }
          />
        </div>

        {/* TIMELINE CONTENT */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-zinc-100/80 bg-zinc-50/40 dark:border-zinc-800/60 dark:bg-white/[0.02]"
            >
              <div className="px-4 py-4 no-select-calendar sm:px-5 sm:py-5 md:px-6">
                {/* Timeline: mobile scrollable, desktop grid */}
                <div className="relative">
                  {/* Connecting line at checkbox height - hidden on mobile scroll */}
                  <div className="hidden md:block absolute top-5 left-0 right-0 h-[4px] rounded-full bg-zinc-300/60 dark:bg-zinc-700 overflow-hidden pointer-events-none shadow-sm">
                    <motion.div
                      className="absolute inset-y-0 left-0 h-full bg-gradient-to-r from-emerald-600 to-indigo-600 rounded-full"
                      initial={false}
                      animate={{ width: `${timelineFill * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    />
                  </div>

                  {/* Mobile: single prayer with smooth transition */}
                  <div className="md:hidden flex flex-col">
                    {/* Mobile navigation */}
                    <div className="flex items-center justify-between mb-4 px-2 py-2">
                      <button
                        onClick={handlePrevious}
                        disabled={currentPrayerIndex === 0}
                        className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Icons.ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="flex gap-1">
                        {PRAYERS.map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentPrayerIndex ? 'bg-indigo-500 w-6' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          />
                        ))}
                      </div>
                      <button
                        onClick={handleNext}
                        disabled={currentPrayerIndex === PRAYERS.length - 1}
                        className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                      >
                        <Icons.ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Mobile: single prayer with animation */}
                    <div className="w-full px-2">
                      <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                          key={currentPrayerIndex}
                          initial={{ opacity: 0, x: direction > 0 ? 50 : -50, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          exit={{ opacity: 0, x: direction > 0 ? -50 : 50, scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                          className="flex flex-col items-center gap-5"
                        >
                          {(() => {
                            const i = currentPrayerIndex;
                            const prayer = PRAYERS[i];
                            const prayerLogEntry = todayPrayerLog[prayer];
                            // Handle both old boolean format and new object format
                            const isDone = typeof prayerLogEntry === 'object' 
                              ? !!prayerLogEntry?.completedAt 
                              : !!prayerLogEntry;
                            const completedAtTimestamp = typeof prayerLogEntry === 'object' 
                              ? prayerLogEntry?.completedAt || null 
                              : null;
                            const prayerState = getPrayerState(i, isDone, completedAtTimestamp);
                            const slotKey = PRAYER_SLOTS[i];
                            const isCurrentSlot = isToday && currentSlotKey === slotKey;
                            const isPastSlot = isToday && currentSlotKey ? PRAYER_SLOTS.indexOf(slotKey) < PRAYER_SLOTS.indexOf(currentSlotKey) : false;
                            const hasSlotCard = !!slotKey;

                            const routines = slotsForDay[slotKey] || [];
                            const routineIds = new Set(routines.map(r => r.id));
                            const events = eventsToday.filter(e => e.slotKey === slotKey && !routineIds.has(e.id));
                            const slotTotal = routines.length;
                            const slotDone = routines.filter(r => r.done).length;

                            return (
                              <>
                                <motion.button
                                  onClick={() => handlePrayerToggle(prayer, isDone)}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`relative z-10 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg border-2 ${prayerState.checkboxClass}`}
                                  title={`${prayer} • ${prayerState.badge}`}
                                >
                                  {isDone ? <Icons.Check className="w-7 h-7" /> : <div className="w-3 h-3 rounded-full bg-current opacity-40" />}
                                </motion.button>

                                <div className="flex flex-col items-center leading-tight text-center gap-0.5">
                                  <span className={`text-xl font-black uppercase tracking-wider ${prayerState.labelClass}`}>{prayer}</span>
                                  <span className="text-sm font-bold text-zinc-400 dark:text-zinc-500 font-mono">{PRAYER_TIMES[prayer]}</span>
                                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">{prayerState.badge}</span>
                                </div>

                                {hasSlotCard && (
                                  <div className={`w-full max-w-xs transition-all duration-500 ${isCurrentSlot ? 'opacity-100 z-30 scale-105' : isPastSlot ? 'opacity-70 hover:opacity-100' : 'opacity-50 hover:opacity-100'}`}>
                                    <div className={`flex flex-col bg-white dark:bg-zinc-900/90 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 shadow-lg ${
                                      isCurrentSlot
                                        ? 'border-indigo-400/60 shadow-[0_8px_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/10'
                                        : 'border-zinc-200/80 dark:border-zinc-800 shadow-lg shadow-zinc-200/20 dark:shadow-black/20 hover:border-zinc-300 dark:hover:border-zinc-700'
                                    }`}>
                                      <div className={`px-4 py-3 flex items-center justify-between border-b ${isCurrentSlot ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800'}`}>
                                        <span className={`text-sm font-black uppercase tracking-[0.12em] flex items-center gap-1.5 ${isCurrentSlot ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}>
                                          {isCurrentSlot && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                                          {getSlotLabel(slotKey)}
                                        </span>
                                        {slotTotal > 0 && (
                                          <span className="text-sm font-bold text-zinc-400 bg-white dark:bg-zinc-800 px-2 py-0.5 rounded-full shadow-sm">{slotDone}/{slotTotal}</span>
                                        )}
                                      </div>

                                      <div className="p-3 flex flex-col gap-1.5 min-h-[80px]">
                                        {routines.map((r, ri) => (
                                          <motion.div
                                            key={r.id}
                                            initial={{ opacity: 0, x: -5 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: ri * 0.05 }}
                                            className="group/task flex items-center gap-2 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors relative"
                                          >
                                            <TaskCheckbox done={r.done} onClick={() => toggleTimelineRoutine(todayKey, slotKey, r.id, !r.done)} />
                                            <span className={`text-sm font-semibold truncate transition-colors flex-1 ${r.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                              {habitMap[r.habitId] || r.title || 'Rimosso'}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => removeTimelineRoutine(todayKey, slotKey, r.id)}
                                              className="opacity-70 group-hover/task:opacity-100 p-1.5 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                              aria-label="Rimuovi da timeline"
                                            >
                                              <Icons.X className="w-3.5 h-3.5" />
                                            </button>
                                          </motion.div>
                                        ))}

                                        <div className="relative mt-0.5">
                                          <button
                                            ref={(el) => { if (el) winTriggerEls.current.set(slotKey, el); else winTriggerEls.current.delete(slotKey); }}
                                            onClick={(e) => {
                                              const isOpen = selectorOpenSlot === slotKey;
                                              setSelectorOpenSlot(isOpen ? null : slotKey);
                                              setSelectorOpenEl(isOpen ? null : winTriggerEls.current.get(slotKey) || null);
                                            }}
                                            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700/80 text-sm font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all"
                                          >
                                            <Icons.Plus className="w-3.5 h-3.5" /> Win
                                          </button>
                                          <AnimatePresence>
                                            {selectorOpenSlot === slotKey && (
                                              <HabitSelector
                                                activeHabits={activeHabits}
                                                onSelect={(habitId) => addTimelineRoutine(todayKey, slotKey, habitId)}
                                                onClose={() => { setSelectorOpenSlot(null); setSelectorOpenEl(null); }}
                                                triggerEl={selectorOpenEl}
                                              />
                                            )}
                                          </AnimatePresence>
                                        </div>
                                      </div>

                                      {events.length > 0 && (
                                        <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3">
                                          <div className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600/80 dark:text-emerald-400/80 mb-1.5">Completati</div>
                                          <div className="flex flex-col gap-1.5">
                                            {events.map((e, ei) => (
                                              <div key={ei} className="flex items-start gap-1.5 bg-white dark:bg-zinc-800 p-2 rounded-xl border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                                <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                                <div className="flex flex-col flex-1 min-w-0">
                                                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 leading-tight truncate">{e.title}</span>
                                                  <span className="text-xs text-zinc-400 font-mono">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Desktop: show all prayers in grid */}
                  <div className="hidden md:grid md:grid-cols-5 gap-6 md:gap-8 pb-4 md:overflow-visible md:pb-0">
                    {PRAYERS.map((prayer, i) => {
                      const prayerLogEntry = todayPrayerLog[prayer];
                      // Handle both old boolean format and new object format
                      const isDone = typeof prayerLogEntry === 'object' 
                        ? !!prayerLogEntry?.completedAt 
                        : !!prayerLogEntry;
                      const completedAtTimestamp = typeof prayerLogEntry === 'object' 
                        ? prayerLogEntry?.completedAt || null 
                        : null;
                      const prayerState = getPrayerState(i, isDone, completedAtTimestamp);
                      const slotKey = PRAYER_SLOTS[i];
                      const isCurrentSlot = isToday && currentSlotKey === slotKey;
                      const isPastSlot = isToday && currentSlotKey ? PRAYER_SLOTS.indexOf(slotKey) < PRAYER_SLOTS.indexOf(currentSlotKey) : false;
                      const hasSlotCard = !!slotKey;

                      const routines = slotsForDay[slotKey] || [];
                      const routineIds = new Set(routines.map(r => r.id));
                      const events = eventsToday.filter(e => e.slotKey === slotKey && !routineIds.has(e.id));
                      const slotTotal = routines.length;
                      const slotDone = routines.filter(r => r.done).length;

                      return (
                        <React.Fragment key={prayer}>
                          <div className="flex flex-col items-center gap-2 min-w-0">
                            <motion.button
                              onClick={() => handlePrayerToggle(prayer, isDone)}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border-2 ${prayerState.checkboxClass}`}
                              title={`${prayer} • ${prayerState.badge}`}
                            >
                              {isDone ? <Icons.Check className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current opacity-40" />}
                            </motion.button>

                            <div className="flex flex-col items-center leading-tight mb-1">
                              <span className={`text-xs font-black uppercase tracking-widest ${prayerState.labelClass}`}>{prayer}</span>
                              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 font-mono mt-0">{PRAYER_TIMES[prayer]}</span>
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 whitespace-nowrap">{prayerState.badge}</span>
                            </div>

                            {hasSlotCard && (
                              <div className={`w-full transition-all duration-500 ${isCurrentSlot ? 'opacity-100 z-30 scale-105' : isPastSlot ? 'opacity-70 hover:opacity-100' : 'opacity-50 hover:opacity-100'}`}>
                                <div className={`flex flex-col bg-white dark:bg-zinc-900/80 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 ${
                                  isCurrentSlot
                                    ? 'border-indigo-400/60 shadow-[0_8px_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/10'
                                    : 'border-zinc-200/80 dark:border-zinc-800 shadow-lg shadow-zinc-200/20 dark:shadow-black/20 hover:border-zinc-300 dark:hover:border-zinc-700'
                                }`}>
                                  <div className={`px-3 py-2 flex items-center justify-between border-b ${isCurrentSlot ? 'bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800'}`}>
                                    <span className={`text-xs font-black uppercase tracking-[0.12em] flex items-center gap-1.5 ${isCurrentSlot ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}>
                                      {isCurrentSlot && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />}
                                      {getSlotLabel(slotKey)}
                                    </span>
                                    {slotTotal > 0 && (
                                      <span className="text-xs font-bold text-zinc-400 bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded shadow-sm">{slotDone}/{slotTotal}</span>
                                    )}
                                  </div>

                                  <div className="p-2.5 flex flex-col gap-1.5 min-h-[72px]">
                                    {routines.map((r, ri) => (
                                      <motion.div
                                        key={r.id}
                                        initial={{ opacity: 0, x: -5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: ri * 0.05 }}
                                        className="group/task flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors relative"
                                      >
                                        <TaskCheckbox done={r.done} onClick={() => toggleTimelineRoutine(todayKey, slotKey, r.id, !r.done)} />
                                        <span className={`text-xs font-semibold truncate transition-colors ${r.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                          {habitMap[r.habitId] || r.title || 'Rimosso'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => removeTimelineRoutine(todayKey, slotKey, r.id)}
                                          className="absolute right-1 opacity-70 sm:opacity-0 sm:group-hover/task:opacity-100 p-1 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                                          aria-label="Rimuovi da timeline"
                                        >
                                          <Icons.X className="w-3 h-3" />
                                        </button>
                                      </motion.div>
                                    ))}

                                    <div className="relative mt-0.5">
                                      <button
                                        ref={(el) => { if (el) winTriggerEls.current.set(slotKey, el); else winTriggerEls.current.delete(slotKey); }}
                                        onClick={() => {
                                          const isOpen = selectorOpenSlot === slotKey;
                                          setSelectorOpenSlot(isOpen ? null : slotKey);
                                          setSelectorOpenEl(isOpen ? null : winTriggerEls.current.get(slotKey) || null);
                                        }}
                                        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700/80 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all"
                                      >
                                        <Icons.Plus className="w-3 h-3" /> Win
                                      </button>
                                      <AnimatePresence>
                                        {selectorOpenSlot === slotKey && (
                                          <HabitSelector
                                            activeHabits={activeHabits}
                                            onSelect={(habitId) => addTimelineRoutine(todayKey, slotKey, habitId)}
                                            onClose={() => { setSelectorOpenSlot(null); setSelectorOpenEl(null); }}
                                            triggerEl={selectorOpenEl}
                                          />
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  </div>

                                  {events.length > 0 && (
                                    <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5">
                                      <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600/80 dark:text-emerald-400/80 mb-1.5">Completati</div>
                                      <div className="flex flex-col gap-1.5">
                                        <AnimatePresence>
                                          {events.map((e, ei) => (
                                            <motion.div 
                                              key={e.id || ei} 
                                              initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                              animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                              exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                              className="flex items-start gap-2 bg-gradient-to-br from-white to-emerald-50 dark:from-zinc-800 dark:to-emerald-900/10 p-2 rounded-xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm hover:shadow-md transition-shadow"
                                            >
                                              <Icons.CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                              <div className="flex flex-col flex-1 min-w-0">
                                                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-100 leading-tight truncate">{e.title}</span>
                                                <span className="text-[10px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-widest font-mono">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                              </div>
                                            </motion.div>
                                          ))}
                                        </AnimatePresence>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}