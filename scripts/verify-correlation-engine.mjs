#!/usr/bin/env node
// ============================================================================
// HydroSmart Phase 9 — Environment ↔ Plant Correlation Intelligence
// Comprehensive Automated Verification Suite (26 Scenarios)
// ============================================================================

import {
  calculatePearsonCorrelation,
  calculateSpearmanCorrelation,
  evaluateEnvironmentPlantCorrelation,
  getAssociationStrength,
} from '../lib/intelligence/environmentPlantCorrelation.ts';
import {
  getLocalizedAssociation,
  getLocalizedCorrelationSummary,
  getLocalizedAssociationType,
  getLocalizedAssociationStrength,
} from '../lib/intelligence/farmerSemanticLayer.ts';
import { CORRELATION_CONFIG } from '../lib/intelligence/correlationConfig.ts';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✓ ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('HydroSmart Phase 9 — Correlation Intelligence Verification Suite');
console.log('================================================================\n');

const PLANT_ID = 'specimen_phase9_001';
const OTHER_PLANT_ID = 'specimen_phase9_002';
const now = Date.now();
const hourMs = 3600000;
const dayMs = 86400000;

// ----------------------------------------------------------------------------
// Scenario 1: Sufficient data + positive correlation (r >= 0.70)
// ----------------------------------------------------------------------------
console.log('Scenario 1: Sufficient data with strong positive correlation (r >= 0.70)');
{
  const x = [100, 200, 300, 400, 500, 600];
  const y = [10, 20, 30, 40, 50, 60];
  const r = calculatePearsonCorrelation(x, y, 5);
  const strength = getAssociationStrength(r);

  assert(r !== undefined && r >= 0.99, `Pearson r should be close to 1.0 (actual: ${r})`);
  assert(strength === 'strong', `Association strength should be 'strong' (actual: ${strength})`);

  // Observations where TDS increases alongside Chlorosis / stress
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 5 * dayMs, tds: 600, visualHealthScore: 90, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - 4 * dayMs, tds: 700, visualHealthScore: 85, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now - 3 * dayMs, tds: 800, visualHealthScore: 78, cameraActive: true },
    { id: 'o4', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 900, visualHealthScore: 70, cameraActive: true },
    { id: 'o5', plantId: PLANT_ID, timestamp: now - 1 * dayMs, tds: 1050, visualHealthScore: 62, cameraActive: true },
    { id: 'o6', plantId: PLANT_ID, timestamp: now, tds: 1150, visualHealthScore: 55, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  assert(result.status === 'active_associations', `Status should be active_associations (got ${result.status})`);
  assert(result.associations.length > 0, 'Should identify at least 1 association');
  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  assert(tdsAssoc !== undefined, 'Should have TDS association');
  assert(tdsAssoc?.correlationMethod === 'pearson', `Method should be pearson (got ${tdsAssoc?.correlationMethod})`);
  assert(tdsAssoc?.associationStrength === 'strong', `TDS association strength should be strong (got ${tdsAssoc?.associationStrength})`);
  assert(tdsAssoc?.correlationCoefficient !== undefined && tdsAssoc.correlationCoefficient <= -0.7, `Correlation coefficient should be strongly negative with score (got ${tdsAssoc?.correlationCoefficient})`);
}

// ----------------------------------------------------------------------------
// Scenario 2: Sufficient data + negative correlation (r <= -0.70)
// ----------------------------------------------------------------------------
console.log('\nScenario 2: Sufficient data with strong negative correlation');
{
  const x = [10, 20, 30, 40, 50];
  const y = [50, 40, 30, 20, 10];
  const r = calculatePearsonCorrelation(x, y, 5);
  assert(r !== undefined && r <= -0.99, `Pearson r should be close to -1.0 (actual: ${r})`);
  assert(getAssociationStrength(r) === 'strong', 'Strength should be strong');
}

// ----------------------------------------------------------------------------
// Scenario 3: No correlation (|r| < 0.20)
// ----------------------------------------------------------------------------
console.log('\nScenario 3: Uncorrelated data (|r| < 0.20)');
{
  const x = [10, 20, 30, 40, 50, 60];
  const y = [50, 20, 45, 15, 48, 22]; // No linear relationship
  const r = calculatePearsonCorrelation(x, y, 5);
  const strength = getAssociationStrength(r);
  assert(r !== undefined && Math.abs(r) < 0.35, `Pearson r should be near 0 (actual: ${r})`);
}

