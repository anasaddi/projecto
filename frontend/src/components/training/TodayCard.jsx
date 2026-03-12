import React, { useMemo, useCallback, useRef } from 'react';
import { Zap, Target, Dumbbell } from 'lucide-react';
import { EXERCISE_MUSCLE_MAP, MUSCLE_GROUP_MAP, GROUP_ACCENT_DOT } from './calendarConstants';
import { getActiveMonth, getActiveWeek } from '../../utils/trainingUtils';
import { api } from '../../api/client';

// ─── configs (mirrors AWIsoTable + AWSpeedTable) ────────────────────────────

const ISO_LIGHT_KEYS    = ['aw_iso_light_rising','aw_iso_light_cup','aw_iso_light_pronation','aw_iso_light_side','aw_iso_light_dita','aw_iso_light_press','aw_iso_light_bicipite'];
const ISO_HEAVY_KEYS    = ['aw_iso_heavy_rising','aw_iso_heavy_cup','aw_iso_heavy_pronation','aw_iso_heavy_side','aw_iso_heavy_dita','aw_iso_heavy_press','aw_iso_heavy_bicipite'];
const ISO_LABELS        = ['Rising + back','Cup + drag','Pronation 45°','Side + supination','Mazurenko dita','Press','Bicipite'];
const ISO_LIGHT_WEIGHTS = [12, 18, 15, 9, 15, 15, 18];
const ISO_HEAVY_WEIGHTS = [17, 23, 20, 13, 20, 19, 23];

const SPEED_SLOTS = [
  { id: 'lat_cup',      label: 'LAT + CUP',       refW: 10 },
  { id: 'pronation_45', label: 'PRONATION 45°',    refW: 10 },
  { id: 'low_multi',    label: 'LOW MULTI SIDE',   refW: 10 },
  { id: 'high_multi',   label: 'HIGH MULTI SIDE',  refW: 10 },
];

const STRENGTH_WEEK_LABELS = ['5×5', '4×4', 'AMRAP', '3×5'];

// ─── AW classification + expansion ─────────────────────────────────────────

function classifyAw(ex) {
  const t = `${ex.exercise_id || ''} ${ex.exercise_name || ''}`.toLowerCase();
  if (ex.exercise_id?.startsWith('aw_v1_') || t.includes('aw_v1') || t.includes('volume 1') || t.includes('vol. 1')) return 'vol1';
  if (ex.exercise_id?.startsWith('aw_v2_') || t.includes('aw_v2') || t.includes('volume 2') || t.includes('vol. 2')) return 'vol2';
  if (t.includes('aw_max') || t.includes('max day') || t.includes('maxday')) return 'maxday';
  if (t.includes('aw_speed') || t.includes('speed')) return 'speed';
  if ((t.includes('iso') || t.includes('isometria')) && (t.includes('pesante') || t.includes('heavy'))) return 'iso_heavy';
  if (t.includes('iso') || t.includes('isometria')) return 'iso_light';
  return 'other';
}

function expandAwExercises(rawAwEx, allProgressions, awProgram) {
  const out = [];
  for (const ex of rawAwEx) {
    const type = classifyAw(ex);
    if (type === 'iso_light' || type === 'iso_heavy') {
      const keys    = type === 'iso_light' ? ISO_LIGHT_KEYS    : ISO_HEAVY_KEYS;
      const weights = type === 'iso_light' ? ISO_LIGHT_WEIGHTS : ISO_HEAVY_WEIGHTS;
      const target  = type === 'iso_light' ? '2×15s' : '2×5s';
      keys.forEach((isoId, i) => {
        const week    = getActiveWeek(allProgressions?.[isoId]) || 1;
        const slotKey = `w${week}_s1`;
        out.push({ exercise_id: isoId, exercise_name: ISO_LABELS[i], _type: type,
                   _baseId: ex.exercise_id, _refW: weights[i], _slotKey: slotKey, _target: target });
      });
    } else if (type === 'speed') {
      SPEED_SLOTS.forEach(cfg => {
        out.push({ exercise_id: `${ex.exercise_id}::${cfg.id}`, exercise_name: cfg.label,
                   _type: 'speed', _baseId: ex.exercise_id, _speedCfg: cfg.id, _refW: cfg.refW, _target: '6 reps' });
      });
    } else if (type === 'maxday') {
      const prog = allProgressions?.[ex.exercise_id] || {};
      let maxWeek = 0;
      Object.keys(prog).forEach(key => {
        if (key.startsWith('w')) {
          const w = parseInt(key.substring(1).split('_')[0]);
          if (!isNaN(w) && (prog[key]?.anas_completed || prog[key]?.flavio_completed) && w > maxWeek) maxWeek = w;
        }
      });
      const week = maxWeek || 1;
      const protoW = ((week - 1) % 5) + 1;
      const weekExercises = awProgram?.max_day?.weeks?.find(w => w.week === protoW)?.exercises || [];
      if (weekExercises.length === 0) {
        out.push({ ...ex, _type: type, _baseId: ex.exercise_id });
      } else {
        weekExercises.forEach((mdEx, i) => {
          out.push({
            exercise_id: `${ex.exercise_id}::md_e${i + 1}`,
            exercise_name: mdEx.name,
            _type: 'maxday',
            _baseId: ex.exercise_id,
            _slotKey: `w${week}_e${i + 1}`,
            _refAnas: String(mdEx.anas_1rm ?? ''),
            _refFlavio: String(mdEx.flavio_1rm ?? ''),
          });
        });
      }
    } else {
      out.push({ ...ex, _type: type, _baseId: ex.exercise_id });
    }
  }
  return out;
}

