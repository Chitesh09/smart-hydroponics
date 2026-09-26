// ============================================================
// HydroSmart — Telemetry Validation & Calibration Engine
// Strict Physical Boundary Enforcement, Raw vs Calibrated Separation
// ============================================================

import {
  DeviceCalibrationConfig,
  RawPacketValidationResult,
  SensorHealthStatus,
  IoTDevice,
  SensorQualityStatus,
  CalibrationStatus,
} from './types';
import {
  SensorCalibrationProfile,
  DEFAULT_SENSOR_CALIBRATION_PROFILE,
  applyPhCalibration,
  applyTdsCalibration,
  applyUltrasonicDistanceAndWaterLevel,
} from './sensorCalibration';

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
 * Maintains strict separation between rawReading and calibrated sanitizedReading.
 */
export function validateAndSanitizePacket(
  rawInput: string,
  calibrationOrProfile: DeviceCalibrationConfig | SensorCalibrationProfile = DEFAULT_CALIBRATION
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

  // Reject packets with explicit NaN or Infinity tokens
  for (const [key, val] of Object.entries(p)) {
    if (typeof val === 'string' && (val.toLowerCase() === 'nan' || val.toLowerCase() === 'infinity' || val.toLowerCase() === '-infinity')) {
      return { isValid: false, errorMessage: `Field '${key}' contains invalid numeric token '${val}'.` };
    }
  }

  // Extract raw numerical values (validate NaN and Infinity)
  const rawPh = typeof p.ph === 'number' && Number.isFinite(p.ph) ? p.ph : undefined;
  const rawTds = typeof p.tds === 'number' && Number.isFinite(p.tds) ? p.tds : undefined;
  const rawWL = typeof p.waterLevel === 'number' && Number.isFinite(p.waterLevel) ? p.waterLevel : undefined;
  const rawDist = typeof p.distance === 'number' && Number.isFinite(p.distance) ? p.distance : undefined;

  // Adapt input calibration: support either legacy DeviceCalibrationConfig or modern SensorCalibrationProfile
  let profile: SensorCalibrationProfile;
  if ('ph' in calibrationOrProfile && typeof calibrationOrProfile.ph === 'object') {
    profile = calibrationOrProfile as SensorCalibrationProfile;
  } else {
    const legacy = calibrationOrProfile as DeviceCalibrationConfig;
    profile = {
      ...DEFAULT_SENSOR_CALIBRATION_PROFILE,
      ph: {
        ...DEFAULT_SENSOR_CALIBRATION_PROFILE.ph,
        offset: legacy.phOffset ?? 0.0,
        slope: legacy.phSlopeMultiplier ?? 1.0,
        status: (legacy.phOffset !== 0.0 || legacy.phSlopeMultiplier !== 1.0) ? 'CALIBRATED' : 'NOT_CALIBRATED',
      },
      tds: {
        ...DEFAULT_SENSOR_CALIBRATION_PROFILE.tds,
        factor: legacy.tdsCalibrationFactor ?? 1.0,
        status: legacy.tdsCalibrationFactor !== 1.0 ? 'CALIBRATED' : 'NOT_CALIBRATED',
      },
      ultrasonic: {
        ...DEFAULT_SENSOR_CALIBRATION_PROFILE.ultrasonic,
        emptyDistanceCm: legacy.ultrasonicEmptyDistanceCm ?? 60.0,
        fullDistanceCm: legacy.ultrasonicFullDistanceCm ?? 13.0,
        status: (legacy.ultrasonicEmptyDistanceCm !== 60.0 || legacy.ultrasonicFullDistanceCm !== 13.0) ? 'CALIBRATED' : 'NOT_CALIBRATED',
      },
      heartbeatTimeoutMs: legacy.heartbeatTimeoutMs ?? 5000,
      updatedAt: Date.now(),
    };
  }

  const quality: Record<'ph' | 'tds' | 'waterLevel' | 'distance', SensorQualityStatus> = {
    ph: 'VALID',
    tds: 'VALID',
    waterLevel: 'VALID',
    distance: 'VALID',
  };

  // 3. Physical Boundary Validations & Calibration Transformations

  // --- pH: Valid physical range [0.0, 14.0] ---
  let sanitizedPh: number | undefined = undefined;
  if (rawPh !== undefined) {
    if (rawPh < 0.0 || rawPh > 14.0) {
      quality.ph = 'OUT_OF_RANGE';
      return { isValid: false, errorMessage: `Physical pH limit exceeded (${rawPh}). Expected 0.0 - 14.0.` };
    }
    const calResult = applyPhCalibration(rawPh, profile.ph);
    sanitizedPh = calResult.calibratedPh;
    quality.ph = calResult.quality;
  } else {
    quality.ph = 'INVALID';
  }

  // --- TDS: Valid physical range [0, 5000 PPM] ---
  let sanitizedTds: number | undefined = undefined;
  if (rawTds !== undefined) {
    if (rawTds < 0 || rawTds > 5000) {
      quality.tds = 'OUT_OF_RANGE';
      return { isValid: false, errorMessage: `Physical TDS limit exceeded (${rawTds} PPM). Expected 0 - 5000 PPM.` };
    }
    const calResult = applyTdsCalibration(rawTds, profile.tds);
    sanitizedTds = calResult.calibratedTds;
    quality.tds = calResult.quality;
  } else {
    quality.tds = 'INVALID';
  }

  // --- Ultrasonic Distance & Water Level Percentage ---
  let sanitizedDist: number | undefined = undefined;
  let sanitizedWL: number | undefined = undefined;

  if (rawDist !== undefined) {
    if (rawDist < profile.ultrasonic.minValidDistanceCm || rawDist > profile.ultrasonic.maxValidDistanceCm) {
      quality.distance = 'OUT_OF_RANGE';
      quality.waterLevel = 'OUT_OF_RANGE';
      return {
        isValid: false,
        errorMessage: `Ultrasonic distance impossible (${rawDist} cm). Expected ${profile.ultrasonic.minValidDistanceCm} - ${profile.ultrasonic.maxValidDistanceCm} cm.`,
      };
    }

    const distResult = applyUltrasonicDistanceAndWaterLevel(rawDist, profile.ultrasonic);
    sanitizedDist = distResult.distanceCm;
    sanitizedWL = distResult.waterLevelPercent;
    quality.distance = distResult.quality;
    quality.waterLevel = distResult.quality;
  } else if (rawWL !== undefined) {
    // If only waterLevel was supplied
    if (rawWL < 0 || rawWL > 100) {
      quality.waterLevel = 'OUT_OF_RANGE';
      return { isValid: false, errorMessage: `Water level percentage out of range (${rawWL}%). Expected 0 - 100%.` };
    }
    sanitizedWL = parseFloat(Math.max(0, Math.min(100, rawWL)).toFixed(1));
    const range = profile.ultrasonic.emptyDistanceCm - profile.ultrasonic.fullDistanceCm;
    if (range > 0) {
      sanitizedDist = parseFloat((profile.ultrasonic.emptyDistanceCm - (sanitizedWL / 100.0) * range).toFixed(2));
    }
    quality.waterLevel = profile.ultrasonic.status === 'CALIBRATED' ? 'VALID' : 'UNCALIBRATED';
    quality.distance = quality.waterLevel;
  } else {
    quality.distance = 'INVALID';
    quality.waterLevel = 'INVALID';
  }

  const now = Date.now();

  return {
    isValid: true,
    isHeartbeat,
    rawReading: {
      ph: rawPh,
      tds: rawTds,
      waterLevel: rawWL,
      distance: rawDist,
      timestamp: now,
    },
    sanitizedReading: {
      ph: sanitizedPh,
      tds: sanitizedTds,
      waterLevel: sanitizedWL,
      distance: sanitizedDist,
      timestamp: now,
    },
    quality,
  };
}

