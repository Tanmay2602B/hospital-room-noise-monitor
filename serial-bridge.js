// ─────────────────────────────────────────────────────────────────────────────
// serial-bridge.js  —  Arduino UNO Serial → Relay Server bridge
//
// PURPOSE:
//   Reads DATA lines from Arduino over USB-Serial and POSTs each reading
//   to relay-server.js, which forwards them via WebSocket to the dashboard.
//
// USAGE:
//   node serial-bridge.js               (auto-detect port)
//   node serial-bridge.js --port COM3   (specify port)
//   node serial-bridge.js --list        (list all COM ports)
//
// ARDUINO OUTPUT FORMAT (from firmware):
//   DATA,Room101,<raw>,<smoothed>,<status>,<millis>
//
// RELAY SERVER:
//   Must be running: node relay-server.js
//   Listens at: http://localhost:3001/reading
// ─────────────────────────────────────────────────────────────────────────────

import { SerialPort } from 'serialport';
import { ReadlineParser } from '@serialport/parser-readline';
import http from 'http';

// ── Config ────────────────────────────────────────────────────────────────────
const BAUD_RATE      = 9600;
const RELAY_HOST     = 'localhost';
const RELAY_PORT     = 3001;
const RELAY_PATH     = '/reading';
const RECONNECT_MS   = 3000;

// Raw ADC range (0-1023) → dashboard noise level (0-100)
const ADC_MIN = 0;
const ADC_MAX = 1023;
const DB_MIN  = 0;
const DB_MAX  = 100;

// ── CLI args ──────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const listOnly = args.includes('--list');
const portIdx  = args.indexOf('--port');
const portArg  = portIdx !== -1 ? args[portIdx + 1] : null;

// ── Map raw ADC (0-1023) to display level (0-100) ────────────────────────────
function adcToLevel(raw) {
  const clamped = Math.max(ADC_MIN, Math.min(ADC_MAX, raw));
  return Math.round((clamped / ADC_MAX) * DB_MAX);
}

// ── Map firmware STATUS to dashboard status ───────────────────────────────────
function mapStatus(status) {
  switch (status?.toUpperCase()) {
    case 'HIGH':    return 'CRITICAL';
    case 'WARNING': return 'WARNING';
    default:        return 'NORMAL';
  }
}

// ── Parse a DATA line from Arduino ───────────────────────────────────────────
// Format: DATA,Room101,<raw>,<smoothed>,<status>,<ms>
function parseLine(line) {
  const parts = line.trim().split(',');
  if (parts.length < 6 || parts[0] !== 'DATA') return null;
  const raw      = parseInt(parts[2], 10);
  const smoothed = parseInt(parts[3], 10);
  const status   = parts[4];
  const ms       = parseInt(parts[5], 10);
  if (isNaN(raw) || isNaN(smoothed)) return null;
  return { raw, smoothed, status, ms };
}

// ── POST a reading to relay server ───────────────────────────────────────────
function postReading(payload) {
  const body = JSON.stringify(payload);
  const req  = http.request({
    hostname: RELAY_HOST,
    port:     RELAY_PORT,
    path:     RELAY_PATH,
    method:   'POST',
    headers:  {
      'Content-Type':   'application/json',
      'Content-Length': Buffer.byteLength(body),
    },
  }, (res) => {
    if (res.statusCode !== 200) {
      console.warn(`[bridge] Relay responded ${res.statusCode}`);
    }
  });
  req.on('error', (e) => {
    console.error(`[bridge] POST failed: ${e.message} — Is relay-server.js running?`);
  });
  req.write(body);
  req.end();
}

// ── List all COM ports and exit ───────────────────────────────────────────────
async function listPorts() {
  const ports = await SerialPort.list();
  if (ports.length === 0) {
    console.log('[bridge] No serial ports found. Is Arduino connected?');
    return;
  }
  console.log('\nAvailable serial ports:');
  ports.forEach(p => {
    console.log(`  ${p.path.padEnd(12)} ${p.manufacturer || ''} ${p.pnpId || ''}`);
  });
  console.log('\nRun: node serial-bridge.js --port <PORT>');
}

// ── Auto-detect Arduino port ──────────────────────────────────────────────────
async function detectArduinoPort() {
  const ports = await SerialPort.list();
  // Prefer ports that look like Arduino
  const arduino = ports.find(p =>
    /arduino|ch340|ch341|ftdi|uno|mega|cp210/i.test(p.manufacturer || p.pnpId || '')
  );
  if (arduino) return arduino.path;
  // Fallback: first available port
  if (ports.length > 0) return ports[0].path;
  return null;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (listOnly) {
    await listPorts();
    return;
  }

  let portPath = portArg;
  if (!portPath) {
    console.log('[bridge] No --port specified. Auto-detecting...');
    portPath = await detectArduinoPort();
    if (!portPath) {
      console.error('[bridge] No serial ports found! Connect Arduino and retry, or use: node serial-bridge.js --port COM3');
      process.exit(1);
    }
    console.log(`[bridge] Detected port: ${portPath}`);
  }

  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   Smart Noise Monitor — Arduino Serial Bridge        ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Port     : ${portPath.padEnd(42)}║`);
  console.log(`║  Baud     : ${String(BAUD_RATE).padEnd(42)}║`);
  console.log(`║  Relay    : http://${RELAY_HOST}:${RELAY_PORT}${RELAY_PATH.padEnd(26)}║`);
  console.log('║                                                      ║');
  console.log('║  Make sure relay-server.js is running first!         ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  function connect() {
    const port = new SerialPort({ path: portPath, baudRate: BAUD_RATE, autoOpen: false });
    const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));

    port.open((err) => {
      if (err) {
        console.error(`[bridge] Cannot open ${portPath}: ${err.message}`);
        console.log(`[bridge] Retrying in ${RECONNECT_MS / 1000}s...`);
        setTimeout(connect, RECONNECT_MS);
        return;
      }
      console.log(`[bridge] ✓ Connected to Arduino on ${portPath}`);
      console.log('[bridge] Waiting for data... (upload firmware and power Arduino)');
    });

    parser.on('data', (line) => {
      // Print raw line for debugging
      if (line.startsWith('DATA,')) {
        const parsed = parseLine(line);
        if (!parsed) return;

        const level  = adcToLevel(parsed.smoothed);   // use smoothed ADC value
        const status = mapStatus(parsed.status);

        const payload = {
          noiseLevel:  level,
          locationId:  'ROOM_101',
          deviceName:  'Arduino UNO (Grove Sensor)',
          status:      status,
          rawAdc:      parsed.raw,
          smoothedAdc: parsed.smoothed,
          timestamp:   new Date().toISOString(),
          source:      'arduino',
        };

        postReading(payload);
        console.log(`[bridge] raw=${parsed.raw} smoothed=${parsed.smoothed} → level=${level} ${status}`);
      } else if (line.trim()) {
        // Print banner/debug lines from Arduino as-is
        console.log(`[arduino] ${line}`);
      }
    });

    port.on('close', () => {
      console.warn(`[bridge] Port ${portPath} closed. Reconnecting in ${RECONNECT_MS / 1000}s...`);
      setTimeout(connect, RECONNECT_MS);
    });

    port.on('error', (err) => {
      console.error(`[bridge] Port error: ${err.message}`);
    });
  }

  connect();
}

main().catch(e => { console.error(e); process.exit(1); });