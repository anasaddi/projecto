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
import { isAdminRole } from '../utils/authSession';
import { getSyncStatus, subscribeSyncStatus, type SyncStatus } from '../utils/syncStatus';

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
  const [syncStatus, setSyncStatusState] = useState<SyncStatus>(() => getSyncStatus());

  useEffect(() => subscribeSyncStatus(setSyncStatusState), []);
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

  // Sync when mobile bottom bar toggles theme
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('km-theme');
      if (saved) setIsDark(saved === 'dark');
    };
    window.addEventListener('theme-changed', handler);
    return () => window.removeEventListener('theme-changed', handler);
  }, []);

  const isGuest = localStorage.getItem('km-user-role') === 'guest';
  const isAdmin = isAdminRole();

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
        isSharedProject ? 'bg-transparent' : 'bg-white dark:bg-transparent',
        isWorkspace && 'flex flex-col'
      )}
    >
      {(isAdmin || !isSharedProject) && (
        <header className={cn(
          'sticky top-3 md:top-4 z-50 mx-3 md:mx-4 mt-3 md:mt-4 flex shrink-0 items-center justify-between gap-2 md:gap-3',
          'rounded-2xl md:rounded-2xl border border-zinc-200 dark:border-zinc-700',
          'bg-white/90 dark:bg-zinc-800/90 backdrop-blur-xl shadow-lg',
          'px-3 py-2 md:px-4 md:py-2.5'
        )}>
          {/* Logo */}
          <div className="flex items-center justify-start shrink-0">
            <Link to="/" className="flex items-center gap-2 shrink-0 group">
              <div className="group-hover:shadow-indigo-500/40 group-active:scale-95 transition-all">
                <AppLogo size="xs" />
              </div>
              <span className="font-semibold tracking-tight text-zinc-800 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400">
                PROJECTO
              </span>
            </Link>
          </div>

        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, active }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'px-4 py-1.5 text-[14px] font-[600] rounded-full transition-all duration-200',
                active
                  ? 'bg-zinc-900 text-white dark:bg-[rgba(124,92,255,0.16)] dark:text-white dark:border dark:border-[rgba(124,92,255,0.35)]'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile nav - compact row on the right */}
        <div className="flex md:hidden flex-1 min-w-0 items-center justify-end gap-1 overflow-x-auto scrollbar-hide pl-2">
          {navLinks.filter(({ active }) => !active).map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="px-2 py-1 text-[10px] font-medium rounded-md whitespace-nowrap text-zinc-500 dark:text-zinc-400"
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 md:gap-2 shrink-0">
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
          {(() => {
            const showSync =
              syncStatus === 'syncing' ||
              syncStatus === 'queued' ||
              syncStatus === 'offline' ||
              !!lastSavedAt;
            const label =
              syncStatus === 'offline'
                ? 'Offline'
                : syncStatus === 'queued'
                  ? 'In coda'
                  : syncStatus === 'syncing'
                    ? 'Salvataggio…'
                    : 'Salvato';
            const colorClass =
              syncStatus === 'offline' || syncStatus === 'queued'
                ? 'text-amber-600 dark:text-amber-400'
                : syncStatus === 'syncing'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-emerald-600 dark:text-emerald-400';
            return (
              <motion.span
                initial={false}
                animate={{ opacity: showSync ? 1 : 0, x: 0 }}
                className={cn(
                  'hidden md:flex items-center gap-1 text-xs font-semibold min-w-[88px] justify-end',
                  colorClass
                )}
                role="status"
                aria-live="polite"
              >
                {syncStatus === 'offline' || syncStatus === 'queued' ? (
                  <Icons.Clock className="h-3.5 w-3.5 shrink-0" />
                ) : syncStatus === 'syncing' ? (
                  <Icons.Refresh className="h-3.5 w-3.5 shrink-0 animate-spin" />
                ) : (
                  <Icons.Check className="h-3.5 w-3.5 shrink-0" />
                )}
                {label}
              </motion.span>
            );
          })()}
          <Button
            variant="ghost"
            onClick={() => {
              setIsDark((d) => {
                const next = !d;
                localStorage.setItem('km-theme', next ? 'dark' : 'light');
                setTimeout(() => window.dispatchEvent(new Event('theme-changed')), 0);
                return next;
              });
            }}
            className="hidden md:flex h-10 w-10 p-0 rounded-xl"
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
            ? cn('flex w-full flex-col flex-1 min-h-0 overflow-y-auto', isSharedProject ? 'px-0' : 'px-0')
            : 'w-full'
        )}
      >
        {children}
      </main>
    </div>
  );
}
