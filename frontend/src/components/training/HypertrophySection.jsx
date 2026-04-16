import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Dumbbell, History as HistoryIcon, ChevronUp } from 'lucide-react';
import { api } from '../../api/client';
import { Card } from './TrainingUI';

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

const strVal = (v) => {
  if (v === null || v === undefined || v === 0 || v === '0') return '';
  return String(v);
};

const buildDefault = (baseReps) => ({
  anas:   { w: '', r: baseReps ? String(baseReps) : '', completed: false },
  flavio: { w: '', r: baseReps ? String(baseReps) : '', completed: false },
});

const parseRows = (rows, baseReps) => {
  if (!rows?.length) return null;
  const a = rows.find(r => r.set === 1);
  const f = rows.find(r => r.set === 2);
  return {
    anas:   { w: strVal(a?.weight), r: strVal(a?.reps)   || (baseReps ? String(baseReps) : ''), completed: !!a?.checked },
    flavio: { w: strVal(f?.weight), r: strVal(f?.reps)   || (baseReps ? String(baseReps) : ''), completed: !!f?.checked },
  };
};

const normEntry = (e, baseReps) => e ? {
  w: strVal(e.weight ?? e.w),
  r: strVal(e.reps ?? e.r) || (baseReps ? String(baseReps) : ''),
  completed: !!e.completed,
} : null;

const resolveData = ({ initialRows, initialData, baseReps }) => {
  const fb = buildDefault(baseReps);
  if (initialData?.anas || initialData?.flavio) {
    return {
      anas:   normEntry(initialData.anas,   baseReps) || fb.anas,
      flavio: normEntry(initialData.flavio, baseReps) || fb.flavio,
    };
  }
  return parseRows(initialRows, baseReps) || fb;
};

// Input inline minimale
function TinyInput({ value, onChange, placeholder, accentFocus }) {
  return (
    <input
      type="text"
      inputMode="decimal"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`h-8 w-full rounded-lg border border-zinc-200 bg-white px-2 text-center text-xs font-semibold text-zinc-900 outline-none transition-colors dark:border-zinc-700/70 dark:bg-zinc-950/70 dark:text-zinc-100 ${accentFocus}`}
    />
  );
}

