import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const DEFAULT_CONFIG = {
  PRAYERS: ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'],
  PROJECT_ACCENTS: {},
}

const GlobalConfigContext = createContext(null)

export function GlobalConfigProvider({ children }) {
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchConfig = async () => {
      const token = localStorage.getItem('km-admin-token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await api.config.getConstants();
        setConfig(data || DEFAULT_CONFIG);
      } catch (err) {
        console.error('Failed to fetch global config:', err);
        setError(err);
        // Keep DEFAULT_CONFIG so components never see null
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, [])

  return (
    <GlobalConfigContext.Provider value={{ config, loading, error }}>
      {children}
    </GlobalConfigContext.Provider>
  )
}

export function useGlobalConfig() {
  return useContext(GlobalConfigContext)
}
