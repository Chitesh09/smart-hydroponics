#!/usr/bin/env node
// ============================================================================
// HydroSmart Phase 5 — Visual Plant Health & Anomaly Automated Verification Suite
// Tests 17 Scenarios:
// 1. Healthy plant
// 2. Yellowing visual change
// 3. Browning visual change
// 4. Canopy reduction
// 5. Stable plant across repeated scans
// 6. Single noisy frame (temporal smoothing)
// 7. No plant (gating)
// 8. Blurred plant (quality gating)
// 9. Dark image (quality gating)
// 10. Partially occluded / small plant
// 11. Unknown species (species-independent)
// 12. Known species (species-aware calibration)
// 13. Insufficient history
// 14. Historical comparison
// 15. Farmer Mode English
// 16. Farmer Mode Kannada
// 17. Technical Mode diagnostics
// ============================================================================

import fs from 'fs';
import path from 'path';
import { analyzeVisualPlantHealth } from '../lib/vision/plantHealthAnalyzer.ts';
import { VISUAL_HEALTH_CONFIG, SPECIES_VISUAL_PROFILES } from '../lib/vision/visualHealthConfig.ts';
import {
  getOrCreatePlantBaseline,
  evaluatePlantHealthWithBaseline,
  resetPlantBaseline,
  compareAgainstPlantBaseline,
} from '../lib/intelligence/visualBaselineEngine.ts';
import { detectVisualAnomaliesFromHealth } from '../lib/intelligence/anomalyDetection.ts';
import { computeGrowthEstimates, answerPlantMemoryQueries } from '../lib/intelligence/plantMemory.ts';
import { deriveFarmerSemanticState, FARMER_COPY } from '../lib/intelligence/farmerSemanticLayer.ts';

const FRAME_WIDTH = 160;
const FRAME_HEIGHT = 120;

function createSyntheticFrame(fillFn) {
  const data = new Uint8ClampedArray(FRAME_WIDTH * FRAME_HEIGHT * 4);
  for (let y = 0; y < FRAME_HEIGHT; y++) {
    for (let x = 0; x < FRAME_WIDTH; x++) {
      const idx = (y * FRAME_WIDTH + x) * 4;
      const [r, g, b, a = 255] = fillFn(x, y);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = a;
    }
  }
  return {
    data,
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
  };
}

console.log('================================================================');
console.log('HydroSmart Phase 5 — Visual Plant Health & Anomaly Test Suite');
console.log('================================================================\n');

let passedTests = 0;
const totalTests = 17;

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

