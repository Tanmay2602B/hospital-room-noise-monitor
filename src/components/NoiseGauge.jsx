// ─────────────────────────────────────────────────────────────────────────────
// NoiseGauge — Animated SVG semicircle gauge
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import { getNoiseStatus, getStatusColors, clamp } from '../utils/noiseUtils';

export default function NoiseGauge({
  noiseLevel,
  warningThreshold = 41,
  criticalThreshold = 61,
  maxDb = 100,
  size = 'lg',        // 'sm' | 'md' | 'lg' | 'xl'
  showLabel = true,
  showStatus = true,
  showMessage = true,
  dataSource = null,  // 'simulation' | 'hardware' | 'microphone' | null
}) {
  const [displayValue, setDisplayValue] = useState(noiseLevel ?? 0);
  const [arcOffset, setArcOffset] = useState(251);
  const animRef = useRef(null);

  const { status } = getNoiseStatus(noiseLevel, warningThreshold, criticalThreshold);
  const colors = getStatusColors(status);
  const isOffline = noiseLevel === null || noiseLevel === undefined;

  // Smooth value animation
  useEffect(() => {
    if (isOffline) { setDisplayValue(0); setArcOffset(251); return; }
    const target = noiseLevel;
    let current  = displayValue;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const step = () => {
      const diff = target - current;
      if (Math.abs(diff) < 0.5) { setDisplayValue(target); return; }
      current += diff * 0.12;
      setDisplayValue(Math.round(current));
      const pct = clamp(current / maxDb, 0, 1);
      setArcOffset(251 - pct * 251);
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [noiseLevel, maxDb]);

  const sizes = {
    sm: { svg: 140, r: 52, cx: 70,  cy: 80,  numSize: 'text-3xl', unitSize: 'text-sm',  labelSize: 'text-xs' },
    md: { svg: 200, r: 76, cx: 100, cy: 115, numSize: 'text-4xl', unitSize: 'text-base', labelSize: 'text-sm' },
    lg: { svg: 260, r: 100,cx: 130, cy: 150, numSize: 'text-6xl', unitSize: 'text-lg',  labelSize: 'text-sm' },
    xl: { svg: 340, r: 130,cx: 170, cy: 195, numSize: 'text-8xl', unitSize: 'text-2xl', labelSize: 'text-base' },
  };

  const s = sizes[size] || sizes.lg;
  const strokeWidth = size === 'xl' ? 18 : size === 'lg' ? 16 : size === 'md' ? 14 : 12;
  const circumference = 2 * Math.PI * s.r;
  const arcLength = circumference * 0.75; // 270° arc
  const arc = circumference - arcLength;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: s.svg, height: s.svg * 0.72 }}>
        <svg
          width={s.svg}
          height={s.svg}
          viewBox={`0 0 ${s.svg} ${s.svg}`}
          className="overflow-visible"
          style={{ marginTop: `-${s.svg * 0.28}px` }}
        >
          {/* Track arc */}
          <circle
            cx={s.cx} cy={s.cy} r={s.r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${arc}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(135, ${s.cx}, ${s.cy})`}
          />

          {/* Threshold markers */}
          {[warningThreshold, criticalThreshold].map((threshold, i) => {
            const pct    = clamp(threshold / maxDb, 0, 1);
            const angle  = 135 + pct * 270;
            const rad    = (angle * Math.PI) / 180;
            const mx = s.cx + (s.r) * Math.cos(rad);
            const my = s.cy + (s.r) * Math.sin(rad);
            return (
              <circle
                key={i}
                cx={mx} cy={my}
                r={strokeWidth / 2 + 1}
                fill={i === 0 ? '#f59e0b' : '#ef4444'}
                opacity={0.7}
              />
            );
          })}

          {/* Value arc */}
          <circle
            cx={s.cx} cy={s.cy} r={s.r}
            fill="none"
            stroke={isOffline ? '#cbd5e1' : colors.hex}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${arc}`}
            strokeDashoffset={isOffline ? arcLength : (arcLength - (arcLength * clamp(displayValue / maxDb, 0, 1)))}
            strokeLinecap="round"
            transform={`rotate(135, ${s.cx}, ${s.cy})`}
            style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.5s ease' }}
          />

          {/* Glow ring for critical */}
          {status === 'CRITICAL' && !isOffline && (
            <circle
              cx={s.cx} cy={s.cy} r={s.r}
              fill="none"
              stroke={colors.hex}
              strokeWidth={strokeWidth + 6}
              strokeDasharray={`${arcLength} ${arc}`}
              strokeDashoffset={arcLength - (arcLength * clamp(displayValue / maxDb, 0, 1))}
              strokeLinecap="round"
              transform={`rotate(135, ${s.cx}, ${s.cy})`}
              opacity={0.15}
              className="critical-pulse"
            />
          )}

          {/* Center: value */}
          <text
            x={s.cx} y={s.cy - (size === 'xl' ? 24 : size === 'lg' ? 18 : 12)}
            textAnchor="middle"
            className={`${s.numSize} font-black`}
            fill={isOffline ? '#94a3b8' : colors.hex}
            style={{ fontFamily: 'Inter, Poppins, sans-serif', fontWeight: 900, fontSize: size === 'xl' ? '4.5rem' : size === 'lg' ? '3.25rem' : size === 'md' ? '2.25rem' : '1.75rem' }}
          >
            {isOffline ? '—' : displayValue}
          </text>
          <text
            x={s.cx} y={s.cy + (size === 'xl' ? 14 : size === 'lg' ? 10 : 6)}
            textAnchor="middle"
            fill="#64748b"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: size === 'xl' ? '1.1rem' : '0.85rem', fontWeight: 600 }}
          >
            {isOffline ? 'OFFLINE' : 'dB approx.'}
          </text>
        </svg>
      </div>

      {showStatus && (
        <div className="text-center mt-1">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold ${
            isOffline ? 'bg-slate-100 text-slate-500' :
            status === 'NORMAL'   ? 'bg-emerald-100 text-emerald-700' :
            status === 'WARNING'  ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isOffline ? 'bg-slate-400' :
              status === 'NORMAL' ? 'bg-emerald-500' :
              status === 'WARNING' ? 'bg-amber-500' : 'bg-red-500'
            } ${status === 'CRITICAL' && !isOffline ? 'critical-pulse' : ''}`} />
            {isOffline ? 'NO SIGNAL' : status}
          </span>
        </div>
      )}

      {showMessage && !isOffline && (
        <p className={`text-center text-sm font-medium px-4 ${colors.text}`}>
          {status === 'NORMAL'   ? 'Environment is Quiet' :
           status === 'WARNING'  ? 'Noise Level is Increasing' :
                                   'NOISE TOO LOUD! Please Maintain Silence'}
        </p>
      )}

      {showLabel && dataSource && (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          dataSource === 'simulation' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
          dataSource === 'hardware'   ? 'bg-teal-50 text-teal-600 border border-teal-200' :
                                       'bg-sky-50 text-sky-600 border border-sky-200'
        }`}>
          {dataSource === 'simulation' ? '⚡ SIMULATION' :
           dataSource === 'hardware'   ? '📡 HARDWARE' : '🎤 MICROPHONE'}
        </span>
      )}
    </div>
  );
}
