import React from 'react';
import { motion } from 'framer-motion';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { formatDeadline, getDeadlineColorClass } from './DashboardUtils';
import { useLongPressActions } from '../../hooks/useLongPressActions';
import { useToast } from '../../context/ToastContext';

export function QuickTaskRow({
  task, isShared, localIdx, idx, pinned, isHovered,
  allQuickTasks, setHoveredTaskId,
  toggleQuickTask, toggleSharedQuickTask,
  quickTaskEditingId, setQuickTaskEditingId, quickTaskEditingTitle, setQuickTaskEditingTitle,
  updateQuickTask, updateSharedQuickTask,
  top3Manual, setTop3SlotAtIndex,
  removeQuickTask, removeSharedQuickTask,
  reorderQuickTasks, promoteQuickTaskToProject,
}) {
  const showToast = useToast();
  const taskId = isShared ? `shared-${task.shareId}-${task.id}` : task.id;
  const isFocusActive = false;
  
  const priority = task.priority || 'medium';
  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-zinc-400',
  };
  const actions = [
    {
      icon: <Icons.Target className="h-3 w-3" />,
      onClick: () => {
        const existingIdx = top3Manual.findIndex(s => s && s.quickTaskId === task.id && (isShared ? s.shareId === task.shareId : !s.shareId));
        if (existingIdx !== -1) setTop3SlotAtIndex(existingIdx, null);
        else { const free = top3Manual.findIndex(s => !s); if (free !== -1) setTop3SlotAtIndex(free, { quickTaskId: task.id, shareId: isShared ? task.shareId : null }); }
      },
      title: pinned ? 'Rimuovi dai Top 3' : 'Aggiungi ai Top 3',
      className: pinned
        ? '!rounded-full !bg-transparent !shadow-none !ring-0 !p-1 text-amber-500 hover:!bg-transparent dark:text-amber-300'
        : '!rounded-full !bg-transparent !shadow-none !ring-0 !p-1 text-amber-400 hover:!bg-transparent hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300',
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
        const payload = { type: 'quick', quickTaskId: task.id, fromIndex: localIdx };
        const raw = JSON.stringify(payload);
        e.dataTransfer.setData('application/x-quick', raw);
        e.dataTransfer.setData('application/x-projecto-drag', raw);
        e.dataTransfer.setData('application/json', raw);
        e.dataTransfer.setData('text/plain', raw);
        e.dataTransfer.effectAllowed = 'move';
      } : undefined}
      onDragOver={!isShared ? (e) => {
        if (e.dataTransfer.types.includes('application/x-quick')) e.preventDefault();
      } : undefined}
      onDrop={!isShared ? (e) => {
        if (!e.dataTransfer.types.includes('application/x-quick')) return;
        e.preventDefault();
        try {
          const p = JSON.parse(e.dataTransfer.getData('application/x-quick'));
          const targetLocalIdx = allQuickTasks.slice(0, idx).filter(t => !t.shareId).length;
          reorderQuickTasks(p.fromIndex, targetLocalIdx);
        } catch (err) {
          console.error('Drop error:', err);
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
            className={`min-w-0 flex-1 cursor-pointer text-sm font-semibold leading-snug truncate transition-colors ${task.done ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-200'}`}
          >
            {task.title}
            {isShared && task.sharedTitle && (
              <span className="ml-1.5 text-xs text-zinc-400 bg-zinc-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">{task.sharedTitle}</span>
            )}
          </span>
        )}
        {task.deadline && (
          <span className={`shrink-0 px-2 py-0.5 rounded-lg text-xs font-semibold border ${getDeadlineColorClass(task.deadline, task.done)}`}>
            {formatDeadline(task.deadline)}
          </span>
        )}
      </div>
      <motion.div
        ref={barRef}
        className="flex items-center gap-0.5 touch-manipulation shrink-0 overflow-hidden"
        initial={false}
        animate={{
          opacity: showActions ? 1 : 0,
          width: showActions ? 'auto' : 0,
          marginLeft: showActions ? undefined : 0,
        }}
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
