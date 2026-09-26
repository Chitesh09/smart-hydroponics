// ============================================================
// HydroSmart — Phase 11 Sensor Calibration & Data Quality Test Suite
// Exhaustive Verification of Mathematical Transforms, Quality States,
// Gated Evidence, Epistemic Honesty & Hardware Boundaries
// ============================================================

import {
  calibratePhTwoPoint,
  calibratePhSinglePoint,
  applyPhCalibration,
  calibrateTdsReference,
  applyTdsCalibration,
  calibrateUltrasonic,
  applyUltrasonicDistanceAndWaterLevel,
  applyMovingMedianFilter,
  detectSensorNoise,
  DEFAULT_SENSOR_CALIBRATION_PROFILE,
} from '../lib/device/sensorCalibration.ts';

import {
  validateAndSanitizePacket,
  evaluateSensorHealth,
  calculateDeviceHealthScore,
} from '../lib/device/telemetryValidator.ts';

import { normalizePlantEvidence } from '../lib/intelligence/evidenceNormalization.ts';
import { evaluatePlantAlerts } from '../lib/intelligence/alertEngine.ts';

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    passCount++;
    console.log(`  ✓ ${message}`);
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n============================================================');
console.log('HYDROSMART PHASE 11: SENSOR CALIBRATION & DATA QUALITY SUITE');
console.log('============================================================\n');

// ------------------------------------------------------------
// Test 1: pH 2-Point Linear Calibration
// ------------------------------------------------------------
console.log('Test 1: pH 2-Point Linear Calibration');
{
  const p1 = { raw: 4.20, reference: 4.01 };
  const p2 = { raw: 7.15, reference: 7.00 };
  const result = calibratePhTwoPoint(p1, p2);

  assert(result.status === 'CALIBRATED', 'Status is CALIBRATED for valid 2-point inputs');
  assert(Math.abs(result.slope - 1.0136) < 0.001, `Calculated slope is accurate (~1.0136, got ${result.slope})`);
  assert(Math.abs(result.offset - (-0.2471)) < 0.001, `Calculated offset is accurate (~-0.2471, got ${result.offset})`);

  const config = {
    ...DEFAULT_SENSOR_CALIBRATION_PROFILE.ph,
    status: result.status,
    slope: result.slope,
    offset: result.offset,
  };

  const cal1 = applyPhCalibration(4.20, config);
  assert(Math.abs(cal1.calibratedPh - 4.01) < 0.02, `Applying calibration to raw 4.20 yields ~4.01 pH (got ${cal1.calibratedPh})`);
  assert(cal1.quality === 'VALID', 'Calibrated reading has VALID quality status');

  const cal2 = applyPhCalibration(7.15, config);
  assert(Math.abs(cal2.calibratedPh - 7.00) < 0.02, `Applying calibration to raw 7.15 yields ~7.00 pH (got ${cal2.calibratedPh})`);
}

// ------------------------------------------------------------
// Test 2: pH Single-Point Offset Calibration
// ------------------------------------------------------------
console.log('\nTest 2: pH Single-Point Offset Calibration');
{
  const p = { raw: 7.25, reference: 7.00 };
  const result = calibratePhSinglePoint(p);

  assert(result.status === 'CALIBRATED', 'Single-point calibration status is CALIBRATED');
  assert(result.slope === 1.0, 'Single-point maintains unit slope (1.0)');
  assert(result.offset === -0.25, `Offset is exactly -0.25 (got ${result.offset})`);

  const config = {
    ...DEFAULT_SENSOR_CALIBRATION_PROFILE.ph,
    status: result.status,
    slope: result.slope,
    offset: result.offset,
  };

  const cal = applyPhCalibration(6.25, config);
  assert(cal.calibratedPh === 6.00, `Raw 6.25 with -0.25 offset yields exactly 6.00 (got ${cal.calibratedPh})`);
}

