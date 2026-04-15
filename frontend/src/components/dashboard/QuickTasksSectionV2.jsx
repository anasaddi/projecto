import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icons } from './Icons';
import { useDashboardStore } from '../../store/dashboardStore';
import { Card, CardHeader, Badge } from '../ui/CardV2';
import { Label, Text } from '../ui/Typography';
import { QuickTaskRow } from './QuickTaskRow';
import { AddItemInputBar } from './AddItemInputBar';

export function QuickTasksSectionV2() {
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
    reorderQuickTasks,
    promoteQuickTaskToProject
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
    <Card 
      variant="elevated" 
      radius="xl" 
      className="flex flex-col min-h-0"
      glow={doneCount === totalCount && totalCount > 0}
      glowColor="success"
    >
      <CardHeader
        icon={<Icons.Zap className="w-5 h-5 text-rose-500" />}
        iconColor="text-rose-500"
        title="Quick Tasks"
        subtitle="Task veloci senza progetto"
        action={
          <Badge variant={doneCount === totalCount && totalCount > 0 ? 'success' : 'danger'} size="md">
            {doneCount}/{totalCount}
          </Badge>
        }
        bordered={true}
      />
      
      <div className="p-4 pt-3 flex flex-col gap-3">
        {/* Input */}
        <AddItemInputBar
          value={quickTaskDraft}
          onChange={setQuickTaskDraft}
          onSubmit={() => addQuickTaskAction(quickTaskDraft)}
          placeholder="Aggiungi task veloce..."
          buttonColor="rose"
        />

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
                  promoteQuickTaskToProject={promoteQuickTaskToProject}
                />
              );
            })}
          </AnimatePresence>
          
          {allQuickTasks.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30"
            >
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                <Icons.Zap className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
              </div>
              <div className="text-center">
                <Label>Nessuna quick task</Label>
                <Text variant="body-sm" color="muted" className="mt-0.5">
                  Aggiungi task veloci sopra
                </Text>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Card>
  );
}

export default QuickTasksSectionV2;
