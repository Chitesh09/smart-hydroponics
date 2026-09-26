#!/usr/bin/env node
// ============================================================================
// HydroSmart Phase 6 — Multimodal Plant Reasoning Automated Verification Suite
// 16 Required Scenarios:
// 1. Stable Equilibrium
// 2. Low Water + Visual Wilting (Correlated Stress)
// 3. Low pH + Visual Chlorosis (Correlated Stress)
// 4. High TDS + Necrotic Margins (Correlated Stress)
// 5. Visual Chlorosis ONLY (Sensors Normal)
// 6. Sensor Anomaly ONLY (Foliage Healthy)
// 7. Conflicting Evidence (Visual Severe + Sensors Perfect)
// 8. Sensor Disconnected (Camera Healthy)
// 9. Sensor Disconnected (Camera Chlorosis)
// 10. Camera Unavailable (Sensors Online)
// 11. No Plant Detected (Camera Online)
// 12. Poor Image Quality (Optical Blur / Low Light)
// 13. Insufficient History (First Observation, Visual Discoloration)
// 14. Recovering Plant Trajectory
// 15. Species Identity Decoupled from Health
// 16. Bilingual Output Integrity (English & Kannada)
// ============================================================================

import { runMultimodalPlantReasoning } from '../lib/intelligence/multimodalReasoningEngine.ts';
import { DEFAULT_CROP_PROFILE } from '../lib/intelligence/healthScore.ts';
import { getFarmerCopy } from '../lib/intelligence/farmerSemanticLayer.ts';

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
console.log('HydroSmart Phase 6 — Multimodal Plant Reasoning Engine Test Suite');
console.log('================================================================\n');

const BASE_PLANT_ID = 'test-plant-001';

const defaultDetection = {
  isPlantDetected: true,
  state: 'PLANT_DETECTED',
  confidence: 85,
  confidenceLevel: 'high',
  canopyCoveragePercent: 35,
  vegetationIndex: 0.45,
  sharpnessScore: 12.5,
  meanLuma: 130,
  userMessage: 'Plant detected',
  timestamp: Date.now(),
};

const defaultVisualHealth = {
  healthState: 'STABLE',
  visualHealthScore: 92,
  chlorosisYellowPercent: 0,
  necroticBrownPercent: 0,
  canopyCoveragePercent: 35,
  avgTextureGradient: 0.15,
  qualitativeConfidence: 'high',
  confidenceScore: 90,
  indicators: [],
  breakdown: {
    colorConditionScore: 100,
    canopyDensityScore: 90,
    textureGradientScore: 85,
    leafIntegrityScore: 95,
  },
  timestamp: Date.now(),
};

const defaultCropIdentity = {
  plantId: BASE_PLANT_ID,
  cropKey: 'basil_genovese',
  commonName: 'Sweet Basil',
  scientificName: 'Ocimum basilicum',
  family: 'Lamiaceae',
  confidence: 88,
  identificationTimestamp: Date.now(),
  plantedTimestamp: Date.now() - 86400000 * 10,
  growthStage: 'vegetative',
  targetProfile: DEFAULT_CROP_PROFILE,
};

const defaultSensorReading = {
  ph: 6.0,
  tds: 850,
  waterLevel: 75,
  distance: 12,
  timestamp: Date.now(),
};

// ----------------------------------------------------------------------------
// SCENARIO 1: Stable Equilibrium
// ----------------------------------------------------------------------------
console.log('Test 1: Stable Equilibrium');
{
  const obsHistory = [
    { id: '1', timestamp: Date.now() - 40000, waterLevel: 76, ph: 6.0, tds: 850, canopyCoveragePercent: 35 },
    { id: '2', timestamp: Date.now() - 30000, waterLevel: 76, ph: 6.0, tds: 850, canopyCoveragePercent: 35 },
    { id: '3', timestamp: Date.now() - 20000, waterLevel: 75, ph: 6.0, tds: 850, canopyCoveragePercent: 35 },
    { id: '4', timestamp: Date.now() - 10000, waterLevel: 75, ph: 6.0, tds: 850, canopyCoveragePercent: 35 },
    { id: '5', timestamp: Date.now(), waterLevel: 75, ph: 6.0, tds: 850, canopyCoveragePercent: 35 },
  ];

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: defaultVisualHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: obsHistory,
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'STABLE_EQUILIBRIUM', `Scenario code is STABLE_EQUILIBRIUM (got ${result.scenarioCode})`);
  assert(result.plantState === 'HEALTHY', `Plant state is HEALTHY (got ${result.plantState})`);
  assert(result.confidence === 'high', `Confidence is high (got ${result.confidence})`);
  assert(result.observations.length > 0, `Observations describe baseline state (${result.observations.length} items)`);
  assert(!result.recommendations.some(r => r.toLowerCase().includes('urgent')), 'No urgent recommendations emitted');
}

