import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../api/client';
import { getSharedDashboardWsUrl } from '../config';
import { StandardProjectCard, CreateProjectCard } from '../components/dashboard/ProjectComponents';
import { DenseTaskNode } from '../components/dashboard/DenseTaskNode';
import { countTreeStats as countTreeStatsUtil } from '../components/dashboard/DashboardUtils';
import { ConfirmModal } from '../components/ConfirmModal';
import FinanzeSection from '../components/shared/FinanzeSection';
import { DASHBOARD_CONTENT_CLASS } from '../constants/layout';
/**
 * ----------------------------------------------------------------------
 * ICONS (Lucide-inspired)
 * ----------------------------------------------------------------------
 */
const Icons = {
  CheckCircle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  Circle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /></svg>,
  Plus: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  X: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Target: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>,
  ChevronDown: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="6 9 12 15 18 9" /></svg>,
  ChevronRight: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="9 18 15 12 9 6" /></svg>,
  Calendar: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Zap: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  Trash: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  MessageCircle: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /></svg>,
  Send: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>,
  ExternalLink: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 22 3 22 9" /><line x1="10" y1="14" x2="22" y2="3" /></svg>,
  Copy: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
  Lock: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Settings: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="3" /><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M19.78 4.22l-1.42 1.42M5.64 18.36l-1.42 1.42" /></svg>,
  FileText: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
  Pencil: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Check: ({ className }) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12" /></svg>,
};

/**
 * ----------------------------------------------------------------------
 * UTILS
 * ----------------------------------------------------------------------
 */
function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
function toDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function fromDateKey(v) {
  if (!v) return null;
  const [y, m, d] = String(v).split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}
function formatDeadline(v) {
  const d = fromDateKey(v);
  return d ? `${d.getDate()}/${d.getMonth() + 1}` : '';
}
function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getDeadlineColorClass(deadlineKey, isDone) {
  if (!deadlineKey || isDone) return 'text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50';
  const today = startOfDay(new Date());
  const dead = fromDateKey(deadlineKey);
  if (!dead) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  const daysUntil = Math.round((dead - today) / 86400000);
  if (daysUntil < 0) return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
  if (daysUntil <= 2) return 'text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-900/30';
  if (daysUntil <= 7) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20';
  return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-900/20';
}

function updateNodeInTree(nodes, nodeId, updater) {
  return nodes.map((node) => {
    if (node.id === nodeId) return updater(node);
    return { ...node, children: updateNodeInTree(Array.isArray(node.children) ? node.children : [], nodeId, updater) };
  });
}

function removeNodeFromTree(nodes, nodeId) {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => ({ ...node, children: removeNodeFromTree(Array.isArray(node.children) ? node.children : [], nodeId) }));
}

