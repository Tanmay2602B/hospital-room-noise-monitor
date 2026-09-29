// ─────────────────────────────────────────────────────────────────────────────
// CriticalAlertOverlay — Full-screen critical warning
// Only fires for alerts generated in the current browser session.
// Historical / demo data alerts NEVER trigger this overlay.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle, ArrowLeft, Clock } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatDuration } from '../utils/noiseUtils';
import { useNavigate } from 'react-router-dom';

export default function CriticalAlertOverlay() {
  const { sessionAlerts, acknowledgeAlert, locations } = useApp();
  const navigate = useNavigate();
  const [elapsed, setElapsed] = useState(0);

  // Only use alerts from THIS session — never historical/demo data
  const latestCritical = sessionAlerts
    ? sessionAlerts.find(a => !a.acknowledged && a.severity === 'CRITICAL')
    : null;

  useEffect(() => {
    if (!latestCritical) return;
    const t = setInterval(() => {
      const sec = (Date.now() - new Date(latestCritical.createdAt).getTime()) / 1000;
      setElapsed(Math.round(sec));
    }, 1000);
    return () => clearInterval(t);
  }, [latestCritical?.alertId]);

  if (!latestCritical) return null;

  const location = locations.find(l => l.locationId === latestCritical.locationId);

  return (
    <div className="fixed inset-0 z-50 bg-red-600 flex flex-col items-center justify-center p-8 animate-fade-in">
      {/* Striped background */}
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0px, white 1px, transparent 1px, transparent 20px)' }}
      />

      <div className="relative text-center max-w-2xl mx-auto">
        {/* Pulsing icon */}
        <div className="flex justify-center mb-6">
          <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center critical-pulse">
            <AlertOctagon className="w-16 h-16 text-white" />
          </div>
        </div>

        <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
          ⚠ NOISE LEVEL TOO HIGH!
        </h1>

        {/* Reading */}
        <div className="bg-white/20 rounded-3xl p-6 mb-6">
          <p className="text-white/70 text-lg font-semibold mb-1">Current Relative Level</p>
          <p className="text-7xl md:text-9xl font-black text-white leading-none">
            {latestCritical.noiseLevel}
          </p>
          <p className="text-white/70 text-xl font-semibold">/ 100 (approx. — not calibrated dB)</p>
        </div>

        {/* Location */}
        <p className="text-white/90 text-2xl font-bold mb-2">
          📍 {latestCritical.locationName || location?.locationName || latestCritical.locationId}
        </p>

        {/* Duration */}
        <div className="flex items-center justify-center gap-2 text-white/70 text-lg mb-6">
          <Clock className="w-5 h-5" />
          <span>Alert active for: <strong className="text-white">{formatDuration(elapsed)}</strong></span>
        </div>

        {/* Message */}
        <div className="bg-white/15 rounded-2xl px-6 py-4 mb-8 border border-white/30">
          <p className="text-white text-xl font-semibold">
            Please maintain a quiet environment near this location.
          </p>
          <p className="text-white/60 text-sm mt-2">
            Informational alert only. Does not replace hospital staff judgment or medical guidance.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => acknowledgeAlert(latestCritical.alertId)}
            className="flex items-center gap-3 px-8 py-4 bg-white text-red-600 rounded-2xl text-xl font-black hover:bg-red-50 transition-colors shadow-lg active:scale-95"
          >
            <CheckCircle className="w-6 h-6" />
            Acknowledge Alert
          </button>
          <button
            onClick={() => { acknowledgeAlert(latestCritical.alertId); navigate('/'); }}
            className="flex items-center gap-2 px-6 py-4 bg-white/20 text-white rounded-2xl text-lg font-bold hover:bg-white/30 transition-colors border border-white/30 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
