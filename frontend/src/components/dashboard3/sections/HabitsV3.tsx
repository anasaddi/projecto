import React, { useState, useCallback, memo, useMemo } from 'react';
import { CardV3 } from '../ui/CardV3';

interface Habit {
  id: string;
  name: string;
  streak: number;
  completed: boolean;
  icon: string;
}

const INITIAL_HABITS: Habit[] = [
  { id: '1', name: 'Morning workout', streak: 12, completed: true, icon: '💪' },
  { id: '2', name: 'Read 30 min', streak: 5, completed: false, icon: '📚' },
  { id: '3', name: 'Meditate', streak: 8, completed: false, icon: '🧘' },
  { id: '4', name: 'Drink 2L water', streak: 3, completed: true, icon: '💧' },
];

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const HabitsV3 = memo(function HabitsV3() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);

  const todayDayIndex = useMemo(() => {
    const jsDay = new Date().getDay(); // 0=Sun, 1=Mon...
    return jsDay === 0 ? 6 : jsDay - 1; // Convert: 0=Mon, 6=Sun
  }, []);

  const toggleHabit = useCallback((id: string) => {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, completed: !h.completed } : h
      )
    );
  }, []);

  const completedCount = habits.filter((h) => h.completed).length;
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

  return (
    <CardV3 className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Habits</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {completedCount}/{habits.length} done · {totalStreak} day streak
          </p>
        </div>
        <div className="flex gap-1">
          {WEEK_DAYS.map((day, i) => (
            <div
              key={i}
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

      <div className="flex-1 space-y-2 overflow-auto">
        {habits.map((habit) => (
          <button
            key={habit.id}
            onClick={() => toggleHabit(habit.id)}
            className={`w-full flex items-center gap-3 p-3 rounded-[var(--d3-radius-md)] transition-colors duration-200 group text-left ${
              habit.completed
                ? 'border border-[var(--d3-success)]/20'
                : 'border border-transparent hover:border-[var(--d3-border)]'
            }`}
            style={{ backgroundColor: habit.completed ? 'var(--d3-success-bg)' : 'var(--d3-surface-elevated)' }}
          >
            <span className="text-2xl">{habit.icon}</span>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  habit.completed
                    ? 'text-[var(--d3-success)] line-through'
                    : 'text-[var(--d3-text)]'
                }`}
              >
                {habit.name}
              </p>
              <p className="text-xs text-[var(--d3-text-muted)]">
                {habit.streak} day streak 🔥
              </p>
            </div>
            <div
              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                habit.completed
                  ? 'bg-[var(--d3-success)] border-[var(--d3-success)]'
                  : 'border-[var(--d3-border)] group-hover:border-[var(--d3-primary)]'
              }`}
            >
              {habit.completed && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--d3-border)]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--d3-text-muted)]">Weekly progress</span>
          <span className="font-medium text-[var(--d3-text)]">
            {Math.round((completedCount / habits.length) * 100)}%
          </span>
        </div>
        <div className="mt-2 h-2 bg-[var(--d3-surface-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(completedCount / habits.length) * 100}%`,
              background: 'linear-gradient(to right, var(--d3-primary), var(--d3-primary-light))',
            }}
          />
        </div>
      </div>
    </CardV3>
  );
});
