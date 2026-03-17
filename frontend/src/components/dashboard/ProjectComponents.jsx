import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icons } from './Icons';
import { KebabMenu } from './DashboardComponents';
import { getDeadlinePastLabel } from './DashboardUtils';

export function StandardProjectCard({
  project,
  stats,
  percentage,
  accent,
  isShared,
  shareId,
  onTitleChange,
  onDelete,
  onDeadlineClick,
  projectDeadlineEditing,
  projectDeadlineInput,
  setProjectDeadlineInput,
  setProjectDeadlineEditing,
  getDeadlineColorClass,
  formatDeadline,
  renderTasks,
  defaultExpanded = false,
  onToggleExpand
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const accentBar = { indigo: 'bg-indigo-500', sky: 'bg-sky-500', violet: 'bg-violet-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[accent] || 'bg-zinc-400';

  const menuItems = [
    {
      label: project.deadline ? 'Modifica scadenza' : 'Aggiungi scadenza',
      icon: <Icons.Calendar className="h-3.5 w-3.5" />,
      onClick: () => { setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }
    },
    'divider',
    { label: 'Elimina progetto', icon: <Icons.X className="h-3.5 w-3.5" />, danger: true, onClick: () => onDelete(project.id) }
  ];

  return (
    <div className={`dashboard-panel group flex flex-col transition-all text-left relative ${isMenuOpen ? 'z-50' : 'z-auto'}`}>
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-3 p-4 hover:bg-zinc-50/60 dark:hover:bg-white/[0.02] transition-colors duration-150"
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          onToggleExpand?.(next);
        }}
      >
        <div className={`h-5 w-1 shrink-0 rounded-full ${accentBar} shadow-[0_0_8px_rgba(0,0,0,0.08)] dark:shadow-[0_0_8px_rgba(255,255,255,0.06)]`} />

        <textarea
          ref={(el) => {
            if (el) {
              el.style.height = 'auto';
              el.style.height = `${el.scrollHeight}px`;
            }
          }}
          value={project.title}
          onChange={(e) => {
            e.stopPropagation();
            onTitleChange(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          rows={1}
          className="seamless-input flex-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100 resize-none outline-none bg-transparent overflow-hidden break-words py-0.5 leading-snug"
        />

        <div className="flex shrink-0 items-center gap-3">
          {project.deadline && projectDeadlineEditing !== project.id && (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border border-zinc-200 dark:border-white/[0.04] transition-colors ${getDeadlineColorClass(project.deadline, false)}`}
              >
                {formatDeadline(project.deadline)}
              </button>
              {getDeadlinePastLabel(project.deadline) && (
                <span className="text-[9px] font-bold text-red-500 dark:text-red-400">Scaduta</span>
              )}
            </span>
          )}
          {projectDeadlineEditing === project.id && (
            <input
              type="date"
              value={projectDeadlineInput}
              onChange={(e) => setProjectDeadlineInput(e.target.value)}
              onBlur={() => onDeadlineClick(projectDeadlineInput)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onDeadlineClick(projectDeadlineInput);
                if (e.key === 'Escape') setProjectDeadlineEditing(null);
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              className="dashboard-input w-28 py-0.5 text-xs"
            />
          )}

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="h-[3px] w-16 overflow-hidden rounded-full bg-zinc-200 dark:bg-white/[0.06]">
              <div className={`h-full ${accentBar} transition-all duration-500`} style={{ width: `${percentage}%` }} />
            </div>
            <span className="w-8 text-right text-xs font-bold tabular-nums text-zinc-500 dark:text-zinc-400">{percentage}%</span>
          </div>

          {isShared && (
            <Link to={`/shared/${shareId}`} onClick={(e) => e.stopPropagation()} className="dashboard-action-btn" title="Apri condivisa">
              <Icons.ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            <KebabMenu items={menuItems} onOpenChange={setIsMenuOpen} />
          </div>

          <Icons.ChevronDown className={`h-4 w-4 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Tasks — espandibili */}
      {expanded && (
        <div className="animate-slide-down border-t border-zinc-100 dark:border-white/[0.06] p-4 pt-3 flex flex-col gap-1">
          {renderTasks()}
        </div>
      )}
    </div>
  );
}
