#!/usr/bin/env node
// ============================================================================
// HydroSmart Phase 8 — Plant Digital Profile & Lifecycle Intelligence
// Automated Verification Suite (20 Scenarios)
// ============================================================================

import {
  deriveDigitalPlantProfile,
  compilePlantLifecycleMilestones,
  calculateProfileCompleteness,
} from '../lib/intelligence/plantDigitalProfile.ts';
import {
  getLocalizedLifecycleState,
  getLocalizedMonitoringStatus,
  getLocalizedIdentificationStatus,
  getLocalizedCompletenessStatus,
  getLocalizedMilestone,
  getLocalizedDigitalProfileSummary,
} from '../lib/intelligence/farmerSemanticLayer.ts';
import { createDefaultPlantProfile } from '../lib/intelligence/observationStore.ts';

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
console.log('HydroSmart Phase 8 — Plant Digital Profile Verification Suite');
console.log('================================================================\n');

const BASE_PLANT_ID = 'specimen_alpha_001';
const now = Date.now();
const dayMs = 86400000;

// ----------------------------------------------------------------------------
// Test 1: Create a new plant
// ----------------------------------------------------------------------------
console.log('Test 1: Create a new plant with stable persistent identity');
{
  const defaultProfile = createDefaultPlantProfile(BASE_PLANT_ID);
  const digitalProfile = deriveDigitalPlantProfile({
    storedProfile: defaultProfile,
    observations: [],
  });

  assert(digitalProfile.plantId === BASE_PLANT_ID, 'Persistent plantId preserved in digital twin');
  assert(digitalProfile.identity?.plantId === BASE_PLANT_ID, 'Identity structure reflects persistent plantId');
  assert(digitalProfile.lifecycleState === 'CREATED', 'Lifecycle initialized to CREATED when zero observations exist');
  assert(digitalProfile.createdAt > 0 && digitalProfile.createdAt <= now, 'Valid provenance createdAt timestamp');
  assert(digitalProfile.currentState?.healthStatus !== undefined, 'Current physiological health state defined');
}

// ----------------------------------------------------------------------------
// Test 2: Refresh the application (same plantId and profile loaded from storage)
// ----------------------------------------------------------------------------
console.log('\nTest 2: Refresh application maintains single persistent identity');
{
  const initialCreated = now - 14 * dayMs;
  const storedSnapshot = {
    plantId: 'plant_persisted_999',
    createdAt: initialCreated,
    species: 'Genovese Basil',
    commonName: 'Sweet Basil',
    monitoringStatus: 'ACTIVE',
    currentHealthStatus: 'HEALTHY',
    observationCount: 8,
  };

  // First session load
  const profileSession1 = deriveDigitalPlantProfile({ storedProfile: storedSnapshot });
  // Second session load (simulate page refresh with same storage)
  const profileSession2 = deriveDigitalPlantProfile({ storedProfile: storedSnapshot });

  assert(profileSession1.plantId === 'plant_persisted_999', 'Session 1 loads stored plantId');
  assert(profileSession2.plantId === 'plant_persisted_999', 'Session 2 preserves exact same plantId');
  assert(profileSession2.createdAt === initialCreated, 'Provenance timestamp remains perfectly immutable across refresh');
  assert(profileSession2.commonName === 'Sweet Basil', 'Species profile retained across refresh');
}

