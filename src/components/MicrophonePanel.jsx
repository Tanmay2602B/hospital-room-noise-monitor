// ─────────────────────────────────────────────────────────────────────────────
// MicrophonePanel — Browser microphone monitoring panel
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Square, AlertCircle, Info, SlidersHorizontal, Cpu } from 'lucide-react';
import { useMicrophone } from '../hooks/useMicrophone';
import { useApp } from '../contexts/AppContext';
import { getNoiseStatus, getStatusColors } from '../utils/noiseUtils';

// ── Animated waveform ─────────────────────────────────────────────────────
function WaveformBars({ active, level = 0 }) {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (!active) return;
    let raf;
    const loop = () => { setFrame(n => n + 1); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return (
    <div className="flex items-center justify-center gap-[3px] h-10">
      {Array.from({ length: 14 }).map((_, i) => {
        const t = frame / 7;
        const h = active
          ? Math.max(3, Math.round((level / 100) * 30 * (0.3 + 0.7 * Math.abs(Math.sin(t + i * 0.45)))))
          : 3;
        return (
          <div key={i}
            className={`rounded-full transition-none ${active ? 'bg-teal-500' : 'bg-slate-200'}`}
            style={{ width: 3, height: h }}
          />
        );
      })}
    </div>
  );
}

// ── Level bar ─────────────────────────────────────────────────────────────
function LevelBar({ level, warnAt, critAt }) {
  const pct     = Math.min(100, level || 0);
  const warnPct = Math.min(98, warnAt);
  const critPct = Math.min(98, critAt);
  const barColor = pct >= critAt ? 'bg-red-500' : pct >= warnAt ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="relative">
      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-100 ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="absolute top-0 h-4 w-px bg-amber-400" style={{ left: `${warnPct}%` }} />
      <div className="absolute top-0 h-4 w-px bg-red-500"   style={{ left: `${critPct}%` }} />
      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
        <span>0</span>
        <span className="text-amber-500 font-semibold">{warnAt}</span>
        <span className="text-red-500 font-semibold">{critAt}</span>
        <span>100</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function MicrophonePanel({ onLevelChange }) {
  const { ingestReading, selectedLocationId, locations, settings } = useApp();
  const {
    micState, micLevel, micError, micDevice,
    startMicrophone, stopMicrophone, setGain, isActive, isRequesting,
  } = useMicrophone();

  // Sensitivity slider — default 22 for built-in, 8 for external
  const [sensitivity, setSensitivity] = useState(22);

  const location = locations.find(l => l.locationId === selectedLocationId);
  const warnAt   = location?.warningThreshold  || 41;
  const critAt   = location?.criticalThreshold || 61;

  const { status } = getNoiseStatus(micLevel, warnAt, critAt);
  const colors = getStatusColors(status);

  // When mic device type is detected, set default sensitivity
  useEffect(() => {
    if (micDevice === 'external') setSensitivity(8);
    else if (micDevice === 'builtin') setSensitivity(22);
  }, [micDevice]);

  // Adjust gain in real time when slider moves
  const handleSensitivity = (val) => {
    setSensitivity(val);
    setGain(val);
  };

  const handleStart = async () => {
    await startMicrophone((level) => {
      ingestReading(selectedLocationId, level, 'microphone');
      if (onLevelChange) onLevelChange(level);
    }, sensitivity);
  };

  const levelPct = Math.min(100, micLevel || 0);

  return (
    <div className={`card border-2 transition-all duration-500 ${
      isActive
        ? status === 'CRITICAL' ? 'border-red-300 bg-red-50/40'
          : status === 'WARNING'  ? 'border-amber-300 bg-amber-50/30'
          : 'border-teal-300 bg-teal-50/30'
        : 'border-slate-100'
    }`}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className={`p-2 rounded-xl ${isActive ? 'bg-teal-100' : 'bg-slate-100'}`}>
          {isActive ? <Mic className="w-5 h-5 text-teal-600" /> : <MicOff className="w-5 h-5 text-slate-400" />}
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Browser Microphone</h3>
          <p className="text-xs text-slate-400">Web Audio API · No recordings saved</p>
        </div>
        {isActive && (
          <span className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-100 border border-teal-200">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500 live-dot" />
            <span className="text-xs font-bold text-teal-700">LIVE</span>
          </span>
        )}
      </div>

      {/* Mic device badge */}
      {isActive && micDevice !== 'unknown' && (
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold mb-3 ${
          micDevice === 'external'
            ? 'bg-purple-50 text-purple-700 border border-purple-200'
            : 'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          <Cpu className="w-3.5 h-3.5" />
          {micDevice === 'external' ? '🎧 External mic / Earbuds detected' : '💻 Built-in microphone detected'}
        </div>
      )}

      {/* Privacy note */}
      <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 border border-blue-100 mb-3">
        <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-600">
          <strong>Privacy:</strong> Audio processed locally — only numbers saved. No recordings.
        </p>
      </div>

      {/* Waveform */}
      <div className="flex justify-center mb-3">
        <WaveformBars active={isActive} level={micLevel || 0} />
      </div>

      {/* Level bar + reading */}
      {isActive && (
        <div className="mb-4 space-y-3">
          <LevelBar level={levelPct} warnAt={warnAt} critAt={critAt} />

          {/* Big dB reading */}
          <div className={`text-center py-3 rounded-xl border ${
            status === 'CRITICAL' ? 'bg-red-50 border-red-200'
            : status === 'WARNING' ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
          }`}>
            <p className={`text-5xl font-black leading-none ${colors.text}`}>{micLevel ?? 0}</p>
            <p className="text-xs text-slate-400 font-semibold mt-1">dB (approx.)</p>
            <p className={`text-sm font-bold mt-1 ${colors.text}`}>
              {status === 'NORMAL'   ? '✓ Quiet Environment'
               : status === 'WARNING'  ? '⚠ Noise Increasing'
               : '🔴 NOISE TOO LOUD!'}
            </p>
          </div>

          {(status === 'WARNING' || status === 'CRITICAL') && (
            <p className={`text-xs text-center font-semibold ${status === 'CRITICAL' ? 'text-red-600' : 'text-amber-600'}`}>
              Alert fires after {settings.alertDurationSeconds}s sustained {status.toLowerCase()} noise
            </p>
          )}

          {/* ── Sensitivity slider ─────────────────────────────────────── */}
          <div className="pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Mic Sensitivity
              </span>
              <span className="text-xs text-slate-400 font-mono">{sensitivity}×</span>
            </div>
            <input
              type="range" min={1} max={50} step={1}
              value={sensitivity}
              onChange={e => handleSensitivity(Number(e.target.value))}
              className="w-full accent-teal-500 h-1.5 cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-300 mt-0.5">
              <span>Low (earbuds)</span>
              <span>High (built-in mic)</span>
            </div>
            {micLevel === 0 && (
              <p className="text-xs text-amber-600 font-semibold mt-1 text-center">
                Still showing 0? Try sliding sensitivity higher →
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {micError && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 mb-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{micError}</p>
        </div>
      )}

      {/* ── Not started: show sensitivity hint ───────────────────────────── */}
      {!isActive && !micError && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-semibold">Starting Sensitivity</span>
            <span className="text-xs text-slate-400 font-mono">{sensitivity}×</span>
          </div>
          <input
            type="range" min={1} max={50} step={1}
            value={sensitivity}
            onChange={e => setSensitivity(Number(e.target.value))}
            className="w-full accent-teal-500 h-1.5 cursor-pointer"
          />
          <div className="flex justify-between text-xs text-slate-300">
            <span>Earbuds / External</span>
            <span>Built-in mic</span>
          </div>
        </div>
      )}

      {/* Button */}
      {!isActive ? (
        <button
          onClick={handleStart}
          disabled={isRequesting}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
            isRequesting
              ? 'bg-slate-100 text-slate-400 cursor-wait'
              : 'bg-teal-600 hover:bg-teal-700 text-white active:scale-95 shadow-sm'
          }`}
        >
          <Mic className="w-4 h-4" />
          {isRequesting ? 'Requesting permission…' : 'Start Microphone'}
        </button>
      ) : (
        <button
          onClick={stopMicrophone}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-all active:scale-95"
        >
          <Square className="w-4 h-4" />
          Stop Microphone
        </button>
      )}

      <p className="text-xs text-slate-400 text-center mt-2">
        Approx. dB · Not calibrated · Accuracy varies by device
      </p>
    </div>
  );
}
