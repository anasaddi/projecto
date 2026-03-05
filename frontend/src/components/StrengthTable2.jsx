import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Utility Functions ---
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
  return rm != null ? `${roundToHalf(rm)}` : '-';
};

// --- Configuration ---
const WEEK_CONFIGS = [
  { week: 1, sets: 5, targetReps: 5, percent: 0.75, label: '5×5', intensity: '75%' },
  { week: 2, sets: 4, targetReps: 4, percent: 0.80, label: '4×4', intensity: '80%' },
  { week: 3, sets: 1, targetReps: 'AMRAP', percent: 0.85, label: 'AMRAP', intensity: '85%' },
  { week: 4, sets: 3, targetReps: 5, percent: 0.60, label: '3×5', intensity: '60%' },
];

const createMonthData = () => WEEK_CONFIGS.map(cfg => ({
  week: cfg.week,
  anas: { weight: '', reps: '', completed: false },
  flavio: { weight: '', reps: '', completed: false }
}));

const STORAGE_KEY = (id) => `strength_v2_${id}`;

// --- Components ---
const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
    {children}
  </div>
);

const ModernInput = ({ value, onChange, placeholder, step, className = '', small = false }) => (
  <input
    type="number"
    step={step || '0.5'}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={`bg-gray-50/80 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-700 rounded-lg text-center font-semibold text-gray-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 mx-auto block ${small ? 'text-[10px] py-1 px-1' : 'text-xs py-1.5 px-2'
      } ${className}`}
  />
);

const Checkbox = ({ checked, onChange, colorClass = 'accent-blue-500' }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={onChange}
    className={`w-4 h-4 rounded border-gray-300 dark:border-zinc-600 bg-gray-50 dark:bg-zinc-800 cursor-pointer transition-all ${colorClass}`}
  />
);

