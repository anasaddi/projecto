import { createContext, useContext, useState } from 'react'

const DashboardStatsContext = createContext(null)

export function DashboardStatsProvider({ children }) {
  const [stats, setStats] = useState(null)
  return (
    <DashboardStatsContext.Provider value={{ stats, setStats }}>
      {children}
    </DashboardStatsContext.Provider>
  )
}

export function useDashboardStats() {
  return useContext(DashboardStatsContext)
}
