// ─────────────────────────────────────────────────────────────────────────────
// Devices Page — Hardware device management
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { Cpu, Wifi, WifiOff, Clock, Info, Vibrate, AlertCircle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { formatDateTime } from '../utils/noiseUtils';

export default function DevicesPage() {
  const { devices, locations } = useApp();

  const getLocationName = (locationId) =>
    locations.find(l => l.locationId === locationId)?.locationName || locationId;

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto">
      <div className="mb-6">
        <h2 className="page-title">Device Management</h2>
        <p className="text-sm text-slate-400 mt-1">Connected and registered noise sensors</p>
      </div>

      {/* ESP32 integration notice */}
      <div className="card mb-6 border-teal-200 bg-teal-50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-teal-800 mb-1">ESP32 Integration Ready</h3>
            <p className="text-sm text-teal-700 mb-2">
              Configure your ESP32 to send POST requests to the following endpoint:
            </p>
            <code className="block bg-teal-100 text-teal-900 text-xs p-3 rounded-lg font-mono">
              POST /api/readings<br />
              Content-Type: application/json<br />
              <br />
              {'{'}<br />
              &nbsp;&nbsp;"deviceId": "ESP32_ROOM_101",<br />
              &nbsp;&nbsp;"locationId": "ROOM_101",<br />
              &nbsp;&nbsp;"noiseLevel": 52,<br />
              &nbsp;&nbsp;"unit": "dB",<br />
              &nbsp;&nbsp;"measurementType": "approximate",<br />
              &nbsp;&nbsp;"timestamp": "2026-09-28T10:30:00Z"<br />
              {'}'}
            </code>
            <p className="text-xs text-teal-600 mt-2">
              ⚠ Note: Readings are approximate. Calibrated dB(A) requires a calibrated sensor and proper signal processing.
            </p>
          </div>
        </div>
      </div>

      {/* Device cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {devices.map(device => (
          <div key={device.deviceId} className="card card-hover">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl ${
                  device.connectionStatus === 'online' ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  <Cpu className={`w-5 h-5 ${
                    device.connectionStatus === 'online' ? 'text-emerald-600' : 'text-red-500'
                  }`} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{device.deviceId}</p>
                  <p className="text-xs text-slate-400">{device.deviceType}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                device.connectionStatus === 'online'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {device.connectionStatus === 'online'
                  ? <><Wifi className="w-3 h-3" /> Online</>
                  : <><WifiOff className="w-3 h-3" /> Offline</>
                }
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-slate-700">{getLocationName(device.locationId)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Measurement</span>
                <span className="font-medium text-slate-700 capitalize">{device.measurementType}</span>
              </div>
              {device.lastSeen && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Seen</span>
                  <span className="font-medium text-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDateTime(device.lastSeen)}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add new device placeholder */}
        <div className="card border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-3 min-h-32 hover:border-navy-300 hover:bg-navy-50 transition-colors cursor-pointer">
          <Cpu className="w-8 h-8 text-slate-300" />
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-400">Add New Device</p>
            <p className="text-xs text-slate-300">Register an ESP32 sensor</p>
          </div>
        </div>
      </div>

      {/* Wearable module */}
      <div className="card">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-xl">
            <Vibrate className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Wearable Alert Device</h3>
            <p className="text-xs text-slate-400">Future patient vibration alert clip</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold border border-slate-200">
            <AlertCircle className="w-3 h-3" /> Not Connected
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-4">
          {[
            { label: 'Connection', value: 'Disconnected', color: 'text-slate-400' },
            { label: 'Last Alert Sent', value: '—', color: 'text-slate-400' },
            { label: 'Vibration Status', value: 'Inactive', color: 'text-slate-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-3 rounded-xl bg-slate-50">
              <p className="text-xs text-slate-400 mb-1">{label}</p>
              <p className={`font-bold text-sm ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-sm font-semibold cursor-not-allowed"
          >
            <Vibrate className="w-4 h-4" />
            Send Test Vibration (Hardware required)
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-3">
          This module is prepared for future ESP32-C3 or BLE wearable integration.
          Hardware connection will be implemented in Phase 4.
        </p>
      </div>
    </div>
  );
}