// ----------------------------------------------------------------------------
// SCENARIO 2: Low Water + Visual Wilting (Correlated Stress)
// ----------------------------------------------------------------------------
console.log('\nTest 2: Low Water + Visual Wilting (Correlated Stress)');
{
  const wiltingDetection = { ...defaultDetection, canopyCoveragePercent: 18 };
  const wiltingHealth = { ...defaultVisualHealth, healthState: 'ATTENTION', visualHealthScore: 68, canopyCoveragePercent: 18 };
  const lowWaterSensor = { ...defaultSensorReading, waterLevel: 18 };
  const sensorHist = [
    { ...defaultSensorReading, waterLevel: 45, timestamp: Date.now() - 30000 },
    { ...defaultSensorReading, waterLevel: 30, timestamp: Date.now() - 15000 },
    lowWaterSensor,
  ];

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: wiltingDetection,
    visualHealth: wiltingHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: lowWaterSensor,
    sensorHistory: sensorHist,
    observationHistory: [
      { id: '1', timestamp: Date.now() - 30000, waterLevel: 45, canopyCoveragePercent: 32 },
      { id: '2', timestamp: Date.now() - 15000, waterLevel: 30, canopyCoveragePercent: 26 },
      { id: '3', timestamp: Date.now(), waterLevel: 18, canopyCoveragePercent: 18 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'CORRELATED_ENVIRONMENTAL_STRESS', `Scenario code is CORRELATED_ENVIRONMENTAL_STRESS (got ${result.scenarioCode})`);
  assert(result.plantState === 'CRITICAL' || result.plantState === 'ATTENTION', `Plant state indicates stress (got ${result.plantState})`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('water') || r.toLowerCase().includes('reservoir') || r.toLowerCase().includes('refill')), 'Emits water-level refill recommendation');
  assert(result.interpretations.some(i => i.toLowerCase().includes('water') && (i.toLowerCase().includes('temporal') || i.toLowerCase().includes('period') || i.toLowerCase().includes('decreasing'))), 'Temporal association noted in interpretations');
}

// ----------------------------------------------------------------------------
// SCENARIO 3: Low pH + Visual Chlorosis (Correlated Stress)
// ----------------------------------------------------------------------------
console.log('\nTest 3: Low pH + Visual Chlorosis (Correlated Stress)');
{
  const chlorosisHealth = {
    ...defaultVisualHealth,
    healthState: 'ATTENTION',
    chlorosisYellowPercent: 14,
    visualHealthScore: 72,
  };
  const lowPhSensor = { ...defaultSensorReading, ph: 4.8, tds: 900, waterLevel: 70 };
  const sensorHist = [
    { ...defaultSensorReading, ph: 5.6, timestamp: Date.now() - 30000 },
    { ...defaultSensorReading, ph: 5.2, timestamp: Date.now() - 15000 },
    lowPhSensor,
  ];

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: chlorosisHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: lowPhSensor,
    sensorHistory: sensorHist,
    observationHistory: [
      { id: '1', timestamp: Date.now() - 20000, ph: 5.5, visualHealthScore: 88 },
      { id: '2', timestamp: Date.now(), ph: 4.8, visualHealthScore: 72 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'CORRELATED_ENVIRONMENTAL_STRESS', `Scenario code is CORRELATED_ENVIRONMENTAL_STRESS (got ${result.scenarioCode})`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('ph') || r.toLowerCase().includes('buffer')), 'Emits pH adjustment recommendation');
  assert(result.interpretations.some(i => i.toLowerCase().includes('ph') && (i.toLowerCase().includes('yellowing') || i.toLowerCase().includes('associated'))), 'Chlorosis-pH associative non-causal language noted');
}

