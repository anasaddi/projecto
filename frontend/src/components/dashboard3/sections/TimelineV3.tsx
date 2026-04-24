import React, { useEffect, useMemo, useState, memo } from 'react';
import { CardV3 } from '../ui/CardV3';
import { useDashboardStore } from '../../../store/dashboardStore';
import { useGlobalConfig } from '../../../context/GlobalConfigContext';
import { PRAYER_SLOTS, getCurrentSlotKey, toDateKey } from '../../../components/dashboard/DashboardUtils';
import type { DailyTaskTemplate, TimelineRoutineItem } from '../../../types/dashboard';

const DEFAULT_PRAYER_TIMES: Record<string, string> = {
  Fajr: '05:24',
  Dhuhr: '12:31',
  Asr: '15:47',
  Maghrib: '18:22',
  Isha: '19:48',
};

export const TimelineV3 = memo(function TimelineV3() {
  const globalConfig = useGlobalConfig() as { config?: { PRAYERS?: string[] } } | null;
  const config = globalConfig?.config;
  const PRAYERS = useMemo(() => config?.PRAYERS || ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'], [config]);
  const dailyTaskTemplates = (useDashboardStore((s) => s.dailyTaskTemplates) ?? []) as DailyTaskTemplate[];
  const timelineRoutines = useDashboardStore((s) => s.timelineRoutines) ?? {};
  const dailyCompletionLog = useDashboardStore((s) => s.dailyCompletionLog) ?? {};
  const prayerLogs = useDashboardStore((s) => s.prayerLogs) ?? {};
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const todayKey = toDateKey(now);
  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const currentSlotKey = getCurrentSlotKey(now);
  const slotsForDay = (timelineRoutines as Record<string, Record<string, TimelineRoutineItem[]>>)[todayKey] || {};
  const todayPrayerLog = (prayerLogs as Record<string, Record<string, boolean>>)[todayKey] || {};
  const todayCompletion = (dailyCompletionLog as Record<string, { quick?: string[]; project?: string[] }>)[todayKey] || { quick: [], project: [] };

  const items = useMemo(() => {
    return PRAYERS.map((prayer: string, idx: number) => {
      const slotKey = PRAYER_SLOTS[idx] || `${prayer}-${idx}`;
      const routines = slotsForDay[slotKey] || [];
      const routineDone = routines.filter((r) => r.done).length;
      const routineTotal = routines.length;
      return {
        id: slotKey,
        label: prayer,
        time: DEFAULT_PRAYER_TIMES[prayer] || '--:--',
        done: !!todayPrayerLog[prayer],
        routineDone,
        routineTotal,
        current: currentSlotKey === slotKey,
      };
    });
  }, [PRAYERS, slotsForDay, todayPrayerLog, currentSlotKey]);

  const completed = useMemo(() => {
    const prayerCount = PRAYERS.filter((p: string) => todayPrayerLog[p]).length;
    const routineCount = items.reduce((acc: number, item: { routineDone: number }) => acc + item.routineDone, 0);
    const routineTotal = items.reduce((acc: number, item: { routineTotal: number }) => acc + item.routineTotal, 0);
    const quickDone = todayCompletion.quick?.length || 0;
    const projectDone = todayCompletion.project?.length || 0;
    const total = PRAYERS.length + routineTotal + Math.min(3, activeHabits.length);
    const done = prayerCount + routineCount + Math.min(3, quickDone + projectDone);
    return { total, done, pct: total ? done / total : 0 };
  }, [PRAYERS, activeHabits.length, todayCompletion.quick, todayCompletion.project, todayPrayerLog, items]);

  return (
    <CardV3 className="h-full flex flex-col" elevated>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Daily Timeline</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {Math.round(completed.pct * 100)}% done · {completed.done}/{completed.total}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end text-[10px] text-[var(--d3-text-muted)]">
          <span className="px-2 py-1 rounded-full bg-[var(--d3-success-bg)] text-[var(--d3-success)]">Done</span>
          <span className="px-2 py-1 rounded-full bg-[var(--d3-primary-bg)] text-[var(--d3-primary)]">Current</span>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-2 scrollbar-hide">
        <div className="flex gap-3 min-w-max">
          {items.map((item) => (
            <div
              key={item.id}
              className={`w-44 rounded-[var(--d3-radius-md)] border p-3 transition-colors ${
                item.done ? 'border-[var(--d3-success)]/20' : item.current ? 'border-[var(--d3-primary)]' : 'border-[var(--d3-border)]'
              }`}
              style={{ backgroundColor: item.done ? 'var(--d3-success-bg)' : item.current ? 'var(--d3-primary-bg)' : 'var(--d3-surface-elevated)' }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-[var(--d3-text)]">{item.label}</p>
                  <p className="text-xs text-[var(--d3-text-muted)]">{item.time}</p>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full ${item.done ? 'bg-[var(--d3-success)]' : item.current ? 'bg-[var(--d3-primary)]' : 'bg-[var(--d3-border)]'}`} />
              </div>
              <div className="space-y-1 text-xs text-[var(--d3-text-muted)]">
                <div>{item.done ? 'Prayer completed' : 'Prayer pending'}</div>
                <div>{item.routineDone}/{item.routineTotal} routines</div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[var(--d3-border)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${item.routineTotal ? (item.routineDone / item.routineTotal) * 100 : 0}%`,
                    background: 'linear-gradient(to right, var(--d3-primary), var(--d3-primary-light))',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </CardV3>
  );
});
