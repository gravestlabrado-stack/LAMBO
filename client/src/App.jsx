import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { TreeProvider } from './context/TreeContext';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';

// Pages
import DashboardPage from './pages/DashboardPage';
import ScanPage from './pages/ScanPage';
import TreeListPage from './pages/TreeListPage';
import TreeProfilePage from './pages/TreeProfilePage';
import GrowthLogsPage from './pages/GrowthLogsPage';
import RegisterTreePage from './pages/RegisterTreePage';
import CampusMapPage from './pages/CampusMapPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TreeProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Main App Layout */}
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/scan" element={<ScanPage />} />
                <Route path="/trees" element={<TreeListPage />} />
                <Route path="/trees/:id" element={<TreeProfilePage />} />
                <Route path="/trees/:id/logs" element={<GrowthLogsPage />} />
                <Route path="/logs" element={<GrowthLogsPage />} />
                <Route path="/register-tree" element={<RegisterTreePage />} />
                <Route path="/map" element={<CampusMapPage />} />
                <Route path="/404" element={<NotFoundPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            <Analytics />
          </BrowserRouter>
        </TreeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
