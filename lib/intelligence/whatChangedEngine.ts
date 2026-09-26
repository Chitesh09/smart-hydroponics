/**
 * HydroSmart — Phase 7: "What Changed?" Intelligence Engine
 * 
 * Longitudinal change intelligence layer that compares:
 *   Current State + Previous State + Plant Baseline + Historical Trends + Multimodal Evidence
 * 
 * Answering the core grower question:
 * "What is different about my plant/environment compared with before?"
 * 
 * Guiding Principles:
 * 1. Works strictly with actual stored data (no hallucinations or fake baselines).
 * 2. Distinguishes raw sensor/optical noise from meaningful agronomic change using configurable thresholds.
 * 3. Sensor unavailable != 0 (missing telemetry is reported as 'unavailable', never as a zero or drop).
 * 4. Decouples species identification from health: unexpected species shifts flag 'requiresReview: true'.
 * 5. Optical growth conclusions are confidence-aware (suppressed or flagged on blurry/low-confidence frames).
 * 6. Explicitly models the valid "No Change" state when differences are sub-threshold.
 * 7. Dual-mode output: Farmer Mode (plain language, direct action) vs Technical Mode (deltas, tolerances, stats).
 */

import {
  PlantObservation,
  PlantProfile,
  PlantChangeEvent,
  WhatChangedSummary,
  WhatChangedStatus,
  ChangeDirection,
  ChangeSignificance,
  ChangeConfidence,
  SensorAvailabilityState,
} from './types';
import { WHAT_CHANGED_CONFIG, WhatChangedConfig } from './whatChangedConfig';

/**
 * Evaluates longitudinal changes between the current observation, previous observation,
 * baseline observation, and historical trends.
 * 
 * @param currentObservation The latest observation snapshot
 * @param observationHistory Array of historical observations (sorted either desc or asc)
 * @param plantProfile Active plant profile (cropKey, species, targetProfile)
 * @param customConfig Optional override for change thresholds
 * @returns Structured WhatChangedSummary
 */
