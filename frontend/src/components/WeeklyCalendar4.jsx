import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { 
  Zap, 
  Target, 
  Dumbbell, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Edit2, 
  Trash2,
  X,
  History as HistoryIcon,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Costanti e Mappe ---

const WEEK_CONFIGS = [
  { label: '5x5', anas: '5x5', flavio: '5x5' },
  { label: '6x4', anas: '6x4', flavio: '6x4' },
  { label: '5x3', anas: '5x3', flavio: '5x3' },
  { label: '3x2', anas: '3x2', flavio: '3x2' },
  { label: 'MAX', anas: 'MAX', flavio: 'MAX' },
  { label: 'DL',  anas: 'DL',  flavio: 'DL'  }
];

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

const MUSCLE_BADGE_STYLE = {
  petto: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
  schiena: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  spalle: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/20 dark:text-violet-300 dark:border-violet-500/30',
  bicipiti: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  tricipiti: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-300 dark:border-cyan-500/30',
  avambracci: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  gambe: 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/20 dark:text-pink-300 dark:border-pink-500/30',
  core: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-500/20 dark:text-teal-300 dark:border-teal-500/30',
  unknown: 'bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
};

const GROUP_ACCENT_DOT = {
  petto: 'bg-gradient-to-br from-red-400 to-red-600',
  schiena: 'bg-gradient-to-br from-emerald-400 to-emerald-600',
  spalle: 'bg-gradient-to-br from-violet-400 to-violet-600',
  bicipiti: 'bg-gradient-to-br from-blue-400 to-blue-600',
  tricipiti: 'bg-gradient-to-br from-cyan-400 to-cyan-600',
  avambracci: 'bg-gradient-to-br from-amber-400 to-orange-500',
  gambe: 'bg-gradient-to-br from-pink-400 to-rose-600',
  core: 'bg-gradient-to-br from-teal-400 to-teal-600'
};

const MUSCLE_DOT_COLORS = {
  chest: 'bg-red-500', upper_chest: 'bg-red-400', 
  lats: 'bg-emerald-500', rhomboids: 'bg-emerald-400', traps: 'bg-emerald-600', lower_back: 'bg-emerald-700',
  anterior_delts: 'bg-violet-500', lateral_delts: 'bg-violet-400', rear_delts: 'bg-violet-600',
  biceps: 'bg-blue-500', brachialis: 'bg-blue-400', brachioradialis: 'bg-blue-600', brachiale_brachioradiale: 'bg-blue-500',
  triceps: 'bg-cyan-500', 
  forearms: 'bg-amber-500', pronators: 'bg-amber-400', supinators: 'bg-amber-600',
  wrist_extensors: 'bg-orange-500', wrist_flexors: 'bg-orange-600', finger_flexors: 'bg-orange-400',
  ulnar_deviation: 'bg-pink-500', radial_deviation: 'bg-pink-400', side_pressure: 'bg-pink-600',
  quads: 'bg-pink-500', glutes: 'bg-rose-600', core: 'bg-teal-500'
};

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
  vol1: ['brachiale_brachioradiale', 'finger_flexors', 'side_pressure', 'ulnar_deviation', 'wrist_flexors'],
  vol2: ['wrist_flexors', 'pronators', 'radial_deviation', 'supinators'],
};

const MUSCLE_DISPLAY_NAME = {
  chest: 'Petto', upper_chest: 'Petto Alt', lats: 'Dorsali', rhomboids: 'Romb', traps: 'Trapezi', 
  lower_back: 'L. Back', anterior_delts: 'Delt. Ant', lateral_delts: 'Delt. Lat', rear_delts: 'Delt. Post',
  biceps: 'Bicipiti', brachialis: 'Brachio', brachioradialis: 'Brachio', brachiale_brachioradiale: 'Brachio',
  triceps: 'Tricipiti', forearms: 'Avambr.', pronators: 'Pronat', supinators: 'Supinat',
  wrist_extensors: 'Est. Polso', wrist_flexors: 'Fles. Polso', finger_flexors: 'Fles. Dita',
  ulnar_deviation: 'Dev. Uln', radial_deviation: 'Dev. Rad', side_pressure: 'Side P.',
  quads: 'Quad', glutes: 'Glutei', core: 'Core'
};

// --- Helper Functions ---