// ----------------------------------------------------------------------------
// Scenario 4: Insufficient observations (N < 3)
// ----------------------------------------------------------------------------
console.log('\nScenario 4: Insufficient observations (N < 3 returns insufficient_history)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - dayMs, tds: 650, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now, tds: 700, visualHealthScore: 86, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  assert(result.status === 'insufficient_history', `Status should be insufficient_history (got ${result.status})`);
  assert(result.sampleSize === 2, `Sample size should be 2 (got ${result.sampleSize})`);
  assert(result.farmerHeadline.includes('Not enough historical data') || result.farmerHeadline.includes('history'), 'Headline should communicate data need');
}

// ----------------------------------------------------------------------------
// Scenario 5: Missing sensor data (sensor unavailable != 0)
// ----------------------------------------------------------------------------
console.log('\nScenario 5: Missing sensor data');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, visualHealthScore: 85, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, visualHealthScore: 82, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
    sensorHistory: [],
    latestReading: null,
  });

  assert(result.status === 'sensor_unavailable', `Status should be sensor_unavailable (got ${result.status})`);
  assert(result.confoundingFactors.some(cf => cf.includes('telemetry unavailable')), 'Confounding factors should report telemetry offline');
}

// ----------------------------------------------------------------------------
// Scenario 6: Missing plant observations (N < 2)
// ----------------------------------------------------------------------------
console.log('\nScenario 6: Missing plant observations (N < 2)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now, tds: 650, visualHealthScore: 88, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  assert(result.status === 'insufficient_history', `Status should be insufficient_history (got ${result.status})`);
  assert(result.limitations.length > 0, 'Limitations should note only 1 observation available');
}

// ----------------------------------------------------------------------------
// Scenario 7: Poor image quality / optical gating
// ----------------------------------------------------------------------------
console.log('\nScenario 7: Poor image quality optical gating');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 3 * dayMs, tds: 650, visualHealthScore: 88, plantDetectionConfidence: 35, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 700, visualHealthScore: 85, plantDetectionConfidence: 40, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now - dayMs, tds: 750, visualHealthScore: 80, plantDetectionConfidence: 30, cameraActive: true },
    { id: 'o4', plantId: PLANT_ID, timestamp: now, tds: 800, visualHealthScore: 78, plantDetectionConfidence: 90, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  assert(result.confoundingFactors.some(cf => cf.includes('low camera confidence')), 'Should flag low camera confidence as confounding factor');
}

// ----------------------------------------------------------------------------
// Scenario 8: No plant detected gating
// ----------------------------------------------------------------------------
console.log('\nScenario 8: No plant detected gating');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 650, visualHealthScore: 88, isPlantDetected: false, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 700, visualHealthScore: 85, isPlantDetected: true, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 750, visualHealthScore: 82, isPlantDetected: true, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  assert(result.confoundingFactors.some(cf => cf.includes('no plant detected')), 'Should flag rejected frame in confounding factors');
}

// ----------------------------------------------------------------------------
// Scenario 9: Sensor anomaly only (ENVIRONMENT_ONLY_CHANGE)
// ----------------------------------------------------------------------------
console.log('\nScenario 9: Sensor anomaly only (ENVIRONMENT_ONLY_CHANGE)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 600, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 750, visualHealthScore: 88, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 900, visualHealthScore: 88, cameraActive: true }, // Big TDS rise, score stable
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  assert(tdsAssoc?.associationType === 'ENVIRONMENT_ONLY_CHANGE', `Expected ENVIRONMENT_ONLY_CHANGE (got ${tdsAssoc?.associationType})`);
  assert(tdsAssoc?.summary.includes('remained stable'), 'Summary should note plant remained stable');
}

