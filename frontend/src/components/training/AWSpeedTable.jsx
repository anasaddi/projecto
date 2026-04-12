import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { Card, ModernInput, ModernCheckbox } from './TrainingUI';

const SPEED_CONFIG = [
  { id: 'lat_cup',      label: 'LAT + CUP',        weight: 10 },
  { id: 'pronation_45', label: 'PRONATION 45°',    weight: 10 },
  { id: 'low_multi',    label: 'LOW MULTI SIDE',   weight: 10 },
  { id: 'high_multi',   label: 'HIGH MULTI SIDE',  weight: 10 },
];

function SpeedRow({ baseExerciseId, cfg, progressions }) {
  const key = `${baseExerciseId}_${cfg.id}`;
  const stored = progressions?.[baseExerciseId]?.[cfg.id] || progressions?.[key];
  const [anasW, setAnasW]   = useState(stored?.anas?.weight ?? String(cfg.weight));
  const [flavioW, setFlavioW] = useState(stored?.flavio?.weight ?? String(cfg.weight));
  const [anasDone, setAnasDone]   = useState(stored?.anas?.completed ?? false);
  const [flavioDone, setFlavioDone] = useState(stored?.flavio?.completed ?? false);
  const firstRender = useRef(true);

  useEffect(() => {
    const s = progressions?.[baseExerciseId]?.[cfg.id] || progressions?.[key];
    setAnasW(s?.anas?.weight ?? String(cfg.weight));
    setFlavioW(s?.flavio?.weight ?? String(cfg.weight));
    setAnasDone(s?.anas?.completed ?? false);
    setFlavioDone(s?.flavio?.completed ?? false);
  }, [baseExerciseId, progressions]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const t = setTimeout(() => {
      const current = progressions?.[baseExerciseId] || {};
      api.training.updateProgression(baseExerciseId, {
        ...current,
        [cfg.id]: { anas: { weight: anasW, reps: '6', completed: anasDone }, flavio: { weight: flavioW, reps: '6', completed: flavioDone } },
      });
    }, 800);
    return () => clearTimeout(t);
  }, [anasW, flavioW, anasDone, flavioDone]);

  return (
    <tr className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-xs">
      <td className="py-2 px-3 font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-xs text-center">
        {cfg.label}
      </td>
      <td className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400 text-xs">
        {cfg.weight}kg
      </td>
      <td className="py-1.5 px-2 border-r border-gray-100 dark:border-zinc-800/50">
        <div className="flex items-center gap-0.5 justify-center">
          <ModernInput type="text" value={anasW} onChange={v => setAnasW(v)} className="w-10 py-1 text-xs" placeholder="kg" />
          <ModernCheckbox checked={anasDone} onChange={() => setAnasDone(p => !p)} colorClass="accent-blue-500" />
        </div>
      </td>
      <td className="py-1.5 px-2">
        <div className="flex items-center gap-0.5 justify-center">
          <ModernInput type="text" value={flavioW} onChange={v => setFlavioW(v)} className="w-10 py-1 text-xs" placeholder="kg" />
          <ModernCheckbox checked={flavioDone} onChange={() => setFlavioDone(p => !p)} colorClass="accent-emerald-500" />
        </div>
      </td>
    </tr>
  );
}

const AWSpeedTable = ({ exercises, progressions }) => {
  if (!exercises?.length) return null;
  const baseId = exercises[0]?.exercise_id || 'aw_speed';

  return (
    <Card className="border-amber-100 dark:border-amber-900/30">
      <div className="px-4 py-3 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex flex-col items-center justify-center gap-1">
          <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest text-center">Speed</h3>
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded text-center">
            50% 1RM + BANDS · 6×6
          </span>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
            <tr className="text-xs font-bold uppercase tracking-tighter text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-2 text-center w-14">Peso</th>
              <th className="py-2 px-2 text-center text-blue-500">Anas (kg)</th>
              <th className="py-2 px-2 text-center text-emerald-500">Flavio (kg)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
            {SPEED_CONFIG.map(cfg => (
              <SpeedRow
                key={cfg.id}
                baseExerciseId={baseId}
                cfg={cfg}
                progressions={progressions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default AWSpeedTable;
