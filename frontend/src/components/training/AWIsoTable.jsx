import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Card, ModernInput, ModernCheckbox } from './TrainingUI';

const AW_ISO_CONFIG = {
  'Rising + back': { weight: 12, target: '2x15s', prefix: 'aw_iso_light' },
  'Cup + drag': { weight: 18, target: '2x15s', prefix: 'aw_iso_light' },
  'Pronation 45°': { weight: 15, target: '2x15s', prefix: 'aw_iso_light' },
  'Side + supination': { weight: 9, target: '2x15s', prefix: 'aw_iso_light' },
  'Mazurenko dita': { weight: 15, target: '2x15s', prefix: 'aw_iso_light' },
  'Press': { weight: 15, target: '2x15s', prefix: 'aw_iso_light' },
  'Bicipite': { weight: 18, target: '2x15s', prefix: 'aw_iso_light' },
  'Rising + back_heavy': { weight: 17, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Cup + drag_heavy': { weight: 23, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Pronation 45°_heavy': { weight: 20, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Side + supination_heavy': { weight: 13, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Mazurenko dita_heavy': { weight: 20, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Press_heavy': { weight: 19, target: '2x5s', prefix: 'aw_iso_heavy' },
  'Bicipite_heavy': { weight: 23, target: '2x5s', prefix: 'aw_iso_heavy' },
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

const AWIsoRow = ({ exercise, set, onRowsChange, isFirst, totalSets, progEx, currentWeek, initialData }) => {
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
    if (initialData?.[`s${set}`]) return initialData[`s${set}`];
    const defaultTime = targetStr.includes('x') ? targetStr.split('x')[1].replace('s', '') : '';
    const initialWeight = progEx ? (progEx[`w${currentWeek}`] || '') : (cfg.weight || '');
    return {
      anas: { weight: String(initialWeight), reps: defaultTime, completed: false },
      flavio: { weight: String(initialWeight), reps: defaultTime, completed: false }
    };
  });

  useEffect(() => {
    if (!initialData) return;
    const timeout = setTimeout(() => {
      api.training.updateProgression(exercise_id, {
        ...initialData,
        [`s${set}`]: data
      });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [data, exercise_id, set]);

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
          <ModernInput type="number" step="0.5" value={data.anas.weight} onChange={e => update('anas', 'weight', e.target.value)} className="w-10 py-1 text-[9px]" />
          <ModernInput type="number" value={data.anas.reps} onChange={e => update('anas', 'reps', e.target.value)} className="w-8 py-1 text-[9px]" placeholder="s" />
          <ModernCheckbox checked={data.anas.completed} onChange={() => toggle('anas')} colorClass="accent-blue-500" />
        </div>
      </td>
      <td className="py-2 px-1">
        <div className="flex items-center gap-0.5 justify-center">
          <ModernInput type="number" step="0.5" value={data.flavio.weight} onChange={e => update('flavio', 'weight', e.target.value)} className="w-10 py-1 text-[9px]" />
          <ModernInput type="number" value={data.flavio.reps} onChange={e => update('flavio', 'reps', e.target.value)} className="w-8 py-1 text-[9px]" placeholder="s" />
          <ModernCheckbox checked={data.flavio.completed} onChange={() => toggle('flavio')} colorClass="accent-emerald-500" />
        </div>
      </td>
    </tr>
  );
};

const AWIsoTableGroup = ({ title, exercises, onRowsChange, programData, progressions, initialWeek, resetTrigger }) => {
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
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-left border-collapse table-fixed relative">
            <thead className="sticky top-0 z-10 bg-gray-50/95 dark:bg-zinc-800/95 backdrop-blur-sm shadow-sm">
              <tr className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter border-b border-gray-100 dark:border-zinc-800">
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

export default AWIsoTableGroup;
