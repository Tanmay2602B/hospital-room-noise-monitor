/*
 * ================================================================
 *  Smart Noise Monitoring System  –  Firmware v2.0
 *  Microcontroller : Arduino UNO R3
 *  Sensor          : Grove Loudness Sensor (analog) on pin A0
 *  Room            : Room 101
 *  Serial baud     : 9600
 *
 *  How it works (per UPDATE_INTERVAL window):
 *    1. Take SAMPLE_COUNT readings evenly spread across the window.
 *    2. Compute PEAK-TO-PEAK amplitude (max – min sample).
 *       Peak-to-peak captures transients (claps, speech bursts)
 *       far better than a simple average.
 *    3. Apply EMA smoothing to the peak-to-peak value to reduce
 *       flicker while keeping good transient response.
 *    4. Apply AMPLIFICATION_FACTOR to produce a displayValue that
 *       makes small variations visible on the dashboard.
 *       displayValue is clamped to 0–1023 and is NOT real dB.
 *    5. Thresholds are applied to displayValue so the dashboard
 *       status reacts to amplified changes.
 *
 *  Serial output format (every UPDATE_INTERVAL ms):
 *    DATA,Room101,<rawValue>,<displayValue>,<status>,<millis>
 *
 *    rawValue    : last raw ADC reading (0–1023), untouched
 *    displayValue: amplified peak-to-peak (0–1023), for visualization
 *    status      : NORMAL | WARNING | HIGH
 *
 *  NOTE: displayValue is a scaled visualization aid, not a
 *        calibrated dB(A) measurement.
 * ================================================================
 */

#include <Arduino.h>

// =========================================================
//  CONFIGURATION  –  edit only this block
// =========================================================

// Hardware
static const uint8_t  SENSOR_PIN          = A0;

// Sampling
static const uint8_t  SAMPLE_COUNT        = 32;    // readings per window
static const uint32_t UPDATE_INTERVAL_MS  = 500UL; // ms between output lines

// Amplification  (displayValue = peak_to_peak * AMPLIFICATION_FACTOR)
// Increase if your sensor reads very low values even in a noisy room.
// A value of 1.0 means no amplification.
// Typical range: 1.5 – 6.0 for Grove Loudness Sensor.
static const float    AMPLIFICATION_FACTOR = 3.0f;

// EMA smoothing applied to the peak-to-peak value (0.0–1.0)
// Higher = more responsive but noisier.
// Lower  = smoother but slower to react.
static const float    EMA_ALPHA            = 0.35f;

// Status thresholds – applied to displayValue (0–1023)
// Tune these after you observe your typical displayValue range.
static const int      WARNING_THRESHOLD   = 80;   // displayValue
static const int      HIGH_THRESHOLD      = 200;  // displayValue

// Hysteresis: how many consecutive windows must agree before
// committing a new status. Prevents rapid flickering.
static const uint8_t  STABLE_COUNT        = 2;

// =========================================================

// ---- PROGMEM string table (saves SRAM on UNO) ----
const char S_NORMAL[]  PROGMEM = "NORMAL";
const char S_WARNING[] PROGMEM = "WARNING";
const char S_HIGH[]    PROGMEM = "HIGH";

// ---- Module state ----
static float    s_ema           = 0.0f;   // smoothed peak-to-peak
static uint8_t  s_confirmed     = 0;      // 0=NORMAL 1=WARNING 2=HIGH
static uint8_t  s_pending       = 0;
static uint8_t  s_stableCount   = 0;
static uint32_t s_windowStart   = 0;

// ---- Sample buffer (stack-allocated, no malloc) ----
static int s_samples[SAMPLE_COUNT];

// =========================================================
//  Helper: stream a PROGMEM string to Serial (no heap use)
// =========================================================
static void serialPrintP(const char* pmStr) {
    char c;
    while ((c = (char)pgm_read_byte(pmStr++)) != '\0') {
        Serial.write(c);
    }
}

// =========================================================
//  Classify a displayValue into a status index
// =========================================================
static uint8_t classify(int displayVal) {
    if (displayVal >= HIGH_THRESHOLD)    return 2;
    if (displayVal >= WARNING_THRESHOLD) return 1;
    return 0;
}

// =========================================================
//  Print the confirmed status label (PROGMEM-safe)
// =========================================================
static void printStatusLabel(uint8_t s) {
    switch (s) {
        case 2:  serialPrintP(S_HIGH);    break;
        case 1:  serialPrintP(S_WARNING); break;
        default: serialPrintP(S_NORMAL);  break;
    }
}

