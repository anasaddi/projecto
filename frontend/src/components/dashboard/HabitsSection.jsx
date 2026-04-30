import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icons } from './Icons';
import { TaskCheckbox } from './DashboardComponents';
import { toDateKey, addDays, parseSelectedDate } from './DashboardUtils';
import { useDashboardStore } from '../../store/dashboardStore';
import { ThisWeekWidget } from './ThisWeekWidget';
import { Card, CardHeader, Badge, ActionButton } from './Card';
import { AddItemInputBar } from './AddItemInputBar';

function SortableHabitItem({ task, idx, todayTaskLog, isHovered, setHoveredHabitId, toggleDailyTask, habitEditingId, setHabitEditingId, setHabitEditingTitle, setDailyTaskTemplates, toggleHabitLock, toggleHabitInTimeline, removeDailyTask, dailyTaskLogs, now }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isLocked = task.locked;
  const isDone = todayTaskLog[task.id];
  const inTimeline = task.inTimeline !== false;

  // 7-day dot streak
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = addDays(now, -i);
      const key = toDateKey(d);
      const log = dailyTaskLogs[key] || [];
      const done = log.some(l => l.id === task.id && l.done);
      days.push({ date: key, done });
    }
    return days;
  }, [dailyTaskLogs, task.id, now]);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      key={task.id}
      layout
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: isLocked ? 0.72 : 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      onMouseEnter={() => setHoveredHabitId(task.id)}
      onMouseLeave={() => setHoveredHabitId(null)}
      className={`
        group ${isLocked ? 'hidden sm:flex' : 'flex'} items-center gap-2 rounded-2xl border border-transparent p-2.5 sm:p-3
        ${isLocked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}
        transition-colors duration-200
        ${isLocked
          ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30'
          : isHovered
            ? 'border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900'
            : 'bg-transparent'}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      {isLocked ? (
        <div className="w-4 flex justify-center">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
            <Icons.Lock className="h-3 w-3 text-amber-500 dark:text-amber-400" />
          </span>
        </div>
      ) : (
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
          <Icons.GripVertical className="h-4 w-4 text-zinc-500 dark:text-zinc-500" />
        </div>
      )}

      <TaskCheckbox 
        done={isDone} 
        className={isLocked ? 'opacity-50 cursor-not-allowed' : ''}
        onClick={() => !isLocked && toggleDailyTask(task.id, !isDone)} 
      />

      <div 
        className="flex flex-1 min-w-0 items-center"
        onClick={() => !isLocked && toggleDailyTask(task.id, !isDone)}
      >
        {habitEditingId === task.id ? (
          <input
            autoFocus
            value={habitEditingTitle}
            onChange={(e) => setHabitEditingTitle(e.target.value)}
            onBlur={() => { 
              const t = habitEditingTitle.trim(); 
              if (t) setDailyTaskTemplates(p => p.map(h => h.id === task.id ? { ...h, title: t } : h)); 
              setHabitEditingId(null); 
            }}
            onKeyDown={(e) => { 
              if (e.key === 'Enter') { 
                const t = habitEditingTitle.trim(); 
                if (t) setDailyTaskTemplates(p => p.map(h => h.id === task.id ? { ...h, title: t } : h)); 
                setHabitEditingId(null); 
              } 
              if (e.key === 'Escape') setHabitEditingId(null); 
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-900 outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <span
              onDoubleClick={(e) => { 
                e.stopPropagation(); 
                setHabitEditingId(task.id); 
                setHabitEditingTitle(task.title); 
              }}
              title={task.title}
              className={`cursor-pointer select-text text-sm leading-relaxed break-words [overflow-wrap:anywhere] transition-colors ${
                isLocked
                  ? 'text-zinc-500 dark:text-zinc-500 italic'
                  : isDone
                    ? 'text-zinc-500 line-through dark:text-zinc-500'
                    : 'text-zinc-700 dark:text-zinc-200'
              }`}
            >
              {task.title}
            </span>
            {/* 7-day dot streak */}
            <div className="flex gap-1 mt-1">
              {last7Days.map((d, i) => (
                <div
                  key={d.date}
                  className={`w-1.5 h-1.5 rounded-full ${d.done ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  title={d.date}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <motion.div 
        className="hidden md:flex items-center gap-0.5"
        initial={false}
        animate={{ 
          opacity: inTimeline || isHovered ? 1 : 0,
          x: inTimeline || isHovered ? 0 : 10
        }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.stopPropagation()}
      >
        <ActionButton 
          size="sm"
          title={inTimeline ? 'Rimuovi da Timeline' : 'Aggiungi a Timeline'}
          onClick={() => toggleHabitInTimeline(task.id)}
          className={inTimeline ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : ''}
        >
          <Icons.LayoutList className="h-3 w-3" />
        </ActionButton>
        
        <ActionButton 
          size="sm"
          title={isLocked ? 'Sblocca' : 'Blocca'}
          onClick={() => toggleHabitLock(task.id)}
          className={isLocked ? 'text-amber-500' : ''}
        >
          {isLocked ? <Icons.Lock className="h-3 w-3" /> : <Icons.Unlock className="h-3 w-3" />}
        </ActionButton>
        
        <ActionButton 
          size="sm"
          danger
          title="Elimina"
          onClick={() => removeDailyTask(task.id)}
        >
          <Icons.X className="h-3 w-3" />
        </ActionButton>
      </motion.div>
    </motion.div>
  );
}

