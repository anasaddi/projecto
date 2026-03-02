import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  petto: 'bg-rose-500', schiena: 'bg-emerald-600', spalle: 'bg-violet-500', bicipiti: 'bg-blue-500',
  tricipiti: 'bg-cyan-500', avambracci: 'bg-amber-500', gambe: 'bg-slate-500', core: 'bg-teal-500'
};
const MUSCLE_DOT_COLORS = {
  chest: 'bg-rose-500', upper_chest: 'bg-rose-400', lats: 'bg-emerald-500', rhomboids: 'bg-emerald-400', traps: 'bg-emerald-600',
  anterior_delts: 'bg-violet-500', lateral_delts: 'bg-violet-400', rear_delts: 'bg-violet-600',
  biceps: 'bg-blue-500', brachialis: 'bg-blue-400', brachioradialis: 'bg-blue-600', brachiale_brachioradiale: 'bg-blue-500',
  triceps: 'bg-cyan-500', forearms: 'bg-amber-500', pronators: 'bg-amber-400', supinators: 'bg-amber-600',
  wrist_extensors: 'bg-amber-500', wrist_flexors: 'bg-amber-600', finger_flexors: 'bg-amber-400',
  ulnar_deviation: 'bg-amber-500', radial_deviation: 'bg-amber-600', side_pressure: 'bg-orange-500',
  quads: 'bg-slate-500', glutes: 'bg-slate-600', core: 'bg-teal-500', lower_back: 'bg-teal-600'
};
const defaultGroupAccent = 'bg-slate-500';
const GROUP_PRIORITY = { schiena: 1, petto: 2, gambe: 3, spalle: 4, bicipiti: 5, tricipiti: 6, avambracci: 7, core: 8 };

// Colori per volume
const GROUP_SOLID = { petto: 'bg-rose-500', schiena: 'bg-emerald-500', spalle: 'bg-violet-500', bicipiti: 'bg-blue-500', tricipiti: 'bg-cyan-500', avambracci: 'bg-amber-500', gambe: 'bg-pink-500', core: 'bg-teal-500' };
// Tag: sfondo 20% opacità + testo brillante per contrasto WCAG
const GROUP_BADGE = { petto: 'bg-rose-500/20 text-rose-600 dark:text-rose-300', schiena: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300', spalle: 'bg-violet-500/20 text-violet-600 dark:text-violet-300', bicipiti: 'bg-blue-500/20 text-blue-600 dark:text-blue-300', tricipiti: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300', avambracci: 'bg-amber-500/20 text-amber-600 dark:text-amber-300', gambe: 'bg-pink-500/20 text-pink-600 dark:text-pink-300', core: 'bg-teal-500/20 text-teal-600 dark:text-teal-300' };
const GROUP_TEXT  = { petto: 'text-rose-500', schiena: 'text-emerald-500', spalle: 'text-violet-500', bicipiti: 'text-blue-500', tricipiti: 'text-cyan-500', avambracci: 'text-amber-500', gambe: 'text-pink-500', core: 'text-teal-500' };
const GROUP_NAMES = { petto: 'Petto', schiena: 'Schiena', spalle: 'Spalle', bicipiti: 'Bicipiti', tricipiti: 'Tricipiti', avambracci: 'Avambracci', gambe: 'Gambe', core: 'Core' };
const GROUP_ABBR  = { petto: 'Pet', schiena: 'Sch', spalle: 'Sp', bicipiti: 'Bic', tricipiti: 'Tri', avambracci: 'Av', gambe: 'Gam', core: 'Core' };

const AW_VOL_MUSCLE_ORDER = ['brachiale_brachioradiale', 'biceps', 'side_pressure', 'pronators', 'supinators', 'wrist_flexors', 'finger_flexors', 'radial_deviation', 'ulnar_deviation'];
const AW_VOL_ABBR  = { brachiale_brachioradiale: 'Brachio', biceps: 'Bic', side_pressure: 'Side', pronators: 'Pron', supinators: 'Sup', wrist_flexors: 'Polso', finger_flexors: 'Dita', radial_deviation: 'Rad', ulnar_deviation: 'Uln' };
const AW_VOL_NAMES = { brachiale_brachioradiale: 'Brachiale', biceps: 'Bicipiti', side_pressure: 'Side pressure', pronators: 'Pronatori', supinators: 'Supinatori', wrist_flexors: 'Flessori polso', finger_flexors: 'Flessori dita', radial_deviation: 'Dev. radiale', ulnar_deviation: 'Dev. ulnare' };
const AW_VOL_DOT   = { brachiale_brachioradiale: 'bg-blue-500', biceps: 'bg-blue-400', side_pressure: 'bg-pink-600', pronators: 'bg-orange-400', supinators: 'bg-orange-600', wrist_flexors: 'bg-amber-600', finger_flexors: 'bg-amber-400', radial_deviation: 'bg-pink-400', ulnar_deviation: 'bg-pink-500' };
const AW_VOL_TEXT  = { brachiale_brachioradiale: 'text-blue-600', biceps: 'text-blue-500', side_pressure: 'text-pink-600', pronators: 'text-orange-500', supinators: 'text-orange-600', wrist_flexors: 'text-amber-600', finger_flexors: 'text-amber-500', radial_deviation: 'text-pink-500', ulnar_deviation: 'text-pink-600' };

