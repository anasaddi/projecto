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

function computeBonifico(cifra, nettoAnasInput, nettoFlavioInput, splitAnas = 50, splitOthman = 50) {
  const cifraNum = Number(cifra) || 0;
  const imponibile = cifraNum * IMPONIBILE_RATE;
  const inps = imponibile * INPS_RATE;
  const impostaSostitutiva = imponibile * IMPOSTA_SOSTITUTIVA_RATE;
  const tasse = inps + impostaSostitutiva;
  const netto = cifraNum - tasse;
  const anasVal = nettoAnasInput != null && nettoAnasInput !== '' ? parseFloat(String(nettoAnasInput).replace(',', '.')) : null;
  const flavioVal = nettoFlavioInput != null && nettoFlavioInput !== '' ? parseFloat(String(nettoFlavioInput).replace(',', '.')) : null;
  let nettoAnas, nettoFlavio;
  if (anasVal != null && !isNaN(anasVal)) {
    nettoAnas = anasVal;
    nettoFlavio = netto - anasVal;
  } else if (flavioVal != null && !isNaN(flavioVal)) {
    nettoFlavio = flavioVal;
    nettoAnas = netto - flavioVal;
  } else {
    const totSplit = (Number(splitAnas) || 0) + (Number(splitOthman) || 0) || 1;
    nettoAnas = netto * ((Number(splitAnas) || 0) / totSplit);
    nettoFlavio = netto * ((Number(splitOthman) || 0) / totSplit);
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
  const showAnas = anasInput !== '' ? anasInput : (b.nettoAnas != null ? String(b.nettoAnas).replace('.', ',') : fmtNum(calc.nettoAnas));
  const showFlavio = flavioInput !== '' ? flavioInput : (b.nettoFlavio != null || b.nettoOthman != null ? String(b.nettoFlavio ?? b.nettoOthman).replace('.', ',') : fmtNum(calc.nettoFlavio ?? calc.nettoOthman ?? 0));

  const handleAnasChange = (val) => {
    setAnasInput(val);
    setFlavioInput('');
    const num = parseFloat(String(val).replace(',', '.'));
    if (!isNaN(num) && nettoTot > 0) {
      onUpdateNetto(b.id, num, nettoTot - num);
    }
  };

  const handleFlavioChange = (val) => {
    setFlavioInput(val);
    setAnasInput('');
    const num = parseFloat(String(val).replace(',', '.'));
    if (!isNaN(num) && nettoTot > 0) {
      onUpdateNetto(b.id, nettoTot - num, num);
    }
  };

  const handleAnasBlur = () => setAnasInput('');
  const handleFlavioBlur = () => setFlavioInput('');

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/50 shadow-sm">
      <table className="w-full text-sm">
        <tbody>
          <tr>
            <td colSpan={2} className="text-center py-2 text-gray-600 dark:text-gray-400 font-medium">
              {dateFmt}
            </td>
          </tr>
          <tr>
            <td colSpan={2} className="bg-blue-700 text-white text-center py-3 text-lg font-bold">
              {fmtNum(calc.cifra)} €
            </td>
          </tr>
          <tr className="border-t border-gray-100 dark:border-gray-800">
            <td className="px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">IMPONIBILE (67%)</td>
            <td className="px-3 py-2 bg-white dark:bg-gray-900 text-right font-semibold text-gray-900 dark:text-gray-100">{fmtNum(calc.imponibile)}</td>
          </tr>
          <tr>
            <td className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">INPS (26,07%)</td>
            <td className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 text-right font-semibold">{fmtNum(calc.inps)}</td>
          </tr>
          <tr>
            <td className="px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300">IMPOSTA SOSTITUTIVA 5%</td>
            <td className="px-3 py-2 bg-white dark:bg-gray-900 text-right font-semibold">{fmtNum(calc.impostaSostitutiva)}</td>
          </tr>
          <tr>
            <td className="px-3 py-2 bg-emerald-700 text-white font-bold">NETTO</td>
            <td className="px-3 py-2 bg-red-700 text-white font-bold text-right">TASSE</td>
          </tr>
          <tr>
            <td className="px-3 py-3 bg-emerald-50 dark:bg-emerald-900/30 font-bold text-gray-900 dark:text-gray-100">
              {fmtNum(calc.netto)} €
            </td>
            <td className="px-3 py-3 bg-red-50 dark:bg-red-900/30 font-bold text-red-700 dark:text-red-300 text-right">
              {fmtNum(calc.tasse)} €
            </td>
          </tr>
        </tbody>
      </table>
      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Netto Anas</label>
          <input
            type="text"
            inputMode="decimal"
            value={showAnas}
            onChange={(e) => handleAnasChange(e.target.value)}
            onBlur={handleAnasBlur}
            disabled={disabled}
            placeholder={fmtNum(calc.nettoAnas)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-1">Netto Flavio</label>
          <input
            type="text"
            inputMode="decimal"
            value={showFlavio}
            onChange={(e) => handleFlavioChange(e.target.value)}
            onBlur={handleFlavioBlur}
            disabled={disabled}
            placeholder={fmtNum(calc.nettoFlavio ?? calc.nettoOthman)}
            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>
      {!disabled && (
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => onRemove(b.id)}
            className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1"
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
    <div className="mt-8 w-full rounded-2xl overflow-hidden border border-emerald-200/60 dark:border-emerald-500/20 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20 shadow-lg shadow-emerald-500/5">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 hover:bg-emerald-500/5 transition-colors text-left"
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
              {bonifici.length} bonifici · Anas {fmtNum(saldi.totAnas)} € · Flavio {fmtNum(saldi.totFlavio)} €
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {Math.abs(saldi.diff) > 0.01 && (
            <div className="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 border border-amber-200/50">
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300">
                {saldi.diff > 0 ? 'Flavio → Anas' : 'Anas → Flavio'} {fmtNum(Math.abs(saldi.diff))} €
              </p>
            </div>
          )}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
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
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={addBonifico}
                    disabled={disabled || !cifraInput}
                    className="w-full py-2.5 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    <Icons.Plus className="w-4 h-4" /> Aggiungi
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[480px] overflow-y-auto custom-scrollbar">
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
                <div className="py-10 text-center text-gray-400 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                  <Icons.Euro className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nessun bonifico</p>
                  <p className="text-xs">Aggiungi il primo con Data e Cifra sopra</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export { computeBonifico, fmtNum, computeSaldi, Icons };
