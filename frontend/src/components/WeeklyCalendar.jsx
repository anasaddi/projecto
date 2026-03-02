import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import { snapCenterToCursor } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Zap, Target, Dumbbell, Pencil, Trash2, X } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

// Palette muscoli - leggermente sobria
const muscleColors = {
  chest: { bg: 'bg-red-50/80 dark:bg-red-500/15', border: 'border-red-300/80 dark:border-red-500/35', text: 'text-red-700/90 dark:text-red-300', dot: 'bg-red-400' },
  upper_chest: { bg: 'bg-rose-50/80 dark:bg-rose-500/10', border: 'border-rose-300/80 dark:border-rose-500/30', text: 'text-rose-700/90 dark:text-rose-300', dot: 'bg-rose-400' },
  lats: { bg: 'bg-emerald-50/80 dark:bg-emerald-500/10', border: 'border-emerald-300/80 dark:border-emerald-500/30', text: 'text-emerald-700/90 dark:text-emerald-300', dot: 'bg-emerald-500' },
  rhomboids: { bg: 'bg-teal-50/80 dark:bg-teal-500/10', border: 'border-teal-300/80 dark:border-teal-500/30', text: 'text-teal-700/90 dark:text-teal-300', dot: 'bg-teal-500' },
  traps: { bg: 'bg-cyan-50/80 dark:bg-cyan-500/10', border: 'border-cyan-300/80 dark:border-cyan-500/30', text: 'text-cyan-700/90 dark:text-cyan-300', dot: 'bg-cyan-500' },
  anterior_delts: { bg: 'bg-violet-50/80 dark:bg-violet-500/10', border: 'border-violet-300/80 dark:border-violet-500/30', text: 'text-violet-700/90 dark:text-violet-300', dot: 'bg-violet-500' },
  lateral_delts: { bg: 'bg-indigo-50/80 dark:bg-indigo-500/10', border: 'border-indigo-300/80 dark:border-indigo-500/30', text: 'text-indigo-700/90 dark:text-indigo-300', dot: 'bg-indigo-500' },
  rear_delts: { bg: 'bg-fuchsia-50/80 dark:bg-fuchsia-500/10', border: 'border-fuchsia-300/80 dark:border-fuchsia-500/30', text: 'text-fuchsia-700/90 dark:text-fuchsia-300', dot: 'bg-fuchsia-500' },
  biceps: { bg: 'bg-lime-50/80 dark:bg-lime-500/10', border: 'border-lime-300/80 dark:border-lime-500/30', text: 'text-lime-700/90 dark:text-lime-300', dot: 'bg-lime-500' },
  brachialis: { bg: 'bg-green-50/80 dark:bg-green-500/10', border: 'border-green-300/80 dark:border-green-500/30', text: 'text-green-700/90 dark:text-green-300', dot: 'bg-green-500' },
  triceps: { bg: 'bg-sky-50/80 dark:bg-sky-500/10', border: 'border-sky-300/80 dark:border-sky-500/30', text: 'text-sky-700/90 dark:text-sky-300', dot: 'bg-sky-500' },
  forearms: { bg: 'bg-orange-50/80 dark:bg-orange-500/10', border: 'border-orange-300/80 dark:border-orange-500/30', text: 'text-orange-700/90 dark:text-orange-300', dot: 'bg-orange-500' },
  brachioradialis: { bg: 'bg-amber-50/80 dark:bg-amber-500/10', border: 'border-amber-300/80 dark:border-amber-500/30', text: 'text-amber-700/90 dark:text-amber-300', dot: 'bg-amber-500' },
  quads: { bg: 'bg-yellow-50/80 dark:bg-yellow-500/10', border: 'border-yellow-300/80 dark:border-yellow-500/30', text: 'text-yellow-700/90 dark:text-yellow-300', dot: 'bg-yellow-500' },
  glutes: { bg: 'bg-pink-50/80 dark:bg-pink-500/10', border: 'border-pink-300/80 dark:border-pink-500/30', text: 'text-pink-700/90 dark:text-pink-300', dot: 'bg-pink-500' },
  core: { bg: 'bg-stone-50/80 dark:bg-stone-500/10', border: 'border-stone-300/80 dark:border-stone-500/30', text: 'text-stone-700/90 dark:text-stone-300', dot: 'bg-stone-500' },
  lower_back: { bg: 'bg-neutral-50/80 dark:bg-neutral-500/10', border: 'border-neutral-300/80 dark:border-neutral-500/30', text: 'text-neutral-700/90 dark:text-neutral-300', dot: 'bg-neutral-500' },
  pronators: { bg: 'bg-orange-50/80 dark:bg-orange-500/10', border: 'border-orange-300/80 dark:border-orange-500/30', text: 'text-orange-700/90 dark:text-orange-300', dot: 'bg-orange-500' },
  supinators: { bg: 'bg-amber-50/80 dark:bg-amber-500/10', border: 'border-amber-300/80 dark:border-amber-500/30', text: 'text-amber-700/90 dark:text-amber-300', dot: 'bg-amber-500' },
  wrist_extensors: { bg: 'bg-yellow-50/80 dark:bg-yellow-500/10', border: 'border-yellow-300/80 dark:border-yellow-500/30', text: 'text-yellow-700/90 dark:text-yellow-300', dot: 'bg-yellow-500' },
  wrist_flexors: { bg: 'bg-yellow-50/80 dark:bg-yellow-500/10', border: 'border-yellow-300/80 dark:border-yellow-500/30', text: 'text-yellow-700/90 dark:text-yellow-300', dot: 'bg-yellow-500' },
};