function getDominantGroup(muscles) {
  let best = null, bestP = 99;
  for (const m of muscles) {
    const g = MUSCLE_GROUP_MAP[m];
    if (g && (GROUP_PRIORITY[g] ?? 99) < bestP) { best = g; bestP = GROUP_PRIORITY[g]; }
  }
  return best;
}

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

// ── Glassmorphism Exercise Card with Spring Physics ────────────────────────────
function CompactExerciseCard({ exercise, dayTemplateId, onEdit, onDelete, isOverlay, showMuscleNames = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: exercise.unique_id, disabled: isOverlay });

  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition,
    zIndex: isDragging ? 100 : 1,
  };
  const color = getExerciseColor(exercise.exercise_id);
  const category = exercise.category;

  const accentDot = category === 'AW'
    ? 'bg-gradient-to-r from-amber-400 to-orange-500'
    : (() => { const g = getDominantGroup(color.muscles || []); return g ? (GROUP_ACCENT_DOT[g] || defaultGroupAccent) : defaultGroupAccent; })();

  const glassStyles = {
    STRENGTH: 'bg-white dark:bg-zinc-800/95 backdrop-blur-xl border-gray-200/80 dark:border-zinc-700/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_-4px_rgba(59,130,246,0.15)] hover:border-blue-300 dark:hover:border-blue-500/50',
    AW: 'bg-white dark:bg-zinc-800/95 backdrop-blur-xl border-gray-200/80 dark:border-zinc-700/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_-4px_rgba(245,158,11,0.15)] hover:border-amber-300 dark:hover:border-amber-500/50',
    HYPERTROPHY: 'bg-white dark:bg-zinc-800/95 backdrop-blur-xl border-gray-200/80 dark:border-zinc-700/80 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_12px_-4px_rgba(16,185,129,0.15)] hover:border-emerald-300 dark:hover:border-emerald-500/50'
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: isDragging ? 0.4 : 1, scale: 1 }}
      whileHover={!isDragging && !isOverlay ? { y: -2, scale: 1.01 } : {}}
      whileTap={!isDragging && !isOverlay ? { scale: 0.98 } : {}}
      className={`
        relative group cursor-grab select-none
        rounded-xl border ${glassStyles[category] || glassStyles.STRENGTH}
        transition-all duration-300 overflow-hidden ${showMuscleNames ? 'min-h-[82px]' : 'min-h-[44px]'}
        ${isOverlay ? 'shadow-2xl scale-105 z-50 cursor-grabbing ring-2 ring-blue-500/40 rotate-2' : ''}
        ${isDragging ? 'shadow-inner opacity-50 grayscale-[0.2]' : ''}
      `}
    >
      {/* Accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${accentDot} opacity-90`} />
      
      <div className={`relative flex flex-col items-center justify-center w-full h-full ${showMuscleNames ? 'p-2 pt-3' : 'p-1.5 pt-2'}`}>
        {/* Nome esercizio */}
        <div className={`font-bold text-[9px] tracking-tight text-gray-800 dark:text-gray-100 text-center leading-[1.1] w-full line-clamp-2 ${showMuscleNames ? 'mb-1.5' : ''}`} title={exercise.exercise_name}>
          {exercise.exercise_name}
        </div>

        {/* Muscoli */}
        {color.muscles?.length > 0 && (
          <div className="w-full flex items-center justify-center">
            {showMuscleNames ? (
              <div className="flex flex-wrap items-center justify-center gap-1">
                {color.muscles.slice(0, 3).map((muscleKey, idx) => {
                  const label = MUSCLE_LABELS[muscleKey] || muscleKey.replace('_', ' ');
                  const g = MUSCLE_GROUP_MAP[muscleKey];
                  const badgeClass = g ? (GROUP_BADGE[g] || 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-gray-300') : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
                  return (
                    <span key={idx} className={`text-[7px] font-bold py-0.5 px-1.5 rounded inline-flex items-center justify-center ${badgeClass} border border-black/5 dark:border-white/5`}>
                      {label}
                    </span>
                  );
                })}
                {color.muscles.length > 3 && (
                  <span className="text-[7px] font-bold py-0.5 px-1 rounded bg-gray-100 text-gray-500 dark:bg-zinc-800 dark:text-gray-400 border border-black/5 dark:border-white/5">
                    +{color.muscles.length - 3}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-[3px] mt-0.5">
                {color.muscles.slice(0, 4).map((muscleKey, idx) => {
                  const g = MUSCLE_GROUP_MAP[muscleKey];
                  const dotClass = MUSCLE_DOT_COLORS[muscleKey] || (g ? GROUP_SOLID[g] : 'bg-amber-400');
                  return (
                    <span key={idx} className={`inline-block w-1.5 h-1.5 rounded-full ${dotClass} shadow-sm border border-white/20 dark:border-black/20`} title={MUSCLE_LABELS[muscleKey]} />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pulsanti hover */}
      {!isOverlay && (onEdit || onDelete) && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(exercise, dayTemplateId); }}
              className="p-1 rounded-md bg-white/90 dark:bg-zinc-800/90 shadow-sm text-blue-500 hover:bg-blue-50 hover:text-blue-600 transition-colors border border-gray-200/50 dark:border-zinc-700/50"
            >
              <Pencil size={10} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(exercise, dayTemplateId); }}
              className="p-1 rounded-md bg-white/90 dark:bg-zinc-800/90 shadow-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200/50 dark:border-zinc-700/50"
            >
              <Trash2 size={10} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Droppable Cell con effetto glass ──────────────────────────────────────────
function DroppableCell({ id, isSelected, onClick, children, compact }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  
  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
              className={`
                relative cursor-pointer h-full w-full
                ${compact ? 'p-1 min-h-[48px]' : 'p-1.5 min-h-[72px]'}
                transition-all duration-300 group/cell
                ${isSelected ? 'bg-emerald-50/20 dark:bg-emerald-900/10' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}
              `}
    >
      {/* Background when drag over */}
      <div className={`absolute inset-0 transition-all duration-300 ${isOver ? 'bg-blue-500/10 opacity-100 shadow-inner' : 'opacity-0'} pointer-events-none rounded-xl z-0`} />
      
      {/* Ghost ring when drag over */}
      <div className={`absolute inset-0.5 rounded-lg ring-2 ring-blue-500/40 transition-all duration-300 ${isOver ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} pointer-events-none z-0`} />
      
      {/* Pattern cells when empty */}
      <div className={`absolute inset-0 opacity-[0.015] dark:opacity-[0.03] pointer-events-none transition-opacity rounded-xl ${isOver ? 'opacity-[0.05]' : ''} z-0`}
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: '10px 10px'
        }}
      />
      
      {/* Container flex per gli elementi interni, che permette lo stretch in altezza */}
      <div className={`relative flex flex-col h-full w-full ${compact ? 'gap-1' : 'gap-1.5'} z-10`}>
        {children}
      </div>
    </div>
  );
}

// ── Interactive Add Button ─────────────────────────────────────────────────────
function InteractiveAddButton({ onClick, color = 'blue', compact }) {
  const colorClasses = {
    blue: 'border-blue-200/60 dark:border-blue-800/60 hover:border-blue-400 hover:bg-blue-50/80 dark:hover:bg-blue-900/30 text-blue-400 hover:text-blue-600',
    emerald: 'border-emerald-200/60 dark:border-emerald-800/60 hover:border-emerald-400 hover:bg-emerald-50/80 dark:hover:bg-emerald-900/30 text-emerald-400 hover:text-emerald-600'
  };

  return (
    <button
      onClick={onClick}
      className={`
        w-full border border-dashed rounded-xl
        ${compact ? 'h-full min-h-[36px]' : 'h-full min-h-[44px]'} 
        flex flex-1 items-center justify-center gap-1.5 shrink-0 opacity-0 group-hover/cell:opacity-100 focus:opacity-100
        ${colorClasses[color] || colorClasses.blue}
        transition-all duration-300 hover:shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
      `}
    >
      <Plus size={compact ? 10 : 12} />
      {!compact && <span className="text-[9px] font-bold uppercase tracking-wider">Aggiungi</span>}
    </button>
  );
}

// ── Add Exercise Modal ────────────────────────────────────────────────────────
const ADD_CATEGORY_LABEL = { STRENGTH: 'Forza', AW: 'Braccio', HYPERTROPHY: 'Ipertrofia' };
const ADD_CATEGORY_COLOR = {
  STRENGTH: 'bg-gradient-to-r from-blue-500 to-blue-600',
  AW: 'bg-gradient-to-r from-amber-500 to-orange-500',
  HYPERTROPHY: 'bg-gradient-to-r from-emerald-500 to-teal-500',
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

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        key={`add-modal-${category}`}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="w-full max-w-sm rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-blue-500/10 border border-gray-200/50 dark:border-zinc-700/50 overflow-hidden flex flex-col" 
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header con gradient */}
        <div className={`flex flex-col items-center justify-between px-6 py-5 ${ADD_CATEGORY_COLOR[category] || ADD_CATEGORY_COLOR.STRENGTH}`}>
          <div className="flex items-center justify-between w-full">
            <div>
              <h2 className="text-[16px] font-black text-white tracking-tight">Aggiungi Esercizio</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-white/90 font-medium">Day {dayName}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-white/20 uppercase tracking-wider">
                  {ADD_CATEGORY_LABEL[category] || category}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        
        {/* Search glassmorphism */}
        <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/50">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              autoFocus
              type="text"
              placeholder="Cerca esercizio..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 shadow-sm text-gray-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>
        
        {/* Exercise list con animazioni */}
        <div className="overflow-y-auto flex-1 p-2 space-y-1 custom-scrollbar min-h-[200px] max-h-[350px]">
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-center py-10 text-[12px] text-gray-400 font-medium"
              >
                Nessun esercizio trovato
              </motion.div>
            ) : (
              filtered.map((ex, idx) => {
                const muscles = EXERCISE_MUSCLE_MAP[ex.id] || [];
                const dom = getDominantGroup(muscles);
                return (
                  <motion.button
                    key={ex.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                    whileHover={{ x: 4, backgroundColor: 'rgba(59, 130, 246, 0.08)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onAdd(ex)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3 group transition-all hover:shadow-sm"
                  >
                    <span className="truncate leading-tight">{ex.name}</span>
                    <div className="flex items-center gap-2.5 shrink-0">
                      {dom && <span className={`w-2.5 h-2.5 rounded-full ${GROUP_SOLID[dom] || 'bg-gray-300'} shadow-sm`} />}
                      <div className="p-1 rounded-md bg-gray-100 dark:bg-zinc-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                        <Plus size={14} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </motion.button>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ── Volume Row (nomi completi, compatto) ────────────────────────────────────────
const VOL_SECTION = { GYM: { label: 'Palestra', dotMap: GROUP_SOLID, names: GROUP_NAMES }, AW: { label: 'Braccio', dotMap: AW_VOL_DOT, names: AW_VOL_NAMES } };

function VolumeRow({ days, showVolume, setShowVolume, compact, selectedDayId }) {
  return (
    <div className={`flex border-b border-gray-200/40 dark:border-zinc-700/40 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showVolume ? 'opacity-100 max-h-[800px]' : 'opacity-0 max-h-0 overflow-hidden border-transparent'}`}>
      <div className={`w-[100px] shrink-0 border-r border-gray-200/40 dark:border-zinc-700/40 flex flex-col items-center justify-center bg-gray-50/30 dark:bg-zinc-900/20 ${compact ? 'py-1 min-h-[28px]' : 'py-1.5 min-h-[36px]'}`}>
        <button onClick={() => setShowVolume(v => !v)} className="flex flex-col items-center gap-0.5 group" title={showVolume ? 'Nascondi volume' : 'Mostra volume'}>
          <span className="text-[8px] font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 group-hover:text-gray-700 dark:group-hover:text-zinc-300 transition-colors">VOL</span>
          <svg width="8" height="5" viewBox="0 0 10 6" fill="currentColor" className={`text-gray-400 dark:text-zinc-600 transition-transform duration-300 ${showVolume ? '' : 'rotate-180'}`}><path d="M0 5.5L5 .5l5 5H0z"/></svg>
        </button>
      </div>
      <div className="flex-1 flex flex-col">
        {[
          { key: 'GYM', getVol: d => computeGymVolume(d.exercises) },
          { key: 'AW', getVol: d => computeAwVolume(d.exercises) }
        ].map(({ key, getVol }) => {
          const cfg = VOL_SECTION[key];
          const labelCls = key === 'GYM' ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400';
          return (
              <div key={key} className={`flex divide-x divide-gray-200/40 dark:divide-zinc-700/40 ${key === 'AW' ? 'border-t border-gray-200/40 dark:border-zinc-700/40' : ''}`}>
                {days.map(day => {
                  const vol = getVol(day);
                  const isSelected = selectedDayId === day.template_id;
                  return (
                    <div key={`${key}-${day.template_id}`} className={`flex-1 flex flex-col min-w-0 ${compact ? 'py-1.5 px-2' : 'py-2 px-2.5'} transition-colors duration-300 ${isSelected ? 'bg-blue-50/60 dark:bg-blue-900/30' : 'hover:bg-gray-50/50 dark:hover:bg-zinc-800/30'}`}>
                      <span className={`text-[9px] font-bold shrink-0 ${labelCls} ${compact ? 'mb-1' : 'mb-1.5'} uppercase tracking-wider`}>{cfg.label}</span>
                    <div className="flex flex-wrap gap-1">
                      {vol.map(([k, c]) => (
                        <span key={k} title={`${cfg.names[k]}: ${c}`} className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[8px] font-medium transition-all ${c > 0 ? 'text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 shadow-sm border border-gray-100 dark:border-zinc-700' : 'text-gray-400 dark:text-zinc-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dotMap[k]} ${c > 0 ? 'opacity-100' : 'opacity-40'}`} />
                          <span>{cfg.names[k]}</span>
                          <span className={`text-[7px] tabular-nums ${c > 0 ? 'text-gray-500 dark:text-zinc-400 font-bold' : 'opacity-0 hidden'}`}>{c}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonCalendar() {
  const cols = [1,2,3,4,5,6,7];
  return (
    <div className="w-full rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[400px]">
      <div className="flex border-b border-gray-200/60 dark:border-zinc-700/60 bg-gradient-to-r from-gray-50/50 to-transparent dark:from-zinc-900/30">
        <div className="w-[100px] shrink-0 border-r border-gray-200/60 dark:border-zinc-700/60" />
        {cols.map(i => (
          <div key={i} className="flex-1 py-4 px-2 flex flex-col items-center gap-2">
            <div className="h-3 w-12 bg-gray-200 dark:bg-zinc-700 rounded-full animate-pulse shadow-sm" />
          </div>
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, ri) => (
        <div key={ri} className="flex border-b border-gray-200/40 dark:border-zinc-700/40">
          <div className="w-[100px] shrink-0 border-r border-gray-200/40 dark:border-zinc-700/40 flex items-center justify-center py-5">
            <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-zinc-800 animate-pulse shadow-sm" />
          </div>
          {cols.map((_, ci) => (
            <div key={ci} className="flex-1 p-2 flex items-center justify-center">
              <div className="h-12 w-full max-w-[80px] rounded-xl bg-gray-100 dark:bg-zinc-800 animate-pulse shadow-sm" style={{ animationDelay: `${(ci * 0.1).toFixed(2)}s` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── Day Header Glassmorphism ────────────────────────────────────────────────────
function DayHeaderCompact({ day, isSelected, onClick, compact }) {
  const strengthCount = day.exercises.filter(e => e.category === 'STRENGTH').length;
  const awCount = day.exercises.filter(e => e.category === 'AW').length;
  const hypCount = day.exercises.filter(e => e.category === 'HYPERTROPHY').length;

  return (
    <motion.div
      onClick={() => onClick?.(day)}
      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.04)' }}
      className={`
        flex flex-col items-center justify-between px-1 cursor-pointer h-full transition-all duration-300 relative
        ${compact ? 'py-2' : 'py-3'}
        ${isSelected ? 'bg-blue-50/60 dark:bg-blue-900/30' : 'bg-transparent'}
      `}
    >
      <div className={`flex flex-col items-center w-full z-10 relative h-full justify-between`}>
        {/* Indicatore di selezione con effetto blur e spring anim */}
        <div className={`absolute bottom-[-1px] left-1/2 -translate-x-1/2 h-[2px] rounded-t-full transition-all duration-500 ease-out z-10
          ${isSelected ? 'w-full max-w-[50px] bg-blue-500 shadow-[0_-2px_10px_rgba(59,130,246,0.6)] opacity-100' : 'w-0 bg-transparent opacity-0'}
        `} />
        <span className={`text-[12px] font-black uppercase tracking-widest transition-colors duration-300 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>
          Day {day.weekday + 1}
        </span>
        
        <div className={`flex items-center gap-1.5 ${compact ? 'mt-1.5' : 'mt-2.5'}`}>
          {strengthCount > 0 && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
        className={`
          flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all duration-300
          ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800 shadow-[0_2px_4px_rgba(59,130,246,0.1)]' : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100/50 dark:border-blue-800/20'}
        `}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />
              <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">{strengthCount}</span>
            </motion.div>
          )}
          {awCount > 0 && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
        className={`
          flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all duration-300
          ${isSelected ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800 shadow-[0_2px_4px_rgba(245,158,11,0.1)]' : 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100/50 dark:border-amber-800/20'}
        `}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-sm" />
              <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">{awCount}</span>
            </motion.div>
          )}
          {hypCount > 0 && (
            <motion.div 
              initial={{ scale: 0 }} animate={{ scale: 1 }}
        className={`
          flex items-center gap-1 px-1.5 py-0.5 rounded-full border transition-all duration-300
          ${isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800 shadow-[0_2px_4px_rgba(16,185,129,0.1)]' : 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-800/20'}
        `}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">{hypCount}</span>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

      {/* Row Label con glassmorphism */}
function RowLabelCompact({ label, color, icon: Icon, isHyperGroup = false, compact, isFirstRow = false }) {
  const colorMap = {
    blue: 'from-blue-50/50 to-blue-100/30 text-blue-600 dark:from-blue-900/20 dark:to-blue-900/10 dark:text-blue-400',
    amber: 'from-amber-50/50 to-amber-100/30 text-amber-600 dark:from-amber-900/20 dark:to-amber-900/10 dark:text-amber-400',
    emerald: 'from-emerald-50/50 to-emerald-100/30 text-emerald-600 dark:from-emerald-900/20 dark:to-emerald-900/10 dark:text-emerald-400',
  };
  
  return (
    <div className={`w-[100px] shrink-0 flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br ${colorMap[color] || colorMap.blue} border-r border-gray-200/40 dark:border-zinc-800/40 ${compact ? 'px-1 py-1' : 'px-2 py-4'}`}>
      {Icon && (
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`flex items-center justify-center backdrop-blur-md shadow-sm transition-all
            ${compact ? 'p-1.5 rounded-xl' : 'p-3 rounded-2xl mb-1'}
            ${isHyperGroup 
              ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-400/20 shadow-md shadow-emerald-500/20' 
              : 'bg-white/90 dark:bg-zinc-800/90 border border-gray-200/50 dark:border-zinc-700/50'}
        `}
        >
          <Icon size={compact ? 12 : 16} strokeWidth={2.5} />
        </motion.div>
      )}
      {label && <span className={`font-black uppercase tracking-[0.2em] text-center ${compact ? 'text-[9px]' : 'text-[10px]'}`}>{label}</span>}
    </div>
  );
}

// ── Componente Globale Cursore Drag ──────────────────────────────────────────
function DragCursorStyles() {
  return (
    <style dangerouslySetInnerHTML={{__html: `
      body.cursor-grabbing,
      body.cursor-grabbing * {
        cursor: grabbing !important;
      }
    `}} />
  );
}

// ── Main Component WeeklyCalendar5 ────────────────────────────────────────────
export default function WeeklyCalendar5({ onDaySelect, selectedDayId, initialDays, availableExercises }) {
  const [days, setDays] = useState(() => (initialDays?.length ? addUniqueIds(initialDays) : []));
  const [loading, setLoading] = useState(!initialDays?.length);
  const [activeExercise, setActiveExercise] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [addModal, setAddModal] = useState(null);
  const [showMuscleNames, setShowMuscleNames] = useState(false);
  const [showVolume, setShowVolume] = useState(false);

  // Sync state if initialDays changes externally
  useEffect(() => {
    if (initialDays?.length) {
      setDays(addUniqueIds(initialDays));
      setLoading(false);
    } else {
      api.training.getWeek().then(data => { if (data) { setDays(addUniqueIds(data)); setLoading(false); } });
    }
  }, [initialDays]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event) => {
    const exercise = days.flatMap(d => d.exercises).find(e => e.unique_id === event.active.id);
    setActiveExercise(exercise || null);
    // Add class to body to indicate dragging state for global cursors
    document.body.classList.add('cursor-grabbing');
  };

  const handleDragCancel = () => {
    setActiveExercise(null);
    document.body.classList.remove('cursor-grabbing');
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
    // Assicuriamoci che la classe venga sempre rimossa
    document.body.classList.remove('cursor-grabbing');
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
    if (!window.confirm(`Eliminare "${exercise.exercise_name}"?`)) return;
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
      <div className="w-full rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col min-h-[150px] items-center justify-center">
        <p className="text-sm text-gray-500 font-medium">Nessun giorno caricato</p>
      </div>
    );
  }

  const mainRows = [
    { key: 'strength', label: 'FORZA', filter: e => e.category === 'STRENGTH', color: 'blue', icon: Zap },
    { key: 'aw', label: 'ARM', filter: e => e.category === 'AW', color: 'amber', icon: Target },
  ];
  const hyperSlots = [1, 2, 3, 4, 5].map(n => ({ key: `hypertrophy-${n}`, filter: (e, idx) => e.category === 'HYPERTROPHY' && idx === n - 1, color: 'emerald' }));

  return (
    <div className="no-select-calendar w-full min-w-0 overflow-x-hidden" onSelectStart={(e) => e.preventDefault()}>
      <DragCursorStyles />
      {/* Barra superiore fissa: toggle + header + volume */}
      <div className="sticky top-[60px] z-30 bg-[#F8FAFC]/90 dark:bg-[#09090B]/90 backdrop-blur-xl pb-2 -mx-1 px-1">
      {/* Toggle nomi muscoli - stile Apple */}
      <div className="flex justify-end mb-3 mr-1">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowMuscleNames(v => !v)} 
          className={`
            flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold
            transition-all duration-300 backdrop-blur-md shadow-sm border
            ${showMuscleNames 
              ? 'bg-blue-50/90 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
              : 'bg-white/90 text-gray-600 border-gray-200/80 hover:bg-gray-50 dark:bg-zinc-800/90 dark:text-gray-300 dark:border-zinc-700/80 dark:hover:bg-zinc-700/90'}
          `}
        >
          {showMuscleNames ? <Eye size={12} /> : <EyeOff size={12} />}
          <span>{showMuscleNames ? 'Vista Completa' : 'Vista Compatta'}</span>
        </motion.button>
      </div>

      {/* Container principale con glassmorphism */}
      <div className="no-select-calendar w-full rounded-2xl border border-gray-200/80 dark:border-zinc-700/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-hidden flex flex-col min-w-0" onSelectStart={(e) => e.preventDefault()}>
        {/* Header Row */}
          <div className={`flex border-b border-gray-200/60 dark:border-zinc-700/60 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md relative z-20`}>
          <div className="w-[100px] shrink-0 border-r border-gray-200/60 dark:border-zinc-700/60" />
          <div className="flex-1 grid divide-x divide-gray-200/60 dark:divide-zinc-700/60" style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
            {days.map(day => (
              <DayHeaderCompact key={day.template_id} day={day} isSelected={selectedDayId === day.template_id} onClick={onDaySelect} compact={!showMuscleNames} />
            ))}
          </div>
        </div>

        {/* Volume Row con Data Viz */}
        <VolumeRow days={days} showVolume={showVolume} setShowVolume={setShowVolume} compact={!showMuscleNames} selectedDayId={selectedDayId} />

        {/* Main Grid */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
          <div className="flex flex-col">
            {mainRows.map((row) => (
              <div key={row.key} className="flex border-b border-gray-200/40 dark:border-zinc-700/40">
                <RowLabelCompact label={row.label} color={row.color} icon={row.icon} compact={!showMuscleNames} />
                <div className="flex-1 grid divide-x divide-gray-200/40 dark:divide-zinc-700/40 items-stretch" style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
                  {days.map(day => {
                    const exercises = day.exercises.filter(row.filter);
                    const isSelected = selectedDayId === day.template_id;
                    return (
                      <DroppableCell key={`cell-${day.template_id}-${row.key}`} id={`cell-day-${day.weekday}-${row.key}`} isSelected={isSelected} onClick={() => onDaySelect?.(day)} compact={!showMuscleNames}>
                        <SortableContext items={exercises.map(e => e.unique_id)} strategy={horizontalListSortingStrategy}>
                          <div className={`flex flex-col h-full ${showMuscleNames ? 'gap-2' : 'gap-1'} z-10 relative`}>
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
                            <div className={`flex-1 ${!showMuscleNames ? 'min-h-[36px]' : 'min-h-[44px]'}`}>
                              <InteractiveAddButton 
                                onClick={(e) => { e.stopPropagation(); setAddModal({ dayTemplateId: day.template_id, category: row.key === 'aw' ? 'AW' : 'STRENGTH', dayWeekday: day.weekday }); }}
                                color="blue"
                                compact={!showMuscleNames}
                              />
                            </div>
                          </div>
                        </SortableContext>
                      </DroppableCell>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Hypertrophy */}
            <div className="flex bg-gradient-to-b from-emerald-50/30 to-emerald-100/10 dark:from-emerald-900/5 dark:to-emerald-900/5">
              <RowLabelCompact label="IPER" color="emerald" icon={Dumbbell} isHyperGroup={true} compact={!showMuscleNames} />
              <div className="flex-1 flex flex-col">
                {hyperSlots.map((row, idx) => (
                  <div key={row.key} className={`flex flex-1 ${idx < hyperSlots.length - 1 ? 'border-b border-gray-200/40 dark:border-zinc-700/40' : ''}`}>
                    <div className="flex-1 grid divide-x divide-gray-200/40 dark:divide-zinc-700/40 items-stretch" style={{ gridTemplateColumns: `repeat(${Math.max(days.length, 1)}, minmax(0, 1fr))` }}>
                      {days.map(day => {
                        const hyperExercises = day.exercises.filter(e => e.category === 'HYPERTROPHY');
                        const exercises = hyperExercises.filter((e, i) => row.filter(e, i));
                        const isSelected = selectedDayId === day.template_id;
                        return (
                          <DroppableCell key={`cell-${day.template_id}-${row.key}`} id={`cell-day-${day.weekday}-${row.key}`} isSelected={isSelected} onClick={() => onDaySelect?.(day)} compact={!showMuscleNames}>
                            <SortableContext items={exercises.map(e => e.unique_id)} strategy={horizontalListSortingStrategy}>
                              <div className={`flex flex-col h-full ${showMuscleNames ? 'gap-2' : 'gap-1'} z-10 relative`}>
                                {exercises.map(ex => <CompactExerciseCard key={ex.unique_id} exercise={ex} dayTemplateId={day.template_id} onEdit={handleEdit} onDelete={handleDelete} showMuscleNames={showMuscleNames} />)}
                                <div className={`flex-1 ${!showMuscleNames ? 'min-h-[36px]' : 'min-h-[44px]'}`}>
                                  <InteractiveAddButton 
                                    onClick={(e) => { e.stopPropagation(); setAddModal({ dayTemplateId: day.template_id, category: 'HYPERTROPHY', dayWeekday: day.weekday }); }}
                                    color="emerald"
                                    compact={!showMuscleNames}
                                  />
                                </div>
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

          {/* Drag Overlay con spring animation */}
          <DragOverlay modifiers={[snapCenterToCursor]} dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
            {activeExercise ? (
              <motion.div
                initial={{ rotate: 0, scale: 1 }}
                animate={{ rotate: 4, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                style={{ filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.2))' }}
                className="pointer-events-none opacity-95"
              >
                <CompactExerciseCard exercise={activeExercise} isOverlay showMuscleNames={showMuscleNames} />
              </motion.div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Add Exercise Modal */}
        <AnimatePresence>
          {addModal && (
            <AddExerciseModal
              key="add-modal"
              dayName={addModal.dayWeekday + 1}
              category={addModal.category}
              availableExercises={availableExercises}
              onAdd={handleAddExercise}
              onClose={() => setAddModal(null)}
            />
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <AnimatePresence>
          {editModal && (
            <motion.div 
              key="edit-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md" 
              onClick={() => setEditModal(null)}
            >
              <motion.div 
                key="edit-modal-content"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="w-full max-w-sm rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl shadow-blue-500/10 border border-gray-200/50 dark:border-zinc-700/50 overflow-hidden flex flex-col" 
                style={{ maxHeight: 'calc(100vh - 2rem)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[16px] font-black text-white tracking-tight">Modifica Esercizio</h2>
                    <button onClick={() => setEditModal(null)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">Nome</label>
                    <input
                      type="text"
                      defaultValue={editModal.exercise.exercise_name}
                      id="edit-name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 text-gray-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none placeholder:text-gray-400 shadow-sm transition-all"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 dark:text-zinc-400 mb-1 uppercase tracking-wider">Istruzione</label>
                    <input
                      type="text"
                      defaultValue={editModal.exercise.instruction || ''}
                      id="edit-instruction"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200/80 dark:border-zinc-700/80 bg-white/95 dark:bg-zinc-900/95 text-gray-900 dark:text-zinc-100 text-xs focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 outline-none placeholder:text-gray-400 shadow-sm transition-all"
                      placeholder="es. Wendler 5/3/1"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setEditModal(null)} 
                      className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200 bg-gray-100/50 hover:bg-gray-100 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 rounded-xl transition-all"
                    >
                      Annulla
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleEditSave({ name: document.getElementById('edit-name').value, instruction: document.getElementById('edit-instruction').value })}
                      className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl shadow-md shadow-blue-500/25 transition-all"
                    >
                      Salva Modifiche
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
}
