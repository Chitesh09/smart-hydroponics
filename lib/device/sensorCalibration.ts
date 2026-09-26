// ============================================================
// HydroSmart — Sensor Calibration & Data Quality Domain Engine
// Phase 11: Production-grade Sensor Calibration & Mathematical Transforms
// Strictly Empirical: Zero Fabricated Values & Transparent Hardware Boundaries
// ============================================================

export type CalibrationStatus =
  | 'NOT_CALIBRATED'
  | 'CALIBRATED'
  | 'CALIBRATION_REQUIRED'
  | 'CALIBRATION_INVALID';

export type SensorQualityStatus =
  | 'VALID'
  | 'UNCALIBRATED'
  | 'STALE'
  | 'NOISY'
  | 'OUT_OF_RANGE'
  | 'DISCONNECTED'
  | 'INVALID';

export type SensorDataSource = 'esp32_serial' | 'simulated' | 'manual_test';

export interface CalibrationPoint {
  raw: number;
  reference: number;
}

// ------------------------------------------------------------
// 1. pH Calibration Model & Interfaces
// ------------------------------------------------------------
export type PhCalibrationMethod = 'two_point' | 'single_point' | 'factory_default';

export interface PhCalibrationConfig {
  status: CalibrationStatus;
  method: PhCalibrationMethod;
  slope: number;        // Multiplier: converts raw/voltage slope to calibrated pH units
  offset: number;       // Intercept: shifts calibrated pH
  point1?: CalibrationPoint; // e.g. Buffer 4.01 or 7.00
  point2?: CalibrationPoint; // e.g. Buffer 7.00 or 10.01
  lastCalibratedAt?: number;
  version: number;
  invalidationReason?: string;
}

export const DEFAULT_PH_CALIBRATION: PhCalibrationConfig = {
  status: 'NOT_CALIBRATED',
  method: 'factory_default',
  slope: 1.0,
  offset: 0.0,
  version: 1,
};

// ------------------------------------------------------------
// 2. TDS Calibration Model & Interfaces
// ------------------------------------------------------------
export type TdsCalibrationMethod = 'reference_solution' | 'two_point' | 'factory_default';

export interface TdsCalibrationConfig {
  status: CalibrationStatus;
  method: TdsCalibrationMethod;
  factor: number;       // Linear scaling factor (referenceTds / rawTds)
  referenceValue?: number; // e.g. 500, 1000 PPM or 1413 µS/cm equivalent
  measuredRaw?: number;
  temperatureCompensation: 'unavailable'; // Explicit physical constraint: NO DS18B20 installed
  temperatureNotice: string;
  lastCalibratedAt?: number;
  version: number;
  invalidationReason?: string;
}

export const DEFAULT_TDS_CALIBRATION: TdsCalibrationConfig = {
  status: 'NOT_CALIBRATED',
  method: 'factory_default',
  factor: 1.0,
  temperatureCompensation: 'unavailable',
  temperatureNotice: 'No physical DS18B20 temperature sensor installed. Evaluated at standard uncompensated 25°C baseline.',
  version: 1,
};

// ------------------------------------------------------------
// 3. Ultrasonic Distance & Water Level Calibration Model
// ------------------------------------------------------------
export interface UltrasonicCalibrationConfig {
  status: CalibrationStatus;
  fullDistanceCm: number;       // Distance (cm) when reservoir is 100% full (default ~13.0 cm)
  emptyDistanceCm: number;      // Distance (cm) when reservoir is 0% empty (default ~60.0 cm)
  minValidDistanceCm: number;   // HC-SR04 physical blind zone (~5.0 cm)
  maxValidDistanceCm: number;   // Maximum reservoir boundary (~120.0 cm)
  lastCalibratedAt?: number;
  version: number;
  invalidationReason?: string;
}

export const DEFAULT_ULTRASONIC_CALIBRATION: UltrasonicCalibrationConfig = {
  status: 'NOT_CALIBRATED',
  fullDistanceCm: 13.0,
  emptyDistanceCm: 60.0,
  minValidDistanceCm: 5.0,
  maxValidDistanceCm: 120.0,
  version: 1,
};

