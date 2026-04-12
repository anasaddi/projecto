import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, History as HistoryIcon } from 'lucide-react';
import { api } from '../../api/client';
import { Card, ColHeader, ModernInput, ModernCheckbox } from './TrainingUI';

const format1RM = (weight, reps) => {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r) return '-';
  if (r === 1) return `${w.toFixed(1)}`;
  const rm = w * (1 + r / 35);
  return `${(Math.round(rm * 2) / 2).toFixed(1)}`;
};

const HypertrophyTable = ({ exercise, onRowsChange, onProgressionChange, initialRows, expandedOverride = false, initialData }) => {
  const { exercise_id, exercise_name, base_reps } = exercise;
  const [expanded, setExpanded] = useState(expandedOverride);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const defaultData = () => ({
    anas: { w: '', r: base_reps ? String(base_reps) : '', completed: false },
    flavio: { w: '', r: base_reps ? String(base_reps) : '', completed: false },
  });

  const parseInitial = (rows) => {
    if (!rows?.length) return null;
    const anas = rows.find(r => r.set === 1);
    const flavio = rows.find(r => r.set === 2);
    return {
      anas: { w: anas?.weight ?? '', r: anas?.reps ?? (base_reps ? String(base_reps) : ''), completed: !!anas?.checked },
      flavio: { w: flavio?.weight ?? '', r: flavio?.reps ?? (base_reps ? String(base_reps) : ''), completed: !!flavio?.checked },
    };
  };

  const [data, setData] = useState(() => {
    if (initialData) return initialData;
    return parseInitial(initialRows) || defaultData();
  });

  // Persistenza
  useEffect(() => {
    if (!initialData) return;
    const timeout = setTimeout(() => {
      api.training.updateProgression(exercise_id, data);
      onProgressionChange?.(exercise_id, data);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [data, exercise_id]);

  useEffect(() => {
    if (initialRows?.length) {
      const parsed = parseInitial(initialRows);
      if (parsed) setData(parsed);
    }
  }, [exercise_id, initialRows]);

  const upd = (athlete, field, value) => {
    const numericValue = (field === 'w' || field === 'r') && value === '5-8' ? '7' : value;

    setData(prev => {
      const next = { ...prev, [athlete]: { ...prev[athlete], [field]: numericValue } };
      const rows = [
        { set: 1, weight: next.anas.w, reps: next.anas.r, checked: next.anas.completed },
        { set: 2, weight: next.flavio.w, reps: next.flavio.r, checked: next.flavio.completed },
      ];
      onRowsChange?.(exercise_id, rows);
      return next;
    });
  };

  const tog = (athlete) => {
    setData(prev => {
      const next = { ...prev, [athlete]: { ...prev[athlete], completed: !prev[athlete].completed } };
      const rows = [
        { set: 1, weight: next.anas.w, reps: next.anas.r, checked: next.anas.completed },
        { set: 2, weight: next.flavio.w, reps: next.flavio.r, checked: next.flavio.completed },
      ];
      onRowsChange?.(exercise_id, rows);
      return next;
    });
  };

  useEffect(() => {
    if (!expanded || !exercise_id) return;
    setHistoryLoading(true);
    const ctrl = new AbortController();
    fetch(`${import.meta.env.VITE_API_BASE || '/api'}/training/history?exercise_id=${encodeURIComponent(exercise_id)}&limit=12`, { signal: ctrl.signal })
      .then(res => res.json())
      .then(res => setHistory(res?.entries || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
    return () => ctrl.abort();
  }, [expanded, exercise_id]);

  const formatDate = (d) => {
    try { const [y, m, day] = d.split('-'); return `${day}/${m}`; } catch { return d; }
  };

  return (
    <Card className="border-zinc-200/60 dark:border-white/10 group">
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3 flex items-center justify-between cursor-pointer border-b border-zinc-100 dark:border-white/5 transition-all hover:bg-zinc-50 dark:hover:bg-white/[0.01]"
      >
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
            {/* Anas */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all 
                ${data.anas.completed ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-transparent border-transparent'}`}>
              <span className="text-xs font-black text-zinc-400 w-4 text-center">A</span>
              <div className="flex gap-1 flex-1">
                <ModernInput type="number" step="0.5" value={data.anas.w} onChange={v => upd('anas', 'w', v)} placeholder="kg" className="bg-transparent border-0 h-6" />
                <ModernInput type="number" value={data.anas.r} onChange={v => upd('anas', 'r', v)} placeholder="r" className="bg-transparent border-0 h-6" />
              </div>
              <ModernCheckbox checked={data.anas.completed} onChange={() => tog('anas')} />
            </div>

            {/* Flavio */}
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all 
                ${data.flavio.completed ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-transparent border-transparent'}`}>
              <span className="text-xs font-black text-zinc-400 w-4 text-center">F</span>
              <div className="flex gap-1 flex-1">
                <ModernInput type="number" step="0.5" value={data.flavio.w} onChange={v => upd('flavio', 'w', v)} placeholder="kg" className="bg-transparent border-0 h-6" />
                <ModernInput type="number" value={data.flavio.r} onChange={v => upd('flavio', 'r', v)} placeholder="r" className="bg-transparent border-0 h-6" />
              </div>
              <ModernCheckbox checked={data.flavio.completed} onChange={() => tog('flavio')} />
            </div>
          </div>
        ) : (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
            {/* Extended Inputs */}
            <div className="grid grid-cols-2 gap-4 px-2 py-4 border-b border-zinc-100 dark:border-white/5 mb-4">
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Anas Performance</div>
                <div className="flex items-center gap-2">
                  <ModernInput type="number" step="0.5" value={data.anas.w} onChange={v => upd('anas', 'w', v)} placeholder="Weight" />
                  <ModernInput type="number" value={data.anas.r} onChange={v => upd('anas', 'r', v)} placeholder="Reps" />
                  <ModernCheckbox checked={data.anas.completed} onChange={() => tog('anas')} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Flavio Performance</div>
                <div className="flex items-center gap-2">
                  <ModernInput type="number" step="0.5" value={data.flavio.w} onChange={v => upd('flavio', 'w', v)} placeholder="Weight" />
                  <ModernInput type="number" value={data.flavio.r} onChange={v => upd('flavio', 'r', v)} placeholder="Reps" />
                  <ModernCheckbox checked={data.flavio.completed} onChange={() => tog('flavio')} />
                </div>
              </div>
            </div>

            {historyLoading ? (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-400 uppercase tracking-widest">No training history available</div>
            ) : (
              <div className="space-y-3 px-2 pb-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-[0.15em]">Analytics History</span>
                  <div className="flex gap-4">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">W/R Ratio</span>
                  </div>
                </div>

                <div className="h-20 w-full relative mb-6">
                  <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    {(() => {
                      const valid = [...history].reverse().slice(-10);
                      if (valid.length < 2) return null;
                      const maxW = Math.max(...valid.map(v => v.weight_kg || 1));
                      const minW = Math.min(...valid.map(v => v.weight_kg || 0));
                      const range = Math.max(maxW - minW, 1);

                      const ptsAnas = valid.map((v, i) => {
                        const x = (i / (valid.length - 1)) * 100;
                        const y = 100 - (((v.weight_kg || 0) - minW) / range) * 85;
                        return `${x}%,${y}%`;
                      }).join(' ');

                      return (
                        <>
                          <polyline fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={ptsAnas} className="text-indigo-500 drop-shadow-[0_0_8px_rgba(79,70,229,0.3)]" />
                          {valid.map((v, i) => {
                            const x = (i / (valid.length - 1)) * 100;
                            const y = 100 - (((v.weight_kg || 0) - minW) / range) * 85;
                            return <circle key={i} cx={`${x}%`} cy={`${y}%`} r="3" className="fill-indigo-500" />
                          })}
                        </>
                      )
                    })()}
                  </svg>
                </div>

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
};

export default HypertrophyTable;
