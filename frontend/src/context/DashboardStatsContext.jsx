import { createContext, useContext, useState, useCallback, useMemo } from 'react'

const DashboardStatsContext = createContext(null)

export function DashboardStatsProvider({ children }) {
  const [stats, setStats] = useState({ doneFocusItems: 0, totalFocusItems: 0 })

  const updateStats = useCallback((done, total) => {
    setStats({ doneFocusItems: Math.round(done), totalFocusItems: Math.round(total) })
  }, [])

  const value = useMemo(() => ({ stats, setStats, updateStats }), [stats, updateStats])

  return (
    <DashboardStatsContext.Provider value={value}>
      {children}
    </DashboardStatsContext.Provider>
  )
}

export function useDashboardStats() {
  return useContext(DashboardStatsContext)
}