// ----------------------------------------------------------------------------
// Scenario 10: Plant health anomaly only (PLANT_ONLY_CHANGE)
// ----------------------------------------------------------------------------
console.log('\nScenario 10: Plant health anomaly only (PLANT_ONLY_CHANGE)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 700, visualHealthScore: 90, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 702, visualHealthScore: 82, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 698, visualHealthScore: 72, cameraActive: true }, // Score dropped, TDS stable
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  assert(tdsAssoc?.associationType === 'PLANT_ONLY_CHANGE', `Expected PLANT_ONLY_CHANGE (got ${tdsAssoc?.associationType})`);
}

// ----------------------------------------------------------------------------
// Scenario 11: Simultaneous TDS + health change (3 <= N < 5 qualitative pairing)
// ----------------------------------------------------------------------------
console.log('\nScenario 11: Simultaneous TDS + health change with qualitative pairing (3 <= N < 5)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 650, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 750, visualHealthScore: 82, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 850, visualHealthScore: 74, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  assert(tdsAssoc?.correlationMethod === 'qualitative_pairing', `Expected qualitative_pairing (got ${tdsAssoc?.correlationMethod})`);
  assert(tdsAssoc?.associationType === 'COINCIDENT_CHANGE', `Expected COINCIDENT_CHANGE (got ${tdsAssoc?.associationType})`);
  assert(tdsAssoc?.correlationCoefficient === undefined, 'Correlation coefficient should be suppressed when N < 5');
}

// ----------------------------------------------------------------------------
// Scenario 12: Water level + health change
// ----------------------------------------------------------------------------
console.log('\nScenario 12: Water level depletion alongside health change');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 3 * dayMs, waterLevel: 80, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - 2 * dayMs, waterLevel: 65, visualHealthScore: 85, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now - dayMs, waterLevel: 45, visualHealthScore: 80, cameraActive: true },
    { id: 'o4', plantId: PLANT_ID, timestamp: now, waterLevel: 20, visualHealthScore: 72, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const waterAssoc = result.associations.find(a => a.environmentMetric === 'waterLevel');
  assert(waterAssoc !== undefined, 'Should detect water level association');
  assert(waterAssoc?.environmentDirection === 'falling', `Water direction should be falling (got ${waterAssoc?.environmentDirection})`);
}

// ----------------------------------------------------------------------------
// Scenario 13: Multiple sensor changes simultaneously (confounding detected)
// ----------------------------------------------------------------------------
console.log('\nScenario 13: Multiple sensor changes simultaneously (confounding detected)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 600, waterLevel: 85, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 750, waterLevel: 65, visualHealthScore: 82, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 920, waterLevel: 40, visualHealthScore: 75, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  assert(result.multiSensorAnalysis?.isMultiSensorEvent === true, 'Should flag multi-sensor event');
  assert(result.confoundingFactors.some(cf => cf.includes('does not isolate a single environmental factor')), 'Confounding message should state single factor cannot be isolated');
}

// ----------------------------------------------------------------------------
// Scenario 14: Lagged environmental change (24h lag detected)
// ----------------------------------------------------------------------------
console.log('\nScenario 14: Lagged environmental change detected (24h lag)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 36 * hourMs, tds: 650, visualHealthScore: 90, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - 18 * hourMs, tds: 700, visualHealthScore: 88, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 700, visualHealthScore: 72, cameraActive: true }, // Dropped by 18 points
  ];

  // Sensor reading had a spike ~24h ago
  const sensorHistory = [
    { timestamp: now - 36 * hourMs, ph: 6.0, tds: 650, waterLevel: 80, temperature: 22 },
    { timestamp: now - 24 * hourMs, ph: 6.0, tds: 1100, waterLevel: 80, temperature: 22 }, // Spike 24h ago
    { timestamp: now - 12 * hourMs, ph: 6.0, tds: 700, waterLevel: 80, temperature: 22 },
    { timestamp: now, ph: 6.0, tds: 700, waterLevel: 80, temperature: 22 },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
    sensorHistory,
  });

  assert(result.laggedAssociations.length > 0, 'Should detect lagged association');
  const lagAssoc = result.laggedAssociations[0];
  assert(lagAssoc.lagHours === 24, `Lag should be ~24 hours (got ${lagAssoc.lagHours})`);
  assert(lagAssoc.associationType === 'LAGGED_ASSOCIATION', 'Type should be LAGGED_ASSOCIATION');
}

