import React, { useState } from 'react';
import { Icons } from './Icons';

export function LifeGoalCard({
  goal, accent, stats, percentage,
  onToggle, onDelete, onRename, onDeadline,
  onDeadlineClick, deadlineEditing, deadlineInput, setDeadlineInput, setDeadlineEditing,
  getDeadlineColorClass, formatDeadline, renderTasks, onAddToTop3, hasFreeTop3Slot,
  onPromoteProject, onPromoteQuick, isLinkedToProject, isLinkedToQuick
}) {
  const accentBar = { emerald: 'bg-emerald-500', sky: 'bg-sky-500', violet: 'bg-violet-500', amber: 'bg-amber-500', rose: 'bg-rose-500' }[accent] || 'bg-indigo-500';
  const accentText = { emerald: 'text-emerald-600', sky: 'text-sky-600', violet: 'text-violet-600', amber: 'text-amber-600', rose: 'text-rose-600' }[accent] || 'text-indigo-600';
  const accentBg = { emerald: 'bg-emerald-500/10', sky: 'bg-sky-500/10', violet: 'bg-violet-500/10', amber: 'bg-amber-500/10', rose: 'bg-rose-500/10' }[accent] || 'bg-indigo-500/10';
  const [showTasks, setShowTasks] = useState(false);
  const isProject = goal.type === 'project';

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'lifeGoal', goalId: goal.id }));
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="group/goal relative flex flex-col rounded-xl border border-gray-200 bg-white transition-all hover:shadow-md dark:border-white/10 dark:bg-white/[0.03]"
    >
      {/* Accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${accentBar}`} />

      <div className="flex items-center gap-2 pl-3 pr-2 py-2 cursor-grab active:cursor-grabbing">
        {/* Checkbox */}
        <button
          onClick={() => onToggle(goal.id, !goal.done)}
          className={`shrink-0 rounded p-0.5 transition-colors ${goal.done ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-transparent hover:bg-gray-300 dark:bg-gray-700'}`}
        >
          <Icons.CheckCircle className="h-3.5 w-3.5" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <input
            value={goal.title}
            onChange={(e) => onRename(goal.id, e.target.value)}
            className={`w-full bg-transparent text-xs font-medium outline-none ${goal.done ? 'text-gray-400 line-through' : 'text-gray-800 dark:text-gray-200'}`}
          />
          {isProject && (
            <div className="mt-1 flex items-center gap-2">
              <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className={`h-full ${accentBar}`} style={{ width: `${percentage}%` }} />
              </div>
              <span className="text-[9px] text-gray-400">{percentage}%</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/goal:opacity-100 transition-opacity">
          {hasFreeTop3Slot && (
            <button onClick={() => onAddToTop3(goal.id)} className="rounded p-1 text-gray-400 hover:text-amber-500" title="Top 3">
              <Icons.Target className="h-3 w-3" />
            </button>
          )}

          {isProject ? (
            <button onClick={() => onPromoteProject(goal.id)} className={`rounded p-1 ${isLinkedToProject ? 'text-sky-500' : 'text-gray-400 hover:text-sky-500'}`} title="Projects">
              <Icons.Play className="h-3 w-3" />
            </button>
          ) : (
            <button onClick={() => onPromoteQuick(goal.id)} className={`rounded p-1 ${isLinkedToQuick ? 'text-rose-500' : 'text-gray-400 hover:text-rose-500'}`} title="Quick">
              <Icons.Play className="h-3 w-3" />
            </button>
          )}

          {isProject && (
            <button onClick={() => setShowTasks(!showTasks)} className={`rounded p-1 ${showTasks ? accentText : 'text-gray-400'}`}>
              <Icons.ChevronDown className={`h-3 w-3 transition-transform ${showTasks ? 'rotate-180' : ''}`} />
            </button>
          )}

          {deadlineEditing === goal.id ? (
            <input
              type="date"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              onBlur={() => onDeadlineClick(goal.id, deadlineInput)}
              autoFocus
              className="w-20 text-[9px]"
            />
          ) : goal.deadline ? (
            <button onClick={() => { setDeadlineInput(goal.deadline); setDeadlineEditing(goal.id); }} className={`rounded px-1.5 py-0.5 text-[8px] ${getDeadlineColorClass(goal.deadline, false)}`}>
              {formatDeadline(goal.deadline)}
            </button>
          ) : (
            <button onClick={() => { setDeadlineInput(''); setDeadlineEditing(goal.id); }} className="rounded p-1 text-gray-400 hover:text-amber-500">
              <Icons.Calendar className="h-3 w-3" />
            </button>
          )}

          <button onClick={() => onDelete(goal.id)} className="rounded p-1 text-gray-400 hover:text-red-500">
            <Icons.X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Subtasks */}
      {isProject && showTasks && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-2 py-2 dark:border-white/5 dark:bg-black/20">
          <div className="flex flex-col gap-1">
            {renderTasks()}
          </div>
        </div>
      )}
    </div>
  );
}