// ----------------------------------------------------------------------------
// SCENARIO 4: High TDS + Necrotic Margins (Correlated Stress)
// ----------------------------------------------------------------------------
console.log('\nTest 4: High TDS + Necrotic Margins (Correlated Stress)');
{
  const necrosisHealth = {
    ...defaultVisualHealth,
    healthState: 'ATTENTION',
    necroticBrownPercent: 6,
    visualHealthScore: 70,
  };
  const highTdsSensor = { ...defaultSensorReading, tds: 1650, ph: 6.2, waterLevel: 60 };

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: necrosisHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: highTdsSensor,
    sensorHistory: [highTdsSensor],
    observationHistory: [
      { id: '1', timestamp: Date.now() - 20000, tds: 1200 },
      { id: '2', timestamp: Date.now(), tds: 1650 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'CORRELATED_ENVIRONMENTAL_STRESS', `Scenario code is CORRELATED_ENVIRONMENTAL_STRESS (got ${result.scenarioCode})`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('dilute') || r.toLowerCase().includes('tds') || r.toLowerCase().includes('water')), 'Emits nutrient dilution recommendation');
}

// ----------------------------------------------------------------------------
// SCENARIO 5: Visual Chlorosis ONLY (Sensors Normal)
// ----------------------------------------------------------------------------
console.log('\nTest 5: Visual Chlorosis ONLY (Sensors Normal)');
{
  const chlorosisOnlyHealth = {
    ...defaultVisualHealth,
    healthState: 'ATTENTION',
    chlorosisYellowPercent: 12,
    visualHealthScore: 74,
  };
  const normalSensor = { ...defaultSensorReading, ph: 6.1, tds: 880, waterLevel: 72 };

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: chlorosisOnlyHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: normalSensor,
    sensorHistory: [normalSensor],
    observationHistory: [
      { id: '1', timestamp: Date.now() - 20000, visualHealthScore: 88 },
      { id: '2', timestamp: Date.now(), visualHealthScore: 74 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'VISUAL_CHANGE_ONLY', `Scenario code is VISUAL_CHANGE_ONLY (got ${result.scenarioCode})`);
  assert(result.plantState === 'ATTENTION', `Plant state is ATTENTION (got ${result.plantState})`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('lighting') || r.toLowerCase().includes('root') || r.toLowerCase().includes('surfaces') || r.toLowerCase().includes('manually')), 'Recommends checking lighting, lamp height, or root microclimate');
  assert(!result.primaryFarmerWhy.toLowerCase().includes('ph was wrong') && !result.primaryFarmerWhy.toLowerCase().includes('tds was high'), 'Does NOT falsely blame pH or TDS');
}

// ----------------------------------------------------------------------------
// SCENARIO 6: Sensor Anomaly ONLY (Foliage Healthy)
// ----------------------------------------------------------------------------
console.log('\nTest 6: Sensor Anomaly ONLY (Foliage Healthy)');
{
  const healthyPlantDetection = { ...defaultDetection, canopyCoveragePercent: 40 };
  const alkalineSensor = { ...defaultSensorReading, ph: 7.8, tds: 850, waterLevel: 70 };

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: healthyPlantDetection,
    visualHealth: defaultVisualHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: alkalineSensor,
    sensorHistory: [alkalineSensor],
    observationHistory: [
      { id: '1', timestamp: Date.now() - 20000, ph: 6.8 },
      { id: '2', timestamp: Date.now(), ph: 7.8 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'ENVIRONMENTAL_ANOMALY_ONLY', `Scenario code is ENVIRONMENTAL_ANOMALY_ONLY (got ${result.scenarioCode})`);
  assert(result.plantState === 'ATTENTION', `Plant state is ATTENTION (got ${result.plantState})`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('ph') || r.toLowerCase().includes('buffer')), 'Recommends pH adjustment');
  assert(result.interpretations.some(i => i.toLowerCase().includes('foliage') && (i.toLowerCase().includes('health') || i.toLowerCase().includes('buffer') || i.toLowerCase().includes('unaffected'))), 'Notes foliage is currently unaffected (buffer capacity)');
}

