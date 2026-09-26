#!/usr/bin/env node
// ============================================================================
// HydroSmart Phase 7 — "What Changed?" Intelligence Engine Automated Verification Suite
// 20 Required Scenarios:
// 1. Insufficient History (N < 2)
// 2. Valid "No Change" State (Sub-threshold differences)
// 3. Sensor Unavailable != 0 (pH missing)
// 4. TDS Sensor Unavailable
// 5. Water Level Sensor Unavailable
// 6. All Sensors Unavailable State
// 7. Minor pH Drift (+0.18 pH)
// 8. Moderate pH Drift (+0.35 pH)
// 9. Significant pH Drift (+0.60 pH)
// 10. Critical pH Excursion (+0.90 pH)
// 11. TDS Significant Depletion (-180 PPM)
// 12. Water Level Critical Depletion (-30%)
// 13. Water Level Refill (+60%)
// 14. Vegetative Growth Canopy Expansion (+5.0%)
// 15. Optical Confidence Gating (Blurry/Low-confidence frame suppresses growth certainty)
// 16. Foliar Chlorosis Increase (+7.0%)
// 17. Species Identity Resolution (Unknown -> Basil)
// 18. Species Identity Shift (Basil -> Mint, requiresReview: true)
// 19. Multimodal Correlated Change (pH drift + Chlorosis increase)
// 20. Recovery Trajectory (+22 pts Visual Health Improvement)
// ============================================================================

import { evaluateWhatChanged } from '../lib/intelligence/whatChangedEngine.ts';
import { getLocalizedWhatChangedCopy, getLocalizedChangeEvent } from '../lib/intelligence/farmerSemanticLayer.ts';

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
console.log('HydroSmart Phase 7 — "What Changed?" Intelligence Verification Suite');
console.log('================================================================\n');

const BASE_PLANT_ID = 'test-plant-p7';
const now = Date.now();
const hourMs = 3600000;

const defaultProfile = {
  plantId: BASE_PLANT_ID,
  species: 'Sweet Basil',
  commonName: 'Sweet Basil',
  scientificName: 'Ocimum basilicum',
  createdAt: now - 10 * hourMs,
  monitoringStatus: 'active',
  currentHealthStatus: 'optimal',
  observationCount: 5,
  targetProfile: {
    name: 'Sweet Basil',
    phMin: 5.5,
    phMax: 6.5,
    tdsMin: 600,
    tdsMax: 1000,
    idealWaterLevelMin: 40,
  },
};

// ----------------------------------------------------------------------------
// Scenario 1: Insufficient History (N < 2)
// ----------------------------------------------------------------------------
console.log('Test 1: Insufficient History (N < 2)');
{
  const obs1 = {
    id: 'obs_1',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    canopyCoveragePercent: 20,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
    visualHealthScore: 92,
  };

  const summary = evaluateWhatChanged(obs1, [obs1], defaultProfile);
  assert(summary.status === 'insufficient_history', 'Status is insufficient_history when N=1');
  assert(summary.hasMeaningfulChange === false, 'hasMeaningfulChange is false when history is insufficient');
  assert(summary.summaryHeadline.includes('Not enough historical data'), 'Explains history limitation clearly');
  assert(summary.observationCount === 1, 'Observation count correctly reported as 1');
}

