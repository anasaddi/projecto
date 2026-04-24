import React, { useState, useCallback, memo } from 'react';
import { CardV3 } from '../ui/CardV3';
import { ButtonV3 } from '../ui/ButtonV3';

interface Project {
  id: string;
  name: string;
  progress: number;
  color: string;
  tasks: { id: string; text: string; completed: boolean }[];
  deadline: string;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    progress: 75,
    color: '#6366f1',
    tasks: [
      { id: '1', text: 'Design system', completed: true },
      { id: '2', text: 'Homepage', completed: true },
      { id: '3', text: 'About page', completed: false },
      { id: '4', text: 'Contact form', completed: false },
    ],
    deadline: '2026-04-30',
  },
  {
    id: '2',
    name: 'Mobile App',
    progress: 45,
    color: '#22c55e',
    tasks: [
      { id: '1', text: 'User auth', completed: true },
      { id: '2', text: 'Dashboard', completed: false },
      { id: '3', text: 'Settings', completed: false },
    ],
    deadline: '2026-05-15',
  },
  {
    id: '3',
    name: 'Marketing Campaign',
    progress: 90,
    color: '#f59e0b',
    tasks: [
      { id: '1', text: 'Strategy', completed: true },
      { id: '2', text: 'Content', completed: true },
      { id: '3', text: 'Launch', completed: false },
    ],
    deadline: '2026-04-25',
  },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const diff = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff < 0) return 'Overdue';
  return `${diff} days`;
};

export const ProjectsV3 = memo(function ProjectsV3() {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleTask = useCallback((projectId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const updatedTasks = p.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        const progress = Math.round(
          (updatedTasks.filter((t) => t.completed).length / updatedTasks.length) * 100
        );
        return { ...p, tasks: updatedTasks, progress };
      })
    );
  }, []);

  const totalProgress = Math.round(
    projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
  );

  return (
    <CardV3 className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--d3-text)]">Projects</h3>
          <p className="text-sm text-[var(--d3-text-muted)]">
            {projects.length} active · {totalProgress}% avg
          </p>
        </div>
        <ButtonV3 variant="ghost" size="sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New
        </ButtonV3>
      </div>

      <div className="flex-1 space-y-3 overflow-auto">
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-[var(--d3-surface-elevated)] rounded-[var(--d3-radius-md)] p-4 transition-all hover:border-[var(--d3-border)] border border-transparent"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: project.color }}
                />
                <h4 className="font-medium text-[var(--d3-text)]">{project.name}</h4>
              </div>
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  formatDate(project.deadline) === 'Overdue'
                    ? 'text-[var(--d3-danger)]'
                    : 'text-[var(--d3-text-muted)]'
                }`}
                style={{ backgroundColor: formatDate(project.deadline) === 'Overdue' ? 'var(--d3-danger-bg)' : 'var(--d3-surface)' }}
              >
                {formatDate(project.deadline)}
              </span>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-2 bg-[var(--d3-border)] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${project.progress}%`,
                    backgroundColor: project.color,
                  }}
                />
              </div>
              <span className="text-sm font-medium text-[var(--d3-text)] w-10 text-right">
                {project.progress}%
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
                {project.tasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(project.id, task.id)}
                    className="w-full flex items-center gap-2 text-left group"
                  >
                    <div
                      className={`w-4 h-4 rounded border transition-all ${
                        task.completed
                          ? 'bg-[var(--d3-success)] border-[var(--d3-success)]'
                          : 'border-[var(--d3-border)] group-hover:border-[var(--d3-primary)]'
                      }`}
                    >
                      {task.completed && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        task.completed
                          ? 'line-through text-[var(--d3-text-muted)]'
                          : 'text-[var(--d3-text-secondary)]'
                      }`}
                    >
                      {task.text}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </CardV3>
  );
});
