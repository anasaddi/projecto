import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { Badge, ProgressBar, ActionButton } from './Card';
import { useLongPressActions } from '../../hooks/useLongPressActions';

export function LifeGoalCard({
  goal, accent, stats, percentage,
  onToggle, onDelete, onRename, onDeadline,
  onDeadlineClick, deadlineEditing, deadlineInput, setDeadlineInput, setDeadlineEditing,
  getDeadlineColorClass, formatDeadline, renderTasks, onToggleTop3, isInTop3, hasFreeTop3Slot,
  onPromoteProject, onPromoteQuick, isLinkedToProject, isLinkedToQuick,
  compact = false,
}) {
  const accentBar = { emerald: 'bg-emerald-500', sky: 'bg-sky-500', violet: 'bg-indigo-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[accent] || 'bg-indigo-500';
  const accentGradient = {
    emerald: 'from-emerald-500 to-teal-500',
    sky: 'from-sky-500 to-cyan-500',
    violet: 'from-violet-500 to-purple-500',
    amber: 'from-amber-500 to-orange-500',
    rose: 'from-rose-500 to-pink-500',
  }[accent] || 'from-indigo-500 to-violet-500';
  const accentText = {
    emerald: 'text-emerald-600 dark:text-emerald-400',
    sky: 'text-sky-600 dark:text-sky-400',
    violet: 'text-violet-600 dark:text-violet-400',
    amber: 'text-amber-600 dark:text-amber-400',
    rose: 'text-rose-600 dark:text-rose-400',
  }[accent] || 'text-indigo-600 dark:text-indigo-400';
  const [showTasks, setShowTasks] = useState(false);
  const isProject = goal.type === 'project';

  if (compact && !isProject) {
    const compactActions = [
      { icon: <Icons.Zap className="h-2.5 w-2.5" />, onClick: () => onPromoteQuick(goal.id), title: isLinkedToQuick ? 'Rimuovi da Quick Tasks' : 'Sincronizza con Quick Tasks', className: isLinkedToQuick ? 'text-rose-500 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/30 dark:ring-1 dark:ring-rose-400/50' : '' },
      ...(!isProject && (isInTop3 || (hasFreeTop3Slot && !goal.done)) ? [{ icon: <Icons.Target className="h-2.5 w-2.5" />, onClick: () => onToggleTop3(goal.id), title: isInTop3 ? 'Rimuovi dai Top 3' : 'Top 3', className: isInTop3 ? 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : '' }] : []),
      { icon: <Icons.Calendar className="h-2.5 w-2.5" />, onClick: () => { setDeadlineInput(goal.deadline || ''); setDeadlineEditing(goal.id); }, title: 'Scadenza', className: goal.deadline ? 'text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : '' },
      { icon: <Icons.X className="h-2.5 w-2.5" />, onClick: () => onDelete(goal.id), title: 'Elimina', className: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' },
    ];
    const { active: lgActive, barRef: lgBarRef, zoneProps: lgZoneProps, getActionProps: lgGetActionProps, handledByPointerUpRef: lgHandledRef } = useLongPressActions({ actions: compactActions });

    const titleRef = useRef(null);
    useEffect(() => {
      const t = titleRef.current;
      if (!t) return;
      t.style.height = 'auto';
      t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
    }, [goal.title]);

    return (
      <div className="relative">
        <div
          draggable
          {...lgZoneProps}
          onDragStart={(e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lifeGoal', goalId: goal.id }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          className={`group/goal flex items-start gap-2 rounded-2xl border border-zinc-200/70 bg-white/[0.9] px-3 py-2 shadow-sm shadow-zinc-200/35 transition-all hover:border-zinc-300 hover:shadow-md dark:border-white/[0.08] dark:bg-[#141922]/80 min-h-[2.5rem] ${deadlineEditing === goal.id ? 'z-30' : 'z-auto'}`}
        >
          <button type="button" onClick={() => onToggle(goal.id, !goal.done)} className={`shrink-0 mt-0.5 rounded-xl p-1 transition-all ${goal.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-100 text-transparent hover:bg-zinc-200 dark:bg-white/5'}`}>
            <Icons.CheckCircle className="h-2.5 w-2.5" />
          </button>
          <textarea
            ref={titleRef}
            value={goal.title}
            onChange={(e) => onRename(goal.id, e.target.value)}
            rows={2}
            className={`min-w-0 flex-1 resize-none overflow-y-auto bg-transparent py-0 text-[12px] font-medium leading-relaxed outline-none break-words [overflow-wrap:anywhere] min-h-[2rem] max-h-[120px] ${goal.done ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}
            onInput={(e) => { const t = e.target; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 120)}px`; }}
          />
          {goal.deadline && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold ${getDeadlineColorClass(goal.deadline, goal.done)}`}>{formatDeadline(goal.deadline)}</span>
          )}
          <div ref={lgBarRef} className={`flex shrink-0 items-start gap-0.5 pt-0.5 transition-opacity touch-manipulation ${lgActive ? 'opacity-100' : 'opacity-0 group-hover/goal:opacity-100'}`}>
            {compactActions.map((act, i) => {
              const ap = lgGetActionProps(i);
              return (
                <button key={i} data-action-idx={i} type="button" onClick={(e) => { if (lgHandledRef.current) { e.preventDefault(); return; } e.stopPropagation(); act.onClick(e); }} title={act.title} aria-label={act.title} className={`dashboard-action-btn p-1 rounded-xl ${act.className || ''} ${ap.className || ''}`}>
                  {act.icon}
                </button>
              );
            })}
          </div>
        </div>
        {deadlineEditing === goal.id && (
          <div className="absolute left-0 right-0 top-full mt-1 z-20 bg-white dark:bg-zinc-800 p-2 rounded-lg border shadow-lg dark:border-white/10">
            <input type="date" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} onBlur={() => onDeadlineClick(goal.id, deadlineInput)} onKeyDown={(e) => { if (e.key === 'Enter') onDeadlineClick(goal.id, deadlineInput); if (e.key === 'Escape') setDeadlineEditing(null); }} autoFocus className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[11px] outline-none" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lifeGoal', goalId: goal.id }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group/goal relative flex flex-col overflow-hidden rounded-[28px] border border-zinc-200/70 bg-white/[0.92] shadow-[0_22px_50px_-34px_rgba(15,23,42,0.22)] transition-all hover:border-zinc-300 hover:shadow-[0_26px_60px_-36px_rgba(79,70,229,0.22)] dark:border-white/[0.08] dark:bg-[#141922]/88 dark:shadow-[0_30px_60px_-38px_rgba(0,0,0,0.55)] ${deadlineEditing === goal.id ? 'z-30' : 'z-auto'}`}
    >
      <div className="flex items-start gap-3 p-5">
        <div className={`mt-0.5 h-12 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${accentGradient}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <textarea
              value={goal.title}
              onChange={(e) => onRename(goal.id, e.target.value)}
              rows={1}
              className={`min-h-[1.5rem] w-full resize-none overflow-hidden bg-transparent py-0.5 text-[15px] font-semibold leading-snug tracking-tight outline-none ${
                goal.done ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-50'
              }`}
              style={{ minHeight: '1.5rem' }}
              onInput={(e) => { const t = e.target; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 96)}px`; }}
            />

            <div className="flex shrink-0 items-center gap-1 pl-2">
              <ActionButton size="sm" onClick={() => onPromoteProject(goal.id)} className={isLinkedToProject ? 'text-indigo-500 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/30 dark:ring-1 dark:ring-indigo-400/50' : ''} title={isLinkedToProject ? 'Rimuovi da Progetti' : 'Sincronizza con Progetti'}>
                <Icons.Target className="h-3 w-3" />
              </ActionButton>
              <ActionButton size="sm" onClick={() => setShowTasks(!showTasks)} className={showTasks ? 'text-zinc-800 bg-zinc-100 dark:text-zinc-100 dark:bg-indigo-500/30 dark:ring-1 dark:ring-indigo-400/50' : ''} title={showTasks ? 'Chiudi task' : 'Apri task'}>
                <Icons.ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showTasks ? 'rotate-180' : ''}`} />
              </ActionButton>
              <ActionButton size="sm" onClick={() => { setDeadlineInput(goal.deadline || ''); setDeadlineEditing(goal.id); }} className={goal.deadline ? 'text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : ''} title="Scadenza">
                <Icons.Calendar className="h-3 w-3" />
              </ActionButton>
              <ActionButton size="sm" danger onClick={() => onDelete(goal.id)} title="Elimina">
                <Icons.X className="h-3 w-3" />
              </ActionButton>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="default" size="sm">
              <span className={accentText}>Life Goal</span>
            </Badge>
            <Badge variant={percentage === 100 && stats?.total > 0 ? 'success' : 'primary'} size="sm">
              {stats?.done ?? 0}/{stats?.total ?? 0} task
            </Badge>
            {goal.deadline && (
              <Badge variant={goal.done ? 'default' : 'warning'} size="sm">
                <Icons.Calendar className="h-3 w-3" />
                <span>{formatDeadline(goal.deadline)}</span>
              </Badge>
            )}
            <div className="min-w-[120px] flex-1 sm:max-w-[220px]">
              <ProgressBar value={percentage} max={100} size="sm" showLabel color={accent === 'violet' ? 'violet' : accent} />
            </div>
          </div>
        </div>
      </div>

      {deadlineEditing === goal.id && (
        <div className="absolute inset-x-0 bottom-0 z-20 rounded-b-[28px] border-t bg-white p-3 shadow-xl dark:border-white/10 dark:bg-zinc-800">
          <input type="date" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} onBlur={() => onDeadlineClick(goal.id, deadlineInput)} onKeyDown={(e) => { if (e.key === 'Enter') onDeadlineClick(goal.id, deadlineInput); if (e.key === 'Escape') setDeadlineEditing(null); }} autoFocus className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[11px] outline-none" />
        </div>
      )}

      {isProject && showTasks && (
        <div className="rounded-b-[28px] border-t border-zinc-100 bg-zinc-50/70 p-4 dark:border-white/[0.04] dark:bg-black/20">
          <div className="flex flex-col gap-1">
            {renderTasks()}
          </div>
        </div>
      )}
    </div>
  );
}
