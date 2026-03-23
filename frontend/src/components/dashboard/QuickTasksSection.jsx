import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { useDashboardStore } from '../../store/dashboardStore';
import { Card, CardHeader, Badge } from './Card';
import { QuickTaskRow } from './QuickTaskRow';

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
      
      <div className="p-5 pt-4 flex flex-col gap-3">
        {/* Input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={quickTaskDraft}
              onChange={(e) => setQuickTaskDraft(e.target.value)}
              onKeyDown={addQuickTask}
              placeholder="Aggiungi task veloce..."
              className="w-full rounded-2xl border border-zinc-200/70 bg-zinc-100/85 px-4 py-3 pr-9 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-100 dark:placeholder:text-zinc-500"
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
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 transition-all hover:shadow-xl hover:shadow-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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
                <QuickTaskRow
                  key={isShared ? `shared-${task.shareId}-${task.id}` : task.id}
                  task={task}
                  isShared={isShared}
                  localIdx={localIdx}
                  idx={idx}
                  pinned={pinned}
                  isHovered={isHovered}
                  allQuickTasks={allQuickTasks}
                  setHoveredTaskId={setHoveredTaskId}
                  toggleQuickTask={toggleQuickTask}
                  toggleSharedQuickTask={toggleSharedQuickTask}
                  quickTaskEditingId={quickTaskEditingId}
                  setQuickTaskEditingId={setQuickTaskEditingId}
                  quickTaskEditingTitle={quickTaskEditingTitle}
                  setQuickTaskEditingTitle={setQuickTaskEditingTitle}
                  quickTaskDeadlineEditing={quickTaskDeadlineEditing}
                  setQuickTaskDeadlineInput={setQuickTaskDeadlineInput}
                  setQuickTaskDeadlineEditing={setQuickTaskDeadlineEditing}
                  quickTaskDeadlineInput={quickTaskDeadlineInput}
                  updateQuickTask={updateQuickTask}
                  updateSharedQuickTask={updateSharedQuickTask}
                  top3Manual={top3Manual}
                  setTop3SlotAtIndex={setTop3SlotAtIndex}
                  removeQuickTask={removeQuickTask}
                  removeSharedQuickTask={removeSharedQuickTask}
                  reorderQuickTasks={reorderQuickTasks}
                />
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
