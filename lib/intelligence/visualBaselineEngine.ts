// ============================================================
// HydroSmart — Visual Baseline & Temporal Plant Health Engine
// Tracks "Current Image vs Plant's Own History", baseline comparison,
// temporal smoothing, anomaly detection, and recovery dynamics
// ============================================================

import { VISUAL_HEALTH_CONFIG, SPECIES_VISUAL_PROFILES } from '@/lib/vision/visualHealthConfig';
import { StructuredHealthState } from '@/lib/vision/plantHealthAnalyzer';

export interface VisualObservationFeatures {
  canopyCoveragePercent: number;
  chlorosisYellowPercent: number;
  necroticBrownPercent: number;
  vibrantGreenPercent: number;
  avgTextureGradient: number;
  aspectRatio: number;
  canopyDensity: number;
  timestamp: number;
  speciesKey?: string;
}

export interface BaselineCheckpoint {
  canopyCoveragePercent: number;
  chlorosisYellowPercent: number;
  necroticBrownPercent: number;
  avgTextureGradient: number;
  timestamp: number;
}

export interface PlantVisualBaseline {
  plantId: string;
  speciesKey?: string;
  initialBaseline: BaselineCheckpoint | null;
  rollingBaseline: BaselineCheckpoint | null;
  observationCount: number;
  establishedAt: number | null;
  lastUpdated: number;
  recentObservations: VisualObservationFeatures[];
  recentHealthStates: StructuredHealthState[];
  lowestHealthScoreRecent: number | null;
}

export interface VisualChangeDeltas {
  canopyDeltaPercent: number;           // Absolute difference: current - baseline
  relativeCanopyChangePercent: number; // Percentage shift: (delta / baseline) * 100
  chlorosisDeltaPercent: number;       // Increase in yellowing (+ is worse)
  necrosisDeltaPercent: number;        // Increase in browning (+ is worse)
  textureDelta: number;                // Change in surface spotting
  hasMeaningfulChange: boolean;
  changeSummary: string;
  detailedPoints: string[];
}

export interface BaselineEvaluationResult {
  healthState: StructuredHealthState;
  deltas: VisualChangeDeltas | null;
  hasSufficientHistory: boolean;
  anomalyDetected: boolean;
  anomalies: string[];
  recoveryStatus: 'recovering' | 'stable' | 'deteriorating' | 'none';
  statusReason: string;
  smoothedState: StructuredHealthState;
}

// In-memory registry of visual plant baselines keyed by plantId
const plantBaselines = new Map<string, PlantVisualBaseline>();

/**
 * Retrieve or initialize a plant's baseline store
 */
export function getOrCreatePlantBaseline(plantId: string, speciesKey?: string): PlantVisualBaseline {
  let baseline = plantBaselines.get(plantId);
  if (!baseline) {
    baseline = {
      plantId,
      speciesKey,
      initialBaseline: null,
      rollingBaseline: null,
      observationCount: 0,
      establishedAt: null,
      lastUpdated: Date.now(),
      recentObservations: [],
      recentHealthStates: [],
      lowestHealthScoreRecent: null,
    };
    plantBaselines.set(plantId, baseline);
  } else if (speciesKey && (!baseline.speciesKey || baseline.speciesKey === 'unknown_plant')) {
    baseline.speciesKey = speciesKey;
  }
  return baseline;
}

/**
 * Compare current visual features against the plant's own baseline
 */
