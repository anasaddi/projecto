import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronUp, History as HistoryIcon } from 'lucide-react';
import { api } from '../../api/client';
import { Card, ColHeader, ModernInput, ModernCheckbox, AthleteAvatar } from './TrainingUI';
import WeekSelector from './WeekSelector';
import { AthleteCell } from './AthleteInputRow';
import { useDebouncedSave } from '../../hooks/useDebouncedSave';
import { calc1RM } from '../../utils/trainingUtils';
import {
  AW_STD,
  AW_ALT,
  AW_VOL_CONFIG,
  ISO_CONFIG,
  ISO_LIGHT_KEYS,
  ISO_HEAVY_KEYS,
  ISO_LABELS,
  ISO_LIGHT_WEIGHTS,
  ISO_HEAVY_WEIGHTS,
  SPEED_CONFIG,
} from '../../constants/trainingConstants';

// ─── Shared design tokens ────────────────────────────────────────────────────

const CARD_BORDER = 'border-amber-500/20 dark:border-amber-500/25';
const HEADER_BG = 'bg-gradient-to-r from-amber-500/[0.06] to-transparent dark:from-amber-500/10 border-b border-zinc-200/60 dark:border-zinc-800/80';
const TABLE_WRAP = 'overflow-x-auto custom-scrollbar';
const THEAD = 'bg-zinc-50/80 dark:bg-zinc-800/60';
const TH = 'py-1.5 px-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400';
const TH_ANAS = `${TH} text-center text-blue-500 w-[118px]`;
const TH_FLAVIO = `${TH} text-center text-emerald-500 w-[118px]`;
const TD_ATHLETE = 'py-1 px-2 border-r border-zinc-100 dark:border-zinc-800/50 last:border-r-0 w-[118px]';

const format1RM = (weight, reps) => {
  const rm = calc1RM(weight, reps);
  if (rm == null) return '-';
  return `${(Math.round(rm * 2) / 2).toFixed(1)}`;
};

const shortenName = (name) => {
  if (!name) return '';
  return name
    .replace(/Trazioni Zavorrate/gi, 'Traz. Zav')
    .replace(/Military Press/gi, 'Mil. Press')
    .replace(/Bench Press/gi, 'Panca')
    .replace(/Inclinata con Manubri/gi, 'Inc. Manu')
    .replace(/Elastico\/Panca Fermi/gi, 'El./Fermi');
};

const formatDate = (d) => {
  try { const [, m, day] = d.split('-'); return `${day}/${m}`; } catch { return d; }
};

