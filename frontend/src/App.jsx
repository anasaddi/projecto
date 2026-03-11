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
import Welcome from './pages/Welcome'

// --- Admin Protection Wrapper ---
function AdminRoute({ children }) {
  const role = localStorage.getItem('km-user-role');
  const token = localStorage.getItem('km-admin-token');
  
  if (role !== 'admin' || token !== 'master-key') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// --- Home Component (Handles Redirect) ---
function HomePage() {
  const role = localStorage.getItem('km-user-role');
  const token = localStorage.getItem('km-admin-token');
  
  if (role === 'admin' && token === 'master-key') {
    return <SourceList />;
  }
  return <Welcome />;
}

// --- Auth Initialization (Synchronous) ---
const initAuth = () => {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  const isShared = path.startsWith('/shared/');
  const keyParam = params.get('key');
  
  if (keyParam === 'master-key') {
    localStorage.setItem('km-user-role', 'admin');
    localStorage.setItem('km-admin-token', 'master-key');
    window.history.replaceState({}, '', path);
  } else if (isShared) {
    const currentRole = localStorage.getItem('km-user-role');
    if (currentRole !== 'admin') {
      localStorage.setItem('km-user-role', 'guest');
      localStorage.removeItem('km-admin-token');
    }
  }
};

// Eseguiamo l'inizializzazione immediatamente prima del render dei componenti
initAuth();

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DashboardStatsProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/source/:sourceId" element={<AdminRoute><Reader /></AdminRoute>} />
            <Route path="/dashboard" element={<AdminRoute><DashboardV2 /></AdminRoute>} />
            <Route path="/shared/:shareId" element={<SharedProjects />} />
            <Route path="/youtube" element={<AdminRoute><YouTubeViewer /></AdminRoute>} />
            <Route path="/training" element={<AdminRoute><Training /></AdminRoute>} />
            <Route path="/training2" element={<AdminRoute><Training2 /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </DashboardStatsProvider>
    </BrowserRouter>
  )
}
