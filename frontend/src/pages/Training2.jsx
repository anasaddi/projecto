import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/client';
import WeeklyCalendar4 from '../components/WeeklyCalendar4';
import StrengthTable2 from '../components/StrengthTable2';
import { Dumbbell, Swords, Target, ChevronRight, Undo2, Redo2, CheckCircle2, ChevronDown, ChevronUp, History, User, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Epley Formula
const calc1RM = (weight, reps) => {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r) return null;
  if (r === 1) return w;
  return w * (1 + r / 30);
};
const roundToHalf = (n) => (Math.round(n * 2) / 2).toFixed(1);
const format1RM = (weight, reps) => {
  const rm = calc1RM(weight, reps);
  return rm != null ? `${roundToHalf(rm)} kg` : '-';
};

// AW Volume 1/2 Config
const AW_VOL_CONFIG = {
  aw_v1_dita: { weight: 12, pattern: 'std' },
  aw_v1_back_press: { weight: 15, pattern: 'std' },
  aw_v1_wrist_wrench: { weight: 10, pattern: 'alt' },
  aw_v1_side_press: { weight: 12, pattern: 'std' },
  aw_v1_ulnar_chop: { weight: '5-8', pattern: 'std' },
  aw_v2_pronazione: { weight: 10, pattern: 'std' },
  aw_v2_cupping: { weight: 15, pattern: 'alt' },
  aw_v2_supination: { weight: 10, pattern: 'std' },
  aw_v2_rising: { weight: 10, pattern: 'std' },
  aw_v2_rev_pron: { weight: 5, pattern: 'std' },
};

