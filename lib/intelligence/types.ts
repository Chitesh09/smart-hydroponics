// ============================================================
// HydroSmart Multimodal Intelligence Engine — Core Types
// Phase 1 to Phase 8 Unified Types
// ============================================================

export type ServiceStatus = 'active' | 'ready' | 'standby' | 'simulated' | 'error' | 'not_implemented';

export type CameraStatus = 'idle' | 'requesting' | 'connected' | 'disconnected' | 'error' | 'unsupported';

export interface CameraDevice {
  deviceId: string;
  label: string;
}

export interface CropTargetProfile {
  name: string;
  scientificName?: string;
  phMin: number;
  phMax: number;
  tdsMin: number;
  tdsMax: number;
  idealWaterLevelMin: number;
  optimalTempMin?: number;
  optimalTempMax?: number;
}

export interface PlantCandidate {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  confidence: number; // 0 - 100%
  description: string;
  targetProfile: CropTargetProfile;
}

export interface PlantIdentificationResponse {
  status: 'success' | 'low_confidence' | 'no_plant_detected' | 'unknown_plant' | 'model_unavailable' | 'scan_not_ready' | 'error';
  primaryCandidate?: PlantCandidate;
  rankedCandidates: PlantCandidate[];
  overallConfidence: number; // 0 - 100%
  confidenceLevel: 'high' | 'moderate' | 'low' | 'uncertain';
  guidanceMessage: string;
  timestamp: number;
  imageReference?: string;
  modelId?: string;
  modelVersion?: string;
  inferenceLatencyMs?: number;
  extractedFeatures?: {
    aspectRatio: number;
    meanExG: number;
    meanHue: number;
    edgeComplexity: number;
    canopyCoverage: number;
  };
}

export interface PlantIdentity {
  plantId?: string;
  cropKey: string;
  commonName: string;
  scientificName?: string;
  family?: string;
  confidence?: number;
  identificationTimestamp?: number;
  imageReference?: string;
  plantedTimestamp?: number;
  growthStage?: 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest_ready';
  targetProfile: CropTargetProfile;
}

export interface PlantProfile {
  plantId: string;
  species?: string;
  commonName?: string;
  scientificName?: string;
  family?: string;
  speciesConfidence?: number;
  identifiedAt?: number;
  modelVersion?: string;
  createdAt: number;
  lastObservedAt?: number;
  monitoringStatus: 'active' | 'archived' | 'completed';
  currentHealthStatus: StructuredHealthState | 'optimal' | 'warning' | 'critical' | 'unknown';
  observationCount: number;
  growthStage?: 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest_ready';
  targetProfile?: CropTargetProfile;
  lastVisualAssessment?: VisualHealthAnalysisResult;
  lastVisualAssessmentAt?: number;
  healthConfidence?: 'high' | 'moderate' | 'low' | 'unknown';
  activeAnomaly?: string;
  recoveryStatus?: 'recovering' | 'stable' | 'deteriorating' | 'none';
}

export interface VisualAnomaly {
  type: string;
  description: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high';
  affectedRegion?: string;
}

export interface VisualAnalysisResult {
  status: ServiceStatus;
  timestamp: number;
  speciesIdentified?: string;
  speciesConfidence?: number;
  visualHealthScore?: number; // 0-100
  canopyCoveragePercent?: number;
  leafColorAssessment?: 'healthy_green' | 'pale_yellow' | 'chlorosis' | 'necrosis' | 'unknown';
  anomaliesDetected?: VisualAnomaly[];
  message?: string;
}

export interface PredictionResult {
  status: ServiceStatus;
  timestamp: number;
  message: string;
  predictedGrowthVelocity?: number;
  projectedHarvestDate?: string;
}

export interface EnvironmentalAssessment {
  timestamp: number;
  phScore: number; // 0-100
  tdsScore: number; // 0-100
  waterLevelScore: number; // 0-100
  compositeEnvironmentalScore: number; // 0-100
  phStatus: 'optimal' | 'low' | 'high' | 'warning' | 'critical';
  tdsStatus: 'optimal' | 'low' | 'high' | 'warning' | 'critical';
  waterLevelStatus: 'optimal' | 'low' | 'warning' | 'critical';
  summary?: string;
}

export interface AnomalyReport {
  id: string;
  type?: 'ph' | 'tds' | 'water_level' | 'visual_stress' | 'system' | string;
  category?: 'ph' | 'tds' | 'water_level' | 'visual_stress' | 'system' | 'environmental' | string;
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  suggestedAction?: string;
  sensorMetric?: string;
  currentValue?: number;
  targetRange?: string;
  timestamp?: number;
  detectedTimestamp?: number;
}