// ------------------------------------------------------------
// 4. Comprehensive Sensor Calibration Config
// ------------------------------------------------------------
export interface SensorCalibrationProfile {
  ph: PhCalibrationConfig;
  tds: TdsCalibrationConfig;
  ultrasonic: UltrasonicCalibrationConfig;
  heartbeatTimeoutMs: number;
  updatedAt: number;
}

export const DEFAULT_SENSOR_CALIBRATION_PROFILE: SensorCalibrationProfile = {
  ph: DEFAULT_PH_CALIBRATION,
  tds: DEFAULT_TDS_CALIBRATION,
  ultrasonic: DEFAULT_ULTRASONIC_CALIBRATION,
  heartbeatTimeoutMs: 5000,
  updatedAt: Date.now(),
};

export const SENSOR_CALIBRATION_STORAGE_KEY = 'hydrosmart_sensor_calibration_v2';
export const LEGACY_CALIBRATION_STORAGE_KEY = 'hydrosmart_device_calibration_v1';

// ------------------------------------------------------------
// 5. Mathematical Calibration & Validation Routines
// ------------------------------------------------------------

/**
 * Perform 2-Point Linear pH Calibration
 * Slope m = (ref2 - ref1) / (raw2 - raw1)
 * Offset b = ref1 - m * raw1
 */
export function calibratePhTwoPoint(
  point1: CalibrationPoint,
  point2: CalibrationPoint
): { slope: number; offset: number; status: CalibrationStatus; error?: string } {
  // Validate points exist and are finite
  if (
    !Number.isFinite(point1.raw) ||
    !Number.isFinite(point1.reference) ||
    !Number.isFinite(point2.raw) ||
    !Number.isFinite(point2.reference)
  ) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: 'Calibration points contain NaN or non-finite numbers.',
    };
  }

  // Validate reference pH buffer values are in realistic electrochemical range [0.0, 14.0]
  if (
    point1.reference < 0.0 || point1.reference > 14.0 ||
    point2.reference < 0.0 || point2.reference > 14.0
  ) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: 'Reference pH buffers must be between 0.0 and 14.0.',
    };
  }

  // Ensure buffers are distinct (at least 1.0 pH unit apart)
  if (Math.abs(point2.reference - point1.reference) < 1.0) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: 'Reference buffers must differ by at least 1.0 pH unit.',
    };
  }

  // Ensure raw readings are distinct to prevent division by zero
  const rawDelta = point2.raw - point1.raw;
  if (Math.abs(rawDelta) < 0.05) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: 'Raw sensor readings for both points are too close together or identical.',
    };
  }

  const slope = (point2.reference - point1.reference) / rawDelta;
  const offset = point1.reference - slope * point1.raw;

  // Validate slope polarity and electrochemical sanity:
  // In normal analog pH probes, raw voltage/reading increases or decreases with pH.
  // Extreme slope indicates degraded electrode or wrong buffer sequence.
  if (slope <= 0) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: 'Computed pH slope is non-positive. Probe response is inverted.',
    };
  }

  if (slope < 0.4 || slope > 2.5) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: `Computed pH slope (${slope.toFixed(3)}) is outside nominal physical envelope (0.4 - 2.5). Electrode may be fouled.`,
    };
  }

  return {
    slope: parseFloat(slope.toFixed(4)),
    offset: parseFloat(offset.toFixed(4)),
    status: 'CALIBRATED',
  };
}

/**
 * Perform Single-Point pH Offset Calibration
 * Offset b = ref - raw (slope remains 1.0)
 */
export function calibratePhSinglePoint(
  point: CalibrationPoint
): { slope: number; offset: number; status: CalibrationStatus; error?: string } {
  if (!Number.isFinite(point.raw) || !Number.isFinite(point.reference)) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: 'Calibration point contains non-finite numbers.',
    };
  }

  if (point.reference < 0.0 || point.reference > 14.0) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: 'Reference pH buffer must be between 0.0 and 14.0.',
    };
  }

  const offset = point.reference - point.raw;

  if (Math.abs(offset) > 4.0) {
    return {
      slope: 1.0,
      offset: 0.0,
      status: 'CALIBRATION_INVALID',
      error: `Excessive single-point pH offset (${offset.toFixed(2)}). Max allowable deviation is ±4.0 pH units.`,
    };
  }

  return {
    slope: 1.0,
    offset: parseFloat(offset.toFixed(4)),
    status: 'CALIBRATED',
  };
}

