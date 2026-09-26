/**
 * HydroSmart — Phase 10: Confidence-Aware Plant Alert Engine Verification Suite
 * 
 * Tests 30 distinct scenarios verifying:
 * - Evidence-based generation from telemetry, vision, What Changed, and Phase 9 correlations
 * - Severity hierarchy (URGENT > ATTENTION > INFO)
 * - Temporal persistence & noise rejection (single frame / blip = NO ALERT)
 * - Missing data safety (never treated as zero or normal)
 * - Hysteresis buffer & debouncing
 * - Deduplication & lifecycle (DETECTED -> ACTIVE -> RESOLVED / DISMISSED)
 * - Scoped plantId isolation
 * - Multimodal synthesis without false causation
 * - Farmer & Technical presentations in English and Kannada
 */

import { evaluatePlantAlerts } from '../lib/intelligence/alertEngine.ts';
import {
  getStoredAlerts,
  saveStoredAlerts,
  dismissStoredAlert,
  acknowledgeStoredAlert,
  resolveStoredAlert,
  clearAllStoredAlerts,
} from '../lib/intelligence/alertStore.ts';
import {
  getLocalizedAlert,
  getLocalizedAlertSeverity,
  getLocalizedAlertCategory,
  getLocalizedAlertStatus,
} from '../lib/intelligence/farmerSemanticLayer.ts';
import { ALERT_CONFIG } from '../lib/intelligence/alertConfig.ts';

const DEFAULT_CROP = {
  name: 'Basil (Sweet Genovese)',
  phMin: 5.5,
  phMax: 6.5,
  tdsMin: 800,
  tdsMax: 1200,
  idealWaterLevelMin: 25,
};

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('\n================================================================');
console.log('HYDROSMART PHASE 10 — CONFIDENCE-AWARE ALERT ENGINE TEST SUITE');
console.log('================================================================\n');

// Clear storage before starting tests
clearAllStoredAlerts();

// -----------------------------------------------------------------------------
// Test 1: Healthy stable plant -> NO alerts
// -----------------------------------------------------------------------------
console.log('Test 1: Healthy stable plant generates no spurious alerts');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    observations: [
      {
        id: 'obs_1',
        plantId: 'plant_1',
        timestamp: Date.now() - 60000,
        cameraActive: true,
        isPlantDetected: true,
        visualHealthScore: 88,
        visualHealthState: 'HEALTHY',
        telemetryMode: 'real',
        isTelemetryStale: false,
      },
    ],
    latestDetection: {
      isPlantDetected: true,
      plantDetectionConfidence: 92,
      canopyCoveragePercent: 42,
    },
    latestVisualHealth: {
      visualHealthScore: 89,
      healthState: 'HEALTHY',
      chlorosisYellowPercent: 2.1,
      necroticBrownPercent: 0.8,
    },
    latestReading: { ph: 6.0, tds: 950, waterLevel: 65, timestamp: Date.now() },
    sensorHistory: [{ ph: 6.0, tds: 950, waterLevel: 65, timestamp: Date.now() }],
    isTelemetryStale: false,
    cropProfile: DEFAULT_CROP,
  });

  assert(summary.activeAlerts.length === 0, 'No active alerts on healthy plant');
  assert(summary.hasAnyAlert === false, 'hasAnyAlert is false');
  assert(summary.primaryAlert === null, 'primaryAlert is null');
}

// -----------------------------------------------------------------------------
// Test 2: One single noisy frame of visual stress -> NO ALERT (gated)
// -----------------------------------------------------------------------------
console.log('\nTest 2: Single noisy visual frame does not trigger alert (noise suppression)');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    // Previous observations were all healthy
    observations: [
      {
        id: 'obs_1',
        plantId: 'plant_1',
        timestamp: Date.now() - 120000,
        visualHealthScore: 85,
        visualHealthState: 'HEALTHY',
      },
      {
        id: 'obs_2',
        plantId: 'plant_1',
        timestamp: Date.now() - 60000,
        visualHealthScore: 86,
        visualHealthState: 'HEALTHY',
      },
    ],
    latestDetection: { isPlantDetected: true, plantDetectionConfidence: 85 },
    // Sudden single frame glitch with ATTENTION state
    latestVisualHealth: {
      visualHealthScore: 62,
      healthState: 'ATTENTION',
      chlorosisYellowPercent: 4.0,
      necroticBrownPercent: 1.0,
    },
    latestReading: { ph: 6.0, tds: 950, waterLevel: 65, timestamp: Date.now() },
    cropProfile: DEFAULT_CROP,
  });

  const healthAlert = summary.activeAlerts.find(a => a.category === 'PLANT_HEALTH');
  assert(!healthAlert, 'Single noisy frame of ATTENTION did not trigger PLANT_HEALTH alert');
}

// -----------------------------------------------------------------------------
// Test 3: Persistent visual deterioration -> PLANT_HEALTH alert
// -----------------------------------------------------------------------------
console.log('\nTest 3: Persistent visual deterioration triggers ATTENTION alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    observations: [
      {
        id: 'obs_1',
        plantId: 'plant_1',
        timestamp: Date.now() - 120000,
        visualHealthScore: 65,
        visualHealthState: 'ATTENTION',
      },
      {
        id: 'obs_2',
        plantId: 'plant_1',
        timestamp: Date.now() - 60000,
        visualHealthScore: 60,
        visualHealthState: 'ATTENTION',
      },
    ],
    latestDetection: { isPlantDetected: true, plantDetectionConfidence: 88 },
    latestVisualHealth: {
      visualHealthScore: 58,
      healthState: 'ATTENTION',
      chlorosisYellowPercent: 8.0,
      necroticBrownPercent: 2.0,
    },
    latestReading: { ph: 6.0, tds: 950, waterLevel: 65, timestamp: Date.now() },
    cropProfile: DEFAULT_CROP,
  });

  const healthAlert = summary.activeAlerts.find(a => a.category === 'PLANT_HEALTH');
  assert(Boolean(healthAlert), 'Persistent visual deterioration generated PLANT_HEALTH alert');
  assert(healthAlert?.severity === 'ATTENTION', 'Severity is ATTENTION');
  assert(healthAlert?.confidence === 'HIGH', 'Confidence is HIGH due to 88% detection confidence');
}

