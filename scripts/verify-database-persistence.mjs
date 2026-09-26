// ============================================================
// HydroSmart — Phase 12 Database & Persistence Verification Suite
// Comprehensive verification of all 16 specification focus areas
// ============================================================

import assert from 'assert';

console.log('====================================================');
console.log('HydroSmart Phase 12: Real Backend & Database Verification');
console.log('====================================================\n');

// Mock localStorage and window environment for Node.js
const mockLocalStorageStore = {};
global.localStorage = {
  getItem: (key) => mockLocalStorageStore[key] || null,
  setItem: (key, val) => { mockLocalStorageStore[key] = String(val); },
  removeItem: (key) => { delete mockLocalStorageStore[key]; },
  clear: () => { Object.keys(mockLocalStorageStore).forEach(k => delete mockLocalStorageStore[k]); }
};
global.window = {};

// Import database and migration services
const {
  savePlantProfile,
  getPlantProfile,
  saveObservation,
  getObservations,
  validateDbObservation,
  saveTelemetrySnapshot,
  getTelemetryHistory,
  saveReasoningEvent,
  getReasoningHistory,
  saveChangeEvent,
  getChangeHistory,
  saveAssociation,
  getAssociations,
  saveAlert,
  getAlerts,
  updateAlertStatus,
  saveCalibration,
  getCalibration,
  clearInMemoryDbCache,
} = await import('../lib/backend/databaseService.ts');

const {
  executeSafeLocalStorageMigration,
  MIGRATION_FLAG_KEY,
  UNLINKED_LEGACY_QUARANTINE_KEY,
} = await import('../lib/backend/migrationService.ts');

const { deriveFarmerSemanticState } = await import('../lib/intelligence/farmerSemanticLayer.ts');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runAsyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  }
}

// ------------------------------------------------------------
// TEST 1: Database Connection & Initialization
// ------------------------------------------------------------
console.log('\n--- 1. Database Connection & Initial Fallback ---');
await runAsyncTest('Initializes with graceful LOCAL_ONLY fallback when cloud credentials unconfigured', async () => {
  const result = await savePlantProfile(null, 'farm_main', 'station_esp32_1', {
    plantId: 'test_plant_init',
    species: 'Basil',
    commonName: 'Sweet Basil',
    createdAt: Date.now(),
    lastObservedAt: Date.now(),
    monitoringStatus: 'active',
    currentHealthStatus: 'optimal',
    observationCount: 1,
  });
  assert.ok(result.status === 'LOCAL_ONLY' || result.status === 'SAVED');
  assert.strictEqual(result.plantId, 'test_plant_init');
  assert.ok(result.syncedAt > 0);
});

// ------------------------------------------------------------
// TEST 2: PlantProfile CRUD
// ------------------------------------------------------------
console.log('\n--- 2. PlantProfile CRUD ---');
await runAsyncTest('Create, read, and update PlantProfile with type integrity', async () => {
  const now = Date.now();
  const profile = {
    plantId: 'plant_basil_01',
    species: 'Ocimum basilicum',
    commonName: 'Genovese Basil',
    createdAt: now - 86400000,
    lastObservedAt: now,
    monitoringStatus: 'active',
    currentHealthStatus: 'optimal',
    observationCount: 5,
    growthStage: 'vegetative',
    targetProfile: { phMin: 5.8, phMax: 6.5, tdsMin: 800, tdsMax: 1200 },
  };

  const saveRes = await savePlantProfile('usr_test', 'farm_main', 'station_1', profile);
  assert.strictEqual(saveRes.plantId, 'plant_basil_01');

  const loaded = await getPlantProfile('usr_test', 'farm_main', 'station_1', 'plant_basil_01');
  assert.ok(loaded !== null);
  assert.strictEqual(loaded.commonName, 'Genovese Basil');
  assert.strictEqual(loaded.growthStage, 'vegetative');
  assert.strictEqual(loaded.targetProfile.phMin, 5.8);

  // Update
  const updatedProfile = { ...loaded, currentHealthStatus: 'warning', observationCount: 6 };
  await savePlantProfile('usr_test', 'farm_main', 'station_1', updatedProfile);
  const reloaded = await getPlantProfile('usr_test', 'farm_main', 'station_1', 'plant_basil_01');
  assert.strictEqual(reloaded.currentHealthStatus, 'warning');
  assert.strictEqual(reloaded.observationCount, 6);
});