/**
 * Apply pH Calibration to raw value and assess sensor quality
 */
export function applyPhCalibration(
  rawPh: number,
  config: PhCalibrationConfig
): { calibratedPh: number; quality: SensorQualityStatus } {
  if (!Number.isFinite(rawPh) || isNaN(rawPh)) {
    return { calibratedPh: 0, quality: 'INVALID' };
  }

  if (rawPh < 0.0 || rawPh > 14.0) {
    return { calibratedPh: rawPh, quality: 'OUT_OF_RANGE' };
  }

  const cal = rawPh * config.slope + config.offset;
  const clamped = Math.max(0.0, Math.min(14.0, parseFloat(cal.toFixed(2))));

  let quality: SensorQualityStatus = 'VALID';
  if (config.status === 'NOT_CALIBRATED') {
    quality = 'UNCALIBRATED';
  } else if (config.status === 'CALIBRATION_INVALID') {
    quality = 'INVALID';
  } else if (config.status === 'CALIBRATION_REQUIRED') {
    quality = 'UNCALIBRATED';
  }

  return { calibratedPh: clamped, quality };
}

/**
 * Calibrate TDS against certified reference standard solution (e.g. 500, 1000 PPM or 1413 µS/cm)
 * factor = referenceTds / rawTds
 */
export function calibrateTdsReference(
  rawTds: number,
  referenceTds: number
): { factor: number; status: CalibrationStatus; error?: string } {
  if (!Number.isFinite(rawTds) || !Number.isFinite(referenceTds)) {
    return {
      factor: 1.0,
      status: 'CALIBRATION_INVALID',
      error: 'TDS calibration values contain non-finite numbers.',
    };
  }

  if (referenceTds <= 0 || referenceTds > 5000) {
    return {
      factor: 1.0,
      status: 'CALIBRATION_INVALID',
      error: 'Reference TDS solution must be between 1 and 5000 PPM.',
    };
  }

  if (rawTds < 10) {
    return {
      factor: 1.0,
      status: 'CALIBRATION_INVALID',
      error: 'Raw TDS reading is too low (<10 PPM). Cannot calibrate in dry air or pure DI water.',
    };
  }

  const factor = referenceTds / rawTds;

  // Ensure factor is within reasonable physical gain range
  if (factor < 0.2 || factor > 5.0) {
    return {
      factor: 1.0,
      status: 'CALIBRATION_INVALID',
      error: `Calculated TDS calibration factor (${factor.toFixed(2)}) is outside safe bounds (0.20 - 5.00). Check sensor probe.`,
    };
  }

  return {
    factor: parseFloat(factor.toFixed(4)),
    status: 'CALIBRATED',
  };
}

/**
 * Apply TDS Calibration to raw value and assess sensor quality
 */
export function applyTdsCalibration(
  rawTds: number,
  config: TdsCalibrationConfig
): { calibratedTds: number; quality: SensorQualityStatus } {
  if (!Number.isFinite(rawTds) || isNaN(rawTds)) {
    return { calibratedTds: 0, quality: 'INVALID' };
  }

  if (rawTds < 0 || rawTds > 5000) {
    return { calibratedTds: rawTds, quality: 'OUT_OF_RANGE' };
  }

  const cal = rawTds * config.factor;
  const clamped = Math.max(0, Math.min(5000, parseFloat(cal.toFixed(1))));

  let quality: SensorQualityStatus = 'VALID';
  if (config.status === 'NOT_CALIBRATED') {
    quality = 'UNCALIBRATED';
  } else if (config.status === 'CALIBRATION_INVALID') {
    quality = 'INVALID';
  } else if (config.status === 'CALIBRATION_REQUIRED') {
    quality = 'UNCALIBRATED';
  }

  return { calibratedTds: clamped, quality };
}

