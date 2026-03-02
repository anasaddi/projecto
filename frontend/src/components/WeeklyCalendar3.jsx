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
import { Zap, Target, Dumbbell, Pencil, Trash2, X, Eye, EyeOff, Plus, Search } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';

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

const MUSCLE_LABELS = {
  chest: 'Petto', upper_chest: 'Petto A.', lats: 'Dorsali', rhomboids: 'Romb', traps: 'Trapezi',
  anterior_delts: 'Delt. Ant', lateral_delts: 'Delt. Lat', rear_delts: 'Delt. Post',
  biceps: 'Bicipiti', brachialis: 'Brach', brachioradialis: 'Brachior', brachiale_brachioradiale: 'Brachio',
  triceps: 'Tricipiti', forearms: 'Avambracci', pronators: 'Pronat', supinators: 'Supinat',
  wrist_extensors: 'Est. Polso', wrist_flexors: 'Fles. Polso', finger_flexors: 'Fles. Dita',
  ulnar_deviation: 'Dev. Uln', radial_deviation: 'Dev. Rad', side_pressure: 'Side P.',
  quads: 'Quad', glutes: 'Glutei', core: 'Core', lower_back: 'L. Back'
};

const muscleBadgeStyles = {
  chest: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
  upper_chest: 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-300 dark:border-rose-500/30',
  lats: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  rhomboids: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  traps: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  anterior_delts: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
  lateral_delts: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
  rear_delts: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
  biceps: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  brachialis: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  brachioradialis: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  brachiale_brachioradiale: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  triceps: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
  forearms: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
  pronators: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
  supinators: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-300 dark:border-orange-500/30',
  wrist_extensors: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  wrist_flexors: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  finger_flexors: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  ulnar_deviation: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
  radial_deviation: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
  side_pressure: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
  quads: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30',
  glutes: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/30',
  core: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
  lower_back: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30'
};
const defaultBadgeStyle = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:border-zinc-700';

const muscleDotColors = {
  chest: 'bg-rose-500', upper_chest: 'bg-rose-400', lats: 'bg-emerald-500', rhomboids: 'bg-emerald-400', traps: 'bg-emerald-600',
  anterior_delts: 'bg-violet-500', lateral_delts: 'bg-violet-400', rear_delts: 'bg-violet-600',
  biceps: 'bg-blue-500', brachialis: 'bg-blue-400', brachioradialis: 'bg-blue-600', brachiale_brachioradiale: 'bg-blue-500',
  triceps: 'bg-cyan-500', forearms: 'bg-orange-500', pronators: 'bg-orange-400', supinators: 'bg-orange-600',
  wrist_extensors: 'bg-amber-500', wrist_flexors: 'bg-amber-600', finger_flexors: 'bg-amber-400',
  ulnar_deviation: 'bg-pink-500', radial_deviation: 'bg-pink-400', side_pressure: 'bg-pink-600',
  quads: 'bg-yellow-500', glutes: 'bg-yellow-600', core: 'bg-teal-500', lower_back: 'bg-teal-600'
};

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
const GROUP_ACCENT_DOT = {
  petto: 'bg-gradient-to-r from-red-400 to-red-600',
  schiena: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
  spalle: 'bg-gradient-to-r from-violet-400 to-violet-600',
  bicipiti: 'bg-gradient-to-r from-blue-400 to-blue-600',
  tricipiti: 'bg-gradient-to-r from-cyan-400 to-cyan-600',
  avambracci: 'bg-gradient-to-r from-amber-400 to-orange-500',
  gambe: 'bg-gradient-to-r from-yellow-400 to-pink-500',
  core: 'bg-gradient-to-r from-teal-400 to-teal-600'
};
const defaultGroupAccent = 'bg-gradient-to-r from-slate-400 to-slate-500';
const GROUP_PRIORITY = { schiena: 1, petto: 2, gambe: 3, spalle: 4, bicipiti: 5, tricipiti: 6, avambracci: 7, core: 8 };

// Colori solidi per volume row
const GROUP_SOLID = { petto: 'bg-red-500', schiena: 'bg-emerald-500', spalle: 'bg-violet-500', bicipiti: 'bg-blue-500', tricipiti: 'bg-cyan-500', avambracci: 'bg-amber-500', gambe: 'bg-pink-500', core: 'bg-teal-500' };
const GROUP_TEXT  = { petto: 'text-red-500', schiena: 'text-emerald-500', spalle: 'text-violet-500', bicipiti: 'text-blue-500', tricipiti: 'text-cyan-500', avambracci: 'text-amber-500', gambe: 'text-pink-500', core: 'text-teal-500' };
const GROUP_NAMES    = { petto: 'Petto', schiena: 'Schiena', spalle: 'Spalle', bicipiti: 'Bicipiti', tricipiti: 'Tricipiti', avambracci: 'Avambracci', gambe: 'Gambe', core: 'Core' };
const GROUP_ABBR     = { petto: 'Petto', schiena: 'Schiena', spalle: 'Spalle', bicipiti: 'Bic', tricipiti: 'Tri', avambracci: 'Avambr', gambe: 'Gambe', core: 'Core' };
const GROUP_BG_LIGHT = { petto: 'bg-red-50 dark:bg-red-500/10', schiena: 'bg-emerald-50 dark:bg-emerald-500/10', spalle: 'bg-violet-50 dark:bg-violet-500/10', bicipiti: 'bg-blue-50 dark:bg-blue-500/10', tricipiti: 'bg-cyan-50 dark:bg-cyan-500/10', avambracci: 'bg-amber-50 dark:bg-amber-500/10', gambe: 'bg-pink-50 dark:bg-pink-500/10', core: 'bg-teal-50 dark:bg-teal-500/10' };