const defaultColor = { bg: 'bg-slate-50/80 dark:bg-zinc-800/60', border: 'border-slate-300/80 dark:border-zinc-600/60', text: 'text-slate-700 dark:text-zinc-300', dot: 'bg-slate-400' };

// Colonne giorno 120px, sidebar sinistra 120px, calendario centrato
const DAY_COLUMN_WIDTH = 120;
const LEFT_COLUMN_WIDTH = 120;
const CARD_MIN_WIDTH = 105;
const CALENDAR_WIDTH = LEFT_COLUMN_WIDTH + DAY_COLUMN_WIDTH * 6; // 840

function getExerciseColor(exercise) {
  const primary = exercise.primary_muscles || [];
  if (primary.length === 0) return defaultColor;
  
  const key = primary[0].toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
  const color = muscleColors[key] || defaultColor;
  
  return { ...color, muscles: primary, isMulti: primary.length > 1 };
}

function SortableExerciseCard({ exercise, dayTemplateId, onEdit, onDelete, isOverlay }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: exercise.unique_id,
    data: { exercise }
  });

  const color = getExerciseColor(exercise);
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    minWidth: `${CARD_MIN_WIDTH}px`,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative group min-h-[64px] w-full shrink-0 rounded-xl border border-gray-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900/90
        shadow-sm hover:shadow-md dark:shadow-black/20 dark:hover:shadow-xl dark:hover:shadow-blue-500/5 transition-all duration-200 select-none
        flex flex-col justify-between p-2
        ${isOverlay ? 'cursor-grabbing scale-105 shadow-lg z-50 ring-2 ring-blue-400/50 dark:ring-blue-400/40' : 'cursor-grab'}
      `}
      title={exercise.exercise_name}
    >
      {/* Accent border top - elegant gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${color.dot} rounded-t-xl opacity-80`} />

      {/* Action buttons - top right, floating (no drag button) */}
      <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 z-10">
        {!isOverlay && onEdit && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit?.(exercise); }} className="p-0.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 bg-white/90 dark:bg-zinc-800/95 rounded shadow-sm dark:border dark:border-zinc-600/50 transition-colors cursor-pointer">
            <Pencil size={10} />
          </button>
        )}
        {!isOverlay && onDelete && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete?.(exercise, dayTemplateId); }} className="p-0.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 bg-white/90 dark:bg-zinc-800/95 rounded shadow-sm dark:border dark:border-zinc-600/50 transition-colors cursor-pointer">
            <Trash2 size={10} />
          </button>
        )}
      </div>

      {/* Exercise name - full width */}
      <div className="font-semibold text-[11px] text-gray-900 dark:text-gray-100 leading-snug break-words mt-0.5 pr-4 flex-1 min-w-0 tracking-tight select-none">
        {exercise.exercise_name}
      </div>

      {/* Muscle badge - compact with truncation */}
      <div className={`flex items-center gap-1 px-1 py-0.5 rounded text-[7px] font-medium mt-auto min-w-0 max-w-full ${color.bg} ${color.text} border ${color.border}`}>
        <span className={`w-1 h-1 rounded-full shrink-0 ${color.dot}`} />
        <span className="truncate">{color.muscles.join(' + ')}</span>
      </div>
    </div>
  );
}

