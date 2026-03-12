import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, History as HistoryIcon } from 'lucide-react';
import { api } from '../../api/client';
import { Card, ColHeader, ModernInput, ModernCheckbox, AthleteAvatar } from './TrainingUI';

const format1RM = (weight, reps) => {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r) return '-';
  if (r === 1) return `${w.toFixed(1)}`;
  const rm = w * (1 + r / 35);
  return `${(Math.round(rm * 2) / 2).toFixed(1)}`;
};

const ExerciseTable = ({ exercise, onRowsChange, expandedOverride = false, initialData }) => {
  const { exercise_id, exercise_name, base_sets = 4, base_reps, instruction } = exercise;
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

  // Persistenza
  useEffect(() => {
    if (!initialData) return;
    const timeout = setTimeout(() => {
      api.training.updateProgression(exercise_id, { rows });
    }, 1000);
    return () => clearTimeout(timeout);
  }, [rows, exercise_id]);

  const updateRow = (id, athlete, field, value) => setRows(prev => prev.map(r => r.id === id ? { ...r, [athlete]: { ...r[athlete], [field]: value } } : r));
  const toggleCheck = (id, athlete) => setRows(prev => prev.map(r => r.id === id ? { ...r, [athlete]: { ...r[athlete], checked: !r[athlete].checked } } : r));

  const currentRow = rows.find(r => r.set === currentSet);

  return (
    <Card className="border-amber-100 dark:border-amber-900/30">
      <div
        onClick={() => setExpanded(!expanded)}
        className="px-4 py-3 flex flex-col items-center justify-center cursor-pointer bg-gradient-to-b from-amber-50/50 to-transparent dark:from-amber-500/10 dark:to-transparent border-b border-gray-100 dark:border-zinc-800/80"
      >
        <div className="flex flex-col items-center gap-1">
          <h3 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-widest text-center">{exercise_name}</h3>
          {instruction && <p className="text-[10px] text-gray-500 text-center">{instruction}</p>}
          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-100/50 dark:bg-amber-500/20 px-1.5 py-0.5 rounded">
            {base_sets} Serie {base_reps ? `× ${base_reps}` : ''}
          </span>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!expanded && currentRow ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800/80">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-1 bg-gray-100/50 dark:bg-zinc-800/50 p-1 rounded-xl">
                  {rows.map(r => (
                    <button key={r.id} onClick={() => setCurrentSet(r.set)} className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentSet === r.set ? 'bg-white dark:bg-zinc-700 shadow-sm text-amber-600 dark:text-amber-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {r.set}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-6">
                  {/* Anas */}
                  <div className="flex items-center gap-2 bg-blue-50/30 dark:bg-blue-900/10 p-2 rounded-xl border border-blue-100/50 dark:border-blue-800/30 relative">
                    <AthleteAvatar initial="A" colorClass="bg-blue-500" />
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="kg" />
                      <ModernInput type="number" step="0.5" value={currentRow.anas.weight} onChange={e => updateRow(currentRow.id, 'anas', 'weight', e.target.value)} className="w-14 py-1.5" placeholder="kg" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="r" />
                      <ModernInput type="number" value={currentRow.anas.reps} onChange={e => updateRow(currentRow.id, 'anas', 'reps', e.target.value)} className="w-12 py-1.5" placeholder="r" />
                    </div>
                    <ModernCheckbox checked={currentRow.anas.checked} onChange={() => toggleCheck(currentRow.id, 'anas')} colorClass="accent-amber-500" />
                    <div className="absolute -top-2.5 right-2 bg-blue-100 dark:bg-blue-900/50 text-[8px] font-bold text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">{format1RM(currentRow.anas.weight, currentRow.anas.reps)}</div>
                  </div>
                  {/* Flavio */}
                  <div className="flex items-center gap-2 bg-emerald-50/30 dark:bg-emerald-900/10 p-2 rounded-xl border border-emerald-100/50 dark:border-emerald-800/30 relative">
                    <AthleteAvatar initial="F" colorClass="bg-emerald-500" />
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="kg" />
                      <ModernInput type="number" step="0.5" value={currentRow.flavio.weight} onChange={e => updateRow(currentRow.id, 'flavio', 'weight', e.target.value)} className="w-14 py-1.5" placeholder="kg" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="r" />
                      <ModernInput type="number" value={currentRow.flavio.reps} onChange={e => updateRow(currentRow.id, 'flavio', 'reps', e.target.value)} className="w-12 py-1.5" placeholder="r" />
                    </div>
                    <ModernCheckbox checked={currentRow.flavio.checked} onChange={() => toggleCheck(currentRow.id, 'flavio')} colorClass="accent-amber-500" />
                    <div className="absolute -top-2.5 right-2 bg-emerald-100 dark:bg-emerald-900/50 text-[8px] font-bold text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-full">{format1RM(currentRow.flavio.weight, currentRow.flavio.reps)}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-gray-100 dark:border-zinc-800/80">
            <div className="p-2 space-y-1">
              <div className="grid grid-cols-[2rem_3.5rem_auto_auto] gap-4 px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider justify-between">
                <div className="text-center">Set</div>
                <div className="text-center">S</div>
                <div className="w-[160px] text-center text-blue-500">Anas</div>
                <div className="w-[160px] text-center text-emerald-500">Flavio</div>
              </div>
              {rows.map(r => (
                <div key={r.id} className="grid grid-cols-[2rem_3.5rem_auto_auto] gap-4 items-center px-2 py-2 bg-gray-50/50 dark:bg-zinc-800/30 rounded-xl hover:bg-gray-100/50 dark:hover:bg-zinc-800/50 transition-colors justify-between">
                  <div className="text-center font-bold text-gray-700 dark:text-gray-300 text-xs">{r.set}</div>
                  <div className="text-center text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-900/30 rounded px-1 py-0.5">{base_sets}x{base_reps || '—'}</div>

                  <div className="w-[160px] flex gap-1.5 justify-center items-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="kg" />
                      <ModernInput type="number" step="0.5" value={r.anas.weight} onChange={e => updateRow(r.id, 'anas', 'weight', e.target.value)} className="w-12 py-1" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="r" />
                      <ModernInput type="number" value={r.anas.reps} onChange={e => updateRow(r.id, 'anas', 'reps', e.target.value)} className="w-10 py-1" />
                    </div>
                    <ModernCheckbox checked={r.anas.checked} onChange={() => toggleCheck(r.id, 'anas')} colorClass="accent-amber-500" />
                    <span className="w-8 text-[9px] font-bold text-gray-400 text-right">{format1RM(r.anas.weight, r.anas.reps)}</span>
                  </div>

                  <div className="w-[160px] flex gap-1.5 justify-center items-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="kg" />
                      <ModernInput type="number" step="0.5" value={r.flavio.weight} onChange={e => updateRow(r.id, 'flavio', 'weight', e.target.value)} className="w-12 py-1" />
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <ColHeader label="r" />
                      <ModernInput type="number" value={r.flavio.reps} onChange={e => updateRow(r.id, 'flavio', 'reps', e.target.value)} className="w-10 py-1" />
                    </div>
                    <ModernCheckbox checked={r.flavio.checked} onChange={() => toggleCheck(r.id, 'flavio')} colorClass="accent-amber-500" />
                    <span className="w-8 text-[9px] font-bold text-gray-400 text-right">{format1RM(r.flavio.weight, r.flavio.reps)}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

export default ExerciseTable;
