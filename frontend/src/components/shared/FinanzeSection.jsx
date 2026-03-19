import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Icons = {
  Euro: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 10h12M4 14h9m-9 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8m12 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8" /></svg>,
  Plus: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Trash: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  ChevronDown: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9" /></svg>,
  ChevronUp: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="18 15 12 9 6 15" /></svg>,
};

const IMPONIBILE_RATE = 0.67;
const INPS_RATE = 0.2607;
const IMPOSTA_SOSTITUTIVA_RATE = 0.05;

function fmtNum(n) {
  if (n == null || isNaN(n)) return '0';
  return Number(n).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function computeBonifico(cifra, splitAnas = 50, splitOthman = 50) {
  const cifraNum = Number(cifra) || 0;
  const imponibile = cifraNum * IMPONIBILE_RATE;
  const inps = imponibile * INPS_RATE;
  const impostaSostitutiva = imponibile * IMPOSTA_SOSTITUTIVA_RATE;
  const tasse = inps + impostaSostitutiva;
  const netto = cifraNum - tasse;
  const totSplit = (Number(splitAnas) || 0) + (Number(splitOthman) || 0) || 1;
  const nettoAnas = netto * ((Number(splitAnas) || 0) / totSplit);
  const nettoOthman = netto * ((Number(splitOthman) || 0) / totSplit);
  return {
    cifra: cifraNum,
    imponibile,
    inps,
    impostaSostitutiva,
    tasse,
    netto,
    nettoAnas,
    nettoOthman,
    splitAnas: Number(splitAnas) || 50,
    splitOthman: Number(splitOthman) || 50
  };
}

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}

function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function computeSaldi(bonifici) {
  let totAnas = 0;
  let totOthman = 0;
  bonifici.forEach((b) => {
    const calc = b.imponibile != null ? b : computeBonifico(b.cifra, b.splitAnas ?? 50, b.splitOthman ?? 50);
    totAnas += calc.nettoAnas || 0;
    totOthman += calc.nettoOthman || 0;
  });
  const diff = totAnas - totOthman;
  return { totAnas, totOthman, totale: totAnas + totOthman, diff };
}

