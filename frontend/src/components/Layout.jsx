import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDashboardStats } from '../context/DashboardStatsContext'

export default function Layout({ children }) {
  const pathname = useLocation().pathname
  const isYouTube = pathname === '/youtube'
  const isDashboard = pathname === '/dashboard'
  const isTraining = pathname === '/training'
  const isShared = pathname.startsWith('/shared')
  const isWorkspace = isYouTube || isDashboard || isTraining || isShared
  const { stats } = useDashboardStats()

  const [isDark, setIsDark] = useState(() => localStorage.getItem('km-theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('km-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Layout minimale solo per guest (visualizza condivisi) o non-admin
  const isGuest = localStorage.getItem('km-user-role') === 'guest'
  const isAdmin = localStorage.getItem('km-user-role') === 'admin' && localStorage.getItem('km-admin-token') === 'master-key'

  if (isGuest || !isAdmin) {
    return (
      <div className="min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors flex flex-col">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <button
          type="button"
          onClick={() => setIsDark((d) => !d)}
          className="fixed bottom-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 dark:bg-white/[0.04] backdrop-blur-md border border-zinc-200 dark:border-white/[0.08] shadow-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-all hover:scale-105 active:scale-95"
          aria-label={isDark ? 'Tema chiaro' : 'Tema scuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </div>
    )
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', active: isDashboard },
    { to: '/shared', label: 'Condivisi', active: isShared },
    { to: '/training', label: 'Training', active: isTraining },
    { to: '/youtube', label: 'Transcript', active: isYouTube },
  ];

  return (
    <div className={`min-h-screen text-zinc-900 dark:text-zinc-100 transition-colors ${isWorkspace ? 'flex flex-col' : ''}`}>
      <header className="sticky top-0 z-50 border-b border-zinc-200/50 dark:border-white/[0.06] bg-white/70 dark:bg-[#0b0e14]/70 backdrop-blur-xl shadow-sm dark:shadow-black/50 px-5 py-3 flex items-center gap-6 shrink-0 transition-colors">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-active:scale-95 transition-all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
          </div>
          <span className="font-bold tracking-tight text-zinc-800 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors hidden sm:inline">
            Focus OS
          </span>
        </Link>
        <nav className="flex items-center gap-1.5 hidden md:flex">
          {navLinks.map(({ to, label, active }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-[8px] text-[13px] font-medium transition-all duration-200 ${active
                ? 'bg-zinc-900 text-white shadow-sm dark:bg-white/[0.08] dark:text-white'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200'
                }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile Nav Fallback Component */}
        <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {navLinks.map(({ to, label, active }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-[8px] text-[12px] font-medium whitespace-nowrap transition-all duration-200 ${active
                ? 'bg-zinc-900 text-white shadow-sm dark:bg-white/[0.08] dark:text-white'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-200'
                }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {isDashboard && stats && (
          <span className="rounded-md border border-zinc-200/50 bg-white shadow-sm dark:border-white/[0.06] dark:bg-white/[0.02] text-zinc-600 dark:text-zinc-300 px-3 py-1.5 text-xs font-semibold tabular-nums ml-auto md:ml-0">
            {stats.doneFocusItems} <span className="text-zinc-400 dark:text-zinc-500">/</span> {stats.totalFocusItems}
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsDark((d) => !d)}
          className="ml-auto shrink-0 flex h-8 w-8 items-center justify-center rounded-[8px] text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200 transition-all active:scale-95 border border-transparent hover:border-zinc-200/50 dark:hover:border-white/[0.06]"
          aria-label={isDark ? 'Tema chiaro' : 'Tema scuro'}
          title={isDark ? 'Tema chiaro' : 'Tema scuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </header>
      <main className={isWorkspace ? `flex w-full max-w-[1600px] mx-auto flex-col flex-1 min-h-0 ${isTraining ? 'overflow-x-auto overflow-y-hidden min-w-0' : 'overflow-hidden'}` : 'w-full max-w-[1600px] mx-auto p-4 md:p-6'}>
        {children}
      </main>
    </div>
  )
}