// AW-specific muscle volume constants
const AW_VOL_MUSCLE_ORDER = ['brachiale_brachioradiale', 'biceps', 'side_pressure', 'pronators', 'supinators', 'wrist_flexors', 'finger_flexors', 'radial_deviation', 'ulnar_deviation'];
const AW_VOL_ABBR  = { brachiale_brachioradiale: 'Brachio', biceps: 'Bicep', side_pressure: 'Side', pronators: 'Pron.', supinators: 'Sup.', wrist_flexors: 'Polso', finger_flexors: 'Dita', radial_deviation: 'Dev.Rad', ulnar_deviation: 'Dev.Uln' };
const AW_VOL_NAMES = { brachiale_brachioradiale: 'Brachiale/Brachioradiale', biceps: 'Bicipiti', side_pressure: 'Side Pressure', pronators: 'Pronatori', supinators: 'Supinatori', wrist_flexors: 'Flessori Polso', finger_flexors: 'Flessori Dita', radial_deviation: 'Dev. Radiale', ulnar_deviation: 'Dev. Ulnare' };
const AW_VOL_DOT   = { brachiale_brachioradiale: 'bg-blue-500', biceps: 'bg-blue-400', side_pressure: 'bg-pink-600', pronators: 'bg-orange-400', supinators: 'bg-orange-600', wrist_flexors: 'bg-amber-600', finger_flexors: 'bg-amber-400', radial_deviation: 'bg-pink-400', ulnar_deviation: 'bg-pink-500' };
const AW_VOL_TEXT  = { brachiale_brachioradiale: 'text-blue-600 dark:text-blue-400', biceps: 'text-blue-500 dark:text-blue-300', side_pressure: 'text-pink-700 dark:text-pink-400', pronators: 'text-orange-600 dark:text-orange-400', supinators: 'text-orange-700 dark:text-orange-500', wrist_flexors: 'text-amber-700 dark:text-amber-400', finger_flexors: 'text-amber-600 dark:text-amber-300', radial_deviation: 'text-pink-600 dark:text-pink-300', ulnar_deviation: 'text-pink-700 dark:text-pink-500' };
const AW_VOL_BG    = { brachiale_brachioradiale: 'bg-blue-50 dark:bg-blue-500/10', biceps: 'bg-blue-50 dark:bg-blue-500/10', side_pressure: 'bg-pink-50 dark:bg-pink-500/10', pronators: 'bg-orange-50 dark:bg-orange-500/10', supinators: 'bg-orange-50 dark:bg-orange-500/10', wrist_flexors: 'bg-amber-50 dark:bg-amber-500/10', finger_flexors: 'bg-amber-50 dark:bg-amber-500/10', radial_deviation: 'bg-pink-50 dark:bg-pink-500/10', ulnar_deviation: 'bg-pink-50 dark:bg-pink-500/10' };

function getDominantGroup(muscles) {
  let best = null, bestP = 99;
  for (const m of muscles) {
    const g = MUSCLE_GROUP_MAP[m];
    if (g && (GROUP_PRIORITY[g] ?? 99) < bestP) { best = g; bestP = GROUP_PRIORITY[g]; }
  }
  return best;
}

// GYM volume: groups from STRENGTH + HYPERTROPHY exercises, fixed order
const GYM_VOLUME_GROUP_ORDER = ['petto', 'schiena', 'spalle', 'bicipiti', 'tricipiti', 'gambe', 'core'];

function computeGymVolume(exercises) {
  const counts = {};
  for (const ex of exercises.filter(e => e.category !== 'AW')) {
    const muscles = EXERCISE_MUSCLE_MAP[ex.exercise_id] || [];
    const groups = [...new Set(muscles.map(m => MUSCLE_GROUP_MAP[m]).filter(g => g && g !== 'avambracci'))];
    for (const g of groups) counts[g] = (counts[g] || 0) + 1;
  }
  return GYM_VOLUME_GROUP_ORDER.map(g => [g, counts[g] || 0]);
}

// AW volume: individual muscles from AW exercises, fixed order
function computeAwVolume(exercises) {
  const counts = {};
  for (const ex of exercises.filter(e => e.category === 'AW')) {
    const muscles = EXERCISE_MUSCLE_MAP[ex.exercise_id] || [];
    for (const m of muscles) {
      if (AW_VOL_MUSCLE_ORDER.includes(m)) counts[m] = (counts[m] || 0) + 1;
    }
  }
  return AW_VOL_MUSCLE_ORDER.map(m => [m, counts[m] || 0]);
}

