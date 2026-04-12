import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, EyeOff, ArrowUp, ArrowDown, Edit2, Trash2, CheckCircle2, History as HistoryIcon, Zap, Dumbbell } from 'lucide-react';
import { useGlobalConfig } from '../../context/GlobalConfigContext';

// Empty fallbacks for initial render
const FALLBACK_MUSCLE_GROUP_MAP = {};
const FALLBACK_GROUP_ACCENT_DOT = {};
const FALLBACK_EXERCISE_MUSCLE_MAP = {};

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

const getDominantGroup = (muscles, map) => {
  if (!muscles || muscles.length === 0) return null;
  const groups = muscles.map(m => (map || FALLBACK_MUSCLE_GROUP_MAP)[m]).filter(Boolean);
  if (groups.length === 0) return null;
  const counts = groups.reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const getActiveMonthIdx = (progressionData) => {
  if (!progressionData || !Array.isArray(progressionData.dataByMonth)) return 0;
  const dataByMonth = progressionData.dataByMonth;
  let activeMonthIdx = [...dataByMonth].reverse().findIndex(m =>
    Array.isArray(m) && m.some(r => r?.anas?.completed || r?.flavio?.completed)
  );
  if (activeMonthIdx !== -1) {
    activeMonthIdx = (dataByMonth.length - 1) - activeMonthIdx;
    const currentMonth = dataByMonth[activeMonthIdx];
    if (Array.isArray(currentMonth)) {
      const lastCheckedIdx = [...currentMonth].reverse().findIndex(row => row?.anas?.completed || row?.flavio?.completed);
      let activeWeekIdx = lastCheckedIdx !== -1 ? (currentMonth.length - 1 - lastCheckedIdx) + 1 : 0;
      if (activeWeekIdx >= currentMonth.length && activeMonthIdx < dataByMonth.length - 1) {
        activeMonthIdx++;
      }
    }
    return activeMonthIdx;
  }
  return 0;
};

const getActiveWeekIdx = (monthData) => {
  if (!Array.isArray(monthData)) return 0;
  const lastCheckedIdx = [...monthData].reverse().findIndex(row => row?.anas?.completed || row?.flavio?.completed);
  if (lastCheckedIdx === -1) return 0;
  const nextIdx = (monthData.length - 1 - lastCheckedIdx) + 1;
  return Math.min(nextIdx, monthData.length - 1);
};

export function CompactExerciseCard({ exercise, showMuscleNames, progressions, date, isEditMode, onEditAction }) {
  const { config } = useGlobalConfig();
  const EXERCISE_MUSCLE_MAP = config?.EXERCISE_MUSCLE_MAP || FALLBACK_EXERCISE_MUSCLE_MAP;
  const WEEK_CONFIGS = config?.WEEK_CONFIGS || [];
  const MUSCLE_GROUP_MAP = config?.MUSCLE_GROUP_MAP || FALLBACK_MUSCLE_GROUP_MAP;
  const GROUP_ACCENT_DOT = config?.GROUP_ACCENT_DOT || FALLBACK_GROUP_ACCENT_DOT;
  const MUSCLE_BADGE_STYLE = config?.MUSCLE_BADGE_STYLE || {};
  const MUSCLE_DISPLAY_NAME = config?.MUSCLE_DISPLAY_NAME || {};

  // Use backend muscles if available, fallback to hardcoded map (deprecated)
  const muscles = exercise.primary_muscles || EXERCISE_MUSCLE_MAP[exercise.exercise_id] || [];
  const category = exercise.category;
  const isActive = exercise.is_active !== 0;

  // --- Dettagli Aggiuntivi ---
  const progKey = exercise.exercise_id === 'vol1' ? 'aw_v1_dita' : (exercise.exercise_id === 'vol2' ? 'aw_v2_pronazione' : exercise.exercise_id);
  const prog = progressions?.[progKey];
  let details = null;

  if (isActive) {
    if (category === 'STRENGTH') {
      const monthIdx = getActiveMonthIdx(prog);
      const monthData = prog?.dataByMonth?.[monthIdx];
      const weekIdx = getActiveWeekIdx(monthData);
      const weekData = monthData?.[weekIdx];
      const cfg = WEEK_CONFIGS[weekIdx] || { label: '?' };

      if (weekData) {
        details = {
          label: `M${monthIdx + 1} • ${cfg.label}`,
          anas: weekData.anas.weight ? `${weekData.anas.weight}kg` : '?',
          flavio: weekData.flavio.weight ? `${weekData.flavio.weight}kg` : '?'
        };
      } else {
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
      const anasW = prog?.anas?.weight;
      const flavioW = prog?.flavio?.weight;
      details = {
        label: '2 serie',
        anas: anasW ? `${anasW}kg` : '—',
        flavio: flavioW ? `${flavioW}kg` : '—'
      };
    }
  }

  const cardStyle = !isActive
    ? {
      border: 'border-zinc-300/70 dark:border-zinc-700/50 border-dashed',
      bg: 'bg-zinc-100/50 dark:bg-zinc-800/30 grayscale opacity-70',
      badge: 'bg-zinc-400',
      label: 'text-zinc-500 italic',
      icon: Target,
      dot: 'bg-zinc-400',
      anasPillBg: 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500',
      flavioPillBg: 'bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-500'
    }
    : category === 'STRENGTH'
      ? {
        border: 'border-blue-300/70 dark:border-blue-600/30',
        bg: 'bg-gradient-to-br from-blue-50/80 to-indigo-50/40 dark:from-blue-950/20 dark:to-indigo-950/10',
        badge: 'bg-blue-500',
        label: 'text-blue-800 dark:text-blue-300',
        icon: Zap,
        dot: 'bg-blue-400',
        anasPillBg: 'bg-blue-100/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30',
        flavioPillBg: 'bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30'
      }
      : category === 'AW'
        ? {
          border: 'border-amber-300/70 dark:border-amber-600/30',
          bg: 'bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10',
          badge: 'bg-amber-500',
          label: 'text-amber-800 dark:text-amber-300',
          icon: Target,
          dot: 'bg-amber-400',
          anasPillBg: 'bg-blue-100/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/30',
          flavioPillBg: 'bg-emerald-100/50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/30'
        }
        : {
          border: 'border-zinc-200/80 dark:border-zinc-700/60 hover:border-zinc-300/50 dark:hover:border-zinc-600/50',
          bg: 'bg-white/80 dark:bg-zinc-900/40',
          badge: 'bg-zinc-700 dark:bg-zinc-300',
          label: 'text-zinc-800 dark:text-zinc-200',
          icon: Dumbbell,
          dot: 'bg-zinc-400',
          anasPillBg: 'bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200/30 dark:border-blue-800/30',
          flavioPillBg: 'bg-emerald-50/80 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/30 dark:border-emerald-800/30'
        };

  const Icon = cardStyle.icon;

  return (
    <div
      className={`relative group flex flex-col rounded-[1.25rem] border ${cardStyle.border} ${cardStyle.bg} p-2 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden justify-center min-h-[5rem]`}
      title={exercise.exercise_name || exercise.name}
    >
      <div className="flex flex-col items-center justify-center w-full gap-1.5 text-center">
        <div className={`w-5 h-5 rounded-md ${isActive && getDominantGroup(muscles, MUSCLE_GROUP_MAP) ? GROUP_ACCENT_DOT[getDominantGroup(muscles, MUSCLE_GROUP_MAP)] : cardStyle.badge} shadow-sm flex items-center justify-center shrink-0`}>
          <Icon size={10} className="text-white" />
        </div>
        <span className={`text-xs font-black uppercase tracking-tight leading-tight text-center px-1 line-clamp-2 ${cardStyle.label}`}>
          {shortenName(exercise.exercise_name || exercise.name)}
        </span>
        {details && category !== 'HYPERTROPHY' && (
          <span className={`text-xs scale-90 font-black px-1.5 py-0.5 rounded-md ${isActive && getDominantGroup(muscles, MUSCLE_GROUP_MAP) ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300' : cardStyle.badge + ' text-white'} shadow-sm shrink-0 whitespace-nowrap`}>
            {details.label}
          </span>
        )}
      </div>

      {details && isActive && category !== 'AW' && category !== 'HYPERTROPHY' && (
        <div className="flex gap-1 mt-2 w-full">
          <div className={`flex-1 flex justify-center items-center py-0.5 rounded-md ${cardStyle.anasPillBg}`}>
            <span className="text-xs font-bold tracking-tighter">A: {details.anas}</span>
          </div>
          <div className={`flex-1 flex justify-center items-center py-0.5 rounded-md ${cardStyle.flavioPillBg}`}>
            <span className="text-xs font-bold tracking-tighter">F: {details.flavio}</span>
          </div>
        </div>
      )}

      {isEditMode && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-white/90 dark:bg-zinc-900/90 rounded-lg shadow-sm px-1">
          <button onClick={(e) => { e.stopPropagation(); onEditAction('toggleActive', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
            {isActive ? <Eye size={10} /> : <EyeOff size={10} />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onEditAction('moveUp', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ArrowUp size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onEditAction('moveDown', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><ArrowDown size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onEditAction('rename', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"><Edit2 size={10} /></button>
          <button onClick={(e) => { e.stopPropagation(); onEditAction('delete', exercise); }} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-red-500"><Trash2 size={10} /></button>
        </div>
      )}

      {showMuscleNames && muscles.length > 0 && isActive && (
        <div className="flex flex-wrap gap-1 mt-2.5 w-full">
          {muscles.map((m, idx) => {
            const group = MUSCLE_GROUP_MAP[m] || 'unknown';
            const style = MUSCLE_BADGE_STYLE[group] || MUSCLE_BADGE_STYLE.unknown;
            return (
              <span key={idx} className={`text-xs scale-90 font-bold uppercase tracking-tighter px-2 py-0.5 rounded-[8px] border bg-white/80 dark:bg-zinc-900/60 ${style}`}>
                {MUSCLE_DISPLAY_NAME[m] || m}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SkipTodayModal({ onClose, onConfirm }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/20 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xs bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800"
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
