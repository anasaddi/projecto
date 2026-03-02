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
import { GripHorizontal, Zap, Target, Dumbbell, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

// Mappatura esercizio → muscoli (sostituisce primary_muscles dal DB)
const EXERCISE_MUSCLE_MAP = {
  curl_str: ['biceps', 'brachiale_brachioradiale'],
  mp_str: ['anterior_delts', 'lateral_delts', 'triceps'],
  bp_str: ['anterior_delts', 'chest', 'triceps'],
  sq_str: ['core', 'glutes', 'lower_back', 'quads'],
  plank: ['core', 'lower_back'],
  crunch: ['core'],
  leg_raise: ['core'],
  ab_wheel: ['core', 'lower_back'],
  cable_crunch: ['core'],
  pu_str: ['biceps', 'brachiale_brachioradiale', 'finger_flexors', 'lats', 'rear_delts', 'rhomboids', 'traps'],
  bulgarian: ['glutes', 'quads'],
  flyes: ['chest'],
  conc_curl: ['biceps'],
  curl_ez: ['biceps', 'brachiale_brachioradiale'],
  dips: ['anterior_delts', 'chest', 'triceps'],
  overhead_ext: ['triceps'],
  ez_bar_reverse_curl: ['brachiale_brachioradiale', 'wrist_extensors'],
  jm_press: ['side_pressure', 'triceps'],
  lat_machine: ['brachiale_brachioradiale', 'lats', 'rhomboids'],
  single_lat_pull: ['lats', 'rhomboids', 'traps'],
  mil_db: ['anterior_delts', 'chest', 'lateral_delts', 'triceps'],
  bp_el: ['anterior_delts', 'chest', 'triceps'],
  bp_pause: ['anterior_delts', 'chest', 'triceps'],
  inc_db_press: ['anterior_delts', 'chest', 'triceps'],
  pulley: ['brachiale_brachioradiale', 'lats', 'rhomboids', 'traps'],
  single_pushdown: ['triceps'],
  high_row: ['rear_delts', 'rhomboids', 'traps'],
  front_raise: ['anterior_delts'],
  lat_raise: ['lateral_delts'],
  lat_raise_light: ['lateral_delts'],
  rear_raise: ['rear_delts'],
  sq_hypertrophy: ['glutes', 'quads'],
  aw_v1_back_press: ['brachiale_brachioradiale'],
  aw_v1_dita: ['finger_flexors'],
  aw_v1_side_press: ['side_pressure'],
  aw_v1_ulnar_chop: ['ulnar_deviation'],
  aw_v1_wrist_wrench: ['finger_flexors', 'wrist_flexors'],
  aw_v2_cupping: ['wrist_flexors'],
  aw_v2_pronazione: ['pronators'],
  aw_v2_rev_pron: ['pronators'],
  aw_v2_rising: ['radial_deviation'],
  aw_v2_supination: ['supinators'],
  aw_max_defense_hook: ['biceps', 'side_pressure'],
  aw_max_dita_maniglia: ['finger_flexors'],
  aw_max_dita_mazurenko: ['finger_flexors', 'wrist_flexors'],
  aw_max_high_multi_drag: ['finger_flexors', 'lats', 'pronators', 'radial_deviation', 'wrist_flexors'],
  aw_max_high_multi_side: ['pronators', 'radial_deviation', 'side_pressure', 'wrist_flexors'],
  aw_max_lat_drag: ['finger_flexors', 'lats', 'wrist_flexors'],
  aw_max_low_multi_drag: ['finger_flexors', 'lats', 'ulnar_deviation', 'wrist_flexors'],
  aw_max_low_multi_side: ['side_pressure', 'supinators', 'ulnar_deviation', 'wrist_flexors'],
  aw_max_low_pronation_45: ['brachiale_brachioradiale', 'pronators', 'side_pressure'],
  aw_max_press: ['side_pressure', 'supinators', 'triceps', 'ulnar_deviation', 'wrist_flexors'],
  aw_max_pronation_45: ['brachiale_brachioradiale', 'side_pressure', 'supinators'],
  aw_max_rising_45: ['brachiale_brachioradiale', 'radial_deviation', 'side_pressure'],
  aw_light_bicipite: ['biceps'],
  aw_light_cup_drag: ['finger_flexors', 'lats', 'wrist_flexors'],
  aw_light_mazurenko_dita: ['finger_flexors', 'wrist_flexors'],
  aw_light_press: ['triceps'],
  aw_light_pronation_45: ['brachiale_brachioradiale', 'pronators', 'side_pressure'],
  aw_light_rising_back: ['brachiale_brachioradiale', 'radial_deviation'],
  aw_light_side_supination: ['side_pressure', 'supinators'],
  aw_heavy_bicipite: ['biceps'],
  aw_heavy_cup_drag: ['wrist_flexors'],
  aw_heavy_mazurenko_dita: ['wrist_flexors'],
  aw_heavy_press: ['triceps'],
  aw_heavy_pronation_45: ['brachiale_brachioradiale', 'pronators', 'side_pressure'],
  aw_heavy_rising_back: ['brachiale_brachioradiale'],
  aw_heavy_side_supination: ['side_pressure', 'supinators'],
  aw_speed_high_multi_side: ['pronators', 'radial_deviation', 'side_pressure', 'wrist_flexors'],
  aw_speed_lat_cup: ['lats', 'wrist_flexors'],
  aw_speed_low_multi_side: ['side_pressure', 'supinators', 'ulnar_deviation', 'wrist_flexors'],
  aw_speed_pronation_45: ['brachiale_brachioradiale', 'pronators', 'side_pressure'],
  aw_vol_1: ['brachiale_brachioradiale', 'finger_flexors', 'side_pressure', 'ulnar_deviation', 'wrist_flexors'],
  aw_vol_2: ['wrist_flexors', 'pronators', 'radial_deviation', 'supinators'],
  aw_max:   ['biceps', 'brachiale_brachioradiale', 'finger_flexors', 'lats', 'pronators', 'radial_deviation', 'side_pressure', 'supinators', 'triceps', 'ulnar_deviation', 'wrist_flexors'],
  aw_iso_l: ['biceps', 'brachiale_brachioradiale', 'finger_flexors', 'side_pressure', 'supinators', 'triceps', 'wrist_flexors'],
  aw_iso_h: ['biceps', 'brachiale_brachioradiale', 'side_pressure', 'supinators', 'triceps', 'wrist_flexors'],
  aw_speed: ['brachiale_brachioradiale', 'lats', 'pronators', 'radial_deviation', 'side_pressure', 'supinators', 'ulnar_deviation', 'wrist_flexors'],
};

// Palette muscoli - colori più vividi e moderni
const muscleColors = {
  chest: { bg: 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-500/20 dark:to-orange-500/15', border: 'border-red-200 dark:border-red-500/40', text: 'text-red-700 dark:text-red-200', dot: 'bg-gradient-to-br from-red-400 to-red-500' },
  upper_chest: { bg: 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-500/20 dark:to-pink-500/15', border: 'border-rose-200 dark:border-rose-500/40', text: 'text-rose-700 dark:text-rose-200', dot: 'bg-gradient-to-br from-rose-400 to-rose-500' },
  lats: { bg: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/20 dark:to-teal-500/15', border: 'border-emerald-200 dark:border-emerald-500/40', text: 'text-emerald-700 dark:text-emerald-200', dot: 'bg-gradient-to-br from-emerald-400 to-emerald-600' },
  rhomboids: { bg: 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-500/20 dark:to-cyan-500/15', border: 'border-teal-200 dark:border-teal-500/40', text: 'text-teal-700 dark:text-teal-200', dot: 'bg-gradient-to-br from-teal-400 to-teal-500' },
  traps: { bg: 'bg-gradient-to-r from-cyan-50 to-sky-50 dark:from-cyan-500/20 dark:to-sky-500/15', border: 'border-cyan-200 dark:border-cyan-500/40', text: 'text-cyan-700 dark:text-cyan-200', dot: 'bg-gradient-to-br from-cyan-400 to-cyan-500' },
  anterior_delts: { bg: 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-500/20 dark:to-purple-500/15', border: 'border-violet-200 dark:border-violet-500/40', text: 'text-violet-700 dark:text-violet-200', dot: 'bg-gradient-to-br from-violet-400 to-violet-500' },
  lateral_delts: { bg: 'bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-500/20 dark:to-blue-500/15', border: 'border-indigo-200 dark:border-indigo-500/40', text: 'text-indigo-700 dark:text-indigo-200', dot: 'bg-gradient-to-br from-indigo-400 to-indigo-500' },
  rear_delts: { bg: 'bg-gradient-to-r from-fuchsia-50 to-pink-50 dark:from-fuchsia-500/20 dark:to-pink-500/15', border: 'border-fuchsia-200 dark:border-fuchsia-500/40', text: 'text-fuchsia-700 dark:text-fuchsia-200', dot: 'bg-gradient-to-br from-fuchsia-400 to-fuchsia-500' },
  biceps: { bg: 'bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-500/20 dark:to-green-500/15', border: 'border-lime-200 dark:border-lime-500/40', text: 'text-lime-700 dark:text-lime-200', dot: 'bg-gradient-to-br from-lime-400 to-lime-500' },
  brachialis: { bg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/20 dark:to-emerald-500/15', border: 'border-green-200 dark:border-green-500/40', text: 'text-green-700 dark:text-green-200', dot: 'bg-gradient-to-br from-green-400 to-green-500' },
  triceps: { bg: 'bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-500/20 dark:to-blue-500/15', border: 'border-sky-200 dark:border-sky-500/40', text: 'text-sky-700 dark:text-sky-200', dot: 'bg-gradient-to-br from-sky-400 to-sky-500' },
  forearms: { bg: 'bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-500/20 dark:to-amber-500/15', border: 'border-orange-200 dark:border-orange-500/40', text: 'text-orange-700 dark:text-orange-200', dot: 'bg-gradient-to-br from-orange-400 to-orange-500' },
  brachioradialis: { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/20 dark:to-yellow-500/15', border: 'border-amber-200 dark:border-amber-500/40', text: 'text-amber-700 dark:text-amber-200', dot: 'bg-gradient-to-br from-amber-400 to-amber-500' },
  quads: { bg: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-500/20 dark:to-amber-500/15', border: 'border-yellow-200 dark:border-yellow-500/40', text: 'text-yellow-700 dark:text-yellow-200', dot: 'bg-gradient-to-br from-yellow-400 to-yellow-500' },
  glutes: { bg: 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/20 dark:to-rose-500/15', border: 'border-pink-200 dark:border-pink-500/40', text: 'text-pink-700 dark:text-pink-200', dot: 'bg-gradient-to-br from-pink-400 to-pink-500' },
  core: { bg: 'bg-gradient-to-r from-stone-50 to-gray-50 dark:from-stone-500/20 dark:to-gray-500/15', border: 'border-stone-200 dark:border-stone-500/40', text: 'text-stone-700 dark:text-stone-200', dot: 'bg-gradient-to-br from-stone-400 to-stone-500' },
  lower_back: { bg: 'bg-gradient-to-r from-neutral-50 to-gray-50 dark:from-neutral-500/20 dark:to-gray-500/15', border: 'border-neutral-200 dark:border-neutral-500/40', text: 'text-neutral-700 dark:text-neutral-200', dot: 'bg-gradient-to-br from-neutral-400 to-neutral-500' },
  pronators: { bg: 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/20 dark:to-red-500/15', border: 'border-orange-200 dark:border-orange-500/40', text: 'text-orange-700 dark:text-orange-200', dot: 'bg-gradient-to-br from-orange-400 to-orange-500' },
  supinators: { bg: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/15', border: 'border-amber-200 dark:border-amber-500/40', text: 'text-amber-700 dark:text-amber-200', dot: 'bg-gradient-to-br from-amber-400 to-amber-500' },
  wrist_extensors: { bg: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-500/20 dark:to-orange-500/15', border: 'border-yellow-200 dark:border-yellow-500/40', text: 'text-yellow-700 dark:text-yellow-200', dot: 'bg-gradient-to-br from-yellow-400 to-yellow-500' },
  wrist_flexors: { bg: 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-500/20 dark:to-orange-500/15', border: 'border-yellow-200 dark:border-yellow-500/40', text: 'text-yellow-700 dark:text-yellow-200', dot: 'bg-gradient-to-br from-yellow-400 to-yellow-500' },
  side_pressure: { bg: 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-500/20 dark:to-red-500/15', border: 'border-orange-200 dark:border-orange-500/40', text: 'text-orange-700 dark:text-orange-200', dot: 'bg-gradient-to-br from-orange-400 to-orange-500' },
  finger_flexors: { bg: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/15', border: 'border-amber-200 dark:border-amber-500/40', text: 'text-amber-700 dark:text-amber-200', dot: 'bg-gradient-to-br from-amber-400 to-amber-500' },
  ulnar_deviation: { bg: 'bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-500/20 dark:to-red-500/15', border: 'border-rose-200 dark:border-rose-500/40', text: 'text-rose-700 dark:text-rose-200', dot: 'bg-gradient-to-br from-rose-400 to-rose-500' },
  radial_deviation: { bg: 'bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-500/20 dark:to-yellow-500/15', border: 'border-amber-200 dark:border-amber-500/40', text: 'text-amber-700 dark:text-amber-200', dot: 'bg-gradient-to-br from-amber-400 to-amber-500' },
  brachiale_brachioradiale: { bg: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/20 dark:to-emerald-500/15', border: 'border-green-200 dark:border-green-500/40', text: 'text-green-700 dark:text-green-200', dot: 'bg-gradient-to-br from-green-400 to-green-500' },
};

const defaultColor = { bg: 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/60 dark:to-gray-800/60', border: 'border-slate-200 dark:border-slate-600/60', text: 'text-slate-700 dark:text-slate-200', dot: 'bg-gradient-to-br from-slate-400 to-slate-500' };

const MUSCLE_GROUP_MAP = {
  chest: 'petto', upper_chest: 'petto',
  lats: 'schiena', rhomboids: 'schiena', traps: 'schiena', lower_back: 'schiena',
  anterior_delts: 'spalle', lateral_delts: 'spalle', rear_delts: 'spalle',
  biceps: 'bicipiti', brachialis: 'bicipiti', brachioradialis: 'avambracci', brachiale_brachioradiale: 'bicipiti',
  triceps: 'tricipiti',
  forearms: 'avambracci', pronators: 'avambracci', supinators: 'avambracci',
  wrist_extensors: 'avambracci', wrist_flexors: 'avambracci', finger_flexors: 'avambracci',
  ulnar_deviation: 'avambracci', radial_deviation: 'avambracci', side_pressure: 'avambracci',
  quads: 'gambe', glutes: 'gambe', core: 'core'
};
const GROUP_PRIORITY = { schiena: 1, petto: 2, gambe: 3, spalle: 4, bicipiti: 5, tricipiti: 6, avambracci: 7, core: 8 };
const GROUP_ACCENT_DOT = {
  petto: 'bg-gradient-to-br from-red-400 to-red-500',
  schiena: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  spalle: 'bg-gradient-to-br from-violet-400 to-violet-500',
  bicipiti: 'bg-gradient-to-br from-lime-400 to-lime-500',
  tricipiti: 'bg-gradient-to-br from-sky-400 to-sky-500',
  avambracci: 'bg-gradient-to-br from-orange-400 to-orange-500',
  gambe: 'bg-gradient-to-br from-pink-400 to-pink-500',
  core: 'bg-gradient-to-br from-stone-400 to-stone-500',
};
const defaultGroupAccent = 'bg-gradient-to-br from-slate-400 to-slate-500';

const MUSCLE_LABELS = {
  chest: 'Petto', upper_chest: 'Alto petto', lats: 'Laterali', rhomboids: 'Romboidi', traps: 'Trapezi',
  anterior_delts: 'Deltoidi anteriori', lateral_delts: 'Deltoidi laterali', rear_delts: 'Deltoidi posteriori',
  biceps: 'Bicipiti', brachialis: 'Brachiale', brachioradialis: 'Brachioradiale', brachiale_brachioradiale: 'Brachio',
  triceps: 'Tricipiti', forearms: 'Avambracci', pronators: 'Pronatori', supinators: 'Supinatori',
  wrist_extensors: 'Estensori polso', wrist_flexors: 'Flessori polso', finger_flexors: 'Flessori dita',
  ulnar_deviation: 'Dev. ulnare', radial_deviation: 'Dev. radiale', side_pressure: 'Side pressure',
  quads: 'Quadricipiti', glutes: 'Glutei', core: 'Addominali', lower_back: 'Lower back'
};

function formatMuscleKey(m) {
  return m.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim().replace(/\s+/g, '_');
}

function formatMuscles(muscles) {
  return muscles.map(m => {
    const k = formatMuscleKey(m);
    return MUSCLE_LABELS[k] || m.replace(/_/g, ' ');
  }).join(' · ');
}

function getExerciseColor(exercise) {
  const muscles = EXERCISE_MUSCLE_MAP[exercise.exercise_id] || [];
  if (muscles.length === 0) return { ...defaultColor, muscles: [], accentDot: defaultGroupAccent };
  const key = muscles[0].toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
  const color = muscleColors[key] || defaultColor;
  let accentDot;
  if (exercise.category === 'AW') {
    accentDot = 'bg-gradient-to-br from-amber-400 to-orange-500';
  } else {
    const dominant = muscles.reduce((best, m) => {
      const g = MUSCLE_GROUP_MAP[m]; const p = GROUP_PRIORITY[g] ?? 99;
      return p < (GROUP_PRIORITY[MUSCLE_GROUP_MAP[best]] ?? 99) ? m : best;
    }, muscles[0]);
    const group = MUSCLE_GROUP_MAP[dominant] || null;
    accentDot = group ? (GROUP_ACCENT_DOT[group] || defaultGroupAccent) : defaultGroupAccent;
  }
  return { ...color, muscles, isMulti: muscles.length > 1, accentDot };
}

function SortableExerciseCard({ exercise, dayTemplateId, onEdit, onDelete, isOverlay, showMuscleNames = false }) {
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
  };

  const musclesList = color.muscles?.length > 0 ? color.muscles.map(k => MUSCLE_LABELS[k] || k).join(' • ') : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative group w-full shrink-0 flex-none rounded-lg border border-gray-200/80 dark:border-zinc-600/60 
        bg-gradient-to-br from-white to-gray-50 dark:from-zinc-900 dark:to-zinc-800/90
        shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] 
        hover:border-gray-300 dark:hover:border-zinc-500/60 
        hover:-translate-y-0.5 transition-all duration-300 select-none
        flex flex-col p-1.5
        ${isOverlay ? 'cursor-grabbing scale-105 shadow-2xl z-50 ring-2 ring-blue-400/50 dark:ring-blue-400/40' : 'cursor-grab'}
      `}
      title={`${exercise.exercise_name}${musclesList ? '\n\n' + musclesList : ''}`}
    >
      {/* Accent border top - colore gruppo muscolare */}
      <div className={`absolute top-0 left-3 right-3 h-1 ${color.accentDot} rounded-b-full opacity-90`} />

      {/* Action buttons - più grandi e visibili */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200 z-10 
        bg-white/95 dark:bg-zinc-900/95 rounded-md shadow-md border border-gray-100 dark:border-zinc-700/50 px-1 py-0.5">
        {!isOverlay && onEdit && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onEdit?.(exercise); }} 
            className="p-1 text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded transition-all cursor-pointer">
            <Pencil size={11} />
          </button>
        )}
        {!isOverlay && onDelete && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onDelete?.(exercise, dayTemplateId); }} 
            className="p-1 text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-all cursor-pointer">
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Exercise name */}
      <div className="font-bold text-[9px] text-gray-900 dark:text-gray-100 leading-tight tracking-tight select-none flex items-center justify-center text-center break-words line-clamp-2 my-0.5" title={exercise.exercise_name}>
        {exercise.exercise_name}
      </div>

      {/* Muscles - dots o nomi */}
      {color.muscles?.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1 w-full" title={color.muscles.map(k => MUSCLE_LABELS[k] || k).join(' • ')}>
          {showMuscleNames ? (
            color.muscles.map((muscleKey, idx) => {
              const muscleLabel = MUSCLE_LABELS[muscleKey] || muscleKey;
              const muscleColor = muscleColors[muscleKey] || defaultColor;
              return (
                <div key={idx} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-semibold ${muscleColor.bg} ${muscleColor.text} border ${muscleColor.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${muscleColor.dot}`} />
                  <span className="leading-snug">{muscleLabel}</span>
                </div>
              );
            })
          ) : (
            color.muscles.map((muscleKey, idx) => {
              const muscleColor = muscleColors[muscleKey] || defaultColor;
              return <span key={idx} className={`inline-block w-1.5 h-1.5 rounded-full shrink-0 ${muscleColor.dot}`} title={MUSCLE_LABELS[muscleKey] || muscleKey} />;
            })
          )}
        </div>
      )}
    </div>
  );
}

function DayHeader({ day, isSelected, onClick }) {
  const strengthCount = day.exercises.filter(e => e.category === 'STRENGTH').length;
  const awCount = day.exercises.filter(e => e.category === 'AW').length;
  const hypCount = day.exercises.filter(e => e.category === 'HYPERTROPHY').length;
  
  return (
    <div 
      onClick={() => onClick?.(day)}
      className={`
        min-h-[56px] px-3 pt-2 pb-3 flex flex-col justify-between cursor-pointer transition-all duration-300 border-b-2 relative overflow-hidden
        ${isSelected 
          ? 'bg-gradient-to-b from-blue-50/90 to-blue-50/40 dark:from-blue-900/30 dark:to-blue-900/10 border-b-blue-500 shadow-[inset_0_-3px_0_0_rgba(59,130,246,0.3)]' 
          : 'bg-gradient-to-b from-white to-gray-50/50 dark:from-zinc-900 dark:to-zinc-900/50 border-b-transparent hover:bg-gradient-to-b hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-zinc-800 dark:hover:to-zinc-800/50'}
      `}
    >
      {/* Background decoration */}
      <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity duration-300
        ${isSelected ? 'bg-blue-400' : 'bg-gray-300 dark:bg-zinc-600'}`} />
      
      <div className="flex items-center justify-between gap-1.5 relative z-10">
        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-zinc-300'}`}>
          Day {day.weekday + 1}
        </span>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 transition-all duration-300 shadow-sm
          ${isSelected ? 'bg-blue-500 text-white shadow-blue-500/30' : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700'}`}>
          {day.exercises.length}
        </span>
      </div>
      
      <div className="flex items-center gap-1.5 mt-2 relative z-10">
        {strengthCount > 0 && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20">
            <span className="w-1 h-1 rounded-full bg-blue-500" title="Strength"></span>
            <span className="text-[8px] font-semibold text-blue-700 dark:text-blue-300">{strengthCount}</span>
          </div>
        )}
        {awCount > 0 && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20">
            <span className="w-1 h-1 rounded-full bg-amber-500" title="Armwrestling"></span>
            <span className="text-[8px] font-semibold text-amber-700 dark:text-amber-300">{awCount}</span>
          </div>
        )}
        {hypCount > 0 && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20">
            <span className="w-1 h-1 rounded-full bg-emerald-500" title="Hypertrophy"></span>
            <span className="text-[8px] font-semibold text-emerald-700 dark:text-emerald-300">{hypCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RowHeader({ icon: Icon, label, desc, colorClass }) {
  const colorMap = {
    blue: { icon: 'from-blue-500 to-blue-600', bg: 'bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10', border: 'border-blue-200 dark:border-blue-700/50' },
    amber: { icon: 'from-amber-500 to-amber-600', bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10', border: 'border-amber-200 dark:border-amber-700/50' },
    emerald: { icon: 'from-emerald-500 to-emerald-600', bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10', border: 'border-emerald-200 dark:border-emerald-700/50' },
  };
  const colors = colorMap[colorClass] || colorMap.blue;
  
  return (
    <div className={`w-[85px] shrink-0 p-1.5 border-r ${colors.border} ${colors.bg} flex flex-col justify-center relative overflow-hidden group`}>
      <div className="relative z-10 flex flex-col items-center text-center gap-0.5">
        <div className={`w-6 h-6 rounded-md flex items-center justify-center shadow-sm shadow-${colorClass}-500/20 bg-gradient-to-br ${colors.icon} text-white transition-all duration-300 group-hover:scale-105 group-hover:shadow-md`}>
          <Icon size={12} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-[9px] font-bold text-gray-900 dark:text-white uppercase tracking-wider">{label}</h3>
          <p className="text-[7px] text-gray-500 dark:text-gray-400 font-medium leading-tight">{desc}</p>
        </div>
      </div>
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
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-gray-200/80 dark:border-zinc-700/80 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/50">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            Modifica esercizio
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 -m-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-200/80 dark:hover:bg-zinc-700/80 transition-colors"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Nome (titolo)</label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50"
              placeholder="Nome esercizio"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Istruzione</label>
            <input
              type="text"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50"
              placeholder="es. Wendler 5/3/1"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Serie</label>
              <input
                type="number"
                min={1}
                max={20}
                value={baseSets}
                onChange={(e) => setBaseSets(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-zinc-400 mb-1.5">Reps</label>
              <input
                type="number"
                min={1}
                max={50}
                value={baseReps}
                onChange={(e) => setBaseReps(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800/80 text-gray-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400/50"
                placeholder="—"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
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
        p-2 transition-all duration-300 cursor-pointer h-full min-h-[76px] flex flex-col gap-1.5 relative group/cell
        ${isSelected ? 'bg-gradient-to-b from-blue-50/60 to-transparent dark:from-blue-900/20 dark:to-transparent' : 'bg-transparent hover:bg-gradient-to-b hover:from-gray-50/80 hover:to-transparent dark:hover:from-zinc-800/30 dark:hover:to-transparent'}
        ${isOver ? 'ring-inset ring-2 ring-blue-400/60 dark:ring-blue-400/60 bg-blue-50/90 dark:bg-blue-900/30 shadow-[inset_0_0_20px_rgba(59,130,246,0.15)]' : ''}
      `}
    >
      {/* Background pattern for dropzone feel */}
      {isOver && (
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 to-transparent"></div>
      )}
      
      <div className="flex-1 w-full flex flex-col gap-1.5 z-10 relative">
        {children}
      </div>
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

export default function WeeklyCalendar2({ onDaySelect, selectedDayId, initialDays }) {
  const [days, setDays] = useState(() => (initialDays?.length ? addUniqueIds(initialDays) : []));
  const [activeExercise, setActiveExercise] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [showMuscleNames, setShowMuscleNames] = useState(false);

  useEffect(() => {
    if (initialDays?.length) {
      setDays(addUniqueIds(initialDays));
      return;
    }
    api.training.getWeek().then(data => setDays(addUniqueIds(data)));
  }, [initialDays]); // eslint-disable-line react-hooks/exhaustive-deps

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

    if (activeId === overId) return;

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

    if (activeContainer !== overContainer) {
      setDays((prev) => {
        const activeItems = prev.find(d => d.template_id === activeContainer).exercises;
        const overItems = prev.find(d => d.template_id === overContainer).exercises;
        
        const activeIndex = activeItems.findIndex(e => e.unique_id === activeId);
        const overIndex = overItems.findIndex(e => e.unique_id === overId);

        let newIndex;
        if (String(overId).startsWith('cell-')) {
          newIndex = overItems.length;
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
        const newIndex = String(overId).startsWith('cell-') ? day.exercises.length - 1 : day.exercises.findIndex(e => e.unique_id === overId);

        if (oldIndex !== newIndex && newIndex !== -1) {
          newDays[dayIndex] = { ...day, exercises: arrayMove(day.exercises, oldIndex, newIndex) };
        }
      }
      
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

  if (!days.length) {
    return (
      <div className="w-full rounded-3xl border border-gray-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col min-h-[200px]">
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Calendario settimanale</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Nessun giorno caricato. Verifica che il backend sia avviato.</p>
          </div>
        </div>
      </div>
    );
  }

  const rowConfigs = [
    { key: 'strength', label: 'FORZA', desc: 'Multiarticolare', filter: e => e.category === 'STRENGTH', color: 'blue', icon: Zap },
    { key: 'aw', label: 'ARM', desc: 'Tavolo & Iso', filter: e => e.category === 'AW', color: 'amber', icon: Target },
    { key: 'hypertrophy-1', label: 'IPER', desc: 'Slot 1', filter: (e, idx) => e.category === 'HYPERTROPHY' && idx === 0, color: 'emerald', icon: Dumbbell },
    { key: 'hypertrophy-2', label: 'IPER', desc: 'Slot 2', filter: (e, idx) => e.category === 'HYPERTROPHY' && idx === 1, color: 'emerald', icon: Dumbbell },
    { key: 'hypertrophy-3', label: 'IPER', desc: 'Slot 3', filter: (e, idx) => e.category === 'HYPERTROPHY' && idx === 2, color: 'emerald', icon: Dumbbell },
    { key: 'hypertrophy-4', label: 'IPER', desc: 'Slot 4', filter: (e, idx) => e.category === 'HYPERTROPHY' && idx === 3, color: 'emerald', icon: Dumbbell },
    { key: 'hypertrophy-5', label: 'IPER', desc: 'Slot 5', filter: (e, idx) => e.category === 'HYPERTROPHY' && idx === 4, color: 'emerald', icon: Dumbbell },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2">
        <button onClick={() => setShowMuscleNames(v => !v)} title={showMuscleNames ? 'Nascondi nomi muscoli' : 'Mostra nomi muscoli'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-200 ${showMuscleNames ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-400/40' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}>
          {showMuscleNames ? <Eye size={11} /> : <EyeOff size={11} />}
          <span>{showMuscleNames ? 'Nomi' : 'Pallini'}</span>
        </button>
      </div>
      <div className="w-full rounded-3xl border border-gray-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 shadow-[0_8px_40px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col isolate">
        {/* Header Row */}
        <div className="flex border-b border-gray-200/50 dark:border-zinc-800/50 bg-gradient-to-b from-gray-50/80 to-gray-100/50 dark:from-zinc-900/80 dark:to-zinc-950/50">
          <div className="w-[85px] shrink-0 bg-transparent border-r border-gray-200/60 dark:border-zinc-800/60"></div>
          <div className="flex-1 grid grid-cols-6 divide-x divide-gray-200/60 dark:divide-zinc-800/60">
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
          <div className="flex flex-col bg-gradient-to-b from-white to-gray-50/30 dark:from-zinc-900 dark:to-zinc-950/50 flex-1">
            {rowConfigs.map((row) => (
              <div key={row.key} className="flex border-b last:border-b-0 border-gray-200/40 dark:border-zinc-800/40 hover:bg-white/60 dark:hover:bg-zinc-800/20 transition-colors duration-300">
                <RowHeader label={row.label} desc={row.desc} colorClass={row.color} icon={row.icon} />
                
                <div className="flex-1 grid grid-cols-6 divide-x divide-gray-200/60 dark:divide-zinc-800/60 items-stretch">
                  {days.map(day => {
                    // Per le righe di ipertrofia, prima filtriamo per categoria, poi prendiamo l'indice specifico
                    const hyperExercises = day.exercises.filter(e => e.category === 'HYPERTROPHY');
                    const exercises = row.key.startsWith('hypertrophy-') 
                      ? hyperExercises.filter((e, idx) => row.filter(e, idx))
                      : day.exercises.filter(e => row.filter(e, 0));
                    const isSelected = selectedDayId === day.template_id;
                    
                    return (
                      <DroppableCell 
                        key={`cell-${day.template_id}-${row.key}`}
                        id={`cell-${day.template_id}-${row.key}`}
                        isSelected={isSelected}
                        onClick={() => onDaySelect?.(day)}
                      >
                        <SortableContext items={exercises.map(e => e.unique_id)} strategy={horizontalListSortingStrategy}>
                          <div className="flex flex-col gap-1.5 py-2 h-full">
                            {(() => {
                              // Solo per la riga AW, raggruppiamo Vol.1 e Vol.2
                              if (row.key === 'aw') {
                                const groups = [];
                                const processed = new Set();
                                
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
                                    }
                                  });
                                  vol1Exercises.forEach(e => processed.add(e.unique_id));
                                }
                                
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
                                    }
                                  });
                                  vol2Exercises.forEach(e => processed.add(e.unique_id));
                                }
                                
                                exercises.forEach(ex => {
                                  if (!processed.has(ex.unique_id)) groups.push({ type: 'single', exercise: ex });
                                });
                                
                                return groups.map((group) => (
                                  <SortableExerciseCard
                                    key={group.exercise.unique_id}
                                    exercise={group.exercise}
                                    dayTemplateId={day.template_id}
                                    onEdit={group.type === 'single' ? handleEdit : null}
                                    onDelete={group.type === 'single' ? handleDelete : null}
                                    showMuscleNames={showMuscleNames}
                                  />
                                ));
                              }
                              
                              return exercises.map((ex) => (
                                <SortableExerciseCard
                                  key={ex.unique_id}
                                  exercise={ex}
                                  dayTemplateId={day.template_id}
                                  onEdit={handleEdit}
                                  onDelete={handleDelete}
                                  showMuscleNames={showMuscleNames}
                                />
                              ));
                            })()}
                            {exercises.length === 0 && (
                              <div className="flex-1 w-full min-h-[76px] border-2 border-dashed border-gray-200 dark:border-zinc-600 rounded-lg flex items-center justify-center bg-gray-50/50 dark:bg-zinc-900/30 opacity-60 hover:opacity-100 hover:bg-gray-100/80 dark:hover:bg-zinc-800/50 transition-all duration-300">
                                <span className="text-[9px] font-semibold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Drop</span>
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
            {activeExercise ? <SortableExerciseCard exercise={activeExercise} isOverlay showMuscleNames={showMuscleNames} /> : null}
          </DragOverlay>
        </DndContext>

        {editModal && (
          <EditExerciseModal
            exercise={editModal.exercise}
            onSave={handleEditSave}
            onClose={() => setEditModal(null)}
          />
        )}
      </div>
    </div>
  );
}