const AW_BADGE = {
  vol1:      { label: 'Vol.1',  bg: 'bg-amber-500' },
  vol2:      { label: 'Vol.2',  bg: 'bg-orange-500' },
  iso_light: { label: 'Iso L',  bg: 'bg-amber-400' },
  iso_heavy: { label: 'Iso H',  bg: 'bg-orange-600' },
  maxday:    { label: 'Max',    bg: 'bg-rose-500'   },
  speed:     { label: 'Speed',  bg: 'bg-violet-500' },
  other:     { label: 'AW',     bg: 'bg-amber-500'  },
};

// ─── data read helpers ───────────────────────────────────────────────────────

function getAwData(ex, allProgressions) {
  const { _type, exercise_id, _baseId, _slotKey, _speedCfg, _refW, _refAnas, _refFlavio } = ex;
  const ref = String(_refW ?? '');
  if (_type === 'iso_light' || _type === 'iso_heavy') {
    const slot = allProgressions?.[exercise_id]?.[_slotKey] || {};
    return { anasC: !!slot?.anas?.completed, flavioC: !!slot?.flavio?.completed,
             anasW: slot?.anas?.weight || ref, flavioW: slot?.flavio?.weight || ref };
  }
  if (_type === 'speed') {
    const cfgData = allProgressions?.[_baseId]?.[_speedCfg] || {};
    return { anasC: !!cfgData?.anas?.completed, flavioC: !!cfgData?.flavio?.completed,
             anasW: cfgData?.anas?.weight || ref, flavioW: cfgData?.flavio?.weight || ref };
  }
  if (_type === 'maxday' && _slotKey) {
    const slotData = allProgressions?.[_baseId]?.[_slotKey] || {};
    return {
      anasC: !!slotData?.anas_completed,
      flavioC: !!slotData?.flavio_completed,
      anasW: slotData?.anas_sx || String(_refAnas ?? ''),
      flavioW: slotData?.flavio_sx || String(_refFlavio ?? ''),
    };
  }
  const prog = allProgressions?.[exercise_id] || {};
  return { anasC: !!prog?.anas?.completed, flavioC: !!prog?.flavio?.completed,
           anasW: prog?.anas?.weight ?? '', flavioW: prog?.flavio?.weight ?? '' };
}

function getStrengthActiveWeekIdx(prog) {
  const monthIdx = getActiveMonth(prog);
  const month = prog?.dataByMonth?.[monthIdx - 1] || [];
  let wi = month.findIndex(w => !w?.anas?.completed || !w?.flavio?.completed);
  return { monthIdx, wi: wi === -1 ? Math.max(0, month.length - 1) : wi };
}

// ─── UI atoms ────────────────────────────────────────────────────────────────

