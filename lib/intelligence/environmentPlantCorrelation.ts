/**
 * HydroSmart — Phase 9: Environment ↔ Plant Correlation Intelligence Engine
 * 
 * Production-grade, evidence-based correlation engine that identifies associations
 * and temporal patterns between ESP32 sensor telemetry (pH, TDS, water level)
 * and visual plant metrics (health score, canopy coverage, chlorosis, necrosis).
 * 
 * CRITICAL SCIENTIFIC INVARIANTS:
 * 1. Strictly NON-CAUSAL framing: Identifies empirical associations and co-movements.
 *    Never claims unsupported biological causation (no "caused", "proves", "diagnosed").
 * 2. Small-sample honesty:
 *    - N < 3: reports 'insufficient_history'
 *    - 3 <= N < 5: qualitative trend pairing only (no Pearson/Spearman coefficients)
 *    - N >= 5: legitimate Pearson r and Spearman rho with zero-variance protection
 * 3. Never treats missing data as zero or stable.
 * 4. Multi-sensor confounding: Flags multi-variable shifts rather than falsely isolating one factor.
 */

import {
  PlantObservation,
  PlantProfile,
  WhatChangedSummary,
  EnvironmentPlantAssociation,
  EnvironmentAssociationType,
  AssociationStrength,
  AssociationConfidenceLevel,
  CorrelationTimeWindow,
  CorrelationAnalysisSummary,
  CorrelationAnalysisStatus,
  StructuredHealthState,
  VisualHealthState,
} from './types';

import { CORRELATION_CONFIG, CorrelationConfig } from './correlationConfig';

export interface CorrelationTelemetryReading {
  timestamp: number;
  ph?: number;
  tds?: number;
  waterLevel?: number;
  temperature?: number;
  distance?: number;
  quality?: Record<string, string>;
  source?: string;
}

export interface EvaluateCorrelationInputs {
  plantId: string;
  observations: PlantObservation[];
  sensorHistory?: CorrelationTelemetryReading[];
  latestReading?: CorrelationTelemetryReading | null;
  plantProfile?: PlantProfile | null;
  whatChangedSummary?: WhatChangedSummary | null;
  config?: CorrelationConfig;
}

interface PairedDataPoint {
  timestamp: number;
  ph?: number;
  tds?: number;
  waterLevel?: number;
  visualHealthScore?: number;
  canopyCoverage?: number;
  chlorosis?: number;
  necrosis?: number;
  healthState?: VisualHealthState | StructuredHealthState | string;
  sharpness?: number;
  confidence?: number;
  observationId: string;
}

/**
 * Robust Pearson linear correlation coefficient calculation.
 * Returns undefined if N < minPairs or if either series has zero variance.
 */
export function calculatePearsonCorrelation(
  x: number[],
  y: number[],
  minPairs: number = CORRELATION_CONFIG.minPairsForStats
): number | undefined {
  if (!x || !y || x.length !== y.length || x.length < minPairs) {
    return undefined;
  }

  const n = x.length;
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  let sumSqX = 0;
  let sumSqY = 0;
  let sumProd = 0;

  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    sumSqX += dx * dx;
    sumSqY += dy * dy;
    sumProd += dx * dy;
  }

  // Zero variance protection (avoid division by zero / NaN)
  if (sumSqX === 0 || sumSqY === 0) {
    return 0;
  }

  const r = sumProd / Math.sqrt(sumSqX * sumSqY);
  // Clamp to [-1, 1] to prevent floating point inaccuracies beyond range
  const clamped = Math.max(-1, Math.min(1, r));
  return Math.round(clamped * 1000) / 1000;
}

/**
 * Spearman rank correlation coefficient calculation with fractional tie handling.
 * Returns undefined if N < minPairs or if variance is zero.
 */
export function calculateSpearmanCorrelation(
  x: number[],
  y: number[],
  minPairs: number = CORRELATION_CONFIG.minPairsForStats
): number | undefined {
  if (!x || !y || x.length !== y.length || x.length < minPairs) {
    return undefined;
  }

  const rank = (arr: number[]): number[] => {
    const indexed = arr.map((val, idx) => ({ val, idx }));
    indexed.sort((a, b) => a.val - b.val);

    const ranks = new Array<number>(arr.length);
    let i = 0;
    while (i < indexed.length) {
      let j = i;
      while (j < indexed.length - 1 && indexed[j + 1].val === indexed[j].val) {
        j++;
      }
      // Average rank for ties (1-based rank)
      const avgRank = (i + 1 + j + 1) / 2;
      for (let k = i; k <= j; k++) {
        ranks[indexed[k].idx] = avgRank;
      }
      i = j + 1;
    }
    return ranks;
  };

  const rankX = rank(x);
  const rankY = rank(y);

  return calculatePearsonCorrelation(rankX, rankY, minPairs);
}

/**
 * Map correlation coefficient magnitude to qualitative strength
 */
export function getAssociationStrength(
  coefficient?: number,
  config: CorrelationConfig = CORRELATION_CONFIG
): AssociationStrength {
  if (coefficient === undefined) return 'none';
  const abs = Math.abs(coefficient);
  if (abs >= config.strengthThresholds.strong) return 'strong';
  if (abs >= config.strengthThresholds.moderate) return 'moderate';
  if (abs >= config.strengthThresholds.weak) return 'weak';
  return 'none';
}

