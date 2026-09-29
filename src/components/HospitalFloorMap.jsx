// ─────────────────────────────────────────────────────────────────────────────
// HospitalFloorMap — Interactive SVG floor plan with live noise overlays
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { getNoiseStatus, secondsSince } from '../utils/noiseUtils';

// ── Room layout definitions (SVG coordinate space 800×500) ───────────────────
// Each room maps to a locationId from demoData / AppContext
const FLOOR_ROOMS = [
  // ── Top row ──
  {
    locationId: 'ROOM_101',
    label: 'Room 101',
    sublabel: 'Patient',
    icon: '🛏',
    x: 30, y: 60, w: 145, h: 130,
    shape: 'rect',
  },
  {
    locationId: 'ROOM_102',
    label: 'Room 102',
    sublabel: 'Patient',
    icon: '🛏',
    x: 195, y: 60, w: 145, h: 130,
    shape: 'rect',
  },
  {
    locationId: 'ICU_01',
    label: 'ICU',
    sublabel: 'Unit A',
    icon: '💊',
    x: 360, y: 60, w: 180, h: 130,
    shape: 'rect',
  },
  {
    locationId: 'OT_01',
    label: 'Operation',
    sublabel: 'Theatre',
    icon: '🔬',
    x: 560, y: 60, w: 210, h: 130,
    shape: 'rect',
  },

  // ── Bottom row ──
  {
    locationId: 'WARD_GEN',
    label: 'General Ward',
    sublabel: 'Multi-bed',
    icon: '🏥',
    x: 30, y: 270, w: 340, h: 170,
    shape: 'rect',
  },
  {
    locationId: 'WAIT_01',
    label: 'Waiting Area',
    sublabel: 'Reception',
    icon: '🪑',
    x: 400, y: 270, w: 370, h: 170,
    shape: 'rect',
  },
];

// Corridor / structural elements (decorative)
const CORRIDORS = [
  // Horizontal corridor between rows
  { x: 30, y: 205, w: 740, h: 50, label: 'Main Corridor' },
];

const WALLS = [
  // Outer walls
  { x: 18, y: 45, w: 764, h: 410 },
];

// ── Status → colour mapping ───────────────────────────────────────────────────
function statusStyle(status, isSelected, isOffline) {
  if (isOffline)   return { fill: '#e2e8f0', stroke: '#94a3b8', text: '#94a3b8', badge: '#f1f5f9', badgeText: '#64748b' };
  if (status === 'CRITICAL') return {
    fill: isSelected ? '#fecaca' : '#fee2e2',
    stroke: '#ef4444',
    text: '#991b1b',
    badge: '#ef4444',
    badgeText: '#fff',
    glow: 'rgba(239,68,68,0.25)',
  };
  if (status === 'WARNING')  return {
    fill: isSelected ? '#fde68a' : '#fef9c3',
    stroke: '#f59e0b',
    text: '#92400e',
    badge: '#f59e0b',
    badgeText: '#fff',
  };
  return {
    fill: isSelected ? '#bbf7d0' : '#f0fdf4',
    stroke: '#10b981',
    text: '#064e3b',
    badge: '#10b981',
    badgeText: '#fff',
  };
}

