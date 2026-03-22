import { useEffect, useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDashboardStats } from '../context/DashboardStatsContext';
import { AppLogo } from './AppLogo';
import { motion } from 'framer-motion';
import { useDashboardStore } from '../store/dashboardStore';
import { Icons } from './dashboard/Icons';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps): React.ReactElement {
  const pathname = useLocation().pathname;
  const isYouTube = pathname === '/youtube';
  const isDashboard = pathname === '/dashboard';
  const isTraining = pathname === '/training';
  const isShared = pathname.startsWith('/shared');
  const isSharedProject = pathname.startsWith('/shared/') && pathname !== '/shared';
  const isWorkspace = isYouTube || isDashboard || isTraining || isShared;
  const { stats } = useDashboardStats();

  const lastSavedAt = useDashboardStore((s) => s.lastSavedAt);
  const setLastSavedAt = useDashboardStore((s) => s.setLastSavedAt);

  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setTimeout(() => setLastSavedAt(null), 2500);
    return () => clearTimeout(t);
  }, [lastSavedAt, setLastSavedAt]);

  const [isDark, setIsDark] = useState(() => localStorage.getItem('km-theme') === 'dark');
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('km-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const isGuest = localStorage.getItem('km-user-role') === 'guest';
  const isAdmin =
    localStorage.getItem('km-user-role') === 'admin' && !!localStorage.getItem('km-admin-token');

  if (isGuest || !isAdmin) {
    return (
      <div className="min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col">
        <main className="flex-1 overflow-auto">{children}</main>
        <button
          type="button"
          onClick={() => setIsDark((d) => !d)}
          className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-white/[0.04] backdrop-blur-md border border-zinc-200 dark:border-white/[0.08] shadow-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all hover:scale-105 active:scale-95"
          aria-label={isDark ? 'Tema chiaro' : 'Tema scuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    );
  }

  const trainingAllowed = localStorage.getItem('km-training-allowed') === '1';
  const navLinks: { to: string; label: string; active: boolean }[] = [
    { to: '/dashboard', label: 'Dashboard', active: isDashboard },
    { to: '/shared', label: 'Condivisi', active: isShared },
    ...(trainingAllowed ? [{ to: '/training', label: 'Training', active: isTraining }] : []),
    { to: '/youtube', label: 'Transcript', active: isYouTube },
  ];

  return (
    <div
      className={`min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors bg-white dark:bg-[#0b0e14] ${isWorkspace ? 'flex flex-col' : ''}`}
    >
      {!isSharedProject && (
        <header className="sticky top-4 z-50 mx-4 mt-4 flex shrink-0 items-center gap-6 rounded-[26px] border border-zinc-200/70 bg-white/[0.88] px-5 py-3 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.28)] backdrop-blur-2xl transition-colors dark:border-white/[0.08] dark:bg-[#11161f]/[0.86] dark:shadow-[0_26px_60px_-34px_rgba(0,0,0,0.65)]">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="group-hover:shadow-indigo-500/40 group-active:scale-95 transition-all">
            <AppLogo size="xs" />
          </div>
          <span className="hidden font-semibold tracking-tight text-zinc-800 transition-colors group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400 sm:inline">
            PROJECTO
          </span>
        </Link>
        <nav className="hidden items-center gap-1.5 rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-1 dark:border-white/[0.06] dark:bg-white/[0.03] md:flex">
          {navLinks.map(({ to, label, active }) => (
            <Link
              key={to}
              to={to}
              className={`rounded-xl px-3.5 py-2 text-[13px] font-medium transition-all duration-200 ${
                active
                  ? 'bg-zinc-900 text-white shadow-sm dark:bg-white/[0.1] dark:text-white'
                  : 'text-zinc-500 hover:bg-white hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth md:hidden">
          {navLinks.map(({ to, label, active }) => (
            <Link
              key={to}
              to={to}
              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-[12px] font-medium transition-all duration-200 ${
                active
                  ? 'bg-zinc-900 text-white shadow-sm dark:bg-white/[0.08] dark:text-white'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {isDashboard && stats && (
          <span className="ml-auto rounded-full border border-zinc-200/70 bg-white/90 px-3.5 py-1.5 text-xs font-semibold tabular-nums text-zinc-600 shadow-sm dark:border-white/[0.06] dark:bg-white/[0.03] dark:text-zinc-300 md:ml-0">
            {stats.doneFocusItems} <span className="text-zinc-400 dark:text-zinc-500">/</span>{' '}
            {stats.totalFocusItems}
          </span>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {lastSavedAt && (
            <motion.span 
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400"
            >
              <Icons.Check className="h-3.5 w-3.5" />
              Salvato
            </motion.span>
          )}
          <button
            type="button"
            onClick={() => setIsDark((d) => !d)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-zinc-200/70 text-zinc-400 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700 active:scale-95 dark:border-white/[0.06] dark:text-zinc-500 dark:hover:border-white/[0.08] dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
            aria-label={isDark ? 'Tema chiaro' : 'Tema scuro'}
            title={isDark ? 'Tema chiaro' : 'Tema scuro'}
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      )}
      <main
        className={
          isWorkspace
            ? `flex w-full ${isSharedProject ? 'px-0' : 'px-4 md:px-6'} flex-col flex-1 min-h-0 pt-2 overflow-hidden overflow-y-auto custom-scrollbar`
            : 'w-full p-4 md:p-6'
        }
      >
        {children}
      </main>
    </div>
  );
}