// -----------------------------------------------------------------------------
// Test 4: Persistent foliar chlorosis (yellowing >= 12%) -> VISUAL_ANOMALY alert
// -----------------------------------------------------------------------------
console.log('\nTest 4: Chlorosis >= 12% triggers VISUAL_ANOMALY alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    observations: [
      {
        id: 'obs_1',
        plantId: 'plant_1',
        timestamp: Date.now() - 60000,
        visualHealthState: 'ATTENTION',
      },
    ],
    latestDetection: { isPlantDetected: true, plantDetectionConfidence: 90 },
    latestVisualHealth: {
      visualHealthScore: 65,
      healthState: 'ATTENTION',
      chlorosisYellowPercent: 16.5,
      necroticBrownPercent: 1.0,
    },
    cropProfile: DEFAULT_CROP,
  });

  const chlorosisAlert = summary.activeAlerts.find(a => a.metric === 'chlorosis');
  assert(Boolean(chlorosisAlert), 'Chlorosis alert generated');
  assert(chlorosisAlert?.category === 'VISUAL_ANOMALY', 'Category is VISUAL_ANOMALY');
  assert(chlorosisAlert?.currentValue === '16.5%', 'Current value matches chlorosis percent');
}

// -----------------------------------------------------------------------------
// Test 5: Foliar necrosis (browning >= 4%) -> VISUAL_ANOMALY alert
// -----------------------------------------------------------------------------
console.log('\nTest 5: Necrosis >= 4% triggers VISUAL_ANOMALY alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestDetection: { isPlantDetected: true, plantDetectionConfidence: 85 },
    latestVisualHealth: {
      visualHealthScore: 68,
      healthState: 'ATTENTION',
      chlorosisYellowPercent: 3.0,
      necroticBrownPercent: 5.2,
    },
    cropProfile: DEFAULT_CROP,
  });

  const necrosisAlert = summary.activeAlerts.find(a => a.metric === 'necrosis');
  assert(Boolean(necrosisAlert), 'Necrosis alert generated');
  assert(necrosisAlert?.severity === 'ATTENTION', 'Severity is ATTENTION');
}

// -----------------------------------------------------------------------------
// Test 6: Canopy reduction (relative drop <= -15%) -> GROWTH alert
// -----------------------------------------------------------------------------
console.log('\nTest 6: Relative canopy area drop <= -15% triggers GROWTH alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestDetection: { isPlantDetected: true, plantDetectionConfidence: 80 },
    latestVisualHealth: {
      visualHealthScore: 72,
      healthState: 'STABLE',
      chlorosisYellowPercent: 2.0,
      necroticBrownPercent: 1.0,
      baselineDeltas: {
        canopyDeltaPercent: -8.0,
        relativeCanopyChangePercent: -22.5,
        chlorosisDeltaPercent: 1.0,
        necrosisDeltaPercent: 0.5,
        textureDelta: 0,
        hasMeaningfulChange: true,
        changeSummary: 'Canopy drop',
        detailedPoints: [],
      },
    },
    cropProfile: DEFAULT_CROP,
  });

  const growthAlert = summary.activeAlerts.find(a => a.category === 'GROWTH');
  assert(Boolean(growthAlert), 'Canopy contraction generated GROWTH alert');
  assert(growthAlert?.currentValue === '-22.5%', 'Current value indicates relative reduction');
}

// -----------------------------------------------------------------------------
// Test 7: pH deviation outside crop profile envelope -> PH alert
// -----------------------------------------------------------------------------
console.log('\nTest 7: Persistent pH deviation triggers PH alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 5.15, tds: 950, waterLevel: 60, timestamp: Date.now() },
    sensorHistory: [
      { ph: 5.25, timestamp: Date.now() - 30000 },
      { ph: 5.20, timestamp: Date.now() - 15000 },
      { ph: 5.15, timestamp: Date.now() },
    ],
    cropProfile: DEFAULT_CROP,
  });

  const phAlert = summary.activeAlerts.find(a => a.category === 'PH');
  assert(Boolean(phAlert), 'Low pH generated PH alert');
  assert(phAlert?.direction === 'falling', 'Direction is falling');
  assert(phAlert?.severity === 'ATTENTION', 'Severity is ATTENTION (deviation 0.35 < critical 0.6)');
}

// -----------------------------------------------------------------------------
// Test 8: TDS deviation above safe ceiling -> TDS alert
// -----------------------------------------------------------------------------
console.log('\nTest 8: TDS exceeding safe ceiling triggers TDS alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 6.0, tds: 1350, waterLevel: 60, timestamp: Date.now() },
    sensorHistory: [
      { tds: 1300, timestamp: Date.now() - 30000 },
      { tds: 1320, timestamp: Date.now() - 15000 },
      { tds: 1350, timestamp: Date.now() },
    ],
    cropProfile: DEFAULT_CROP,
  });

  const tdsAlert = summary.activeAlerts.find(a => a.category === 'TDS');
  assert(Boolean(tdsAlert), 'High TDS generated TDS alert');
  assert(tdsAlert?.direction === 'rising', 'Direction is rising');
}