// ----------------------------------------------------------------------------
// SCENARIO 7: Conflicting Evidence (Visual Severe + Sensors Perfect)
// ----------------------------------------------------------------------------
console.log('\nTest 7: Conflicting Evidence (Visual Severe + Sensors Perfect)');
{
  const severeHealth = {
    ...defaultVisualHealth,
    healthState: 'CRITICAL',
    chlorosisYellowPercent: 25,
    visualHealthScore: 48,
  };
  const perfectSensors = { ...defaultSensorReading, ph: 6.0, tds: 850, waterLevel: 75 };

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: severeHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: perfectSensors,
    sensorHistory: [perfectSensors],
    observationHistory: [
      { id: '1', timestamp: Date.now() - 20000, visualHealthScore: 70 },
      { id: '2', timestamp: Date.now(), visualHealthScore: 48 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'CONFLICTING_EVIDENCE', `Scenario code is CONFLICTING_EVIDENCE (got ${result.scenarioCode})`);
  assert(result.conflictingSignals.length > 0, `Conflicting signals recorded (${result.conflictingSignals.length} items)`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('root') || r.toLowerCase().includes('calibration') || r.toLowerCase().includes('lighting')), 'Suggests cross-checking root health, lighting, or recalibrating sensors');
}

// ----------------------------------------------------------------------------
// SCENARIO 8: Sensor Disconnected (Camera Healthy)
// ----------------------------------------------------------------------------
console.log('\nTest 8: Sensor Disconnected (Camera Healthy)');
{
  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: defaultVisualHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: null,
    sensorHistory: [],
    observationHistory: [{ id: '1', timestamp: Date.now(), visualHealthScore: 92 }],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'SENSOR_UNAVAILABLE', `Scenario code is SENSOR_UNAVAILABLE (got ${result.scenarioCode})`);
  assert(result.plantState === 'STABLE', `Plant state is STABLE based on visual (got ${result.plantState})`);
  assert(result.limitations.some(l => l.toLowerCase().includes('sensor') && l.toLowerCase().includes('unavailable')), 'Limitation explicitly notes sensor data is unavailable');
  assert(result.sensorEvidence.ph.current === undefined, 'Does NOT fabricate pH values when disconnected');
  assert(result.sensorEvidence.tds.current === undefined, 'Does NOT fabricate TDS values when disconnected');
}

// ----------------------------------------------------------------------------
// SCENARIO 9: Sensor Disconnected (Camera Chlorosis)
// ----------------------------------------------------------------------------
console.log('\nTest 9: Sensor Disconnected (Camera Chlorosis)');
{
  const chlorosisHealth = {
    ...defaultVisualHealth,
    healthState: 'ATTENTION',
    chlorosisYellowPercent: 14,
    visualHealthScore: 70,
  };

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: chlorosisHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: null,
    sensorHistory: [],
    observationHistory: [{ id: '1', timestamp: Date.now(), visualHealthScore: 70 }],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'SENSOR_UNAVAILABLE', `Scenario code is SENSOR_UNAVAILABLE (got ${result.scenarioCode})`);
  assert(result.plantState === 'ATTENTION', `Plant state is ATTENTION (got ${result.plantState})`);
  assert(result.interpretations.some(i => i.toLowerCase().includes('sensor') || i.toLowerCase().includes('telemetry') || i.toLowerCase().includes('cannot be confirmed')), 'Interpretation notes root-zone chemistry unverified');
}

// ----------------------------------------------------------------------------
// SCENARIO 10: Camera Unavailable (Sensors Online)
// ----------------------------------------------------------------------------
console.log('\nTest 10: Camera Unavailable (Sensors Online)');
{
  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: null,
    visualHealth: null,
    cropIdentity: defaultCropIdentity,
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: [{ id: '1', timestamp: Date.now(), ph: 6.0, tds: 850, waterLevel: 75 }],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: false,
  });

  assert(result.scenarioCode === 'CAMERA_UNAVAILABLE', `Scenario code is CAMERA_UNAVAILABLE (got ${result.scenarioCode})`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('camera')), 'Prompts user to activate camera');
  assert(result.limitations.some(l => l.toLowerCase().includes('camera')), 'Limitations note visual state cannot be assessed');
}

// ----------------------------------------------------------------------------
// SCENARIO 11: No Plant Detected (Camera Online)
// ----------------------------------------------------------------------------
console.log('\nTest 11: No Plant Detected (Camera Online)');
{
  const noPlantDetection = {
    ...defaultDetection,
    isPlantDetected: false,
    state: 'NO_PLANT_DETECTED',
    canopyCoveragePercent: 0,
    confidence: 0,
  };

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: noPlantDetection,
    visualHealth: null,
    cropIdentity: defaultCropIdentity,
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: [],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'NO_PLANT_DETECTED', `Gate 0 triggered: scenarioCode is NO_PLANT_DETECTED (got ${result.scenarioCode})`);
  assert(result.plantState === 'UNKNOWN', `Plant state is UNKNOWN (got ${result.plantState})`);
  assert(result.confidence === 'insufficient_evidence', `Confidence is insufficient_evidence (got ${result.confidence})`);
  assert(!result.recommendations.some(r => r.toLowerCase().includes('fertilizer') || r.toLowerCase().includes('disease')), 'Zero plant-health/disease claims emitted');
}