// ----------------------------------------------------------------------------
// Scenario 2: Valid "No Change" State (Sub-threshold Differences)
// ----------------------------------------------------------------------------
console.log('\nTest 2: Valid "No Change" State (Sub-threshold Drift)');
{
  const prevObs = {
    id: 'obs_prev',
    plantId: BASE_PLANT_ID,
    timestamp: now - 2 * hourMs,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    canopyCoveragePercent: 20.0,
    ph: 6.00,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
    visualHealthScore: 90,
  };

  const currObs = {
    id: 'obs_curr',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    canopyCoveragePercent: 20.4, // +0.4% (below 1.5% minor threshold)
    ph: 6.05,                   // +0.05 pH (below 0.15 minor threshold)
    tds: 810,                   // +10 PPM (below 40 minor threshold)
    waterLevel: 79.5,           // -0.5% (below 3.0% minor threshold)
    telemetryMode: 'real',
    isTelemetryStale: false,
    visualHealthScore: 91,       // +1 pt (below 3 minor threshold)
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  assert(summary.status === 'stable_no_change', 'Status is stable_no_change');
  assert(summary.hasMeaningfulChange === false, 'hasMeaningfulChange is false for sub-threshold noise');
  assert(summary.overallSignificance === 'NONE', 'Overall significance is NONE');
  assert(summary.overallDirection === 'stable', 'Overall direction is stable');
  assert(summary.farmerHeadline.includes('All quiet'), 'Farmer headline indicates crop is steady');
}

// ----------------------------------------------------------------------------
// Scenario 3: Sensor Unavailable != 0 (pH missing)
// ----------------------------------------------------------------------------
console.log('\nTest 3: Sensor Unavailable != 0 (pH missing)');
{
  const prevObs = {
    id: 'obs_prev',
    plantId: BASE_PLANT_ID,
    timestamp: now - 2 * hourMs,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'obs_curr',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    ph: undefined, // Sensor disconnected
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const phEvent = summary.events.find(e => e.metric === 'ph');
  assert(phEvent !== undefined, 'pH event is generated');
  assert(phEvent.direction === 'unavailable', 'pH direction is unavailable');
  assert(phEvent.delta === undefined, 'pH delta is NOT computed as a drop to zero');
  assert(phEvent.summary.includes('unavailable'), 'pH summary accurately reports unavailable telemetry');
  assert(summary.sensorAvailability.ph === 'unavailable', 'sensorAvailability marks pH as unavailable');
}

// ----------------------------------------------------------------------------
// Scenario 4: TDS Sensor Unavailable
// ----------------------------------------------------------------------------
console.log('\nTest 4: TDS Sensor Unavailable');
{
  const prevObs = {
    id: 'obs_prev',
    plantId: BASE_PLANT_ID,
    timestamp: now - 2 * hourMs,
    cameraActive: true,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'obs_curr',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    cameraActive: true,
    ph: 6.0,
    tds: undefined,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const tdsEvent = summary.events.find(e => e.metric === 'tds');
  assert(tdsEvent?.direction === 'unavailable', 'TDS direction is unavailable');
  assert(tdsEvent?.delta === undefined, 'TDS delta is NOT computed as -800');
}

// ----------------------------------------------------------------------------
// Scenario 5: Water Level Sensor Unavailable
// ----------------------------------------------------------------------------
console.log('\nTest 5: Water Level Sensor Unavailable');
{
  const prevObs = {
    id: 'obs_prev',
    plantId: BASE_PLANT_ID,
    timestamp: now - 2 * hourMs,
    cameraActive: true,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'obs_curr',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    cameraActive: true,
    ph: 6.0,
    tds: 800,
    waterLevel: undefined,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const waterEvent = summary.events.find(e => e.metric === 'waterLevel');
  assert(waterEvent?.direction === 'unavailable', 'Water level direction is unavailable');
  assert(waterEvent?.delta === undefined, 'Water level delta is NOT computed as 0');
}

// ----------------------------------------------------------------------------
// Scenario 6: All Sensors Unavailable State
// ----------------------------------------------------------------------------
console.log('\nTest 6: All Sensors Unavailable State');
{
  const prevObs = {
    id: 'obs_prev',
    plantId: BASE_PLANT_ID,
    timestamp: now - 2 * hourMs,
    cameraActive: true,
    ph: undefined,
    tds: undefined,
    waterLevel: undefined,
    telemetryMode: 'real',
    isTelemetryStale: true,
  };

  const currObs = {
    id: 'obs_curr',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    cameraActive: true,
    ph: undefined,
    tds: undefined,
    waterLevel: undefined,
    telemetryMode: 'real',
    isTelemetryStale: true,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  assert(summary.status === 'sensor_unavailable', 'Status is sensor_unavailable');
}

// ----------------------------------------------------------------------------
// Scenario 7: Minor pH Drift (+0.18 pH)
// ----------------------------------------------------------------------------
console.log('\nTest 7: Minor pH Drift (+0.18 pH)');
{
  const prevObs = { id: 'p', timestamp: now - 2 * hourMs, ph: 6.0, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };
  const currObs = { id: 'c', timestamp: now, ph: 6.18, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const phEvent = summary.events.find(e => e.metric === 'ph');
  assert(phEvent?.significance === 'MINOR', `pH drift (+0.18) classified as MINOR (got: ${phEvent?.significance})`);
  assert(phEvent?.isMeaningful === true, 'Minor pH drift is flagged as meaningful');
}

// ----------------------------------------------------------------------------
// Scenario 8: Moderate pH Drift (+0.35 pH)
// ----------------------------------------------------------------------------
console.log('\nTest 8: Moderate pH Drift (+0.35 pH)');
{
  const prevObs = { id: 'p', timestamp: now - 2 * hourMs, ph: 6.0, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };
  const currObs = { id: 'c', timestamp: now, ph: 6.35, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const phEvent = summary.events.find(e => e.metric === 'ph');
  assert(phEvent?.significance === 'MODERATE', `pH drift (+0.35) classified as MODERATE (got: ${phEvent?.significance})`);
}

// ----------------------------------------------------------------------------
// Scenario 9: Significant pH Drift (+0.60 pH)
// ----------------------------------------------------------------------------
console.log('\nTest 9: Significant pH Drift (+0.60 pH)');
{
  const prevObs = { id: 'p', timestamp: now - 2 * hourMs, ph: 6.0, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };
  const currObs = { id: 'c', timestamp: now, ph: 6.60, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const phEvent = summary.events.find(e => e.metric === 'ph');
  assert(phEvent?.significance === 'SIGNIFICANT', `pH drift (+0.60) classified as SIGNIFICANT (got: ${phEvent?.significance})`);
  assert(phEvent?.direction === 'declined', 'Drift above 6.5 classified as declined');
}

// ----------------------------------------------------------------------------
// Scenario 10: Critical pH Excursion (+0.90 pH)
// ----------------------------------------------------------------------------
console.log('\nTest 10: Critical pH Excursion (+0.90 pH)');
{
  const prevObs = { id: 'p', timestamp: now - 2 * hourMs, ph: 6.0, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };
  const currObs = { id: 'c', timestamp: now, ph: 6.90, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const phEvent = summary.events.find(e => e.metric === 'ph');
  assert(phEvent?.significance === 'CRITICAL', `pH drift (+0.90) classified as CRITICAL (got: ${phEvent?.significance})`);
  assert(summary.overallSignificance === 'CRITICAL', 'Overall significance elevated to CRITICAL');
}

// ----------------------------------------------------------------------------
// Scenario 11: TDS Significant Depletion (-180 PPM)
// ----------------------------------------------------------------------------
console.log('\nTest 11: TDS Significant Depletion (-180 PPM)');
{
  const prevObs = { id: 'p', timestamp: now - 4 * hourMs, ph: 6.0, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };
  const currObs = { id: 'c', timestamp: now, ph: 6.0, tds: 620, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const tdsEvent = summary.events.find(e => e.metric === 'tds');
  assert(tdsEvent?.significance === 'SIGNIFICANT', `TDS delta (-180) classified as SIGNIFICANT (got: ${tdsEvent?.significance})`);
  assert(tdsEvent?.delta === -180, 'Delta is correctly -180 PPM');
}

// ----------------------------------------------------------------------------
// Scenario 12: Water Level Critical Depletion (-30%)
// ----------------------------------------------------------------------------
console.log('\nTest 12: Water Level Critical Depletion (-30%)');
{
  const prevObs = { id: 'p', timestamp: now - 6 * hourMs, ph: 6.0, tds: 800, waterLevel: 80, telemetryMode: 'real', isTelemetryStale: false };
  const currObs = { id: 'c', timestamp: now, ph: 6.0, tds: 800, waterLevel: 50, telemetryMode: 'real', isTelemetryStale: false };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const waterEvent = summary.events.find(e => e.metric === 'waterLevel');
  assert(waterEvent?.significance === 'CRITICAL', `Water drop (-30%) classified as CRITICAL (got: ${waterEvent?.significance})`);
}

// ----------------------------------------------------------------------------
// Scenario 13: Water Level Refill (+60%)
// ----------------------------------------------------------------------------
console.log('\nTest 13: Water Level Refill (+60%)');
{
  const prevObs = { id: 'p', timestamp: now - 2 * hourMs, ph: 6.0, tds: 800, waterLevel: 25, telemetryMode: 'real', isTelemetryStale: false };
  const currObs = { id: 'c', timestamp: now, ph: 6.0, tds: 800, waterLevel: 85, telemetryMode: 'real', isTelemetryStale: false };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const waterEvent = summary.events.find(e => e.metric === 'waterLevel');
  assert(waterEvent?.direction === 'improved', 'Water refill direction is improved');
  assert(waterEvent?.farmerHeadline.includes('refilled'), 'Headline indicates reservoir was refilled');
}

// ----------------------------------------------------------------------------
// Scenario 14: Vegetative Growth Canopy Expansion (+5.0%)
// ----------------------------------------------------------------------------
console.log('\nTest 14: Vegetative Growth Canopy Expansion (+5.0%)');
{
  const prevObs = {
    id: 'p',
    timestamp: now - 24 * hourMs,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 92,
    canopyCoveragePercent: 20.0,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'c',
    timestamp: now,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 94,
    canopyCoveragePercent: 25.0, // +5.0%
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const canopyEvent = summary.events.find(e => e.metric === 'canopyCoveragePercent');
  assert(canopyEvent?.category === 'growth', 'Canopy change categorized as growth');
  assert(canopyEvent?.significance === 'MODERATE', '5% canopy growth classified as MODERATE');
  assert(canopyEvent?.direction === 'improved', 'Growth direction is improved');
  assert(canopyEvent?.confidence === 'HIGH', 'High confidence under clear camera');
}

// ----------------------------------------------------------------------------
// Scenario 15: Optical Confidence Gating (Blurry Frame)
// ----------------------------------------------------------------------------
console.log('\nTest 15: Optical Confidence Gating (Blurry Frame)');
{
  const prevObs = {
    id: 'p',
    timestamp: now - 24 * hourMs,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    canopyCoveragePercent: 20.0,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'c',
    timestamp: now,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 35, // Low confidence / blurry
    canopyCoveragePercent: 28.0, // Apparent +8%
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const canopyEvent = summary.events.find(e => e.metric === 'canopyCoveragePercent');
  assert(canopyEvent?.confidence === 'LOW', 'Canopy confidence downgraded to LOW');
  assert(canopyEvent?.isMeaningful === false, 'Low confidence visual delta suppressed from high significance');
  assert(summary.limitations.some(l => l.includes('clarity')), 'Limitations list notes camera view clarity');
}

// ----------------------------------------------------------------------------
// Scenario 16: Foliar Chlorosis Increase (+7.0%)
// ----------------------------------------------------------------------------
console.log('\nTest 16: Foliar Chlorosis Increase (+7.0%)');
{
  const prevObs = {
    id: 'p',
    timestamp: now - 12 * hourMs,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    baselineDeltas: { chlorosisDeltaPercent: 1.0 },
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'c',
    timestamp: now,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    baselineDeltas: { chlorosisDeltaPercent: 8.0 }, // +7.0%
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const chlorosisEvent = summary.events.find(e => e.metric === 'chlorosis');
  assert(chlorosisEvent?.category === 'visual', 'Chlorosis categorized as visual');
  assert(chlorosisEvent?.significance === 'MODERATE', '7% chlorosis delta is MODERATE');
  assert(chlorosisEvent?.direction === 'declined', 'Yellowing increase direction is declined');
}

// ----------------------------------------------------------------------------
// Scenario 17: Species Identity Resolution (Unknown -> Basil)
// ----------------------------------------------------------------------------
console.log('\nTest 17: Species Identity Resolution (Unknown -> Basil)');
{
  const prevObs = {
    id: 'p',
    timestamp: now - 2 * hourMs,
    plantSpecies: 'Unknown Plant',
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'c',
    timestamp: now,
    plantSpecies: 'Sweet Basil',
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 92,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const idEvent = summary.events.find(e => e.category === 'identity');
  assert(idEvent !== undefined, 'Identity event created');
  assert(idEvent?.direction === 'improved', 'Direction is improved when identified from unknown');
  assert(idEvent?.requiresReview === false, 'Normal initial identification does not require alert review');
}

// ----------------------------------------------------------------------------
// Scenario 18: Species Identity Shift (Basil -> Mint)
// ----------------------------------------------------------------------------
console.log('\nTest 18: Species Identity Shift (Basil -> Mint)');
{
  const prevObs = {
    id: 'p',
    timestamp: now - 2 * hourMs,
    plantSpecies: 'Sweet Basil',
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'c',
    timestamp: now,
    plantSpecies: 'Peppermint',
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 92,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const idEvent = summary.events.find(e => e.category === 'identity');
  assert(idEvent?.requiresReview === true, 'Unexpected species shift flags requiresReview: true');
  assert(idEvent?.significance === 'CRITICAL', 'Species shift classified as CRITICAL');
  assert(summary.reviewRequiredItems.length > 0, 'Review required items populated');
}

// ----------------------------------------------------------------------------
// Scenario 19: Multimodal Correlated Change (pH Drift + Chlorosis)
// ----------------------------------------------------------------------------
console.log('\nTest 19: Multimodal Correlated Change (pH Drift + Chlorosis)');
{
  const prevObs = {
    id: 'p',
    timestamp: now - 12 * hourMs,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    baselineDeltas: { chlorosisDeltaPercent: 1.0 },
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'c',
    timestamp: now,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    baselineDeltas: { chlorosisDeltaPercent: 9.0 },
    ph: 6.8, // +0.80 pH drift
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const correlated = summary.events.find(e => e.category === 'combined');
  assert(correlated !== undefined, 'Combined multimodal correlation event detected');
  assert(correlated?.summary.includes('pH shift to 6.8'), 'Summary explicitly correlates pH shift with yellowing');
  assert(summary.reasoningChanges.length > 0, 'reasoningChanges collection includes correlated event');
}

// ----------------------------------------------------------------------------
// Scenario 20: Recovery Trajectory (+22 pts Visual Health Improvement)
// ----------------------------------------------------------------------------
console.log('\nTest 20: Recovery Trajectory (+22 pts Visual Health Improvement)');
{
  const prevObs = {
    id: 'p',
    timestamp: now - 24 * hourMs,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    visualHealthScore: 60,
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const currObs = {
    id: 'c',
    timestamp: now,
    cameraActive: true,
    isPlantDetected: true,
    plantDetectionConfidence: 90,
    visualHealthScore: 82, // +22 pts recovery
    ph: 6.0,
    tds: 800,
    waterLevel: 80,
    telemetryMode: 'real',
    isTelemetryStale: false,
  };

  const summary = evaluateWhatChanged(currObs, [currObs, prevObs], defaultProfile);
  const healthEvent = summary.events.find(e => e.metric === 'visualHealthScore');
  assert(healthEvent?.direction === 'recovered', 'Direction is recovered when rebounding to healthy score');
  assert(healthEvent?.significance === 'SIGNIFICANT', 'Health recovery classified as SIGNIFICANT');
  assert(summary.overallDirection === 'recovered', 'Overall direction is recovered');

  // Verify Bilingual localization
  const knCopy = getLocalizedWhatChangedCopy(summary, 'kn');
  assert(knCopy.headline.length > 0, 'Kannada copy generated for recovered summary');
  const knEventCopy = getLocalizedChangeEvent(healthEvent, 'kn');
  assert(knEventCopy.headline.length > 0, 'Kannada event copy generated');
}

console.log('\n================================================================');
console.log(`Results: ${passedTests} passed, ${totalTests - passedTests} failed, ${totalTests} total tests`);
console.log('================================================================');

if (totalTests !== passedTests) {
  process.exit(1);
} else {
  console.log('ALL PHASE 7 WHAT CHANGED VERIFICATION TESTS PASSED SUCCESSFULLY!');
}