const shortenName = (name) => {
  if (!name) return '';
  return name
    .replace(/Trazioni Zavorrate/gi, 'Traz. Zav')
    .replace(/Military Press/gi, 'Mil. Press')
    .replace(/Bench Press/gi, 'Panca Piana')
    .replace(/Squat/gi, 'Squat')
    .replace(/AW Vol. 1/gi, 'AW Vol. 1')
    .replace(/AW Vol. 2/gi, 'AW Vol. 2');
};

const getDominantGroup = (muscles) => {
  if (!muscles || muscles.length === 0) return null;
  const groups = muscles.map(m => MUSCLE_GROUP_MAP[m]).filter(Boolean);
  if (groups.length === 0) return null;
  const counts = groups.reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const getActiveMonthIdx = (progressionData) => {
  if (!progressionData || !progressionData.dataByMonth) return 0;
  let activeMonthIdx = [...progressionData.dataByMonth].reverse().findIndex(m => 
    m.some(r => r.anas.completed || r.flavio.completed)
  );
  if (activeMonthIdx !== -1) {
    activeMonthIdx = (progressionData.dataByMonth.length - 1) - activeMonthIdx;
    const currentMonth = progressionData.dataByMonth[activeMonthIdx];
    if (currentMonth) {
      const lastCheckedIdx = [...currentMonth].reverse().findIndex(row => row.anas.completed || row.flavio.completed);
      let activeWeekIdx = lastCheckedIdx !== -1 ? (currentMonth.length - 1 - lastCheckedIdx) + 1 : 0;
      if (activeWeekIdx >= currentMonth.length && activeMonthIdx < progressionData.dataByMonth.length - 1) {
        activeMonthIdx++;
      }
    }
    return activeMonthIdx;
  }
  return 0;
};

const getActiveWeekIdx = (monthData) => {
  if (!monthData) return 0;
  const lastCheckedIdx = [...monthData].reverse().findIndex(row => row.anas.completed || row.flavio.completed);
  if (lastCheckedIdx === -1) return 0;
  const nextIdx = (monthData.length - 1 - lastCheckedIdx) + 1;
  return Math.min(nextIdx, monthData.length - 1);
};

// --- Internal Components ---

function CompactExerciseCard({ exercise, showMuscleNames, progressions, date, isEditMode, onEditAction }) {
  const muscles = EXERCISE_MUSCLE_MAP[exercise.exercise_id] || [];
  const category = exercise.category;
  const isActive = exercise.is_active !== 0;

  // --- Dettagli Aggiuntivi (Mese, Schema, Pesi) ---
  const progKey = exercise.exercise_id === 'vol1' ? 'aw_v1_dita' : (exercise.exercise_id === 'vol2' ? 'aw_v2_pronazione' : exercise.exercise_id);
  const prog = progressions?.[progKey];
  let details = null;
  
  if (isActive) {
    if (category === 'STRENGTH') {
      const monthIdx = getActiveMonthIdx(prog);
      const monthData = prog?.dataByMonth?.[monthIdx];
      const weekIdx = getActiveWeekIdx(monthData);
      const weekData = monthData?.[weekIdx];
      const cfg = WEEK_CONFIGS[weekIdx];
      
      if (weekData) {
        details = {
          label: `M${monthIdx + 1} • ${cfg.label}`,
          anas: weekData.anas.weight ? `${weekData.anas.weight}kg` : '?',
          flavio: weekData.flavio.weight ? `${weekData.flavio.weight}kg` : '?'
        };
      } else {
        // Fallback se non ci sono dati di progressione
        const sets = exercise.base_sets || 4;
        const reps = exercise.base_reps || 'RPE';
        details = {
          label: `M1 • ${sets}x${reps}`,
          anas: '?',
          flavio: '?'
        };
      }
    } else if (category === 'AW') {
      let currentW = 1;
      if (prog) {
        for (let w = 5; w >= 1; w--) {
          if (prog[`w${w}_s1`]?.anas?.completed || prog[`w${w}_s1`]?.flavio?.completed) {
            currentW = Math.min(w + 1, 5);
            break;
          }
        }
      }
      const weekData = prog?.[`w${currentW}_s1`];
      details = {
        label: `W${currentW}`,
        anas: weekData?.anas?.weight ? `${weekData.anas.weight}kg` : '?',
        flavio: weekData?.flavio?.weight ? `${weekData.flavio.weight}kg` : '?'
      };
    } else if (category === 'HYPERTROPHY') {
      const firstRow = prog?.rows?.[0];
      const anasW = firstRow?.anas?.weight || prog?.anas?.weight;
      const flavioW = firstRow?.flavio?.weight || prog?.flavio?.weight;
      const sets = exercise.base_sets || 3;
      const reps = exercise.base_reps || 10;
      details = {
        label: `${sets}x${reps}`,
        anas: anasW ? `${anasW}kg` : '?',
        flavio: flavioW ? `${flavioW}kg` : '?'
      };
    }
  }

  const accentDot = category === 'AW'
    ? 'bg-gradient-to-br from-amber-400 to-orange-500'
    : (() => { const g = getDominantGroup(muscles); return g ? (GROUP_ACCENT_DOT[g] || 'bg-zinc-400') : 'bg-zinc-400'; })();

  const cardStyle = !isActive
    ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-200/50 dark:bg-zinc-800/80 grayscale opacity-60'
    : category === 'STRENGTH'
    ? 'border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10'
    : category === 'AW'
    ? 'border-amber-100 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-900/10'
    : 'border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-900/10';

  return (
    <div 
      className={`relative group rounded-xl border ${cardStyle} shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden flex flex-col justify-center items-center px-2 py-1 text-center
        ${category === 'AW' ? 'min-h-[34px]' : 'min-h-[68px]'}
        ${!isActive ? 'grayscale opacity-70 border-dashed' : ''}
      `}
      title={exercise.exercise_name || exercise.name}
    >
      <div className={`absolute top-0 left-0 bottom-0 w-1 ${isActive ? accentDot : 'bg-zinc-500'}`} />
      
      <div className="flex flex-col items-center w-full gap-0.5">
        {/* Nome Esercizio (Sempre sopra) */}
        <div className="flex items-center justify-center w-full gap-1 px-1">
          {!isActive && <Target size={8} className="text-zinc-500 shrink-0" />}
          <div className={`text-[10px] font-black uppercase tracking-tight text-center line-clamp-1
            ${!isActive ? 'text-zinc-500 italic' : 'text-zinc-800 dark:text-zinc-100'}`}>
            {shortenName(exercise.exercise_name || exercise.name)}
          </div>
        </div>

        {/* Parte Sotto: Schema (SX) e Pesi (DX) per Forza e Ipertrofia */}
        {details && isActive && category !== 'AW' && (
          <div className="flex items-center w-full mt-1 pt-1 border-t border-zinc-100/50 dark:border-zinc-800/50">
            {/* Schema a SX */}
            <div className="flex-1 flex justify-center border-r border-zinc-100/30 dark:border-zinc-800/30 pr-1">
              <span className={`text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded-md
                ${category === 'STRENGTH' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                {details.label}
              </span>
            </div>
            
            {/* Pesi a DX */}
            <div className="flex-1 flex flex-col items-center gap-0 pl-1 leading-none">
              <span className="text-[7px] font-bold text-blue-500 tracking-tighter">A: {details.anas}</span>
              <span className="text-[7px] font-bold text-emerald-500 tracking-tighter">F: {details.flavio}</span>
            </div>
          </div>
        )}

        {/* Solo Schema per AW (Niente Pesi) */}
        {details && isActive && category === 'AW' && (
          <div className="flex items-center justify-center mt-0.5">
            <span className="text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {details.label}
            </span>
          </div>
        )}

        {isEditMode && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-zinc-900/90 rounded-lg shadow-sm px-1">
            <button onClick={(e) => { e.stopPropagation(); onEditAction('toggleActive', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
              {isActive ? <Eye size={10} /> : <EyeOff size={10} />}
            </button>
            <button onClick={(e) => { e.stopPropagation(); onEditAction('moveUp', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ArrowUp size={10} /></button>
            <button onClick={(e) => { e.stopPropagation(); onEditAction('moveDown', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ArrowDown size={10} /></button>
            <button onClick={(e) => { e.stopPropagation(); onEditAction('rename', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><Edit2 size={10} /></button>
            <button onClick={(e) => { e.stopPropagation(); onEditAction('delete', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-red-500"><Trash2 size={10} /></button>
          </div>
        )}
      </div>

      {/* Muscle Badges (Dettagli) */}
      {showMuscleNames && muscles.length > 0 && isActive && (
        <div className="flex flex-wrap justify-center gap-1 mt-1.5 w-full">
          {muscles.map((m, idx) => {
            const group = MUSCLE_GROUP_MAP[m] || 'unknown';
            const style = MUSCLE_BADGE_STYLE[group] || MUSCLE_BADGE_STYLE.unknown;
            return (
              <span 
                key={idx} 
                className={`text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full border ${style}`}
              >
                {MUSCLE_DISPLAY_NAME[m] || m}
              </span>
            );
          })}
        </div>
      )}

      {/* Muscle Dots (Compatto) */}
      {showMuscleNames && muscles.length > 0 && !isEditMode && isActive && (
        <div className={`flex justify-center gap-[3px] w-full ${category === 'AW' ? 'mt-0.5' : 'mt-1'}`}>
          {muscles.slice(0, category === 'AW' ? 6 : 4).map((m, idx) => (
            <div key={idx} className={`rounded-full ${MUSCLE_DOT_COLORS[m] || 'bg-zinc-400'} shadow-sm ${category === 'AW' ? 'w-1 h-1' : 'w-1.5 h-1.5'}`} title={m} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkipTodayModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xs bg-white dark:bg-zinc-900 rounded-[2.5rem] p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center">
            <HistoryIcon className="text-amber-500 w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 tracking-tight">Oggi è riposo?</h3>
            <p className="text-sm text-zinc-500 mt-1">Vuoi saltare questa giornata nel calendario?</p>
          </div>
          <div className="flex w-full gap-3 mt-2">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-sm">No</button>
            <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20">Si, Salta</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Main Component ---

function WeeklyCalendar4({ onSelectDay, progressions, schedule, loading, onEditAction, onToggleComplete, onAddExercise }) {
  const [showMuscleNames, setShowMuscleNames] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [addModal, setAddModal] = useState(null); // { dayTemplateId, category, weekday }
  const scrollRef = useRef(null);

  const GIORNI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

  const rows = [
    { key: 'strength', label: 'FORZA', filter: e => e.category === 'STRENGTH', color: 'text-blue-500', icon: Zap },
    { key: 'aw', label: 'AW', filter: e => e.category === 'AW', color: 'text-amber-500', icon: Target },
    { key: 'hyper', label: 'IPER', filter: e => e.category === 'HYPERTROPHY', color: 'text-emerald-500', icon: Dumbbell }
  ];

  // Auto-scroll a oggi
  useEffect(() => {
    if (!loading && schedule?.length > 0 && scrollRef.current) {
      setTimeout(() => {
        const todayEl = scrollRef.current.querySelector('.is-today-marker');
        if (todayEl) {
          todayEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }, 100);
    }
  }, [loading, schedule]);

  const handleEditAction = (action, exercise, template_id) => {
    if (onEditAction) onEditAction(action, exercise, template_id);
  };

  const toggleComplete = (date, current) => {
    if (onToggleComplete) onToggleComplete(date, !current);
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.2s]" />
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full select-none">
      {/* Tool Header */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-zinc-900 dark:bg-white flex items-center justify-center">
            <Zap className="text-white dark:text-zinc-900 w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight uppercase">Programma</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Weekly Protocol</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMuscleNames(!showMuscleNames)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
              ${showMuscleNames 
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            {showMuscleNames ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>{showMuscleNames ? 'Dettagli' : 'Compatto'}</span>
          </button>

          <button 
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
              ${isEditMode 
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
          >
            <Edit2 size={12} />
            <span>{isEditMode ? 'Fine' : 'Gestisci'}</span>
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-8 pt-2 px-2 snap-x snap-mandatory custom-scrollbar"
        style={{ scrollPadding: '1rem' }}
      >
        {schedule?.map((day, idx) => {
          const dateObj = new Date(day.date || day.date_);
          const isToday = dateObj.toDateString() === new Date().toDateString();
          const dayName = GIORNI[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1];
          const dateLabel = dateObj.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });
          const isSunday = dateObj.getDay() === 0;
          const template = day.template;

          return (
            <div 
              key={idx} 
              className={`flex-shrink-0 w-[185px] snap-start transition-all duration-500 ${isToday ? 'is-today-marker' : ''}`}
            >
              <div 
                onClick={() => template && !isSunday && onSelectDay(template, day.date || day.date_)}
                className={`h-full flex flex-col gap-3 p-4 rounded-[2.5rem] border transition-all duration-300 relative cursor-pointer
                  ${isToday 
                    ? 'bg-white dark:bg-zinc-900 border-amber-500/40 shadow-2xl shadow-amber-500/10 scale-[1.02] z-10' 
                    : 'bg-white/60 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }
                  ${day.is_completed ? 'border-emerald-500/30' : ''}
                  ${isSunday ? 'opacity-50 grayscale' : ''}
                `}
              >
                {/* Header Giorno */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-amber-500' : 'text-zinc-400'}`}>
                      {dayName}
                    </span>
                    <span className="text-xs font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter">
                      {dateLabel}
                    </span>
                  </div>
                  
                  {!isSunday && (
                    <motion.button 
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => { e.stopPropagation(); toggleComplete(day.date || day.date_, day.is_completed); }}
                      className={`p-2.5 rounded-2xl transition-all shadow-lg ${day.is_completed ? 'text-white bg-emerald-500 shadow-emerald-500/20' : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800 hover:text-amber-500 hover:bg-amber-500/10'}`}
                    >
                      <CheckCircle2 size={16} />
                    </motion.button>
                  )}
                </div>

                {/* Lista Esercizi */}
                <div className="flex-1 flex flex-col gap-2">
                  {rows.map(row => {
                    let exercises = template?.exercises?.filter(row.filter) || [];
                    
                    // Se il giorno è passato e NON completato, non mostriamo gli esercizi pianificati
                    const isPast = !isToday && dateObj < new Date();
                    if (isPast && !day.is_completed && !isEditMode) {
                      exercises = [];
                    }

                    // Ordiniamo gli esercizi: prima gli attivi, poi i disattivati
                    exercises = [...exercises].sort((a, b) => {
                      const activeA = a.is_active !== 0 ? 1 : 0;
                      const activeB = b.is_active !== 0 ? 1 : 0;
                      return activeB - activeA;
                    });

                    // Compattiamo AW solo se NON siamo in modalità modifica
                    if (row.key === 'aw' && !isEditMode) {
                      const hasVol1 = exercises.some(e => e.exercise_id?.startsWith('aw_v1_'));
                      const hasVol2 = exercises.some(e => e.exercise_id?.startsWith('aw_v2_'));
                      const others = exercises.filter(e => !e.exercise_id?.startsWith('aw_v1_') && !e.exercise_id?.startsWith('aw_v2_') && e.is_active !== 0);
                      const inactiveExercises = exercises.filter(e => e.is_active === 0);
                      
                      const compacted = [];
                      if (hasVol1) compacted.push({ exercise_id: 'vol1', exercise_name: 'AW Vol. 1', category: 'AW', is_active: 1 });
                      if (hasVol2) compacted.push({ exercise_id: 'vol2', exercise_name: 'AW Vol. 2', category: 'AW', is_active: 1 });
                      compacted.push(...others);
                      compacted.push(...inactiveExercises);
                      exercises = compacted;
                    }

                    return (
                      <div key={row.key} className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 px-1 opacity-20">
                          <row.icon size={10} className={row.color} />
                          <span className="text-[8px] font-black tracking-widest text-zinc-500">{row.label}</span>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {exercises.map((ex, eIdx) => (
                            <CompactExerciseCard 
                              key={`${row.key}-${eIdx}`} 
                              exercise={ex} 
                              showMuscleNames={showMuscleNames} 
                              progressions={progressions}
                              date={day.date || day.date_}
                              isEditMode={isEditMode}
                              onEditAction={(action, exercise) => handleEditAction(action, exercise, day.template_id)}
                            />
                          ))}
                          {exercises.length === 0 && (
                             <div className={`${row.key === 'aw' ? 'min-h-[34px]' : 'min-h-[68px]'} rounded-xl border border-dashed border-zinc-100 dark:border-zinc-800/50 flex items-center justify-center opacity-30`}>
                               <span className="text-[7px] font-black uppercase tracking-widest text-zinc-400">Rest</span>
                             </div>
                           )}
                        </div>
                      </div>
                    );
                  })}

                  {isEditMode && !isSunday && (
                    <div className="flex gap-1.5 mt-2">
                      {rows.map(row => (
                        <button 
                          key={row.key}
                          onClick={(e) => { e.stopPropagation(); setAddModal({ dayTemplateId: day.template_id, category: row.key === 'strength' ? 'STRENGTH' : (row.key === 'aw' ? 'AW' : 'HYPERTROPHY'), weekday: dateObj.getDay() }); }}
                          className={`flex-1 py-2 rounded-xl border-2 border-dashed border-zinc-100 dark:border-zinc-800 flex items-center justify-center transition-colors hover:border-zinc-300 dark:hover:border-zinc-600`}
                        >
                          <row.icon size={12} className={row.color} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CSS per scrollbar */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; }
      `}} />
    </div>
  );
}

export default WeeklyCalendar4;
