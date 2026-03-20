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
  if (n == null) return 0;
  const parsed = typeof n === 'string' ? parseFloat(String(n).replace(',', '.')) : Number(n);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

function fmtNum(n) {
  if (n == null || isNaN(n)) return '0';
  return round2(n).toLocaleString('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function sanitizeBonifico(b) {
  if (!b) return b;
  const out = { ...b, cifra: round2(b.cifra) };
  ['imponibile','inps','impostaSostitutiva','tasse','netto','nettoAnas','nettoOthman'].forEach(k => {
    if (b[k] != null) out[k] = round2(b[k]);
  });
  return out;
}

function computeBonifico(cifra, nettoAnasInput, nettoOthmanInput, splitAnas = 50, splitOthman = 50) {
  const cifraNum = round2(Number(cifra) || 0);
  const imponibile = round2(cifraNum * IMPONIBILE_RATE);
  const inps = round2(imponibile * INPS_RATE);
  const impostaSostitutiva = round2(imponibile * IMPOSTA_SOSTITUTIVA_RATE);
  const tasse = round2(inps + impostaSostitutiva);
  const netto = round2(cifraNum - tasse);
  const anasVal = nettoAnasInput != null && nettoAnasInput !== '' ? round2(parseFloat(String(nettoAnasInput).replace(',', '.'))) : null;
  const othmanVal = nettoOthmanInput != null && nettoOthmanInput !== '' ? round2(parseFloat(String(nettoOthmanInput).replace(',', '.'))) : null;
  let nettoAnas, nettoOthman;
  if (anasVal != null && !isNaN(anasVal)) {
    nettoAnas = anasVal;
    nettoOthman = round2(netto - anasVal);
  } else if (othmanVal != null && !isNaN(othmanVal)) {
    nettoOthman = othmanVal;
    nettoAnas = round2(netto - othmanVal);
  } else {
    const totSplit = (Number(splitAnas) || 0) + (Number(splitOthman) || 0) || 1;
    nettoAnas = round2(netto * ((Number(splitAnas) || 0) / totSplit));
    nettoOthman = round2(netto * ((Number(splitOthman) || 0) / totSplit));
  }
  return {
    cifra: cifraNum,
    imponibile,
    inps,
    impostaSostitutiva,
    tasse,
    netto,
    nettoAnas,
    nettoOthman
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
    const bNorm = { ...b, nettoOthman: b.nettoOthman ?? b.nettoFlavio };
    const calc = b.imponibile != null ? sanitizeBonifico(bNorm) : computeBonifico(b.cifra, b.nettoAnasInput, b.nettoOthmanInput ?? b.nettoFlavioInput, b.splitAnas, b.splitOthman);
    totAnas += calc.nettoAnas || 0;
    totOthman += calc.nettoOthman || 0;
  });
  const diff = totAnas - totOthman;
  return { totAnas, totOthman, totale: totAnas + totOthman, diff };
}