function AwSectionHeader({
  title,
  subtitle,
  currentWeek,
  onWeekChange,
  weekCount = 5,
  cycleDividers = false,
  weekBelow = false,
  compactWeek = false,
}) {
  return (
    <div className={`px-3 py-2.5 ${HEADER_BG} ${weekBelow ? 'space-y-2' : ''}`}>
      <div className={`flex ${weekBelow ? 'flex-col' : 'flex-row items-center justify-between'} gap-2`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-1 h-7 bg-amber-500 rounded-full shrink-0" />
          <div className="min-w-0">
            <h3 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider truncate">{title}</h3>
            {subtitle && (
              <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        {onWeekChange && (
          <WeekSelector
            weeks={weekCount}
            current={currentWeek}
            onChange={onWeekChange}
            cycleDividers={cycleDividers}
            compact={compactWeek}
            className={weekBelow ? 'w-full' : 'shrink-0'}
          />
        )}
      </div>
    </div>
  );
}

function AthletePairHeader({ suffix = 'kg/r' }) {
  return (
    <>
      <th className={TH_ANAS}>Anas{suffix ? ` (${suffix})` : ''}</th>
      <th className={TH_FLAVIO}>Flavio{suffix ? ` (${suffix})` : ''}</th>
    </>
  );
}

function TableShell({ embedded, children, className = CARD_BORDER }) {
  if (embedded) {
    return <div className="border-t border-zinc-100/80 dark:border-zinc-800/60">{children}</div>;
  }
  return <Card className={className}>{children}</Card>;
}

function SlotInput({ exerciseId, slotKey, athlete, mode, defaults, progressions, onProgressionChange }) {
  const allData = progressions?.[exerciseId] || {};
  const saved = allData[slotKey]?.[athlete];
  const [values, setValues] = useState(() => ({ ...defaults, ...(saved || {}) }));
  const skip = useRef(true);

  useEffect(() => {
    const s = progressions?.[exerciseId]?.[slotKey]?.[athlete];
    setValues({ ...defaults, ...(s || {}) });
    skip.current = true;
  }, [exerciseId, slotKey, athlete]);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const t = setTimeout(() => {
      const current = progressions?.[exerciseId] || {};
      const next = {
        ...current,
        [slotKey]: { ...(current[slotKey] || {}), [athlete]: values },
      };
      api.training.updateProgression(exerciseId, next);
      onProgressionChange?.(exerciseId, next);
    }, 750);
    return () => clearTimeout(t);
  }, [values]);

  const onChange = (field, val) => setValues(prev => ({ ...prev, [field]: val }));

  return <AthleteCell mode={mode} values={values} onChange={onChange} athlete={athlete} />;
}

// ─── Volume mode ─────────────────────────────────────────────────────────────

function VolumeTable({ title, exercises, progressions, initialWeek, resetTrigger, onProgressionChange, embedded = false }) {
  const [currentWeek, setCurrentWeek] = useState(initialWeek || 1);

  useEffect(() => {
    if (initialWeek) setCurrentWeek(initialWeek);
  }, [initialWeek, resetTrigger]);

  return (
    <TableShell embedded={embedded}>
      <AwSectionHeader
        title={title}
        subtitle={`Settimana ${currentWeek}`}
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
      />

      <div className="overflow-x-auto custom-scrollbar border-b border-gray-100 dark:border-zinc-800/60">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
            <tr className="text-xs font-bold uppercase tracking-tighter text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-2 text-center w-14">Peso</th>
              {[1, 2, 3, 4, 5].map(w => (
                <th key={w} className={`py-2 px-2 text-center w-14 ${currentWeek === w ? 'text-amber-600 dark:text-amber-400' : ''}`}>W{w}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
            {exercises.map(ex => {
              const cfg = AW_VOL_CONFIG[ex.exercise_id] || { label: ex.exercise_name, weight: '—', pattern: 'std' };
              const targets = cfg.pattern === 'alt' ? AW_ALT : AW_STD;
              return (
                <tr key={ex.exercise_id} className="hover:bg-amber-50/10 dark:hover:bg-amber-900/5 text-xs">
                  <td className="py-2 px-3 font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-center">{cfg.label}</td>
                  <td className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">{cfg.weight}kg</td>
                  {targets.map((t, i) => (
                    <td key={i} className={`py-2 px-2 text-center text-xs font-semibold ${currentWeek === i + 1 ? 'text-amber-700 dark:text-amber-300 font-black bg-amber-50/60 dark:bg-amber-900/20' : 'text-gray-400'}`}>{t}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/60 dark:bg-zinc-800/40">
            <tr className="text-xs font-bold uppercase tracking-tighter text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-1 w-8 text-center" />
              <th className="py-2 px-1 w-8 text-center" />
              <AthletePairHeader />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/20">
            {exercises.flatMap(ex => {
              const cfg = AW_VOL_CONFIG[ex.exercise_id] || { label: ex.exercise_name, pattern: 'std', weight: '' };
              const targets = cfg.pattern === 'alt' ? AW_ALT : AW_STD;
              const targetStr = targets[currentWeek - 1] || '2×10';
              const sets = parseInt(targetStr.split('×')[0]) || 1;
              const defaultReps = targetStr.includes('×') ? targetStr.split('×')[1] : '';

              return Array.from({ length: sets }).map((_, s) => (
                <tr key={`${ex.exercise_id}-${s}`} className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-xs">
                  {s === 0 && (
                    <td rowSpan={sets} className="py-2 px-3 border-r border-gray-100 dark:border-zinc-800/50 align-middle font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-center">
                      {cfg.label}
                    </td>
                  )}
                  <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50 w-14">
                    {s === 0 && (
                      <span className="text-xs scale-90 font-black px-1 py-0.5 rounded bg-amber-100/60 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">{targetStr}</span>
                    )}
                  </td>
                  <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
                    <span className="text-xs font-black text-gray-400">{s + 1}</span>
                  </td>
                  <td className="py-1.5 px-2 border-r border-gray-100 dark:border-zinc-800/50">
                    <SlotInput
                      exerciseId={ex.exercise_id}
                      slotKey={`w${currentWeek}_s${s + 1}`}
                      athlete="anas"
                      mode="weight-reps"
                      defaults={{ weight: cfg.weight, reps: defaultReps, completed: false }}
                      progressions={progressions}
                      onProgressionChange={onProgressionChange}
                    />
                  </td>
                  <td className="py-1.5 px-2">
                    <SlotInput
                      exerciseId={ex.exercise_id}
                      slotKey={`w${currentWeek}_s${s + 1}`}
                      athlete="flavio"
                      mode="weight-reps"
                      defaults={{ weight: cfg.weight, reps: defaultReps, completed: false }}
                      progressions={progressions}
                      onProgressionChange={onProgressionChange}
                    />
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
}

// ─── ISO mode ────────────────────────────────────────────────────────────────

const findIsoCfgByName = (name, isHeavy) => {
  const lower = (name || '').toLowerCase();
  const idx = ISO_LABELS.findIndex(l => l.toLowerCase() === lower);
  if (idx >= 0) {
    const key = Object.keys(ISO_CONFIG).find(k => ISO_CONFIG[k].label === ISO_LABELS[idx] && ISO_CONFIG[k].isHeavy === isHeavy);
    return key ? ISO_CONFIG[key] : null;
  }
  const entry = Object.entries(ISO_CONFIG).find(([, v]) =>
    v.isHeavy === isHeavy && (v.label.toLowerCase().includes(lower) || lower.includes(v.label.toLowerCase()))
  );
  return entry ? entry[1] : null;
};

const getIsoCfg = (exercise_id, exercise_name, isHeavy, index) => {
  const byId = ISO_CONFIG[exercise_id];
  if (byId) return byId;
  const byName = findIsoCfgByName(exercise_name, isHeavy);
  if (byName) return byName;
  const weights = isHeavy ? ISO_HEAVY_WEIGHTS : ISO_LIGHT_WEIGHTS;
  return { label: ISO_LABELS[index % ISO_LABELS.length], weight: weights[index % weights.length], target: isHeavy ? '2×5s' : '2×15s', isHeavy };
};

function IsoTable({ title, exercises, programData, progressions, initialWeek, resetTrigger, onProgressionChange, embedded = false }) {
  const [currentWeek, setCurrentWeek] = useState(initialWeek || 1);
  const isHeavy = title?.toLowerCase().includes('pesante') || title?.toLowerCase().includes('heavy')
    || (exercises[0]?.exercise_id || '').includes('heavy');

  useEffect(() => {
    if (initialWeek) setCurrentWeek(initialWeek);
  }, [initialWeek, resetTrigger]);

  if (!exercises?.length || !programData) return null;

  const displayExercises = exercises.length === 1 && (exercises[0].exercise_name.toLowerCase().includes('isometria') || exercises[0].exercise_id.includes('iso'))
    ? (isHeavy ? ISO_HEAVY_KEYS.map((id, i) => ({ exercise_id: id, exercise_name: ISO_LABELS[i] }))
               : ISO_LIGHT_KEYS.map((id, i) => ({ exercise_id: id, exercise_name: ISO_LABELS[i] })))
    : exercises;

  return (
    <TableShell embedded={embedded}>
      <AwSectionHeader
        title={title}
        subtitle={`${isHeavy ? '85% 1RM · 2×5s' : '60% 1RM · 2×15s'} · W${currentWeek}`}
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
        weekBelow
      />

      <div className={`${TABLE_WRAP} border-b border-zinc-200/60 dark:border-zinc-800/60`}>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
            <tr className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-2 text-center w-14">Peso</th>
              {[1, 2, 3, 4, 5].map(w => (
                <th key={w} className={`py-2 px-2 text-center w-12 ${currentWeek === w ? 'text-amber-600 dark:text-amber-400' : ''}`}>W{w}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
            {displayExercises.map((ex, i) => {
              const cfg = getIsoCfg(ex.exercise_id, ex.exercise_name, isHeavy, i);
              const target = cfg.target.split('×')[1] || cfg.target;
              return (
                <tr key={ex.exercise_id} className="hover:bg-amber-50/10 dark:hover:bg-amber-900/5 text-xs">
                  <td className="py-2 px-3 font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">{cfg.label}</td>
                  <td className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">{cfg.weight}kg</td>
                  {[1, 2, 3, 4, 5].map(w => (
                    <td key={w} className={`py-2 px-2 text-center text-xs font-semibold ${currentWeek === w ? 'text-amber-700 dark:text-amber-300 font-black bg-amber-50/60 dark:bg-amber-900/20' : 'text-gray-400'}`}>{target}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/60 dark:bg-zinc-800/40">
            <tr className="text-xs font-bold uppercase tracking-widest text-zinc-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-1 w-8 text-center" />
              <AthletePairHeader suffix="kg/s" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-zinc-800/20">
            {displayExercises.flatMap((ex, exIdx) => {
              const cfg = getIsoCfg(ex.exercise_id, ex.exercise_name, isHeavy, exIdx);
              const sets = parseInt(cfg.target.split('×')[0]) || 2;
              const defaultSecs = cfg.target.split('×')[1]?.replace('s', '') || '';
              return Array.from({ length: sets }).map((_, s) => (
                <tr key={`${ex.exercise_id}-${s}`} className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-xs">
                  {s === 0 && (
                    <td rowSpan={sets} className="py-2 px-3 border-r border-gray-100 dark:border-zinc-800/50 align-middle font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-center">{cfg.label}</td>
                  )}
                  <td className="py-1 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
                    <span className="text-xs font-black text-gray-400">{s + 1}</span>
                  </td>
                  <td className="py-1.5 px-2 border-r border-gray-100 dark:border-zinc-800/50">
                    <SlotInput exerciseId={ex.exercise_id} slotKey={`w${currentWeek}_s${s + 1}`} athlete="anas" mode="weight-secs"
                      defaults={{ weight: String(cfg.weight), secs: defaultSecs, completed: false }}
                      progressions={progressions} onProgressionChange={onProgressionChange} />
                  </td>
                  <td className="py-1.5 px-2">
                    <SlotInput exerciseId={ex.exercise_id} slotKey={`w${currentWeek}_s${s + 1}`} athlete="flavio" mode="weight-secs"
                      defaults={{ weight: String(cfg.weight), secs: defaultSecs, completed: false }}
                      progressions={progressions} onProgressionChange={onProgressionChange} />
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
}

// ─── Max Day mode ────────────────────────────────────────────────────────────

const protoWeek = (w) => ((w - 1) % 5) + 1;
const cycleOf = (w) => Math.floor((w - 1) / 5);
const maxDaySlotKey = (week, slot) => `w${week}_e${slot}`;

const parse1RM = (val) => {
  if (val === null || val === undefined || val === '') return { sx: '', dx: '' };
  const s = String(val);
  const lower = s.toLowerCase();
  const sxMatch = lower.match(/sx\s*([\d.,()]+)/);
  const dxMatch = lower.match(/dx\s*([\d.,()]+)/);
  if (sxMatch || dxMatch) {
    return { sx: sxMatch ? sxMatch[1].replace(',', '.') : '', dx: dxMatch ? dxMatch[1].replace(',', '.') : '' };
  }
  const clean = s.trim();
  return { sx: clean, dx: clean };
};

const initMaxDaySlot = (saved, refAnas, refFlavio, week) => {
  if (saved) return saved;
  const isFirstCycle = week <= 5;
  const a = isFirstCycle ? parse1RM(refAnas) : { sx: '', dx: '' };
  const f = isFirstCycle ? parse1RM(refFlavio) : { sx: '', dx: '' };
  return { anas_sx: a.sx, anas_dx: a.dx, flavio_sx: f.sx, flavio_dx: f.dx, anas_completed: false, flavio_completed: false };
};

function MaxDayRow({ week, slot, exName, refAnas, refFlavio, exerciseId, savedData, allData, onUpdate, onProgressionChange }) {
  const [data, setData] = useState(() => initMaxDaySlot(savedData, refAnas, refFlavio, week));
  const skip = useRef(true);

  useEffect(() => {
    setData(initMaxDaySlot(savedData, refAnas, refFlavio, week));
    skip.current = true;
  }, [week, slot, exerciseId]);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const key = maxDaySlotKey(week, slot);
    const t = setTimeout(() => {
      const next = { ...allData, [key]: data };
      api.training.updateProgression(exerciseId, next);
      onProgressionChange?.(exerciseId, next);
      onUpdate(key, data);
    }, 700);
    return () => clearTimeout(t);
  }, [data]);

  const upd = (field, val) => setData(prev => ({ ...prev, [field]: val }));
  const cell = 'py-1.5 px-1 border-r border-gray-100 dark:border-zinc-800/50';

  return (
    <tr className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-xs">
      <td className={`${cell} py-2 font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-xs leading-tight max-w-[90px] text-center`}>{exName}</td>
      <td className={cell}><ModernInput type="text" value={data.anas_sx} onChange={v => upd('anas_sx', v)} className="w-10 py-1 text-xs" placeholder="sx" /></td>
      <td className={cell}><ModernInput type="text" value={data.anas_dx} onChange={v => upd('anas_dx', v)} className="w-10 py-1 text-xs" placeholder="dx" /></td>
      <td className={cell}><ModernInput type="text" value={data.flavio_sx} onChange={v => upd('flavio_sx', v)} className="w-10 py-1 text-xs" placeholder="sx" /></td>
      <td className={cell}><ModernInput type="text" value={data.flavio_dx} onChange={v => upd('flavio_dx', v)} className="w-10 py-1 text-xs" placeholder="dx" /></td>
      <td className="py-1.5 px-1 text-center border-r border-gray-100 dark:border-zinc-800/50">
        <ModernCheckbox checked={data.anas_completed} onChange={() => upd('anas_completed', !data.anas_completed)} colorClass="accent-blue-500" />
      </td>
      <td className="py-1.5 px-1 text-center">
        <ModernCheckbox checked={data.flavio_completed} onChange={() => upd('flavio_completed', !data.flavio_completed)} colorClass="accent-emerald-500" />
      </td>
    </tr>
  );
}

function MaxDayTable({ exercise, programData, progressions, initialWeek, resetTrigger, onProgressionChange, embedded = false }) {
  const [currentWeek, setCurrentWeek] = useState(initialWeek || 1);
  const [localData, setLocalData] = useState(() => progressions?.[exercise?.exercise_id] || {});

  useEffect(() => { if (initialWeek) setCurrentWeek(initialWeek); }, [initialWeek, resetTrigger]);
  useEffect(() => { setLocalData(progressions?.[exercise?.exercise_id] || {}); }, [progressions, exercise?.exercise_id]);

  if (!exercise || !programData?.weeks) return null;

  const weekExercises = programData.weeks.find(w => w.week === protoWeek(currentWeek))?.exercises || [];

  return (
    <TableShell embedded={embedded}>
      <AwSectionHeader
        title="Max Day"
        subtitle={`30-36 Rep · W${currentWeek} · C${cycleOf(currentWeek) + 1}`}
        currentWeek={currentWeek}
        onWeekChange={setCurrentWeek}
        weekCount={20}
        cycleDividers
        weekBelow
        compactWeek
      />

      <div className={TABLE_WRAP}>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/95 dark:bg-zinc-800/95">
            <tr className="text-xs font-bold uppercase tracking-tighter border-b border-gray-100 dark:border-zinc-800">
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
              <tr><td colSpan={7} className="py-6 text-center text-xs text-gray-400">Nessun esercizio per la settimana {currentWeek}</td></tr>
            ) : weekExercises.map((ex, i) => (
              <MaxDayRow
                key={`${currentWeek}-${i}`}
                week={currentWeek}
                slot={i + 1}
                exName={ex.name}
                refAnas={ex.anas_1rm}
                refFlavio={ex.flavio_1rm}
                exerciseId={exercise.exercise_id}
                savedData={localData[maxDaySlotKey(currentWeek, i + 1)]}
                allData={localData}
                onUpdate={(key, d) => setLocalData(prev => ({ ...prev, [key]: d }))}
                onProgressionChange={onProgressionChange}
              />
            ))}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
}

// ─── Speed mode ──────────────────────────────────────────────────────────────

function SpeedRow({ baseExerciseId, cfg, progressions, onProgressionChange }) {
  const stored = progressions?.[baseExerciseId]?.[cfg.id];
  const [anasW, setAnasW] = useState(stored?.anas?.weight ?? String(cfg.weight));
  const [flavioW, setFlavioW] = useState(stored?.flavio?.weight ?? String(cfg.weight));
  const [anasDone, setAnasDone] = useState(stored?.anas?.completed ?? false);
  const [flavioDone, setFlavioDone] = useState(stored?.flavio?.completed ?? false);
  const skip = useRef(true);

  useEffect(() => {
    const s = progressions?.[baseExerciseId]?.[cfg.id];
    setAnasW(s?.anas?.weight ?? String(cfg.weight));
    setFlavioW(s?.flavio?.weight ?? String(cfg.weight));
    setAnasDone(s?.anas?.completed ?? false);
    setFlavioDone(s?.flavio?.completed ?? false);
    skip.current = true;
  }, [baseExerciseId, cfg.id]);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const t = setTimeout(() => {
      const current = progressions?.[baseExerciseId] || {};
      const next = {
        ...current,
        [cfg.id]: { anas: { weight: anasW, reps: '6', completed: anasDone }, flavio: { weight: flavioW, reps: '6', completed: flavioDone } },
      };
      api.training.updateProgression(baseExerciseId, next);
      onProgressionChange?.(baseExerciseId, next);
    }, 800);
    return () => clearTimeout(t);
  }, [anasW, flavioW, anasDone, flavioDone]);

  return (
    <tr className="hover:bg-amber-50/20 dark:hover:bg-amber-900/10 transition-colors text-xs">
      <td className="py-2 px-3 font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight text-center">{cfg.label}</td>
      <td className="py-2 px-2 text-center font-bold text-amber-600 dark:text-amber-400">{cfg.weight}kg</td>
      <td className="py-1.5 px-2 border-r border-gray-100 dark:border-zinc-800/50">
        <AthleteCell mode="weight-only" values={{ weight: anasW, completed: anasDone }} athlete="anas"
          onChange={(f, v) => { if (f === 'weight') setAnasW(v); else setAnasDone(v); }} />
      </td>
      <td className="py-1.5 px-2">
        <AthleteCell mode="weight-only" values={{ weight: flavioW, completed: flavioDone }} athlete="flavio"
          onChange={(f, v) => { if (f === 'weight') setFlavioW(v); else setFlavioDone(v); }} />
      </td>
    </tr>
  );
}

function SpeedTable({ exercises, progressions, onProgressionChange, embedded = false }) {
  if (!exercises?.length) return null;
  const baseId = exercises[0]?.exercise_id || 'aw_speed';

  return (
    <TableShell embedded={embedded}>
      <AwSectionHeader title="Speed" subtitle="50% 1RM + BANDS · 6×6" />

      <div className={TABLE_WRAP}>
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/80 dark:bg-zinc-800/60">
            <tr className="text-xs font-bold uppercase tracking-tighter text-gray-400 border-b border-gray-100 dark:border-zinc-800">
              <th className="py-2 px-3">Esercizio</th>
              <th className="py-2 px-2 text-center w-14">Peso</th>
              <AthletePairHeader suffix="kg" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/30">
            {SPEED_CONFIG.map(cfg => (
              <SpeedRow key={cfg.id} baseExerciseId={baseId} cfg={cfg} progressions={progressions} onProgressionChange={onProgressionChange} />
            ))}
          </tbody>
        </table>
      </div>
    </TableShell>
  );
}

// ─── Generic mode (multi-set) ────────────────────────────────────────────────

function GenericTable({ exercise, onRowsChange, expandedOverride = false, initialData, onProgressionChange }) {
  const { exercise_id, exercise_name, base_sets = 4, base_reps } = exercise;
  const [expanded, setExpanded] = useState(expandedOverride);
  const [currentSet, setCurrentSet] = useState(1);
  const [rows, setRows] = useState(() => {
    if (initialData?.rows) return initialData.rows;
    return Array.from({ length: base_sets }, (_, i) => ({
      id: i + 1, set: i + 1,
      anas: { weight: '', reps: base_reps ? String(base_reps) : '', checked: false },
      flavio: { weight: '', reps: base_reps ? String(base_reps) : '', checked: false },
    }));
  });

  useDebouncedSave(exercise_id, { rows }, { onProgressionChange, enabled: !!exercise_id });

  const updateRow = (id, athlete, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [athlete]: { ...r[athlete], [field]: value } } : r));
  const toggleCheck = (id, athlete) => setRows(prev => prev.map(r => r.id === id ? { ...r, [athlete]: { ...r[athlete], checked: !r[athlete].checked } } : r));
  const currentRow = rows.find(r => r.set === currentSet);

  return (
    <Card className="border-zinc-200/60 dark:border-white/[0.06]">
      <div onClick={() => setExpanded(!expanded)} className="px-3 py-2 flex flex-col items-center justify-center cursor-pointer bg-zinc-50/50 dark:bg-white/[0.02] border-b border-zinc-100 dark:border-white/[0.06]">
        <h3 className="text-xs font-bold text-zinc-900 dark:text-gray-100 tracking-tight text-center">{exercise_name}</h3>
        <span className="text-xs font-bold text-indigo-500 uppercase tracking-tighter mt-0.5">{base_sets} Serie {base_reps ? `× ${base_reps}` : ''}</span>
      </div>
      <AnimatePresence initial={false}>
        {!expanded && currentRow ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-3 border-t border-zinc-100 dark:border-white/[0.06]">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex items-center gap-0.5 bg-zinc-100/50 dark:bg-white/[0.04] p-0.5 rounded-lg">
                  {rows.map(r => (
                    <button key={r.id} type="button" onClick={() => setCurrentSet(r.set)} className={`w-6 h-6 rounded text-xs font-bold transition-all ${currentSet === r.set ? 'bg-white dark:bg-zinc-700 shadow-sm text-indigo-600' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>{r.set}</button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  {['anas', 'flavio'].map(athlete => (
                    <div key={athlete} className={`flex items-center gap-2 p-1.5 rounded-lg border ${athlete === 'anas' ? 'bg-blue-50/10 dark:bg-blue-500/5 border-blue-500/10' : 'bg-emerald-50/10 dark:bg-emerald-500/5 border-emerald-500/10'}`}>
                      <AthleteAvatar initial={athlete === 'anas' ? 'A' : 'F'} colorClass={athlete === 'anas' ? 'bg-blue-500' : 'bg-emerald-500'} />
                      <ModernInput type="number" step="0.5" value={currentRow[athlete].weight} onChange={e => updateRow(currentRow.id, athlete, 'weight', e.target.value)} className="w-12 h-6 text-xs" placeholder="kg" />
                      <ModernInput type="number" value={currentRow[athlete].reps} onChange={e => updateRow(currentRow.id, athlete, 'reps', e.target.value)} className="w-10 h-6 text-xs" placeholder="r" />
                      <ModernCheckbox checked={currentRow[athlete].checked} onChange={() => toggleCheck(currentRow.id, athlete)} colorClass="accent-indigo-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 dark:border-zinc-800/80">
            <div className="p-2 space-y-1">
              <div className="grid grid-cols-[2rem_3.5rem_auto_auto] gap-4 px-2 py-1.5 text-xs font-bold text-gray-400 uppercase tracking-wider justify-between">
                <div className="text-center">Set</div><div className="text-center">S</div>
                <div className="w-[160px] text-center text-blue-500">Anas</div>
                <div className="w-[160px] text-center text-emerald-500">Flavio</div>
              </div>
              {rows.map(r => (
                <div key={r.id} className="grid grid-cols-[2rem_3.5rem_auto_auto] gap-4 items-center px-2 py-2 bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors justify-between">
                  <div className="text-center font-bold text-gray-700 dark:text-gray-300 text-xs">{r.set}</div>
                  <div className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/30 rounded px-1 py-0.5">{base_sets}x{base_reps || '—'}</div>
                  {['anas', 'flavio'].map(athlete => (
                    <div key={athlete} className="w-[160px] flex gap-1.5 justify-center items-center">
                      <ModernInput type="number" step="0.5" value={r[athlete].weight} onChange={e => updateRow(r.id, athlete, 'weight', e.target.value)} className="w-12 py-1" />
                      <ModernInput type="number" value={r[athlete].reps} onChange={e => updateRow(r.id, athlete, 'reps', e.target.value)} className="w-10 py-1" />
                      <ModernCheckbox checked={r[athlete].checked} onChange={() => toggleCheck(r.id, athlete)} colorClass="accent-amber-500" />
                      <span className="w-8 text-xs font-bold text-gray-400 text-right">{format1RM(r[athlete].weight, r[athlete].reps)}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

// ─── Hypertrophy helpers ─────────────────────────────────────────────────────

function TinyInput({ value, onChange, placeholder }) {
  return (
    <input type="text" inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-center text-xs font-semibold text-zinc-900 outline-none transition-colors dark:border-zinc-700/70 dark:bg-zinc-950/70 dark:text-zinc-100" />
  );
}

function TinyCheck({ checked, onChange, accent }) {
  const color = accent === 'blue'
    ? checked ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'
    : checked ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600';
  return (
    <button type="button" onClick={onChange} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${color}`}>
      {checked && <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3"><polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
    </button>
  );
}

const buildHypDefault = (baseReps) => ({
  anas: { w: '', r: baseReps ? String(baseReps) : '', completed: false },
  flavio: { w: '', r: baseReps ? String(baseReps) : '', completed: false },
});

const strVal = (v) => {
  if (v === null || v === undefined || v === 0 || v === '0') return '';
  return String(v);
};

const normHypEntry = (entry, baseReps) => entry ? {
  w: strVal(entry.weight ?? entry.w),
  r: strVal(entry.reps ?? entry.r) || (baseReps ? String(baseReps) : ''),
  completed: !!entry.completed,
} : null;

const parseHypRows = (rows, baseReps) => {
  if (!rows?.length) return null;
  const a = rows.find(r => r.set === 1);
  const f = rows.find(r => r.set === 2);
  return {
    anas: { w: a?.weight ?? '', r: a?.reps ?? (baseReps ? String(baseReps) : ''), completed: !!a?.checked },
    flavio: { w: f?.weight ?? '', r: f?.reps ?? (baseReps ? String(baseReps) : ''), completed: !!f?.checked },
  };
};

const resolveHypData = ({ initialRows, initialData, baseReps }) => {
  const fb = buildHypDefault(baseReps);
  if (initialData?.anas || initialData?.flavio) {
    return {
      anas: normHypEntry(initialData.anas, baseReps) || fb.anas,
      flavio: normHypEntry(initialData.flavio, baseReps) || fb.flavio,
    };
  }
  return parseHypRows(initialRows, baseReps) || fb;
};

function HypertrophyRow({ exercise, index, onRowsChange, onProgressionChange, initialRows, initialData, isOdd, showHistory = true }) {
  const { exercise_id, exercise_name, base_sets, base_reps } = exercise;
  const [data, setData] = useState(() => resolveHypData({ initialRows, initialData, baseReps: base_reps }));
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const skip = useRef(true);

  useEffect(() => {
    if (initialData?.anas || initialData?.flavio) return;
    setData(resolveHypData({ initialRows, initialData, baseReps: base_reps }));
    skip.current = true;
  }, [exercise_id, initialRows, initialData, base_reps]);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const t = setTimeout(() => {
      const payload = {
        anas: { weight: data.anas.w, reps: data.anas.r, completed: data.anas.completed },
        flavio: { weight: data.flavio.w, reps: data.flavio.r, completed: data.flavio.completed },
      };
      api.training.updateProgression(exercise_id, payload);
      onProgressionChange?.(exercise_id, payload);
    }, 700);
    return () => clearTimeout(t);
  }, [data, exercise_id, onProgressionChange]);

  const syncRows = useCallback((next) => {
    onRowsChange?.(exercise_id, [
      { set: 1, weight: next.anas.w, reps: next.anas.r, checked: next.anas.completed },
      { set: 2, weight: next.flavio.w, reps: next.flavio.r, checked: next.flavio.completed },
    ]);
  }, [exercise_id, onRowsChange]);

  const upd = (athlete, field, val) => {
    setData(prev => {
      const next = { ...prev, [athlete]: { ...prev[athlete], [field]: val } };
      syncRows(next);
      return next;
    });
  };

  const tog = (athlete) => {
    setData(prev => {
      const next = { ...prev, [athlete]: { ...prev[athlete], completed: !prev[athlete].completed } };
      syncRows(next);
      if (next[athlete].completed) {
        import('canvas-confetti').then(m => m.default({
          particleCount: 22, spread: 40, origin: { y: 0.8 },
          colors: athlete === 'anas' ? ['#3b82f6'] : ['#10b981'],
        }));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!expanded || !exercise_id || !showHistory) return;
    setHistLoading(true);
    api.training.getHistory(exercise_id, 10)
      .then(r => setHistory(r?.entries || []))
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [expanded, exercise_id, showHistory]);

  const doneA = data.anas.completed;
  const doneF = data.flavio.completed;
  const bothDone = doneA && doneF;

  return (
    <>
      <div className={`grid items-center gap-x-3 px-4 py-3 transition-colors
        grid-cols-[1.5rem_minmax(0,1fr)_3.5rem_4.2rem_4.2rem_1.75rem_4.2rem_4.2rem_1.75rem_1.75rem]
        ${isOdd ? 'bg-zinc-50/60 dark:bg-white/[0.02]' : 'bg-white dark:bg-transparent'}
        ${bothDone ? 'bg-emerald-50/60 dark:bg-emerald-950/10' : ''}`}>
        <div className="flex items-center justify-center"><span className="text-xs font-black text-zinc-400 tabular-nums">{String(index + 1).padStart(2, '0')}</span></div>
        <div className="min-w-0 flex flex-col items-center justify-center text-center">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate w-full leading-tight">{shortenName(exercise_name)}</div>
          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase tracking-widest leading-none">{base_sets || 2}×</div>
        </div>
        <div className="flex items-center justify-center">
          <div className={`w-10 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm transition-all ${doneA ? 'bg-blue-500 text-white scale-110' : 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-500/20'}`}>ANAS</div>
        </div>
        <div className="flex items-center justify-center"><TinyInput value={data.anas.w} onChange={v => upd('anas', 'w', v)} placeholder="kg" /></div>
        <div className="flex items-center justify-center"><TinyInput value={data.anas.r} onChange={v => upd('anas', 'r', v)} placeholder="r" /></div>
        <div className="flex items-center justify-center"><TinyCheck checked={doneA} onChange={() => tog('anas')} accent="blue" /></div>
        <div className="flex items-center justify-center">
          <div className={`w-10 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm transition-all ${doneF ? 'bg-emerald-500 text-white scale-110' : 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>FLAVIO</div>
        </div>
        <div className="flex items-center justify-center"><TinyInput value={data.flavio.w} onChange={v => upd('flavio', 'w', v)} placeholder="kg" /></div>
        <div className="flex items-center justify-center"><TinyInput value={data.flavio.r} onChange={v => upd('flavio', 'r', v)} placeholder="r" /></div>
        <div className="flex items-center justify-center"><TinyCheck checked={doneF} onChange={() => tog('flavio')} accent="emerald" /></div>
        {showHistory && (
          <div className="flex items-center justify-center">
            <button type="button" onClick={() => setExpanded(p => !p)} className="p-1 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-center">
              {expanded ? <ChevronUp size={13} /> : <HistoryIcon size={13} />}
            </button>
          </div>
        )}
      </div>
      {showHistory && (
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 pb-3 pt-1 bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200/60 dark:border-zinc-800/60">
                {histLoading ? (
                  <div className="py-3 flex justify-center"><div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>
                ) : history.length === 0 ? (
                  <p className="text-xs text-zinc-400 py-2">Nessuno storico</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {history.map((e, i) => (
                      <span key={i} className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1">
                        {formatDate(e.date)} — {e.weight_kg ?? '-'}kg × {e.reps ?? '-'}r
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

function HypertrophyGrid({ exercises, onRowsChange, onProgressionChange, setsByExercise, allProgressions }) {
  if (!exercises?.length) return null;

  return (
    <section className="min-w-0">
      <Card className="min-w-0">
        <div className="flex flex-col items-center justify-center px-4 py-3 border-b border-gray-100 dark:border-zinc-800/80 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-500/10 dark:to-transparent">
          <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Ipertrofia & Accessori</h3>
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded">Isolamento e volume</p>
        </div>
        <div className="hidden md:grid items-center gap-x-3 text-xs font-black uppercase tracking-[0.15em] text-zinc-400
          grid-cols-[1.5rem_minmax(0,1fr)_3.5rem_4.2rem_4.2rem_1.75rem_4.2rem_4.2rem_1.75rem_1.75rem]
          px-4 py-2 border-b border-gray-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-white/[0.01]">
          <span /><span />
          <div className="flex justify-center items-center gap-1.5 py-1 px-2 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20"><span className="text-blue-600 dark:text-blue-400">ANAS</span></div>
          <span className="text-center">Kg</span><span className="text-center">Rep</span><span className="text-center">✓</span>
          <div className="flex justify-center items-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20"><span className="text-emerald-600 dark:text-emerald-400">FLAVIO</span></div>
          <span className="text-center">Kg</span><span className="text-center">Rep</span><span className="text-center">✓</span>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-zinc-800/30">
          {exercises.map((ex, idx) => (
            <HypertrophyRow key={ex.exercise_id} index={idx} exercise={ex} isOdd={idx % 2 !== 0}
              onRowsChange={onRowsChange} onProgressionChange={onProgressionChange}
              initialRows={setsByExercise?.[ex.exercise_id]} initialData={allProgressions?.[ex.exercise_id]} />
          ))}
        </div>
      </Card>
    </section>
  );
}

function HypertrophyCard({ exercise, onRowsChange, onProgressionChange, initialRows, expandedOverride = false, initialData }) {
  const { exercise_id, exercise_name, base_reps } = exercise;
  const [expanded, setExpanded] = useState(expandedOverride);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [data, setData] = useState(() => resolveHypData({ initialRows, initialData, baseReps: base_reps }));
  const skip = useRef(true);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const t = setTimeout(() => {
      const payload = {
        anas: { weight: data.anas.w, reps: data.anas.r, completed: data.anas.completed },
        flavio: { weight: data.flavio.w, reps: data.flavio.r, completed: data.flavio.completed },
      };
      api.training.updateProgression(exercise_id, payload);
      onProgressionChange?.(exercise_id, payload);
    }, 1000);
    return () => clearTimeout(t);
  }, [data, exercise_id, onProgressionChange]);

  useEffect(() => {
    setData(resolveHypData({ initialRows, initialData, baseReps: base_reps }));
    skip.current = true;
  }, [exercise_id, initialRows, initialData, base_reps]);

  const upd = (athlete, field, value) => {
    setData(prev => {
      const next = { ...prev, [athlete]: { ...prev[athlete], [field]: value } };
      onRowsChange?.(exercise_id, [
        { set: 1, weight: next.anas.w, reps: next.anas.r, checked: next.anas.completed },
        { set: 2, weight: next.flavio.w, reps: next.flavio.r, checked: next.flavio.completed },
      ]);
      return next;
    });
  };

  const tog = (athlete) => {
    setData(prev => {
      const next = { ...prev, [athlete]: { ...prev[athlete], completed: !prev[athlete].completed } };
      onRowsChange?.(exercise_id, [
        { set: 1, weight: next.anas.w, reps: next.anas.r, checked: next.anas.completed },
        { set: 2, weight: next.flavio.w, reps: next.flavio.r, checked: next.flavio.completed },
      ]);
      return next;
    });
  };

  useEffect(() => {
    if (!expanded || !exercise_id) return;
    setHistoryLoading(true);
    api.training.getHistory(exercise_id, 12)
      .then(res => setHistory(res?.entries || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [expanded, exercise_id]);

  return (
    <Card className="border-zinc-200/60 dark:border-white/10 group">
      <div onClick={() => setExpanded(!expanded)} className="px-4 py-3 flex items-center justify-between cursor-pointer border-b border-zinc-100 dark:border-white/5 transition-all hover:bg-zinc-50 dark:hover:bg-white/[0.01]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-1.5 h-6 bg-emerald-500/20 rounded-full group-hover:bg-emerald-500/40 transition-colors" />
          <span className="text-sm font-black tracking-tight text-zinc-900 dark:text-zinc-100 uppercase truncate">{exercise_name}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/10">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">2 Sets</span>
            <span className="text-xs font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-tighter">{base_reps || 'VAR'} Reps</span>
          </div>
          <ChevronUp size={14} className={`transform transition-transform duration-300 ${expanded ? '' : 'rotate-180'} text-zinc-400`} />
        </div>
      </div>
      <div className="p-2 space-y-1">
        {!expanded ? (
          <div className="grid grid-cols-2 gap-2">
            {['anas', 'flavio'].map(athlete => (
              <div key={athlete} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${data[athlete].completed ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-transparent border-transparent'}`}>
                <span className="text-xs font-black text-zinc-400 w-4 text-center">{athlete === 'anas' ? 'A' : 'F'}</span>
                <ModernInput type="number" step="0.5" value={data[athlete].w} onChange={v => upd(athlete, 'w', v)} placeholder="kg" className="bg-transparent border-0 h-6" />
                <ModernInput type="number" value={data[athlete].r} onChange={v => upd(athlete, 'r', v)} placeholder="r" className="bg-transparent border-0 h-6" />
                <ModernCheckbox checked={data[athlete].completed} onChange={() => tog(athlete)} />
              </div>
            ))}
          </div>
        ) : (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
            <div className="grid grid-cols-2 gap-4 px-2 py-4 border-b border-zinc-100 dark:border-white/5 mb-4">
              {['anas', 'flavio'].map(athlete => (
                <div key={athlete} className="space-y-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">{athlete === 'anas' ? 'Anas' : 'Flavio'} Performance</div>
                  <div className="flex items-center gap-2">
                    <ModernInput type="number" step="0.5" value={data[athlete].w} onChange={v => upd(athlete, 'w', v)} placeholder="Weight" />
                    <ModernInput type="number" value={data[athlete].r} onChange={v => upd(athlete, 'r', v)} placeholder="Reps" />
                    <ModernCheckbox checked={data[athlete].completed} onChange={() => tog(athlete)} />
                  </div>
                </div>
              ))}
            </div>
            {historyLoading ? (
              <div className="py-8 text-center"><div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 uppercase tracking-widest">No training history available</div>
            ) : (
              <div className="space-y-3 px-2 pb-2">
                <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                  {history.map((e, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 bg-zinc-50 dark:bg-white/[0.02] rounded-xl border border-zinc-100 dark:border-white/5">
                      <span className="text-xs font-black text-zinc-400 uppercase tracking-tighter">{formatDate(e.date)}</span>
                      <div className="flex gap-3">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{e.weight_kg ?? '-'} <span className="text-zinc-400">kg</span></span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{e.reps ?? '-'} <span className="text-zinc-400">r</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function UnifiedExerciseTable({
  mode,
  title,
  exercise,
  exercises,
  onRowsChange,
  onProgressionChange,
  progressions,
  allProgressions,
  setsByExercise,
  initialWeek,
  resetTrigger,
  programData,
  expandedOverride,
  initialRows,
  initialData,
  embedded = false,
}) {
  const prog = progressions || allProgressions;

  switch (mode) {
    case 'volume':
      return <VolumeTable title={title} exercises={exercises} progressions={prog} initialWeek={initialWeek} resetTrigger={resetTrigger} onProgressionChange={onProgressionChange} embedded={embedded} />;
    case 'iso':
      return <IsoTable title={title} exercises={exercises} programData={programData} progressions={prog} initialWeek={initialWeek} resetTrigger={resetTrigger} onProgressionChange={onProgressionChange} embedded={embedded} />;
    case 'maxday':
      return <MaxDayTable exercise={exercise} programData={programData} progressions={prog} initialWeek={initialWeek} resetTrigger={resetTrigger} onProgressionChange={onProgressionChange} embedded={embedded} />;
    case 'speed':
      return <SpeedTable exercises={exercises} progressions={prog} onProgressionChange={onProgressionChange} embedded={embedded} />;
    case 'hypertrophy-grid':
      return <HypertrophyGrid exercises={exercises} onRowsChange={onRowsChange} onProgressionChange={onProgressionChange} setsByExercise={setsByExercise} allProgressions={prog} />;
    case 'hypertrophy-card':
      return <HypertrophyCard exercise={exercise} onRowsChange={onRowsChange} onProgressionChange={onProgressionChange} initialRows={initialRows} expandedOverride={expandedOverride} initialData={initialData} />;
    case 'generic':
    default:
      return <GenericTable exercise={exercise} onRowsChange={onRowsChange} expandedOverride={expandedOverride} initialData={initialData} onProgressionChange={onProgressionChange} />;
  }
}
