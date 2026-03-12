import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { Card, ModernInput, ModernCheckbox } from './TrainingUI';

const AW_STD = ['2×10', '3×8', '4×8', '5×7', '6×7'];
const AW_ALT = ['2×8', '2×10', '2×12', '3×10', '3×12'];

const AW_VOL_CONFIG = {
  aw_v1_dita:         { label: 'Dita',              weight: '12',  pattern: 'std' },
  aw_v1_back_press:   { label: 'Back Pressure',     weight: '15',  pattern: 'std' },
  aw_v1_wrist_wrench: { label: 'Wrist Wrench',      weight: '10',  pattern: 'alt' },
  aw_v1_side_press:   { label: 'Side Pressure',     weight: '12',  pattern: 'std' },
  aw_v1_ulnar_chop:   { label: 'Ulnar Chop',        weight: '5-8', pattern: 'std' },
  aw_v2_pronazione:   { label: 'Pronazione',        weight: '10',  pattern: 'std' },
  aw_v2_cupping:      { label: 'Cupping Fat Grip',  weight: '15',  pattern: 'alt' },
  aw_v2_supination:   { label: 'Supination',        weight: '10',  pattern: 'std' },
  aw_v2_rising:       { label: 'Rising',            weight: '10',  pattern: 'std' },
  aw_v2_rev_pron:     { label: 'Reverse Pronation', weight: '5',   pattern: 'std' },
};

function VolumeInputRow({ exerciseId, week, set, totalSets, targetStr, isFirst, initialData }) {
  const key = `w${week}_s${set}`;
  const defaultReps = targetStr.includes('×') ? targetStr.split('×')[1] : '';
  const cfg = AW_VOL_CONFIG[exerciseId] || { weight: '' };

  const [data, setData] = useState(() => {
    if (initialData?.[key]) return initialData[key];
    return {
      anas:   { weight: cfg.weight, reps: defaultReps, completed: false },
      flavio: { weight: cfg.weight, reps: defaultReps, completed: false },
    };
  });
  const firstRender = useRef(true);

  useEffect(() => {
    if (!initialData?.[key]) {
      setData({
        anas:   { weight: cfg.weight, reps: defaultReps, completed: false },
        flavio: { weight: cfg.weight, reps: defaultReps, completed: false },
      });
    } else {
      setData(initialData[key]);
    }
  }, [week, set, exerciseId]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const t = setTimeout(() => {
      api.training.updateProgression(exerciseId, { ...initialData, [key]: data });
    }, 800);
    return () => clearTimeout(t);
  }, [data]);

  const upd = (athlete, field, val) =>
    setData(prev => ({ ...prev, [athlete]: { ...prev[athlete], [field]: val } }));
  const tog = (athlete) =>
    setData(prev => ({ ...prev, [athlete]: { ...prev[athlete], completed: !prev[athlete].completed } }));

  return (
    <tr className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-[10px]">
      {isFirst && (
        <td rowSpan={totalSets} className="py-2 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50 align-middle">
          <span className="text-[9px] font-black text-gray-400">{set > 1 ? '' : 'Set'}</span>
        </td>
      )}
      <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
        <span className="text-[10px] font-black text-gray-400">{set}</span>
      </td>
      {/* Anas */}
      <td className="py-1.5 px-2 border-r border-gray-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-0.5 justify-center">
          <ModernInput type="text" value={data.anas.weight} onChange={v => upd('anas', 'weight', v)} className="w-10 py-1 text-[9px]" placeholder="kg" />
          <ModernInput type="text" value={data.anas.reps}   onChange={v => upd('anas', 'reps', v)}   className="w-8 py-1 text-[9px]" placeholder="r" />
          <ModernCheckbox checked={data.anas.completed} onChange={() => tog('anas')} colorClass="accent-blue-500" />
        </div>
      </td>
      {/* Flavio */}
      <td className="py-1.5 px-2">
        <div className="flex items-center gap-0.5 justify-center">
          <ModernInput type="text" value={data.flavio.weight} onChange={v => upd('flavio', 'weight', v)} className="w-10 py-1 text-[9px]" placeholder="kg" />
          <ModernInput type="text" value={data.flavio.reps}   onChange={v => upd('flavio', 'reps', v)}   className="w-8 py-1 text-[9px]" placeholder="r" />
          <ModernCheckbox checked={data.flavio.completed} onChange={() => tog('flavio')} colorClass="accent-emerald-500" />
        </div>
      </td>
    </tr>
  );
}