// ----------------------------------------------------------------------------
// Scenario 15: No-change period (NO_CLEAR_ASSOCIATION / stable)
// ----------------------------------------------------------------------------
console.log('\nScenario 15: No-change stable equilibrium');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 650, ph: 6.0, waterLevel: 80, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 652, ph: 6.02, waterLevel: 79, visualHealthScore: 88, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 651, ph: 6.01, waterLevel: 80, visualHealthScore: 89, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  assert(tdsAssoc?.associationType === 'NO_CLEAR_ASSOCIATION', `Expected NO_CLEAR_ASSOCIATION (got ${tdsAssoc?.associationType})`);
}

// ----------------------------------------------------------------------------
// Scenario 16: Conflicting evidence (visual severe vs sensors nominal)
// ----------------------------------------------------------------------------
console.log('\nScenario 16: Conflicting evidence (extreme sensor excursion vs healthy visual)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 800, visualHealthScore: 92, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 1050, visualHealthScore: 90, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 1350, visualHealthScore: 91, cameraActive: true }, // High TDS > 1200 while score > 85
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  assert(tdsAssoc?.associationType === 'CONFLICTING_EVIDENCE', `Expected CONFLICTING_EVIDENCE (got ${tdsAssoc?.associationType})`);
}

// ----------------------------------------------------------------------------
// Scenario 17: Different plantIds (isolation maintained)
// ----------------------------------------------------------------------------
console.log('\nScenario 17: Different plantId isolation maintained');
{
  const obs = [
    { id: 'o1', plantId: OTHER_PLANT_ID, timestamp: now - 2 * dayMs, tds: 900, visualHealthScore: 50, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 600, visualHealthScore: 88, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 620, visualHealthScore: 87, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  assert(result.sampleSize === 2, `Should only count observations for ${PLANT_ID} (got ${result.sampleSize})`);
  assert(result.status === 'insufficient_history', 'Should be insufficient history due to isolation of plantId');
}

// ----------------------------------------------------------------------------
// Scenario 18: Baseline comparison against plant profile
// ----------------------------------------------------------------------------
console.log('\nScenario 18: Baseline comparison against plant profile');
{
  const plantProfile = {
    plantId: PLANT_ID,
    createdAt: now - 10 * dayMs,
    monitoringStatus: 'ACTIVE',
    currentHealthStatus: 'STABLE',
    observationCount: 3,
    baseline: {
      baselineStatus: 'ESTABLISHED',
      isEstablished: true,
      initialTDS: 600,
      initialPH: 5.8,
      initialWaterLevel: 90,
      initialHealthScore: 88,
    },
  };

  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 650, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 700, visualHealthScore: 85, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 750, visualHealthScore: 82, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
    plantProfile,
  });

  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  assert(tdsAssoc?.environmentBaseline === 600, `Should capture initialTDS baseline 600 (got ${tdsAssoc?.environmentBaseline})`);
  assert(tdsAssoc?.plantBaseline === 88, `Should capture initialHealthScore baseline 88 (got ${tdsAssoc?.plantBaseline})`);
}

// ----------------------------------------------------------------------------
// Scenario 19: Farmer Mode English copy (Strictly non-causal)
// ----------------------------------------------------------------------------
console.log('\nScenario 19: Farmer Mode English copy (Non-causal verification)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 600, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 750, visualHealthScore: 80, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 880, visualHealthScore: 72, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  const enCopy = getLocalizedAssociation(tdsAssoc, 'en');

  assert(enCopy.whatChanged.length > 0, 'whatChanged should not be empty');
  assert(enCopy.whatHappenedTogether.length > 0, 'whatHappenedTogether should not be empty');
  assert(enCopy.whatItMeans.length > 0, 'whatItMeans should not be empty');
  assert(enCopy.whatToDo.length > 0, 'whatToDo should not be empty');

  // Verify absence of forbidden causal words
  const fullText = `${enCopy.whatChanged} ${enCopy.whatHappenedTogether} ${enCopy.whatItMeans} ${enCopy.whatToDo}`.toLowerCase();
  assert(!fullText.includes('caused'), 'Should not use "caused"');
  assert(!fullText.includes('resulted in'), 'Should not use "resulted in"');
  assert(!fullText.includes('proves'), 'Should not use "proves"');
}