// ----------------------------------------------------------------------------
// SCENARIO 12: Poor Image Quality (Optical Blur / Low Light)
// ----------------------------------------------------------------------------
console.log('\nTest 12: Poor Image Quality (Optical Blur / Low Light)');
{
  const blurDetection = {
    ...defaultDetection,
    state: 'SCAN_NOT_READY',
    sharpnessScore: 3.2,
    meanLuma: 25,
    userMessage: 'Camera view is blurry or lighting is poor.',
  };

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: blurDetection,
    visualHealth: null,
    cropIdentity: defaultCropIdentity,
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: [],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'POOR_IMAGE_QUALITY', `Gate 1 triggered: scenarioCode is POOR_IMAGE_QUALITY (got ${result.scenarioCode})`);
  assert(result.plantState === 'UNKNOWN', `Plant state is UNKNOWN (got ${result.plantState})`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('lens') || r.toLowerCase().includes('lighting') || r.toLowerCase().includes('camera')), 'Prompts camera/lighting adjustment');
  assert(!result.recommendations.some(r => r.toLowerCase().includes('fertilizer')), 'Does not guess plant health under poor optics');
}

// ----------------------------------------------------------------------------
// SCENARIO 13: Insufficient History (First Observation, Visual Discoloration)
// ----------------------------------------------------------------------------
console.log('\nTest 13: Insufficient History (First Observation, Visual Discoloration)');
{
  const mildChlorosisHealth = {
    ...defaultVisualHealth,
    healthState: 'ATTENTION',
    chlorosisYellowPercent: 7,
    visualHealthScore: 78,
  };

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: mildChlorosisHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: [
      { id: '1', timestamp: Date.now(), visualHealthScore: 78 } // Single snapshot: N=1
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'INSUFFICIENT_HISTORY', `Scenario code is INSUFFICIENT_HISTORY (got ${result.scenarioCode})`);
  assert(result.interpretations.some(i => i.toLowerCase().includes('not enough historical data') || i.toLowerCase().includes('progress')), 'Notes progression cannot be confirmed without baseline');
  assert(result.recommendations.some(r => r.toLowerCase().includes('subsequent') || r.toLowerCase().includes('observations') || r.toLowerCase().includes('log')), 'Schedules follow-up checkpoint');
}

// ----------------------------------------------------------------------------
// SCENARIO 14: Recovering Plant Trajectory
// ----------------------------------------------------------------------------
console.log('\nTest 14: Recovering Plant Trajectory');
{
  const recoveringHealth = {
    ...defaultVisualHealth,
    healthState: 'STABLE',
    chlorosisYellowPercent: 8,
    visualHealthScore: 86,
  };

  const obsHistory = [
    {
      id: '1',
      timestamp: Date.now() - 40000,
      visualScoreBreakdown: { colorConditionScore: 82 }, // chlorosis was 18%
      ph: 5.0,
      canopyCoveragePercent: 30,
    },
    {
      id: '2',
      timestamp: Date.now() - 30000,
      visualScoreBreakdown: { colorConditionScore: 86 },
      ph: 5.4,
      canopyCoveragePercent: 32,
    },
    {
      id: '3',
      timestamp: Date.now() - 20000,
      visualScoreBreakdown: { colorConditionScore: 90 },
      ph: 5.8,
      canopyCoveragePercent: 34,
    },
    {
      id: '4',
      timestamp: Date.now(),
      visualScoreBreakdown: { colorConditionScore: 92 }, // chlorosis is now 8% (delta: -10%)
      ph: 6.0,
      canopyCoveragePercent: 35,
    },
  ];

  const result = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: recoveringHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: obsHistory,
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(result.scenarioCode === 'RECOVERING_TRAJECTORY', `Scenario code is RECOVERING_TRAJECTORY (got ${result.scenarioCode})`);
  assert(result.plantState === 'HEALTHY', `Plant state recognized as HEALTHY / recovering (got ${result.plantState})`);
  assert(result.recommendations.some(r => r.toLowerCase().includes('maintain') || r.toLowerCase().includes('recovery')), 'Encourages continued maintenance');
}

