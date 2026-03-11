import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React, { useEffect } from 'react'

import { DashboardStatsProvider } from './context/DashboardStatsContext'
import Layout from './components/Layout'
import SourceList from './pages/SourceList'
import Reader from './pages/vecchi/Reader'
import YouTubeViewer from './pages/YouTubeViewer'
import DashboardV2 from './pages/DashboardV2'
import SharedProjects from './pages/SharedProjects'
import Training from './pages/Training'
import Training2 from './pages/Training2'

// --- Admin Protection Wrapper ---
function AdminRoute({ children }) {
  const role = localStorage.getItem('km-user-role');
  const token = localStorage.getItem('km-admin-token');
  
  // Se l'utente non è admin, non può vedere questa pagina.
  // Viene reindirizzato alla pagina di benvenuto o resta bloccato.
  if (role !== 'admin' || token !== 'master-key') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// --- Auth Initialization (Synchronous) ---
const initAuth = () => {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  const isShared = path.startsWith('/shared/');
  const keyParam = params.get('key');
  
  // Se l'utente fornisce la chiave corretta nell'URL, lo promuoviamo ad admin
  if (keyParam === 'master-key') {
    localStorage.setItem('km-user-role', 'admin');
    localStorage.setItem('km-admin-token', 'master-key');
    // Puliamo l'URL dal parametro per sicurezza
    window.history.replaceState({}, '', path);
  } else if (isShared) {
    // Se è un link condiviso, forziamo il ruolo guest se non è già admin
    const currentRole = localStorage.getItem('km-user-role');
    if (currentRole !== 'admin') {
      localStorage.setItem('km-user-role', 'guest');
      localStorage.removeItem('km-admin-token');
    }
  }
  // Se non è né admin né guest (nuovo utente su pagine private), 
  // AdminRoute si occuperà del redirect alla home.
};

// Eseguiamo l'inizializzazione immediatamente prima del render dei componenti
initAuth();

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DashboardStatsProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<SourceList />} />
            <Route path="/source/:sourceId" element={<Reader />} />
            <Route path="/dashboard" element={<AdminRoute><DashboardV2 /></AdminRoute>} />
            <Route path="/shared/:shareId" element={<SharedProjects />} />
            <Route path="/youtube" element={<AdminRoute><YouTubeViewer /></AdminRoute>} />
            <Route path="/training" element={<AdminRoute><Training /></AdminRoute>} />
            <Route path="/training2" element={<AdminRoute><Training2 /></AdminRoute>} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </DashboardStatsProvider>
    </BrowserRouter>
  )
}
