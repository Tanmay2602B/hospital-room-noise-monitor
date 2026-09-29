"""
python-bridge.py — Arduino Grove Sensor → Relay Server bridge
Reads DATA lines from COM3 and POSTs to relay-server.js
Run: python python-bridge.py
"""

import serial
import urllib.request
import urllib.error
import json
import time
import sys
import threading

# ── Config ──────────────────────────────────────────────────────────────────
PORT         = 'COM3'
BAUD         = 9600
RELAY_URL    = 'http://localhost:3001/reading'
RECONNECT_S  = 3
ADC_MAX      = 1023.0

# ── ADC (0-1023) → noise level (0-100) ──────────────────────────────────────
def adc_to_level(adc):
    return round(min(100, max(0, (adc / ADC_MAX) * 100)))

# ── Map Arduino status → dashboard status ───────────────────────────────────
def map_status(s):
    s = s.strip().upper()
    if s == 'HIGH':    return 'CRITICAL'
    if s == 'WARNING': return 'WARNING'
    return 'NORMAL'

# ── POST reading to relay ────────────────────────────────────────────────────
def post_reading(payload):
    try:
        data = json.dumps(payload).encode('utf-8')
        req  = urllib.request.Request(
            RELAY_URL, data=data,
            headers={'Content-Type': 'application/json'},
            method='POST'
        )
        with urllib.request.urlopen(req, timeout=2) as resp:
            result = json.loads(resp.read())
            return result.get('delivered', 0)
    except urllib.error.URLError as e:
        print(f'[bridge] ⚠ Relay POST failed: {e.reason} — Is relay-server running?')
        return 0
    except Exception as e:
        print(f'[bridge] ⚠ POST error: {e}')
        return 0

# ── Parse a DATA line ────────────────────────────────────────────────────────
# Format: DATA,Room101,<raw>,<smoothed>,<STATUS>,<ms>
def parse_line(line):
    try:
        parts = line.strip().split(',')
        if len(parts) < 6 or parts[0] != 'DATA':
            return None
        raw      = int(parts[2])
        smoothed = int(parts[3])
        status   = parts[4]
        ms       = int(parts[5])
        return raw, smoothed, status, ms
    except Exception:
        return None

# ── Main loop ────────────────────────────────────────────────────────────────
def run():
    print('\n=========================================================')
    print('   Smart Noise Monitor -- Python Arduino Bridge          ')
    print('=========================================================')
    print(f'  Port  : {PORT}')
    print(f'  Baud  : {BAUD}')
    print(f'  Relay : {RELAY_URL}')
    print('=========================================================\n')
    print('[bridge] Press Ctrl+C to stop\n')

    while True:
        try:
            print(f'[bridge] Opening {PORT} at {BAUD} baud...')
            ser = serial.Serial(PORT, BAUD, timeout=2)
            print(f'[bridge] ✓ Connected to Arduino on {PORT}')
            print('[bridge] Waiting for data lines...\n')

            while True:
                try:
                    raw_line = ser.readline()
                    line     = raw_line.decode('utf-8', errors='ignore').strip()
                    if not line:
                        continue

                    if line.startswith('DATA,'):
                        parsed = parse_line(line)
                        if not parsed:
                            print(f'[bridge] ⚠ Bad line: {repr(line)}')
                            continue

                        raw, smoothed, status, ms = parsed
                        level    = adc_to_level(smoothed)
                        dash_status = map_status(status)

                        payload = {
                            'noiseLevel':  level,
                            'locationId':  'ROOM_101',
                            'deviceName':  'Arduino UNO — Grove Loudness Sensor',
                            'status':      dash_status,
                            'source':      'arduino',
                            'rawAdc':      raw,
                            'smoothedAdc': smoothed,
                        }

                        delivered = post_reading(payload)
                        bar = '█' * int(level / 5) + '░' * (20 - int(level / 5))
                        print(f'[bridge] [{bar}] {level:3d}  {dash_status:<8}  raw={raw}  smooth={smoothed}  →  {delivered} client(s)')

                    else:
                        # Print banner/info lines from Arduino
                        print(f'[arduino] {line}')

                except serial.SerialException as e:
                    print(f'[bridge] Serial error: {e}')
                    break
                except KeyboardInterrupt:
                    ser.close()
                    print('\n[bridge] Stopped.')
                    sys.exit(0)

            ser.close()
            print(f'[bridge] Port closed. Reconnecting in {RECONNECT_S}s...\n')

        except serial.SerialException as e:
            print(f'[bridge] Cannot open {PORT}: {e}')
            print(f'[bridge] Retrying in {RECONNECT_S}s...')

        except KeyboardInterrupt:
            print('\n[bridge] Stopped.')
            sys.exit(0)

        time.sleep(RECONNECT_S)

if __name__ == '__main__':
    run()
