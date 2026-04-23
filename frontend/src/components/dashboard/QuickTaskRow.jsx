import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { ActionButton } from './Card';
import { formatDeadline, getDeadlineColorClass } from './DashboardUtils';
import { useLongPressActions } from '../../hooks/useLongPressActions';
import { useDashboardStore } from '../../store/dashboardStore';
import { useToast } from '../../context/ToastContext';

export function QuickTaskRow({
  task, isShared, localIdx, idx, pinned, isHovered,
  allQuickTasks, setHoveredTaskId,
  toggleQuickTask, toggleSharedQuickTask,
  quickTaskEditingId, setQuickTaskEditingId, quickTaskEditingTitle, setQuickTaskEditingTitle,
  quickTaskDeadlineEditing, setQuickTaskDeadlineInput, setQuickTaskDeadlineEditing, quickTaskDeadlineInput,
  updateQuickTask, updateSharedQuickTask,
  top3Manual, setTop3SlotAtIndex,
  removeQuickTask, removeSharedQuickTask,
  reorderQuickTasks, promoteQuickTaskToProject,
}) {
  const activePomodoroTask = useDashboardStore((s) => s.activePomodoroTask);
  const setActivePomodoroTask = useDashboardStore((s) => s.setActivePomodoroTask);
  const showToast = useToast();
  const taskId = isShared ? `shared-${task.shareId}-${task.id}` : task.id;
  const isFocusActive = activePomodoroTask && (activePomodoroTask.quickTaskId === task.id || activePomodoroTask.taskId === taskId);
  
  const priority = task.priority || 'medium';
  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-zinc-400',
  };
  const actions = [
    !task.done && !isFocusActive && {
      icon: <Icons.Clock className="h-3 w-3" />,
      onClick: () => setActivePomodoroTask({
        taskId: task.id,
        quickTaskId: isShared ? undefined : task.id,
        shareId: isShared ? task.shareId : undefined,
        title: task.title,
      }),
      title: 'Inizia Focus',
      className: 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20',
    },
    !task.deadline && quickTaskDeadlineEditing !== taskId && {
      icon: <Icons.Calendar className="h-3 w-3" />,
      onClick: () => { setQuickTaskDeadlineInput(''); setQuickTaskDeadlineEditing(taskId); },
      title: 'Scadenza',
    },
    {
      icon: <Icons.Target className="h-3 w-3" />,
      onClick: () => {
        const existingIdx = top3Manual.findIndex(s => s && s.quickTaskId === task.id && (isShared ? s.shareId === task.shareId : !s.shareId));
        if (existingIdx !== -1) setTop3SlotAtIndex(existingIdx, null);
        else { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { quickTaskId: task.id, shareId: isShared ? task.shareId : null }); }
      },
      title: pinned ? 'Rimuovi dai Top 3' : 'Aggiungi ai Top 3',
      className: pinned ? 'text-amber-500 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/30 dark:ring-1 dark:ring-amber-400/50' : '',
    },
    {
      icon: <Icons.ArrowUpRight className="h-3 w-3" />,
      onClick: () => promoteQuickTaskToProject?.(task.id),
      title: 'Promuovi a progetto',
      className: 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/20',
    },
    {
      icon: <Icons.X className="h-3 w-3" />,
      onClick: () => isShared ? removeSharedQuickTask(task.shareId, task.id) : removeQuickTask(task.id),
      title: 'Elimina',
      className: 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
  ].filter(Boolean);

  const { active, barRef, zoneProps, getActionProps, handledByPointerUpRef } = useLongPressActions({ actions });
  const showActions = pinned || isHovered || active;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, x: -20 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
      {...zoneProps}
      className={`
        group relative flex items-center gap-2 rounded-2xl border border-transparent p-3
        ${task.done ? 'opacity-75' : 'opacity-100'}
        ${isFocusActive ? 'ring-2 ring-indigo-400/60 dark:ring-indigo-500/40 bg-indigo-50/50 dark:bg-indigo-500/5' : !isShared ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        transition-colors duration-200
        ${!isFocusActive && (isHovered ? 'bg-zinc-100/90 border-zinc-200/70 dark:bg-white/[0.04] dark:border-white/[0.06]' : 'bg-transparent')}
        ${!isFocusActive && 'hover:bg-zinc-100/90 hover:border-zinc-200/70 dark:hover:bg-white/[0.04] dark:hover:border-white/[0.06]'}
      `}
      draggable={!isShared}
      onMouseEnter={() => setHoveredTaskId(taskId)}
      onMouseLeave={() => setHoveredTaskId(null)}
      onClick={(e) => {
        if (e.target.closest('button') || e.target.closest('input')) return;
        isShared ? toggleSharedQuickTask(task.shareId, task.id, !task.done) : toggleQuickTask(task.id, !task.done);
      }}
      onDragStart={!isShared ? (e) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick', quickTaskId: task.id, fromIndex: localIdx }));
        e.dataTransfer.effectAllowed = 'move';
      } : undefined}
      onDragOver={!isShared ? (e) => e.preventDefault() : undefined}
      onDrop={!isShared ? (e) => {
        e.preventDefault();
        try {
          const p = JSON.parse(e.dataTransfer.getData('application/json'));
          const validTypes = ['quick'];
          if (!validTypes.includes(p.type)) {
            showToast?.('Puoi trascinare solo quick tasks qui', { type: 'warning' });
            return;
          }
          if (p.type === 'quick') {
            const targetLocalIdx = allQuickTasks.slice(0, idx).filter(t => !t.shareId).length;
            reorderQuickTasks(p.fromIndex, targetLocalIdx);
          } else {
            showToast?.('Elemento non valido per questa lista', { type: 'warning' });
          }
        } catch (err) {
          console.error('Drop error:', err);
          showToast?.('Errore durante il trascinamento', { type: 'error' });
        }
      } : undefined}
    >
      <span onClick={(e) => e.stopPropagation()}>
        <TaskCheckbox done={task.done} onClick={() => isShared ? toggleSharedQuickTask(task.shareId, task.id, !task.done) : toggleQuickTask(task.id, !task.done)} />
      </span>
      {/* Priority indicator */}
      <div
        className={`w-2 h-2 rounded-full shrink-0 ${priorityColors[priority]} ${isShared ? '' : 'cursor-pointer hover:scale-125'} transition-transform`}
        title={isShared ? `Priorità: ${priority} (non modificabile in condivisione)` : `Clicca per cambiare priorità: ${priority}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!isShared && updateQuickTask) {
            const priorities = ['low', 'medium', 'high'];
            const currentIdx = priorities.indexOf(priority);
            const nextPriority = priorities[(currentIdx + 1) % priorities.length];
            updateQuickTask(task.id, t => ({ ...t, priority: nextPriority }));
          }
        }}
      />
      <div className="flex flex-1 min-w-0 items-center gap-2">
        {quickTaskEditingId === taskId ? (
          <input
            autoFocus
            value={quickTaskEditingTitle}
            onChange={(e) => setQuickTaskEditingTitle(e.target.value)}
            onBlur={() => {
              const t = quickTaskEditingTitle.trim();
              if (t) (isShared ? updateSharedQuickTask(task.shareId, task.id, qt => ({ ...qt, title: t })) : updateQuickTask(task.id, qt => ({ ...qt, title: t })));
              setQuickTaskEditingId(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const t = quickTaskEditingTitle.trim();
                if (t) (isShared ? updateSharedQuickTask(task.shareId, task.id, qt => ({ ...qt, title: t })) : updateQuickTask(task.id, qt => ({ ...qt, title: t })));
                setQuickTaskEditingId(null);
              }
              if (e.key === 'Escape') setQuickTaskEditingId(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 outline-none dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-100"
          />
        ) : (
          <span
            onDoubleClick={(e) => {
              e.stopPropagation();
              setQuickTaskEditingId(taskId);
              setQuickTaskEditingTitle(task.title);
            }}
            title={task.title}
            className={`min-w-0 cursor-pointer select-text text-sm leading-relaxed break-words [overflow-wrap:anywhere] transition-colors ${task.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}
          >
            {task.title}
            {isShared && task.sharedTitle && (
              <span className="ml-1.5 text-xs text-zinc-400 bg-zinc-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">{task.sharedTitle}</span>
            )}
          </span>
        )}
        {task.deadline && quickTaskDeadlineEditing !== taskId && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setQuickTaskDeadlineInput(task.deadline || ''); setQuickTaskDeadlineEditing(taskId); }}
            className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-semibold border ${getDeadlineColorClass(task.deadline, task.done)}`}
          >
            {formatDeadline(task.deadline)}
          </button>
        )}
        {quickTaskDeadlineEditing === taskId && (
          <input
            type="date"
            autoFocus
            value={quickTaskDeadlineInput}
            onChange={(e) => setQuickTaskDeadlineInput(e.target.value)}
            onBlur={() => {
              (isShared ? updateSharedQuickTask(task.shareId, task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined })) : updateQuickTask(task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined })));
              setQuickTaskDeadlineEditing(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                (isShared ? updateSharedQuickTask(task.shareId, task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined })) : updateQuickTask(task.id, t => ({ ...t, deadline: quickTaskDeadlineInput.trim() || undefined })));
                setQuickTaskDeadlineEditing(null);
              }
              if (e.key === 'Escape') setQuickTaskDeadlineEditing(null);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-900 outline-none dark:border-white/[0.08] dark:bg-zinc-800 dark:text-zinc-100"
          />
        )}
      </div>
      <motion.div
        ref={barRef}
        className="flex items-center gap-0.5 touch-manipulation"
        initial={false}
        animate={{ opacity: showActions ? 1 : 0, x: showActions ? 0 : 10 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        {actions.map((act, i) => {
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
      </motion.div>
    </motion.div>
  );
}