/**
 * Calibrate Ultrasonic Reservoir Dimensions
 */
export function calibrateUltrasonic(
  fullDistanceCm: number,
  emptyDistanceCm: number,
  minValidDistanceCm: number = 5.0,
  maxValidDistanceCm: number = 120.0
): { status: CalibrationStatus; error?: string } {
  if (
    !Number.isFinite(fullDistanceCm) ||
    !Number.isFinite(emptyDistanceCm) ||
    !Number.isFinite(minValidDistanceCm) ||
    !Number.isFinite(maxValidDistanceCm)
  ) {
    return {
      status: 'CALIBRATION_INVALID',
      error: 'Ultrasonic calibration distances contain non-finite numbers.',
    };
  }

  if (fullDistanceCm < minValidDistanceCm) {
    return {
      status: 'CALIBRATION_INVALID',
      error: `Full distance (${fullDistanceCm} cm) is inside the sensor blind zone (<${minValidDistanceCm} cm).`,
    };
  }

  if (emptyDistanceCm > maxValidDistanceCm) {
    return {
      status: 'CALIBRATION_INVALID',
      error: `Empty distance (${emptyDistanceCm} cm) exceeds maximum valid sensor range (${maxValidDistanceCm} cm).`,
    };
  }

  if (emptyDistanceCm <= fullDistanceCm) {
    return {
      status: 'CALIBRATION_INVALID',
      error: `Empty distance (${emptyDistanceCm} cm) must be strictly greater than full distance (${fullDistanceCm} cm).`,
    };
  }

  if (emptyDistanceCm - fullDistanceCm < 5.0) {
    return {
      status: 'CALIBRATION_INVALID',
      error: 'Reservoir operating depth (empty - full) must be at least 5.0 cm for reliable telemetry.',
    };
  }

  return { status: 'CALIBRATED' };
}

/**
 * Apply Ultrasonic Distance & Calculate Water Level Percentage (0–100%)
 */
export function applyUltrasonicDistanceAndWaterLevel(
  rawDistanceCm: number,
  config: UltrasonicCalibrationConfig
): {
  distanceCm: number;
  waterLevelPercent: number;
  quality: SensorQualityStatus;
} {
  if (!Number.isFinite(rawDistanceCm) || isNaN(rawDistanceCm)) {
    return { distanceCm: 0, waterLevelPercent: 0, quality: 'INVALID' };
  }

  // Physical envelope check
  if (rawDistanceCm < config.minValidDistanceCm || rawDistanceCm > config.maxValidDistanceCm) {
    return {
      distanceCm: parseFloat(rawDistanceCm.toFixed(2)),
      waterLevelPercent: 0,
      quality: 'OUT_OF_RANGE',
    };
  }

  const range = config.emptyDistanceCm - config.fullDistanceCm;
  let derivedPercent = 0;

  if (range > 0) {
    const rawRatio = (config.emptyDistanceCm - rawDistanceCm) / range;
    derivedPercent = rawRatio * 100.0;
  }

  // Strictly clamp between 0% and 100%
  const clampedPercent = Math.max(0.0, Math.min(100.0, parseFloat(derivedPercent.toFixed(1))));
  const formattedDist = parseFloat(rawDistanceCm.toFixed(2));

  let quality: SensorQualityStatus = 'VALID';
  if (config.status === 'NOT_CALIBRATED') {
    quality = 'UNCALIBRATED';
  } else if (config.status === 'CALIBRATION_INVALID') {
    quality = 'INVALID';
  }

  return {
    distanceCm: formattedDist,
    waterLevelPercent: clampedPercent,
    quality,
  };
}

// ------------------------------------------------------------
// 6. Noise Filtering & Rolling Window Analysis
// ------------------------------------------------------------

/**
 * Lightweight moving median filter for rolling sensor samples
 */
export function applyMovingMedianFilter(buffer: number[]): number {
  if (!buffer || buffer.length === 0) return 0;
  if (buffer.length === 1) return buffer[0];

  const sorted = [...buffer].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;

  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return parseFloat(((sorted[mid - 1] + sorted[mid]) / 2.0).toFixed(2));
}

