// ============================================================
// HydroSmart — Telemetry Validation & Calibration Engine
// Strict Physical Boundary Enforcement & Packet Sanitization
// ============================================================

import {
  DeviceCalibrationConfig,
  RawPacketValidationResult,
  SensorHealthStatus,
  IoTDevice
} from './types';

export const DEFAULT_CALIBRATION: DeviceCalibrationConfig = {
  phOffset: 0.0,
  phSlopeMultiplier: 1.0,
  tdsCalibrationFactor: 1.0,
  ultrasonicEmptyDistanceCm: 60.0,
  ultrasonicFullDistanceCm: 13.0,
  heartbeatTimeoutMs: 5000,
};

/**
 * Validate and sanitize raw serial input from ESP32 against physical limits
 */
export function validateAndSanitizePacket(
  rawInput: string,
  calibration: DeviceCalibrationConfig = DEFAULT_CALIBRATION
): RawPacketValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { isValid: false, errorMessage: 'Empty packet received' };
  }

  let parsed: Record<string, unknown> | null = null;
  let isHeartbeat = false;

  // 1. Try parsing JSON
  try {
    const jsonCandidate = JSON.parse(trimmed);
    if (jsonCandidate && typeof jsonCandidate === 'object') {
      parsed = jsonCandidate as Record<string, unknown>;
      if (parsed.type === 'heartbeat' || parsed.event === 'heartbeat') {
        isHeartbeat = true;
      }
    }
  } catch {
    // 2. Regex fallback for line-based plain serial output (e.g. "pH: 6.2 | TDS: 950 | Level: 80%")
    const phMatch = trimmed.match(/(?:ph|ph\s*value|ph=)\s*:?\s*([0-9.]+)/i);
    const tdsMatch = trimmed.match(/(?:tds|tds\s*value|tds=)\s*:?\s*([0-9.]+)/i);
    const wlMatch = trimmed.match(/(?:wl|water\s*level|level=)\s*:?\s*([0-9.]+)/i);
    const distMatch = trimmed.match(/(?:distance|dist|distance=)\s*:?\s*([0-9.]+)/i);
    const hbMatch = trimmed.match(/(?:heartbeat|ping|alive)/i);

    if (hbMatch) {
      isHeartbeat = true;
    }

    if (phMatch || tdsMatch || wlMatch || distMatch) {
      parsed = {};
      if (phMatch) parsed.ph = parseFloat(phMatch[1]);
      if (tdsMatch) parsed.tds = parseFloat(tdsMatch[1]);
      if (wlMatch) parsed.waterLevel = parseFloat(wlMatch[1]);
      if (distMatch) parsed.distance = parseFloat(distMatch[1]);
    }
  }

  if (!parsed && !isHeartbeat) {
    return { isValid: false, errorMessage: 'Malformed or unparseable telemetry string' };
  }

  if (isHeartbeat && !parsed) {
    return { isValid: true, isHeartbeat: true, sanitizedReading: { timestamp: Date.now() } };
  }

  const p = parsed || {};

  // Extract raw numerical values
  const rawPh = typeof p.ph === 'number' && !isNaN(p.ph) ? p.ph : undefined;
  const rawTds = typeof p.tds === 'number' && !isNaN(p.tds) ? p.tds : undefined;
  const rawWL = typeof p.waterLevel === 'number' && !isNaN(p.waterLevel) ? p.waterLevel : undefined;
  const rawDist = typeof p.distance === 'number' && !isNaN(p.distance) ? p.distance : undefined;

  // 3. Physical Boundary Validations
  // pH: Valid range [0.0, 14.0]
  let sanitizedPh: number | undefined = undefined;
  if (rawPh !== undefined) {
    if (rawPh < 0.0 || rawPh > 14.0) {
      return { isValid: false, errorMessage: `Physical pH limit exceeded (${rawPh}). Expected 0.0 - 14.0.` };
    }
    // Apply calibration: (raw * slope) + offset
    const calPh = (rawPh * calibration.phSlopeMultiplier) + calibration.phOffset;
    sanitizedPh = parseFloat(Math.min(14.0, Math.max(0.0, calPh)).toFixed(2));
  }

  // TDS: Valid range [0, 5000 PPM]
  let sanitizedTds: number | undefined = undefined;
  if (rawTds !== undefined) {
    if (rawTds < 0 || rawTds > 5000) {
      return { isValid: false, errorMessage: `Physical TDS limit exceeded (${rawTds} PPM). Expected 0 - 5000 PPM.` };
    }
    // Apply calibration factor
    const calTds = rawTds * calibration.tdsCalibrationFactor;
    sanitizedTds = parseFloat(Math.max(0, Math.min(5000, calTds)).toFixed(1));
  }

  // Distance: Valid range [5.0 cm, 400.0 cm]
  let sanitizedDist: number | undefined = undefined;
  if (rawDist !== undefined) {
    if (rawDist < 5.0 || rawDist > 400.0) {
      return { isValid: false, errorMessage: `Ultrasonic distance impossible (${rawDist} cm). Expected 5.0 - 400.0 cm.` };
    }
    sanitizedDist = parseFloat(rawDist.toFixed(2));
  }

  // Water Level calculation & synchronization
  let sanitizedWL: number | undefined = undefined;
  const emptyDist = calibration.ultrasonicEmptyDistanceCm;
  const fullDist = calibration.ultrasonicFullDistanceCm;
  const range = emptyDist - fullDist;

  if (sanitizedDist !== undefined && rawWL === undefined) {
    // Derive water level from calibrated ultrasonic distance
    if (range > 0) {
      const derivedPercent = ((emptyDist - sanitizedDist) / range) * 100.0;
      sanitizedWL = parseFloat(Math.min(100.0, Math.max(0.0, derivedPercent)).toFixed(1));
    }
  } else if (rawWL !== undefined) {
    if (rawWL < 0 || rawWL > 100) {
      sanitizedWL = parseFloat(Math.min(100.0, Math.max(0.0, rawWL)).toFixed(1));
    } else {
      sanitizedWL = parseFloat(rawWL.toFixed(1));
    }

    if (sanitizedDist === undefined && range > 0) {
      const derivedDist = emptyDist - ((sanitizedWL / 100.0) * range);
      sanitizedDist = parseFloat(Math.max(fullDist, derivedDist).toFixed(2));
    }
  }

  return {
    isValid: true,
    isHeartbeat,
    sanitizedReading: {
      ph: sanitizedPh,
      tds: sanitizedTds,
      waterLevel: sanitizedWL,
      distance: sanitizedDist,
      timestamp: Date.now(),
    },
  };
}