// -----------------------------------------------------------------------------
// Test 9: Water level decline (< 25% warning, < 15% urgent)
// -----------------------------------------------------------------------------
console.log('\nTest 9: Water level decline creates warning and critical alerts');
{
  // 9A: Warning at 20%
  const summaryWarn = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 6.0, tds: 950, waterLevel: 20, timestamp: Date.now() },
    sensorHistory: [
      { waterLevel: 22, timestamp: Date.now() - 30000 },
      { waterLevel: 21, timestamp: Date.now() - 15000 },
      { waterLevel: 20, timestamp: Date.now() },
    ],
    cropProfile: DEFAULT_CROP,
  });
  const waterWarn = summaryWarn.activeAlerts.find(a => a.category === 'WATER_LEVEL');
  assert(waterWarn?.severity === 'ATTENTION', 'WaterLevel at 20% is ATTENTION');

  // 9B: Critical at 12%
  const summaryCrit = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 6.0, tds: 950, waterLevel: 12, timestamp: Date.now() },
    sensorHistory: [
      { waterLevel: 14, timestamp: Date.now() - 30000 },
      { waterLevel: 13, timestamp: Date.now() - 15000 },
      { waterLevel: 12, timestamp: Date.now() },
    ],
    cropProfile: DEFAULT_CROP,
  });
  const waterCrit = summaryCrit.activeAlerts.find(a => a.category === 'WATER_LEVEL');
  assert(waterCrit?.severity === 'URGENT', 'WaterLevel at 12% is URGENT');
}

// -----------------------------------------------------------------------------
// Test 10: Missing sensor reading -> NO false health alert
// -----------------------------------------------------------------------------
console.log('\nTest 10: Missing sensor reading does not generate false health alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: null, // Telemetry unavailable
    sensorHistory: [],
    cropProfile: DEFAULT_CROP,
  });

  const sensorAlerts = summary.activeAlerts.filter(a => a.category === 'PH' || a.category === 'TDS' || a.category === 'WATER_LEVEL');
  assert(sensorAlerts.length === 0, 'No false environmental alerts when sensor reading is missing');
}

// -----------------------------------------------------------------------------
// Test 11: Sensor stale (> 15s) -> DATA_QUALITY condition
// -----------------------------------------------------------------------------
console.log('\nTest 11: Stale telemetry triggers DATA_QUALITY notice');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    isTelemetryStale: true,
    latestReading: { ph: 6.0, tds: 950, waterLevel: 50, timestamp: Date.now() - 20000 },
    cropProfile: DEFAULT_CROP,
  });

  const staleAlert = summary.activeAlerts.find(a => a.category === 'DATA_QUALITY' && a.triggerType === 'sensor_stale');
  assert(Boolean(staleAlert), 'DATA_QUALITY alert generated for stale telemetry');
  assert(staleAlert?.severity === 'INFO', 'Stale alert is informational');
}

// -----------------------------------------------------------------------------
// Test 12: Low image quality / detection confidence < 50% -> NO false health alert
// -----------------------------------------------------------------------------
console.log('\nTest 12: Low detection confidence suppresses visual health alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestDetection: {
      isPlantDetected: true,
      plantDetectionConfidence: 35, // Poor quality / low confidence
    },
    latestVisualHealth: {
      visualHealthScore: 50,
      healthState: 'ATTENTION',
      chlorosisYellowPercent: 20.0,
      necroticBrownPercent: 5.0,
    },
    cropProfile: DEFAULT_CROP,
  });

  const healthAlerts = summary.activeAlerts.filter(a => a.category === 'PLANT_HEALTH' || a.category === 'VISUAL_ANOMALY');
  assert(healthAlerts.length === 0, 'No visual alerts generated when optical confidence is below 50%');
}

// -----------------------------------------------------------------------------
// Test 13: Camera active but NO plant detected -> DATA_QUALITY info, not health alert
// -----------------------------------------------------------------------------
console.log('\nTest 13: No plant detected produces DATA_QUALITY alert, not health alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    isCameraActive: true,
    latestDetection: { isPlantDetected: false, plantDetectionConfidence: 0 },
    observations: [
      { id: 'obs_1', plantId: 'plant_1', timestamp: Date.now() - 60000, cameraActive: true, isPlantDetected: false },
      { id: 'obs_2', plantId: 'plant_1', timestamp: Date.now(), cameraActive: true, isPlantDetected: false },
    ],
    cropProfile: DEFAULT_CROP,
  });

  const noPlantAlert = summary.activeAlerts.find(a => a.category === 'DATA_QUALITY' && a.metric === 'plant_presence');
  assert(Boolean(noPlantAlert), 'DATA_QUALITY alert generated for missing plant');
  const falseHealthAlerts = summary.activeAlerts.filter(a => a.category === 'PLANT_HEALTH');
  assert(falseHealthAlerts.length === 0, 'No false PLANT_HEALTH alert generated when plant is absent');
}

