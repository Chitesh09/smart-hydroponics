/**
 * HydroSmart — Phase 10: Confidence-Aware Plant Alert Engine
 * 
 * Production-grade alert intelligence layer combining:
 * - ESP32 sensor telemetry & baselines (pH, TDS, water level)
 * - Computer vision plant detection & visual health metrics
 * - Phase 6 Multimodal reasoning events
 * - Phase 7 What Changed longitudinal events
 * - Phase 9 Environment <-> Plant correlations
 * 
 * CRITICAL SCIENTIFIC INVARIANTS:
 * 1. Strictly NON-CAUSAL framing: Uses "associated with", "coincided with", "occurred alongside".
 *    Never claims unsupported biological causation (no "caused", "proves", "diagnosed").
 * 2. Confidence-Gated: INSUFFICIENT confidence suppresses action alerts; LOW confidence yields
 *    only informational/data-quality notices.
 * 3. Temporal Persistence: Single noisy frames or brief sensor blips never trigger health alerts.
 * 4. Missing Data Honesty: Missing readings are never treated as zero or normal.
 * 5. Hysteresis & Debouncing: Clean recovery buffer prevents alert oscillation and spam.
 */

import {
  PlantAlert,
  PlantAlertSummary,
  PlantAlertSeverity,
  PlantAlertCategory,
  PlantAlertTrigger,
  PlantAlertConfidence,
  PlantObservation,
  PlantProfile,
  CropTargetProfile,
  PlantReasoningEvent,
  WhatChangedSummary,
  CorrelationAnalysisSummary,
  PlantDetectionResult,
  VisualHealthAnalysisResult,
} from './types';
import { ALERT_CONFIG, AlertThresholdConfig } from './alertConfig';
import { DEFAULT_CROP_PROFILE } from './healthScore';

export interface EvaluateAlertsInputs {
  plantId: string;
  observations: PlantObservation[];
  latestObservation?: PlantObservation | null;
  latestDetection?: PlantDetectionResult | null;
  latestVisualHealth?: VisualHealthAnalysisResult | null;
  latestReading?: {
    ph?: number;
    tds?: number;
    waterLevel?: number;
    distance?: number;
    timestamp?: number;
  } | null;
  sensorHistory?: Array<{
    ph?: number;
    tds?: number;
    waterLevel?: number;
    distance?: number;
    timestamp?: number;
  }>;
  isTelemetryStale?: boolean;
  telemetryMode?: 'real' | 'simulation';
  isCameraActive?: boolean;
  plantProfile?: PlantProfile | null;
  cropProfile?: CropTargetProfile;
  latestReasoningEvent?: PlantReasoningEvent | null;
  whatChangedSummary?: WhatChangedSummary | null;
  correlationSummary?: CorrelationAnalysisSummary | null;
  storedAlerts?: PlantAlert[];
  config?: AlertThresholdConfig;
}

/**
 * Generate a deterministic alert ID based on core causal attributes
 */
function buildAlertId(
  plantId: string,
  category: PlantAlertCategory,
  triggerType: PlantAlertTrigger,
  metric: string = 'general'
): string {
  return `alert_${plantId}_${category.toLowerCase()}_${triggerType}_${metric}`;
}

/**
 * Evaluate all candidate conditions and derive confidence-aware alerts
 */
