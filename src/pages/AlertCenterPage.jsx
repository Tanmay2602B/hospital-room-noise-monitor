// ─────────────────────────────────────────────────────────────────────────────
// Alert Center Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { Bell, CheckCircle, AlertTriangle, AlertOctagon, Filter } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import AlertCard from '../components/AlertCard';

const FILTERS = [
  { key: 'all',      label: 'All Alerts' },
  { key: 'critical', label: 'Critical' },
  { key: 'warning',  label: 'Warning' },
  { key: 'unacked',  label: 'Unacknowledged' },
  { key: 'acked',    label: 'Acknowledged' },
];

export default function AlertCenterPage() {
  const { alerts, acknowledgeAlert } = useApp();
  const [filter, setFilter] = useState('all');

  const filtered = useMemo(() => {
    return alerts.filter(a => {
      if (filter === 'critical') return a.severity === 'CRITICAL';
      if (filter === 'warning')  return a.severity === 'WARNING';
      if (filter === 'unacked')  return !a.acknowledged;
      if (filter === 'acked')    return a.acknowledged;
      return true;
    });
  }, [alerts, filter]);

  const unacked   = alerts.filter(a => !a.acknowledged).length;
  const critical  = alerts.filter(a => a.severity === 'CRITICAL').length;
  const warnings  = alerts.filter(a => a.severity === 'WARNING').length;

  const handleAckAll = () => {
    alerts.filter(a => !a.acknowledged).forEach(a => acknowledgeAlert(a.alertId));
  };

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="page-title flex items-center gap-2">
            <Bell className="w-6 h-6 text-slate-700" />
            Alert Center
          </h2>
          <p className="text-sm text-slate-400 mt-1">{alerts.length} total alerts</p>
        </div>
        {unacked > 0 && (
          <button onClick={handleAckAll} className="btn-secondary text-sm py-2 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Acknowledge All ({unacked})
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card text-center">
          <p className="text-3xl font-black text-red-600">{unacked}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Unacknowledged</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-black text-red-500">{critical}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Critical</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-black text-amber-500">{warnings}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Warning</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-1 min-w-fit px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              filter === f.key
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {f.label}
            {f.key === 'unacked' && unacked > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs font-bold w-4 h-4 rounded-full inline-flex items-center justify-center">
                {unacked}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card text-center py-16 text-slate-300">
            <CheckCircle className="w-12 h-12 mx-auto mb-3" />
            <p className="text-lg font-semibold">No alerts in this category</p>
            <p className="text-sm">All clear!</p>
          </div>
        ) : (
          filtered.map(alert => (
            <AlertCard key={alert.alertId} alert={alert} onAcknowledge={acknowledgeAlert} />
          ))
        )}
      </div>
    </div>
  );
}
