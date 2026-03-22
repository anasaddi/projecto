import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { uid, formatDeadline, getDeadlineColorClass, getDeadlinePastLabel } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { Card, CardHeader, Badge, ActionButton } from './Card';

export function QuickTasksSection() {
  const [hoveredTaskId, setHoveredTaskId] = useState(null);
  const store = useDashboardStore();
  const {
    quickTasks = [],
    sharedDashboards = [],
    quickTaskDraft = '',
    setQuickTaskDraft,
    addQuickTaskAction,
    quickTaskEditingId,
    setQuickTaskEditingId,
    quickTaskEditingTitle,
    setQuickTaskEditingTitle,
    quickTaskDeadlineEditing,
    setQuickTaskDeadlineEditing,
    quickTaskDeadlineInput,
    setQuickTaskDeadlineInput,
    toggleSharedQuickTask,
    toggleQuickTask,
    updateSharedQuickTask,
    updateQuickTask,
    top3Manual = [null, null, null],
    setTop3SlotAtIndex,
    removeSharedQuickTask,
    removeQuickTask,
    reorderQuickTasks
  } = store ?? {};

  const allQuickTasks = useMemo(() => {
    const local = quickTasks.filter(t => !t.parentId).map(t => ({ ...t, shareId: null }));
    const fromShared = sharedDashboards.flatMap(sd => {
      const list = Array.isArray((sd.data || {}).quickTasks) ? (sd.data || {}).quickTasks : [];
      return list.filter(t => !t.parentId).map(t => ({ ...t, shareId: sd.share_id, sharedTitle: sd.title }));
    });
    return [...local, ...fromShared];
  }, [quickTasks, sharedDashboards]);

  const doneCount = allQuickTasks.filter(t => t.done).length;
  const totalCount = allQuickTasks.length;

  const addQuickTask = (e) => {
    if (e.key === 'Enter') {
      addQuickTaskAction(quickTaskDraft);
    }
  };

  const isPinned = (task) => {
    return top3Manual.some(s => s && s.quickTaskId === task.id && (task.shareId ? s.shareId === task.shareId : !s.shareId));
  };

  return (
    <Card className="flex flex-col min-h-0" glow={doneCount === totalCount && totalCount > 0}>
      <CardHeader
        icon={Icons.Zap}
        iconColor="text-rose-500"
        title="Quick Tasks"
        subtitle="Task veloci senza progetto"
        action={
          <Badge variant={doneCount === totalCount && totalCount > 0 ? 'success' : 'danger'} size="sm">
            {doneCount}/{totalCount}
          </Badge>
        }
      />
      
      <div className="p-4 pt-2 flex flex-col gap-2">
        {/* Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickTaskDraft}
              onChange={(e) => setQuickTaskDraft(e.target.value)}
              onKeyDown={addQuickTask}
              placeholder="Aggiungi task veloce..."
              className="w-full py-2 px-3 pr-9 text-sm rounded-xl bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/[0.06] outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-400/50 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 hidden sm:block">
              ↵
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => addQuickTaskAction(quickTaskDraft)}
            disabled={!quickTaskDraft.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 transition-all hover:shadow-xl hover:shadow-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icons.Plus className="h-5 w-5" />
          </motion.button>
        </div>

        {/* Tasks list */}
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
          <AnimatePresence mode="popLayout">
            {allQuickTasks.map((task, idx) => {
              const isShared = !!task.shareId;
              const localIdx = isShared ? -1 : quickTasks.filter(t => !t.parentId).findIndex(t => t.id === task.id);
              const pinned = isPinned(task);
              const isHovered = hoveredTaskId === (isShared ? `shared-${task.shareId}-${task.id}` : task.id);
              
              return (
                <motion.div
                  key={isShared ? `shared-${task.shareId}-${task.id}` : task.id}
                  layout
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, x: -20 }}
                  transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                  className={`
                    group relative flex items-center gap-2 p-2 rounded-xl
                    ${task.done ? 'opacity-75' : 'opacity-100'}
                    ${!isShared ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
                    transition-colors duration-200
                    ${isHovered ? 'bg-zinc-100 dark:bg-white/[0.04]' : 'bg-transparent'}
                    hover:bg-zinc-100 dark:hover:bg-white/[0.04]
                  `}
                  draggable={!isShared}
                  onMouseEnter={() => setHoveredTaskId(isShared ? `shared-${task.shareId}-${task.id}` : task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  onClick={(e) => {
                    if (e.target.closest('button') || e.target.closest('input')) return;
                    isShared ? toggleSharedQuickTask(task.shareId, task.id, !task.done) : toggleQuickTask(task.id, !task.done);
                  }}
                  onDragStart={!isShared ? (e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick', quickTaskId: task.id, fromIndex: localIdx }));
                    e.dataTransfer.effectAllowed = 'move';
                  } : undefined}
                  onDragOver={!isShared ? (e) => {
                    e.preventDefault();
                  } : undefined}
                  onDrop={!isShared ? (e) => {
                    e.preventDefault();
                    try {
                      const p = JSON.parse(e.dataTransfer.getData('application/json'));
                      if (p.type === 'quick') {
                        const targetLocalIdx = allQuickTasks.slice(0, idx).filter(t => !t.shareId).length;
                        reorderQuickTasks(p.fromIndex, targetLocalIdx);
                      }
                    } catch (_) { }
                  } : undefined}
                >
                  {/* Checkbox */}
                  <span onClick={(e) => e.stopPropagation()}>
                    <TaskCheckbox 
                      done={task.done} 
                      onClick={() => isShared ? toggleSharedQuickTask(task.shareId, task.id, !task.done) : toggleQuickTask(task.id, !task.done)} 
                    />
                  </span>

                  {/* Content */}
                  <div className="flex flex-1 min-w-0 items-center gap-2">
                    {quickTaskEditingId === (isShared ? `shared-${task.shareId}-${task.id}` : task.id) ? (
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
                        className="flex-1 py-1 px-2 text-sm rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] outline-none focus:ring-2 focus:ring-rose-500/30"
                      />
                    ) : (
                      <span
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setQuickTaskEditingId(isShared ? `shared-${task.shareId}-${task.id}` : task.id);
                          setQuickTaskEditingTitle(task.title);
                        }}
                        title={task.title}
                        className={`cursor-pointer select-text text-sm leading-snug break-words line-clamp-2 min-w-0 transition-colors ${task.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}
                      >
                        {task.title}
                        {isShared && task.sharedTitle && (
                          <span className="ml-1.5 text-[10px] text-zinc-400 bg-zinc-100 dark:bg-white/[0.06] px-1.5 py-0.5 rounded">
                            {task.sharedTitle}
                          </span>
                        )}
                      </span>
                    )}
                    
                    {/* Deadline badge */}
                    {task.deadline && quickTaskDeadlineEditing !== (isShared ? `shared-${task.shareId}-${task.id}` : task.id) && (
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuickTaskDeadlineInput(task.deadline || '');
                          setQuickTaskDeadlineEditing(isShared ? `shared-${task.shareId}-${task.id}` : task.id);
                        }} 
                        className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${getDeadlineColorClass(task.deadline, task.done)}`}
                      >
                        {formatDeadline(task.deadline)}
                      </button>
                    )}
                    
                    {quickTaskDeadlineEditing === (isShared ? `shared-${task.shareId}-${task.id}` : task.id) && (
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
                        className="w-28 py-1 px-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-white/[0.08] outline-none focus:ring-2 focus:ring-rose-500/30"
                      />
                    )}
                  </div>

                  {/* Actions */}
                  <motion.div 
                    className="flex items-center gap-0.5"
                    initial={false}
                    animate={{ 
                      opacity: pinned || isHovered ? 1 : 0,
                      x: pinned || isHovered ? 0 : 10
                    }}
                    transition={{ duration: 0.15 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!task.deadline && quickTaskDeadlineEditing !== (isShared ? `shared-${task.shareId}-${task.id}` : task.id) && (
                      <ActionButton 
                        size="sm" 
                        title="Scadenza"
                        onClick={() => {
                          setQuickTaskDeadlineInput('');
                          setQuickTaskDeadlineEditing(isShared ? `shared-${task.shareId}-${task.id}` : task.id);
                        }}
                      >
                        <Icons.Calendar className="h-3 w-3" />
                      </ActionButton>
                    )}
                    
                    <ActionButton 
                      size="sm" 
                      title={pinned ? "Rimuovi dai Top 3" : "Aggiungi ai Top 3"}
                      onClick={() => {
                        const existingIdx = top3Manual.findIndex(s => s && s.quickTaskId === task.id && (isShared ? s.shareId === task.shareId : !s.shareId));
                        if (existingIdx !== -1) {
                          setTop3SlotAtIndex(existingIdx, null);
                        } else {
                          const free = top3Manual.findIndex(s => !s);
                          if (free !== -1) setTop3SlotAtIndex(free, { quickTaskId: task.id, shareId: isShared ? task.shareId : null });
                        }
                      }}
                      className={pinned ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : ''}
                    >
                      <Icons.Target className="h-3 w-3" />
                    </ActionButton>
                    
                    <ActionButton 
                      size="sm" 
                      danger
                      title="Elimina"
                      onClick={() => isShared ? removeSharedQuickTask(task.shareId, task.id) : removeQuickTask(task.id)}
                    >
                      <Icons.X className="h-3 w-3" />
                    </ActionButton>
                  </motion.div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {allQuickTasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] flex items-center justify-center">
                <Icons.Zap className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="text-center">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nessuna quick task</p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">Aggiungi task veloci sopra</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Card>
  );
}