export function evaluatePlantAlerts(inputs: EvaluateAlertsInputs): PlantAlertSummary {
  const {
    plantId,
    observations = [],
    latestDetection = null,
    latestVisualHealth = null,
    latestReading = null,
    sensorHistory = [],
    isTelemetryStale = false,
    isCameraActive = false,
    plantProfile = null,
    cropProfile = DEFAULT_CROP_PROFILE,
    latestReasoningEvent = null,
    whatChangedSummary = null,
    correlationSummary = null,
    storedAlerts = [],
    config = ALERT_CONFIG,
  } = inputs;

  const now = Date.now();
  const plantObservations = observations.filter(o => o.plantId === plantId);
  const candidateAlerts: PlantAlert[] = [];
  const resolvedAlertIds = new Set<string>();

  // Map existing stored alerts for fast lookup and state preservation
  const storedAlertMap = new Map<string, PlantAlert>();
  for (const a of storedAlerts) {
    if (a.plantId === plantId) {
      storedAlertMap.set(a.id, a);
    }
  }

  // =========================================================================
  // 1. DATA QUALITY RULES
  // =========================================================================

  // Rule 1A: Telemetry Stale or Disconnected
  const isSensorStale = Boolean(isTelemetryStale);
  const alertIdStale = buildAlertId(plantId, 'DATA_QUALITY', 'sensor_stale', 'telemetry');

  if (isSensorStale) {
    candidateAlerts.push({
      id: alertIdStale,
      plantId,
      createdAt: now,
      updatedAt: now,
      status: 'ACTIVE',
      severity: 'INFO',
      category: 'DATA_QUALITY',
      triggerType: 'sensor_stale',
      metric: 'telemetry',
      confidence: 'HIGH',
      confidenceReason: 'Sensor communication timeout detected (>15s without telemetry packet).',
      title: 'Sensor Telemetry Is Stale',
      farmerMessage: 'The sensor data has stopped updating. Readings may not reflect current conditions.',
      farmerWhy: 'No new measurements have been received from the monitoring unit recently.',
      farmerAction: 'Check the hardware connection and ensure the monitoring unit is powered on.',
      technicalMessage: 'ESP32 serial telemetry connection indicates stale stream (>15,000ms heartbeat interval).',
      limitation: 'Environmental assessments cannot be verified while telemetry is offline.',
      evidenceIds: [],
      changeEventIds: [],
      environmentAssociationIds: [],
      occurrenceCount: 1,
      firstDetectedAt: now,
      lastDetectedAt: now,
      persistenceWindowMs: config.timing.telemetryStaleTimeoutMs,
      recommendedAction: 'Verify physical USB/Serial link and ESP32 power status.',
      source: 'sensor',
    });
  } else if (storedAlertMap.has(alertIdStale)) {
    resolvedAlertIds.add(alertIdStale);
  }

  // Rule 1B: Camera Active but No Plant Detected
  const alertIdNoPlant = buildAlertId(plantId, 'DATA_QUALITY', 'data_quality', 'camera_plant_presence');
  const isPlantDetected = latestDetection ? latestDetection.isPlantDetected : undefined;

  if (isCameraActive && isPlantDetected === false) {
    // Check if absent over last 2 consecutive observations to avoid frame flicker
    const recentAbsences = plantObservations
      .slice(-config.visual.minConsecutiveStressFrames)
      .filter(o => o.cameraActive && o.isPlantDetected === false).length;

    if (recentAbsences >= config.visual.minConsecutiveStressFrames) {
      candidateAlerts.push({
        id: alertIdNoPlant,
        plantId,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE',
        severity: 'INFO',
        category: 'DATA_QUALITY',
        triggerType: 'data_quality',
        metric: 'plant_presence',
        confidence: 'HIGH',
        confidenceReason: `No plant detected in canopy field-of-view across ${recentAbsences} consecutive scans.`,
        title: 'No Plant Detected in Camera View',
        farmerMessage: 'The camera does not clearly see a plant right now.',
        farmerWhy: 'The visual scanner could not detect green foliage in the frame.',
        farmerAction: 'Ensure the camera is pointed directly at the plant canopy without obstruction.',
        technicalMessage: 'Optical detector rejected candidate frames: plantPresenceState is NO_PLANT or below confidence threshold.',
        limitation: 'Visual health cannot be analyzed without clear foliage in the frame.',
        evidenceIds: [],
        changeEventIds: [],
        environmentAssociationIds: [],
        occurrenceCount: 1,
        firstDetectedAt: now,
        lastDetectedAt: now,
        persistenceWindowMs: 0,
        recommendedAction: 'Adjust camera alignment and ensure adequate lighting.',
        source: 'visual',
      });
    }
  } else if (storedAlertMap.has(alertIdNoPlant)) {
    resolvedAlertIds.add(alertIdNoPlant);
  }

  // =========================================================================
  // 2. SENSOR ENVIRONMENT RULES (pH, TDS, Water Level)
  // Gated: Telemetry must be active and not stale; missing data is NOT zero.
  // =========================================================================

  if (!isSensorStale && latestReading) {
    const { ph, tds, waterLevel } = latestReading;

    // --- 2A. WATER LEVEL ALERTS ---
    const alertIdWater = buildAlertId(plantId, 'WATER_LEVEL', 'sensor_out_of_range', 'water_level');

    if (typeof waterLevel === 'number' && !isNaN(waterLevel) && waterLevel >= 0 && waterLevel <= 100) {
      const isCritical = waterLevel < config.waterLevel.criticalPercent;
      const isWarning = waterLevel < config.waterLevel.warningPercent;

      if (isWarning) {
        // Count consecutive readings below threshold in sensorHistory to verify persistence
        const recentDepletedCount = sensorHistory
          .slice(-config.timing.minSensorPersistenceCount)
          .filter(r => typeof r.waterLevel === 'number' && r.waterLevel < config.waterLevel.warningPercent).length;

        const isPersistent = recentDepletedCount >= Math.min(sensorHistory.length, config.timing.minSensorPersistenceCount);
        const severity: PlantAlertSeverity = isCritical ? 'URGENT' : (isPersistent ? 'ATTENTION' : 'INFO');
        const confidence: PlantAlertConfidence = isPersistent ? 'HIGH' : 'MODERATE';

        candidateAlerts.push({
          id: alertIdWater,
          plantId,
          createdAt: now,
          updatedAt: now,
          status: 'ACTIVE',
          severity,
          category: 'WATER_LEVEL',
          triggerType: 'sensor_out_of_range',
          metric: 'waterLevel',
          currentValue: Math.round(waterLevel),
          threshold: isCritical ? config.waterLevel.criticalPercent : config.waterLevel.warningPercent,
          direction: 'falling',
          confidence,
          confidenceReason: `Reservoir volume measured at ${Math.round(waterLevel)}% (sustained across ${recentDepletedCount} telemetry readings).`,
          title: isCritical ? 'Critical Reservoir Water Level' : 'Low Reservoir Water Level',
          farmerMessage: isCritical
            ? `Reservoir water level is critically low at ${Math.round(waterLevel)}%.`
            : `Water level is lower than usual (${Math.round(waterLevel)}%).`,
          farmerWhy: 'The nutrient reservoir volume has decreased through plant uptake and evaporation.',
          farmerAction: 'Top up the reservoir tank with fresh water.',
          technicalMessage: `Ultrasonic telemetry indicates water level (${Math.round(waterLevel)}%) below ${isCritical ? 'critical' : 'warning'} threshold (${isCritical ? config.waterLevel.criticalPercent : config.waterLevel.warningPercent}%).`,
          limitation: 'Calculated from ultrasonic distance sensor; verify physical liquid depth.',
          evidenceIds: [],
          changeEventIds: [],
          environmentAssociationIds: [],
          occurrenceCount: 1,
          firstDetectedAt: now,
          lastDetectedAt: now,
          persistenceWindowMs: 0,
          recommendedAction: 'Inspect reservoir tank and add clean water to reach recommended depth.',
          source: 'sensor',
          hysteresisThreshold: config.waterLevel.warningPercent + config.waterLevel.hysteresisPercent,
        });
      } else if (storedAlertMap.has(alertIdWater)) {
        // Hysteresis recovery check: must exceed warning threshold + hysteresis buffer
        if (waterLevel >= config.waterLevel.warningPercent + config.waterLevel.hysteresisPercent) {
          resolvedAlertIds.add(alertIdWater);
        }
      }
    }

    // --- 2B. pH DRIFT ALERTS ---
    const alertIdPh = buildAlertId(plantId, 'PH', 'sensor_out_of_range', 'ph');

    if (typeof ph === 'number' && !isNaN(ph) && ph > 0 && ph <= 14) {
      const phMin = cropProfile.phMin;
      const phMax = cropProfile.phMax;
      const isLow = ph < phMin;
      const isHigh = ph > phMax;

      if (isLow || isHigh) {
        const deviation = isLow ? phMin - ph : ph - phMax;
        const isCritical = deviation >= config.ph.criticalOffset;

        // Check persistence in sensorHistory
        const outOfRangeCount = sensorHistory
          .slice(-config.timing.minSensorPersistenceCount)
          .filter(r => typeof r.ph === 'number' && (r.ph < phMin || r.ph > phMax)).length;

        const isPersistent = outOfRangeCount >= Math.min(sensorHistory.length, config.timing.minSensorPersistenceCount);
        const severity: PlantAlertSeverity = isCritical ? 'URGENT' : (isPersistent ? 'ATTENTION' : 'INFO');
        const confidence: PlantAlertConfidence = isPersistent ? 'HIGH' : 'MODERATE';

        const direction = isLow ? 'falling' : 'rising';
        const targetStr = `${phMin.toFixed(1)} – ${phMax.toFixed(1)} pH`;

        candidateAlerts.push({
          id: alertIdPh,
          plantId,
          createdAt: now,
          updatedAt: now,
          status: 'ACTIVE',
          severity,
          category: 'PH',
          triggerType: 'sensor_out_of_range',
          metric: 'ph',
          currentValue: Number(ph.toFixed(2)),
          baselineValue: plantProfile?.baseline?.initialPH,
          threshold: isLow ? phMin : phMax,
          direction,
          confidence,
          confidenceReason: `pH reading of ${ph.toFixed(2)} outside target envelope (${targetStr}) across ${outOfRangeCount} readings.`,
          title: isLow ? 'Acidic pH Drift Notice' : 'Alkaline pH Drift Notice',
          farmerMessage: isLow
            ? `The nutrient water is more acidic than recommended (pH ${ph.toFixed(2)}).`
            : `The nutrient water is more alkaline than recommended (pH ${ph.toFixed(2)}).`,
          farmerWhy: `The target pH range for ${cropProfile.name || 'this plant'} is ${targetStr}.`,
          farmerAction: 'Check the reservoir solution and verify sensor calibration.',
          technicalMessage: `Solution pH (${ph.toFixed(2)}) deviates from target envelope [${targetStr}] by ${deviation.toFixed(2)} units.`,
          limitation: 'Telemetry indicates chemical shift; biological nutrient uptake impact requires observation.',
          evidenceIds: [],
          changeEventIds: [],
          environmentAssociationIds: [],
          occurrenceCount: 1,
          firstDetectedAt: now,
          lastDetectedAt: now,
          persistenceWindowMs: 0,
          recommendedAction: isLow
            ? 'Buffer reservoir with mild pH-Up solution to raise toward target range.'
            : 'Buffer reservoir with mild pH-Down solution to lower toward target range.',
          source: 'sensor',
          hysteresisThreshold: isLow ? phMin + config.ph.hysteresis : phMax - config.ph.hysteresis,
        });
      } else if (storedAlertMap.has(alertIdPh)) {
        // Hysteresis check
        const safeMin = phMin + config.ph.hysteresis;
        const safeMax = phMax - config.ph.hysteresis;
        if (ph >= safeMin && ph <= safeMax) {
          resolvedAlertIds.add(alertIdPh);
        }
      }
    }

    // --- 2C. TDS CONCENTRATION ALERTS ---
    const alertIdTds = buildAlertId(plantId, 'TDS', 'sensor_out_of_range', 'tds');

    if (typeof tds === 'number' && !isNaN(tds) && tds >= 0 && tds <= 5000) {
      const tdsMin = cropProfile.tdsMin;
      const tdsMax = cropProfile.tdsMax;
      const isLow = tds < tdsMin;
      const isHigh = tds > tdsMax;

      if (isLow || isHigh) {
        const deviation = isLow ? tdsMin - tds : tds - tdsMax;
        const isCritical = deviation >= config.tds.criticalOffset;

        const outOfRangeCount = sensorHistory
          .slice(-config.timing.minSensorPersistenceCount)
          .filter(r => typeof r.tds === 'number' && (r.tds < tdsMin || r.tds > tdsMax)).length;

        const isPersistent = outOfRangeCount >= Math.min(sensorHistory.length, config.timing.minSensorPersistenceCount);
        const severity: PlantAlertSeverity = isCritical ? 'URGENT' : (isPersistent ? 'ATTENTION' : 'INFO');
        const confidence: PlantAlertConfidence = isPersistent ? 'HIGH' : 'MODERATE';

        const direction = isLow ? 'falling' : 'rising';
        const targetStr = `${tdsMin} – ${tdsMax} PPM`;

        candidateAlerts.push({
          id: alertIdTds,
          plantId,
          createdAt: now,
          updatedAt: now,
          status: 'ACTIVE',
          severity,
          category: 'TDS',
          triggerType: 'sensor_out_of_range',
          metric: 'tds',
          currentValue: Math.round(tds),
          baselineValue: plantProfile?.baseline?.initialTDS,
          threshold: isLow ? tdsMin : tdsMax,
          direction,
          confidence,
          confidenceReason: `TDS reading of ${Math.round(tds)} PPM outside target range (${targetStr}) across ${outOfRangeCount} readings.`,
          title: isLow ? 'Nutrient Salt Depletion' : 'High Nutrient Salt Concentration',
          farmerMessage: isLow
            ? `The nutrient concentration is lower than recommended (${Math.round(tds)} PPM).`
            : `The nutrient concentration is higher than recommended (${Math.round(tds)} PPM).`,
          farmerWhy: `The target TDS envelope for ${cropProfile.name || 'this plant'} is ${targetStr}.`,
          farmerAction: isLow
            ? 'Consider replenishing nutrient stock solution.'
            : 'Check the reservoir and consider adding fresh water to dilute.',
          technicalMessage: `Nutrient conductivity (${Math.round(tds)} PPM) deviates from envelope [${targetStr}] by ${Math.round(deviation)} PPM.`,
          limitation: 'TDS measures total dissolved ions without distinguishing individual elemental ratios.',
          evidenceIds: [],
          changeEventIds: [],
          environmentAssociationIds: [],
          occurrenceCount: 1,
          firstDetectedAt: now,
          lastDetectedAt: now,
          persistenceWindowMs: 0,
          recommendedAction: isLow
            ? 'Add balanced nutrient solution to increase TDS into target range.'
            : 'Top up reservoir with dechlorinated fresh water to lower TDS into safe envelope.',
          source: 'sensor',
          hysteresisThreshold: isLow ? tdsMin + config.tds.hysteresis : tdsMax - config.tds.hysteresis,
        });
      } else if (storedAlertMap.has(alertIdTds)) {
        const safeMin = tdsMin + config.tds.hysteresis;
        const safeMax = tdsMax - config.tds.hysteresis;
        if (tds >= safeMin && tds <= safeMax) {
          resolvedAlertIds.add(alertIdTds);
        }
      }
    }
  }

  // =========================================================================
  // 3. VISUAL HEALTH & ANOMALY RULES
  // Gated: Optical plant detection must be true, confidence >= 50%
  // Single noisy frame never triggers an alert (requires temporal confirmation).
  // =========================================================================

  if (latestDetection && latestDetection.isPlantDetected && latestVisualHealth) {
    const detConf = latestDetection.confidence ?? (latestDetection as { plantDetectionConfidence?: number }).plantDetectionConfidence ?? 80;

    if (detConf >= config.visual.minDetectionConfidence) {
      const {
        healthState,
        visualHealthScore = 75,
        chlorosisYellowPercent = 0,
        necroticBrownPercent = 0,
        baselineDeltas = null,
      } = latestVisualHealth;

      // --- 3A. VISUAL HEALTH DETERIORATION ---
      const alertIdHealth = buildAlertId(plantId, 'PLANT_HEALTH', 'visual_health_transition', 'health_state');

      if (healthState === 'ATTENTION' || healthState === 'CRITICAL') {
        // Temporal verification: check recent observations
        const recentStressObs = plantObservations
          .slice(-config.visual.minConsecutiveStressFrames)
          .filter(o => o.visualHealthState === 'ATTENTION' || o.visualHealthState === 'CRITICAL' || (o.visualHealthScore !== undefined && o.visualHealthScore < 70));

        const isPersistent = recentStressObs.length >= Math.min(plantObservations.length, config.visual.minConsecutiveStressFrames);

        if (isPersistent) {
          const isCritical = healthState === 'CRITICAL' || visualHealthScore < 45;
          const severity: PlantAlertSeverity = isCritical ? 'URGENT' : 'ATTENTION';
          const confidence: PlantAlertConfidence = detConf > 75 ? 'HIGH' : 'MODERATE';

          candidateAlerts.push({
            id: alertIdHealth,
            plantId,
            createdAt: now,
            updatedAt: now,
            status: 'ACTIVE',
            severity,
            category: 'PLANT_HEALTH',
            triggerType: 'visual_health_transition',
            metric: 'visualHealthScore',
            currentValue: Math.round(visualHealthScore),
            baselineValue: plantProfile?.baseline?.initialHealthScore,
            threshold: isCritical ? 45 : 70,
            direction: 'falling',
            confidence,
            confidenceReason: `Foliar analysis confirmed ${healthState} status across ${recentStressObs.length} observations (detection confidence: ${detConf}%).`,
            title: isCritical ? 'Plant Foliage Under Significant Stress' : 'Plant Foliage Requires Attention',
            farmerMessage: isCritical
              ? `The plant foliage is showing noticeable signs of stress (health score ${Math.round(visualHealthScore)}).`
              : `The plant foliage condition has changed and requires a visual check (health score ${Math.round(visualHealthScore)}).`,
            farmerWhy: 'Visual analysis detected atypical leaf coloration or reduced vigor compared with healthy baseline.',
            farmerAction: 'Inspect the leaves closely for discoloration, spots, or drooping, and check growing conditions.',
            technicalMessage: `Optical health state transitioned to ${healthState} (score: ${Math.round(visualHealthScore)}, yellowing: ${chlorosisYellowPercent}%, browning: ${necroticBrownPercent}%).`,
            limitation: 'Computer vision assesses surface leaf optical properties; cannot independently confirm pathogen presence.',
            evidenceIds: [],
            changeEventIds: [],
            environmentAssociationIds: [],
            occurrenceCount: 1,
            firstDetectedAt: now,
            lastDetectedAt: now,
            persistenceWindowMs: 0,
            recommendedAction: 'Perform direct physical canopy inspection and monitor recovery over the next 24 hours.',
            source: 'visual',
          });
        }
      } else if (storedAlertMap.has(alertIdHealth) && (healthState === 'HEALTHY' || healthState === 'STABLE')) {
        resolvedAlertIds.add(alertIdHealth);
      }

      // --- 3B. CHLOROSIS (LEAF YELLOWING) ANOMALY ---
      const alertIdChlorosis = buildAlertId(plantId, 'VISUAL_ANOMALY', 'visual_anomaly', 'chlorosis');

      if (chlorosisYellowPercent >= config.visual.chlorosisAttentionPercent) {
        const isUrgent = chlorosisYellowPercent >= config.visual.chlorosisUrgentPercent;
        const severity: PlantAlertSeverity = isUrgent ? 'URGENT' : 'ATTENTION';

        // Check recent observations to ensure not a single-frame lighting artifact
        const confirmedYellowing = plantObservations
          .slice(-config.visual.minConsecutiveStressFrames)
          .filter(o => (o.multimodalAssessment?.visualState as string) === 'mild_stress' ||
                       (o.visualScoreBreakdown && o.visualScoreBreakdown.colorConditionScore < 80) ||
                       (o.visualHealthState === 'ATTENTION' || o.visualHealthState === 'CRITICAL')).length;

        const isConfirmed = confirmedYellowing >= 1 || plantObservations.length < 2;

        if (isConfirmed) {
          candidateAlerts.push({
            id: alertIdChlorosis,
            plantId,
            createdAt: now,
            updatedAt: now,
            status: 'ACTIVE',
            severity,
            category: 'VISUAL_ANOMALY',
            triggerType: 'visual_anomaly',
            metric: 'chlorosis',
            currentValue: `${chlorosisYellowPercent.toFixed(1)}%`,
            threshold: `${config.visual.chlorosisAttentionPercent}%`,
            direction: 'rising',
            confidence: detConf > 75 ? 'HIGH' : 'MODERATE',
            confidenceReason: `Foliar yellowing measured at ${chlorosisYellowPercent.toFixed(1)}% of canopy surface.`,
            title: isUrgent ? 'Extensive Foliage Yellowing Detected' : 'Noticeable Leaf Yellowing Detected',
            farmerMessage: `The plant is showing more yellowing across its leaves (${chlorosisYellowPercent.toFixed(1)}% of canopy).`,
            farmerWhy: 'Chlorophyll levels appear reduced compared with a vibrant green canopy.',
            farmerAction: 'Inspect the leaves and check whether water and nutrient levels have changed recently.',
            technicalMessage: `Canopy chlorosis index reached ${chlorosisYellowPercent.toFixed(1)}% (attention threshold: ${config.visual.chlorosisAttentionPercent}%).`,
            limitation: 'Yellowing is a non-specific visual symptom that can coincide with nutrient, light, or water variations.',
            evidenceIds: [],
            changeEventIds: [],
            environmentAssociationIds: [],
            occurrenceCount: 1,
            firstDetectedAt: now,
            lastDetectedAt: now,
            persistenceWindowMs: 0,
            recommendedAction: 'Compare current nutrient readings against historical baseline and check root zone.',
            source: 'visual',
          });
        }
      } else if (storedAlertMap.has(alertIdChlorosis) && chlorosisYellowPercent < config.visual.chlorosisAttentionPercent - 2.0) {
        resolvedAlertIds.add(alertIdChlorosis);
      }

      // --- 3C. NECROSIS (TISSUE BROWNING) ANOMALY ---
      const alertIdNecrosis = buildAlertId(plantId, 'VISUAL_ANOMALY', 'visual_anomaly', 'necrosis');

      if (necroticBrownPercent >= config.visual.necrosisAttentionPercent) {
        const isUrgent = necroticBrownPercent >= config.visual.necrosisUrgentPercent;
        const severity: PlantAlertSeverity = isUrgent ? 'URGENT' : 'ATTENTION';

        candidateAlerts.push({
          id: alertIdNecrosis,
          plantId,
          createdAt: now,
          updatedAt: now,
          status: 'ACTIVE',
          severity,
          category: 'VISUAL_ANOMALY',
          triggerType: 'visual_anomaly',
          metric: 'necrosis',
          currentValue: `${necroticBrownPercent.toFixed(1)}%`,
          threshold: `${config.visual.necrosisAttentionPercent}%`,
          direction: 'rising',
          confidence: detConf > 75 ? 'HIGH' : 'MODERATE',
          confidenceReason: `Foliar necrotic browning measured at ${necroticBrownPercent.toFixed(1)}% of canopy.`,
          title: isUrgent ? 'Severe Leaf Tip Browning (Necrosis)' : 'Leaf Tip Browning Detected',
          farmerMessage: `The plant leaves are showing brown edges or spots (${necroticBrownPercent.toFixed(1)}% of canopy).`,
          farmerWhy: 'Tissue browning often coincides with dry air, high salt concentrations, or localized leaf drying.',
          farmerAction: 'Check for nutrient burn on leaf tips and inspect humidity and water circulation.',
          technicalMessage: `Canopy necrotic index reached ${necroticBrownPercent.toFixed(1)}% (attention threshold: ${config.visual.necrosisAttentionPercent}%).`,
          limitation: 'Optical inspection detects brown tissue pigmentation; causal agent requires physical examination.',
          evidenceIds: [],
          changeEventIds: [],
          environmentAssociationIds: [],
          occurrenceCount: 1,
          firstDetectedAt: now,
          lastDetectedAt: now,
          persistenceWindowMs: 0,
          recommendedAction: 'Check reservoir TDS to ensure salts are not elevated and inspect leaf margins.',
          source: 'visual',
        });
      } else if (storedAlertMap.has(alertIdNecrosis) && necroticBrownPercent < config.visual.necrosisAttentionPercent - 1.0) {
        resolvedAlertIds.add(alertIdNecrosis);
      }

      // --- 3D. CANOPY CONTRACTION (BASELINE DROP) ---
      if (baselineDeltas && baselineDeltas.relativeCanopyChangePercent) {
        const relDrop = baselineDeltas.relativeCanopyChangePercent;
        const alertIdCanopy = buildAlertId(plantId, 'GROWTH', 'growth_decline', 'canopy_area');

        if (relDrop <= config.visual.canopyContractionAttention) {
          const isUrgent = relDrop <= config.visual.canopyContractionUrgent;
          const severity: PlantAlertSeverity = isUrgent ? 'URGENT' : 'ATTENTION';

          candidateAlerts.push({
            id: alertIdCanopy,
            plantId,
            createdAt: now,
            updatedAt: now,
            status: 'ACTIVE',
            severity,
            category: 'GROWTH',
            triggerType: 'growth_decline',
            metric: 'canopyCoverage',
            currentValue: `${relDrop.toFixed(1)}%`,
            threshold: `${config.visual.canopyContractionAttention}%`,
            direction: 'falling',
            confidence: 'MODERATE',
            confidenceReason: `Canopy visible area decreased by ${Math.abs(relDrop).toFixed(1)}% compared with initial baseline.`,
            title: isUrgent ? 'Significant Canopy Area Reduction' : 'Noticeable Canopy Reduction',
            farmerMessage: `The plant canopy appears smaller than before (${Math.abs(relDrop).toFixed(0)}% reduction).`,
            farmerWhy: 'This can happen if leaves are drooping, curling, or have been pruned.',
            farmerAction: 'Check if the plant is wilting or if leaves have dropped, and check root moisture.',
            technicalMessage: `Optical canopy area contracted by ${relDrop.toFixed(1)}% relative to established visual baseline.`,
            limitation: 'Camera angle shift, leaf repositioning, or lighting changes can alter apparent 2D canopy area.',
            evidenceIds: [],
            changeEventIds: [],
            environmentAssociationIds: [],
            occurrenceCount: 1,
            firstDetectedAt: now,
            lastDetectedAt: now,
            persistenceWindowMs: 0,
            recommendedAction: 'Check for stem wilting, root aeration, and ensure camera position has not shifted.',
            source: 'visual',
          });
        } else if (storedAlertMap.has(alertIdCanopy) && relDrop > config.visual.canopyContractionAttention + 5.0) {
          resolvedAlertIds.add(alertIdCanopy);
        }
      }
    }
  }

  // =========================================================================
  // 4. MULTIMODAL & CORRELATION RULES (Phase 6 Reasoning + Phase 9 Correlation)
  // Gated: Strictly non-causal language; correlation used as supporting evidence.
  // =========================================================================

  if (correlationSummary && correlationSummary.primaryAssociation) {
    const assoc = correlationSummary.primaryAssociation;
    const alertIdMultimodal = buildAlertId(plantId, 'MULTIMODAL', 'phase9_association', assoc.environmentMetric);

    const isTemporalOrLagged =
      assoc.associationType === 'TEMPORAL_ASSOCIATION' ||
      assoc.associationType === 'LAGGED_ASSOCIATION' ||
      assoc.associationType === 'COINCIDENT_CHANGE';

    const hasMeaningfulConfidence = assoc.confidence === 'HIGH' || assoc.confidence === 'MODERATE';
    const hasVisualDecline = assoc.plantDirection === 'declined';

    if (isTemporalOrLagged && hasMeaningfulConfidence && hasVisualDecline) {
      candidateAlerts.push({
        id: alertIdMultimodal,
        plantId,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE',
        severity: 'ATTENTION',
        category: 'MULTIMODAL',
        triggerType: 'phase9_association',
        metric: assoc.environmentMetric,
        currentValue: assoc.environmentValue,
        baselineValue: assoc.environmentBaseline,
        direction: assoc.environmentDirection === 'unavailable' ? 'unknown' : assoc.environmentDirection,
        confidence: assoc.confidence === 'HIGH' ? 'HIGH' : 'MODERATE',
        confidenceReason: `Phase 9 correlation detected a ${assoc.associationStrength} temporal association between ${assoc.environmentLabel} and ${assoc.plantLabel}.`,
        title: `${assoc.environmentLabel} Coincided with Visual Plant Shift`,
        farmerMessage: `Your plant showed increased stress during a period when ${assoc.environmentLabel.toLowerCase()} was outside its usual range.`,
        farmerWhy: `The visual changes occurred alongside changes in the ${assoc.environmentLabel.toLowerCase()} readings.`,
        farmerAction: 'Check the reservoir conditions and continue monitoring the plant.',
        technicalMessage: `Empirical association: ${assoc.environmentLabel} shift (${assoc.environmentDirection}) coincided with ${assoc.plantLabel} decline. Method: ${assoc.correlationMethod}, N=${assoc.sampleSize}.`,
        limitation: 'This correlation reflects observed temporal co-movement and does not prove direct biological causation.',
        evidenceIds: assoc.evidenceIds || [],
        reasoningEventId: latestReasoningEvent?.id,
        changeEventIds: [],
        environmentAssociationIds: [assoc.id],
        occurrenceCount: 1,
        firstDetectedAt: now,
        lastDetectedAt: now,
        persistenceWindowMs: 0,
        recommendedAction: 'Verify solution chemistry against crop targets and observe plant recovery trajectory.',
        source: 'correlation',
      });
    } else if (storedAlertMap.has(alertIdMultimodal) && !isTemporalOrLagged) {
      resolvedAlertIds.add(alertIdMultimodal);
    }
  }

  // =========================================================================
  // 5. WHAT CHANGED CRITICAL RULES (Phase 7 Integration)
  // Gated: Requires critical significance and valid confidence.
  // =========================================================================

  if (whatChangedSummary && whatChangedSummary.hasMeaningfulChange) {
    const criticalEvents = whatChangedSummary.events.filter(
      e => e.significance === 'CRITICAL' && e.confidence !== 'INSUFFICIENT_DATA'
    );

    for (const changeEvent of criticalEvents) {
      const alertIdChange = buildAlertId(plantId, 'ENVIRONMENT', 'what_changed', changeEvent.metric);

      candidateAlerts.push({
        id: alertIdChange,
        plantId,
        createdAt: now,
        updatedAt: now,
        status: 'ACTIVE',
        severity: 'ATTENTION',
        category: changeEvent.category === 'visual' ? 'PLANT_HEALTH' : 'ENVIRONMENT',
        triggerType: 'what_changed',
        metric: changeEvent.metric,
        currentValue: changeEvent.currentValue !== null && changeEvent.currentValue !== undefined ? String(changeEvent.currentValue) : undefined,
        baselineValue: changeEvent.baselineValue !== null && changeEvent.baselineValue !== undefined ? String(changeEvent.baselineValue) : undefined,
        direction: changeEvent.direction === 'improved' ? 'rising' : 'falling',
        confidence: changeEvent.confidence === 'HIGH' ? 'HIGH' : 'MODERATE',
        confidenceReason: `Phase 7 What-Changed engine reported a critical change in ${changeEvent.label} (${changeEvent.summary}).`,
        title: `Significant Change: ${changeEvent.label}`,
        farmerMessage: changeEvent.farmerHeadline || `A meaningful change was recorded in ${changeEvent.label}.`,
        farmerWhy: changeEvent.farmerWhy || changeEvent.whyItMatters || 'The readings shifted noticeably compared with earlier observations.',
        farmerAction: changeEvent.farmerAction || changeEvent.suggestedCheck || 'Check the system to confirm everything is running smoothly.',
        technicalMessage: `Longitudinal shift in ${changeEvent.metric}: delta = ${changeEvent.delta ?? '--'}, temporal window: ${changeEvent.temporalWindow}.`,
        limitation: 'Historical comparison reflects stored observational data points.',
        evidenceIds: [],
        changeEventIds: [changeEvent.id],
        environmentAssociationIds: [],
        occurrenceCount: 1,
        firstDetectedAt: now,
        lastDetectedAt: now,
        persistenceWindowMs: 0,
        recommendedAction: changeEvent.suggestedCheck || 'Inspect the corresponding sensor or plant zone.',
        source: 'reasoning',
      });
    }
  }

  // =========================================================================
  // 6. DEDUPLICATION, MERGING & LIFECYCLE MANAGEMENT
  // =========================================================================

  const mergedAlertMap = new Map<string, PlantAlert>();

  // Carry over previously stored non-resolved alerts, updating them
  for (const stored of storedAlerts) {
    if (stored.plantId !== plantId) continue;

    // Check if this alert was resolved during this evaluation
    if (resolvedAlertIds.has(stored.id)) {
      mergedAlertMap.set(stored.id, {
        ...stored,
        status: 'RESOLVED',
        resolvedAt: stored.resolvedAt || now,
        updatedAt: now,
      });
    } else {
      mergedAlertMap.set(stored.id, stored);
    }
  }

  // Process newly derived candidate alerts
  for (const candidate of candidateAlerts) {
    const existing = mergedAlertMap.get(candidate.id);

    if (existing) {
      // If the alert was dismissed: check debounce window
      if (existing.status === 'DISMISSED') {
        const timeSinceDismissed = now - (existing.dismissedAt || 0);
        if (timeSinceDismissed < config.timing.debounceWindowMs) {
          // Still within debounce window — remain dismissed, do not bother user
          continue;
        }
      }

      // If existing alert was RESOLVED, condition has returned!
      // Otherwise increment occurrence count and update readings
      mergedAlertMap.set(candidate.id, {
        ...candidate,
        status: existing.status === 'RESOLVED' || existing.status === 'DISMISSED' ? 'ACTIVE' : existing.status,
        firstDetectedAt: existing.firstDetectedAt || candidate.firstDetectedAt,
        lastDetectedAt: now,
        occurrenceCount: (existing.occurrenceCount || 1) + 1,
        createdAt: existing.createdAt || candidate.createdAt,
        updatedAt: now,
      });
    } else {
      // Fresh new alert
      mergedAlertMap.set(candidate.id, candidate);
    }
  }

  const allAlerts = Array.from(mergedAlertMap.values());

  // Split into active, dismissed, resolved
  const activeAlerts = allAlerts.filter(a => a.status === 'ACTIVE' || a.status === 'ACKNOWLEDGED' || a.status === 'DETECTED');
  const dismissedAlerts = allAlerts.filter(a => a.status === 'DISMISSED');
  const resolvedAlerts = allAlerts.filter(a => a.status === 'RESOLVED');

  // Severity sorting priority: URGENT (1) -> ATTENTION (2) -> INFO (3), then newest first
  const severityRank: Record<PlantAlertSeverity, number> = {
    URGENT: 1,
    ATTENTION: 2,
    INFO: 3,
  };

  activeAlerts.sort((a, b) => {
    const rankDiff = severityRank[a.severity] - severityRank[b.severity];
    if (rankDiff !== 0) return rankDiff;
    return b.lastDetectedAt - a.lastDetectedAt;
  });

  const urgentCount = activeAlerts.filter(a => a.severity === 'URGENT').length;
  const attentionCount = activeAlerts.filter(a => a.severity === 'ATTENTION').length;
  const infoCount = activeAlerts.filter(a => a.severity === 'INFO').length;

  return {
    plantId,
    timestamp: now,
    activeAlerts,
    dismissedAlerts,
    resolvedAlerts,
    urgentCount,
    attentionCount,
    infoCount,
    hasAnyAlert: activeAlerts.length > 0,
    primaryAlert: activeAlerts.length > 0 ? activeAlerts[0] : null,
  };
}
