import React, { useMemo, useState } from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { resolveTop3Slots, updateNodeInTree } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';

export function Top3Section() {
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const store = useDashboardStore();
  const {
    projects = [],
    top3Manual = [null, null, null],
    quickTasks = [],
    lifeGoals = { tiers: [] },
    sharedDashboards = [],
    reorderTop3,
    setTop3SlotAtIndex,
    removeFromTop3,
    toggleQuickTask,
    toggleProjectTask,
    updateSharedDashboardProject,
    toggleSharedQuickTask,
    updateGoal
  } = store ?? {};

  const allQuickTasks = useMemo(() => {
    const local = quickTasks.filter(t => !t.parentId).map(t => ({ ...t, shareId: null }));
    const fromShared = sharedDashboards.flatMap(sd => {
      const list = Array.isArray((sd.data || {}).quickTasks) ? (sd.data || {}).quickTasks : [];
      return list.filter(t => !t.parentId).map(t => ({ ...t, shareId: sd.share_id, sharedTitle: sd.title }));
    });
    return [...local, ...fromShared];
  }, [quickTasks, sharedDashboards]);

  const top3Resolved = useMemo(() => resolveTop3Slots(projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards), [projects, top3Manual, allQuickTasks, lifeGoals, sharedDashboards]);
  const top3DoneCount = useMemo(() => top3Resolved.filter((s) => s && !s.missing && s.done).length, [top3Resolved]);

  const toggleTop3Slot = (slot) => {
    if (!slot || slot.missing) return;
    if (slot.isQuick) {
      if (slot.shareId) toggleSharedQuickTask(slot.shareId, slot.quickTaskId, !slot.done);
      else toggleQuickTask(slot.quickTaskId, !slot.done);
    } else if (slot.projectId?.startsWith('lg-') && updateGoal) {
      const goalId = slot.projectId.replace(/^lg-/, '');
      if (slot.taskId === goalId) {
        updateGoal(goalId, g => ({ ...g, done: !slot.done }));
      } else {
        updateGoal(goalId, g => ({ ...g, tasks: updateNodeInTree(g.tasks || [], slot.taskId, n => ({ ...n, done: !slot.done })) }));
      }
    } else {
      if (slot.shareId && updateSharedDashboardProject) {
        updateSharedDashboardProject(slot.shareId, slot.projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], slot.taskId, (n) => ({ ...n, done: !slot.done })),
        }));
      } else if (toggleProjectTask) {
        toggleProjectTask(slot.projectId, slot.taskId, !slot.done);
      }
    }
  };

  return (
    <div className="dashboard-panel flex flex-col shrink-0 overflow-hidden px-4 py-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="flex items-center gap-2 dashboard-section-title text-amber-500 dark:text-amber-400">
          <Icons.Target className="w-3.5 h-3.5" /> Top 3 Focus
        </h3>
        <span className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">{top3DoneCount}/3</span>
      </div>

      {top3Resolved.every((s) => !s || s.missing) && (
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mb-2 text-center">I tuoi 3 focus appariranno qui</p>
      )}
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((idx) => {
          const slot = top3Resolved[idx];
          const filled = slot && !slot.missing;
          const isDone = slot?.done;

          const isDragOver = dragOverIndex === idx;
          return (
            <div
              key={idx}
              data-slot-index={idx}
              draggable={filled}
              onDragStart={filled ? (e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'top3', fromIndex: idx })); e.dataTransfer.effectAllowed = 'move'; } : undefined}
              onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
              onDragLeave={() => setDragOverIndex(null)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverIndex(null);
                const toIndex = Number(e.currentTarget.dataset.slotIndex);
                try {
                  const raw = e.dataTransfer.getData('application/json');
                  if (!raw) return;
                  const payload = JSON.parse(raw);
                  if (payload.type === 'top3') reorderTop3(payload.fromIndex, toIndex);
                  else if ((payload.type === 'project' || payload.type === 'project-task') && payload.projectId && payload.taskId) setTop3SlotAtIndex(toIndex, { projectId: payload.projectId, taskId: payload.taskId, shareId: payload.shareId ?? null });
                  else if (payload.type === 'quick' && payload.quickTaskId) setTop3SlotAtIndex(toIndex, { quickTaskId: payload.quickTaskId, shareId: payload.shareId ?? null });
                } catch (_) { }
              }}
              className={`relative overflow-hidden min-h-[3.25rem] rounded-xl border flex items-center transition-all duration-150 ${isDragOver ? 'border-amber-400 dark:border-amber-400 bg-amber-50/80 dark:bg-amber-900/20 ring-2 ring-amber-400/50' : filled ? 'border-zinc-200 dark:border-white/[0.06] dark:hover:border-white/[0.1] bg-zinc-50/50 dark:bg-white/[0.02] cursor-grab active:cursor-grabbing' : 'border-dashed border-zinc-200 dark:border-white/[0.06] bg-transparent'}`}
            >
              <span className="absolute -right-2 -bottom-3 text-[4rem] font-black text-zinc-200 dark:text-white/[0.04] pointer-events-none select-none leading-none z-0">{idx + 1}</span>
              {isDragOver && !filled ? (
                <span className="relative z-10 pl-4 text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-widest">Rilascia per aggiungere ai Top 3</span>
              ) : filled ? (
                <>
                  <div onClick={() => toggleTop3Slot(slot)} className="relative z-10 flex items-center gap-3 pl-4 w-full cursor-pointer">
                    <div onClick={(e) => e.stopPropagation()}>
                      <TaskCheckbox done={isDone} onClick={() => toggleTop3Slot(slot)} />
                    </div>
                    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                      <span title={slot.title} className={`text-sm font-semibold break-words line-clamp-2 leading-snug transition-colors duration-150 ${isDone ? 'text-zinc-500 line-through dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-100'}`}>{slot.title}</span>
                      {slot.projectTitle && <span title={slot.projectTitle} className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-0.5 break-words line-clamp-1">{slot.projectTitle}</span>}
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
