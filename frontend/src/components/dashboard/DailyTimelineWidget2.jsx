import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { AppLogo } from '../AppLogo';
import { TaskCheckbox } from './DashboardComponents';
import { PRAYER_SLOTS, getCurrentSlotKey } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { Card } from './Card';

// Mock degli orari di default
const DEFAULT_PRAYER_TIMES = {
  Fajr: '05:24', Dhuhr: '12:31', Asr: '15:47', Maghrib: '18:22', Isha: '19:48'
};

// Hook orari preghiere (Mantenuto per la logica perfetta)
function usePrayerTimes() {
  const [times, setTimes] = useState(DEFAULT_PRAYER_TIMES);
  const[locationName, setLocationName] = useState('');
  
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const date = new Date();
        const dateStr = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
        const response = await fetch(
          `https://api.aladhan.com/v1/timings/${dateStr}?latitude=${latitude}&longitude=${longitude}&method=3&school=1`
        );
        const data = await response.json();
        if (data.code === 200 && data.data) {
          const timings = data.data.timings;
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
          } catch (e) {}
        }
      } catch (err) {}
    }, () => {});
  },[]);
  
  return { times, locationName };
}

function getSlotLabel(slotKey) {
  const [from, to] = slotKey.split('-');
  return `${from} → ${to}`;
}