// -----------------------------------------------------------------------------
// Test 14: Phase 9 association + visual change -> MULTIMODAL alert
// -----------------------------------------------------------------------------
console.log('\nTest 14: Phase 9 association + visual decline generates MULTIMODAL alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    correlationSummary: {
      plantId: 'plant_1',
      timestamp: Date.now(),
      status: 'active_associations',
      primaryAssociation: {
        id: 'assoc_tds_health_1',
        plantId: 'plant_1',
        timestamp: Date.now(),
        environmentMetric: 'tds',
        environmentLabel: 'Total Dissolved Solids (TDS)',
        environmentValue: 1250,
        environmentBaseline: 900,
        environmentDirection: 'rising',
        plantMetric: 'visualHealthScore',
        plantLabel: 'Visual Health Score',
        plantDirection: 'declined',
        timeWindow: 'recent_trend',
        associationType: 'TEMPORAL_ASSOCIATION',
        associationStrength: 'moderate',
        correlationMethod: 'qualitative_pairing',
        sampleSize: 8,
        confidence: 'MODERATE',
        confidenceReason: 'Coincident shift detected across 8 paired records.',
        dataQuality: 'good',
        confoundingFactors: [],
        evidenceIds: ['ev_1', 'ev_2'],
        relatedObservationIds: [],
        summary: 'Elevated TDS coincided with foliar health score decline.',
        farmerSummary: {
          whatChanged: 'TDS increased',
          whatHappenedTogether: 'Foliar health declined during TDS increase',
          whatItMeans: 'Nutrient salinity may be stressing the plant',
          whatToDo: 'Dilute nutrient reservoir with freshwater',
        },
        createdAt: Date.now(),
      },
      associations: [],
      laggedAssociations: [],
      confoundingFactors: [],
      sampleSize: 8,
      limitations: [],
      farmerHeadline: 'TDS shift coincided with leaf changes',
      farmerWhy: 'Occurred alongside high salinity',
      farmerAction: 'Check reservoir salinity',
    },
    cropProfile: DEFAULT_CROP,
  });

  const multimodalAlert = summary.activeAlerts.find(a => a.category === 'MULTIMODAL');
  assert(Boolean(multimodalAlert), 'MULTIMODAL alert generated');
  assert(multimodalAlert?.triggerType === 'phase9_association', 'Trigger type is phase9_association');
  assert(!multimodalAlert?.farmerMessage.includes('caused'), 'Farmer message does NOT claim causation');
  assert(!multimodalAlert?.technicalMessage.includes('caused'), 'Technical message does NOT claim causation');
}

// -----------------------------------------------------------------------------
// Test 15: Weak association only -> Suppresses strong alert
// -----------------------------------------------------------------------------
console.log('\nTest 15: Weak association does not generate strong alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    correlationSummary: {
      plantId: 'plant_1',
      timestamp: Date.now(),
      status: 'active_associations',
      primaryAssociation: {
        id: 'assoc_weak_1',
        plantId: 'plant_1',
        timestamp: Date.now(),
        environmentMetric: 'ph',
        environmentLabel: 'Nutrient pH',
        environmentDirection: 'rising',
        plantMetric: 'visualHealthScore',
        plantLabel: 'Visual Health Score',
        plantDirection: 'declined',
        timeWindow: 'immediate',
        associationType: 'NO_CLEAR_ASSOCIATION', // Not temporal or lagged
        associationStrength: 'weak',
        correlationMethod: 'qualitative_pairing',
        sampleSize: 3,
        confidence: 'LOW',
        confidenceReason: 'Small sample size',
        dataQuality: 'poor',
        confoundingFactors: [],
        evidenceIds: [],
        relatedObservationIds: [],
        summary: 'No clear correlation.',
        farmerSummary: { whatChanged: '', whatHappenedTogether: '', whatItMeans: '', whatToDo: '' },
        createdAt: Date.now(),
      },
      associations: [],
      laggedAssociations: [],
      confoundingFactors: [],
      sampleSize: 3,
      limitations: [],
      farmerHeadline: '',
      farmerWhy: '',
      farmerAction: '',
    },
    cropProfile: DEFAULT_CROP,
  });

  const multimodalAlert = summary.activeAlerts.find(a => a.category === 'MULTIMODAL');
  assert(!multimodalAlert, 'Weak/No-clear association did not generate MULTIMODAL alert');
}

// -----------------------------------------------------------------------------
// Test 16: Insufficient confidence suppresses action alert
// -----------------------------------------------------------------------------
console.log('\nTest 16: Insufficient confidence suppresses action alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    whatChangedSummary: {
      plantId: 'plant_1',
      timestamp: Date.now(),
      timeframeDescription: 'Past hour',
      hasMeaningfulChange: true,
      status: 'meaningful_changes',
      overallSignificance: 'CRITICAL',
      overallDirection: 'declined',
      summaryHeadline: 'Unverified change',
      summaryExplanation: '',
      farmerHeadline: '',
      farmerWhy: '',
      farmerAction: '',
      events: [
        {
          id: 'evt_crit_unverified',
          plantId: 'plant_1',
          category: 'sensor',
          metric: 'ph',
          label: 'pH',
          direction: 'declined',
          significance: 'CRITICAL',
          confidence: 'INSUFFICIENT_DATA', // INSUFFICIENT confidence!
          isMeaningful: true,
          temporalWindow: 'vs_previous',
          summary: 'Critical shift but insufficient data',
          farmerHeadline: '',
          farmerWhy: '',
          farmerAction: '',
          whyItMatters: '',
          suggestedCheck: '',
          timestamp: Date.now(),
          evidenceSource: 'esp32',
        },
      ],
      visualChanges: [],
      sensorChanges: [],
      healthChanges: [],
      growthChanges: [],
      anomalyChanges: [],
      identityChanges: [],
      reasoningChanges: [],
      reviewRequiredItems: [],
      sensorAvailability: { ph: 'available', tds: 'available', waterLevel: 'available' },
      cameraConfidence: 'INSUFFICIENT_DATA',
      observationCount: 1,
      limitations: [],
    },
    cropProfile: DEFAULT_CROP,
  });

  const whatChangedAlert = summary.activeAlerts.find(a => a.triggerType === 'what_changed');
  assert(!whatChangedAlert, 'Event with INSUFFICIENT_DATA confidence was suppressed');
}

