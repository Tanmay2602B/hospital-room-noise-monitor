// ─────────────────────────────────────────────────────────────────────────────
// useMicrophone — Web Audio API hook
//
// PRIVACY: Audio is processed 100% locally. Only the calculated relative
// noise level (a number 0–100) is exposed. No audio is recorded or transmitted.
//
// DISCLAIMER: Values are RELATIVE noise levels from raw mic amplitude.
// This is NOT calibrated dB(A). Accuracy depends on the microphone hardware.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useCallback, useEffect } from 'react';

// ── dBFS → relative display level (0–100) ────────────────────────────────────
// Maps a dBFS range suited to post-gain mic signals.
// After gain boost, a built-in mic signal lands in approximately [−45, −5] dBFS.
// An earbud/external mic with lower gain lands similarly after auto-gain adjustment.
function rmsToDisplay(rms) {
  if (!rms || rms < 0.000001) return 0;
  const dbFS = 20 * Math.log10(rms);
  const MIN  = -52;
  const MAX  = -3;
  const pct  = (Math.max(MIN, Math.min(MAX, dbFS)) - MIN) / (MAX - MIN);
  return Math.round(5 + pct * 93);
}

export function useMicrophone() {
  const [micState,  setMicState]  = useState('idle');    // 'idle'|'requesting'|'active'|'error'
  const [micLevel,  setMicLevel]  = useState(null);      // 0–100 or null
  const [micError,  setMicError]  = useState(null);      // string or null
  const [micDevice, setMicDevice] = useState('unknown'); // 'builtin'|'external'|'unknown'
  const [micLabel,  setMicLabel]  = useState('');        // raw device label
  const [devices,   setDevices]   = useState([]);        // available MediaDeviceInfo[]
  const [deviceId,  setDeviceId]  = useState(null);      // selected deviceId

  const ctxRef      = useRef(null);
  const streamRef   = useRef(null);
  const analyserRef = useRef(null);
  const gainRef     = useRef(null);
  const floatBufRef = useRef(null);
  const animRef     = useRef(null);
  const smoothRef   = useRef(0);
  const callbackRef = useRef(null);
  const gainValRef  = useRef(22); // current gain value

  // ── Enumerate available microphones ─────────────────────────────────────────
  const refreshDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices(all.filter(d => d.kind === 'audioinput'));
    } catch (_) {}
  }, []);

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
  }, [refreshDevices]);

  // ── Start microphone capture ─────────────────────────────────────────────────
  const startMicrophone = useCallback(async (onTick, gainOverride) => {
    // Stop any existing session first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }

    callbackRef.current = onTick || null;
    setMicError(null);
    setMicState('requesting');

    // Check for browser support
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicError('Your browser does not support microphone access. Try Chrome or Firefox on HTTPS/localhost.');
      setMicState('error');
      return;
    }

    try {
      const audioConstraints = {
        echoCancellation: false,  // keep raw signal for accurate level measurement
        noiseSuppression: false,
        autoGainControl:  false,  // we apply our own gain
        channelCount:     1,
      };
      // If user selected a specific device, use it
      if (deviceId) audioConstraints.deviceId = { exact: deviceId };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });

      streamRef.current = stream;

      // Detect device type from label
      const track     = stream.getAudioTracks()[0];
      const rawLabel  = track?.label || '';
      const label     = rawLabel.toLowerCase();
      const isExternal = label.includes('usb') || label.includes('bluetooth') ||
                         label.includes('headset') || label.includes('earbud') ||
                         label.includes('airpod') || label.includes('external') ||
                         label.includes('wireless');

      setMicLabel(rawLabel || 'Default Microphone');
      setMicDevice(isExternal ? 'external' : 'builtin');

      // After getting permission, refresh device list (labels now available)
      refreshDevices();

      // ── Build audio processing graph ─────────────────────────────────────
      const ctx      = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
      if (ctx.state === 'suspended') await ctx.resume();

      const source   = ctx.createMediaStreamSource(stream);
      const gain     = ctx.createGain();
      const analyser = ctx.createAnalyser();

      // Auto-set gain: built-in mics need more boost than external
      const autoGain      = isExternal ? 8 : 22;
      const startingGain  = gainOverride ?? gainValRef.current ?? autoGain;
      gain.gain.value     = startingGain;
      gainValRef.current  = startingGain;

      analyser.fftSize               = 2048;
      analyser.smoothingTimeConstant = 0; // manual VU-meter smoothing below

      // Chain: mic → gain → analyser  (NOT connected to destination — no playback)
      source.connect(gain);
      gain.connect(analyser);

      ctxRef.current      = ctx;
      gainRef.current     = gain;
      analyserRef.current = analyser;
      floatBufRef.current = new Float32Array(analyser.fftSize);

      smoothRef.current = 0;
      setMicState('active');

      // ── ~60fps RMS tick loop ──────────────────────────────────────────────
      const tick = () => {
        if (!analyserRef.current || !floatBufRef.current) return;

        analyserRef.current.getFloatTimeDomainData(floatBufRef.current);

        let sum = 0;
        const buf = floatBufRef.current;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        const rms = Math.sqrt(sum / buf.length);
        const raw = rmsToDisplay(rms);

        // VU-meter: fast attack, slow release
        const prev = smoothRef.current;
        smoothRef.current = raw > prev
          ? prev + (raw - prev) * 0.60
          : prev + (raw - prev) * 0.15;

        const display = Math.min(100, Math.max(0, Math.round(smoothRef.current)));

        setMicLevel(display);
        if (callbackRef.current) callbackRef.current(display);

        animRef.current = requestAnimationFrame(tick);
      };

      animRef.current = requestAnimationFrame(tick);

    } catch (err) {
      let msg = 'Could not access microphone.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. Click the lock icon in your browser address bar and allow microphone access, then try again.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No microphone was found on this device.';
      } else if (err.name === 'NotReadableError') {
        msg = 'Microphone is already in use by another application. Close other apps that use the microphone and try again.';
      } else if (err.name === 'OverconstrainedError') {
        msg = 'Selected microphone device is not available. Please choose a different microphone.';
      } else if (err.name === 'SecurityError') {
        msg = 'Microphone access is blocked by the browser. This app must be served over HTTPS or localhost.';
      }
      console.error('[useMicrophone]', err.name, '—', err.message);
      setMicError(msg);
      setMicState('error');
    }
  }, [deviceId, refreshDevices]);

  // ── Adjust gain in real time without restarting ──────────────────────────────
  const setGain = useCallback((value) => {
    const clamped = Math.max(1, Math.min(50, value));
    gainValRef.current = clamped;
    if (gainRef.current) gainRef.current.gain.value = clamped;
  }, []);

  // ── Stop cleanly ─────────────────────────────────────────────────────────────
  const stopMicrophone = useCallback(() => {
    if (animRef.current)   { cancelAnimationFrame(animRef.current);  animRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (ctxRef.current)    { ctxRef.current.close().catch(() => {}); ctxRef.current = null; }

    analyserRef.current = null;
    gainRef.current     = null;
    floatBufRef.current = null;
    callbackRef.current = null;
    smoothRef.current   = 0;

    setMicLevel(null);
    setMicState('idle');
    setMicError(null);
    setMicDevice('unknown');
    setMicLabel('');
  }, []);

  // Cleanup on unmount
  useEffect(() => () => stopMicrophone(), [stopMicrophone]);

  return {
    // State
    micState,
    micLevel,
    micError,
    micDevice,
    micLabel,
    // Device selection
    devices,
    deviceId,
    setDeviceId,
    refreshDevices,
    // Controls
    startMicrophone,
    stopMicrophone,
    setGain,
    gainValue: gainValRef.current,
    // Computed
    isActive:     micState === 'active',
    isRequesting: micState === 'requesting',
    isError:      micState === 'error',
  };
}
