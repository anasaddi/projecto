import React, { memo, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Plus, X } from 'lucide-react';
import { CardV3 } from '../ui/CardV3';
import { useDashboardStore } from '../../../store/dashboardStore';
import { PRAYER_SLOTS, getCurrentSlotKey, toDateKey } from '../../../components/dashboard/DashboardUtils';
import type { DailyTaskTemplate, DayCompletionPayload, TimelineRoutineItem } from '../../../types/dashboard';

const DEFAULT_PRAYER_TIMES: Record<string, string> = {
  Fajr: '05:24',
  Dhuhr: '12:31',
  Asr: '15:47',
  Maghrib: '18:22',
  Isha: '19:48',
};

function getSlotLabel(slotKey: string) {
  const [from, to] = slotKey.split('-');
  return `${from} → ${to}`;
}

export const TimelineV3 = memo(function TimelineV3() {
  const dailyTaskTemplates = (useDashboardStore((s) => s.dailyTaskTemplates) ?? []) as DailyTaskTemplate[];
  const timelineRoutines = useDashboardStore((s) => s.timelineRoutines) ?? {};
  const dailyCompletionLog = useDashboardStore((s) => s.dailyCompletionLog) ?? {};
  const prayerLogs = useDashboardStore((s) => s.prayerLogs) ?? {};
  const addTimelineRoutine = useDashboardStore((s) => s.addTimelineRoutine);
  const toggleTimelineRoutine = useDashboardStore((s) => s.toggleTimelineRoutine);
  const removeTimelineRoutine = useDashboardStore((s) => s.removeTimelineRoutine);
  const timelinePanelExpanded = useDashboardStore((s) => s.timelinePanelExpanded) !== false;
  const setTimelinePanelExpanded = useDashboardStore((s) => s.setTimelinePanelExpanded);
  const togglePrayer = useDashboardStore((s) => s.togglePrayer);

  const [now, setNow] = useState(() => new Date());
  const [openSlot, setOpenSlot] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const PRAYERS = useMemo(() => ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], []);
  const todayKey = toDateKey(now);
  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const slotsForDay = (timelineRoutines as Record<string, Record<string, TimelineRoutineItem[]>>)[todayKey] || {};
  const todayPrayerLog = (prayerLogs as Record<string, Record<string, boolean>>)[todayKey] || {};
  const todayCompletion = (dailyCompletionLog as Record<string, DayCompletionPayload>)[todayKey] || { quick: [], project: [] };
  const currentSlotKey = getCurrentSlotKey(now);

  const slotItems = useMemo(() => {
    return PRAYERS.map((prayer: string, idx: number) => {
      const slotKey = PRAYER_SLOTS[idx] || `${prayer}-${idx}`;
      const routines = slotsForDay[slotKey] || [];
      const routineDone = routines.filter((r) => r.done).length;
      return {
        slotKey,
        prayer,
        time: DEFAULT_PRAYER_TIMES[prayer] || '--:--',
        done: !!todayPrayerLog[prayer],
        current: currentSlotKey === slotKey,
        routineDone,
        routineTotal: routines.length,
        routines,
      };
    });
  }, [PRAYERS, slotsForDay, todayPrayerLog, currentSlotKey]);

  const prayerDoneCount = PRAYERS.filter((p: string) => todayPrayerLog[p]).length;
  const routineDoneCount = slotItems.reduce((acc, item) => acc + item.routineDone, 0);
  const routineTotalCount = slotItems.reduce((acc, item) => acc + item.routineTotal, 0);
  const totalDone = prayerDoneCount + routineDoneCount + Math.min(3, (todayCompletion.quick?.length || 0) + (todayCompletion.project?.length || 0));
  const totalExpected = PRAYERS.length + routineTotalCount + Math.min(3, activeHabits.length);
  const progressPct = totalExpected ? totalDone / totalExpected : 0;

  const activeHabitMap = useMemo(() => new Map(activeHabits.map((habit) => [habit.id, habit])), [activeHabits]);

  return (
    <CardV3 className="h-full flex flex-col overflow-hidden" elevated padding="none">
      <button
        type="button"
        onClick={() => setTimelinePanelExpanded(!timelinePanelExpanded)}
        className="flex w-full items-center gap-3 px-4 sm:px-5 py-3.5 text-left transition-colors hover:bg-[var(--d3-surface-elevated)]/40"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--d3-primary-bg)] text-[var(--d3-primary)] font-semibold">
            TL
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--d3-text-muted)]">Prayer Timeline</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--d3-text)]">Prayer Flow</h3>
              <span className="text-sm text-[var(--d3-text-muted)]">
                {prayerDoneCount}/{PRAYERS.length} prayers · {routineDoneCount}/{routineTotalCount} routines
              </span>
            </div>
          </div>
        </div>

        <div className="hidden xl:block flex-1 min-w-0">
          <div className="h-2 rounded-full bg-[var(--d3-border)] overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: `${Math.max(2, progressPct * 100)}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[var(--d3-primary)] to-[var(--d3-primary-light)]"
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 text-[10px] text-[var(--d3-text-muted)]">
          <span className="rounded-full bg-[var(--d3-success-bg)] px-2 py-1 text-[var(--d3-success)]">Done</span>
          <span className="rounded-full bg-[var(--d3-primary-bg)] px-2 py-1 text-[var(--d3-primary)]">Current</span>
          <span className="hidden sm:inline rounded-full bg-[var(--d3-surface-elevated)] px-2 py-1">{Math.round(progressPct * 100)}%</span>
        </div>

        <motion.div
          animate={{ rotate: timelinePanelExpanded ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          className="ml-1 rounded-2xl border border-[var(--d3-border)] bg-[var(--d3-surface-elevated)] p-2 text-[var(--d3-text-muted)] transition-colors hover:text-[var(--d3-text)]"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {timelinePanelExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="border-t border-[var(--d3-border)]/60 bg-[var(--d3-surface)]/50"
          >
            <div className="p-3 sm:p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5">
                {slotItems.map((item) => (
                  <div
                    key={item.slotKey}
                    className={`rounded-[var(--d3-radius-lg)] border overflow-hidden transition-all ${
                      item.current
                        ? 'border-[var(--d3-primary)] shadow-[0_0_0_1px_var(--d3-primary-bg)]'
                        : item.done
                          ? 'border-[var(--d3-success)]/20'
                          : 'border-[var(--d3-border)]'
                    }`}
                    style={{
                      backgroundColor: item.done
                        ? 'var(--d3-success-bg)'
                        : item.current
                          ? 'var(--d3-primary-bg)'
                          : 'var(--d3-surface-elevated)',
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 border-b border-[var(--d3-border)]/50 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => togglePrayer(item.prayer, !item.done)}
                        className="flex items-center gap-2 text-left"
                      >
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold transition-colors ${
                            item.done
                              ? 'bg-[var(--d3-success)] text-white'
                              : 'bg-[var(--d3-surface)] text-[var(--d3-text-muted)]'
                          }`}
                        >
                          {item.done ? <Check className="h-3.5 w-3.5" /> : item.prayer[0]}
                        </span>
                        <div>
                          <div className="text-sm font-semibold text-[var(--d3-text)]">{item.prayer}</div>
                          <div className="text-xs text-[var(--d3-text-muted)]">{item.time}</div>
                        </div>
                      </button>

                      <div className="flex flex-col items-end text-right">
                        <span className={`text-[10px] font-medium ${item.current ? 'text-[var(--d3-primary)]' : 'text-[var(--d3-text-muted)]'}`}>
                          {item.current ? 'Current' : item.done ? 'Done' : 'Pending'}
                        </span>
                        <span className="text-[10px] text-[var(--d3-text-muted)]">
                          {item.routineDone}/{item.routineTotal} routines
                        </span>
                      </div>
                    </div>

                    <div className="p-3 space-y-1.5">
                      <div className="h-2 rounded-full bg-[var(--d3-border)] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[var(--d3-primary)] to-[var(--d3-primary-light)]"
                          style={{ width: `${item.routineTotal ? Math.max(4, (item.routineDone / item.routineTotal) * 100) : 0}%` }}
                        />
                      </div>

                      <div className="space-y-1 min-h-[80px]">
                        {item.routines.length > 0 ? (
                          item.routines.slice(0, 3).map((routine) => {
                            const habit = activeHabitMap.get(routine.habitId);
                            return (
                              <div key={routine.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-[var(--d3-surface)]/80 transition-colors">
                                <button
                                  type="button"
                                  onClick={() => toggleTimelineRoutine(todayKey, item.slotKey, routine.id, !routine.done)}
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                    routine.done
                                      ? 'border-[var(--d3-success)] bg-[var(--d3-success)] text-white'
                                      : 'border-[var(--d3-border)] text-[var(--d3-text-muted)] hover:border-[var(--d3-primary)]'
                                  }`}
                                >
                                  {routine.done ? <Check className="h-3 w-3" /> : null}
                                </button>

                                <span className={`min-w-0 flex-1 text-xs ${routine.done ? 'line-through text-[var(--d3-text-muted)]' : 'text-[var(--d3-text)]'}`}>
                                  {habit?.title || 'Rimosso'}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => removeTimelineRoutine(todayKey, item.slotKey, routine.id)}
                                  className="rounded-md p-1 text-[var(--d3-text-muted)] transition-colors hover:bg-[var(--d3-danger)]/10 hover:text-[var(--d3-danger)]"
                                  aria-label="Remove routine"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="rounded-xl border border-dashed border-[var(--d3-border)]/80 px-3 py-2.5 text-xs text-[var(--d3-text-muted)]">
                            Nessuna routine in questo slot.
                          </div>
                        )}
                      </div>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setOpenSlot(openSlot === item.slotKey ? null : item.slotKey)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--d3-border)] px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-[var(--d3-text-muted)] transition-colors hover:border-[var(--d3-primary)] hover:text-[var(--d3-primary)]"
                        >
                          <Plus className="h-3 w-3" />
                          Win
                        </button>

                        {openSlot === item.slotKey && (
                          <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-44 overflow-auto rounded-2xl border border-[var(--d3-border)] bg-[var(--d3-surface)] p-2 shadow-xl">
                            {activeHabits.length === 0 ? (
                              <div className="px-3 py-4 text-center text-xs text-[var(--d3-text-muted)]">Nessuna abitudine sbloccata</div>
                            ) : (
                              activeHabits.map((habit) => (
                                <button
                                  key={habit.id}
                                  type="button"
                                  onClick={() => {
                                    addTimelineRoutine(todayKey, item.slotKey, habit.id);
                                    setOpenSlot(null);
                                  }}
                                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-[var(--d3-text)] transition-colors hover:bg-[var(--d3-primary-bg)] hover:text-[var(--d3-primary)]"
                                >
                                  <span className="min-w-0 truncate pr-3">{habit.title}</span>
                                  <Plus className="h-4 w-4 shrink-0" />
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CardV3>
  );
});
