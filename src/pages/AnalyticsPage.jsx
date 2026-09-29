// ─────────────────────────────────────────────────────────────────────────────
// Analytics Page
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, LineChart, Line, Legend
} from 'recharts';
import { useApp } from '../contexts/AppContext';
import { generateDemoHistory } from '../utils/demoData';
import { getNoiseStatus, formatDateTime, exportToCsv } from '../utils/noiseUtils';
import NoiseChart from '../components/NoiseChart';

const TIME_FILTERS = [
  { key: '30m', label: '30 min', minutes: 30 },
  { key: '1h',  label: '1 hour', minutes: 60 },
  { key: '24h', label: '24 hours', minutes: 1440 },
  { key: '7d',  label: '7 days', minutes: 10080 },
];

export default function AnalyticsPage() {
  const { locations, readingHistory, alerts, selectedLocationId, setSelectedLocationId } = useApp();
  const [timeFilter, setTimeFilter] = useState('1h');
  const tf = TIME_FILTERS.find(t => t.key === timeFilter);

  // Merge real + demo history
  const history = useMemo(() => {
    const real = readingHistory[selectedLocationId] || [];
    if (real.length > 5) return real;
    // Use demo data
    return generateDemoHistory(Math.min(tf.minutes, 120));
  }, [readingHistory, selectedLocationId, tf.minutes]);

  // Filter by time
  const cutoff = Date.now() - tf.minutes * 60 * 1000;
  const filtered = history.filter(r => new Date(r.timestamp).getTime() > cutoff);

  const location = locations.find(l => l.locationId === selectedLocationId);

  const avg = filtered.length ? Math.round(filtered.reduce((s, r) => s + r.noiseLevel, 0) / filtered.length) : 0;
  const max = filtered.length ? Math.max(...filtered.map(r => r.noiseLevel)) : 0;
  const min = filtered.length ? Math.min(...filtered.map(r => r.noiseLevel)) : 0;

  const warningCount  = alerts.filter(a => a.severity === 'WARNING').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;

  // Location comparison data
  const locationComparison = locations.map(loc => {
    const lh = readingHistory[loc.locationId] || [];
    const avg = lh.length ? Math.round(lh.reduce((s, r) => s + r.noiseLevel, 0) / lh.length) : 0;
    return { name: loc.locationName.replace('Room ', 'Rm '), avg, max: lh.length ? Math.max(...lh.map(r => r.noiseLevel)) : 0 };
  }).filter(d => d.avg > 0);

  const handleExport = () => {
    exportToCsv(
      filtered.map(r => ({ timestamp: r.timestamp, noiseLevel: r.noiseLevel, source: r.source || 'demo' })),
      `noise_data_${selectedLocationId}_${timeFilter}.csv`
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="page-title">Analytics & Reports</h2>
          <p className="text-sm text-slate-400 mt-1">Noise trends and statistics</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary text-sm py-2 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Controls */}
      <div className="card mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-48">
          <label className="label">Location</label>
          <select
            className="select-field text-sm"
            value={selectedLocationId}
            onChange={e => setSelectedLocationId(e.target.value)}
          >
            {locations.map(l => (
              <option key={l.locationId} value={l.locationId}>{l.locationName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Time Range</label>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
            {TIME_FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setTimeFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  timeFilter === f.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Average', value: avg, unit: 'dB', icon: Activity, color: 'text-blue-600' },
          { label: 'Maximum', value: max, unit: 'dB', icon: TrendingUp, color: 'text-red-600' },
          { label: 'Minimum', value: min, unit: 'dB', icon: TrendingDown, color: 'text-emerald-600' },
          { label: 'Total Alerts', value: warningCount + criticalCount, unit: '', icon: AlertTriangle, color: 'text-amber-600' },
        ].map(({ label, value, unit, icon: Icon, color }) => (
          <div key={label} className="card text-center">
            <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
            <p className={`text-3xl font-black ${color}`}>{value}<span className="text-base font-normal text-slate-400 ml-0.5">{unit}</span></p>
            <p className="text-xs text-slate-500 font-medium mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-5">
        {/* Trend chart */}
        <div className="xl:col-span-2 card">
          <h3 className="font-bold text-slate-800 mb-4">Noise Trend — {location?.locationName}</h3>
          {filtered.length > 1 ? (
            <NoiseChart
              data={filtered}
              warningThreshold={location?.warningThreshold}
              criticalThreshold={location?.criticalThreshold}
              height={280}
            />
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-300">
              <p className="text-sm">Not enough data in this time range</p>
            </div>
          )}
        </div>

        {/* Location comparison */}
        <div className="card">
          <h3 className="font-bold text-slate-800 mb-4">Location Comparison</h3>
          {locationComparison.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={locationComparison} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={60} />
                <Tooltip formatter={(v) => [`${v} dB`]} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="avg" name="Avg dB" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="max" name="Max dB" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-300">
              <p className="text-sm">Run simulation to compare locations</p>
            </div>
          )}
        </div>
      </div>

      {/* Alert history table */}
      <div className="card mt-5">
        <h3 className="font-bold text-slate-800 mb-4">Recent Alert History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Time</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Location</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Level</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Severity</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {alerts.slice(0, 10).map(a => (
                <tr key={a.alertId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-slate-500">{formatDateTime(a.createdAt)}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-700">{a.locationName}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-800">{a.noiseLevel} dB</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      a.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>{a.severity}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      a.acknowledged ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                    }`}>{a.acknowledged ? 'Acknowledged' : 'Pending'}</span>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-300 text-sm">No alerts recorded yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
