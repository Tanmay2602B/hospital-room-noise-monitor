// ─────────────────────────────────────────────────────────────────────────────
// AlertCard — Individual alert item
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { AlertTriangle, AlertOctagon, CheckCircle, Clock } from 'lucide-react';
import { formatDateTime, formatDuration } from '../utils/noiseUtils';

export default function AlertCard({ alert, onAcknowledge }) {
  const { locationName, noiseLevel, severity, message, acknowledged, createdAt, acknowledgedAt } = alert;

  const durationSec = acknowledged && acknowledgedAt
    ? (acknowledgedAt - createdAt) / 1000
    : (Date.now() - (createdAt instanceof Date ? createdAt.getTime() : new Date(createdAt).getTime())) / 1000;

  return (
    <div className={`card border-l-4 ${
      severity === 'CRITICAL' ? 'border-l-red-500' :
      severity === 'WARNING'  ? 'border-l-amber-500' : 'border-l-emerald-500'
    } ${acknowledged ? 'opacity-60' : ''} fade-in-up`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl shrink-0 ${
            severity === 'CRITICAL' ? 'bg-red-50' : 'bg-amber-50'
          }`}>
            {severity === 'CRITICAL'
              ? <AlertOctagon className="w-5 h-5 text-red-500" />
              : <AlertTriangle className="w-5 h-5 text-amber-500" />
            }
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                severity === 'CRITICAL'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}>{severity}</span>
              <span className="font-semibold text-slate-800 text-sm">{locationName}</span>
              <span className="text-slate-400 text-sm">· {noiseLevel} dB</span>
            </div>
            <p className="text-sm text-slate-600 mb-2">{message}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDateTime(createdAt)}
              </span>
              <span>Duration: {formatDuration(durationSec)}</span>
            </div>
          </div>
        </div>

        <div className="shrink-0">
          {acknowledged ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Acknowledged</span>
            </div>
          ) : (
            <button
              onClick={() => onAcknowledge(alert.alertId)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 transition-colors"
            >
              Acknowledge
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
