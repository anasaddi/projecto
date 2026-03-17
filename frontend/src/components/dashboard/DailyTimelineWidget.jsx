import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';

const SLOT_KEYS = ['Fajr-Dhuhr', 'Dhuhr-Asr', 'Asr-Maghrib', 'Maghrib-Isha'];

function getSlotLabel(slotKey, PRAYERS) {
  const [from, to] = slotKey.split('-');
  return `${from} → ${to}`;
}

export function DailyTimelineWidget({
  PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  todayKey,
  todayPrayerLog = {},
  timelineRoutines = {},
  togglePrayer,
  addTimelineRoutine,
  toggleTimelineRoutine,
  removeTimelineRoutine,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [draftBySlot, setDraftBySlot] = useState({});

  const slotsForDay = useMemo(() => {
    const byDate = typeof timelineRoutines === 'object' && timelineRoutines !== null ? timelineRoutines[todayKey] : null;
    return byDate && typeof byDate === 'object' ? byDate : {};
  }, [timelineRoutines, todayKey]);

  const progress = useMemo(() => {
    const prayerCount = PRAYERS.filter(p => todayPrayerLog[p]).length;
    let routineDone = 0;
    let routineTotal = 0;
    SLOT_KEYS.forEach(slotKey => {
      const list = slotsForDay[slotKey];
      if (Array.isArray(list)) {
        list.forEach(r => {
          routineTotal++;
          if (r.done) routineDone++;
        });
      }
    });
    const totalSteps = PRAYERS.length + routineTotal;
    const doneSteps = prayerCount + routineDone;
    return { doneSteps, totalSteps, pct: totalSteps ? doneSteps / totalSteps : 0 };
  }, [PRAYERS, todayPrayerLog, slotsForDay]);


  const addRoutine = (slotKey) => {
    const title = (draftBySlot[slotKey] || '').trim();
    if (title && addTimelineRoutine) {
      addTimelineRoutine(todayKey, slotKey, title);
      setDraftBySlot(prev => ({ ...prev, [slotKey]: '' }));
    }
  };

  return (
    <div className="shrink-0 px-6 pb-3">
      <div className="dashboard-panel overflow-hidden rounded-xl border border-zinc-200/50 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.02]">
        <button
          type="button"
          onClick={() => setIsCollapsed(c => !c)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-zinc-100/50 dark:hover:bg-white/[0.03] transition-colors focus-ring rounded-t-xl"
        >
          <div className="flex items-center gap-2">
            <Icons.Clock className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
            <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Daily Timeline</span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {progress.doneSteps}/{progress.totalSteps}
            </span>
          </div>
          <div className="h-1.5 w-12 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-indigo-500"
              initial={false}
              animate={{ width: `${progress.pct * 100}%` }}
              transition={{ duration: 0.35 }}
            />
          </div>
          <motion.span animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.2 }}>
            <Icons.ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-4 pt-1">
                <div className="overflow-x-auto custom-scrollbar snap-x snap-mandatory flex gap-0 min-h-[120px] items-start">
                  {PRAYERS.map((prayer, i) => (
                    <React.Fragment key={prayer}>
                    {/* Prayer node (anchor) */}
                    <div className="flex shrink-0 snap-start items-start pt-2" style={{ minWidth: '72px' }}>
                      <button
                        type="button"
                        onClick={() => togglePrayer?.(prayer, !todayPrayerLog[prayer])}
                        className={`flex flex-col items-center gap-0.5 rounded-lg border-2 px-2 py-1.5 min-w-[64px] transition-all focus-ring ${
                          todayPrayerLog[prayer]
                            ? 'border-emerald-400/60 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                            : 'border-zinc-200/80 dark:border-white/[0.08] bg-white/80 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:border-indigo-200 dark:hover:border-indigo-500/30'
                        }`}
                      >
                        {todayPrayerLog[prayer] ? (
                          <Icons.Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Icons.Circle className="h-3.5 w-3.5" />
                        )}
                        <span className="text-[10px] font-bold uppercase tracking-wide">{prayer}</span>
                      </button>
                    </div>

                    {/* Slot between prayers */}
                    {i < PRAYERS.length - 1 && (
                      <div
                        className="shrink-0 snap-start w-[180px] sm:w-[220px] pl-1 pr-2"
                        style={{ minWidth: '180px' }}
                      >
                        <div className="rounded-lg border border-zinc-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-zinc-800/40 p-2 h-full min-h-[100px] flex flex-col">
                          <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-1.5">
                            {getSlotLabel(SLOT_KEYS[i], PRAYERS)}
                          </div>
                          <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar max-h-24">
                            {(slotsForDay[SLOT_KEYS[i]] || []).map((r) => (
                              <div
                                key={r.id}
                                className="flex items-center gap-1.5 group"
                              >
                                <TaskCheckbox
                                  done={r.done}
                                  onClick={() => toggleTimelineRoutine?.(todayKey, SLOT_KEYS[i], r.id, !r.done)}
                                />
                                <span className={`flex-1 text-xs truncate ${r.done ? 'text-zinc-500 line-through dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}>
                                  {r.title}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeTimelineRoutine?.(todayKey, SLOT_KEYS[i], r.id)}
                                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-zinc-400 hover:text-red-500 transition-opacity focus-ring"
                                  title="Rimuovi"
                                >
                                  <Icons.X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-1 mt-1.5">
                            <input
                              type="text"
                              value={draftBySlot[SLOT_KEYS[i]] ?? ''}
                              onChange={(e) => setDraftBySlot(prev => ({ ...prev, [SLOT_KEYS[i]]: e.target.value }))}
                              onKeyDown={(e) => e.key === 'Enter' && addRoutine(SLOT_KEYS[i])}
                              placeholder="Micro-abitudine..."
                              className="flex-1 min-w-0 rounded border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900/80 px-2 py-1 text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                            <button
                              type="button"
                              onClick={() => addRoutine(SLOT_KEYS[i])}
                              className="shrink-0 rounded p-1.5 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-colors focus-ring"
                              title="Aggiungi"
                            >
                              <Icons.Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
