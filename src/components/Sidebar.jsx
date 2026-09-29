// ─────────────────────────────────────────────────────────────────────────────
// Sidebar — Navigation sidebar
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Radio, Grid3X3, Bell, BarChart3,
  Settings, Cpu, MapPin, Zap, X, Activity,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',     end: true },
  { to: '/live',      icon: Radio,           label: 'Live Monitor' },
  { to: '/rooms',     icon: Grid3X3,         label: 'All Locations' },
  { to: '/alerts',    icon: Bell,            label: 'Alert Center' },
  { to: '/analytics', icon: BarChart3,       label: 'Analytics' },
  { to: '/devices',   icon: Cpu,             label: 'Devices' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
];

export default function Sidebar({ open, onClose }) {
  const { alerts, simMode } = useApp();
  const unacked = alerts.filter(a => !a.acknowledged).length;

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-slate-100 z-50
        flex flex-col shadow-xl transition-transform duration-300
        lg:static lg:translate-x-0 lg:shadow-none
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-navy-700 to-teal-600 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-800 text-sm leading-tight">Smart Noise<br />Monitor</span>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Sim badge */}
        {simMode && (
          <div className="mx-3 mt-3 px-3 py-2 rounded-xl bg-purple-50 border border-purple-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            <div>
              <p className="text-xs font-bold text-purple-700">SIMULATION MODE</p>
              <p className="text-xs text-purple-500">Using simulated data</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                isActive ? 'nav-link-active flex items-center justify-between' : 'nav-link flex items-center justify-between'
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span className="text-sm">{label}</span>
              </div>
              {label === 'Alert Center' && unacked > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                  {unacked > 9 ? '9+' : unacked}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100">
          <p className="text-xs text-slate-400">v1.0.0 — Hackathon MVP</p>
          <p className="text-xs text-slate-300">Smart Noise Monitor</p>
        </div>
      </aside>
    </>
  );
}
