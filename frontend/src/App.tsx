import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import React, { Suspense, lazy, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { setToastError } from './utils/errorLog';

import { DashboardStatsProvider } from './context/DashboardStatsContext';
import { GlobalConfigProvider } from './context/GlobalConfigContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import AppErrorBoundary from './components/AppErrorBoundary';
import { isTokenExpired } from './api/client';

const DashboardV2 = lazy(() => import('./pages/DashboardV2'));

const YouTubeViewer = lazy(() => import('./pages/YouTubeViewer'));
const SharedProjects = lazy(() => import('./pages/SharedProjects'));
const Training = lazy(() => import('./pages/Training2'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Login = lazy(() => import('./pages/Login'));
const SharedSectionGate = lazy(() => import('./components/shared/SharedSectionGate'));

function RouteLoader(): React.ReactElement {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0b0e14] transition-colors duration-500 overflow-hidden">
      <div className="w-8 h-8 border-2 border-zinc-300 border-t-zinc-700 rounded-full animate-spin" />
    </div>
  );
}

function AdminRoute({ children }: { children: React.ReactNode }): React.ReactElement {
  const role = localStorage.getItem('km-user-role');
  const token = localStorage.getItem('km-admin-token');
  if (role !== 'admin' || !token) {
    return <Navigate to="/login" replace />;
  }
  if (isTokenExpired(token)) {
    localStorage.removeItem('km-admin-token');
    localStorage.removeItem('km-user-role');
    localStorage.removeItem('km-training-allowed');
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function TrainingRoute({ children }: { children: React.ReactNode }): React.ReactElement {
  const allowed = localStorage.getItem('km-training-allowed') === '1';
  if (!allowed) return <Navigate to="/dashboard" replace />;
  return (
    <AdminRoute>
      {children}
    </AdminRoute>
  );
}

function HomePage(): React.ReactElement {
  const role = localStorage.getItem('km-user-role');
  const token = localStorage.getItem('km-admin-token');
  if (role === 'admin' && token && !isTokenExpired(token)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Welcome />;
}

const initAuth = (): void => {
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  const isShared = path.startsWith('/shared/');
  const keyParam = params.get('key');

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

export default function App(): React.ReactElement {
  useEffect(() => {
    setToastError((msg: string) => toast.error(msg));
  }, []);
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster richColors position="top-center" closeButton />
      <DashboardStatsProvider>
        <GlobalConfigProvider>
          <ToastProvider>
            <AppErrorBoundary>
              <Layout>
                <Suspense fallback={<RouteLoader />}>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/dashboard" element={<AdminRoute><DashboardV2 /></AdminRoute>} />
                    <Route path="/dashboard2" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard3" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/shared" element={<SharedProjects />} />
                    <Route path="/shared/:shareId" element={<SharedProjects />} />
                    <Route
                      path="/shared/:shareId/training"
                      element={
                        <SharedSectionGate section="training">
                          <Training />
                        </SharedSectionGate>
                      }
                    />
                    <Route
                      path="/shared/:shareId/transcript"
                      element={
                        <SharedSectionGate section="transcript">
                          <YouTubeViewer />
                        </SharedSectionGate>
                      }
                    />
                    <Route path="/youtube" element={<AdminRoute><YouTubeViewer /></AdminRoute>} />
                    <Route path="/training" element={<TrainingRoute><Training /></TrainingRoute>} />
                    <Route path="*" element={<Welcome />} />
                  </Routes>
                </Suspense>
              </Layout>
            </AppErrorBoundary>
          </ToastProvider>
        </GlobalConfigProvider>
      </DashboardStatsProvider>
    </BrowserRouter>
  );
}
