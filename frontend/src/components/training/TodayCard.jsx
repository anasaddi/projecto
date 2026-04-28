import React, { useMemo, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, Dumbbell } from 'lucide-react';

import { useGlobalConfig } from '../../context/GlobalConfigContext';
import { getActiveMonth, getActiveWeek } from '../../utils/trainingUtils';
import { api } from '../../api/client';
import {
  ISO_LIGHT_KEYS,
  ISO_HEAVY_KEYS,
  ISO_LABELS,
  ISO_LIGHT_WEIGHTS,
  ISO_HEAVY_WEIGHTS,
  SPEED_CONFIG,
  STRENGTH_WEEK_LABELS,
} from '../../constants/trainingConstants';

// ─── AW classification + expansion ─────────────────────────────────────────

function classifyAw(ex) {
  const t = `${ex.exercise_id || ''} ${ex.exercise_name || ''}`.toLowerCase();
  if (ex.exercise_id?.startsWith('aw_v1_') || t.includes('aw_v1') || t.includes('volume 1') || t.includes('vol. 1')) return 'vol1';
  if (ex.exercise_id?.startsWith('aw_v2_') || t.includes('aw_v2') || t.includes('volume 2') || t.includes('vol. 2')) return 'vol2';
  if (t.includes('aw_max') || t.includes('max day') || t.includes('maxday')) return 'maxday';
  if (t.includes('aw_speed') || t.includes('speed')) return 'speed';
  if ((t.includes('iso') || t.includes('isometria')) && (t.includes('pesante') || t.includes('heavy'))) return 'iso_heavy';
  if (t.includes('iso') || t.includes('isometria')) return 'iso_light';
  return 'other';
}

function expandAwExercises(rawAwEx, allProgressions, awProgram) {
  const out = [];
  for (const ex of rawAwEx) {
    const type = classifyAw(ex);
    if (type === 'iso_light' || type === 'iso_heavy') {
      const keys = type === 'iso_light' ? ISO_LIGHT_KEYS : ISO_HEAVY_KEYS;
      const weights = type === 'iso_light' ? ISO_LIGHT_WEIGHTS : ISO_HEAVY_WEIGHTS;
      const target = type === 'iso_light' ? '2×15s' : '2×5s';
      keys.forEach((isoId, i) => {
        const week = getActiveWeek(allProgressions?.[isoId]) || 1;
        const slotKey = `w${week}_s1`;
        out.push({
          exercise_id: isoId, exercise_name: ISO_LABELS[i], _type: type,
          _baseId: ex.exercise_id, _refW: weights[i], _slotKey: slotKey, _target: target
        });
      });
    } else if (type === 'speed') {
      SPEED_CONFIG.forEach(cfg => {
        out.push({
          exercise_id: `${ex.exercise_id}::${cfg.id}`, exercise_name: cfg.label,
          _type: 'speed', _baseId: ex.exercise_id, _speedCfg: cfg.id, _refW: cfg.weight, _target: '6 reps'
        });
      });
    } else if (type === 'maxday') {
      const prog = allProgressions?.[ex.exercise_id] || {};
      let maxWeek = 0;
      Object.keys(prog).forEach(key => {
        if (key.startsWith('w')) {
          const w = parseInt(key.substring(1).split('_')[0]);
          if (!isNaN(w) && (prog[key]?.anas_completed || prog[key]?.flavio_completed) && w > maxWeek) maxWeek = w;
        }
      });
      const week = maxWeek || 1;
      const protoW = ((week - 1) % 5) + 1;
      
      // Defensive validation for awProgram structure
      let weekExercises = [];
      if (awProgram && typeof awProgram === 'object' && 
          awProgram.max_day && typeof awProgram.max_day === 'object' && 
          Array.isArray(awProgram.max_day.weeks)) {
        const weekData = awProgram.max_day.weeks.find(w => w && w.week === protoW);
        if (weekData && Array.isArray(weekData.exercises)) {
          weekExercises = weekData.exercises;
        }
      } else {
        console.warn('[TodayCard] AW program structure is malformed or missing max_day.weeks:', awProgram);
      }
      
      if (weekExercises.length === 0) {
        out.push({ ...ex, _type: type, _baseId: ex.exercise_id });
      } else {
        weekExercises.forEach((mdEx, i) => {
          out.push({
            exercise_id: `${ex.exercise_id}::md_e${i + 1}`,
            exercise_name: mdEx.name,
            _type: 'maxday',
            _baseId: ex.exercise_id,
            _slotKey: `w${week}_e${i + 1}`,
            _refAnas: String(mdEx.anas_1rm ?? ''),
            _refFlavio: String(mdEx.flavio_1rm ?? ''),
          });
        });
      }
    } else {
      out.push({ ...ex, _type: type, _baseId: ex.exercise_id });
    }
  }
  return out;
}

