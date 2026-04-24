import React, { useState, useCallback, memo } from 'react';
import { CardV3 } from '../ui/CardV3';
import { ButtonV3 } from '../ui/ButtonV3';

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

const PRIORITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const INITIAL_TASKS: Task[] = [
  { id: '1', text: 'Complete project proposal', completed: false, priority: 'high' },
  { id: '2', text: 'Review team updates', completed: false, priority: 'medium' },
  { id: '3', text: 'Plan tomorrow schedule', completed: false, priority: 'low' },
];

export const Top3V3 = memo(function Top3V3() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTask, setNewTask] = useState('');

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  }, []);

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      text: newTask,
      completed: false,
      priority: 'medium',
    };
    setTasks((prev) => [...prev.slice(0, 2), task]);
    setNewTask('');
  }, [newTask]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') addTask();
  }, [addTask]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <CardV3 className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Top 3</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {completedCount}/{tasks.length} completed
          </p>
        </div>
        <div className="w-12 h-12 relative">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="var(--d3-border)"
              strokeWidth="4"
            />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="var(--d3-primary)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progress * 1.26} 126`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[var(--d3-text)]">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        {tasks.map((task, index) => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-3 rounded-[var(--d3-radius-md)] transition-all duration-200 ${
              task.completed
                ? 'bg-[var(--d3-surface-elevated)] opacity-60'
                : 'bg-[var(--d3-surface-elevated)] hover:bg-[var(--d3-border)]'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
            />
            <button
              onClick={() => toggleTask(task.id)}
              className={`flex-1 text-left text-sm transition-all ${
                task.completed
                  ? 'line-through text-[var(--d3-text-muted)]'
                  : 'text-[var(--d3-text)]'
              }`}
            >
              <span className="text-[var(--d3-text-muted)] font-medium mr-2">
                {index + 1}.
              </span>
              {task.text}
            </button>
            <button
              onClick={() => toggleTask(task.id)}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                task.completed
                  ? 'bg-[var(--d3-success)] border-[var(--d3-success)]'
                  : 'border-[var(--d3-border)] hover:border-[var(--d3-primary)]'
              }`}
            >
              {task.completed && (
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--d3-border)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a priority task..."
            className="flex-1 px-3 py-2 text-sm bg-[var(--d3-surface-elevated)] border border-[var(--d3-border)] rounded-[var(--d3-radius-md)] text-[var(--d3-text)] placeholder:text-[var(--d3-text-muted)] focus:outline-none focus:border-[var(--d3-primary)] transition-colors"
          />
          <ButtonV3 variant="primary" size="md" onClick={addTask}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </ButtonV3>
        </div>
      </div>
    </CardV3>
  );
});