// ----------------------------------------------------------------------------
// Test 3: Species Unknown -> Basil (safe species identity update)
// ----------------------------------------------------------------------------
console.log('\nTest 3: Species update from Unknown to Sweet Basil without plant recreation');
{
  const initialProfile = {
    plantId: BASE_PLANT_ID,
    createdAt: now - 3 * dayMs,
    species: 'Unknown Plant',
    commonName: 'Plant',
    monitoringStatus: 'ACTIVE',
    currentHealthStatus: 'STABLE',
    observationCount: 1,
  };

  const identifiedObs = {
    id: 'obs_ident_1',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    plantSpecies: 'Sweet Basil',
    speciesConfidence: 93,
    visualHealthState: 'HEALTHY',
    overallHealthScore: 88,
  };

  const updatedProfile = deriveDigitalPlantProfile({
    storedProfile: initialProfile,
    observations: [identifiedObs],
  });

  assert(updatedProfile.plantId === BASE_PLANT_ID, 'plantId remains strictly invariant after species discovery');
  assert(updatedProfile.species === 'Sweet Basil', 'Species updated to Sweet Basil');
  assert(updatedProfile.commonName === 'Sweet Basil', 'Common name synchronized to Sweet Basil');
  assert(updatedProfile.identificationStatus === 'IDENTIFIED', 'Identification status transitions to IDENTIFIED');
  assert(updatedProfile.identity?.speciesConfidence === 93, 'Identity sub-structure records model confidence');
}

// ----------------------------------------------------------------------------
// Test 4: Species confidence increases without creating new plant
// ----------------------------------------------------------------------------
console.log('\nTest 4: Species confidence refinement (65% -> 96%) preserves identity');
{
  const provisionalProfile = {
    plantId: BASE_PLANT_ID,
    createdAt: now - 5 * dayMs,
    species: 'Sweet Basil',
    commonName: 'Sweet Basil',
    speciesConfidence: 65,
    monitoringStatus: 'ACTIVE',
    currentHealthStatus: 'STABLE',
    observationCount: 2,
  };

  const refinedObs = {
    id: 'obs_ident_2',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    plantSpecies: 'Sweet Basil',
    speciesConfidence: 96,
  };

  const updatedProfile = deriveDigitalPlantProfile({
    storedProfile: provisionalProfile,
    observations: [refinedObs],
  });

  assert(updatedProfile.plantId === BASE_PLANT_ID, 'plantId remains unchanged when confidence increases');
  assert(updatedProfile.speciesConfidence === 96, 'Confidence elevated to 96%');
  assert(updatedProfile.identity?.speciesConfidence === 96, 'Identity block mirrors updated 96% confidence');
  assert(updatedProfile.createdAt === provisionalProfile.createdAt, 'Original plant registration date preserved');
}

// ----------------------------------------------------------------------------
// Test 5: Health STABLE -> ATTENTION (health history updated)
// ----------------------------------------------------------------------------
console.log('\nTest 5: Health transition from STABLE to ATTENTION records history');
{
  const baselineObs = {
    id: 'obs_base',
    plantId: BASE_PLANT_ID,
    timestamp: now - 2 * dayMs,
    plantSpecies: 'Sweet Basil',
    visualHealthState: 'STABLE',
    overallHealthScore: 85,
    ph: 6.2,
    tds: 900,
    waterLevel: 80,
  };

  const stressObs = {
    id: 'obs_stress',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    plantSpecies: 'Sweet Basil',
    visualHealthState: 'ATTENTION',
    overallHealthScore: 58,
    activeAnomalies: ['Leaf Yellowing / Chlorosis'],
    ph: 7.6,
    tds: 1350,
    waterLevel: 55,
  };

  const updatedProfile = deriveDigitalPlantProfile({
    storedProfile: {
      plantId: BASE_PLANT_ID,
      createdAt: now - 2 * dayMs,
      currentHealthStatus: 'STABLE',
      observationCount: 2,
    },
    observations: [stressObs, baselineObs],
    latestVisualHealth: {
      healthState: 'ATTENTION',
      visualHealthScore: 58,
      chlorosisYellowPercent: 18,
      necroticBrownPercent: 2,
    },
  });

  assert(updatedProfile.plantId === BASE_PLANT_ID, 'plantId invariant preserved during stress event');
  assert(updatedProfile.lifecycleState === 'ATTENTION', 'Plant lifecycle state accurately transitions to ATTENTION');
  assert(updatedProfile.currentHealthStatus === 'ATTENTION', 'currentHealthStatus reflects ATTENTION');
  assert(updatedProfile.currentState?.activeAnomaly !== undefined, 'Active physiological anomaly registered');
}