export interface RecommendationItem {
  id: string;
  category: 'nutrient' | 'ph_balance' | 'ph' | 'water' | 'lighting' | 'inspection' | string;
  priority: 'low' | 'medium' | 'high' | 'immediate' | 'urgent';
  title: string;
  action: string;
  reasoning: string;
  status?: 'pending' | 'completed' | 'dismissed' | 'active';
  timestamp?: number;
}

export interface PlantHealthReport {
  timestamp: number;
  overallHealthScore: number; // 0-100
  healthState: 'optimal' | 'warning' | 'critical';
  environmentalScore: number;
  visualScore?: number;
  summary: string;
}

export type DemoScenario =
  | 'healthy'
  | 'ph_drift'
  | 'tds_decline'
  | 'water_depletion'
  | 'sensor_anomaly';

import {
  PlantDetectionResult,
  PlantPresenceState,
  PlantDetectorConfig,
  PLANT_DETECTOR_CONFIG,
  PlantDetectorDiagnostics,
} from '@/lib/vision/plantDetector';
import {
  VisualHealthAnalysisResult,
  VisualHealthState,
  StructuredHealthState,
  VisualScoreBreakdown,
  VisualStressIndicator
} from '@/lib/vision/plantHealthAnalyzer';
import { VisualChangeDeltas } from '@/lib/intelligence/visualBaselineEngine';

export type {
  PlantDetectionResult,
  PlantPresenceState,
  PlantDetectorConfig,
  PlantDetectorDiagnostics,
  VisualHealthAnalysisResult,
  VisualHealthState,
  StructuredHealthState,
  VisualScoreBreakdown,
  VisualStressIndicator,
  VisualChangeDeltas
};
export { PLANT_DETECTOR_CONFIG };

// ============================================================
// Phase 5: Multimodal Health Engine Types
// ============================================================

export type HealthTrend = 'improving' | 'stable' | 'declining' | 'insufficient_data';

export interface CameraHealthInput {
  isPlantDetected?: boolean;
  speciesName?: string;
  speciesConfidence?: number;
  visualHealthScore?: number;
  visualHealthState?: VisualHealthState;
  canopyCoveragePercent?: number;
  vegetationIndex?: number;
  chlorosisYellowPercent?: number;
  necroticBrownPercent?: number;
  indicators?: VisualStressIndicator[];
}

export interface ESP32HealthInput {
  ph?: number;
  tds?: number;
  waterLevel?: number;
  distance?: number;
  isStale: boolean;
  mode: 'real' | 'simulation';
}

export interface HistoricalHealthInput {
  previousObservations: PlantObservation[];
  canopyDeltaPercent?: number;
  phDriftPerHour?: number;
  tdsDriftPerHour?: number;
  scoreTrajectory?: HealthTrend;
}

export interface MultimodalHealthAssessment {
  timestamp: number;
  overallScore: number; // 0 - 100
  visualState: VisualHealthState;
  environmentalState: 'optimal' | 'warning' | 'critical';
  overallHealthState: 'optimal' | 'warning' | 'critical';
  trend: HealthTrend;
  anomalies: string[];
  observations: string[];     // Raw sensory facts
  interpretations: string[];  // Cross-domain evaluated relationships
  explanations: string[];     // Agronomic reasoning without definitive disease claims
  confidence: number;         // 0 - 100% based on active sensor modalities
}

// ============================================================
// Phase 6: Plant Growth Tracking & Memory Types
// ============================================================

export interface PlantGrowthMetrics {
  initialCanopyCoverage: number;    // % on Day 1
  latestCanopyCoverage: number;     // % current
  cumulativeGrowthDelta: number;    // +% or -% change
  dailyGrowthVelocity: number;      // %/day
  daysMonitored: number;            // Total days span
  growthState: 'expanding' | 'steady' | 'contracting' | 'insufficient_data';
  disclaimer: string;
}

export interface PlantJourneyMilestone {
  id: string;
  dayNumber: number;               // Day 1, Day 7, Day 14
  dayLabel: string;                // "Day 1 · Initial Baseline"
  dateString: string;              // "Aug 8, 2026"
  timestamp: number;
  imageReference?: string;
  healthScore: number;
  healthState: 'optimal' | 'warning' | 'critical';
  canopyCoveragePercent?: number;
  canopyDeltaPercent?: number;      // Change from Day 1
  ph?: number;
  tds?: number;
  waterLevel?: number;
  anomaliesSummary?: string;
}

