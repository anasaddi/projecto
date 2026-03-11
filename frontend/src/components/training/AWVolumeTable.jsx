import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Card, ModernInput, ModernCheckbox } from './TrainingUI';

const AW_STD = ['2x10', '3x8', '4x8', '5x7', '6x7'];
const AW_ALT = ['2x8', '2x10', '2x12', '3x10', '3x12'];
const AW_VOL_CONFIG = {
  aw_v1_dita: { weight: 12, pattern: 'std' },
  aw_v1_back_press: { weight: 15, pattern: 'std' },
  aw_v1_wrist_wrench: { weight: 10, pattern: 'alt' },
  aw_v1_side_press: { weight: 12, pattern: 'std' },
  aw_v1_ulnar_chop: { weight: 7, pattern: 'std' },
  aw_v2_pronazione: { weight: 10, pattern: 'std' },
  aw_v2_cupping: { weight: 15, pattern: 'alt' },
  aw_v2_supination: { weight: 10, pattern: 'std' },
  aw_v2_rising: { weight: 10, pattern: 'std' },
  aw_v2_rev_pron: { weight: 5, pattern: 'std' },
};

const AWVolumeRow = ({ exercise, week, set, onRowsChange, isFirst, totalSets, initialData }) => {
  const { exercise_id, exercise_name } = exercise;
  const cfg = AW_VOL_CONFIG[exercise_id] || { weight: 10, pattern: 'std' };
  const targets = cfg.pattern === 'alt' ? AW_ALT : AW_STD;
  const targetStr = targets[week - 1] || '—';

  const [data, setData] = useState(() => {
    if (initialData?.[`w${week}_s${set}`]) return initialData[`w${week}_s${set}`];
    const defaultReps = targetStr.includes('x') ? targetStr.split('x')[1] : '';
    return {
      anas: { weight: String(cfg.weight), reps: defaultReps, completed: false },
      flavio: { weight: String(cfg.weight), reps: defaultReps, completed: false }
    };
  });

  useEffect(() => {
    if (!initialData) return;
    const timeout = setTimeout(() => {
      api.training.updateProgression(exercise_id, {
        ...initialData,
        [`w${week}_s${set}`]: data
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [data, exercise_id, week, set]);

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
          <ModernInput type="number" step="0.5" value={data.anas.weight} onChange={e => update('anas', 'weight', e.target.value)} className="w-11 py-1 text-[10px]" />
          <ModernInput type="number" value={data.anas.reps} onChange={e => update('anas', 'reps', e.target.value)} className="w-9 py-1 text-[10px]" placeholder="r" />
          <ModernCheckbox checked={data.anas.completed} onChange={() => toggle('anas')} colorClass="accent-blue-500" />
        </div>
      </td>
      <td className="py-2 px-3">
        <div className="flex items-center gap-1 justify-center">
          <ModernInput type="number" step="0.5" value={data.flavio.weight} onChange={e => update('flavio', 'weight', e.target.value)} className="w-11 py-1 text-[10px]" />
          <ModernInput type="number" value={data.flavio.reps} onChange={e => update('flavio', 'reps', e.target.value)} className="w-9 py-1 text-[10px]" placeholder="r" />
          <ModernCheckbox checked={data.flavio.completed} onChange={() => toggle('flavio')} colorClass="accent-emerald-500" />
        </div>
      </td>
    </tr>
  );
};

const AWVolumeTableGroup = ({ title, exercises, onRowsChange, progressions, initialWeek, resetTrigger }) => {
  const [currentWeek, setCurrentWeek] = useState(initialWeek || 1);

  useEffect(() => {
    if (initialWeek) setCurrentWeek(initialWeek);
  }, [initialWeek, resetTrigger]);

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
                    initialData={progressions[ex.exercise_id]}
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

export default AWVolumeTableGroup;
