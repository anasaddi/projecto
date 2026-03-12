import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { Card, ModernInput, ModernCheckbox } from './TrainingUI';

// Reference weights — same for all 5 weeks (user fills progression themselves)
const ISO_CONFIG = {
  // Light (2×15s)
  aw_iso_light_rising:    { label: 'Rising + back',     weight: 12, target: '2×15s', isHeavy: false },
  aw_iso_light_cup:       { label: 'Cup + drag',        weight: 18, target: '2×15s', isHeavy: false },
  aw_iso_light_pronation: { label: 'Pronation 45°',     weight: 15, target: '2×15s', isHeavy: false },
  aw_iso_light_side:      { label: 'Side + supination', weight: 9,  target: '2×15s', isHeavy: false },
  aw_iso_light_dita:      { label: 'Mazurenko dita',    weight: 15, target: '2×15s', isHeavy: false },
  aw_iso_light_press:     { label: 'Press',             weight: 15, target: '2×15s', isHeavy: false },
  aw_iso_light_bicipite:  { label: 'Bicipite',          weight: 18, target: '2×15s', isHeavy: false },
  // Heavy (2×5s)
  aw_iso_heavy_rising:    { label: 'Rising + back',     weight: 17, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_cup:       { label: 'Cup + drag',        weight: 23, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_pronation: { label: 'Pronation 45°',     weight: 20, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_side:      { label: 'Side + supination', weight: 13, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_dita:      { label: 'Mazurenko dita',    weight: 20, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_press:     { label: 'Press',             weight: 19, target: '2×5s',  isHeavy: true },
  aw_iso_heavy_bicipite:  { label: 'Bicipite',          weight: 23, target: '2×5s',  isHeavy: true },
};

// Ordered exercise names — used when template has generic names like "Isometria Leggera"
const ISO_LIGHT_LABELS = ['Rising + back', 'Cup + drag', 'Pronation 45°', 'Side + supination', 'Mazurenko dita', 'Press', 'Bicipite'];
const ISO_HEAVY_LABELS = ['Rising + back', 'Cup + drag', 'Pronation 45°', 'Side + supination', 'Mazurenko dita', 'Press', 'Bicipite'];

const ISO_LIGHT_KEYS = ['aw_iso_light_rising', 'aw_iso_light_cup', 'aw_iso_light_pronation', 'aw_iso_light_side', 'aw_iso_light_dita', 'aw_iso_light_press', 'aw_iso_light_bicipite'];
const ISO_HEAVY_KEYS = ['aw_iso_heavy_rising', 'aw_iso_heavy_cup', 'aw_iso_heavy_pronation', 'aw_iso_heavy_side', 'aw_iso_heavy_dita', 'aw_iso_heavy_press', 'aw_iso_heavy_bicipite'];

const findCfgByName = (name, isHeavy) => {
  const lower = (name || '').toLowerCase();
  const labels = isHeavy ? ISO_HEAVY_LABELS : ISO_LIGHT_LABELS;
  const idx = labels.findIndex(l => l.toLowerCase() === lower);
  if (idx >= 0) {
    const key = Object.keys(ISO_CONFIG).find(k => ISO_CONFIG[k].label === labels[idx] && ISO_CONFIG[k].isHeavy === isHeavy);
    return key ? ISO_CONFIG[key] : null;
  }
  const entry = Object.entries(ISO_CONFIG).find(([, v]) =>
    v.isHeavy === isHeavy && (v.label.toLowerCase().includes(lower) || lower.includes(v.label.toLowerCase()))
  );
  return entry ? entry[1] : null;
};

const getCfg = (exercise_id, exercise_name, isHeavy, index) => {
  const byId = ISO_CONFIG[exercise_id];
  if (byId) return byId;
  const byName = findCfgByName(exercise_name, isHeavy);
  if (byName) return byName;
  const labels = isHeavy ? ISO_HEAVY_LABELS : ISO_LIGHT_LABELS;
  const weights = isHeavy ? [17, 23, 20, 13, 20, 19, 23] : [12, 18, 15, 9, 15, 15, 18];
  const label = labels[index % labels.length];
  const weight = weights[index % weights.length];
  return { label, weight, target: isHeavy ? '2×5s' : '2×15s', isHeavy };
};

function IsoInputCell({ exerciseId, week, set, athlete, defaultWeight, defaultSecs, initialData, colorClass }) {
  const key = `w${week}_s${set}`;
  const saved = initialData?.[key]?.[athlete];

  const [weight, setWeight] = useState(saved?.weight ?? String(defaultWeight ?? ''));
  const [secs,   setSecs]   = useState(saved?.secs   ?? String(defaultSecs ?? ''));
  const [done,   setDone]   = useState(saved?.completed ?? false);
  const firstRender = useRef(true);

  useEffect(() => {
    const s = initialData?.[key]?.[athlete];
    setWeight(s?.weight ?? String(defaultWeight ?? ''));
    setSecs(s?.secs ?? String(defaultSecs ?? ''));
    setDone(s?.completed ?? false);
  }, [week, set, exerciseId]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const t = setTimeout(() => {
      const current = initialData || {};
      const slot = current[key] || {};
      api.training.updateProgression(exerciseId, {
        ...current,
        [key]: { ...slot, [athlete]: { weight, secs, completed: done } },
      });
    }, 800);
    return () => clearTimeout(t);
  }, [weight, secs, done]);

  return (
    <>
      <ModernInput type="text" value={weight} onChange={v => setWeight(v)} className="w-12 py-1 text-[10px]" placeholder="kg" />
      <ModernInput type="text" value={secs}   onChange={v => setSecs(v)}   className="w-10 py-1 text-[10px]"  placeholder="sec" />
      <div className="flex items-center justify-center w-8">
        <ModernCheckbox checked={done} onChange={() => setDone(p => !p)} colorClass={colorClass} />
      </div>
    </>
  );
}

const AWIsoTableGroup = ({ title, exercises, onRowsChange, programData, progressions, initialWeek, resetTrigger }) => {
  const [currentWeek, setCurrentWeek] = useState(initialWeek || 1);
  const [localData, setLocalData] = useState({});

  // Detect heavy from title/first exercise
  const isHeavy = title?.toLowerCase().includes('pesante') || title?.toLowerCase().includes('heavy')
    || (exercises[0]?.exercise_id || '').includes('heavy');

  useEffect(() => {
    if (initialWeek) setCurrentWeek(initialWeek);
  }, [initialWeek, resetTrigger]);

  if (!exercises?.length || !programData) return null;

  // Use constant exercise list if the template only provides one generic exercise entry
  const displayExercises = exercises.length === 1 && (exercises[0].exercise_name.toLowerCase().includes('isometria') || exercises[0].exercise_id.includes('iso'))
    ? (isHeavy ? ISO_HEAVY_KEYS.map((id, i) => ({ exercise_id: id, exercise_name: ISO_HEAVY_LABELS[i] })) 
               : ISO_LIGHT_KEYS.map((id, i) => ({ exercise_id: id, exercise_name: ISO_LIGHT_LABELS[i] })))
    : exercises;

  const handleUpdate = (key, data) =>
    setLocalData(prev => ({ ...prev, [key]: data }));

  return (
    <Card className="border-amber-100 dark:border-amber-900/30">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-amber-500 rounded-full" />
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">{title}</h3>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">
                {isHeavy ? '85% 1RM · 2×5s' : '60% 1RM · 2×15s'} · Settimana {currentWeek}
              </span>
            </div>
          </div>
        </div>

        {/* Week selector */}
        <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-xl">
          {[1, 2, 3, 4, 5].map(w => (
            <button
              key={w}
              onClick={() => setCurrentWeek(w)}
              className={`flex-1 h-7 rounded-lg text-xs font-bold transition-all ${
                currentWeek === w
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Reference grid — all 5 weeks (same weight, just reminder) */}
      <div className="overflow-x-auto custom-scrollbar border-b border-gray-100 dark:border-zinc-800/60">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
            <tr className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-2 text-center w-14">Peso</th>
              {[1, 2, 3, 4, 5].map(w => (
                <th key={w} className={`py-2 px-2 text-center w-12 ${currentWeek === w ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                  W{w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
            {displayExercises.map((ex, i) => {
              const cfg = getCfg(ex.exercise_id, ex.exercise_name, isHeavy, i);
              const target = cfg.target.split('×')[1] || cfg.target; // "15s" or "5s"
              return (
                <tr key={ex.exercise_id} className="hover:bg-amber-50/10 dark:hover:bg-amber-900/5 text-[10px]">
                  <td className="py-2 px-3 font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-[9px]">
                    {cfg.label}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400 text-[9px]">
                    {cfg.weight}kg
                  </td>
                  {[1, 2, 3, 4, 5].map(w => (
                    <td key={w} className={`py-2 px-2 text-center text-[9px] font-semibold ${
                      currentWeek === w
                        ? 'text-amber-700 dark:text-amber-300 font-black bg-amber-50/60 dark:bg-amber-900/20'
                        : 'text-gray-400'
                    }`}>
                      {target}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Input section — current week */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/60 dark:bg-zinc-800/40">
            <tr className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-1 w-8 text-center" />
              <th className="py-2 px-2 text-center">
                <div className="flex justify-center items-center py-1 px-3 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
                  <span className="text-blue-600 dark:text-blue-400">ANAS (kg/s)</span>
                </div>
              </th>
              <th className="py-2 px-2 text-center">
                <div className="flex justify-center items-center py-1 px-3 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-600 dark:text-emerald-400">FLAVIO (kg/s)</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/20">
            {displayExercises.flatMap((ex, exIdx) => {
              const cfg = getCfg(ex.exercise_id, ex.exercise_name, isHeavy, exIdx);
              const sets = parseInt(cfg.target.split('×')[0]) || 2;
              const defaultSecs = cfg.target.split('×')[1]?.replace('s', '') || '';

              return Array.from({ length: sets }).map((_, s) => (
                <tr key={`${ex.exercise_id}-${s}`} className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-[10px]">
                  {s === 0 && (
                    <td rowSpan={sets} className="py-2 px-3 border-r border-gray-100 dark:border-zinc-800/50 align-middle font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-[9px] text-center">
                      {cfg.label}
                    </td>
                  )}
                  <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
                    <span className="text-[10px] font-black text-gray-400">{s + 1}</span>
                  </td>
                  <td className="py-1.5 px-2 border-r border-gray-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-1.5 justify-center">
                      <IsoInputCell
                        exerciseId={ex.exercise_id}
                        week={currentWeek}
                        set={s + 1}
                        athlete="anas"
                        defaultWeight={cfg.weight}
                        defaultSecs={defaultSecs}
                        initialData={progressions[ex.exercise_id]}
                        colorClass="accent-blue-500"
                      />
                    </div>
                  </td>
                  <td className="py-1.5 px-2">
                    <div className="flex items-center gap-1.5 justify-center">
                      <IsoInputCell
                        exerciseId={ex.exercise_id}
                        week={currentWeek}
                        set={s + 1}
                        athlete="flavio"
                        defaultWeight={cfg.weight}
                        defaultSecs={defaultSecs}
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

export default AWIsoTableGroup;