// ------------------------------------------------------------
// Test 3: pH Invalid Calibration Rejection
// ------------------------------------------------------------
console.log('\nTest 3: pH Invalid Calibration Rejection');
{
  // Identical raw readings (division by zero)
  const divZero = calibratePhTwoPoint({ raw: 7.0, reference: 4.01 }, { raw: 7.0, reference: 7.00 });
  assert(divZero.status === 'CALIBRATION_INVALID', 'Rejects identical raw readings (division by zero)');

  // Inverted slope (electrode inverted or wrong buffer order)
  const inverted = calibratePhTwoPoint({ raw: 7.0, reference: 4.01 }, { raw: 4.0, reference: 7.00 });
  assert(inverted.status === 'CALIBRATION_INVALID', 'Rejects non-positive slope (inverted response)');

  // Reference out of bounds [0, 14]
  const outOfBounds = calibratePhTwoPoint({ raw: 4.0, reference: -1.0 }, { raw: 7.0, reference: 7.00 });
  assert(outOfBounds.status === 'CALIBRATION_INVALID', 'Rejects negative reference buffer');

  // Extreme slope (> 2.5)
  const extremeSlope = calibratePhTwoPoint({ raw: 4.0, reference: 4.01 }, { raw: 4.5, reference: 7.00 });
  assert(extremeSlope.status === 'CALIBRATION_INVALID', 'Rejects extreme slope (> 2.5)');
}

// ------------------------------------------------------------
// Test 4: TDS Reference Solution Calibration
// ------------------------------------------------------------
console.log('\nTest 4: TDS Reference Solution Calibration');
{
  const rawTds = 950;
  const refTds = 1000;
  const result = calibrateTdsReference(rawTds, refTds);

  assert(result.status === 'CALIBRATED', 'TDS reference calibration status is CALIBRATED');
  assert(Math.abs(result.factor - 1.0526) < 0.001, `TDS scaling factor is accurate (~1.0526, got ${result.factor})`);

  const config = {
    ...DEFAULT_SENSOR_CALIBRATION_PROFILE.tds,
    status: result.status,
    factor: result.factor,
  };

  const cal = applyTdsCalibration(950, config);
  assert(Math.abs(cal.calibratedTds - 1000.0) < 0.5, `Calibrated TDS of 950 yields 1000 PPM (got ${cal.calibratedTds})`);
  assert(config.temperatureCompensation === 'unavailable', 'Strictly marks temperature compensation as unavailable');
}

// ------------------------------------------------------------
// Test 5: TDS Invalid Calibration Rejection
// ------------------------------------------------------------
console.log('\nTest 5: TDS Invalid Calibration Rejection');
{
  // Zero reference
  const zeroRef = calibrateTdsReference(950, 0);
  assert(zeroRef.status === 'CALIBRATION_INVALID', 'Rejects zero reference TDS');

  // Low raw TDS (< 10 PPM in dry air or pure DI water)
  const airCal = calibrateTdsReference(5, 1000);
  assert(airCal.status === 'CALIBRATION_INVALID', 'Rejects calibration in dry air/low reading (<10 PPM)');

  // Extreme factor (> 5.0)
  const extreme = calibrateTdsReference(150, 1000);
  assert(extreme.status === 'CALIBRATION_INVALID', 'Rejects extreme factor (> 5.0)');
}

