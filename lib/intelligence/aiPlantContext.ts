// ============================================================
// HydroSmart — AI Plant Structured Context Compiler
// Phase 8 Single Source of Truth for Grounded Plant Interactions
// ============================================================

import {
  PlantIdentity,
  VisualHealthAnalysisResult,
  PlantDetectionResult,
  EnvironmentalAssessment,
  MultimodalHealthAssessment,
  PlantGrowthMetrics,
  PredictiveAnalyticsResult,
  PlantObservation,
  StructuredPlantContext
} from './types';

export function buildStructuredPlantContext(
  cropIdentity: PlantIdentity,
  latestVisualHealth: VisualHealthAnalysisResult | null,
  latestDetection: PlantDetectionResult | null,
  currentPh: number | undefined,
  currentTds: number | undefined,
  currentWaterLevel: number | undefined,
  currentDistance: number | undefined,
  telemetryMode: 'real' | 'simulation',
  isTelemetryStale: boolean,
  environmentalAssessment: EnvironmentalAssessment,
  multimodalAssessment: MultimodalHealthAssessment,
  growthMetrics: PlantGrowthMetrics,
  predictiveAnalytics: PredictiveAnalyticsResult,
  observations: PlantObservation[]
): StructuredPlantContext {
  const timestamp = Date.now();

  const visualIndicators = latestVisualHealth?.indicators
    ? latestVisualHealth.indicators.map(i => i.label)
    : [];

  const anomalies = multimodalAssessment.anomalies || [];

  return {
    timestamp,
    plant: {
      species: cropIdentity.commonName,
      scientificName: cropIdentity.scientificName,
      family: cropIdentity.family,
      confidence: cropIdentity.confidence,
      growthStage: cropIdentity.growthStage || 'vegetative',
      daysMonitored: growthMetrics.daysMonitored,
    },
    visualState: {
      healthScore: latestVisualHealth?.visualHealthScore,
      healthState: latestVisualHealth?.healthState || 'unknown',
      canopyCoveragePercent: latestDetection?.canopyCoveragePercent,
      vegetationIndex: latestDetection?.vegetationIndex,
      indicators: visualIndicators,
      isPlantDetected: latestDetection?.isPlantDetected ?? false,
    },
    environment: {
      ph: currentPh,
      tds: currentTds,
      waterLevel: currentWaterLevel,
      distance: currentDistance,
      telemetryMode,
      isTelemetryStale,
      targetEnvelope: {
        phMin: cropIdentity.targetProfile.phMin,
        phMax: cropIdentity.targetProfile.phMax,
        tdsMin: cropIdentity.targetProfile.tdsMin,
        tdsMax: cropIdentity.targetProfile.tdsMax,
      },
      phStatus: environmentalAssessment.phStatus,
      tdsStatus: environmentalAssessment.tdsStatus,
      waterLevelStatus: environmentalAssessment.waterLevelStatus,
    },
    historical: {
      totalObservations: observations.length,
      canopyGrowthDelta: growthMetrics.cumulativeGrowthDelta,
      longitudinalTrend: multimodalAssessment.trend,
      overallHealthScore: multimodalAssessment.overallScore,
      activeAnomalies: anomalies,
    },
    predictions: {
      phDriftPerDay: predictiveAnalytics.predictions.ph.driftPerDay,
      tdsDriftPerDay: predictiveAnalytics.predictions.tds.driftPerDay,
      waterDriftPerDay: predictiveAnalytics.predictions.waterLevel.driftPerDay,
      phDaysToThreshold: predictiveAnalytics.predictions.ph.estimatedDaysToThreshold,
      tdsDaysToThreshold: predictiveAnalytics.predictions.tds.estimatedDaysToThreshold,
      waterDaysToThreshold: predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold,
    },
    recommendations: {
      items: predictiveAnalytics.recommendations.map(r => ({
        title: r.title,
        action: r.action,
        priority: r.priority,
      })),
    },
  };
}