export interface PlantMemoryAnswers {
  howHasPlantChanged: string;
  isPlantHealthier: string;
  whatChangedRecently: string;
  confidenceScore: number;
}

// ============================================================
// Phase 7: Predictive Analytics & Recommendation Engine Types
// ============================================================

export interface ParameterPrediction {
  metric: 'ph' | 'tds' | 'waterLevel';
  label: string;
  currentValue: number;
  unit: string;
  driftPerDay: number;              // Rate of change (ΔUnit/day)
  trendDirection: 'rising' | 'falling' | 'stable';
  targetMin: number;
  targetMax: number;
  isInsideTarget: boolean;
  estimatedDaysToThreshold: number | null; // e.g. 3.4 days, or null if stable/improving
  thresholdType: 'depletion_min' | 'toxicity_max' | 'critical_water' | 'none';
  forecastSummary: string;
  confidenceScore: number;          // 0 - 100%
}

export interface StatisticalAnomalyResult {
  id: string;
  metric: 'ph' | 'tds' | 'waterLevel';
  label: string;
  currentValue: number;
  rollingMean: number;              // μ
  standardDeviation: number;        // σ
  zScore: number;                   // Z = (x - μ) / σ
  isAnomaly: boolean;               // True if |Z| >= 2.0
  severity: 'nominal' | 'warning' | 'critical';
  rateOfChange: number;
  description: string;
}

export interface PredictiveAnalyticsResult {
  timestamp: number;
  predictions: {
    ph: ParameterPrediction;
    tds: ParameterPrediction;
    waterLevel: ParameterPrediction;
  };
  anomalies: StatisticalAnomalyResult[];
  recommendations: RecommendationItem[];
  disclaimer: string;
}

// ============================================================
// Phase 8: Context-Aware AI Plant Types
// ============================================================

export interface StructuredPlantContext {
  timestamp: number;
  plant: {
    species: string;
    scientificName?: string;
    family?: string;
    confidence?: number;
    growthStage: string;
    daysMonitored: number;
  };
  visualState: {
    healthScore?: number;
    healthState: VisualHealthState;
    canopyCoveragePercent?: number;
    vegetationIndex?: number;
    indicators: string[];
    isPlantDetected: boolean;
  };
  environment: {
    ph?: number;
    tds?: number;
    waterLevel?: number;
    distance?: number;
    telemetryMode: 'real' | 'simulation';
    isTelemetryStale: boolean;
    targetEnvelope: {
      phMin: number;
      phMax: number;
      tdsMin: number;
      tdsMax: number;
    };
    phStatus: string;
    tdsStatus: string;
    waterLevelStatus: string;
  };
  historical: {
    totalObservations: number;
    canopyGrowthDelta: number;
    longitudinalTrend: HealthTrend;
    overallHealthScore: number;
    activeAnomalies: string[];
  };
  predictions: {
    phDriftPerDay: number;
    tdsDriftPerDay: number;
    waterDriftPerDay: number;
    phDaysToThreshold: number | null;
    tdsDaysToThreshold: number | null;
    waterDaysToThreshold: number | null;
  };
  recommendations: {
    items: Array<{
      title: string;
      action: string;
      priority: string;
    }>;
  };
}

export interface AIPlantMessage {
  id: string;
  sender: 'user' | 'plant';
  text: string;
  timestamp: number;
  epistemicBadges?: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'>;
}

export interface AIPlantResponse {
  message: string;
  epistemicBadges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'>;
  groundedFacts: string[];
}

// Unified Multimodal Observation Model
export interface PlantObservation {
  id: string;
  plantId: string; // Foreign key linking to active PlantProfile
  timestamp: number;
  isBaselineSeed?: boolean; // Indicates calibration baseline vs live hardware telemetry
  
  // Multimodal Data Sources
  imageReference?: string;
  cameraActive: boolean;
  
  // Computer Vision Plant Detection Metrics
  isPlantDetected?: boolean;
  plantDetectionConfidence?: number; // 0 - 100%
  canopyCoveragePercent?: number;
  vegetationIndex?: number;
  
  // Visual Health & Stress Analysis
  visualHealthScore?: number; // 0 - 100
  visualHealthState?: VisualHealthState;
  visualScoreBreakdown?: VisualScoreBreakdown;
  visualIndicators?: string[];
  healthConfidence?: 'high' | 'moderate' | 'low' | 'unknown';
  baselineDeltas?: VisualChangeDeltas | null;