// -----------------------------------------------------------------------------
// Test 17: Repeated condition -> Deduplicated alert (occurrenceCount increments)
// -----------------------------------------------------------------------------
console.log('\nTest 17: Repeated alert condition increments occurrenceCount without duplicating');
{
  const initial = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 6.0, tds: 950, waterLevel: 18, timestamp: Date.now() },
    sensorHistory: [
      { waterLevel: 20, timestamp: Date.now() - 30000 },
      { waterLevel: 19, timestamp: Date.now() - 15000 },
      { waterLevel: 18, timestamp: Date.now() },
    ],
    cropProfile: DEFAULT_CROP,
  });

  assert(initial.activeAlerts.length === 1, 'Initial water alert created');
  assert(initial.activeAlerts[0].occurrenceCount === 1, 'Initial occurrenceCount is 1');

  // Second evaluation with the previous alert passed in storedAlerts
  const second = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 6.0, tds: 950, waterLevel: 17, timestamp: Date.now() + 5000 },
    sensorHistory: [
      { waterLevel: 19, timestamp: Date.now() - 10000 },
      { waterLevel: 18, timestamp: Date.now() - 5000 },
      { waterLevel: 17, timestamp: Date.now() + 5000 },
    ],
    storedAlerts: initial.activeAlerts,
    cropProfile: DEFAULT_CROP,
  });

  assert(second.activeAlerts.length === 1, 'No duplicate alert created');
  assert(second.activeAlerts[0].occurrenceCount === 2, 'OccurrenceCount incremented to 2');
}

// -----------------------------------------------------------------------------
// Test 18: Alert persistence across sessions (alertStore save & reload)
// -----------------------------------------------------------------------------
console.log('\nTest 18: Alert persistence round-trip in alertStore');
{
  const testAlert = {
    id: 'alert_plant_1_ph_test',
    plantId: 'plant_1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'ACTIVE',
    severity: 'ATTENTION',
    category: 'PH',
    triggerType: 'sensor_out_of_range',
    confidence: 'HIGH',
    confidenceReason: 'Test persistence',
    title: 'Test Alert',
    farmerMessage: 'Test farmer message',
    farmerWhy: 'Test why',
    farmerAction: 'Test action',
    technicalMessage: 'Test technical log',
    limitation: 'Test limitation',
    evidenceIds: [],
    changeEventIds: [],
    environmentAssociationIds: [],
    occurrenceCount: 1,
    firstDetectedAt: Date.now(),
    lastDetectedAt: Date.now(),
    persistenceWindowMs: 0,
    recommendedAction: 'Test action',
    source: 'sensor',
  };

  saveStoredAlerts('plant_1', [testAlert]);
  const loaded = getStoredAlerts('plant_1');

  assert(loaded.length === 1, 'Loaded 1 alert from store');
  assert(loaded[0].id === testAlert.id, 'Loaded alert ID matches');
  assert(loaded[0].severity === 'ATTENTION', 'Loaded severity matches');

  const ackList = acknowledgeStoredAlert('plant_1', testAlert.id);
  assert(ackList.find(a => a.id === testAlert.id)?.status === 'ACKNOWLEDGED', 'acknowledgeStoredAlert sets ACKNOWLEDGED status');

  const resList = resolveStoredAlert('plant_1', testAlert.id);
  assert(resList.find(a => a.id === testAlert.id)?.status === 'RESOLVED', 'resolveStoredAlert sets RESOLVED status');

  const disList = dismissStoredAlert('plant_1', testAlert.id);
  assert(disList.find(a => a.id === testAlert.id)?.status === 'DISMISSED', 'dismissStoredAlert sets DISMISSED status');
}

// -----------------------------------------------------------------------------
// Test 19: Alert resolution when condition clears with hysteresis
// -----------------------------------------------------------------------------
console.log('\nTest 19: Alert resolves when metric returns to safe zone beyond hysteresis');
{
  const activeWaterAlert = {
    id: 'alert_plant_1_water_level_sensor_out_of_range_water_level',
    plantId: 'plant_1',
    createdAt: Date.now() - 60000,
    updatedAt: Date.now() - 60000,
    status: 'ACTIVE',
    severity: 'ATTENTION',
    category: 'WATER_LEVEL',
    triggerType: 'sensor_out_of_range',
    metric: 'waterLevel',
    currentValue: 18,
    threshold: 25,
    confidence: 'HIGH',
    confidenceReason: 'Low water level',
    title: 'Low Water Level',
    farmerMessage: 'Water level low',
    farmerWhy: '',
    farmerAction: '',
    technicalMessage: '',
    limitation: '',
    evidenceIds: [],
    changeEventIds: [],
    environmentAssociationIds: [],
    occurrenceCount: 1,
    firstDetectedAt: Date.now() - 60000,
    lastDetectedAt: Date.now() - 60000,
    persistenceWindowMs: 0,
    recommendedAction: '',
    source: 'sensor',
  };

  // Water refilled to 35% (safely above warning 25% + hysteresis 3% = 28%)
  const resolvedSummary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 6.0, tds: 950, waterLevel: 35, timestamp: Date.now() },
    sensorHistory: [{ waterLevel: 35, timestamp: Date.now() }],
    storedAlerts: [activeWaterAlert],
    cropProfile: DEFAULT_CROP,
  });

  assert(resolvedSummary.activeAlerts.length === 0, 'No active alerts after refill');
  assert(resolvedSummary.resolvedAlerts.length === 1, 'Alert marked as RESOLVED');
  assert(resolvedSummary.resolvedAlerts[0].status === 'RESOLVED', 'Alert status is RESOLVED');
}

