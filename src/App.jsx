// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root application with routing and layout
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import { registerGlobalIngestor } from './services/hardwareService';

// Layout
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import CriticalAlertOverlay from './components/CriticalAlertOverlay';

// Pages
import LandingPage      from './pages/LandingPage';
import DashboardPage    from './pages/DashboardPage';
import LiveMonitorPage  from './pages/LiveMonitorPage';
import RoomsPage        from './pages/RoomsPage';
import AlertCenterPage  from './pages/AlertCenterPage';
import AnalyticsPage    from './pages/AnalyticsPage';
import DevicesPage      from './pages/DevicesPage';
import SettingsPage     from './pages/SettingsPage';
import FullscreenPage   from './pages/FullscreenPage';

// ── Layout wrapper for dashboard pages ───────────────────────────────────────
function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { ingestHardwareReading, alerts, sessionAlerts } = useApp();

  // Register global hardware ingestor on mount
  useEffect(() => {
    registerGlobalIngestor(ingestHardwareReading);
  }, [ingestHardwareReading]);

  // Show critical overlay ONLY for alerts created in this session (not demo/historical data)
  const hasCritical = sessionAlerts.some(a => !a.acknowledged && a.severity === 'CRITICAL');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(prev => !prev)} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/live"      element={<LiveMonitorPage />} />
            <Route path="/rooms"     element={<RoomsPage />} />
            <Route path="/alerts"    element={<AlertCenterPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/devices"   element={<DevicesPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Critical alert overlay */}
      {hasCritical && <CriticalAlertOverlay />}
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* Landing page — no sidebar */}
          <Route path="/landing" element={<LandingPage />} />

          {/* Full-screen display — no sidebar */}
          <Route path="/fullscreen" element={<FullscreenPage />} />

          {/* Dashboard layout — with sidebar */}
          <Route path="/*" element={<DashboardLayout />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
