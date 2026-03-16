import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React, { Suspense, lazy } from 'react'

import { DashboardStatsProvider } from './context/DashboardStatsContext'
import { GlobalConfigProvider } from './context/GlobalConfigContext'
import Layout from './components/Layout'
import AppErrorBoundary from './components/AppErrorBoundary'
import { isTokenExpired } from './api/client'

const SourceList = lazy(() => import('./pages/SourceList'))
const YouTubeViewer = lazy(() => import('./pages/YouTubeViewer'))
const DashboardV2 = lazy(() => import('./pages/DashboardV2'))
const SharedProjects = lazy(() => import('./pages/SharedProjects'))
const Training = lazy(() => import('./pages/Training2'))
const Welcome = lazy(() => import('./pages/Welcome'))

const Login = lazy(() => import('./pages/Login'))

function RouteLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0b0e14] transition-colors duration-500 overflow-hidden">
      <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
    </div>
  )
}

// --- Admin Protection Wrapper ---
function AdminRoute({ children }) {
  const role = localStorage.getItem('km-user-role');
  const token = localStorage.getItem('km-admin-token');
  if (role !== 'admin' || !token) {
    return <Navigate to="/login" replace />;
  }
  if (isTokenExpired(token)) {
    localStorage.removeItem('km-admin-token');
    localStorage.removeItem('km-user-role');
    return <Navigate to="/login" replace />;
  }
  return children;
}

// --- Home Component (Handles Redirect) ---
function HomePage() {
  const role = localStorage.getItem('km-user-role');
  const token = localStorage.getItem('km-admin-token');
  if (role === 'admin' && token && !isTokenExpired(token)) {
    return <SourceList />;
  }
  return <Welcome />;
}

// --- Auth Initialization ---
const initAuth = () => {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  const isShared = path.startsWith('/shared/');
  const keyParam = params.get('key');
  
  // URL auto-login is now deprecated but kept for backwards compatibility if a token is provided
  // Note: specific string 'master-key' has been removed.
  if (keyParam) {
    localStorage.setItem('km-user-role', 'admin');
    localStorage.setItem('km-admin-token', keyParam);
    window.history.replaceState({}, '', path);
  } else if (isShared) {
    const currentRole = localStorage.getItem('km-user-role');
    if (currentRole !== 'admin') {
      localStorage.setItem('km-user-role', 'guest');
      localStorage.removeItem('km-admin-token');
    }
  }
};

initAuth();

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <DashboardStatsProvider>
        <GlobalConfigProvider>
          <AppErrorBoundary>
          <Layout>
            <Suspense fallback={<RouteLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<AdminRoute><DashboardV2 /></AdminRoute>} />
                <Route path="/shared" element={<SharedProjects />} />
                <Route path="/shared/:shareId" element={<SharedProjects />} />
                <Route path="/youtube" element={<AdminRoute><YouTubeViewer /></AdminRoute>} />
                <Route path="/training" element={<AdminRoute><Training /></AdminRoute>} />
                <Route path="*" element={<Welcome />} />
              </Routes>
            </Suspense>
          </Layout>
          </AppErrorBoundary>
        </GlobalConfigProvider>
      </DashboardStatsProvider>
    </BrowserRouter>
  )
}