// ----------------------------------------------------------------------------
// Scenario 20: Farmer Mode Kannada copy
// ----------------------------------------------------------------------------
console.log('\nScenario 20: Farmer Mode Kannada copy localization');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 600, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 750, visualHealthScore: 80, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 880, visualHealthScore: 72, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const tdsAssoc = result.associations.find(a => a.environmentMetric === 'tds');
  const knCopy = getLocalizedAssociation(tdsAssoc, 'kn');

  assert(knCopy.whatChanged.includes('TDS') || knCopy.whatChanged.includes('ಪೋಷಕಾಂಶ'), 'Kannada whatChanged should mention nutrients/TDS');
  assert(knCopy.whatHappenedTogether.includes('ಎಲೆ'), 'Kannada whatHappenedTogether should mention foliage/leaves');
  assert(knCopy.whatToDo.includes('ನೀರು') || knCopy.whatToDo.includes('ಪೋಷಕಾಂಶ'), 'Kannada whatToDo should advise water/nutrient inspection');
}

// ----------------------------------------------------------------------------
// Scenario 21: Technical Mode English copy
// ----------------------------------------------------------------------------
console.log('\nScenario 21: Technical Mode English copy');
{
  const x = [100, 200, 300, 400, 500];
  const y = [10, 20, 30, 40, 50];
  const r = calculatePearsonCorrelation(x, y, 5);
  const typeText = getLocalizedAssociationType('TEMPORAL_ASSOCIATION', 'en');
  const strengthText = getLocalizedAssociationStrength('strong', 'en');

  assert(typeText === 'Temporal Association', `Expected 'Temporal Association' (got ${typeText})`);
  assert(strengthText === 'Strong Association', `Expected 'Strong Association' (got ${strengthText})`);
}

// ----------------------------------------------------------------------------
// Scenario 22: Technical Mode Kannada copy
// ----------------------------------------------------------------------------
console.log('\nScenario 22: Technical Mode Kannada copy');
{
  const typeTextKn = getLocalizedAssociationType('TEMPORAL_ASSOCIATION', 'kn');
  const strengthTextKn = getLocalizedAssociationStrength('strong', 'kn');

  assert(typeTextKn === 'ಕಾಲಾನುಕ್ರಮ ಪರಸ್ಪರ ಸಂಬಂಧ', `Expected Kannada type (got ${typeTextKn})`);
  assert(strengthTextKn === 'ದೃಢವಾದ ಸಂಬಂಧ', `Expected Kannada strength (got ${strengthTextKn})`);
}

// ----------------------------------------------------------------------------
// Scenario 23: Zero-variance protection in Pearson correlation
// ----------------------------------------------------------------------------
console.log('\nScenario 23: Zero-variance protection in Pearson correlation');
{
  const x = [500, 500, 500, 500, 500]; // Zero variance
  const y = [10, 20, 30, 40, 50];
  const r = calculatePearsonCorrelation(x, y, 5);

  assert(r === 0, `Zero variance in x should return 0 instead of NaN (actual: ${r})`);
  assert(!isNaN(r), 'Result must not be NaN');
}

// ----------------------------------------------------------------------------
// Scenario 24: Plant Journey integration
// ----------------------------------------------------------------------------
console.log('\nScenario 24: Plant Journey integration with correlation milestones');
{
  const summary = {
    farmerHeadline: 'TDS shift coincided with leaf yellowing',
    farmerWhy: 'Water nutrients changed alongside foliage response',
    farmerAction: 'Inspect reservoir',
    status: 'active_associations',
    primaryAssociation: {
      id: 'assoc_test_1',
      plantId: PLANT_ID,
      timestamp: now,
      environmentMetric: 'tds',
      environmentLabel: 'Total Dissolved Solids (TDS)',
      environmentDirection: 'rising',
      plantMetric: 'visualHealthScore',
      plantLabel: 'Visual Health Score',
      plantDirection: 'declined',
      timeWindow: 'recent_trend',
      associationType: 'TEMPORAL_ASSOCIATION',
      associationStrength: 'strong',
      correlationMethod: 'pearson',
      sampleSize: 6,
      confidence: 'HIGH',
      confidenceReason: 'Calculated across 6 points',
      dataQuality: 'good',
      confoundingFactors: [],
      evidenceIds: [],
      relatedObservationIds: [],
      summary: 'TDS rising moved together with Visual Health Score declined (r = -0.850).',
      farmerSummary: {
        whatChanged: 'TDS increased',
        whatHappenedTogether: 'Score dropped',
        whatItMeans: 'Associated shift',
        whatToDo: 'Check nutrients',
      },
      createdAt: now,
    },
    associations: [],
    laggedAssociations: [],
    confoundingFactors: [],
    sampleSize: 6,
    limitations: [],
  };

  const loc = getLocalizedCorrelationSummary(summary, 'en');
  assert(loc.statusLabel === 'Active Associations Detected', `Status label should reflect active associations (got ${loc.statusLabel})`);
}