// ------------------------------------------------------------
// Test 6: Ultrasonic Water Level Calculation & Percentage Clamping
// ------------------------------------------------------------
console.log('\nTest 6: Ultrasonic Water Level Calculation & Percentage Clamping');
{
  const config = {
    ...DEFAULT_SENSOR_CALIBRATION_PROFILE.ultrasonic,
    status: 'CALIBRATED',
    fullDistanceCm: 13.0,
    emptyDistanceCm: 60.0,
    minValidDistanceCm: 5.0,
    maxValidDistanceCm: 120.0,
  };

  // Full depth: 13.0 cm -> 100%
  const full = applyUltrasonicDistanceAndWaterLevel(13.0, config);
  assert(full.waterLevelPercent === 100.0, `13.0 cm yields 100% water level (got ${full.waterLevelPercent}%)`);

  // Empty depth: 60.0 cm -> 0%
  const empty = applyUltrasonicDistanceAndWaterLevel(60.0, config);
  assert(empty.waterLevelPercent === 0.0, `60.0 cm yields 0% water level (got ${empty.waterLevelPercent}%)`);

  // Mid-point: 36.5 cm -> 50%
  const half = applyUltrasonicDistanceAndWaterLevel(36.5, config);
  assert(half.waterLevelPercent === 50.0, `36.5 cm yields 50% water level (got ${half.waterLevelPercent}%)`);

  // Clamping over-full (10 cm)
  const overFull = applyUltrasonicDistanceAndWaterLevel(10.0, config);
  assert(overFull.waterLevelPercent === 100.0, `10.0 cm clamps to 100.0% (got ${overFull.waterLevelPercent}%)`);

  // Clamping over-empty (65 cm)
  const overEmpty = applyUltrasonicDistanceAndWaterLevel(65.0, config);
  assert(overEmpty.waterLevelPercent === 0.0, `65.0 cm clamps to 0.0% (got ${overEmpty.waterLevelPercent}%)`);
}

// ------------------------------------------------------------
// Test 7: Ultrasonic Invalid Distance Rejection
// ------------------------------------------------------------
console.log('\nTest 7: Ultrasonic Invalid Distance Rejection');
{
  // Empty <= Full
  const inverted = calibrateUltrasonic(60.0, 13.0);
  assert(inverted.status === 'CALIBRATION_INVALID', 'Rejects emptyDistance <= fullDistance');

  // Full within blind zone (< 5 cm)
  const blindZone = calibrateUltrasonic(3.0, 60.0, 5.0, 120.0);
  assert(blindZone.status === 'CALIBRATION_INVALID', 'Rejects fullDistance inside blind zone (< 5 cm)');

  // Depth range too shallow (< 5 cm)
  const shallow = calibrateUltrasonic(13.0, 16.0);
  assert(shallow.status === 'CALIBRATION_INVALID', 'Rejects reservoir depth < 5 cm');
}

// ------------------------------------------------------------
// Test 8: Raw vs Calibrated Separation in Telemetry Parsing
// ------------------------------------------------------------
console.log('\nTest 8: Raw vs Calibrated Separation in Telemetry Parsing');
{
  const rawPacket = JSON.stringify({
    waterLevel: 80,
    distance: 22.4,
    ph: 6.20,
    tds: 900.0,
  });

  const profile = {
    ...DEFAULT_SENSOR_CALIBRATION_PROFILE,
    ph: { ...DEFAULT_SENSOR_CALIBRATION_PROFILE.ph, status: 'CALIBRATED', slope: 1.0, offset: -0.20 },
    tds: { ...DEFAULT_SENSOR_CALIBRATION_PROFILE.tds, status: 'CALIBRATED', factor: 1.10 },
  };

  const validation = validateAndSanitizePacket(rawPacket, profile);
  assert(validation.isValid === true, 'Telemetry packet parsed successfully');
  assert(validation.rawReading.ph === 6.20, `Raw pH is preserved as 6.20 (got ${validation.rawReading.ph})`);
  assert(validation.sanitizedReading.ph === 6.00, `Calibrated pH is adjusted to 6.00 (got ${validation.sanitizedReading.ph})`);
  assert(validation.rawReading.tds === 900.0, `Raw TDS is preserved as 900.0 (got ${validation.rawReading.tds})`);
  assert(validation.sanitizedReading.tds === 990.0, `Calibrated TDS is scaled to 990.0 (got ${validation.sanitizedReading.tds})`);
}