export function compareAgainstPlantBaseline(
  baseline: PlantVisualBaseline,
  features: VisualObservationFeatures
): VisualChangeDeltas | null {
  const ref = baseline.rollingBaseline || baseline.initialBaseline;
  if (!ref || baseline.observationCount < 1) {
    return null;
  }

  const canopyDelta = parseFloat((features.canopyCoveragePercent - ref.canopyCoveragePercent).toFixed(1));
  const refCanopy = Math.max(0.1, ref.canopyCoveragePercent);
  const relCanopyChange = parseFloat(((canopyDelta / refCanopy) * 100).toFixed(1));

  const chlorosisDelta = parseFloat((features.chlorosisYellowPercent - ref.chlorosisYellowPercent).toFixed(1));
  const necrosisDelta = parseFloat((features.necroticBrownPercent - ref.necroticBrownPercent).toFixed(1));
  const textureDelta = parseFloat((features.avgTextureGradient - ref.avgTextureGradient).toFixed(1));

  const points: string[] = [];
  let meaningful = false;

  // Canopy area description
  if (relCanopyChange > 10.0) {
    points.push(`Plant area: expanded (+${canopyDelta}% coverage)`);
  } else if (relCanopyChange < -15.0) {
    points.push(`Plant area: decreased (${canopyDelta}% coverage)`);
    meaningful = true;
  } else {
    points.push('Plant area: stable');
  }

  // Chlorosis description
  if (chlorosisDelta > 5.0) {
    points.push(`Leaf color: more yellow (+${chlorosisDelta}% chlorosis)`);
    meaningful = true;
  } else if (chlorosisDelta < -4.0) {
    points.push(`Leaf color: greener (-${Math.abs(chlorosisDelta)}% yellowing)`);
  } else {
    points.push('Leaf color: consistent');
  }

  // Necrosis description
  if (necrosisDelta > 3.0) {
    points.push(`Leaf tissue: increased browning / tip burn (+${necrosisDelta}%)`);
    meaningful = true;
  }

  // Texture description
  if (textureDelta > 8.0) {
    points.push(`Surface texture: increased mottling / spotting`);
    meaningful = true;
  }

  const changeSummary = meaningful
    ? 'A visual change was detected compared with the plant’s previous checks.'
    : 'Plant appearance remains stable with respect to historical baseline.';

  return {
    canopyDeltaPercent: canopyDelta,
    relativeCanopyChangePercent: relCanopyChange,
    chlorosisDeltaPercent: chlorosisDelta,
    necrosisDeltaPercent: necrosisDelta,
    textureDelta,
    hasMeaningfulChange: meaningful,
    changeSummary,
    detailedPoints: points,
  };
}

/**
 * Evaluate structured health state using CV features, baseline deltas, species context,
 * and multi-frame temporal smoothing
 */