// -----------------------------------------------------------------------------
// Test 20: Alert dismissal (dismissed alert does not reappear)
// -----------------------------------------------------------------------------
console.log('\nTest 20: Dismissed alert remains dismissed within debounce window');
{
  const dismissedAlert = {
    id: 'alert_plant_1_ph_sensor_out_of_range_ph',
    plantId: 'plant_1',
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 5000,
    status: 'DISMISSED',
    dismissedAt: Date.now() - 5000,
    severity: 'ATTENTION',
    category: 'PH',
    triggerType: 'sensor_out_of_range',
    metric: 'ph',
    currentValue: 5.2,
    confidence: 'HIGH',
    confidenceReason: '',
    title: 'Acidic pH',
    farmerMessage: '',
    farmerWhy: '',
    farmerAction: '',
    technicalMessage: '',
    limitation: '',
    evidenceIds: [],
    changeEventIds: [],
    environmentAssociationIds: [],
    occurrenceCount: 1,
    firstDetectedAt: Date.now() - 10000,
    lastDetectedAt: Date.now() - 5000,
    persistenceWindowMs: 0,
    recommendedAction: '',
    source: 'sensor',
  };

  // Same low pH reading occurs again 5 seconds later
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 5.2, tds: 950, waterLevel: 50, timestamp: Date.now() },
    sensorHistory: [
      { ph: 5.2, timestamp: Date.now() - 30000 },
      { ph: 5.2, timestamp: Date.now() },
    ],
    storedAlerts: [dismissedAlert],
    cropProfile: DEFAULT_CROP,
  });

  const activePh = summary.activeAlerts.find(a => a.id === dismissedAlert.id);
  assert(!activePh, 'Dismissed alert did not reactivate within debounce window');
  assert(summary.dismissedAlerts.length === 1, 'Alert preserved in dismissedAlerts list');
}

// -----------------------------------------------------------------------------
// Test 21: Hysteresis prevents oscillation on border values
// -----------------------------------------------------------------------------
console.log('\nTest 21: Hysteresis buffer prevents oscillation near threshold');
{
  const activeTdsAlert = {
    id: 'alert_plant_1_tds_sensor_out_of_range_tds',
    plantId: 'plant_1',
    createdAt: Date.now() - 60000,
    updatedAt: Date.now() - 60000,
    status: 'ACTIVE',
    severity: 'ATTENTION',
    category: 'TDS',
    triggerType: 'sensor_out_of_range',
    metric: 'tds',
    currentValue: 1250,
    threshold: 1200,
    confidence: 'HIGH',
    confidenceReason: 'Elevated TDS',
    title: 'High TDS',
    farmerMessage: '',
    farmerWhy: '',
    farmerAction: '',
    technicalMessage: '',
    limitation: '',
    evidenceIds: [],
    changeEventIds: [],
    environmentAssociationIds: [],
    occurrenceCount: 1,
    firstDetectedAt: Date.now() - 60000,
    lastDetectedAt: Date.now() - 60000,
    persistenceWindowMs: 0,
    recommendedAction: '',
    source: 'sensor',
  };

  // TDS drops slightly from 1250 to 1180.
  // Although 1180 is below ceiling 1200, it is NOT below (1200 - hysteresis 50 = 1150).
  // Therefore the alert should remain active, preventing bouncing!
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 6.0, tds: 1180, waterLevel: 60, timestamp: Date.now() },
    sensorHistory: [{ tds: 1180, timestamp: Date.now() }],
    storedAlerts: [activeTdsAlert],
    cropProfile: DEFAULT_CROP,
  });

  assert(summary.activeAlerts.length === 1, 'Alert remains active due to hysteresis buffer');
  assert(summary.resolvedAlerts.length === 0, 'Alert is not prematurely resolved');
}

// -----------------------------------------------------------------------------
// Test 22: Multiple simultaneous conditions organized by severity hierarchy
// -----------------------------------------------------------------------------
console.log('\nTest 22: Multiple simultaneous conditions sorted: URGENT > ATTENTION > INFO');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    // 1. Water level 10% -> URGENT
    latestReading: { ph: 5.2, tds: 950, waterLevel: 10, timestamp: Date.now() },
    sensorHistory: [
      { waterLevel: 10, ph: 5.2, timestamp: Date.now() - 30000 },
      { waterLevel: 10, ph: 5.2, timestamp: Date.now() - 15000 },
      { waterLevel: 10, ph: 5.2, timestamp: Date.now() },
    ],
    // 2. pH 5.2 -> ATTENTION
    // 3. Stale -> INFO (suppressed because reading is fresh)
    cropProfile: DEFAULT_CROP,
  });

  assert(summary.activeAlerts.length >= 2, 'At least 2 alerts generated');
  assert(summary.activeAlerts[0].severity === 'URGENT', 'First alert is URGENT (Water Level)');
  assert(summary.activeAlerts[1].severity === 'ATTENTION', 'Second alert is ATTENTION (pH)');
}

// -----------------------------------------------------------------------------
// Test 23: Different plantIds remain strictly isolated
// -----------------------------------------------------------------------------
console.log('\nTest 23: Alerts for plant_A do not leak into plant_B');
{
  const alertA = {
    id: 'alert_plant_A_ph_test',
    plantId: 'plant_A',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'ACTIVE',
    severity: 'ATTENTION',
    category: 'PH',
    triggerType: 'sensor_out_of_range',
    confidence: 'HIGH',
    confidenceReason: '',
    title: 'Plant A Alert',
    farmerMessage: '',
    farmerWhy: '',
    farmerAction: '',
    technicalMessage: '',
    limitation: '',
    evidenceIds: [],
    changeEventIds: [],
    environmentAssociationIds: [],
    occurrenceCount: 1,
    firstDetectedAt: Date.now(),
    lastDetectedAt: Date.now(),
    persistenceWindowMs: 0,
    recommendedAction: '',
    source: 'sensor',
  };

  saveStoredAlerts('plant_A', [alertA]);
  const loadedB = getStoredAlerts('plant_B');

  assert(loadedB.length === 0, 'Plant B has 0 stored alerts (isolated from Plant A)');
}