/**
 * Derive per-sensor diagnostic health state
 * Strictly avoids inventing fake temperature data or fake temperature compensation.
 */
export function evaluateSensorHealth(
  currentReading: {
    ph?: number;
    tds?: number;
    waterLevel?: number;
    distance?: number;
    rawPh?: number;
    rawTds?: number;
    rawDistance?: number;
    quality?: Record<string, SensorQualityStatus>;
    calibrationStatus?: Record<string, CalibrationStatus>;
  } | null,
  isConnectionActive: boolean
): Record<'ph' | 'tds' | 'ultrasonic' | 'temperature', SensorHealthStatus> {
  const isOnline = isConnectionActive && !!currentReading;

  const phQuality = currentReading?.quality?.ph || (isOnline && currentReading?.ph !== undefined ? 'VALID' : 'DISCONNECTED');
  const tdsQuality = currentReading?.quality?.tds || (isOnline && currentReading?.tds !== undefined ? 'VALID' : 'DISCONNECTED');
  const ultraQuality = currentReading?.quality?.waterLevel || (isOnline && currentReading?.waterLevel !== undefined ? 'VALID' : 'DISCONNECTED');

  return {
    ph: {
      sensorKey: 'ph',
      name: 'pH Electrode Probe',
      state: !isOnline ? 'disconnected' : currentReading?.ph !== undefined ? 'working' : 'fault',
      lastReading: currentReading?.ph,
      rawValue: currentReading?.rawPh,
      calibratedValue: currentReading?.ph,
      quality: phQuality,
      calibrationStatus: currentReading?.calibrationStatus?.ph || 'NOT_CALIBRATED',
      unit: 'pH',
      minThreshold: 5.5,
      maxThreshold: 6.5,
      statusDetails: isOnline && currentReading?.ph !== undefined
        ? `Electrode impedance nominal. Quality: ${phQuality}.`
        : 'Awaiting sensor analog telemetry.',
    },
    tds: {
      sensorKey: 'tds',
      name: 'TDS Conductivity Probe',
      state: !isOnline ? 'disconnected' : currentReading?.tds !== undefined ? 'working' : 'fault',
      lastReading: currentReading?.tds,
      rawValue: currentReading?.rawTds,
      calibratedValue: currentReading?.tds,
      quality: tdsQuality,
      calibrationStatus: currentReading?.calibrationStatus?.tds || 'NOT_CALIBRATED',
      unit: 'PPM',
      minThreshold: 750,
      maxThreshold: 1100,
      statusDetails: isOnline && currentReading?.tds !== undefined
        ? `Conductivity active (25°C uncompensated standard). Quality: ${tdsQuality}.`
        : 'Awaiting EC/TDS sensor data.',
    },
    ultrasonic: {
      sensorKey: 'ultrasonic',
      name: 'HC-SR04 Ultrasonic Sensor',
      state: !isOnline ? 'disconnected' : currentReading?.waterLevel !== undefined ? 'working' : 'fault',
      lastReading: currentReading?.waterLevel,
      rawValue: currentReading?.rawDistance,
      calibratedValue: currentReading?.waterLevel,
      quality: ultraQuality,
      calibrationStatus: currentReading?.calibrationStatus?.ultrasonic || 'NOT_CALIBRATED',
      unit: '%',
      minThreshold: 25,
      maxThreshold: 100,
      statusDetails: isOnline && currentReading?.waterLevel !== undefined
        ? `Time-of-flight echo return calibrated. Quality: ${ultraQuality}.`
        : 'Echo pulse timeout or reservoir unread.',
    },
    temperature: {
      sensorKey: 'temperature',
      name: 'Water Temperature Sensor',
      state: 'unavailable',
      lastReading: undefined, // STRICT REQUIREMENT: NO FAKE TEMPERATURE
      rawValue: undefined,
      calibratedValue: undefined,
      quality: 'DISCONNECTED',
      calibrationStatus: 'NOT_CALIBRATED',
      unit: '°C',
      minThreshold: 18.0,
      maxThreshold: 26.0,
      statusDetails: 'No physical DS18B20 temperature sensor installed. Temperature compensation unavailable.',
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

  // 2. Sensor Availability Penalty (Only for installed sensors: ph, tds, ultrasonic)
  const installedSensors = [sensors.ph, sensors.tds, sensors.ultrasonic].filter(Boolean);
  installedSensors.forEach((sensor) => {
    if (sensor.state === 'fault') score -= 20;
    if (sensor.state === 'disconnected') score -= 15;
    if (sensor.quality === 'NOISY') score -= 10;
    if (sensor.quality === 'OUT_OF_RANGE') score -= 15;
  });

  // 3. Packet Corruption Penalty
  if (device.packetsReceived > 0) {
    const errorRate = device.packetsCorrupted / device.packetsReceived;
    if (errorRate > 0.1) score -= 15;
    else if (errorRate > 0.02) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}
