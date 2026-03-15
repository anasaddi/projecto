import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';

export function LifeGoalCard({
  goal, accent, stats, percentage,
  onToggle, onDelete, onRename, onDeadline,
  onDeadlineClick, deadlineEditing, deadlineInput, setDeadlineInput, setDeadlineEditing,
  getDeadlineColorClass, formatDeadline, renderTasks, onAddToTop3, hasFreeTop3Slot,
  onPromoteProject, onPromoteQuick, isLinkedToProject, isLinkedToQuick
}) {
  const accentBar = { emerald: 'bg-emerald-500', sky: 'bg-sky-500', violet: 'bg-indigo-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[accent] || 'bg-indigo-500';
  const accentText = { emerald: 'text-emerald-600', sky: 'text-sky-600', violet: 'text-indigo-600', amber: 'text-amber-600', rose: 'text-rose-600' }[accent] || 'text-indigo-600';
  const [showTasks, setShowTasks] = useState(false);
  const isProject = goal.type === 'project';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lifeGoal', goalId: goal.id }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className={`group/goal relative flex flex-col rounded-2xl border border-zinc-200/60 bg-white shadow-sm transition-all hover:shadow-md hover:border-zinc-300 dark:border-white/[0.06] dark:bg-[#161920]/50 ${deadlineEditing === goal.id ? 'z-30' : 'z-auto'}`}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-2.5">
          <button
            onClick={() => onToggle(goal.id, !goal.done)}
            className={`mt-0.5 shrink-0 rounded-lg p-1.5 transition-all ${
              goal.done 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                : 'bg-zinc-100 text-transparent hover:bg-zinc-200 dark:bg-white/5 dark:hover:bg-white/10'
            }`}
          >
            <Icons.CheckCircle className="h-3.5 w-3.5" />
          </button>

          <div className="flex-1 min-w-0 pr-1">
            <input
              value={goal.title}
              onChange={(e) => onRename(goal.id, e.target.value)}
              className={`w-full bg-transparent text-[13px] font-bold outline-none leading-snug ${
                goal.done ? 'text-zinc-400 line-through' : 'text-zinc-800 dark:text-zinc-100'
              }`}
            />
            
            {isProject && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className={`h-full ${accentBar} rounded-full`} 
                  />
                </div>
                <span className="text-[10px] font-black text-zinc-400 tabular-nums">{percentage}%</span>
              </div>
            )}

            {!isProject && goal.deadline && (
               <div className="mt-1">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${getDeadlineColorClass(goal.deadline, goal.done)} px-1.5 py-0.5 rounded-md`}>
                    {formatDeadline(goal.deadline)}
                  </span>
               </div>
            )}
          </div>
        </div>

        {/* Action bar - more compact and elegant */}
        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-white/[0.04]">
          <div className="flex items-center gap-1.5">
            {isProject ? (
              <button 
                onClick={() => onPromoteProject(goal.id)} 
                className={`p-1.5 rounded-lg transition-colors ${isLinkedToProject ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'text-zinc-400 hover:text-indigo-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                title="Sincronizza con Progetti"
              >
                <Icons.Target className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button 
                onClick={() => onPromoteQuick(goal.id)} 
                className={`p-1.5 rounded-lg transition-colors ${isLinkedToQuick ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10' : 'text-zinc-400 hover:text-rose-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
                title="Sincronizza con Quick Tasks"
              >
                <Icons.Zap className="h-3.5 w-3.5" />
              </button>
            )}

            {isProject && (
              <button 
                onClick={() => setShowTasks(!showTasks)} 
                className={`p-1.5 rounded-lg transition-colors ${showTasks ? 'text-zinc-800 bg-zinc-100 dark:bg-white/10 dark:text-white' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
              >
                <Icons.ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showTasks ? 'rotate-180' : ''}`} />
              </button>
            )}

            {hasFreeTop3Slot && !goal.done && (
              <button onClick={() => onAddToTop3(goal.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors" title="Pin to Focus">
                <Icons.Target className="h-3.5 w-3.5" />
              </button>
            )}
            
            <button 
              onClick={() => { setDeadlineInput(goal.deadline || ''); setDeadlineEditing(goal.id); }} 
              className={`p-1.5 rounded-lg transition-colors ${goal.deadline ? 'text-amber-500 bg-amber-50 dark:bg-amber-500/10' : 'text-zinc-400 hover:text-amber-500 hover:bg-zinc-50 dark:hover:bg-white/5'}`}
              title="Scadenza"
            >
              <Icons.Calendar className="h-3.5 w-3.5" />
            </button>
          </div>

          <button onClick={() => onDelete(goal.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <Icons.X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {deadlineEditing === goal.id && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-white p-3 rounded-b-2xl border-t shadow-2xl dark:bg-zinc-800 dark:border-white/10 animate-slide-up">
           <input
              type="date"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              onBlur={() => onDeadlineClick(goal.id, deadlineInput)}
              onKeyDown={(e) => { if (e.key === 'Enter') onDeadlineClick(goal.id, deadlineInput); if (e.key === 'Escape') setDeadlineEditing(null); }}
              autoFocus
              className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-lg p-2 text-xs outline-none"
            />
        </div>
      )}

      {isProject && showTasks && (
        <div className="border-t border-zinc-100 bg-zinc-50/50 p-3 dark:border-white/[0.04] dark:bg-black/20 rounded-b-2xl">
          <div className="flex flex-col gap-1">
            {renderTasks()}
          </div>
        </div>
      )}
    </div>
  );
}
