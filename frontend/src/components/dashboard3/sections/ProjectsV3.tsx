import React, { memo, useMemo, useState } from 'react';
import { CardV3 } from '../ui/CardV3';
import { ButtonV3 } from '../ui/ButtonV3';
import { useDashboardStore } from '../../../store/dashboardStore';
import { countTreeStats, formatDeadlineDisplay } from '../../../components/dashboard/DashboardUtils';
import type { Project, TaskNode } from '../../../types/dashboard';

function countProgress(tasks: TaskNode[]) {
  const stats = countTreeStats(tasks);
  return stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
}

function renderTaskTree(
  nodes: TaskNode[],
  onToggle: (taskId: string, done: boolean) => void,
  depth = 0
) {
  return nodes.map((task) => (
    <div key={task.id} className="space-y-1" style={{ marginLeft: depth * 12 }}>
      <button
        type="button"
        onClick={() => onToggle(task.id, !task.done)}
        className="w-full flex items-start gap-2 text-left"
      >
        <span
          className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
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
        </span>
        <span className={`flex-1 text-sm ${task.done ? 'line-through text-[var(--d3-text-muted)]' : 'text-[var(--d3-text)]'}`}>
          {task.title}
        </span>
      </button>
      {Array.isArray(task.children) && task.children.length > 0 && (
        <div className="space-y-1">
          {renderTaskTree(task.children, onToggle, depth + 1)}
        </div>
      )}
    </div>
  ));
}

export const ProjectsV3 = memo(function ProjectsV3() {
  const projects = (useDashboardStore((s) => s.projects) ?? []) as Project[];
  const toggleProjectTask = useDashboardStore((s) => s.toggleProjectTask);
  const createProject = useDashboardStore((s) => s.createProject);
  const [expanded, setExpanded] = useState<string | null>(null);

  const totalProgress = useMemo(() => {
    const ratios = projects.map((p) => countProgress(p.tasks));
    return ratios.length ? Math.round(ratios.reduce((a, b) => a + b, 0) / ratios.length) : 0;
  }, [projects]);

  return (
    <CardV3 className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Projects</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {projects.length} active · {totalProgress}% avg
          </p>
        </div>
        <ButtonV3 variant="ghost" size="sm" onClick={createProject}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </ButtonV3>
      </div>

      <div className="flex-1 space-y-3 overflow-auto pr-1">
        {projects.length === 0 ? (
          <div className="rounded-[var(--d3-radius-md)] border border-dashed border-[var(--d3-border)] p-4 text-sm text-[var(--d3-text-muted)]">
            Nessun progetto disponibile.
          </div>
        ) : (
          projects.map((project) => {
            const progress = countProgress(project.tasks);
            const deadlineLabel = project.deadline ? formatDeadlineDisplay(project.deadline) : 'No deadline';

            return (
              <div
                key={project.id}
                className="bg-[var(--d3-surface-elevated)] rounded-[var(--d3-radius-md)] p-4 border border-transparent hover:border-[var(--d3-border)] transition-colors"
              >
                <div className="flex items-center justify-between mb-2 gap-3">
                  <div>
                    <h4 className="font-medium text-[var(--d3-text)]">{project.title}</h4>
                    <p className="text-xs text-[var(--d3-text-muted)]">{deadlineLabel}</p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: project.deadline ? 'var(--d3-danger-bg)' : 'var(--d3-surface)',
                      color: project.deadline ? 'var(--d3-danger)' : 'var(--d3-text-muted)',
                    }}
                  >
                    {deadlineLabel}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 h-2 bg-[var(--d3-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        background: 'linear-gradient(to right, var(--d3-primary), var(--d3-primary-light))',
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-[var(--d3-text)] w-10 text-right">
                    {progress}%
                  </span>
                </div>

                <button
                  onClick={() => setExpanded(expanded === project.id ? null : project.id)}
                  className="text-xs text-[var(--d3-text-muted)] hover:text-[var(--d3-primary)] transition-colors"
                >
                  {expanded === project.id ? 'Hide' : 'Show'} {project.tasks.length} tasks
                </button>

                {expanded === project.id && (
                  <div className="mt-3 pt-3 border-t border-[var(--d3-border)] space-y-2">
                    {renderTaskTree(project.tasks, (taskId, done) => toggleProjectTask(project.id, taskId, done))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </CardV3>
  );
});
