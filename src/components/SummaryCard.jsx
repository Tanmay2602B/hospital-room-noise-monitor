// ─────────────────────────────────────────────────────────────────────────────
// SummaryCard — Dashboard KPI card
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';

export default function SummaryCard({ title, value, subtitle, icon: Icon, color = 'navy', trend }) {
  const colorMap = {
    navy:    { bg: 'bg-navy-50',    text: 'text-navy-700',    iconBg: 'bg-navy-100',    iconText: 'text-navy-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   iconBg: 'bg-amber-100',   iconText: 'text-amber-600' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     iconBg: 'bg-red-100',     iconText: 'text-red-600' },
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    iconBg: 'bg-teal-100',    iconText: 'text-teal-600' },
  };
  const c = colorMap[color] || colorMap.navy;

  return (
    <div className="card card-hover fade-in-up">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className={`text-3xl font-black ${c.text} leading-none`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-1.5">{subtitle}</p>}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs mt-2 font-semibold ${
              trend > 0 ? 'text-red-500' : trend < 0 ? 'text-emerald-500' : 'text-slate-400'
            }`}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
              <span>{Math.abs(trend)}% vs last hour</span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${c.iconBg}`}>
            <Icon className={`w-5 h-5 ${c.iconText}`} />
          </div>
        )}
      </div>
    </div>
  );
}
