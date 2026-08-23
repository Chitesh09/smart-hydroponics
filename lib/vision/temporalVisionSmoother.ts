// ============================================================
// HydroSmart — Temporal Vision Smoothing & Camera Stability Filter
// Filters Optical Noise, Detects Camera Shifts & Tracks 2D Canopy Trends
// ============================================================

import { VisualObservation, VisionConfidenceLevel } from './types';

export interface TemporalGrowthResult {
  canopyAreaPercent: number;
  changePercent: number;
  confidence: VisionConfidenceLevel;
  cameraConsistency: 'stable' | 'moderate_jitter' | 'displaced';
  temporalHealthTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data';
  observationCount: number;
  disclaimer: string;
}

/**
 * Compare recent observations to filter transient artifacts and camera shifts
 */
export function analyzeTemporalVisionSequence(
  observations: VisualObservation[]
): TemporalGrowthResult {
  const disclaimer = 'Observed canopy area change is a 2D optical surface projection estimate, not biological biomass.';

  if (!observations || observations.length < 2) {
    const latest = observations?.[0];
    return {
      canopyAreaPercent: latest?.canopyCoveragePercent ?? 0,
      changePercent: 0,
      confidence: 'insufficient',
      cameraConsistency: 'stable',
      temporalHealthTrend: 'insufficient_data',
      observationCount: observations?.length ?? 0,
      disclaimer,
    };
  }

  // Sort chronological
  const sorted = [...observations].sort((a, b) => a.timestamp - b.timestamp);
  const baseline = sorted[0];
  const latest = sorted[sorted.length - 1];

  // 1. Detect Camera Displacement / FOV Jumps
  let maxStepDelta = 0;
  for (let i = 1; i < sorted.length; i++) {
    const delta = Math.abs(sorted[i].canopyCoveragePercent - sorted[i - 1].canopyCoveragePercent);
    if (delta > maxStepDelta) maxStepDelta = delta;
  }

  let cameraConsistency: 'stable' | 'moderate_jitter' | 'displaced' = 'stable';
  if (maxStepDelta > 20.0) {
    cameraConsistency = 'displaced';
  } else if (maxStepDelta > 8.0) {
    cameraConsistency = 'moderate_jitter';
  }

  // 2. Canopy Area 2D Change Calculation
  const canopyDelta = latest.canopyCoveragePercent - baseline.canopyCoveragePercent;

  // 3. Temporal Health Trend
  const validScores = sorted
    .map((o) => o.visualHealthScore)
    .filter((s): s is number => s !== null && s !== undefined);

  let temporalHealthTrend: 'improving' | 'stable' | 'declining' | 'insufficient_data' = 'insufficient_data';
  if (validScores.length >= 2) {
    const firstScore = validScores[0];
    const lastScore = validScores[validScores.length - 1];
    const diff = lastScore - firstScore;

    if (diff > 5) temporalHealthTrend = 'improving';
    else if (diff < -5) temporalHealthTrend = 'declining';
    else temporalHealthTrend = 'stable';
  }

  // 4. Calibrated Confidence based on camera consistency
  let confidence: VisionConfidenceLevel = 'high';
  if (cameraConsistency === 'displaced') confidence = 'low';
  else if (cameraConsistency === 'moderate_jitter') confidence = 'medium';

  return {
    canopyAreaPercent: parseFloat(latest.canopyCoveragePercent.toFixed(1)),
    changePercent: parseFloat(canopyDelta.toFixed(1)),
    confidence,
    cameraConsistency,
    temporalHealthTrend,
    observationCount: sorted.length,
    disclaimer,
  };
}