// Checkbox minimale
function TinyCheck({ checked, onChange, accent }) {
  const color = accent === 'blue'
    ? checked ? 'bg-blue-500 border-blue-500'   : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600'
    :           checked ? 'bg-emerald-500 border-emerald-500' : 'bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-600';
  return (
    <button
      type="button"
      onClick={onChange}
      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${color}`}
    >
      {checked && (
        <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
          <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}

function ExerciseRow({ exercise, index, onRowsChange, onProgressionChange, initialRows, initialData, isOdd }) {
  const { exercise_id, exercise_name, base_sets, base_reps } = exercise;
  const [data, setData]       = useState(() => resolveData({ initialRows, initialData, baseReps: base_reps }));
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory]   = useState([]);
  const [histLoading, setHistLoading] = useState(false);
  const didMount = useRef(false);

  useEffect(() => {
    if (initialData?.anas || initialData?.flavio) return;
    setData(resolveData({ initialRows, initialData, baseReps: base_reps }));
  }, [exercise_id, initialRows, initialData, base_reps]);

  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const t = setTimeout(() => {
      const payload = {
        anas:   { weight: data.anas.w,   reps: data.anas.r,   completed: data.anas.completed },
        flavio: { weight: data.flavio.w, reps: data.flavio.r, completed: data.flavio.completed },
      };
      api.training.updateProgression(exercise_id, payload);
      onProgressionChange?.(exercise_id, payload);
    }, 700);
    return () => clearTimeout(t);
  }, [data, exercise_id, onProgressionChange]);

  const syncRows = (next) => {
    onRowsChange?.(exercise_id, [
      { set: 1, weight: next.anas.w,   reps: next.anas.r,   checked: next.anas.completed },
      { set: 2, weight: next.flavio.w, reps: next.flavio.r, checked: next.flavio.completed },
    ]);
  };

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
    if (!expanded || !exercise_id) return;
    setHistLoading(true);
    api.training.getHistory(exercise_id, 10)
      .then(r => { setHistory(r?.entries || []); })
      .catch(() => setHistory([]))
      .finally(() => setHistLoading(false));
  }, [expanded, exercise_id]);

  const schemaLabel = `${base_sets || 2}×`;
  const doneA = data.anas.completed;
  const doneF = data.flavio.completed;
  const bothDone = doneA && doneF;

  return (
    <>
      <div className={`grid items-center gap-x-3 px-4 py-3 transition-colors
        grid-cols-[1.5rem_minmax(0,1fr)_3.5rem_4.2rem_4.2rem_1.75rem_4.2rem_4.2rem_1.75rem_1.75rem]
        ${isOdd ? 'bg-zinc-50/60 dark:bg-white/[0.02]' : 'bg-white dark:bg-transparent'}
        ${bothDone ? 'bg-emerald-50/60 dark:bg-emerald-950/10' : ''}
      `}>
        {/* Index */}
        <div className="flex items-center justify-center">
          <span className="text-xs font-black text-zinc-400 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
        </div>

        {/* Nome */}
        <div className="min-w-0 flex flex-col items-center justify-center text-center">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate w-full leading-tight">{shortenName(exercise_name)}</div>
          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 uppercase tracking-widest leading-none">{schemaLabel}</div>
        </div>

        {/* A label */}
        <div className="flex items-center justify-center">
          <div className={`w-10 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm transition-all ${doneA ? 'bg-blue-500 text-white scale-110' : 'bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-500/20'}`}>ANAS</div>
        </div>
        {/* A kg */}
        <div className="flex items-center justify-center">
          <TinyInput value={data.anas.w}   onChange={v => upd('anas', 'w', v)} placeholder="kg" accentFocus="" />
        </div>
        {/* A rep */}
        <div className="flex items-center justify-center">
          <TinyInput value={data.anas.r}   onChange={v => upd('anas', 'r', v)} placeholder="r" accentFocus="" />
        </div>
        {/* A check */}
        <div className="flex items-center justify-center">
          <TinyCheck checked={doneA} onChange={() => tog('anas')} accent="blue" />
        </div>

        {/* F label */}
        <div className="flex items-center justify-center">
          <div className={`w-10 h-7 rounded-lg flex items-center justify-center text-xs font-black shadow-sm transition-all ${doneF ? 'bg-emerald-500 text-white scale-110' : 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'}`}>FLAVIO</div>
        </div>
        {/* F kg */}
        <div className="flex items-center justify-center">
          <TinyInput value={data.flavio.w} onChange={v => upd('flavio', 'w', v)} placeholder="kg" accentFocus="" />
        </div>
        {/* F rep */}
        <div className="flex items-center justify-center">
          <TinyInput value={data.flavio.r} onChange={v => upd('flavio', 'r', v)} placeholder="r" accentFocus="" />
        </div>
        {/* F check */}
        <div className="flex items-center justify-center">
          <TinyCheck checked={doneF} onChange={() => tog('flavio')} accent="emerald" />
        </div>

        {/* Storico toggle */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={() => setExpanded(p => !p)}
            className="p-1 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-center"
          >
            {expanded ? <ChevronUp size={13} /> : <HistoryIcon size={13} />}
          </button>
        </div>
      </div>

      {/* Storico espandibile */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
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
    </>
  );
}

export default function HypertrophySection({ exercises, onRowsChange, onProgressionChange, setsByExercise, allProgressions }) {
  if (!exercises?.length) return null;

  return (
    <section className="min-w-0">
      <Card className="min-w-0">
        {/* Header */}
        <div className="flex flex-col items-center justify-center px-4 py-3 border-b border-gray-100 dark:border-zinc-800/80 bg-gradient-to-b from-emerald-50/50 to-transparent dark:from-emerald-500/10 dark:to-transparent">
          <div className="flex flex-col items-center gap-1">
            <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest">Ipertrofia & Accessori</h3>
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded">Isolamento e volume</p>
          </div>
        </div>
        {/* Righe header */}
        <div className="hidden md:grid items-center gap-x-3 text-xs font-black uppercase tracking-[0.15em] text-zinc-400
          grid-cols-[1.5rem_minmax(0,1fr)_3.5rem_4.2rem_4.2rem_1.75rem_4.2rem_4.2rem_1.75rem_1.75rem]
          px-4 py-2 border-b border-gray-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-white/[0.01]"
        >
          <span />
          <span />
          <div className="flex justify-center items-center gap-1.5 py-1 px-2 rounded-lg bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20">
            <span className="text-blue-600 dark:text-blue-400">ANAS</span>
          </div>
          <span className="text-center">Kg</span>
          <span className="text-center">Rep</span>
          <span className="text-center">✓</span>
          <div className="flex justify-center items-center gap-1.5 py-1 px-2 rounded-lg bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-emerald-600 dark:text-emerald-400">FLAVIO</span>
          </div>
          <span className="text-center">Kg</span>
          <span className="text-center">Rep</span>
          <span className="text-center">✓</span>
        </div>

        {/* Righe esercizi */}
        <div className="divide-y divide-gray-100 dark:divide-zinc-800/30">
          {exercises.map((ex, idx) => (
            <ExerciseRow
              key={ex.exercise_id}
              index={idx}
              exercise={ex}
              isOdd={idx % 2 !== 0}
              onRowsChange={onRowsChange}
              onProgressionChange={onProgressionChange}
              initialRows={setsByExercise?.[ex.exercise_id]}
              initialData={allProgressions?.[ex.exercise_id]}
            />
          ))}
        </div>
      </Card>
    </section>
  );
}