// ---------------------------------------------------------------------------
// TEST 1: Healthy-looking plant
// ---------------------------------------------------------------------------
try {
  console.log('TEST 1: Healthy-looking plant (Vibrant chlorophyll foliage)');
  resetPlantBaseline('plant_test_1');

  // Synthetic frame: Healthy leaf cluster with rich green pigment (ExG > 0.12)
  const frame = createSyntheticFrame((x, y) => {
    const inCluster = x >= 45 && x <= 115 && y >= 25 && y <= 95;
    if (inCluster) {
      const leafPattern = (Math.sin(x * 0.45) * Math.cos(y * 0.45)) > -0.05;
      if (leafPattern) {
        const marginEdge = ((x + y) % 4 === 0) ? 22 : 0;
        return [35 + marginEdge, 155 + marginEdge, 45]; // Vibrant green
      }
    }
    return [175, 175, 170]; // Indoor neutral background
  });

  const result = analyzeVisualPlantHealth(frame, { plantId: 'plant_test_1' });
  assert(
    result.healthState === 'HEALTHY' || result.healthState === 'STABLE',
    `Expected HEALTHY or STABLE, got ${result.healthState}`
  );
  assert(result.chlorosisYellowPercent < 8.0, `Expected low chlorosis, got ${result.chlorosisYellowPercent}%`);
  assert(result.necroticBrownPercent < 3.0, `Expected low necrosis, got ${result.necroticBrownPercent}%`);
  assert(result.qualitativeConfidence === 'high' || result.qualitativeConfidence === 'moderate', `Expected confident result`);

  console.log(`  ✓ PASS: Health State = ${result.healthState}, Score = ${result.visualHealthScore}/100, Chlorosis = ${result.chlorosisYellowPercent}%, Necrosis = ${result.necroticBrownPercent}%`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 1:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 2: Yellowing visual change (Foliar Chlorosis)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 2: Yellowing visual change (Foliar Chlorosis anomaly)');
  resetPlantBaseline('plant_test_2');

  const yellowFrame = createSyntheticFrame((x, y) => {
    const inCluster = x >= 45 && x <= 115 && y >= 25 && y <= 95;
    if (inCluster) {
      const leafPattern = (Math.sin(x * 0.45) * Math.cos(y * 0.45)) > -0.05;
      if (leafPattern) {
        // Severe chlorosis across 45% of canopy (pale yellow leaves)
        const isChlorotic = (x > 75 || y > 65);
        if (isChlorotic) {
          const marginEdge = ((x + y) % 4 === 0) ? 15 : 0;
          return [170 + marginEdge, 195 + marginEdge, 45]; // Chlorotic yellowing (hue ~66°)
        }
        const marginEdge = ((x + y) % 4 === 0) ? 20 : 0;
        return [35 + marginEdge, 155 + marginEdge, 45]; // Green foliage
      }
    }
    return [175, 175, 170];
  });

  const result = analyzeVisualPlantHealth(yellowFrame, { plantId: 'plant_test_2' });
  assert(
    result.healthState === 'ATTENTION' || result.healthState === 'CRITICAL',
    `Expected ATTENTION or CRITICAL, got ${result.healthState}`
  );
  assert(result.chlorosisYellowPercent >= 12.0, `Expected chlorosis >= 12%, got ${result.chlorosisYellowPercent}%`);

  const anomalies = detectVisualAnomaliesFromHealth(result);
  assert(anomalies.some(a => a.type.includes('chlorosis')), 'Expected chlorosis anomaly to be detected');

  console.log(`  ✓ PASS: State = ${result.healthState}, Yellowing = ${result.chlorosisYellowPercent}%, Anomaly = "${anomalies[0]?.description}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 2:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 3: Browning visual change (Foliar Necrosis / Tip Burn)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 3: Browning visual change (Foliar Necrosis / Tip Burn)');
  resetPlantBaseline('plant_test_3');

  const necroticFrame = createSyntheticFrame((x, y) => {
    const inCluster = x >= 45 && x <= 115 && y >= 25 && y <= 95;
    if (inCluster) {
      const leafPattern = (Math.sin(x * 0.45) * Math.cos(y * 0.45)) > -0.05;
      if (leafPattern) {
        // Tip burn / necrotic browning on leaf margins
        const isNecrotic = (x > 85 && (x + y) % 3 === 0);
        if (isNecrotic) {
          return [145, 95, 35]; // Necrotic brown
        }
        const marginEdge = ((x + y) % 4 === 0) ? 20 : 0;
        return [35 + marginEdge, 155 + marginEdge, 45]; // Green canopy
      }
    }
    return [175, 175, 170];
  });

  const result = analyzeVisualPlantHealth(necroticFrame, { plantId: 'plant_test_3' });
  assert(
    result.healthState === 'ATTENTION' || result.healthState === 'CRITICAL',
    `Expected ATTENTION or CRITICAL, got ${result.healthState}`
  );
  assert(result.necroticBrownPercent >= 4.0, `Expected necrosis >= 4%, got ${result.necroticBrownPercent}%`);

  const anomalies = detectVisualAnomaliesFromHealth(result);
  assert(anomalies.some(a => a.type.includes('necrosis')), 'Expected necrosis anomaly');

  console.log(`  ✓ PASS: State = ${result.healthState}, Necrosis = ${result.necroticBrownPercent}%, Anomaly = "${anomalies[0]?.description}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 3:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 4: Canopy reduction (Relative contraction from baseline)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 4: Canopy reduction (Relative contraction from baseline)');
  resetPlantBaseline('plant_test_4');

  // Establish initial baseline: 18% canopy
  evaluatePlantHealthWithBaseline('plant_test_4', {
    canopyCoveragePercent: 18.0,
    chlorosisYellowPercent: 2.0,
    necroticBrownPercent: 1.0,
    vibrantGreenPercent: 97.0,
    avgTextureGradient: 18.0,
    aspectRatio: 1.1,
    canopyDensity: 0.65,
    timestamp: Date.now() - 86400000,
  }, 'HEALTHY');

  // Second observation: canopy dropped to 10% (-44% relative drop)
  const eval2 = evaluatePlantHealthWithBaseline('plant_test_4', {
    canopyCoveragePercent: 10.0,
    chlorosisYellowPercent: 3.0,
    necroticBrownPercent: 1.0,
    vibrantGreenPercent: 96.0,
    avgTextureGradient: 18.0,
    aspectRatio: 1.1,
    canopyDensity: 0.65,
    timestamp: Date.now(),
  }, 'STABLE');

  assert(eval2.deltas !== null, 'Expected deltas to exist');
  assert(eval2.deltas.relativeCanopyChangePercent <= -30.0, `Expected <= -30% change, got ${eval2.deltas.relativeCanopyChangePercent}%`);
  assert(eval2.anomalies.some(a => a.includes('contraction') || a.includes('collapse') || a.includes('Canopy')), 'Expected canopy anomaly');

  console.log(`  ✓ PASS: Relative Canopy Delta = ${eval2.deltas.relativeCanopyChangePercent}%, Anomaly = "${eval2.anomalies[0]}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 4:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 5: Stable plant across repeated scans (Zero false anomalies)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 5: Stable plant across repeated scans (Zero false anomalies)');
  resetPlantBaseline('plant_test_5');

  const stableObs = {
    canopyCoveragePercent: 15.0,
    chlorosisYellowPercent: 2.5,
    necroticBrownPercent: 0.8,
    vibrantGreenPercent: 96.7,
    avgTextureGradient: 19.0,
    aspectRatio: 1.15,
    canopyDensity: 0.62,
    timestamp: Date.now(),
  };

  let lastEval = null;
  for (let i = 0; i < 5; i++) {
    lastEval = evaluatePlantHealthWithBaseline('plant_test_5', {
      ...stableObs,
      timestamp: Date.now() + i * 5000,
    }, 'HEALTHY');
  }

  assert(lastEval.healthState === 'HEALTHY' || lastEval.healthState === 'STABLE', `Expected HEALTHY/STABLE, got ${lastEval.healthState}`);
  assert(lastEval.anomalyDetected === false, 'Expected zero false anomalies');
  assert(lastEval.deltas.hasMeaningfulChange === false, 'Expected no meaningful drift');

  console.log(`  ✓ PASS: Evaluated 5 consecutive scans -> Final State = ${lastEval.healthState}, Anomalies = 0, Summary: "${lastEval.deltas.changeSummary}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 5:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 6: Single noisy frame (Temporal smoothing prevents false critical state)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 6: Single noisy frame (Temporal smoothing prevents false critical state)');
  resetPlantBaseline('plant_test_6');

  // Plant is healthy across 3 observations
  for (let i = 0; i < 3; i++) {
    evaluatePlantHealthWithBaseline('plant_test_6', {
      canopyCoveragePercent: 14.0,
      chlorosisYellowPercent: 2.0,
      necroticBrownPercent: 0.5,
      vibrantGreenPercent: 97.5,
      avgTextureGradient: 18.0,
      aspectRatio: 1.1,
      canopyDensity: 0.60,
      timestamp: Date.now() - (4 - i) * 60000,
    }, 'HEALTHY');
  }

  // Frame 4: Sudden transient noise spike (e.g. shadow / lighting flicker giving 13% yellowing)
  const noisyEval = evaluatePlantHealthWithBaseline('plant_test_6', {
    canopyCoveragePercent: 14.0,
    chlorosisYellowPercent: 13.5, // single transient frame
    necroticBrownPercent: 0.5,
    vibrantGreenPercent: 86.0,
    avgTextureGradient: 18.0,
    aspectRatio: 1.1,
    canopyDensity: 0.60,
    timestamp: Date.now(),
  }, 'ATTENTION');

  // Temporal smoothing should NOT jump to CRITICAL; it buffers state
  assert(noisyEval.smoothedState !== 'CRITICAL', `Temporal smoothing should prevent premature critical state`);

  console.log(`  ✓ PASS: Single frame spike buffered -> Smoothed State = ${noisyEval.smoothedState} (Prevented abrupt critical trigger)`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 6:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 7: No plant in frame (Gating strictly blocks analysis)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 7: No plant in frame (Gating strictly blocks analysis)');

  // Empty uniform neutral background
  const emptyFrame = createSyntheticFrame(() => [40, 40, 42]);
  const result = analyzeVisualPlantHealth(emptyFrame);

  assert(result.healthState === 'UNKNOWN', `Expected UNKNOWN, got ${result.healthState}`);
  assert(result.visualHealthScore === 0, `Expected score 0, got ${result.visualHealthScore}`);
  assert(result.statusText.includes('No plant detected') || result.statusText.includes('not detected'), `Expected no plant message`);

  console.log(`  ✓ PASS: Health State = ${result.healthState}, Score = ${result.visualHealthScore}, Message = "${result.statusText}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 7:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 8: Blurred plant frame (Quality gating returns UNKNOWN, not CRITICAL)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 8: Blurred plant frame (Quality gating returns UNKNOWN, not CRITICAL)');

  // Smeared / out-of-focus plant frame: high contrast with background, but smooth blur (sharpness < 5.0)
  const blurredFrame = createSyntheticFrame((x, y) => {
    const dx = x - 80;
    const dy = y - 60;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 40) {
      const factor = 0.5 * (1 + Math.cos((dist / 40) * Math.PI));
      const r = Math.round(175 * (1 - factor) + 40 * factor);
      const g = Math.round(175 * (1 - factor) + 145 * factor);
      const b = Math.round(170 * (1 - factor) + 45 * factor);
      return [r, g, b];
    }
    return [175, 175, 170];
  });

  const result = analyzeVisualPlantHealth(blurredFrame);
  assert(result.healthState === 'UNKNOWN', `Blurry frame must return UNKNOWN, not ${result.healthState}`);
  assert(result.statusText.includes('blurry') || result.statusText.includes('Focus') || result.statusText.includes('Blur'), `Expected blur guidance, got: "${result.statusText}"`);

  console.log(`  ✓ PASS: Blurry frame returned State = ${result.healthState}, Message: "${result.statusText}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 8:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 9: Dark image (Optical quality gating: Luma < 30)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 9: Dark image (Optical quality gating: Luma < 30)');

  const darkFrame = createSyntheticFrame(() => [15, 18, 15]); // mean luma ~16
  const result = analyzeVisualPlantHealth(darkFrame);

  assert(result.healthState === 'UNKNOWN', `Underexposed frame must return UNKNOWN, got ${result.healthState}`);
  assert(result.statusText.includes('dark'), `Expected dark guidance message`);

  console.log(`  ✓ PASS: Underexposed frame returned State = ${result.healthState}, Message: "${result.statusText}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 9:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 10: Partially occluded / small plant (< 2.5% canopy)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 10: Partially occluded / small plant (< 2.5% canopy)');

  // Tiny foliage dot in center (only ~0.4% of frame)
  const tinyFrame = createSyntheticFrame((x, y) => {
    const dx = x - 80;
    const dy = y - 60;
    if (dx * dx + dy * dy < 25) { // 5px radius = ~80 pixels = ~0.4%
      return [40, 160, 45];
    }
    return [175, 175, 170];
  });

  const result = analyzeVisualPlantHealth(tinyFrame);
  assert(result.healthState === 'UNKNOWN', `Tiny plant must return UNKNOWN, got ${result.healthState}`);

  console.log(`  ✓ PASS: Sub-threshold canopy returned State = ${result.healthState}, Message: "${result.statusText}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 10:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 11: Unknown species (Species-independent analysis)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 11: Unknown species (Species-independent analysis)');
  resetPlantBaseline('plant_test_11');

  const evalUnknown = evaluatePlantHealthWithBaseline('plant_test_11', {
    canopyCoveragePercent: 12.0,
    chlorosisYellowPercent: 4.0,
    necroticBrownPercent: 1.0,
    vibrantGreenPercent: 95.0,
    avgTextureGradient: 20.0,
    aspectRatio: 1.0,
    canopyDensity: 0.60,
    timestamp: Date.now(),
    speciesKey: undefined, // unclassified species
  }, 'HEALTHY');

  assert(evalUnknown.healthState === 'HEALTHY' || evalUnknown.healthState === 'STABLE', 'Expected healthy evaluation');

  console.log(`  ✓ PASS: Evaluated species-independent profile -> State = ${evalUnknown.healthState}`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 11:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 12: Known species (Species-aware calibration)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 12: Known species (Species-aware calibration for Curly Kale)');
  resetPlantBaseline('plant_test_12');

  const kaleProfile = SPECIES_VISUAL_PROFILES['curly_kale'];
  assert(kaleProfile !== undefined, 'Expected kale profile to exist');

  // Kale naturally has higher texture gradient (frilled margins ~36)
  const evalKale = evaluatePlantHealthWithBaseline('plant_test_12', {
    canopyCoveragePercent: 15.0,
    chlorosisYellowPercent: 2.0,
    necroticBrownPercent: 0.5,
    vibrantGreenPercent: 97.5,
    avgTextureGradient: 34.0, // High natural frill texture
    aspectRatio: 1.0,
    canopyDensity: 0.65,
    timestamp: Date.now(),
    speciesKey: 'curly_kale',
  }, 'HEALTHY');

  assert(evalKale.healthState === 'HEALTHY', `Kale with natural frilled texture should remain HEALTHY, got ${evalKale.healthState}`);

  console.log(`  ✓ PASS: Curly Kale evaluated with expected texture tolerance (${kaleProfile.expectedTextureGradient}) -> State = ${evalKale.healthState}`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 12:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 13: Insufficient history (No fake changes)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 13: Insufficient history (No fake changes)');
  resetPlantBaseline('plant_test_13');

  const baseline = getOrCreatePlantBaseline('plant_test_13');
  const deltas = compareAgainstPlantBaseline(baseline, {
    canopyCoveragePercent: 12.0,
    chlorosisYellowPercent: 3.0,
    necroticBrownPercent: 1.0,
    vibrantGreenPercent: 96.0,
    avgTextureGradient: 18.0,
    aspectRatio: 1.0,
    canopyDensity: 0.6,
    timestamp: Date.now(),
  });

  assert(deltas === null, 'Deltas must be null on zero history');

  const memory = answerPlantMemoryQueries([], 'Sweet Basil');
  assert(memory.howHasPlantChanged.includes('Initial observation recorded'), 'Expected baseline explanation');

  console.log(`  ✓ PASS: Single initial check produces zero fabricated deltas: "${memory.howHasPlantChanged}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 13:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 14: Historical comparison (Real calculated changes)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 14: Historical comparison (Real calculated changes)');
  resetPlantBaseline('plant_test_14');

  const now = Date.now();
  const obsHistory = [
    {
      id: 'obs_1',
      plantId: 'plant_test_14',
      timestamp: now - 86400000 * 3,
      cameraActive: true,
      isPlantDetected: true,
      canopyCoveragePercent: 10.0,
      ph: 6.0,
      tds: 1000,
      waterLevel: 90,
      telemetryMode: 'real',
      isTelemetryStale: false,
      overallHealthScore: 85,
      anomalyDetected: false,
    },
    {
      id: 'obs_2',
      plantId: 'plant_test_14',
      timestamp: now,
      cameraActive: true,
      isPlantDetected: true,
      canopyCoveragePercent: 14.5, // +4.5% expansion
      ph: 6.2,
      tds: 980,
      waterLevel: 82,
      telemetryMode: 'real',
      isTelemetryStale: false,
      overallHealthScore: 88,
      anomalyDetected: false,
    },
  ];

  const growth = computeGrowthEstimates(obsHistory);
  assert(growth.cumulativeGrowthDelta === 4.5, `Expected +4.5% delta, got ${growth.cumulativeGrowthDelta}`);
  assert(growth.growthState === 'expanding', `Expected expanding state, got ${growth.growthState}`);

  const memory = answerPlantMemoryQueries(obsHistory, 'Sweet Basil');
  assert(memory.howHasPlantChanged.includes('+4.5%'), 'Expected +4.5% in memory answer');

  console.log(`  ✓ PASS: Cumulative Growth Delta = +${growth.cumulativeGrowthDelta}%, State = ${growth.growthState}, Memory: "${memory.howHasPlantChanged.slice(0, 80)}..."`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 14:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 15: Farmer Mode English (Simple non-technical copy)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 15: Farmer Mode English (Simple non-technical copy)');

  const stateHealthy = deriveFarmerSemanticState({
    isTelemetryAvailable: true,
    latestReading: { ph: 6.0, tds: 1050, waterLevel: 80, distance: 20 },
    environmentalAssessment: {
      timestamp: Date.now(),
      phScore: 95,
      tdsScore: 92,
      waterLevelScore: 90,
      compositeEnvironmentalScore: 92,
      phStatus: 'optimal',
      tdsStatus: 'optimal',
      waterLevelStatus: 'optimal',
    },
    multimodalAssessment: {
      timestamp: Date.now(),
      overallScore: 90,
      visualState: 'HEALTHY',
      environmentalState: 'optimal',
      overallHealthState: 'optimal',
      trend: 'stable',
      anomalies: [],
      observations: [],
      interpretations: [],
      explanations: [],
      confidence: 90,
    },
    latestDetection: {
      isPlantDetected: true,
      state: 'PLANT_DETECTED',
      plantPresenceScore: 95,
      canopyCoveragePercent: 14.0,
      vegetationIndex: 0.12,
      confidence: 95,
      confidenceLevel: 'high',
      userMessage: 'Plant detected',
      statusText: 'Plant detected',
      timestamp: Date.now(),
    },
    latestVisualHealth: {
      visualHealthScore: 92,
      healthState: 'HEALTHY',
      qualitativeConfidence: 'high',
      breakdown: { colorConditionScore: 95, surfaceUniformityScore: 90, canopyVigorScore: 90, anomalyPenaltyScore: 100 },
      indicators: [],
      vibrantGreenPercent: 96.0,
      chlorosisYellowPercent: 2.0,
      necroticBrownPercent: 0.5,
      canopyCoveragePercent: 14.0,
      avgTextureGradient: 18.0,
      aspectRatio: 1.1,
      canopyDensity: 0.6,
      inferenceTimeMs: 12,
      timestamp: Date.now(),
      statusText: 'Healthy foliage',
    },
    activeAnomalies: [],
    isCameraActive: true,
    language: 'en',
  });

  assert(stateHealthy.visualHealthStatus === 'HEALTHY', 'Expected visualHealthStatus = HEALTHY');
  assert(stateHealthy.visualHealthMessage === 'Your plant looks healthy 🌱', `Unexpected message: ${stateHealthy.visualHealthMessage}`);

  console.log(`  ✓ PASS: English copy verified: Status = "${stateHealthy.visualHealthStatus}" -> "${stateHealthy.visualHealthMessage}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 15:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 16: Farmer Mode Kannada (Natural Kannada translation)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 16: Farmer Mode Kannada (Natural Kannada translation)');

  const stateKn = deriveFarmerSemanticState({
    isTelemetryAvailable: true,
    latestReading: { ph: 6.0, tds: 1050, waterLevel: 80, distance: 20 },
    environmentalAssessment: {
      timestamp: Date.now(),
      phScore: 95,
      tdsScore: 92,
      waterLevelScore: 90,
      compositeEnvironmentalScore: 92,
      phStatus: 'optimal',
      tdsStatus: 'optimal',
      waterLevelStatus: 'optimal',
    },
    multimodalAssessment: {
      timestamp: Date.now(),
      overallScore: 90,
      visualState: 'HEALTHY',
      environmentalState: 'optimal',
      overallHealthState: 'optimal',
      trend: 'stable',
      anomalies: [],
      observations: [],
      interpretations: [],
      explanations: [],
      confidence: 90,
    },
    latestDetection: {
      isPlantDetected: true,
      state: 'PLANT_DETECTED',
      plantPresenceScore: 95,
      canopyCoveragePercent: 14.0,
      vegetationIndex: 0.12,
      confidence: 95,
      confidenceLevel: 'high',
      userMessage: 'Plant detected',
      statusText: 'Plant detected',
      timestamp: Date.now(),
    },
    latestVisualHealth: {
      visualHealthScore: 92,
      healthState: 'HEALTHY',
      qualitativeConfidence: 'high',
      breakdown: { colorConditionScore: 95, surfaceUniformityScore: 90, canopyVigorScore: 90, anomalyPenaltyScore: 100 },
      indicators: [],
      vibrantGreenPercent: 96.0,
      chlorosisYellowPercent: 2.0,
      necroticBrownPercent: 0.5,
      canopyCoveragePercent: 14.0,
      avgTextureGradient: 18.0,
      aspectRatio: 1.1,
      canopyDensity: 0.6,
      inferenceTimeMs: 12,
      timestamp: Date.now(),
      statusText: 'Healthy foliage',
    },
    activeAnomalies: [],
    isCameraActive: true,
    language: 'kn',
  });

  assert(stateKn.visualHealthMessage === 'ನಿಮ್ಮ ಗಿಡ ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತಿದೆ 🌱', `Unexpected Kannada message: ${stateKn.visualHealthMessage}`);

  console.log(`  ✓ PASS: Kannada copy verified: "${stateKn.visualHealthMessage}"`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 16:`, err.message);
}

// ---------------------------------------------------------------------------
// TEST 17: Technical Mode (Exposes real diagnostic metrics)
// ---------------------------------------------------------------------------
try {
  console.log('\nTEST 17: Technical Mode (Exposes real diagnostic metrics)');
  resetPlantBaseline('plant_test_17');

  const diagFrame = createSyntheticFrame((x, y) => {
    const inCluster = x >= 45 && x <= 115 && y >= 25 && y <= 95;
    if (inCluster) {
      const leafPattern = (Math.sin(x * 0.45) * Math.cos(y * 0.45)) > -0.05;
      if (leafPattern) {
        const marginEdge = ((x + y) % 4 === 0) ? 22 : 0;
        return [35 + marginEdge, 155 + marginEdge, 45];
      }
    }
    return [175, 175, 170];
  });

  const result = analyzeVisualPlantHealth(diagFrame, { plantId: 'plant_test_17' });

  assert(result.visualHealthScore >= 0 && result.visualHealthScore <= 100, 'Score in 0-100');
  assert(result.chlorosisYellowPercent !== undefined, 'Chlorosis % exposed');
  assert(result.necroticBrownPercent !== undefined, 'Necrosis % exposed');
  assert(result.canopyCoveragePercent !== undefined, 'Canopy % exposed');
  assert(result.avgTextureGradient !== undefined, 'Texture gradient exposed');
  assert(result.aspectRatio !== undefined, 'Aspect ratio exposed');
  assert(result.inferenceTimeMs !== undefined, 'Inference time exposed');

  console.log(`  ✓ PASS: Diagnostic metrics exposed:`);
  console.log(`    State: ${result.healthState} | Score: ${result.visualHealthScore} | Chlorosis: ${result.chlorosisYellowPercent}%`);
  console.log(`    Necrosis: ${result.necroticBrownPercent}% | TextureGrad: ${result.avgTextureGradient} | AspectRatio: ${result.aspectRatio}`);
  console.log(`    Latency: ${result.inferenceTimeMs}ms | Confidence: ${result.qualitativeConfidence}`);
  passedTests++;
} catch (err) {
  console.error(`  ✗ FAIL TEST 17:`, err.message);
}

console.log('\n================================================================');
console.log(`Results: ${passedTests} / ${totalTests} verification tests passed.`);
console.log('================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
} else {
  process.exit(0);
}
