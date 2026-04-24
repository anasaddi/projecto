import React, { useMemo, memo } from 'react';
import { CardV3 } from '../ui/CardV3';
import { ButtonV3 } from '../ui/ButtonV3';
import { useDashboardStore } from '../../../store/dashboardStore';
import { resolveTop3Slots } from '../../../components/dashboard/DashboardUtils';
import type { Project, QuickTask, Top3Slot } from '../../../types/dashboard';

type ResolvedTop3Slot = (Top3Slot & {
  title?: string;
  projectTitle?: string;
  done?: boolean;
  missing?: boolean;
  isQuick?: boolean;
}) | null;

function findFirstIncompleteTask(project: Project): { taskId: string; title: string; done: boolean } | null {
  const stack = [...(project.tasks || [])];
  while (stack.length) {
    const node = stack.shift();
    if (!node) continue;
    if (!node.done) return { taskId: node.id, title: node.title, done: false };
    if (Array.isArray(node.children) && node.children.length) stack.unshift(...node.children);
  }
  return null;
}

export const Top3V3 = memo(function Top3V3() {
  const projects = (useDashboardStore((s) => s.projects) ?? []) as Project[];
  const quickTasks = (useDashboardStore((s) => s.quickTasks) ?? []) as QuickTask[];
  const sharedDashboards = useDashboardStore((s) => s.sharedDashboards) ?? [];
  const lifeGoals = useDashboardStore((s) => s.lifeGoals) ?? { tiers: [] };
  const top3Manual = (useDashboardStore((s) => s.top3Manual) ?? [null, null, null]) as (Top3Slot | null)[];
  const setTop3SlotAtIndex = useDashboardStore((s) => s.setTop3SlotAtIndex);
  const removeFromTop3 = useDashboardStore((s) => s.removeFromTop3);
  const toggleQuickTask = useDashboardStore((s) => s.toggleQuickTask);
  const toggleProjectTask = useDashboardStore((s) => s.toggleProjectTask);
  const toggleSharedQuickTask = useDashboardStore((s) => s.toggleSharedQuickTask);

  const resolvedSlots = useMemo(
    () => resolveTop3Slots(projects, top3Manual, quickTasks, lifeGoals as any, sharedDashboards as any[]),
    [projects, top3Manual, quickTasks, lifeGoals, sharedDashboards]
  ) as ResolvedTop3Slot[];

  const suggestions = useMemo(() => {
    const quick = quickTasks.filter((t) => !t.parentId).slice(0, 3).map((t) => ({
      label: t.title,
      slot: { quickTaskId: t.id, title: t.title, done: t.done } as Top3Slot,
    }));
    const projectTasks = projects
      .map((p) => {
        const firstTask = findFirstIncompleteTask(p) || (p.tasks?.[0] ? { taskId: p.tasks[0].id, title: p.tasks[0].title, done: p.tasks[0].done } : null);
        return firstTask
          ? { label: `${p.title}: ${firstTask.title}`, slot: { projectId: p.id, taskId: firstTask.taskId, title: firstTask.title, done: firstTask.done } as Top3Slot }
          : null;
      })
      .filter(Boolean)
      .slice(0, 3) as Array<{ label: string; slot: Top3Slot }>;
    return [...quick, ...projectTasks].slice(0, 6);
  }, [projects, quickTasks]);

  const completedCount = resolvedSlots.filter((slot) => slot && !slot.missing && slot.done).length;
  const progress = resolvedSlots.length > 0 ? (completedCount / resolvedSlots.length) * 100 : 0;

  const handleToggle = (slot: ResolvedTop3Slot, index: number) => {
    if (!slot || slot.missing) return;
    if (slot.isQuick && slot.quickTaskId) {
      toggleQuickTask(slot.quickTaskId, !slot.done);
      return;
    }
    if (slot.shareId && slot.quickTaskId) {
      toggleSharedQuickTask(slot.shareId, slot.quickTaskId, !slot.done);
      return;
    }
    if (slot.projectId && slot.taskId) {
      toggleProjectTask(slot.projectId, slot.taskId, !slot.done);
    }
  };

  return (
    <CardV3 className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Top 3</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {completedCount}/{resolvedSlots.length} completed
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
              strokeDasharray={`${Math.max(0, progress) * 1.26} 126`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-[var(--d3-text)]">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-auto pr-1">
        {resolvedSlots.map((slot, index) => (
          <div key={index} className="rounded-[var(--d3-radius-md)] border border-[var(--d3-border)] bg-[var(--d3-surface-elevated)] p-3">
            {slot && !slot.missing ? (
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggle(slot, index)}
                  className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    slot.done
                      ? 'bg-[var(--d3-success)] border-[var(--d3-success)]'
                      : 'border-[var(--d3-border)] hover:border-[var(--d3-primary)]'
                  }`}
                >
                  {slot.done && (
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <button className="flex-1 text-left" onClick={() => handleToggle(slot, index)}>
                  <div className={`text-sm font-medium ${slot.done ? 'line-through text-[var(--d3-text-muted)]' : 'text-[var(--d3-text)]'}`}>
                    {slot.title || 'Untitled'}
                  </div>
                  <div className="text-xs text-[var(--d3-text-muted)]">
                    {slot.projectTitle || 'Goal'}
                  </div>
                </button>
                <button
                  onClick={() => removeFromTop3(index)}
                  className="text-[var(--d3-text-muted)] hover:text-[var(--d3-danger)] transition-colors"
                  aria-label="Remove top 3 slot"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l8 8M14 6l-8 8" />
                  </svg>
                </button>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--d3-text)]">Empty slot #{index + 1}</div>
                    <div className="text-xs text-[var(--d3-text-muted)]">Pick a quick task or project task</div>
                  </div>
                  <button
                    onClick={() => removeFromTop3(index)}
                    className="text-[var(--d3-text-muted)] hover:text-[var(--d3-danger)] transition-colors"
                    aria-label="Clear empty slot"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 6l8 8M14 6l-8 8" />
                    </svg>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.slice(0, 4).map((suggestion) => (
                    <button
                      key={suggestion.label}
                      onClick={() => setTop3SlotAtIndex(index, suggestion.slot)}
                      className="text-xs px-2.5 py-1.5 rounded-full border border-[var(--d3-border)] bg-[var(--d3-surface)] text-[var(--d3-text-secondary)] hover:border-[var(--d3-primary)] hover:text-[var(--d3-primary)] transition-colors"
                    >
                      {suggestion.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--d3-border)] flex items-center justify-between gap-3 text-xs text-[var(--d3-text-muted)]">
        <span>Slots are synced with your tasks and projects</span>
        <ButtonV3 variant="ghost" size="sm" onClick={() => {
          const firstEmpty = resolvedSlots.findIndex((slot) => !slot);
          if (firstEmpty !== -1 && suggestions[0]) setTop3SlotAtIndex(firstEmpty, suggestions[0].slot);
        }}>
          Auto-fill
        </ButtonV3>
      </div>
    </CardV3>
  );
});
