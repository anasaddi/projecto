import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import WeeklyCalendar from '../components/WeeklyCalendar';
import { Dumbbell, Swords, Target, ChevronRight, Undo2, Redo2, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

// Formula Epley per massimale stimato
const calc1RM = (weight, reps) => {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r) return '-';
  if (r === 1) return w.toFixed(1);
  // Formula Epley conservativa (divisore 35 invece di 30)
  return (w * (1 + r / 35)).toFixed(1);
};

// Tabella esercizio STRENGTH - collassata: 1 riga (settimana corrente), espansa: tutte
const StrengthTable = ({ exercise, onRowsChange }) => {
  const { exercise_id, exercise_name, instruction } = exercise;
  const [expanded, setExpanded] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);

  // Training Max condiviso
  const [trainingMax, setTrainingMax] = useState('');

  // Schema 4 settimane con AMRAP alla settimana 3
  const weekConfigs = [
    { week: 1, sets: 5, targetReps: 5, percent: 0.75, label: '5x5', desc: 'Volume' },
    { week: 2, sets: 4, targetReps: 4, percent: 0.80, label: '4x4', desc: 'Intensità' },
    { week: 3, sets: 1, targetReps: 'AMRAP', percent: 0.90, label: '1xAMRAP', desc: 'Test PR' },
    { week: 4, sets: 3, targetReps: 5, percent: 0.60, label: '3x5', desc: 'Deload' },
  ];

  // Dati per ogni settimana e atleta
  const [data, setData] = useState(
    weekConfigs.map(cfg => ({
      week: cfg.week,
      anas: { weight: '', reps: '', completed: false },
      flavio: { weight: '', reps: '', completed: false }
    }))
  );

  // Calcola peso target basato sul TM
  const getTargetWeight = (percent) => {
    if (!trainingMax) return null;
    return Math.round(parseFloat(trainingMax) * percent);
  };

  const updateAthlete = (weekIdx, athlete, field, value) => {
    setData(prev => prev.map((row, idx) =>
      idx === weekIdx
        ? { ...row, [athlete]: { ...row[athlete], [field]: value } }
        : row
    ));
  };

  const toggleComplete = (weekIdx, athlete) => {
    setData(prev => prev.map((row, idx) =>
      idx === weekIdx
        ? { ...row, [athlete]: { ...row[athlete], completed: !row[athlete].completed } }
        : row
    ));
  };

  // Calcola volume per atleta
  const getVolume = (athleteData, weekCfg) => {
    const w = parseFloat(athleteData.weight) || 0;
    const r = parseInt(athleteData.reps) || 0;
    if (!w || !r) return 0;
    // Per AMRAP usa le reps effettive, altrimenti usa targetReps per il calcolo
    const totalReps = weekCfg.targetReps === 'AMRAP' ? r : weekCfg.sets * r;
    return w * totalReps;
  };

  const row = data.find(r => r.week === currentWeek);
  const cfg = weekConfigs[currentWeek - 1];
  const targetWeight = getTargetWeight(cfg?.percent);

  return (
    <div className="rounded-xl border bg-blue-50/80 dark:bg-zinc-900/80 border-blue-200/70 dark:border-zinc-700/60 overflow-hidden">
      {/* Header cliccabile per espandere */}
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-3 py-2 flex items-center justify-between gap-2 cursor-pointer hover:bg-blue-50/60 dark:hover:bg-zinc-800/40 transition-colors select-none"
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100/90 dark:bg-blue-500/25 text-blue-700 dark:text-blue-300 shrink-0">STRENGTH</span>
          <h3 className="text-[12px] font-bold text-gray-900 dark:text-gray-100 truncate">{exercise_name}</h3>
          <input type="number" step="0.5" value={trainingMax} onChange={e => { e.stopPropagation(); setTrainingMax(e.target.value) }} placeholder="TM" className="w-12 px-1 py-0.5 text-xs font-bold text-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-600 rounded shrink-0" />
          {!expanded && row && (
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 shrink-0">
              W{currentWeek} {cfg?.label} {targetWeight ? `~${targetWeight}kg` : ''}
            </span>
          )}
        </div>
        <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }} className="flex items-center gap-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0">
          {expanded ? 'Nascondi' : 'Mostra storico'}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {!expanded && row ? (
        /* Vista compatta: 1 riga inline */
        <div className="px-3 py-2 border-t border-blue-100/50 dark:border-zinc-700/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400">Sett:</span>
            {[1, 2, 3, 4].map(w => (
              <button key={w} onClick={() => setCurrentWeek(w)} className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${currentWeek === w ? 'bg-blue-600 text-white dark:bg-blue-500' : 'bg-blue-100 dark:bg-zinc-700 text-blue-700 dark:text-zinc-300'}`}>W{w}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">Anas</span>
            <input type="number" step="0.5" value={row.anas.weight} onChange={e => updateAthlete(currentWeek - 1, 'anas', 'weight', e.target.value)} className="w-11 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-600 rounded" placeholder="kg" />
            <input type="number" value={row.anas.reps} onChange={e => updateAthlete(currentWeek - 1, 'anas', 'reps', e.target.value)} className="w-9 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-600 rounded" placeholder={cfg?.targetReps === 'AMRAP' ? '∞' : cfg?.targetReps} />
            <input type="checkbox" checked={row.anas.completed} onChange={() => toggleComplete(currentWeek - 1, 'anas')} className="w-3.5 h-3.5 rounded accent-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Flavio</span>
            <input type="number" step="0.5" value={row.flavio.weight} onChange={e => updateAthlete(currentWeek - 1, 'flavio', 'weight', e.target.value)} className="w-11 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-600 rounded" placeholder="kg" />
            <input type="number" value={row.flavio.reps} onChange={e => updateAthlete(currentWeek - 1, 'flavio', 'reps', e.target.value)} className="w-9 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-600 rounded" placeholder={cfg?.targetReps === 'AMRAP' ? '∞' : cfg?.targetReps} />
            <input type="checkbox" checked={row.flavio.completed} onChange={() => toggleComplete(currentWeek - 1, 'flavio')} className="w-3.5 h-3.5 rounded accent-emerald-500" />
          </div>
        </div>
      ) : (
        <div>
          {/* Vista espansa: tabella completa */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-blue-100 dark:border-zinc-700/50 bg-blue-50/40 dark:bg-zinc-800/60">
                  <th className="py-2 px-1 text-[9px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase text-center w-10">Sett</th>
                  <th className="py-2 px-1 text-[9px] font-bold text-blue-600/70 dark:text-blue-400/70 uppercase text-center">Target</th>
                  <th className="py-2 px-1 text-[9px] font-bold text-blue-600/70 dark:text-blue-400 uppercase text-center bg-blue-100/40 dark:bg-blue-500/15 dark:border-r dark:border-zinc-700/40" colSpan="3">Anas</th>
                  <th className="py-2 px-1 text-[9px] font-bold text-emerald-600/70 dark:text-emerald-400 uppercase text-center bg-emerald-100/40 dark:bg-emerald-500/15" colSpan="3">Flavio</th>
                </tr>
                <tr className="border-b border-blue-100/50 dark:border-zinc-700/40 bg-blue-50/30 dark:bg-zinc-800/40">
                  <th className="py-1 px-1"></th>
                  <th className="py-1 px-1"></th>
                  <th className="py-1 px-1 text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase">Peso</th>
                  <th className="py-1 px-1 text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase">Reps</th>
                  <th className="py-1 px-1 text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase">✓</th>
                  <th className="py-1 px-1 text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase">Peso</th>
                  <th className="py-1 px-1 text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase">Reps</th>
                  <th className="py-1 px-1 text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase">✓</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50/50 dark:divide-zinc-700/40">
                {data.map((row) => {
                  const idx = data.findIndex(r => r.week === row.week);
                  const cfg = weekConfigs[idx];
                  const targetWeight = getTargetWeight(cfg.percent);
                  const anasVol = getVolume(row.anas, cfg);
                  const flavioVol = getVolume(row.flavio, cfg);

                  return (
                    <tr key={row.week} className="hover:bg-blue-50/20 dark:hover:bg-zinc-800/50 transition-colors">
                      {/* Settimana */}
                      <td className="py-2 px-1 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400">W{row.week}</span>
                          <span className="text-[8px] text-gray-500 dark:text-gray-400">{cfg.desc}</span>
                        </div>
                      </td>

                      {/* Target */}
                      <td className="py-2 px-1 text-center">
                        <div className="flex flex-col items-center">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400">{cfg.label}</span>
                          {targetWeight && (
                            <span className="text-[9px] text-gray-500 dark:text-gray-400">~{targetWeight}kg</span>
                          )}
                        </div>
                      </td>

                      {/* Anas */}
                      <td className="py-2 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center">
                        <input
                          type="number"
                          step="0.5"
                          value={row.anas.weight}
                          onChange={(e) => updateAthlete(idx, 'anas', 'weight', e.target.value)}
                          className="w-12 px-1 py-0.5 text-xs font-bold text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border border-blue-200 dark:placeholder:text-zinc-500 rounded focus:ring-1 focus:ring-blue-500/30 dark:focus:ring-blue-400/20"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-2 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center">
                        <input
                          type="number"
                          value={row.anas.reps}
                          onChange={(e) => updateAthlete(idx, 'anas', 'reps', e.target.value)}
                          className="w-10 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border border-blue-200 dark:placeholder:text-zinc-500 rounded focus:ring-1 focus:ring-blue-500/30 dark:focus:ring-blue-400/20"
                          placeholder={cfg.targetReps === 'AMRAP' ? '∞' : cfg.targetReps}
                        />
                      </td>
                      <td className="py-2 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center">
                        <input
                          type="checkbox"
                          checked={row.anas.completed}
                          onChange={() => toggleComplete(idx, 'anas')}
                          className="w-4 h-4 rounded border-blue-300 text-blue-600 dark:text-blue-400 dark:border-zinc-600 dark:bg-zinc-800 accent-blue-500"
                        />
                        {anasVol > 0 && (
                          <div className="text-[8px] text-blue-600 dark:text-blue-400 mt-0.5">{anasVol.toFixed(0)}kg</div>
                        )}
                      </td>

                      {/* Flavio */}
                      <td className="py-2 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center">
                        <input
                          type="number"
                          step="0.5"
                          value={row.flavio.weight}
                          onChange={(e) => updateAthlete(idx, 'flavio', 'weight', e.target.value)}
                          className="w-12 px-1 py-0.5 text-xs font-bold text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border border-emerald-200 dark:placeholder:text-zinc-500 rounded focus:ring-1 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/20"
                          placeholder="-"
                        />
                      </td>
                      <td className="py-2 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center">
                        <input
                          type="number"
                          value={row.flavio.reps}
                          onChange={(e) => updateAthlete(idx, 'flavio', 'reps', e.target.value)}
                          className="w-10 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border border-emerald-200 dark:placeholder:text-zinc-500 rounded focus:ring-1 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/20"
                          placeholder={cfg.targetReps === 'AMRAP' ? '∞' : cfg.targetReps}
                        />
                      </td>
                      <td className="py-2 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center">
                        <input
                          type="checkbox"
                          checked={row.flavio.completed}
                          onChange={() => toggleComplete(idx, 'flavio')}
                          className="w-4 h-4 rounded border-emerald-300 text-emerald-600 dark:text-emerald-400 dark:border-zinc-600 dark:bg-zinc-800 accent-emerald-500"
                        />
                        {flavioVol > 0 && (
                          <div className="text-[8px] text-emerald-600 dark:text-emerald-400 mt-0.5">{flavioVol.toFixed(0)}kg</div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-3 py-2 bg-blue-50/50 dark:bg-zinc-800/50 border-t border-blue-100 dark:border-zinc-700/50 flex items-center justify-between">
            <span className="text-[9px] text-gray-500 dark:text-gray-400">4 settimane • 2 atleti</span>
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-medium text-blue-600 dark:text-blue-400">
                Anas: {data.reduce((acc, r) => acc + getVolume(r.anas, weekConfigs[r.week - 1]), 0).toFixed(0)}kg
              </span>
              <span className="text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                Flavio: {data.reduce((acc, r) => acc + getVolume(r.flavio, weekConfigs[r.week - 1]), 0).toFixed(0)}kg
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// AW Volume 1/2 - 5 settimane, Anas/Flavio. Progressione da tabella utente
const AW_VOL_CONFIG = {
  aw_v1_dita: { weight: 12, pattern: 'std' },
  aw_v1_wrist_wrench: { weight: 10, pattern: 'alt' },
  aw_v1_side_press: { weight: 12, pattern: 'std' },
  aw_v1_ulnar_chop: { weight: 6, pattern: 'std' },
  aw_v2_pronazione: { weight: 10, pattern: 'std' },
  aw_v2_cupping: { weight: 15, pattern: 'alt' },
  aw_v2_supination: { weight: 10, pattern: 'std' },
  aw_v2_rising: { weight: 10, pattern: 'std' },
  aw_v2_rev_pron: { weight: 5, pattern: 'std' },
};
const AW_STD = ['2x10', '3x8', '4x8', '5x7', '6x7'];
const AW_ALT = ['2x8', '2x10', '2x12', '3x10', '3x12'];

// Stile standard per tutte le tabelle AW
const AW_CARD = 'rounded-xl border bg-amber-50/80 dark:bg-zinc-900/80 border-amber-200/70 dark:border-zinc-700/60 overflow-hidden';
const AW_HEADER = 'px-3 py-2 border-b border-amber-100 dark:border-zinc-700/50 flex items-center justify-between';
const AW_TABLE = 'w-full text-xs border-collapse';
const AW_THEAD = 'border-b border-amber-100/50 dark:border-zinc-700/50 bg-amber-50/40 dark:bg-zinc-800/60';
const AW_TH = 'py-2 px-1 text-[9px] font-bold text-amber-600/70 dark:text-amber-400 uppercase';
const AW_TBODY = 'divide-y divide-amber-50/50 dark:divide-zinc-700/40';
const AW_TR = 'hover:bg-amber-50/20 dark:hover:bg-zinc-800/50 transition-colors';
const AW_TD = 'py-2 px-1';

const AWVolumeTable = ({ exercise, onRowsChange }) => {
  const { exercise_id, exercise_name } = exercise;
  const [expanded, setExpanded] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(1);
  const cfg = AW_VOL_CONFIG[exercise_id] || { weight: 10, pattern: 'std' };
  const targets = cfg.pattern === 'alt' ? AW_ALT : AW_STD;

  const [data, setData] = useState(
    targets.map((t, i) => ({
      week: i + 1,
      target: t,
      anas: { weight: String(cfg.weight), reps: '', completed: false },
      flavio: { weight: String(cfg.weight), reps: '', completed: false }
    }))
  );

  const updateA = (idx, athlete, field, value) => {
    setData(prev => prev.map((r, i) => i === idx ? { ...r, [athlete]: { ...r[athlete], [field]: value } } : r));
  };
  const toggleA = (idx, athlete) => {
    setData(prev => prev.map((r, i) => i === idx ? { ...r, [athlete]: { ...r[athlete], completed: !r[athlete].completed } } : r));
  };

  const currentRow = data.find(r => r.week === currentWeek);

  return (
    <div className={AW_CARD}>
      <div onClick={() => setExpanded(!expanded)} className={`${AW_HEADER} cursor-pointer hover:bg-amber-50/60 dark:hover:bg-zinc-800/40 transition-colors select-none`}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100/90 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300"><Target size={10} className="inline mr-0.5" />AW</span>
          <h3 className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{exercise_name}</h3>
          {!expanded && currentRow && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">W{currentWeek} {currentRow.target}</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }} className="flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 hover:underline">
          {expanded ? 'Nascondi' : 'Mostra storico'}
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>
      {!expanded && currentRow ? (
        <div className="px-3 py-2 border-t border-amber-100/50 dark:border-zinc-700/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map(w => (
              <button key={w} onClick={() => setCurrentWeek(w)} className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${currentWeek === w ? 'bg-amber-600 text-white dark:bg-amber-500' : 'bg-amber-100 dark:bg-zinc-700 text-amber-700 dark:text-zinc-300'}`}>W{w}</button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">Anas</span>
            <input type="number" step="0.5" value={currentRow.anas.weight} onChange={e => updateA(currentWeek - 1, 'anas', 'weight', e.target.value)} className="w-11 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-600 rounded" placeholder="kg" />
            <input type="number" value={currentRow.anas.reps} onChange={e => updateA(currentWeek - 1, 'anas', 'reps', e.target.value)} className="w-9 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-600 rounded" placeholder="r" />
            <input type="checkbox" checked={currentRow.anas.completed} onChange={() => toggleA(currentWeek - 1, 'anas')} className="w-3.5 h-3.5 rounded accent-amber-500" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Flavio</span>
            <input type="number" step="0.5" value={currentRow.flavio.weight} onChange={e => updateA(currentWeek - 1, 'flavio', 'weight', e.target.value)} className="w-11 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-600 rounded" placeholder="kg" />
            <input type="number" value={currentRow.flavio.reps} onChange={e => updateA(currentWeek - 1, 'flavio', 'reps', e.target.value)} className="w-9 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-600 rounded" placeholder="r" />
            <input type="checkbox" checked={currentRow.flavio.completed} onChange={() => toggleA(currentWeek - 1, 'flavio')} className="w-3.5 h-3.5 rounded accent-amber-500" />
          </div>
        </div>
      ) : (
        <table className={AW_TABLE}>
          <thead>
            <tr className={AW_THEAD}>
              <th className={`${AW_TH} text-center w-10`}>W</th>
              <th className={`${AW_TH} text-center`}>Target</th>
              <th colSpan="3" className={`${AW_TH} text-center bg-blue-100/40 dark:bg-blue-500/15 dark:border-r dark:border-zinc-700/40`}>Anas</th>
              <th colSpan="3" className={`${AW_TH} text-center bg-emerald-100/40 dark:bg-emerald-500/15`}>Flavio</th>
            </tr>
            <tr className="border-b border-amber-100/50 dark:border-zinc-700/40 bg-amber-50/30 dark:bg-zinc-800/40">
              <th className={`${AW_TD}`}></th>
              <th className={`${AW_TD}`}></th>
              <th className={`${AW_TD} text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase`}>Peso</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase`}>Reps</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase`}>✓</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase`}>Peso</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase`}>Reps</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase`}>✓</th>
            </tr>
          </thead>
          <tbody className={AW_TBODY}>
            {data.map((r) => {
              const idx = data.findIndex(d => d.week === r.week);
              return (
                <tr key={r.week} className={AW_TR}>
                  <td className="py-2 px-1 text-center font-bold text-amber-600 dark:text-amber-400">{r.week}</td>
                  <td className="py-2 px-1 text-center text-amber-700 dark:text-amber-400">{r.target}</td>
                  <td className="py-2 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center"><input type="number" step="0.5" value={r.anas.weight} onChange={e => updateA(idx, 'anas', 'weight', e.target.value)} className="w-12 px-1 py-0.5 text-xs font-bold text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border border-blue-200 dark:placeholder:text-zinc-500 rounded focus:ring-1 focus:ring-blue-500/30 dark:focus:ring-blue-400/20" placeholder="-" /></td>
                  <td className="py-2 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center"><input type="number" value={r.anas.reps} onChange={e => updateA(idx, 'anas', 'reps', e.target.value)} className="w-10 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border border-blue-200 dark:placeholder:text-zinc-500 rounded focus:ring-1 focus:ring-blue-500/30 dark:focus:ring-blue-400/20" placeholder="-" /></td>
                  <td className="py-2 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center"><input type="checkbox" checked={r.anas.completed} onChange={() => toggleA(idx, 'anas')} className="w-4 h-4 rounded border-blue-300 text-blue-600 dark:text-blue-400 dark:border-zinc-600 dark:bg-zinc-800 accent-blue-500" /></td>
                  <td className="py-2 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center"><input type="number" step="0.5" value={r.flavio.weight} onChange={e => updateA(idx, 'flavio', 'weight', e.target.value)} className="w-12 px-1 py-0.5 text-xs font-bold text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border border-emerald-200 dark:placeholder:text-zinc-500 rounded focus:ring-1 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/20" placeholder="-" /></td>
                  <td className="py-2 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center"><input type="number" value={r.flavio.reps} onChange={e => updateA(idx, 'flavio', 'reps', e.target.value)} className="w-10 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border border-emerald-200 dark:placeholder:text-zinc-500 rounded focus:ring-1 focus:ring-emerald-500/30 dark:focus:ring-emerald-400/20" placeholder="-" /></td>
                  <td className="py-2 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center"><input type="checkbox" checked={r.flavio.completed} onChange={() => toggleA(idx, 'flavio')} className="w-4 h-4 rounded border-emerald-300 text-emerald-600 dark:text-emerald-400 dark:border-zinc-600 dark:bg-zinc-800 accent-emerald-500" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Ipertrofia - 2 set stesso carico, expand mostra storico (sessioni passate)
const HYP_INPUT = 'w-10 px-1 py-0.5 text-[11px] text-center bg-white dark:bg-zinc-800 border border-emerald-200/60 dark:border-zinc-600 rounded';

const HypertrophyTable = ({ exercise, onRowsChange }) => {
  const { exercise_id, exercise_name, base_reps } = exercise;
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [data, setData] = useState({
    anas: { w: '', r: base_reps ? String(base_reps) : '', completed: false },
    flavio: { w: '', r: base_reps ? String(base_reps) : '', completed: false },
  });

  const upd = (athlete, field, value) => {
    setData(prev => ({ ...prev, [athlete]: { ...prev[athlete], [field]: value } }));
  };
  const tog = (athlete) => {
    setData(prev => ({ ...prev, [athlete]: { ...prev[athlete], completed: !prev[athlete].completed } }));
  };

  useEffect(() => {
    if (!expanded || !exercise_id) {
      setHistoryLoading(false);
      setHistoryError(false);
      return;
    }
    setHistoryLoading(true);
    setHistoryError(false);
    setHistory([]);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10000);
    fetch(`${import.meta.env.VITE_API_BASE || '/api'}/training/history?exercise_id=${encodeURIComponent(exercise_id)}&limit=12`, {
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json' },
    })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(res => {
        setHistory(res?.entries || []);
        setHistoryError(false);
      })
      .catch(() => {
        setHistory([]);
        setHistoryError(true);
      })
      .finally(() => {
        clearTimeout(timeout);
        setHistoryLoading(false);
      });
  }, [expanded, exercise_id]);

  const formatDate = (d) => {
    try {
      const [y, m, day] = d.split('-');
      return `${day}/${m}`;
    } catch { return d; }
  };

  return (
    <div className="rounded-lg border border-emerald-200/60 dark:border-zinc-700/60 bg-white/80 dark:bg-zinc-900/80 overflow-hidden shadow-sm hover:shadow dark:shadow-zinc-900/30">
      <div onClick={() => setExpanded(!expanded)} className="px-2.5 py-1.5 flex items-center justify-between cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-zinc-800/40 transition-colors select-none border-b border-emerald-100/50 dark:border-zinc-700/50">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100/80 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">2s</span>
          <h3 className="text-[11px] font-semibold text-gray-800 dark:text-gray-200 truncate">{exercise_name}</h3>
        </div>
        <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }} className="flex items-center gap-0.5 text-[8px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline shrink-0">
          {expanded ? 'Nascondi' : 'Storico'}
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>
      <div className="px-2.5 py-1.5">
        {!expanded ? (
          <>
            <div className="grid grid-cols-[1fr_1fr] gap-x-2 text-[8px] font-medium text-blue-600/80 dark:text-blue-400/80 mb-1">
              <span>Anas</span><span>Flavio</span>
            </div>
            <div className="grid grid-cols-[1fr_1fr] gap-x-2 items-center">
              <div className="flex items-center gap-1">
                <input type="number" step="0.5" value={data.anas.w} onChange={e => upd('anas', 'w', e.target.value)} className={`${HYP_INPUT} border-blue-200/60`} placeholder="kg" />
                <input type="number" value={data.anas.r} onChange={e => upd('anas', 'r', e.target.value)} className={`${HYP_INPUT} w-8 border-blue-200/60`} placeholder="r" />
                <input type="checkbox" checked={data.anas.completed} onChange={() => tog('anas')} className="w-3 h-3 rounded accent-emerald-500 shrink-0" />
              </div>
              <div className="flex items-center gap-1">
                <input type="number" step="0.5" value={data.flavio.w} onChange={e => upd('flavio', 'w', e.target.value)} className={`${HYP_INPUT} border-emerald-200/60`} placeholder="kg" />
                <input type="number" value={data.flavio.r} onChange={e => upd('flavio', 'r', e.target.value)} className={`${HYP_INPUT} w-8 border-emerald-200/60`} placeholder="r" />
                <input type="checkbox" checked={data.flavio.completed} onChange={() => tog('flavio')} className="w-3 h-3 rounded accent-emerald-500 shrink-0" />
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-[60px]">
            {historyLoading ? (
              <div className="py-3 text-center text-[10px] text-gray-400 dark:text-gray-500">Caricamento...</div>
            ) : historyError ? (
              <div className="py-3 text-center text-[10px] text-amber-600 dark:text-amber-400">Errore caricamento. Verifica che il backend sia avviato.</div>
            ) : history.length === 0 ? (
              <div className="py-3 text-center text-[10px] text-gray-400 dark:text-gray-500">Nessuno storico</div>
            ) : (
              <div className="overflow-x-auto max-h-40 overflow-y-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-emerald-100/50 dark:border-zinc-700/50 bg-emerald-50/40 dark:bg-zinc-800/60">
                      <th className="py-1.5 px-1 text-[8px] font-bold text-emerald-600/70 dark:text-emerald-400/70 uppercase text-left">Data</th>
                      <th colSpan="2" className="py-1.5 px-1 text-[8px] font-bold text-blue-600 dark:text-blue-400 uppercase text-center bg-blue-100/40 dark:bg-blue-500/15">Anas</th>
                      <th colSpan="2" className="py-1.5 px-1 text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase text-center bg-emerald-100/40 dark:bg-emerald-500/15">Flavio</th>
                    </tr>
                    <tr className="border-b border-emerald-100/50 dark:border-zinc-700/40 bg-emerald-50/30 dark:bg-zinc-800/40">
                      <th className="py-1 px-1"></th>
                      <th className="py-1 px-1 text-[7px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase">kg</th>
                      <th className="py-1 px-1 text-[7px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase">r</th>
                      <th className="py-1 px-1 text-[7px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase">kg</th>
                      <th className="py-1 px-1 text-[7px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase">r</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-50/50 dark:divide-zinc-700/40">
                    {history.map((e, i) => (
                      <tr key={i} className="hover:bg-emerald-50/20 dark:hover:bg-zinc-800/50">
                        <td className="py-1 px-1 text-[10px] text-gray-600 dark:text-gray-400">{formatDate(e.date)}</td>
                        <td className="py-1 px-1 text-center bg-blue-50/30 dark:bg-zinc-800/40">{e.weight_kg ?? '-'}</td>
                        <td className="py-1 px-1 text-center bg-blue-50/30 dark:bg-zinc-800/40">{e.reps ?? '-'}</td>
                        <td className="py-1 px-1 text-center bg-emerald-50/30 dark:bg-zinc-800/40">{e.weight_kg ?? '-'}</td>
                        <td className="py-1 px-1 text-center bg-emerald-50/30 dark:bg-zinc-800/40">{e.reps ?? '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Tabella standard solo per AW Max/Iso/Speed - collassata: 1 set inline, espansa: tabella completa. Anas + Flavio.
const ExerciseTable = ({ exercise, onRowsChange }) => {
  const { exercise_id, exercise_name, category, base_sets = 4, base_reps, instruction } = exercise;
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
    <div className={AW_CARD}>
      <div onClick={() => setExpanded(!expanded)} className={`${AW_HEADER} cursor-pointer hover:bg-amber-50/60 dark:hover:bg-zinc-800/40 transition-colors select-none`}>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100/90 dark:bg-amber-500/25 text-amber-700 dark:text-amber-300"><Target size={10} className="inline mr-0.5" />AW</span>
          <h3 className="text-[12px] font-bold text-gray-900 dark:text-gray-100">{exercise_name}</h3>
          {instruction && <span className="text-[9px] text-amber-600 dark:text-amber-400 truncate max-w-[120px]">{instruction}</span>}
        </div>
        <button onClick={e => { e.stopPropagation(); setExpanded(!expanded) }} className="flex items-center gap-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 hover:underline">
          {expanded ? 'Nascondi' : 'Mostra storico'}
          {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>
      {!expanded && currentRow ? (
        <div className="px-3 py-2 border-t border-amber-100/50 dark:border-zinc-700/50 flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-0.5">
            {rows.map(r => (
              <button key={r.id} onClick={() => setCurrentSet(r.set)} className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${currentSet === r.set ? 'bg-amber-600 text-white dark:bg-amber-500' : 'bg-amber-100 dark:bg-zinc-700 text-amber-700 dark:text-zinc-300'}`}>#{r.set}</button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold text-blue-600 dark:text-blue-400">Anas</span>
              <input type="checkbox" checked={currentRow.anas.checked} onChange={() => toggleCheck(currentRow.id, 'anas')} className="w-3 h-3 rounded accent-amber-500" />
              <input type="number" step="0.5" value={currentRow.anas.weight} onChange={e => updateRow(currentRow.id, 'anas', 'weight', e.target.value)} className="w-11 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-600 rounded" placeholder="kg" />
              <input type="number" value={currentRow.anas.reps} onChange={e => updateRow(currentRow.id, 'anas', 'reps', e.target.value)} className="w-9 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-blue-200 dark:border-zinc-600 rounded" placeholder="r" />
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">{calc1RM(currentRow.anas.weight, currentRow.anas.reps)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Flavio</span>
              <input type="checkbox" checked={currentRow.flavio.checked} onChange={() => toggleCheck(currentRow.id, 'flavio')} className="w-3 h-3 rounded accent-amber-500" />
              <input type="number" step="0.5" value={currentRow.flavio.weight} onChange={e => updateRow(currentRow.id, 'flavio', 'weight', e.target.value)} className="w-11 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-600 rounded" placeholder="kg" />
              <input type="number" value={currentRow.flavio.reps} onChange={e => updateRow(currentRow.id, 'flavio', 'reps', e.target.value)} className="w-9 px-1 py-0.5 text-xs text-center bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-600 rounded" placeholder="r" />
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300">{calc1RM(currentRow.flavio.weight, currentRow.flavio.reps)}</span>
            </div>
          </div>
        </div>
      ) : (
        <table className={AW_TABLE}>
          <thead>
            <tr className={AW_THEAD}>
              <th className={`${AW_TH} text-center w-8`}>#</th>
              <th colSpan="4" className={`${AW_TH} text-center bg-blue-100/40 dark:bg-blue-500/15 dark:border-r dark:border-zinc-700/40`}>Anas</th>
              <th colSpan="4" className={`${AW_TH} text-center bg-emerald-100/40 dark:bg-emerald-500/15`}>Flavio</th>
            </tr>
            <tr className="border-b border-amber-100/50 dark:border-zinc-700/40 bg-amber-50/30 dark:bg-zinc-800/40">
              <th className={`${AW_TD}`}></th>
              <th className={`${AW_TD} text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase`}>✓</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase`}>Peso</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase`}>Reps</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-blue-600/60 dark:text-blue-400/60 uppercase`}>1RM</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase`}>✓</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase`}>Peso</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase`}>Reps</th>
              <th className={`${AW_TD} text-[8px] font-semibold text-emerald-600/60 dark:text-emerald-400/60 uppercase`}>1RM</th>
            </tr>
          </thead>
          <tbody className={AW_TBODY}>
            {rows.map(row => (
              <tr key={row.id} className={AW_TR}>
                <td className="py-1 px-1 text-center font-bold text-amber-600 dark:text-amber-400">{row.set}</td>
                <td className="py-1 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center"><input type="checkbox" checked={row.anas.checked} onChange={() => toggleCheck(row.id, 'anas')} className="w-3 h-3 rounded accent-amber-500 dark:accent-amber-400" /></td>
                <td className="py-1 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center"><input type="number" step="0.5" value={row.anas.weight} onChange={e => updateRow(row.id, 'anas', 'weight', e.target.value)} className="w-12 px-0.5 py-0 text-[10px] text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border rounded dark:placeholder:text-zinc-500" /></td>
                <td className="py-1 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center"><input type="number" value={row.anas.reps} onChange={e => updateRow(row.id, 'anas', 'reps', e.target.value)} className="w-10 px-0.5 py-0 text-[10px] text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border rounded dark:placeholder:text-zinc-500" /></td>
                <td className="py-1 px-1 bg-blue-50/30 dark:bg-zinc-800/40 text-center font-medium text-amber-700 dark:text-amber-300 text-[10px]">{calc1RM(row.anas.weight, row.anas.reps)}</td>
                <td className="py-1 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center"><input type="checkbox" checked={row.flavio.checked} onChange={() => toggleCheck(row.id, 'flavio')} className="w-3 h-3 rounded accent-amber-500 dark:accent-amber-400" /></td>
                <td className="py-1 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center"><input type="number" step="0.5" value={row.flavio.weight} onChange={e => updateRow(row.id, 'flavio', 'weight', e.target.value)} className="w-12 px-0.5 py-0 text-[10px] text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border rounded dark:placeholder:text-zinc-500" /></td>
                <td className="py-1 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center"><input type="number" value={row.flavio.reps} onChange={e => updateRow(row.id, 'flavio', 'reps', e.target.value)} className="w-10 px-0.5 py-0 text-[10px] text-center bg-white dark:bg-zinc-800 dark:border-zinc-600 dark:text-zinc-100 border rounded dark:placeholder:text-zinc-500" /></td>
                <td className="py-1 px-1 bg-emerald-50/30 dark:bg-zinc-800/40 text-center font-medium text-amber-700 dark:text-amber-300 text-[10px]">{calc1RM(row.flavio.weight, row.flavio.reps)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default function Training() {
  const [selectedDay, setSelectedDay] = useState(null);
  const [weekData, setWeekData] = useState([]);
  const [setsByExercise, setSetsByExercise] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [calendarVisible, setCalendarVisible] = useState(true);

  // Undo/Redo state
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Carica la settimana e seleziona oggi di default (con timeout 15s)
  useEffect(() => {
    setLoading(true);
    setLoadError(false);
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 15000);
    const base = import.meta.env.VITE_API_BASE || '/api';
    console.log("Loading training from:", base);
    fetch(base + '/training/week', { signal: ctrl.signal, headers: { 'Content-Type': 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then(data => {
        setWeekData(data);
        const today = new Date().getDay();
        const todayIdx = today === 0 ? 6 : today - 1;
        const todayDay = data.find(d => d.weekday === todayIdx);
        setSelectedDay(todayDay || data[0]);
        setLoadError(false);
      })
      .catch(() => {
        setLoadError(true);
        setWeekData([]);
        setSelectedDay(null);
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
  }, []);

  const handleDaySelect = useCallback((day) => {
    setSelectedDay(day);
    setSetsByExercise({}); // Reset form quando cambio giorno
  }, []);

  const handleRowsChange = useCallback((exerciseId, rows) => {
    setSetsByExercise(prev => {
      const newState = { ...prev, [exerciseId]: rows };

      // Add to history for undo/redo
      setHistory(h => {
        const newHistory = h.slice(0, historyIndex + 1);
        newHistory.push({ exerciseId, rows: JSON.parse(JSON.stringify(rows)), timestamp: Date.now() });
        // Keep only last 50 states
        if (newHistory.length > 50) newHistory.shift();
        return newHistory;
      });
      setHistoryIndex(idx => Math.min(idx + 1, 49));

      // Trigger auto-save
      setLastSaved(Date.now());

      return newState;
    });
  }, [historyIndex]);

  // Undo/Redo handlers
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

  // Keyboard shortcuts for Undo/Redo - must be after handleUndo/handleRedo definitions
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Auto-save when data changes
  useEffect(() => {
    if (!selectedDay || !lastSaved || isSaving) return;

    const timeoutId = setTimeout(() => {
      const sets = [];
      Object.entries(setsByExercise).forEach(([exerciseId, rows]) => {
        (rows || []).forEach((row) => {
          if (row.weight || row.reps) {
            sets.push({
              exercise_id: exerciseId,
              set_number: row.set,
              weight_kg: row.weight ? parseFloat(row.weight) : null,
              reps: row.reps ? parseInt(row.reps, 10) : null,
              rpe: row.rpe ? parseFloat(row.rpe) : null,
              completed: !!row.checked
            });
          }
        });
      });

      if (sets.length > 0) {
        setIsSaving(true);
        api.training
          .log({ template_id: selectedDay.template_id, sets })
          .then(() => {
            setIsSaving(false);
          })
          .catch(() => {
            setIsSaving(false);
          });
      }
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [lastSaved, selectedDay, setsByExercise, isSaving]);

  // Organizza esercizi del giorno selezionato
  const hypertrophyExercises = selectedDay?.exercises.filter(e => e.category === 'HYPERTROPHY') || [];
  const strengthExercises = selectedDay?.exercises.filter(e => e.category === 'STRENGTH') || [];
  const awExercises = selectedDay?.exercises.filter(e => e.category === 'AW') || [];

  // Verifica tipi specifici per tabelle speciali
  const hasVolume1 = selectedDay?.exercises.some(e =>
    e.exercise_name.toLowerCase().includes('volume 1') ||
    e.exercise_id === 'aw_vol_1'
  );
  const hasVolume2 = selectedDay?.exercises.some(e =>
    e.exercise_name.toLowerCase().includes('volume 2') ||
    e.exercise_id === 'aw_vol_2'
  );
  const hasSpeedDay = selectedDay?.exercises.some(e =>
    e.exercise_name.toLowerCase().includes('speed') ||
    e.exercise_id === 'aw_speed'
  );

  // Titolo giorno selezionato
  const dayTitle = selectedDay ? `Day ${selectedDay.weekday + 1}` : '';

  if (loading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 dark:border-zinc-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Caricamento programma…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center min-h-[50vh]">
        <div className="text-center max-w-md">
          <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">Impossibile caricare il programma</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Verifica che il backend sia avviato (uvicorn) e raggiungibile.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 rounded-lg"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-full bg-gray-50 dark:bg-zinc-950 flex flex-col items-stretch">
      {/* Header fisso in alto */}
      <header className="w-full sticky top-0 z-50 bg-white/90 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-zinc-800/80 shadow-sm dark:shadow-zinc-900/50">
        <div className="w-full px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-sm dark:shadow-blue-500/20">
              <Dumbbell size={16} />
            </div>
            <div>
              <h1 className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
                Training
              </h1>
              <p className="hidden sm:block text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-tight">
                Seleziona un giorno per i dettagli
              </p>
            </div>
          </div>
          {selectedDay && (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-zinc-800/60 border border-gray-200/60 dark:border-zinc-700/60">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{dayTitle}</span>
                <ChevronRight size={12} className="text-gray-400 shrink-0" />
                <span className="text-xs font-bold text-gray-900 dark:text-white">{selectedDay.exercises.length} es.</span>
              </div>

              {/* Undo/Redo Buttons */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800/60 rounded-lg p-1 border border-transparent dark:border-zinc-700/50">
                <button
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  title="Undo (Ctrl+Z)"
                  className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Undo2 size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo (Ctrl+Y)"
                  className="p-1.5 rounded hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                >
                  <Redo2 size={16} className="text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Auto-save indicator */}
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium transition-colors ${isSaving ? 'text-blue-600 dark:text-blue-400' : lastSaved ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                {isSaving ? (
                  <>
                    <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span>Salvataggio...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle2 size={12} />
                    <span>Salvato</span>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Calendario - toggle per nascondere */}
      <div className="w-full border-b border-gray-200/80 dark:border-zinc-800/80">
        <button
          onClick={() => setCalendarVisible(v => !v)}
          className="w-full px-4 lg:px-8 py-2 flex items-center justify-between gap-2 text-left hover:bg-gray-50/80 dark:hover:bg-zinc-900/50 transition-colors"
        >
          <span className="text-[12px] font-semibold text-gray-700 dark:text-gray-300">
            Calendario settimanale
          </span>
          {calendarVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        {calendarVisible && (
          <div className="flex-1 w-full px-4 lg:px-8 py-6 overflow-x-auto overflow-y-hidden min-w-0">
            <WeeklyCalendar
              onDaySelect={handleDaySelect}
              selectedDayId={selectedDay?.template_id}
              initialDays={weekData}
            />
          </div>
        )}
      </div>

      {/* Dettaglio giorno selezionato - scale solo qui */}
      {selectedDay && (
        <div className="w-full px-4 lg:px-8 py-8 space-y-6 border-t border-gray-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950" style={{ transform: 'scale(0.9)', transformOrigin: 'top center' }}>
          {/* Card giorno compatta */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/80 dark:bg-zinc-900/80 border border-gray-200/60 dark:border-zinc-700/60 shadow-sm dark:shadow-black/20">
            <div className="w-10 h-10 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center text-sm font-bold shrink-0 shadow-sm dark:shadow-blue-500/20">
              {selectedDay.weekday + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white break-words tracking-tight leading-tight">
                Day {selectedDay.weekday + 1}
              </h2>
              <div className="flex flex-wrap gap-1.5 mt-1.5 min-w-0">
                {selectedDay.exercises.filter(e => e.category === 'STRENGTH').length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100/80 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-medium border border-transparent dark:border-blue-500/20">Forza</span>
                )}
                {selectedDay.exercises.filter(e => e.category === 'AW').length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100/90 dark:bg-amber-500/20 dark:border dark:border-amber-500/30 text-amber-700 dark:text-amber-300 font-medium">AW</span>
                )}
                {selectedDay.exercises.filter(e => e.category === 'HYPERTROPHY').length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100/90 dark:bg-emerald-500/20 dark:border dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium">Ipertrofia</span>
                )}
              </div>
            </div>
          </div>

          {/* Griglia Forza + AW affiancati */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Forza */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/15 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-500/25">
                  <Swords className="text-blue-600 dark:text-blue-400" size={16} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">Forza Principale</h3>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Multiarticolari</p>
                </div>
              </div>
              {strengthExercises.length === 0 ? (
                <div className="h-24 border-2 border-dashed border-gray-200/60 dark:border-zinc-700/60 rounded-xl flex items-center justify-center bg-gray-50/30 dark:bg-zinc-900/30">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Nessun esercizio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {strengthExercises.map((ex) => (
                    <StrengthTable key={ex.exercise_id} exercise={ex} onRowsChange={handleRowsChange} />
                  ))}
                </div>
              )}
            </section>

            {/* AW */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/15 flex items-center justify-center shrink-0 border border-amber-100 dark:border-amber-500/25">
                  <Target className="text-amber-600 dark:text-amber-400" size={16} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">Armwrestling</h3>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {hasVolume1 && 'Vol.1 '}{hasVolume2 && 'Vol.2 '}{hasSpeedDay && 'Speed'}
                  </p>
                </div>
              </div>
              {hasVolume1 && (
                <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/25">
                  <p className="text-[11px] font-bold text-amber-800/90 dark:text-amber-200 mb-1.5 uppercase tracking-wide">Protocollo Volume 1</p>
                  <div className="flex gap-1.5 text-[10px] text-center font-bold">
                    {['2×10→3×8', '3×8→4×8', '4×8→5×7', '5×7→6×7', '6×7'].map((label, i) => (
                      <div key={i} className="flex-1 py-1.5 px-1 rounded-md bg-white dark:bg-zinc-800/80 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-500/25 shadow-sm">
                        S{i + 1}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {awExercises.length === 0 ? (
                <div className="h-24 border-2 border-dashed border-gray-200/60 dark:border-zinc-700/60 rounded-xl flex items-center justify-center bg-gray-50/30 dark:bg-zinc-900/30">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Nessun esercizio</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {awExercises.map((ex) => (
                    AW_VOL_CONFIG[ex.exercise_id]
                      ? <AWVolumeTable key={ex.exercise_id} exercise={ex} onRowsChange={handleRowsChange} />
                      : <ExerciseTable key={ex.exercise_id} exercise={ex} onRowsChange={handleRowsChange} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Ipertrofia sotto */}
          {hypertrophyExercises.length > 0 && (
            <section className="pt-6 border-t border-gray-200/80 dark:border-zinc-800/80">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/15 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/25">
                  <Dumbbell className="text-emerald-600 dark:text-emerald-400" size={16} />
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-gray-900 dark:text-white uppercase tracking-tight">Ipertrofia & accessori</h3>
                  <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Isolamento</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {hypertrophyExercises.map((ex) => (
                  <HypertrophyTable key={ex.exercise_id} exercise={ex} onRowsChange={handleRowsChange} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