// ----------------------------------------------------------------------------
// Test 6: Plant recovers ATTENTION -> RECOVERING (emits recovery milestone)
// ----------------------------------------------------------------------------
console.log('\nTest 6: Plant recovers from ATTENTION to RECOVERING');
{
  const obs1 = {
    id: 'obs_stress_1',
    plantId: BASE_PLANT_ID,
    timestamp: now - 3 * dayMs,
    plantSpecies: 'Sweet Basil',
    visualHealthState: 'ATTENTION',
    overallHealthScore: 55,
  };
  const obs2 = {
    id: 'obs_recovery_2',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    plantSpecies: 'Sweet Basil',
    visualHealthState: 'HEALTHY',
    overallHealthScore: 84,
  };

  const updatedProfile = deriveDigitalPlantProfile({
    storedProfile: {
      plantId: BASE_PLANT_ID,
      createdAt: now - 5 * dayMs,
      currentHealthStatus: 'ATTENTION',
      recoveryStatus: 'recovering',
      observationCount: 2,
    },
    observations: [obs2, obs1],
    whatChangedSummary: {
      overallDirection: 'recovered',
      primaryDriver: 'Reservoir balance normalized',
      summaryText: 'Plant stress symptoms have cleared',
      confidence: 'HIGH',
      events: [],
      timestamp: now,
      timeHorizonDays: 3,
      baselineObservationId: obs1.id,
      currentObservationId: obs2.id,
      reviewRequiredItems: [],
      sensorModalityStates: {
        ph: 'OPTIMAL',
        tds: 'OPTIMAL',
        waterLevel: 'OPTIMAL',
        camera: 'ACTIVE',
      },
    },
  });

  const milestones = compilePlantLifecycleMilestones({
    plantId: BASE_PLANT_ID,
    observations: [obs2, obs1],
    createdAt: now - 5 * dayMs,
  });

  assert(updatedProfile.lifecycleState === 'RECOVERING', 'Lifecycle state marks plant as RECOVERING');
  const recoveryMilestone = milestones.find((m) => m.type === 'RECOVERY_DETECTED');
  assert(recoveryMilestone !== undefined, 'Recovery detected milestone generated');
  assert(recoveryMilestone?.status === 'optimal', 'Recovery milestone marked optimal');
}

// ----------------------------------------------------------------------------
// Test 7: Growth measurement increases (without claiming physical wet/dry biomass)
// ----------------------------------------------------------------------------
console.log('\nTest 7: Growth calculation reports optical canopy expansion without false biomass claims');
{
  const obsOld = {
    id: 'obs_old',
    plantId: BASE_PLANT_ID,
    timestamp: now - 7 * dayMs,
    canopyCoveragePercent: 12.0,
    plantSpecies: 'Sweet Basil',
    isPlantDetected: true,
    plantDetectionConfidence: 95,
  };
  const obsNew = {
    id: 'obs_new',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    canopyCoveragePercent: 19.5,
    plantSpecies: 'Sweet Basil',
    isPlantDetected: true,
    plantDetectionConfidence: 95,
  };

  const profile = deriveDigitalPlantProfile({
    storedProfile: { plantId: BASE_PLANT_ID, createdAt: now - 7 * dayMs },
    observations: [obsNew, obsOld],
  });

  assert(profile.growth?.cumulativeGrowthDelta === 7.5, 'Canopy expansion calculated at +7.5%');
  assert(profile.growth?.growthTrend === 'expanding', 'Growth trend categorized as expanding');
  assert(profile.growth?.dailyGrowthVelocity > 0, 'Positive daily growth velocity recorded');
  assert(profile.growth?.disclaimer.includes('IMAGE-DERIVED GROWTH ESTIMATES'), 'Contains mandatory non-biomass disclaimer');
  assert(!profile.growth?.disclaimer.includes('grams'), 'Strictly refrains from claiming physical biomass grams');
}

