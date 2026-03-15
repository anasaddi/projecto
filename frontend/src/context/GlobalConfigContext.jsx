import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'

const GlobalConfigContext = createContext(null)

export function GlobalConfigProvider({ children }) {
  const [config, setConfig] = useState(null)
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
        setConfig(data);
      } catch (err) {
        console.error('Failed to fetch global config:', err);
        setError(err);
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
