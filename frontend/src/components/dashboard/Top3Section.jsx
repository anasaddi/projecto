import React from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';

export function Top3Section({
  top3Resolved,
  top3DoneCount,
  reorderTop3,
  setTop3SlotAtIndex,
  toggleTop3Slot,
  removeFromTop3
}) {
  return (
    <div className="dashboard-panel flex flex-col shrink-0 overflow-hidden px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="flex items-center gap-2 dashboard-section-title text-amber-500 dark:text-amber-400">
          <Icons.Target className="w-3.5 h-3.5" /> Top 3 Focus
        </h3>
        <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">{top3DoneCount}/3</span>
      </div>

      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((idx) => {
          const slot = top3Resolved[idx];
          const filled = slot && !slot.missing;
          const isDone = slot?.done;

          return (
            <div
              key={idx}
              data-slot-index={idx}
              draggable={filled}
              onDragStart={filled ? (e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'top3', fromIndex: idx })); e.dataTransfer.effectAllowed = 'move'; } : undefined}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-amber-400'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('border-amber-400')}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-amber-400');
                const toIndex = Number(e.currentTarget.dataset.slotIndex);
                try {
                  const raw = e.dataTransfer.getData('application/json');
                  if (!raw) return;
                  const payload = JSON.parse(raw);
                  if (payload.type === 'top3') reorderTop3(payload.fromIndex, toIndex);
                  else if (payload.type === 'project' && payload.projectId && payload.taskId) setTop3SlotAtIndex(toIndex, { projectId: payload.projectId, taskId: payload.taskId });
                  else if (payload.type === 'quick' && payload.quickTaskId) setTop3SlotAtIndex(toIndex, { quickTaskId: payload.quickTaskId });
                } catch (_) { }
              }}
              className={`relative overflow-hidden min-h-[3.25rem] rounded-xl border flex items-center transition-all duration-150 ${filled ? 'border-zinc-200 dark:border-white/[0.06] dark:hover:border-white/[0.1] bg-zinc-50/50 dark:bg-white/[0.02] cursor-grab active:cursor-grabbing' : 'border-dashed border-zinc-200 dark:border-white/[0.06] bg-transparent'}`}
            >
              <span className="absolute -right-2 -bottom-3 text-[4rem] font-black text-zinc-200 dark:text-white/[0.04] pointer-events-none select-none leading-none z-0">{idx + 1}</span>
              {filled ? (
                <>
                  <div onClick={() => toggleTop3Slot(slot)} className="relative z-10 flex items-center gap-3 pl-4 w-full cursor-pointer">
                    <div onClick={(e) => e.stopPropagation()}>
                      <TaskCheckbox done={isDone} onClick={() => toggleTop3Slot(slot)} />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className={`text-sm font-semibold truncate transition-colors duration-150 ${isDone ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-100'}`}>{slot.title}</span>
                      {slot.projectTitle && <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 truncate">{slot.projectTitle}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={(e) => { e.stopPropagation(); removeFromTop3(idx); }} className="relative z-10 p-3 text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-150">
                    <Icons.X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <span className="relative z-10 pl-4 text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Trascina qui</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
