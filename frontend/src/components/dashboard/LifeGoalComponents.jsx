import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';

export function LifeGoalCard({
  goal, accent, stats, percentage,
  onToggle, onDelete, onRename, onDeadline,
  onDeadlineClick, deadlineEditing, deadlineInput, setDeadlineInput, setDeadlineEditing,
  getDeadlineColorClass, formatDeadline, renderTasks, onToggleTop3, isInTop3, hasFreeTop3Slot,
  onPromoteProject, onPromoteQuick, isLinkedToProject, isLinkedToQuick,
  compact = false,
}) {
  const accentBar = { emerald: 'bg-emerald-500', sky: 'bg-sky-500', violet: 'bg-indigo-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[accent] || 'bg-indigo-500';
  const [showTasks, setShowTasks] = useState(false);
  const isProject = goal.type === 'project';

  if (compact && !isProject) {
    return (
      <div className="relative">
        <div
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lifeGoal', goalId: goal.id }));
            e.dataTransfer.effectAllowed = 'move';
          }}
          className={`group/goal flex items-start gap-1.5 rounded-lg border border-zinc-200/60 bg-white shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-white/[0.06] dark:bg-[#161920]/50 px-2 py-1.5 ${deadlineEditing === goal.id ? 'z-30' : 'z-auto'}`}
        >
          <button type="button" onClick={() => onToggle(goal.id, !goal.done)} className={`shrink-0 mt-0.5 rounded p-0.5 transition-all ${goal.done ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-transparent hover:bg-zinc-200 dark:bg-white/5'}`}>
            <Icons.CheckCircle className="h-2.5 w-2.5" />
          </button>
          <textarea
            value={goal.title}
            onChange={(e) => onRename(goal.id, e.target.value)}
            rows={1}
            className={`flex-1 min-w-0 bg-transparent text-[11px] font-semibold outline-none leading-snug resize-none overflow-hidden break-words py-0 ${goal.done ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-100'}`}
            style={{ minHeight: '1.25rem' }}
            onInput={(e) => { const t = e.target; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 60)}px`; }}
          />
          {goal.deadline && (
            <span className={`shrink-0 text-[8px] font-bold uppercase ${getDeadlineColorClass(goal.deadline, goal.done)} px-1 py-0.5 rounded`}>{formatDeadline(goal.deadline)}</span>
          )}
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover/goal:opacity-100 transition-opacity">
            <button type="button" onClick={() => onPromoteQuick(goal.id)} className={`p-0.5 rounded ${isLinkedToQuick ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-zinc-400 hover:text-rose-500'}`} title={isLinkedToQuick ? 'Rimuovi da Quick Tasks' : 'Sincronizza con Quick Tasks'}><Icons.Zap className="h-2.5 w-2.5" /></button>
            {!isProject && (isInTop3 || (hasFreeTop3Slot && !goal.done)) && (
              <button type="button" onClick={() => onToggleTop3(goal.id)} className={`p-0.5 rounded transition-colors ${isInTop3 ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' : 'text-zinc-400 hover:text-amber-500'}`} title={isInTop3 ? 'Rimuovi dai Top 3' : 'Top 3'}><Icons.Target className="h-2.5 w-2.5" /></button>
            )}
            <button type="button" onClick={() => { setDeadlineInput(goal.deadline || ''); setDeadlineEditing(goal.id); }} className={`p-0.5 rounded ${goal.deadline ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'}`} title="Scadenza"><Icons.Calendar className="h-2.5 w-2.5" /></button>
            <button type="button" onClick={() => onDelete(goal.id)} className="p-0.5 rounded text-zinc-400 hover:text-red-500"><Icons.X className="h-2.5 w-2.5" /></button>
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
      className={`group/goal relative flex flex-col rounded-xl border border-zinc-200/60 bg-white shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-white/[0.06] dark:bg-[#161920]/50 ${deadlineEditing === goal.id ? 'z-30' : 'z-auto'}`}
    >
      <div className="p-2">
        <div className="flex items-start gap-1.5">
          <button
            onClick={() => onToggle(goal.id, !goal.done)}
            className={`mt-0.5 shrink-0 rounded p-0.5 transition-all ${
              goal.done 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-zinc-100 text-transparent hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10'
            }`}
          >
            <Icons.CheckCircle className="h-2.5 w-2.5" />
          </button>

          <div className="flex-1 min-w-0 pr-1 overflow-hidden">
            <textarea
              value={goal.title}
              onChange={(e) => onRename(goal.id, e.target.value)}
              rows={1}
              className={`w-full bg-transparent text-[11px] font-bold outline-none leading-snug resize-none overflow-hidden break-words py-0 ${
                goal.done ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-100'
              }`}
              style={{ minHeight: '1.25rem' }}
              onInput={(e) => { const t = e.target; t.style.height = 'auto'; t.style.height = `${Math.min(t.scrollHeight, 80)}px`; }}
            />
            
            {isProject && (
              <div className="mt-1 flex items-center gap-1">
                <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${accentBar} rounded-full`} 
                  />
                </div>
                <span className="text-[8px] font-black text-zinc-400 tabular-nums">{percentage}%</span>
              </div>
            )}

            {!isProject && goal.deadline && (
              <div className="mt-0.5">
                <span className={`text-[8px] font-black uppercase tracking-wider ${getDeadlineColorClass(goal.deadline, goal.done)} px-1 py-0.5 rounded`}>
                  {formatDeadline(goal.deadline)}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-1.5 flex items-center justify-between border-t border-zinc-100 pt-1.5 dark:border-white/[0.04]">
          <div className="flex items-center gap-0.5">
            {isProject ? (
              <button type="button" onClick={() => onPromoteProject(goal.id)} className={`p-0.5 rounded transition-colors ${isLinkedToProject ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-zinc-400 hover:text-indigo-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`} title={isLinkedToProject ? 'Rimuovi da Progetti' : 'Sincronizza con Progetti'}>
                <Icons.Target className="h-2.5 w-2.5" />
              </button>
            ) : (
              <button type="button" onClick={() => onPromoteQuick(goal.id)} className={`p-0.5 rounded transition-colors ${isLinkedToQuick ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-zinc-400 hover:text-rose-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`} title={isLinkedToQuick ? 'Rimuovi da Quick Tasks' : 'Sincronizza con Quick Tasks'}>
                <Icons.Zap className="h-2.5 w-2.5" />
              </button>
            )}
            {isProject && (
              <button type="button" onClick={() => setShowTasks(!showTasks)} className={`p-0.5 rounded transition-colors ${showTasks ? 'text-zinc-800 bg-zinc-100 dark:bg-white/10 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-white/5'}`}>
                <Icons.ChevronDown className={`h-2.5 w-2.5 transition-transform duration-200 ${showTasks ? 'rotate-180' : ''}`} />
              </button>
            )}
            {!isProject && (isInTop3 || (hasFreeTop3Slot && !goal.done)) && (
              <button type="button" onClick={() => onToggleTop3(goal.id)} className={`p-0.5 rounded transition-colors ${isInTop3 ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/40' : 'text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'}`} title={isInTop3 ? 'Rimuovi dai Top 3' : 'Pin to Focus'}>
                <Icons.Target className="h-2.5 w-2.5" />
              </button>
            )}
            <button type="button" onClick={() => { setDeadlineInput(goal.deadline || ''); setDeadlineEditing(goal.id); }} className={`p-0.5 rounded transition-colors ${goal.deadline ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`} title="Scadenza">
              <Icons.Calendar className="h-2.5 w-2.5" />
            </button>
          </div>
          <button type="button" onClick={() => onDelete(goal.id)} className="p-0.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Icons.X className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {deadlineEditing === goal.id && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-white p-2 rounded-b-xl border-t shadow-xl dark:bg-zinc-800 dark:border-white/10">
          <input type="date" value={deadlineInput} onChange={(e) => setDeadlineInput(e.target.value)} onBlur={() => onDeadlineClick(goal.id, deadlineInput)} onKeyDown={(e) => { if (e.key === 'Enter') onDeadlineClick(goal.id, deadlineInput); if (e.key === 'Escape') setDeadlineEditing(null); }} autoFocus className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded px-2 py-1 text-[11px] outline-none" />
        </div>
      )}

      {isProject && showTasks && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 p-1.5 dark:border-white/[0.04] dark:bg-black/20 rounded-b-xl">
          <div className="flex flex-col gap-0.5">
            {renderTasks()}
          </div>
        </div>
      )}
    </div>
  );
}
