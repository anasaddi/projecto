import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { KebabMenu } from './DashboardComponents';
import { getDeadlinePastLabel } from './DashboardUtils';
import { Card, ProgressBar, Badge } from './Card';
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
  /** Workspace shared: pulsante elimina progetto visibile (non solo nel kebab) */
  showExplicitProjectDelete = false,
  /** Classi aggiuntive per l'area lista task (es. shared più compatta) */
  taskListClassName,
  /** Header / barra più compatta e card leggermente più "tight" (workspace /shared) */
  sharedWorkspaceChrome = false,
  /** Additional menu items to add to the kebab menu */
  extraMenuItems = [],
  /** Source project ID if this is a synced copy */
  sourceProjectId,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);
  const titleFocusedRef = useRef(false);

  useEffect(() => {
    if (!titleFocusedRef.current) setTitleDraft(project.title);
  }, [project.id, project.title]);

  const accentColor = getAccentColor(accent);
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
    ...extraMenuItems,
  ];

  const isPastDeadline = getDeadlinePastLabel(project.deadline);

  return (
    <Card 
      className={`group relative flex flex-col overflow-hidden ${PROJECT_CARD_STYLES.container.base} ${PROJECT_CARD_STYLES.container.hover} ${sharedWorkspaceChrome ? 'rounded-[24px] border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.86))] dark:bg-[radial-gradient(circle_at_top_left,rgba(129,140,248,0.09),transparent_38%),linear-gradient(180deg,rgba(21,26,34,0.97),rgba(15,20,29,0.97))] hover:border-white/15' : ''} ${isMenuOpen ? 'z-50' : 'z-auto'} ${expanded ? PROJECT_CARD_STYLES.container.expanded : ''}`}
      glow={expanded}
    >
      <div
        className={`group/header flex cursor-pointer items-start gap-3 ${sharedWorkspaceChrome ? 'px-4 pb-4 pt-8' : PROJECT_CARD_STYLES.header.base}`}
        onClick={() => {
          const next = !expanded;
          setExpanded(next);
          onToggleExpand?.(next);
        }}
      >
        {sharedWorkspaceChrome ? (
          <div className={`h-3 w-3 shrink-0 rounded-full bg-gradient-to-br ${accentColor.bar} ${accentColor.glow}`} />
        ) : (
          <div className={`h-12 w-1.5 shrink-0 self-center rounded-full bg-gradient-to-b ${accentColor.bar} shadow-sm`} />
        )}

        <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
          <div className={`min-w-0 flex-1 ${sharedWorkspaceChrome ? 'flex flex-col gap-2' : 'flex flex-wrap items-center gap-2'}`}>
            <div className={`min-w-0 ${sharedWorkspaceChrome ? 'flex items-center justify-between gap-3' : 'flex min-w-0 flex-1 flex-wrap items-center gap-2'}`}>
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
                  className={`min-h-[1.5rem] w-full min-w-[80px] resize-none overflow-visible bg-transparent ${sharedWorkspaceChrome ? 'py-1 text-sm' : 'py-0.5 text-sm'} font-semibold leading-snug tracking-tight text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100`}
                />
              </div>
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
                {sourceProjectId && (
                  <Badge variant="success" size="sm">
                    <Icons.Share2 className="h-3 w-3" />
                    <span>Sincronizzato</span>
                  </Badge>
                )}
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400 dark:text-zinc-500">
                  {completedTasks}/{totalTasks || 0} task fatte
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                {project.deadline && projectDeadlineEditing !== project.id && (
                  <Badge variant={isPastDeadline ? 'danger' : 'warning'} size="sm">
                    <Icons.Calendar className="h-3 w-3" />
                    <span>{formatDeadline(project.deadline)}</span>
                    {isPastDeadline && <span className="ml-0.5">!</span>}
                  </Badge>
                )}
                {sourceProjectId && (
                  <Badge variant="success" size="sm">
                    <Icons.Share2 className="h-3 w-3" />
                    <span>Sincronizzato</span>
                  </Badge>
                )}
              </div>
            )}

            {sharedWorkspaceChrome ? (
              <div className="flex items-center gap-2.5">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10 dark:bg-white/[0.08]">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${accentColor.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                  />
                </div>
                <span className={`shrink-0 text-xs font-bold tabular-nums ${accentColor.text}`}>
                  {percentage}%
                </span>
              </div>
            ) : (
              <div className="min-w-[100px] flex-1 sm:max-w-[180px]">
                <ProgressBar value={percentage} max={100} size="sm" showLabel color={accent} />
              </div>
            )}
          </div>

          <div className={`flex shrink-0 items-center gap-2 ${sharedWorkspaceChrome ? 'ml-auto pl-4' : 'pl-2'}`}>
            {showExplicitProjectDelete && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(project.id);
                }}
                className={`rounded-xl border border-transparent p-2 text-zinc-400 transition-all hover:border-rose-500/15 hover:bg-rose-500/10 hover:text-rose-500 dark:text-zinc-500 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 ${sharedWorkspaceChrome ? 'opacity-100 sm:pointer-events-none sm:opacity-0 sm:group-hover/header:pointer-events-auto sm:group-hover/header:opacity-100' : ''}`}
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
            PROJECT_CARD_STYLES.taskList.base
          }
        >
          {renderTasks()}
        </div>
      </motion.div>
    </Card>
  );
}

