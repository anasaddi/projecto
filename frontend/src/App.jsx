import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React, { Suspense, lazy } from 'react'

import { DashboardStatsProvider } from './context/DashboardStatsContext'
import Layout from './components/Layout'
import AppErrorBoundary from './components/AppErrorBoundary'

const SourceList = lazy(() => import('./pages/SourceList'))
const Reader = lazy(() => import('./pages/vecchi/Reader'))
const YouTubeViewer = lazy(() => import('./pages/YouTubeViewer'))
const DashboardV2 = lazy(() => import('./pages/DashboardV2'))
const SharedProjects = lazy(() => import('./pages/SharedProjects'))
const Training = lazy(() => import('./pages/Training2'))
const Welcome = lazy(() => import('./pages/Welcome'))

function RouteLoader() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
    </div>
  )
}

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
        <AppErrorBoundary>
          <Layout>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/source/:sourceId" element={<AdminRoute><Reader /></AdminRoute>} />
                <Route path="/dashboard" element={<AdminRoute><DashboardV2 /></AdminRoute>} />
                <Route path="/shared" element={<SharedProjects />} />
                <Route path="/shared/:shareId" element={<SharedProjects />} />
                <Route path="/youtube" element={<AdminRoute><YouTubeViewer /></AdminRoute>} />
                <Route path="/training" element={<AdminRoute><Training /></AdminRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Layout>
        </AppErrorBoundary>
      </DashboardStatsProvider>
    </BrowserRouter>
  )
}
