// ─────────────────────────────────────────────────────────────────────────────
// Firestore Service Layer
// All Firestore operations are here. UI never touches Firestore directly.
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  onSnapshot, query, orderBy, limit, where, Timestamp, getDocs,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

// ── Locations ────────────────────────────────────────────────────────────────

export function subscribeToLocations(callback) {
  if (!isFirebaseConfigured || !db) {
    callback([]); // caller will fall back to demo data
    return () => {};
  }
  const q = query(collection(db, 'locations'), orderBy('locationName'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ locationId: d.id, ...d.data() }))));
}

export async function addLocation(data) {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  const ref = doc(collection(db, 'locations'));
  await setDoc(ref, { ...data, locationId: ref.id, createdAt: Timestamp.now() });
  return ref.id;
}

export async function updateLocation(locationId, data) {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await updateDoc(doc(db, 'locations', locationId), data);
}

export async function deleteLocation(locationId) {
  if (!isFirebaseConfigured || !db) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, 'locations', locationId));
}

// ── Noise Readings ────────────────────────────────────────────────────────────

/**
 * Save a periodic reading (throttle this — don't write every second to Firestore)
 */
export async function saveReading(reading) {
  if (!isFirebaseConfigured || !db) return;
  await addDoc(collection(db, 'noise_readings'), {
    ...reading,
    timestamp: Timestamp.fromDate(reading.timestamp instanceof Date ? reading.timestamp : new Date(reading.timestamp)),
  });
}

/**
 * Subscribe to recent readings for a location (last N)
 */
export function subscribeToReadings(locationId, count = 60, callback) {
  if (!isFirebaseConfigured || !db) { callback([]); return () => {}; }
  const q = query(
    collection(db, 'noise_readings'),
    where('locationId', '==', locationId),
    orderBy('timestamp', 'desc'),
    limit(count),
  );
  return onSnapshot(q, snap => {
    const docs = snap.docs.map(d => ({ readingId: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() }));
    callback(docs.reverse());
  });
}

// ── Alerts ────────────────────────────────────────────────────────────────────

export async function createAlert(alert) {
  if (!isFirebaseConfigured || !db) return null;
  const ref = await addDoc(collection(db, 'alerts'), {
    ...alert,
    createdAt: Timestamp.now(),
    acknowledged: false,
    acknowledgedAt: null,
  });
  return ref.id;
}

export async function acknowledgeAlert(alertId) {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, 'alerts', alertId), {
    acknowledged: true,
    acknowledgedAt: Timestamp.now(),
  });
}

export function subscribeToAlerts(callback, maxCount = 50) {
  if (!isFirebaseConfigured || !db) { callback([]); return () => {}; }
  const q = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'), limit(maxCount));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({
      alertId: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
      acknowledgedAt: d.data().acknowledgedAt?.toDate() || null,
    })));
  });
}

// ── Devices ──────────────────────────────────────────────────────────────────

export function subscribeToDevices(callback) {
  if (!isFirebaseConfigured || !db) { callback([]); return () => {}; }
  const q = query(collection(db, 'devices'));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ deviceId: d.id, ...d.data() }))));
}

export async function updateDeviceStatus(deviceId, status, lastSeen) {
  if (!isFirebaseConfigured || !db) return;
  await setDoc(doc(db, 'devices', deviceId), {
    connectionStatus: status,
    lastSeen: Timestamp.fromDate(lastSeen),
  }, { merge: true });
}