  // Sensor Telemetry (ESP32 or Simulator)
  ph?: number;
  tds?: number;
  waterLevel?: number;
  distance?: number;
  telemetryMode: 'real' | 'simulation';
  isTelemetryStale: boolean;

  // Plant Identification
  plantSpecies?: string;
  speciesConfidence?: number;

  // Environmental Assessment (Rule-based)
  environmentalHealthScore?: number;
  overallHealthScore?: number;
  
  // Multimodal Assessment Summary
  multimodalAssessment?: MultimodalHealthAssessment;

  // Anomaly & Action Summary
  anomalyDetected: boolean;
  activeAnomalies?: string[];
  recommendations?: string[];

  // Phase 6 Multimodal Reasoning Event
  reasoningEvent?: PlantReasoningEvent;
}

// ============================================================
// Phase 6: Multimodal Plant Reasoning & Evidence Model
// ============================================================

export type PlantEvidenceSource =
  | 'camera'
  | 'sensor'
  | 'history'
  | 'statistics'
  | 'plant_profile';

export type PlantEvidenceType =
  | 'plant_presence'
  | 'species_identification'
  | 'visual_health'
  | 'visual_anomaly'
  | 'sensor_reading'
  | 'sensor_anomaly'
  | 'trend'
  | 'historical_change'
  | 'growth_change';

export type PlantEvidenceConfidence = 'high' | 'moderate' | 'low' | 'unverified';

export interface PlantEvidence {
  source: PlantEvidenceSource;
  type: PlantEvidenceType;
  label: string;
  value: unknown;
  timestamp: number;
  confidence: PlantEvidenceConfidence;
  unit?: string;
  plantId: string;
  observationId?: string;
  metadata?: Record<string, unknown>;
}

export type SensorAvailabilityState = 'available' | 'unavailable' | 'simulated';

export interface SensorEvidence {
  metric: 'ph' | 'tds' | 'waterLevel';
  label: string;
  current?: number;
  previous?: number;
  baseline?: number;
  delta?: number;
  unit: string;
  trend: 'rising' | 'falling' | 'stable' | 'insufficient_data';
  hasAnomaly: boolean;
  anomalySeverity?: 'warning' | 'critical' | 'nominal';
  anomalyDetails?: string;
  timestamp: number;
  availability: SensorAvailabilityState;
  quality: 'reliable' | 'stale' | 'invalid' | 'unknown';
}

export type ReasoningConfidenceLevel =
  | 'high'
  | 'moderate'
  | 'low'
  | 'insufficient_evidence';

export type MultimodalScenarioCode =
  | 'STABLE_EQUILIBRIUM'
  | 'VISUAL_CHANGE_ONLY'
  | 'ENVIRONMENTAL_ANOMALY_ONLY'
  | 'CORRELATED_ENVIRONMENTAL_STRESS'
  | 'TEMPORAL_ASSOCIATION'
  | 'CONFLICTING_EVIDENCE'
  | 'SENSOR_UNAVAILABLE'
  | 'CAMERA_UNAVAILABLE'
  | 'INSUFFICIENT_HISTORY'
  | 'NO_PLANT_DETECTED'
  | 'POOR_IMAGE_QUALITY'
  | 'UNKNOWN_SPECIES'
  | 'RECOVERING_TRAJECTORY';

export interface PlantReasoningEvent {
  id: string;
  plantId: string;
  timestamp: number;
  scenarioCode: MultimodalScenarioCode;
  plantState: StructuredHealthState;
  evidence: PlantEvidence[];
  sensorEvidence: Record<'ph' | 'tds' | 'waterLevel', SensorEvidence>;
  observations: string[];     // Direct facts (what was seen or measured)
  interpretations: string[];  // Plausible associations (without false causality)
  recommendations: string[];  // Actionable steps for grower
  confidence: ReasoningConfidenceLevel;
  contributingSignals: string[];
  limitations: string[];      // Data gaps (e.g. "Sensor telemetry unavailable", "N=1 history")
  conflictingSignals: string[]; // Disagreements (e.g. Visual healthy vs Sensor critical)
  reasoningVersion: string;   // e.g. "hydrosmart-reasoning-v1"
  primaryFarmerHeadline: string; // "Your plant is showing increased leaf yellowing"
  primaryFarmerWhy: string;      // "The yellowing increased while the nutrient-solution readings changed"
  primaryFarmerAction: string;   // "Check the nutrient solution and continue monitoring the plant"
  confidenceScore?: number;
  farmerCopy?: {
    observableSummary: string;
    whySummary: string;
    farmerAction: string;
  };
  sensorAvailable?: boolean;
}