function BonificoTableRow({ b, onUpdateNetto, onRemove, disabled }) {
  const bNorm = { ...b, nettoOthman: b.nettoOthman ?? b.nettoFlavio };
  const calc = b.imponibile != null ? sanitizeBonifico(bNorm) : computeBonifico(b.cifra, b.nettoAnasInput, b.nettoOthmanInput ?? b.nettoFlavioInput, b.splitAnas, b.splitOthman);
  const dateFmt = b.date ? new Date(b.date + 'T12:00:00').toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
  const [anasInput, setAnasInput] = useState('');
  const [othmanInput, setOthmanInput] = useState('');
  const nettoTot = calc.netto ?? 0;
  const nettoOthmanVal = b.nettoOthman ?? b.nettoFlavio;
  const showAnas = anasInput !== '' ? anasInput : (b.nettoAnas != null ? fmtNum(b.nettoAnas) : fmtNum(calc.nettoAnas));
  const showOthman = othmanInput !== '' ? othmanInput : (nettoOthmanVal != null ? fmtNum(nettoOthmanVal) : fmtNum(calc.nettoOthman ?? 0));

  const handleAnasChange = (val) => {
    setAnasInput(val);
    setOthmanInput('');
    const num = round2(parseFloat(String(val).replace(',', '.')));
    if (!isNaN(num) && nettoTot > 0) {
      onUpdateNetto(b.id, num, round2(nettoTot - num));
    }
  };

  const handleOthmanChange = (val) => {
    setOthmanInput(val);
    setAnasInput('');
    const num = round2(parseFloat(String(val).replace(',', '.')));
    if (!isNaN(num) && nettoTot > 0) {
      onUpdateNetto(b.id, round2(nettoTot - num), num);
    }
  };

  const handleAnasBlur = () => setAnasInput('');
  const handleOthmanBlur = () => setOthmanInput('');

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 shadow-sm">
      <div className="p-2.5 border-b border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 text-center">{dateFmt}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white text-center tabular-nums mt-0.5">{fmtNum(calc.cifra)} €</p>
      </div>
      <div className="p-2.5 space-y-1 text-xs">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Imponibile 67%</span>
          <span className="tabular-nums font-medium text-gray-800 dark:text-gray-200">{fmtNum(calc.imponibile)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>INPS 26,07%</span>
          <span className="tabular-nums font-medium text-gray-800 dark:text-gray-200">{fmtNum(calc.inps)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Imposta sost. 5%</span>
          <span className="tabular-nums font-medium text-gray-800 dark:text-gray-200">{fmtNum(calc.impostaSostitutiva)}</span>
        </div>
        <div className="flex justify-between pt-1.5 mt-1.5 border-t border-gray-100 dark:border-gray-800 font-semibold">
          <span className="text-emerald-600 dark:text-emerald-400">Netto</span>
          <span className="tabular-nums text-emerald-700 dark:text-emerald-300">{fmtNum(calc.netto)} €</span>
        </div>
        <div className="flex justify-between font-semibold">
          <span className="text-gray-500 dark:text-gray-400">Tasse</span>
          <span className="tabular-nums text-gray-700 dark:text-gray-300">{fmtNum(calc.tasse)} €</span>
        </div>
      </div>
      <div className="px-2.5 py-2 grid grid-cols-2 gap-2 border-t border-gray-100 dark:border-gray-800">
        <div>
          <label className="block text-[9px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Anas</label>
          <input
            type="text"
            inputMode="decimal"
            value={showAnas}
            onChange={(e) => handleAnasChange(e.target.value)}
            onBlur={handleAnasBlur}
            disabled={disabled}
            placeholder={fmtNum(calc.nettoAnas)}
            className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs font-medium tabular-nums outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-[9px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">Othman</label>
          <input
            type="text"
            inputMode="decimal"
            value={showOthman}
            onChange={(e) => handleOthmanChange(e.target.value)}
            onBlur={handleOthmanBlur}
            disabled={disabled}
            placeholder={fmtNum(calc.nettoOthman)}
            className="w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 text-xs font-medium tabular-nums outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
      </div>
      {!disabled && (
        <div className="px-2.5 pb-2">
          <button
            type="button"
            onClick={() => onRemove(b.id)}
            className="text-[10px] text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors"
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

  const cleanBonifici = useMemo(() => (Array.isArray(bonifici) ? bonifici.map(sanitizeBonifico) : []), [bonifici]);
  const saldi = useMemo(() => computeSaldi(cleanBonifici), [cleanBonifici]);

  const addBonifico = () => {
    const cifra = round2(parseFloat(String(cifraInput).replace(',', '.')) || 0);
    if (cifra <= 0) return;
    const calc = computeBonifico(cifra, null, null);
    const newEntry = sanitizeBonifico({ id: uid('bon'), date: dateInput, ...calc });
    onUpdate([newEntry, ...cleanBonifici]);
    setCifraInput('');
    setDateInput(toDateKey());
  };

  const removeBonifico = (id) => {
    onUpdate(cleanBonifici.filter((b) => b.id !== id));
  };

  const updateBonificoNetto = (id, nettoAnas, nettoOthman) => {
    onUpdate(cleanBonifici.map((b) => {
      if (b.id !== id) return b;
      const base = b.imponibile != null ? sanitizeBonifico(b) : computeBonifico(b.cifra, null, null, b.splitAnas, b.splitOthman);
      return { ...base, nettoAnas: round2(nettoAnas), nettoOthman: round2(nettoOthman) };
    }));
  };

  const sortedBonifici = [...cleanBonifici].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <div className="mt-6 w-full rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/80 shadow-sm">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0">
            <Icons.Euro className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-gray-100 truncate">
              Finanze · Forfettario
            </h2>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
              {cleanBonifici.length} bonifici · Anas {fmtNum(saldi.totAnas)} € · Othman {fmtNum(saldi.totOthman)} €
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {Math.abs(saldi.diff) > 0.01 && (
            <span className="px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/30 text-[9px] font-semibold text-amber-700 dark:text-amber-400">
              {saldi.diff > 0 ? 'O→A' : 'A→O'} {fmtNum(Math.abs(saldi.diff))} €
            </span>
          )}
          <span className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500">
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
            <div className="px-4 pb-4 pt-0 space-y-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap items-end gap-2 pt-3">
                <div className="flex-1 min-w-[100px]">
                  <label className="block text-[9px] font-bold uppercase text-gray-500 dark:text-gray-400 mb-0.5">Data</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
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
                    className="w-full bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addBonifico}
                  disabled={disabled || !cifraInput}
                  className="py-1.5 px-4 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center gap-1.5 shrink-0"
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