// ----------------------------------------------------------------------------
// Test 8: Optical confidence gating under poor camera frame
// ----------------------------------------------------------------------------
console.log('\nTest 8: Poor camera frame suppresses false growth conclusions');
{
  const obsOld = {
    id: 'obs_1',
    plantId: BASE_PLANT_ID,
    timestamp: now - 5 * dayMs,
    canopyCoveragePercent: 12.0,
    plantSpecies: 'Sweet Basil',
    plantDetectionConfidence: 90,
  };
  const obsBlurry = {
    id: 'obs_blurry',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    canopyCoveragePercent: 24.0, // Apparent jump due to camera blur/artifact
    plantSpecies: 'Sweet Basil',
    plantDetectionConfidence: 35,
    isPlantDetected: true,
  };

  const profile = deriveDigitalPlantProfile({
    storedProfile: { plantId: BASE_PLANT_ID, createdAt: now - 5 * dayMs },
    observations: [obsBlurry, obsOld],
    latestDetection: {
      isPlantDetected: true,
      confidence: 38,
      state: 'LOW_CONFIDENCE',
      plantPresenceScore: 38,
      detectionMethod: 'heuristic_cv',
      plantCandidateRegions: [],
      timestamp: now,
    },
  });

  assert(profile.growth?.growthConfidence === 'LOW', 'Optical gating downgrades growth confidence to LOW');
  assert(profile.lifecycleState !== 'GROWING', 'Suppresses GROWING lifecycle state when frame is optically unverified');
}

// ----------------------------------------------------------------------------
// Test 9: New reasoning event referenced correctly
// ----------------------------------------------------------------------------
console.log('\nTest 9: Digital profile integrates latest multimodal reasoning event');
{
  const reasoningEvent = {
    id: 'reasoning_evt_42',
    timestamp: now,
    scenarioCode: 'NUTRIENT_DEFICIENCY_CHLOROSIS',
    plantState: 'ATTENTION',
    confidence: 'high',
    observations: ['Yellowing on lower leaves', 'TDS reads 650 PPM (below target 900)'],
    interpretations: ['Nitrogen availability depressed by low nutrient conductivity'],
    farmerCopy: {
      observableSummary: 'Foliage shows yellowing due to low nutrient salt levels.',
      whySummary: 'Water reservoir has diluted minerals.',
      whatNextSummary: 'Top up hydroponic nutrient solution.',
    },
    recommendations: ['Add 150ml of Nutrient Solution A+B'],
  };

  const profile = deriveDigitalPlantProfile({
    storedProfile: { plantId: BASE_PLANT_ID, createdAt: now - 2 * dayMs },
    observations: [],
    latestReasoningEvent: reasoningEvent,
  });

  assert(profile.currentState?.latestReasoningEventId === 'reasoning_evt_42', 'Profile records reasoning event ID');
  assert(profile.currentState?.healthStatus === 'ATTENTION', 'Health status aligns with reasoning event plantState');
  assert(profile.currentState?.reasoningSummary?.includes('NUTRIENT_DEFICIENCY_CHLOROSIS'), 'Profile reflects scenario code');
}

// ----------------------------------------------------------------------------
// Test 10: New What Changed event referenced without conflict
// ----------------------------------------------------------------------------
console.log('\nTest 10: Digital profile synthesizes longitudinal What Changed events');
{
  const profile = deriveDigitalPlantProfile({
    storedProfile: { plantId: BASE_PLANT_ID, createdAt: now - 3 * dayMs },
    observations: [],
    whatChangedSummary: {
      overallDirection: 'shifted',
      primaryDriver: 'Water evaporation elevated nutrient concentration',
      summaryText: 'TDS increased by 180 PPM over 48 hours.',
      confidence: 'HIGH',
      events: [],
      timestamp: now,
      timeHorizonDays: 2,
      reviewRequiredItems: [],
      sensorModalityStates: { ph: 'OPTIMAL', tds: 'WARNING', waterLevel: 'OPTIMAL', camera: 'ACTIVE' },
    },
  });

  assert(profile.plantId === BASE_PLANT_ID, 'plantId remains intact with What Changed summary');
  assert(profile.currentState !== undefined, 'Current state defined');
  assert(profile.completeness !== undefined, 'Completeness audit runs synchronously');
}

