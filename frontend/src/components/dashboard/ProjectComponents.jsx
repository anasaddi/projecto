import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { KebabMenu } from './DashboardComponents';
import { getDeadlinePastLabel } from './DashboardUtils';
import { Card, ProgressBar, Badge } from './Card';

const ACCENT_COLORS = {
  indigo: { bar: 'from-indigo-500 to-violet-500', text: 'text-indigo-600 dark:text-indigo-400' },
  sky: { bar: 'from-sky-500 to-cyan-500', text: 'text-sky-600 dark:text-sky-400' },
  violet: { bar: 'from-violet-500 to-purple-500', text: 'text-violet-600 dark:text-violet-400' },
  emerald: { bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { bar: 'from-amber-500 to-orange-500', text: 'text-amber-600 dark:text-amber-400' },
  rose: { bar: 'from-rose-500 to-pink-500', text: 'text-rose-600 dark:text-rose-400' }
};

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
  const accentColor = ACCENT_COLORS[accent] || ACCENT_COLORS.indigo;
  const totalTasks = stats?.total ?? 0;
  const completedTasks = stats?.done ?? 0;

  const menuItems = [
    {
      label: project.deadline ? 'Modifica scadenza' : 'Aggiungi scadenza',
      icon: <Icons.Calendar className="h-3.5 w-3.5" />,
      onClick: () => { setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }
    },
    'divider',
    { label: 'Elimina progetto', icon: <Icons.X className="h-3.5 w-3.5" />, danger: true, onClick: () => onDelete(project.id) }
  ];

  const isPastDeadline = getDeadlinePastLabel(project.deadline);

  return (
    <Card 
      className={`flex flex-col ${isMenuOpen ? 'z-50' : 'z-auto'} ${expanded ? 'ring-1 ring-zinc-200/80 dark:ring-white/[0.08]' : ''}`}
      glow={expanded}
    >
      <div
        className="group/header flex cursor-pointer items-center gap-3 p-5"
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          onToggleExpand?.(next);
        }}
      >
        <div className={`h-12 w-1.5 shrink-0 self-center rounded-full bg-gradient-to-b ${accentColor.bar} shadow-sm`} />

        <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
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
              className="min-h-[1.5rem] w-full min-w-[80px] resize-none overflow-visible bg-transparent py-0.5 text-[15px] font-semibold leading-snug tracking-tight text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
            />
            {project.deadline && projectDeadlineEditing !== project.id && (
              <Badge variant={isPastDeadline ? 'danger' : 'warning'} size="sm">
                <Icons.Calendar className="h-3 w-3" />
                <span>{formatDeadline(project.deadline)}</span>
                {isPastDeadline && <span className="ml-0.5">!</span>}
              </Badge>
            )}
            <div className="min-w-[100px] flex-1 sm:max-w-[180px]">
              <ProgressBar value={percentage} max={100} size="sm" showLabel color={accent} />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pl-2">
            {isShared && (
              <Link
                to={`/shared/${shareId}`}
                onClick={(e) => e.stopPropagation()}
                className="rounded-xl border border-transparent p-2 text-zinc-400 transition-colors hover:border-zinc-200 hover:bg-zinc-100/90 hover:text-indigo-500 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.06]"
                title="Apri condivisa"
              >
                <Icons.ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <KebabMenu items={menuItems} onOpenChange={setIsMenuOpen} alwaysVisible />
            </div>
            <motion.div
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="rounded-xl border border-transparent p-1.5 text-zinc-400 transition-colors group-hover/header:bg-zinc-100/90 group-hover/header:text-zinc-600 dark:group-hover/header:bg-white/[0.06] dark:group-hover/header:text-zinc-300"
            >
              <Icons.ChevronDown className="h-4 w-4" />
            </motion.div>
          </div>
        </div>

        <div className="hidden self-stretch border-l border-zinc-100 dark:border-white/[0.04] lg:block" />

        <div className="flex shrink-0 items-center self-stretch pl-0 lg:pl-1">
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
              className="w-28 py-1 px-2 text-xs rounded-lg bg-zinc-100 dark:bg-white/[0.06] border border-zinc-200 dark:border-white/[0.08] outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          )}
        </div>
      </div>

      {/* Tasks - expandable */}
      <motion.div
        initial={false}
        animate={{ 
          height: expanded ? 'auto' : 0,
          opacity: expanded ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="overflow-hidden"
      >
        <div className="px-5 pb-5 pt-4 space-y-4 border-t border-zinc-100/80 dark:border-zinc-700/40">
          {renderTasks()}
        </div>
      </motion.div>
    </Card>
  );
}

/**
 * Compact Project Card for limited spaces
 */
export function CompactProjectCard({
  project,
  percentage,
  accent = 'indigo',
  onClick
}) {
  const accentColor = ACCENT_COLORS[accent] || ACCENT_COLORS.indigo;
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="w-full rounded-2xl border border-zinc-200/70 bg-white/[0.88] p-3.5 text-left shadow-sm shadow-zinc-200/40 transition-all hover:border-zinc-300 hover:shadow-md dark:border-white/[0.08] dark:bg-[#141922]/80"
    >
      <div className="flex items-center gap-3">
        <div className={`h-9 w-1 rounded-full bg-gradient-to-b ${accentColor.bar}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-snug text-zinc-900 break-words [overflow-wrap:anywhere] dark:text-zinc-100">{project.title}</p>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-zinc-100 dark:bg-white/[0.06] overflow-hidden">
              <div 
                className={`h-full rounded-full bg-gradient-to-r ${accentColor.bar}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-[10px] font-bold tabular-nums text-zinc-500">{percentage}%</span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Project creation placeholder card
 */
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
        <p className="text-[12px] font-bold tracking-tight text-zinc-700 transition-colors group-hover:text-indigo-600 dark:text-zinc-200 dark:group-hover:text-indigo-400 leading-tight">
          Nuovo Progetto
        </p>
        <p className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 leading-tight mt-0.5">
          Crea un'unità di lavoro
        </p>
      </div>
    </motion.button>
  );
}
