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

function round2(n) {
  if (n == null || isNaN(n)) return 0;
  return Math.round(Number(n) * 100) / 100;
}

function fmtNum(n) {
  if (n == null || isNaN(n)) return '0';
  return round2(n).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function computeBonifico(cifra, nettoAnasInput, nettoFlavioInput, splitAnas = 50, splitOthman = 50) {
  const cifraNum = round2(Number(cifra) || 0);
  const imponibile = round2(cifraNum * IMPONIBILE_RATE);
  const inps = round2(imponibile * INPS_RATE);
  const impostaSostitutiva = round2(imponibile * IMPOSTA_SOSTITUTIVA_RATE);
  const tasse = round2(inps + impostaSostitutiva);
  const netto = round2(cifraNum - tasse);
  const anasVal = nettoAnasInput != null && nettoAnasInput !== '' ? round2(parseFloat(String(nettoAnasInput).replace(',', '.'))) : null;
  const flavioVal = nettoFlavioInput != null && nettoFlavioInput !== '' ? round2(parseFloat(String(nettoFlavioInput).replace(',', '.'))) : null;
  let nettoAnas, nettoFlavio;
  if (anasVal != null && !isNaN(anasVal)) {
    nettoAnas = anasVal;
    nettoFlavio = round2(netto - anasVal);
  } else if (flavioVal != null && !isNaN(flavioVal)) {
    nettoFlavio = flavioVal;
    nettoAnas = round2(netto - flavioVal);
  } else {
    const totSplit = (Number(splitAnas) || 0) + (Number(splitOthman) || 0) || 1;
    nettoAnas = round2(netto * ((Number(splitAnas) || 0) / totSplit));
    nettoFlavio = round2(netto * ((Number(splitOthman) || 0) / totSplit));
  }
  return {
    cifra: cifraNum,
    imponibile,
    inps,
    impostaSostitutiva,
    tasse,
    netto,
    nettoAnas,
    nettoFlavio,
    nettoOthman: nettoFlavio
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
  let totFlavio = 0;
  bonifici.forEach((b) => {
    const calc = b.imponibile != null ? { ...b, nettoFlavio: b.nettoOthman ?? b.nettoFlavio } : computeBonifico(b.cifra, b.nettoAnasInput, b.nettoFlavioInput, b.splitAnas, b.splitOthman);
    totAnas += calc.nettoAnas || 0;
    totFlavio += (calc.nettoFlavio ?? calc.nettoOthman) || 0;
  });
  const diff = totAnas - totFlavio;
  return { totAnas, totFlavio, totale: totAnas + totFlavio, diff };
}

function BonificoTableRow({ b, onUpdateNetto, onRemove, disabled }) {
  const calc = b.imponibile != null ? { ...b, nettoFlavio: b.nettoOthman ?? b.nettoFlavio } : computeBonifico(b.cifra, b.nettoAnasInput, b.nettoFlavioInput, b.splitAnas, b.splitOthman);
  const dateFmt = b.date ? new Date(b.date + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
  const [anasInput, setAnasInput] = useState('');
  const [flavioInput, setFlavioInput] = useState('');
  const nettoTot = calc.netto ?? 0;
  const showAnas = anasInput !== '' ? anasInput : (b.nettoAnas != null ? fmtNum(b.nettoAnas) : fmtNum(calc.nettoAnas));
  const showFlavio = flavioInput !== '' ? flavioInput : (b.nettoFlavio != null || b.nettoOthman != null ? fmtNum(b.nettoFlavio ?? b.nettoOthman) : fmtNum(calc.nettoFlavio ?? calc.nettoOthman ?? 0));

  const handleAnasChange = (val) => {
    setAnasInput(val);
    setFlavioInput('');
    const num = round2(parseFloat(String(val).replace(',', '.')));
    if (!isNaN(num) && nettoTot > 0) {
      onUpdateNetto(b.id, num, round2(nettoTot - num));
    }
  };

  const handleFlavioChange = (val) => {
    setFlavioInput(val);
    setAnasInput('');
    const num = round2(parseFloat(String(val).replace(',', '.')));
    if (!isNaN(num) && nettoTot > 0) {
      onUpdateNetto(b.id, round2(nettoTot - num), num);
    }
  };

  const handleAnasBlur = () => setAnasInput('');
  const handleFlavioBlur = () => setFlavioInput('');

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200/80 dark:border-gray-700/80 bg-white dark:bg-gray-900/60 shadow-sm hover:shadow-md transition-shadow">
      <table className="w-full text-xs">
        <tbody>
          <tr>
            <td colSpan={2} className="text-center py-1.5 text-gray-500 dark:text-gray-400 font-medium text-[11px]">
              {dateFmt}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="bg-indigo-600 dark:bg-indigo-700 text-white text-center py-2 text-base font-bold">
              {fmtNum(calc.cifra)} €
            </td>
          </tr>
          <tr className="border-t border-gray-100 dark:border-gray-800/80">
            <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 text-[11px]">Imponibile 67%</td>
            <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{fmtNum(calc.imponibile)}</td>
          </tr>
          <tr>
            <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 text-[11px]">INPS 26,07%</td>
            <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{fmtNum(calc.inps)}</td>
          </tr>
          <tr>
            <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400 text-[11px]">Imposta sost. 5%</td>
            <td className="px-2 py-1.5 text-right font-semibold tabular-nums">{fmtNum(calc.impostaSostitutiva)}</td>
          </tr>
          <tr>
            <td className="px-2 py-1.5 bg-emerald-600 dark:bg-emerald-700 text-white font-bold text-[11px]">NETTO</td>
            <td className="px-2 py-1.5 bg-rose-600 dark:bg-rose-700 text-white font-bold text-[11px] text-right">TASSE</td>
          </tr>
          <tr>
            <td className="px-2 py-2 bg-emerald-50 dark:bg-emerald-900/40 font-bold text-emerald-800 dark:text-emerald-200 tabular-nums">
              {fmtNum(calc.netto)} €
            </td>
            <td className="px-2 py-2 bg-rose-50 dark:bg-rose-900/40 font-bold text-rose-700 dark:text-rose-300 text-right tabular-nums">
              {fmtNum(calc.tasse)} €
            </td>
          </tr>
        </tbody>
      </table>
      <div className="px-2 py-2 border-t border-gray-200/80 dark:border-gray-700/80 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-0.5">Anas</label>
          <input
            type="text"
            inputMode="decimal"
            value={showAnas}
            onChange={(e) => handleAnasChange(e.target.value)}
            onBlur={handleAnasBlur}
            disabled={disabled}
            placeholder={fmtNum(calc.nettoAnas)}
            className="w-full bg-emerald-50/50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-700/40 rounded-xl px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-[9px] font-bold uppercase text-teal-600 dark:text-teal-400 mb-0.5">Flavio</label>
          <input
            type="text"
            inputMode="decimal"
            value={showFlavio}
            onChange={(e) => handleFlavioChange(e.target.value)}
            onBlur={handleFlavioBlur}
            disabled={disabled}
            placeholder={fmtNum(calc.nettoFlavio ?? calc.nettoOthman)}
            className="w-full bg-teal-50/50 dark:bg-teal-900/20 border border-teal-200/60 dark:border-teal-700/40 rounded-xl px-2 py-1.5 text-xs font-medium outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
      {!disabled && (
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => onRemove(b.id)}
            className="text-[10px] text-gray-400 hover:text-rose-500 flex items-center gap-1 transition-colors"
          >
            <Icons.Trash className="w-3 h-3" /> Elimina
          </button>
        </div>
      )}
    </div>
  );
}

export default function FinanzeSection({ bonifici = [], onUpdate, disabled, defaultCollapsed = true }) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [cifraInput, setCifraInput] = useState('');
  const [dateInput, setDateInput] = useState(toDateKey());

  const saldi = useMemo(() => computeSaldi(bonifici), [bonifici]);

  const addBonifico = () => {
    const cifra = parseFloat(String(cifraInput).replace(',', '.')) || 0;
    if (cifra <= 0) return;
    const calc = computeBonifico(cifra, null, null);
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

  const updateBonificoNetto = (id, nettoAnas, nettoFlavio) => {
    onUpdate(bonifici.map((b) => {
      if (b.id !== id) return b;
      const base = b.imponibile != null ? b : computeBonifico(b.cifra, null, null, b.splitAnas, b.splitOthman);
      return { ...base, nettoAnas, nettoFlavio, nettoOthman: nettoFlavio };
    }));
  };

  const sortedBonifici = [...bonifici].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="mt-6 w-full rounded-2xl overflow-hidden border border-emerald-200/60 dark:border-emerald-500/20 bg-white/90 dark:bg-gray-900/60 shadow-lg shadow-emerald-500/5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-emerald-500/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Icons.Euro className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-800 dark:text-gray-100 truncate">
              Finanze · Forfettario
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {bonifici.length} bonifici · A {fmtNum(saldi.totAnas)} € · F {fmtNum(saldi.totFlavio)} €
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {Math.abs(saldi.diff) > 0.01 && (
            <div className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-200/50">
              <p className="text-[9px] font-bold text-amber-700 dark:text-amber-300">
                {saldi.diff > 0 ? 'F→A' : 'A→F'} {fmtNum(Math.abs(saldi.diff))} €
              </p>
            </div>
          )}
          <span className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500">
            {collapsed ? <Icons.ChevronDown className="w-3.5 h-3.5" /> : <Icons.ChevronUp className="w-3.5 h-3.5" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 space-y-4 border-t border-emerald-200/40 dark:border-emerald-500/10">
              <div className="flex flex-wrap items-end gap-2 pt-3">
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-0.5">Data</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex-1 min-w-[80px]">
                  <label className="block text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-0.5">Cifra €</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={cifraInput}
                    onChange={(e) => setCifraInput(e.target.value.replace(/[^\d,.-]/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && addBonifico()}
                    disabled={disabled}
                    placeholder="15000"
                    className="w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addBonifico}
                  disabled={disabled || !cifraInput}
                  className="py-1.5 px-4 rounded-xl bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Icons.Plus className="w-3.5 h-3.5" /> Aggiungi
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                <AnimatePresence initial={false}>
                  {sortedBonifici.map((b) => (
                    <motion.div
                      key={b.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                    >
                      <BonificoTableRow
                        b={b}
                        onUpdateNetto={updateBonificoNetto}
                        onRemove={removeBonifico}
                        disabled={disabled}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              {sortedBonifici.length === 0 && (
                <div className="col-span-full py-8 text-center text-gray-400 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <Icons.Euro className="w-8 h-8 mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs font-medium">Nessun bonifico</p>
                  <p className="text-[10px]">Data + Cifra → Aggiungi</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { computeBonifico, fmtNum, round2, computeSaldi, Icons };