// -----------------------------------------------------------------------------
// Test 24: What Changed CRITICAL significance integration
// -----------------------------------------------------------------------------
console.log('\nTest 24: WhatChanged CRITICAL event generates alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    whatChangedSummary: {
      plantId: 'plant_1',
      timestamp: Date.now(),
      timeframeDescription: 'Past 24 hours',
      hasMeaningfulChange: true,
      status: 'meaningful_changes',
      overallSignificance: 'CRITICAL',
      overallDirection: 'declined',
      summaryHeadline: 'Substantial drop in reservoir level',
      summaryExplanation: 'Water depleted rapidly',
      farmerHeadline: 'Water dropped very quickly',
      farmerWhy: 'High consumption or possible leak',
      farmerAction: 'Check reservoir and piping',
      events: [
        {
          id: 'evt_water_depletion_crit',
          plantId: 'plant_1',
          category: 'sensor',
          metric: 'waterLevel',
          label: 'Reservoir Level',
          direction: 'declined',
          significance: 'CRITICAL',
          confidence: 'HIGH',
          isMeaningful: true,
          temporalWindow: 'vs_baseline',
          summary: 'Water level fell from 80% to 18%',
          farmerHeadline: 'Water level fell sharply',
          farmerWhy: 'Reservoir depleted faster than expected',
          farmerAction: 'Top up water and check for leaks',
          whyItMatters: 'Pump could run dry',
          suggestedCheck: 'Inspect plumbing',
          timestamp: Date.now(),
          evidenceSource: 'esp32',
        },
      ],
      visualChanges: [],
      sensorChanges: [],
      healthChanges: [],
      growthChanges: [],
      anomalyChanges: [],
      identityChanges: [],
      reasoningChanges: [],
      reviewRequiredItems: [],
      sensorAvailability: { ph: 'available', tds: 'available', waterLevel: 'available' },
      cameraConfidence: 'HIGH',
      observationCount: 5,
      limitations: [],
    },
    cropProfile: DEFAULT_CROP,
  });

  const changeAlert = summary.activeAlerts.find(a => a.triggerType === 'what_changed');
  assert(Boolean(changeAlert), 'WhatChanged CRITICAL event generated an alert');
  assert(changeAlert?.category === 'ENVIRONMENT', 'Category is ENVIRONMENT');
}

// -----------------------------------------------------------------------------
// Test 25: Milestone integration (URGENT alert generates milestone)
// -----------------------------------------------------------------------------
console.log('\nTest 25: URGENT alert is marked for milestone integration');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 6.0, tds: 950, waterLevel: 10, timestamp: Date.now() },
    sensorHistory: [
      { waterLevel: 10, timestamp: Date.now() - 30000 },
      { waterLevel: 10, timestamp: Date.now() },
    ],
    cropProfile: DEFAULT_CROP,
  });

  assert(summary.primaryAlert !== null, 'primaryAlert exists');
  assert(summary.primaryAlert?.severity === 'URGENT', 'primaryAlert is URGENT');
  assert(summary.urgentCount === 1, 'urgentCount is 1');
}

// -----------------------------------------------------------------------------
// Test 26: Reasoning Lab integration (reasoning event ID attached)
// -----------------------------------------------------------------------------
console.log('\nTest 26: Reasoning event ID attached to multimodal alert');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReasoningEvent: {
      id: 'reasoning_event_999',
      plantId: 'plant_1',
      timestamp: Date.now(),
      scenarioCode: 'CORRELATED_ENVIRONMENTAL_STRESS',
      plantState: 'ATTENTION',
      evidence: [],
      sensorEvidence: {},
      observations: [],
      interpretations: [],
      recommendations: [],
      confidence: 'high',
      contributingSignals: [],
      limitations: [],
      conflictingSignals: [],
      reasoningVersion: 'v1',
      primaryFarmerHeadline: 'Leaf yellowing noticed',
      primaryFarmerWhy: 'Coincided with TDS shift',
      primaryFarmerAction: 'Check reservoir',
    },
    correlationSummary: {
      plantId: 'plant_1',
      timestamp: Date.now(),
      status: 'active_associations',
      primaryAssociation: {
        id: 'assoc_123',
        plantId: 'plant_1',
        timestamp: Date.now(),
        environmentMetric: 'tds',
        environmentLabel: 'TDS',
        environmentDirection: 'rising',
        plantMetric: 'visualHealthScore',
        plantLabel: 'Health Score',
        plantDirection: 'declined',
        timeWindow: 'recent_trend',
        associationType: 'TEMPORAL_ASSOCIATION',
        associationStrength: 'moderate',
        correlationMethod: 'qualitative_pairing',
        sampleSize: 6,
        confidence: 'HIGH',
        confidenceReason: '',
        dataQuality: 'good',
        confoundingFactors: [],
        evidenceIds: [],
        relatedObservationIds: [],
        summary: 'TDS coincided with health decline.',
        farmerSummary: { whatChanged: '', whatHappenedTogether: '', whatItMeans: '', whatToDo: '' },
        createdAt: Date.now(),
      },
      associations: [],
      laggedAssociations: [],
      confoundingFactors: [],
      sampleSize: 6,
      limitations: [],
      farmerHeadline: '',
      farmerWhy: '',
      farmerAction: '',
    },
    cropProfile: DEFAULT_CROP,
  });

  const mmAlert = summary.activeAlerts.find(a => a.category === 'MULTIMODAL');
  assert(mmAlert?.reasoningEventId === 'reasoning_event_999', 'reasoningEventId correctly attached');
}

