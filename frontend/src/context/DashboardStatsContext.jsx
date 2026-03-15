import { createContext, useContext, useState } from 'react'

const DashboardStatsContext = createContext(null)

export function DashboardStatsProvider({ children }) {
  const [stats, setStats] = useState({ doneFocusItems: 0, totalFocusItems: 0 })

  const updateStats = (done, total) => {
    setStats({ doneFocusItems: Math.round(done), totalFocusItems: Math.round(total) })
  }

  return (
    <DashboardStatsContext.Provider value={{ stats, setStats, updateStats }}>
      {children}
    </DashboardStatsContext.Provider>
  )
}

export function useDashboardStats() {
  return useContext(DashboardStatsContext)
}