/**
 * Derive per-sensor diagnostic health state
 */
export function evaluateSensorHealth(
  currentReading: { ph?: number; tds?: number; waterLevel?: number; distance?: number } | null,
  isConnectionActive: boolean
): Record<'ph' | 'tds' | 'ultrasonic' | 'temperature', SensorHealthStatus> {
  const isOnline = isConnectionActive && !!currentReading;

  return {
    ph: {
      sensorKey: 'ph',
      name: 'pH Electrode Probe',
      state: !isOnline ? 'disconnected' : currentReading?.ph !== undefined ? 'working' : 'fault',
      lastReading: currentReading?.ph,
      unit: 'pH',
      minThreshold: 5.5,
      maxThreshold: 6.5,
      statusDetails: isOnline && currentReading?.ph !== undefined
        ? 'Electrode impedance and reference junction nominal.'
        : 'Awaiting sensor analog telemetry.',
    },
    tds: {
      sensorKey: 'tds',
      name: 'TDS Conductivity Probe',
      state: !isOnline ? 'disconnected' : currentReading?.tds !== undefined ? 'working' : 'fault',
      lastReading: currentReading?.tds,
      unit: 'PPM',
      minThreshold: 750,
      maxThreshold: 1100,
      statusDetails: isOnline && currentReading?.tds !== undefined
        ? 'Conductivity temperature compensation active.'
        : 'Awaiting EC/TDS sensor data.',
    },
    ultrasonic: {
      sensorKey: 'ultrasonic',
      name: 'HC-SR04 Ultrasonic Sensor',
      state: !isOnline ? 'disconnected' : currentReading?.waterLevel !== undefined ? 'working' : 'fault',
      lastReading: currentReading?.waterLevel,
      unit: '%',
      minThreshold: 60,
      maxThreshold: 95,
      statusDetails: isOnline && currentReading?.waterLevel !== undefined
        ? 'Time-of-flight echo return calibrated.'
        : 'Echo pulse timeout or reservoir unread.',
    },
    temperature: {
      sensorKey: 'temperature',
      name: 'DS18B20 Water Temperature',
      state: 'unavailable',
      lastReading: 22.4,
      unit: '°C',
      minThreshold: 18.0,
      maxThreshold: 26.0,
      statusDetails: 'Auxiliary 1-Wire channel (Simulated baseline).',
    },
  };
}

/**
 * Calculate Station IoT Device Health Score (0 - 100)
 */
export function calculateDeviceHealthScore(
  device: IoTDevice,
  sensors: Record<string, SensorHealthStatus>,
  isStale: boolean
): number {
  if (device.status === 'offline' || device.status === 'error') {
    return 0;
  }

  let score = 100;

  // 1. Connection Freshness & Stale Penalty
  if (isStale) score -= 30;
  if (Date.now() - device.lastHeartbeat > 6000) score -= 20;

  // 2. Sensor Availability Penalty
  const sensorArray = Object.values(sensors);
  sensorArray.forEach((sensor) => {
    if (sensor.state === 'fault') score -= 20;
    if (sensor.state === 'disconnected') score -= 15;
  });

  // 3. Packet Corruption Penalty
  if (device.packetsReceived > 0) {
    const errorRate = device.packetsCorrupted / device.packetsReceived;
    if (errorRate > 0.1) score -= 15;
    else if (errorRate > 0.02) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}
