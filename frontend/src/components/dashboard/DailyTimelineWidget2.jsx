import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { PRAYER_SLOTS, getCurrentSlotKey, toDateKey } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';

const DEFAULT_PRAYER_TIMES = { Fajr: '05:24', Dhuhr: '12:31', Asr: '15:47', Maghrib: '18:22', Isha: '19:48' };

function usePrayerTimes() {
  const [times, setTimes] = useState(DEFAULT_PRAYER_TIMES);
  const [locationName, setLocationName] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!navigator.geolocation) { setLoading(false); return; }
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
          } catch (_) {}
        }
      } catch (err) { console.warn('Failed to fetch prayer times:', err); }
      finally { setLoading(false); }
    }, () => setLoading(false));
  }, []);
  return { times, locationName, loading };
}

function formatCompletionTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

export function DailyTimelineWidget2({ PRAYERS, todayKey, todayPrayerLog, togglePrayer }) {
  const { 
    dailyTaskTemplates, 
    dailyTaskLogs, 
    toggleDailyTask,
    dailyCompletionLog,
    timelinePanelExpanded,
    setTimelinePanelExpanded
  } = useDashboardStore();
  
  const { times: PRAYER_TIMES, locationName } = usePrayerTimes();
  const open = timelinePanelExpanded !== false;
  const setOpen = (v) => setTimelinePanelExpanded(typeof v === 'function' ? v(open) : v);
  
  const activeHabits = useMemo(() => dailyTaskTemplates.filter(t => !t.locked && (t.inTimeline !== false)), [dailyTaskTemplates]);
  const currentSlot = getCurrentSlotKey();
  const todayTaskLog = dailyTaskLogs[todayKey] || [];
  const todayLogMap = useMemo(() => {
    const map = {};
    todayTaskLog.forEach(l => map[l.id] = l.done);
    return map;
  }, [todayTaskLog]);
  
  // Get completed tasks for each slot using the events log (with timestamps)
  const slotCompletions = useMemo(() => {
    const completions = {};
    const logForDay = dailyCompletionLog[todayKey] || {};
    
    // Initialize empty arrays for each slot
    PRAYER_SLOTS.slice(0, 4).forEach(slotKey => {
      completions[slotKey] = { quick: [], project: [], habits: [], total: 0 };
    });
    
    // Process events - they already have slotKey assigned when completed
    const events = logForDay.events || [];
    events.forEach(event => {
      const slotKey = event.slotKey;
      if (!slotKey || !completions[slotKey]) return;
      
      if (event.type === 'quick' || event.type === 'shared_quick') {
        completions[slotKey].quick.push({ id: event.id, title: event.title, label: 'Quick Task', timestamp: event.timestamp });
      } else if (event.type === 'project') {
        const displayTitle = event.projectName ? `${event.projectName} → ${event.title}` : event.title;
        completions[slotKey].project.push({ 
          id: event.id, 
          title: event.title, 
          projectName: event.projectName,
          displayTitle,
          label: event.projectName ? 'Subtask' : 'Project Task',
          timestamp: event.timestamp
        });
      } else if (event.type === 'habit') {
        completions[slotKey].habits.push({ id: event.id, title: event.title, label: 'Habit', timestamp: event.timestamp });
      }
    });
    
    // Calculate totals
    PRAYER_SLOTS.slice(0, 4).forEach(slotKey => {
      const slot = completions[slotKey];
      slot.total = slot.quick.length + slot.project.length + slot.habits.length;
    });
    
    return completions;
  }, [dailyCompletionLog, todayKey]);

  const progress = useMemo(() => {
    const prayersDone = PRAYERS.filter(p => todayPrayerLog[p]).length;
    const habitsDone = activeHabits.filter(h => todayLogMap[h.id]).length;
    const done = prayersDone + habitsDone;
    const total = PRAYERS.length + activeHabits.length;
    return { done, total, pct: total ? done / total : 0, prayersDone, habitsDone, habitsTotal: activeHabits.length };
  }, [PRAYERS, todayPrayerLog, activeHabits, todayLogMap]);

  // Stesse abitudini in tutte le card dello slot (ogni card mostra la lista completa)
  const habitsBySlot = useMemo(() => {
    const distribution = {};
    PRAYER_SLOTS.slice(0, 4).forEach((slotKey) => {
      distribution[slotKey] = activeHabits;
    });
    return distribution;
  }, [activeHabits]);

  const isCollapsed = !open;
  return (
    <div className={`shrink-0 px-4 md:px-6 pt-3 ${isCollapsed ? 'pb-3' : 'pb-6'}`}>
      <div className="dashboard-panel overflow-hidden rounded-xl py-0">
        {/* Header: largo come tutta la barra, stesso colore del panel (bg trasparente), padding interno come preghiere */}
        <button 
          onClick={() => setOpen(o => !o)} 
          className={`flex w-full items-center justify-between gap-4 text-left px-3 sm:px-4 py-3 bg-transparent hover:bg-zinc-50/60 dark:hover:bg-white/[0.03] transition-colors duration-200 focus-ring ${isCollapsed ? 'rounded-xl' : 'rounded-t-xl'}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-600 text-white shrink-0 shadow-lg shadow-indigo-500/25 dark:shadow-indigo-600/20 ring-2 ring-white/20 dark:ring-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icons.Target className="h-4 w-4" />
            </motion.div>
            <div>
              <h2 className="text-[15px] font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-0.5">
                Daily Timeline {locationName && <span className="text-zinc-400 font-normal">• {locationName}</span>}
              </h2>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                {progress.prayersDone}/{PRAYERS.length} preghiere • {progress.habitsDone}/{progress.habitsTotal} abitudini
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-[11px] font-black text-zinc-600 dark:text-zinc-300 tabular-nums">
                {progress.done}<span className="text-zinc-300 dark:text-zinc-600 mx-0.5 font-normal">/</span>{progress.total}
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
              animate={{ rotate: open ? 180 : 0 }} 
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="p-2 rounded-xl bg-zinc-100/80 dark:bg-white/[0.06] text-zinc-500 dark:text-zinc-400 border border-zinc-200/50 dark:border-white/[0.04]"
            >
              <Icons.ChevronDown className="h-3.5 w-3.5" />
            </motion.div>
          </div>
        </button>

        {/* Content */}
        {open && (
          <div className="border-t border-zinc-200/50 dark:border-white/[0.04] min-h-[140px]">
            <div className="py-4 px-3 md:px-4 no-select-calendar flex items-stretch w-full">
              {PRAYERS.map((prayer, i) => {
                const isDone = todayPrayerLog[prayer];
                const hasSlot = i < PRAYERS.length - 1;
                const slotKey = PRAYER_SLOTS[i];
                const isActive = currentSlot === slotKey;
                const slotHabits = habitsBySlot[slotKey] || [];
                const slotCompletion = slotCompletions[slotKey] || { quick: [], project: [], total: 0 };

                return (
                  <div 
                    key={prayer} 
                    className={`relative flex flex-col flex-1 min-w-0 ${!hasSlot ? 'max-w-[3rem]' : ''} cursor-pointer group`}
                    onClick={() => togglePrayer?.(prayer, !isDone)}
                  >
                    {/* Prayer Node & Line — compatto */}
                    <div className="relative flex items-center h-7 w-full z-10 shrink-0">
                      <motion.button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); togglePrayer?.(prayer, !isDone); }}
                        className={`w-6 h-6 shrink-0 rounded-full border-2 border-white dark:border-[#0a0d12] relative z-20 flex items-center justify-center transition-all duration-200 focus-ring cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500 text-white timeline-node-done shadow-lg shadow-emerald-500/30'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-400 hover:bg-indigo-400 dark:hover:bg-indigo-500 hover:text-white hover:shadow-lg hover:shadow-indigo-500/30'
                        }`}
                        title={`${isDone ? 'Deseleziona' : 'Segna'} ${prayer}`}
                        whileTap={{ scale: 0.88 }}
                        whileHover={{ scale: 1.08 }}
                      >
                        {isDone ? (
                          <Icons.Check className="w-3 h-3" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                        )}
                      </motion.button>
                      
                      {hasSlot && (
                        <>
                          <div className="absolute left-6 right-0 h-[1.5px] rounded-full timeline-track top-1/2 -translate-y-1/2" />
                          {isDone && (
                            <motion.div 
                              className="absolute left-6 h-[1.5px] rounded-full timeline-track-fill top-1/2 -translate-y-1/2 origin-left"
                              initial={{ width: 0 }}
                              animate={{ width: '100%' }}
                              transition={{ duration: 0.6, ease: 'easeOut' }}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Prayer Label */}
                    <div className="absolute top-[28px] left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                      <span className={`text-[8px] font-bold uppercase tracking-wider whitespace-nowrap ${
                        isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-600 dark:text-zinc-400'
                      }`}>
                        {prayer}
                      </span>
                      <span className="text-[9px] font-mono font-semibold text-zinc-400 dark:text-zinc-500 tabular-nums mt-0.5">
                        {PRAYER_TIMES[prayer]}
                      </span>
                    </div>

                    {/* Slot Card with Fixed Habits — compatto */}
                    {hasSlot && (
                      <div className="mt-6 mx-0.5">
                        <div className={`relative backdrop-blur-xl rounded-lg border transition-all duration-300 flex flex-col p-2 min-h-0 ${
                          isActive
                            ? 'timeline-card-current border-indigo-400/50 dark:border-indigo-500/30'
                            : 'bg-white/80 dark:bg-white/[0.03] border-zinc-200/70 dark:border-white/[0.05] shadow-md shadow-zinc-200/30 dark:shadow-black/20 hover:border-zinc-300 dark:hover:border-white/[0.08] hover:shadow-lg'
                        }`}>
                          
                          {/* Slot Header */}
                          <div className="flex items-center justify-center gap-1.5 mb-1.5 shrink-0">
                            {isActive && (
                              <span className="flex h-1.5 w-1.5 shrink-0">
                                <span className="absolute inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500 opacity-75 animate-ping" />
                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500" />
                              </span>
                            )}
                            <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-600 dark:text-zinc-400">
                              {slotKey.replace('-', ' → ')}
                            </span>
                          </div>

                          {/* Fixed Habits for this slot */}
                          {slotHabits.length > 0 && (
                            <div className="space-y-0.5 mb-1.5 min-w-0 flex-1 overflow-hidden">
                              {slotHabits.map(habit => {
                                const isHabitDone = todayLogMap[habit.id];
                                return (
                                  <div 
                                    key={habit.id} 
                                    className="flex items-center gap-1.5 group/task py-0.5 px-1.5 -mx-1.5 rounded-md hover:bg-zinc-100/60 dark:hover:bg-white/[0.04] transition-colors"
                                  >
                                    <TaskCheckbox 
                                      done={isHabitDone} 
                                      onClick={() => toggleDailyTask(habit.id, !isHabitDone)} 
                                    />
                                    <span className={`text-[11px] font-medium tracking-tight flex-1 min-w-0 truncate transition-colors ${
                                      isHabitDone 
                                        ? 'text-zinc-400 line-through dark:text-zinc-500' 
                                        : 'text-zinc-700 dark:text-zinc-200'
                                    }`}>
                                      {habit.title}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Completed Tasks Detail View */}
                          {slotCompletion.total > 0 && (
                            <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-white/[0.04]">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                  <Icons.Check className="w-3 h-3" /> Completati
                                </span>
                                <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200/50 dark:border-emerald-500/20">
                                  {slotCompletion.total}
                                </span>
                              </div>
                              
                              <div className="space-y-0.5">
                                {slotCompletion.habits.map((task) => (
                                  <div 
                                    key={`habit-${task.id}`} 
                                    className="flex items-center gap-1.5 py-0.5 px-1.5 -mx-1.5 rounded bg-emerald-50/50 dark:bg-emerald-500/5 min-w-0"
                                  >
                                    <Icons.Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200 truncate min-w-0 flex-1 tracking-tight" title={task.title}>{task.title}</span>
                                    <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">{task.label}</span>
                                    {task.timestamp && <span className="text-[9px] font-mono font-medium text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0 ml-0.5">{formatCompletionTime(task.timestamp)}</span>}
                                  </div>
                                ))}
                                {slotCompletion.quick.map((task) => (
                                  <div 
                                    key={`quick-${task.id}`} 
                                    className="flex items-center gap-1.5 py-0.5 px-1.5 -mx-1.5 rounded bg-emerald-50/50 dark:bg-emerald-500/5 min-w-0"
                                  >
                                    <Icons.Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200 truncate min-w-0 flex-1 tracking-tight" title={task.title}>{task.title}</span>
                                    <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">{task.label}</span>
                                    {task.timestamp && <span className="text-[9px] font-mono font-medium text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0 ml-0.5">{formatCompletionTime(task.timestamp)}</span>}
                                  </div>
                                ))}
                                {slotCompletion.project.map((task) => (
                                  <div 
                                    key={`project-${task.id}`} 
                                    className="flex items-center gap-1.5 py-0.5 px-1.5 -mx-1.5 rounded bg-emerald-50/50 dark:bg-emerald-500/5 min-w-0"
                                  >
                                    <Icons.Check className="w-3 h-3 text-emerald-500 shrink-0" />
                                    <span className="text-[10px] font-medium text-zinc-700 dark:text-zinc-200 truncate min-w-0 flex-1 tracking-tight" title={task.displayTitle || task.title}>
                                      {task.displayTitle || task.title}
                                    </span>
                                    <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-400 shrink-0">{task.label}</span>
                                    {task.timestamp && <span className="text-[9px] font-mono font-medium text-zinc-500 dark:text-zinc-400 tabular-nums shrink-0 ml-0.5">{formatCompletionTime(task.timestamp)}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Empty state if no habits assigned */}
                          {slotHabits.length === 0 && slotCompletion.total === 0 && (
                            <div className="py-2 text-center">
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 italic tracking-tight">Nessuna abitudine assegnata</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
