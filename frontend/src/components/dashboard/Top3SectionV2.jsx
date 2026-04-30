import React, { useMemo, useState } from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { resolveTop3Slots } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { useToast } from '../../context/ToastContext';
import { Card, CardHeader, Badge } from './Card';

export function Top3SectionV2() {
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const projects = useDashboardStore((s) => s.projects) ?? [];
  const top3Manual = useDashboardStore((s) => s.top3Manual) ?? [null, null, null];
  const quickTasks = useDashboardStore((s) => s.quickTasks) ?? [];
  const lifeGoals = useDashboardStore((s) => s.lifeGoals) ?? { tiers: [] };
  const sharedDashboards = useDashboardStore((s) => s.sharedDashboards) ?? [];
  const reorderTop3 = useDashboardStore((s) => s.reorderTop3);
  const setTop3SlotAtIndex = useDashboardStore((s) => s.setTop3SlotAtIndex);
  const removeFromTop3 = useDashboardStore((s) => s.removeFromTop3);
  const toggleQuickTask = useDashboardStore((s) => s.toggleQuickTask);
  const updateProject = useDashboardStore((s) => s.updateProject);
  const updateSharedDashboardProject = useDashboardStore((s) => s.updateSharedDashboardProject);
  const toggleSharedQuickTask = useDashboardStore((s) => s.toggleSharedQuickTask);
  const updateGoal = useDashboardStore((s) => s.updateGoal);
  const logTimelineCompletionEvent = useDashboardStore((s) => s.logTimelineCompletionEvent);

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

  const setSubtreeDone = (nodes, targetId, done) => {
    const applyToAll = (node) => ({
      ...node,
      done,
      children: Array.isArray(node.children) ? node.children.map(applyToAll) : node.children,
    });

    return (nodes || []).map((node) => {
      if (node.id === targetId) return applyToAll(node);
      if (Array.isArray(node.children) && node.children.length) {
        return { ...node, children: setSubtreeDone(node.children, targetId, done) };
      }
      return node;
    });
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
        updateGoal(goalId, g => ({ ...g, tasks: setSubtreeDone(g.tasks || [], slot.taskId, newVal) }));
      }
      if (logTimelineCompletionEvent && slot.title) logTimelineCompletionEvent('quick', slot.taskId, slot.title, newVal);
    } else {
      if (slot.shareId && updateSharedDashboardProject) {
        updateSharedDashboardProject(slot.shareId, slot.projectId, (p) => ({
          ...p,
          tasks: setSubtreeDone(p.tasks || [], slot.taskId, !slot.done),
        }));
      } else if (updateProject) {
        updateProject(slot.projectId, (p) => ({
          ...p,
          tasks: setSubtreeDone(p.tasks || [], slot.taskId, !slot.done),
        }));
      }
    }
  };

  const SLOT_COLORS = [
    {
      filled: 'border-amber-300 dark:border-dark-amber/30 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-dark-amber/10 dark:to-orange-900/10 cursor-grab active:cursor-grabbing hover:border-amber-400 dark:hover:border-dark-amber/50 shadow-md',
      accent: 'text-amber-600 dark:text-dark-amber',
      watermark: 'text-amber-200/60 dark:text-dark-amber/10',
      dragOver: 'border-amber-500 dark:border-dark-amber bg-gradient-to-br from-amber-50 to-orange-50 dark:from-dark-amber/20 dark:to-orange-900/20 ring-2 ring-amber-400/40 shadow-lg',
    },
    {
      filled: 'border-violet-300 dark:border-dark-violet/30 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-dark-violet/10 dark:to-purple-900/10 cursor-grab active:cursor-grabbing hover:border-violet-400 dark:hover:border-dark-violet/50 shadow-sm',
      accent: 'text-violet-600 dark:text-dark-violetLight',
      watermark: 'text-violet-200/60 dark:text-dark-violet/10',
      dragOver: 'border-violet-500 dark:border-dark-violet bg-gradient-to-br from-violet-50 to-purple-50 dark:from-dark-violet/20 dark:to-purple-900/20 ring-2 ring-violet-400/40 shadow-lg',
    },
    {
      filled: 'border-sky-300 dark:border-dark-cyan/30 bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-dark-cyan/10 dark:to-cyan-900/10 cursor-grab active:cursor-grabbing hover:border-sky-400 dark:hover:border-dark-cyan/50 shadow-sm',
      accent: 'text-sky-600 dark:text-dark-cyan',
      watermark: 'text-sky-200/60 dark:text-dark-cyan/10',
      dragOver: 'border-sky-500 dark:border-dark-cyan bg-gradient-to-br from-sky-50 to-cyan-50 dark:from-dark-cyan/20 dark:to-cyan-900/20 ring-2 ring-sky-400/40 shadow-lg',
    },
  ];

  const getSlotStyles = (isDragOver, filled, isDone, idx) => {
    const colors = SLOT_COLORS[idx] || SLOT_COLORS[0];
    if (isDragOver) return colors.dragOver;
    if (filled) return colors.filled;
    return 'border-dashed border-zinc-200 dark:border-dark-borderSubtle bg-transparent hover:border-zinc-300 dark:hover:border-dark-textMuted';
  };

  const isTaskInTop3 = (payload) => {
    return top3Manual.some(slot => {
      if (!slot) return false;
      if (payload.type === 'quick' && payload.quickTaskId) {
        return slot.quickTaskId === payload.quickTaskId && slot.shareId === (payload.shareId ?? null);
      }
      if ((payload.type === 'project' || payload.type === 'project-task') && payload.projectId && payload.taskId) {
        return slot.projectId === payload.projectId && slot.taskId === payload.taskId && slot.shareId === (payload.shareId ?? null);
      }
      if (payload.type === 'lifeGoal' && payload.goalId) {
        return slot.projectId === `lg-${payload.goalId}` && slot.taskId === payload.goalId;
      }
      return false;
    });
  };

  const readDragPayload = (dataTransfer) => {
    const candidateTypes = ['application/x-projecto-drag', 'application/x-quick', 'application/json', 'text/plain'];
    for (const type of candidateTypes) {
      try {
        const raw = dataTransfer.getData(type);
        if (!raw) continue;
        const payload = JSON.parse(raw);
        if (payload && typeof payload === 'object') return payload;
      } catch {
        // Try the next MIME type.
      }
    }
    return null;
  };

  const onDrop = (e, idx) => {
    e.preventDefault();
    setDragOverIndex(null);
    try {
      const payload = readDragPayload(e.dataTransfer);
      if (!payload) {
        showToast?.('Trascinamento non valido', { type: 'warning' });
        return;
      }
      
      // Check valid type
      if (!VALID_TOP3_DROP_TYPES.includes(payload.type)) {
        showToast?.('Puoi trascinare solo task, quick task o obiettivi di vita nei Top 3', { type: 'warning' });
        return;
      }

      if (payload.type === 'top3') {
        const fromIndex = Number(payload.fromIndex);
        if (Number.isNaN(fromIndex) || fromIndex === idx) return;
        reorderTop3(fromIndex, idx);
        return;
      }

      const targetIndex = top3Manual[idx] === null ? idx : top3Manual.findIndex((slot) => !slot);
      if (targetIndex === -1) {
        showToast?.('I Top 3 sono già pieni. Rimuovi prima un elemento.', { type: 'warning' });
        return;
      }

      // Check if slot is already filled
      if (isTaskInTop3(payload)) {
        showToast?.('Questo task è già nei Top 3', { type: 'warning' });
        return;
      }

      if ((payload.type === 'project' || payload.type === 'project-task') && payload.projectId && payload.taskId) {
        setTop3SlotAtIndex(targetIndex, { projectId: payload.projectId, taskId: payload.taskId, shareId: payload.shareId ?? null });
      } else if (payload.type === 'quick' && payload.quickTaskId) {
        setTop3SlotAtIndex(targetIndex, { quickTaskId: payload.quickTaskId, shareId: payload.shareId ?? null });
      } else if (payload.type === 'lifeGoal' && payload.goalId) {
        setTop3SlotAtIndex(targetIndex, { projectId: `lg-${payload.goalId}`, taskId: payload.goalId, shareId: payload.shareId ?? null });
      } else {
        showToast?.('Trascinamento non valido: dati mancanti', { type: 'warning' });
      }
    } catch (_) {
      showToast?.('Errore durante il trascinamento', { type: 'error' });
    }
  };

  return (
    <Card className="flex flex-col shrink-0 min-h-0">
      <CardHeader
        icon={Icons.Target}
        iconColor="text-amber-500"
        title="Top 3 Focus"
        subtitle="Le tue priorità principali"
        action={
          <Badge variant={top3DoneCount === 3 ? 'success' : 'warning'} size="sm">
            {top3DoneCount}/3
          </Badge>
        }
        bordered={true}
      />
      
      <div className="px-3 py-3 sm:p-4 sm:pt-3 flex flex-col gap-3">
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
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                setDragOverIndex(idx);
              }}
              onDragLeave={() => setDragOverIndex((current) => (current === idx ? null : current))}
              onDrop={(e) => onDrop(e, idx)}
              className={`relative overflow-hidden ${idx === 0 ? 'min-h-[4.5rem] sm:min-h-[5rem]' : 'min-h-[3.25rem] sm:min-h-[4rem]'} rounded-2xl border transition-all duration-200
                ${isDragOver ? 'scale-[1.02]' : 'scale-100'}
                ${getSlotStyles(isDragOver, filled, isDone, idx)}
              `}
            >
              {/* Large number watermark - more prominent */}
              <span className={`absolute -right-2 -bottom-4 ${idx === 0 ? 'text-[4.5rem] sm:text-[6rem]' : 'text-[3.5rem] sm:text-[4.5rem]'} font-black pointer-events-none select-none leading-none z-0 ${filled ? (SLOT_COLORS[idx]?.watermark || 'text-zinc-200/50 dark:text-white/[0.05]') : 'text-zinc-200/50 dark:text-white/[0.05]'}`}>
                {idx + 1}
              </span>
              
              {filled ? (
                <div className="relative z-10 flex items-start gap-2.5 px-2.5 py-2.5 sm:gap-3 sm:px-3 sm:py-3 h-full">
                  <div className="pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <TaskCheckbox done={isDone} onClick={() => toggleTop3Slot(slot)} />
                  </div>
                  
                  <div 
                    onClick={() => toggleTop3Slot(slot)}
                    className="flex flex-col flex-1 min-w-0 cursor-pointer pr-1"
                  >
                    <span
                      className={`font-semibold break-words leading-snug ${idx === 0 ? 'text-[15px] sm:text-[16px]' : 'text-[13px] sm:text-[14px]'} ${isDone ? 'line-through text-zinc-400 dark:text-zinc-500' : (SLOT_COLORS[idx]?.accent || 'text-zinc-800 dark:text-zinc-100')}`}
                      title={slot.title}
                    >
                      {slot.title}
                    </span>
                    {slot.projectTitle && (
                      <span className="mt-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
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
                    <span className="text-[11px] sm:text-xs font-medium">+ slot libero</span>
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
