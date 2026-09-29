// ─────────────────────────────────────────────────────────────────────────────
// Landing Page
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Zap, Shield, BarChart3, Radio, ChevronRight,
  Building2, Globe, Cpu, Wifi, AlertTriangle, CheckCircle
} from 'lucide-react';

const features = [
  { icon: Radio,       title: 'Live Monitoring',    desc: 'Real-time noise readings from connected sensors or simulation mode.', color: 'teal' },
  { icon: AlertTriangle, title: 'Smart Alerts',     desc: 'Sustained-duration threshold detection prevents false alarms.', color: 'amber' },
  { icon: BarChart3,   title: 'Analytics',          desc: 'Historical trends, comparisons, and CSV export.', color: 'navy' },
  { icon: Cpu,         title: 'ESP32 Ready',        desc: 'Built-in hardware integration module for Wi-Fi sensor devices.', color: 'purple' },
  { icon: Globe,       title: 'Multi-Location',     desc: 'Monitor rooms, wards, ICUs, classrooms, and more simultaneously.', color: 'emerald' },
  { icon: Shield,      title: 'Privacy First',      desc: 'Only numeric readings stored. No audio recorded or transmitted.', color: 'slate' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-950 to-teal-900 text-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-16 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <Activity className="w-6 h-6 text-teal-400" />
          </div>
          <span className="font-black text-xl">Smart Noise Monitor</span>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 rounded-xl font-bold text-sm transition-colors"
        >
          Open Dashboard
        </button>
      </nav>

      {/* Hero */}
      <section className="px-6 lg:px-16 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-500/30 text-teal-400 text-sm font-semibold mb-6">
          <span className="w-2 h-2 bg-teal-400 rounded-full live-dot" />
          Hackathon MVP — Live Demo Ready
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
          Monitor Hospital Room<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-sky-400">
            Noise in Real Time
          </span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10">
          An intelligent noise monitoring system for hospitals and general environments.
          Live alerts, multi-room dashboards, ESP32 integration, and simulation mode.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-400 rounded-2xl font-black text-lg transition-all hover:scale-105"
          >
            Launch Dashboard <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/live')}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/15 rounded-2xl font-bold text-lg border border-white/20 transition-all"
          >
            <Zap className="w-5 h-5 text-yellow-400" />
            Try Simulation
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 lg:px-16 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {[
            { val: '6',    unit: 'Rooms',          desc: 'Demo locations' },
            { val: '10s',  unit: 'Alert delay',     desc: 'Sustained threshold' },
            { val: '3',    unit: 'Status levels',   desc: 'Normal/Warning/Critical' },
            { val: '100%', unit: 'Privacy safe',    desc: 'No audio stored' },
          ].map(({ val, unit, desc }) => (
            <div key={unit} className="text-center p-4 rounded-2xl bg-white/5 border border-white/10">
              <p className="text-3xl font-black text-teal-400">{val}</p>
              <p className="font-bold text-white text-sm">{unit}</p>
              <p className="text-white/40 text-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-6 lg:px-16 py-16">
        <h2 className="text-3xl font-black text-center mb-10">Everything you need</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-teal-400" />
              </div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Privacy notice */}
      <section className="px-6 lg:px-16 py-12 border-t border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <Shield className="w-8 h-8 text-teal-400 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-2">Privacy & Safety Notice</h3>
          <p className="text-white/40 text-sm leading-relaxed">
            This system stores only numeric noise measurements. No audio is recorded or transmitted.
            Approximate readings depend on sensor and calibration. Alerts are informational only
            and do not replace hospital staff. This system does not diagnose medical conditions.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 lg:px-16 py-6 border-t border-white/10 flex items-center justify-between">
        <p className="text-white/30 text-sm">Smart Noise Monitor — Hackathon MVP 2026</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="text-teal-400 text-sm font-semibold hover:text-teal-300 transition-colors"
        >
          Open Dashboard →
        </button>
      </footer>
    </div>
  );
}
