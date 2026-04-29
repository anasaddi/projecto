import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { ProgressBar, Badge, ActionButton } from './Card';
import { PROJECT_CARD_STYLES, getAccentColor } from './ProjectCardStyles';

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
  onToggleExpand,
  showExplicitProjectDelete = false,
  taskListClassName,
  sharedWorkspaceChrome = false,
  extraMenuItems = [],
  sourceProjectId,
  hideShareLink = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const accentColor = getAccentColor(accent);
  const totalTasks = stats?.total ?? 0;
  const completedTasks = stats?.done ?? stats?.completed ?? 0;
  const isProjectDone = totalTasks > 0 && completedTasks === totalTasks;

  return (
    <div 
      className={`${PROJECT_CARD_STYLES.container.base} ${sharedWorkspaceChrome ? 'rounded-[24px] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.86))] dark:bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.09),transparent_38%),linear-gradient(180deg,rgba(21,26,34,0.97),rgba(15,20,29,0.97))] hover:border-white/15' : ''} ${projectDeadlineEditing === project.id ? 'z-30' : 'z-auto'}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 h-12 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${accentColor.bar}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            {isEditing ? (
              <textarea
                defaultValue={project.title}
                rows={1}
                autoFocus
                onBlur={(e) => { 
                  const v = e.target.value.trim();
                  if (v && v !== project.title) onTitleChange?.(v); 
                  setIsEditing(false); 
                }}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    const v = e.currentTarget.value.trim();
                    if (v && v !== project.title) onTitleChange?.(v); 
                    setIsEditing(false); 
                  } 
                  if (e.key === 'Escape') setIsEditing(false); 
                }}
                className={`min-h-[1.5rem] w-full resize-none overflow-hidden bg-transparent py-0.5 text-sm font-semibold leading-snug tracking-tight outline-none break-words ${
                  isProjectDone ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-50'
                }`}
                style={{ minHeight: '1.5rem' }}
                onInput={(e) => { 
                  const t = e.target; 
                  t.style.height = 'auto'; 
                  t.style.height = `${Math.min(t.scrollHeight, 96)}px`; 
                }}
              />
            ) : (
              <div
                className={`min-h-[1.5rem] w-full text-sm font-semibold leading-snug tracking-tight cursor-pointer overflow-hidden text-ellipsis ${
                  isProjectDone ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-50'
                }`}
                title={project.title}
                onDoubleClick={() => setIsEditing(true)}
              >
                {project.title}
              </div>
            )}

            <div className="flex shrink-0 items-center gap-1 pl-2">
              {isShared && !hideShareLink && (
                <Link
                  to={`/shared/${shareId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-xl border border-transparent p-1.5 text-zinc-400 transition-colors hover:border-zinc-200 hover:bg-zinc-100/90 hover:text-indigo-500 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.06]"
                  title="Apri condivisa"
                >
                  <Icons.ExternalLink className="h-3 w-3" />
                </Link>
              )}
              <ActionButton 
                size="sm" 
                onClick={() => { 
                  const next = !expanded; 
                  setExpanded(next); 
                  onToggleExpand?.(next); 
                }} 
                className={expanded ? 'text-zinc-800 bg-zinc-100 dark:text-zinc-100 dark:bg-indigo-500/30 dark:ring-1 dark:ring-indigo-400/50' : ''} 
                title={expanded ? 'Chiudi task' : 'Apri task'}
              >
                <Icons.ChevronDown className={`h-3 w-3 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
              </ActionButton>
              <ActionButton 
                size="sm" 
                onClick={() => { 
                  setProjectDeadlineInput(project.deadline || ''); 
                  setProjectDeadlineEditing(project.id); 
                }} 
                className={project.deadline ? 'text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : ''} 
                title="Scadenza"
              >
                <Icons.Calendar className="h-3 w-3" />
              </ActionButton>
              {(showExplicitProjectDelete || onDelete) && (
                <ActionButton 
                  size="sm" 
                  danger 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onDelete?.(project.id || project._id); 
                  }} 
                  title="Elimina"
                >
                  <Icons.X className="h-3 w-3" />
                </ActionButton>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="default" size="sm">
              <span className={accentColor.text}>{isShared ? 'Shared' : 'Personal'}</span>
            </Badge>
            <Badge variant={percentage === 100 && stats?.total > 0 ? 'success' : 'primary'} size="sm">
              {completedTasks}/{totalTasks} task
            </Badge>
            {project.deadline && (
              <Badge variant={isProjectDone ? 'default' : 'warning'} size="sm">
                <Icons.Calendar className="h-3 w-3" />
                <span>{formatDeadline(project.deadline)}</span>
              </Badge>
            )}
            <div className="min-w-[120px] flex-1 sm:max-w-[220px]">
              <ProgressBar value={percentage} max={100} size="sm" showLabel color={accent} />
            </div>
          </div>
        </div>
      </div>

      {projectDeadlineEditing === project.id && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-b-[28px] border-t bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-800">
          <input 
            type="date" 
            value={projectDeadlineInput} 
            onChange={(e) => setProjectDeadlineInput(e.target.value)} 
            onBlur={() => onDeadlineClick?.(projectDeadlineInput)} 
            onKeyDown={(e) => { 
              if (e.key === 'Enter') onDeadlineClick?.(projectDeadlineInput); 
              if (e.key === 'Escape') setProjectDeadlineEditing(null); 
            }} 
            autoFocus 
            className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs outline-none" 
          />
        </div>
      )}

      {expanded && (
        <div className="rounded-b-[28px] border-t border-zinc-100 bg-zinc-50/70 p-4 dark:border-white/[0.04] dark:bg-black/20">
          <div className="flex flex-col gap-1">
            {renderTasks()}
          </div>
        </div>
      )}
    </div>
  );
}

export function CreateProjectCard({ onClick, className = '' }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative flex h-full min-h-[4.5rem] w-full flex-row items-center justify-center gap-3 overflow-hidden rounded-xl border border-dashed border-zinc-200/90 bg-white/[0.6] px-4 py-2 shadow-none transition-all hover:border-indigo-400/80 hover:bg-indigo-50/40 dark:border-white/[0.1] dark:bg-white/[0.02] dark:hover:bg-indigo-500/[0.06] ${className}`}
    >
      <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-white/5 transition-all duration-300 group-hover:bg-indigo-500 group-hover:text-white group-hover:shadow-md group-hover:shadow-indigo-500/20">
        <Icons.Plus className="h-3.5 w-3.5 text-zinc-400 group-hover:text-white" />
      </div>
      
      <div className="relative text-left flex flex-col justify-center">
        <p className="text-xs font-bold tracking-tight text-zinc-700 transition-colors group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400 leading-tight">
          Nuovo Progetto
        </p>
        <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
          Crea un'unità di lavoro
        </p>
      </div>
    </motion.button>
  );
}