// ----------------------------------------------------------------------------
// SCENARIO 15: Species Identity Decoupled from Health
// ----------------------------------------------------------------------------
console.log('\nTest 15: Species Identity Decoupled from Health');
{
  const chlorosisHealth = {
    ...defaultVisualHealth,
    healthState: 'ATTENTION',
    chlorosisYellowPercent: 15,
    visualHealthScore: 70,
  };

  const specimenA = runMultimodalPlantReasoning({
    plantId: 'plant-basil-01',
    detection: defaultDetection,
    visualHealth: chlorosisHealth,
    cropIdentity: { ...defaultCropIdentity, commonName: 'Sweet Basil', cropKey: 'basil_genovese' },
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: [
      { id: '1', timestamp: Date.now() - 20000, visualHealthScore: 70 },
      { id: '2', timestamp: Date.now(), visualHealthScore: 70 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  const specimenB = runMultimodalPlantReasoning({
    plantId: 'plant-unknown-02',
    detection: defaultDetection,
    visualHealth: chlorosisHealth,
    cropIdentity: { ...defaultCropIdentity, commonName: 'Unknown Plant', cropKey: 'unknown_plant', confidence: 0 },
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: [
      { id: '1', timestamp: Date.now() - 20000, visualHealthScore: 70 },
      { id: '2', timestamp: Date.now(), visualHealthScore: 70 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(specimenA.scenarioCode === specimenB.scenarioCode, `Both specimens trigger identical scenarioCode (${specimenA.scenarioCode})`);
  assert(specimenA.plantState === specimenB.plantState, `Both specimens trigger identical plantState (${specimenA.plantState})`);
  assert(specimenB.limitations.some(l => l.toLowerCase().includes('unclassified') || l.toLowerCase().includes('generalized')), 'Specimen B includes unclassified species limitation notice');
}

// ----------------------------------------------------------------------------
// SCENARIO 16: Bilingual Output Integrity (English & Kannada)
// ----------------------------------------------------------------------------
console.log('\nTest 16: Bilingual Output Integrity (English & Kannada)');
{
  const enCopy = getFarmerCopy('en');
  const knCopy = getFarmerCopy('kn');

  assert(typeof enCopy.actions.title === 'string' && enCopy.actions.title.length > 0, 'English copy contains actions title');
  assert(typeof knCopy.actions.title === 'string' && knCopy.actions.title.length > 0, 'Kannada copy contains actions title');

  // Verify Kannada strings are non-empty and non-machine gibberish
  assert(knCopy.plant.GOOD.includes('ಚೆನ್ನಾಗಿದೆ') || knCopy.plant.GOOD.includes('ಆರೋಗ್ಯಕರ') || knCopy.plant.GOOD.includes('ಉತ್ತಮ'), 'Kannada good plant message has natural phrasing');
  assert(knCopy.water.URGENT.includes('ನೀರು') || knCopy.actions.addWater.includes('ನೀರು'), 'Kannada water urgency references water naturally');

  // Verify farmerCopy exists on reasoning event
  const reasoningEvent = runMultimodalPlantReasoning({
    plantId: BASE_PLANT_ID,
    detection: defaultDetection,
    visualHealth: defaultVisualHealth,
    cropIdentity: defaultCropIdentity,
    sensorReading: defaultSensorReading,
    sensorHistory: [defaultSensorReading],
    observationHistory: [
      { id: '1', timestamp: Date.now() - 10000, waterLevel: 75 },
      { id: '2', timestamp: Date.now(), waterLevel: 75 },
    ],
    cropTargetProfile: DEFAULT_CROP_PROFILE,
    telemetryMode: 'real',
    isTelemetryStale: false,
    isCameraActive: true,
  });

  assert(Boolean(reasoningEvent.farmerCopy?.observableSummary), 'Reasoning event has valid observableSummary');
  assert(Boolean(reasoningEvent.farmerCopy?.whySummary), 'Reasoning event has valid whySummary');
  assert(Boolean(reasoningEvent.farmerCopy?.farmerAction), 'Reasoning event has valid farmerAction');
}

console.log('\n================================================================');
console.log(`Phase 6 Test Results: ${passedTests}/${totalTests} assertions passed (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('================================================================\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL 16 PHASE 6 MULTIMODAL REASONING SCENARIOS PASSED!\n');
  process.exit(0);
} else {
  console.error('❌ SOME ASSERTIONS FAILED.\n');
  process.exit(1);
}