/**
 * Detect transient electrical or acoustic sensor noise via standard deviation
 */
export function detectSensorNoise(buffer: number[], thresholdStdDev: number): boolean {
  if (!buffer || buffer.length < 3) return false;
  const valid = buffer.filter((n) => Number.isFinite(n));
  if (valid.length < 3) return false;

  const mean = valid.reduce((acc, v) => acc + v, 0) / valid.length;
  const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / valid.length;
  const stdDev = Math.sqrt(variance);

  return stdDev > thresholdStdDev;
}

// ------------------------------------------------------------
// 7. Persistence & Migration Engine
// ------------------------------------------------------------

/**
 * Load sensor calibration profile from localStorage with backward-compatible migration
 */
export function loadSensorCalibrationProfile(): SensorCalibrationProfile {
  if (typeof window === 'undefined') {
    return DEFAULT_SENSOR_CALIBRATION_PROFILE;
  }

  try {
    // 1. Try modern Phase 11 profile
    const saved = localStorage.getItem(SENSOR_CALIBRATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ph: { ...DEFAULT_PH_CALIBRATION, ...parsed.ph },
        tds: {
          ...DEFAULT_TDS_CALIBRATION,
          ...parsed.tds,
          temperatureCompensation: 'unavailable',
          temperatureNotice: DEFAULT_TDS_CALIBRATION.temperatureNotice,
        },
        ultrasonic: { ...DEFAULT_ULTRASONIC_CALIBRATION, ...parsed.ultrasonic },
        heartbeatTimeoutMs: parsed.heartbeatTimeoutMs || 5000,
        updatedAt: parsed.updatedAt || Date.now(),
      };
    }

    // 2. Migration fallback from legacy v1 config
    const legacy = localStorage.getItem(LEGACY_CALIBRATION_STORAGE_KEY);
    if (legacy) {
      const p = JSON.parse(legacy);
      const migrated: SensorCalibrationProfile = {
        ph: {
          ...DEFAULT_PH_CALIBRATION,
          offset: typeof p.phOffset === 'number' ? p.phOffset : 0.0,
          slope: typeof p.phSlopeMultiplier === 'number' ? p.phSlopeMultiplier : 1.0,
          status: p.phOffset !== 0.0 || p.phSlopeMultiplier !== 1.0 ? 'CALIBRATED' : 'NOT_CALIBRATED',
        },
        tds: {
          ...DEFAULT_TDS_CALIBRATION,
          factor: typeof p.tdsCalibrationFactor === 'number' ? p.tdsCalibrationFactor : 1.0,
          status: p.tdsCalibrationFactor !== 1.0 ? 'CALIBRATED' : 'NOT_CALIBRATED',
          temperatureCompensation: 'unavailable',
        },
        ultrasonic: {
          ...DEFAULT_ULTRASONIC_CALIBRATION,
          emptyDistanceCm: typeof p.ultrasonicEmptyDistanceCm === 'number' ? p.ultrasonicEmptyDistanceCm : 60.0,
          fullDistanceCm: typeof p.ultrasonicFullDistanceCm === 'number' ? p.ultrasonicFullDistanceCm : 13.0,
          status: p.ultrasonicEmptyDistanceCm !== 60.0 || p.ultrasonicFullDistanceCm !== 13.0 ? 'CALIBRATED' : 'NOT_CALIBRATED',
        },
        heartbeatTimeoutMs: p.heartbeatTimeoutMs || 5000,
        updatedAt: Date.now(),
      };
      saveSensorCalibrationProfile(migrated);
      return migrated;
    }
  } catch (err) {
    console.warn('[SensorCalibration] Error loading calibration from storage:', err);
  }

  return DEFAULT_SENSOR_CALIBRATION_PROFILE;
}

/**
 * Save sensor calibration profile to localStorage
 */
export function saveSensorCalibrationProfile(profile: SensorCalibrationProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SENSOR_CALIBRATION_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('[SensorCalibration] Failed to persist calibration profile:', err);
  }
}