// ------------------------------------------------------------
// Test 9: Sensor Quality State Transitions
// ------------------------------------------------------------
console.log('\nTest 9: Sensor Quality State Transitions');
{
  // Physical out of range pH (> 14)
  const badPh = validateAndSanitizePacket(JSON.stringify({ ph: 16.5, tds: 1000, distance: 20 }));
  assert(badPh.isValid === false, 'Rejects pH 16.5 as physical limit exceeded');

  // Physical out of range distance (< 5 cm)
  const badDist = validateAndSanitizePacket(JSON.stringify({ ph: 6.0, tds: 1000, distance: 2.1 }));
  assert(badDist.isValid === false, 'Rejects ultrasonic distance 2.1 cm (inside blind zone)');

  // Uncalibrated state
  const uncal = validateAndSanitizePacket(JSON.stringify({ ph: 6.0, tds: 1000, distance: 20 }), DEFAULT_SENSOR_CALIBRATION_PROFILE);
  assert(uncal.quality.ph === 'UNCALIBRATED', 'Uncalibrated sensor marked as UNCALIBRATED');
}

// ------------------------------------------------------------
// Test 10: Noise Filtering (Moving Median & Noise Detection)
// ------------------------------------------------------------
console.log('\nTest 10: Noise Filtering (Moving Median & Noise Detection)');
{
  const buffer = [6.00, 6.02, 6.85, 6.01, 5.99]; // 6.85 is transient electrical glitch
  const filtered = applyMovingMedianFilter(buffer);
  assert(filtered === 6.01, `Moving median filtered out transient spike 6.85 -> 6.01 (got ${filtered})`);

  const isNoisy = detectSensorNoise(buffer, 0.30);
  assert(isNoisy === true, 'Standard deviation detector flags spike window as noisy');

  const stableBuffer = [6.00, 6.01, 6.02, 6.00, 6.01];
  const isStable = detectSensorNoise(stableBuffer, 0.30);
  assert(isStable === false, 'Stable buffer is not flagged as noisy');
}

// ------------------------------------------------------------
// Test 11: Telemetry Validation with Malformed Serial Data
// ------------------------------------------------------------
console.log('\nTest 11: Telemetry Validation with Malformed Serial Data');
{
  const emptyRes = validateAndSanitizePacket('');
  assert(emptyRes.isValid === false, 'Empty packet rejected');

  const malformed = validateAndSanitizePacket('{ corrupt json stream...');
  assert(malformed.isValid === false, 'Malformed string rejected safely');

  const nanPacket = validateAndSanitizePacket('{"ph": "NaN", "tds": 1000}');
  assert(nanPacket.isValid === false, 'NaN string field rejected safely');
}

// ------------------------------------------------------------
// Test 12: Disconnected Telemetry & Absence of Fake Temperature
// ------------------------------------------------------------
console.log('\nTest 12: Disconnected Telemetry & Absence of Fake Temperature');
{
  const health = evaluateSensorHealth(null, false);
  assert(health.ph.state === 'disconnected', 'pH state is disconnected when offline');
  assert(health.temperature.state === 'unavailable', 'Temperature state is strictly unavailable');
  assert(health.temperature.lastReading === undefined, 'Temperature lastReading is strictly undefined (no fake 22.4°C)');
  assert(health.temperature.statusDetails.includes('unavailable'), 'Status details explains no DS18B20 installed');

  const offlineDevice = {
    deviceId: 'HS-ESP32-001',
    name: 'Hydroponic Station 1',
    firmwareVersion: 'v1.2.4-prod',
    status: 'offline',
    lastSeen: 0,
    lastHeartbeat: 0,
    stationAssignment: 'Bay 1',
    baudRate: 115200,
    healthScore: 92,
    packetsReceived: 0,
    packetsCorrupted: 0,
  };
  const offlineScore = calculateDeviceHealthScore(offlineDevice, health, true);
  assert(offlineScore === 0, 'Offline device health score drops to 0');
}

