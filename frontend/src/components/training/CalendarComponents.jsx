import React from 'react';
import { motion } from 'framer-motion';
import { Target, Eye, EyeOff, ArrowUp, ArrowDown, Edit2, Trash2, CheckCircle2, History as HistoryIcon } from 'lucide-react';
import { 
  WEEK_CONFIGS, 
  MUSCLE_GROUP_MAP, 
  MUSCLE_BADGE_STYLE, 
  GROUP_ACCENT_DOT, 
  MUSCLE_DOT_COLORS, 
  EXERCISE_MUSCLE_MAP, 
  MUSCLE_DISPLAY_NAME 
} from './calendarConstants';

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
  const muscles = EXERCISE_MUSCLE_MAP[exercise.exercise_id] || [];
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
      
      <div className="flex flex-col items-center justify-center w-full gap-0.5 flex-1 min-h-0">
        <div className="flex items-center justify-center w-full gap-1 px-1">
          {!isActive && <Target size={8} className="text-zinc-500 shrink-0" />}
          <div className={`text-[10px] font-black uppercase tracking-tight text-center line-clamp-1
            ${!isActive ? 'text-zinc-500 italic' : 'text-zinc-800 dark:text-zinc-100'}`}>
            {shortenName(exercise.exercise_name || exercise.name)}
          </div>
        </div>

        {details && isActive && category !== 'AW' && (
          <div className="flex items-stretch w-full mt-1 pt-1 border-t border-zinc-100/50 dark:border-zinc-800/50 min-h-[32px]">
            <div className="flex-1 flex justify-center items-center border-r border-zinc-100/30 dark:border-zinc-800/30 pr-1">
              <span className={`text-[7px] font-bold uppercase tracking-widest px-1 py-0.5 rounded-md
                ${category === 'STRENGTH' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : 
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                {details.label}
              </span>
            </div>
            <div className="flex-1 flex flex-col justify-center items-center gap-0 pl-1 leading-none">
              <span className="text-[7px] font-bold text-blue-500 tracking-tighter">A: {details.anas}</span>
              <span className="text-[7px] font-bold text-emerald-500 tracking-tighter">F: {details.flavio}</span>
            </div>
          </div>
        )}

        {details && isActive && category === 'AW' && (
          <div className="flex items-center justify-center min-h-[20px]">
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

      {showMuscleNames && muscles.length > 0 && isActive && (
        <div className="flex flex-wrap justify-center gap-1 mt-1.5 w-full">
          {muscles.map((m, idx) => {
            const group = MUSCLE_GROUP_MAP[m] || 'unknown';
            const style = MUSCLE_BADGE_STYLE[group] || MUSCLE_BADGE_STYLE.unknown;
            return (
              <span key={idx} className={`text-[7px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full border ${style}`}>
                {MUSCLE_DISPLAY_NAME[m] || m}
              </span>
            );
          })}
        </div>
      )}

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

export function SkipTodayModal({ onClose, onConfirm }) {
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
