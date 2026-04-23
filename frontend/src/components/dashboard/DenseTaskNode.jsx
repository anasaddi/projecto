import React, { useState, useEffect, useCallback } from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { useLongPressActions } from '../../hooks/useLongPressActions';
import { useDashboardStore } from '../../store/dashboardStore';
import { updateNodeInTree, removeNodeFromTree, createTaskNode, formatDeadlineDisplay } from './DashboardUtils';
import { getCollabIdentity, collabDisplayName } from '../../utils/collabIdentity';
import { useToast } from '../../context/ToastContext';

const MAX_TASK_DEPTH = 2;

function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fromDateKey(v) {
  if (!v) return null;
  const [y, m, d] = String(v).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

function formatDeadline(v) {
  const d = fromDateKey(v);
  return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
}

function getDeadlineColorClass(deadlineKey, isDone) {
  if (!deadlineKey || isDone) return 'text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50';
  const today = startOfDay(new Date());
  const dead = fromDateKey(deadlineKey);
  if (!dead) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  const daysUntil = Math.round((dead - today) / 86400000);
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20';
}

/** Pill “premium” meta — workspace shared / emphasized */
function assigneeMetaStyles(wb) {
  if (wb === 'anas') {
    return {
      shell:
        'border-sky-200/75 bg-gradient-to-br from-sky-500/[0.16] via-white/50 to-sky-500/[0.04] dark:border-sky-500/40 dark:from-sky-500/[0.22] dark:via-[#151c28]/90 dark:to-sky-950/20',
      icon: 'bg-sky-500/25 text-sky-800 shadow-sm dark:bg-sky-400/20 dark:text-sky-100',
      label: 'text-xs font-bold uppercase tracking-[0.14em] text-sky-600/80 dark:text-sky-300/90',
      name: 'text-xs font-semibold tracking-tight text-sky-950 dark:text-sky-50',
    };
  }
  return {
    shell:
      'border-violet-200/75 bg-gradient-to-br from-violet-500/[0.16] via-white/50 to-fuchsia-500/[0.05] dark:border-violet-500/40 dark:from-violet-500/[0.22] dark:via-[#181522]/90 dark:to-violet-950/20',
    icon: 'bg-violet-500/25 text-violet-900 shadow-sm dark:bg-violet-400/20 dark:text-violet-100',
    label: 'text-xs font-bold uppercase tracking-[0.14em] text-violet-600/80 dark:text-violet-300/90',
    name: 'text-xs font-semibold tracking-tight text-violet-950 dark:text-violet-50',
  };
}

function deadlineMetaStyles(deadlineKey, isDone) {
  if (!deadlineKey || isDone) {
    return {
      shell: 'border-zinc-200/75 bg-zinc-100/90 dark:border-white/[0.08] dark:bg-zinc-800/85',
      icon: 'bg-zinc-200/90 text-zinc-600 dark:bg-zinc-700/90 dark:text-zinc-300',
      label: 'text-xs font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400',
      primary: 'text-xs font-semibold tabular-nums text-zinc-600 dark:text-zinc-300',
    };
  }
  const today = startOfDay(new Date());
  const dead = fromDateKey(deadlineKey);
  if (!dead) {
    return {
      shell:
        'border-amber-200/85 bg-gradient-to-br from-amber-400/18 to-amber-600/8 dark:border-amber-500/35 dark:from-amber-500/20 dark:to-amber-950/15',
      icon: 'bg-amber-500/25 text-amber-900 dark:bg-amber-400/22 dark:text-amber-100',
      label: 'text-xs font-bold uppercase tracking-[0.14em] text-amber-700/85 dark:text-amber-300/90',
      primary: 'text-xs font-semibold tabular-nums text-amber-950 dark:text-amber-50',
    };
  }
  const daysUntil = Math.round((dead - today) / 86400000);
  if (daysUntil < 0) {
    return {
      shell:
        'border-rose-200/85 bg-gradient-to-br from-rose-400/18 to-rose-700/8 dark:border-rose-500/38 dark:from-rose-500/20 dark:to-rose-950/15',
      icon: 'bg-rose-500/28 text-rose-900 dark:bg-rose-400/25 dark:text-rose-100',
      label: 'text-xs font-bold uppercase tracking-[0.14em] text-rose-700/85 dark:text-rose-300/90',
      primary: 'text-xs font-semibold tabular-nums text-rose-950 dark:text-rose-50',
    };
  }
  return {
    shell:
      'border-emerald-200/85 bg-gradient-to-br from-emerald-400/16 to-emerald-600/8 dark:border-emerald-500/32 dark:from-emerald-500/18 dark:to-emerald-950/12',
    icon: 'bg-emerald-500/25 text-emerald-900 dark:bg-emerald-400/22 dark:text-emerald-100',
    label: 'text-xs font-bold uppercase tracking-[0.14em] text-emerald-700/85 dark:text-emerald-300/90',
    primary: 'text-xs font-semibold tabular-nums text-emerald-950 dark:text-emerald-50',
  };
}

export function DenseTaskNode({
  node,
  depth,
  projectId,
  projectAccent,
  parentId = null,
  shareId = null,
  hideTop3Button = false,
  emphasizedTaskUI = false,
  targetIndex = 0,
  targetParentId = null,
  onToggle: onToggleProp,
  onDelete: onDeleteProp,
  onRename: onRenameProp,
  onDeadline: onDeadlineProp,
  onWorking: onWorkingProp,
  onAddChild: onAddChildProp,
  onMove: onMoveProp,
  showWorkingByBadge = true,
  /** UI dedicata workspace /shared (riga compatta, azioni orizzontali) */
  sharedWorkspaceTaskUI = false,
}) {
  const top3Manual = useDashboardStore((s) => s.top3Manual);
  const toggleProjectTask = useDashboardStore((s) => s.toggleProjectTask);
  const updateProject = useDashboardStore((s) => s.updateProject);
  const deleteProjectTask = useDashboardStore((s) => s.deleteProjectTask);
  const setTop3SlotAtIndex = useDashboardStore((s) => s.setTop3SlotAtIndex);
  const moveProjectTask = useDashboardStore((s) => s.moveProjectTask);
  const moveSubtask = useDashboardStore((s) => s.moveSubtask);
  const updateSharedDashboardProject = useDashboardStore((s) => s.updateSharedDashboardProject);
  const updateGoal = useDashboardStore((s) => s.updateGoal);
  const setProjects = useDashboardStore((s) => s.setProjects);
  const activePomodoroTask = useDashboardStore((s) => s.activePomodoroTask);
  const setActivePomodoroTask = useDashboardStore((s) => s.setActivePomodoroTask);
  const showToast = useToast();

  const isLifeGoal = typeof projectId === 'string' && projectId.startsWith('lg-');
  const goalId = isLifeGoal ? projectId.slice(3) : null;
  const isShared = !!shareId;
  const isTop3 = top3Manual.some(
    (s) => s && s.projectId === projectId && s.taskId === node.id && (isShared ? s.shareId === shareId : !s.shareId)
  );
  const hasFreeTop3Slot = top3Manual.some((s) => !s);

  const onToggle = useCallback(
    (tid, val) => {
      if (onToggleProp) return onToggleProp(tid, val);
      if (isLifeGoal) {
        updateGoal(goalId, (g) => ({ ...g, tasks: updateNodeInTree(g.tasks || [], tid, (n) => ({ ...n, done: val })) }));
        setProjects((prev) =>
          prev.map((p) =>
            p.lifeGoalId === goalId ? { ...p, tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({ ...n, done: val })) } : p
          )
        );
      } else if (isShared) {
        updateSharedDashboardProject(shareId, projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({ ...n, done: val })),
        }));
      } else {
        toggleProjectTask(projectId, tid, val);
      }
    },
    [onToggleProp, isLifeGoal, goalId, isShared, shareId, projectId, toggleProjectTask, updateProject, updateGoal, setProjects, updateSharedDashboardProject]
  );

  const onDelete = useCallback(
    (tid) => {
      if (onDeleteProp) return onDeleteProp(tid);
      if (isLifeGoal) {
        updateGoal(goalId, (g) => ({ ...g, tasks: removeNodeFromTree(g.tasks || [], tid) }));
      } else if (isShared) {
        updateSharedDashboardProject(shareId, projectId, (p) => ({
          ...p,
          tasks: removeNodeFromTree(p.tasks || [], tid),
        }));
      } else {
        deleteProjectTask(projectId, tid);
      }
    },
    [onDeleteProp, isLifeGoal, goalId, isShared, shareId, projectId, deleteProjectTask, updateGoal, updateSharedDashboardProject]
  );

  const onRename = useCallback(
    (tid, val) => {
      if (onRenameProp) return onRenameProp(tid, val);
      if (isLifeGoal) {
        updateGoal(goalId, (g) => ({ ...g, tasks: updateNodeInTree(g.tasks || [], tid, (n) => ({ ...n, title: val })) }));
      } else if (isShared) {
        updateSharedDashboardProject(shareId, projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({ ...n, title: val })),
        }));
      } else {
        updateProject(projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({ ...n, title: val })),
        }));
      }
    },
    [onRenameProp, isLifeGoal, goalId, isShared, shareId, projectId, updateProject, updateGoal, updateSharedDashboardProject]
  );

  const onDeadline = useCallback(
    (tid, val) => {
      if (onDeadlineProp) return onDeadlineProp(tid, val);
      if (isLifeGoal) {
        updateGoal(goalId, (g) => ({ ...g, tasks: updateNodeInTree(g.tasks || [], tid, (n) => ({ ...n, deadline: val || undefined })) }));
      } else if (isShared) {
        updateSharedDashboardProject(shareId, projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({ ...n, deadline: val || undefined })),
        }));
      } else {
        updateProject(projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({ ...n, deadline: val || undefined })),
        }));
      }
    },
    [onDeadlineProp, isLifeGoal, goalId, isShared, shareId, projectId, updateProject, updateGoal, updateSharedDashboardProject]
  );

  const onWorking = useCallback(
    (tid, workingBy) => {
      if (onWorkingProp) return onWorkingProp(tid, workingBy);
      if (isLifeGoal) {
        updateGoal(goalId, (g) => ({ ...g, tasks: updateNodeInTree(g.tasks || [], tid, (n) => ({ ...n, workingBy })) }));
      } else if (isShared) {
        updateSharedDashboardProject(shareId, projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({ ...n, workingBy })),
        }));
      } else {
        updateProject(projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({ ...n, workingBy })),
        }));
      }
    },
    [onWorkingProp, isLifeGoal, goalId, isShared, shareId, projectId, updateProject, updateGoal, updateSharedDashboardProject]
  );

  const onAddChild = useCallback(
    (tid, val) => {
      if (onAddChildProp) return onAddChildProp(tid, val);
      if (isLifeGoal) {
        updateGoal(goalId, (g) => ({
          ...g,
          tasks: updateNodeInTree(g.tasks || [], tid, (n) => ({ ...n, children: [...(n.children || []), createTaskNode(val)] })),
        }));
      } else if (isShared) {
        updateSharedDashboardProject(shareId, projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({
            ...n,
            children: [...(n.children || []), createTaskNode(val)],
          })),
        }));
      } else {
        updateProject(projectId, (p) => ({
          ...p,
          tasks: updateNodeInTree(p.tasks || [], tid, (n) => ({
            ...n,
            children: [...(n.children || []), createTaskNode(val)],
          })),
        }));
      }
    },
    [onAddChildProp, isLifeGoal, goalId, isShared, shareId, projectId, updateProject, updateGoal, updateSharedDashboardProject]
  );

  const onToggleTop3 = useCallback(
    (pid, tid) => {
      const existingIdx = top3Manual.findIndex(
        (s) => s && s.projectId === pid && s.taskId === tid && (isShared ? s.shareId === shareId : !s.shareId)
      );
      if (existingIdx !== -1) setTop3SlotAtIndex(existingIdx, null);
      else {
        const free = top3Manual.findIndex((s) => !s);
        if (free !== -1)
          setTop3SlotAtIndex(free, { projectId: pid, taskId: tid, ...(isShared ? { shareId } : {}) });
      }
    },
    [top3Manual, isShared, shareId, setTop3SlotAtIndex]
  );

  const onMove = useCallback(
    (tid) => {
      if (onMoveProp) return onMoveProp(tid, targetIndex, targetParentId);
      if (isLifeGoal) return; // no drag-drop move for life goal tasks
      if (isShared) {
        if (targetParentId) {
          updateSharedDashboardProject(shareId, projectId, (p) => ({
            ...p,
            tasks: updateNodeInTree(p.tasks || [], targetParentId, (parent) => {
              const next = [...(parent.children || [])];
              const fromIdx = next.findIndex((t) => t.id === tid);
              if (fromIdx === -1) return parent;
              const [removed] = next.splice(fromIdx, 1);
              next.splice(targetIndex, 0, removed);
              return { ...parent, children: next };
            }),
          }));
        } else {
          updateSharedDashboardProject(shareId, projectId, (p) => {
            const next = [...(p.tasks || [])];
            const fromIdx = next.findIndex((t) => t.id === tid);
            if (fromIdx === -1) return p;
            const [removed] = next.splice(fromIdx, 1);
            next.splice(targetIndex, 0, removed);
            return { ...p, tasks: next };
          });
        }
      } else {
        if (targetParentId) moveSubtask(projectId, targetParentId, tid, targetIndex);
        else moveProjectTask(projectId, tid, targetIndex);
      }
    },
    [
      onMoveProp,
      targetIndex,
      targetParentId,
      isLifeGoal,
      isShared,
      shareId,
      projectId,
      moveProjectTask,
      moveSubtask,
      updateSharedDashboardProject,
    ]
  );
  const [draft, setDraft] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDeadline, setShowDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState(node.deadline || '');
  const [expanded, setExpanded] = useState(true);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const canAddChild = depth < MAX_TASK_DEPTH;

  const handleDeadlineSave = () => {
    const val = deadlineInput.trim() || null;
    onDeadline?.(node.id, val);
    setShowDeadline(false);
  };
  useEffect(() => { if (showDeadline) setDeadlineInput(node.deadline || ''); }, [showDeadline, node.deadline]);

  const handleDragStart = (e) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'project-task', projectId, taskId: node.id, parentId, shareId: shareId ?? undefined }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const me = getCollabIdentity();
  const wb = node.workingBy;
  const workingByLabel = wb ? collabDisplayName(wb) : null;
  const workingByTone = wb === 'anas'
    ? 'border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-500/40 dark:bg-sky-500/20 dark:text-sky-200'
    : 'border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-500/40 dark:bg-violet-500/20 dark:text-violet-200';
  const deadlineTone = getDeadlineColorClass(node.deadline, node.done);
  const sharedMetaTagBase = 'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium tracking-tight';

  const isFocusActive = activePomodoroTask && activePomodoroTask.taskId === node.id && activePomodoroTask.projectId === projectId;
  const taskActions = [
    !node.done && !isFocusActive && {
      icon: <Icons.Clock className="h-3 w-3" />,
      onClick: (e) => { e.stopPropagation(); setActivePomodoroTask({ taskId: node.id, projectId, title: node.title }); },
      title: 'Inizia Focus',
      className: 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    },
    !hideTop3Button && (isTop3 || hasFreeTop3Slot) && {
      icon: <Icons.Target className="h-3 w-3" />,
      onClick: (e) => { e.stopPropagation(); onToggleTop3(projectId, node.id); },
      title: isTop3 ? 'Rimuovi da Focus' : 'Pin a Focus',
      className: isTop3 ? 'text-amber-600 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20',
    },
    !node.done && {
      icon: <Icons.User className="h-3 w-3" />,
      onClick: (e) => {
        e.stopPropagation();
        const next = wb === me ? null : me;
        onWorking(node.id, next);
      },
      title: wb === me
        ? 'Non sto più lavorando su questo task'
        : wb
          ? `${collabDisplayName(wb)} in lavorazione — clic per segnare te`
          : 'Segna che ci sto lavorando io',
      className: wb === me
        ? 'text-sky-600 bg-sky-50 dark:text-sky-300 dark:bg-sky-500/25 dark:ring-1 dark:ring-sky-400/40'
        : wb
          ? 'text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/25 dark:ring-1 dark:ring-violet-400/30'
          : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5',
    },
    canAddChild && !node.done && {
      icon: <Icons.Plus className="h-3 w-3" />,
      onClick: (e) => { e.stopPropagation(); setOpenAdd(true); },
      title: 'Subtask',
      className: 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20',
    },
    { icon: <Icons.Calendar className="h-3 w-3" />, onClick: (e) => { e.stopPropagation(); setShowDeadline(true); }, title: 'Scadenza', className: 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5' },
    { icon: <Icons.Edit2 className="h-3 w-3" />, onClick: (e) => { e.stopPropagation(); setEditing(true); }, title: 'Rinomina', className: 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5' },
    { icon: <Icons.X className="h-3.5 w-3.5" />, onClick: (e) => { e.stopPropagation(); onDelete(node.id); }, title: 'Elimina', className: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' },
  ].filter(Boolean);

  const { active: longPressActive, barRef, zoneProps, getActionProps, handledByPointerUpRef } = useLongPressActions({ actions: taskActions });

  return (
    <div
      className={`group/task flex flex-col w-full relative ${showDeadline ? 'z-30' : 'z-auto'}`}
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('bg-zinc-50'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('bg-zinc-50'); }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('bg-zinc-50');
        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json'));
          const validTypes = ['project-task'];
          if (!validTypes.includes(payload.type)) {
            showToast?.('Puoi trascinare solo task qui', { type: 'warning' });
            return;
          }
          if (payload.type === 'project-task' && payload.projectId === projectId && payload.parentId === parentId) {
            onMove(payload.taskId);
          } else {
            showToast?.('Task non valido per questa posizione', { type: 'warning' });
          }
        } catch (err) {
          console.error('Drop error:', err);
          showToast?.('Errore durante il trascinamento', { type: 'error' });
        }
      }}
    >
      <div
        draggable
        onDragStart={handleDragStart}
        {...zoneProps}
        className={`group/row relative flex w-full min-w-0 cursor-grab text-sm transition-all duration-200 active:cursor-grabbing sm:text-sm ${
          sharedWorkspaceTaskUI
            ? `items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 backdrop-blur-sm hover:bg-white/[0.05] dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:bg-white/[0.04] ${node.done ? 'opacity-45' : ''}`
            : emphasizedTaskUI
              ? 'min-h-[44px] items-start gap-3 rounded-xl border border-zinc-200/70 bg-white/80 px-3 py-2.5 shadow-sm hover:border-zinc-300/60 hover:bg-white dark:border-white/[0.05] dark:bg-white/[0.03] dark:hover:bg-white/[0.05]'
              : 'min-h-[36px] items-center gap-2 rounded-lg px-2 py-1 hover:bg-zinc-100/80 dark:hover:bg-white/[0.04]'
        }`}
      >
        {/* Chevron + checkbox (colonna fissa) */}
        <div className="flex shrink-0 items-center gap-1.5">
          <div className="flex h-4 w-3 shrink-0 items-center justify-center">
            {hasChildren ? (
              <button type="button" onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }} className="text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300">
                {expanded ? <Icons.ChevronDown className="h-3 w-3" /> : <Icons.ChevronRight className="h-3 w-3" />}
              </button>
            ) : <span className="h-3 w-3" />}
          </div>
          <div className="shrink-0">
            <TaskCheckbox
              done={node.done}
              onClick={() => onToggle(node.id, !node.done)}
              className={sharedWorkspaceTaskUI && node.done ? 'border-zinc-500 bg-zinc-500 dark:border-zinc-600 dark:bg-zinc-600' : ''}
            />
          </div>
        </div>

        {sharedWorkspaceTaskUI ? (
          <>
            <div className="min-w-0 flex-1 flex flex-col justify-center" onClick={() => !editing && onToggle(node.id, !node.done)}>
              {editing ? (
                <input
                  autoFocus
                  defaultValue={node.title}
                  onBlur={(e) => { onRename(node.id, e.target.value); setEditing(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { onRename(node.id, e.target.value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
                  className="w-full min-w-0 border-b border-indigo-400 bg-transparent py-0.5 text-sm leading-snug text-zinc-100 outline-none"
                />
              ) : (
                <p
                  className={`line-clamp-1 w-full min-w-0 text-left text-sm font-medium leading-snug text-zinc-100 ${node.done ? 'text-zinc-500' : ''}`}
                  title={node.title}
                >
                  {node.title}
                </p>
              )}
              {!editing && ((showWorkingByBadge && wb) || node.deadline) && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {showWorkingByBadge && wb && (
                    <span className={`${sharedMetaTagBase} ${
                      wb === 'anas'
                        ? 'border-sky-500/20 bg-sky-500/8 text-sky-300'
                        : 'border-violet-500/20 bg-violet-500/8 text-violet-300'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${wb === 'anas' ? 'bg-sky-400' : 'bg-violet-400'}`} />
                      {workingByLabel}
                    </span>
                  )}
                  {node.deadline && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowDeadline(true); }}
                      className={`${sharedMetaTagBase} transition-opacity hover:opacity-80 ${
                        node.done
                          ? 'border-zinc-600/40 bg-zinc-800/35 text-zinc-400'
                          : deadlineTone.includes('red')
                            ? 'border-rose-500/20 bg-rose-500/8 text-rose-300'
                            : deadlineTone.includes('amber')
                              ? 'border-amber-500/20 bg-amber-500/8 text-amber-300'
                              : 'border-emerald-500/20 bg-emerald-500/8 text-emerald-300'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        node.done
                          ? 'bg-zinc-400'
                          : deadlineTone.includes('red')
                            ? 'bg-rose-400'
                            : deadlineTone.includes('amber')
                              ? 'bg-amber-400'
                              : 'bg-emerald-400'
                      }`} />
                      {formatDeadlineDisplay(node.deadline)}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div
              ref={barRef}
              className={`flex shrink-0 flex-row items-center gap-2.5 transition-opacity duration-200 touch-manipulation ${longPressActive || (!hideTop3Button && isTop3) ? 'opacity-100' : 'opacity-100 sm:pointer-events-none sm:opacity-0 sm:group-hover/row:pointer-events-auto sm:group-hover/row:opacity-100'}`}
            >
              {taskActions.map((act, i) => {
                const ap = getActionProps(i);
                return (
                  <button
                    key={i}
                    data-action-idx={i}
                    type="button"
                    onClick={(e) => { if (handledByPointerUpRef.current) { e.preventDefault(); return; } e.stopPropagation(); act.onClick(e); }}
                    title={act.title}
                    aria-label={act.title}
                    className={`dashboard-action-btn ${act.className || ''} ${ap.className || ''}`}
                  >
                    {act.icon}
                  </button>
                );
              })}
            </div>
          </>
        ) : emphasizedTaskUI ? (
          <>
            <div className="min-w-0 flex-1 flex flex-col gap-1.5" onClick={() => !editing && onToggle(node.id, !node.done)}>
              {editing ? (
                <input
                  autoFocus
                  defaultValue={node.title}
                  onBlur={(e) => { onRename(node.id, e.target.value); setEditing(false); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { onRename(node.id, e.target.value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
                  className="w-full min-w-0 bg-transparent border-b border-indigo-400 outline-none py-0.5 text-sm leading-snug text-zinc-900 dark:text-zinc-100"
                />
              ) : (
                <p
                  className={`w-full min-w-0 text-sm font-medium leading-5 text-left [overflow-wrap:normal] break-words ${node.done ? 'text-zinc-400 line-through' : 'text-zinc-900 dark:text-zinc-50'}`}
                  title={node.title}
                >
                  {node.title}
                </p>
              )}
              {!editing && ((showWorkingByBadge && wb) || node.deadline) && (
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {showWorkingByBadge && wb && (
                    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${
                      wb === 'anas'
                        ? 'border-sky-500/30 bg-sky-500/10 text-sky-400'
                        : 'border-violet-500/30 bg-violet-500/10 text-violet-400'
                    }`}>
                      <Icons.User className="h-3 w-3" />
                      {workingByLabel}
                    </span>
                  )}
                  {node.deadline && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowDeadline(true); }}
                      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-opacity hover:opacity-80 ${
                        node.done
                          ? 'border-zinc-600/50 bg-zinc-800/50 text-zinc-400'
                          : new Date(node.deadline) < new Date()
                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                            : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      <Icons.Calendar className="h-3 w-3" />
                      {formatDeadlineDisplay(node.deadline)}
                    </button>
                  )}
                </div>
              )}
            </div>
            <div
              ref={barRef}
              className={`flex shrink-0 flex-col items-end justify-start gap-0.5 pt-1 transition-all duration-200 touch-manipulation ${longPressActive || (!hideTop3Button && isTop3) ? 'opacity-100 visible' : 'opacity-0 invisible group-hover/row:opacity-100 group-hover/row:visible'}`}
            >
              {taskActions.map((act, i) => {
                const ap = getActionProps(i);
                return (
                  <button
                    key={i}
                    data-action-idx={i}
                    type="button"
                    onClick={(e) => { if (handledByPointerUpRef.current) { e.preventDefault(); return; } e.stopPropagation(); act.onClick(e); }}
                    title={act.title}
                    aria-label={act.title}
                    className={`dashboard-action-btn ${act.className || ''} ${ap.className || ''}`}
                  >
                    {act.icon}
                  </button>
                );
              })}
            </div>
          </>
        ) : (
        <>
        <div className="flex min-w-0 w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex min-w-0 w-full flex-1 flex-wrap items-center gap-x-2 gap-y-1 py-0.5" onClick={() => !editing && onToggle(node.id, !node.done)}>
            {editing ? (
              <input
                autoFocus
                defaultValue={node.title}
                onBlur={(e) => { onRename(node.id, e.target.value); setEditing(false); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { onRename(node.id, e.target.value); setEditing(false); } if (e.key === 'Escape') setEditing(false); }}
                className="min-w-0 w-full flex-1 bg-transparent border-b border-indigo-400 outline-none py-0.5 text-sm text-zinc-900 dark:text-zinc-100"
              />
            ) : (
              <span
                className="block w-full min-w-0 text-sm leading-5 font-medium [overflow-wrap:normal] break-words text-zinc-700 dark:text-zinc-300"
                title={node.title}
              >
                {node.title}
              </span>
            )}
            {showWorkingByBadge && wb && !editing && (
              <span
                className={`shrink-0 rounded-md border px-1.5 py-0.5 text-xs font-medium tabular-nums ${workingByTone}`}
              >
                {workingByLabel}
              </span>
            )}
            {node.deadline && !editing && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowDeadline(true); }}
                className={`shrink-0 rounded-md font-medium tabular-nums border border-transparent hover:border-current transition-colors ${getDeadlineColorClass(node.deadline, node.done)} px-1.5 py-0.5 text-xs`}
              >
                {formatDeadline(node.deadline)}
              </button>
            )}
          </div>

        <div
          ref={barRef}
          className={`flex w-full shrink-0 items-center justify-end gap-0.5 sm:w-auto sm:shrink-0 sm:justify-end sm:pt-0.5 transition-all duration-200 touch-manipulation ${longPressActive || (!hideTop3Button && isTop3) ? 'opacity-100 visible' : 'opacity-0 invisible group-hover/row:opacity-100 group-hover/row:visible'}`}
        >
          {taskActions.map((act, i) => {
            const ap = getActionProps(i);
            return (
              <button
                key={i}
                data-action-idx={i}
                type="button"
                onClick={(e) => { if (handledByPointerUpRef.current) { e.preventDefault(); return; } e.stopPropagation(); act.onClick(e); }}
                title={act.title}
                aria-label={act.title}
                className={`dashboard-action-btn ${act.className || ''} ${ap.className || ''}`}
              >
                {act.icon}
              </button>
            );
          })}
        </div>
        </div>
        </>
        )}

        {/* Inline Deadline Editor */}
        {showDeadline && (
          <div className="absolute z-20 top-0 right-0 mt-8 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-white/10 p-3 animate-slide-down" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">Scadenza</h4>
              <button onClick={() => setShowDeadline(false)}><Icons.X className="h-3 w-3" /></button>
            </div>
            <input
              type="date"
              value={deadlineInput}
              onChange={(e) => setDeadlineInput(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-900 outline-none dark:border-white/10 dark:bg-black/20 dark:text-zinc-100 mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => { setDeadlineInput(''); onDeadline?.(node.id, null); setShowDeadline(false); }} className="flex-1 py-1.5 text-xs font-bold text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 rounded-lg border border-zinc-100 dark:border-white/5 transition-colors">Rimuovi</button>
              <button onClick={handleDeadlineSave} className="flex-1 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20 transition-all">Salva</button>
            </div>
          </div>
        )}
      </div>

      {/* Children rendering */}
      {expanded && hasChildren && (
        <div className={`ml-2.5 mt-2 pl-2.5 border-l border-zinc-100 dark:border-white/[0.04] flex flex-col min-w-0 overflow-x-hidden ${sharedWorkspaceTaskUI ? 'space-y-2' : 'space-y-0.5'}`}>
          {node.children.map((child, cIdx) => (
            <DenseTaskNode
              key={child.id}
              node={child}
              depth={depth + 1}
              projectId={projectId}
              projectAccent={projectAccent}
              shareId={shareId}
              parentId={node.id}
              hideTop3Button={hideTop3Button}
              emphasizedTaskUI={emphasizedTaskUI}
              sharedWorkspaceTaskUI={sharedWorkspaceTaskUI}
              onToggle={onToggleProp}
              onDelete={onDeleteProp}
              onRename={onRenameProp}
              onDeadline={onDeadlineProp}
              onWorking={onWorkingProp}
              onAddChild={onAddChildProp}
              onMove={onMoveProp}
              showWorkingByBadge={showWorkingByBadge}
              targetIndex={cIdx}
              targetParentId={node.id}
            />
          ))}
        </div>
      )}

      {/* Inline subtask creation */}
      {openAdd && (
        <div className={`ml-5 animate-slide-down ${sharedWorkspaceTaskUI ? 'mt-2' : 'mt-1'}`}>
          <input
            autoFocus
            type="text"
            placeholder="Nuova sotto-attività..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) { onAddChild(node.id, draft); setDraft(''); setOpenAdd(false); }
              if (e.key === 'Escape') { setDraft(''); setOpenAdd(false); }
            }}
            onBlur={() => { if (!draft.trim()) setOpenAdd(false); }}
            className="w-full bg-transparent border-b border-indigo-400/50 outline-none text-xs py-0.5 text-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}
    </div>
  );
}
