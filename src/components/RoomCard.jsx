// ─────────────────────────────────────────────────────────────────────────────
// RoomCard — Individual location monitoring card
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Wifi, WifiOff, ArrowRight, AlertTriangle, Clock } from 'lucide-react';
import { getNoiseStatus, getStatusColors, formatTime, secondsSince } from '../utils/noiseUtils';
import NoiseChart from './NoiseChart';
import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';

export default function RoomCard({ location, history = [] }) {
  const { settings, setSelectedLocationId } = useApp();
  const navigate = useNavigate();

  const { currentNoise, lastUpdated, assignedDeviceId, locationName, locationId } = location;

  const stale = secondsSince(lastUpdated) > settings.staleDataTimeoutSeconds;
  const offline = currentNoise === null || currentNoise === undefined || stale;

  const { status } = getNoiseStatus(
    offline ? null : currentNoise,
    location.warningThreshold,
    location.criticalThreshold,
  );
  const colors = getStatusColors(offline ? 'OFFLINE' : status);

  const handleView = () => {
    setSelectedLocationId(locationId);
    navigate('/live');
  };

  return (
    <div
      className={`card card-hover cursor-pointer border-l-4 ${
        offline       ? 'border-l-slate-300' :
        status === 'CRITICAL' ? 'border-l-red-500' :
        status === 'WARNING'  ? 'border-l-amber-500' :
                                'border-l-emerald-500'
      } fade-in-up`}
      onClick={handleView}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-bold text-slate-800 text-sm leading-tight">{locationName}</h3>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{location.locationType?.replace('_', ' ')}</p>
        </div>
        <span className={`${colors.badge} shrink-0`}>
          {offline ? 'OFFLINE' : status}
        </span>
      </div>

      {/* Noise Reading */}
      <div className="flex items-end gap-2 mb-3">
        <span className={`text-4xl font-black ${offline ? 'text-slate-300' : colors.text}`}>
          {offline ? '—' : currentNoise}
        </span>
        <span className="text-slate-400 text-sm mb-1">{offline ? '' : 'dB'}</span>
        <span className="text-xs text-slate-400 mb-1 ml-auto">approx.</span>
      </div>

      {/* Mini Chart */}
      <div className="h-14 mb-3">
        {history.length > 1 ? (
          <NoiseChart
            data={history.slice(-30)}
            warningThreshold={location.warningThreshold}
            criticalThreshold={location.criticalThreshold}
            height={56}
            mini={true}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-slate-300">No chart data yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-50">
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          {assignedDeviceId ? (
            offline
              ? <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-red-400">Offline</span></>
              : <><Wifi className="w-3 h-3 text-emerald-500" /><span>Online</span></>
          ) : (
            <><WifiOff className="w-3 h-3 text-slate-300" /><span>No device</span></>
          )}
        </div>
        {lastUpdated && !stale ? (
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{formatTime(lastUpdated)}</span>
          </div>
        ) : stale ? (
          <div className="flex items-center gap-1 text-xs text-amber-500">
            <AlertTriangle className="w-3 h-3" />
            <span>Stale data</span>
          </div>
        ) : null}
        <ArrowRight className="w-4 h-4 text-slate-300" />
      </div>
    </div>
  );
}