// --- Main Component ---
export default function StrengthTable2({ exercise, onRowsChange }) {
  const { exercise_id, exercise_name } = exercise;
  const storageKey = STORAGE_KEY(exercise_id);

  const [currentMonth, setCurrentMonth] = useState(1);
  const [tmAnas, setTmAnas] = useState('');
  const [tmFlavio, setTmFlavio] = useState('');
  // TM per mesi 2-6 (calcolati da AMRAP del mese precedente, ma modificabili)
  const [tmByMonth, setTmByMonth] = useState(() => Array(5).fill(null).map(() => ({ anas: '', flavio: '' })));
  const [dataByMonth, setDataByMonth] = useState(() =>
    Array.from({ length: 6 }, () => createMonthData())
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.tmAnas != null) setTmAnas(String(parsed.tmAnas));
        if (parsed.tmFlavio != null) setTmFlavio(String(parsed.tmFlavio));
        if (parsed.tmByMonth?.length === 5) setTmByMonth(parsed.tmByMonth);
        if (parsed.dataByMonth?.length === 6) setDataByMonth(parsed.dataByMonth);
      }
    } catch (_) { }
    setIsLoaded(true);
  }, [storageKey]);

  // Persist to storage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ tmAnas, tmFlavio, tmByMonth, dataByMonth }));
    } catch (_) { }
  }, [storageKey, tmAnas, tmFlavio, tmByMonth, dataByMonth, isLoaded]);

  // Month 1: TM auto-calculates weights
  const setTmAnasWithSync = (val) => {
    setTmAnas(val);
    const tm = parseFloat(val);
    if (!isNaN(tm) && tm > 0) {
      setDataByMonth(prev => prev.map((month, mi) =>
        mi === 0 ? month.map((row, wi) => ({
          ...row,
          anas: { ...row.anas, weight: String(Math.round(tm * WEEK_CONFIGS[wi].percent)) }
        })) : month
      ));
    }
  };

  const setTmFlavioWithSync = (val) => {
    setTmFlavio(val);
    const tm = parseFloat(val);
    if (!isNaN(tm) && tm > 0) {
      setDataByMonth(prev => prev.map((month, mi) =>
        mi === 0 ? month.map((row, wi) => ({
          ...row,
          flavio: { ...row.flavio, weight: String(Math.round(tm * WEEK_CONFIGS[wi].percent)) }
        })) : month
      ));
    }
  };

  // Months 2-6: TM comes from AMRAP 1RM of previous month (auto-calculate if not set)
  useEffect(() => {
    setDataByMonth(prev => {
      let changed = false;
      const next = prev.map((month, monthIdx) => {
        if (monthIdx === 0) return month;
        const amrapRow = prev[monthIdx - 1][2]; // Week 3 (AMRAP)
        const tmIndex = monthIdx - 1;
        return month.map((row, weekIdx) => {
          const cfg = WEEK_CONFIGS[weekIdx];
          const updates = {};
          for (const athlete of ['anas', 'flavio']) {
            // Use manual TM if set, otherwise calculate from AMRAP
            const manualTm = tmByMonth[tmIndex]?.[athlete];
            let tm;
            if (manualTm && !isNaN(parseFloat(manualTm))) {
              tm = parseFloat(manualTm);
            } else {
              const rm = calc1RM(amrapRow[athlete].weight, amrapRow[athlete].reps);
              if (rm != null) {
                tm = parseFloat(roundToHalf(rm));
              }
            }
            if (tm != null) {
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
  }, [dataByMonth, tmByMonth]);

  // Update TM for months 2-6 and sync weights
  const updateTmForMonth = (monthIdx, athlete, val) => {
    const tmIndex = monthIdx - 1;
    setTmByMonth(prev => prev.map((tm, i) => i === tmIndex ? { ...tm, [athlete]: val } : tm));
    const tm = parseFloat(val);
    if (!isNaN(tm) && tm > 0) {
      setDataByMonth(prev => prev.map((month, mi) =>
        mi === monthIdx ? month.map((row, wi) => ({
          ...row,
          [athlete]: { ...row[athlete], weight: String(Math.round(tm * WEEK_CONFIGS[wi].percent)) }
        })) : month
      ));
    }
  };

  const updateAthlete = (monthIdx, weekIdx, athlete, field, value) => {
    setDataByMonth(prev => prev.map((month, mi) =>
      mi === monthIdx ? month.map((row, wi) =>
        wi === weekIdx ? { ...row, [athlete]: { ...row[athlete], [field]: value } } : row
      ) : month
    ));
  };

  const toggleComplete = (monthIdx, weekIdx, athlete) => {
    setDataByMonth(prev => prev.map((month, mi) =>
      mi === monthIdx ? month.map((row, wi) =>
        wi === weekIdx ? { ...row, [athlete]: { ...row[athlete], completed: !row[athlete].completed } } : row
      ) : month
    ));
  };

  const getDefaultReps = (weekCfg) =>
    weekCfg.targetReps === 'AMRAP' ? 1 : (typeof weekCfg.targetReps === 'number' ? weekCfg.targetReps : weekCfg.sets || 5);

  const getVolume = (athleteData, weekCfg) => {
    const w = parseFloat(athleteData.weight) || 0;
    const r = parseInt(athleteData.reps, 10) || getDefaultReps(weekCfg);
    if (!w) return 0;
    const totalReps = weekCfg.targetReps === 'AMRAP' ? r : weekCfg.sets * r;
    return w * totalReps;
  };

  const data = dataByMonth[currentMonth - 1] || [];

  const totalVolumeA = data.reduce((a, r, i) => a + getVolume(r.anas, WEEK_CONFIGS[i]), 0);
  const totalVolumeF = data.reduce((a, r, i) => a + getVolume(r.flavio, WEEK_CONFIGS[i]), 0);

  return (
    <Card className="overflow-hidden border-blue-100/60 dark:border-blue-900/20">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-blue-500/5 via-blue-400/5 to-transparent dark:from-blue-500/10 dark:to-transparent">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center shadow-md shadow-blue-500/25">
            <span className="text-[11px] font-black text-white">{currentMonth}</span>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{exercise_name}</h3>
          </div>
        </div>

        {/* TM Input - visible for all months */}
        <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
          {currentMonth === 1 ? (
            <>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-blue-500 uppercase">A</span>
                <ModernInput
                  type="number"
                  step="0.5"
                  value={tmAnas}
                  onChange={e => setTmAnasWithSync(e.target.value)}
                  className="w-10 text-center"
                  placeholder="TM"
                  small
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-emerald-500 uppercase">F</span>
                <ModernInput
                  type="number"
                  step="0.5"
                  value={tmFlavio}
                  onChange={e => setTmFlavioWithSync(e.target.value)}
                  className="w-10 text-center"
                  placeholder="TM"
                  small
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-blue-500 uppercase">A</span>
                <ModernInput
                  type="number"
                  step="0.5"
                  value={tmByMonth[currentMonth - 2]?.anas || ''}
                  onChange={e => updateTmForMonth(currentMonth - 1, 'anas', e.target.value)}
                  className="w-10 text-center"
                  placeholder={(() => {
                    const prevAmrap = dataByMonth[currentMonth - 2]?.[2];
                    return prevAmrap ? format1RM(prevAmrap.anas.weight, prevAmrap.anas.reps) : 'TM';
                  })()}
                  small
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold text-emerald-500 uppercase">F</span>
                <ModernInput
                  type="number"
                  step="0.5"
                  value={tmByMonth[currentMonth - 2]?.flavio || ''}
                  onChange={e => updateTmForMonth(currentMonth - 1, 'flavio', e.target.value)}
                  className="w-10 text-center"
                  placeholder={(() => {
                    const prevAmrap = dataByMonth[currentMonth - 2]?.[2];
                    return prevAmrap ? format1RM(prevAmrap.flavio.weight, prevAmrap.flavio.reps) : 'TM';
                  })()}
                  small
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Month Selector - Modern Pills */}
      <div className="px-3 py-2 bg-gray-50/80 dark:bg-zinc-800/60 border-y border-gray-100 dark:border-zinc-700/50">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5, 6].map(m => (
            <motion.button
              key={m}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentMonth(m)}
              className={`flex-1 h-7 rounded-lg text-[11px] font-bold transition-all duration-200 ${currentMonth === m
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/25'
                : 'bg-white dark:bg-zinc-700/50 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600'
                }`}
            >
              {m}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="p-3">
        <div className="rounded-xl overflow-hidden border border-gray-200/70 dark:border-zinc-700/70 shadow-sm">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-gradient-to-r from-gray-50 to-gray-100/80 dark:from-zinc-800 dark:to-zinc-800/90">
                <th className="py-2 px-1 w-6 text-center">
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">W</span>
                </th>
                <th className="py-2 px-1 w-12 text-center">
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">SCH</span>
                </th>
                <th className="py-2 px-1 w-8 text-center">
                  <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">%</span>
                </th>
                <th className="py-2 px-1 text-center">
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">KG</span>
                </th>
                <th className="py-2 px-1 text-center">
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">1RM</span>
                </th>
                <th className="py-2 px-1 w-8 text-center">
                  <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400">✓</span>
                </th>
                <th className="py-2 px-1 text-center">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">KG</span>
                </th>
                <th className="py-2 px-1 text-center">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">1RM</span>
                </th>
                <th className="py-2 px-1 w-8 text-center">
                  <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">✓</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((r, idx) => {
                const cfg = WEEK_CONFIGS[idx];
                const isAmrap = cfg.targetReps === 'AMRAP';
                const defaultReps = getDefaultReps(cfg);
                const rmA = format1RM(r.anas.weight, r.anas.reps || defaultReps);
                const rmF = format1RM(r.flavio.weight, r.flavio.reps || defaultReps);

                return (
                  <motion.tr
                    key={idx}
                    initial={false}
                    whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.04)' }}
                    className="border-t border-gray-100 dark:border-zinc-700/50 transition-colors"
                  >
                    <td className="py-1.5 px-1 text-center">
                      <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{r.week}</span>
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${isAmrap
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700'
                        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                        }`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <span className="text-[10px] text-gray-500">{cfg.intensity}</span>
                    </td>

                    {/* Anas kg */}
                    <td className="py-1.5 px-1 text-center">
                      <ModernInput
                        type="number"
                        step="0.5"
                        value={r.anas.weight}
                        onChange={e => updateAthlete(currentMonth - 1, idx, 'anas', 'weight', e.target.value)}
                        className="w-10 text-center"
                        small
                      />
                    </td>

                    {/* Anas r / 1RM */}
                    <td className="py-1.5 px-1 text-center">
                      {isAmrap ? (
                        <input
                          type="number"
                          value={r.anas.reps}
                          onChange={e => updateAthlete(currentMonth - 1, idx, 'anas', 'reps', e.target.value)}
                          className={`w-10 border rounded text-center text-[11px] py-1 font-semibold transition-all mx-auto block ${r.anas.reps
                            ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600'
                            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                            }`}
                          placeholder="r"
                        />
                      ) : (
                        <span className={`inline-block w-10 py-1 rounded text-[10px] font-bold ${rmA !== '-'
                          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700'
                          : 'bg-gray-50 dark:bg-zinc-800/40 text-gray-400 dark:text-zinc-600 border border-transparent dark:border-zinc-800/20'
                          }`}>
                          {rmA}
                        </span>
                      )}
                    </td>

                    {/* Anas Check */}
                    <td className="py-1.5 px-1 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          checked={r.anas.completed}
                          onChange={(e) => {
                            toggleComplete(currentMonth - 1, idx, 'anas');
                            if (e.target.checked) import('canvas-confetti').then(m => m.default({ particleCount: 40, spread: 60, origin: { y: 0.8 } }));
                          }}
                          className="w-4 h-4 rounded border-2 border-blue-300 dark:border-blue-700 accent-blue-500 cursor-pointer"
                        />
                        {r.anas.completed && (
                          <input
                            type="number"
                            min="1" max="10"
                            placeholder="RPE"
                            value={r.anas.rpe || ''}
                            onChange={e => updateAthlete(currentMonth - 1, idx, 'anas', 'rpe', e.target.value)}
                            className="w-8 text-[8px] text-center bg-gray-100 dark:bg-zinc-800 rounded outline-none text-gray-500 font-medium"
                          />
                        )}
                      </div>
                    </td>

                    {/* Flavio kg */}
                    <td className="py-1.5 px-1 text-center border-l border-gray-100 dark:border-zinc-700/50">
                      <ModernInput
                        type="number"
                        step="0.5"
                        value={r.flavio.weight}
                        onChange={e => updateAthlete(currentMonth - 1, idx, 'flavio', 'weight', e.target.value)}
                        className="w-10 text-center"
                        small
                      />
                    </td>

                    {/* Flavio r / 1RM */}
                    <td className="py-1.5 px-1 text-center">
                      {isAmrap ? (
                        <input
                          type="number"
                          value={r.flavio.reps}
                          onChange={e => updateAthlete(currentMonth - 1, idx, 'flavio', 'reps', e.target.value)}
                          className={`w-10 border rounded text-center text-[11px] py-1 font-semibold transition-all mx-auto block ${r.flavio.reps
                            ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600'
                            : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                            }`}
                          placeholder="r"
                        />
                      ) : (
                        <span className={`inline-block w-10 py-1 rounded text-[10px] font-bold ${rmF !== '-'
                          ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700'
                          : 'bg-gray-50 dark:bg-zinc-800/40 text-gray-400 dark:text-zinc-600 border border-transparent dark:border-zinc-800/20'
                          }`}>
                          {rmF}
                        </span>
                      )}
                    </td>

                    {/* Flavio Check */}
                    <td className="py-1.5 px-1 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          checked={r.flavio.completed}
                          onChange={(e) => {
                            toggleComplete(currentMonth - 1, idx, 'flavio');
                            if (e.target.checked) import('canvas-confetti').then(m => m.default({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#10b981', '#34d399'] }));
                          }}
                          className="w-4 h-4 rounded border-2 border-emerald-300 dark:border-emerald-700 accent-emerald-500 cursor-pointer"
                        />
                        {r.flavio.completed && (
                          <input
                            type="number"
                            min="1" max="10"
                            placeholder="RPE"
                            value={r.flavio.rpe || ''}
                            onChange={e => updateAthlete(currentMonth - 1, idx, 'flavio', 'rpe', e.target.value)}
                            className="w-8 text-[8px] text-center bg-gray-100 dark:bg-zinc-800 rounded outline-none text-gray-500 font-medium"
                          />
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer - Volume Summary */}
      <div className="px-3 py-2 bg-gradient-to-r from-gray-50 via-gray-100/50 to-gray-50 dark:from-zinc-800/80 dark:via-zinc-800/60 dark:to-zinc-800/80 border-t border-gray-100 dark:border-zinc-700/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Volume M{currentMonth}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                A: {totalVolumeA.toFixed(0)} kg
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                F: {totalVolumeF.toFixed(0)} kg
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