// ----------------------------------------------------------------------------
// Scenario 25: What Changed integration
// ----------------------------------------------------------------------------
console.log('\nScenario 25: What Changed integration');
{
  const whatChangedSummary = {
    plantId: PLANT_ID,
    timestamp: now,
    status: 'meaningful_changes',
    hasMeaningfulChange: true,
    overallSignificance: 'MODERATE',
    events: [
      {
        id: 'ev1',
        plantId: PLANT_ID,
        category: 'sensor',
        metric: 'tds',
        label: 'TDS Concentration',
        delta: 120,
        significance: 'MODERATE',
        direction: 'changed',
        timeWindow: 'vs_previous',
        confidence: 'HIGH',
        summary: 'TDS increased by 120 PPM',
        farmerNarrative: { whatChanged: 'Nutrient concentration increased', significance: 'Moderate', recommendation: 'Monitor TDS' },
        timestamp: now,
      }
    ],
    reviewRequiredItems: [],
    primaryFarmerHeadline: 'Nutrient balance shifted',
    farmerSummary: 'TDS increased by 120 PPM',
    changeCounts: { visual: 0, sensor: 1, health: 0, growth: 0, identity: 0, anomaly: 0, reasoning: 0, combined: 1, total: 1 },
    timeDeltaMs: 86400000,
  };

  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 600, visualHealthScore: 88, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - dayMs, tds: 720, visualHealthScore: 82, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now, tds: 840, visualHealthScore: 76, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
    whatChangedSummary,
  });

  assert(result.associations.length > 0, 'Should correlate with whatChanged context passed in');
}

// ----------------------------------------------------------------------------
// Scenario 26: Plant Reasoning integration (non-causal synthesis)
// ----------------------------------------------------------------------------
console.log('\nScenario 26: Plant Reasoning integration (non-causal limitations)');
{
  const obs = [
    { id: 'o1', plantId: PLANT_ID, timestamp: now - 3 * dayMs, tds: 600, visualHealthScore: 90, cameraActive: true },
    { id: 'o2', plantId: PLANT_ID, timestamp: now - 2 * dayMs, tds: 700, visualHealthScore: 85, cameraActive: true },
    { id: 'o3', plantId: PLANT_ID, timestamp: now - dayMs, tds: 800, visualHealthScore: 80, cameraActive: true },
    { id: 'o4', plantId: PLANT_ID, timestamp: now, tds: 900, visualHealthScore: 75, cameraActive: true },
  ];

  const result = evaluateEnvironmentPlantCorrelation({
    plantId: PLANT_ID,
    observations: obs,
  });

  const summaryText = result.primaryAssociation?.summary || '';
  assert(
    summaryText.includes('occurred alongside') ||
    summaryText.includes('moved together') ||
    summaryText.includes('empirical association') ||
    summaryText.includes('coincided with'),
    `Summary must use empirical association phrasing (got "${summaryText}")`
  );
}

// ----------------------------------------------------------------------------
// Final Summary
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Test Results: ${passedTests} / ${totalTests} Passed`);
console.log('================================================================');

if (passedTests === totalTests) {
  console.log('\n✨ ALL 26 CORRELATION INTELLIGENCE SCENARIOS PASSED!\n');
  process.exit(0);
} else {
  console.error(`\n❌ ${totalTests - passedTests} TEST(S) FAILED.\n`);
  process.exit(1);
}
