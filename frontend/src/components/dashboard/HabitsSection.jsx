import React from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { ThisWeekWidget } from './ThisWeekWidget';
import { uid } from './DashboardUtils';

export function HabitsSection({
  dailyTaskTemplates,
  setDailyTaskTemplates,
  todayDone,
  activeHabits,
  habitDraft,
  setHabitDraft,
  todayTaskLog,
  toggleDailyTask,
  habitEditingId,
  setHabitEditingId,
  habitEditingTitle,
  setHabitEditingTitle,
  toggleHabitLock,
  removeDailyTask,
  reorderHabits,
  dailyTaskLogs,
  now
}) {
  return (
    <div className="dashboard-panel flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <h3 className="flex items-center gap-2 dashboard-section-title text-sky-500 dark:text-sky-400">
          <Icons.Flame className="w-3.5 h-3.5" /> Habits
        </h3>
        <span className="text-[10px] font-bold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full">{todayDone}/{activeHabits.length}</span>
      </div>

      <div className="mb-2 flex shrink-0 gap-1.5">
        <input
          value={habitDraft}
          onChange={(e) => setHabitDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              const t = habitDraft.trim();
              if (t) {
                setDailyTaskTemplates(p => [...p, { id: uid('daily'), title: t, locked: false }]);
                setHabitDraft('');
              }
            }
          }}
          placeholder="Nuova abitudine..."
          className="dashboard-input flex-1 py-1.5 text-sm"
        />
        <button
          onClick={() => {
            const t = habitDraft.trim();
            if (t) {
              setDailyTaskTemplates(p => [...p, { id: uid('daily'), title: t, locked: false }]);
              setHabitDraft('');
            }
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white transition-all hover:bg-sky-600 active:scale-95"
        >
          <Icons.Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 min-h-[150px] overflow-y-auto custom-scrollbar">
        {dailyTaskTemplates.map((task, idx) => {
          const isLocked = task.locked;
          const isDone = todayTaskLog[task.id];
          return (
            <div
              key={task.id}
              data-habit-index={idx}
              draggable={!isLocked}
              onDragStart={(e) => { e.dataTransfer.setData('application/json', JSON.stringify({ type: 'habit', fromIndex: idx })); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-zinc-50'); }}
              onDragLeave={(e) => e.currentTarget.classList.remove('bg-zinc-50')}
              onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-zinc-50'); try { const p = JSON.parse(e.dataTransfer.getData('application/json')); if (p.type === 'habit') reorderHabits(p.fromIndex, idx); } catch (_) { } }}
              className={`group task-row ${isLocked ? 'opacity-40' : 'cursor-grab active:cursor-grabbing'}`}
            >
              <TaskCheckbox done={isDone} onClick={() => !isLocked && toggleDailyTask(task.id, !isDone)} />

              <div className="flex flex-1 min-w-0 items-center" onClick={() => !isLocked && toggleDailyTask(task.id, !isDone)}>
                {habitEditingId === task.id ? (
                  <input
                    autoFocus
                    value={habitEditingTitle}
                    onChange={(e) => setHabitEditingTitle(e.target.value)}
                    onBlur={() => { const t = habitEditingTitle.trim(); if (t) setDailyTaskTemplates(p => p.map(h => h.id === task.id ? { ...h, title: t } : h)); setHabitEditingId(null); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { const t = habitEditingTitle.trim(); if (t) setDailyTaskTemplates(p => p.map(h => h.id === task.id ? { ...h, title: t } : h)); setHabitEditingId(null); } if (e.key === 'Escape') setHabitEditingId(null); }}
                    onClick={(e) => e.stopPropagation()}
                    className="seamless-input text-sm text-zinc-800 dark:text-zinc-100"
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => { e.stopPropagation(); setHabitEditingId(task.id); setHabitEditingTitle(task.title); }}
                    className={`cursor-pointer select-text text-sm leading-none ${isDone ? 'text-zinc-400 line-through' : 'text-zinc-700 dark:text-zinc-200'}`}
                  >
                    {task.title}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => toggleHabitLock(task.id)} className={`dashboard-action-btn p-1 ${isLocked ? 'text-amber-500' : 'hover:text-amber-500'}`} title={isLocked ? 'Sblocca' : 'Blocca'}>
                  <Icons.Lock className="h-3 w-3" />
                </button>
                <button type="button" onClick={() => removeDailyTask(task.id)} className="dashboard-action-btn p-1 hover:text-red-500" title="Elimina">
                  <Icons.X className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <ThisWeekWidget dailyTaskLogs={dailyTaskLogs} activeHabits={activeHabits} now={now} />
    </div>
  );
}
