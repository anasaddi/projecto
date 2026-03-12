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
    <Card className="border-0 bg-white dark:bg-[#151718] rounded-[24px] overflow-hidden shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3.5 flex flex-col items-center justify-center cursor-pointer border-b border-transparent dark:border-white/5 transition-colors hover:bg-black/5 dark:hover:bg-white/[0.02]"
      >
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-[13px] font-black tracking-widest text-gray-900 dark:text-zinc-100 uppercase text-center">{exercise_name}</h3>
        </div>
      </div>

      <div className="p-3 pt-0">
        {!expanded ? (
          <div className="mt-3 flex gap-3">
            <div className="w-[30px] flex flex-col pt-[26px]">
              <div className="flex-1 flex items-center justify-center">
                <div className="w-full h-8 bg-amber-500/10 dark:bg-[#422e1b] rounded-lg border border-amber-500/20 dark:border-[#eea75e]/10 flex items-center justify-center shadow-sm">
                  <span className="text-[11px] font-black text-amber-600 dark:text-[#eea75e]">2x</span>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-1 relative">
              <div className="sticky top-0 z-10 grid grid-cols-[2.2rem_1fr_1fr_2.2rem] gap-2 px-1 pb-1 bg-white/95 dark:bg-[#151718]/95 backdrop-blur-sm pt-1">
                <div className="text-center"><ColHeader label="S" /></div>
                <div className="text-center"><ColHeader label="KG" /></div>
                <div className="text-center"><ColHeader label="R" /></div>
                <div className="text-center"><ColHeader label="✓" /></div>
              </div>

              <div className="space-y-1.5">
                <div className={`grid grid-cols-[2.2rem_1fr_1fr_2.2rem] gap-2 items-center p-1 rounded-2xl border transition-all h-11 
                    ${data.anas.completed ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30' : 'bg-gray-50/80 dark:bg-[#1a1b1e] border-gray-200/50 dark:border-white/5'}`}>
                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                      <span className="text-[10px] font-bold text-white">A</span>
                    </div>
                  </div>
                  <ModernInput
                    type="number" step="0.5" value={data.anas.w} onChange={e => upd('anas', 'w', e.target.value)}
                    className="h-8 border-transparent bg-white/60 dark:bg-[#25262b] shadow-inner text-[13px]" placeholder="kg"
                  />
                  <div className="relative">
                    <ModernInput
                      type="number" value={data.anas.r} onChange={e => upd('anas', 'r', e.target.value)}
                      className="h-8 border-transparent bg-white/60 dark:bg-[#25262b] shadow-inner text-[13px]" placeholder="r"
                    />
                    {base_reps && !data.anas.r && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-400/50 pointer-events-none">{base_reps}</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <ModernCheckbox checked={data.anas.completed} onChange={(e) => {
                      tog('anas');
                      if (e.target.checked) import('canvas-confetti').then(m => m.default({ particleCount: 30, spread: 50, origin: { y: 0.8 } }));
                    }} colorClass="accent-emerald-500" />
                  </div>
                </div>

                <div className={`grid grid-cols-[2.2rem_1fr_1fr_2.2rem] gap-2 items-center p-1 rounded-2xl border transition-all h-11 
                    ${data.flavio.completed ? 'bg-emerald-50/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-500/30' : 'bg-gray-50/80 dark:bg-[#1a1b1e] border-gray-200/50 dark:border-white/5'}`}>
                  <div className="flex justify-center">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                      <span className="text-[10px] font-bold text-white">F</span>
                    </div>
                  </div>
                  <ModernInput
                    type="number" step="0.5" value={data.flavio.w} onChange={e => upd('flavio', 'w', e.target.value)}
                    className="h-8 border-transparent bg-white/60 dark:bg-[#25262b] shadow-inner text-[13px]" placeholder="kg"
                  />
                  <div className="relative">
                    <ModernInput
                      type="number" value={data.flavio.r} onChange={e => upd('flavio', 'r', e.target.value)}
                      className="h-8 border-transparent bg-white/60 dark:bg-[#25262b] shadow-inner text-[13px]" placeholder="r"
                    />
                    {base_reps && !data.flavio.r && (
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-400/50 pointer-events-none">{base_reps}</span>
                    )}
                  </div>
                  <div className="flex justify-center">
                    <ModernCheckbox checked={data.flavio.completed} onChange={(e) => {
                      tog('flavio');
                      if (e.target.checked) import('canvas-confetti').then(m => m.default({ particleCount: 30, spread: 50, origin: { y: 0.8 }, colors: ['#10b981', '#34d399'] }));
                    }} colorClass="accent-emerald-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3">
            {historyLoading ? (
              <div className="py-4 text-center">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="py-4 text-center text-[10px] text-gray-400">Nessuno storico</div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                {history.length > 1 && (
                  <div className="w-full h-12 relative px-2 mb-2 select-none pointer-events-none">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      {(() => {
                        const valid = [...history].reverse().slice(-10);
                        if (valid.length < 2) return null;
                        const maxW = Math.max(...valid.map(v => v.weight_kg || 1));
                        const minW = Math.min(...valid.map(v => v.weight_kg || 0));
                        const range = Math.max(maxW - minW, 1);

                        const ptsAnas = valid.map((v, i) => {
                          const x = (i / (valid.length - 1)) * 100;
                          const y = 100 - (((v.weight_kg || 0) - minW) / range) * 80;
                          return `${x}%,${y}%`;
                        }).join(' ');

                        return (
                          <>
                            <polyline fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={ptsAnas} className="text-blue-500/50 dark:text-blue-400/50 drop-shadow-md" />
                            {valid.map((v, i) => {
                              const x = (i / (valid.length - 1)) * 100;
                              const y = 100 - (((v.weight_kg || 0) - minW) / range) * 80;
                              return <circle key={i} cx={`${x}%`} cy={`${y}%`} r="2.5" className="fill-blue-500 dark:fill-blue-400" />
                            })}
                          </>
                        )
                      })()}
                    </svg>
                    <div className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-zinc-700 to-transparent" />
                  </div>
                )}

                <div className="grid grid-cols-[4rem_1fr] gap-2 px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-zinc-800">
                  <div>Data</div>
                  <div className="flex justify-around text-center text-gray-500">
                    <span>Performance (KG x R)</span>
                  </div>
                </div>
                {history.map((e, i) => (
                  <div key={i} className="grid grid-cols-[4rem_1fr] gap-2 items-center px-2 py-2 text-[10px] bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="font-medium text-gray-500">{formatDate(e.date)}</div>
                    <div className="flex gap-2 justify-around">
                      <div className="flex gap-1.5">
                        <span className="w-12 py-1 bg-blue-50/50 dark:bg-blue-900/20 rounded font-semibold text-gray-700 dark:text-gray-300 text-center">{e.weight_kg ?? '-'} kg</span>
                        <span className="w-10 py-1 bg-blue-50/50 dark:bg-blue-900/20 rounded font-semibold text-gray-700 dark:text-gray-300 text-center">{e.reps ?? '-'} r</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Card>
  );
};

export default HypertrophyTable;