// -----------------------------------------------------------------------------
// Test 27: Farmer English presentation (non-causal, clear action)
// -----------------------------------------------------------------------------
console.log('\nTest 27: Farmer English copy is clear, actionable, and non-causal');
{
  const mockAlert = {
    id: 'test_alert_en',
    plantId: 'plant_1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'ACTIVE',
    severity: 'ATTENTION',
    category: 'WATER_LEVEL',
    triggerType: 'sensor_out_of_range',
    currentValue: 18,
    confidence: 'HIGH',
    confidenceReason: 'Ultrasonic depth',
    title: 'Low Reservoir Water Level',
    farmerMessage: 'Water level is lower than usual (18%).',
    farmerWhy: 'The nutrient reservoir volume has decreased through plant uptake.',
    farmerAction: 'Top up the reservoir tank with fresh water.',
    technicalMessage: 'Ultrasonic telemetry indicates 18% water level.',
    limitation: 'Calculated from ultrasonic distance sensor.',
    evidenceIds: [],
    changeEventIds: [],
    environmentAssociationIds: [],
    occurrenceCount: 1,
    firstDetectedAt: Date.now(),
    lastDetectedAt: Date.now(),
    persistenceWindowMs: 0,
    recommendedAction: '',
    source: 'sensor',
  };

  const loc = getLocalizedAlert(mockAlert, 'en');
  assert(loc.title === 'Low Reservoir Water Level', 'English title matches');
  assert(loc.farmerAction.includes('Top up'), 'English action is actionable');
  assert(!loc.farmerMessage.includes('caused'), 'English message is non-causal');
}

// -----------------------------------------------------------------------------
// Test 28: Farmer Kannada presentation (accurate localized strings)
// -----------------------------------------------------------------------------
console.log('\nTest 28: Farmer Kannada copy is natural and accurate');
{
  const mockAlert = {
    id: 'test_alert_kn',
    plantId: 'plant_1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'ACTIVE',
    severity: 'ATTENTION',
    category: 'WATER_LEVEL',
    triggerType: 'sensor_out_of_range',
    currentValue: 18,
    confidence: 'HIGH',
    confidenceReason: '',
    title: 'Low Reservoir Water Level',
    farmerMessage: 'Water level is lower than usual',
    farmerWhy: '',
    farmerAction: '',
    technicalMessage: '',
    limitation: '',
    evidenceIds: [],
    changeEventIds: [],
    environmentAssociationIds: [],
    occurrenceCount: 1,
    firstDetectedAt: Date.now(),
    lastDetectedAt: Date.now(),
    persistenceWindowMs: 0,
    recommendedAction: '',
    source: 'sensor',
  };

  const locKn = getLocalizedAlert(mockAlert, 'kn');
  assert(locKn.title === 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ', 'Kannada title is accurate');
  assert(locKn.farmerAction.includes('ನೀರ') || locKn.farmerAction.includes('ತುಂಬಿಸಿ'), 'Kannada action mentions water refill');
  assert(locKn.farmerWhy.includes('ನೀರ') || locKn.farmerWhy.includes('ಹೀರಿಕೊಂಡಿದೆ'), 'Kannada why mentions water absorption');
}

// -----------------------------------------------------------------------------
// Test 29: Technical English diagnostics contain all verifiable fields
// -----------------------------------------------------------------------------
console.log('\nTest 29: Technical mode provides diagnostic details and transparency');
{
  const summary = evaluatePlantAlerts({
    plantId: 'plant_1',
    latestReading: { ph: 4.8, tds: 950, waterLevel: 60, timestamp: Date.now() },
    sensorHistory: [
      { ph: 4.8, timestamp: Date.now() - 30000 },
      { ph: 4.8, timestamp: Date.now() },
    ],
    cropProfile: DEFAULT_CROP,
  });

  const phAlert = summary.activeAlerts.find(a => a.category === 'PH');
  assert(phAlert?.currentValue === 4.8, 'currentValue is numeric 4.8');
  assert(phAlert?.threshold === DEFAULT_CROP.phMin, 'threshold is phMin (5.5)');
  assert(Boolean(phAlert?.confidenceReason), 'confidenceReason is provided');
  assert(Boolean(phAlert?.technicalMessage), 'technicalMessage is provided');
}

// -----------------------------------------------------------------------------
// Test 30: Technical Kannada labels for severity and category
// -----------------------------------------------------------------------------
console.log('\nTest 30: Technical Kannada localized labels for severity and category');
{
  const urgentKn = getLocalizedAlertSeverity('URGENT', 'kn');
  const attentionKn = getLocalizedAlertSeverity('ATTENTION', 'kn');
  const infoKn = getLocalizedAlertSeverity('INFO', 'kn');
  const catPhKn = getLocalizedAlertCategory('PH', 'kn');
  const catWaterKn = getLocalizedAlertCategory('WATER_LEVEL', 'kn');

  assert(urgentKn === 'ತುರ್ತು ಗಮನ', 'URGENT in Kannada is ತುರ್ತು ಗಮನ');
  assert(attentionKn === 'ಗಮನಿಸಿ', 'ATTENTION in Kannada is ಗಮನಿಸಿ');
  assert(infoKn === 'ಮಾಹಿತಿ', 'INFO in Kannada is ಮಾಹಿತಿ');
  assert(catPhKn === 'pH ಆಮ್ಲೀಯತೆ', 'PH category in Kannada is pH ಆಮ್ಲೀಯತೆ');
  assert(catWaterKn === 'ನೀರಿನ ಮಟ್ಟ', 'WATER_LEVEL in Kannada is ನೀರಿನ ಮಟ್ಟ');

  const statusActiveKn = getLocalizedAlertStatus('ACTIVE', 'kn');
  assert(statusActiveKn === 'ಸಕ್ರಿಯ', 'ACTIVE status in Kannada is ಸಕ್ರಿಯ');
  assert(ALERT_CONFIG.ph.warningOffset > 0, 'ALERT_CONFIG defines valid positive warning offset');
}

console.log('\n================================================================');
console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('================================================================\n');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
