// ============================================================
// HydroSmart — Visual Health & Explainable Anomaly Detection Engine
// 4-Factor Optical Stress Assessment & Non-Diagnostic Stress Tagging
// ============================================================

import {
  VisionHealthState,
  VisualAnomaly,
  ImageQualityAssessment,
  VisionConfidenceLevel
} from './types';

export interface VisualHealthScoreOutput {
  score: number | null;
  state: VisionHealthState;
  confidence: VisionConfidenceLevel;
  confidenceScore: number;
  anomalies: VisualAnomaly[];
  limitations: string[];
  explainableFindings: string[];
}

export interface FoliagePigmentMetrics {
  totalFoliagePixels: number;
  vibrantGreenPixels: number;
  chlorosisYellowPixels: number;
  necroticBrownPixels: number;
  canopyCoveragePercent: number;
  edgeComplexity: number;
}

/**
 * Evaluate visual health without making definitive pathology claims
 */
export function evaluateVisualHealth(
  metrics: FoliagePigmentMetrics,
  imageQuality: ImageQualityAssessment,
  isPlantDetected: boolean
): VisualHealthScoreOutput {
  const limitations: string[] = [];
  const explainableFindings: string[] = [];
  const anomalies: VisualAnomaly[] = [];

  // Condition 1: Image Quality or Detection Rejection
  if (!imageQuality.acceptable) {
    limitations.push(`Image analysis rejected: ${imageQuality.qualityMessage}`);
    return {
      score: null,
      state: 'INSUFFICIENT_DATA',
      confidence: 'insufficient',
      confidenceScore: 0,
      anomalies: [],
      limitations,
      explainableFindings: ['Visual health score withheld due to inadequate optical frame quality.'],
    };
  }

  if (!isPlantDetected || metrics.totalFoliagePixels < 50) {
    limitations.push('No viable plant canopy detected in optical zone.');
    return {
      score: null,
      state: 'INSUFFICIENT_DATA',
      confidence: 'insufficient',
      confidenceScore: 0,
      anomalies: [],
      limitations,
      explainableFindings: ['No foliage detected to evaluate pigment reflectance.'],
    };
  }

  // Step 1: Pigment Ratios
  const yellowRatio = (metrics.chlorosisYellowPixels / metrics.totalFoliagePixels) * 100;
  const brownRatio = (metrics.necroticBrownPixels / metrics.totalFoliagePixels) * 100;

  // Step 2: Anomaly Detection with Structured Evidence
  if (yellowRatio >= 8.0) {
    const severity = yellowRatio > 25.0 ? 'severe' : yellowRatio > 14.0 ? 'moderate' : 'mild';
    anomalies.push({
      type: 'possible_chlorosis',
      severity,
      percentage: parseFloat(yellowRatio.toFixed(1)),
      confidence: imageQuality.lightingColorCast === 'warm_yellow' ? 'low' : 'medium',
      evidence: `${yellowRatio.toFixed(1)}% of foliage pixels exhibit yellow-green spectral shift.`,
    });
    explainableFindings.push(`Visible yellowing (${yellowRatio.toFixed(1)}%) detected on leaf tissue (possible chlorosis).`);
  }

  if (brownRatio >= 4.0) {
    const severity = brownRatio > 18.0 ? 'severe' : brownRatio > 8.0 ? 'moderate' : 'mild';
    anomalies.push({
      type: 'possible_necrosis',
      severity,
      percentage: parseFloat(brownRatio.toFixed(1)),
      confidence: 'high',
      evidence: `${brownRatio.toFixed(1)}% of foliage pixels exhibit dark necrotic absorption.`,
    });
    explainableFindings.push(`Visible browning (${brownRatio.toFixed(1)}%) detected on leaf tissue (possible necrosis).`);
  }

  if (metrics.edgeComplexity > 0.32) {
    anomalies.push({
      type: 'abnormal_texture',
      severity: 'moderate',
      percentage: parseFloat((metrics.edgeComplexity * 100).toFixed(1)),
      confidence: 'medium',
      evidence: 'High leaf margin irregularity and surface roughness detected.',
    });
    explainableFindings.push('Elevated edge complexity suggests potential leaf curling or structural stress.');
  }

  // Step 3: Four-Factor Score Math
  const colorScore = Math.max(0, 100 - (yellowRatio * 1.5 + brownRatio * 3.0));
  const uniformityScore = Math.max(0, 100 - Math.abs(metrics.edgeComplexity - 0.18) * 180);
  const vigorScore = Math.min(100, (metrics.canopyCoveragePercent / 20.0) * 100);
  const penalty = (yellowRatio > 10 ? 15 : 0) + (brownRatio > 5 ? 25 : 0);

  const rawHealth = colorScore * 0.35 + uniformityScore * 0.25 + vigorScore * 0.20 + Math.max(0, 100 - penalty) * 0.20;
  const score = Math.round(Math.max(0, Math.min(100, rawHealth)));

  // Step 4: Health State Mapping
  let state: VisionHealthState = 'HEALTHY';
  if (score < 45 || brownRatio > 15) {
    state = 'SEVERE_STRESS';
  } else if (score < 68 || yellowRatio > 18) {
    state = 'MODERATE_STRESS';
  } else if (score < 84 || yellowRatio > 7) {
    state = 'MILD_STRESS';
  }

  // Step 5: Calibrated Confidence & Lighting Penalty
  let confidence: VisionConfidenceLevel = 'high';
  let confidenceScore = 0.88;

  if (imageQuality.lightingColorCast === 'warm_yellow') {
    confidence = 'low';
    confidenceScore = 0.52;
    limitations.push('Warm ambient lighting may accentuate perceived chlorosis.');
  } else if (imageQuality.overallQuality < 70) {
    confidence = 'medium';
    confidenceScore = 0.68;
    limitations.push('Moderate contrast reduces structural edge precision.');
  }

  if (anomalies.length === 0) {
    explainableFindings.push('Optimal chlorophyll reflectance; no significant chlorotic or necrotic anomalies detected.');
  }

  return {
    score,
    state,
    confidence,
    confidenceScore,
    anomalies,
    limitations,
    explainableFindings,
  };
}