const getDominantGroup = (muscles) => {
  if (!muscles?.length) return null;
  const groups = muscles.map(m => MUSCLE_GROUP_MAP[m]).filter(Boolean);
  if (!groups.length) return null;
  const counts = groups.reduce((acc, g) => { acc[g] = (acc[g] || 0) + 1; return acc; }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
};

function Tick({ checked, onChange, accentBg }) {
  return (
    <button type="button" onClick={onChange}
      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 active:scale-90 ${
        checked ? `${accentBg} border-transparent shadow-sm`
                : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600 hover:border-zinc-400'}`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" fill="none" className="w-2.5 h-2.5">
          <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function KgInput({ value, onChange, ring }) {
  return (
    <input type="number" step="0.5" value={value ?? ''} onChange={e => onChange(e.target.value)}
      placeholder="kg"
      className={`w-10 h-6 text-[10px] font-bold text-center text-zinc-900 dark:text-zinc-100
        bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700
        rounded-lg outline-none transition-all focus:ring-1 ${ring}`}
    />
  );
}

function MuscDot({ exerciseId }) {
  const group = getDominantGroup(EXERCISE_MUSCLE_MAP[exerciseId] || []);
  return <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${group ? GROUP_ACCENT_DOT[group] : 'bg-zinc-300 dark:bg-zinc-600'}`} />;
}

// grid: dot | name | badge | tickA | kgA | tickF | kgF
function ExRow({ exerciseId, exerciseName, badge, badgeBg, anasC, flavioC, anasW, flavioW, onToggle, onWeight }) {
  const bothDone = anasC && flavioC;
  return (
    <div className={`grid items-start gap-x-1.5 py-1.5 px-2 rounded-xl transition-colors
      grid-cols-[8px_minmax(0,1fr)_auto_20px_40px_20px_40px]
      ${bothDone ? 'opacity-40' : 'hover:bg-zinc-50 dark:hover:bg-white/[0.025]'}`}
    >
      <MuscDot exerciseId={exerciseId} />
      <span className={`text-[11px] font-bold line-clamp-2 leading-tight ${bothDone ? 'line-through text-zinc-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
        {exerciseName}
      </span>
      <span className={`text-[8px] font-black text-white px-1.5 py-0.5 rounded-md whitespace-nowrap self-start mt-0.5 ${badgeBg}`}>
        {badge}
      </span>
      <Tick checked={anasC}   onChange={() => onToggle('anas')}   accentBg="bg-blue-500"    />
      <KgInput value={anasW}   onChange={v => onWeight('anas', v)}   ring="focus:ring-blue-500/40 focus:border-blue-500/40"    />
      <Tick checked={flavioC} onChange={() => onToggle('flavio')} accentBg="bg-emerald-500" />
      <KgInput value={flavioW} onChange={v => onWeight('flavio', v)} ring="focus:ring-emerald-500/40 focus:border-emerald-500/40" />
    </div>
  );
}

function Section({ icon: Icon, color, label, children, count }) {
  if (!count) return null;
  return (
    <div className="px-2 py-3 min-w-0">
      <div className="grid grid-cols-[8px_minmax(0,1fr)_auto_20px_40px_20px_40px] gap-x-1.5 items-center px-2 mb-1">
        <Icon size={9} className={`${color} shrink-0`} />
        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 col-span-2">{label}</span>
        <span className="text-[7px] font-black text-blue-400 text-center">✓</span>
        <span className="text-[7px] font-black text-blue-400 text-center">A kg</span>
        <span className="text-[7px] font-black text-emerald-400 text-center">✓</span>
        <span className="text-[7px] font-black text-emerald-400 text-center">F kg</span>
      </div>
      <div>{children}</div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function TodayCard({ selectedDay, allProgressions, selectedDate, progressPercent, isToday, onProgressionChange, awProgram }) {
  const saveTimers = useRef({});

  // ALL hooks unconditionally first
  const exercises = useMemo(
    () => selectedDay?.exercises?.filter(e => e.is_active !== 0) || [],
    [selectedDay]
  );
  const strengthEx = useMemo(() => exercises.filter(e => e.category === 'STRENGTH'), [exercises]);
  const rawAwEx    = useMemo(() => exercises.filter(e => e.category === 'AW'),        [exercises]);
  const hypEx      = useMemo(() => exercises.filter(e => e.category === 'HYPERTROPHY'), [exercises]);

  // Expand AW into individual sub-exercises (iso → 7 rows, speed → 4 rows, etc.)
  const awEx = useMemo(() => expandAwExercises(rawAwEx, allProgressions, awProgram), [rawAwEx, allProgressions, awProgram]);

  const commitProg = useCallback((exerciseId, newProg) => {
    onProgressionChange?.(exerciseId, newProg);
    clearTimeout(saveTimers.current[exerciseId]);
    saveTimers.current[exerciseId] = setTimeout(() => {
      api.training.updateProgression(exerciseId, newProg);
    }, 700);
  }, [onProgressionChange]);

  // ── STRENGTH handlers ──────────────────────────────────────────────────────
  const toggleStrength = useCallback((exerciseId, athlete) => {
    const prog = allProgressions?.[exerciseId];
    if (!prog) return;
    const { monthIdx, wi } = getStrengthActiveWeekIdx(prog);
    const newData = (prog.dataByMonth || []).map((m, mi) =>
      mi === monthIdx - 1
        ? m.map((w, wii) => wii === wi ? { ...w, [athlete]: { ...w[athlete], completed: !w[athlete]?.completed } } : w)
        : m
    );
    const newProg = { ...prog, dataByMonth: newData };
    commitProg(exerciseId, newProg);
    const week = newData[monthIdx - 1]?.[wi];
    if (week?.anas?.completed && week?.flavio?.completed)
      import('canvas-confetti').then(m => m.default({ particleCount: 30, spread: 50, origin: { y: 0.7 } }));
  }, [allProgressions, commitProg]);

  const weightStrength = useCallback((exerciseId, athlete, value) => {
    const prog = allProgressions?.[exerciseId];
    if (!prog) return;
    const { monthIdx, wi } = getStrengthActiveWeekIdx(prog);
    const newData = (prog.dataByMonth || []).map((m, mi) =>
      mi === monthIdx - 1
        ? m.map((w, wii) => wii === wi ? { ...w, [athlete]: { ...w[athlete], weight: value } } : w)
        : m
    );
    commitProg(exerciseId, { ...prog, dataByMonth: newData });
  }, [allProgressions, commitProg]);

  // ── AW handlers (iso / speed / maxday / flat) ─────────────────────────────
  const toggleAw = useCallback((ex, athlete) => {
    const { _type, exercise_id, _baseId, _slotKey, _speedCfg } = ex;

    if (_type === 'iso_light' || _type === 'iso_heavy') {
      const prog = allProgressions?.[exercise_id] || {};
      const slot = prog[_slotKey] || {};
      const newProg = { ...prog, [_slotKey]: { ...slot, [athlete]: { ...(slot[athlete] || {}), completed: !slot[athlete]?.completed } } };
      commitProg(exercise_id, newProg);
      return;
    }
    if (_type === 'speed') {
      const prog = allProgressions?.[_baseId] || {};
      const newProg = { ...prog, [_speedCfg]: { ...(prog[_speedCfg] || {}), [athlete]: { ...(prog[_speedCfg]?.[athlete] || {}), completed: !prog[_speedCfg]?.[athlete]?.completed } } };
      commitProg(_baseId, newProg);
      return;
    }
    if (_type === 'maxday' && _slotKey) {
      const prog = allProgressions?.[_baseId] || {};
      const slot = prog[_slotKey] || {};
      const field = athlete === 'anas' ? 'anas_completed' : 'flavio_completed';
      commitProg(_baseId, { ...prog, [_slotKey]: { ...slot, [field]: !slot[field] } });
      return;
    }
    // vol1/vol2/other — flat
    const prog = allProgressions?.[exercise_id] || {};
    commitProg(exercise_id, { ...prog, [athlete]: { ...prog[athlete], completed: !prog[athlete]?.completed } });
  }, [allProgressions, commitProg]);

  const weightAw = useCallback((ex, athlete, value) => {
    const { _type, exercise_id, _baseId, _slotKey, _speedCfg } = ex;

    if (_type === 'iso_light' || _type === 'iso_heavy') {
      const prog = allProgressions?.[exercise_id] || {};
      const slot = prog[_slotKey] || {};
      commitProg(exercise_id, { ...prog, [_slotKey]: { ...slot, [athlete]: { ...(slot[athlete] || {}), weight: value } } });
      return;
    }
    if (_type === 'speed') {
      const prog = allProgressions?.[_baseId] || {};
      commitProg(_baseId, { ...prog, [_speedCfg]: { ...(prog[_speedCfg] || {}), [athlete]: { ...(prog[_speedCfg]?.[athlete] || {}), weight: value } } });
      return;
    }
    if (_type === 'maxday' && _slotKey) {
      const prog = allProgressions?.[_baseId] || {};
      const slot = prog[_slotKey] || {};
      const field = athlete === 'anas' ? 'anas_sx' : 'flavio_sx';
      commitProg(_baseId, { ...prog, [_slotKey]: { ...slot, [field]: value } });
      return;
    }
    const prog = allProgressions?.[exercise_id] || {};
    commitProg(exercise_id, { ...prog, [athlete]: { ...prog[athlete], weight: value } });
  }, [allProgressions, commitProg]);

  // ── HYPERTROPHY handlers ───────────────────────────────────────────────────
  const toggleHyper = useCallback((exerciseId, athlete) => {
    const prog = allProgressions?.[exerciseId] || {};
    const newProg = { ...prog, [athlete]: { ...prog[athlete], completed: !prog[athlete]?.completed } };
    commitProg(exerciseId, newProg);
    if (newProg.anas?.completed && newProg.flavio?.completed)
      import('canvas-confetti').then(m => m.default({ particleCount: 30, spread: 50, origin: { y: 0.7 } }));
  }, [allProgressions, commitProg]);

  const weightHyper = useCallback((exerciseId, athlete, value) => {
    const prog = allProgressions?.[exerciseId] || {};
    commitProg(exerciseId, { ...prog, [athlete]: { ...prog[athlete], weight: value } });
  }, [allProgressions, commitProg]);

  // ── Early return AFTER all hooks ───────────────────────────────────────────
  if (!exercises.length) return null;

  const safeDate = selectedDate ? selectedDate.slice(0, 10) : null;
  const dateLabel = safeDate
    ? new Date(safeDate + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    : selectedDay?.day_name || '';

  const activeCols = [strengthEx.length > 0, awEx.length > 0, hypEx.length > 0].filter(Boolean).length;
  const gridClass =
    activeCols === 3 ? 'grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 dark:divide-zinc-800/50' :
    activeCols === 2 ? 'grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-100 dark:divide-zinc-800/50' :
    'flex flex-col';

  return (
    <div className="rounded-[2rem] border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/70 backdrop-blur-sm overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-5 py-3 flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60">
        <div className="flex-1 min-w-0">
          {isToday && <div className="text-[8px] font-black uppercase tracking-widest text-blue-500 mb-0.5">OGGI</div>}
          <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 capitalize truncate">{dateLabel}</div>
        </div>
        <div className="flex gap-1 items-center shrink-0">
          {strengthEx.length > 0 && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
          {awEx.length > 0       && <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          {hypEx.length > 0      && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
        </div>
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-100 dark:border-zinc-700/40 shrink-0">
          <div className="w-20 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="text-[10px] font-black text-zinc-500">{progressPercent}%</span>
        </div>
      </div>

      {/* Body */}
      <div className={gridClass}>
        <Section icon={Zap} color="text-blue-500" label="Forza" count={strengthEx.length}>
          {strengthEx.map(ex => {
            const prog = allProgressions?.[ex.exercise_id];
            const { monthIdx, wi } = getStrengthActiveWeekIdx(prog);
            const week = prog?.dataByMonth?.[monthIdx - 1]?.[wi] || {};
            return (
              <ExRow key={ex.exercise_id}
                exerciseId={ex.exercise_id} exerciseName={ex.exercise_name}
                badge={STRENGTH_WEEK_LABELS[wi] || '—'} badgeBg="bg-blue-500"
                anasC={!!week?.anas?.completed} flavioC={!!week?.flavio?.completed}
                anasW={week?.anas?.weight ?? ''} flavioW={week?.flavio?.weight ?? ''}
                onToggle={a => toggleStrength(ex.exercise_id, a)}
                onWeight={(a, v) => weightStrength(ex.exercise_id, a, v)}
              />
            );
          })}
        </Section>

        <Section icon={Target} color="text-amber-500" label="Armwrestling" count={awEx.length}>
          {awEx.map(ex => {
            const { anasC, flavioC, anasW, flavioW } = getAwData(ex, allProgressions);
            const badge = AW_BADGE[ex._type] || AW_BADGE.other;
            return (
              <ExRow key={ex.exercise_id}
                exerciseId={ex.exercise_id} exerciseName={ex.exercise_name}
                badge={badge.label} badgeBg={badge.bg}
                anasC={anasC} flavioC={flavioC} anasW={anasW} flavioW={flavioW}
                onToggle={a => toggleAw(ex, a)}
                onWeight={(a, v) => weightAw(ex, a, v)}
              />
            );
          })}
        </Section>

        <Section icon={Dumbbell} color="text-emerald-500" label="Ipertrofia" count={hypEx.length}>
          {hypEx.map(ex => {
            const prog = allProgressions?.[ex.exercise_id] || {};
            return (
              <ExRow key={ex.exercise_id}
                exerciseId={ex.exercise_id} exerciseName={ex.exercise_name}
                badge={`${ex.base_sets || 2}×${ex.base_reps || '—'}`} badgeBg="bg-emerald-500"
                anasC={!!prog?.anas?.completed} flavioC={!!prog?.flavio?.completed}
                anasW={prog?.anas?.weight ?? ''} flavioW={prog?.flavio?.weight ?? ''}
                onToggle={a => toggleHyper(ex.exercise_id, a)}
                onWeight={(a, v) => weightHyper(ex.exercise_id, a, v)}
              />
            );
          })}
        </Section>
      </div>
    </div>
  );
}