// ----------------------------------------------------------------------------
// Test 11: Baseline missing yields BASELINE_PENDING
// ----------------------------------------------------------------------------
console.log('\nTest 11: Missing baseline triggers BASELINE_PENDING without fabricating data');
{
  const profile = deriveDigitalPlantProfile({
    storedProfile: { plantId: BASE_PLANT_ID, createdAt: now },
    observations: [],
  });

  assert(profile.baselineStatus === 'BASELINE_PENDING', 'baselineStatus is BASELINE_PENDING');
  assert(profile.baseline?.isEstablished === false, 'baseline.isEstablished is false');
  assert(profile.baseline?.initialPH === undefined, 'No fake baseline pH fabricated');
  assert(profile.baseline?.initialTDS === undefined, 'No fake baseline TDS fabricated');
  assert(profile.baseline?.initialCanopyCoverage === undefined, 'No fake baseline canopy coverage fabricated');
}

// ----------------------------------------------------------------------------
// Test 12: Sensor unavailable does not show fabricated values
// ----------------------------------------------------------------------------
console.log('\nTest 12: Sensor outage correctly marks UNAVAILABLE without injecting fake telemetry');
{
  const profile = deriveDigitalPlantProfile({
    storedProfile: { plantId: BASE_PLANT_ID, createdAt: now - 2 * dayMs },
    observations: [],
    latestReading: null,
    isTelemetryStale: true,
  });

  assert(String(profile.environment?.sensorAvailability.ph).toLowerCase() === 'unavailable', 'pH sensor flagged as UNAVAILABLE');
  assert(String(profile.environment?.sensorAvailability.tds).toLowerCase() === 'unavailable', 'TDS sensor flagged as UNAVAILABLE');
  assert(profile.environment?.latestPH === undefined, 'latestPH is undefined (not 0.0 or 7.0 fabricated)');
  assert(profile.environment?.latestTDS === undefined, 'latestTDS is undefined (not 0 or 1000 fabricated)');
}

// ----------------------------------------------------------------------------
// Test 13: No historical observations yields insufficient data audit
// ----------------------------------------------------------------------------
console.log('\nTest 13: Completeness audit detects insufficient observations');
{
  const completeness = calculateProfileCompleteness({
    identificationStatus: 'UNKNOWN',
    baselineStatus: 'BASELINE_PENDING',
    observationCount: 0,
    growthTrend: 'insufficient_data',
    sensorAvailability: { ph: 'UNAVAILABLE', tds: 'UNAVAILABLE', waterLevel: 'UNAVAILABLE', camera: 'INACTIVE' },
  });

  assert(completeness.status === 'INSUFFICIENT_DATA', 'Completeness categorized as INSUFFICIENT_DATA');
  assert(completeness.score < 25, 'Completeness score is strictly below 25 points');
  assert(completeness.categories.healthHistory.available === false, 'Health history flagged unavailable');
  assert(completeness.missingItems.length > 0, 'Audit lists specific missing telemetry and visual items');
}

// ----------------------------------------------------------------------------
// Test 14: Observation with unlinked/legacy ID
// ----------------------------------------------------------------------------
console.log('\nTest 14: Legacy/unlinked observation IDs do not corrupt active specimen identity');
{
  const legacyObs = {
    id: 'legacy_obs_999',
    plantId: 'foreign_plant_unknown',
    timestamp: now - dayMs,
    plantSpecies: 'Mint',
    visualHealthState: 'HEALTHY',
  };

  const currentObs = {
    id: 'current_obs_001',
    plantId: BASE_PLANT_ID,
    timestamp: now,
    plantSpecies: 'Sweet Basil',
    visualHealthState: 'HEALTHY',
  };

  const milestones = compilePlantLifecycleMilestones({
    plantId: BASE_PLANT_ID,
    observations: [currentObs, legacyObs],
    createdAt: now - 2 * dayMs,
  });

  const foreignMilestones = milestones.filter((m) => m.plantId === 'foreign_plant_unknown');
  assert(foreignMilestones.length === 0, 'No foreign milestones attached to active plant journey');
  const activeMilestones = milestones.filter((m) => m.plantId === BASE_PLANT_ID);
  assert(activeMilestones.length > 0, 'Active plant milestones strictly isolate active plantId');
}

