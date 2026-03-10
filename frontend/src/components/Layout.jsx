import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDashboardStats } from '../context/DashboardStatsContext'

export default function Layout({ children }) {
  const pathname = useLocation().pathname
  const isYouTube = pathname === '/youtube'
  const isDashboard = pathname === '/dashboard'
  const isTraining = pathname === '/training'
  const isShared = pathname.startsWith('/shared/')
  const isWorkspace = isYouTube || isDashboard || isTraining || isShared
  const { stats } = useDashboardStats()

  const [isDark, setIsDark] = useState(() => localStorage.getItem('km-theme') === 'dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('km-theme', isDark ? 'dark' : 'light')
  }, [isDark])

  // Se è una pagina condivisa o l'utente è un guest, mostriamo un layout minimale
  const isGuest = localStorage.getItem('km-user-role') === 'guest'
  
  if (isShared || isGuest) {
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

  return (
    <div className={`min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors ${isWorkspace ? 'flex flex-col' : ''}`}>
      <header className="sticky top-0 z-50 border-b border-stone-200 dark:border-stone-700 bg-white/95 dark:bg-stone-900/95 backdrop-blur-sm px-4 py-3 flex items-center gap-4 shrink-0 transition-colors">
        <Link to="/" className="font-semibold text-stone-800 dark:text-stone-200 hover:text-stone-600 dark:hover:text-stone-400 transition-colors">
          KM Personal
        </Link>
        {isDashboard && stats && (
          <span className="rounded-md bg-stone-800 dark:bg-sky-900/80 text-white dark:text-sky-100 px-2.5 py-1 text-[11px] font-medium tabular-nums">
            {stats.doneFocusItems} / {stats.totalFocusItems}
          </span>
        )}
        <Link to="/dashboard" className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors">
          Dashboard
        </Link>
        <Link to="/training" className={`text-sm transition-colors ${isTraining ? 'font-medium text-emerald-600 dark:text-emerald-500' : 'text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200'}`}>
          Training UI
        </Link>
        <div className="relative group">
          <span className="text-sm text-stone-600 dark:text-stone-400 group-hover:text-stone-800 dark:group-hover:text-stone-200 transition-colors cursor-default">
            Learning
          </span>
          <div className="absolute left-0 top-full pt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50">
            <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-lg py-1 min-w-[10rem]">
              <Link
                to="/youtube"
                className="block px-4 py-2 text-sm text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-800 dark:hover:text-stone-200"
              >
                Transcript
              </Link>
            </div>
          </div>
        </div>
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
