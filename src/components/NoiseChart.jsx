// ─────────────────────────────────────────────────────────────────────────────
// NoiseChart — Recharts line chart for noise history
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend,
} from 'recharts';
import { formatTime } from '../utils/noiseUtils';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-xs text-slate-500 mb-1">{formatTime(label)}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

export default function NoiseChart({
  data = [],
  warningThreshold = 41,
  criticalThreshold = 61,
  height = 220,
  mini = false,
  showLegend = false,
}) {
  const chartData = data.map(d => ({
    time: d.timestamp,
    noise: d.noiseLevel,
    timeLabel: formatTime(d.timestamp),
  }));

  if (mini) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <Line
            type="monotone" dataKey="noise" stroke="#3b82f6"
            strokeWidth={2} dot={false} isAnimationActive={false}
          />
          <ReferenceLine y={warningThreshold}  stroke="#f59e0b" strokeDasharray="3 3" strokeWidth={1} />
          <ReferenceLine y={criticalThreshold} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <defs>
          <linearGradient id="noiseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"   stopColor="#3b82f6" stopOpacity={0.15} />
            <stop offset="95%"  stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="timeLabel"
          tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inter' }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Inter' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => `${v}`}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <ReferenceLine
          y={warningThreshold}
          stroke="#f59e0b"
          strokeDasharray="5 3"
          strokeWidth={1.5}
          label={{ value: `Warn ${warningThreshold}dB`, position: 'insideTopRight', fontSize: 10, fill: '#f59e0b' }}
        />
        <ReferenceLine
          y={criticalThreshold}
          stroke="#ef4444"
          strokeDasharray="5 3"
          strokeWidth={1.5}
          label={{ value: `Crit ${criticalThreshold}dB`, position: 'insideTopRight', fontSize: 10, fill: '#ef4444' }}
        />
        <Line
          type="monotone"
          dataKey="noise"
          name="Noise Level"
          stroke="#3b82f6"
          strokeWidth={2.5}
          dot={false}
          isAnimationActive={false}
          activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 2, stroke: 'white' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
