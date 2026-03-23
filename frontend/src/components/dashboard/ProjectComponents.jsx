import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { KebabMenu } from './DashboardComponents';
import { getDeadlinePastLabel } from './DashboardUtils';
import { Card, ProgressBar, Badge } from './Card';

const ACCENT_COLORS = {
  indigo: { bar: 'from-indigo-500 to-violet-500', text: 'text-indigo-600 dark:text-indigo-400', glow: 'shadow-[0_0_14px_rgba(99,102,241,0.35)] dark:shadow-[0_0_18px_rgba(129,140,248,0.32)]' },
  sky: { bar: 'from-sky-500 to-cyan-500', text: 'text-sky-600 dark:text-sky-400', glow: 'shadow-[0_0_14px_rgba(14,165,233,0.32)] dark:shadow-[0_0_18px_rgba(56,189,248,0.28)]' },
  violet: { bar: 'from-violet-500 to-purple-500', text: 'text-violet-600 dark:text-violet-400', glow: 'shadow-[0_0_14px_rgba(168,85,247,0.34)] dark:shadow-[0_0_18px_rgba(192,132,252,0.3)]' },
  emerald: { bar: 'from-emerald-500 to-teal-500', text: 'text-emerald-600 dark:text-emerald-400', glow: 'shadow-[0_0_14px_rgba(16,185,129,0.3)] dark:shadow-[0_0_18px_rgba(52,211,153,0.26)]' },
  amber: { bar: 'from-amber-500 to-orange-500', text: 'text-amber-600 dark:text-amber-400', glow: 'shadow-[0_0_14px_rgba(245,158,11,0.28)] dark:shadow-[0_0_18px_rgba(251,191,36,0.24)]' },
  rose: { bar: 'from-rose-500 to-pink-500', text: 'text-rose-600 dark:text-rose-400', glow: 'shadow-[0_0_14px_rgba(244,63,94,0.28)] dark:shadow-[0_0_18px_rgba(251,113,133,0.24)]' }
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
  onToggleExpand,
  /** Workspace shared: pulsante elimina progetto visibile (non solo nel kebab) */
  showExplicitProjectDelete = false,
  /** Classi aggiuntive per l’area lista task (es. shared più compatta) */
  taskListClassName,
  /** Header / barra più compatta e card leggermente più “tight” (workspace /shared) */
  sharedWorkspaceChrome = false,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);
  const titleFocusedRef = useRef(false);

  useEffect(() => {
    if (!titleFocusedRef.current) setTitleDraft(project.title);
  }, [project.id, project.title]);

  const accentColor = ACCENT_COLORS[accent] || ACCENT_COLORS.indigo;
  const totalTasks = stats?.total ?? 0;
  const completedTasks = stats?.done ?? 0;

  const menuItems = [
    {
      label: project.deadline ? 'Modifica scadenza' : 'Aggiungi scadenza',
      icon: <Icons.Calendar className="h-3.5 w-3.5" />,
      onClick: () => { setProjectDeadlineInput(project.deadline || ''); setProjectDeadlineEditing(project.id); }
    },
    ...(showExplicitProjectDelete
      ? []
      : [
          'divider',
          { label: 'Elimina progetto', icon: <Icons.X className="h-3.5 w-3.5" />, danger: true, onClick: () => onDelete(project.id) }
        ]),
  ];

  const isPastDeadline = getDeadlinePastLabel(project.deadline);

  return (
    <Card 
      className={`group relative flex flex-col overflow-hidden ${sharedWorkspaceChrome ? 'rounded-[24px] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.86))] dark:bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.09),transparent_38%),linear-gradient(180deg,rgba(21,26,34,0.97),rgba(15,20,29,0.97))] hover:border-white/15' : ''} ${isMenuOpen ? 'z-50' : 'z-auto'} ${expanded ? 'ring-1 ring-zinc-200/80 dark:ring-white/[0.08]' : ''}`}
      glow={expanded}
    >
      <div
        className={`group/header flex cursor-pointer items-center gap-3 ${sharedWorkspaceChrome ? 'p-4 sm:p-4' : 'p-5'}`}
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          onToggleExpand?.(next);
        }}
      >
        <div className={`${sharedWorkspaceChrome ? 'h-11 w-1.5' : 'h-12 w-1.5'} shrink-0 self-center rounded-full bg-gradient-to-b ${accentColor.bar} shadow-sm ${sharedWorkspaceChrome ? accentColor.glow : ''}`} />

        <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
          <div className={`min-w-0 flex-1 ${sharedWorkspaceChrome ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-2'}`}>
            <div className={`min-w-0 ${sharedWorkspaceChrome ? 'flex items-start justify-between gap-3' : 'flex min-w-0 flex-1 flex-wrap items-center gap-2'}`}>
              <div className="min-w-0 flex-1">
                <textarea
                  ref={(el) => {
                    if (el) {
                      el.style.height = 'auto';
                      el.style.height = `${el.scrollHeight}px`;
                    }
                  }}
                  value={titleDraft}
                  onFocus={() => { titleFocusedRef.current = true; }}
                  onBlur={() => {
                    titleFocusedRef.current = false;
                    const v = titleDraft.trim();
                    if (v !== project.title) onTitleChange(v);
                  }}
                  onChange={(e) => {
                    e.stopPropagation();
                    setTitleDraft(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  rows={1}
                  className={`min-h-[1.5rem] w-full min-w-[80px] resize-none overflow-visible bg-transparent py-0.5 font-semibold leading-snug tracking-tight text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100 ${sharedWorkspaceChrome ? 'text-[14px]' : 'text-[15px]'}`}
                />
              </div>

              {sharedWorkspaceChrome && (
                <span className={`shrink-0 pt-0.5 text-[12px] font-bold tabular-nums ${accentColor.text}`}>
                  {percentage}%
                </span>
              )}
            </div>

            {sharedWorkspaceChrome ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {project.deadline && projectDeadlineEditing !== project.id && (
                  <Badge variant={isPastDeadline ? 'danger' : 'warning'} size="sm">
                    <Icons.Calendar className="h-3 w-3" />
                    <span>{formatDeadline(project.deadline)}</span>
                    {isPastDeadline && <span className="ml-0.5">!</span>}
                  </Badge>
                )}
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  {completedTasks}/{totalTasks || 0} task fatte
                </span>
              </div>
            ) : (
              project.deadline && projectDeadlineEditing !== project.id && (
                <Badge variant={isPastDeadline ? 'danger' : 'warning'} size="sm">
                  <Icons.Calendar className="h-3 w-3" />
                  <span>{formatDeadline(project.deadline)}</span>
                  {isPastDeadline && <span className="ml-0.5">!</span>}
                </Badge>
              )
            )}

            {sharedWorkspaceChrome ? (
              <div className="w-full">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10 dark:bg-white/[0.08]">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${accentColor.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  />
                </div>
              </div>
            ) : (
              <div className="min-w-[100px] flex-1 sm:max-w-[180px]">
                <ProgressBar value={percentage} max={100} size="sm" showLabel color={accent} />
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2 pl-2">
            {showExplicitProjectDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className="rounded-xl border border-transparent p-2 text-zinc-400 transition-colors hover:border-rose-500/15 hover:bg-rose-500/10 hover:text-rose-500 dark:text-zinc-500 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                title="Elimina progetto"
                aria-label="Elimina progetto"
              >
                <Icons.Trash2 className="h-4 w-4" />
              </button>
            )}
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
              <KebabMenu items={menuItems} onOpenChange={setIsMenuOpen} />
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
              className="w-28 rounded-lg border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs text-zinc-900 outline-none dark:border-white/[0.08] dark:bg-white/[0.06] dark:text-zinc-100"
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
        <div
          className={
            taskListClassName ??
            'border-t border-zinc-100/80 px-4 pb-4 pt-3 space-y-2 dark:border-zinc-700/40'
          }
        >
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
  const pct = Math.min(100, Math.max(0, Math.round(percentage)));
  
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.99 }}
      className="group w-full rounded-[22px] border border-zinc-200/65 bg-white/[0.92] p-3.5 text-left shadow-[0_14px_40px_-28px_rgba(15,23,42,0.2)] backdrop-blur-xl transition-all duration-300 hover:border-zinc-300/80 hover:shadow-[0_20px_48px_-32px_rgba(99,102,241,0.18)] dark:border-white/[0.07] dark:bg-[#141922]/92 dark:shadow-[0_20px_50px_-36px_rgba(0,0,0,0.55)] dark:hover:border-white/[0.12] dark:hover:shadow-[0_24px_56px_-36px_rgba(99,102,241,0.12)]"
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 h-11 w-1 shrink-0 rounded-full bg-gradient-to-b ${accentColor.bar} shadow-[0_0_12px_-2px_rgba(99,102,241,0.35)] dark:shadow-[0_0_14px_-2px_rgba(129,140,248,0.25)]`} />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-snug tracking-tight text-zinc-900 [overflow-wrap:anywhere] break-words dark:text-zinc-100">
            {project.title}
          </p>
          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100/90 ring-1 ring-zinc-200/40 dark:bg-white/[0.06] dark:ring-white/[0.05]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${accentColor.bar} transition-[width] duration-500 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`shrink-0 text-[11px] font-bold tabular-nums ${accentColor.text}`}>{pct}%</span>
          </div>
          <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            Avanzamento progetto
          </p>
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
