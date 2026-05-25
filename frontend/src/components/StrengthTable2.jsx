import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrainingCard,
  TrainingBlockHeader,
  PeriodPills,
  TrainingTableWrap,
  TrainingTable,
  TrainingThead,
  TrainingTh,
  CompactInput,
  ModernCheckbox,
  TABLE,
  ACCENT,
} from './training/TrainingUI';
import { cn } from '../lib/utils';
import { api } from '../api/client';

import { calc1RM } from '../utils/trainingUtils';

const roundToHalf = (n) => (Math.round(n * 2) / 2).toFixed(1);
const format1RM = (weight, reps) => {
  const rm = calc1RM(weight, reps);
  return rm != null ? `${roundToHalf(rm)}` : '-';
};

// --- Bodyweights for special exercises ---
const BODYWEIGHTS = {
  anas: 60,
  flavio: 68
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

// --- Main Component ---
export default function StrengthTable2({ exercise, onRowsChange, onProgressionChange, initialMonth, resetTrigger, embedded = false }) {
  const { exercise_id, exercise_name } = exercise;
  const storageKey = STORAGE_KEY(exercise_id);

  const [currentMonth, setCurrentMonth] = useState(initialMonth || 1);
  const [tmAnas, setTmAnas] = useState('');
  const [tmFlavio, setTmFlavio] = useState('');
  // TM per mesi 2-6 (calcolati da AMRAP del mese precedente, ma modificabili)
  const [tmByMonth, setTmByMonth] = useState(() => Array(5).fill(null).map(() => ({ anas: '', flavio: '' })));
  const [dataByMonth, setDataByMonth] = useState(() =>
    Array.from({ length: 6 }, () => createMonthData())
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Sync currentMonth if initialMonth prop changes or resetTrigger (like selectedDate) changes
  useEffect(() => {
    if (initialMonth) {
      setCurrentMonth(initialMonth);
    }
  }, [initialMonth, resetTrigger]);

  // Load from Backend (with localStorage migration)
  useEffect(() => {
    async function loadData() {
      try {
        const backendData = await api.training.getProgression(exercise_id);

        if (backendData?.data) {
          const { tmAnas, tmFlavio, tmByMonth, dataByMonth } = backendData.data;
          if (tmAnas != null) setTmAnas(String(tmAnas));
          if (tmFlavio != null) setTmFlavio(String(tmFlavio));
          if (Array.isArray(tmByMonth)) setTmByMonth(tmByMonth);
          if (Array.isArray(dataByMonth)) setDataByMonth(dataByMonth);
        } else {
          // Fallback/Migrazione da localStorage
          const raw = localStorage.getItem(storageKey);
          if (raw) {
            try {
              const parsed = JSON.parse(raw);
              if (parsed.tmAnas != null) setTmAnas(String(parsed.tmAnas));
              if (parsed.tmFlavio != null) setTmFlavio(String(parsed.tmFlavio));
              if (Array.isArray(parsed.tmByMonth)) setTmByMonth(parsed.tmByMonth);
              if (Array.isArray(parsed.dataByMonth)) setDataByMonth(parsed.dataByMonth);

              // Salva subito nel backend per migrare
              await api.training.updateProgression(exercise_id, parsed);
            } catch (e) {
              console.warn("Invalid localStorage data for", exercise_id);
            }
          }
        }
      } catch (err) {
        console.error("Errore caricamento progressione:", err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadData();
  }, [exercise_id, storageKey]);

  // Auto-save to Backend (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      const payload = {
        tmAnas,
        tmFlavio,
        tmByMonth,
        dataByMonth
      };
      try {
        await api.training.updateProgression(exercise_id, payload);
        // Sincronizza anche localStorage come backup locale
        localStorage.setItem(storageKey, JSON.stringify(payload));
        // Notifica il genitore per aggiornare il calendario
        if (onProgressionChange) onProgressionChange(exercise_id, payload);
      } catch (err) {
        console.error("Errore salvataggio progressione:", err);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [tmAnas, tmFlavio, tmByMonth, dataByMonth, exercise_id, storageKey, isLoaded]);

  // Month 1: TM auto-calculates weights
  const setTmAnasWithSync = (val) => {
    setTmAnas(val);
    const tm = parseFloat(val);
    if (!isNaN(tm) && tm >= 0) {
      const isPullup = exercise_id === 'pu_str';
      const bw = BODYWEIGHTS.anas;

      setDataByMonth(prev => prev.map((month, mi) =>
        mi === 0 ? month.map((row, wi) => {
          const percent = WEEK_CONFIGS[wi].percent;
          let weightVal;
          if (isPullup) {
            // Se sono trazioni, il TM inserito è il sovraccarico
            // TargetTotal = (TM + BW) * Percent
            // TargetAdded = TargetTotal - BW
            const totalTm = tm + bw;
            const targetTotal = totalTm * percent;
            weightVal = String(roundToHalf(targetTotal) - bw);
          } else {
            weightVal = String(roundToHalf(tm * percent));
          }
          return {
            ...row,
            anas: { ...row.anas, weight: weightVal }
          };
        }) : month
      ));
    }
  };

  const setTmFlavioWithSync = (val) => {
    setTmFlavio(val);
    const tm = parseFloat(val);
    if (!isNaN(tm) && tm >= 0) {
      const isPullup = exercise_id === 'pu_str';
      const bw = BODYWEIGHTS.flavio;

      setDataByMonth(prev => prev.map((month, mi) =>
        mi === 0 ? month.map((row, wi) => {
          const percent = WEEK_CONFIGS[wi].percent;
          let weightVal;
          if (isPullup) {
            const totalTm = tm + bw;
            const targetTotal = totalTm * percent;
            weightVal = String(roundToHalf(targetTotal) - bw);
          } else {
            weightVal = String(roundToHalf(tm * percent));
          }
          return {
            ...row,
            flavio: { ...row.flavio, weight: weightVal }
          };
        }) : month
      ));
    }
  };

  // Months 2-6: TM comes from AMRAP 1RM of previous month (auto-calculate only IF NOT already set)
  useEffect(() => {
    setDataByMonth(prev => {
      let changed = false;
      const next = prev.map((month, monthIdx) => {
        if (monthIdx === 0) return month;
        const amrapRow = prev[monthIdx - 1][2]; // Week 3 (AMRAP)
        const tmIndex = monthIdx - 1;
        const isPullup = exercise_id === 'pu_str';

        return month.map((row, weekIdx) => {
          const cfg = WEEK_CONFIGS[weekIdx];
          const updates = {};
          for (const athlete of ['anas', 'flavio']) {
            // Se l'utente ha già inserito un peso manualmente per questa settimana, non sovrascriverlo
            if (row[athlete].weight && row[athlete].weight !== '' && row[athlete].weight !== '0') {
              continue;
            }

            const bw = BODYWEIGHTS[athlete];
            const manualTm = tmByMonth[tmIndex]?.[athlete];
            let tm;

            // Se c'è un TM manuale inserito per questo mese, usalo sempre (anche se AMRAP non è checkato)
            if (manualTm && !isNaN(parseFloat(manualTm)) && manualTm !== '') {
              tm = parseFloat(manualTm);
            }
            // Altrimenti calcola da AMRAP, ma SOLO se l'AMRAP è stato completato (checkato)
            else if (amrapRow[athlete].completed) {
              const tableWeight = parseFloat(amrapRow[athlete].weight) || 0;
              const totalWeight = isPullup ? (tableWeight + bw) : tableWeight;
              const rm = calc1RM(totalWeight, amrapRow[athlete].reps);
              if (rm != null) {
                const totalRm = parseFloat(roundToHalf(rm));
                tm = isPullup ? (totalRm - bw) : totalRm;
              }
            }

            if (tm != null) {
              let targetKg;
              if (isPullup) {
                const totalTm = tm + bw;
                const targetTotal = totalTm * cfg.percent;
                targetKg = String(roundToHalf(targetTotal) - bw);
              } else {
                targetKg = String(roundToHalf(tm * cfg.percent));
              }
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
  }, [dataByMonth, tmByMonth, exercise_id]);

  // Update TM for months 2-6 and sync weights
  const updateTmForMonth = (monthIdx, athlete, val) => {
    const tmIndex = monthIdx - 1;
    setTmByMonth(prev => prev.map((tm, i) => i === tmIndex ? { ...tm, [athlete]: val } : tm));
    const tm = parseFloat(val);
    if (!isNaN(tm) && tm >= 0) {
      const isPullup = exercise_id === 'pu_str';
      const bw = BODYWEIGHTS[athlete];

      setDataByMonth(prev => prev.map((month, mi) =>
        mi === monthIdx ? month.map((row, wi) => {
          const percent = WEEK_CONFIGS[wi].percent;
          let weightVal;
          if (isPullup) {
            const totalTm = tm + bw;
            const targetTotal = totalTm * percent;
            weightVal = String(roundToHalf(targetTotal) - bw);
          } else {
            weightVal = String(roundToHalf(tm * percent));
          }
          return {
            ...row,
            [athlete]: { ...row[athlete], weight: weightVal }
          };
        }) : month
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

  const getVolume = (athlete, athleteData, weekCfg) => {
    const isPullup = exercise_id === 'pu_str';
    const bw = BODYWEIGHTS[athlete];
    const w = parseFloat(athleteData.weight) || 0;
    const totalW = isPullup ? (w + bw) : w;
    const r = parseInt(athleteData.reps, 10) || getDefaultReps(weekCfg);
    if (!totalW) return 0;
    const totalReps = weekCfg.targetReps === 'AMRAP' ? r : weekCfg.sets * r;
    return totalW * totalReps;
  };

  const data = dataByMonth[currentMonth - 1] || [];

  const totalVolumeA = data.reduce((a, r, i) => a + getVolume('anas', r.anas, WEEK_CONFIGS[i]), 0);
  const totalVolumeF = data.reduce((a, r, i) => a + getVolume('flavio', r.flavio, WEEK_CONFIGS[i]), 0);

  const str = ACCENT.strength;

  const tmPlaceholder = (athlete) => {
    const prevAmrap = dataByMonth[currentMonth - 2]?.[2];
    if (!prevAmrap) return 'TM';
    const isPullup = exercise_id === 'pu_str';
    const bw = BODYWEIGHTS[athlete];
    const w = parseFloat(prevAmrap[athlete].weight) || 0;
    const totalW = isPullup ? (w + bw) : w;
    const rmTotal = calc1RM(totalW, prevAmrap[athlete].reps || getDefaultReps(WEEK_CONFIGS[2]));
    if (rmTotal == null) return 'TM';
    const displayRM = isPullup ? (rmTotal - bw) : rmTotal;
    return roundToHalf(displayRM);
  };

  const tmControls = (
    <div className="flex items-center gap-4 shrink-0" onClick={e => e.stopPropagation()}>
      {currentMonth === 1 ? (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-blue-500 uppercase">A</span>
            <CompactInput type="number" step="0.5" value={tmAnas} onChange={v => setTmAnasWithSync(v)} className="w-12" placeholder="TM" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-500 uppercase">F</span>
            <CompactInput type="number" step="0.5" value={tmFlavio} onChange={v => setTmFlavioWithSync(v)} className="w-12" placeholder="TM" />
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-blue-500 uppercase">A</span>
            <CompactInput type="number" step="0.5" value={tmByMonth[currentMonth - 2]?.anas || ''}
              onChange={v => updateTmForMonth(currentMonth - 1, 'anas', v)} className="w-12" placeholder={tmPlaceholder('anas')} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-emerald-500 uppercase">F</span>
            <CompactInput type="number" step="0.5" value={tmByMonth[currentMonth - 2]?.flavio || ''}
              onChange={v => updateTmForMonth(currentMonth - 1, 'flavio', v)} className="w-12" placeholder={tmPlaceholder('flavio')} />
          </div>
        </>
      )}
    </div>
  );

  const inner = (
    <>
      <TrainingBlockHeader
        accent="strength"
        title={exercise_name}
        subtitle={`Mese ${currentMonth}`}
        right={tmControls}
      />
      <div className="px-3 py-1.5 border-b border-zinc-200/60 dark:border-zinc-800/80">
        <PeriodPills accent="strength" count={6} current={currentMonth} onChange={setCurrentMonth} label={m => `M${m}`} className="w-full" />
      </div>

      <div className="p-3">
        <div className={TABLE.inner}>
          <TrainingTable>
            <TrainingThead>
              <tr className={TABLE.theadRow}>
                <TrainingTh center className="w-6">W</TrainingTh>
                <TrainingTh center className="w-12">SCH</TrainingTh>
                <TrainingTh center className="w-8">%</TrainingTh>
                <TrainingTh center className="text-blue-500">Anas KG</TrainingTh>
                <TrainingTh center className="text-blue-500">Anas 1RM</TrainingTh>
                <TrainingTh center className="w-8">✓</TrainingTh>
                <TrainingTh center className="text-emerald-500">Flavio KG</TrainingTh>
                <TrainingTh center className="text-emerald-500">Flavio 1RM</TrainingTh>
                <TrainingTh center className="w-8">✓</TrainingTh>
              </tr>
            </TrainingThead>
            <tbody className={TABLE.tbody}>
              {data.map((r, idx) => {
                const cfg = WEEK_CONFIGS[idx];
                const isAmrap = cfg.targetReps === 'AMRAP';
                const defaultReps = getDefaultReps(cfg);
                const isPullup = exercise_id === 'pu_str';

                const getDisplayRM = (athlete, weight, reps) => {
                  const bw = BODYWEIGHTS[athlete];
                  const w = parseFloat(weight) || 0;
                  const totalW = isPullup ? (w + bw) : w;
                  const rmTotal = calc1RM(totalW, reps || defaultReps);
                  if (rmTotal == null) return '-';
                  const displayRM = isPullup ? (rmTotal - bw) : rmTotal;
                  return roundToHalf(displayRM);
                };

                const rmA = getDisplayRM('anas', r.anas.weight, r.anas.reps);
                const rmF = getDisplayRM('flavio', r.flavio.weight, r.flavio.reps);

                return (
                  <motion.tr
                    key={idx}
                    initial={false}
                    className={cn(TABLE.tr, str.rowHover, 'border-t border-zinc-100/80 dark:border-zinc-800/50')}
                  >
                    <td className="py-1.5 px-1 text-center">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{r.week}</span>
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-bold ${isAmrap
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700'
                        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600'
                        }`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      <span className="text-xs text-gray-500">{cfg.intensity}</span>
                    </td>

                    {/* Anas kg */}
                    <td className="py-1.5 px-1 text-center">
                      <CompactInput
                        type="number"
                        step="0.5"
                        value={r.anas.weight}
                        onChange={v => updateAthlete(currentMonth - 1, idx, 'anas', 'weight', v)}
                        className="w-10"
                      />
                    </td>

                    {/* Anas r / 1RM */}
                    <td className="py-1.5 px-1 text-center">
                      {isAmrap ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <input
                            type="number"
                            value={r.anas.reps}
                            onChange={e => updateAthlete(currentMonth - 1, idx, 'anas', 'reps', e.target.value)}
                            className={`w-10 border rounded text-center text-xs py-1 font-semibold transition-all mx-auto block ${r.anas.reps
                              ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600'
                              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                              }`}
                            placeholder="r"
                          />
                          {r.anas.reps && rmA !== '-' && (
                            <span className="text-xs scale-90 font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 rounded">
                              {rmA}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={`inline-block w-10 py-1 rounded text-xs font-bold ${rmA !== '-'
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
                        <ModernCheckbox
                          checked={r.anas.completed}
                          colorClass="accent-blue-500"
                          onChange={() => {
                            toggleComplete(currentMonth - 1, idx, 'anas');
                            if (!r.anas.completed) import('canvas-confetti').then(m => m.default({ particleCount: 40, spread: 60, origin: { y: 0.8 } }));
                          }}
                        />
                        {r.anas.completed && (
                          <input
                            type="number"
                            min="1" max="10"
                            placeholder="RPE"
                            value={r.anas.rpe || ''}
                            onChange={e => updateAthlete(currentMonth - 1, idx, 'anas', 'rpe', e.target.value)}
                            className="w-8 text-xs scale-90 text-center bg-gray-100 dark:bg-zinc-800 rounded outline-none text-gray-500 font-medium"
                          />
                        )}
                      </div>
                    </td>

                    {/* Flavio kg */}
                    <td className="py-1.5 px-1 text-center border-l border-gray-100 dark:border-zinc-700/50">
                      <CompactInput
                        type="number"
                        step="0.5"
                        value={r.flavio.weight}
                        onChange={v => updateAthlete(currentMonth - 1, idx, 'flavio', 'weight', v)}
                        className="w-10"
                      />
                    </td>

                    {/* Flavio r / 1RM */}
                    <td className="py-1.5 px-1 text-center">
                      {isAmrap ? (
                        <div className="flex flex-col items-center gap-0.5">
                          <input
                            type="number"
                            value={r.flavio.reps}
                            onChange={e => updateAthlete(currentMonth - 1, idx, 'flavio', 'reps', e.target.value)}
                            className={`w-10 border rounded text-center text-xs py-1 font-semibold transition-all mx-auto block ${r.flavio.reps
                              ? 'bg-amber-100 dark:bg-amber-900/60 border-amber-400 dark:border-amber-600'
                              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                              }`}
                            placeholder="r"
                          />
                          {r.flavio.reps && rmF !== '-' && (
                            <span className="text-xs scale-90 font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 rounded">
                              {rmF}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className={`inline-block w-10 py-1 rounded text-xs font-bold ${rmF !== '-'
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
                        <ModernCheckbox
                          checked={r.flavio.completed}
                          colorClass="accent-emerald-500"
                          onChange={() => {
                            toggleComplete(currentMonth - 1, idx, 'flavio');
                            if (!r.flavio.completed) import('canvas-confetti').then(m => m.default({ particleCount: 40, spread: 60, origin: { y: 0.8 }, colors: ['#10b981', '#34d399'] }));
                          }}
                        />
                        {r.flavio.completed && (
                          <input
                            type="number"
                            min="1" max="10"
                            placeholder="RPE"
                            value={r.flavio.rpe || ''}
                            onChange={e => updateAthlete(currentMonth - 1, idx, 'flavio', 'rpe', e.target.value)}
                            className="w-8 text-xs scale-90 text-center bg-gray-100 dark:bg-zinc-800 rounded outline-none text-gray-500 font-medium"
                          />
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </TrainingTable>
        </div>
      </div>

      <div className={cn('px-3 py-2 border-t', str.headerBg)}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Volume M{currentMonth}
          </span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                A: {totalVolumeA.toFixed(0)} kg
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                F: {totalVolumeF.toFixed(0)} kg
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  if (embedded) return <div className="min-w-0">{inner}</div>;
  return <TrainingCard accent="strength">{inner}</TrainingCard>;
}
