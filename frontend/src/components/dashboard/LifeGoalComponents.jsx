import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { Badge, ProgressBar, ActionButton } from './Card';
import { KebabMenu } from './DashboardComponents';
import { useLongPressActions } from '../../hooks/useLongPressActions';
import { PROJECT_CARD_STYLES, getAccentColor } from './ProjectCardStyles';
import { setDragPayload } from '../../utils/dragPayload';

export function LifeGoalCard({
  goal, accent, stats, percentage,
  onToggle, onDelete, onRename, onDeadline,
  onDeadlineClick, deadlineEditing, deadlineInput, setDeadlineInput, setDeadlineEditing,
  getDeadlineColorClass, formatDeadline, renderTasks, onToggleTop3, isInTop3, hasFreeTop3Slot,
  onPromoteProject, onPromoteQuick, isLinkedToProject, isLinkedToQuick,
  compact = false,
}) {
  const accentColor = getAccentColor(accent);
  const accentBar = accentColor.bar.replace('from-', 'bg-').split(' ')[0];
  const accentGradient = accentColor.bar;
  const accentText = accentColor.text;
  const [showTasks, setShowTasks] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingExpanded, setIsEditingExpanded] = useState(false);
  const isProject = goal.type === 'project';

  if (compact && !isProject) {
    const compactActions = [
      { icon: <Icons.Zap className="h-2.5 w-2.5" />, onClick: () => onPromoteQuick(goal.id), title: isLinkedToQuick ? 'Rimuovi da Quick Tasks' : 'Sincronizza con Quick Tasks', className: isLinkedToQuick ? 'text-rose-500 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/30 dark:ring-1 dark:ring-rose-400/50' : '' },
      ...(!isProject && (isInTop3 || (hasFreeTop3Slot && !goal.done)) ? [{ icon: <Icons.Target className="h-2.5 w-2.5" />, onClick: () => onToggleTop3(goal.id), title: isInTop3 ? 'Rimuovi dai Top 3' : 'Top 3', className: isInTop3 ? 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : '' }] : []),
      { icon: <Icons.Calendar className="h-2.5 w-2.5" />, onClick: () => { setDeadlineInput(goal.deadline || ''); setDeadlineEditing(goal.id); }, title: 'Scadenza', className: goal.deadline ? 'text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : '' },
      { icon: <Icons.X className="h-2.5 w-2.5" />, onClick: () => onDelete(goal.id), title: 'Elimina', className: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' },
    ];
    const kebabItems = [
      {
        label: isLinkedToQuick ? 'Rimuovi da Quick Tasks' : 'Sincronizza con Quick Tasks',
        icon: <Icons.Zap className="h-3.5 w-3.5" />,
        onClick: () => onPromoteQuick(goal.id),
      },
      ...(!isProject && (isInTop3 || (hasFreeTop3Slot && !goal.done))
        ? [{ label: isInTop3 ? 'Rimuovi dai Top 3' : 'Top 3', icon: <Icons.Target className="h-3.5 w-3.5" />, onClick: () => onToggleTop3(goal.id) }]
        : []),
      'divider',
      {
        label: 'Scadenza',
        icon: <Icons.Calendar className="h-3.5 w-3.5" />,
        onClick: () => { setDeadlineInput(goal.deadline || ''); setDeadlineEditing(goal.id); },
      },
      {
        label: 'Elimina',
        icon: <Icons.X className="h-3.5 w-3.5" />,
        danger: true,
        onClick: () => onDelete(goal.id),
      },
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
      <div
        draggable
        {...lgZoneProps}
        onDragStart={(e) => {
          setDragPayload(e.dataTransfer, { type: 'lifeGoal', goalId: goal.id });
        }}
        className={`group/goal relative flex items-center gap-3 overflow-hidden rounded-2xl border border-zinc-200/70 bg-white px-3 py-2 shadow-sm transition-all hover:border-zinc-300 hover:shadow-md dark:border-white/[0.08] dark:bg-[#0b0e14]/70 ${deadlineEditing === goal.id ? 'z-30' : 'z-auto'}`}
      >
        <div className={`h-8 w-1 shrink-0 rounded-full bg-gradient-to-b ${accentGradient}`} />
        
        <button type="button" onClick={() => onToggle(goal.id, !goal.done)} className={`shrink-0 rounded-lg p-1 transition-all ${goal.done ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-100 text-transparent hover:bg-zinc-200 dark:bg-white/5'}`}>
          <Icons.CheckCircle className="h-3 w-3" />
        </button>

        {isEditing ? (
          <textarea
            ref={titleRef}
            defaultValue={goal.title}
            rows={1}
            autoFocus
            onBlur={(e) => { 
              const v = e.target.value.trim();
              if (v && v !== goal.title) onRename?.(goal.id, v); 
              setIsEditing(false); 
            }}
            onKeyDown={(e) => { 
              if (e.key === 'Enter' && !e.shiftKey) { 
                e.preventDefault(); 
                const v = e.currentTarget.value.trim();
                if (v && v !== goal.title) onRename?.(goal.id, v); 
                setIsEditing(false); 
              } 
              if (e.key === 'Escape') setIsEditing(false); 
            }}
            className={`min-w-0 flex-1 resize-none overflow-hidden bg-transparent py-0 text-sm font-semibold leading-relaxed outline-none break-words ${goal.done ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}
            onInput={(e) => { const t = e.target; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 80)}px`; }}
          />
        ) : (
          <div
            className={`min-w-0 flex-1 text-sm font-semibold leading-relaxed cursor-pointer overflow-hidden text-ellipsis ${goal.done ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-200'}`}
            title={goal.title}
            onDoubleClick={() => setIsEditing(true)}
          >
            {goal.title}
          </div>
        )}

        {goal.deadline && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${getDeadlineColorClass(goal.deadline, goal.done)}`}>{formatDeadline(goal.deadline)}</span>
        )}

        <div ref={lgBarRef} className={`hidden shrink-0 items-center gap-0.5 transition-opacity touch-manipulation md:flex ${lgActive ? 'opacity-100' : 'opacity-0 group-hover/goal:opacity-100'}`}>
          {compactActions.map((act, i) => {
            const ap = lgGetActionProps(i);
            return (
              <button key={i} data-action-idx={i} type="button" onClick={(e) => { if (lgHandledRef.current) { e.preventDefault(); return; } e.stopPropagation(); act.onClick(e); }} title={act.title} aria-label={act.title} className={`p-1 rounded-lg transition-colors ${act.className || ''} ${ap.className || ''}`}>
                <div className="scale-90">{act.icon}</div>
              </button>
            );
          })}
        </div>

        <div className="ml-auto md:hidden">
          <KebabMenu items={kebabItems} alwaysVisible />
        </div>

        {deadlineEditing === goal.id && (
          <div className="absolute inset-x-0 bottom-0 z-20 bg-white dark:bg-zinc-800 p-2 border-t shadow-lg dark:border-white/10 animate-in slide-in-from-bottom-1">
            <input type="date" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} onBlur={() => onDeadlineClick(goal.id, deadlineInput)} onKeyDown={(e) => { if (e.key === 'Enter') onDeadlineClick(goal.id, deadlineInput); if (e.key === 'Escape') setDeadlineEditing(null); }} autoFocus className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs outline-none" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => {
        setDragPayload(e.dataTransfer, { type: 'lifeGoal', goalId: goal.id });
      }}
      className={`group/goal relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200/70 bg-white shadow-sm transition-all hover:border-zinc-300 hover:shadow-[0_26px_60px_-36px_rgba(79,70,229,0.22)] dark:border-white/[0.08] dark:bg-[#0b0e14]/70 dark:shadow-none ${deadlineEditing === goal.id ? 'z-30' : 'z-auto'}`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`mt-0.5 h-12 w-1.5 shrink-0 rounded-full bg-gradient-to-b ${accentGradient}`} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            {isEditingExpanded ? (
              <textarea
                defaultValue={goal.title}
                rows={1}
                autoFocus
                onBlur={(e) => { 
                  const v = e.target.value.trim();
                  if (v && v !== goal.title) onRename?.(goal.id, v); 
                  setIsEditingExpanded(false); 
                }}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    const v = e.currentTarget.value.trim();
                    if (v && v !== goal.title) onRename?.(goal.id, v); 
                    setIsEditingExpanded(false); 
                  } 
                  if (e.key === 'Escape') setIsEditingExpanded(false); 
                }}
                className={`min-h-[1.5rem] w-full resize-none overflow-hidden bg-transparent py-0.5 text-sm font-semibold leading-snug tracking-tight outline-none break-words ${
                  goal.done ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-50'
                }`}
                style={{ minHeight: '1.5rem' }}
                onInput={(e) => { const t = e.target; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 96)}px`; }}
              />
            ) : (
              <div
                className={`min-h-[1.5rem] w-full text-sm font-semibold leading-snug tracking-tight cursor-pointer overflow-hidden text-ellipsis ${
                  goal.done ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-50'
                }`}
                title={goal.title}
                onDoubleClick={() => setIsEditingExpanded(true)}
              >
                {goal.title}
              </div>
            )}

            <div className="flex shrink-0 items-center gap-1 pl-2">
              <ActionButton size="sm" onClick={() => onPromoteProject?.(goal.id)} className={isLinkedToProject ? 'text-indigo-500 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/30 dark:ring-1 dark:ring-indigo-400/50' : ''} title={isLinkedToProject ? 'Rimuovi da Progetti' : 'Sincronizza con Progetti'}>
                <Icons.Target className="h-3 w-3" />
              </ActionButton>
              <ActionButton size="sm" onClick={() => setShowTasks(!showTasks)} className={showTasks ? 'text-zinc-800 bg-zinc-100 dark:text-zinc-100 dark:bg-indigo-500/30 dark:ring-1 dark:ring-indigo-400/50' : ''} title={showTasks ? 'Chiudi task' : 'Apri task'}>
                <Icons.ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showTasks ? 'rotate-180' : ''}`} />
              </ActionButton>
              <ActionButton size="sm" onClick={() => { setDeadlineInput(goal.deadline || ''); setDeadlineEditing(goal.id); }} className={goal.deadline ? 'text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : ''} title="Scadenza">
                <Icons.Calendar className="h-3 w-3" />
              </ActionButton>
              <ActionButton size="sm" danger onClick={() => onDelete?.(goal.id)} title="Elimina">
                <Icons.X className="h-3 w-3" />
              </ActionButton>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="default" size="sm">
              <span className={accentText}>Life Goal</span>
            </Badge>
            <Badge variant={percentage === 100 && stats?.total > 0 ? 'success' : 'primary'} size="sm">
              {stats?.completed ?? stats?.done ?? 0}/{stats?.total ?? 0} task
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
          <input type="date" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} onBlur={() => onDeadlineClick(goal.id, deadlineInput)} onKeyDown={(e) => { if (e.key === 'Enter') onDeadlineClick(goal.id, deadlineInput); if (e.key === 'Escape') setDeadlineEditing(null); }} autoFocus className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-xs outline-none" />
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
