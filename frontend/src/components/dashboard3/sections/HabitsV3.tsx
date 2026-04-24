import React, { useMemo, useState, memo } from 'react';
import { CardV3 } from '../ui/CardV3';
import { ButtonV3 } from '../ui/ButtonV3';
import { useDashboardStore } from '../../../store/dashboardStore';
import { toDateKey } from '../../../components/dashboard/DashboardUtils';
import type { DailyTaskTemplate, DailyTaskLogEntry } from '../../../types/dashboard';

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitsV3 = memo(function HabitsV3() {
  const dailyTaskTemplates = (useDashboardStore((s) => s.dailyTaskTemplates) ?? []) as DailyTaskTemplate[];
  const dailyTaskLogs = (useDashboardStore((s) => s.dailyTaskLogs) ?? {}) as Record<string, DailyTaskLogEntry[]>;
  const toggleDailyTask = useDashboardStore((s) => s.toggleDailyTask);
  const addHabitAction = useDashboardStore((s) => s.addHabitAction);
  const removeDailyTask = useDashboardStore((s) => s.removeDailyTask);

  const [draft, setDraft] = useState('');

  const todayDayIndex = useMemo(() => {
    const jsDay = new Date().getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const todayKey = toDateKey(new Date());
  const todayDoneMap = useMemo(() => {
    const entries = dailyTaskLogs[todayKey] || [];
    const map: Record<string, boolean> = {};
    entries.forEach((entry) => {
      map[entry.id] = entry.done;
    });
    return map;
  }, [dailyTaskLogs, todayKey]);

  const habits = useMemo(
    () => [...dailyTaskTemplates].sort((a, b) => (a.ordinal ?? 0) - (b.ordinal ?? 0)),
    [dailyTaskTemplates]
  );

  const completedCount = habits.filter((habit) => todayDoneMap[habit.id]).length;
  const totalStreak = habits.reduce((sum, habit) => sum + (habit.locked ? 0 : 1), 0);

  const handleAdd = () => {
    const text = draft.trim();
    if (!text) return;
    addHabitAction(text);
    setDraft('');
  };

  return (
    <CardV3 className="h-full flex flex-col" elevated>
      <div className="flex items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Habits</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {completedCount}/{habits.length} done · {totalStreak} tracked
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {WEEK_DAYS.map((day, i) => (
            <div
              key={day + i}
              className={`w-6 h-6 rounded text-[10px] flex items-center justify-center font-medium ${
                i === todayDayIndex
                  ? 'bg-[var(--d3-primary)] text-white'
                  : 'bg-[var(--d3-surface-elevated)] text-[var(--d3-text-muted)]'
              }`}
            >
              {day}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-auto pr-1">
        {habits.length === 0 ? (
          <div className="rounded-[var(--d3-radius-md)] border border-dashed border-[var(--d3-border)] p-4 text-sm text-[var(--d3-text-muted)]">
            Nessuna abitudine trovata.
          </div>
        ) : (
          habits.map((habit) => {
            const done = !!todayDoneMap[habit.id];
            return (
              <div
                key={habit.id}
                className={`w-full flex items-center gap-3 p-3 rounded-[var(--d3-radius-md)] transition-colors duration-200 group text-left ${
                  done ? 'border border-[var(--d3-success)]/20' : 'border border-transparent hover:border-[var(--d3-border)]'
                }`}
                style={{ backgroundColor: done ? 'var(--d3-success-bg)' : 'var(--d3-surface-elevated)' }}
              >
                <button
                  onClick={() => toggleDailyTask(habit.id, !done)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    done
                      ? 'bg-[var(--d3-success)] border-[var(--d3-success)]'
                      : 'border-[var(--d3-border)] group-hover:border-[var(--d3-primary)]'
                  }`}
                >
                  {done && (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => toggleDailyTask(habit.id, !done)}
                >
                  <p className={`text-sm font-medium truncate ${done ? 'text-[var(--d3-success)] line-through' : 'text-[var(--d3-text)]'}`}>
                    {habit.title}
                  </p>
                  <p className="text-xs text-[var(--d3-text-muted)]">{habit.inTimeline ? 'Visible in timeline' : 'Hidden from timeline'}</p>
                </button>
                <button
                  type="button"
                  onClick={() => removeDailyTask(habit.id)}
                  className="text-[var(--d3-text-muted)] hover:text-[var(--d3-danger)] transition-colors"
                  aria-label="Remove habit"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--d3-border)] flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add habit..."
          className="flex-1 px-3 py-2 text-sm bg-[var(--d3-surface-elevated)] border border-[var(--d3-border)] rounded-[var(--d3-radius-md)] text-[var(--d3-text)] placeholder:text-[var(--d3-text-muted)] focus:outline-none focus:border-[var(--d3-primary)] transition-colors"
        />
        <ButtonV3 variant="primary" size="md" onClick={handleAdd}>Add</ButtonV3>
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--d3-border)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--d3-text-muted)]">Today progress</span>
          <span className="font-medium text-[var(--d3-text)]">
            {habits.length ? Math.round((completedCount / habits.length) * 100) : 0}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-[var(--d3-surface-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${habits.length ? (completedCount / habits.length) * 100 : 0}%`,
              background: 'linear-gradient(to right, var(--d3-primary), var(--d3-primary-light))',
            }}
          />
        </div>
      </div>
    </CardV3>
  );
});
