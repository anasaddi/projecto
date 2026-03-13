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

  // Layout minimale solo per guest (visualizza condivisi) o home per non-admin
  const isGuest = localStorage.getItem('km-user-role') === 'guest'
  const isAdmin = localStorage.getItem('km-user-role') === 'admin' && localStorage.getItem('km-admin-token') === 'master-key'
  
  if (isGuest || (!isAdmin && pathname === '/')) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors flex flex-col">
        <main className="flex-1 overflow-auto">
          {children}
        </main>
        <button
          type="button"
          onClick={() => setIsDark((d) => !d)}
          className="fixed bottom-4 right-4 z-50 rounded-full p-3 bg-white dark:bg-stone-800 shadow-lg text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-all border border-stone-200 dark:border-stone-700"
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
    <div className={`min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors ${isWorkspace ? 'flex flex-col' : ''}`}>
      <header className="sticky top-0 z-50 border-b border-stone-200/80 dark:border-stone-700/80 bg-white/98 dark:bg-stone-900/98 backdrop-blur-md shadow-sm shadow-stone-900/5 dark:shadow-black/20 px-5 py-3 flex items-center gap-6 shrink-0 transition-colors">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/30 transition-shadow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          </div>
          <span className="font-bold text-stone-800 dark:text-stone-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors hidden sm:inline">
            Focus OS
          </span>
        </Link>
        <nav className="flex items-center gap-1">
          {navLinks.map(({ to, label, active }) => (
            <Link
              key={to}
              to={to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400'
                  : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>
        {isDashboard && stats && (
          <span className="rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 text-xs font-semibold tabular-nums border border-indigo-500/20">
            {stats.doneFocusItems} / {stats.totalFocusItems}
          </span>
        )}
        <button
          type="button"
          onClick={() => setIsDark((d) => !d)}
          className="ml-auto shrink-0 rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-700 dark:text-stone-500 dark:hover:text-stone-300 transition-colors"
          aria-label={isDark ? 'Tema chiaro' : 'Tema scuro'}
          title={isDark ? 'Tema chiaro' : 'Tema scuro'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>
      </header>
      <main className={isWorkspace ? `flex flex-col flex-1 min-h-0 ${isTraining ? 'overflow-x-auto overflow-y-hidden min-w-0' : 'overflow-hidden'}` : 'max-w-5xl mx-auto p-4'}>
        {children}
      </main>
    </div>
  )
}