// =========================================================
//  Take SAMPLE_COUNT readings spread evenly across the window
//  Returns the index of the last valid sample stored.
// =========================================================
static void collectSamples() {
    uint32_t delayUs = (UPDATE_INTERVAL_MS * 1000UL) / SAMPLE_COUNT;
    for (uint8_t i = 0; i < SAMPLE_COUNT; i++) {
        s_samples[i] = analogRead(SENSOR_PIN);
        // Brief delay between samples to spread them across the window.
        // Using delayMicroseconds avoids disrupting millis().
        if (delayUs > 16383UL) {
            delay((uint16_t)(delayUs / 1000UL));
        } else {
            delayMicroseconds((uint16_t)delayUs);
        }
    }
}

// =========================================================
//  Compute peak-to-peak amplitude from the sample buffer
// =========================================================
static int peakToPeak() {
    int mn = s_samples[0];
    int mx = s_samples[0];
    for (uint8_t i = 1; i < SAMPLE_COUNT; i++) {
        if (s_samples[i] < mn) mn = s_samples[i];
        if (s_samples[i] > mx) mx = s_samples[i];
    }
    return mx - mn;
}

// =========================================================
//  setup()
// =========================================================
void setup() {
    Serial.begin(9600);
    // On UNO, !Serial is always false — line kept for portability
    while (!Serial) { ; }

    // Startup banner (human-readable, ignored by bridge)
    Serial.println(F("========================================"));
    Serial.println(F("  Smart Noise Monitoring System  v2.0"));
    Serial.println(F("  Room    : Room 101"));
    Serial.println(F("  Sensor  : Grove Loudness Sensor @ A0"));
    Serial.println(F("  Baud    : 9600"));
    Serial.println(F("----------------------------------------"));
    Serial.print  (F("  SAMPLE_COUNT       : ")); Serial.println(SAMPLE_COUNT);
    Serial.print  (F("  UPDATE_INTERVAL_MS : ")); Serial.println(UPDATE_INTERVAL_MS);
    Serial.print  (F("  AMPLIFICATION_FACTOR: ")); Serial.println(AMPLIFICATION_FACTOR);
    Serial.print  (F("  EMA_ALPHA          : ")); Serial.println(EMA_ALPHA);
    Serial.println(F("  Thresholds apply to displayValue (0-1023):"));
    Serial.print  (F("    WARNING >= ")); Serial.println(WARNING_THRESHOLD);
    Serial.print  (F("    HIGH    >= ")); Serial.println(HIGH_THRESHOLD);
    Serial.println(F("----------------------------------------"));
    Serial.println(F("  Format: DATA,Room101,rawValue,displayValue,status,ms"));
    Serial.println(F("  NOTE: displayValue is scaled for visualization, NOT real dB"));
    Serial.println(F("========================================"));

    // Seed EMA with one real reading to avoid startup ramp
    s_ema = (float)analogRead(SENSOR_PIN);
    s_windowStart = millis();
}

// =========================================================
//  loop()  –  collect samples, compute, emit
// =========================================================
void loop() {
    // 1. Collect SAMPLE_COUNT samples spread over UPDATE_INTERVAL_MS
    collectSamples();

    uint32_t now = millis();

    // 2. Last raw reading (unchanged, genuine ADC value)
    int rawValue = s_samples[SAMPLE_COUNT - 1];
    rawValue = constrain(rawValue, 0, 1023);

    // 3. Peak-to-peak amplitude from sample burst
    int p2p = peakToPeak();

    // 4. EMA smoothing on p2p to reduce flicker
    s_ema = EMA_ALPHA * (float)p2p + (1.0f - EMA_ALPHA) * s_ema;

    // 5. Apply amplification and clamp to 0–1023
    int displayValue = (int)(s_ema * AMPLIFICATION_FACTOR + 0.5f);
    displayValue = constrain(displayValue, 0, 1023);

    // 6. Hysteresis state machine on displayValue
    uint8_t candidate = classify(displayValue);
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

    // 7. Machine-readable output
    // DATA,Room101,<rawValue>,<displayValue>,<status>,<millis>
    Serial.print(F("DATA,Room101,"));
    Serial.print(rawValue);
    Serial.print(',');
    Serial.print(displayValue);
    Serial.print(',');
    printStatusLabel(s_confirmed);
    Serial.print(',');
    Serial.println(now);
}