function getExerciseColor(exerciseId) {
  const muscles = EXERCISE_MUSCLE_MAP[exerciseId] || [];
  return { muscles };
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

// ── Card compatta ────────────────────────────────────────────────────────────
function CompactExerciseCard({ exercise, dayTemplateId, onEdit, onDelete, isOverlay, showMuscleNames = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.unique_id, disabled: isOverlay });

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const color = getExerciseColor(exercise.exercise_id);
  const category = exercise.category;

  // Accent bar: AW sempre amber, altri per gruppo dominante
  const accentDot = category === 'AW'
    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
    : (() => { const g = getDominantGroup(color.muscles || []); return g ? (GROUP_ACCENT_DOT[g] || defaultGroupAccent) : defaultGroupAccent; })();

  const catStyles = {
    STRENGTH: 'bg-white dark:bg-[#1a1c23] border-gray-200/80 dark:border-zinc-700/80 shadow-sm hover:border-blue-400 dark:hover:border-blue-600',
    AW: 'bg-white dark:bg-[#1f1b14] border-gray-200/80 dark:border-zinc-700/80 shadow-sm hover:border-amber-400 dark:hover:border-amber-600',
    HYPERTROPHY: 'bg-white dark:bg-[#141f1a] border-gray-200/80 dark:border-zinc-700/80 shadow-sm hover:border-emerald-400 dark:hover:border-emerald-600'
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative group cursor-grab active:cursor-grabbing select-none
        rounded-xl border ${catStyles[category] || catStyles.STRENGTH}
        hover:shadow-md hover:-translate-y-[1px]
        transition-all duration-300 overflow-hidden
        ${isOverlay ? 'shadow-xl scale-105 z-50 cursor-grabbing border-blue-400 dark:border-blue-500' : ''}
      `}
    >
      {/* Accent bar superiore */}
      <div className={`absolute top-0 left-3 right-3 h-1 ${accentDot} rounded-b-full opacity-90`} />

      <div className="px-2.5 py-1.5 flex flex-col items-center justify-center gap-1 w-full min-h-[48px]">
        {/* Nome esercizio */}
        <div className="font-extrabold text-[9px] text-gray-800 dark:text-gray-100 text-center leading-tight w-full break-words my-0.5" title={exercise.exercise_name}>
          {exercise.exercise_name}
        </div>

        {/* Muscoli */}
        {color.muscles?.length > 0 && (
          <div className="flex items-center justify-center gap-1 flex-wrap w-full mt-0.5" title={color.muscles.map(k => MUSCLE_LABELS[k] || k).join(' • ')}>
            {showMuscleNames ? (
              color.muscles.map((muscleKey, idx) => {
                const badgeClass = muscleBadgeStyles[muscleKey] || defaultBadgeStyle;
                const label = MUSCLE_LABELS[muscleKey] || muscleKey.replace('_', ' ');
                return (
                  <span key={idx} className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${badgeClass} uppercase tracking-tight leading-none whitespace-nowrap`}>
                    {label}
                  </span>
                );
              })
            ) : (
              color.muscles.map((muscleKey, idx) => {
                const dotClass = muscleDotColors[muscleKey] || 'bg-gray-400';
                const label = MUSCLE_LABELS[muscleKey] || muscleKey.replace('_', ' ');
                return <span key={idx} className={`inline-block w-1.5 h-1.5 rounded-full ${dotClass} shrink-0`} title={label} />;
              })
            )}
          </div>
        )}
      </div>

      {/* Pulsanti edit/delete */}
      {!isOverlay && (onEdit || onDelete) && (
        <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-10">
          {onEdit && (
            <button onClick={(e) => { e.stopPropagation(); onEdit(exercise, dayTemplateId); }}
              className="p-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur shadow-sm rounded-md text-blue-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/30 transition-colors">
              <Pencil size={11} />
            </button>
          )}
          {onDelete && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(exercise, dayTemplateId); }}
              className="p-1 bg-white/90 dark:bg-zinc-800/90 backdrop-blur shadow-sm rounded-md text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 transition-colors">
              <Trash2 size={11} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Droppable Cell ───────────────────────────────────────────────────────────
function DroppableCell({ id, isSelected, onClick, children }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`
        relative p-1.5 min-h-[64px] cursor-pointer transition-all duration-200
        ${isSelected ? 'bg-blue-50/40 dark:bg-blue-900/10' : 'bg-transparent hover:bg-gray-50/60 dark:hover:bg-zinc-800/40'}
        ${isOver ? 'bg-blue-50/80 dark:bg-blue-900/25 rounded-lg' : ''}
      `}
    >
      {isOver && <span className="pointer-events-none absolute inset-1 rounded-lg ring-2 ring-blue-400/70 dark:ring-blue-400/60 animate-pulse" />}
      <div className="flex flex-col gap-1.5 h-full">{children}</div>
    </div>
  );
}

// ── Add Exercise Modal ────────────────────────────────────────────────────────
const ADD_CATEGORY_LABEL = { STRENGTH: 'Forza', AW: 'Braccio', HYPERTROPHY: 'Ipertrofia' };
const ADD_CATEGORY_COLOR = {
  STRENGTH: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/50',
  AW: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50',
  HYPERTROPHY: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50',
};

