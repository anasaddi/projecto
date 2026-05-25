import React, { useMemo, useCallback, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { TrainingSurface, TrainingSessionHeader, TrainingSection, AthleteSessionRow } from './TrainingUI';
import { cn } from '../../lib/utils';

import { getActiveMonth, getActiveWeek } from '../../utils/trainingUtils';
import { api } from '../../api/client';
import {
  ISO_LIGHT_KEYS,
  ISO_HEAVY_KEYS,
  ISO_LABELS,
  ISO_LIGHT_WEIGHTS,
  ISO_HEAVY_WEIGHTS,
  SPEED_CONFIG,
  STRENGTH_WEEK_LABELS,
} from '../../constants/trainingConstants';

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
      const keys = type === 'iso_light' ? ISO_LIGHT_KEYS : ISO_HEAVY_KEYS;
      const weights = type === 'iso_light' ? ISO_LIGHT_WEIGHTS : ISO_HEAVY_WEIGHTS;
      const target = type === 'iso_light' ? '2×15s' : '2×5s';
      keys.forEach((isoId, i) => {
        const week = getActiveWeek(allProgressions?.[isoId]) || 1;
        const slotKey = `w${week}_s1`;
        out.push({
          exercise_id: isoId, exercise_name: ISO_LABELS[i], _type: type,
          _baseId: ex.exercise_id, _refW: weights[i], _slotKey: slotKey, _target: target
        });
      });
    } else if (type === 'speed') {
      SPEED_CONFIG.forEach(cfg => {
        out.push({
          exercise_id: `${ex.exercise_id}::${cfg.id}`, exercise_name: cfg.label,
          _type: 'speed', _baseId: ex.exercise_id, _speedCfg: cfg.id, _refW: cfg.weight, _target: '6 reps'
        });
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
      
      // Defensive validation for awProgram structure
      let weekExercises = [];
      if (awProgram && typeof awProgram === 'object' && 
          awProgram.max_day && typeof awProgram.max_day === 'object' && 
          Array.isArray(awProgram.max_day.weeks)) {
        const weekData = awProgram.max_day.weeks.find(w => w && w.week === protoW);
        if (weekData && Array.isArray(weekData.exercises)) {
          weekExercises = weekData.exercises;
        }
      } else {
        console.warn('[TodayCard] AW program structure is malformed or missing max_day.weeks:', awProgram);
      }
      
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
  vol1: { label: 'Vol.1', bg: 'bg-amber-500' },
  vol2: { label: 'Vol.2', bg: 'bg-orange-500' },
  iso_light: { label: 'Iso L', bg: 'bg-amber-400' },
  iso_heavy: { label: 'Iso H', bg: 'bg-orange-600' },
  maxday: { label: 'Max', bg: 'bg-rose-500' },
  speed: { label: 'Speed', bg: 'bg-violet-500' },
  other: { label: 'AW', bg: 'bg-amber-500' },
};

// ─── data read helpers ───────────────────────────────────────────────────────

function getAwData(ex, allProgressions) {
  const { _type, exercise_id, _baseId, _slotKey, _speedCfg, _refW, _refAnas, _refFlavio } = ex;
  const ref = String(_refW ?? '');
  if (_type === 'iso_light' || _type === 'iso_heavy') {
    const slot = allProgressions?.[exercise_id]?.[_slotKey] || {};
    return {
      anasC: !!slot?.anas?.completed, flavioC: !!slot?.flavio?.completed,
      anasW: slot?.anas?.weight || ref, flavioW: slot?.flavio?.weight || ref
    };
  }
  if (_type === 'speed') {
    const cfgData = allProgressions?.[_baseId]?.[_speedCfg] || {};
    return {
      anasC: !!cfgData?.anas?.completed, flavioC: !!cfgData?.flavio?.completed,
      anasW: cfgData?.anas?.weight || ref, flavioW: cfgData?.flavio?.weight || ref
    };
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
  return {
    anasC: !!prog?.anas?.completed, flavioC: !!prog?.flavio?.completed,
    anasW: prog?.anas?.weight ?? '', flavioW: prog?.flavio?.weight ?? ''
  };
}

function getStrengthActiveWeekIdx(prog) {
  const monthIdx = getActiveMonth(prog);
  const month = prog?.dataByMonth?.[monthIdx - 1] || [];
  let wi = month.findIndex(w => !w?.anas?.completed || !w?.flavio?.completed);
  return { monthIdx, wi: wi === -1 ? Math.max(0, month.length - 1) : wi };
}

function TodaySection({ accent, title, subtitle, open, onToggle, children }) {
  return (
    <div className="flex flex-col min-h-0 border-b border-zinc-100/90 dark:border-zinc-800/50 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
      <button type="button" onClick={onToggle} className="lg:hidden flex items-center justify-between px-3 py-2.5 w-full text-left">
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{title}</span>
        {open ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
      </button>
      <div className={cn('flex flex-col flex-1', !open && 'hidden lg:flex')}>
        <div className="hidden lg:block">
          <TrainingSection accent={accent} title={title} subtitle={subtitle} noBorder />
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function TodayCard({ selectedDay, allProgressions, selectedDate, progressPercent, isToday, onProgressionChange, awProgram }) {
  const saveTimers = useRef({});
  const [mobileOpen, setMobileOpen] = useState({ strength: true, aw: true, hyp: true });
  const toggleMobile = (key) => setMobileOpen(s => ({ ...s, [key]: !s[key] }));

  // ALL hooks unconditionally first
  const exercises = useMemo(
    () => selectedDay?.exercises?.filter(e => e.is_active !== 0) || [],
    [selectedDay]
  );
  const strengthEx = useMemo(() => exercises.filter(e => e.category === 'STRENGTH'), [exercises]);
  const rawAwEx = useMemo(() => exercises.filter(e => e.category === 'AW'), [exercises]);
  const hypEx = useMemo(() => exercises.filter(e => e.category === 'HYPERTROPHY'), [exercises]);

  // Expand AW into individual sub-exercises (iso → 7 rows, speed → 4 rows, etc.)
  const awEx = useMemo(() => expandAwExercises(rawAwEx, allProgressions, awProgram), [rawAwEx, allProgressions, awProgram]);

  const commitProg = useCallback((exerciseId, newProg) => {
    if (onProgressionChange) {
      onProgressionChange(exerciseId, newProg);
      return;
    }
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
      import('canvas-confetti')
        .then(m => m.default({ particleCount: 40, spread: 60, origin: { y: 0.7 }, colors: ['#4f46e5', '#8b5cf6'] }))
        .catch(err => console.warn('[TodayCard] Failed to load confetti:', err));
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
      import('canvas-confetti')
        .then(m => m.default({ particleCount: 30, spread: 50, origin: { y: 0.7 }, colors: ['#10b981', '#34d399'] }))
        .catch(err => console.warn('[TodayCard] Failed to load confetti:', err));
  }, [allProgressions, commitProg]);

  const weightHyper = useCallback((exerciseId, athlete, value) => {
    const prog = allProgressions?.[exerciseId] || {};
    commitProg(exerciseId, { ...prog, [athlete]: { ...prog[athlete], weight: value } });
  }, [allProgressions, commitProg]);

  const repsHyper = useCallback((exerciseId, athlete, value) => {
    const prog = allProgressions?.[exerciseId] || {};
    commitProg(exerciseId, { ...prog, [athlete]: { ...prog[athlete], reps: value } });
  }, [allProgressions, commitProg]);

  // ── Early return AFTER all hooks ───────────────────────────────────────────
  if (!exercises.length) return null;

  const safeDate = selectedDate ? selectedDate.slice(0, 10) : null;
  const dateLabel = safeDate
    ? new Date(safeDate + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    : selectedDay?.day_name || '';

  let rowIdx = 0;

  return (
    <TrainingSurface>
      <TrainingSessionHeader
        title={dateLabel}
        subtitle={isToday ? 'Sessione rapida · Oggi' : 'Sessione rapida'}
        progressPercent={progressPercent}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:divide-x divide-zinc-100/90 dark:divide-zinc-800/50">
        <TodaySection
          accent="strength"
          title="Forza"
          subtitle={`${strengthEx.length} esercizi`}
          open={mobileOpen.strength}
          onToggle={() => toggleMobile('strength')}
        >
          {strengthEx.length > 0 ? strengthEx.map(ex => {
            const prog = allProgressions?.[ex.exercise_id];
            const { monthIdx, wi } = getStrengthActiveWeekIdx(prog);
            const week = prog?.dataByMonth?.[monthIdx - 1]?.[wi] || {};
            rowIdx += 1;
            return (
              <AthleteSessionRow
                key={ex.exercise_id}
                index={rowIdx}
                exerciseName={ex.exercise_name}
                badge={STRENGTH_WEEK_LABELS[wi] || '—'}
                accent="strength"
                anasCompleted={!!week?.anas?.completed}
                flavioCompleted={!!week?.flavio?.completed}
                anasWeight={week?.anas?.weight ?? ''}
                flavioWeight={week?.flavio?.weight ?? ''}
                onAnasToggle={() => toggleStrength(ex.exercise_id, 'anas')}
                onFlavioToggle={() => toggleStrength(ex.exercise_id, 'flavio')}
                onAnasWeight={v => weightStrength(ex.exercise_id, 'anas', v)}
                onFlavioWeight={v => weightStrength(ex.exercise_id, 'flavio', v)}
              />
            );
          }) : (
            <p className="text-xs text-zinc-400 text-center py-8 uppercase tracking-widest">Riposo</p>
          )}
        </TodaySection>

        <TodaySection
          accent="aw"
          title="AW"
          subtitle={`${awEx.length} esercizi`}
          open={mobileOpen.aw}
          onToggle={() => toggleMobile('aw')}
        >
          {awEx.length > 0 ? awEx.map(ex => {
            const { anasC, flavioC, anasW, flavioW } = getAwData(ex, allProgressions);
            const badge = AW_BADGE[ex._type] || AW_BADGE.other;
            rowIdx += 1;
            return (
              <AthleteSessionRow
                key={ex.exercise_id}
                index={rowIdx}
                exerciseName={ex.exercise_name}
                badge={badge.label}
                accent="aw"
                anasCompleted={anasC}
                flavioCompleted={flavioC}
                anasWeight={anasW}
                flavioWeight={flavioW}
                onAnasToggle={() => toggleAw(ex, 'anas')}
                onFlavioToggle={() => toggleAw(ex, 'flavio')}
                onAnasWeight={v => weightAw(ex, 'anas', v)}
                onFlavioWeight={v => weightAw(ex, 'flavio', v)}
              />
            );
          }) : (
            <p className="text-xs text-zinc-400 text-center py-8 uppercase tracking-widest">Riposo</p>
          )}
        </TodaySection>

        <TodaySection
          accent="hyp"
          title="Ipertrofia"
          subtitle={`${hypEx.length} esercizi`}
          open={mobileOpen.hyp}
          onToggle={() => toggleMobile('hyp')}
        >
          {hypEx.length > 0 ? hypEx.map(ex => {
            const prog = allProgressions?.[ex.exercise_id] || {};
            rowIdx += 1;
            return (
              <AthleteSessionRow
                key={ex.exercise_id}
                index={rowIdx}
                exerciseName={ex.exercise_name}
                badge={`${ex.base_sets || 2}×${ex.base_reps || ''}`}
                accent="hyp"
                anasCompleted={!!prog?.anas?.completed}
                flavioCompleted={!!prog?.flavio?.completed}
                anasWeight={prog?.anas?.weight ?? ''}
                flavioWeight={prog?.flavio?.weight ?? ''}
                anasReps={prog?.anas?.reps ?? ''}
                flavioReps={prog?.flavio?.reps ?? ''}
                onAnasToggle={() => toggleHyper(ex.exercise_id, 'anas')}
                onFlavioToggle={() => toggleHyper(ex.exercise_id, 'flavio')}
                onAnasWeight={v => weightHyper(ex.exercise_id, 'anas', v)}
                onFlavioWeight={v => weightHyper(ex.exercise_id, 'flavio', v)}
                onAnasReps={v => repsHyper(ex.exercise_id, 'anas', v)}
                onFlavioReps={v => repsHyper(ex.exercise_id, 'flavio', v)}
              />
            );
          }) : (
            <p className="text-xs text-zinc-400 text-center py-8 uppercase tracking-widest">Riposo</p>
          )}
        </TodaySection>
      </div>
    </TrainingSurface>
  );
}
