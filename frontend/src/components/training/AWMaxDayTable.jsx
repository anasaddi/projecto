import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api/client';
import { Card, ModernInput, ModernCheckbox } from './TrainingUI';

// Cycle colors — subtle, just for the active button tint
const CYCLE_ACTIVE = [
  'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-orange-500 dark:text-orange-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-rose-500 dark:text-rose-400 shadow-sm',
  'bg-white dark:bg-zinc-700 text-violet-500 dark:text-violet-400 shadow-sm',
];

// Map absolute week (1-20) → protocol week (1-5) via rotation
const protoWeek = (w) => ((w - 1) % 5) + 1;
const cycleOf   = (w) => Math.floor((w - 1) / 5);  // 0-3

const slotKey = (week, slot) => `w${week}_e${slot}`;

/**
 * Parse a 1RM value that may be:
 *  - number: 23            → { sx: '23', dx: '23' }
 *  - string: 'Sx 15 dx 20' → { sx: '15', dx: '20' }
 *  - string: '27(30)'       → { sx: '27(30)', dx: '27(30)' }
 *  - null/''               → { sx: '', dx: '' }
 */
const parse1RM = (val) => {
  if (val === null || val === undefined || val === '') return { sx: '', dx: '' };
  const s = String(val);
  const lower = s.toLowerCase();
  const sxMatch = lower.match(/sx\s*([\d.,()]+)/);
  const dxMatch = lower.match(/dx\s*([\d.,()]+)/);
  if (sxMatch || dxMatch) {
    return {
      sx: sxMatch ? sxMatch[1].replace(',', '.') : '',
      dx: dxMatch ? dxMatch[1].replace(',', '.') : '',
    };
  }
  // Single value → apply to both arms
  const clean = s.trim();
  return { sx: clean, dx: clean };
};

const initSlot = (saved, refAnas, refFlavio, week) => {
  if (saved) return saved;
  // Pre-fill from protocol only for cycle 1 (weeks 1-5)
  const isFirstCycle = week <= 5;
  const a = isFirstCycle ? parse1RM(refAnas)   : { sx: '', dx: '' };
  const f = isFirstCycle ? parse1RM(refFlavio)  : { sx: '', dx: '' };
  return {
    anas_sx:          a.sx,
    anas_dx:          a.dx,
    flavio_sx:        f.sx,
    flavio_dx:        f.dx,
    anas_completed:   false,
    flavio_completed: false,
  };
};

function MaxDayRow({ week, slot, exName, refAnas, refFlavio, exerciseId, savedData, allData, onUpdate }) {
  const [data, setData] = useState(() => initSlot(savedData, refAnas, refFlavio, week));
  const firstRender = useRef(true);

  useEffect(() => {
    setData(initSlot(savedData, refAnas, refFlavio, week));
  }, [week, slot, exerciseId]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    const key = slotKey(week, slot);
    const t = setTimeout(() => {
      api.training.updateProgression(exerciseId, { ...allData, [key]: data });
      onUpdate(key, data);
    }, 700);
    return () => clearTimeout(t);
  }, [data]);

  const upd = (field, val) => setData(prev => ({ ...prev, [field]: val }));
  const tog = (field) => setData(prev => ({ ...prev, [field]: !prev[field] }));

  const cell = 'py-1.5 px-1 border-r border-gray-100 dark:border-zinc-800/50';

  return (
    <tr className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-[10px]">
      {/* Name */}
      <td className={`${cell} py-2 font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-[9px] leading-tight max-w-[90px] text-center`}>
        {exName}
      </td>

      {/* Anas SX */}
      <td className={cell}>
        <ModernInput
          type="text"
          value={data.anas_sx}
          onChange={val => upd('anas_sx', val)}
          className="w-10 py-1 text-[9px]"
          placeholder="sx"
        />
      </td>

      {/* Anas DX */}
      <td className={cell}>
        <ModernInput
          type="text"
          value={data.anas_dx}
          onChange={val => upd('anas_dx', val)}
          className="w-10 py-1 text-[9px]"
          placeholder="dx"
        />
      </td>

      {/* Flavio SX */}
      <td className={cell}>
        <ModernInput
          type="text"
          value={data.flavio_sx}
          onChange={val => upd('flavio_sx', val)}
          className="w-10 py-1 text-[9px]"
          placeholder="sx"
        />
      </td>

      {/* Flavio DX */}
      <td className={cell}>
        <ModernInput
          type="text"
          value={data.flavio_dx}
          onChange={val => upd('flavio_dx', val)}
          className="w-10 py-1 text-[9px]"
          placeholder="dx"
        />
      </td>

      {/* Anas checkbox */}
      <td className="py-1.5 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
        <ModernCheckbox
          checked={data.anas_completed}
          onChange={() => tog('anas_completed')}
          colorClass="accent-blue-500"
        />
      </td>

      {/* Flavio checkbox */}
      <td className="py-1.5 px-1 text-center">
        <ModernCheckbox
          checked={data.flavio_completed}
          onChange={() => tog('flavio_completed')}
          colorClass="accent-emerald-500"
        />
      </td>
    </tr>
  );
}