// ── Single room cell ──────────────────────────────────────────────────────────
function RoomCell({ room, location, staleSeconds, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);

  const stale    = staleSeconds > 30;
  const offline  = !location || location.currentNoise === null || stale;
  const noise    = offline ? null : location.currentNoise;
  const warnAt   = location?.warningThreshold  || 41;
  const critAt   = location?.criticalThreshold || 61;
  const { status } = getNoiseStatus(noise, warnAt, critAt);
  const s        = statusStyle(status, isSelected || hovered, offline);

  const cx = room.x + room.w / 2;
  const cy = room.y + room.h / 2;
  const r  = 6; // corner radius

  return (
    <g
      style={{ cursor: 'pointer' }}
      onClick={() => onClick(room.locationId)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow for critical */}
      {status === 'CRITICAL' && !offline && (
        <rect
          x={room.x - 4} y={room.y - 4}
          width={room.w + 8} height={room.h + 8}
          rx={r + 4} ry={r + 4}
          fill={s.glow}
          style={{ animation: 'criticalPulse 1.5s ease-in-out infinite' }}
        />
      )}

      {/* Room body */}
      <rect
        x={room.x} y={room.y}
        width={room.w} height={room.h}
        rx={r} ry={r}
        fill={s.fill}
        stroke={s.stroke}
        strokeWidth={isSelected ? 3 : hovered ? 2.5 : 1.5}
        style={{ transition: 'all 0.2s ease' }}
      />

      {/* Selection ring */}
      {isSelected && (
        <rect
          x={room.x - 3} y={room.y - 3}
          width={room.w + 6} height={room.h + 6}
          rx={r + 3} ry={r + 3}
          fill="none"
          stroke={s.stroke}
          strokeWidth={2}
          strokeDasharray="6 3"
          opacity={0.6}
        />
      )}

      {/* Room icon */}
      <text
        x={cx} y={room.y + 28}
        textAnchor="middle"
        fontSize={22}
        dominantBaseline="middle"
      >
        {room.icon}
      </text>

      {/* Room name */}
      <text
        x={cx} y={room.y + 52}
        textAnchor="middle"
        fill={s.text}
        fontSize={12}
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
      >
        {room.label}
      </text>

      {/* Sub-label */}
      <text
        x={cx} y={room.y + 67}
        textAnchor="middle"
        fill={s.text}
        fontSize={9}
        fontFamily="Inter, system-ui, sans-serif"
        opacity={0.7}
      >
        {room.sublabel}
      </text>

      {/* Noise level badge */}
      {!offline ? (
        <g>
          <rect
            x={cx - 22} y={room.y + room.h - 34}
            width={44} height={26}
            rx={13}
            fill={s.badge}
          />
          <text
            x={cx} y={room.y + room.h - 21}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={s.badgeText}
            fontSize={13}
            fontWeight="800"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {noise}
          </text>
        </g>
      ) : (
        <g>
          <rect
            x={cx - 22} y={room.y + room.h - 34}
            width={44} height={22}
            rx={11}
            fill="#e2e8f0"
          />
          <text
            x={cx} y={room.y + room.h - 23}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#94a3b8"
            fontSize={9}
            fontWeight="700"
            fontFamily="Inter, system-ui, sans-serif"
          >
            OFFLINE
          </text>
        </g>
      )}

      {/* Status dot (top-right corner) */}
      {!offline && (
        <circle
          cx={room.x + room.w - 10}
          cy={room.y + 10}
          r={5}
          fill={status === 'CRITICAL' ? '#ef4444' : status === 'WARNING' ? '#f59e0b' : '#10b981'}
        />
      )}
    </g>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════════
export default function HospitalFloorMap({ locations, selectedLocationId, onSelectRoom, staleTimeoutSeconds = 30 }) {
  const [tooltip, setTooltip] = useState(null); // { x, y, loc, status }

  const getLocation = (id) => locations.find(l => l.locationId === id);

  const handleRoomClick = (locationId) => {
    if (onSelectRoom) onSelectRoom(locationId);
  };

  // Count by status for legend
  const counts = { NORMAL: 0, WARNING: 0, CRITICAL: 0, OFFLINE: 0 };
  FLOOR_ROOMS.forEach(r => {
    const loc   = getLocation(r.locationId);
    const stale = secondsSince(loc?.lastUpdated) > staleTimeoutSeconds;
    if (!loc || loc.currentNoise === null || stale) { counts.OFFLINE++; return; }
    const { status } = getNoiseStatus(loc.currentNoise, loc.warningThreshold, loc.criticalThreshold);
    counts[status]++;
  });

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mb-3 text-xs font-semibold">
        <span className="text-slate-500 font-bold text-sm">Floor Plan</span>
        <div className="flex items-center gap-1.5 ml-auto">
          {[
            { color: 'bg-emerald-400', label: `Normal (${counts.NORMAL})` },
            { color: 'bg-amber-400',   label: `Warning (${counts.WARNING})` },
            { color: 'bg-red-400',     label: `High (${counts.CRITICAL})` },
            { color: 'bg-slate-300',   label: `Offline (${counts.OFFLINE})` },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100">
              <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
              {label}
            </span>
          ))}
        </div>
        <span className="text-slate-400 font-normal">Click a room to select it</span>
      </div>

      {/* SVG Map */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
        <svg
          viewBox="0 0 800 460"
          className="w-full"
          style={{ display: 'block', minHeight: 260 }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
            </pattern>
            <style>{`
              @keyframes criticalPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
              }
            `}</style>
          </defs>
          <rect width="800" height="460" fill="url(#grid)" />

          {/* Outer building shell */}
          <rect
            x={16} y={40} width={768} height={420}
            rx={10} ry={10}
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth={2}
          />

          {/* Floor label */}
          <text x={400} y={25} textAnchor="middle" fill="#64748b"
            fontSize={12} fontWeight="700" fontFamily="Inter, system-ui, sans-serif"
            letterSpacing="2">
            GROUND FLOOR — HOSPITAL WING A
          </text>

          {/* Corridor */}
          {CORRIDORS.map((c, i) => (
            <g key={i}>
              <rect
                x={c.x} y={c.y} width={c.w} height={c.h}
                fill="#e2e8f0"
                rx={4}
              />
              <text
                x={c.x + c.w / 2} y={c.y + c.h / 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#94a3b8"
                fontSize={10}
                fontWeight="600"
                fontFamily="Inter, system-ui, sans-serif"
                letterSpacing="3"
              >
                CORRIDOR
              </text>
            </g>
          ))}

          {/* Door markers on corridor */}
          {FLOOR_ROOMS.map(room => {
            const doorX = room.x + room.w / 2;
            const inTopRow = room.y < 200;
            const doorY = inTopRow ? room.y + room.h : room.y;
            return (
              <g key={`door-${room.locationId}`}>
                <rect
                  x={doorX - 12} y={doorY - 2}
                  width={24} height={4}
                  rx={2}
                  fill="#94a3b8"
                  opacity={0.7}
                />
              </g>
            );
          })}

          {/* Room cells */}
          {FLOOR_ROOMS.map(room => {
            const loc   = getLocation(room.locationId);
            const stale = secondsSince(loc?.lastUpdated);
            return (
              <RoomCell
                key={room.locationId}
                room={room}
                location={loc}
                staleSeconds={stale}
                isSelected={selectedLocationId === room.locationId}
                onClick={handleRoomClick}
              />
            );
          })}

          {/* Compass rose (decorative) */}
          <g transform="translate(748, 420)">
            <circle cx={0} cy={0} r={14} fill="white" stroke="#cbd5e1" strokeWidth={1} />
            <text x={0} y={0} textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fontWeight="700" fill="#64748b" fontFamily="Inter, system-ui, sans-serif">N</text>
            <line x1={0} y1={-10} x2={0} y2={-5} stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" />
          </g>

          {/* Scale bar */}
          <g transform="translate(30, 432)">
            <line x1={0} y1={4} x2={60} y2={4} stroke="#94a3b8" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={8} stroke="#94a3b8" strokeWidth={1.5} />
            <line x1={60} y1={0} x2={60} y2={8} stroke="#94a3b8" strokeWidth={1.5} />
            <text x={30} y={16} textAnchor="middle" fill="#94a3b8" fontSize={9}
              fontFamily="Inter, system-ui, sans-serif">10 m</text>
          </g>
        </svg>
      </div>

      {/* Selected room info bar */}
      {selectedLocationId && (() => {
        const loc   = getLocation(selectedLocationId);
        const room  = FLOOR_ROOMS.find(r => r.locationId === selectedLocationId);
        const stale = secondsSince(loc?.lastUpdated) > staleTimeoutSeconds;
        const noise = (!stale && loc?.currentNoise !== null) ? loc?.currentNoise : null;
        const { status } = getNoiseStatus(noise, loc?.warningThreshold, loc?.criticalThreshold);

        if (!loc || !room) return null;

        const bg = status === 'CRITICAL' ? 'bg-red-50 border-red-200 text-red-800'
          : status === 'WARNING'  ? 'bg-amber-50 border-amber-200 text-amber-800'
          : status === 'NORMAL'   ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-slate-50 border-slate-200 text-slate-600';

        return (
          <div className={`mt-3 flex items-center gap-3 p-3 rounded-xl border text-sm font-semibold ${bg}`}>
            <span className="text-xl">{room.icon}</span>
            <div>
              <p className="font-bold">{loc.locationName}</p>
              <p className="text-xs opacity-70 capitalize">{loc.locationType?.replace('_', ' ')}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-black">{noise ?? '—'}</p>
              <p className="text-xs opacity-70">Rel. Level</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full text-xs font-black ${
              status === 'CRITICAL' ? 'bg-red-500 text-white'
              : status === 'WARNING' ? 'bg-amber-500 text-white'
              : status === 'NORMAL' ? 'bg-emerald-500 text-white'
              : 'bg-slate-300 text-slate-700'
            }`}>
              {stale ? 'OFFLINE' : status === 'CRITICAL' ? 'HIGH' : status}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