const AW_BADGE = {
  vol1: { label: 'Vol.1', bg: 'bg-amber-500' },
  vol2: { label: 'Vol.2', bg: 'bg-orange-500' },
  iso_light: { label: 'Iso L', bg: 'bg-amber-400' },
  iso_heavy: { label: 'Iso H', bg: 'bg-orange-600' },
  maxday: { label: 'Max', bg: 'bg-rose-500' },
  speed: { label: 'Speed', bg: 'bg-violet-500' },
  other: { label: 'AW', bg: 'bg-amber-500' },
};

// ─── data read helpers ───────────────────────────────────────────────────────

function getAwData(ex, allProgressions) {
  const { _type, exercise_id, _baseId, _slotKey, _speedCfg, _refW, _refAnas, _refFlavio } = ex;
  const ref = String(_refW ?? '');
  if (_type === 'iso_light' || _type === 'iso_heavy') {
    const slot = allProgressions?.[exercise_id]?.[_slotKey] || {};
    return {
      anasC: !!slot?.anas?.completed, flavioC: !!slot?.flavio?.completed,
      anasW: slot?.anas?.weight || ref, flavioW: slot?.flavio?.weight || ref
    };
  }
  if (_type === 'speed') {
    const cfgData = allProgressions?.[_baseId]?.[_speedCfg] || {};
    return {
      anasC: !!cfgData?.anas?.completed, flavioC: !!cfgData?.flavio?.completed,
      anasW: cfgData?.anas?.weight || ref, flavioW: cfgData?.flavio?.weight || ref
    };
  }
  if (_type === 'maxday' && _slotKey) {
    const slotData = allProgressions?.[_baseId]?.[_slotKey] || {};
    return {
      anasC: !!slotData?.anas_completed,
      flavioC: !!slotData?.flavio_completed,
      anasW: slotData?.anas_sx || String(_refAnas ?? ''),
      flavioW: slotData?.flavio_sx || String(_refFlavio ?? ''),
    };
  }
  const prog = allProgressions?.[exercise_id] || {};
  return {
    anasC: !!prog?.anas?.completed, flavioC: !!prog?.flavio?.completed,
    anasW: prog?.anas?.weight ?? '', flavioW: prog?.flavio?.weight ?? ''
  };
}

function getStrengthActiveWeekIdx(prog) {
  const monthIdx = getActiveMonth(prog);
  const month = prog?.dataByMonth?.[monthIdx - 1] || [];
  let wi = month.findIndex(w => !w?.anas?.completed || !w?.flavio?.completed);
  return { monthIdx, wi: wi === -1 ? Math.max(0, month.length - 1) : wi };
}

// ─── UI atoms ────────────────────────────────────────────────────────────────

