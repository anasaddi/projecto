import React, { useMemo, useState } from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { resolveTop3Slots, updateNodeInTree } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, Badge } from './Card';

export function Top3SectionV2() {
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
    updateGoal,
    logTimelineCompletionEvent
  } = store ?? {};

  const showToast = useToast();

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

  const VALID_TOP3_DROP_TYPES = ['top3', 'project', 'project-task', 'quick', 'lifeGoal'];

  const isValidTop3Payload = (raw) => {
    if (!raw) return false;
    try {
      const payload = JSON.parse(raw);
      return VALID_TOP3_DROP_TYPES.includes(payload?.type);
    } catch {
      return false;
    }
  };

  const toggleTop3Slot = (slot) => {
    if (!slot || slot.missing) return;
    if (slot.quickTaskId) {
      if (slot.shareId) toggleSharedQuickTask(slot.shareId, slot.quickTaskId, !slot.done);
      else toggleQuickTask(slot.quickTaskId, !slot.done);
      return;
    } else if (slot.projectId?.startsWith('lg-') && updateGoal) {
      const goalId = slot.projectId.replace(/^lg-/, '');
      const newVal = !slot.done;
      if (slot.taskId === goalId) {
        updateGoal(goalId, g => ({ ...g, done: newVal }));
        const qt = quickTasks.find(t => t.lifeGoalId === goalId && !t.parentId);
        if (qt) toggleQuickTask(qt.id, newVal);
      } else {
        updateGoal(goalId, g => ({ ...g, tasks: updateNodeInTree(g.tasks || [], slot.taskId, n => ({ ...n, done: newVal })) }));
      }
      if (logTimelineCompletionEvent && slot.title) logTimelineCompletionEvent('quick', slot.taskId, slot.title, newVal);
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

  const getSlotStyles = (isDragOver, filled, isDone) => {
    if (isDragOver) {
      return 'border-amber-400/80 dark:border-amber-500/50 bg-amber-50/80 dark:bg-amber-900/20 ring-1 ring-amber-400/25';
    }
    if (filled) {
      return 'border-zinc-200/70 dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.03] cursor-grab active:cursor-grabbing hover:border-zinc-300 dark:hover:border-white/[0.12] shadow-sm';
    }
    return 'border-dashed border-zinc-300/80 dark:border-white/[0.12] bg-zinc-50/50 dark:bg-white/[0.02] hover:border-zinc-400 dark:hover:border-white/[0.18]';
  };

  return (
    <Card className="flex flex-col shrink-0">
      <CardHeader
        icon={Icons.Target}
        iconColor="text-amber-500"
        title="Top 3 Focus"
        subtitle="Le tue priorità principali"
        action={
          <Badge variant={top3DoneCount === 3 ? 'success' : 'warning'} size="md">
            {top3DoneCount}/3
          </Badge>
        }
        bordered={true}
      />
      
      <div className="p-4 pt-3 flex flex-col gap-3">
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
              onDragStart={filled ? (e) => { 
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'top3', fromIndex: idx })); 
                e.dataTransfer.effectAllowed = 'move'; 
              } : undefined}
              onDragOver={(e) => {
                if (!e.dataTransfer.types?.includes('application/json')) {
                  if (dragOverIndex !== null) setDragOverIndex(null);
                  return;
                }
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverIndex(idx);
              }}
              onDragLeave={() => setDragOverIndex((current) => (current === idx ? null : current))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverIndex(null);
                try {
                  const raw = e.dataTransfer.getData('application/json');
                  if (!raw) return;
                  const payload = JSON.parse(raw);
                  if (!VALID_TOP3_DROP_TYPES.includes(payload.type)) {
                    showToast?.('Puoi trascinare solo task validi nei Top 3', { type: 'warning' });
                    return;
                  }
                  if (payload.type === 'top3') reorderTop3(payload.fromIndex, idx);
                  else if ((payload.type === 'project' || payload.type === 'project-task') && payload.projectId && payload.taskId) setTop3SlotAtIndex(idx, { projectId: payload.projectId, taskId: payload.taskId, shareId: payload.shareId ?? null });
                  else if (payload.type === 'quick' && payload.quickTaskId) setTop3SlotAtIndex(idx, { quickTaskId: payload.quickTaskId, shareId: payload.shareId ?? null });
                  else if (payload.type === 'lifeGoal' && payload.goalId) setTop3SlotAtIndex(idx, { projectId: `lg-${payload.goalId}`, taskId: payload.goalId, shareId: payload.shareId ?? null });
                } catch (_) { }
              }}
              className={`
                relative overflow-hidden min-h-[4rem] rounded-2xl border transition-all duration-200
                ${isDragOver ? 'scale-[1.02]' : 'scale-100'}
                ${getSlotStyles(isDragOver, filled, isDone)}
              `}
            >
              {/* Large number watermark - more prominent */}
              <span className="absolute -right-2 -bottom-4 text-[5rem] font-black text-zinc-200/50 dark:text-white/[0.05] pointer-events-none select-none leading-none z-0">
                {idx + 1}
              </span>
              
              {filled ? (
                <div className="relative z-10 flex items-start gap-3 px-3 py-3 h-full">
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <TaskCheckbox done={isDone} onClick={() => toggleTop3Slot(slot)} />
                  </div>
                  
                  <div 
                    onClick={() => toggleTop3Slot(slot)}
                    className="flex flex-col flex-1 min-w-0 cursor-pointer pr-1"
                  >
                    <span
                      className={`font-semibold break-words leading-snug text-sm ${isDone ? 'line-through text-zinc-400 dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-100'}`}
                      title={slot.title}
                    >
                      {slot.title}
                    </span>
                    {slot.projectTitle && (
                      <span className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        {slot.projectTitle}
                      </span>
                    )}
                  </div>
                  
                  <button 
                    type="button" 
                    onClick={() => removeFromTop3(idx)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors hover:scale-110 active:scale-90"
                  >
                    <Icons.X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <button
                    onClick={() => showToast?.('Trascina un task qui per aggiungerlo ai Top 3', { type: 'info' })}
                    className="pointer-events-auto flex items-center justify-center gap-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    <span className="text-xs font-medium">+ slot libero</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export default Top3SectionV2;