/**
 * Compact Project Card for limited spaces - clean unified style
 */
export function CompactProjectCard({
  project,
  percentage,
  accent = 'indigo',
  onClick,
  onTitleChange,
  onDelete,
  onDeadlineClick,
  projectDeadlineEditing,
  projectDeadlineInput,
  setProjectDeadlineInput,
  setProjectDeadlineEditing,
  getDeadlineColorClass,
  formatDeadline,
}) {
  const accentColor = getAccentColor(accent);
  const pct = Math.min(100, Math.max(0, Math.round(percentage)));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(project.title);

  const isPastDeadline = getDeadlinePastLabel?.(project.deadline);
  const menuItems = [
    {
      label: project.deadline ? 'Modifica scadenza' : 'Aggiungi scadenza',
      icon: <Icons.Calendar className="h-3.5 w-3.5" />,
      onClick: () => { setProjectDeadlineInput?.(project.deadline || ''); setProjectDeadlineEditing?.(project.id); }
    },
    'divider',
    { label: 'Elimina progetto', icon: <Icons.X className="h-3.5 w-3.5" />, danger: true, onClick: () => onDelete?.(project.id) }
  ];

  return (
    <div className="group relative w-full rounded-2xl border border-zinc-200/70 px-3 py-2 shadow-sm transition-all duration-200 hover:border-zinc-300 hover:shadow-md dark:border-white/[0.08] dark:bg-[#0b0e14]/70 dark:hover:border-white/[0.10]">
      <div className="flex items-center gap-3">
        <div className={`h-8 w-1 shrink-0 rounded-full bg-gradient-to-b ${accentColor.bar}`} />
        <div className="min-w-0 flex-1">
          {projectDeadlineEditing === project.id ? (
            <input
              type="text"
              value={projectDeadlineInput}
              onChange={(e) => setProjectDeadlineInput(e.target.value)}
              onBlur={() => { onDeadlineClick?.(projectDeadlineInput); setProjectDeadlineEditing(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { onDeadlineClick?.(projectDeadlineInput); setProjectDeadlineEditing(null); } if (e.key === 'Escape') setProjectDeadlineEditing(null); }}
              autoFocus
              className="w-full bg-transparent text-sm font-semibold leading-relaxed text-zinc-900 dark:text-zinc-100 outline-none"
            />
          ) : (
            <p
              className="text-sm font-semibold leading-relaxed text-zinc-900 dark:text-zinc-100 line-clamp-1 cursor-pointer"
              onClick={onClick}
            >
              {project.title}
            </p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/[0.06]">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${accentColor.bar} transition-[width] duration-500 ease-out`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`shrink-0 text-[10px] font-semibold tabular-nums ${accentColor.text}`}>{pct}%</span>
          </div>
        </div>
        <KebabMenu
          items={menuItems}
          isOpen={isMenuOpen}
          setIsOpen={setIsMenuOpen}
        />
      </div>
    </div>
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
