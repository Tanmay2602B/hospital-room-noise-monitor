// ─────────────────────────────────────────────────────────────────────────────
// SimulationPanel — Control panel for simulation mode
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Play, Square, Zap, Volume2, VolumeX, TrendingDown, TrendingUp, Shuffle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const SCENARIOS = [
  { key: 'normal',   label: 'Normal',   icon: TrendingDown, color: 'emerald', desc: '15–35 dB' },
  { key: 'warning',  label: 'Warning',  icon: TrendingUp,   color: 'amber',   desc: '44–58 dB' },
  { key: 'critical', label: 'Critical', icon: Zap,          color: 'red',     desc: '63–80 dB' },
  { key: 'random',   label: 'Random',   icon: Shuffle,      color: 'purple',  desc: 'Mixed' },
];

export default function SimulationPanel({ compact = false }) {
  const { simMode, simScenario, startSimulation, stopSimulation, changeSimScenario, selectedLocationId, locations } = useApp();

  const location = locations.find(l => l.locationId === selectedLocationId);

  return (
    <div className={`card ${compact ? 'p-4' : ''}`}>
      {!compact && (
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Zap className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Simulation Engine</h3>
            <p className="text-xs text-slate-400">Generate demo noise readings</p>
          </div>
          {simMode && (
            <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold animate-pulse">
              RUNNING
            </span>
          )}
        </div>
      )}

      {/* Scenario buttons */}
      <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-2'} gap-2 mb-3`}>
        {SCENARIOS.map(({ key, label, icon: Icon, color, desc }) => (
          <button
            key={key}
            onClick={() => simMode ? changeSimScenario(key) : startSimulation(key)}
            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-center ${
              simMode && simScenario === key
                ? `border-${color}-400 bg-${color}-50 shadow-sm`
                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon className={`w-4 h-4 ${
              simMode && simScenario === key
                ? `text-${color}-600`
                : 'text-slate-400'
            }`} />
            <span className={`text-xs font-bold ${
              simMode && simScenario === key ? `text-${color}-700` : 'text-slate-600'
            }`}>{label}</span>
            {!compact && <span className="text-xs text-slate-400">{desc}</span>}
          </button>
        ))}
      </div>

      {/* Start / Stop */}
      <div className="flex gap-2">
        {!simMode ? (
          <button
            onClick={() => startSimulation(simScenario || 'random')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold transition-colors"
          >
            <Play className="w-4 h-4" />
            Start Simulation
          </button>
        ) : (
          <button
            onClick={stopSimulation}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
          >
            <Square className="w-4 h-4" />
            Stop Simulation
          </button>
        )}
      </div>

      {!compact && location && (
        <p className="text-xs text-slate-400 mt-2 text-center">
          Target: <span className="font-semibold text-slate-600">{location.locationName}</span>
        </p>
      )}
    </div>
  );
}