const AWVolumeTableGroup = ({ title, exercises, onRowsChange, progressions, initialWeek, resetTrigger }) => {
  const [currentWeek, setCurrentWeek] = useState(initialWeek || 1);

  useEffect(() => {
    if (initialWeek) setCurrentWeek(initialWeek);
  }, [initialWeek, resetTrigger]);

  return (
    <Card className="border-amber-100 dark:border-amber-900/30">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
          <div>
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">{title}</h3>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">
              Settimana {currentWeek}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-xl">
          {[1, 2, 3, 4, 5].map(w => (
            <button
              key={w}
              onClick={() => setCurrentWeek(w)}
              className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                currentWeek === w
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Reference grid — all 5 weeks */}
      <div className="overflow-x-auto custom-scrollbar border-b border-gray-100 dark:border-zinc-800/60">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
            <tr className="text-[9px] font-bold uppercase tracking-tighter text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-2 text-center w-14">Peso</th>
              {[1, 2, 3, 4, 5].map(w => (
                <th key={w} className={`py-2 px-2 text-center w-14 ${currentWeek === w ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                  W{w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
            {exercises.map(ex => {
              const cfg = AW_VOL_CONFIG[ex.exercise_id] || { label: ex.exercise_name, weight: '—', pattern: 'std' };
              const targets = cfg.pattern === 'alt' ? AW_ALT : AW_STD;
              return (
                <tr key={ex.exercise_id} className="hover:bg-amber-50/10 dark:hover:bg-amber-900/5 text-[10px]">
                  <td className="py-2 px-3 font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-[9px] text-center">
                    {cfg.label}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400 text-[9px]">
                    {cfg.weight}kg
                  </td>
                  {targets.map((t, i) => (
                    <td key={i} className={`py-2 px-2 text-center text-[9px] font-semibold ${
                      currentWeek === i + 1
                        ? 'text-amber-700 dark:text-amber-300 font-black bg-amber-50/60 dark:bg-amber-900/20'
                        : 'text-gray-400'
                    }`}>
                      {t}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Input section — current week only */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/60 dark:bg-zinc-800/40">
            <tr className="text-[9px] font-bold uppercase tracking-tighter text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-1 w-8 text-center" />
              <th className="py-2 px-1 w-8 text-center" />
              <th className="py-2 px-2 text-center text-blue-500">Anas (kg/r)</th>
              <th className="py-2 px-2 text-center text-emerald-500">Flavio (kg/r)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/20">
            {exercises.flatMap(ex => {
              const cfg = AW_VOL_CONFIG[ex.exercise_id] || { label: ex.exercise_name, pattern: 'std' };
              const targets = cfg.pattern === 'alt' ? AW_ALT : AW_STD;
              const targetStr = targets[currentWeek - 1] || '2×10';
              const sets = parseInt(targetStr.split('×')[0]) || 1;

              return Array.from({ length: sets }).map((_, s) => (
                <tr key={`${ex.exercise_id}-${s}`} className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-[10px]">
                  {s === 0 && (
                    <td rowSpan={sets} className="py-2 px-3 border-r border-gray-100 dark:border-zinc-800/50 align-middle font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-[9px] text-center">
                      {cfg.label}
                    </td>
                  )}
                  <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50 w-14">
                    {s === 0 && (
                      <span className="text-[8px] font-black px-1 py-0.5 rounded bg-amber-100/60 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                        {targetStr}
                      </span>
                    )}
                  </td>
                  <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
                    <span className="text-[10px] font-black text-gray-400">{s + 1}</span>
                  </td>
                  <td className="py-1.5 px-2 border-r border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-0.5 justify-center">
                      <VolumeInputCell
                        exerciseId={ex.exercise_id}
                        week={currentWeek}
                        set={s + 1}
                        athlete="anas"
                        targetStr={targetStr}
                        defaultWeight={cfg.weight}
                        initialData={progressions[ex.exercise_id]}
                        colorClass="accent-blue-500"
                      />
                    </div>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-0.5 justify-center">
                      <VolumeInputCell
                        exerciseId={ex.exercise_id}
                        week={currentWeek}
                        set={s + 1}
                        athlete="flavio"
                        targetStr={targetStr}
                        defaultWeight={cfg.weight}
                        initialData={progressions[ex.exercise_id]}
                        colorClass="accent-emerald-500"
                      />
                    </div>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

// Per-athlete per-cell state management
function VolumeInputCell({ exerciseId, week, set, athlete, targetStr, defaultWeight, initialData, colorClass }) {
  const key = `w${week}_s${set}`;
  const defaultReps = targetStr.includes('×') ? targetStr.split('×')[1] : '';
  const saved = initialData?.[key]?.[athlete];

  const [weight, setWeight] = useState(saved?.weight ?? defaultWeight ?? '');
  const [reps,   setReps]   = useState(saved?.reps   ?? defaultReps);
  const [done,   setDone]   = useState(saved?.completed ?? false);
  const firstRender = useRef(true);

  useEffect(() => {
    const s = initialData?.[key]?.[athlete];
    setWeight(s?.weight ?? defaultWeight ?? '');
    setReps(s?.reps ?? defaultReps);
    setDone(s?.completed ?? false);
  }, [week, set, exerciseId]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const t = setTimeout(() => {
      const current = initialData || {};
      const currentSlot = current[key] || {};
      api.training.updateProgression(exerciseId, {
        ...current,
        [key]: { ...currentSlot, [athlete]: { weight, reps, completed: done } },
      });
    }, 800);
    return () => clearTimeout(t);
  }, [weight, reps, done]);

  return (
    <>
      <ModernInput type="text" value={weight} onChange={v => setWeight(v)} className="w-10 py-1 text-[9px]" placeholder="kg" />
      <ModernInput type="text" value={reps}   onChange={v => setReps(v)}   className="w-8 py-1 text-[9px]"  placeholder="r" />
      <ModernCheckbox checked={done} onChange={() => setDone(p => !p)} colorClass={colorClass} />
    </>
  );
}

export default AWVolumeTableGroup;