export function HabitsSection() {
  const [hoveredHabitId, setHoveredHabitId] = useState(null);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
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
    toggleHabitInTimeline,
    removeDailyTask,
    reorderHabits
  } = store ?? {};

  const selectedDate = useDashboardStore((s) => s.selectedDate);
  const now = useMemo(() => parseSelectedDate(selectedDate, new Date()), [selectedDate]);
  const todayKey = useMemo(() => toDateKey(now), [now]);
  
  const todayTaskLog = useMemo(() => {
    const logs = dailyTaskLogs[todayKey] || [];
    const map = {};
    logs.forEach(l => map[l.id] = l.done);
    return map;
  }, [dailyTaskLogs, todayKey]);

  const lockedHabitsCollapsed = useDashboardStore((s) => s.lockedHabitsCollapsed);
  const setLockedHabitsCollapsed = useDashboardStore((s) => s.setLockedHabitsCollapsed);

  const activeHabits = useMemo(() => dailyTaskTemplates.filter((t) => !t.locked), [dailyTaskTemplates]);
  const lockedHabits = useMemo(() => dailyTaskTemplates.filter((t) => t.locked), [dailyTaskTemplates]);
  
  const visibleHabits = useMemo(() => {
    if (lockedHabitsCollapsed) return activeHabits;
    return dailyTaskTemplates;
  }, [dailyTaskTemplates, activeHabits, lockedHabitsCollapsed]);

  const todayDone = useMemo(() => activeHabits.reduce((acc, t) => acc + (todayTaskLog[t.id] ? 1 : 0), 0), [activeHabits, todayTaskLog]);

  const addHabit = () => {
    const t = habitDraft.trim();
    if (t) {
      setDailyTaskTemplates(p => [...p, { id: `daily-${Date.now()}`, title: t, locked: false, ordinal: p.length }]);
      setHabitDraft('');
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = dailyTaskTemplates.findIndex((task) => task.id === active.id);
      const newIndex = dailyTaskTemplates.findIndex((task) => task.id === over.id);
      reorderHabits(oldIndex, newIndex);
    }
  };

  return (
    <Card className="flex flex-col min-h-0 flex-1">
      <CardHeader
        icon={Icons.Flame}
        iconColor="text-sky-500"
        title="Abitudini"
        subtitle="Routine giornaliere"
        action={
          <div className="flex items-center gap-1.5">
            {lockedHabits.length > 0 && (
              <button
                onClick={() => setLockedHabitsCollapsed(!lockedHabitsCollapsed)}
                className={`p-1.5 rounded-lg transition-all ${lockedHabitsCollapsed ? 'bg-amber-500/10 text-amber-500' : 'text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/[0.06]'}`}
                title={lockedHabitsCollapsed ? "Mostra bloccate" : "Nascondi bloccate"}
              >
                {lockedHabitsCollapsed ? <Icons.EyeOff className="h-4 w-4" /> : <Icons.Eye className="h-4 w-4" />}
              </button>
            )}
            <Badge variant={todayDone === activeHabits.length && activeHabits.length > 0 ? 'success' : 'primary'} size="sm">
              {todayDone}/{activeHabits.length}
            </Badge>
          </div>
        }
      />

      <div className="p-4 pt-3 flex flex-col gap-2.5 sm:gap-3 flex-1 min-h-0 overflow-hidden">
        {/* Input */}
        <AddItemInputBar
          value={habitDraft}
          onChange={setHabitDraft}
          onSubmit={addHabit}
          placeholder="Nuova abitudine..."
          buttonColor="sky"
        />

        {/* Habits list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={visibleHabits} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1 flex-1 overflow-y-auto custom-scrollbar pr-0.5 sm:pr-1">
              <AnimatePresence mode="popLayout">
                {visibleHabits.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center gap-2 py-6 px-4 rounded-xl border-2 border-dashed border-zinc-200 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/[0.04] flex items-center justify-center">
                      <Icons.Flame className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nessuna abitudine</p>
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Aggiungi la tua prima routine</p>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {visibleHabits.map((task, idx) => (
                      <SortableHabitItem
                        key={task.id}
                        task={task}
                        idx={idx}
                        todayTaskLog={todayTaskLog}
                        isHovered={hoveredHabitId === task.id}
                        setHoveredHabitId={setHoveredHabitId}
                        toggleDailyTask={toggleDailyTask}
                        habitEditingId={habitEditingId}
                        setHabitEditingId={setHabitEditingId}
                        setHabitEditingTitle={setHabitEditingTitle}
                        setDailyTaskTemplates={setDailyTaskTemplates}
                        toggleHabitLock={toggleHabitLock}
                        toggleHabitInTimeline={toggleHabitInTimeline}
                        removeDailyTask={removeDailyTask}
                        dailyTaskLogs={dailyTaskLogs}
                        now={now}
                      />
                    ))}
                    {lockedHabitsCollapsed && lockedHabits.length > 0 && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => setLockedHabitsCollapsed(false)}
                        className="w-full py-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-amber-500 hover:bg-amber-500/5 rounded-xl transition-all border border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center gap-2 mt-1"
                      >
                        <Icons.Lock className="w-3 h-3" />
                        {lockedHabits.length} Abitudini Bloccate Nascoste
                      </motion.button>
                    )}
                  </>
                )}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      </div>
      
      <ThisWeekWidget dailyTaskLogs={dailyTaskLogs} activeHabits={activeHabits} now={now} />
    </Card>
  );
}
