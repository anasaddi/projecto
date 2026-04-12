import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { AppLogo } from '../AppLogo';
import { TaskCheckbox } from './DashboardComponents';
import { PRAYER_SLOTS, getCurrentSlotKey } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';

// Mock degli orari (puoi collegarli alle tue API o impostazioni in futuro)
const DEFAULT_PRAYER_TIMES = {
  Fajr: '05:24',
  Dhuhr: '12:31',
  Asr: '15:47',
  Maghrib: '18:22',
  Isha: '19:48'
};

// Hook to get prayer times based on user location
function usePrayerTimes() {
  const [times, setTimes] = useState(DEFAULT_PRAYER_TIMES);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      
      try {
        // Get prayer times from Aladhan API
        // method=3 = Muslim World League (more accurate for Europe/Middle East)
        // method=2 = ISNA (North America) - was giving early times
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
          
          // Get city name
          try {
            const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=it`);
            const geoData = await geoRes.json();
            setLocationName(geoData.city || geoData.locality || '');
          } catch (e) {
            // Silent fail
          }
        }
      } catch (err) {
        console.warn('Failed to fetch prayer times:', err);
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.warn('Geolocation denied:', err);
      setLoading(false);
    });
  }, []);
  
  return { times, locationName, loading };
}

function getSlotLabel(slotKey) {
  const [from, to] = slotKey.split('-');
  return `${from} - ${to}`;
}

// --- MENU ELEGANTE PER SELEZIONARE LE ABITUDINI ---
function HabitSelector({ activeHabits, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      className="absolute bottom-full left-0 mb-2 w-[240px] bg-white dark:bg-zinc-800/98 backdrop-blur-xl border border-zinc-200/90 dark:border-white/10 rounded-xl z-50 p-2 shadow-2xl shadow-zinc-300/30 dark:shadow-black/50 ring-1 ring-zinc-200/50 dark:ring-white/5"
    >
      <div className="text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.2em] px-2.5 py-1.5 mb-1.5 border-b border-zinc-100 dark:border-white/5">
        Scegli abitudine
      </div>
      <div className="max-h-[180px] overflow-y-auto custom-scrollbar flex flex-col gap-0.5">
        {activeHabits.length === 0 ? (
          <div className="px-2.5 py-3 text-xs text-zinc-500 dark:text-zinc-400 italic">Nessuna abitudine attiva</div>
        ) : (
          activeHabits.map((h, i) => (
            <motion.button
              key={h.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => { onSelect(h.id); onClose(); }}
              className="flex items-center gap-2.5 w-full text-left px-3 py-2.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors border border-transparent hover:border-indigo-200/60 dark:hover:border-indigo-500/20"
            >
              <Icons.Plus className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 shrink-0" />
              <span className="truncate">{h.title}</span>
            </motion.button>
          ))
        )}
      </div>
    </motion.div>
  );
}

// --- WIDGET PRINCIPALE ---
export function DailyTimelineWidget({ PRAYERS, todayKey, todayPrayerLog, togglePrayer }) {
  const store = useDashboardStore();
  const {
    timelineRoutines,
    addTimelineRoutine,
    toggleTimelineRoutine,
    removeTimelineRoutine,
    dailyTaskTemplates,
    dailyCompletionLog
  } = store;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectorOpenSlot, setSelectorOpenSlot] = useState(null);
  
  const { times: PRAYER_TIMES, locationName } = usePrayerTimes();
  
  const activeHabits = useMemo(() => dailyTaskTemplates.filter(t => !t.locked), [dailyTaskTemplates]);
  const eventsToday = useMemo(() => dailyCompletionLog[todayKey]?.events || [],[dailyCompletionLog, todayKey]);
  const slotsForDay = useMemo(() => timelineRoutines[todayKey] || {}, [timelineRoutines, todayKey]);

  const currentSlotKey = getCurrentSlotKey();

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
    <div className="shrink-0 px-4 md:px-6 pb-6 mt-2">
      <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200/70 dark:border-white/[0.06] bg-gradient-to-b from-white/90 to-zinc-50/80 dark:from-[#0f1218] dark:to-[#0a0d12] backdrop-blur-2xl shadow-xl shadow-zinc-200/50 dark:shadow-black/40 ring-1 ring-zinc-200/30 dark:ring-white/[0.03]">
        
        {/* HEADER */}
        <button
          type="button"
          onClick={() => setIsCollapsed(c => !c)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-zinc-50/60 dark:hover:bg-white/[0.03] transition-colors duration-200 focus-ring rounded-t-[1.5rem]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
              <AppLogo size="xs" />
            </motion.div>
            <div>
              <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-0.5">
                Daily Flow {locationName && <span className="text-zinc-400">• {locationName}</span>}
              </h2>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {progress.doneSteps}/{progress.totalSteps} completati • Orari aggiornati per la tua posizione
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs font-black text-zinc-600 dark:text-zinc-300 tabular-nums">
                {progress.doneSteps}<span className="text-zinc-300 dark:text-zinc-600 mx-0.5 font-normal">/</span>{progress.totalSteps}
              </span>
              <div className="h-2 w-24 overflow-hidden rounded-full timeline-track">
                <motion.div
                  className="h-full rounded-full timeline-track-fill"
                  initial={false}
                  animate={{ width: `${Math.max(2, progress.pct * 100)}%` }}
                  transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
                />
              </div>
            </div>
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="p-2 rounded-xl bg-zinc-100/80 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/[0.04]"
            >
              <Icons.ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </div>
        </button>

        {/* CONTENUTO TIMELINE — altezza fissa così il contenuto si vede sempre */}
        {!isCollapsed && (
          <div className="border-t border-zinc-200/50 dark:border-white/[0.04] min-h-[220px]">
            <div className="py-5 px-4 md:px-6 no-select-calendar">
                <div className="flex items-stretch w-full gap-2 md:gap-3 pb-5 relative max-w-6xl mx-auto">
                  
                  {PRAYERS.map((prayer, i) => {
                    const isDone = todayPrayerLog[prayer];
                    const hasSlot = i < PRAYERS.length - 1;
                    const slotKey = PRAYER_SLOTS[i];
                    const isCurrentSlot = currentSlotKey === slotKey;
                    const isPast = PRAYER_SLOTS.indexOf(slotKey) < PRAYER_SLOTS.indexOf(currentSlotKey);
                    
                    const routines = slotsForDay[slotKey] ||[];
                    const events = eventsToday.filter(e => e.slotKey === slotKey);

                    return (
                      <div 
                        key={prayer} 
                        className={`relative flex flex-col flex-1 min-w-0 ${hasSlot ? 'max-w-[200px]' : 'max-w-[3rem]'}`}
                      >
                        {/* 1. RIGA SUPERIORE: NODO E LINEA */}
                        <div className="relative flex items-center h-10 w-full z-10 shrink-0">
                          
                          {/* Nodo Preghiera - Grande e facile da clickare */}
                          <motion.button
                            type="button"
                            onClick={() => togglePrayer?.(prayer, !isDone)}
                            className={`w-9 h-9 shrink-0 rounded-full border-[3px] border-white dark:border-[#0a0d12] relative z-20 flex items-center justify-center transition-all duration-200 focus-ring cursor-pointer ${
                              isDone
                                ? 'bg-emerald-500 text-white timeline-node-done shadow-lg shadow-emerald-500/30'
                                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 hover:bg-indigo-400 dark:hover:bg-indigo-500 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30'
                            }`}
                            title={`${isDone ? 'Deseleziona' : 'Segna'} ${prayer} ${isDone ? 'completata' : ''}`}
                            whileTap={{ scale: 0.88 }}
                            whileHover={{ scale: 1.08 }}
                          >
                            {isDone ? (
                              <Icons.Check className="w-4 h-4" strokeWidth={3} />
                            ) : (
                              <div className="w-2.5 h-2.5 rounded-full bg-current opacity-60" />
                            )}
                          </motion.button>

                          {/* Linea Base (Sfondo) */}
                          {hasSlot && (
                            <div className="absolute left-9 right-0 h-[2px] rounded-full timeline-track z-0 top-1/2 -translate-y-1/2" />
                          )}
                          
                          {/* Linea Attiva (Progresso con gradient) */}
                          {hasSlot && (
                            <motion.div
                              className="absolute left-9 h-[2px] rounded-full timeline-track-fill z-10 top-1/2 -translate-y-1/2 origin-left"
                              initial={false}
                              animate={{ width: isPast ? '100%' : isDone ? '100%' : '0%' }}
                              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
                            />
                          )}
                        </div>

                        {/* 2. RIGA TESTI: NOME E ORARIO */}
                        <div className="absolute top-[34px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                          <span className={`text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                            isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'
                          }`}>
                            {prayer}
                          </span>
                          <span className="text-xs scale-90 font-mono font-semibold text-zinc-400 dark:text-zinc-500 tabular-nums">
                            {PRAYER_TIMES[prayer]}
                          </span>
                        </div>

                        {/* 3. CARD INTERVALLO */}
                        {hasSlot && (
                          <motion.div
                            className="absolute top-[73px] left-7 right-2 flex flex-col min-w-0 max-w-[200px]"
                            initial={false}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className={`relative backdrop-blur-xl rounded-xl border transition-all duration-300 flex flex-col min-h-0 min-w-0 ${
                              isCurrentSlot
                                ? 'timeline-card-current border-indigo-400/50 dark:border-indigo-500/30'
                                : 'bg-white/80 dark:bg-white/[0.03] border-zinc-200/70 dark:border-white/[0.05] shadow-md shadow-zinc-200/30 dark:shadow-black/20 hover:border-zinc-300 dark:hover:border-white/[0.08] hover:shadow-lg'
                            }`}>
                              
                              {/* Intestazione Card */}
                              <div className="px-4 pt-4 pb-2 shrink-0">
                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2 truncate min-w-0">
                                  {isCurrentSlot && (
                                    <span className="flex h-2 w-2 shrink-0">
                                      <span className="absolute inline-flex h-2 w-2 rounded-full bg-indigo-500 opacity-75 animate-ping" />
                                      <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
                                    </span>
                                  )}
                                  {getSlotLabel(slotKey)}
                                </span>
                              </div>

                              {/* A. SEZIONE ROUTINE PIANIFICATE */}
                              <div className="space-y-2 px-4 pb-3 min-w-0 flex-1 overflow-hidden">
                                {routines.map((r, ri) => {
                                  const habit = activeHabits.find(h => h.id === r.habitId);
                                  const displayTitle = habit ? habit.title : 'Abitudine rimossa';
                                  return (
                                    <motion.div
                                      key={r.id}
                                      initial={{ opacity: 0, x: -4 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: ri * 0.02, duration: 0.15 }}
                                      className="flex items-center gap-2.5 group/task py-2 px-3 -mx-1 rounded-lg hover:bg-zinc-100/60 dark:hover:bg-white/[0.04] transition-colors"
                                    >
                                      <TaskCheckbox 
                                        done={r.done} 
                                        onClick={() => toggleTimelineRoutine(todayKey, slotKey, r.id, !r.done)} 
                                      />
                                      <span className={`text-sm font-medium tracking-tight flex-1 min-w-0 truncate transition-colors leading-snug ${r.done ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                        {displayTitle}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => removeTimelineRoutine(todayKey, slotKey, r.id)}
                                        className="opacity-70 sm:opacity-0 sm:group-hover/task:opacity-100 p-1.5 rounded-md text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all shrink-0"
                                        title="Rimuovi"
                                        aria-label="Rimuovi da timeline"
                                      >
                                        <Icons.X className="w-4 h-4" />
                                      </button>
                                    </motion.div>
                                  )
                                })}
                                
                                {/* Tasto Aggiungi Routine */}
                                <div className="relative mt-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => setSelectorOpenSlot(selectorOpenSlot === slotKey ? null : slotKey)}
                                    className="flex items-center gap-2.5 w-full py-2.5 px-3 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-500/10 transition-all group/btn border border-dashed border-zinc-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/30"
                                  >
                                    <Icons.Plus className="w-4 h-4 shrink-0" />
                                    <span className="text-xs font-bold uppercase tracking-wider">+ Win</span>
                                  </button>
                                  
                                  <AnimatePresence>
                                    {selectorOpenSlot === slotKey && (
                                      <HabitSelector
                                        activeHabits={activeHabits}
                                        onSelect={(habitId) => addTimelineRoutine(todayKey, slotKey, habitId)}
                                        onClose={() => setSelectorOpenSlot(null)}
                                      />
                                    )}
                                  </AnimatePresence>
                                </div>
                              </div>

                              {/* B. SEZIONE AUTO-LOG (Task Completati) */}
                              {events.length > 0 && (
                                <div className="mt-2 pt-3 mx-4 pb-4 border-t border-zinc-200/60 dark:border-white/[0.06] shrink-0">
                                  <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                      Completati
                                    </span>
                                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-200/50 dark:border-emerald-500/20">
                                      {events.length}
                                    </span>
                                  </div>
                                  <div className="space-y-2 overflow-hidden">
                                    {events.map(e => (
                                      <div key={e.id} className="flex items-center gap-2.5 py-2 px-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-500/5 min-w-0">
                                        <Icons.Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate min-w-0 flex-1 tracking-tight leading-snug" title={e.title}>{e.title}</span>
                                        <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0">
                                          {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}