async function hashPassword(pw) {
  const enc = new TextEncoder();
  // Domain-specific prefix hardens against cross-service rainbow table attacks
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`km-shared:${pw}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function isUnlocked(shareId, passwordHash) {
  if (!shareId || !passwordHash) return true;
  try {
    if (localStorage.getItem('km-admin-token')) return true;
    const stored = localStorage.getItem(`km-shared-pwd-${shareId}`);
    return stored === passwordHash;
  } catch (_) {
    return false;
  }
}

function createSharedNote(overrides = {}) {
  return {
    id: uid('note'),
    title: 'Nuova nota',
    content: '',
    collapsed: false,
    updatedAt: Date.now(),
    ...overrides,
  };
}

function deriveNoteTitle(content) {
  const firstMeaningfulLine = String(content || '')
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  if (!firstMeaningfulLine) return 'Nuova nota';
  return firstMeaningfulLine.replace(/^[-#*\d.\s:>]+/, '').slice(0, 72) || 'Nuova nota';
}

function normalizeNoteContent(value) {
  const raw = String(value || '').replace(/\r\n?/g, '\n').replace(/\t/g, '  ');
  const lines = raw.split('\n').map((line) => line.replace(/[ \t]+$/g, ''));
  const meaningful = lines.filter((line) => line.trim());
  if (!meaningful.length) return '';

  const indents = meaningful
    .filter((line) => !/^\s*([-*]|\d+\.)\s/.test(line))
    .map((line) => {
      const match = line.match(/^ */);
      return match ? match[0].length : 0;
    });
  const minIndent = indents.length ? Math.min(...indents) : 0;

  return lines
    .map((line) => {
      const match = line.match(/^ */);
      const currentIndent = match ? match[0].length : 0;
      return line.slice(Math.min(currentIndent, minIndent));
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeSharedNotes(notes) {
  if (!Array.isArray(notes)) return [];
  return notes.map((note, index) => {
    const content = typeof note?.content === 'string' ? note.content : '';
    return createSharedNote({
      id: note?.id || uid(`note-${index}`),
      title: typeof note?.title === 'string' && note.title.trim() ? note.title.trim() : deriveNoteTitle(content),
      content,
      collapsed: !!note?.collapsed,
      updatedAt: note?.updatedAt || Date.now(),
    });
  });
}

/**
 * NoteCard — view/edit mode esplicito, immune a WS sync durante editing
 */
function NoteCard({ note, onUpdate, onDelete }) {
  const [open, setOpen] = useState(true);
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(note.title);
  const [contentDraft, setContentDraft] = useState(note.content);

  // Sincronizza da WS solo se non stiamo editando
  useEffect(() => {
    if (!editing) {
      setTitleDraft(note.title);
      setContentDraft(note.content);
    }
  }, [note.title, note.content, editing]);

  const handleSave = () => {
    const title = titleDraft.trim() || deriveNoteTitle(contentDraft);
    const content = normalizeNoteContent(contentDraft);
    onUpdate({ ...note, title, content, updatedAt: Date.now() });
    setEditing(false);
  };

  const handleDiscard = () => {
    setTitleDraft(note.title);
    setContentDraft(note.content);
    setEditing(false);
  };

  const startEditing = (e) => {
    e.stopPropagation();
    setEditing(true);
    if (!open) setOpen(true);
  };

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white/95 transition-shadow dark:bg-[#141b26]/95 ${editing ? 'border-indigo-300/70 shadow-[0_0_0_3px_rgba(99,102,241,0.08)] dark:border-indigo-500/40' : 'border-zinc-200/60 dark:border-white/[0.07]'}`}>
      {/* Header */}
      <div
        className="group/hd flex cursor-pointer items-center gap-2.5 px-4 py-3 select-none"
        onClick={() => !editing && setOpen(v => !v)}
      >
        <motion.div
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 text-zinc-400"
        >
          <Icons.ChevronRight className="h-3.5 w-3.5" />
        </motion.div>

        {editing ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="Titolo nota"
            className="min-w-0 flex-1 rounded-lg bg-zinc-50 px-2 py-0.5 text-[13px] font-semibold tracking-tight text-zinc-900 outline-none ring-1 ring-zinc-200 dark:bg-white/[0.06] dark:text-zinc-100 dark:ring-white/[0.1]"
          />
        ) : (
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            {note.title || 'Nota senza titolo'}
          </span>
        )}

        {!editing && note.updatedAt && (
          <span className="shrink-0 text-[10px] text-zinc-400 dark:text-zinc-500">
            {new Date(note.updatedAt).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        )}

        {!editing && (
          <button
            type="button"
            onClick={startEditing}
            className="shrink-0 rounded-lg p-1.5 text-zinc-300 opacity-0 transition-all hover:bg-indigo-50 hover:text-indigo-500 group-hover/hd:opacity-100 dark:text-zinc-600 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400"
            aria-label="Modifica"
          >
            <Icons.Pencil className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
          className="shrink-0 rounded-lg p-1.5 text-zinc-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover/hd:opacity-100 dark:text-zinc-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
          aria-label="Elimina nota"
        >
          <Icons.Trash className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-zinc-100 px-4 pb-4 pt-3 dark:border-white/[0.05]">
              {editing ? (
                <>
                  <textarea
                    value={contentDraft}
                    onChange={(e) => setContentDraft(e.target.value)}
                    placeholder="Scrivi la nota, roadmap, snippet o checklist..."
                    spellCheck={false}
                    autoFocus={false}
                    className="min-h-[10rem] w-full resize-none rounded-lg bg-zinc-50/80 px-3 py-3 font-mono text-[12.5px] leading-[1.8] text-zinc-700 outline-none ring-1 ring-zinc-200 dark:bg-white/[0.04] dark:text-zinc-300 dark:ring-white/[0.08]"
                  />
                  <div className="mt-2.5 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleDiscard}
                      className="rounded-xl px-3 py-1.5 text-[11px] font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.05]"
                    >
                      Annulla
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3.5 py-1.5 text-[11px] font-semibold text-white shadow-sm shadow-indigo-500/30 transition-all hover:bg-indigo-600"
                    >
                      <Icons.Check className="h-3 w-3" />
                      Salva
                    </button>
                  </div>
                </>
              ) : (
                <pre className="min-h-[2rem] whitespace-pre-wrap font-mono text-[12.5px] leading-[1.8] text-zinc-600 dark:text-zinc-400">
                  {note.content || <span className="text-zinc-400 dark:text-zinc-600 italic">Nessun contenuto — clicca ✏️ per modificare</span>}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * ----------------------------------------------------------------------
 * COMPONENTS
 * ----------------------------------------------------------------------
 */

/**
 * Lista di tutti i shared dashboards dell'utente (visibile su /shared senza id)
 */
function SharedListDashboard() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [settingsModalFor, setSettingsModalFor] = useState(null);
  const [pwdInput, setPwdInput] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdError, setPwdError] = useState(null);

  const fetchList = () =>
    api.training.listSharedDashboards({ timeout: 10_000 })
      .then((data) => {
        const arr = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        setList(arr);
        setError(null);
      })
      .catch((err) => setError(err?.message || 'Impossibile caricare i dashboard condivisi'));

  useEffect(() => {
    fetchList().finally(() => setLoading(false));
  }, []);

  const copyLink = (sid) => {
    const url = `${window.location.origin}/shared/${sid}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(sid);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const openSettings = (e, sid) => {
    e.preventDefault();
    e.stopPropagation();
    setSettingsModalFor(sid);
    setPwdInput('');
    setPwdError(null);
  };

  const closeSettings = () => {
    setSettingsModalFor(null);
    setPwdInput('');
    setPwdError(null);
  };

  const saveAllPasswords = async () => {
    if (!settingsModalFor) return;
    setPwdSaving(true);
    setPwdError(null);
    try {
      const mainHash = pwdInput.trim() ? await hashPassword(pwdInput.trim()) : null;

      await api.training.updateSharedDashboard(settingsModalFor, {
        passwordHash: mainHash,
      });
      await fetchList();
      closeSettings();
    } catch (err) {
      setPwdError(err?.message || 'Errore nel salvataggio');
    } finally {
      setPwdSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0B0F19] dark:to-[#121620]">
      <div className="text-gray-500 font-medium">Caricamento...</div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0B0F19] dark:to-[#121620] p-4">
      <div className="text-center max-w-md">
        <p className="text-red-500 dark:text-red-400 font-medium mb-2">{error}</p>
      </div>
    </div>
  );

  const settingsSd = settingsModalFor ? list.find(sd => (sd.share_id || sd.shareId) === settingsModalFor) : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.08),transparent_24%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.06),transparent_18%),linear-gradient(180deg,#f8fafc_0%,#f3f6fb_100%)] p-6 text-gray-900 select-none [&_input]:select-text [&_textarea]:select-text dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_24%),radial-gradient(circle_at_top_right,rgba(56,189,248,0.08),transparent_18%),linear-gradient(180deg,#0b0f18_0%,#0e131b_100%)] dark:text-gray-100 sm:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 rounded-[32px] border border-zinc-200/70 bg-white/[0.88] p-7 shadow-[0_26px_60px_-40px_rgba(15,23,42,0.24)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#11161f]/90 dark:shadow-[0_30px_70px_-42px_rgba(0,0,0,0.62)]">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex rounded-full border border-indigo-200/80 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300">
              Shared workspace
            </span>
          </div>
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">I miei Condivisi</h1>
          <p className="max-w-2xl text-sm font-medium text-gray-500 dark:text-gray-400">Dashboard condivise collegate alla tua area, con accesso rapido, avanzamento e strumenti collaborativi.</p>
        </header>

        {/* Pannello di controllo: gestione password per sezione */}
        <div className="mb-10 rounded-[28px] border border-zinc-200/70 bg-white/[0.88] p-6 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.22)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#11161f]/85 dark:shadow-[0_30px_60px_-40px_rgba(0,0,0,0.6)]">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-zinc-700 dark:text-zinc-200">Pannello di controllo</h2>
          <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
            Clicca <strong>Password</strong> su ogni card per impostare la password di accesso principale.
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500 dark:text-zinc-400">Dove impostare</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Pulsante <strong>Password</strong> su ogni shared ↓
          </p>
        </div>

        {settingsModalFor && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.target === e.currentTarget && closeSettings()}
          >
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 max-w-md w-full p-6 my-8">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
                Password per &quot;{settingsSd?.title || settingsModalFor}&quot;
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-5">
                {settingsSd?.data?.passwordHash ? 'Password impostata. Inserisci nuova per cambiare o lascia vuoto per rimuovere.' : 'Imposta una password per proteggere l\'accesso.'}
              </p>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-500 dark:text-zinc-400 mb-1.5">Accesso principale (intero shared)</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={pwdInput}
                    onChange={(e) => { setPwdInput(e.target.value); setPwdError(null); }}
                    placeholder={settingsSd?.data?.passwordHash ? '•••••••• (inserisci nuova per cambiare)' : 'Inserisci password'}
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              {pwdError && <p className="text-sm text-red-500 mb-4">{pwdError}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={closeSettings} className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                  Annulla
                </button>
                <button
                  type="button"
                  onClick={saveAllPasswords}
                  disabled={pwdSaving}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50"
                >
                  {pwdSaving ? 'Salvataggio...' : 'Salva'}
                </button>
              </div>
            </div>
          </div>
        )}

        {list.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-zinc-300/80 bg-white/[0.78] p-12 text-center shadow-[0_16px_48px_-38px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/[0.12] dark:bg-[#141922]/70">
            <Icons.MessageCircle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-2">Nessun dashboard condiviso</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">I dashboard condivisi appariranno qui quando ne creerai o ne riceverai.</p>
            <Link to="/dashboard" className="inline-flex items-center gap-2 mt-6 px-4 py-2 rounded-lg bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors">
              Vai al Dashboard
              <Icons.ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {list.map((sd) => {
              const sid = sd.share_id || sd.shareId;
              const title = sd.title || 'Senza titolo';
              const projects = Array.isArray(sd.data?.projects) ? sd.data.projects : (Array.isArray(sd.projects) ? sd.projects : []);
              const quickTasks = Array.isArray(sd.data?.quickTasks) ? sd.data.quickTasks : (Array.isArray(sd.quickTasks) ? sd.quickTasks : []);
              const totalTasks = projects.reduce((acc, p) => acc + countTreeStatsUtil(p.tasks || []).total, 0);
              const completedTasks = projects.reduce((acc, p) => acc + countTreeStatsUtil(p.tasks || []).completed, 0);
              const pct = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <Link
                  key={sid}
                  to={`/shared/${sid}`}
                  className="group block rounded-[28px] border border-zinc-200/70 bg-white/[0.88] p-5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.2)] backdrop-blur-2xl transition-all hover:-translate-y-0.5 hover:border-indigo-300/80 hover:shadow-[0_24px_60px_-38px_rgba(99,102,241,0.18)] dark:border-white/[0.08] dark:bg-[#11161f]/90 dark:hover:border-indigo-500/35 dark:hover:shadow-[0_28px_60px_-38px_rgba(0,0,0,0.62)]"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="flex-1 truncate text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => openSettings(e, sid)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 ${(sd.data?.passwordHash) ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 dark:text-indigo-400' : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 dark:text-gray-400 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-400'}`}
                        title={(sd.data?.passwordHash) ? 'Password impostata (clicca per modificare)' : 'Imposta password per questo shared'}
                      >
                        <Icons.Lock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-semibold hidden sm:inline">{(sd.data?.passwordHash) ? 'Modifica' : 'Password'}</span>
                      </button>
                      <span className="rounded-full border border-indigo-200/80 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300">
                        Shared
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mb-4">
                    <span>{projects.length} progetti</span>
                    <span>·</span>
                    <span>{quickTasks.length} quick tasks</span>
                  </div>
                  {totalTasks > 0 && (
                    <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 truncate">/shared/{sid}</span>
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); copyLink(sid); }}
                      className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400 transition-colors"
                      title="Copia link"
                    >
                      {copiedId === sid ? (
                        <span className="text-[10px] font-medium text-emerald-500">Copiato!</span>
                      ) : (
                        <Icons.Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-medium opacity-70 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Icons.ExternalLink className="w-3.5 h-3.5" />
                    Apri dashboard
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SharedProjects() {
  const { shareId } = useParams();
  const id = (shareId || '').trim();

  if (!id) return <SharedListDashboard />;

  // Stato unico per tutto il dashboard
  const [dashboard, setDashboard] = useState({
    projects: [],
    quickTasks: [],
    notes: [],
    chat: [],
    bonifici: [],
    title: "Progetti Condivisi",
    loading: true,
    error: null,
    isConnected: false
  });

  const [projectDeadlineEditing, setProjectDeadlineEditing] = useState(null);
  const [projectDeadlineInput, setProjectDeadlineInput] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [gatePasswordHash, setGatePasswordHash] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');

  const [expandedProjects, setExpandedProjects] = useState(() => {
    try {
      const saved = localStorage.getItem(`km-shared-expanded-${id}`);
      return saved ? JSON.parse(saved) : {};
    } catch (_) { return {}; }
  });

  useEffect(() => {
    if (id) {
      localStorage.setItem(`km-shared-expanded-${id}`, JSON.stringify(expandedProjects));
    }
  }, [expandedProjects, id]);

  const [chatDraft, setChatDraft] = useState("");
  const chatScrollRef = useRef(null);
  const chatInputRef = useRef(null);
  const [notesPanelCollapsed, setNotesPanelCollapsed] = useState(false);

  useEffect(() => {
    if (chatScrollRef.current && dashboard.chat.length > 0) {
      chatScrollRef.current.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [dashboard.chat.length]);

  const ws = useRef(null);
  const reconnectTimeout = useRef(null);
  const heartbeatInterval = useRef(null);
  const restDebounceRef = useRef(null);
  const pollInterval = useRef(null);
  const mountedRef = useRef(true);
  const applyingFromBCRef = useRef(false);

  const applyDashboardFromPayload = (msg) => {
    if (msg.type === 'chat') {
      const newMsg = msg.data;
      setDashboard(prev => {
        const chat = Array.isArray(prev.chat) ? prev.chat : [];
        if (chat.some(m => m.id === newMsg.id)) return prev;
        return {
          ...prev,
          chat: [...chat.slice(-99), newMsg]
        };
      });
      return;
    }
    const dataPayload = msg.data || msg;
    const serverProjects = Array.isArray(dataPayload.projects) ? dataPayload.projects : [];
    const serverQuickTasks = Array.isArray(dataPayload.quickTasks) ? dataPayload.quickTasks : [];
    const serverNotes = normalizeSharedNotes(dataPayload.notes);
    const serverChat = Array.isArray(dataPayload.chat) ? dataPayload.chat : [];
    const serverBonifici = Array.isArray(dataPayload.bonifici) ? dataPayload.bonifici : [];
    const serverTitle = msg.title || "Progetti Condivisi";
    setDashboard(prev => ({
      ...prev,
      projects: serverProjects,
      quickTasks: serverQuickTasks,
      notes: serverNotes,
      chat: serverChat,
      bonifici: serverBonifici,
      title: serverTitle,
      loading: false,
      error: null
    }));
  };

  const connect = () => {
    if (!id || ws.current?.readyState === WebSocket.OPEN) return;

    const url = getSharedDashboardWsUrl(id);
    try {
      ws.current = new WebSocket(url);
    } catch (e) {
      console.error('WS create error', e);
      return;
    }

    ws.current.onopen = () => {
      if (!mountedRef.current) return;
      setDashboard(prev => ({ ...prev, isConnected: true, error: null }));
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = setInterval(() => {
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.current.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg?.type === 'pong') return;
        if (msg?.type === 'server_restart') {
          // Server is restarting — will auto-reconnect via onclose handler
          console.log('Server restart notification received');
          return;
        }
        if (msg?.type === 'error') {
          console.warn('WS rate limited:', msg.message);
          return;
        }
        applyDashboardFromPayload(msg);
        // Scroll a fondo gestito da useEffect su dashboard.chat.length
      } catch (e) {
        console.error("WS Parse error", e);
      }
    };

    ws.current.onclose = () => {
      if (!mountedRef.current) return;
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
      setDashboard(prev => ({ ...prev, isConnected: false }));
      ws.current = null;
      if (mountedRef.current && id) {
        reconnectTimeout.current = setTimeout(connect, 3000);
      }
    };

    ws.current.onerror = () => {
      // onclose verrà chiamato dopo
    };
  };

  const refetchFromApi = () => {
    if (!id) return;
    api.training.getSharedDashboard(id)
      .then((data) => {
        if (!mountedRef.current) return;
        const payload = data?.data || data;
        const projects = Array.isArray(payload?.projects) ? payload.projects : [];
        const quickTasks = Array.isArray(payload?.quickTasks) ? payload.quickTasks : [];
        const notes = normalizeSharedNotes(payload?.notes);
        const chat = Array.isArray(payload?.chat) ? payload.chat : [];
        const bonifici = Array.isArray(payload?.bonifici) ? payload.bonifici : [];
        setDashboard(prev => ({
          ...prev,
          projects,
          quickTasks,
          notes,
          chat,
          bonifici,
          title: data?.title || prev.title,
        }));
      })
      .catch(() => { });
  };

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && id) refetchFromApi();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [id]);

  // BroadcastChannel: sync istantaneo tra tab SharedProjects (stesso share_id)
  useEffect(() => {
    if (!id) return;
    const bc = new BroadcastChannel(`km-shared-${id}`);
    bc.onmessage = (e) => {
      const msg = e?.data;
      if (!msg || applyingFromBCRef.current) return;
      applyingFromBCRef.current = true;
      applyDashboardFromPayload(msg);
      setTimeout(() => { applyingFromBCRef.current = false; }, 0);
    };
    return () => bc.close();
  }, [id]);

  // Polling fallback quando WebSocket non connesso (aggiornamenti ogni 4s)
  useEffect(() => {
    if (!id || dashboard.isConnected) return;
    pollInterval.current = setInterval(refetchFromApi, 4000);
    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
    };
  }, [id, dashboard.isConnected]);

  // Caricamento iniziale via REST (fallback robusto se WS fallisce)
  useEffect(() => {
    mountedRef.current = true;
    if (!id) {
      setDashboard(prev => ({ ...prev, loading: false, error: 'ID condivisione mancante. Usa un link come /shared/xxx' }));
      return;
    }

    let cancelled = false;
    api.training.getSharedDashboard(id)
      .then((data) => {
        if (cancelled || !mountedRef.current) return;
        const payload = data?.data || data;
        const pwHash = payload?.passwordHash;
        if (pwHash && !isUnlocked(id, pwHash)) {
          setNeedsPassword(true);
          setGatePasswordHash(pwHash);
          setDashboard(prev => ({ ...prev, loading: false, error: null }));
          return;
        }
        const projects = Array.isArray(payload?.projects) ? payload.projects : [];
        const quickTasks = Array.isArray(payload?.quickTasks) ? payload.quickTasks : [];
        const notes = normalizeSharedNotes(payload?.notes);
        const chat = Array.isArray(payload?.chat) ? payload.chat : [];
        const bonifici = Array.isArray(payload?.bonifici) ? payload.bonifici : [];
        setDashboard(prev => ({
          ...prev,
          projects,
          quickTasks,
          notes,
          chat,
          bonifici,
          title: data?.title || prev.title,
          loading: false,
          error: null
        }));
      })
      .catch((err) => {
        if (cancelled || !mountedRef.current) return;
        setDashboard(prev => ({
          ...prev,
          loading: false,
          error: err?.message || 'Impossibile caricare il dashboard condiviso'
        }));
      });

    connect();
    return () => {
      cancelled = true;
      mountedRef.current = false;
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (restDebounceRef.current) {
        clearTimeout(restDebounceRef.current);
        restDebounceRef.current = null;
      }
    };
  }, [id]);

  // Invio aggiornamenti: WebSocket + REST sempre (stessa comunicazione di project tasks). BroadcastChannel per sync tra tab.
  const sendUpdate = (newState) => {
    const data = {
      projects: Array.isArray(newState.projects) ? newState.projects : [],
      projectOrder: Array.isArray(newState.projects) ? newState.projects.map(p => p.id) : [],
      quickTasks: Array.isArray(newState.quickTasks) ? newState.quickTasks : [],
      notes: normalizeSharedNotes(newState.notes),
      chat: Array.isArray(newState.chat) ? newState.chat : [],
      bonifici: Array.isArray(newState.bonifici) ? newState.bonifici : [],
    };
    const payload = { type: 'sync', title: newState.title ?? '', data };

    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    }
    if (id) {
      api.training.updateSharedDashboard(id, data, payload.title).catch(() => {});
    }
    if (!applyingFromBCRef.current && id) {
      try {
        const bc = new BroadcastChannel(`km-shared-${id}`);
        bc.postMessage(payload);
        bc.close();
      } catch (_) { }
    }
  };

  // Helper per aggiornare lo stato locale e inviare subito
  const updateLocal = (updater) => {
    const nextPartial = typeof updater === 'function' ? updater(dashboard) : updater;
    const nextState = { ...dashboard, ...nextPartial };
    setDashboard(nextState);

    // Inviamo l'aggiornamento al server (fire and forget)
    sendUpdate(nextState);
  };

  const addQuickTask = (title) => {
    if (!title?.trim()) return;
    updateLocal(prev => ({
      quickTasks: [{ id: uid('qtask'), title: title.trim(), done: false, created_at: Date.now() }, ...(prev.quickTasks || [])]
    }));
  };

  const toggleQuickTask = (id) => {
    updateLocal(prev => ({
      quickTasks: (prev.quickTasks || []).map(t => t.id === id ? { ...t, done: !t.done } : t)
    }));
  };

  const deleteQuickTask = (id) => {
    updateLocal(prev => ({
      quickTasks: (prev.quickTasks || []).filter(t => t.id !== id)
    }));
  };

  const addNote = () => {
    updateLocal(prev => ({
      notes: [
        createSharedNote({
          title: `Nota ${((prev.notes || []).length || 0) + 1}`,
          content: '',
        }),
        ...(prev.notes || []),
      ]
    }));
    setNotesPanelCollapsed(false);
  };

  const updateNote = (noteId, updater) => {
    updateLocal(prev => ({
      notes: normalizeSharedNotes(prev.notes).map((note) => (note.id === noteId ? updater(note) : note))
    }));
  };

  const deleteNote = (noteId) => {
    updateLocal(prev => ({
      notes: normalizeSharedNotes(prev.notes).filter((note) => note.id !== noteId)
    }));
  };

  const updateProject = (id, updater) => {
    updateLocal(prev => ({
      projects: (prev.projects || []).map(x => x.id === id ? updater(x) : x)
    }));
  };

  const createProject = () => {
    updateLocal(prev => ({
      projects: [{ id: uid('project'), title: 'Nuovo Progetto', tasks: [] }, ...(prev.projects || [])]
    }));
  };

  const deleteProject = (id) => {
    updateLocal(prev => ({
      projects: (prev.projects || []).filter(x => x.id !== id)
    }));
  };

  const reorderProjects = (fromIdx, toIdx) => {
    if (fromIdx === toIdx) return;
    updateLocal(prev => {
      const next = [...(prev.projects || [])];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return { ...prev, projects: next };
    });
  };

  const sendChatMessage = () => {
    if (!chatDraft.trim()) return;

    let senderId = localStorage.getItem('km-chat-sender-id');
    if (!senderId) {
      senderId = uid('user');
      localStorage.setItem('km-chat-sender-id', senderId);
    }

    const msg = {
      id: uid('msg'),
      text: chatDraft.trim(),
      senderId: senderId,
      timestamp: Date.now()
    };

    // Incremental update
    setDashboard(prev => ({
      ...prev,
      chat: [...(prev.chat || []), msg]
    }));
    setChatDraft("");
    chatInputRef.current?.focus();

    // Send partial payload
    const payload = { type: 'chat', data: msg };
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(payload));
    } else if (id) {
      // Fallback: send full state (compatible)
      const nextState = { ...dashboard, chat: [...(dashboard.chat || []), msg] };
      api.training.updateSharedDashboard(id, { chat: nextState.chat }).catch(() => { });
    }

    if (!applyingFromBCRef.current && id) {
      try {
        const bc = new BroadcastChannel(`km-shared-${id}`);
        bc.postMessage(payload);
        bc.close();
      } catch (_) { }
    }

    // Scroll gestito da useEffect su dashboard.chat.length
  };

  const [projectTaskDrafts, setProjectTaskDrafts] = useState({});
  const [quickTaskDraft, setQuickTaskDraft] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmResetChat, setConfirmResetChat] = useState(false);
  const resetChat = () => setConfirmResetChat(true);

  const copyShareLink = () => {
    const url = `${window.location.origin}/shared/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  // Calcolo statistiche globali per tutti i progetti
  const globalStats = useMemo(() => {
    let total = 0;
    let completed = 0;
    dashboard.projects.forEach(proj => {
      const s = countTreeStatsUtil(proj.tasks);
      total += s.total;
      completed += s.completed;
    });
    return {
      total,
      completed,
      ratio: total ? completed / total : 0,
      percentage: Math.round((total ? completed / total : 0) * 100)
    };
  }, [dashboard.projects]);

  const handleUnlock = async () => {
    const pw = passwordInput.trim();
    if (!pw) return;
    setPasswordError(null);
    const h = await hashPassword(pw);
    if (h === gatePasswordHash) {
      try {
        localStorage.setItem(`km-shared-pwd-${id}`, gatePasswordHash);
      } catch (_) {}
      setNeedsPassword(false);
      setPasswordInput('');
      refetchFromApi();
    } else {
      setPasswordError('Password errata');
    }
  };

  if (dashboard.loading) return <div className="p-8 text-center text-gray-500 font-medium">Connessione in corso...</div>;
  if (dashboard.error) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0B0F19] dark:to-[#121620] p-4">
      <div className="text-center max-w-md">
        <p className="text-red-500 dark:text-red-400 font-medium mb-2">{dashboard.error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Assicurati di usare il link completo fornito per la condivisione (es. /shared/abc123).</p>
      </div>
    </div>
  );

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#0B0F19] dark:to-[#121620] p-4">
        <div className="w-full max-w-sm bg-white dark:bg-[#161920] rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-500/20">
              <Icons.Lock className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-center text-zinc-900 dark:text-zinc-100 mb-2">Accesso protetto</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            Inserisci la password per accedere a questo spazio condiviso
          </p>
          <input
            type="password"
            autoComplete="off"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(null); }}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Password"
            className="mb-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            autoFocus
          />
          {passwordError && <p className="text-sm text-red-500 mb-4">{passwordError}</p>}
          <button
            type="button"
            onClick={handleUnlock}
            disabled={!passwordInput.trim()}
            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Accedi
          </button>
          <p className="text-xs text-gray-400 text-center mt-4">
            La password verrà salvata nel browser per i prossimi accessi
          </p>
        </div>
      </div>
    );
  }

  const sharedBgLight =
    'bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(99,102,241,0.14),transparent_55%),radial-gradient(ellipse_90%_60%_at_100%_40%,rgba(56,189,248,0.1),transparent_50%),radial-gradient(ellipse_90%_60%_at_0%_40%,rgba(99,102,241,0.08),transparent_50%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]';
  const sharedBgDark =
    'dark:bg-[radial-gradient(ellipse_100%_80%_at_50%_0%,rgba(99,102,241,0.22),transparent_55%),radial-gradient(ellipse_90%_60%_at_100%_40%,rgba(56,189,248,0.14),transparent_50%),radial-gradient(ellipse_90%_60%_at_0%_40%,rgba(99,102,241,0.12),transparent_50%),linear-gradient(180deg,#0b0e14_0%,#0d1117_100%)]';
  const SHARED_CONTENT_CLASS = 'w-full max-w-[90rem] mx-auto px-4 md:px-6 lg:px-8';

  return (
    <div className={`min-h-screen overflow-x-hidden bg-fixed font-sans antialiased text-gray-900 select-none [&_input]:select-text [&_textarea]:select-text dark:text-gray-100 ${sharedBgLight} ${sharedBgDark}`}>
      <ConfirmModal
        open={confirmResetChat}
        title="Cancella cronologia chat"
        message="Vuoi davvero cancellare tutta la cronologia della chat?"
        confirmLabel="Elimina"
        cancelLabel="Annulla"
        variant="danger"
        onConfirm={() => updateLocal({ chat: [] })}
        onCancel={() => setConfirmResetChat(false)}
      />
      <div className={`${SHARED_CONTENT_CLASS} flex flex-col gap-6 py-6 pb-12 2xl:flex-row 2xl:items-start`}>

        {/* MAIN CONTENT: PROJECTS */}
        <div className="order-2 min-w-0 flex-[2] space-y-6 2xl:order-1">
          <header className="mb-6 rounded-[32px] border border-zinc-200/70 bg-white/[0.88] p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.24)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#141922]/85 dark:shadow-[0_30px_70px_-42px_rgba(0,0,0,0.62)] md:p-6">
            <div className="mb-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    value={dashboard.title}
                    onChange={(e) => updateLocal({ title: e.target.value })}
                    className="w-full rounded-2xl border border-transparent bg-transparent px-2 py-1 text-2xl font-semibold tracking-tight text-gray-900 outline-none transition-colors dark:text-white sm:w-auto md:text-3xl"
                  />
                  <span className="rounded-full border border-indigo-200/80 bg-indigo-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-600 dark:border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300">
                    Shared
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="rounded-full bg-zinc-100/80 px-2.5 py-1 font-mono text-[11px] text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400">/shared/{id}</span>
                  <button
                    type="button"
                    onClick={copyShareLink}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-transparent px-2.5 py-1.5 text-xs font-medium text-indigo-600 transition-colors hover:border-indigo-100 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:border-indigo-500/10 dark:hover:bg-indigo-500/10"
                    title="Copia link completo"
                  >
                    {linkCopied ? <span>Copiato!</span> : <><Icons.Copy className="w-3.5 h-3.5" /> Copia link</>}
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end gap-4">
                <div className="flex items-center gap-3">
                  <AnimatePresence>
                    {dashboard.isConnected ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-2 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        LIVE
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:border-slate-500/20 dark:bg-slate-500/10 dark:text-slate-300"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                        Sincronizzazione manuale
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* BARRA PROGRESSO GENERALE */}
            {dashboard.projects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[26px] border border-zinc-200/70 bg-zinc-50/70 p-5 shadow-inner dark:border-white/[0.06] dark:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500 text-white shadow-sm">
                      <Icons.Target className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-[14px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">Avanzamento Globale</h2>
                      <p className="text-[10px] text-zinc-400 font-semibold uppercase tracking-widest">{globalStats.completed} di {globalStats.total} task completate</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-indigo-500 tabular-nums leading-none">
                      {globalStats.percentage}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${globalStats.percentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-indigo-500 rounded-full"
                  />
                </div>
              </motion.div>
            )}
          </header>

          <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.82] shadow-[0_24px_60px_-40px_rgba(15,23,42,0.24)] backdrop-blur-2xl dark:bg-[linear-gradient(180deg,rgba(18,23,31,0.96),rgba(12,16,23,0.98))] dark:shadow-[0_30px_70px_-42px_rgba(0,0,0,0.62)]">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-200/60 px-5 py-4 dark:border-white/[0.06] md:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-indigo-200/70 bg-indigo-500/10 text-indigo-600 shadow-sm dark:border-indigo-500/25 dark:bg-indigo-500/12 dark:text-indigo-300">
                  <Icons.FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">Note Workspace</h2>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={addNote}
                  className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200/70 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-500/15 dark:border-indigo-500/25 dark:bg-indigo-500/12 dark:text-indigo-300"
                >
                  <Icons.Plus className="h-3.5 w-3.5" />
                  Nuova nota
                </button>
                <button
                  type="button"
                  onClick={() => setNotesPanelCollapsed((prev) => !prev)}
                  className="rounded-2xl p-2 text-zinc-400 transition-colors hover:bg-zinc-100/80 hover:text-zinc-600 dark:hover:bg-white/[0.05] dark:hover:text-zinc-200"
                  aria-label={notesPanelCollapsed ? 'Apri note' : 'Chiudi note'}
                >
                  <motion.div
                    animate={{ rotate: notesPanelCollapsed ? -90 : 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Icons.ChevronDown className="h-4 w-4" />
                  </motion.div>
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!notesPanelCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 px-5 py-4 md:px-6">
                    {normalizeSharedNotes(dashboard.notes).length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-zinc-200/70 bg-zinc-50/60 px-6 py-8 text-center dark:border-white/[0.08] dark:bg-white/[0.02]">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Nessuna nota ancora.</p>
                        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Crea una nota per roadmap, deploy, snippet o checklist.</p>
                      </div>
                    ) : (
                      normalizeSharedNotes(dashboard.notes).map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onUpdate={(updated) => updateNote(note.id, () => updated)}
                          onDelete={deleteNote}
                        />
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {dashboard.projects.map((proj, pIdx) => {
              const dragPayload = { type: 'project', fromIndex: pIdx };
              const stats = countTreeStatsUtil(proj.tasks);
              const percentage = Math.round(stats.ratio * 100);
              const PROJECT_ACCENTS = ['indigo', 'sky', 'violet', 'emerald', 'amber', 'rose'];
              const accent = PROJECT_ACCENTS[pIdx % PROJECT_ACCENTS.length];
              const accentColors = {
                indigo: 'from-indigo-500 to-indigo-400',
                sky: 'from-sky-500 to-sky-400',
                violet: 'from-violet-500 to-violet-400',
                emerald: 'from-emerald-500 to-emerald-400',
                amber: 'from-amber-500 to-amber-400',
                rose: 'from-rose-500 to-rose-400'
              }[accent];
              const accentBar = {
                indigo: 'bg-indigo-500',
                sky: 'bg-sky-500',
                violet: 'bg-violet-500',
                emerald: 'bg-emerald-500',
                amber: 'bg-amber-500',
                rose: 'bg-rose-500'
              }[accent];

              return (
                <motion.div layout key={proj.id} className="h-fit">
                  <div
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/json', JSON.stringify(dragPayload));
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-indigo-400'); }}
                    onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-indigo-400')}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('ring-2', 'ring-indigo-400');
                      try {
                        const p = JSON.parse(e.dataTransfer.getData('application/json'));
                        if (p.type === 'project') reorderProjects(p.fromIndex, pIdx);
                      } catch (_) {}
                    }}
                    className="cursor-grab active:cursor-grabbing rounded-xl"
                  >
                  <StandardProjectCard
                    project={proj}
                    stats={stats}
                    percentage={percentage}
                    accent={accent}
                    isShared={false}
                    showExplicitProjectDelete
                    sharedWorkspaceChrome
                    taskListClassName="border-t border-white/[0.04] px-2.5 pb-3 pt-2 space-y-2 dark:border-white/[0.03] max-w-full min-w-0 overflow-hidden"
                    onTitleChange={(val) => updateProject(proj.id, p => ({ ...p, title: val }))}
                    onDelete={() => deleteProject(proj.id)}
                    onDeadlineClick={(val) => {
                      updateProject(proj.id, p => ({ ...p, deadline: val.trim() || undefined }));
                      setProjectDeadlineEditing(null);
                    }}
                    projectDeadlineEditing={projectDeadlineEditing}
                    projectDeadlineInput={projectDeadlineInput}
                    setProjectDeadlineInput={setProjectDeadlineInput}
                    setProjectDeadlineEditing={setProjectDeadlineEditing}
                    getDeadlineColorClass={getDeadlineColorClass}
                    formatDeadline={formatDeadline}
                    defaultExpanded={!!expandedProjects[proj.id]}
                    onToggleExpand={(val) => setExpandedProjects(prev => ({ ...prev, [proj.id]: val }))}
                    renderTasks={() => (
                      <>
                        {proj.tasks?.map((node, tIdx) => (
                          <DenseTaskNode
                            key={node.id} node={node} depth={0} projectId={proj.id} projectAccent={accent}
                            hideTop3Button
                            sharedWorkspaceTaskUI
                            onToggle={(tid, val) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, done: val })) }))}
                            onDelete={(tid) => updateProject(proj.id, p => ({ ...p, tasks: removeNodeFromTree(p.tasks, tid) }))}
                            onRename={(tid, val) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, title: val })) }))}
                            onDeadline={(tid, val) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, deadline: val || undefined })) }))}
                            onWorking={(tid, wb) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, workingBy: wb })) }))}
                            onAddChild={(tid, val) => updateProject(proj.id, p => ({ ...p, tasks: updateNodeInTree(p.tasks, tid, n => ({ ...n, children: [...(n.children || []), { id: uid('task'), title: val, done: false } ] })) }))}
                            onMove={(tid, targetIdx, parentId) => updateProject(proj.id, p => {
                              if (parentId) {
                                return {
                                  ...p, tasks: updateNodeInTree(p.tasks, parentId, parent => {
                                    const next = [...(parent.children || [])];
                                    const fromIdx = next.findIndex(t => t.id === tid);
                                    if (fromIdx === -1) return parent;
                                    const [removed] = next.splice(fromIdx, 1);
                                    next.splice(targetIdx, 0, removed);
                                    return { ...parent, children: next };
                                  })
                                };
                              }
                              const next = [...p.tasks];
                              const fromIdx = next.findIndex(t => t.id === tid);
                              if (fromIdx === -1) return p;
                              const [removed] = next.splice(fromIdx, 1);
                              next.splice(targetIdx, 0, removed);
                              return { ...p, tasks: next };
                            })}
                          />
                        ))}
                        <div className="pt-1">
                          <div className="rounded-2xl border border-transparent bg-white/[0.03] px-3 py-2 transition-all duration-200 focus-within:border-violet-500/30 focus-within:bg-white/[0.05] focus-within:ring-2 focus-within:ring-violet-500/20">
                            <input
                              value={projectTaskDrafts[proj.id] ?? ''}
                              onChange={(e) => setProjectTaskDrafts(prev => ({ ...prev, [proj.id]: e.target.value }))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const title = (projectTaskDrafts[proj.id] ?? '').trim();
                                  if (title) {
                                    updateProject(proj.id, p => ({ ...p, tasks: [...(p.tasks || []), { id: uid('task'), title, done: false }] }));
                                    setProjectTaskDrafts(prev => ({ ...prev, [proj.id]: '' }));
                                  }
                                }
                              }}
                              placeholder="Add task... (Enter)"
                              className="w-full bg-transparent text-sm text-zinc-400 outline-none placeholder:text-zinc-500 dark:text-zinc-300 dark:placeholder:text-zinc-500"
                            />
                          </div>
                        </div>
                      </>
                    )}
                  />
                  </div>
                </motion.div>
              );
            })}

            <motion.div layout className="flex min-h-[5.75rem]">
              <CreateProjectCard onClick={createProject} className="flex-1" />
            </motion.div>
          </div>

        </div>

        {/* SIDEBAR: QUICK TASKS + CHAT */}
        <aside className="order-1 w-full shrink-0 space-y-4 2xl:sticky 2xl:top-6 2xl:order-2 2xl:w-[16rem] 2xl:self-start">
          {/* QUICK TASKS */}
          <div className="flex min-h-[340px] flex-col rounded-[28px] border border-zinc-200/70 bg-white/[0.88] p-6 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.24)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#11161f]/90 dark:shadow-[0_30px_60px_-40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                <Icons.Zap className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-zinc-100">Quick Tasks</h2>
                <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Task leggere condivise</p>
              </div>
            </div>

            <div className="space-y-3 flex-1 flex flex-col">
              <div className="relative">
                <input
                  value={quickTaskDraft}
                  onChange={(e) => setQuickTaskDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addQuickTask(quickTaskDraft)}
                  className="w-full rounded-2xl border border-zinc-200/70 bg-zinc-100/80 py-3 pl-4 pr-10 text-sm text-zinc-900 outline-none transition-colors dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-100"
                  placeholder="Nuova task veloce..."
                />
                <button
                  onClick={() => { addQuickTask(quickTaskDraft); setQuickTaskDraft(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-500 dark:hover:bg-amber-500/10"
                >
                  <Icons.Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2 max-h-[320px]">
                <AnimatePresence initial={false}>
                  {dashboard.quickTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={() => toggleQuickTask(task.id)}
                      className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-transparent p-3 transition-all duration-200 hover:border-zinc-200/80 hover:bg-zinc-50 dark:hover:border-white/[0.06] dark:hover:bg-white/[0.04]"
                    >
                      <span className={`shrink-0 ${task.done ? 'text-emerald-500' : 'text-gray-300 dark:text-gray-600'} transition-colors duration-200`}>
                        {task.done ? <Icons.CheckCircle className="w-4 h-4" /> : <Icons.Circle className="w-4 h-4" />}
                      </span>
                      <span title={task.title} className={`min-w-0 flex-1 break-words text-sm font-medium leading-snug [overflow-wrap:anywhere] ${task.done ? 'text-zinc-400 line-through dark:text-zinc-500' : 'text-zinc-800 dark:text-zinc-100'}`}>
                        {task.title}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); deleteQuickTask(task.id); }}
                        className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 dark:text-zinc-500 rounded-lg transition-all duration-200"
                        aria-label="Elimina task"
                      >
                        <Icons.Trash className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {dashboard.quickTasks.length === 0 && (
                  <motion.div
                    className="py-10 text-center space-y-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <div className="text-gray-300 dark:text-gray-700 text-3xl">⚡</div>
                    <p className="text-sm text-gray-400 font-medium">Nessuna task veloce</p>
                    <p className="text-xs text-gray-400 max-w-[200px] mx-auto">Aggiungi una nuova task per iniziare</p>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* CHAT BOX */}
          <div className="flex min-h-[420px] flex-col rounded-[28px] border border-zinc-200/70 bg-white/[0.88] p-6 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.24)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#11161f]/90 dark:shadow-[0_30px_60px_-40px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  <Icons.MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-[15px] font-semibold tracking-tight text-gray-900 dark:text-zinc-100">Chat</h2>
                  <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Conversazione del workspace</p>
                </div>
              </div>
              {dashboard.chat.length > 0 && (
                <button
                  onClick={resetChat}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Cancella cronologia"
                >
                  <Icons.Trash className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div ref={chatScrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[380px] custom-scrollbar">
              {dashboard.chat.map((msg) => {
                const isMe = msg.senderId === localStorage.getItem('km-chat-sender-id');
                // Colore univoco basato sull'ID del mittente per chi non sono io
                const senderColor = isMe ? '' : `hsl(${parseInt(msg.senderId.slice(-4), 16) % 360}, 70%, 45%)`;

                return (
                  <motion.div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div
                      className={`max-w-[85%] rounded-3xl p-3 text-sm shadow-lg backdrop-blur-sm ${isMe
                        ? 'rounded-tr-none bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-indigo-500/25'
                        : 'rounded-tl-none border border-zinc-200/70 bg-white/90 text-gray-800 shadow-gray-500/10 dark:border-white/[0.08] dark:bg-[#1b202b]/90 dark:text-gray-200'
                        }`}
                    >
                      {!isMe && (
                        <span className="block text-[9px] font-bold mb-0.5 opacity-80" style={{ color: senderColor }}>
                          Utente ·{msg.senderId.slice(-4)}
                        </span>
                      )}
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 px-1 font-medium">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                );
              })}
              {dashboard.chat.length === 0 && (
                <motion.div
                  className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 opacity-60 py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Icons.MessageCircle className="w-10 h-10" />
                  <p className="text-sm font-medium text-center">Inizia la conversazione</p>
                  <p className="text-xs text-center max-w-[200px]">Scrivi il tuo primo messaggio per iniziare a chattare</p>
                </motion.div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }} className="relative">
              <input
                ref={chatInputRef}
                value={chatDraft}
                onChange={(e) => setChatDraft(e.target.value)}
                placeholder="Scrivi un messaggio..."
                className="w-full rounded-2xl border border-zinc-200/70 bg-zinc-100/80 py-3 pl-4 pr-12 text-sm text-zinc-900 outline-none transition-colors duration-200 dark:border-white/[0.06] dark:bg-white/[0.04] dark:text-zinc-100"
              />
              <button
                type="submit"
                disabled={!chatDraft.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2 text-indigo-500 transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-indigo-500/10"
              >
                <Icons.Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </aside>

      </div>

      {/* MODULO FINANZE in fondo (solo shared "nextcode" per titolo o id) */}
      {((dashboard.title && String(dashboard.title).toLowerCase().includes('nextcode')) || (id && String(id).toLowerCase().includes('nextcode'))) && (
        <div className={`${SHARED_CONTENT_CLASS} mb-6`}>
          <FinanzeSection
            bonifici={dashboard.bonifici || []}
            onUpdate={(bonifici) => updateLocal({ bonifici })}
            defaultCollapsed={true}
          />
        </div>
      )}
    </div>
  );
}