const AW_ISO_CONFIG = {
  // Light (60% 1RM) - 2 serie 15 sec
  'Rising + back': { weight: 12, target: '2x15s', prefix: 'aw_iso_light' },
  'Cup + drag': { weight: 18, target: '2x15s', prefix: 'aw_iso_light' },
  'Pronation 45°': { weight: 15, target: '2x15s', prefix: 'aw_iso_light' },
  'Side + supination': { weight: 9, target: '2x15s', prefix: 'aw_iso_light' },
  'Mazurenko dita': { weight: 15, target: '2x15s', prefix: 'aw_iso_light' },
  'Press': { weight: 15, target: '2x15s', prefix: 'aw_iso_light' },
  'Bicipite': { weight: 18, target: '2x15s', prefix: 'aw_iso_light' },

  // Heavy (85% 1RM) - 2 serie 5 sec
  'Rising + back_heavy': { weight: 17, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Cup + drag_heavy': { weight: 23, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Pronation 45°_heavy': { weight: 20, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Side + supination_heavy': { weight: 13, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Mazurenko dita_heavy': { weight: 20, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Press_heavy': { weight: 19, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Bicipite_heavy': { weight: 23, target: '2x5s', prefix: 'aw_iso_heavy' },

  // Map IDs as well for backward compatibility
  aw_iso_light_rising: { weight: 12, target: '2x15s' },
  aw_iso_light_cup: { weight: 18, target: '2x15s' },
  aw_iso_light_pronation: { weight: 15, target: '2x15s' },
  aw_iso_light_side: { weight: 9, target: '2x15s' },
  aw_iso_light_dita: { weight: 15, target: '2x15s' },
  aw_iso_light_press: { weight: 15, target: '2x15s' },
  aw_iso_light_bicipite: { weight: 18, target: '2x15s' },
  aw_iso_heavy_rising: { weight: 17, target: '2x5s' },
  aw_iso_heavy_cup: { weight: 23, target: '2x5s' },
  aw_iso_heavy_pronation: { weight: 20, target: '2x5s' },
  aw_iso_heavy_side: { weight: 13, target: '2x5s' },
  aw_iso_heavy_dita: { weight: 20, target: '2x5s' },
  aw_iso_heavy_press: { weight: 19, target: '2x5s' },
  aw_iso_heavy_bicipite: { weight: 23, target: '2x5s' }
};
const AW_STD = ['2x10', '3x8', '4x8', '5x7', '6x7'];
const AW_ALT = ['2x8', '2x10', '2x12', '3x10', '3x12'];
const AW_PROGRAM_FALLBACK = {
  max_day: {
    title: '30-36 REP - ESERCIZI MAX DAY',
    weeks: [
      { week: 1, exercises: [{ name: 'DITA MAZURENKO', anas_1rm: 23, flavio_1rm: 31 }, { name: 'RISING (45°)', anas_1rm: 18, flavio_1rm: 20 }, { name: 'LOW MULTI DRAG', anas_1rm: 30, flavio_1rm: 35 }] },
      { week: 2, exercises: [{ name: 'DITA MANIGLIA', anas_1rm: 22, flavio_1rm: 30 }, { name: 'HIGH MULTI SIDE', anas_1rm: 'Sx 15 dx 20', flavio_1rm: 'Sx 15 dx 22,5' }, { name: 'PRESS', anas_1rm: 30, flavio_1rm: 30 }] },
      { week: 3, exercises: [{ name: 'DITA MAZURENKO', anas_1rm: 26.5, flavio_1rm: 32 }, { name: 'PRONATION 45°', anas_1rm: 26.5, flavio_1rm: 30 }, { name: 'DEFENSE HOOK', anas_1rm: 38, flavio_1rm: 38 }] },
      { week: 4, exercises: [{ name: 'DITA MANIGLIA', anas_1rm: '', flavio_1rm: '' }, { name: 'HIGH MULTI DRAG', anas_1rm: '27(30)', flavio_1rm: '27 sx 32 (35) dx' }, { name: 'LOW PRONATION 45°', anas_1rm: 25, flavio_1rm: 30 }] },
      { week: 5, exercises: [{ name: 'DITA MAZURENKO', anas_1rm: '', flavio_1rm: '' }, { name: 'LOW MULTI SIDE', anas_1rm: '', flavio_1rm: '' }, { name: 'LAT DRAG', anas_1rm: '', flavio_1rm: '' }] }
    ]
  },
  light: {
    title: 'LIGHT (60% 1RM) - 2 serie 15 sec',
    exercises: [
      { name: 'Rising + back', w1: 12, w2: 12, w3: 12, w4: 12, w5: 12 },
      { name: 'Cup + drag', w1: 18, w2: 18, w3: 18, w4: 18, w5: 18 },
      { name: 'Pronation 45°', w1: 15, w2: 15, w3: 15, w4: 15, w5: 15 },
      { name: 'Side + supination', w1: 9, w2: 9, w3: 9, w4: 9, w5: 9 },
      { name: 'Mazurenko dita', w1: 15, w2: 15, w3: 15, w4: 15, w5: 15 },
      { name: 'Press', w1: 15, w2: 15, w3: 15, w4: 15, w5: 15 },
      { name: 'Bicipite', w1: 18, w2: 18, w3: 18, w4: 18, w5: 18 }
    ]
  },
  heavy: {
    title: 'HEAVY (85% 1RM) - 2 serie 5 sec',
    exercises: [
      { name: 'Rising + back', w1: 17, w2: 17, w3: 17, w4: 17, w5: 17 },
      { name: 'Cup + drag', w1: 23, w2: 23, w3: 23, w4: 23, w5: 23 },
      { name: 'Pronation 45°', w1: 20, w2: 20, w3: 20, w4: 20, w5: 20 },
      { name: 'Side + supination', w1: 13, w2: 13, w3: 13, w4: 13, w5: 13 },
      { name: 'Mazurenko dita', w1: 20, w2: 20, w3: 20, w4: 20, w5: 20 },
      { name: 'Press', w1: 19, w2: 19, w3: 19, w4: 19, w5: 19 },
      { name: 'Bicipite', w1: 23, w2: 23, w3: 23, w4: 23, w5: 23 }
    ]
  },
  speed: {
    title: 'SPEED AW - 50% 1RM + BANDS - 6x6',
    exercises: [
      { name: 'LAT + CUP', weight: 10 },
      { name: 'PRONATION 45', weight: 10 },
      { name: 'LOW MULTI SIDE', weight: 10 },
      { name: 'HIGH MULTI SIDE', weight: 10 }
    ]
  }
};

// Piccole intestazioni per kg, r, s
const ColHeader = ({ label, className = '' }) => (
  <span className={`text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider ${className}`}>{label}</span>
);

// Shared UI Components
const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl bg-white dark:bg-zinc-900/90 border border-gray-200/60 dark:border-zinc-800/80 shadow-sm hover:shadow-md transition-shadow overflow-hidden ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ icon: Icon, title, subtitle, colorClass }) => (
  <div className="flex items-center gap-3 mb-5">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${colorClass}`}>
      <Icon size={20} className="text-white" />
    </div>
    <div>
      <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">{title}</h3>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  </div>
);

const AthleteAvatar = ({ initial, colorClass }) => (
  <div className={`rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm p-[5px] ${colorClass}`}>
    {initial}
  </div>
);

// Form Input UI
const ModernInput = ({ value, onChange, placeholder, type = 'text', step, className = '' }) => (
  <input
    type={type}
    step={step}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`w-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700/60 rounded-lg text-xs text-center font-semibold text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-500 ${className}`}
  />
);

const ModernCheckbox = ({ checked, onChange, colorClass = 'accent-blue-500' }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={`w-4 h-4 rounded-md border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 transition-all cursor-pointer ${colorClass}`}
  />
);

// --- STRENGTH TABLE ---
const WEEK_CONFIGS = [
  { week: 1, sets: 5, targetReps: 5, percent: 0.75, label: '5x5', desc: 'Volume', intensity: '75%' },
  { week: 2, sets: 4, targetReps: 4, percent: 0.80, label: '4x4', desc: 'Intensità', intensity: '80%' },
  { week: 3, sets: 1, targetReps: 'AMRAP', percent: 0.85, label: 'AMRAP', desc: 'Test PR', intensity: '85%' },
  { week: 4, sets: 3, targetReps: 5, percent: 0.60, label: '3x5', desc: 'Deload', intensity: '60%' },
];

const createMonthData = () => WEEK_CONFIGS.map(cfg => ({
  week: cfg.week,
  anas: { weight: '', reps: '', completed: false },
  flavio: { weight: '', reps: '', completed: false }
}));

const STRENGTH_STORAGE_KEY = (id) => `training2_strength_${id}`;

const StrengthTable = ({ exercise, onRowsChange }) => {
  const { exercise_id, exercise_name } = exercise;
  const storageKey = STRENGTH_STORAGE_KEY(exercise_id);
  const [currentMonth, setCurrentMonth] = useState(1);
  const [tmAnas, setTmAnas] = useState('');
  const [tmFlavio, setTmFlavio] = useState('');
  const [dataByMonth, setDataByMonth] = useState(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.dataByMonth?.length === 6) return parsed.dataByMonth;
      }
    } catch (_) { }
    return Array.from({ length: 6 }, () => createMonthData());
  });

  // Load from storage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tmAnas != null && parsed.tmAnas !== '') setTmAnas(String(parsed.tmAnas));
        if (parsed.tmFlavio != null && parsed.tmFlavio !== '') setTmFlavio(String(parsed.tmFlavio));
        if (parsed.dataByMonth?.length === 6) setDataByMonth(parsed.dataByMonth);
      }
    } catch (_) { }
  }, [storageKey]);

  // Persist + auto-calcolo kg da TM (solo mese 1)
  const setTmAnasWithSync = (val) => {
    setTmAnas(val);
    const tm = parseFloat(val);
    if (!isNaN(tm) && tm > 0) {
      setDataByMonth(prev => prev.map((month, mi) => mi === 0 ? month.map((row, wi) => ({
        ...row,
        anas: { ...row.anas, weight: String(Math.round(tm * WEEK_CONFIGS[wi].percent)) }
      })) : month));
    }
  };
  const setTmFlavioWithSync = (val) => {
    setTmFlavio(val);
    const tm = parseFloat(val);
    if (!isNaN(tm) && tm > 0) {
      setDataByMonth(prev => prev.map((month, mi) => mi === 0 ? month.map((row, wi) => ({
        ...row,
        flavio: { ...row.flavio, weight: String(Math.round(tm * WEEK_CONFIGS[wi].percent)) }
      })) : month));
    }
  };

  // Mese N+1: TM = 1RM dall'AMRAP del mese N
  useEffect(() => {
    setDataByMonth(prev => {
      let changed = false;
      const next = prev.map((month, monthIdx) => {
        if (monthIdx === 0) return month;
        const amrapRow = prev[monthIdx - 1][2];
        return month.map((row, weekIdx) => {
          const cfg = WEEK_CONFIGS[weekIdx];
          const updates = {};
          for (const athlete of ['anas', 'flavio']) {
            const rm = calc1RM(amrapRow[athlete].weight, amrapRow[athlete].reps);
            if (rm != null) {
              const tm = parseFloat(roundToHalf(rm));
              const targetKg = String(Math.round(tm * cfg.percent));
              if (row[athlete].weight !== targetKg) {
                updates[athlete] = { ...row[athlete], weight: targetKg };
                changed = true;
              }
            }
          }
          return Object.keys(updates).length ? { ...row, ...updates } : row;
        });
      });
      return changed ? next : prev;
    });
  }, [dataByMonth]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ tmAnas, tmFlavio, dataByMonth }));
    } catch (_) { }
  }, [storageKey, tmAnas, tmFlavio, dataByMonth]);

  const updateAthlete = (monthIdx, weekIdx, athlete, field, value) => {
    setDataByMonth(prev => prev.map((month, mi) =>
      mi === monthIdx ? month.map((row, wi) => wi === weekIdx ? { ...row, [athlete]: { ...row[athlete], [field]: value } } : row) : month
    ));
  };
  const toggleComplete = (monthIdx, weekIdx, athlete) => {
    setDataByMonth(prev => prev.map((month, mi) =>
      mi === monthIdx ? month.map((row, wi) => wi === weekIdx ? { ...row, [athlete]: { ...row[athlete], completed: !row[athlete].completed } } : row) : month
    ));
  };

  const getDefaultReps = (weekCfg) => weekCfg.targetReps === 'AMRAP' ? 1 : (typeof weekCfg.targetReps === 'number' ? weekCfg.targetReps : weekCfg.sets || 5);
  const getVolume = (athleteData, weekCfg) => {
    const w = parseFloat(athleteData.weight) || 0;
    const r = parseInt(athleteData.reps, 10) || getDefaultReps(weekCfg);
    if (!w) return 0;
    const totalReps = weekCfg.targetReps === 'AMRAP' ? r : weekCfg.sets * r;
    return w * totalReps;
  };

  const data = dataByMonth[currentMonth - 1] || [];

  return (
    <Card className="border-blue-100 dark:border-blue-900/30 overflow-hidden">
      {/* Header - compatto */}
      <div className="px-3 py-2 flex items-center justify-between bg-gradient-to-r from-blue-50/60 to-transparent dark:from-blue-500/10 dark:to-transparent border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1 h-6 bg-blue-500 rounded-full shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{exercise_name}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-100/60 dark:bg-blue-500/20 px-1.5 py-0.5 rounded">
                M{currentMonth}
              </span>
            </div>
          </div>
        </div>
        {currentMonth === 1 && (
          <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-0.5">
              <span className="text-[8px] font-bold text-blue-600 dark:text-blue-400">A</span>
              <ModernInput type="number" step="0.5" value={tmAnas} onChange={e => setTmAnasWithSync(e.target.value)} className="w-9 py-0.5 text-[10px]" placeholder="TM" />
            </div>
            <div className="flex items-center gap-0.5">
              <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400">F</span>
              <ModernInput type="number" step="0.5" value={tmFlavio} onChange={e => setTmFlavioWithSync(e.target.value)} className="w-9 py-0.5 text-[10px]" placeholder="TM" />
            </div>
          </div>
        )}
      </div>

      {/* Month buttons - stile AW (1-6) */}
      <div className="px-3 py-2 flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-lg border-b border-gray-100 dark:border-zinc-800/80">
        {[1, 2, 3, 4, 5, 6].map(m => (
          <button
            key={m}
            onClick={() => setCurrentMonth(m)}
            className={`w-7 h-7 rounded-md text-[10px] font-bold transition-all flex-1 ${currentMonth === m
              ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Table - compatto ma leggibile */}
      <div className="p-2">
        <div className="rounded-xl border border-gray-200/80 dark:border-zinc-700/80 overflow-hidden shadow-sm bg-white dark:bg-zinc-900/50">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gray-100/80 dark:bg-zinc-800/80">
                <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400 w-8">W</th>
                <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400 w-14">Schema</th>
                <th className="py-2 px-2 text-center font-bold text-gray-600 dark:text-gray-400 w-12">Int.</th>
                <th className="py-2 px-2 text-blue-600 dark:text-blue-400">
                  <div className="grid grid-cols-[2.5rem_2.5rem_2rem_auto] gap-1 items-center justify-items-center">
                    <span className="text-[10px] font-bold">kg</span>
                    <span className="text-[10px] font-bold">1RM kg</span>
                    <span className="text-[10px] font-bold">r</span>
                    <span className="w-3" />
                  </div>
                </th>
                <th className="py-2 px-2 text-emerald-600 dark:text-emerald-400">
                  <div className="grid grid-cols-[2.5rem_2.5rem_2rem_auto] gap-1 items-center justify-items-center">
                    <span className="text-[10px] font-bold">kg</span>
                    <span className="text-[10px] font-bold">1RM kg</span>
                    <span className="text-[10px] font-bold">r</span>
                    <span className="w-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => {
                const c = WEEK_CONFIGS[idx];
                const isAmrap = c.targetReps === 'AMRAP';
                const defaultReps = getDefaultReps(c);
                const rmA = format1RM(r.anas.weight, r.anas.reps || defaultReps);
                const rmF = format1RM(r.flavio.weight, r.flavio.reps || defaultReps);
                return (
                  <tr key={idx} className="border-t border-gray-100 dark:border-zinc-700/60 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                    <td className="py-1.5 px-2 font-bold text-gray-800 dark:text-gray-200 text-[11px]">{r.week}</td>
                    <td className="py-1.5 px-2">
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                        {c.label}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-center text-[10px] font-bold text-gray-600 dark:text-gray-400">{c.intensity}</td>
                    <td className="py-1.5 px-2">
                      <div className="grid grid-cols-[2.5rem_2.5rem_2rem_auto] gap-1 items-center justify-items-center">
                        <ModernInput type="number" step="0.5" value={r.anas.weight} onChange={e => updateAthlete(currentMonth - 1, idx, 'anas', 'weight', e.target.value)} className="w-full min-w-0 py-1 text-xs text-center" placeholder="kg" />
                        <span className={`min-w-[2.5rem] py-1 px-0.5 text-center text-[10px] font-bold rounded ${rmA !== '-' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>{rmA}</span>
                        {isAmrap ? <ModernInput type="number" value={r.anas.reps} onChange={e => updateAthlete(currentMonth - 1, idx, 'anas', 'reps', e.target.value)} className="w-full min-w-0 py-1 text-xs text-center" placeholder="r" /> : <span className="w-6" />}
                        <ModernCheckbox checked={r.anas.completed} onChange={() => toggleComplete(currentMonth - 1, idx, 'anas')} colorClass="accent-blue-500" />
                      </div>
                    </td>
                    <td className="py-1.5 px-2">
                      <div className="grid grid-cols-[2.5rem_2.5rem_2rem_auto] gap-1 items-center justify-items-center">
                        <ModernInput type="number" step="0.5" value={r.flavio.weight} onChange={e => updateAthlete(currentMonth - 1, idx, 'flavio', 'weight', e.target.value)} className="w-full min-w-0 py-1 text-xs text-center" placeholder="kg" />
                        <span className={`min-w-[2.5rem] py-1 px-0.5 text-center text-[10px] font-bold rounded ${rmF !== '-' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'}`}>{rmF}</span>
                        {isAmrap ? <ModernInput type="number" value={r.flavio.reps} onChange={e => updateAthlete(currentMonth - 1, idx, 'flavio', 'reps', e.target.value)} className="w-full min-w-0 py-1 text-xs text-center" placeholder="r" /> : <span className="w-6" />}
                        <ModernCheckbox checked={r.flavio.completed} onChange={() => toggleComplete(currentMonth - 1, idx, 'flavio')} colorClass="accent-emerald-500" />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 px-2 py-2 rounded-lg bg-gray-50 dark:bg-zinc-800/50 border border-gray-200/60 dark:border-zinc-700/60 flex justify-between items-center text-[10px] font-bold">
          <span className="text-gray-500 dark:text-gray-400">Vol M{currentMonth}</span>
          <div className="flex gap-3">
            <span className="text-blue-600 dark:text-blue-400">A: {data.reduce((a, r, i) => a + getVolume(r.anas, WEEK_CONFIGS[i]), 0).toFixed(0)}</span>
            <span className="text-emerald-600 dark:text-emerald-400">F: {data.reduce((a, r, i) => a + getVolume(r.flavio, WEEK_CONFIGS[i]), 0).toFixed(0)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

// --- AW VOLUME TABLE ---
// --- AW VOLUME TABLE ---
const AWVolumeTableGroup = ({ title, exercises, onRowsChange }) => {
  const [currentWeek, setCurrentWeek] = useState(1);

  return (
    <Card className="border-amber-100 dark:border-amber-900/30">
      <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">
                Settimana {currentWeek}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-xl">
          {[1, 2, 3, 4, 5].map(w => (
            <button key={w} onClick={() => setCurrentWeek(w)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentWeek === w ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50 dark:bg-zinc-800/30 border-b border-gray-100 dark:border-zinc-800">
                <th className="py-3 px-2 w-[110px] text-center">Esercizio</th>
                <th className="py-3 px-1 text-center w-14">Target</th>
                <th className="py-3 px-1 text-center w-8">Set</th>
                <th className="py-3 px-2 text-center text-blue-500">Anas (kg/r)</th>
                <th className="py-3 px-2 text-center text-emerald-500">Flavio (kg/r)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
              {exercises.flatMap(ex => {
                const cfg = AW_VOL_CONFIG[ex.exercise_id] || { pattern: 'std' };
                const targets = cfg.pattern === 'alt' ? AW_ALT : AW_STD;
                const targetStr = targets[currentWeek - 1] || '2x10';
                const sets = parseInt(targetStr.split('x')[0]) || 1;

                return Array.from({ length: sets }).map((_, s) => (
                  <AWVolumeRow
                    key={`${ex.exercise_id}-${s}`}
                    exercise={ex}
                    week={currentWeek}
                    set={s + 1}
                    onRowsChange={onRowsChange}
                    isFirst={s === 0}
                    totalSets={sets}
                  />
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

const AWVolumeRow = ({ exercise, week, set, onRowsChange, isFirst, totalSets }) => {
  const { exercise_id, exercise_name } = exercise;
  const cfg = AW_VOL_CONFIG[exercise_id] || { weight: 10, pattern: 'std' };
  const targets = cfg.pattern === 'alt' ? AW_ALT : AW_STD;
  const targetStr = targets[week - 1] || '—';

  const [data, setData] = useState(() => {
    const defaultReps = targetStr.includes('x') ? targetStr.split('x')[1] : '';
    return {
      anas: { weight: String(cfg.weight), reps: defaultReps, completed: false },
      flavio: { weight: String(cfg.weight), reps: defaultReps, completed: false }
    };
  });

  const update = (athlete, field, value) => setData(prev => ({ ...prev, [athlete]: { ...prev[athlete], [field]: value } }));
  const toggle = (athlete) => setData(prev => ({ ...prev, [athlete]: { ...prev[athlete], completed: !prev[athlete].completed } }));

  return (
    <tr className="group transition-colors hover:bg-gray-50/20 dark:hover:bg-zinc-800/20">
      {isFirst && (
        <td rowSpan={totalSets} className="py-2 px-2 border-r border-gray-100 dark:border-zinc-800/50 bg-gray-50/20 dark:bg-zinc-900/10 align-middle text-center">
          <div className="text-[10px] font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter leading-tight">
            {exercise_name}
          </div>
        </td>
      )}
      {isFirst && (
        <td rowSpan={totalSets} className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50 align-middle">
          <span className="inline-block px-1 py-0.5 rounded text-[9px] font-bold bg-amber-100/50 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
            {targetStr}
          </span>
        </td>
      )}
      <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
        <span className="text-[10px] font-black text-gray-400">{set}</span>
      </td>
      <td className="py-2 px-3 border-r border-gray-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-1 justify-center">
          <ModernInput
            type="number"
            step="0.5"
            value={data.anas.weight}
            onChange={e => update('anas', 'weight', e.target.value)}
            className="w-11 py-1 text-[10px]"
          />
          <ModernInput
            type="number"
            value={data.anas.reps}
            onChange={e => update('anas', 'reps', e.target.value)}
            className="w-9 py-1 text-[10px]"
            placeholder="r"
          />
          <ModernCheckbox
            checked={data.anas.completed}
            onChange={() => toggle('anas')}
            colorClass="accent-blue-500"
          />
        </div>
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-1 justify-center">
          <ModernInput
            type="number"
            step="0.5"
            value={data.flavio.weight}
            onChange={e => update('flavio', 'weight', e.target.value)}
            className="w-11 py-1 text-[10px]"
          />
          <ModernInput
            type="number"
            value={data.flavio.reps}
            onChange={e => update('flavio', 'reps', e.target.value)}
            className="w-9 py-1 text-[10px]"
            placeholder="r"
          />
          <ModernCheckbox
            checked={data.flavio.completed}
            onChange={() => toggle('flavio')}
            colorClass="accent-emerald-500"
          />
        </div>
      </td>
    </tr>
  );
};

// --- AW ISO TABLE ---
const AWIsoTableGroup = ({ title, exercises, onRowsChange, programData }) => {
  const [currentWeek, setCurrentWeek] = useState(1);

  return (
    <Card className="border-amber-100 dark:border-amber-900/30">
      <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">{title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">
                Settimana {currentWeek}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-xl">
          {[1, 2, 3, 4, 5].map(w => (
            <button key={w} onClick={() => setCurrentWeek(w)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentWeek === w ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter bg-gray-50/50 dark:bg-zinc-800/30 border-b border-gray-100 dark:border-zinc-800">
                <th className="py-2 px-2 w-[100px] text-center">Esercizio</th>
                <th className="py-2 px-1 text-center w-8">W1</th>
                <th className="py-2 px-1 text-center w-8">W2</th>
                <th className="py-2 px-1 text-center w-8">W3</th>
                <th className="py-2 px-1 text-center w-8">W4</th>
                <th className="py-2 px-1 text-center w-8">W5</th>
                <th className="py-2 px-1 text-center w-8">Set</th>
                <th className="py-2 px-2 text-center text-blue-500 w-[75px]">Anas (kg/s)</th>
                <th className="py-2 px-2 text-center text-emerald-500 w-[75px]">Flavio (kg/s)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
              {exercises.flatMap(ex => {
                const nameLower = (ex.exercise_name || '').toLowerCase();
                const progEx = programData?.exercises?.find(pe =>
                  nameLower.includes(pe.name.toLowerCase()) ||
                  pe.name.toLowerCase().includes(nameLower)
                );

                const cfgKey = Object.keys(AW_ISO_CONFIG).find(k => k.toLowerCase() === nameLower || k.toLowerCase() === (ex.exercise_id || '').toLowerCase());
                const cfg = AW_ISO_CONFIG[cfgKey] || { target: nameLower.includes('heavy') ? '2x5s' : '2x15s' };
                const sets = parseInt(cfg.target.split('x')[0]) || ex.base_sets || 2;

                return Array.from({ length: sets }).map((_, s) => (
                  <AWIsoRow
                    key={`${ex.exercise_id}-${s}`}
                    exercise={ex}
                    set={s + 1}
                    onRowsChange={onRowsChange}
                    isFirst={s === 0}
                    totalSets={sets}
                    progEx={progEx}
                    currentWeek={currentWeek}
                  />
                ));
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
};

const AWIsoRow = ({ exercise, set, onRowsChange, isFirst, totalSets, progEx, currentWeek }) => {
  const { exercise_id, exercise_name } = exercise;
  const nameLower = exercise_name.toLowerCase();

  const cfgKey = Object.keys(AW_ISO_CONFIG).find(k =>
    k.toLowerCase() === nameLower ||
    k.toLowerCase() === `${nameLower}_heavy` ||
    k.toLowerCase() === exercise_id?.toLowerCase()
  );
  const cfg = AW_ISO_CONFIG[cfgKey] || { weight: '', target: nameLower.includes('heavy') ? '2x5s' : '2x15s' };
  const targetStr = cfg.target;

  const [data, setData] = useState(() => {
    const defaultTime = targetStr.includes('x') ? targetStr.split('x')[1].replace('s', '') : '';
    const initialWeight = progEx ? (progEx[`w${currentWeek}`] || '') : (cfg.weight || '');
    return {
      anas: { weight: String(initialWeight), reps: defaultTime, completed: false },
      flavio: { weight: String(initialWeight), reps: defaultTime, completed: false }
    };
  });

  // Update effect if currentWeek changes
  useEffect(() => {
    const initialWeight = progEx ? (progEx[`w${currentWeek}`] || '') : (cfg.weight || '');
    setData(prev => ({
      ...prev,
      anas: { ...prev.anas, weight: String(initialWeight) },
      flavio: { ...prev.flavio, weight: String(initialWeight) }
    }));
  }, [currentWeek, progEx, cfg.weight]);

  const update = (athlete, field, value) => setData(prev => ({ ...prev, [athlete]: { ...prev[athlete], [field]: value } }));
  const toggle = (athlete) => setData(prev => ({ ...prev, [athlete]: { ...prev[athlete], completed: !prev[athlete].completed } }));

  return (
    <tr className="group transition-colors hover:bg-gray-50/20 dark:hover:bg-zinc-800/20 text-[10px]">
      {isFirst && (
        <td rowSpan={totalSets} className="py-2 px-1 border-r border-gray-100 dark:border-zinc-800/50 bg-gray-50/20 dark:bg-zinc-900/10 align-middle text-center overflow-hidden">
          <div className="font-black text-gray-900 dark:text-gray-100 uppercase tracking-tighter leading-tight break-words">
            {exercise_name}
          </div>
        </td>
      )}
      {isFirst && [1, 2, 3, 4, 5].map(w => (
        <td key={w} rowSpan={totalSets} className={`py-1 px-0.5 text-center border-r border-gray-100 dark:border-zinc-800/50 align-middle ${currentWeek === w ? 'bg-amber-500/10 dark:bg-amber-500/20 font-bold text-amber-600 dark:text-amber-400' : 'text-gray-400'}`}>
          {progEx ? (progEx[`w${w}`] || '-') : '-'}
        </td>
      ))}
      <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
        <span className="font-black text-gray-400">{set}</span>
      </td>
      <td className="py-2 px-1 border-r border-gray-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-0.5 justify-center">
          <ModernInput
            type="number"
            step="0.5"
            value={data.anas.weight}
            onChange={e => update('anas', 'weight', e.target.value)}
            className="w-10 py-1 text-[9px]"
          />
          <ModernInput
            type="number"
            value={data.anas.reps}
            onChange={e => update('anas', 'reps', e.target.value)}
            className="w-8 py-1 text-[9px]"
            placeholder="s"
          />
          <ModernCheckbox
            checked={data.anas.completed}
            onChange={() => toggle('anas')}
            colorClass="accent-blue-500"
          />
        </div>
      </td>
      <td className="py-2 px-1">
        <div className="flex items-center gap-0.5 justify-center">
          <ModernInput
            type="number"
            step="0.5"
            value={data.flavio.weight}
            onChange={e => update('flavio', 'weight', e.target.value)}
            className="w-10 py-1 text-[9px]"
          />
          <ModernInput
            type="number"
            value={data.flavio.reps}
            onChange={e => update('flavio', 'reps', e.target.value)}
            className="w-8 py-1 text-[9px]"
            placeholder="s"
          />
          <ModernCheckbox
            checked={data.flavio.completed}
            onChange={() => toggle('flavio')}
            colorClass="accent-emerald-500"
          />
        </div>
      </td>
    </tr>
  );
};

// --- EXERCISE TABLE (STANDARD AW) ---
const ExerciseTable = ({ exercise, onRowsChange }) => {
  const { exercise_id, exercise_name, base_sets = 4, base_reps, instruction } = exercise;
  const [expanded, setExpanded] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [rows, setRows] = useState(Array.from({ length: base_sets }, (_, i) => ({
    id: i + 1, set: i + 1,
    anas: { weight: '', reps: base_reps ? String(base_reps) : '', checked: false },
    flavio: { weight: '', reps: base_reps ? String(base_reps) : '', checked: false },
  })));
  const updateRow = (id, athlete, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [athlete]: { ...r[athlete], [field]: value } } : r));
  const toggleCheck = (id, athlete) => setRows(prev => prev.map(r => r.id === id ? { ...r, [athlete]: { ...r[athlete], checked: !r[athlete].checked } } : r));

  const currentRow = rows.find(r => r.set === currentSet);

  return (
    <Card className="border-amber-100 dark:border-amber-900/30">
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent"
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100">{exercise_name}</h3>
            {instruction && <p className="text-[10px] text-gray-500 mt-0.5">{instruction}</p>}
          </div>
        </div>
        <button className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-400">
          {expanded ? <ChevronUp size={16} /> : <History size={16} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {!expanded && currentRow ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800/80">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-xl">
                  {rows.map(r => (
                    <button key={r.id} onClick={() => setCurrentSet(r.set)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentSet === r.set ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {r.set}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-6">
                  {/* Anas */}
                  <div className="flex items-center gap-2 bg-blue-50/30 dark:bg-blue-900/10 p-2 rounded-xl border border-blue-100/50 dark:border-blue-800/30 relative">
                    <AthleteAvatar initial="A" colorClass="bg-blue-500" />
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="kg" />
                      <ModernInput type="number" step="0.5" value={currentRow.anas.weight} onChange={e => updateRow(currentRow.id, 'anas', 'weight', e.target.value)} className="w-14 py-1.5" placeholder="kg" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="r" />
                      <ModernInput type="number" value={currentRow.anas.reps} onChange={e => updateRow(currentRow.id, 'anas', 'reps', e.target.value)} className="w-12 py-1.5" placeholder="r" />
                    </div>
                    <ModernCheckbox checked={currentRow.anas.checked} onChange={() => toggleCheck(currentRow.id, 'anas')} colorClass="accent-amber-500" />
                    <div className="absolute -top-2.5 right-2 bg-blue-100 dark:bg-blue-900/50 text-[8px] font-bold text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">{format1RM(currentRow.anas.weight, currentRow.anas.reps)}</div>
                  </div>
                  {/* Flavio */}
                  <div className="flex items-center gap-2 bg-emerald-50/30 dark:bg-emerald-900/10 p-2 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 relative">
                    <AthleteAvatar initial="F" colorClass="bg-emerald-500" />
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="kg" />
                      <ModernInput type="number" step="0.5" value={currentRow.flavio.weight} onChange={e => updateRow(currentRow.id, 'flavio', 'weight', e.target.value)} className="w-14 py-1.5" placeholder="kg" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="r" />
                      <ModernInput type="number" value={currentRow.flavio.reps} onChange={e => updateRow(currentRow.id, 'flavio', 'reps', e.target.value)} className="w-12 py-1.5" placeholder="r" />
                    </div>
                    <ModernCheckbox checked={currentRow.flavio.checked} onChange={() => toggleCheck(currentRow.id, 'flavio')} colorClass="accent-amber-500" />
                    <div className="absolute -top-2.5 right-2 bg-emerald-100 dark:bg-emerald-900/50 text-[8px] font-bold text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">{format1RM(currentRow.flavio.weight, currentRow.flavio.reps)}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 dark:border-zinc-800/80">
            <div className="p-2 space-y-1">
              <div className="grid grid-cols-[2rem_3.5rem_auto_auto] gap-4 px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider justify-between">
                <div className="text-center">Set</div>
                <div className="text-center">S</div>
                <div className="w-[160px] text-center text-blue-500">Anas</div>
                <div className="w-[160px] text-center text-emerald-500">Flavio</div>
              </div>
              {rows.map(r => (
                <div key={r.id} className="grid grid-cols-[2rem_3.5rem_auto_auto] gap-4 items-center px-2 py-2 bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors justify-between">
                  <div className="text-center font-bold text-gray-700 dark:text-gray-300 text-xs">{r.set}</div>
                  <div className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/30 rounded px-1 py-0.5">{base_sets}x{base_reps || '—'}</div>

                  <div className="w-[160px] flex gap-1.5 justify-center items-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="kg" />
                      <ModernInput type="number" step="0.5" value={r.anas.weight} onChange={e => updateRow(r.id, 'anas', 'weight', e.target.value)} className="w-12 py-1" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="r" />
                      <ModernInput type="number" value={r.anas.reps} onChange={e => updateRow(r.id, 'anas', 'reps', e.target.value)} className="w-10 py-1" />
                    </div>
                    <ModernCheckbox checked={r.anas.checked} onChange={() => toggleCheck(r.id, 'anas')} colorClass="accent-amber-500" />
                    <span className="w-8 text-[9px] font-bold text-gray-400 text-right">{format1RM(r.anas.weight, r.anas.reps)}</span>
                  </div>

                  <div className="w-[160px] flex gap-1.5 justify-center items-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="kg" />
                      <ModernInput type="number" step="0.5" value={r.flavio.weight} onChange={e => updateRow(r.id, 'flavio', 'weight', e.target.value)} className="w-12 py-1" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="r" />
                      <ModernInput type="number" value={r.flavio.reps} onChange={e => updateRow(r.id, 'flavio', 'reps', e.target.value)} className="w-10 py-1" />
                    </div>
                    <ModernCheckbox checked={r.flavio.checked} onChange={() => toggleCheck(r.id, 'flavio')} colorClass="accent-amber-500" />
                    <span className="w-8 text-[9px] font-bold text-gray-400 text-right">{format1RM(r.flavio.weight, r.flavio.reps)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

// --- HYPERTROPHY TABLE ---
const HypertrophyTable = ({ exercise, onRowsChange, initialRows }) => {
  const { exercise_id, exercise_name, base_reps } = exercise;
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const defaultData = () => ({
    anas: { w: '', r: base_reps ? String(base_reps) : '', completed: false },
    flavio: { w: '', r: base_reps ? String(base_reps) : '', completed: false },
  });
  const parseInitial = (rows) => {
    if (!rows?.length) return null;
    const anas = rows.find(r => r.set === 1);
    const flavio = rows.find(r => r.set === 2);
    return {
      anas: { w: anas?.weight ?? '', r: anas?.reps ?? (base_reps ? String(base_reps) : ''), completed: !!anas?.checked },
      flavio: { w: flavio?.weight ?? '', r: flavio?.reps ?? (base_reps ? String(base_reps) : ''), completed: !!flavio?.checked },
    };
  };
  const [data, setData] = useState(() => parseInitial(initialRows) || defaultData());

  useEffect(() => {
    if (initialRows?.length) {
      const parsed = parseInitial(initialRows);
      if (parsed) setData(parsed);
    }
  }, [exercise_id, initialRows]);

  const upd = (athlete, field, value) => {
    setData(prev => {
      const next = { ...prev, [athlete]: { ...prev[athlete], [field]: value } };
      const rows = [
        { set: 1, weight: next.anas.w, reps: next.anas.r, checked: next.anas.completed },
        { set: 2, weight: next.flavio.w, reps: next.flavio.r, checked: next.flavio.completed },
      ];
      onRowsChange?.(exercise_id, rows);
      return next;
    });
  };
  const tog = (athlete) => {
    setData(prev => {
      const next = { ...prev, [athlete]: { ...prev[athlete], completed: !prev[athlete].completed } };
      const rows = [
        { set: 1, weight: next.anas.w, reps: next.anas.r, checked: next.anas.completed },
        { set: 2, weight: next.flavio.w, reps: next.flavio.r, checked: next.flavio.completed },
      ];
      onRowsChange?.(exercise_id, rows);
      return next;
    });
  };

  useEffect(() => {
    if (!expanded || !exercise_id) return;
    setHistoryLoading(true);
    const ctrl = new AbortController();
    fetch(`${import.meta.env.VITE_API_BASE || '/api'}/training/history?exercise_id=${encodeURIComponent(exercise_id)}&limit=12`, { signal: ctrl.signal })
      .then(res => res.json())
      .then(res => setHistory(res?.entries || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
    return () => ctrl.abort();
  }, [expanded, exercise_id]);

  const formatDate = (d) => {
    try { const [y, m, day] = d.split('-'); return `${day}/${m}`; } catch { return d; }
  };

  return (
    <Card className="border-emerald-100 dark:border-emerald-900/30">
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-2.5 flex items-center justify-between cursor-pointer bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-500/10 dark:to-transparent"
      >
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-emerald-500 rounded-full"></div>
          <h3 className="text-[11px] font-bold text-gray-900 dark:text-gray-100 line-clamp-2 break-words">{exercise_name}</h3>
        </div>
        <button className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-400">
          {expanded ? <ChevronUp size={14} /> : <History size={14} />}
        </button>
      </div>

      <div className="p-3 pt-0">
        {!expanded ? (
          <div className="space-y-2 mt-2">
            {/* Header S | A/F | kg | r | ✓ */}
            <div className="grid grid-cols-[2.5rem_2rem_3.5rem_2.75rem_2rem] gap-1.5 items-center px-1">
              <ColHeader label="S" className="text-center" />
              <div />
              <ColHeader label="kg" className="text-center" />
              <ColHeader label="r" className="text-center" />
              <ColHeader label="✓" className="text-center" />
            </div>
            {/* Wrapper con S unificato */}
            <div className="grid grid-cols-[2.5rem_1fr] gap-1.5">
              {/* Colonna S unificata */}
              <div className="flex items-center justify-center">
                <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/30 rounded px-1.5 py-1 text-center">2x{base_reps || ''}</span>
              </div>
              {/* Colonna dati atleti */}
              <div className="space-y-1.5">
                {/* Anas */}
                <div className="grid grid-cols-[2rem_3.5rem_2.75rem_2rem] gap-1.5 items-center bg-blue-50/30 dark:bg-blue-900/10 p-1.5 rounded-lg border border-blue-100/50 dark:border-blue-800/30">
                  <AthleteAvatar initial="A" colorClass="bg-blue-500 shrink-0" />
                  <ModernInput type="number" step="0.5" value={data.anas.w} onChange={e => upd('anas', 'w', e.target.value)} className="w-full py-1" placeholder="kg" />
                  <ModernInput type="number" value={data.anas.r} onChange={e => upd('anas', 'r', e.target.value)} className="w-full py-1" placeholder="r" />
                  <ModernCheckbox checked={data.anas.completed} onChange={() => tog('anas')} colorClass="accent-emerald-500 justify-self-center" />
                </div>
                {/* Flavio */}
                <div className="grid grid-cols-[2rem_3.5rem_2.75rem_2rem] gap-1.5 items-center bg-emerald-50/30 dark:bg-emerald-900/10 p-1.5 rounded-lg border border-emerald-100/50 dark:border-emerald-800/30">
                  <AthleteAvatar initial="F" colorClass="bg-emerald-500 shrink-0" />
                  <ModernInput type="number" step="0.5" value={data.flavio.w} onChange={e => upd('flavio', 'w', e.target.value)} className="w-full py-1" placeholder="kg" />
                  <ModernInput type="number" value={data.flavio.r} onChange={e => upd('flavio', 'r', e.target.value)} className="w-full py-1" placeholder="r" />
                  <ModernCheckbox checked={data.flavio.completed} onChange={() => tog('flavio')} colorClass="accent-emerald-500 justify-self-center" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3">
            {historyLoading ? (
              <div className="py-4 text-center">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="py-4 text-center text-[10px] text-gray-400">Nessuno storico</div>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-[3rem_1fr_1fr] gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <div>Data</div>
                  <div className="w-[140px] text-center text-blue-500">Anas</div>
                  <div className="w-[140px] text-center text-emerald-500">Flavio</div>
                </div>
                {history.map((e, i) => (
                  <div key={i} className="grid grid-cols-[3rem_1fr_1fr] gap-2 items-center px-2 py-2 text-[10px] bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="font-medium text-gray-500">{formatDate(e.date)}</div>
                    <div className="w-[140px] flex gap-1.5 justify-center">
                      <span className="w-12 py-1 bg-blue-50/50 dark:bg-blue-900/20 rounded font-semibold text-gray-700 dark:text-gray-300 text-center">{e.weight_kg ?? '-'} kg</span>
                      <span className="w-10 py-1 bg-blue-50/50 dark:bg-blue-900/20 rounded font-semibold text-gray-700 dark:text-gray-300 text-center">{e.reps ?? '-'}</span>
                    </div>
                    <div className="w-[140px] flex gap-1.5 justify-center">
                      <span className="w-12 py-1 bg-emerald-50/50 dark:bg-emerald-900/20 rounded font-semibold text-gray-700 dark:text-gray-300 text-center">{e.weight_kg ?? '-'} kg</span>
                      <span className="w-10 py-1 bg-emerald-50/50 dark:bg-emerald-900/20 rounded font-semibold text-gray-700 dark:text-gray-300 text-center">{e.reps ?? '-'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  );
};

// --- MUSCLE VOLUME LEGEND ---
const GYM_LABELS = {
  chest: 'Petto',
  lats: 'Laterali',
  rhomboids: 'Romboidi',
  traps: 'Trapezi',
  anterior_delts: 'Deltoidi Ant',
  lateral_delts: 'Deltoidi Lat',
  rear_delts: 'Deltoidi Post',
  quads: 'Quadricipiti',
  glutes: 'Glutei',
  core: 'Addominali',
  lower_back: 'Lower Back'
};

const HAND_LABELS = {
  supinators: 'Supinatori',
  pronators: 'Pronatori',
  wrist_extensors: 'Estensori Polso',
  wrist_flexors: 'Flessori Polso',
  finger_flexors: 'Flessori Dita',
  ulnar_deviation: 'Dev. Ulnare',
  radial_deviation: 'Dev. Radiale'
};

const ARM_LABELS = {
  triceps: 'Tricipiti',
  biceps: 'Bicipiti',
  brachiale_brachioradiale: 'Brachiale + Brachioradiale',
  side_pressure: 'Side Pressure',
  reverse_side_pressure: 'Reverse Side Pressure'
};

// Mappa brachialis e brachioradialis → entrata unificata
const BRACHIAL_MAPPING = { brachialis: 'brachiale_brachioradiale', brachioradialis: 'brachiale_brachioradiale' };

// Mappa side/reverse_side → side_pressure/reverse_side_pressure
const SIDE_MAPPING = {
  side: 'side_pressure',
  'side pressure': 'side_pressure',
  reverse_side: 'reverse_side_pressure',
  'reverse side pressure': 'reverse_side_pressure'
};

// Mappa forearms → muscoli specifici MANO
const FOREARM_MAPPING = {
  forearms: ['supinators', 'pronators', 'wrist_extensors', 'wrist_flexors', 'finger_flexors', 'ulnar_deviation', 'radial_deviation']
};

// Categorie per suddivisione
const HAND_MUSCLES = Object.keys(HAND_LABELS);
const ARM_MUSCLES = Object.keys(ARM_LABELS);

function MuscleVolumeLegend({ days }) {
  const [visible, setVisible] = useState(false);
  const gymVolume = {};
  const handVolume = {};
  const armVolume = {};

  (days || []).forEach(day => {
    (day.exercises || []).forEach(ex => {
      const isAW = ex.category === 'ARMWRESTLING' || ex.exercise_id?.startsWith('aw_');
      const sets = ex.base_sets ?? (ex.category === 'HYPERTROPHY' ? 2 : 4);
      const reps = ex.base_reps ?? 10;
      const vol = sets * reps;

      (ex.primary_muscles || []).forEach(m => {
        let key = m.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
        // Normalizza alias comuni per la legenda GYM
        if (key === 'abs' || key === 'abdominals' || key === 'addominali') key = 'core';
        if (key === 'lower back' || key === 'lowerback') key = 'lower_back';

        // Unifica petto alto con petto
        if (key === 'upper_chest') key = 'chest';

        // Unifica brachiale e brachioradiale
        if (BRACHIAL_MAPPING[key]) key = BRACHIAL_MAPPING[key];

        // Mappa side/reverse_side → side_pressure/reverse_side_pressure
        if (SIDE_MAPPING[key]) key = SIDE_MAPPING[key];

        // Backpressure escluso dalla legenda su richiesta
        if (key === 'backpressure') return;

        // Mappa forearms → muscoli MANO specifici (sia AW che GYM)
        if (key === 'forearms') {
          FOREARM_MAPPING.forearms.forEach(handMuscle => {
            handVolume[handMuscle] = (handVolume[handMuscle] || 0) + vol / FOREARM_MAPPING.forearms.length;
          });
          return;
        }

        // Conta deltoidi anteriori anche nei movimenti di spinta
        const exName = (ex.exercise_name || '').toLowerCase();
        if (!isAW && (exName.includes('bench') || exName.includes('press') || exName.includes('panca'))) {
          if (!ex.primary_muscles.some(pm => pm.toLowerCase().includes('anterior_delt'))) {
            gymVolume['anterior_delts'] = (gymVolume['anterior_delts'] || 0) + vol * 0.5;
          }
        }

        if (!key) return;

        // Suddividi in MANO, BRACCIO, PALESTRA
        if (HAND_MUSCLES.includes(key)) {
          handVolume[key] = (handVolume[key] || 0) + vol;
        } else if (ARM_MUSCLES.includes(key)) {
          armVolume[key] = (armVolume[key] || 0) + vol;
        } else {
          gymVolume[key] = (gymVolume[key] || 0) + vol;
        }
      });
    });
  });

  const gymEntries = Object.keys(GYM_LABELS);
  const handEntries = Object.keys(HAND_LABELS);
  const armEntries = Object.keys(ARM_LABELS);


  const renderSection = (title, entries, labels, colorClass) => {
    if (entries.length === 0) return null;
    return (
      <div className="flex-1 min-w-0 rounded-lg p-3 bg-gray-50/80 dark:bg-zinc-800/40 border border-gray-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-2 mb-2">
          <div className={`w-1 h-3 rounded-full shrink-0 ${colorClass}`} />
          <span className="text-[9px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{title}</span>
        </div>
        <div className="flex flex-wrap gap-x-2 gap-y-1 text-[9px]">
          {entries.map((key) => (
            <span key={key} className="font-medium text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded bg-white/60 dark:bg-zinc-700/40">{labels[key] || key}</span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-md overflow-hidden">
      <button
        onClick={() => setVisible(!visible)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <Activity size={14} className="text-blue-500" />
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Muscoli</span>
        </div>
        {visible ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </button>
      {visible && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex gap-3 sm:gap-4">
            {renderSection('PALESTRA', gymEntries, GYM_LABELS, 'bg-blue-500')}
            {renderSection('BRACCIO', armEntries, ARM_LABELS, 'bg-purple-500')}
            {renderSection('MANO', handEntries, HAND_LABELS, 'bg-amber-500')}
          </div>
        </div>
      )}
    </div>
  );
}

// --- EXERCISE-MUSCLE MATRIX (tabella a incrocio) ---
const ALL_MUSCLE_KEYS = [
  ...Object.keys(GYM_LABELS),
  ...Object.keys(ARM_LABELS),
  ...Object.keys(HAND_LABELS),
];
const ALL_MUSCLE_LABELS = { ...GYM_LABELS, ...ARM_LABELS, ...HAND_LABELS };
const HAND_KEYS = Object.keys(HAND_LABELS);
const MUSCLE_GROUPS = [
  { title: 'PALESTRA', keys: Object.keys(GYM_LABELS), colorClass: 'bg-blue-500' },
  { title: 'BRACCIO', keys: Object.keys(ARM_LABELS), colorClass: 'bg-purple-500' },
  { title: 'MANO', keys: Object.keys(HAND_LABELS), colorClass: 'bg-amber-500' },
];
const MATRIX_CATEGORY_ORDER = ['STRENGTH', 'HYPERTROPHY', 'AW', 'AW_MAX', 'AW_LIGHT', 'AW_HEAVY', 'AW_SPEED', 'OTHER'];
const MATRIX_CATEGORY_LABELS = {
  STRENGTH: 'Forza',
  HYPERTROPHY: 'Ipertrofia',
  AW: 'AW',
  AW_MAX: 'AW Max',
  AW_LIGHT: 'AW Iso Light',
  AW_HEAVY: 'AW Iso Heavy',
  AW_SPEED: 'AW Speed',
  OTHER: 'Altro',
};

function normalizeMuscleFromDb(key) {
  let k = key.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim();
  if (k === 'upper_chest') return 'chest';
  if (k === 'abs' || k === 'abdominals' || k === 'addominali') return 'core';
  if (k === 'lower back' || k === 'lowerback') return 'lower_back';
  if (BRACHIAL_MAPPING[k]) return 'brachiale_brachioradiale';
  if (SIDE_MAPPING[k]) return SIDE_MAPPING[k];
  if (k === 'forearms') return null; // espandi a HAND_KEYS
  return ALL_MUSCLE_KEYS.includes(k) ? k : null;
}

function ExerciseMuscleMatrix({ exercises, weekDays, awProgram }) {
  const [matrix, setMatrix] = useState({});

  const matrixExercises = useMemo(() => {
    const byId = new Map();
    const slugify = (s) => (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    const prettyFromId = (id) => String(id || '').replace(/^aw_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const addExercise = ({ id, name, category, source, primary_muscles = [] }) => {
      if (!id) return;
      const safeCategory = MATRIX_CATEGORY_LABELS[category] ? category : 'OTHER';
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          name: name || prettyFromId(id),
          category: safeCategory,
          source: source || 'unknown',
          primary_muscles: Array.isArray(primary_muscles) ? primary_muscles : [],
        });
      } else {
        const prev = byId.get(id);
        byId.set(id, {
          ...prev,
          name: prev.name || name || prettyFromId(id),
          category: prev.category === 'OTHER' ? safeCategory : prev.category,
          primary_muscles: prev.primary_muscles.length ? prev.primary_muscles : (Array.isArray(primary_muscles) ? primary_muscles : []),
        });
      }
    };

    (exercises || []).forEach(ex => {
      addExercise({
        id: ex.id,
        name: ex.name,
        category: ex.category,
        source: 'db_exercises',
        primary_muscles: ex.primary_muscles || [],
      });
    });

    (weekDays || []).forEach(day => {
      (day.exercises || []).forEach(ex => {
        addExercise({
          id: ex.exercise_id,
          name: ex.exercise_name,
          category: ex.category,
          source: 'week_templates',
          primary_muscles: ex.primary_muscles || [],
        });
      });
    });

    Object.keys(AW_VOL_CONFIG).forEach(exerciseId => {
      addExercise({
        id: exerciseId,
        name: prettyFromId(exerciseId),
        category: 'AW',
        source: 'aw_volume_config',
      });
    });

    ((awProgram?.max_day?.weeks || [])).forEach(week => {
      (week.exercises || []).forEach(ex => {
        const slug = slugify(ex.name);
        addExercise({
          id: `aw_max_${slug}`,
          name: ex.name,
          category: 'AW_MAX',
          source: 'aw_program_max',
        });
      });
    });

    ((awProgram?.light?.exercises || [])).forEach(ex => {
      const slug = slugify(ex.name);
      addExercise({
        id: `aw_light_${slug}`,
        name: ex.name,
        category: 'AW_LIGHT',
        source: 'aw_program_light',
      });
    });

    ((awProgram?.heavy?.exercises || [])).forEach(ex => {
      const slug = slugify(ex.name);
      addExercise({
        id: `aw_heavy_${slug}`,
        name: ex.name,
        category: 'AW_HEAVY',
        source: 'aw_program_heavy',
      });
    });

    ((awProgram?.speed?.exercises || [])).forEach(ex => {
      const slug = slugify(ex.name);
      addExercise({
        id: `aw_speed_${slug}`,
        name: ex.name,
        category: 'AW_SPEED',
        source: 'aw_program_speed',
      });
    });

    return Array.from(byId.values()).sort((a, b) => {
      const aOrder = MATRIX_CATEGORY_ORDER.indexOf(a.category);
      const bOrder = MATRIX_CATEGORY_ORDER.indexOf(b.category);
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.name.localeCompare(b.name);
    });
  }, [exercises, weekDays, awProgram]);

  useEffect(() => {
    const next = {};
    matrixExercises.forEach(ex => {
      const checked = new Set();
      (ex.primary_muscles || []).forEach(muscle => {
        const norm = normalizeMuscleFromDb(muscle);
        if (norm) checked.add(norm);
        else if (String(muscle).toLowerCase() === 'forearms') HAND_KEYS.forEach(h => checked.add(h));
      });
      next[ex.id] = checked;
    });
    setMatrix(next);
  }, [matrixExercises]);

  const toggle = (exerciseId, muscleKey) => {
    setMatrix(prev => {
      const nextSet = new Set(prev[exerciseId] || []);
      if (nextSet.has(muscleKey)) nextSet.delete(muscleKey);
      else nextSet.add(muscleKey);
      return { ...prev, [exerciseId]: nextSet };
    });
  };

  const saveMapping = () => {
    const output = {};
    matrixExercises.forEach(ex => {
      const muscleKeys = Array.from(matrix[ex.id] || []);
      output[ex.id] = {
        exercise_name: ex.name,
        category: ex.category,
        source: ex.source,
        muscle_keys: muscleKeys,
        muscles: muscleKeys.map(k => ALL_MUSCLE_LABELS[k] || k),
      };
    });
    console.log('MAPPATURA_ESERCIZI_MUSCOLI');
    console.log(JSON.stringify(output, null, 2));
  };

  if (matrixExercises.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Target size={12} className="text-blue-500" />
          <h4 className="text-[10px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">Matrice Muscoli × Esercizi</h4>
        </div>
        <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400">{matrixExercises.length} esercizi</span>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[420px] custom-scrollbar">
        <table className="w-full text-[9px] border-collapse min-w-max">
          <thead>
            <tr className="sticky top-0 bg-white dark:bg-zinc-900 z-20 border-b border-gray-200 dark:border-zinc-700">
              <th className="sticky left-0 z-30 bg-white dark:bg-zinc-900 py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-zinc-700 min-w-[140px]">
                Muscolo
              </th>
              {matrixExercises.map(ex => (
                <th
                  key={ex.id}
                  className="py-1.5 px-1 font-bold text-gray-600 dark:text-gray-400 border-r border-gray-100 dark:border-zinc-800 min-w-[130px] max-w-[160px] text-center"
                  title={`${ex.name} (${MATRIX_CATEGORY_LABELS[ex.category] || ex.category})`}
                >
                  <span className="block text-[7px] font-semibold text-blue-500 uppercase mb-0.5">
                    {MATRIX_CATEGORY_LABELS[ex.category] || ex.category}
                  </span>
                  <span className="text-[8px] leading-tight block truncate">{ex.name}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MUSCLE_GROUPS.map(group => (
              <React.Fragment key={group.title}>
                <tr className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50/70 dark:bg-zinc-800/40">
                  <td className="sticky left-0 z-10 bg-gray-50/90 dark:bg-zinc-800/70 py-1 px-2 border-r border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${group.colorClass}`} />
                      <span className="text-[8px] font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{group.title}</span>
                    </div>
                  </td>
                  <td colSpan={matrixExercises.length} />
                </tr>
                {group.keys.map(muscleKey => (
                  <tr key={muscleKey} className="border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50/50 dark:hover:bg-zinc-800/30">
                    <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 py-1 px-2 font-semibold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-zinc-700">
                      {ALL_MUSCLE_LABELS[muscleKey] || muscleKey}
                    </td>
                    {matrixExercises.map(ex => (
                      <td key={`${muscleKey}-${ex.id}`} className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800">
                        <input
                          type="checkbox"
                          checked={(matrix[ex.id] || new Set()).has(muscleKey)}
                          onChange={() => toggle(ex.id, muscleKey)}
                          className="w-3.5 h-3.5 rounded cursor-pointer accent-blue-500"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-3">
        <button
          type="button"
          onClick={saveMapping}
          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold uppercase tracking-wide transition-colors"
        >
          Salva Mappatura
        </button>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function Training2() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [setsByExercise, setSetsByExercise] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(true);

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [awProgram, setAwProgram] = useState(AW_PROGRAM_FALLBACK);
  const [allExercises, setAllExercises] = useState([]);

  useEffect(() => {
    setLoading(true);
    const ctrl = new AbortController();
    Promise.all([
      fetch(`${import.meta.env.VITE_API_BASE || '/api'}/training/week`, { signal: ctrl.signal }).then(r => r.json()),
      api.training.getAwProgram().catch(() => ({}))
    ])
      .then(([data, awData]) => {
        setWeekData(data);
        setAwProgram(awData && Object.keys(awData).length ? awData : AW_PROGRAM_FALLBACK);
        const todayIdx = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
        setSelectedDay(data.find(d => d.weekday === todayIdx) || data[0]);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (calendarVisible) {
      api.training.getExercises().then(setAllExercises).catch(() => setAllExercises([]));
    }
  }, [calendarVisible]);

  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);
    setSetsByExercise({});
  }, []);

  const handleRowsChange = useCallback((exerciseId, rows) => {
    setSetsByExercise(prev => {
      const newState = { ...prev, [exerciseId]: rows };
      setHistory(h => {
        const newHistory = h.slice(0, historyIndex + 1);
        newHistory.push({ exerciseId, rows: JSON.parse(JSON.stringify(rows)), timestamp: Date.now() });
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(idx => Math.min(idx + 1, 49));
      setLastSaved(Date.now());
      return newState;
    });
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setSetsByExercise(prev => ({ ...prev, [prevState.exerciseId]: prevState.rows }));
      setHistoryIndex(idx => idx - 1);
      setLastSaved(Date.now());
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setSetsByExercise(prev => ({ ...prev, [nextState.exerciseId]: nextState.rows }));
      setHistoryIndex(idx => idx + 1);
      setLastSaved(Date.now());
    }
  }, [history, historyIndex]);

  useEffect(() => {
    if (!selectedDay || !lastSaved || isSaving) return;
    const timeoutId = setTimeout(() => {
      const sets = [];
      Object.entries(setsByExercise).forEach(([exerciseId, rows]) => {
        (rows || []).forEach(row => {
          if (row.weight || row.reps) {
            sets.push({
              exercise_id: exerciseId,
              set_number: row.set,
              weight_kg: row.weight ? parseFloat(row.weight) : null,
              reps: row.reps ? parseInt(row.reps, 10) : null,
              completed: !!row.checked
            });
          }
        });
      });
      if (sets.length > 0) {
        setIsSaving(true);
        api.training.log({ template_id: selectedDay.template_id, sets }).finally(() => setIsSaving(false));
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [lastSaved, selectedDay, setsByExercise, isSaving]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-medium text-gray-500 animate-pulse">Loading Protocol...</p>
        </div>
      </div>
    );
  }

  const strengthEx = selectedDay?.exercises.filter(e => e.category === 'STRENGTH') || [];
  const awEx = selectedDay?.exercises.filter(e => e.category === 'AW') || [];
  const hypEx = selectedDay?.exercises.filter(e => e.category === 'HYPERTROPHY') || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090B] pb-24">
      {/* Top Navigation Bar */}
      <header className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-gray-200/60 dark:border-zinc-800/60 supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Training Protocol</h1>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Anas & Flavio</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto Save Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-zinc-800/50">
              {isSaving ? (
                <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : lastSaved ? (
                <CheckCircle2 size={14} className="text-emerald-500" />
              ) : (
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-zinc-600" />
              )}
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                {isSaving ? 'Saving...' : lastSaved ? 'Saved' : 'Ready'}
              </span>
            </div>

            {/* Undo/Redo */}
            <div className="flex bg-gray-100 dark:bg-zinc-800/80 rounded-xl p-1">
              <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 transition-all text-gray-700 dark:text-gray-300">
                <Undo2 size={16} />
              </button>
              <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-700 disabled:opacity-30 transition-all text-gray-700 dark:text-gray-300">
                <Redo2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[95vw] mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">

        {/* Header with Calendar Toggle only */}
        <div className="flex justify-end">
          <button
            onClick={() => setCalendarVisible(!calendarVisible)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
          >
            {calendarVisible ? 'Hide Schedule' : 'Edit Schedule'}
            <ChevronDown size={14} className={`transform transition-transform ${calendarVisible ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {calendarVisible && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-4">
              <MuscleVolumeLegend days={weekData} />

              <div className="no-select-calendar overflow-x-hidden min-w-0">
                <WeeklyCalendar4 onDaySelect={handleDaySelect} selectedDayId={selectedDay?.template_id} initialDays={weekData} availableExercises={allExercises} />
              </div>

              {false && <ExerciseMuscleMatrix exercises={allExercises} weekDays={weekData} awProgram={awProgram} />}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Day Selector - Modern, Minimal & Precision Aligned */}
        <div className="w-full mb-12 border-b border-gray-200/50 dark:border-zinc-800/50">
          <div className="flex w-full overflow-hidden">
            <div className="w-[100px] shrink-0 hidden sm:block" /> { /* 100px spacer for calendar line-up */}
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${weekData.length}, minmax(0, 1fr))` }}>
              {weekData.map(day => (
                <button
                  key={day.template_id}
                  onClick={() => handleDaySelect(day)}
                  className={`group relative py-6 text-[10px] font-black uppercase tracking-[0.25em] transition-all
                    ${selectedDay?.template_id === day.template_id
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                >
                  <span className="relative z-10">Day {day.weekday + 1}</span>
                  {selectedDay?.template_id === day.template_id && (
                    <>
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-x-2 inset-y-2 bg-blue-50 dark:bg-blue-500/10 rounded-2xl -z-0"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                      <motion.div
                        layoutId="nav-bar"
                        className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-t-full z-20"
                      />
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Exercises Grid - Strength e AW affiancati - Spaced and separated */}
        <div className="pt-8 border-t border-gray-200/50 dark:border-zinc-800/50">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:gap-8 items-start">

            {/* Main Strength */}
            <section className="min-w-0">
              <SectionHeader icon={Swords} title="Main Strength" subtitle="Compound Progression" colorClass="bg-blue-500" />

              <div className="space-y-3">
                {strengthEx.length === 0 ? (
                  <div className="h-32 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800 flex items-center justify-center text-xs font-semibold text-gray-400 uppercase tracking-widest">No Exercises</div>
                ) : (
                  strengthEx.map(ex => <StrengthTable2 key={`v2-${ex.exercise_id}`} exercise={ex} onRowsChange={handleRowsChange} />)
                )}
              </div>
            </section>

            {/* Armwrestling Specific */}
            <section className="min-w-0">
              <SectionHeader icon={Target} title="Armwrestling" subtitle="Table, Iso, Volume, Speed" colorClass="bg-amber-500" />
              <div className="space-y-4">
                {(() => {
                  const volKeywords = ['volume 1', 'volume 2', 'aw_v1', 'aw_v2'];
                  const isoKeywords = ['rising', 'cup', 'pronation', 'side', 'mazurenko', 'press', 'bicipite', 'isometria', 'iso'];

                  const isVol1 = (ex) => (ex.exercise_id || '').toLowerCase().includes('aw_v1') || (ex.exercise_name || '').toLowerCase().includes('volume 1');
                  const isVol2 = (ex) => (ex.exercise_id || '').toLowerCase().includes('aw_v2') || (ex.exercise_name || '').toLowerCase().includes('volume 2');

                  const isLight = (ex) => {
                    const n = (ex.exercise_name || '').toLowerCase();
                    const id = (ex.exercise_id || '').toLowerCase();
                    return id.includes('light') || id.includes('leggera') || n.includes('light') || n.includes('leggera');
                  };

                  const isHeavy = (ex) => {
                    const n = (ex.exercise_name || '').toLowerCase();
                    const id = (ex.exercise_id || '').toLowerCase();
                    return id.includes('heavy') || id.includes('pesante') || n.includes('heavy') || n.includes('pesante');
                  };

                  const isIso = (ex) => isoKeywords.some(k => (ex.exercise_name || '').toLowerCase().includes(k) || (ex.exercise_id || '').toLowerCase().includes(k));

                  const vol1 = awEx.filter(isVol1);
                  const vol2 = awEx.filter(isVol2);
                  const isoLight = awEx.filter(ex => !isVol1(ex) && !isVol2(ex) && isIso(ex) && isLight(ex) && !isHeavy(ex));
                  const isoHeavy = awEx.filter(ex => !isVol1(ex) && !isVol2(ex) && isIso(ex) && isHeavy(ex));

                  const others = awEx.filter(ex =>
                    !vol1.includes(ex) &&
                    !vol2.includes(ex) &&
                    !isoLight.includes(ex) &&
                    !isoHeavy.includes(ex)
                  );

                  return (
                    <>
                      {vol1.length > 0 && <AWVolumeTableGroup title="Volume 1" exercises={vol1} onRowsChange={handleRowsChange} />}
                      {vol2.length > 0 && <AWVolumeTableGroup title="Volume 2" exercises={vol2} onRowsChange={handleRowsChange} />}
                      {isoLight.length > 0 && <AWIsoTableGroup title="AW Isometria Leggera" exercises={isoLight} onRowsChange={handleRowsChange} programData={awProgram?.light} />}
                      {isoHeavy.length > 0 && <AWIsoTableGroup title="AW Isometria Pesante" exercises={isoHeavy} onRowsChange={handleRowsChange} programData={awProgram?.heavy} />}
                      {others.map(ex => (
                        <ExerciseTable key={ex.exercise_id} exercise={ex} onRowsChange={handleRowsChange} />
                      ))}
                    </>
                  );
                })()}
                {awProgram && (
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Protocollo Riferimento</span>
                      <div className="h-px flex-1 bg-gradient-to-r from-amber-200 to-transparent" />
                    </div>
                    {awProgram.max_day && (
                      <Card className="border-amber-100 dark:border-amber-900/30">
                        <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-amber-100 dark:border-amber-800/30">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white">{awProgram.max_day.title}</h3>
                        </div>
                        <div className="p-3 overflow-x-auto custom-scrollbar">
                          <table className="w-full text-[10px] border-collapse">
                            <thead>
                              <tr className="border-b border-amber-100 dark:border-amber-800/50">
                                <th className="py-2 px-2 text-left font-bold text-amber-600 dark:text-amber-400">W</th>
                                <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400">Esercizio</th>
                                <th className="py-2 px-2 text-center font-bold text-blue-600 dark:text-blue-400">Anas 1RM</th>
                                <th className="py-2 px-2 text-center font-bold text-emerald-600 dark:text-emerald-400">Flavio 1RM</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(awProgram.max_day.weeks || []).flatMap((w, wi) => (w.exercises || []).map((ex, ei) => (
                                <tr key={`${wi}-${ei}`} className="border-b border-amber-50 dark:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                                  <td className="py-2 px-2 font-bold text-amber-600 dark:text-amber-400">{ei === 0 ? `W${w.week}` : ''}</td>
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{ex.name}</td>
                                  <td className="py-2 px-2 text-center">{ex.anas_1rm ?? '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.flavio_1rm ?? '-'}</td>
                                </tr>
                              )))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                    {awProgram.light && (
                      <Card className="border-amber-100 dark:border-amber-900/30">
                        <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-amber-100 dark:border-amber-800/30">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white">{awProgram.light.title}</h3>
                        </div>
                        <div className="p-3 overflow-x-auto custom-scrollbar">
                          <table className="w-full text-[10px] border-collapse">
                            <thead>
                              <tr className="border-b border-amber-100 dark:border-amber-800/50">
                                <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400">Esercizio</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W1</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W2</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W3</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W4</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W5</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(awProgram.light.exercises || []).map((ex, i) => (
                                <tr key={i} className="border-b border-amber-50 dark:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{ex.name}</td>
                                  <td className="py-2 px-2 text-center">{ex.w1 ? `${ex.w1}kg` : '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.w2 ? `${ex.w2}kg` : '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.w3 ? `${ex.w3}kg` : '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.w4 ? `${ex.w4}kg` : '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.w5 ? `${ex.w5}kg` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                    {awProgram.heavy && (
                      <Card className="border-amber-100 dark:border-amber-900/30">
                        <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-amber-100 dark:border-amber-800/30">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white">{awProgram.heavy.title}</h3>
                        </div>
                        <div className="p-3 overflow-x-auto custom-scrollbar">
                          <table className="w-full text-[10px] border-collapse">
                            <thead>
                              <tr className="border-b border-amber-100 dark:border-amber-800/50">
                                <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400">Esercizio</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W1</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W2</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W3</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W4</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">W5</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(awProgram.heavy.exercises || []).map((ex, i) => (
                                <tr key={i} className="border-b border-amber-50 dark:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{ex.name}</td>
                                  <td className="py-2 px-2 text-center">{ex.w1 ? `${ex.w1}kg` : '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.w2 ? `${ex.w2}kg` : '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.w3 ? `${ex.w3}kg` : '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.w4 ? `${ex.w4}kg` : '-'}</td>
                                  <td className="py-2 px-2 text-center">{ex.w5 ? `${ex.w5}kg` : '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                    {awProgram.speed && (
                      <Card className="border-amber-100 dark:border-amber-900/30">
                        <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-amber-100 dark:border-amber-800/30">
                          <h3 className="text-xs font-bold text-gray-900 dark:text-white">{awProgram.speed.title}</h3>
                        </div>
                        <div className="p-3 overflow-x-auto custom-scrollbar">
                          <table className="w-full text-[10px] border-collapse">
                            <thead>
                              <tr className="border-b border-amber-100 dark:border-amber-800/50">
                                <th className="py-2 px-2 text-left font-bold text-gray-600 dark:text-gray-400">Esercizio</th>
                                <th className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">Peso (kg)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(awProgram.speed.exercises || []).map((ex, i) => (
                                <tr key={i} className="border-b border-amber-50 dark:border-amber-900/30 hover:bg-amber-50/30 dark:hover:bg-amber-900/20">
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{ex.name}</td>
                                  <td className="py-2 px-2 text-center">{ex.weight ?? '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            </section>

          </div>

          {/* Hypertrophy Grid */}
          {hypEx.length > 0 && (
            <section className="pt-8 mt-8 border-t border-gray-200/60 dark:border-zinc-800/60">
              <SectionHeader icon={Dumbbell} title="Hypertrophy & Accessories" subtitle="Isolation and Volume" colorClass="bg-emerald-500" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {hypEx.map(ex => <HypertrophyTable key={ex.exercise_id} exercise={ex} onRowsChange={handleRowsChange} initialRows={setsByExercise[ex.exercise_id]} />)}
              </div>
            </section>
          )}

        </div>
      </main>

      {/* CSS for custom scrollbar within cards */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: #3f3f46; }
      `}} />
    </div >
  );
}