// ----------------------------------------------------------------------------
// Test 15: Farmer Mode English copy
// ----------------------------------------------------------------------------
console.log('\nTest 15: Farmer Mode English copy provides clear agronomic explanations');
{
  const profile = deriveDigitalPlantProfile({
    storedProfile: {
      plantId: BASE_PLANT_ID,
      species: 'Sweet Basil',
      commonName: 'Sweet Basil',
      createdAt: now - 3 * dayMs,
    },
    observations: [],
  });

  const summary = getLocalizedDigitalProfileSummary(profile, 'en');
  const lifecycleLabel = getLocalizedLifecycleState('GROWING', 'en');
  const monitoringLabel = getLocalizedMonitoringStatus('ACTIVE', 'en');

  assert(summary.story.length > 10, 'Generates comprehensive English narrative summary');
  assert(lifecycleLabel.includes('Growth'), 'English lifecycle state is clear and intuitive');
  assert(monitoringLabel === 'Active', 'Monitoring status in English is Active');
}

// ----------------------------------------------------------------------------
// Test 16: Farmer Mode Kannada copy
// ----------------------------------------------------------------------------
console.log('\nTest 16: Farmer Mode Kannada copy renders natural, respectful agricultural phrasing');
{
  const profile = deriveDigitalPlantProfile({
    storedProfile: {
      plantId: BASE_PLANT_ID,
      species: 'Sweet Basil',
      commonName: 'ತುಳಸಿ (Sweet Basil)',
      createdAt: now - 3 * dayMs,
    },
    observations: [],
  });

  const summaryKn = getLocalizedDigitalProfileSummary(profile, 'kn');
  const lifecycleLabelKn = getLocalizedLifecycleState('GROWING', 'kn');
  const completenessLabelKn = getLocalizedCompletenessStatus('PARTIAL', 'kn');
  const identLabelKn = getLocalizedIdentificationStatus('IDENTIFIED', 'kn');

  assert(summaryKn.story.includes('ಗಿಡ') || summaryKn.story.includes('ತುಳಸಿ'), 'Kannada summary includes plant references');
  assert(lifecycleLabelKn.includes('ಬೆಳೆಯುತ್ತಿದೆ'), 'Kannada lifecycle state is correctly translated');
  assert(completenessLabelKn.includes('ಭಾಗಶಃ'), 'Kannada completeness status is localized');
  assert(identLabelKn.includes('ದೃಢೀಕೃತ'), 'Kannada identification status is localized');
}

// ----------------------------------------------------------------------------
// Test 17: Technical Mode English copy
// ----------------------------------------------------------------------------
console.log('\nTest 17: Technical Mode English displays precise metrics and parameters');
{
  const milestone = {
    id: 'm1',
    plantId: BASE_PLANT_ID,
    type: 'BASELINE_ESTABLISHED',
    timestamp: now,
    dateString: 'Sep 26, 2026',
    dayNumber: 1,
    dayLabel: 'Day 1 · Baseline Calibration',
    title: 'Baseline Calibration Established',
    description: 'Initial optical coverage and sensor baselines locked.',
    confidence: 'HIGH',
    status: 'optimal',
  };

  const localizedEn = getLocalizedMilestone(milestone, 'en');
  assert(localizedEn.title === 'Baseline Calibration Established', 'English milestone title preserved');
  assert(localizedEn.dayLabel.includes('Day 1'), 'English day label rendered correctly');
}

