import React, { useMemo, useState, useCallback, memo } from 'react';
import { CardV3 } from '../ui/CardV3';
import { ButtonV3 } from '../ui/ButtonV3';
import { useDashboardStore } from '../../../store/dashboardStore';

export const QuickTasksV3 = memo(function QuickTasksV3() {
  const quickTasks = useDashboardStore((s: any) => s.quickTasks) ?? [];
  const toggleQuickTask = useDashboardStore((s: any) => s.toggleQuickTask);
  const removeQuickTask = useDashboardStore((s: any) => s.removeQuickTask);
  const addQuickTaskAction = useDashboardStore((s: any) => s.addQuickTaskAction);
  const [draft, setDraft] = useState('');

  const rootTasks = useMemo(() => quickTasks.filter((t: any) => !t.parentId), [quickTasks]);
  const completed = useMemo(() => rootTasks.filter((t: any) => t.done).length, [rootTasks]);

  const handleAdd = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    addQuickTaskAction(text);
    setDraft('');
  }, [draft, addQuickTaskAction]);

  return (
    <CardV3 className="h-full flex flex-col" elevated>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Quick Tasks</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {completed}/{rootTasks.length} done
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-full text-[var(--d3-primary)]" style={{ backgroundColor: 'var(--d3-primary-bg)' }}>
          Rapid flow
        </span>
      </div>

      <div className="space-y-2 flex-1 overflow-auto pr-1">
        {rootTasks.length === 0 ? (
          <div className="rounded-[var(--d3-radius-md)] border border-dashed border-[var(--d3-border)] p-4 text-sm text-[var(--d3-text-muted)]">
            Nessun quick task. Aggiungine uno.
          </div>
        ) : (
          rootTasks.map((task: any) => (
            <div
              key={task.id}
              className={`flex items-center gap-3 rounded-[var(--d3-radius-md)] border px-3 py-2 transition-colors ${
                task.done
                  ? 'border-[var(--d3-success)]/20'
                  : 'border-transparent hover:border-[var(--d3-border)]'
              }`}
              style={{ backgroundColor: task.done ? 'var(--d3-success-bg)' : 'var(--d3-surface-elevated)' }}
            >
              <button
                type="button"
                aria-label={`Toggle ${task.title}`}
                onClick={() => toggleQuickTask(task.id, !task.done)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  task.done
                    ? 'bg-[var(--d3-success)] border-[var(--d3-success)]'
                    : 'border-[var(--d3-border)] hover:border-[var(--d3-primary)]'
                }`}
              >
                {task.done && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                className={`flex-1 text-left text-sm ${task.done ? 'line-through text-[var(--d3-text-muted)]' : 'text-[var(--d3-text)]'}`}
                onClick={() => toggleQuickTask(task.id, !task.done)}
              >
                {task.title}
              </button>
              <button
                type="button"
                onClick={() => removeQuickTask(task.id)}
                className="text-[var(--d3-text-muted)] hover:text-[var(--d3-danger)] transition-colors"
                aria-label="Remove task"
              >
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l8 8M14 6l-8 8" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--d3-border)] flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add quick task..."
          className="flex-1 rounded-[var(--d3-radius-md)] border border-[var(--d3-border)] bg-[var(--d3-surface-elevated)] px-3 py-2 text-sm outline-none focus:border-[var(--d3-primary)]"
        />
        <ButtonV3 variant="primary" size="md" onClick={handleAdd}>Add</ButtonV3>
      </div>
    </CardV3>
  );
});
