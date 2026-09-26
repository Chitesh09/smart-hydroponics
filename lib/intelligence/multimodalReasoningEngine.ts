// ============================================================
// HydroSmart — Multimodal Plant Reasoning Engine
// Transparent, Evidence-Based, Non-Causal Agronomic Synthesis
// ============================================================

import {
  PlantReasoningEvent,
  StructuredHealthState,
  ReasoningConfidenceLevel,
  MultimodalScenarioCode,
} from './types';
import {
  NormalizedEvidencePackage,
  normalizePlantEvidence,
  RawEvidenceInputs,
} from './evidenceNormalization';

export const REASONING_ENGINE_VERSION = 'hydrosmart-reasoning-v1.0.0';

/**
 * Execute evidence-based multimodal reasoning over normalized sensory inputs
 */
export function evaluateMultimodalReasoning(
  pkg: NormalizedEvidencePackage
): PlantReasoningEvent {
  const now = pkg.timestamp || Date.now();
  const plantId = pkg.plantId;

  const observations: string[] = [];
  const interpretations: string[] = [];
  const recommendations: string[] = [];
  const limitations: string[] = [];
  const conflictingSignals: string[] = [];
  const contributingSignals: string[] = [];

  let scenarioCode: MultimodalScenarioCode = 'STABLE_EQUILIBRIUM';
  let plantState: StructuredHealthState = 'STABLE';
  let confidence: ReasoningConfidenceLevel = 'moderate';

  let primaryFarmerHeadline = '';
  let primaryFarmerWhy = '';
  let primaryFarmerAction = '';

  const {
    isCameraAvailable,
    isSensorAvailable,
    isPlantDetected,
    presenceState,
    visualHealthState,
    chlorosisPercent,
    necroticPercent,
    canopyCoveragePercent,
    sensorEvidence,
    hasHistoricalBaseline,
    isSpeciesIdentified,
    speciesName,
    isSimulation,
    cropTargetProfile: target,
  } = pkg;

  const ph = sensorEvidence.ph;
  const tds = sensorEvidence.tds;
  const water = sensorEvidence.waterLevel;

  // ------------------------------------------------------------
  // GATE 0: NO PLANT DETECTED
  // If Phase 3 says NO_PLANT_DETECTED, strictly block health reasoning
  // ------------------------------------------------------------
  if (isCameraAvailable && presenceState === 'NO_PLANT_DETECTED') {
    scenarioCode = 'NO_PLANT_DETECTED';
    plantState = 'UNKNOWN';
    confidence = 'insufficient_evidence';

    observations.push('Computer vision scan detected zero active plant canopy in the camera frame.');
    limitations.push('No plant detected in camera frame. Specimen visual inspection cannot proceed.');
    primaryFarmerHeadline = 'No plant detected. Place the plant in front of the camera.';
    primaryFarmerWhy = 'The camera view is clear, but no living plant canopy was detected.';
    primaryFarmerAction = 'Position your plant in front of the camera to begin monitoring.';

    return {
      id: `re_${now}_${Math.random().toString(36).substring(2, 6)}`,
      plantId,
      timestamp: now,
      scenarioCode,
      plantState,
      evidence: pkg.evidenceList,
      sensorEvidence: pkg.sensorEvidence,
      observations,
      interpretations,
      recommendations: ['Position specimen inside camera view'],
      confidence,
      confidenceScore: 10,
      contributingSignals: ['camera_presence'],
      limitations,
      conflictingSignals,
      reasoningVersion: REASONING_ENGINE_VERSION,
      primaryFarmerHeadline,
      primaryFarmerWhy,
      primaryFarmerAction,
      farmerCopy: {
        observableSummary: primaryFarmerHeadline,
        whySummary: primaryFarmerWhy,
        farmerAction: primaryFarmerAction,
      },
      sensorAvailable: isSensorAvailable,
    };
  }

  // ------------------------------------------------------------
  // GATE 1: POOR IMAGE QUALITY / SCAN NOT READY
  // ------------------------------------------------------------
  if (isCameraAvailable && (presenceState === 'SCAN_NOT_READY' || presenceState === 'LOW_CONFIDENCE')) {
    scenarioCode = 'POOR_IMAGE_QUALITY';
    plantState = 'UNKNOWN';
    confidence = 'insufficient_evidence';

    if (presenceState === 'SCAN_NOT_READY') {
      observations.push('Camera view is blurry, underexposed, or overexposed.');
      limitations.push('Camera image quality is insufficient for reliable visual assessment.');
      primaryFarmerHeadline = 'Camera view is blurry or lighting is poor.';
      primaryFarmerWhy = 'Optical scan quality is below the required sharpness or illumination threshold.';
      primaryFarmerAction = 'Clean the lens, focus the camera, or adjust ambient lighting.';
    } else {
      observations.push('Plant canopy appears small or distant in optical frame.');
      limitations.push('Low confidence plant presence detection. Distance impairs accurate leaf diagnostics.');
      primaryFarmerHeadline = 'Plant appears distant or small.';
      primaryFarmerWhy = 'Canopy resolution is insufficient for confident foliar health analysis.';
      primaryFarmerAction = 'Move the camera closer to the plant leaves.';
    }

    if (isSensorAvailable) {
      contributingSignals.push('sensors_only');
      if (water.hasAnomaly) limitations.push(`Environmental sensor notice: ${water.anomalyDetails}`);
      if (ph.hasAnomaly) limitations.push(`Environmental sensor notice: ${ph.anomalyDetails}`);
      if (tds.hasAnomaly) limitations.push(`Environmental sensor notice: ${tds.anomalyDetails}`);
    }

    return {
      id: `re_${now}_${Math.random().toString(36).substring(2, 6)}`,
      plantId,
      timestamp: now,
      scenarioCode,
      plantState,
      evidence: pkg.evidenceList,
      sensorEvidence: pkg.sensorEvidence,
      observations,
      interpretations,
      recommendations: [primaryFarmerAction],
      confidence,
      confidenceScore: 25,
      contributingSignals,
      limitations,
      conflictingSignals,
      reasoningVersion: REASONING_ENGINE_VERSION,
      primaryFarmerHeadline,
      primaryFarmerWhy,
      primaryFarmerAction,
      farmerCopy: {
        observableSummary: primaryFarmerHeadline,
        whySummary: primaryFarmerWhy,
        farmerAction: primaryFarmerAction,
      },
      sensorAvailable: isSensorAvailable,
    };
  }

  // ------------------------------------------------------------
  // RECORD BASELINE OBSERVATIONS (Verifiable Facts)
  // ------------------------------------------------------------
  if (isCameraAvailable && isPlantDetected) {
    contributingSignals.push('camera_vision');
    const plantLabel = isSpeciesIdentified && speciesName ? speciesName : 'Plant';
    observations.push(
      `${plantLabel} canopy observed covering ${canopyCoveragePercent ?? '--'}% of frame (Visual state: ${visualHealthState}).`
    );

    if (chlorosisPercent !== undefined && chlorosisPercent > 8.0) {
      observations.push(`Foliar chlorosis (yellowing) measured across ${chlorosisPercent}% of leaf area.`);
    }
    if (necroticPercent !== undefined && necroticPercent > 3.0) {
      observations.push(`Foliar necrosis (browning) measured across ${necroticPercent}% of leaf area.`);
    }
  } else if (!isCameraAvailable) {
    limitations.push('Camera evidence is currently unavailable, so plant visual condition cannot be assessed.');
  }

  if (isSensorAvailable) {
    contributingSignals.push(isSimulation ? 'sensors_simulated' : 'sensors_physical');
    if (ph.current !== undefined) observations.push(`Measured solution pH at ${ph.current.toFixed(2)} (${ph.trend}).`);
    if (tds.current !== undefined) observations.push(`Measured nutrient TDS at ${Math.round(tds.current)} PPM (${tds.trend}).`);
    if (water.current !== undefined) observations.push(`Measured reservoir level at ${Math.round(water.current)}% capacity (${water.trend}).`);
  } else {
    limitations.push(
      'Environmental sensor data is currently unavailable, so the system cannot assess whether a sensor change is associated with this observation.'
    );
  }

  if (!hasHistoricalBaseline) {
    limitations.push('Historical observation history is insufficient (1 snapshot logged). Rate of change cannot be determined.');
  }

  // ------------------------------------------------------------
  // CORE REASONING SCENARIOS
  // ------------------------------------------------------------
  const isYellowingElevated = (chlorosisPercent ?? 0) >= 10.0;
  const isBrowningElevated = (necroticPercent ?? 0) >= 4.0;
  const isVisualDistress = visualHealthState === 'ATTENTION' || visualHealthState === 'CRITICAL' || isYellowingElevated || isBrowningElevated;
  const isVisualHealthy = visualHealthState === 'HEALTHY' || visualHealthState === 'STABLE';

  const isSensorAnomalyPresent = ph.hasAnomaly || tds.hasAnomaly || water.hasAnomaly;
  const isWaterCritical = water.hasAnomaly && water.anomalySeverity === 'critical';

  // SCENARIO 8: SENSOR UNAVAILABLE (Camera only)
  if (!isSensorAvailable && isCameraAvailable && isPlantDetected) {
    scenarioCode = 'SENSOR_UNAVAILABLE';
    plantState = isVisualDistress ? 'ATTENTION' : 'STABLE';
    confidence = 'moderate';

    if (isYellowingElevated) {
      primaryFarmerHeadline = 'Your plant is showing leaf yellowing.';
      primaryFarmerWhy = 'Foliar yellowing is visible. Sensor readings are currently unavailable, so environmental correlation cannot be confirmed.';
      primaryFarmerAction = 'Inspect the nutrient solution manually and connect sensor hardware.';
      interpretations.push('Visual yellowing was detected. Because environmental telemetry is offline, potential chemical or root-zone associations cannot be confirmed.');
      recommendations.push('Check reservoir nutrient balance and connect sensor telemetry');
    } else {
      primaryFarmerHeadline = 'Plant appearance appears stable.';
      primaryFarmerWhy = 'Leaves look healthy, but environmental telemetry is currently offline.';
      primaryFarmerAction = 'Continue visual observation and verify sensor connections.';
      interpretations.push('Plant foliage visual condition is acceptable. Environmental operating conditions remain unmonitored.');
      recommendations.push('Connect sensor hardware to verify nutrient solution');
    }
  }

  // SCENARIO 7: CAMERA UNAVAILABLE (Sensors only)
  else if (!isCameraAvailable && isSensorAvailable) {
    scenarioCode = 'CAMERA_UNAVAILABLE';
    plantState = isWaterCritical ? 'CRITICAL' : (isSensorAnomalyPresent ? 'ATTENTION' : 'STABLE');
    confidence = 'moderate';

    if (isWaterCritical) {
      primaryFarmerHeadline = 'Water reservoir is critically low.';
      primaryFarmerWhy = 'Water level dropped below critical operating threshold. Camera is offline, so foliar turgor cannot be evaluated.';
      primaryFarmerAction = 'Refill the reservoir immediately to prevent pump damage or root dehydration.';
      interpretations.push('Severe reservoir deficit detected by physical level probe. Risk of pump cavitation.');
      recommendations.push('Refill reservoir immediately', 'Activate camera for visual inspection');
    } else if (isSensorAnomalyPresent) {
      primaryFarmerHeadline = 'Environmental sensor reading needs attention.';
      primaryFarmerWhy = `${ph.hasAnomaly ? ph.anomalyDetails : ''} ${tds.hasAnomaly ? tds.anomalyDetails : ''}`.trim();
      primaryFarmerAction = 'Check the nutrient solution and turn on camera to verify leaf health.';
      interpretations.push('Physical sensors indicate parameters drifted outside target envelope. Visual impact is currently unobserved.');
      recommendations.push('Adjust nutrient solution balance', 'Activate camera');
    } else {
      primaryFarmerHeadline = 'Environmental readings are stable.';
      primaryFarmerWhy = 'All streaming sensor values are within normal operating ranges. Camera view is currently offline.';
      primaryFarmerAction = 'Start Dashboard camera to inspect plant growth.';
      interpretations.push('Nutrient and reservoir telemetry indicate stable solution chemistry.');
      recommendations.push('Start plant camera to establish visual baseline');
    }
  }

  // SCENARIO 13: INSUFFICIENT HISTORY (N=1 with visual discoloration)
  else if (!hasHistoricalBaseline && isVisualDistress && !isSensorAnomalyPresent) {
    scenarioCode = 'INSUFFICIENT_HISTORY';
    plantState = 'ATTENTION';
    confidence = 'low';

    interpretations.push(
      'Discoloration is currently visible on the plant, but there is not enough historical data to determine whether it is increasing or stable.'
    );

    primaryFarmerHeadline = 'Foliar discoloration is present; trend awaiting further observations.';
    primaryFarmerWhy = 'Only one observation checkpoint exists. The system cannot establish rate of progression yet.';
    primaryFarmerAction = 'Log another observation cycle tomorrow to assess longitudinal trajectory.';
    recommendations.push('Log subsequent observations to calculate change over time', 'Ensure sensors remain online');
  }

  // SCENARIO 14: RECOVERING TRAJECTORY
  else if (
    hasHistoricalBaseline &&
    pkg.historicalVisualDelta &&
    pkg.historicalVisualDelta.chlorosisDelta <= -5.0 &&
    (chlorosisPercent ?? 0) <= 12.0 &&
    !isSensorAnomalyPresent
  ) {
    scenarioCode = 'RECOVERING_TRAJECTORY';
    plantState = 'HEALTHY';
    confidence = 'high';

    interpretations.push(
      'Leaf chlorosis has decreased significantly compared to the baseline observation while root-zone telemetry has normalized. This positive trajectory indicates biological recovery.'
    );

    primaryFarmerHeadline = 'Plant is recovering well with reduced leaf discoloration.';
    primaryFarmerWhy = 'Visual health scores and leaf chlorophyll levels are improving as environmental parameters stabilized.';
    primaryFarmerAction = 'Maintain current solution balance and continue observation schedule.';
    recommendations.push('Maintain balanced solution parameters', 'Log observation to confirm ongoing recovery');
  }

  // SCENARIO 7: CONFLICTING EVIDENCE (Severe visual distress + all sensors nominal)
  else if (
    isVisualDistress &&
    ((chlorosisPercent ?? 0) >= 20.0 || visualHealthState === 'CRITICAL') &&
    !isSensorAnomalyPresent &&
    isSensorAvailable
  ) {
    scenarioCode = 'CONFLICTING_EVIDENCE';
    plantState = 'ATTENTION';
    confidence = 'moderate';

    conflictingSignals.push('Severe foliar chlorosis or necrosis observed while all sensor readings (pH, TDS, Water Level) report perfectly nominal values.');
    observations.push('Severe optical leaf discoloration contrasts sharply with normal root-zone chemistry.');

    interpretations.push(
      'A notable disagreement exists between severe visual foliar symptoms and normal water/nutrient telemetry. Visual stress may stem from pathogens, root-rot, lighting issues, or probe miscalibration.'
    );

    primaryFarmerHeadline = 'Significant leaf distress detected while sensor readings appear normal.';
    primaryFarmerWhy = 'Severe discoloration contrasts with normal pH and TDS readings. Cross-inspection is advised.';
    primaryFarmerAction = 'Check root health, inspect lighting, and cross-verify sensor probe calibration.';
    recommendations.push('Inspect root system for root rot or lack of oxygenation', 'Verify probe calibration with buffer solution', 'Check lighting spectrum and distance');
  }

  // SCENARIO 2, 3, 4: CORRELATED ENVIRONMENTAL STRESS (Visual distress + active sensor anomaly)
  else if (isVisualDistress && isSensorAnomalyPresent) {
    scenarioCode = 'CORRELATED_ENVIRONMENTAL_STRESS';
    plantState = isWaterCritical ? 'CRITICAL' : 'ATTENTION';
    confidence = 'high';

    const causes: string[] = [];
    if (ph.hasAnomaly) causes.push(`solution pH (${ph.current?.toFixed(2)})`);
    if (tds.hasAnomaly) causes.push(`TDS concentration (${Math.round(tds.current || 0)} PPM)`);
    if (water.hasAnomaly) causes.push(`water level (${Math.round(water.current || 0)}%)`);

    if (water.hasAnomaly) {
      interpretations.push(
        'Plant visual condition changed during a period of decreasing water level. This temporal association indicates hydration and reservoir volume stress.'
      );
      recommendations.push('Refill reservoir with fresh balanced water immediately');
    }

    if (ph.hasAnomaly) {
      interpretations.push(
        `Visual leaf yellowing is associated with ${ph.current && ph.current < 5.5 ? 'depressed root-zone pH' : 'elevated root-zone pH'}. This may impair micronutrient absorption.`
      );
      recommendations.push(`Adjust reservoir pH to target range (${target.phMin.toFixed(1)} - ${target.phMax.toFixed(1)})`);
    }

    if (tds.hasAnomaly) {
      interpretations.push(
        `Foliar distress is associated with ${tds.current && tds.current > target.tdsMax ? 'elevated TDS salinity' : 'nutrient deficiency'}.`
      );
      if (tds.current && tds.current > target.tdsMax) {
        recommendations.push('Dilute reservoir with fresh water to lower TDS concentration');
      } else {
        recommendations.push('Add balanced nutrient stock to raise TDS');
      }
    }

    primaryFarmerHeadline = 'Leaf stress detected while nutrient or water levels shifted.';
    primaryFarmerWhy = `Foliar changes co-occur with ${causes.join(' and ')} deviation outside normal bounds.`;
    primaryFarmerAction = recommendations[0] || 'Check the nutrient solution and top up reservoir.';
  }

  // SCENARIO 5: VISUAL CHANGE ONLY (Sensors normal, visual mild-moderate change)
  else if (isVisualDistress && !isSensorAnomalyPresent && isSensorAvailable) {
    scenarioCode = 'VISUAL_CHANGE_ONLY';
    plantState = 'ATTENTION';
    confidence = 'moderate';

    interpretations.push(
      'Visual leaf changes were detected, but current environmental readings (pH, TDS, water level) do not show an anomaly. Visual symptoms may stem from grow-light intensity, ambient temperature, localized airflow, or root microclimate.'
    );

    primaryFarmerHeadline = 'Leaf appearance changed, but water and nutrients are in balance.';
    primaryFarmerWhy = 'Increased leaf discoloration was detected while chemical readings remain within target limits.';
    primaryFarmerAction = 'Continue visual monitoring and inspect lamp height, airflow, or root health.';
    recommendations.push('Inspect plant lighting and leaf surfaces manually', 'Verify root oxygenation and airflow', 'Continue camera monitoring');
  }

  // SCENARIO 6: SENSOR ANOMALY ONLY (Foliage healthy, sensor out of range)
  else if (isVisualHealthy && isSensorAnomalyPresent) {
    scenarioCode = 'ENVIRONMENTAL_ANOMALY_ONLY';
    plantState = isWaterCritical ? 'CRITICAL' : 'ATTENTION';
    confidence = 'high';

    const anomalyNames: string[] = [];
    if (ph.hasAnomaly) anomalyNames.push('pH level');
    if (tds.hasAnomaly) anomalyNames.push('TDS salinity');
    if (water.hasAnomaly) anomalyNames.push('water level');

    interpretations.push(
      `An environmental sensor anomaly (${anomalyNames.join(', ')}) was detected, but foliage currently shows uniform green health. Plant buffer capacity may prevent immediate visual symptoms.`
    );

    if (water.hasAnomaly) {
      primaryFarmerHeadline = 'Water level has decreased significantly.';
      primaryFarmerWhy = 'Reservoir capacity has declined, but plant leaves still appear healthy and hydrated.';
      primaryFarmerAction = 'Check the reservoir and add fresh water before the plant wilts.';
      recommendations.push('Add water to reservoir to restore baseline capacity');
    } else if (ph.hasAnomaly) {
      primaryFarmerHeadline = 'Nutrient pH is drifting outside ideal target range.';
      primaryFarmerWhy = `Solution pH reads ${ph.current?.toFixed(2)}. Foliage is currently unaffected, but proactive adjustment is recommended.`;
      primaryFarmerAction = `Adjust reservoir pH toward target range (${target.phMin.toFixed(1)} - ${target.phMax.toFixed(1)}).`;
      recommendations.push(`Add pH buffer solution to restore pH to ${target.phMin.toFixed(1)} - ${target.phMax.toFixed(1)}`);
    } else {
      primaryFarmerHeadline = 'Nutrient concentration needs adjustment.';
      primaryFarmerWhy = `TDS reads ${Math.round(tds.current || 0)} PPM while target is ${target.tdsMin} - ${target.tdsMax} PPM. Foliage remains green.`;
      primaryFarmerAction = 'Adjust nutrient solution to maintain optimal root absorption.';
      recommendations.push('Rebalance nutrient solution PPM');
    }
  }

  // SCENARIO 1: STABLE EQUILIBRIUM
  else {
    scenarioCode = 'STABLE_EQUILIBRIUM';
    plantState = 'HEALTHY';
    confidence = (isCameraAvailable && isSensorAvailable) ? 'high' : 'moderate';

    interpretations.push(
      'Plant appears stable. No significant environmental or visual anomaly was detected.'
    );

    primaryFarmerHeadline = 'Plant appears stable. No significant environmental change was detected.';
    primaryFarmerWhy = 'Foliage shows uniform green chlorophyll and environmental telemetry is within target limits.';
    primaryFarmerAction = 'Maintain current hydroponic settings and continue routine monitoring.';
    recommendations.push('Maintain regular watering schedule', 'Keep continuous camera monitoring active');
  }

  // Species-independent clarification
  if (isPlantDetected && !isSpeciesIdentified) {
    limitations.push('Botanical crop species is currently unclassified. Reasoning uses species-independent generalized baselines.');
  }

  const confidenceScore = confidence === 'high' ? 88 : confidence === 'moderate' ? 68 : confidence === 'low' ? 45 : 20;

  return {
    id: `re_${now}_${Math.random().toString(36).substring(2, 6)}`,
    plantId,
    timestamp: now,
    scenarioCode,
    plantState,
    evidence: pkg.evidenceList,
    sensorEvidence: pkg.sensorEvidence,
    observations,
    interpretations,
    recommendations,
    confidence,
    confidenceScore,
    contributingSignals,
    limitations,
    conflictingSignals,
    reasoningVersion: REASONING_ENGINE_VERSION,
    primaryFarmerHeadline,
    primaryFarmerWhy,
    primaryFarmerAction,
    farmerCopy: {
      observableSummary: primaryFarmerHeadline,
      whySummary: primaryFarmerWhy,
      farmerAction: primaryFarmerAction,
    },
    sensorAvailable: isSensorAvailable,
  };
}

/**
 * End-to-end convenience runner: normalizes raw inputs and executes multimodal reasoning
 */
export function runMultimodalPlantReasoning(inputs: RawEvidenceInputs): PlantReasoningEvent {
  const normalized = normalizePlantEvidence(inputs);
  return evaluateMultimodalReasoning(normalized);
}
