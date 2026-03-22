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
      className={`flex flex-col ${isMenuOpen ? 'z-50' : 'z-auto'} ${expanded ? 'ring-1 ring-zinc-200 dark:ring-white/[0.08]' : ''}`}
      glow={expanded}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-3 p-4 group/header"
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          onToggleExpand?.(next);
        }}
      >
        {/* Accent indicator */}
        <div className={`w-1.5 h-10 rounded-full bg-gradient-to-b ${accentColor.bar} shadow-sm shrink-0`} />

        {/* Title */}
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
          className="flex-1 text-sm font-bold text-zinc-800 dark:text-zinc-100 resize-none outline-none bg-transparent overflow-hidden break-words py-0.5 leading-snug placeholder:text-zinc-400"
        />

        {/* Meta info */}
        <div className="flex shrink-0 items-center gap-2">
          {/* Deadline */}
          {project.deadline && projectDeadlineEditing !== project.id && (
            <Badge 
              variant={isPastDeadline ? 'danger' : 'warning'}
              size="sm"
              className="hidden sm:flex"
            >
              <Icons.Calendar className="h-3 w-3" />
              <span>{formatDeadline(project.deadline)}</span>
              {isPastDeadline && <span className="ml-0.5">!</span>}
            </Badge>
          )}
          
          {/* Deadline editing */}
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

          {/* Progress */}
          <div className="hidden md:flex flex-col items-end gap-1 w-20">
            <ProgressBar 
              value={percentage} 
              max={100} 
              size="sm" 
              showLabel
              color={accent}
            />
          </div>

          {/* Actions */}
          {isShared && (
            <Link 
              to={`/shared/${shareId}`} 
              onClick={(e) => e.stopPropagation()} 
              className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
              title="Apri condivisa"
            >
              <Icons.ExternalLink className="h-3.5 w-3.5" />
            </Link>
          )}

          <div onClick={(e) => e.stopPropagation()}>
            <KebabMenu items={menuItems} onOpenChange={setIsMenuOpen} />
          </div>

          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="p-1 rounded-lg text-zinc-400 group-hover/header:text-zinc-600 dark:group-hover/header:text-zinc-300"
          >
            <Icons.ChevronDown className="h-4 w-4" />
          </motion.div>
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
        <div className="border-t border-zinc-100 dark:border-white/[0.04] p-4 pt-3 flex flex-col gap-1">
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
      className="w-full text-left p-3 rounded-xl bg-white/80 dark:bg-[#161920]/80 border border-zinc-200/60 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${accentColor.bar}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">{project.title}</p>
          <div className="flex items-center gap-2 mt-1">
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
export function CreateProjectCard({ onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="group relative overflow-hidden rounded-2xl border-2 border-dashed border-zinc-300 dark:border-white/[0.12] bg-zinc-50/50 dark:bg-white/[0.02] p-6 flex flex-col items-center justify-center gap-3 min-h-[140px] transition-all hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/5"
    >
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/0 via-purple-500/0 to-indigo-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-indigo-500/5 transition-all duration-500" />
      
      <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-white/[0.06] dark:to-white/[0.12] flex items-center justify-center group-hover:from-indigo-500 group-hover:to-purple-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-indigo-500/25">
        <Icons.Plus className="h-6 w-6 text-zinc-500 dark:text-zinc-400 group-hover:text-white transition-colors" />
      </div>
      
      <div className="relative text-center">
        <p className="text-sm font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
          Nuovo Progetto
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
          Clicca per iniziare
        </p>
      </div>
    </motion.button>
  );
}
