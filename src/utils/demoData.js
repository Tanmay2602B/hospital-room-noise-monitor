// ─────────────────────────────────────────────────────────────────────────────
// Demo Data — Used when Firebase is not configured
// ─────────────────────────────────────────────────────────────────────────────

export const DEMO_LOCATIONS = [
  {
    locationId: 'ROOM_101',
    locationName: 'Room 101',
    locationType: 'patient_room',
    monitoringMode: 'hospital',
    warningThreshold: 41,
    criticalThreshold: 61,
    monitoringStatus: 'active',
    assignedDeviceId: 'ESP32_ROOM_101',
    currentNoise: null,
    lastUpdated: null,
  },
  {
    locationId: 'ROOM_102',
    locationName: 'Room 102',
    locationType: 'patient_room',
    monitoringMode: 'hospital',
    warningThreshold: 41,
    criticalThreshold: 61,
    monitoringStatus: 'active',
    assignedDeviceId: 'ESP32_ROOM_102',
    currentNoise: null,
    lastUpdated: null,
  },
  {
    locationId: 'ICU_01',
    locationName: 'ICU — Unit A',
    locationType: 'icu',
    monitoringMode: 'hospital',
    warningThreshold: 35,
    criticalThreshold: 50,
    monitoringStatus: 'active',
    assignedDeviceId: 'ESP32_ICU_01',
    currentNoise: 28,
    lastUpdated: new Date(),
  },
  {
    locationId: 'WARD_GEN',
    locationName: 'General Ward',
    locationType: 'ward',
    monitoringMode: 'hospital',
    warningThreshold: 41,
    criticalThreshold: 61,
    monitoringStatus: 'active',
    assignedDeviceId: 'ESP32_WARD_01',
    currentNoise: 45,          // Warning range — demo only
    lastUpdated: new Date(),
  },
  {
    locationId: 'WAIT_01',
    locationName: 'Waiting Area',
    locationType: 'waiting',
    monitoringMode: 'hospital',
    warningThreshold: 50,
    criticalThreshold: 70,
    monitoringStatus: 'active',
    assignedDeviceId: null,
    currentNoise: 32,          // Normal range — no sensor assigned yet
    lastUpdated: new Date(),
  },
  {
    locationId: 'OT_01',
    locationName: 'Operation Theatre',
    locationType: 'operation',
    monitoringMode: 'hospital',
    warningThreshold: 30,
    criticalThreshold: 45,
    monitoringStatus: 'active',
    assignedDeviceId: 'ESP32_OT_01',
    currentNoise: 22,
    lastUpdated: new Date(),
  },
];

export const DEMO_DEVICES = [
  { deviceId: 'ESP32_ROOM_101', locationId: 'ROOM_101', deviceType: 'ESP32+KY038', connectionStatus: 'online', lastSeen: new Date(), measurementType: 'approximate' },
  { deviceId: 'ESP32_ROOM_102', locationId: 'ROOM_102', deviceType: 'ESP32+KY038', connectionStatus: 'online', lastSeen: new Date(), measurementType: 'approximate' },
  { deviceId: 'ESP32_ICU_01',   locationId: 'ICU_01',   deviceType: 'ESP32+MAX4466', connectionStatus: 'online', lastSeen: new Date(), measurementType: 'approximate' },
  { deviceId: 'ESP32_WARD_01',  locationId: 'WARD_GEN', deviceType: 'ESP32+KY038', connectionStatus: 'online', lastSeen: new Date(), measurementType: 'approximate' },
  { deviceId: 'ESP32_OT_01',    locationId: 'OT_01',    deviceType: 'ESP32+MAX4466', connectionStatus: 'online', lastSeen: new Date(), measurementType: 'approximate' },
];

/**
 * Generate a list of historical readings for demo charts
 */
export function generateDemoHistory(minutes = 60) {
  const readings = [];
  const now = Date.now();
  for (let i = minutes; i >= 0; i--) {
    const t = new Date(now - i * 60 * 1000);
    const base = 30 + Math.sin(i / 8) * 15 + Math.random() * 12;
    readings.push({
      timestamp: t,
      noiseLevel: Math.round(Math.max(10, Math.min(90, base))),
      source: 'demo',
    });
  }
  return readings;
}

/**
 * Generate alert history for demo
 */
export function generateDemoAlerts() {
  const now = Date.now();
  // All demo alerts are pre-acknowledged — they are HISTORICAL records.
  // The critical overlay only fires for NEW alerts generated in the current session.
  return [
    {
      alertId: 'alert_001',
      locationId: 'WARD_GEN',
      locationName: 'General Ward',
      noiseLevel: 74,
      severity: 'CRITICAL',
      message: 'NOISE TOO LOUD! Please Maintain Silence',
      acknowledged: true,         // ← pre-acknowledged, historical
      createdAt: new Date(now - 2 * 60 * 1000),
      acknowledgedAt: new Date(now - 90 * 1000),
      source: 'demo',
    },
    {
      alertId: 'alert_002',
      locationId: 'ROOM_102',
      locationName: 'Room 102',
      noiseLevel: 56,
      severity: 'WARNING',
      message: 'Noise Level is Increasing',
      acknowledged: true,         // ← pre-acknowledged, historical
      createdAt: new Date(now - 8 * 60 * 1000),
      acknowledgedAt: new Date(now - 7 * 60 * 1000),
      source: 'demo',
    },
    {
      alertId: 'alert_003',
      locationId: 'ROOM_101',
      locationName: 'Room 101',
      noiseLevel: 68,
      severity: 'CRITICAL',
      message: 'NOISE TOO LOUD! Please Maintain Silence',
      acknowledged: true,
      createdAt: new Date(now - 25 * 60 * 1000),
      acknowledgedAt: new Date(now - 20 * 60 * 1000),
      source: 'demo',
    },
    {
      alertId: 'alert_004',
      locationId: 'WAIT_01',
      locationName: 'Waiting Area',
      noiseLevel: 62,
      severity: 'CRITICAL',
      message: 'NOISE TOO LOUD! Please Maintain Silence',
      acknowledged: true,
      createdAt: new Date(now - 45 * 60 * 1000),
      acknowledgedAt: new Date(now - 38 * 60 * 1000),
      source: 'demo',
    },
    {
      alertId: 'alert_005',
      locationId: 'ICU_01',
      locationName: 'ICU — Unit A',
      noiseLevel: 52,
      severity: 'CRITICAL',
      message: 'NOISE TOO LOUD! Please Maintain Silence',
      acknowledged: true,
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
      acknowledgedAt: new Date(now - 115 * 60 * 1000),
      source: 'demo',
    },
  ];
}
