import { useEffect, useState, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDashboardStats } from '../context/DashboardStatsContext';
import { AppLogo } from './AppLogo';
import { motion } from 'framer-motion';
import { useDashboardStore } from '../store/dashboardStore';
import { Icons } from './dashboard/Icons';
import { cn } from '../lib/utils';
import { Button } from './ui/Button';
import { getCollabIdentity, setCollabIdentity, type CollabIdentity } from '../utils/collabIdentity';

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
  const isNextcode = pathname.startsWith('/shared/nextcode');
  const isWorkspace = isYouTube || isDashboard || isTraining || isShared;
  const { stats } = useDashboardStats() || { stats: { doneFocusItems: 0, totalFocusItems: 0 } };

  const lastSavedAt = useDashboardStore((s) => s.lastSavedAt);
  const setLastSavedAt = useDashboardStore((s) => s.setLastSavedAt);

  useEffect(() => {
    if (!lastSavedAt) return;
    const t = setTimeout(() => setLastSavedAt(null), 2500);
    return () => clearTimeout(t);
  }, [lastSavedAt, setLastSavedAt]);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('km-theme');
    if (saved) return saved === 'dark';
    // Auto-detect from system preference
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  });
  const [collabWho, setCollabWho] = useState<CollabIdentity>(() => getCollabIdentity());
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('km-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  // Listen for system theme changes (only when no manual override)
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('km-theme')) setIsDark(e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const isGuest = localStorage.getItem('km-user-role') === 'guest';
  const isAdmin =
    localStorage.getItem('km-user-role') === 'admin' && !!localStorage.getItem('km-admin-token');

  if (isGuest || !isAdmin) {
    return (
      <div className="min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col">
        <main className="flex-1 overflow-auto">{children}</main>
        <Button
          variant="ghost"
          onClick={() => setIsDark((d) => !d)}
          className="fixed bottom-4 right-4 z-50 h-10 w-10 p-0 rounded-full bg-white/80 dark:bg-zinc-800 shadow-lg"
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {isDark ? '☀️' : '🌙'}
        </Button>
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
      className={cn(
        'min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors',
        isSharedProject ? 'bg-transparent' : 'bg-white dark:bg-zinc-900',
        isWorkspace && 'flex flex-col'
      )}
    >
      {(isAdmin || !isSharedProject) && (
        <header className={cn(
          'sticky top-4 z-50 mx-4 mt-4 flex shrink-0 items-center gap-3 md:gap-6',
          'rounded-3xl border border-zinc-200 dark:border-zinc-700',
          'bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg',
          'px-5 py-3'
        )}>
        <Link to="/" className="flex items-center gap-2 shrink-0 group">
          <div className="group-hover:shadow-indigo-500/40 group-active:scale-95 transition-all">
            <AppLogo size="xs" />
          </div>
          <span className="font-semibold tracking-tight text-zinc-800 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
            PROJECTO
          </span>
        </Link>

        {isDashboard && stats && (
          <span className="ml-1 flex md:hidden items-center rounded-full bg-zinc-100 dark:bg-zinc-700 px-2.5 py-1 text-[10px] font-semibold text-zinc-600 dark:text-zinc-300">
            {stats.doneFocusItems} / {stats.totalFocusItems}
          </span>
        )}

        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-zinc-50 dark:bg-zinc-700/50 p-1">
          {navLinks.map(({ to, label, active }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'px-3 py-2 text-sm font-medium rounded-lg',
                active
                  ? 'bg-zinc-900 dark:bg-zinc-600 text-white'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex md:hidden items-center gap-1 overflow-x-auto">
          {navLinks.map(({ to, label, active }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap',
                active
                  ? 'bg-zinc-900 dark:bg-zinc-600 text-white'
                  : 'text-zinc-500 dark:text-zinc-400'
              )}
            >
              {label}
            </Link>
          ))}
        </div>

        {isDashboard && stats && (
          <span className="hidden md:flex items-center rounded-full bg-zinc-100 dark:bg-zinc-700 px-3 py-1 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            {stats.doneFocusItems} / {stats.totalFocusItems}
          </span>
        )}
        <div className="flex items-center gap-3 ml-auto">
          {isSharedProject && isNextcode && (
            <div
              className="hidden sm:flex items-center gap-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 p-0.5"
              title="Chi sei su questo dispositivo"
            >
              {(['anas', 'othmane'] as const).map((id) => (
                <Button
                  key={id}
                  size="sm"
                  variant={collabWho === id ? 'primary' : 'ghost'}
                  onClick={() => {
                    setCollabIdentity(id);
                    setCollabWho(id);
                  }}
                  className="text-xs"
                >
                  {id === 'anas' ? 'Anas' : 'Othmane'}
                </Button>
              ))}
            </div>
          )}
          {lastSavedAt && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="hidden md:flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
            >
              <Icons.Check className="h-3.5 w-3.5" />
              Salvato
            </motion.span>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsDark((d) => !d)}
            className="h-10 w-10 p-0 rounded-xl"
            aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDark ? '☀️' : '🌙'}
          </Button>
        </div>
      </header>
      )}
      <main
        className={cn(
          isWorkspace
            ? cn('flex w-full pt-2 flex-col flex-1 min-h-0 overflow-y-auto', isSharedProject ? 'px-0' : 'px-4 md:px-6')
            : 'w-full p-4 md:p-6'
        )}
      >
        {children}
      </main>
    </div>
  );
}