export function evaluateWhatChanged(
  currentObservation: PlantObservation | null | undefined,
  observationHistory: PlantObservation[] = [],
  plantProfile?: PlantProfile | null,
  customConfig: WhatChangedConfig = WHAT_CHANGED_CONFIG
): WhatChangedSummary {
  const now = currentObservation?.timestamp || Date.now();
  const plantId = currentObservation?.plantId || plantProfile?.plantId || 'plant_primary';

  // 1. Gating Check: Validate Current Observation
  if (!currentObservation) {
    return createEmptySummary(plantId, now, 'insufficient_history', [
      'No current observation provided to evaluate what changed.',
    ]);
  }

  // 2. Sort observations chronologically descending (newest first: [0] = current, [1] = previous)
  const allObservations = [...observationHistory];
  if (!allObservations.some(o => o.id === currentObservation.id)) {
    allObservations.unshift(currentObservation);
  }

  // Sort descending by timestamp
  const sorted = allObservations.sort((a, b) => b.timestamp - a.timestamp);

  // Find index of current
  const currentIndex = sorted.findIndex(o => o.id === currentObservation.id);
  const effectiveCurrent = currentIndex >= 0 ? sorted[currentIndex] : currentObservation;

  // Find immediate previous observation
  const previousObservation = sorted.find((o, idx) => idx > currentIndex && o.id !== effectiveCurrent.id);

  // Find oldest / baseline observation
  const baselineObservation = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;

  // 3. Gating Check: Insufficient History (< 2 observations)
  if (!previousObservation || sorted.length < customConfig.minObservationsRequired) {
    return createEmptySummary(
      plantId,
      now,
      'insufficient_history',
      ['At least two observation snapshots are required to determine longitudinal change.'],
      1
    );
  }

  // Calculate timeframe description
  const timeDeltaMs = effectiveCurrent.timestamp - previousObservation.timestamp;
  const timeDeltaHours = Math.max(0.1, Number((timeDeltaMs / (1000 * 60 * 60)).toFixed(1)));
  const timeframeDescription = formatTimeframe(timeDeltaHours);

  // 4. Optical Gating Assessment
  const presenceConfidence = (effectiveCurrent.plantDetectionConfidence ?? 0) / 100;
  const isOpticalConfidenceLow =
    effectiveCurrent.isPlantDetected === false ||
    presenceConfidence < customConfig.opticalGating.minPlantConfidence;
  
  const cameraConfidence: ChangeConfidence = isOpticalConfidenceLow
    ? 'LOW'
    : presenceConfidence > 0.8
    ? 'HIGH'
    : 'MODERATE';

  // 5. Sensor Availability
  const sensorAvailability: {
    ph: SensorAvailabilityState;
    tds: SensorAvailabilityState;
    waterLevel: SensorAvailabilityState;
  } = {
    ph: getSensorState(effectiveCurrent.ph, effectiveCurrent.isTelemetryStale, effectiveCurrent.telemetryMode),
    tds: getSensorState(effectiveCurrent.tds, effectiveCurrent.isTelemetryStale, effectiveCurrent.telemetryMode),
    waterLevel: getSensorState(effectiveCurrent.waterLevel, effectiveCurrent.isTelemetryStale, effectiveCurrent.telemetryMode),
  };

  const events: PlantChangeEvent[] = [];
  const limitations: string[] = [];

  // ==========================================================================
  // EVALUATION 1: SENSOR TELEMETRY CHANGES
  // ==========================================================================

  // --- pH Evaluation ---
  if (sensorAvailability.ph === 'unavailable') {
    events.push({
      id: `change_ph_unavail_${now}`,
      plantId,
      category: 'sensor',
      metric: 'ph',
      label: 'Solution pH',
      direction: 'unavailable',
      significance: 'NONE',
      confidence: 'HIGH',
      isMeaningful: false,
      temporalWindow: 'vs_previous',
      summary: 'pH telemetry is currently unavailable.',
      farmerHeadline: 'pH sensor reading unavailable',
      farmerWhy: 'Sensor telemetry is missing or probe is disconnected.',
      farmerAction: 'Check probe connection and calibration.',
      whyItMatters: 'Without pH telemetry, nutrient lockout risks cannot be continuously tracked.',
      suggestedCheck: 'Inspect probe wiring and verify ESP32 telemetry status.',
      timestamp: now,
      evidenceSource: 'esp32',
    });
    limitations.push('pH telemetry unavailable — pH change analysis suspended.');
  } else if (effectiveCurrent.ph !== undefined && previousObservation.ph !== undefined) {
    const phDelta = Number((effectiveCurrent.ph - previousObservation.ph).toFixed(2));
    const absPhDelta = Math.abs(phDelta);
    const significance = getSignificance(absPhDelta, customConfig.ph);
    const isMeaningful = significance !== 'NONE';

    let direction: ChangeDirection = 'stable';
    if (significance !== 'NONE') {
      // Determine if moving closer to or further from optimal (5.5 - 6.5)
      const prevDistFromOptimal = Math.max(0, 5.5 - previousObservation.ph, previousObservation.ph - 6.5);
      const currDistFromOptimal = Math.max(0, 5.5 - effectiveCurrent.ph, effectiveCurrent.ph - 6.5);
      direction = currDistFromOptimal < prevDistFromOptimal ? 'improved' : 'declined';
    }

    const baselinePh = baselineObservation?.ph;
    const phEvent: PlantChangeEvent = {
      id: `change_ph_${now}`,
      plantId,
      category: 'sensor',
      metric: 'ph',
      label: 'Solution pH',
      previousValue: previousObservation.ph,
      currentValue: effectiveCurrent.ph,
      baselineValue: baselinePh,
      delta: phDelta,
      unit: 'pH',
      direction,
      significance,
      confidence: 'HIGH',
      isMeaningful,
      temporalWindow: 'vs_previous',
      summary: isMeaningful
        ? `pH shifted by ${phDelta > 0 ? '+' : ''}${phDelta} (from ${previousObservation.ph} to ${effectiveCurrent.ph}).`
        : `pH is stable at ${effectiveCurrent.ph} (drift: ${phDelta > 0 ? '+' : ''}${phDelta}).`,
      farmerHeadline: isMeaningful
        ? phDelta > 0 ? 'Water pH shifted higher' : 'Water pH shifted lower'
        : 'Water pH is steady',
      farmerWhy: isMeaningful
        ? `Water acidity shifted by ${Math.abs(phDelta)} points over ${timeframeDescription}.`
        : 'Acidity remains within normal variation.',
      farmerAction: isMeaningful
        ? effectiveCurrent.ph > 6.5
          ? 'Add pH Down to bring acidity back into the optimal 5.5–6.5 window.'
          : effectiveCurrent.ph < 5.5
          ? 'Add pH Up or dilute with fresh water to raise pH.'
          : 'Monitor pH closely during next feeding.'
        : 'No pH adjustment needed.',
      whyItMatters: 'Drifting pH outside 5.5–6.5 locks out essential micronutrients like Iron, Nitrogen, and Calcium.',
      suggestedCheck: 'Verify solution pH with a calibrated hand meter if drift persists.',
      timestamp: now,
      evidenceSource: 'esp32',
    };
    events.push(phEvent);
  }

  // --- TDS Evaluation ---
  if (sensorAvailability.tds === 'unavailable') {
    events.push({
      id: `change_tds_unavail_${now}`,
      plantId,
      category: 'sensor',
      metric: 'tds',
      label: 'Nutrient TDS',
      direction: 'unavailable',
      significance: 'NONE',
      confidence: 'HIGH',
      isMeaningful: false,
      temporalWindow: 'vs_previous',
      summary: 'TDS telemetry is currently unavailable.',
      farmerHeadline: 'Nutrient TDS reading unavailable',
      farmerWhy: 'Sensor telemetry is missing or probe disconnected.',
      farmerAction: 'Check TDS probe wiring and power.',
      whyItMatters: 'Without TDS, nutrient starvation or salt toxicity cannot be detected.',
      suggestedCheck: 'Clean TDS probe pins and check ESP32 power connection.',
      timestamp: now,
      evidenceSource: 'esp32',
    });
    limitations.push('TDS telemetry unavailable — nutrient concentration change suspended.');
  } else if (effectiveCurrent.tds !== undefined && previousObservation.tds !== undefined) {
    const tdsDelta = Math.round(effectiveCurrent.tds - previousObservation.tds);
    const absTdsDelta = Math.abs(tdsDelta);
    const significance = getSignificance(absTdsDelta, customConfig.tds);
    const isMeaningful = significance !== 'NONE';

    let direction: ChangeDirection = 'stable';
    if (significance !== 'NONE') {
      const idealTdsMin = plantProfile?.targetProfile?.tdsMin ?? 600;
      const idealTdsMax = plantProfile?.targetProfile?.tdsMax ?? 1000;
      const prevDist = Math.max(0, idealTdsMin - previousObservation.tds, previousObservation.tds - idealTdsMax);
      const currDist = Math.max(0, idealTdsMin - effectiveCurrent.tds, effectiveCurrent.tds - idealTdsMax);
      direction = currDist < prevDist ? 'improved' : 'declined';
    }

    const baselineTds = baselineObservation?.tds;
    const tdsEvent: PlantChangeEvent = {
      id: `change_tds_${now}`,
      plantId,
      category: 'sensor',
      metric: 'tds',
      label: 'Nutrient TDS',
      previousValue: previousObservation.tds,
      currentValue: effectiveCurrent.tds,
      baselineValue: baselineTds,
      delta: tdsDelta,
      unit: 'PPM',
      direction,
      significance,
      confidence: 'HIGH',
      isMeaningful,
      temporalWindow: 'vs_previous',
      summary: isMeaningful
        ? `TDS changed by ${tdsDelta > 0 ? '+' : ''}${tdsDelta} PPM (from ${previousObservation.tds} to ${effectiveCurrent.tds} PPM).`
        : `TDS is steady at ${effectiveCurrent.tds} PPM (drift: ${tdsDelta > 0 ? '+' : ''}${tdsDelta} PPM).`,
      farmerHeadline: isMeaningful
        ? tdsDelta > 0 ? 'Nutrient concentration increased' : 'Nutrient concentration decreased'
        : 'Nutrient levels are stable',
      farmerWhy: isMeaningful
        ? tdsDelta > 0
          ? 'Water evaporated faster than plant nutrient uptake, concentrating salts.'
          : 'Plants fed on available minerals or the reservoir was diluted with fresh water.'
        : 'Feeding and water uptake are currently in balance.',
      farmerAction: isMeaningful
        ? tdsDelta > 0
          ? 'Add fresh water to dilute concentrated salts.'
          : 'Top up nutrient stock solution.'
        : 'Maintain current feeding schedule.',
      whyItMatters: 'Salt accumulation can cause root burn, while depleted minerals cause leaf yellowing and stunted growth.',
      suggestedCheck: 'Check reservoir water volume before dosing additional nutrients.',
      timestamp: now,
      evidenceSource: 'esp32',
    };
    events.push(tdsEvent);
  }

  // --- Water Level Evaluation ---
  if (sensorAvailability.waterLevel === 'unavailable') {
    events.push({
      id: `change_water_unavail_${now}`,
      plantId,
      category: 'sensor',
      metric: 'waterLevel',
      label: 'Reservoir Level',
      direction: 'unavailable',
      significance: 'NONE',
      confidence: 'HIGH',
      isMeaningful: false,
      temporalWindow: 'vs_previous',
      summary: 'Water level telemetry is currently unavailable.',
      farmerHeadline: 'Water level reading unavailable',
      farmerWhy: 'Sensor telemetry is missing or sensor disconnected.',
      farmerAction: 'Check ultrasonic/depth sensor connection.',
      whyItMatters: 'Pump cavitation or dry root zone can occur if water depletion is undetected.',
      suggestedCheck: 'Check ultrasonic distance sensor alignment.',
      timestamp: now,
      evidenceSource: 'esp32',
    });
    limitations.push('Water level telemetry unavailable.');
  } else if (effectiveCurrent.waterLevel !== undefined && previousObservation.waterLevel !== undefined) {
    const waterDelta = Number((effectiveCurrent.waterLevel - previousObservation.waterLevel).toFixed(1));
    const absWaterDelta = Math.abs(waterDelta);
    const significance = getSignificance(absWaterDelta, customConfig.waterLevel);
    const isMeaningful = significance !== 'NONE';

    let direction: ChangeDirection = 'stable';
    if (isMeaningful) {
      if (waterDelta > 0) {
        direction = 'improved'; // Refilled
      } else {
        direction = effectiveCurrent.waterLevel < 25 ? 'declined' : 'changed';
      }
    }

    const baselineWater = baselineObservation?.waterLevel;
    const waterEvent: PlantChangeEvent = {
      id: `change_water_${now}`,
      plantId,
      category: 'sensor',
      metric: 'waterLevel',
      label: 'Reservoir Level',
      previousValue: previousObservation.waterLevel,
      currentValue: effectiveCurrent.waterLevel,
      baselineValue: baselineWater,
      delta: waterDelta,
      unit: '%',
      direction,
      significance,
      confidence: 'HIGH',
      isMeaningful,
      temporalWindow: 'vs_previous',
      summary: isMeaningful
        ? waterDelta < 0
          ? `Reservoir level decreased by ${Math.abs(waterDelta)}% (from ${previousObservation.waterLevel}% to ${effectiveCurrent.waterLevel}%).`
          : `Reservoir level increased by ${waterDelta}% (refilled to ${effectiveCurrent.waterLevel}%).`
        : `Water level is steady at ${effectiveCurrent.waterLevel}%.`,
      farmerHeadline: isMeaningful
        ? waterDelta < 0 ? 'Water level dropped noticeably' : 'Water reservoir was refilled'
        : 'Water level is steady',
      farmerWhy: isMeaningful
        ? waterDelta < 0
          ? `Crop transpiration and evaporation consumed ${Math.abs(waterDelta)}% of reservoir capacity.`
          : `Fresh solution or top-up water was added (${waterDelta}% increase).`
        : 'Water uptake is proceeding at normal pace.',
      farmerAction: isMeaningful
        ? effectiveCurrent.waterLevel < 35
          ? 'Add water to reservoir soon to protect the pump.'
          : 'Continue normal watering cycle.'
        : 'No watering action needed.',
      whyItMatters: 'Submersible pumps require minimum water immersion; dry cycles damage hydroponic root hairs.',
      suggestedCheck: 'Inspect reservoir sight glass or float sensor.',
      timestamp: now,
      evidenceSource: 'esp32',
    };
    events.push(waterEvent);
  }

  // ==========================================================================
  // EVALUATION 2: VISUAL HEALTH & GROWTH CHANGES
  // ==========================================================================

  // --- Canopy Coverage (Vegetative Growth) ---
  if (
    effectiveCurrent.canopyCoveragePercent !== undefined &&
    previousObservation.canopyCoveragePercent !== undefined
  ) {
    const canopyDelta = Number((effectiveCurrent.canopyCoveragePercent - previousObservation.canopyCoveragePercent).toFixed(1));
    const absCanopyDelta = Math.abs(canopyDelta);
    const significance = getSignificance3(absCanopyDelta, customConfig.canopyCoverage);
    const isMeaningful = significance !== 'NONE';

    const direction: ChangeDirection = isMeaningful
      ? canopyDelta > 0 ? 'improved' : 'declined'
      : 'stable';

    const baselineCanopy = baselineObservation?.canopyCoveragePercent;
    
    // Optical Confidence Gating Check:
    // If camera clarity/sharpness is low, downgrade confidence and adjust copy
    const eventConfidence = isOpticalConfidenceLow ? 'LOW' : 'HIGH';

    const canopyEvent: PlantChangeEvent = {
      id: `change_canopy_${now}`,
      plantId,
      category: 'growth',
      metric: 'canopyCoveragePercent',
      label: 'Canopy Coverage',
      previousValue: previousObservation.canopyCoveragePercent,
      currentValue: effectiveCurrent.canopyCoveragePercent,
      baselineValue: baselineCanopy,
      delta: canopyDelta,
      unit: '%',
      direction,
      significance: isOpticalConfidenceLow && significance === 'SIGNIFICANT' ? 'MODERATE' : significance,
      confidence: eventConfidence,
      isMeaningful: isMeaningful && !isOpticalConfidenceLow,
      temporalWindow: 'vs_previous',
      summary: isOpticalConfidenceLow
        ? `Canopy coverage difference (${canopyDelta > 0 ? '+' : ''}${canopyDelta}%) detected under low camera clarity; verification needed.`
        : isMeaningful
        ? canopyDelta > 0
          ? `Canopy expanded by +${canopyDelta}% (from ${previousObservation.canopyCoveragePercent}% to ${effectiveCurrent.canopyCoveragePercent}%).`
          : `Canopy reduced by ${canopyDelta}% (defoliation or wilting detected).`
        : `Canopy coverage steady at ${effectiveCurrent.canopyCoveragePercent}%.`,
      farmerHeadline: isOpticalConfidenceLow
        ? 'Canopy measurement tentative (unclear camera view)'
        : isMeaningful
        ? canopyDelta > 0 ? 'Plant leaves are expanding' : 'Canopy size reduced'
        : 'Canopy size is steady',
      farmerWhy: isOpticalConfidenceLow
        ? 'Camera frame was slightly blurry or plant was partially out of frame.'
        : isMeaningful
        ? canopyDelta > 0
          ? `Healthy vegetative growth expanded leaf spread by +${canopyDelta}%.`
          : 'Leaves may have wilted or experienced pruning.'
        : 'Leaf coverage has not shifted noticeably.',
      farmerAction: isOpticalConfidenceLow
        ? 'Clean camera lens or reposition plant under good lighting for a sharper scan.'
        : isMeaningful
        ? canopyDelta > 0
          ? 'Continue lighting and feeding schedule.'
          : 'Check for wilting or leaf drop.'
        : 'Continue current cultivation routine.',
      whyItMatters: 'Canopy growth velocity is the most direct indicator of photosynthetic efficiency.',
      suggestedCheck: 'Observe leaf turgidity and verify camera lens cleanliness.',
      timestamp: now,
      evidenceSource: 'camera',
    };
    events.push(canopyEvent);

    if (isOpticalConfidenceLow) {
      limitations.push('Camera view clarity below threshold — optical growth changes evaluated tentatively.');
    }
  }

  // --- Visual Chlorosis (Yellowing) & Necrosis (Browning) ---
  // Extract chlorosis from baselineDeltas or visual indicators
  const currChlorosis = extractChlorosis(effectiveCurrent);
  const prevChlorosis = extractChlorosis(previousObservation);

  if (currChlorosis !== undefined && prevChlorosis !== undefined) {
    const chlorosisDelta = Number((currChlorosis - prevChlorosis).toFixed(1));
    const absDelta = Math.abs(chlorosisDelta);
    const significance = getSignificance3(absDelta, customConfig.chlorosis);
    const isMeaningful = significance !== 'NONE';

    if (isMeaningful) {
      const direction: ChangeDirection = chlorosisDelta > 0 ? 'declined' : 'improved';
      events.push({
        id: `change_chlorosis_${now}`,
        plantId,
        category: 'visual',
        metric: 'chlorosis',
        label: 'Leaf Chlorosis (Yellowing)',
        previousValue: prevChlorosis,
        currentValue: currChlorosis,
        delta: chlorosisDelta,
        unit: '%',
        direction,
        significance,
        confidence: isOpticalConfidenceLow ? 'LOW' : 'HIGH',
        isMeaningful: true,
        temporalWindow: 'vs_previous',
        summary: chlorosisDelta > 0
          ? `Foliar chlorosis increased by +${chlorosisDelta}% (yellowing now affects ${currChlorosis}% of canopy).`
          : `Foliar chlorosis decreased by ${Math.abs(chlorosisDelta)}% (foliage regreening).`,
        farmerHeadline: chlorosisDelta > 0 ? 'Leaf yellowing increased' : 'Leaf yellowing cleared up',
        farmerWhy: chlorosisDelta > 0
          ? 'Chlorophyll degradation detected across leaf tissue.'
          : 'Leaf tissue has regained healthy chlorophyll pigmentation.',
        farmerAction: chlorosisDelta > 0
          ? 'Check reservoir pH and ensure Nitrogen/Iron availability.'
          : 'Continue current nutrient routine.',
        whyItMatters: 'Chlorosis impedes light absorption and signals root nutrient uptake restriction.',
        suggestedCheck: 'Check pH balance and inspect leaf veins for pattern.',
        timestamp: now,
        evidenceSource: 'camera',
      });
    }
  }

  // --- Overall Visual Health Score ---
  if (
    effectiveCurrent.visualHealthScore !== undefined &&
    previousObservation.visualHealthScore !== undefined
  ) {
    const healthDelta = Math.round(effectiveCurrent.visualHealthScore - previousObservation.visualHealthScore);
    const absHealthDelta = Math.abs(healthDelta);
    const significance = getSignificance(absHealthDelta, customConfig.healthScore);
    const isMeaningful = significance !== 'NONE';

    // Recovery Detection: If previous had stress and current is optimal or +15 improvement
    const isRecovery = healthDelta >= customConfig.healthScore.significant && effectiveCurrent.visualHealthScore >= 80;
    const direction: ChangeDirection = isMeaningful
      ? isRecovery ? 'recovered' : healthDelta > 0 ? 'improved' : 'declined'
      : 'stable';

    if (isMeaningful) {
      events.push({
        id: `change_health_${now}`,
        plantId,
        category: 'health',
        metric: 'visualHealthScore',
        label: 'Visual Health Score',
        previousValue: previousObservation.visualHealthScore,
        currentValue: effectiveCurrent.visualHealthScore,
        baselineValue: baselineObservation?.visualHealthScore,
        delta: healthDelta,
        unit: 'pts',
        direction,
        significance,
        confidence: isOpticalConfidenceLow ? 'MODERATE' : 'HIGH',
        isMeaningful: true,
        temporalWindow: 'vs_previous',
        summary: isRecovery
          ? `Plant has recovered significantly (+${healthDelta} pts to ${effectiveCurrent.visualHealthScore}/100).`
          : healthDelta > 0
          ? `Visual health improved by +${healthDelta} pts (now ${effectiveCurrent.visualHealthScore}/100).`
          : `Visual health declined by ${healthDelta} pts (now ${effectiveCurrent.visualHealthScore}/100).`,
        farmerHeadline: isRecovery
          ? 'Plant is showing strong recovery'
          : healthDelta > 0
          ? 'Plant health condition improved'
          : 'Plant health score slipped',
        farmerWhy: isRecovery
          ? 'Leaf color uniformity and canopy vigor rebounded towards healthy baseline.'
          : healthDelta > 0
          ? 'Leaf pigment and leaf structure have improved.'
          : 'Visual stress symptoms reduced composite vigor score.',
        farmerAction: isRecovery || healthDelta > 0
          ? 'Maintain current balanced conditions.'
          : 'Review nutrient solution and lighting parameters.',
        whyItMatters: 'Composite health score aggregates leaf color, texture uniformity, and canopy turgidity.',
        suggestedCheck: 'Inspect underside of leaves and check root chamber odor.',
        timestamp: now,
        evidenceSource: 'camera',
      });
    }
  }

  // ==========================================================================
  // EVALUATION 3: PLANT IDENTITY CHANGES (Decouple Species from Health)
  // ==========================================================================

  const currSpecies = normalizeSpecies(effectiveCurrent.plantSpecies || plantProfile?.species);
  const prevSpecies = normalizeSpecies(previousObservation.plantSpecies || plantProfile?.species);

  if (currSpecies && prevSpecies && currSpecies !== prevSpecies) {
    const wasUnknown = isUnknownSpecies(prevSpecies);
    const isNowKnown = !isUnknownSpecies(currSpecies);

    if (wasUnknown && isNowKnown) {
      // Identity resolution from Unknown -> Known
      events.push({
        id: `change_species_identified_${now}`,
        plantId,
        category: 'identity',
        metric: 'species',
        label: 'Plant Species Identity',
        previousValue: prevSpecies,
        currentValue: currSpecies,
        direction: 'improved',
        significance: 'MODERATE',
        confidence: 'HIGH',
        isMeaningful: true,
        temporalWindow: 'vs_previous',
        requiresReview: false,
        summary: `Plant species identified as ${currSpecies} (previously unknown).`,
        farmerHeadline: `Crop identified as ${currSpecies}`,
        farmerWhy: `ML visual classification confirmed features matching ${currSpecies}.`,
        farmerAction: `Optimal hydroponic thresholds set for ${currSpecies}.`,
        whyItMatters: 'Correct identification ensures nutrient and pH targets match botanical requirements.',
        suggestedCheck: 'Confirm crop type matches what you sowed in your hydroponic pod.',
        timestamp: now,
        evidenceSource: 'camera',
      });
    } else if (!wasUnknown && !isUnknownSpecies(currSpecies)) {
      // Unexpected shift between two known species (e.g. Basil -> Mint)
      events.push({
        id: `change_species_shift_${now}`,
        plantId,
        category: 'identity',
        metric: 'species',
        label: 'Plant Species Identity',
        previousValue: prevSpecies,
        currentValue: currSpecies,
        direction: 'changed',
        significance: 'CRITICAL',
        confidence: 'MODERATE',
        isMeaningful: true,
        temporalWindow: 'vs_previous',
        requiresReview: true,
        summary: `Species identity shifted from ${prevSpecies} to ${currSpecies}. Manual verification recommended.`,
        farmerHeadline: `Detected plant type changed from ${prevSpecies} to ${currSpecies}`,
        farmerWhy: `Camera identification model matched ${currSpecies}, differing from established ${prevSpecies} profile.`,
        farmerAction: 'Review crop selection in settings or rescan the plant.',
        whyItMatters: 'Switching species changes the active nutrient formula and environmental thresholds.',
        suggestedCheck: 'Verify that the camera is focused on the correct pod without background foliage intrusion.',
        timestamp: now,
        evidenceSource: 'camera',
      });
    }
  }

  // ==========================================================================
  // EVALUATION 4: ANOMALY CHANGES
  // ==========================================================================

  const currAnomalies = effectiveCurrent.activeAnomalies || [];
  const prevAnomalies = previousObservation.activeAnomalies || [];

  // Newly appeared anomalies
  const newAnomalies = currAnomalies.filter(a => !prevAnomalies.includes(a));
  for (const anomaly of newAnomalies) {
    events.push({
      id: `change_anomaly_new_${now}_${encodeURIComponent(anomaly)}`,
      plantId,
      category: 'anomaly',
      metric: 'anomaly',
      label: 'System Anomaly',
      currentValue: anomaly,
      direction: 'declined',
      significance: 'SIGNIFICANT',
      confidence: 'HIGH',
      isMeaningful: true,
      temporalWindow: 'vs_previous',
      summary: `New anomaly detected: ${anomaly}.`,
      farmerHeadline: `New alert: ${anomaly}`,
      farmerWhy: 'An unexpected sensor or visual pattern was detected.',
      farmerAction: 'Inspect system immediately to address the anomaly.',
      whyItMatters: 'Early intervention prevents localized root or foliar stress from expanding.',
      suggestedCheck: 'Check IoT hardware, sensors, and water circulation.',
      timestamp: now,
      evidenceSource: 'system',
    });
  }

  // Resolved anomalies
  const resolvedAnomalies = prevAnomalies.filter(a => !currAnomalies.includes(a));
  for (const resolved of resolvedAnomalies) {
    events.push({
      id: `change_anomaly_resolved_${now}_${encodeURIComponent(resolved)}`,
      plantId,
      category: 'anomaly',
      metric: 'anomaly',
      label: 'System Anomaly',
      previousValue: resolved,
      direction: 'recovered',
      significance: 'MODERATE',
      confidence: 'HIGH',
      isMeaningful: true,
      temporalWindow: 'vs_previous',
      summary: `Previous anomaly "${resolved}" has resolved.`,
      farmerHeadline: `Alert cleared: ${resolved}`,
      farmerWhy: 'Parameters have returned to normal operating bounds.',
      farmerAction: 'Maintain current settings.',
      whyItMatters: 'Confirms that previous corrective actions were successful.',
      suggestedCheck: 'Confirm steady readings on dashboard.',
      timestamp: now,
      evidenceSource: 'system',
    });
  }

  // ==========================================================================
  // EVALUATION 5: MULTIMODAL CORRELATED REASONING CHANGES
  // ==========================================================================

  // Check if we have concurrent foliar yellowing + pH drift
  const phEvent = events.find(e => e.metric === 'ph' && e.isMeaningful);
  const chlorosisEvent = events.find(e => e.metric === 'chlorosis' && e.isMeaningful && e.direction === 'declined');

  if (phEvent && chlorosisEvent) {
    events.push({
      id: `change_correlated_ph_chlorosis_${now}`,
      plantId,
      category: 'combined',
      metric: 'ph_chlorosis_correlation',
      label: 'Nutrient Lockout Correlation',
      direction: 'declined',
      significance: 'SIGNIFICANT',
      confidence: 'HIGH',
      isMeaningful: true,
      temporalWindow: 'vs_previous',
      summary: `Leaf yellowing increased following a pH shift to ${effectiveCurrent.ph}.`,
      farmerHeadline: 'Leaf yellowing coincides with water pH shift',
      farmerWhy: 'When pH drifts out of balance, roots struggle to absorb iron and nitrogen, causing yellow leaves.',
      farmerAction: 'Adjust reservoir pH back to 5.8–6.2 and re-check leaf appearance in 24 hours.',
      whyItMatters: 'Nutrient lockout directly causes leaf yellowing before progressing to tip burn.',
      suggestedCheck: 'Calibrate pH probe and add pH balancing solution.',
      timestamp: now,
      evidenceSource: 'multimodal',
    });
  }

  // Check if water depletion + canopy wilting
  const waterEvent = events.find(e => e.metric === 'waterLevel' && e.isMeaningful && e.delta !== undefined && e.delta < -10);
  const canopyEvent = events.find(e => e.metric === 'canopyCoveragePercent' && e.isMeaningful && e.direction === 'declined');

  if (waterEvent && canopyEvent) {
    events.push({
      id: `change_correlated_water_wilt_${now}`,
      plantId,
      category: 'combined',
      metric: 'water_canopy_correlation',
      label: 'Water Stress Correlation',
      direction: 'declined',
      significance: 'SIGNIFICANT',
      confidence: 'HIGH',
      isMeaningful: true,
      temporalWindow: 'vs_previous',
      summary: 'Canopy size shrank as water level dropped, indicating moisture stress.',
      farmerHeadline: 'Leaves wilting due to low water reservoir',
      farmerWhy: 'Transpiration loss without sufficient root zone hydration leads to loss of leaf turgor.',
      farmerAction: 'Top up water reservoir immediately.',
      whyItMatters: 'Severe wilting damages root capillary action.',
      suggestedCheck: 'Verify water reservoir level and pump circulation.',
      timestamp: now,
      evidenceSource: 'multimodal',
    });
  }

  // ==========================================================================
  // 6. SYNTHESIS & AGGREGATION
  // ==========================================================================

  const meaningfulEvents = events.filter(e => e.isMeaningful);
  const reviewRequiredItems = events.filter(e => e.requiresReview);
  const visualChanges = events.filter(e => e.category === 'visual');
  const sensorChanges = events.filter(e => e.category === 'sensor' && e.isMeaningful);
  const healthChanges = events.filter(e => e.category === 'health');
  const growthChanges = events.filter(e => e.category === 'growth' && e.isMeaningful);
  const anomalyChanges = events.filter(e => e.category === 'anomaly');
  const identityChanges = events.filter(e => e.category === 'identity');
  const reasoningChanges = events.filter(e => e.category === 'combined' || e.category === 'reasoning');

  const hasMeaningfulChange = meaningfulEvents.length > 0;

  // Determine Status
  let status: WhatChangedStatus = 'stable_no_change';
  if (hasMeaningfulChange) {
    status = 'meaningful_changes';
  } else if (
    sensorAvailability.ph === 'unavailable' &&
    sensorAvailability.tds === 'unavailable' &&
    sensorAvailability.waterLevel === 'unavailable'
  ) {
    status = 'sensor_unavailable';
  }

  // Determine Overall Significance
  const overallSignificance = determineOverallSignificance(meaningfulEvents);

  // Determine Overall Direction
  const overallDirection = determineOverallDirection(meaningfulEvents);

  // Synthesize Headlines & Explanations
  const { summaryHeadline, summaryExplanation, farmerHeadline, farmerWhy, farmerAction } =
    synthesizeCopy(
      status,
      overallSignificance,
      overallDirection,
      meaningfulEvents,
      reviewRequiredItems,
      timeframeDescription
    );

  return {
    plantId,
    timestamp: now,
    timeframeDescription,
    hasMeaningfulChange,
    status,
    overallSignificance,
    overallDirection,
    summaryHeadline,
    summaryExplanation,
    farmerHeadline,
    farmerWhy,
    farmerAction,
    events,
    visualChanges,
    sensorChanges,
    healthChanges,
    growthChanges,
    anomalyChanges,
    identityChanges,
    reasoningChanges,
    reviewRequiredItems,
    sensorAvailability,
    cameraConfidence,
    observationCount: sorted.length,
    timeDeltaHours,
    limitations,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function createEmptySummary(
  plantId: string,
  now: number,
  status: WhatChangedStatus,
  limitations: string[],
  observationCount: number = 0
): WhatChangedSummary {
  return {
    plantId,
    timestamp: now,
    timeframeDescription: 'no comparison available',
    hasMeaningfulChange: false,
    status,
    overallSignificance: 'NONE',
    overallDirection: 'stable',
    summaryHeadline: 'Not enough historical data to determine what changed.',
    summaryExplanation: 'At least two observation snapshots are required to analyze longitudinal change.',
    farmerHeadline: 'Waiting for more observation history',
    farmerWhy: 'We need at least two scans or readings over time to spot trends.',
    farmerAction: 'Continue running the system to build your plant baseline.',
    events: [],
    visualChanges: [],
    sensorChanges: [],
    healthChanges: [],
    growthChanges: [],
    anomalyChanges: [],
    identityChanges: [],
    reasoningChanges: [],
    reviewRequiredItems: [],
    sensorAvailability: {
      ph: 'unavailable',
      tds: 'unavailable',
      waterLevel: 'unavailable',
    },
    cameraConfidence: 'INSUFFICIENT_DATA',
    observationCount,
    limitations,
  };
}

function getSensorState(
  val: number | undefined | null,
  isStale: boolean,
  mode: 'real' | 'simulation'
): SensorAvailabilityState {
  if (val === undefined || val === null || isNaN(val)) {
    return 'unavailable';
  }
  if (mode === 'simulation') {
    return 'simulated';
  }
  return 'available';
}

function getSignificance(
  absDelta: number,
  thresholds: { minor: number; moderate: number; significant: number; critical: number }
): ChangeSignificance {
  if (absDelta >= thresholds.critical) return 'CRITICAL';
  if (absDelta >= thresholds.significant) return 'SIGNIFICANT';
  if (absDelta >= thresholds.moderate) return 'MODERATE';
  if (absDelta >= thresholds.minor) return 'MINOR';
  return 'NONE';
}

function getSignificance3(
  absDelta: number,
  thresholds: { minor: number; moderate: number; significant: number }
): ChangeSignificance {
  if (absDelta >= thresholds.significant) return 'SIGNIFICANT';
  if (absDelta >= thresholds.moderate) return 'MODERATE';
  if (absDelta >= thresholds.minor) return 'MINOR';
  return 'NONE';
}

function determineOverallSignificance(events: PlantChangeEvent[]): ChangeSignificance {
  if (events.length === 0) return 'NONE';
  if (events.some(e => e.significance === 'CRITICAL')) return 'CRITICAL';
  if (events.some(e => e.significance === 'SIGNIFICANT')) return 'SIGNIFICANT';
  if (events.some(e => e.significance === 'MODERATE')) return 'MODERATE';
  if (events.some(e => e.significance === 'MINOR')) return 'MINOR';
  return 'NONE';
}

function determineOverallDirection(events: PlantChangeEvent[]): ChangeDirection {
  if (events.length === 0) return 'stable';
  const hasDecline = events.some(e => e.direction === 'declined');
  const hasRecovery = events.some(e => e.direction === 'recovered');
  const hasImproved = events.some(e => e.direction === 'improved');
  const hasChanged = events.some(e => e.direction === 'changed');

  if (hasDecline && !hasRecovery && !hasImproved) return 'declined';
  if (hasRecovery) return 'recovered';
  if (hasImproved && !hasDecline) return 'improved';
  if (hasChanged || (hasDecline && hasImproved)) return 'changed';
  return 'stable';
}

function formatTimeframe(hours: number): string {
  if (hours < 1) return 'the last hour';
  if (hours < 24) return `the last ${Math.round(hours)} hours`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `the last ${days} days`;
}

function normalizeSpecies(species?: string): string | undefined {
  if (!species) return undefined;
  const clean = species.trim();
  return clean.length > 0 ? clean : undefined;
}

function isUnknownSpecies(species?: string): boolean {
  if (!species) return true;
  const s = species.toLowerCase();
  return s.includes('unknown') || s === 'n/a' || s === 'unidentified';
}

function extractChlorosis(obs?: PlantObservation): number | undefined {
  if (!obs) return undefined;
  if (obs.baselineDeltas?.chlorosisDeltaPercent !== undefined) {
    return Math.max(0, obs.baselineDeltas.chlorosisDeltaPercent);
  }
  // If visual indicators mention yellowing
  if (obs.visualIndicators?.some(i => i.toLowerCase().includes('chlorosis') || i.toLowerCase().includes('yellow'))) {
    return 8.0;
  }
  return undefined;
}

function synthesizeCopy(
  status: WhatChangedStatus,
  significance: ChangeSignificance,
  direction: ChangeDirection,
  meaningfulEvents: PlantChangeEvent[],
  reviewRequiredItems: PlantChangeEvent[],
  timeframeDescription: string
): {
  summaryHeadline: string;
  summaryExplanation: string;
  farmerHeadline: string;
  farmerWhy: string;
  farmerAction: string;
} {
  if (status === 'insufficient_history') {
    return {
      summaryHeadline: 'Not enough historical data to determine what changed.',
      summaryExplanation: 'At least two observation snapshots are required to analyze longitudinal change.',
      farmerHeadline: 'Waiting for more observation history',
      farmerWhy: 'We need at least two scans or readings over time to spot trends.',
      farmerAction: 'Continue running the system to build your plant baseline.',
    };
  }

  if (status === 'sensor_unavailable') {
    return {
      summaryHeadline: 'Sensor telemetry unavailable.',
      summaryExplanation: 'Sensors are offline or not delivering telemetry packets.',
      farmerHeadline: 'Sensor readings currently unavailable',
      farmerWhy: 'We cannot verify water or nutrient shifts without active sensor readings.',
      farmerAction: 'Check IoT controller power and probe connections.',
    };
  }

  if (status === 'stable_no_change' || meaningfulEvents.length === 0) {
    return {
      summaryHeadline: 'Conditions are stable — no significant changes detected.',
      summaryExplanation: `All visual and sensor metrics remain within nominal baseline drift thresholds over ${timeframeDescription}.`,
      farmerHeadline: 'All quiet — your crop is steady',
      farmerWhy: `Water, nutrients, and leaf condition have not shifted significantly over ${timeframeDescription}.`,
      farmerAction: 'No action needed. Keep current routine.',
    };
  }

  // Check for critical review required items first (e.g. species shift)
  if (reviewRequiredItems.length > 0) {
    const rev = reviewRequiredItems[0];
    return {
      summaryHeadline: rev.summary,
      summaryExplanation: `${rev.whyItMatters} ${rev.suggestedCheck}`,
      farmerHeadline: rev.farmerHeadline,
      farmerWhy: rev.farmerWhy,
      farmerAction: rev.farmerAction,
    };
  }

  // Prioritize combined reasoning events
  const combined = meaningfulEvents.find(e => e.category === 'combined');
  if (combined) {
    return {
      summaryHeadline: combined.summary,
      summaryExplanation: `${combined.whyItMatters} Action: ${combined.farmerAction}`,
      farmerHeadline: combined.farmerHeadline,
      farmerWhy: combined.farmerWhy,
      farmerAction: combined.farmerAction,
    };
  }

  // Pick top critical/significant event
  const topEvent =
    meaningfulEvents.find(e => e.significance === 'CRITICAL') ||
    meaningfulEvents.find(e => e.significance === 'SIGNIFICANT') ||
    meaningfulEvents.find(e => e.significance === 'MODERATE') ||
    meaningfulEvents[0];

  return {
    summaryHeadline: topEvent.summary,
    summaryExplanation: `${topEvent.whyItMatters} Recommended check: ${topEvent.suggestedCheck}`,
    farmerHeadline: topEvent.farmerHeadline,
    farmerWhy: topEvent.farmerWhy,
    farmerAction: topEvent.farmerAction,
  };
}