// ------------------------------------------------------------
// Test 13: Downstream Reasoning Gating of Invalid Telemetry
// ------------------------------------------------------------
console.log('\nTest 13: Downstream Reasoning Gating of Invalid Telemetry');
{
  // 13A: Invalid pH sensor evidence
  const invalidReading = {
    ph: 15.0,
    tds: 1000,
    waterLevel: 80,
    distance: 20,
    timestamp: Date.now(),
    quality: { ph: 'INVALID', tds: 'VALID', waterLevel: 'VALID', distance: 'VALID' },
  };

  const norm = normalizePlantEvidence({
    plantId: 'test_p1',
    detection: null,
    visualHealth: null,
    cropIdentity: null,
    sensorReading: invalidReading,
    cropTargetProfile: { name: 'Lettuce', phMin: 5.5, phMax: 6.5, tdsMin: 800, tdsMax: 1200 },
  });

  assert(norm.sensorEvidence.ph.availability === 'unavailable', 'Invalid pH is marked unavailable in normalized evidence');
  assert(norm.sensorEvidence.ph.current === undefined, 'Invalid pH value is excluded from active current measurement');
  assert(norm.evidenceList.find(e => e.label === 'Solution pH Telemetry') === undefined, 'Invalid pH is omitted from reasoning evidenceList');

  // 13B: Uncalibrated sensor evidence
  const uncalReading = {
    ph: 6.0,
    tds: 1000,
    waterLevel: 80,
    distance: 20,
    timestamp: Date.now(),
    quality: { ph: 'UNCALIBRATED', tds: 'VALID', waterLevel: 'VALID', distance: 'VALID' },
  };

  const normUncal = normalizePlantEvidence({
    plantId: 'test_p1',
    detection: null,
    visualHealth: null,
    cropIdentity: null,
    sensorReading: uncalReading,
    cropTargetProfile: { name: 'Lettuce', phMin: 5.5, phMax: 6.5, tdsMin: 800, tdsMax: 1200 },
  });

  const phEvidence = normUncal.evidenceList.find(e => e.label === 'Solution pH Telemetry');
  assert(phEvidence !== undefined, 'Uncalibrated pH is included in reasoning evidenceList');
  assert(phEvidence.confidence === 'moderate', 'Uncalibrated pH confidence is capped at moderate');
}

// ------------------------------------------------------------
// Test 14: Alert Engine Suppresses Biological Drift for Invalid Quality
// ------------------------------------------------------------
console.log('\nTest 14: Alert Engine Suppresses Biological Drift for Invalid Quality');
{
  const invalidTelemetry = {
    ph: 4.5, // Low pH that would normally trigger PH_ACIDIC
    tds: 1000,
    waterLevel: 80,
    distance: 20,
    timestamp: Date.now(),
    quality: { ph: 'OUT_OF_RANGE', tds: 'VALID', waterLevel: 'VALID', distance: 'VALID' },
  };

  const alertSummary = evaluatePlantAlerts({
    plantId: 'plant_1',
    observations: [],
    latestReading: invalidTelemetry,
    isTelemetryStale: false,
    cropProfile: { name: 'Lettuce', phMin: 5.5, phMax: 6.5, tdsMin: 800, tdsMax: 1200 },
  });

  const biologicalPhAlert = alertSummary.activeAlerts.find(a => a.category === 'PH');
  assert(biologicalPhAlert === undefined, 'Biological pH drift alert is suppressed when sensor quality is OUT_OF_RANGE');

  const dataQualityAlert = alertSummary.activeAlerts.find(a => a.category === 'DATA_QUALITY' && a.metric === 'ph');
  assert(dataQualityAlert !== undefined, 'DATA_QUALITY alert is generated for invalid pH sensor quality');
  assert(dataQualityAlert.title === 'pH Sensor Reading Invalid', 'Alert title reflects sensor reading invalid');
}

console.log('\n============================================================');
console.log(`TEST RESULTS: ${passCount} PASSED | ${failCount} FAILED`);
console.log('============================================================\n');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