export function evaluatePlantHealthWithBaseline(
  plantId: string,
  features: VisualObservationFeatures,
  rawCVState: StructuredHealthState,
  mlHealthState?: StructuredHealthState
): BaselineEvaluationResult {
  const baseline = getOrCreatePlantBaseline(plantId, features.speciesKey);
  const cfg = VISUAL_HEALTH_CONFIG;

  // Apply species-specific baseline tolerances if species is known
  let chlorosisWarning = cfg.chlorosisWarningThreshold;
  let chlorosisCritical = cfg.chlorosisCriticalThreshold;
  if (features.speciesKey && SPECIES_VISUAL_PROFILES[features.speciesKey]) {
    const profile = SPECIES_VISUAL_PROFILES[features.speciesKey];
    chlorosisWarning += profile.chlorosisToleranceOffset;
    chlorosisCritical += profile.chlorosisToleranceOffset;
  }

  // 1. Establish or update baseline if this is a valid observation
  const deltas = compareAgainstPlantBaseline(baseline, features);
  const hasHistory = baseline.observationCount >= 2 && baseline.initialBaseline !== null;

  // 2. Identify instantaneous candidate state based on visual evidence
  let candidateState: StructuredHealthState = 'STABLE';
  const anomalies: string[] = [];

  // Severe necrotic breakdown
  if (features.necroticBrownPercent >= cfg.necrosisCriticalThreshold) {
    candidateState = 'CRITICAL';
    anomalies.push(`Severe necrotic leaf browning (${features.necroticBrownPercent}%)`);
  }
  // Severe chlorotic yellowing
  else if (features.chlorosisYellowPercent >= chlorosisCritical) {
    candidateState = 'CRITICAL';
    anomalies.push(`Severe foliar chlorosis (${features.chlorosisYellowPercent}%)`);
  }
  // Severe canopy contraction (>30% loss from baseline)
  else if (deltas && deltas.relativeCanopyChangePercent <= cfg.canopyDropCriticalPercent) {
    candidateState = 'CRITICAL';
    anomalies.push(`Abrupt canopy collapse (${deltas.relativeCanopyChangePercent}% contraction)`);
  }
  // Moderate chlorosis yellowing
  else if (features.chlorosisYellowPercent >= chlorosisWarning) {
    candidateState = 'ATTENTION';
    anomalies.push(`Foliage yellowing detected (${features.chlorosisYellowPercent}%)`);
  }
  // Moderate necrosis
  else if (features.necroticBrownPercent >= cfg.necrosisWarningThreshold) {
    candidateState = 'ATTENTION';
    anomalies.push(`Tip burn / browning detected (${features.necroticBrownPercent}%)`);
  }
  // Canopy wilting / droop posture
  else if (features.aspectRatio < cfg.wiltingAspectRatioMin || features.canopyDensity < cfg.canopyDensityMin) {
    candidateState = 'ATTENTION';
    anomalies.push('Abnormal drooping or compact canopy posture');
  }
  // Baseline canopy contraction
  else if (deltas && deltas.relativeCanopyChangePercent <= cfg.canopyDropWarningPercent) {
    candidateState = 'ATTENTION';
    anomalies.push(`Canopy reduction observed (${deltas.relativeCanopyChangePercent}%)`);
  }
  // Baseline yellowing surge (even if absolute % is below warning, a large delta signals trouble)
  else if (deltas && deltas.chlorosisDeltaPercent >= 8.0) {
    candidateState = 'ATTENTION';
    anomalies.push(`Sharp yellowing increase (+${deltas.chlorosisDeltaPercent}% from baseline)`);
  }
  // Healthy: vibrant chlorophyll reflectance, minimal yellowing, upright posture
  else if (features.chlorosisYellowPercent <= cfg.chlorosisNominalMax && features.necroticBrownPercent <= cfg.necrosisNominalMax) {
    candidateState = 'HEALTHY';
  } else {
    candidateState = 'STABLE';
  }

  // Integrate ML leaf health prediction if available
  if (mlHealthState === 'CRITICAL' && candidateState !== 'CRITICAL') {
    if (features.chlorosisYellowPercent > 10 || features.necroticBrownPercent > 3) {
      candidateState = 'ATTENTION';
    }
  }

  // 3. Recovery Detection
  let recoveryStatus: 'recovering' | 'stable' | 'deteriorating' | 'none' = 'none';
  const recentStates = baseline.recentHealthStates;
  const hadRecentStress = recentStates.some(s => s === 'ATTENTION' || s === 'CRITICAL');

  if (hadRecentStress && (candidateState === 'HEALTHY' || candidateState === 'STABLE')) {
    if (deltas && (deltas.chlorosisDeltaPercent <= -2.0 || deltas.relativeCanopyChangePercent >= 5.0)) {
      candidateState = 'RECOVERING';
      recoveryStatus = 'recovering';
    } else if (features.chlorosisYellowPercent < chlorosisWarning) {
      candidateState = 'RECOVERING';
      recoveryStatus = 'recovering';
    }
  }

  // 4. Multi-Frame Temporal Smoothing
  // Keep sliding window of 5 observations
  baseline.recentHealthStates.push(candidateState);
  if (baseline.recentHealthStates.length > cfg.temporalWindowSize) {
    baseline.recentHealthStates.shift();
  }

  // Count votes in window
  const windowVotes = baseline.recentHealthStates;
  const criticalVotes = windowVotes.filter(s => s === 'CRITICAL').length;
  const attentionVotes = windowVotes.filter(s => s === 'ATTENTION').length;
  const recoveringVotes = windowVotes.filter(s => s === 'RECOVERING').length;
  const healthyVotes = windowVotes.filter(s => s === 'HEALTHY').length;

  let smoothedState: StructuredHealthState = candidateState;

  // Single noisy frame should NOT immediately flip stable/healthy to CRITICAL
  // Require at least 2 votes in window for CRITICAL or ATTENTION unless extreme (>35% yellowing)
  if (candidateState === 'CRITICAL') {
    if (criticalVotes < cfg.minVotesForStateChange && features.chlorosisYellowPercent < 35 && features.necroticBrownPercent < 15) {
      // Hold in ATTENTION while verifying
      smoothedState = 'ATTENTION';
    } else {
      smoothedState = 'CRITICAL';
    }
  } else if (candidateState === 'ATTENTION') {
    if (attentionVotes < cfg.minVotesForStateChange && windowVotes.includes('HEALTHY') && features.chlorosisYellowPercent < chlorosisWarning + 3) {
      smoothedState = 'STABLE';
    } else {
      smoothedState = 'ATTENTION';
    }
  } else if (recoveringVotes >= 2) {
    smoothedState = 'RECOVERING';
  } else if (healthyVotes >= 3) {
    smoothedState = 'HEALTHY';
  } else {
    smoothedState = candidateState;
  }

  // 5. Update baseline memory
  baseline.recentObservations.push(features);
  if (baseline.recentObservations.length > 10) {
    baseline.recentObservations.shift();
  }
  baseline.observationCount++;
  baseline.lastUpdated = features.timestamp;

  // Set initial baseline on first observation
  if (!baseline.initialBaseline) {
    baseline.initialBaseline = {
      canopyCoveragePercent: features.canopyCoveragePercent,
      chlorosisYellowPercent: features.chlorosisYellowPercent,
      necroticBrownPercent: features.necroticBrownPercent,
      avgTextureGradient: features.avgTextureGradient,
      timestamp: features.timestamp,
    };
    baseline.establishedAt = features.timestamp;
  }

  // Update rolling baseline (exponential weighted moving average with alpha = 0.25)
  if (smoothedState === 'HEALTHY' || smoothedState === 'STABLE' || smoothedState === 'RECOVERING') {
    if (!baseline.rollingBaseline) {
      baseline.rollingBaseline = { ...baseline.initialBaseline };
    } else {
      const alpha = 0.25;
      baseline.rollingBaseline = {
        canopyCoveragePercent: parseFloat((alpha * features.canopyCoveragePercent + (1 - alpha) * baseline.rollingBaseline.canopyCoveragePercent).toFixed(1)),
        chlorosisYellowPercent: parseFloat((alpha * features.chlorosisYellowPercent + (1 - alpha) * baseline.rollingBaseline.chlorosisYellowPercent).toFixed(1)),
        necroticBrownPercent: parseFloat((alpha * features.necroticBrownPercent + (1 - alpha) * baseline.rollingBaseline.necroticBrownPercent).toFixed(1)),
        avgTextureGradient: parseFloat((alpha * features.avgTextureGradient + (1 - alpha) * baseline.rollingBaseline.avgTextureGradient).toFixed(1)),
        timestamp: features.timestamp,
      };
    }
  }

  let statusReason = 'Foliage appears vigorous with balanced pigmentation';
  if (smoothedState === 'CRITICAL') {
    statusReason = anomalies[0] || 'Severe foliar degradation detected';
  } else if (smoothedState === 'ATTENTION') {
    statusReason = anomalies[0] || 'Visual foliage variation detected relative to baseline';
  } else if (smoothedState === 'RECOVERING') {
    statusReason = 'Foliage showing signs of recovery and improved leaf color';
  } else if (smoothedState === 'STABLE') {
    statusReason = 'Plant condition is steady and consistent with recent observations';
  }

  return {
    healthState: smoothedState,
    deltas,
    hasSufficientHistory: hasHistory,
    anomalyDetected: anomalies.length > 0,
    anomalies,
    recoveryStatus,
    statusReason,
    smoothedState,
  };
}

/**
 * Reset plant baseline store (used for tests or when a brand new plant is seeded)
 */
export function resetPlantBaseline(plantId: string): void {
  plantBaselines.delete(plantId);
}
