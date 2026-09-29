// ─────────────────────────────────────────────────────────────────────────────
// Noise Utility Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the noise status label and color information based on current level and thresholds
 */
export function getNoiseStatus(noiseLevel, warningThreshold = 41, criticalThreshold = 61) {
  if (noiseLevel === null || noiseLevel === undefined) return { status: 'OFFLINE', label: 'No Data', color: 'slate' };
  if (noiseLevel >= criticalThreshold) return { status: 'CRITICAL', label: 'CRITICAL', color: 'red' };
  if (noiseLevel >= warningThreshold) return { status: 'WARNING', label: 'WARNING', color: 'amber' };
  return { status: 'NORMAL', label: 'NORMAL', color: 'emerald' };
}

/**
 * Get the status message string
 */
export function getStatusMessage(status) {
  switch (status) {
    case 'NORMAL':   return 'Environment is Quiet';
    case 'WARNING':  return 'Noise Level is Increasing';
    case 'CRITICAL': return 'NOISE TOO LOUD! Please Maintain Silence';
    default:         return 'No sensor data available';
  }
}

/**
 * Get Tailwind color classes for a given status
 */
export function getStatusColors(status) {
  switch (status) {
    case 'NORMAL':
      return {
        text:   'text-emerald-600',
        bg:     'bg-emerald-50',
        border: 'border-emerald-200',
        badge:  'badge-normal',
        ring:   'ring-emerald-400',
        hex:    '#10b981',
        hexBg:  '#ecfdf5',
        strokeColor: '#10b981',
      };
    case 'WARNING':
      return {
        text:   'text-amber-600',
        bg:     'bg-amber-50',
        border: 'border-amber-200',
        badge:  'badge-warning',
        ring:   'ring-amber-400',
        hex:    '#f59e0b',
        hexBg:  '#fffbeb',
        strokeColor: '#f59e0b',
      };
    case 'CRITICAL':
      return {
        text:   'text-red-600',
        bg:     'bg-red-50',
        border: 'border-red-200',
        badge:  'badge-critical',
        ring:   'ring-red-400',
        hex:    '#ef4444',
        hexBg:  '#fef2f2',
        strokeColor: '#ef4444',
      };
    default:
      return {
        text:   'text-slate-500',
        bg:     'bg-slate-50',
        border: 'border-slate-200',
        badge:  'badge-offline',
        ring:   'ring-slate-400',
        hex:    '#94a3b8',
        hexBg:  '#f8fafc',
        strokeColor: '#94a3b8',
      };
  }
}

/**
 * Format timestamp to human-readable
 */
export function formatTime(timestamp) {
  if (!timestamp) return '—';
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '—';
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return d.toLocaleString([], {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

/**
 * Calculate how long ago a timestamp was (for stale data detection)
 */
export function secondsSince(timestamp) {
  if (!timestamp) return Infinity;
  const d = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return (Date.now() - d.getTime()) / 1000;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate a random noise value for simulation
 */
export function generateSimulatedNoise(mode = 'random') {
  switch (mode) {
    case 'normal':   return Math.round(20 + Math.random() * 20 + (Math.random() - 0.5) * 5);
    case 'warning':  return Math.round(44 + Math.random() * 15 + (Math.random() - 0.5) * 4);
    case 'critical': return Math.round(63 + Math.random() * 20 + (Math.random() - 0.5) * 6);
    case 'random': {
      const r = Math.random();
      if (r < 0.5)  return Math.round(15 + Math.random() * 25);
      if (r < 0.75) return Math.round(42 + Math.random() * 18);
      return Math.round(62 + Math.random() * 20);
    }
    default: return Math.round(30 + Math.random() * 30);
  }
}

/**
 * Clamp gauge arc offset (SVG stroke-dashoffset) for a semicircle gauge
 * Full arc = 251 (circumference of r=50, 270-degree arc)
 */
export function noiseLevelToArcOffset(noiseLevel, maxDb = 100) {
  const pct = clamp(noiseLevel / maxDb, 0, 1);
  const totalArc = 251;
  return totalArc - pct * totalArc;
}

/**
 * Format a duration in seconds to "Xm Ys" 
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Generate a unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Export data as CSV
 */
export function exportToCsv(data, filename = 'export.csv') {
  if (!data || data.length === 0) return;
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(','),
    ...data.map(row =>
      keys.map(k => {
        const val = row[k] === null || row[k] === undefined ? '' : String(row[k]);
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
