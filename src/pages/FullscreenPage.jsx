// ─────────────────────────────────────────────────────────────────────────────
// Full-Screen Display Page
// Designed for 7-inch HDMI screen or large display.
// Hides navigation, shows large readable gauge + status.
// Works for Raspberry Pi kiosk mode.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Square, Minimize2, Maximize2, Zap, RefreshCw,
  Clock, Wifi, WifiOff, Activity, Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useMicrophone } from '../hooks/useMicrophone';
import { getNoiseStatus, getStatusColors, secondsSince, formatTime, generateSimulatedNoise } from '../utils/noiseUtils';
import NoiseGauge from '../components/NoiseGauge';
import NoiseChart from '../components/NoiseChart';

export default function FullscreenPage() {
  const {
    locations, selectedLocationId, setSelectedLocationId,
    readingHistory, settings, ingestReading,
  } = useApp();

  const {
    micState, micLevel, micError, isActive, isRequesting,
    startMicrophone, stopMicrophone, setGain,
  } = useMicrophone();

  const [sensitivity, setSensitivity] = useState(22);
  const [simRunning, setSimRunning]   = useState(false);
  const [simScenario, setSimScenario] = useState('random');
  const [fullscreen, setFullscreen]   = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [, tick] = useState(0);
  const simRef  = useRef(null);
  const hideRef = useRef(null);

  // Clock / stale tick
  useEffect(() => {
    const t = setInterval(() => tick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-hide controls after 5s of no interaction
  const resetHideTimer = () => {
    setShowControls(true);
    clearTimeout(hideRef.current);
    hideRef.current = setTimeout(() => setShowControls(false), 5000);
  };

  useEffect(() => {
    resetHideTimer();
    window.addEventListener('mousemove', resetHideTimer);
    window.addEventListener('touchstart', resetHideTimer);
    return () => {
      clearTimeout(hideRef.current);
      window.removeEventListener('mousemove', resetHideTimer);
      window.removeEventListener('touchstart', resetHideTimer);
    };
  }, []);

  const navigate = useNavigate();

  // Location & data
  const location   = locations.find(l => l.locationId === selectedLocationId) || locations[0];
  const history    = readingHistory[selectedLocationId] || [];
  const stale      = secondsSince(location?.lastUpdated) > settings.staleDataTimeoutSeconds;
  const noiseLevel = isActive ? micLevel : (!stale ? location?.currentNoise : null);
  const dataSource = isActive ? 'microphone' : (simRunning ? 'simulation' : null);
  const warnAt     = location?.warningThreshold  || 41;
  const critAt     = location?.criticalThreshold || 61;
  const { status } = getNoiseStatus(noiseLevel, warnAt, critAt);
  const colors     = getStatusColors(status);

  // Browser fullscreen API
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (_) {}
  };

  useEffect(() => {
    const h = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // Mic start
  const handleStartMic = async () => {
    clearInterval(simRef.current);
    simRef.current = null;
    setSimRunning(false);
    await startMicrophone((level) => {
      ingestReading(selectedLocationId, level, 'microphone');
    }, sensitivity);
  };

  // Simulation
  const handleStartSim = (scenario) => {
    stopMicrophone();
    clearInterval(simRef.current);
    setSimScenario(scenario);
    setSimRunning(true);
    simRef.current = setInterval(() => {
      ingestReading(selectedLocationId, generateSimulatedNoise(scenario), 'simulation');
    }, settings.simulationIntervalMs);
  };

  const handleStopSim = () => {
    clearInterval(simRef.current);
    simRef.current = null;
    setSimRunning(false);
  };

  useEffect(() => () => { clearInterval(simRef.current); }, []);

  // Background color by status
  const pageBg =
    noiseLevel === null ? 'bg-slate-900' :
    status === 'CRITICAL' ? 'bg-red-950' :
    status === 'WARNING'  ? 'bg-amber-950' : 'bg-slate-900';

  const statusTextColor =
    status === 'CRITICAL' ? 'text-red-400' :
    status === 'WARNING'  ? 'text-amber-400' : 'text-emerald-400';

  const statusBg =
    status === 'CRITICAL' ? 'bg-red-500' :
    status === 'WARNING'  ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div
      className={`min-h-screen ${pageBg} flex flex-col transition-colors duration-700`}
      onClick={resetHideTimer}
    >
      {/* ── Top bar (auto-hides) ─────────────────────────────────────────── */}
      <div className={`flex items-center justify-between px-6 py-3 border-b border-white/10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        {/* Left: project name */}
        <div>
          <h1 className="text-lg font-black text-white tracking-wider">SMART NOISE MONITOR</h1>
          <p className="text-xs text-white/40">Relative noise level · Not calibrated dB(A)</p>
        </div>

        {/* Center: location + time */}
        <div className="text-center">
          <p className="text-white font-bold text-sm">{location?.locationName}</p>
          <p className="text-white/40 text-xs flex items-center gap-1 justify-center">
            <Clock className="w-3 h-3" />
            {new Date().toLocaleTimeString()}
          </p>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2">
          {/* Source status */}
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isActive     ? 'bg-teal-500/20 text-teal-400 border border-teal-500/40' :
            simRunning   ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40' :
                          'bg-slate-700 text-slate-400 border border-slate-600'
          }`}>
            {isActive ? '🎤 MIC LIVE' : simRunning ? '⚡ DEMO' : '⬜ IDLE'}
          </span>

          <button onClick={() => navigate('/')} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="Back to dashboard">
            <Minimize2 className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors">
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Main display ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 gap-4">

        {/* Project title on display */}
        <div className="text-center">
          <p className="text-white/30 text-xs tracking-[0.25em] uppercase font-semibold">Hospital Room · Noise Level</p>
          <p className="text-white font-bold text-xl">{location?.locationName}</p>
        </div>

        {/* Giant gauge */}
        <div className="w-full flex justify-center">
          <NoiseGauge
            noiseLevel={noiseLevel}
            warningThreshold={warnAt}
            criticalThreshold={critAt}
            size="xl"
            dataSource={dataSource}
          />
        </div>

        {/* Status banner */}
        <div className={`px-8 py-4 rounded-2xl text-center w-full max-w-lg border-2 ${
          noiseLevel === null ? 'bg-slate-800 border-slate-700' :
          status === 'CRITICAL' ? 'bg-red-900/60 border-red-500 critical-pulse' :
          status === 'WARNING'  ? 'bg-amber-900/60 border-amber-500' :
                                  'bg-emerald-900/60 border-emerald-500'
        }`}>
          <p className={`text-4xl font-black ${statusTextColor} mb-1`}>
            {noiseLevel === null ? 'OFFLINE'
             : status === 'NORMAL'   ? 'NORMAL'
             : status === 'WARNING'  ? 'WARNING'
             : 'HIGH NOISE'}
          </p>
          <p className="text-white/60 text-sm">
            {noiseLevel === null   ? 'No signal — start microphone or simulation'
             : status === 'NORMAL'   ? 'Environment is quiet'
             : status === 'WARNING'  ? 'Noise level is increasing — please reduce noise'
             : 'PLEASE MAINTAIN SILENCE'}
          </p>
        </div>

        {/* Mini chart */}
        {history.length > 5 && (
          <div className="w-full max-w-2xl bg-white/5 rounded-2xl p-4">
            <NoiseChart
              data={history.slice(-60)}
              warningThreshold={warnAt}
              criticalThreshold={critAt}
              height={120}
              mini
            />
          </div>
        )}

        {/* Stale / connection status */}
        {stale && location?.lastUpdated && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 text-sm">
            <WifiOff className="w-4 h-4" />
            Data is stale since {formatTime(location.lastUpdated)}
          </div>
        )}
      </div>

      {/* ── Bottom controls (auto-hide) ──────────────────────────────────── */}
      <div className={`px-6 py-4 border-t border-white/10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="flex flex-wrap items-center justify-center gap-3">

          {/* Location selector */}
          <select
            className="bg-white/10 text-white text-sm rounded-xl px-3 py-2 border border-white/20 focus:outline-none focus:ring-2 focus:ring-teal-500"
            value={selectedLocationId}
            onChange={e => setSelectedLocationId(e.target.value)}
          >
            {locations.map(l => <option key={l.locationId} value={l.locationId} className="bg-slate-800">{l.locationName}</option>)}
          </select>

          {/* Sensitivity */}
          {(isActive || !simRunning) && (
            <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
              <span className="text-white/60 text-xs">Sensitivity</span>
              <input type="range" min={1} max={50} step={1} value={sensitivity}
                onChange={e => { const v = Number(e.target.value); setSensitivity(v); setGain(v); }}
                className="w-24 accent-teal-500 h-1.5"
              />
              <span className="text-white/60 text-xs font-mono">{sensitivity}×</span>
            </div>
          )}

          {/* Mic button */}
          {!isActive ? (
            <button
              onClick={handleStartMic}
              disabled={isRequesting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-white font-bold text-sm transition-all active:scale-95"
            >
              <Mic className="w-4 h-4" />
              {isRequesting ? 'Requesting…' : 'Start Microphone'}
            </button>
          ) : (
            <button
              onClick={stopMicrophone}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm transition-all active:scale-95"
            >
              <Square className="w-4 h-4" /> Stop Mic
            </button>
          )}

          {/* Simulation */}
          {!simRunning ? (
            <button
              onClick={() => handleStartSim('random')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-all active:scale-95"
            >
              <Zap className="w-4 h-4" /> Demo Mode
            </button>
          ) : (
            <button
              onClick={handleStopSim}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-600 hover:bg-slate-500 text-white font-bold text-sm transition-all active:scale-95"
            >
              <Square className="w-4 h-4" /> Stop Demo
            </button>
          )}

          {/* Mic error */}
          {micError && (
            <span className="text-xs text-red-400 max-w-xs truncate" title={micError}>⚠ {micError}</span>
          )}
        </div>

        <p className="text-center text-white/20 text-xs mt-2">
          Relative noise level — NOT calibrated dB(A) — For informational use only
        </p>
      </div>
    </div>
  );
}