// ----------------------------------------------------------------------------
// Test 18: Technical Mode Kannada copy
// ----------------------------------------------------------------------------
console.log('\nTest 18: Technical Mode Kannada renders contextual terminology');
{
  const milestone = {
    id: 'm1',
    plantId: BASE_PLANT_ID,
    type: 'BASELINE_ESTABLISHED',
    timestamp: now,
    dateString: 'Sep 26, 2026',
    dayNumber: 1,
    dayLabel: 'Day 1 · Baseline',
    title: 'Baseline Calibration Established',
    description: 'Initial optical coverage locked.',
    confidence: 'HIGH',
    status: 'optimal',
  };

  const localizedKn = getLocalizedMilestone(milestone, 'kn');
  assert(localizedKn.title.includes('ಮೂಲ ಮಾಪನಾಂಕ'), 'Kannada technical baseline translation is accurate');
  assert(localizedKn.dayLabel.includes('ದಿನ 1'), 'Kannada day prefix rendered correctly');
}

// ----------------------------------------------------------------------------
// Test 19: Large observation history (100+ observations) performance benchmark
// ----------------------------------------------------------------------------
console.log('\nTest 19: High-volume observation history (120 observations) performance (< 50ms)');
{
  const largeObservations = [];
  const baseTime = now - 60 * dayMs;

  for (let i = 0; i < 120; i++) {
    largeObservations.push({
      id: `obs_${i}`,
      plantId: BASE_PLANT_ID,
      timestamp: baseTime + i * (dayMs / 2),
      canopyCoveragePercent: 10 + i * 0.1,
      ph: 6.0 + (i % 5) * 0.1,
      tds: 900 + (i % 10) * 20,
      waterLevel: 80 - (i % 20),
      visualHealthState: 'HEALTHY',
      overallHealthScore: 85,
      plantSpecies: 'Sweet Basil',
      speciesConfidence: 95,
      isPlantDetected: true,
      plantDetectionConfidence: 92,
    });
  }

  const startTime = performance.now();
  const profile = deriveDigitalPlantProfile({
    storedProfile: { plantId: BASE_PLANT_ID, createdAt: baseTime },
    observations: largeObservations,
  });
  const elapsedMs = performance.now() - startTime;

  assert(profile.statistics?.totalObservationCount === 120, 'Accurately counted 120 observations');
  assert(profile.growth?.cumulativeGrowthDelta !== undefined, 'Aggregated growth across 120 observations');
  assert(elapsedMs < 50, `Digital profile derivation executed in ${elapsedMs.toFixed(2)}ms (< 50ms target)`);
}

// ----------------------------------------------------------------------------
// Test 20: Multiple concurrent/duplicate initialization attempts idempotence
// ----------------------------------------------------------------------------
console.log('\nTest 20: Multiple initialization attempts preserve existing plantId and createdAt');
{
  const originalProfile = createDefaultPlantProfile('specimen_omega_77');
  const originalTimestamp = originalProfile.createdAt;

  // Simulate multiple re-initializations (e.g. from rapid page renders or component mounts)
  const init1 = deriveDigitalPlantProfile({ storedProfile: originalProfile });
  const init2 = deriveDigitalPlantProfile({ storedProfile: init1 });
  const init3 = deriveDigitalPlantProfile({ storedProfile: init2 });

  assert(init3.plantId === 'specimen_omega_77', 'plantId is completely idempotent across multiple cycles');
  assert(init3.createdAt === originalTimestamp, 'createdAt timestamp strictly preserved across multiple inits');
  assert(init3.monitoringStatus !== undefined, 'Valid monitoring status persists');
}

// ----------------------------------------------------------------------------
// Final Summary
// ----------------------------------------------------------------------------
console.log('\n================================================================');
console.log(`Results: ${passedTests}/${totalTests} tests passed`);
console.log('================================================================');

if (passedTests === totalTests) {
  console.log('✓ All 20 Phase 8 verification scenarios PASSED successfully.\n');
  process.exit(0);
} else {
  console.error(`✗ ${totalTests - passedTests} tests FAILED.\n`);
  process.exit(1);
}