// ------------------------------------------------------------
// TEST 3: Observation Persistence & Validation
// ------------------------------------------------------------
console.log('\n--- 3. Observation Persistence & Validation ---');
await runAsyncTest('Store and query observation checkpoints with validation', async () => {
  const obs = {
    id: 'obs_test_101',
    plantId: 'plant_basil_01',
    timestamp: Date.now(),
    ph: 6.2,
    tds: 950,
    waterLevel: 80,
    distance: 22.0,
    visualHealthScore: 91,
    visualHealthState: 'healthy',
    isPlantDetected: true,
    telemetryMode: 'real',
    isTelemetryStale: false,
    activeAnomalies: [],
    recommendations: ['Maintain nutrient dosing'],
  };

  const saveRes = await saveObservation('usr_test', 'farm_main', 'station_1', 'plant_basil_01', obs);
  assert.ok(saveRes.status === 'SAVED' || saveRes.status === 'LOCAL_ONLY');

  const history = await getObservations('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 10);
  assert.ok(history.length >= 1);
  const found = history.find(o => o.id === 'obs_test_101');
  assert.ok(found);
  assert.strictEqual(found.ph, 6.2);
  assert.strictEqual(found.tds, 950);
});

runTest('Rejects corrupted observations containing NaN or missing timestamps', () => {
  assert.strictEqual(validateDbObservation({ timestamp: NaN, ph: 6.0 }), false);
  assert.strictEqual(validateDbObservation({ timestamp: Date.now(), ph: NaN }), false);
  assert.strictEqual(validateDbObservation({ timestamp: -1, ph: 6.0 }), false);
  assert.strictEqual(validateDbObservation({ timestamp: Date.now(), tds: Infinity }), false);
  assert.strictEqual(validateDbObservation({ timestamp: Date.now(), ph: 6.2, tds: 900 }), true);
});

// ------------------------------------------------------------
// TEST 4: Telemetry Snapshot Persistence
// ------------------------------------------------------------
console.log('\n--- 4. Sensor Telemetry Snapshot Persistence ---');
await runAsyncTest('Persist aggregated periodic sensor snapshots with raw vs calibrated metrics', async () => {
  const snap = {
    id: 'snap_test_01',
    plantId: 'plant_basil_01',
    timestamp: Date.now(),
    ph: 6.15,
    tds: 980,
    waterLevel: 75,
    distance: 24.5,
    rawPh: 6.05,
    rawTds: 960,
    rawDistance: 24.5,
    phStatus: 'VALID',
    tdsStatus: 'VALID',
    waterLevelStatus: 'VALID',
    source: 'esp32_serial',
    isSimulated: false,
  };

  const saveRes = await saveTelemetrySnapshot('usr_test', 'farm_main', 'station_1', 'plant_basil_01', snap);
  assert.ok(saveRes.status === 'SAVED' || saveRes.status === 'LOCAL_ONLY');

  const snaps = await getTelemetryHistory('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 10);
  assert.ok(snaps.length >= 1);
  const found = snaps.find(s => s.id === 'snap_test_01');
  assert.ok(found);
  assert.strictEqual(found.rawPh, 6.05);
  assert.strictEqual(found.isSimulated, false);
});

// ------------------------------------------------------------
// TEST 5: Multimodal Reasoning Event Persistence
// ------------------------------------------------------------
console.log('\n--- 5. Multimodal Reasoning Event Persistence ---');
await runAsyncTest('Persist reasoning events and prevent consecutive identical duplicates', async () => {
  const now = Date.now();
  const event1 = {
    id: 're_001',
    plantId: 'plant_basil_01',
    timestamp: now,
    scenarioCode: 'NUTRIENT_DEFICIENCY_STAGE_1',
    observations: ['Early leaf yellowing with low TDS'],
    hypotheses: ['Root uptake diminished'],
    recommendedActions: ['Supplement Nitrogen'],
    confidence: 'moderate',
    plantState: 'ATTENTION',
  };

  await saveReasoningEvent('usr_test', 'farm_main', 'station_1', 'plant_basil_01', event1);

  // Attempt duplicate insert within 5s
  const duplicate = { ...event1, id: 're_dup', timestamp: now + 500 };
  await saveReasoningEvent('usr_test', 'farm_main', 'station_1', 'plant_basil_01', duplicate);

  const history = await getReasoningHistory('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 10);
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0].scenarioCode, 'NUTRIENT_DEFICIENCY_STAGE_1');
});

// ------------------------------------------------------------
// TEST 6: Plant Alert Persistence & Full Lifecycle
// ------------------------------------------------------------
console.log('\n--- 6. Plant Alert Persistence & Lifecycle ---');
await runAsyncTest('Create, acknowledge, and resolve alerts with persistent status tracking', async () => {
  const alert = {
    id: 'alt_test_ph_high',
    plantId: 'plant_basil_01',
    type: 'nutrient_anomaly',
    severity: 'warning',
    confidence: 'high',
    status: 'ACTIVE',
    title: 'Elevated Reservoir pH Detected',
    message: 'pH reading of 7.20 exceeds baseline maximum.',
    recommendedActions: ['Dose pH down buffer'],
    evidenceChain: ['pH reading 7.20', 'Target range 5.8-6.5'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await saveAlert('usr_test', 'farm_main', 'station_1', 'plant_basil_01', alert);

  let alerts = await getAlerts('usr_test', 'farm_main', 'station_1', 'plant_basil_01');
  assert.strictEqual(alerts.find(a => a.id === 'alt_test_ph_high').status, 'ACTIVE');

  // Acknowledge
  await updateAlertStatus('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 'alt_test_ph_high', 'ACKNOWLEDGED');
  alerts = await getAlerts('usr_test', 'farm_main', 'station_1', 'plant_basil_01');
  assert.strictEqual(alerts.find(a => a.id === 'alt_test_ph_high').status, 'ACKNOWLEDGED');

  // Resolve
  await updateAlertStatus('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 'alt_test_ph_high', 'RESOLVED');
  alerts = await getAlerts('usr_test', 'farm_main', 'station_1', 'plant_basil_01');
  const resolved = alerts.find(a => a.id === 'alt_test_ph_high');
  assert.strictEqual(resolved.status, 'RESOLVED');
  assert.ok(resolved.resolvedAt > 0);
});

// ------------------------------------------------------------
// TEST 7: Sensor Calibration Profile Persistence
// ------------------------------------------------------------
console.log('\n--- 7. Sensor Calibration Profile Persistence ---');
await runAsyncTest('Persist sensor calibration profile for pH, TDS, and Ultrasonic', async () => {
  const calProfile = {
    id: 'cal_station_1_v11',
    stationId: 'station_1',
    plantId: 'plant_basil_01',
    ph: {
      status: 'CALIBRATED',
      method: 'two_point',
      slope: 1.05,
      offset: -0.15,
      point1: { raw: 4.10, reference: 4.01 },
      point2: { raw: 6.95, reference: 7.00 },
      version: 1,
    },
    tds: {
      status: 'CALIBRATED',
      method: 'reference_solution',
      factor: 1.08,
      temperatureCompensation: 'unavailable',
      temperatureNotice: 'Standard 25C uncompensated',
      version: 1,
    },
    ultrasonic: {
      status: 'CALIBRATED',
      fullDistanceCm: 12.0,
      emptyDistanceCm: 58.0,
      minValidDistanceCm: 5.0,
      maxValidDistanceCm: 100.0,
      version: 1,
    },
    heartbeatTimeoutMs: 5000,
    updatedAt: Date.now(),
  };

  await saveCalibration('usr_test', 'farm_main', 'station_1', 'plant_basil_01', calProfile);
  const loaded = await getCalibration('usr_test', 'farm_main', 'station_1', 'plant_basil_01');
  assert.ok(loaded);
  assert.strictEqual(loaded.ph.status, 'CALIBRATED');
  assert.strictEqual(loaded.ph.slope, 1.05);
  assert.strictEqual(loaded.tds.temperatureCompensation, 'unavailable');
  assert.strictEqual(loaded.ultrasonic.fullDistanceCm, 12.0);
});

// ------------------------------------------------------------
// TEST 8: Strict Multi-Plant Isolation
// ------------------------------------------------------------
console.log('\n--- 8. Multi-Plant Isolation ---');
await runAsyncTest('Plant A data does not leak into Plant B', async () => {
  // Save data for Plant A (Tomato)
  await savePlantProfile('usr_test', 'farm_main', 'station_1', {
    plantId: 'plant_tomato_A',
    species: 'Tomato',
    commonName: 'Cherry Tomato',
    createdAt: Date.now(),
    lastObservedAt: Date.now(),
    monitoringStatus: 'active',
    currentHealthStatus: 'optimal',
    observationCount: 1,
  });

  await saveObservation('usr_test', 'farm_main', 'station_1', 'plant_tomato_A', {
    id: 'obs_tomato_01',
    plantId: 'plant_tomato_A',
    timestamp: Date.now(),
    ph: 5.9,
    tds: 1400,
    waterLevel: 90,
  });

  // Save data for Plant B (Lettuce)
  await savePlantProfile('usr_test', 'farm_main', 'station_1', {
    plantId: 'plant_lettuce_B',
    species: 'Lettuce',
    commonName: 'Butterhead Lettuce',
    createdAt: Date.now(),
    lastObservedAt: Date.now(),
    monitoringStatus: 'active',
    currentHealthStatus: 'warning',
    observationCount: 1,
  });

  await saveObservation('usr_test', 'farm_main', 'station_1', 'plant_lettuce_B', {
    id: 'obs_lettuce_01',
    plantId: 'plant_lettuce_B',
    timestamp: Date.now(),
    ph: 6.4,
    tds: 600,
    waterLevel: 65,
  });

  // Query Plant A
  const tomatoProfile = await getPlantProfile('usr_test', 'farm_main', 'station_1', 'plant_tomato_A');
  const tomatoObs = await getObservations('usr_test', 'farm_main', 'station_1', 'plant_tomato_A', 10);
  assert.strictEqual(tomatoProfile.commonName, 'Cherry Tomato');
  assert.strictEqual(tomatoObs.length, 1);
  assert.strictEqual(tomatoObs[0].id, 'obs_tomato_01');

  // Query Plant B
  const lettuceProfile = await getPlantProfile('usr_test', 'farm_main', 'station_1', 'plant_lettuce_B');
  const lettuceObs = await getObservations('usr_test', 'farm_main', 'station_1', 'plant_lettuce_B', 10);
  assert.strictEqual(lettuceProfile.commonName, 'Butterhead Lettuce');
  assert.strictEqual(lettuceObs.length, 1);
  assert.strictEqual(lettuceObs[0].id, 'obs_lettuce_01');

  // Verify non-cross-contamination
  assert.strictEqual(tomatoObs.find(o => o.id === 'obs_lettuce_01'), undefined);
  assert.strictEqual(lettuceObs.find(o => o.id === 'obs_tomato_01'), undefined);
});

// ------------------------------------------------------------
// TEST 9 & 10: Safe Legacy Migration & Preservation of Unlinked Data
// ------------------------------------------------------------
console.log('\n--- 9 & 10. Safe Legacy Migration & Quarantine of Unlinked Data ---');
await runAsyncTest('Migrate valid plantId data and quarantine unlinked ambiguous data', async () => {
  // Clear migration flag and populate legacy localStorage
  global.localStorage.removeItem(MIGRATION_FLAG_KEY);
  global.localStorage.removeItem(UNLINKED_LEGACY_QUARANTINE_KEY);

  // Valid legacy observations (with verifiable plantId)
  const validLegacyObs = [
    { id: 'legacy_obs_01', plantId: 'plant_crop_valid', timestamp: Date.now() - 50000, ph: 6.0, tds: 900, waterLevel: 80 },
    { id: 'legacy_obs_02', plantId: 'plant_crop_valid', timestamp: Date.now() - 40000, ph: 6.1, tds: 920, waterLevel: 78 }
  ];
  // Unlinked legacy record (missing id or plantId)
  const unlinkedRecords = [
    { timestamp: Date.now() - 30000, ph: 7.5, notes: 'Ambiguous unlinked test sample' }
  ];

  global.localStorage.setItem('hydrosmart_plant_observations_v2', JSON.stringify([...validLegacyObs, ...unlinkedRecords]));

  const migrationRes = await executeSafeLocalStorageMigration('usr_migrator', 'farm_main', 'station_1', 'plant_crop_valid');
  assert.strictEqual(migrationRes.status, 'COMPLETED');
  assert.strictEqual(migrationRes.migratedObservations, 2);
  assert.strictEqual(migrationRes.unlinkedQuarantined, 1);

  // Check quarantine storage
  const quarantineRaw = global.localStorage.getItem(UNLINKED_LEGACY_QUARANTINE_KEY);
  assert.ok(quarantineRaw);
  const quarantined = JSON.parse(quarantineRaw);
  assert.strictEqual(quarantined.length, 1);
  assert.strictEqual(quarantined[0].type, 'observation');

  // Second run: verify idempotency
  const secondRun = await executeSafeLocalStorageMigration('usr_migrator', 'farm_main', 'station_1', 'plant_crop_valid');
  assert.strictEqual(secondRun.status, 'ALREADY_MIGRATED');
  assert.strictEqual(secondRun.migratedObservations, 0);
});

// ------------------------------------------------------------
// TEST 11: Refresh Persistence (Memory Cache & Local Partition Round-Trip)
// ------------------------------------------------------------
console.log('\n--- 11. Refresh Persistence Round-Trip ---');
await runAsyncTest('Persisted data survives in-memory cache clear and rehydrates from disk partition', async () => {
  await savePlantProfile('usr_test', 'farm_main', 'station_1', {
    plantId: 'plant_persistent_reload',
    species: 'Kale',
    commonName: 'Dino Kale',
    createdAt: Date.now(),
    lastObservedAt: Date.now(),
    monitoringStatus: 'active',
    currentHealthStatus: 'optimal',
    observationCount: 3,
  });

  // Clear RAM cache to simulate page refresh / new session
  clearInMemoryDbCache();

  // Re-read
  const reloaded = await getPlantProfile('usr_test', 'farm_main', 'station_1', 'plant_persistent_reload');
  assert.ok(reloaded !== null);
  assert.strictEqual(reloaded.commonName, 'Dino Kale');
  assert.strictEqual(reloaded.observationCount, 3);
});

// ------------------------------------------------------------
// TEST 12: Backend Failure Handling
// ------------------------------------------------------------
console.log('\n--- 12. Backend Failure Handling ---');
await runAsyncTest('Graceful status return without throwing uncaught exceptions', async () => {
  const badAlertUpdate = await updateAlertStatus('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 'non_existent_id', 'RESOLVED');
  assert.strictEqual(badAlertUpdate.status, 'FAILED');
  assert.ok(badAlertUpdate.error.includes('not found'));
});

// ------------------------------------------------------------
// TEST 13: Invalid Backend Payload Rejection
// ------------------------------------------------------------
console.log('\n--- 13. Invalid Backend Payload Rejection ---');
await runAsyncTest('Rejects non-finite telemetry snapshots', async () => {
  const badSnap = {
    id: 'snap_corrupt',
    plantId: 'plant_basil_01',
    timestamp: Date.now(),
    ph: NaN,
    tds: 900,
    waterLevel: 50,
    distance: 20,
    source: 'esp32_serial',
    isSimulated: false,
  };

  const res = await saveTelemetrySnapshot('usr_test', 'farm_main', 'station_1', 'plant_basil_01', badSnap);
  assert.strictEqual(res.status, 'FAILED');
  assert.ok(res.error.includes('NaN or non-finite'));
});

// ------------------------------------------------------------
// TEST 14: Simulation vs Real Data Tagging
// ------------------------------------------------------------
console.log('\n--- 14. Simulation vs Real Data Distinction ---');
await runAsyncTest('Explicitly marks simulation data and prevents false physical hardware claims', async () => {
  const simSnap = {
    id: 'snap_sim_01',
    plantId: 'plant_basil_01',
    timestamp: Date.now(),
    ph: 6.0,
    tds: 920,
    waterLevel: 70,
    distance: 22,
    source: 'simulation',
    isSimulated: true,
  };
  await saveTelemetrySnapshot('usr_test', 'farm_main', 'station_1', 'plant_basil_01', simSnap);

  const realSnap = {
    id: 'snap_real_01',
    plantId: 'plant_basil_01',
    timestamp: Date.now() + 1000,
    ph: 6.05,
    tds: 930,
    waterLevel: 70,
    distance: 22,
    source: 'esp32_serial',
    isSimulated: false,
  };
  await saveTelemetrySnapshot('usr_test', 'farm_main', 'station_1', 'plant_basil_01', realSnap);

  const history = await getTelemetryHistory('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 10);
  const foundSim = history.find(s => s.id === 'snap_sim_01');
  const foundReal = history.find(s => s.id === 'snap_real_01');
  assert.strictEqual(foundSim.isSimulated, true);
  assert.strictEqual(foundSim.source, 'simulation');
  assert.strictEqual(foundReal.isSimulated, false);
  assert.strictEqual(foundReal.source, 'esp32_serial');
});

// ------------------------------------------------------------
// TEST 15: Change Event & Correlation Persistence
// ------------------------------------------------------------
console.log('\n--- 15. Change Events & Correlation Persistence ---');
await runAsyncTest('Persist differential WhatChanged events and Environmental Correlations', async () => {
  const changeEv = {
    id: 'chg_01',
    plantId: 'plant_basil_01',
    timestamp: Date.now(),
    metric: 'ph',
    direction: 'increased',
    previousValue: 6.0,
    currentValue: 6.8,
    delta: 0.8,
    unit: 'pH',
    confidence: 'high',
    plainSummary: 'pH increased from 6.00 to 6.80',
  };
  await saveChangeEvent('usr_test', 'farm_main', 'station_1', 'plant_basil_01', changeEv);
  const changes = await getChangeHistory('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 5);
  assert.ok(changes.find(c => c.id === 'chg_01'));

  const assoc = {
    id: 'asc_01',
    plantId: 'plant_basil_01',
    timestamp: Date.now(),
    environmentalMetric: 'tds',
    plantMetric: 'canopyCoveragePercent',
    direction: 'positive_correlation',
    strength: 'moderate',
    confidence: 'moderate',
    plainLanguageSummary: 'Canopy expansion correlated with nutrient concentration stability.',
  };
  await saveAssociation('usr_test', 'farm_main', 'station_1', 'plant_basil_01', assoc);
  const assocs = await getAssociations('usr_test', 'farm_main', 'station_1', 'plant_basil_01', 5);
  assert.ok(assocs.find(a => a.id === 'asc_01'));
});

// ------------------------------------------------------------
// TEST 16: Farmer & Technical Mode Localization Compatibility
// ------------------------------------------------------------
console.log('\n--- 16. Farmer & Technical Mode / Kannada Compatibility ---');
runTest('Persisted data successfully maps through Farmer Semantic Layer in English & Kannada', () => {
  const persistedReading = {
    ph: 7.2,
    tds: 1400,
    waterLevel: 45,
    distance: 30,
    timestamp: Date.now(),
  };

  const semanticEn = deriveFarmerSemanticState({
    latestReading: persistedReading,
    isCameraActive: true,
    language: 'en',
    userMode: 'farmer',
  });
  assert.ok(semanticEn.waterMessage);
  assert.ok(semanticEn.nutrientMessage);
  assert.strictEqual(typeof semanticEn.waterMessage, 'string');
  assert.strictEqual(typeof semanticEn.nutrientMessage, 'string');

  const semanticKn = deriveFarmerSemanticState({
    latestReading: persistedReading,
    isCameraActive: true,
    language: 'kn',
    userMode: 'farmer',
  });
  assert.ok(semanticKn.waterMessage);
  assert.ok(semanticKn.nutrientMessage);
  assert.strictEqual(typeof semanticKn.waterMessage, 'string');
  assert.strictEqual(typeof semanticKn.nutrientMessage, 'string');
  assert.notStrictEqual(semanticKn.waterMessage, semanticEn.waterMessage);
});

// ------------------------------------------------------------
// FINAL SUMMARY
// ------------------------------------------------------------
console.log('\n====================================================');
console.log(`Phase 12 Verification Results: ${passedTests}/${totalTests} Passed`);
console.log('====================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL PHASE 12 BACKEND & DATABASE TESTS PASSED!\n');
  process.exit(0);
} else {
  console.error(`❌ ${totalTests - passedTests} tests failed.`);
  process.exit(1);
}