const AWMaxDayTable = ({ exercise, programData, progressions, initialWeek, resetTrigger }) => {
  const [currentWeek, setCurrentWeek] = useState(initialWeek || 1);
  const [localData, setLocalData] = useState(() => progressions?.[exercise?.exercise_id] || {});

  useEffect(() => {
    if (initialWeek) setCurrentWeek(initialWeek);
  }, [initialWeek, resetTrigger]);

  useEffect(() => {
    setLocalData(progressions?.[exercise?.exercise_id] || {});
  }, [progressions, exercise?.exercise_id]);

  if (!exercise || !programData?.weeks) return null;

  const weekExercises = programData.weeks.find(w => w.week === protoWeek(currentWeek))?.exercises || [];

  const handleUpdate = (key, data) =>
    setLocalData(prev => ({ ...prev, [key]: data }));

  return (
    <Card className="border-amber-100 dark:border-amber-900/30">
      {/* Header */}
      <div className="px-4 py-3 bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-gray-100 dark:border-zinc-800/80">
        <div className="flex flex-col items-center justify-center mb-3">
          <div className="flex flex-col items-center gap-1">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest text-center">{exercise.exercise_name || 'Max Day'}</h3>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded text-center">
              30-36 Rep · W{currentWeek} · C{cycleOf(currentWeek) + 1} (rot. {protoWeek(currentWeek)}/5)
            </span>
          </div>
        </div>

        {/* Week selector — 20 weeks, compact single row with cycle dividers */}
        <div className="flex items-center gap-0.5 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-xl overflow-x-auto custom-scrollbar">
          {Array.from({ length: 20 }, (_, i) => i + 1).map(w => (
            <React.Fragment key={w}>
              {w > 1 && w % 5 === 1 && (
                <div className="w-px h-4 bg-gray-300 dark:bg-zinc-600 shrink-0 mx-0.5" />
              )}
              <button
                onClick={() => setCurrentWeek(w)}
                className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all shrink-0 ${
                  currentWeek === w
                    ? CYCLE_ACTIVE[cycleOf(w)]
                    : 'text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300'
                }`}
              >
                {w}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/95 dark:bg-zinc-800/95">
            <tr className="text-[9px] font-bold uppercase tracking-tighter border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-2 text-gray-400">Esercizio</th>
              <th className="py-2 px-1 text-center text-blue-500 w-14">A SX</th>
              <th className="py-2 px-1 text-center text-blue-500 w-14">A DX</th>
              <th className="py-2 px-1 text-center text-emerald-500 w-14">F SX</th>
              <th className="py-2 px-1 text-center text-emerald-500 w-14">F DX</th>
              <th className="py-2 px-1 text-center text-blue-500 w-9">A ✓</th>
              <th className="py-2 px-1 text-center text-emerald-500 w-9">F ✓</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
            {weekExercises.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[10px] text-gray-400">
                  Nessun esercizio per la settimana {currentWeek}
                </td>
              </tr>
            ) : weekExercises.map((ex, i) => (
              <MaxDayRow
                key={`${currentWeek}-${i}`}
                week={currentWeek}
                slot={i + 1}
                exName={ex.name}
                refAnas={ex.anas_1rm}
                refFlavio={ex.flavio_1rm}
                exerciseId={exercise.exercise_id}
                savedData={localData[slotKey(currentWeek, i + 1)]}
                allData={localData}
                onUpdate={handleUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default AWMaxDayTable;
