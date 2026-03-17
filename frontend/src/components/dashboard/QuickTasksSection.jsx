import React, { useMemo } from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { uid, formatDeadline, getDeadlineColorClass, getDeadlinePastLabel } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';

export function QuickTasksSection() {
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

  const addQuickTask = (e) => {
    if (e.key === 'Enter') {
      addQuickTaskAction(quickTaskDraft);
    }
  };

  return (
    <div className="dashboard-panel flex min-h-0 shrink-0 flex-col overflow-hidden px-4 py-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 dashboard-section-title text-rose-500 dark:text-rose-400">
          <Icons.CheckCircle className="w-3.5 h-3.5" /> Quick Tasks
        </h3>
        <span className="text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
          {allQuickTasks.filter(t => t.done).length}/{allQuickTasks.length}
        </span>
      </div>

      <div className="mb-2 flex gap-1.5">
        <input
          type="text"
          value={quickTaskDraft}
          onChange={(e) => setQuickTaskDraft(e.target.value)}
          onKeyDown={addQuickTask}
          placeholder="Nuova quick task... (Invio)"
          className="dashboard-input flex-1 py-1.5 text-sm"
        />
        <button
          onClick={() => addQuickTaskAction(quickTaskDraft)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500 text-white transition-all hover:bg-rose-600 active:scale-95"
        >
          <Icons.Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="max-h-36 sm:max-h-48 overflow-y-auto custom-scrollbar">
        {allQuickTasks.map((task, idx) => {
          const isShared = !!task.shareId;
          const localIdx = isShared ? -1 : quickTasks.filter(t => !t.parentId).findIndex(t => t.id === task.id);
          return (
            <div
              key={isShared ? `shared-${task.shareId}-${task.id}` : task.id}
              className={`group task-row flex items-center gap-2 ${isShared ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} cursor-pointer`}
              draggable={!isShared}
              onClick={(e) => {
                if (e.target.closest('button') || e.target.closest('input') || e.target.closest('[data-no-row-toggle]')) return;
                isShared ? toggleSharedQuickTask(task.shareId, task.id, !task.done) : toggleQuickTask(task.id, !task.done);
              }}
              onDragStart={!isShared ? (e) => {
                e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick', quickTaskId: task.id, fromIndex: localIdx }));
                e.dataTransfer.effectAllowed = 'move';
              } : undefined}
              onDragOver={!isShared ? (e) => {
                e.preventDefault();
                e.currentTarget.classList.add('bg-zinc-50');
              } : undefined}
              onDragLeave={!isShared ? (e) => e.currentTarget.classList.remove('bg-zinc-50') : undefined}
              onDrop={!isShared ? (e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('bg-zinc-50');
                try {
                  const p = JSON.parse(e.dataTransfer.getData('application/json'));
                  if (p.type === 'quick') {
                    const targetLocalIdx = allQuickTasks.slice(0, idx).filter(t => !t.shareId).length;
                    reorderQuickTasks(p.fromIndex, targetLocalIdx);
                  }
                } catch (_) { }
              } : undefined}
            >
              <span data-no-row-toggle className="shrink-0" onClick={(e) => e.stopPropagation()}>
                <TaskCheckbox done={task.done} onClick={() => isShared ? toggleSharedQuickTask(task.shareId, task.id, !task.done) : toggleQuickTask(task.id, !task.done)} />
              </span>

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
                    className="seamless-input text-sm text-zinc-800 dark:text-zinc-100"
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      setQuickTaskEditingId(isShared ? `shared-${task.shareId}-${task.id}` : task.id);
                      setQuickTaskEditingTitle(task.title);
                    }}
                    title={task.title}
                    className={`cursor-pointer select-text text-sm leading-snug break-words line-clamp-2 min-w-0 ${task.done ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}
                  >
                    {task.title}
                    {isShared && task.sharedTitle && <span className="ml-1 text-[9px] text-zinc-400">({task.sharedTitle})</span>}
                  </span>
                )}
                {task.deadline && quickTaskDeadlineEditing !== (isShared ? `shared-${task.shareId}-${task.id}` : task.id) && (
                  <span className="shrink-0 flex items-center gap-1">
                    <button type="button" onClick={(e) => {
                      e.stopPropagation();
                      setQuickTaskDeadlineInput(task.deadline || '');
                      setQuickTaskDeadlineEditing(isShared ? `shared-${task.shareId}-${task.id}` : task.id);
                    }} className={`rounded px-1.5 py-0.5 text-[10px] ${getDeadlineColorClass(task.deadline, task.done)}`}>
                      {formatDeadline(task.deadline)}
                    </button>
                    {getDeadlinePastLabel(task.deadline) && !task.done && (
                      <span className="text-[9px] font-bold text-red-500 dark:text-red-400" title="Scaduta">Scaduta</span>
                    )}
                  </span>
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
                    className="dashboard-input w-28 py-0.5 text-xs"
                  />
                )}
              </div>

              {/* Actions al hover */}
              <div data-no-row-toggle className={`flex items-center gap-0.5 transition-opacity ${top3Manual.some(s => s && s.quickTaskId === task.id && (isShared ? s.shareId === task.shareId : !s.shareId)) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={(e) => e.stopPropagation()}>
                {!task.deadline && quickTaskDeadlineEditing !== (isShared ? `shared-${task.shareId}-${task.id}` : task.id) && (
                  <button type="button" onClick={() => {
                    setQuickTaskDeadlineInput('');
                    setQuickTaskDeadlineEditing(isShared ? `shared-${task.shareId}-${task.id}` : task.id);
                  }} className="dashboard-action-btn p-1 hover:text-amber-500" title="Scadenza">
                    <Icons.Calendar className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const existingIdx = top3Manual.findIndex(s => s && s.quickTaskId === task.id && (isShared ? s.shareId === task.shareId : !s.shareId));
                    if (existingIdx !== -1) {
                      setTop3SlotAtIndex(existingIdx, null);
                    } else {
                      const free = top3Manual.findIndex(s => !s);
                      if (free !== -1) setTop3SlotAtIndex(free, { quickTaskId: task.id, shareId: isShared ? task.shareId : null });
                    }
                  }}
                  className={`dashboard-action-btn p-1 ${top3Manual.some(s => s && s.quickTaskId === task.id && (isShared ? s.shareId === task.shareId : !s.shareId)) ? 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 rounded' : 'hover:text-amber-500'}`}
                  title={top3Manual.some(s => s && s.quickTaskId === task.id && (isShared ? s.shareId === task.shareId : !s.shareId)) ? "Rimuovi dai Top 3" : "Pin to Focus"}
                >
                  <Icons.Target className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => isShared ? removeSharedQuickTask(task.shareId, task.id) : removeQuickTask(task.id)} className="dashboard-action-btn p-1 hover:text-red-500" title="Elimina">
                  <Icons.X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
        {allQuickTasks.length === 0 && (
          <div className="relative overflow-hidden min-h-[4rem] rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/[0.08] flex flex-col items-center justify-center gap-1 py-4 px-4 bg-zinc-50/50 dark:bg-white/[0.02]">
            <span className="text-2xl text-zinc-300 dark:text-zinc-600">✓</span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">Aggiungi la tua prima quick task sopra</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">oppure trascina qui da Life Goals</span>
          </div>
        )}
      </div>
    </div>
  );
}
