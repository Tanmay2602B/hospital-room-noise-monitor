// ─────────────────────────────────────────────────────────────────────────────
// Settings Page — Admin configuration
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Settings, Plus, Trash2, Edit2, Check, X, AlertTriangle, Save } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { generateId } from '../utils/noiseUtils';

function RoomEditor({ location, onSave, onCancel }) {
  const [form, setForm] = useState({
    locationName:      location?.locationName || '',
    locationType:      location?.locationType || 'patient_room',
    warningThreshold:  location?.warningThreshold || 41,
    criticalThreshold: location?.criticalThreshold || 61,
    assignedDeviceId:  location?.assignedDeviceId || '',
    monitoringMode:    location?.monitoringMode || 'hospital',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = () => {
    if (!form.locationName.trim()) return;
    if (form.warningThreshold >= form.criticalThreshold) {
      alert('Warning threshold must be less than critical threshold');
      return;
    }
    onSave({ ...location, ...form });
  };

  return (
    <div className="card border-navy-200 border-2 animate-fade-in">
      <h4 className="font-bold text-slate-800 mb-4">{location ? 'Edit Location' : 'Add New Location'}</h4>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="label">Location Name</label>
          <input className="input-field" value={form.locationName} onChange={e => set('locationName', e.target.value)} placeholder="e.g. Room 101" />
        </div>
        <div>
          <label className="label">Type</label>
          <select className="select-field" value={form.locationType} onChange={e => set('locationType', e.target.value)}>
            <option value="patient_room">Patient Room</option>
            <option value="icu">ICU</option>
            <option value="ward">Ward</option>
            <option value="operation">Operation Theatre</option>
            <option value="waiting">Waiting Area</option>
            <option value="office">Office</option>
            <option value="classroom">Classroom</option>
            <option value="library">Library</option>
            <option value="laboratory">Laboratory</option>
          </select>
        </div>
        <div>
          <label className="label">Warning Threshold (dB)</label>
          <input type="number" className="input-field" value={form.warningThreshold} min={10} max={90}
            onChange={e => set('warningThreshold', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Critical Threshold (dB)</label>
          <input type="number" className="input-field" value={form.criticalThreshold} min={10} max={100}
            onChange={e => set('criticalThreshold', Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Assigned Device ID</label>
          <input className="input-field" value={form.assignedDeviceId} onChange={e => set('assignedDeviceId', e.target.value)} placeholder="ESP32_ROOM_101" />
        </div>
        <div>
          <label className="label">Monitoring Mode</label>
          <select className="select-field" value={form.monitoringMode} onChange={e => set('monitoringMode', e.target.value)}>
            <option value="hospital">Hospital</option>
            <option value="general">General</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={handleSave} className="btn-primary flex items-center gap-2 text-sm py-2">
          <Check className="w-4 h-4" /> Save
        </button>
        <button onClick={onCancel} className="btn-secondary flex items-center gap-2 text-sm py-2">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { locations, settings, updateSettings, addLocationLocal, updateLocationLocal, deleteLocationLocal, simMode, startSimulation, stopSimulation } = useApp();
  const [editing, setEditing] = useState(null); // locationId or 'new'
  const [confirmDelete, setConfirmDelete] = useState(null);

  const handleSaveRoom = (data) => {
    if (editing === 'new') {
      addLocationLocal({ ...data, locationId: generateId(), currentNoise: null, lastUpdated: null });
    } else {
      updateLocationLocal(editing, data);
    }
    setEditing(null);
  };

  const handleDelete = (locationId) => {
    if (confirmDelete === locationId) {
      deleteLocationLocal(locationId);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(locationId);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h2 className="page-title flex items-center gap-2">
          <Settings className="w-6 h-6" /> Settings
        </h2>
        <p className="text-sm text-slate-400 mt-1">Configure thresholds, rooms, and system behavior</p>
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        {/* Left — Location management */}
        <div className="xl:col-span-2 space-y-5">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title mb-0">Locations ({locations.length})</h3>
              <button onClick={() => setEditing('new')} className="btn-primary text-sm py-2 flex items-center gap-2">
                <Plus className="w-4 h-4" /> Add Location
              </button>
            </div>

            {editing === 'new' && (
              <div className="mb-4">
                <RoomEditor onSave={handleSaveRoom} onCancel={() => setEditing(null)} />
              </div>
            )}

            <div className="space-y-3">
              {locations.map(loc => (
                <div key={loc.locationId}>
                  {editing === loc.locationId ? (
                    <RoomEditor
                      location={loc}
                      onSave={handleSaveRoom}
                      onCancel={() => setEditing(null)}
                    />
                  ) : (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800">{loc.locationName}</p>
                        <p className="text-xs text-slate-400">
                          Warn ≥ {loc.warningThreshold} dB &nbsp;·&nbsp;
                          Critical ≥ {loc.criticalThreshold} dB &nbsp;·&nbsp;
                          <span className="capitalize">{loc.locationType?.replace('_', ' ')}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditing(loc.locationId)}
                          className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.locationId)}
                          className={`p-2 rounded-lg transition-colors ${
                            confirmDelete === loc.locationId
                              ? 'bg-red-100 text-red-600'
                              : 'hover:bg-red-50 text-slate-400 hover:text-red-500'
                          }`}
                        >
                          {confirmDelete === loc.locationId
                            ? <><AlertTriangle className="w-4 h-4 inline mr-1" />Confirm</>
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Global settings */}
        <div className="space-y-5">
          <div className="card">
            <h3 className="section-title">Alert Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Alert Duration (seconds)</label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.alertDurationSeconds}
                  min={1} max={60}
                  onChange={e => updateSettings({ alertDurationSeconds: Number(e.target.value) })}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Noise must exceed threshold for this many seconds before an alert fires.
                </p>
              </div>
              <div>
                <label className="label">Stale Data Timeout (seconds)</label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.staleDataTimeoutSeconds}
                  min={5} max={300}
                  onChange={e => updateSettings({ staleDataTimeoutSeconds: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="label">Simulation Interval (ms)</label>
                <input
                  type="number"
                  className="input-field"
                  value={settings.simulationIntervalMs}
                  min={500} max={10000} step={500}
                  onChange={e => updateSettings({ simulationIntervalMs: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Simulation Mode</h3>
            <p className="text-xs text-slate-400 mb-3">
              Generates demo noise readings without hardware.
            </p>
            {simMode ? (
              <button onClick={stopSimulation} className="btn-danger w-full text-sm py-2.5">
                Stop Simulation
              </button>
            ) : (
              <button onClick={() => startSimulation('random')} className="btn-primary w-full text-sm py-2.5 bg-purple-600 hover:bg-purple-700">
                Start Simulation
              </button>
            )}
          </div>

          <div className="card">
            <h3 className="section-title">Audio Alerts</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-700">Sound Alerts</p>
                <p className="text-xs text-slate-400">Disabled by default in hospital mode</p>
              </div>
              <button
                onClick={() => updateSettings({ audioAlertsEnabled: !settings.audioAlertsEnabled })}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  settings.audioAlertsEnabled ? 'bg-navy-700' : 'bg-slate-200'
                }`}
              >
                <span className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                  settings.audioAlertsEnabled ? 'translate-x-5' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
