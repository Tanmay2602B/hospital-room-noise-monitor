// ─────────────────────────────────────────────────────────────────────────────
// Rooms Page — Floor map + multi-location monitoring
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Plus, Search, Grid3X3, List, Map } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import RoomCard from '../components/RoomCard';
import HospitalFloorMap from '../components/HospitalFloorMap';
import { getNoiseStatus, secondsSince } from '../utils/noiseUtils';

export default function RoomsPage() {
  const {
    locations, readingHistory, settings,
    selectedLocationId, setSelectedLocationId,
  } = useApp();

  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid'|'list'
  const [showMap,  setShowMap]  = useState(true);   // map toggle

  const filtered = locations.filter(loc => {
    const stale   = secondsSince(loc.lastUpdated) > settings.staleDataTimeoutSeconds;
    const offline = loc.currentNoise === null || loc.currentNoise === undefined || stale;
    const { status } = offline
      ? { status: 'OFFLINE' }
      : getNoiseStatus(loc.currentNoise, loc.warningThreshold, loc.criticalThreshold);

    const matchSearch = loc.locationName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || status.toLowerCase() === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="page-title">All Locations</h2>
          <p className="text-sm text-slate-400 mt-0.5">{locations.length} rooms monitored · Click a room on the map to select it</p>
        </div>
        <button
          onClick={() => setShowMap(v => !v)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${
            showMap
              ? 'bg-navy-800 text-white border-navy-800'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Map className="w-4 h-4" />
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>
      </div>

      {/* ── Floor Map ──────────────────────────────────────────────────────── */}
      {showMap && (
        <div className="card mb-5">
          <HospitalFloorMap
            locations={locations}
            selectedLocationId={selectedLocationId}
            onSelectRoom={setSelectedLocationId}
            staleTimeoutSeconds={settings.staleDataTimeoutSeconds}
          />
        </div>
      )}

      {/* Controls bar */}
      <div className="card mb-5 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input-field pl-9 text-sm"
            placeholder="Search locations…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {[
            { key: 'all',      label: 'All' },
            { key: 'normal',   label: '✓ Normal' },
            { key: 'warning',  label: '⚠ Warning' },
            { key: 'critical', label: '🔴 High' },
            { key: 'offline',  label: '— Offline' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* View mode */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
            title="Grid view"
          >
            <Grid3X3 className="w-4 h-4 text-slate-600" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-slate-200'}`}
            title="List view"
          >
            <List className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Room cards */}
      {filtered.length === 0 ? (
        <div className="card text-center py-16 text-slate-300">
          <Grid3X3 className="w-12 h-12 mx-auto mb-3" />
          <p className="text-lg font-semibold">No locations match your filter</p>
        </div>
      ) : (
        <div className={`grid gap-4 ${
          viewMode === 'grid'
            ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}>
          {filtered.map(loc => (
            <div
              key={loc.locationId}
              onClick={() => setSelectedLocationId(loc.locationId)}
              className={`cursor-pointer rounded-2xl transition-all ${
                selectedLocationId === loc.locationId
                  ? 'ring-2 ring-navy-400 ring-offset-2'
                  : 'hover:ring-1 hover:ring-slate-300 hover:ring-offset-1'
              }`}
            >
              <RoomCard
                location={loc}
                history={readingHistory[loc.locationId] || []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