function AddExerciseModal({ dayName, category, availableExercises, onAdd, onClose }) {
  const [search, setSearch] = useState('');
  const filtered = (availableExercises || [])
    .filter(ex => {
      if (category === 'AW') return ex.category === 'AW' || (typeof ex.category === 'string' && ex.category.startsWith('AW'));
      return ex.category === category;
    })
    .filter(ex => !search || (ex.name || '').toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const catColorClass = ADD_CATEGORY_COLOR[category] || ADD_CATEGORY_COLOR.STRENGTH;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
          <div>
            <h2 className="text-[15px] font-bold text-gray-800 dark:text-white tracking-tight">Aggiungi esercizio</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-gray-400 dark:text-zinc-500">Day {dayName}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wide ${catColorClass}`}>
                {ADD_CATEGORY_LABEL[category] || category}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        {/* Search */}
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800">
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 pointer-events-none" />
            <input
              autoFocus
              type="text"
              placeholder="Cerca esercizio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
            />
          </div>
        </div>
        {/* Exercise list */}
        <div className="overflow-y-auto flex-1 p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-[11px] text-gray-400 dark:text-zinc-600">
              {availableExercises?.length ? 'Nessun esercizio trovato' : 'Nessun esercizio disponibile'}
            </div>
          ) : (
            filtered.map(ex => {
              const muscles = EXERCISE_MUSCLE_MAP[ex.id] || [];
              const dom = getDominantGroup(muscles);
              return (
                <button
                  key={ex.id}
                  onClick={() => onAdd(ex)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center justify-between gap-2 group"
                >
                  <span className="truncate leading-tight">{ex.name}</span>
                  <div className="flex items-center gap-1 shrink-0">
                    {dom && <span className={`w-2 h-2 rounded-full ${GROUP_SOLID[dom] || 'bg-gray-300'}`} title={GROUP_NAMES[dom]} />}
                    <Plus size={13} className="text-gray-300 group-hover:text-blue-400 transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCalendar() {
  const cols = [1,2,3,4,5,6,7];
  const rows = [
    { h: 'h-10', count: [1,0,1,2,1,0,1] },
    { h: 'h-10', count: [0,1,1,0,1,1,0] },
    { h: 'h-10', count: [1,1,0,1,0,1,1] },
  ];
  return (
    <div className="w-full rounded-2xl border border-gray-200/40 dark:border-zinc-700/40 bg-white dark:bg-[#111216] shadow-lg overflow-hidden">
      <div className="flex border-b border-gray-200/50 dark:border-zinc-800/60 bg-gray-50/40 dark:bg-zinc-900/40">
        <div className="w-[100px] shrink-0 border-r border-gray-200/60 dark:border-zinc-800/60" />
        {cols.map(i => (
          <div key={i} className="flex-1 py-3 px-2 flex flex-col items-center gap-1.5 border-r border-gray-200/60 dark:border-zinc-800/60 last:border-r-0">
            <div className="h-2.5 w-10 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse" />
            <div className="h-1.5 w-7 bg-gray-100 dark:bg-zinc-800 rounded-full animate-pulse" />
          </div>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} className="flex border-b border-gray-200/40 dark:border-zinc-800/40">
          <div className="w-[100px] shrink-0 border-r border-gray-200/60 dark:border-zinc-800/60 flex items-center justify-center py-4">
            <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse" />
          </div>
          {cols.map((_, ci) => (
            <div key={ci} className="flex-1 p-1.5 border-r border-gray-200/60 dark:border-zinc-800/60 last:border-r-0 flex flex-col gap-1">
              {Array.from({ length: row.count[ci] }).map((__, k) => (
                <div key={k} className={`${row.h} rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse`} style={{ animationDelay: `${(ci * 0.08 + k * 0.05).toFixed(2)}s` }} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Day Header ────────────────────────────────────────────────────────────────
function DayHeaderCompact({ day, isSelected, onClick }) {
  const strengthCount = day.exercises.filter(e => e.category === 'STRENGTH').length;
  const awCount = day.exercises.filter(e => e.category === 'AW').length;
  const hypCount = day.exercises.filter(e => e.category === 'HYPERTROPHY').length;

  return (
    <div
      onClick={() => onClick?.(day)}
      className={`flex flex-col items-center justify-between py-2 px-1 cursor-pointer transition-all duration-300 border-b-2 h-full
        ${isSelected ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-500' : 'border-transparent hover:bg-gray-50 dark:hover:bg-zinc-800/50'}`}
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className={`text-[11px] font-bold uppercase tracking-widest ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
          Day {day.weekday + 1}
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-2 relative z-10 flex-wrap justify-center w-full px-1">
        {strengthCount > 0 && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-blue-100 dark:bg-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_4px_rgba(59,130,246,0.5)]" />
            <span className="text-[8px] font-bold text-blue-700 dark:text-blue-300">{strengthCount}</span>
          </div>
        )}
        {awCount > 0 && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.5)]" />
            <span className="text-[8px] font-bold text-amber-700 dark:text-amber-300">{awCount}</span>
          </div>
        )}
        {hypCount > 0 && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
            <span className="text-[8px] font-bold text-emerald-700 dark:text-emerald-300">{hypCount}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Row Label ─────────────────────────────────────────────────────────────────
function RowLabelCompact({ label, color, icon: Icon, isHyperGroup = false }) {
  const colorMap = {
    blue: 'text-blue-600 dark:text-blue-400 bg-gradient-to-br from-blue-50/80 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-r-blue-200 dark:border-r-blue-800/40',
    amber: 'text-amber-600 dark:text-amber-400 bg-gradient-to-br from-amber-50/80 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/10 border-r-amber-200 dark:border-r-amber-800/40',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-gradient-to-br from-emerald-50/80 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-800/10 border-r-emerald-200 dark:border-r-emerald-800/40',
  };
  const styleClass = colorMap[color] || colorMap.blue;
  return (
    <div className={`w-[100px] shrink-0 flex flex-col items-center justify-center px-2 border-r ${styleClass} transition-colors`}>
      {Icon && (
        <div className={`p-2.5 rounded-xl mb-2 flex items-center justify-center
          ${isHyperGroup ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white dark:bg-zinc-800 shadow-md border border-gray-100/50 dark:border-zinc-700/50'}`}>
          <Icon size={18} className={isHyperGroup ? '' : styleClass.split(' ')[0]} />
        </div>
      )}
      {label && <span className="text-[11px] font-black uppercase tracking-[0.15em] text-center leading-tight">{label}</span>}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WeeklyCalendar3({ onDaySelect, selectedDayId, initialDays, availableExercises }) {
  const [days, setDays] = useState(() => (initialDays?.length ? addUniqueIds(initialDays) : []));
  const [loading, setLoading] = useState(!initialDays?.length);
  const [activeExercise, setActiveExercise] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(null); // { dayTemplateId, category, dayWeekday }
  const [showMuscleNames, setShowMuscleNames] = useState(false);
  const [showVolume, setShowVolume] = useState(true);

  useEffect(() => {
    if (initialDays?.length) {
      setDays(addUniqueIds(initialDays));
      setLoading(false);
      return;
    }
    api.training.getWeek().then(data => { setDays(addUniqueIds(data)); setLoading(false); });
  }, [initialDays]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    const exercise = days.flatMap(d => d.exercises).find(e => e.unique_id === event.active.id);
    setActiveExercise(exercise || null);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    const activeDay = days.find(d => d.exercises.some(e => e.unique_id === activeId));
    const overCellMatch = String(overId).match(/^cell-day-(\d+)-(strength|aw|hypertrophy-\d)$/);
    if (activeDay && overCellMatch) {
      const [, overDayNum, overRowType] = overCellMatch;
      if (activeDay.weekday === parseInt(overDayNum)) return;
      const overDay = days.find(d => d.weekday === parseInt(overDayNum));
      if (!overDay) return;
      const exercise = activeDay.exercises.find(e => e.unique_id === activeId);
      if (!exercise) return;
      let newCategory = 'STRENGTH';
      if (overRowType === 'aw') newCategory = 'AW';
      else if (overRowType.startsWith('hypertrophy')) newCategory = 'HYPERTROPHY';
      const newExercise = { ...exercise, unique_id: `${overDay.template_id}-${exercise.exercise_id}-${Date.now()}`, category: newCategory };
      const newDays = days.map(d => {
        if (d.template_id === activeDay.template_id) return { ...d, exercises: d.exercises.filter(e => e.unique_id !== activeId) };
        if (d.template_id === overDay.template_id) return { ...d, exercises: [...d.exercises, newExercise] };
        return d;
      });
      setDays(newDays);
      api.training.updateWeek(newDays.map(d => ({ template_id: d.template_id, exercises: d.exercises.map(e => ({ exercise_id: e.exercise_id, custom_name: e.exercise_name?.trim() || null, instruction: e.instruction ?? null, base_sets: e.category === 'HYPERTROPHY' ? 2 : (e.base_sets ?? 4), base_reps: e.base_reps ?? null })) })));
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveExercise(null);
    if (!over) return;
    const activeDay = days.find(d => d.exercises.some(e => e.unique_id === active.id));
    const overDay = days.find(d => d.exercises.some(e => e.unique_id === over.id));
    if (!activeDay || !overDay || activeDay.template_id !== overDay.template_id) return;
    const activeEx = activeDay.exercises.find(e => e.unique_id === active.id);
    const overEx = overDay.exercises.find(e => e.unique_id === over.id);
    if (!activeEx || !overEx || activeEx.category !== overEx.category) return;
    const catExercises = activeDay.exercises.filter(e => e.category === activeEx.category);
    const oldIndex = catExercises.findIndex(e => e.unique_id === active.id);
    const newIndex = catExercises.findIndex(e => e.unique_id === over.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    const reordered = arrayMove(catExercises, oldIndex, newIndex);
    const otherExercises = activeDay.exercises.filter(e => e.category !== activeEx.category);
    const newDays = days.map(d => d.template_id === activeDay.template_id ? { ...d, exercises: [...otherExercises, ...reordered] } : d);
    setDays(newDays);
    api.training.updateWeek(newDays.map(d => ({ template_id: d.template_id, exercises: d.exercises.map(e => ({ exercise_id: e.exercise_id, custom_name: e.exercise_name?.trim() || null, instruction: e.instruction ?? null, base_sets: e.category === 'HYPERTROPHY' ? 2 : (e.base_sets ?? 4), base_reps: e.base_reps ?? null })) })));
  };

  const handleDelete = (exercise, dayTemplateId) => {
    if (!confirm(`Eliminare "${exercise.exercise_name}"?`)) return;
    setDays(prev => {
      const newDays = prev.map(d => d.template_id === dayTemplateId ? { ...d, exercises: d.exercises.filter(e => e.unique_id !== exercise.unique_id) } : d);
      api.training.updateWeek(newDays.map(d => ({ template_id: d.template_id, exercises: d.exercises.map(e => ({ exercise_id: e.exercise_id, custom_name: e.exercise_name?.trim() || null, instruction: e.instruction ?? null, base_sets: e.category === 'HYPERTROPHY' ? 2 : (e.base_sets ?? 4), base_reps: e.base_reps ?? null })) })));
      return newDays;
    });
  };

  const handleEdit = (exercise) => {
    const day = days.find(d => d.exercises.some(e => e.unique_id === exercise.unique_id));
    if (day) setEditModal({ exercise, dayTemplateId: day.template_id });
  };

  const handleEditSave = (updated) => {
    if (!editModal) return;
    const { exercise, dayTemplateId } = editModal;
    setDays(prev => prev.map(d => ({ ...d, exercises: d.exercises.map(e => e.unique_id === exercise.unique_id && d.template_id === dayTemplateId ? { ...e, exercise_name: updated.name, instruction: updated.instruction } : e) })));
    api.training.updateDayExercise({ template_id: dayTemplateId, exercise_id: exercise.exercise_id, custom_name: updated.name?.trim() || null, instruction: updated.instruction?.trim() || null });
    setEditModal(null);
  };

  const handleAddExercise = (ex) => {
    if (!addModal) return;
    const { dayTemplateId, category } = addModal;
    const newExercise = {
      exercise_id: ex.id,
      exercise_name: ex.name,
      category,
      unique_id: `${dayTemplateId}-${ex.id}-${Date.now()}`,
      dayId: dayTemplateId,
      base_sets: category === 'HYPERTROPHY' ? 2 : 4,
      base_reps: null,
      instruction: null,
    };
    setDays(prev => {
      const newDays = prev.map(d => d.template_id === dayTemplateId ? { ...d, exercises: [...d.exercises, newExercise] } : d);
      api.training.updateWeek(newDays.map(d => ({ template_id: d.template_id, exercises: d.exercises.map(e => ({ exercise_id: e.exercise_id, custom_name: e.exercise_name?.trim() || null, instruction: e.instruction ?? null, base_sets: e.category === 'HYPERTROPHY' ? 2 : (e.base_sets ?? 4), base_reps: e.base_reps ?? null })) })));
      return newDays;
    });
    setAddModal(null);
  };

  if (loading) return <SkeletonCalendar />;
  if (!days.length) {
    return (
      <div className="w-full rounded-xl border border-gray-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden flex flex-col min-h-[150px]">
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-gray-500">Nessun giorno caricato</p>
        </div>
      </div>
    );
  }

  const mainRows = [
    { key: 'strength', label: 'FORZA', filter: e => e.category === 'STRENGTH', color: 'blue', icon: Zap },
    { key: 'aw', label: 'ARM', filter: e => e.category === 'AW', color: 'amber', icon: Target },
  ];
  const hyperSlots = [1, 2, 3, 4, 5].map(n => ({ key: `hypertrophy-${n}`, filter: (e, idx) => e.category === 'HYPERTROPHY' && idx === n - 1, color: 'emerald' }));

  return (
    <div className="w-full">
      {/* Toggle nomi muscoli */}
      <div className="flex justify-end mb-2">
        <button onClick={() => setShowMuscleNames(v => !v)} title={showMuscleNames ? 'Nascondi nomi muscoli' : 'Mostra nomi muscoli'}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all duration-200
            ${showMuscleNames ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-400/40' : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'}`}>
          {showMuscleNames ? <Eye size={11} /> : <EyeOff size={11} />}
          <span>{showMuscleNames ? 'Nomi' : 'Pallini'}</span>
        </button>
      </div>

      <div className="w-full rounded-2xl border border-gray-200/40 dark:border-zinc-700/40 bg-white dark:bg-[#111216] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] overflow-x-auto flex flex-col">
        {/* Header Row - sticky */}
        <div className="flex border-b border-gray-200/50 dark:border-zinc-800/60 bg-gray-50/40 dark:bg-zinc-900/40 backdrop-blur-md sticky top-0 z-20 shadow-sm">
          <div className="w-[100px] shrink-0 border-r border-gray-200/60 dark:border-zinc-800/60" />
          <div className="flex-1 grid divide-x divide-gray-200/60 dark:divide-zinc-800/60" style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
            {days.map(day => (
              <DayHeaderCompact key={day.template_id} day={day} isSelected={selectedDayId === day.template_id} onClick={onDaySelect} />
            ))}
          </div>
        </div>

        {/* Volume Toggle label */}
        {showVolume && (
          <div className="flex border-b border-gray-200/40 dark:border-zinc-800/40">
            <div className="w-[100px] shrink-0 border-r border-gray-200/60 dark:border-zinc-800/60 flex flex-col items-center justify-center gap-0.5 py-1 bg-gray-50/30 dark:bg-zinc-900/20">
              <button onClick={() => setShowVolume(false)} className="flex flex-col items-center gap-0.5 group" title="Nascondi volume">
                <span className="text-[8px] font-black uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500 group-hover:text-gray-600 dark:group-hover:text-zinc-300 transition-colors">VOL</span>
                <svg width="8" height="5" viewBox="0 0 10 6" fill="currentColor" className="text-gray-300 dark:text-zinc-600 group-hover:text-gray-500 transition-colors"><path d="M0 5.5L5 .5l5 5H0z"/></svg>
              </button>
            </div>
            {/* Volume GYM sub-row */}
            <div className="flex-1 flex flex-col divide-y divide-gray-100/60 dark:divide-zinc-800/30">
              {/* GYM row */}
              <div className="flex divide-x divide-gray-200/60 dark:divide-zinc-800/60">
                {days.map((day) => {
                  const gymVol = computeGymVolume(day.exercises);
                  const total = gymVol.reduce((s, [,c]) => s + c, 0);
                  return (
                    <div key={`gym-${day.template_id}`} className="flex-1 flex flex-col items-stretch py-1 px-1">
                      <div className="flex items-center gap-0.5 mb-0.5">
                        <span className="text-[7px] font-black uppercase tracking-widest text-blue-400/60 dark:text-blue-500/40 shrink-0">GYM</span>
                        <div className="flex h-[3px] flex-1 rounded-full overflow-hidden gap-px">
                          {total === 0
                            ? <div className="bg-gray-200/50 dark:bg-zinc-700/30 w-full rounded-full" />
                            : gymVol.filter(([,c]) => c > 0).map(([g, c]) => (
                                <div key={g} className={`${GROUP_SOLID[g] || 'bg-gray-400'} h-full`} style={{ width: `${(c/total)*100}%` }} />
                              ))
                          }
                        </div>
                      </div>
                      <div className="grid gap-x-0.5 gap-y-0.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        {gymVol.map(([group, count]) => (
                          <span key={group} title={`${GROUP_NAMES[group]}: ${count}`}
                            className={`inline-flex items-center gap-0.5 px-0.5 py-0 rounded text-[7px] font-bold uppercase tracking-tight leading-[14px] truncate transition-opacity
                              ${count > 0 ? GROUP_BG_LIGHT[group] || 'bg-gray-50 dark:bg-zinc-800' : 'opacity-[0.18]'}`}>
                            <span className={`w-1 h-1 rounded-full shrink-0 ${GROUP_SOLID[group] || 'bg-gray-300'}`} />
                            <span className={count > 0 ? (GROUP_TEXT[group] || 'text-gray-500') : 'text-gray-400 dark:text-zinc-600'} style={{ fontSize: '6.5px' }}>
                              {GROUP_ABBR[group]}
                            </span>
                            {count > 0 && <span className={`tabular-nums opacity-70 ${GROUP_TEXT[group]}`} style={{ fontSize: '6.5px' }}>×{count}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* AW row */}
              <div className="flex divide-x divide-gray-200/60 dark:divide-zinc-800/60">
                {days.map((day) => {
                  const awVol = computeAwVolume(day.exercises);
                  const total = awVol.reduce((s, [,c]) => s + c, 0);
                  return (
                    <div key={`aw-${day.template_id}`} className="flex-1 flex flex-col items-stretch py-1 px-1">
                      <div className="flex items-center gap-0.5 mb-0.5">
                        <span className="text-[7px] font-black uppercase tracking-widest text-amber-400/70 dark:text-amber-500/50 shrink-0">AW</span>
                        <div className="flex h-[3px] flex-1 rounded-full overflow-hidden gap-px">
                          {total === 0
                            ? <div className="bg-gray-200/50 dark:bg-zinc-700/30 w-full rounded-full" />
                            : awVol.filter(([,c]) => c > 0).map(([m, c]) => (
                                <div key={m} className={`${AW_VOL_DOT[m] || 'bg-amber-400'} h-full`} style={{ width: `${(c/total)*100}%` }} />
                              ))
                          }
                        </div>
                      </div>
                      <div className="grid gap-x-0.5 gap-y-0.5" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                        {awVol.map(([muscle, count]) => (
                          <span key={muscle} title={`${AW_VOL_NAMES[muscle]}: ${count}`}
                            className={`inline-flex items-center gap-0.5 px-0.5 py-0 rounded leading-[14px] truncate transition-opacity
                              ${count > 0 ? AW_VOL_BG[muscle] || 'bg-amber-50 dark:bg-amber-500/10' : 'opacity-[0.18]'}`}>
                            <span className={`w-1 h-1 rounded-full shrink-0 ${AW_VOL_DOT[muscle] || 'bg-amber-400'}`} />
                            <span className={count > 0 ? (AW_VOL_TEXT[muscle] || 'text-amber-600') : 'text-gray-400'} style={{ fontSize: '6px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                              {AW_VOL_ABBR[muscle]}
                            </span>
                            {count > 0 && <span className={`tabular-nums opacity-70 ${AW_VOL_TEXT[muscle]}`} style={{ fontSize: '6px', fontWeight: 700 }}>×{count}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {!showVolume && (
          <div className="flex border-b border-gray-200/30 dark:border-zinc-800/30">
            <div className="w-[100px] shrink-0 border-r border-gray-200/60 dark:border-zinc-800/60 flex items-center justify-center py-1 bg-gray-50/30 dark:bg-zinc-900/20">
              <button onClick={() => setShowVolume(true)} className="flex items-center gap-1 group" title="Mostra volume">
                <span className="text-[8px] font-black uppercase tracking-[0.12em] text-gray-300 dark:text-zinc-600 group-hover:text-gray-500 transition-colors">VOL</span>
                <svg width="8" height="5" viewBox="0 0 10 6" fill="currentColor" className="text-gray-300 dark:text-zinc-600 group-hover:text-gray-500 rotate-180 transition-colors"><path d="M0 5.5L5 .5l5 5H0z"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex flex-col">
            {mainRows.map((row) => (
              <div key={row.key} className="flex border-b border-gray-200/40 dark:border-zinc-800/40">
                <RowLabelCompact label={row.label} color={row.color} icon={row.icon} />
                <div className="flex-1 grid divide-x divide-gray-200/60 dark:divide-zinc-800/60 items-stretch" style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
                  {days.map(day => {
                    const exercises = day.exercises.filter(row.filter);
                    const isSelected = selectedDayId === day.template_id;
                    return (
                      <DroppableCell key={`cell-${day.template_id}-${row.key}`} id={`cell-day-${day.weekday}-${row.key}`} isSelected={isSelected} onClick={() => onDaySelect?.(day)} rowKey={row.key}>
                        <SortableContext items={exercises.map(e => e.unique_id)} strategy={horizontalListSortingStrategy}>
                          <div className="flex flex-col gap-1">
                            {row.key === 'aw' ? (() => {
                              const groups = [];
                              const processed = new Set();
                              const vol1 = exercises.filter(e => e.exercise_id?.startsWith('aw_v1_'));
                              if (vol1.length > 0) {
                                groups.push({ id: `${day.template_id}-vol1`, exercise: { unique_id: `${day.template_id}-vol1`, exercise_id: 'aw_vol_1', exercise_name: 'AW Vol.1 (P&C)', category: 'AW' } });
                                vol1.forEach(e => processed.add(e.unique_id));
                              }
                              const vol2 = exercises.filter(e => e.exercise_id?.startsWith('aw_v2_'));
                              if (vol2.length > 0) {
                                groups.push({ id: `${day.template_id}-vol2`, exercise: { unique_id: `${day.template_id}-vol2`, exercise_id: 'aw_vol_2', exercise_name: 'AW Vol.2 (C&S)', category: 'AW' } });
                                vol2.forEach(e => processed.add(e.unique_id));
                              }
                              exercises.forEach(ex => { if (!processed.has(ex.unique_id)) groups.push({ id: ex.unique_id, exercise: ex }); });
                              return groups.map(g => <CompactExerciseCard key={g.id} exercise={g.exercise} dayTemplateId={day.template_id} showMuscleNames={showMuscleNames} />);
                            })() : (
                              exercises.map(ex => <CompactExerciseCard key={ex.unique_id} exercise={ex} dayTemplateId={day.template_id} onEdit={handleEdit} onDelete={handleDelete} showMuscleNames={showMuscleNames} />)
                            )}
                            {exercises.length === 0 && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setAddModal({ dayTemplateId: day.template_id, category: row.key === 'aw' ? 'AW' : 'STRENGTH', dayWeekday: day.weekday }); }}
                                className="h-10 w-full border-2 border-dashed border-gray-200/50 dark:border-zinc-700/50 rounded-xl flex items-center justify-center gap-1 bg-gray-50/30 dark:bg-zinc-800/20 hover:border-blue-400/60 dark:hover:border-blue-500/40 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 transition-all group"
                              >
                                <Plus size={11} className="text-gray-300 dark:text-zinc-600 group-hover:text-blue-400 transition-colors" />
                                <span className="text-[9px] font-medium text-gray-300 dark:text-zinc-600 group-hover:text-blue-400 transition-colors">Aggiungi</span>
                              </button>
                            )}
                          </div>
                        </SortableContext>
                      </DroppableCell>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Hypertrophy */}
            <div className="flex bg-gradient-to-b from-emerald-50/30 to-emerald-100/20 dark:from-emerald-900/10 dark:to-emerald-800/5">
              <RowLabelCompact label="IPER" color="emerald" icon={Dumbbell} isHyperGroup={true} />
              <div className="flex-1 flex flex-col">
                {hyperSlots.map((row, idx) => (
                  <div key={row.key} className={`flex flex-1 ${idx < hyperSlots.length - 1 ? 'border-b border-emerald-200/30 dark:border-emerald-800/20' : ''}`}>
                    <div className="flex-1 grid divide-x divide-gray-200/60 dark:divide-zinc-800/60 items-stretch" style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
                      {days.map(day => {
                        const hyperExercises = day.exercises.filter(e => e.category === 'HYPERTROPHY');
                        const exercises = hyperExercises.filter((e, i) => row.filter(e, i));
                        const isSelected = selectedDayId === day.template_id;
                        return (
                          <DroppableCell key={`cell-${day.template_id}-${row.key}`} id={`cell-day-${day.weekday}-${row.key}`} isSelected={isSelected} onClick={() => onDaySelect?.(day)} rowKey={row.key}>
                            <SortableContext items={exercises.map(e => e.unique_id)} strategy={horizontalListSortingStrategy}>
                              <div className="flex flex-col gap-1">
                                {exercises.map(ex => <CompactExerciseCard key={ex.unique_id} exercise={ex} dayTemplateId={day.template_id} onEdit={handleEdit} onDelete={handleDelete} showMuscleNames={showMuscleNames} />)}
                                {exercises.length === 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setAddModal({ dayTemplateId: day.template_id, category: 'HYPERTROPHY', dayWeekday: day.weekday }); }}
                                    className="h-10 w-full border-2 border-dashed border-emerald-200/40 dark:border-emerald-800/40 rounded-xl flex items-center justify-center gap-1 bg-emerald-50/20 dark:bg-emerald-900/10 hover:border-emerald-400/60 dark:hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/20 transition-all group"
                                  >
                                    <Plus size={11} className="text-emerald-300 dark:text-emerald-700/50 group-hover:text-emerald-500 transition-colors" />
                                    <span className="text-[9px] font-medium text-emerald-300 dark:text-emerald-700/50 group-hover:text-emerald-500 transition-colors">Aggiungi</span>
                                  </button>
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
            </div>
          </div>

          <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeExercise ? (
              <div style={{ transform: 'rotate(2deg) scale(1.06)', transformOrigin: 'center', filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.18))' }}>
                <CompactExerciseCard exercise={activeExercise} isOverlay showMuscleNames={showMuscleNames} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add Exercise Modal */}
        {addModal && (
          <AddExerciseModal
            dayName={addModal.dayWeekday + 1}
            category={addModal.category}
            availableExercises={availableExercises}
            onAdd={handleAddExercise}
            onClose={() => setAddModal(null)}
          />
        )}

        {/* Edit Modal */}
        {editModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm" onClick={() => setEditModal(null)}>
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
                <h2 className="text-[15px] font-bold text-gray-800 dark:text-white tracking-tight">Modifica esercizio</h2>
                <button onClick={() => setEditModal(null)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">Nome</label>
                  <input
                    type="text"
                    defaultValue={editModal.exercise.exercise_name}
                    id="edit-name"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5">Istruzione</label>
                  <input
                    type="text"
                    defaultValue={editModal.exercise.instruction || ''}
                    id="edit-instruction"
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none"
                    placeholder="es. Wendler 5/3/1"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setEditModal(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                    Annulla
                  </button>
                  <button
                    onClick={() => handleEditSave({ name: document.getElementById('edit-name').value, instruction: document.getElementById('edit-instruction').value })}
                    className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                  >
                    Salva
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
