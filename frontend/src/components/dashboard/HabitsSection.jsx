import React, { useMemo } from 'react';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { toDateKey } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { ThisWeekWidget } from './ThisWeekWidget';

export function HabitsSection() {
  const store = useDashboardStore();
  const {
    dailyTaskTemplates = [],
    setDailyTaskTemplates,
    dailyTaskLogs = {},
    habitDraft = '',
    setHabitDraft,
    toggleDailyTask,
    habitEditingId,
    setHabitEditingId,
    habitEditingTitle,
    setHabitEditingTitle,
    toggleHabitLock,
    removeDailyTask,
    reorderHabits
  } = store ?? {};

  const now = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(now), [now]);
  
  const todayTaskLog = useMemo(() => {
    const logs = dailyTaskLogs[todayKey] || [];
    const map = {};
    logs.forEach(l => map[l.id] = l.done);
    return map;
  }, [dailyTaskLogs, todayKey]);

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const todayDone = useMemo(() => activeHabits.reduce((acc, t) => acc + (todayTaskLog[t.id] ? 1 : 0), 0), [activeHabits, todayTaskLog]);

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
                setDailyTaskTemplates(p => [...p, { id: `daily-${Date.now()}`, title: t, locked: false, ordinal: p.length }]);
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
              setDailyTaskTemplates(p => [...p, { id: `daily-${Date.now()}`, title: t, locked: false, ordinal: p.length }]);
              setHabitDraft('');
            }
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-500 text-white transition-all hover:bg-sky-600 active:scale-95"
        >
          <Icons.Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex-1 min-h-[150px] overflow-y-auto custom-scrollbar">
        {dailyTaskTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-6 px-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
            <span className="text-2xl text-zinc-300 dark:text-zinc-600">◇</span>
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 text-center">Nessuna abitudine ancora</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">Scrivi sopra e premi Invio per aggiungerne una</span>
          </div>
        )}
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
                    title={task.title}
                    className={`cursor-pointer select-text text-sm leading-snug break-words line-clamp-2 ${isDone ? 'text-zinc-500 line-through dark:text-zinc-400' : 'text-zinc-700 dark:text-zinc-200'}`}
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