const getDominantGroup = (muscles, map) => {
  if (!muscles || muscles.length === 0) return null;
  const groups = muscles.map(m => (map || {})[m]).filter(Boolean);
  if (groups.length === 0) return null;
  const counts = groups.reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

function Tick({ checked, onChange, accentBg }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-6 h-6 rounded-xl flex items-center justify-center transition-all duration-500 shrink-0 transform active:scale-90
        ${checked
          ? `${accentBg} border-transparent shadow-[0_0_15px_-3px_rgba(79,70,229,0.5)] dark:shadow-[0_0_20px_-5px_rgba(79,70,229,0.6)]`
          : 'bg-zinc-100/80 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.05] hover:border-indigo-400/50 dark:hover:border-indigo-500/50'}`}
    >
      <div className={`absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 ${checked ? 'opacity-20 animate-pulse bg-white' : ''}`} />
      <svg
        viewBox="0 0 12 12"
        fill="none"
        className={`w-3 h-3 transition-all duration-500 transform ${checked ? 'scale-100 opacity-100 rotate-0' : 'scale-50 opacity-0 -rotate-12'}`}
      >
        <motion.path
          initial={false}
          animate={{ pathLength: checked ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          d="M2.5 6L5 8.5L9.5 3.5"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function KgInput({ value, onChange, placeholder = "00" }) {
  return (
    <div className="relative group shrink-0">
      <input
        type="number"
        step="0.5"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 w-12 rounded-lg border border-zinc-200/50 bg-zinc-100/50 text-center text-xs font-black text-zinc-900 shadow-sm outline-none transition-colors duration-300 placeholder:text-zinc-300 tabular-nums group-hover:border-zinc-300 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-zinc-50 dark:placeholder:text-zinc-700 dark:group-hover:border-white/20"
      />
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full scale-x-0 transition-transform duration-300 group-focus-within:scale-x-100 opacity-50" />
    </div>
  );
}

function MuscDot({ exerciseId, remoteMap, configMap }) {
  const mapToUse = remoteMap || {};
  const group = getDominantGroup(mapToUse[exerciseId] || [], configMap?.MUSCLE_GROUP_MAP);
  const accent = configMap?.GROUP_ACCENT_DOT?.[group] || 'bg-zinc-200 dark:bg-zinc-800';
  return (
    <div className="relative">
      <div className={`w-1.5 h-6 rounded-full shrink-0 ${accent} transition-all duration-500`} style={{ opacity: 0.8 }} />
      <div className={`absolute inset-0 w-1.5 h-6 rounded-full blur-[2px] opacity-40 ${accent}`} />
    </div>
  );
}

function ExRow({ exerciseId, exerciseName, badge, badgeBg, anasC, flavioC, anasW, flavioW, anasR, flavioR, remoteMap, configMap, onToggle, onWeight, onReps, anasOnly = false }) {
  const bothDone = anasC && flavioC;

  return (
    <div className={`relative flex items-center gap-3 py-3.5 px-4 transition-all duration-500 border-b border-zinc-100/50 dark:border-white/[0.04] last:border-0
      ${bothDone ? 'bg-zinc-50/50 dark:bg-black/20' : 'hover:bg-zinc-100/30 dark:hover:bg-white/[0.02]'}`}
    >
      <MuscDot exerciseId={exerciseId} remoteMap={remoteMap} configMap={configMap} />

      <div className="flex-1 min-w-0 pr-2">
        <div className={`text-sm font-bold leading-tight tracking-tight capitalize truncate transition-all duration-500 ${bothDone ? 'text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
          {exerciseName}
        </div>
        <div className="flex items-center gap-2 mt-1.5 overflow-hidden">
          <span className={`text-xs scale-90 font-black tracking-[0.15em] text-white px-1.5 py-0.5 rounded-md uppercase shadow-sm ${badgeBg} opacity-90 shrink-0`}>
            {badge}
          </span>
          {bothDone && (
            <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-2 duration-700 shrink-0">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              <span className="text-xs scale-90 font-black text-emerald-500/80 uppercase tracking-widest">Perfetto</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-8 shrink-0">
        {/* Anas Column */}
        <div className="flex items-center gap-1.5 min-w-[70px] justify-center">
          <KgInput value={anasW} onChange={v => onWeight('anas', v)} />
          {onReps && <KgInput value={anasR} onChange={v => onReps('anas', v)} placeholder="rep" />}
          <Tick checked={anasC} onChange={() => onToggle('anas')} accentBg="bg-indigo-500" />
        </div>

        {/* Flavio Column */}
        {!anasOnly && (
          <div className="flex items-center gap-1.5 min-w-[70px] justify-center">
            <KgInput value={flavioW} onChange={v => onWeight('flavio', v)} />
            {onReps && <KgInput value={flavioR} onChange={v => onReps('flavio', v)} placeholder="rep" />}
            <Tick checked={flavioC} onChange={() => onToggle('flavio')} accentBg="bg-violet-500" />
          </div>
        )}
      </div>

      {bothDone && (
        <div className="absolute inset-x-5 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      )}
    </div>
  );
}

function SectionHeader({ icon: Icon, color, label, showRepsLabels, anasOnly = false }) {
  return (
    <div className="flex flex-col bg-zinc-50/80 dark:bg-white/[0.03] border-b border-zinc-200/50 dark:border-white/[0.08]">
      <div className="flex items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl shadow-inner ${color.replace('text-', 'bg-').replace('-500', '-500/10')}`}>
            <Icon size={14} className={`${color} drop-shadow-sm`} />
          </div>
          <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.22em] sm:tracking-[0.25em] text-zinc-400 dark:text-zinc-500">{label}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-8 shrink-0">
          <span className="text-[10px] sm:text-xs font-black text-indigo-500/60 tracking-[0.18em] sm:tracking-[0.2em] uppercase w-[58px] sm:w-[70px] text-center">Anas</span>
          {!anasOnly && <span className="text-xs font-black text-violet-500/60 tracking-[0.2em] uppercase w-[70px] text-center">Flavio</span>}
        </div>
      </div>
      <div className="flex items-center justify-end px-4 py-1.5 bg-black/[0.02] dark:bg-white/[0.01] border-t border-zinc-100/50 dark:border-white/[0.02] sm:px-5">
        <div className="flex items-center gap-3 sm:gap-8 shrink-0">
          <div className="flex items-center gap-1 w-[58px] sm:w-[70px] justify-center">
            <span className="text-[10px] sm:text-xs scale-75 font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest w-10 sm:w-12 text-center">KG</span>
            {showRepsLabels && <span className="text-xs scale-75 font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest w-12 text-center">REP</span>}
            <span className="text-[10px] sm:text-xs scale-75 font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest w-5 sm:w-6 text-center">✓</span>
          </div>
          {!anasOnly && (
            <div className="flex items-center gap-1 w-[58px] sm:w-[70px] justify-center">
              <span className="text-[10px] sm:text-xs scale-75 font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest w-10 sm:w-12 text-center">KG</span>
              {showRepsLabels && <span className="text-xs scale-75 font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest w-12 text-center">REP</span>}
              <span className="text-[10px] sm:text-xs scale-75 font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest w-5 sm:w-6 text-center">✓</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function TodayCard({ selectedDay, allProgressions, selectedDate, progressPercent, isToday, onProgressionChange, awProgram, embedded = false, anasOnly = false }) {
  const saveTimers = useRef({});
  const { config } = useGlobalConfig();
  const remoteExerciseMap = config?.EXERCISE_MUSCLE_MAP || {};

  // ALL hooks unconditionally first
  const exercises = useMemo(
    () => selectedDay?.exercises?.filter(e => e.is_active !== 0) || [],
    [selectedDay]
  );
  const strengthEx = useMemo(() => exercises.filter(e => e.category === 'STRENGTH'), [exercises]);
  const rawAwEx = useMemo(() => exercises.filter(e => e.category === 'AW'), [exercises]);
  const hypEx = useMemo(() => exercises.filter(e => e.category === 'HYPERTROPHY'), [exercises]);

  // Expand AW into individual sub-exercises (iso → 7 rows, speed → 4 rows, etc.)
  const awEx = useMemo(() => expandAwExercises(rawAwEx, allProgressions, awProgram), [rawAwEx, allProgressions, awProgram]);

  const commitProg = useCallback((exerciseId, newProg) => {
    onProgressionChange?.(exerciseId, newProg);
    clearTimeout(saveTimers.current[exerciseId]);
    saveTimers.current[exerciseId] = setTimeout(() => {
      api.training.updateProgression(exerciseId, newProg);
    }, 700);
  }, [onProgressionChange]);

  // ── STRENGTH handlers ──────────────────────────────────────────────────────
  const toggleStrength = useCallback((exerciseId, athlete) => {
    const emptyWeek = () => ({ week: 1, anas: { weight: '', completed: false }, flavio: { weight: '', completed: false } });
    const emptyMonth = () => [emptyWeek(), { ...emptyWeek(), week: 2 }, { ...emptyWeek(), week: 3 }, { ...emptyWeek(), week: 4 }];
    const baseProg = allProgressions?.[exerciseId] || {};
    const prog = baseProg.dataByMonth?.length ? baseProg : { ...baseProg, dataByMonth: [emptyMonth(), emptyMonth(), emptyMonth(), emptyMonth(), emptyMonth(), emptyMonth()] };
    const { monthIdx, wi } = getStrengthActiveWeekIdx(prog);
    const newData = (prog.dataByMonth || []).map((m, mi) =>
      mi === monthIdx - 1
        ? m.map((w, wii) => wii === wi ? { ...w, [athlete]: { ...w[athlete], completed: !w[athlete]?.completed } } : w)
        : m
    );
    const newProg = { ...prog, dataByMonth: newData };
    commitProg(exerciseId, newProg);
    const week = newData[monthIdx - 1]?.[wi];
    if (week?.anas?.completed && week?.flavio?.completed)
      import('canvas-confetti')
        .then(m => m.default({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ['#4f46e5', '#8b5cf6'] }))
        .catch(err => console.warn('[TodayCard] Failed to load confetti:', err));
  }, [allProgressions, commitProg]);

  const weightStrength = useCallback((exerciseId, athlete, value) => {
    const emptyWeek = () => ({ week: 1, anas: { weight: '', completed: false }, flavio: { weight: '', completed: false } });
    const emptyMonth = () => [emptyWeek(), { ...emptyWeek(), week: 2 }, { ...emptyWeek(), week: 3 }, { ...emptyWeek(), week: 4 }];
    const baseProg = allProgressions?.[exerciseId] || {};
    const prog = baseProg.dataByMonth?.length ? baseProg : { ...baseProg, dataByMonth: [emptyMonth(), emptyMonth(), emptyMonth(), emptyMonth(), emptyMonth(), emptyMonth()] };
    const { monthIdx, wi } = getStrengthActiveWeekIdx(prog);
    const newData = (prog.dataByMonth || []).map((m, mi) =>
      mi === monthIdx - 1
        ? m.map((w, wii) => wii === wi ? { ...w, [athlete]: { ...w[athlete], weight: value } } : w)
        : m
    );
    commitProg(exerciseId, { ...prog, dataByMonth: newData });
  }, [allProgressions, commitProg]);

  // ── AW handlers (iso / speed / maxday / flat) ─────────────────────────────
  const toggleAw = useCallback((ex, athlete) => {
    const { _type, exercise_id, _baseId, _slotKey, _speedCfg } = ex;

    if (_type === 'iso_light' || _type === 'iso_heavy') {
      const prog = allProgressions?.[exercise_id] || {};
      const slot = prog[_slotKey] || {};
      const newProg = { ...prog, [_slotKey]: { ...slot, [athlete]: { ...(slot[athlete] || {}), completed: !slot[athlete]?.completed } } };
      commitProg(exercise_id, newProg);
      return;
    }
    if (_type === 'speed') {
      const prog = allProgressions?.[_baseId] || {};
      const newProg = { ...prog, [_speedCfg]: { ...(prog[_speedCfg] || {}), [athlete]: { ...(prog[_speedCfg]?.[athlete] || {}), completed: !prog[_speedCfg]?.[athlete]?.completed } } };
      commitProg(_baseId, newProg);
      return;
    }
    if (_type === 'maxday' && _slotKey) {
      const prog = allProgressions?.[_baseId] || {};
      const slot = prog[_slotKey] || {};
      const field = athlete === 'anas' ? 'anas_completed' : 'flavio_completed';
      commitProg(_baseId, { ...prog, [_slotKey]: { ...slot, [field]: !slot[field] } });
      return;
    }
    // vol1/vol2/other — flat
    const prog = allProgressions?.[exercise_id] || {};
    commitProg(exercise_id, { ...prog, [athlete]: { ...prog[athlete], completed: !prog[athlete]?.completed } });
  }, [allProgressions, commitProg]);

  const weightAw = useCallback((ex, athlete, value) => {
    const { _type, exercise_id, _baseId, _slotKey, _speedCfg } = ex;

    if (_type === 'iso_light' || _type === 'iso_heavy') {
      const prog = allProgressions?.[exercise_id] || {};
      const slot = prog[_slotKey] || {};
      commitProg(exercise_id, { ...prog, [_slotKey]: { ...slot, [athlete]: { ...(slot[athlete] || {}), weight: value } } });
      return;
    }
    if (_type === 'speed') {
      const prog = allProgressions?.[_baseId] || {};
      commitProg(_baseId, { ...prog, [_speedCfg]: { ...(prog[_speedCfg] || {}), [athlete]: { ...(prog[_speedCfg]?.[athlete] || {}), weight: value } } });
      return;
    }
    if (_type === 'maxday' && _slotKey) {
      const prog = allProgressions?.[_baseId] || {};
      const slot = prog[_slotKey] || {};
      const field = athlete === 'anas' ? 'anas_sx' : 'flavio_sx';
      commitProg(_baseId, { ...prog, [_slotKey]: { ...slot, [field]: value } });
      return;
    }
    const prog = allProgressions?.[exercise_id] || {};
    commitProg(exercise_id, { ...prog, [athlete]: { ...prog[athlete], weight: value } });
  }, [allProgressions, commitProg]);

  // ── HYPERTROPHY handlers ───────────────────────────────────────────────────
  const toggleHyper = useCallback((exerciseId, athlete) => {
    const prog = allProgressions?.[exerciseId] || {};
    const newProg = { ...prog, [athlete]: { ...prog[athlete], completed: !prog[athlete]?.completed } };
    commitProg(exerciseId, newProg);
    if (newProg.anas?.completed && newProg.flavio?.completed)
      import('canvas-confetti')
        .then(m => m.default({ particleCount: 30, spread: 50, origin: { y: 0.7 }, colors: ['#10b981', '#34d399'] }))
        .catch(err => console.warn('[TodayCard] Failed to load confetti:', err));
  }, [allProgressions, commitProg]);

  const weightHyper = useCallback((exerciseId, athlete, value) => {
    const prog = allProgressions?.[exerciseId] || {};
    commitProg(exerciseId, { ...prog, [athlete]: { ...prog[athlete], weight: value } });
  }, [allProgressions, commitProg]);

  const repsHyper = useCallback((exerciseId, athlete, value) => {
    const prog = allProgressions?.[exerciseId] || {};
    commitProg(exerciseId, { ...prog, [athlete]: { ...prog[athlete], reps: value } });
  }, [allProgressions, commitProg]);

  // ── Early return AFTER all hooks ───────────────────────────────────────────
  if (!exercises.length) return null;

  const safeDate = selectedDate ? selectedDate.slice(0, 10) : null;
  const dateLabel = safeDate
    ? new Date(safeDate + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    : selectedDay?.day_name || '';

  const footerLegend = (
    <div className="flex items-center gap-6 sm:gap-8 lg:gap-10">
      {[
        { dot: 'bg-indigo-500', label: 'Forza' },
        { dot: 'bg-amber-500', label: 'AW' },
        { dot: 'bg-emerald-500', label: 'Ipertrofia' },
      ].map(item => (
        <div key={item.label} className="flex items-center gap-2.5">
          <div className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
          <span className="text-xs font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">{item.label}</span>
        </div>
      ))}
    </div>
  );

  const sectionsGrid = (
    <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-zinc-100/80 dark:divide-white/[0.04]">
      {/* Strength Section */}
      <div className="flex flex-col min-h-[280px] lg:min-h-[400px]">
        <SectionHeader icon={Zap} color="text-indigo-500" label="Strength Focus" anasOnly={anasOnly} />
        <div className="flex flex-col flex-1 divide-y divide-zinc-50 dark:divide-white/[0.02]">
          {strengthEx.length > 0 ? strengthEx.map(ex => {
            const prog = allProgressions?.[ex.exercise_id];
            const { monthIdx, wi } = getStrengthActiveWeekIdx(prog);
            const week = prog?.dataByMonth?.[monthIdx - 1]?.[wi] || {};
            return (
              <ExRow key={ex.exercise_id}
                exerciseId={ex.exercise_id} exerciseName={ex.exercise_name}
                badge={STRENGTH_WEEK_LABELS[wi] || '—'} badgeBg="bg-indigo-600"
                anasC={!!week?.anas?.completed} flavioC={!!week?.flavio?.completed}
                anasW={week?.anas?.weight ?? ''} flavioW={week?.flavio?.weight ?? ''}
                remoteMap={remoteExerciseMap} configMap={config}
                onToggle={a => toggleStrength(ex.exercise_id, a)}
                onWeight={(a, v) => weightStrength(ex.exercise_id, a, v)}
                anasOnly={anasOnly}
              />
            );
          }) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 opacity-30 grayscale gap-2">
              <Zap size={24} className="text-zinc-300" />
              <span className="text-xs font-black uppercase tracking-[0.3em] italic">Riposo Attivo</span>
            </div>
          )}
        </div>
      </div>

      {/* AW Section */}
      <div className="flex flex-col min-h-[280px] lg:min-h-[400px]">
        <SectionHeader icon={Target} color="text-amber-500" label="AW Specialization" anasOnly={anasOnly} />
        <div className="flex flex-col flex-1 divide-y divide-zinc-50 dark:divide-white/[0.02]">
          {awEx.length > 0 ? awEx.map(ex => {
            const { anasC, flavioC, anasW, flavioW } = getAwData(ex, allProgressions);
            const badge = AW_BADGE[ex._type] || AW_BADGE.other;
            return (
              <ExRow key={ex.exercise_id}
                exerciseId={ex.exercise_id} exerciseName={ex.exercise_name}
                badge={badge.label} badgeBg={badge.bg}
                anasC={anasC} flavioC={flavioC} anasW={anasW} flavioW={flavioW}
                remoteMap={remoteExerciseMap} configMap={config}
                onToggle={a => toggleAw(ex, a)}
                onWeight={(a, v) => weightAw(ex, a, v)}
                anasOnly={anasOnly}
              />
            );
          }) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 opacity-30 grayscale gap-2">
              <Target size={24} className="text-zinc-300" />
              <span className="text-xs font-black uppercase tracking-[0.3em] italic">Riposo Attivo</span>
            </div>
          )}
        </div>
      </div>

      {/* Hypertrophy Section */}
      <div className="flex flex-col min-h-[280px] lg:min-h-[400px]">
        <SectionHeader icon={Dumbbell} color="text-emerald-500" label="Hypertrophy Foundation" showRepsLabels anasOnly={anasOnly} />
        <div className="flex flex-col flex-1 divide-y divide-zinc-50 dark:divide-white/[0.02]">
          {hypEx.length > 0 ? hypEx.map(ex => {
            const prog = allProgressions?.[ex.exercise_id] || {};
            return (
              <ExRow key={ex.exercise_id}
                exerciseId={ex.exercise_id} exerciseName={ex.exercise_name}
                badge={`${ex.base_sets || 2}×${ex.base_reps || '—'}`} badgeBg="bg-emerald-600"
                anasC={!!prog?.anas?.completed} flavioC={!!prog?.flavio?.completed}
                anasW={prog?.anas?.weight ?? ''} flavioW={prog?.flavio?.weight ?? ''}
                anasR={prog?.anas?.reps ?? ''} flavioR={prog?.flavio?.reps ?? ''}
                remoteMap={remoteExerciseMap} configMap={config}
                onToggle={a => toggleHyper(ex.exercise_id, a)}
                onWeight={(a, v) => weightHyper(ex.exercise_id, a, v)}
                onReps={(a, v) => repsHyper(ex.exercise_id, a, v)}
                anasOnly={anasOnly}
              />
            );
          }) : (
            <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 lg:p-12 opacity-30 grayscale gap-2">
              <Dumbbell size={24} className="text-zinc-300" />
              <span className="text-xs font-black uppercase tracking-[0.3em] italic">Riposo Attivo</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (embedded) {
    return (
      <div className="animate-in fade-in duration-300">
        {sectionsGrid}
        <div className="bg-zinc-50/30 dark:bg-black/20 px-6 py-3.5 border-t border-zinc-100/80 dark:border-white/[0.04] flex items-center justify-between">
          {footerLegend}
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400/40 tracking-[0.2em] uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 animate-pulse" />
            PROJECTO
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 animate-in fade-in zoom-in-95 duration-500">
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between px-4">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="relative group">
            <div className="h-14 w-1.5 bg-indigo-600 rounded-full dark:shadow-[0_0_20px_-5px_rgba(79,70,229,0.8)] transition-all group-hover:h-16" />
            <div className="absolute inset-0 w-1.5 h-14 bg-indigo-400 blur-md opacity-30" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-black text-indigo-500/80 dark:text-indigo-400 uppercase tracking-[0.3em] leading-none">Sessione Odierna</span>
              <div className="h-[1px] w-8 bg-indigo-500/20" />
            </div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-50 capitalize tracking-tight">{dateLabel}</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 pb-1">
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Progresso</span>
              <span className="text-sm font-black text-zinc-900 dark:text-zinc-50 tabular-nums">{progressPercent}%</span>
            </div>
            <div className="relative w-36 h-2 bg-zinc-100 dark:bg-white/[0.04] rounded-full overflow-hidden border border-zinc-200/50 dark:border-white/[0.06] shadow-inner">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-violet-500 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.4)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Unique Unified Card ──────────────────────────────────────────────── */}
      <div className="relative group/card">
        <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 rounded-[32px] blur-2xl opacity-50 group-hover/card:opacity-80 transition-opacity duration-1000" />
        <div className="relative bg-white/95 dark:bg-[#090a0b]/90 backdrop-blur-2xl rounded-[30px] border border-zinc-200/60 dark:border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden">
          {sectionsGrid}
          {/* Card Footer Info */}
          <div className="bg-zinc-50/50 dark:bg-black/40 px-8 py-5 border-t border-zinc-100 dark:border-white/[0.06] flex items-center justify-between">
            {footerLegend}
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-400/40 tracking-[0.2em] uppercase">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30 animate-pulse" />
              PROJECTO
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