// --- HABIT SELECTOR (UX/UI Ultra-Premium) - Portal per evitare clip nella card ---
function HabitSelector({ activeHabits, onSelect, onClose, triggerRef }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ bottom: 0, left: 0 });

  useEffect(() => {
    if (triggerRef?.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({ bottom: window.innerHeight - rect.top + 8, left: rect.left });
    }
  }, [triggerRef]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target) && triggerRef?.current && !triggerRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, triggerRef]);

  const content = (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="fixed w-[260px] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-2xl border border-zinc-200/80 dark:border-zinc-700/80 rounded-2xl z-[9999] p-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
      style={{ position: 'fixed', bottom: position.bottom, left: position.left }}
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
export function DailyTimelineWidget2({ PRAYERS, todayKey, todayPrayerLog, togglePrayer }) {
  const store = useDashboardStore();
  const {
    timelineRoutines,
    addTimelineRoutine,
    toggleTimelineRoutine,
    removeTimelineRoutine,
    dailyTaskTemplates,
    dailyCompletionLog,
    timelinePanelExpanded,
    setTimelinePanelExpanded
  } = store;

  const [selectorOpenSlot, setSelectorOpenSlot] = useState(null);
  const winTriggerRef = useRef(null);
  const { times: PRAYER_TIMES, locationName } = usePrayerTimes();
  
  const activeHabits = useMemo(() => dailyTaskTemplates.filter(t => !t.locked), [dailyTaskTemplates]);
  const eventsToday = useMemo(() => dailyCompletionLog[todayKey]?.events || [], [dailyCompletionLog, todayKey]);
  const slotsForDay = useMemo(() => timelineRoutines[todayKey] || {}, [timelineRoutines, todayKey]);
  const currentSlotKey = getCurrentSlotKey();
  const isCollapsed = !timelinePanelExpanded;

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

  return (
    <div className="relative z-10 w-full min-w-0">
      <Card className="flex flex-col overflow-hidden rounded-3xl">
        
        {/* HEADER (Sticky & Glass) */}
        <button
          type="button"
          onClick={() => setTimelinePanelExpanded(!timelinePanelExpanded)}
          className="z-20 flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-300 hover:bg-zinc-50/60 dark:hover:bg-white/[0.03] focus-ring"
        >
          <div className="flex items-center gap-4 min-w-0">
            <motion.div whileHover={{ scale: 1.05, rotate: 2 }} whileTap={{ scale: 0.95 }}>
              <AppLogo size="md" />
            </motion.div>
            <div className="flex flex-col justify-center">
              {locationName && (
                <span className="rounded-full border border-zinc-200/80 bg-zinc-100/90 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-400 w-fit">{locationName}</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-4">
              <span className="text-xs font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                {Math.round(progress.pct * 100)}%
              </span>
              <div className="h-2.5 w-32 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800/80">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
                  initial={false}
                  animate={{ width: `${Math.max(2, progress.pct * 100)}%` }}
                  transition={{ duration: 1, ease: "circOut" }}
                />
              </div>
            </div>
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="rounded-2xl border border-zinc-200/70 bg-zinc-100/90 p-2.5 text-zinc-500 transition-colors hover:text-zinc-900 dark:border-white/[0.06] dark:bg-zinc-800/80 dark:hover:text-white"
            >
              <Icons.ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </button>

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
              <div className="px-3 py-4 no-select-calendar sm:px-5 sm:py-5 md:px-6">
                {/* Prayer nodes row + connecting lines */}
                <div className="relative flex items-start gap-2 sm:gap-3">
                  {PRAYERS.map((prayer, i) => {
                    const isDone = todayPrayerLog[prayer];
                    const slotKey = PRAYER_SLOTS[i];
                    const hasSlotLine = i < PRAYERS.length - 1;
                    const isPastSlot = PRAYER_SLOTS.indexOf(slotKey) < PRAYER_SLOTS.indexOf(currentSlotKey);

                    return (
                      <React.Fragment key={prayer}>
                        {/* Prayer node */}
                        <div className="flex flex-1 min-w-0 flex-col items-center">
                          <motion.button
                            onClick={() => togglePrayer?.(prayer, !isDone)}
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm border-2 ${
                              isDone
                                ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-400 hover:border-indigo-400 hover:text-indigo-500'
                            }`}
                          >
                            {isDone ? <Icons.Check className="w-5 h-5" /> : <div className="w-2.5 h-2.5 rounded-full bg-current opacity-40" />}
                          </motion.button>
                          <div className="mt-2 flex flex-col items-center">
                            <span className={`text-xs font-black uppercase tracking-widest ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'}`}>{prayer}</span>
                            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">{PRAYER_TIMES[prayer]}</span>
                          </div>
                        </div>

                        {/* Connecting line between prayer nodes */}
                        {hasSlotLine && (
                          <div className="relative mt-[20px] h-[3px] min-w-[12px] w-6 shrink-0 flex-1 overflow-hidden rounded-full bg-zinc-200/60 dark:bg-zinc-800">
                            <motion.div
                              className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full"
                              initial={false}
                              animate={{ width: isPastSlot ? '100%' : isDone ? '100%' : '0%' }}
                              transition={{ duration: 0.8, ease: "easeInOut" }}
                            />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Slot cards row — wraps on smaller screens */}
                <div className="mt-4 flex flex-wrap items-start gap-3 justify-center">
                  {PRAYERS.map((prayer, i) => {
                    const slotKey = PRAYER_SLOTS[i];
                    const hasSlotCard = !!slotKey;
                    const hasSlotLine = i < PRAYERS.length - 1;
                    const isCurrentSlot = currentSlotKey === slotKey;
                    const isPastSlot = PRAYER_SLOTS.indexOf(slotKey) < PRAYER_SLOTS.indexOf(currentSlotKey);

                    const routines = slotsForDay[slotKey] || [];
                    const events = eventsToday.filter(e => e.slotKey === slotKey);
                    const slotTotal = routines.length;
                    const slotDone = routines.filter(r => r.done).length;

                    return (
                      <React.Fragment key={prayer}>
                        {/* Card for this slot */}
                        <div className={`flex-1 min-w-[200px] max-w-[248px] transition-all duration-500 ${hasSlotCard ? '' : 'invisible'} ${
                          isCurrentSlot ? 'opacity-100 z-30' : isPastSlot ? 'opacity-60 hover:opacity-100' : 'opacity-40 hover:opacity-100'
                        }`}>
                          {hasSlotCard && (
                            <div className={`flex flex-col bg-white dark:bg-zinc-900/80 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all duration-300 ${
                              isCurrentSlot
                                ? 'border-indigo-400/60 shadow-[0_8px_30px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/10'
                                : 'border-zinc-200/80 dark:border-zinc-800 shadow-lg shadow-zinc-200/20 dark:shadow-black/20 hover:border-zinc-300 dark:hover:border-zinc-700'
                            }`}>
                              {/* Slot Header */}
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
                                {routines.map((r, ri) => {
                                  const habit = activeHabits.find(h => h.id === r.habitId);
                                  return (
                                    <motion.div
                                      key={r.id}
                                      initial={{ opacity: 0, x: -5 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: ri * 0.05 }}
                                      className="group/task flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-white/[0.04] transition-colors relative"
                                    >
                                      <TaskCheckbox done={r.done} onClick={() => toggleTimelineRoutine(todayKey, slotKey, r.id, !r.done)} />
                                      <span className={`text-xs font-semibold truncate transition-colors ${r.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                        {habit ? habit.title : 'Rimosso'}
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
                                  );
                                })}

                                <div className="relative mt-0.5">
                                  <button
                                    ref={selectorOpenSlot === slotKey ? (el) => { winTriggerRef.current = el; } : undefined}
                                    onClick={() => setSelectorOpenSlot(selectorOpenSlot === slotKey ? null : slotKey)}
                                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700/80 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-500 hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all"
                                  >
                                    <Icons.Plus className="w-3 h-3" /> Win
                                  </button>
                                  <AnimatePresence>
                                    {selectorOpenSlot === slotKey && (
                                      <HabitSelector
                                        activeHabits={activeHabits}
                                        onSelect={(habitId) => addTimelineRoutine(todayKey, slotKey, habitId)}
                                        onClose={() => setSelectorOpenSlot(null)}
                                        triggerRef={winTriggerRef}
                                      />
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>

                              {events.length > 0 && (
                                <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-2.5">
                                  <div className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600/80 dark:text-emerald-400/80 mb-1.5">Completati</div>
                                  <div className="flex flex-col gap-1">
                                    {events.map((e, ei) => (
                                      <div key={ei} className="flex items-start gap-1.5 bg-white dark:bg-zinc-800 p-1.5 rounded-lg border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                                        <Icons.CheckCircle className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                        <div className="flex flex-col flex-1 min-w-0">
                                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 leading-tight truncate">{e.title}</span>
                                          <span className="text-xs text-zinc-400 font-mono">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* spacer between cards matching the connecting line width — hidden on wrap */}
                        {hasSlotLine && <div className="hidden" />}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}