function DayHeader({ day, isSelected, onClick }) {
  return (
    <div 
      onClick={() => onClick?.(day)}
      style={{ minWidth: `${DAY_COLUMN_WIDTH}px`, minHeight: '70px' }}
      className={`
        h-[50px] px-2 py-1.5 flex flex-col justify-center cursor-pointer transition-all border-b
        ${isSelected 
          ? 'bg-blue-50/50 dark:bg-blue-500/15 border-b-2 border-b-blue-500 dark:border-b-blue-400' 
          : 'bg-white dark:bg-zinc-950 border-b-gray-200 dark:border-b-zinc-800/80 hover:bg-gray-50/80 dark:hover:bg-zinc-900/80'}
      `}
    >
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 shrink-0">
          Day {day.weekday + 1}
        </span>
        <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-semibold shrink-0 border border-transparent dark:border-zinc-700/50">
          {day.exercises.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mt-auto min-w-0">
        {day.exercises.filter(e => e.category === 'STRENGTH').length > 0 && (
          <span className="text-[7px] px-1 py-0.5 rounded bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium border border-transparent dark:border-blue-500/25">
            STRENGTH
          </span>
        )}
        {day.exercises.filter(e => e.category === 'AW').length > 0 && (
          <span className="text-[7px] px-1 py-0.5 rounded bg-amber-100/80 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-medium border border-transparent dark:border-amber-500/25">
            AW
          </span>
        )}
        {day.exercises.filter(e => e.category === 'HYPERTROPHY').length > 0 && (
          <span className="text-[7px] px-1 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium border border-transparent dark:border-emerald-500/25">
            HYPER
          </span>
        )}
      </div>
    </div>
  );
}

function RowHeader({ icon: Icon, label, desc, colorClass }) {
  const colorMap = {
    blue: 'bg-blue-500 text-white',
    amber: 'bg-amber-500 text-white',
    emerald: 'bg-emerald-500 text-white',
  };
  
  return (
    <div
      style={{ width: `${LEFT_COLUMN_WIDTH}px` }}
      className="shrink-0 p-2 border-r border-gray-200/60 dark:border-zinc-800/60 bg-gray-50/50 dark:bg-zinc-950 flex flex-col justify-center relative"
    >
      <div className="relative z-10 flex flex-col gap-1">
        <div className={`w-5 h-5 rounded-md flex items-center justify-center shadow-sm ${colorMap[colorClass]}`}>
          <Icon size={11} />
        </div>
        <div>
          <h3 className="text-[11px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">{label}</h3>
          <p className="text-[9px] text-gray-500 dark:text-gray-400 font-medium leading-tight mt-0.5">{desc}</p>
        </div>
      </div>
      {/* Decal background icon */}
      <Icon size={44} className="absolute -right-1.5 -bottom-1.5 opacity-[0.03] text-gray-900 dark:text-white pointer-events-none" />
    </div>
  );
}

function EditExerciseModal({ exercise, onSave, onClose }) {
  const [customName, setCustomName] = useState(exercise.exercise_name ?? '');
  const [instruction, setInstruction] = useState(exercise.instruction ?? '');
  const [baseSets, setBaseSets] = useState(String(exercise.base_sets ?? 4));
  const [baseReps, setBaseReps] = useState(exercise.base_reps != null ? String(exercise.base_reps) : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(
      customName.trim() || null,
      instruction.trim() || null,
      parseInt(baseSets, 10) || 4,
      baseReps ? parseInt(baseReps, 10) : null
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-md"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-modal-title"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900/95 shadow-xl dark:shadow-none border border-gray-200/80 dark:border-zinc-700/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/50">
          <h2 id="edit-modal-title" className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            Modifica esercizio
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-200/80 dark:hover:bg-zinc-700/80 transition-colors"
            aria-label="Chiudi"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="edit-custom-name" className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
              Nome (titolo)
            </label>
            <input
              id="edit-custom-name"
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 text-sm placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50 dark:focus:ring-blue-400/30 transition-shadow"
              placeholder="Nome esercizio"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="edit-instruction" className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
              Istruzione
            </label>
            <input
              id="edit-instruction"
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 text-sm placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50 dark:focus:ring-blue-400/30 transition-shadow"
              placeholder="es. Wendler 5/3/1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="edit-base-sets" className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
                Serie
              </label>
              <input
                id="edit-base-sets"
                type="number"
                min={1}
                max={20}
                value={baseSets}
                onChange={(e) => setBaseSets(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50"
              />
            </div>
            <div>
              <label htmlFor="edit-base-reps" className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">
                Reps
              </label>
              <input
                id="edit-base-reps"
                type="number"
                min={1}
                max={50}
                value={baseReps}
                onChange={(e) => setBaseReps(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50"
                placeholder="—"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-xl shadow-sm hover:shadow transition-all"
            >
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DroppableCell({ id, isSelected, onClick, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div 
      ref={setNodeRef}
      onClick={onClick}
      className={`
        p-1 transition-colors cursor-pointer min-h-[94px] flex flex-col gap-1
        ${isSelected ? 'bg-blue-50/50 dark:bg-blue-500/10' : 'bg-transparent hover:bg-gray-50/50 dark:hover:bg-zinc-900/50'}
        ${isOver ? 'ring-inset ring-2 ring-blue-400/50 dark:ring-blue-400/40 bg-blue-50/60 dark:bg-blue-500/15' : ''}
      `}
    >
      {children}
    </div>
  );
}

function addUniqueIds(data) {
  return data.map(d => ({
    ...d,
    exercises: d.exercises.map((ex, idx) => ({
      ...ex,
      unique_id: `${d.template_id}-${ex.exercise_id}-${idx}`,
      dayId: d.template_id
    }))
  }));
}

export default function WeeklyCalendar({ onDaySelect, selectedDayId, initialDays }) {
  const [days, setDays] = useState(() => (initialDays?.length ? addUniqueIds(initialDays) : []));
  const [activeExercise, setActiveExercise] = useState(null);
  const [editModal, setEditModal] = useState(null); // { exercise, dayTemplateId }

  useEffect(() => {
    if (initialDays?.length) {
      setDays(addUniqueIds(initialDays));
      return;
    }
    api.training.getWeek().then(data => setDays(addUniqueIds(data)));
  }, [initialDays]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDelete = (exercise, dayTemplateId) => {
    setDays((prev) => {
      const newDays = prev.map((d) =>
        d.template_id === dayTemplateId
          ? { ...d, exercises: d.exercises.filter((e) => e.unique_id !== exercise.unique_id) }
          : d
      );
      api.training.updateWeek(newDays.map((d) => ({
        template_id: d.template_id,
        exercises: d.exercises.map((e) => ({
          exercise_id: e.exercise_id,
          custom_name: e.exercise_name?.trim() || null,
          instruction: e.instruction ?? null,
          base_sets: e.category === 'HYPERTROPHY' ? 2 : (e.base_sets ?? 4),
          base_reps: e.base_reps ?? null,
        })),
      })));
      return newDays;
    });
  };

  const handleEdit = (exercise) => {
    const day = days.find((d) => d.exercises.some((e) => e.unique_id === exercise.unique_id));
    if (day) setEditModal({ exercise, dayTemplateId: day.template_id });
  };

  const handleEditSave = async (custom_name, instruction, base_sets, base_reps) => {
    if (!editModal) return;
    await api.training.updateDayExercise({
      template_id: editModal.dayTemplateId,
      exercise_id: editModal.exercise.exercise_id,
      custom_name: custom_name?.trim() || null,
      instruction: instruction?.trim() || null,
      base_sets: base_sets != null ? base_sets : undefined,
      base_reps: base_reps != null ? base_reps : undefined,
    });
    setDays((prev) =>
      prev.map((d) => {
        if (d.template_id !== editModal.dayTemplateId) return d;
        return {
          ...d,
          exercises: d.exercises.map((e) =>
            e.exercise_id === editModal.exercise.exercise_id
              ? { ...e, exercise_name: custom_name?.trim() || e.exercise_name, instruction: instruction ?? e.instruction, base_sets: base_sets ?? e.base_sets, base_reps: base_reps ?? e.base_reps }
              : e
          ),
        };
      })
    );
    setEditModal(null);
  };

  const handleDragStart = (event) => {
    const { active } = event;
    const activeData = active.data.current?.exercise;
    setActiveExercise(activeData);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Se stiamo trascinando sopra la stessa card, non fare nulla
    if (activeId === overId) return;

    // Trova i container
    const activeContainer = days.find(d => d.exercises.some(e => e.unique_id === activeId))?.template_id;
    
    // Il bersaglio può essere un'altra card (unique_id) o una cella vuota (cell-day_id-row_key)
    let overContainer = null;
    let overRowKey = null;

    if (String(overId).startsWith('cell-')) {
      const parts = String(overId).split('-');
      overRowKey = parts.pop(); // ultimo elemento
      overContainer = parts.slice(1).join('-'); // il resto è il day_id
    } else {
      const overDay = days.find(d => d.exercises.some(e => e.unique_id === overId));
      if (overDay) {
        overContainer = overDay.template_id;
        const overExercise = overDay.exercises.find(e => e.unique_id === overId);
        overRowKey = rowConfigs.find(r => r.filter(overExercise))?.key;
      }
    }

    if (!activeContainer || !overContainer) return;

    // Per semplicità, limitiamo il drag&drop solo all'interno della stessa riga (stessa categoria)
    // Non permettiamo di trascinare un esercizio FORZA nella riga IPERTROFIA.
    const activeDay = days.find(d => d.template_id === activeContainer);
    const activeExercise = activeDay.exercises.find(e => e.unique_id === activeId);
    const activeRowKey = rowConfigs.find(r => r.filter(activeExercise))?.key;

    if (activeRowKey !== overRowKey) return;

    // Se siamo su container diversi ma stessa riga, spostiamo la card
    if (activeContainer !== overContainer) {
      setDays((prev) => {
        const activeItems = prev.find(d => d.template_id === activeContainer).exercises;
        const overItems = prev.find(d => d.template_id === overContainer).exercises;
        
        const activeIndex = activeItems.findIndex(e => e.unique_id === activeId);
        const overIndex = overItems.findIndex(e => e.unique_id === overId);

        let newIndex;
        if (String(overId).startsWith('cell-')) {
          newIndex = overItems.length; // Aggiungi in fondo se su cella vuota
        } else {
          const isBelowOverItem = over && active.rect.current.translated && active.rect.current.translated.top > over.rect.top + over.rect.height;
          const modifier = isBelowOverItem ? 1 : 0;
          newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        return prev.map(d => {
          if (d.template_id === activeContainer) return { ...d, exercises: d.exercises.filter(e => e.unique_id !== activeId) };
          if (d.template_id === overContainer) {
            const newExercises = [...d.exercises];
            newExercises.splice(newIndex, 0, activeItems[activeIndex]);
            return { ...d, exercises: newExercises };
          }
          return d;
        });
      });
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveExercise(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = days.find(d => d.exercises.some(e => e.unique_id === activeId))?.template_id;
    let overContainer = null;
    let overRowKey = null;

    if (String(overId).startsWith('cell-')) {
      const parts = String(overId).split('-');
      overRowKey = parts.pop();
      overContainer = parts.slice(1).join('-');
    } else {
      const overDay = days.find(d => d.exercises.some(e => e.unique_id === overId));
      if (overDay) {
        overContainer = overDay.template_id;
        const overExercise = overDay.exercises.find(e => e.unique_id === overId);
        overRowKey = rowConfigs.find(r => r.filter(overExercise))?.key;
      }
    }

    if (!activeContainer || !overContainer) return;

    const activeDay = days.find(d => d.template_id === activeContainer);
    const activeExercise = activeDay.exercises.find(e => e.unique_id === activeId);
    const activeRowKey = rowConfigs.find(r => r.filter(activeExercise))?.key;

    if (activeRowKey !== overRowKey) return;

    setDays((prev) => {
      let newDays = [...prev];
      if (activeContainer === overContainer) {
        const dayIndex = prev.findIndex(d => d.template_id === activeContainer);
        const day = prev[dayIndex];
        const oldIndex = day.exercises.findIndex(e => e.unique_id === activeId);
        // Se dropped su cella, mettiamo in fondo, altrimenti troviamo index
        const newIndex = String(overId).startsWith('cell-') ? day.exercises.length - 1 : day.exercises.findIndex(e => e.unique_id === overId);

        if (oldIndex !== newIndex && newIndex !== -1) {
          newDays[dayIndex] = { ...day, exercises: arrayMove(day.exercises, oldIndex, newIndex) };
        }
      }
      
      // Update backend in either case
      api.training.updateWeek(newDays.map(d => ({
        template_id: d.template_id,
        exercises: d.exercises.map(e => ({
          exercise_id: e.exercise_id,
          custom_name: e.exercise_name?.trim() || null,
          instruction: e.instruction ?? null,
          base_sets: e.category === 'HYPERTROPHY' ? 2 : (e.base_sets ?? 4),
          base_reps: e.base_reps ?? null,
        })),
      })));
      return newDays;
    });
  };

  if (!days.length) return null;

  const rowConfigs = [
    { key: 'strength', label: 'FORZA', desc: 'Progressione multiarticolare pesi liberi', filter: e => e.category === 'STRENGTH', color: 'blue', icon: Zap },
    { key: 'aw', label: 'ARMWRESTLING', desc: 'Tavolo, iso, volume, speed', filter: e => e.category === 'AW', color: 'amber', icon: Target },
    { key: 'hypertrophy', label: 'IPERTROFIA', desc: 'Isolamento, volume e varianza', filter: e => e.category === 'HYPERTROPHY', color: 'emerald', icon: Dumbbell },
  ];

  return (
    <div className="w-full flex justify-center overflow-x-auto overflow-y-hidden">
      <div className="shrink-0 rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 shadow-sm dark:shadow-black/30 overflow-visible" style={{ width: `${CALENDAR_WIDTH}px` }}>
        <div className="w-full">
          {/* Calendar Header Row */}
          <div className="flex border-b border-gray-200/80 dark:border-zinc-800/80">
            <div
              style={{ width: `${LEFT_COLUMN_WIDTH}px` }}
              className="shrink-0 bg-gray-50/50 dark:bg-zinc-950 border-r border-gray-200/60 dark:border-zinc-800/60 flex items-center px-2"
            >
            </div>
            <div className="flex-1 grid grid-cols-6 divide-x divide-gray-200/60 dark:divide-gray-800/60" style={{ gridTemplateColumns: `repeat(6, ${DAY_COLUMN_WIDTH}px)` }}>
              {days.map(day => (
                <DayHeader 
                  key={day.template_id}
                  day={day} 
                  isSelected={selectedDayId === day.template_id}
                  onClick={onDaySelect}
                />
              ))}
            </div>
          </div>

          {/* Draggable Rows */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
            <div className="flex flex-col">
              {rowConfigs.map((row, idx) => (
                <div key={row.key} className="flex border-b last:border-b-0 border-gray-200/60 dark:border-zinc-800/60">
                  <RowHeader label={row.label} desc={row.desc} colorClass={row.color} icon={row.icon} />
                  
                  <div className="flex-1 grid grid-cols-6 divide-x divide-gray-200/60 dark:divide-zinc-800/60" style={{ gridTemplateColumns: `repeat(6, ${DAY_COLUMN_WIDTH}px)` }}>
                    {days.map(day => {
                      const exercises = day.exercises.filter(row.filter);
                      const isSelected = selectedDayId === day.template_id;
                      
                      return (
                        <DroppableCell 
                          key={`cell-${day.template_id}-${row.key}`}
                          id={`cell-${day.template_id}-${row.key}`}
                          isSelected={isSelected}
                          onClick={() => onDaySelect?.(day)}
                        >
                          <SortableContext items={exercises.map(e => e.unique_id)} strategy={horizontalListSortingStrategy}>
                            <div className="h-full flex flex-col gap-2">
                              {(() => {
                                // Raggruppa esercizi AW per volume
                                const groups = [];
                                const processed = new Set();
                                
                                // Trova esercizi Volume 1
                                const vol1Exercises = exercises.filter(e => e.exercise_id?.startsWith('aw_v1_'));
                                if (vol1Exercises.length > 0) {
                                  groups.push({
                                    type: 'vol1',
                                    id: `${day.template_id}-vol1`,
                                    exercise: {
                                      unique_id: `${day.template_id}-vol1`,
                                      exercise_id: 'aw_vol_1',
                                      exercise_name: 'AW Vol.1 (Pressure & Chop)',
                                      category: 'AW',
                                      primary_muscles: ['forearms', 'pronators'],
                                      instruction: `${vol1Exercises.length} esercizi`
                                    },
                                    count: vol1Exercises.length
                                  });
                                  vol1Exercises.forEach(e => processed.add(e.unique_id));
                                }
                                
                                // Trova esercizi Volume 2
                                const vol2Exercises = exercises.filter(e => e.exercise_id?.startsWith('aw_v2_'));
                                if (vol2Exercises.length > 0) {
                                  groups.push({
                                    type: 'vol2',
                                    id: `${day.template_id}-vol2`,
                                    exercise: {
                                      unique_id: `${day.template_id}-vol2`,
                                      exercise_id: 'aw_vol_2',
                                      exercise_name: 'AW Vol.2 (Cupping & Supination)',
                                      category: 'AW',
                                      primary_muscles: ['supinators', 'forearms', 'wrist_flexors'],
                                      instruction: `${vol2Exercises.length} esercizi`
                                    },
                                    count: vol2Exercises.length
                                  });
                                  vol2Exercises.forEach(e => processed.add(e.unique_id));
                                }
                                
                                // Aggiungi esercizi AW singoli (non di volume)
                                exercises.forEach(ex => {
                                  if (!processed.has(ex.unique_id)) {
                                    groups.push({ type: 'single', exercise: ex });
                                  }
                                });
                                
                                return groups.map((group, idx) => (
                                  <SortableExerciseCard
                                    key={group.exercise.unique_id}
                                    exercise={group.exercise}
                                    dayTemplateId={day.template_id}
                                    onEdit={group.type === 'single' ? handleEdit : null}
                                    onDelete={group.type === 'single' ? handleDelete : null}
                                  />
                                ));
                              })()}
                              {exercises.length === 0 && (
                                <div className="flex-1 min-h-[44px] border-2 border-dashed border-gray-200/60 dark:border-zinc-700/60 rounded-xl flex items-center justify-center opacity-40 hover:opacity-70 dark:bg-zinc-900/20 transition-opacity">
                                  <span className="text-[8px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Drop here</span>
                                </div>
                              )}
                            </div>
                          </SortableContext>
                        </DroppableCell>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
              {activeExercise ? <SortableExerciseCard exercise={activeExercise} isOverlay /> : null}
            </DragOverlay>
          </DndContext>

          {/* Edit modal */}
          {editModal && (
            <EditExerciseModal
              exercise={editModal.exercise}
              onSave={handleEditSave}
              onClose={() => setEditModal(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}