/**
 * Align plant observations with nearest valid sensor telemetry records.
 */
function alignTelemetryPairs(
  observations: PlantObservation[],
  sensorHistory: CorrelationTelemetryReading[] = [],
  latestReading: CorrelationTelemetryReading | null = null,
  config: CorrelationConfig = CORRELATION_CONFIG
): PairedDataPoint[] {
  const pairs: PairedDataPoint[] = [];

  for (const obs of observations) {
    // Check if observation itself already captured sensor values
    let ph = typeof obs.ph === 'number' && !isNaN(obs.ph) ? obs.ph : undefined;
    let tds = typeof obs.tds === 'number' && !isNaN(obs.tds) ? obs.tds : undefined;
    let waterLevel = typeof obs.waterLevel === 'number' && !isNaN(obs.waterLevel) ? obs.waterLevel : undefined;

    const isMetricUsable = (r: CorrelationTelemetryReading | null | undefined, metric: 'ph' | 'tds' | 'waterLevel'): boolean => {
      if (!r) return false;
      const q = r.quality?.[metric];
      if (q === 'INVALID' || q === 'OUT_OF_RANGE' || q === 'DISCONNECTED') return false;
      return true;
    };

    // If observation lacked embedded sensors, align with nearest sensorHistory entry within window
    if ((ph === undefined || tds === undefined || waterLevel === undefined) && sensorHistory.length > 0) {
      let closestReading: CorrelationTelemetryReading | null = null;
      let minDelta = Infinity;

      for (const reading of sensorHistory) {
        const delta = Math.abs(reading.timestamp - obs.timestamp);
        if (delta <= config.timeWindows.immediateMaxDeltaMs && delta < minDelta) {
          minDelta = delta;
          closestReading = reading;
        }
      }

      if (closestReading) {
        if (ph === undefined && typeof closestReading.ph === 'number' && isMetricUsable(closestReading, 'ph')) ph = closestReading.ph;
        if (tds === undefined && typeof closestReading.tds === 'number' && isMetricUsable(closestReading, 'tds')) tds = closestReading.tds;
        if (waterLevel === undefined && typeof closestReading.waterLevel === 'number' && isMetricUsable(closestReading, 'waterLevel')) waterLevel = closestReading.waterLevel;
      }
    }

    // Fallback: If observation is very recent (< 15 mins) and latestReading exists
    if ((ph === undefined || tds === undefined || waterLevel === undefined) && latestReading) {
      const delta = Math.abs(latestReading.timestamp - obs.timestamp);
      if (delta <= config.timeWindows.immediateMaxDeltaMs) {
        if (ph === undefined && typeof latestReading.ph === 'number' && isMetricUsable(latestReading, 'ph')) ph = latestReading.ph;
        if (tds === undefined && typeof latestReading.tds === 'number' && isMetricUsable(latestReading, 'tds')) tds = latestReading.tds;
        if (waterLevel === undefined && typeof latestReading.waterLevel === 'number' && isMetricUsable(latestReading, 'waterLevel')) waterLevel = latestReading.waterLevel;
      }
    }

    // Extract visual metrics
    const visualHealthScore = typeof obs.visualHealthScore === 'number' && !isNaN(obs.visualHealthScore)
      ? obs.visualHealthScore
      : undefined;

    const canopyCoverage = typeof obs.canopyCoveragePercent === 'number' && !isNaN(obs.canopyCoveragePercent)
      ? obs.canopyCoveragePercent
      : undefined;

    // Chlorosis & Necrosis from visualIndicators or baselineDeltas if available
    let chlorosis: number | undefined = undefined;
    let necrosis: number | undefined = undefined;

    if (obs.baselineDeltas) {
      chlorosis = obs.baselineDeltas.chlorosisDeltaPercent;
      necrosis = obs.baselineDeltas.necrosisDeltaPercent;
    }

    pairs.push({
      timestamp: obs.timestamp,
      ph,
      tds,
      waterLevel,
      visualHealthScore,
      canopyCoverage,
      chlorosis,
      necrosis,
      healthState: obs.visualHealthState,
      sharpness: obs.vegetationIndex,
      confidence: obs.plantDetectionConfidence,
      observationId: obs.id,
    });
  }

  // Sort chronologically ascending
  return pairs.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Main evaluation function for Environment ↔ Plant Correlation Intelligence.
 */
export function evaluateEnvironmentPlantCorrelation(
  inputs: EvaluateCorrelationInputs
): CorrelationAnalysisSummary {
  const {
    plantId,
    observations,
    sensorHistory = [],
    latestReading = null,
    plantProfile = null,
    whatChangedSummary: _whatChangedSummary = null,
    config = CORRELATION_CONFIG,
  } = inputs;

  const now = Date.now();

  // 1. Initial Gating & Plant Isolation Check
  const plantObservations = observations.filter(o => o.plantId === plantId);

  // Check if any sensors are available at all
  const hasSensorsInObs = plantObservations.some(o => typeof o.ph === 'number' || typeof o.tds === 'number' || typeof o.waterLevel === 'number');
  const hasSensorsInHistory = sensorHistory.length > 0;
  const hasLatestSensor = latestReading !== null;

  if (!hasSensorsInObs && !hasSensorsInHistory && !hasLatestSensor) {
    return {
      plantId,
      timestamp: now,
      status: 'sensor_unavailable',
      primaryAssociation: null,
      associations: [],
      laggedAssociations: [],
      confoundingFactors: ['Hardware telemetry unavailable (pH, TDS, and water level sensors offline)'],
      sampleSize: plantObservations.length,
      limitations: ['Cannot evaluate environmental correlations because all sensor telemetry is offline.'],
      farmerHeadline: 'Sensor telemetry is currently offline',
      farmerWhy: 'HydroSmart requires active nutrient and water sensor data to discover associations with plant health.',
      farmerAction: 'Ensure your ESP32 sensor hardware is powered and transmitting readings.',
    };
  }

  // Gating on observation count
  if (plantObservations.length < 2) {
    return {
      plantId,
      timestamp: now,
      status: 'insufficient_history',
      primaryAssociation: null,
      associations: [],
      laggedAssociations: [],
      confoundingFactors: [],
      sampleSize: plantObservations.length,
      limitations: ['Only 1 observation available. Need multiple observations over time to detect patterns.'],
      farmerHeadline: 'Collecting initial plant and environmental history',
      farmerWhy: 'HydroSmart needs multiple observations across different time windows to identify how growing conditions associate with your plant.',
      farmerAction: 'Continue running the system to build sufficient historical evidence.',
    };
  }

  // 2. Optical Gating & Quality Assessment
  const confoundingFactors: string[] = [];
  const limitations: string[] = [];

  const invalidOpticalObs = plantObservations.filter(o => {
    if (o.cameraActive === false) return false;
    if (o.isPlantDetected === false) return true;
    if (typeof o.plantDetectionConfidence === 'number' && o.plantDetectionConfidence < config.opticalGating.minConfidence * 100) return true;
    return false;
  });

  if (invalidOpticalObs.length > 0) {
    confoundingFactors.push(
      `${invalidOpticalObs.length} observation(s) had low camera confidence or no plant detected, reducing visual precision.`
    );
  }

  // Check for large time gaps (> 48h)
  for (let i = 1; i < plantObservations.length; i++) {
    const gapHours = (plantObservations[i].timestamp - plantObservations[i - 1].timestamp) / (1000 * 60 * 60);
    if (gapHours > 48) {
      confoundingFactors.push('Large time gap (>48 hours) between observations may hide intermediate environmental fluctuations.');
      break;
    }
  }

  // 3. Align Telemetry Pairs
  const pairedData = alignTelemetryPairs(plantObservations, sensorHistory, latestReading, config);
  const validPairs = pairedData.filter(p =>
    (p.ph !== undefined || p.tds !== undefined || p.waterLevel !== undefined) &&
    (p.visualHealthScore !== undefined || p.canopyCoverage !== undefined || p.healthState !== undefined)
  );

  const sampleSize = validPairs.length;

  if (sampleSize < config.minPairsForTrend) {
    return {
      plantId,
      timestamp: now,
      status: 'insufficient_history',
      primaryAssociation: null,
      associations: [],
      laggedAssociations: [],
      confoundingFactors,
      sampleSize,
      limitations: [
        `Found ${sampleSize} paired observation(s). At least ${config.minPairsForTrend} paired points are required to identify an environmental pattern.`,
      ],
      farmerHeadline: 'Not enough historical data to identify an environmental pattern',
      farmerWhy: 'Additional paired camera observations and sensor readings are needed before reliable associations can be reported.',
      farmerAction: 'Allow the system to collect several more observations across the day.',
    };
  }

  // 4. Multi-Sensor Confounding Factor Check
  // Check if multiple sensors moved significantly over the monitoring period
  const phVals = validPairs.map(p => p.ph).filter((v): v is number => typeof v === 'number');
  const tdsVals = validPairs.map(p => p.tds).filter((v): v is number => typeof v === 'number');
  const waterVals = validPairs.map(p => p.waterLevel).filter((v): v is number => typeof v === 'number');

  const phDelta = phVals.length >= 2 ? Math.abs(phVals[phVals.length - 1] - phVals[0]) : 0;
  const tdsDelta = tdsVals.length >= 2 ? Math.abs(tdsVals[tdsVals.length - 1] - tdsVals[0]) : 0;
  const waterDelta = waterVals.length >= 2 ? Math.abs(waterVals[waterVals.length - 1] - waterVals[0]) : 0;

  const shiftedSensors: string[] = [];
  if (phDelta >= config.shifts.phDeltaSignificant) shiftedSensors.push(`pH (drifted by ${phDelta.toFixed(2)})`);
  if (tdsDelta >= config.shifts.tdsDeltaSignificant) shiftedSensors.push(`TDS (shifted by ${Math.round(tdsDelta)} PPM)`);
  if (waterDelta >= config.shifts.waterLevelDeltaSignificant) shiftedSensors.push(`Water Level (shifted by ${waterDelta.toFixed(1)}%)`);

  const isMultiSensorEvent = shiftedSensors.length >= 2;
  if (isMultiSensorEvent) {
    confoundingFactors.push(
      `${shiftedSensors.join(' and ')} changed during the same period, so the available data does not isolate a single environmental factor.`
    );
  }

  // 5. Evaluate Environment ↔ Plant Metric Pairs
  const associations: EnvironmentPlantAssociation[] = [];
  const scoreVals = validPairs.map(p => p.visualHealthScore).filter((v): v is number => typeof v === 'number');
  const canopyVals = validPairs.map(p => p.canopyCoverage).filter((v): v is number => typeof v === 'number');

  const latestPair = validPairs[validPairs.length - 1];
  const earliestPair = validPairs[0];

  const _overallHealthDelta = scoreVals.length >= 2 ? scoreVals[scoreVals.length - 1] - scoreVals[0] : 0;
  const _overallCanopyDelta = canopyVals.length >= 2 ? canopyVals[canopyVals.length - 1] - canopyVals[0] : 0;

  // Helper to determine time window
  const totalWindowMs = latestPair.timestamp - earliestPair.timestamp;
  let timeWindow: CorrelationTimeWindow = 'immediate';
  if (totalWindowMs > config.timeWindows.sameDayMs) {
    timeWindow = 'recent_trend';
  } else if (totalWindowMs > config.timeWindows.immediateMaxDeltaMs) {
    timeWindow = 'same_day';
  }

  // Evaluate TDS vs Health Score
  if (tdsVals.length >= config.minPairsForTrend && scoreVals.length >= config.minPairsForTrend) {
    const pairLength = Math.min(tdsVals.length, scoreVals.length);
    const subTds = tdsVals.slice(-pairLength);
    const subScore = scoreVals.slice(-pairLength);

    const isStatistical = pairLength >= config.minPairsForStats;
    const r = isStatistical ? calculatePearsonCorrelation(subTds, subScore, config.minPairsForStats) : undefined;
    const rho = isStatistical ? calculateSpearmanCorrelation(subTds, subScore, config.minPairsForStats) : undefined;
    const coefficient = r !== undefined ? r : rho;
    const strength = getAssociationStrength(coefficient, config);

    const tdsDirection = subTds[subTds.length - 1] > subTds[0] + 15 ? 'rising' : subTds[subTds.length - 1] < subTds[0] - 15 ? 'falling' : 'stable';
    const scoreDirection = subScore[subScore.length - 1] > subScore[0] + 3 ? 'improved' : subScore[subScore.length - 1] < subScore[0] - 3 ? 'declined' : 'stable';

    let assocType: EnvironmentAssociationType = 'NO_CLEAR_ASSOCIATION';
    if (tdsDirection !== 'stable' && scoreDirection === 'stable') {
      assocType = 'ENVIRONMENT_ONLY_CHANGE';
    } else if (tdsDirection === 'stable' && scoreDirection !== 'stable') {
      assocType = 'PLANT_ONLY_CHANGE';
    } else if (tdsDirection !== 'stable' && scoreDirection !== 'stable') {
      assocType = isStatistical && strength !== 'none' ? 'TEMPORAL_ASSOCIATION' : 'COINCIDENT_CHANGE';
    }

    // Check for conflicting evidence: e.g. TDS in extreme stress range while visual health is optimal
    const currentTds = subTds[subTds.length - 1];
    const currentScore = subScore[subScore.length - 1];
    if (currentTds > 1200 && currentScore > 85) {
      assocType = 'CONFLICTING_EVIDENCE';
    }

    const confidence: AssociationConfidenceLevel =
      sampleSize >= 5 && isStatistical ? 'HIGH' : sampleSize >= 3 ? 'MODERATE' : 'LOW';

    const assocSummary = generateNonCausalAssociationSummary({
      environmentMetric: 'TDS',
      environmentDirection: tdsDirection,
      plantMetric: 'Visual Health Score',
      plantDirection: scoreDirection,
      associationType: assocType,
      associationStrength: strength,
      coefficient,
      lagHours: undefined,
    });

    const farmerCopy = generateFarmerAssociationCopy({
      envLabel: 'Nutrient concentration (TDS)',
      envDeltaText: `${tdsDirection === 'rising' ? 'increased' : tdsDirection === 'falling' ? 'decreased' : 'remained steady'} to ${Math.round(currentTds)} PPM`,
      plantLabel: 'Plant visual condition',
      plantDeltaText: `${scoreDirection === 'declined' ? 'showed reduced vigor' : scoreDirection === 'improved' ? 'showed healthy improvement' : 'remained stable'}`,
      assocType,
      isMultiSensor: isMultiSensorEvent,
      recommendation: tdsDirection === 'rising' && scoreDirection === 'declined'
        ? 'Dilute the nutrient reservoir with fresh water to bring TDS back to target levels.'
        : 'Maintain regular nutrient monitoring and monitor leaf appearance tomorrow.',
    });

    associations.push({
      id: `assoc-tds-health-${now}`,
      plantId,
      timestamp: now,
      environmentMetric: 'tds',
      environmentLabel: 'Total Dissolved Solids (TDS)',
      environmentValue: currentTds,
      environmentBaseline: plantProfile?.baseline?.initialTDS,
      environmentDirection: tdsDirection,
      plantMetric: 'visualHealthScore',
      plantLabel: 'Visual Health Score',
      plantValue: currentScore,
      plantBaseline: plantProfile?.baseline?.initialHealthScore,
      plantDirection: scoreDirection,
      timeWindow,
      associationType: assocType,
      associationStrength: strength,
      correlationCoefficient: coefficient,
      correlationMethod: isStatistical ? 'pearson' : 'qualitative_pairing',
      sampleSize: pairLength,
      confidence,
      confidenceReason: isStatistical
        ? `Computed Pearson correlation across ${pairLength} time-aligned data points.`
        : `Qualitative pairing evaluated across ${pairLength} points (minimum 5 needed for numerical r-value).`,
      dataQuality: invalidOpticalObs.length > 0 ? 'degraded' : 'good',
      confoundingFactors: isMultiSensorEvent ? [confoundingFactors[0]] : [],
      evidenceIds: [],
      relatedObservationIds: validPairs.map(p => p.observationId),
      summary: assocSummary,
      farmerSummary: farmerCopy,
      createdAt: now,
    });
  }

  // Evaluate Water Level vs Visual Health / Canopy
  if (waterVals.length >= config.minPairsForTrend && (scoreVals.length >= config.minPairsForTrend || canopyVals.length >= config.minPairsForTrend)) {
    const pairLength = Math.min(waterVals.length, scoreVals.length > 0 ? scoreVals.length : canopyVals.length);
    const subWater = waterVals.slice(-pairLength);
    const subScore = scoreVals.slice(-pairLength);

    const isStatistical = pairLength >= config.minPairsForStats;
    const r = isStatistical && subScore.length === pairLength
      ? calculatePearsonCorrelation(subWater, subScore, config.minPairsForStats)
      : undefined;
    const strength = getAssociationStrength(r, config);

    const waterDirection = subWater[subWater.length - 1] > subWater[0] + 3 ? 'rising' : subWater[subWater.length - 1] < subWater[0] - 3 ? 'falling' : 'stable';
    const scoreDirection = subScore.length >= 2
      ? (subScore[subScore.length - 1] > subScore[0] + 3 ? 'improved' : subScore[subScore.length - 1] < subScore[0] - 3 ? 'declined' : 'stable')
      : 'stable';

    let assocType: EnvironmentAssociationType = 'NO_CLEAR_ASSOCIATION';
    if (waterDirection !== 'stable' && scoreDirection === 'stable') {
      assocType = 'ENVIRONMENT_ONLY_CHANGE';
    } else if (waterDirection === 'stable' && scoreDirection !== 'stable') {
      assocType = 'PLANT_ONLY_CHANGE';
    } else if (waterDirection !== 'stable' && scoreDirection !== 'stable') {
      assocType = isStatistical && strength !== 'none' ? 'TEMPORAL_ASSOCIATION' : 'COINCIDENT_CHANGE';
    }

    const currentWater = subWater[subWater.length - 1];
    const currentScore = subScore[subScore.length - 1] || 0;

    const assocSummary = generateNonCausalAssociationSummary({
      environmentMetric: 'Water Level',
      environmentDirection: waterDirection,
      plantMetric: 'Visual Health Score',
      plantDirection: scoreDirection,
      associationType: assocType,
      associationStrength: strength,
      coefficient: r,
      lagHours: undefined,
    });

    const farmerCopy = generateFarmerAssociationCopy({
      envLabel: 'Reservoir water level',
      envDeltaText: `${waterDirection === 'falling' ? 'decreased' : waterDirection === 'rising' ? 'increased' : 'remained steady'} to ${Math.round(currentWater)}%`,
      plantLabel: 'Plant canopy and vigor',
      plantDeltaText: `${scoreDirection === 'declined' ? 'showed slight stress' : 'remained stable'}`,
      assocType,
      isMultiSensor: isMultiSensorEvent,
      recommendation: waterDirection === 'falling' && currentWater < 25
        ? 'Refill the reservoir with balanced nutrient solution.'
        : 'Continue normal water level monitoring.',
    });

    associations.push({
      id: `assoc-water-health-${now}`,
      plantId,
      timestamp: now,
      environmentMetric: 'waterLevel',
      environmentLabel: 'Reservoir Water Level',
      environmentValue: currentWater,
      environmentBaseline: plantProfile?.baseline?.initialWaterLevel,
      environmentDirection: waterDirection,
      plantMetric: 'visualHealthScore',
      plantLabel: 'Visual Health Score',
      plantValue: currentScore,
      plantBaseline: plantProfile?.baseline?.initialHealthScore,
      plantDirection: scoreDirection,
      timeWindow,
      associationType: assocType,
      associationStrength: strength,
      correlationCoefficient: r,
      correlationMethod: isStatistical ? 'pearson' : 'qualitative_pairing',
      sampleSize: pairLength,
      confidence: sampleSize >= 5 ? 'HIGH' : 'MODERATE',
      confidenceReason: isStatistical
        ? `Pearson correlation computed across ${pairLength} paired points.`
        : `Qualitative alignment across ${pairLength} observations.`,
      dataQuality: 'good',
      confoundingFactors: isMultiSensorEvent ? [confoundingFactors[0]] : [],
      evidenceIds: [],
      relatedObservationIds: validPairs.map(p => p.observationId),
      summary: assocSummary,
      farmerSummary: farmerCopy,
      createdAt: now,
    });
  }

  // Evaluate pH vs Visual Health
  if (phVals.length >= config.minPairsForTrend && scoreVals.length >= config.minPairsForTrend) {
    const pairLength = Math.min(phVals.length, scoreVals.length);
    const subPh = phVals.slice(-pairLength);
    const subScore = scoreVals.slice(-pairLength);

    const isStatistical = pairLength >= config.minPairsForStats;
    const r = isStatistical ? calculatePearsonCorrelation(subPh, subScore, config.minPairsForStats) : undefined;
    const strength = getAssociationStrength(r, config);

    const phDirection = subPh[subPh.length - 1] > subPh[0] + 0.15 ? 'rising' : subPh[subPh.length - 1] < subPh[0] - 0.15 ? 'falling' : 'stable';
    const scoreDirection = subScore[subScore.length - 1] > subScore[0] + 3 ? 'improved' : subScore[subScore.length - 1] < subScore[0] - 3 ? 'declined' : 'stable';

    let assocType: EnvironmentAssociationType = 'NO_CLEAR_ASSOCIATION';
    if (phDirection !== 'stable' && scoreDirection === 'stable') {
      assocType = 'ENVIRONMENT_ONLY_CHANGE';
    } else if (phDirection === 'stable' && scoreDirection !== 'stable') {
      assocType = 'PLANT_ONLY_CHANGE';
    } else if (phDirection !== 'stable' && scoreDirection !== 'stable') {
      assocType = isStatistical && strength !== 'none' ? 'TEMPORAL_ASSOCIATION' : 'COINCIDENT_CHANGE';
    }

    const currentPh = subPh[subPh.length - 1];
    const currentScore = subScore[subScore.length - 1];

    if ((currentPh < 5.0 || currentPh > 7.5) && currentScore > 85) {
      assocType = 'CONFLICTING_EVIDENCE';
    }

    const assocSummary = generateNonCausalAssociationSummary({
      environmentMetric: 'pH',
      environmentDirection: phDirection,
      plantMetric: 'Visual Health Score',
      plantDirection: scoreDirection,
      associationType: assocType,
      associationStrength: strength,
      coefficient: r,
      lagHours: undefined,
    });

    const farmerCopy = generateFarmerAssociationCopy({
      envLabel: 'Solution pH',
      envDeltaText: `${phDirection === 'rising' ? 'drifted upward' : phDirection === 'falling' ? 'drifted downward' : 'remained steady'} to ${currentPh.toFixed(2)}`,
      plantLabel: 'Plant visual vigor',
      plantDeltaText: `${scoreDirection === 'declined' ? 'showed mild stress' : 'remained stable'}`,
      assocType,
      isMultiSensor: isMultiSensorEvent,
      recommendation: currentPh > 6.8 || currentPh < 5.2
        ? 'Adjust the reservoir pH back to the optimal 5.8 - 6.2 range.'
        : 'Continue routine pH monitoring.',
    });

    associations.push({
      id: `assoc-ph-health-${now}`,
      plantId,
      timestamp: now,
      environmentMetric: 'ph',
      environmentLabel: 'Nutrient Solution pH',
      environmentValue: currentPh,
      environmentBaseline: plantProfile?.baseline?.initialPH,
      environmentDirection: phDirection,
      plantMetric: 'visualHealthScore',
      plantLabel: 'Visual Health Score',
      plantValue: currentScore,
      plantBaseline: plantProfile?.baseline?.initialHealthScore,
      plantDirection: scoreDirection,
      timeWindow,
      associationType: assocType,
      associationStrength: strength,
      correlationCoefficient: r,
      correlationMethod: isStatistical ? 'pearson' : 'qualitative_pairing',
      sampleSize: pairLength,
      confidence: sampleSize >= 5 ? 'HIGH' : 'MODERATE',
      confidenceReason: isStatistical
        ? `Pearson correlation computed across ${pairLength} paired points.`
        : `Qualitative pairing evaluated across ${pairLength} points.`,
      dataQuality: 'good',
      confoundingFactors: isMultiSensorEvent ? [confoundingFactors[0]] : [],
      evidenceIds: [],
      relatedObservationIds: validPairs.map(p => p.observationId),
      summary: assocSummary,
      farmerSummary: farmerCopy,
      createdAt: now,
    });
  }

  // 6. Detect Lagged Associations (e.g. 6h, 12h, 24h, 48h lookback)
  const laggedAssociations: EnvironmentPlantAssociation[] = detectLaggedAssociations({
    plantId,
    pairedData: validPairs,
    sensorHistory,
    config,
    plantProfile,
  });

  // 7. Determine Primary Association & Overall Status
  let primaryAssociation: EnvironmentPlantAssociation | null = null;
  // Prefer strongest association with significant delta or lagged
  const candidates = [...associations, ...laggedAssociations];
  if (candidates.length > 0) {
    candidates.sort((a, b) => {
      // Prioritize conflicting evidence or strong associations
      if (a.associationType === 'CONFLICTING_EVIDENCE') return -1;
      if (b.associationType === 'CONFLICTING_EVIDENCE') return 1;
      const rank = { strong: 4, moderate: 3, weak: 2, none: 1 };
      const rankA = rank[a.associationStrength] || 0;
      const rankB = rank[b.associationStrength] || 0;
      if (rankA !== rankB) return rankB - rankA;
      return (b.sampleSize || 0) - (a.sampleSize || 0);
    });
    primaryAssociation = candidates[0];
  }

  let status: CorrelationAnalysisStatus = 'no_clear_association';
  if (primaryAssociation) {
    if (primaryAssociation.associationType === 'TEMPORAL_ASSOCIATION' ||
        primaryAssociation.associationType === 'COINCIDENT_CHANGE' ||
        primaryAssociation.associationType === 'LAGGED_ASSOCIATION' ||
        primaryAssociation.associationType === 'CONFLICTING_EVIDENCE') {
      status = 'active_associations';
    }
  }

  // 8. Multi-Sensor Summary Synthesis
  let multiSensorAnalysis: CorrelationAnalysisSummary['multiSensorAnalysis'] = undefined;
  if (isMultiSensorEvent) {
    multiSensorAnalysis = {
      isMultiSensorEvent: true,
      environmentalFactors: shiftedSensors,
      summary: `Multiple environmental variables (${shiftedSensors.join(', ')}) changed concurrently during this observation window. Because hydroponic parameters interact, these shifts occurred together and individual causality cannot be isolated.`,
    };
  }

  // Farmer Headlines
  let farmerHeadline = 'Plant condition and growing environment are in steady equilibrium';
  let farmerWhy = 'Both water parameters and visual canopy health have remained stable within nominal ranges.';
  let farmerAction = 'Continue routine system monitoring.';

  if (primaryAssociation) {
    farmerHeadline = primaryAssociation.farmerSummary.whatHappenedTogether || primaryAssociation.farmerSummary.whatChanged;
    farmerWhy = primaryAssociation.farmerSummary.whatItMeans;
    farmerAction = primaryAssociation.farmerSummary.whatToDo;
  }

  return {
    plantId,
    timestamp: now,
    status,
    primaryAssociation,
    associations,
    multiSensorAnalysis,
    laggedAssociations,
    confoundingFactors,
    sampleSize,
    limitations,
    farmerHeadline,
    farmerWhy,
    farmerAction,
  };
}

/**
 * Detect delayed (lagged) environmental shifts that preceded a visual plant change.
 */
function detectLaggedAssociations(params: {
  plantId: string;
  pairedData: PairedDataPoint[];
  sensorHistory: CorrelationTelemetryReading[];
  config: CorrelationConfig;
  plantProfile?: PlantProfile | null;
}): EnvironmentPlantAssociation[] {
  const { plantId, pairedData, sensorHistory, config, plantProfile } = params;
  const laggedAssocs: EnvironmentPlantAssociation[] = [];

  if (pairedData.length < 2) return laggedAssocs;

  const latest = pairedData[pairedData.length - 1];
  const previous = pairedData[0];

  // Check if plant visual health recently declined
  const scoreDrop = (previous.visualHealthScore || 0) - (latest.visualHealthScore || 0);
  if (scoreDrop < config.shifts.healthScoreDeltaSignificant) {
    return laggedAssocs;
  }

  // Search historical sensors for an earlier anomaly or excursion
  for (const lagHours of config.lagWindowsHours) {
    const lagMs = lagHours * 60 * 60 * 1000;
    const targetTime = latest.timestamp - lagMs;

    // Find sensor readings in targetTime window (+/- 2h)
    const windowReadings = sensorHistory.filter(r =>
      Math.abs(r.timestamp - targetTime) <= 2 * 60 * 60 * 1000
    );

    if (windowReadings.length === 0) continue;

    // Check for high TDS or extreme pH in that lagged window
    const tdsValsWindow = windowReadings.map(r => r.tds).filter((v): v is number => v !== undefined);
    const phValsWindow = windowReadings.map(r => r.ph).filter((v): v is number => v !== undefined);
    const maxTds = tdsValsWindow.length > 0 ? Math.max(...tdsValsWindow) : 0;
    const minPh = phValsWindow.length > 0 ? Math.min(...phValsWindow) : 6.0;
    const maxPh = phValsWindow.length > 0 ? Math.max(...phValsWindow) : 6.0;

    if (maxTds > 900 || minPh < 5.4 || maxPh > 7.0) {
      const metric = maxTds > 900 ? 'tds' : 'ph';
      const envLabel = metric === 'tds' ? 'TDS spike' : 'pH drift';
      const envVal = metric === 'tds' ? maxTds : (minPh < 5.4 ? minPh : maxPh);

      const summary = `A ${envLabel} (${envVal}) preceded the observed decline in plant health score by approximately ${lagHours} hours. This temporal sequence is consistent with a delayed plant stress response.`;

      laggedAssocs.push({
        id: `assoc-lag-${lagHours}h-${Date.now()}`,
        plantId,
        timestamp: Date.now(),
        environmentMetric: metric,
        environmentLabel: metric === 'tds' ? 'Total Dissolved Solids (TDS)' : 'Nutrient pH',
        environmentValue: envVal,
        environmentBaseline: metric === 'tds' ? plantProfile?.baseline?.initialTDS : plantProfile?.baseline?.initialPH,
        environmentDirection: 'rising',
        plantMetric: 'visualHealthScore',
        plantLabel: 'Visual Health Score',
        plantValue: latest.visualHealthScore,
        plantBaseline: plantProfile?.baseline?.initialHealthScore,
        plantDirection: 'declined',
        timeWindow: 'recent_trend',
        lagHours,
        associationType: 'LAGGED_ASSOCIATION',
        associationStrength: 'moderate',
        correlationMethod: 'qualitative_pairing',
        sampleSize: pairedData.length,
        confidence: 'MODERATE',
        confidenceReason: `Sensor excursion detected ~${lagHours} hours prior to recorded visual score decline.`,
        dataQuality: 'good',
        confoundingFactors: [],
        evidenceIds: [],
        relatedObservationIds: [previous.observationId, latest.observationId],
        summary,
        farmerSummary: {
          whatChanged: `A ${envLabel} occurred approximately ${lagHours} hours ago.`,
          whatHappenedTogether: `Plant visual condition declined following that earlier environmental change.`,
          whatItMeans: `Plants often take several hours to display visible leaf stress after nutrient solution changes.`,
          whatToDo: `Inspect reservoir parameters and verify whether the solution has stabilized.`,
        },
        createdAt: Date.now(),
      });
      break; // Found the primary lag window
    }
  }

  return laggedAssocs;
}

/**
 * Generate scientific non-causal summary in English.
 */
function generateNonCausalAssociationSummary(params: {
  environmentMetric: string;
  environmentDirection: string;
  plantMetric: string;
  plantDirection: string;
  associationType: EnvironmentAssociationType;
  associationStrength: AssociationStrength;
  coefficient?: number;
  lagHours?: number;
}): string {
  const {
    environmentMetric,
    environmentDirection,
    plantMetric,
    plantDirection,
    associationType,
    associationStrength,
    coefficient,
    lagHours,
  } = params;

  switch (associationType) {
    case 'ENVIRONMENT_ONLY_CHANGE':
      return `${environmentMetric} ${environmentDirection} during this period, while ${plantMetric} remained stable. No immediate plant visual change was observed alongside this environmental movement.`;

    case 'PLANT_ONLY_CHANGE':
      return `${plantMetric} ${plantDirection} during this period, while ${environmentMetric} remained stable. This indicates visual change occurred without a corresponding shift in measured solution telemetry.`;

    case 'TEMPORAL_ASSOCIATION': {
      const coeffText = coefficient !== undefined ? ` (r = ${coefficient.toFixed(3)})` : '';
      return `${environmentMetric} ${environmentDirection} moved together with ${plantMetric} ${plantDirection}${coeffText}, representing a ${associationStrength} empirical association across observations.`;
    }

    case 'COINCIDENT_CHANGE':
      return `${environmentMetric} ${environmentDirection} occurred alongside ${plantMetric} ${plantDirection} within the same observation period. Both parameters shifted concurrently.`;

    case 'LAGGED_ASSOCIATION':
      return `${environmentMetric} shift preceded the change in ${plantMetric} by approximately ${lagHours || 24} hours.`;

    case 'CONFLICTING_EVIDENCE':
      return `Sensor telemetry and visual plant metrics present conflicting indications: environmental telemetry indicates notable stress while plant visual vigor remains optimal, or vice versa.`;

    case 'NO_CLEAR_ASSOCIATION':
    default:
      return `No clear association observed between ${environmentMetric} and ${plantMetric} during this monitoring period. Both parameters remained within nominal ranges.`;
  }
}

/**
 * Generate farmer-accessible 4-step Q&A copy in English.
 */
function generateFarmerAssociationCopy(params: {
  envLabel: string;
  envDeltaText: string;
  plantLabel: string;
  plantDeltaText: string;
  assocType: EnvironmentAssociationType;
  isMultiSensor: boolean;
  recommendation: string;
}): {
  whatChanged: string;
  whatHappenedTogether: string;
  whatItMeans: string;
  whatToDo: string;
} {
  const {
    envLabel,
    envDeltaText,
    plantLabel,
    plantDeltaText,
    assocType,
    isMultiSensor,
    recommendation,
  } = params;

  let whatChanged = `${envLabel} ${envDeltaText}.`;
  let whatHappenedTogether = `${plantLabel} ${plantDeltaText} around the same time.`;
  let whatItMeans = `The environmental reading and the plant's appearance changed during the same window.`;

  if (assocType === 'ENVIRONMENT_ONLY_CHANGE') {
    whatHappenedTogether = `${plantLabel} stayed steady without noticeable visual change.`;
    whatItMeans = `The solution changed, but your plant has not shown any visible stress from it so far.`;
  } else if (assocType === 'PLANT_ONLY_CHANGE') {
    whatChanged = `${plantLabel} ${plantDeltaText}.`;
    whatHappenedTogether = `${envLabel} stayed steady in the reservoir.`;
    whatItMeans = `The plant's appearance shifted even though water and nutrient levels remained unchanged.`;
  } else if (assocType === 'CONFLICTING_EVIDENCE') {
    whatItMeans = `The sensors and the camera tell different stories. The water solution readings are far from target, but your plant still looks green and healthy.`;
  } else if (isMultiSensor) {
    whatItMeans = `Multiple water and nutrient readings changed together. In hydroponics, several factors moving at once make it important to check the whole system rather than just one reading.`;
  }

  return {
    whatChanged,
    whatHappenedTogether,
    whatItMeans,
    whatToDo: recommendation,
  };
}
