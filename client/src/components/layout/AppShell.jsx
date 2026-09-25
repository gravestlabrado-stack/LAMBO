import React from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import { useAuth } from '../../hooks/useAuth';

const pageTitles = {
  '/': { title: 'Dashboard', subtitle: 'CAMPUS OVERVIEW' },
  '/scan': { title: 'QR Scanner', subtitle: 'FIELD IDENTIFICATION' },
  '/trees': { title: 'Tree Registry', subtitle: 'ALL SPECIMENS' },
  '/logs': { title: 'Growth Logs', subtitle: 'FIELD OBSERVATIONS' },
  '/register-tree': { title: 'Register Specimen', subtitle: 'NEW WILDLING' },
  '/map': { title: 'Campus Map', subtitle: 'GEOSPATIAL LOCATIONS' },
};

export default function AppShell() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const current = pageTitles[location.pathname] || {
    title: 'LAMBO',
    subtitle: 'BOTANICAL MONITORING',
  };

  return (
    <div className="min-h-screen bg-[#282E16] text-[#F0F3E8] flex flex-col font-body">
      <Header title={current.title} subtitle={current.subtitle} />
      <main className="flex-1 w-full max-w-5xl mx-auto pt-20 pb-24 px-4">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
