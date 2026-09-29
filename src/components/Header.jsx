// ─────────────────────────────────────────────────────────────────────────────
// Header — Top navigation bar
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import {
  Activity, ChevronDown, Maximize2, Bell, Menu, X,
  Building2, School, Cpu
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

export default function Header({ onMenuToggle }) {
  const { simMode, monitoringMode, setMonitoringMode, alerts, selectedLocation, usingFirebase } = useApp();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  const unacknowledged = alerts.filter(a => !a.acknowledged).length;

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleFullscreen = () => {
    navigate('/fullscreen');
  };

  return (
    <header className="bg-white border-b border-slate-100 px-4 lg:px-6 py-3 flex items-center gap-4 sticky top-0 z-40 shadow-sm">
      {/* Menu toggle (mobile) */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Logo + Title */}
      <div className="flex items-center gap-3 mr-4">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-navy-700 to-teal-600 flex items-center justify-center shadow-sm shrink-0">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-base font-black text-slate-800 leading-tight">Smart Noise Monitor</h1>
          <p className="text-xs text-slate-400 leading-none">Healthcare Environment</p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
        <span className="w-2 h-2 rounded-full bg-emerald-500 live-dot" />
        <span className="text-xs font-bold text-emerald-700">LIVE</span>
      </div>

      {/* Sim mode badge */}
      {simMode && (
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200">
          <Cpu className="w-3 h-3 text-purple-600" />
          <span className="text-xs font-bold text-purple-700">SIMULATION</span>
        </div>
      )}

      {/* Firebase indicator */}
      {!usingFirebase && (
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
          <span className="text-xs font-bold text-amber-700">DEMO MODE</span>
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Mode selector */}
      <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setMonitoringMode('hospital')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            monitoringMode === 'hospital'
              ? 'bg-white text-navy-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          Hospital
        </button>
        <button
          onClick={() => setMonitoringMode('general')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            monitoringMode === 'general'
              ? 'bg-white text-navy-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <School className="w-3.5 h-3.5" />
          General
        </button>
      </div>

      {/* Time */}
      <div className="hidden lg:block text-right">
        <p className="text-sm font-semibold text-slate-700 leading-tight">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <p className="text-xs text-slate-400">
          {time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
      </div>

      {/* Alert bell */}
      <button
        onClick={() => navigate('/alerts')}
        className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unacknowledged > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unacknowledged > 9 ? '9+' : unacknowledged}
          </span>
        )}
      </button>

      {/* Fullscreen */}
      <button
        onClick={handleFullscreen}
        className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
        title="Full-screen display"
      >
        <Maximize2 className="w-5 h-5 text-slate-600" />
      </button>
    </header>
  );
}
