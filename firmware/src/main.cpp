/*
 * ================================================================
 *  Smart Noise Monitoring System  –  Firmware v1.0
 *  Microcontroller : Arduino UNO R3
 *  Sensor          : Grove Loudness Sensor (analog) on pin A0
 *  Room            : Room 101
 *  Serial baud     : 9600
 *
 *  Machine-readable output format (every 500 ms):
 *    DATA,Room101,<raw>,<smoothed>,<status>,<millis>
 *
 *  Noise status thresholds (raw ADC values 0-1023, NOT dB):
 *    NORMAL  : raw < WARNING_THRESHOLD
 *    WARNING : WARNING_THRESHOLD <= raw < HIGH_THRESHOLD
 *    HIGH    : raw >= HIGH_THRESHOLD
 *
 *  Hysteresis: status must be confirmed by STABLE_COUNT
 *  consecutive identical readings before committing.
 * ================================================================
 */

#include <Arduino.h>

// =========================================================
//  CONFIGURATION  –  edit here only
// =========================================================
static const uint8_t  SENSOR_PIN         = A0;
static const int      WARNING_THRESHOLD  = 350;   // raw ADC
static const int      HIGH_THRESHOLD     = 600;   // raw ADC
static const float    EMA_ALPHA          = 0.20f; // smoothing factor
static const uint8_t  STABLE_COUNT       = 3;     // hysteresis depth
static const uint32_t READ_INTERVAL_MS   = 500UL; // ms between readings
// =========================================================

// ---- PROGMEM string table (saves SRAM) ----
const char S_NORMAL[]  PROGMEM = "NORMAL";
const char S_WARNING[] PROGMEM = "WARNING";
const char S_HIGH[]    PROGMEM = "HIGH";

// ---- Module state ----
static float    s_ema           = 0.0f;
static uint8_t  s_confirmed     = 0;   // 0=NORMAL, 1=WARNING, 2=HIGH
static uint8_t  s_pending       = 0;
static uint8_t  s_stableCount   = 0;
static uint32_t s_lastReadMs    = 0;

// =========================================================
//  Helper: print a PROGMEM string via Serial without
//  allocating any heap (no String objects used)
// =========================================================
static void serialPrintP(const char* pmStr) {
    char c;
    while ((c = (char)pgm_read_byte(pmStr++)) != '\0') {
        Serial.write(c);
    }
}

// =========================================================
//  Classify a raw ADC reading into a status index
// =========================================================
static uint8_t classify(int raw) {
    if (raw >= HIGH_THRESHOLD)    return 2;
    if (raw >= WARNING_THRESHOLD) return 1;
    return 0;
}

// =========================================================
//  Print the current confirmed status label (PROGMEM-safe)
// =========================================================
static void printStatusLabel(uint8_t s) {
    switch (s) {
        case 2:  serialPrintP(S_HIGH);    break;
        case 1:  serialPrintP(S_WARNING); break;
        default: serialPrintP(S_NORMAL);  break;
    }
}

// =========================================================
//  setup()
// =========================================================
void setup() {
    Serial.begin(9600);
    // For native-USB boards (Leonardo etc.) wait for port;
    // on UNO this resolves immediately.
    while (!Serial) { ; }

    // One-time human-readable startup banner
    Serial.println(F("========================================"));
    Serial.println(F("  Smart Noise Monitoring System  v1.0"));
    Serial.println(F("  Room    : Room 101"));
    Serial.println(F("  Sensor  : Grove Loudness Sensor @ A0"));
    Serial.println(F("  Baud    : 9600"));
    Serial.println(F("----------------------------------------"));
    Serial.print  (F("  WARNING threshold : "));
    Serial.print  (WARNING_THRESHOLD);
    Serial.println(F(" (raw ADC)"));
    Serial.print  (F("  HIGH    threshold : "));
    Serial.print  (HIGH_THRESHOLD);
    Serial.println(F(" (raw ADC)"));
    Serial.println(F("----------------------------------------"));
    Serial.println(F("  Format: DATA,RoomID,Raw,Smoothed,Status,ms"));
    Serial.println(F("========================================"));

    // Seed EMA with first live reading to avoid startup ramp
    s_ema = (float)analogRead(SENSOR_PIN);
}

// =========================================================
//  loop()  –  non-blocking, millis()-based timing
// =========================================================
void loop() {
    uint32_t now = millis();

    // Non-blocking interval check
    if ((now - s_lastReadMs) < READ_INTERVAL_MS) {
        return;
    }
    s_lastReadMs = now;

    // ---- 1. Read sensor ----
    int raw = analogRead(SENSOR_PIN);
    // Clamp to valid range (defensive)
    raw = constrain(raw, 0, 1023);

    // ---- 2. Exponential moving average (EMA) smoothing ----
    s_ema = EMA_ALPHA * (float)raw + (1.0f - EMA_ALPHA) * s_ema;
    int smoothed = (int)(s_ema + 0.5f);  // round to nearest int

    // ---- 3. Hysteresis state machine ----
    uint8_t candidate = classify(raw);
    if (candidate == s_pending) {
        if (s_stableCount < STABLE_COUNT) {
            s_stableCount++;
        }
    } else {
        s_pending     = candidate;
        s_stableCount = 1;
    }
    if (s_stableCount >= STABLE_COUNT) {
        s_confirmed = s_pending;
    }

    // ---- 4. Machine-readable output ----
    // DATA,Room101,<raw>,<smoothed>,<status>,<timestamp_ms>
    Serial.print(F("DATA,Room101,"));
    Serial.print(raw);
    Serial.print(',');
    Serial.print(smoothed);
    Serial.print(',');
    printStatusLabel(s_confirmed);
    Serial.print(',');
    Serial.println(now);
}