export default function FinanzeSection({ bonifici = [], onUpdate, disabled, defaultCollapsed = true }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [cifraInput, setCifraInput] = useState('');
  const [dateInput, setDateInput] = useState(toDateKey());
  const [splitAnas, setSplitAnas] = useState(50);
  const [splitOthman, setSplitOthman] = useState(50);

  const saldi = useMemo(() => computeSaldi(bonifici), [bonifici]);

  const addBonifico = () => {
    const cifra = parseFloat(String(cifraInput).replace(',', '.')) || 0;
    if (cifra <= 0) return;
    const calc = computeBonifico(cifra, splitAnas, splitOthman);
    const newEntry = {
      id: uid('bon'),
      date: dateInput,
      ...calc
    };
    onUpdate([newEntry, ...bonifici]);
    setCifraInput('');
    setDateInput(toDateKey());
  };

  const removeBonifico = (id) => {
    onUpdate(bonifici.filter((b) => b.id !== id));
  };

  const sortedBonifici = [...bonifici].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="mt-8 w-full rounded-2xl overflow-hidden border border-emerald-200/60 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 shadow-lg shadow-emerald-500/5">
      {/* Header compattabile */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/5 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shadow-sm">
            <Icons.Euro className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-100">
              Finanze · Regime Forfettario
            </h2>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {bonifici.length} bonifici · Totale netto {fmtNum(saldi.totale)} €
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Saldi sempre visibili */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">ANAS spetta</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{fmtNum(saldi.totAnas)} €</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400">OTHMAN spetta</p>
              <p className="text-sm font-bold text-teal-700 dark:text-teal-300">{fmtNum(saldi.totOthman)} €</p>
            </div>
            {Math.abs(saldi.diff) > 0.01 && (
              <div className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-200/50 dark:border-amber-500/30">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  {saldi.diff > 0 ? 'OTHMAN → ANAS' : 'ANAS → OTHMAN'} {fmtNum(Math.abs(saldi.diff))} €
                </p>
              </div>
            )}
          </div>
          <span className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
            {collapsed ? <Icons.ChevronDown className="w-4 h-4" /> : <Icons.ChevronUp className="w-4 h-4" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-0 space-y-5 border-t border-emerald-200/40 dark:border-emerald-500/10">
              {/* Saldi mobile / dettaglio */}
              <div className="sm:hidden grid grid-cols-3 gap-3 pt-4">
                <div className="rounded-xl p-3 bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20">
                  <p className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">ANAS</p>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">{fmtNum(saldi.totAnas)} €</p>
                </div>
                <div className="rounded-xl p-3 bg-teal-500/10 border border-teal-200/50 dark:border-teal-500/20">
                  <p className="text-[10px] font-bold uppercase text-teal-600 dark:text-teal-400">OTHMAN</p>
                  <p className="text-base font-bold text-teal-700 dark:text-teal-300">{fmtNum(saldi.totOthman)} €</p>
                </div>
                <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20">
                  <p className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Da regolare</p>
                  <p className="text-base font-bold text-amber-700 dark:text-amber-300">
                    {Math.abs(saldi.diff) > 0.01 ? fmtNum(Math.abs(saldi.diff)) + ' €' : 'Pari'}
                  </p>
                  {Math.abs(saldi.diff) > 0.01 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                      {saldi.diff > 0 ? 'OTHMAN → ANAS' : 'ANAS → OTHMAN'}
                    </p>
                  )}
                </div>
              </div>

              {/* Form aggiungi bonifico */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Data</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Cifra €</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cifraInput}
                    onChange={(e) => setCifraInput(e.target.value.replace(/[^\d,.-]/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && addBonifico()}
                    disabled={disabled}
                    placeholder="15000"
                    className="w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">ANAS %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={splitAnas}
                    onChange={(e) => { const v = parseInt(e.target.value, 10) || 0; setSplitAnas(v); setSplitOthman(100 - v); }}
                    disabled={disabled}
                    className="w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">OTHMAN %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={splitOthman}
                    onChange={(e) => { const v = parseInt(e.target.value, 10) || 0; setSplitOthman(v); setSplitAnas(100 - v); }}
                    disabled={disabled}
                    className="w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addBonifico}
                    disabled={disabled || !cifraInput}
                    className="w-full py-2.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Icons.Plus className="w-4 h-4" />
                    Aggiungi
                  </button>
                </div>
              </div>

              {/* Lista bonifici */}
              <div className="space-y-2 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
                <AnimatePresence initial={false}>
                  {sortedBonifici.map((b) => {
                    const calc = b.imponibile != null ? b : computeBonifico(b.cifra, b.splitAnas ?? 50, b.splitOthman ?? 50);
                    const dateFmt = b.date ? new Date(b.date + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
                    return (
                      <motion.div
                        key={b.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50 hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-colors"
                      >
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-20 shrink-0">{dateFmt}</span>
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{fmtNum(calc.cifra)} €</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">→</span>
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">ANAS {fmtNum(calc.nettoAnas)} €</span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-sm font-semibold text-teal-600 dark:text-teal-400">OTHMAN {fmtNum(calc.nettoOthman)} €</span>
                        <span className="text-[10px] text-red-500 dark:text-red-400 ml-auto">Tasse {fmtNum(calc.tasse)} €</span>
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => removeBonifico(b.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0"
                          >
                            <Icons.Trash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {sortedBonifici.length === 0 && (
                  <div className="py-10 text-center text-gray-400 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <Icons.Euro className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Nessun bonifico</p>
                    <p className="text-xs">Aggiungi il primo con il form sopra</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { computeBonifico, fmtNum, computeSaldi, Icons };
