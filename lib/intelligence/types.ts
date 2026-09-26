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
  monitoringStatus: 'active' | 'archived' | 'completed' | MonitoringState;
  currentHealthStatus: StructuredHealthState | 'optimal' | 'warning' | 'critical' | 'unknown';
  observationCount: number;
  growthStage?: 'germination' | 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest_ready';
  targetProfile?: CropTargetProfile;
  lastVisualAssessment?: VisualHealthAnalysisResult;
  lastVisualAssessmentAt?: number;
  healthConfidence?: 'high' | 'moderate' | 'low' | 'unknown';
  activeAnomaly?: string;
  recoveryStatus?: 'recovering' | 'stable' | 'deteriorating' | 'none';

  // Phase 8 Digital Profile Extended Structures
  lifecycleState?: PlantLifecycleState;
  identificationStatus?: PlantIdentificationStatus;
  baselineStatus?: BaselineStatus;
  identity?: PlantProfileIdentity;
  lifecycle?: PlantProfileLifecycle;
  currentState?: PlantProfileCurrentState;
  statistics?: PlantProfileStatistics;
  baseline?: PlantProfileBaseline;
  growth?: PlantProfileGrowth;
  environment?: PlantProfileEnvironment;
  completeness?: ProfileCompleteness;
  metadata?: PlantProfileMetadata;
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
  quality: 'reliable' | 'stale' | 'invalid' | 'unknown' | 'uncalibrated' | 'noisy' | 'out_of_range';
  rawValue?: number;
  calibratedValue?: number;
  calibrationStatus?: string;
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

// ============================================================================
// PHASE 7: "WHAT CHANGED?" INTELLIGENCE ENGINE TYPES
// ============================================================================

export type ChangeCategory =
  | 'visual'
  | 'sensor'
  | 'health'
  | 'growth'
  | 'identity'
  | 'anomaly'
  | 'reasoning'
  | 'combined';

export type ChangeDirection =
  | 'improved'
  | 'declined'
  | 'stable'
  | 'changed'
  | 'recovered'
  | 'unavailable'
  | 'unknown';

export type ChangeSignificance =
  | 'NONE'
  | 'MINOR'
  | 'MODERATE'
  | 'SIGNIFICANT'
  | 'CRITICAL';

export type ChangeConfidence =
  | 'HIGH'
  | 'MODERATE'
  | 'LOW'
  | 'INSUFFICIENT_DATA';

export type TemporalComparisonWindow =
  | 'vs_previous'
  | 'vs_baseline'
  | 'vs_trend';

export interface PlantChangeEvent {
  id: string;
  plantId: string;
  category: ChangeCategory;
  metric: string;
  label: string;
  previousValue?: number | string | boolean | null;
  currentValue?: number | string | boolean | null;
  baselineValue?: number | string | boolean | null;
  delta?: number;
  percentDelta?: number;
  unit?: string;
  direction: ChangeDirection;
  significance: ChangeSignificance;
  confidence: ChangeConfidence;
  isMeaningful: boolean;
  temporalWindow: TemporalComparisonWindow;
  summary: string;
  farmerHeadline: string;
  farmerWhy: string;
  farmerAction: string;
  whyItMatters: string;
  suggestedCheck: string;
  requiresReview?: boolean;
  timestamp: number;
  evidenceSource: 'camera' | 'esp32' | 'multimodal' | 'history' | 'system';
}

export type WhatChangedStatus =
  | 'meaningful_changes'
  | 'stable_no_change'
  | 'insufficient_history'
  | 'sensor_unavailable';

export interface WhatChangedSummary {
  plantId: string;
  timestamp: number;
  timeframeDescription: string;
  hasMeaningfulChange: boolean;
  status: WhatChangedStatus;
  overallSignificance: ChangeSignificance;
  overallDirection: ChangeDirection;
  summaryHeadline: string;
  summaryExplanation: string;
  farmerHeadline: string;
  farmerWhy: string;
  farmerAction: string;
  events: PlantChangeEvent[];
  visualChanges: PlantChangeEvent[];
  sensorChanges: PlantChangeEvent[];
  healthChanges: PlantChangeEvent[];
  growthChanges: PlantChangeEvent[];
  anomalyChanges: PlantChangeEvent[];
  identityChanges: PlantChangeEvent[];
  reasoningChanges: PlantChangeEvent[];
  reviewRequiredItems: PlantChangeEvent[];
  sensorAvailability: {
    ph: SensorAvailabilityState;
    tds: SensorAvailabilityState;
    waterLevel: SensorAvailabilityState;
  };
  cameraConfidence: ChangeConfidence;
  observationCount: number;
  timeDeltaHours?: number;
  limitations: string[];
}

// ============================================================================
// PHASE 8: PLANT DIGITAL PROFILE & LIFECYCLE INTELLIGENCE TYPES
// ============================================================================

export type PlantIdentificationStatus =
  | 'UNKNOWN'
  | 'IDENTIFIED'
  | 'LOW_CONFIDENCE'
  | 'REVIEW_REQUIRED';

export type PlantLifecycleState =
  | 'CREATED'
  | 'BASELINE_PENDING'
  | 'MONITORING'
  | 'GROWING'
  | 'ATTENTION'
  | 'RECOVERING'
  | 'STABLE'
  | 'INACTIVE'
  | 'ARCHIVED';

export type MonitoringState = 'ACTIVE' | 'PAUSED' | 'OFFLINE';

export type BaselineStatus =
  | 'BASELINE_PENDING'
  | 'BASELINE_ESTABLISHED'
  | 'INSUFFICIENT_QUALITY';

export type ProfileCompletenessStatus =
  | 'COMPLETE'
  | 'PARTIAL'
  | 'LIMITED'
  | 'INSUFFICIENT_DATA';

export interface ProfileCompletenessCategory {
  available: boolean;
  label: string;
  details: string;
}

export interface ProfileCompleteness {
  status: ProfileCompletenessStatus;
  score: number; // 0 - 100
  overallScore?: number; // 0 - 100
  categories: {
    identity: ProfileCompletenessCategory;
    baseline: ProfileCompletenessCategory;
    healthHistory: ProfileCompletenessCategory;
    growthHistory: ProfileCompletenessCategory;
    environmentalHistory: ProfileCompletenessCategory;
  };
  missingItems: string[];
  explanation: string;
}

export type PlantMilestoneType =
  | 'CREATED'
  | 'BASELINE_ESTABLISHED'
  | 'SPECIES_IDENTIFIED'
  | 'HEALTH_CHANGE'
  | 'ANOMALY_DETECTED'
  | 'GROWTH_DETECTED'
  | 'RECOVERY_DETECTED'
  | 'ENVIRONMENTAL_CHANGE'
  | 'REASONING_EVENT'
  | 'CORRELATION_DETECTED'
  | 'ALERT_GENERATED';

export interface PlantMilestone {
  id: string;
  plantId: string;
  type: PlantMilestoneType;
  timestamp: number;
  dateString: string;
  dayNumber: number;
  dayLabel: string;
  title: string;
  description: string;
  evidenceIds?: string[];
  observationId?: string;
  reasoningEventId?: string;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  status?: 'optimal' | 'warning' | 'critical' | 'stable';
  sourceMetric?: string;
  metricDelta?: string;
}

export interface PlantProfileIdentity {
  plantId: string;
  species?: string;
  commonName?: string;
  scientificName?: string;
  family?: string;
  speciesConfidence?: number;
  identificationStatus: PlantIdentificationStatus;
  identifiedAt?: number;
}

export interface PlantProfileLifecycle {
  createdAt: number;
  lastObservedAt?: number;
  monitoringStartedAt: number;
  monitoringStatus: MonitoringState;
  lifecycleState: PlantLifecycleState;
}

export interface PlantProfileCurrentState {
  healthStatus: StructuredHealthState | 'optimal' | 'warning' | 'critical' | 'unknown';
  healthConfidence: 'high' | 'moderate' | 'low' | 'unknown';
  currentAnomaly?: string;
  activeAnomaly?: string;
  latestReasoningEventId?: string;
  reasoningSummary?: string;
  currentGrowthState?: 'expanding' | 'steady' | 'contracting' | 'insufficient_data';
  visualHealthScore?: number;
}

export interface PlantProfileStatistics {
  observationCount: number;
  totalObservationCount?: number;
  reasoningEventCount: number;
  changeEventCount: number;
  daysMonitored: number;
}

export interface PlantProfileBaseline {
  baselineObservationId?: string;
  baselineCreatedAt?: number;
  baselineStatus: BaselineStatus;
  isEstablished: boolean;
  initialCanopyCoverage?: number;
  initialHealthScore?: number;
  initialPH?: number;
  initialTDS?: number;
  initialWaterLevel?: number;
}

export interface PlantProfileGrowth {
  latestCanopyCoverage?: number;
  latestPlantArea?: number;
  cumulativeGrowthDelta?: number;
  growthTrend: 'expanding' | 'steady' | 'contracting' | 'insufficient_data';
  growthConfidence: 'HIGH' | 'MODERATE' | 'LOW';
  dailyGrowthVelocity?: number;
  disclaimer: string;
}

export interface PlantProfileEnvironment {
  latestPH?: number;
  latestTDS?: number;
  latestWaterLevel?: number;
  sensorAvailability: {
    ph: SensorAvailabilityState;
    tds: SensorAvailabilityState;
    waterLevel: SensorAvailabilityState;
  };
  phTrend?: 'rising' | 'falling' | 'stable' | 'unknown';
  tdsTrend?: 'rising' | 'falling' | 'stable' | 'unknown';
  waterTrend?: 'rising' | 'falling' | 'stable' | 'unknown';
}

export interface PlantProfileMetadata {
  profileVersion: string;
  createdBy: string;
  updatedAt: number;
}

// ============================================================================
// PHASE 9: ENVIRONMENT <-> PLANT CORRELATION INTELLIGENCE TYPES
// ============================================================================

export type EnvironmentAssociationType =
  | 'ENVIRONMENT_ONLY_CHANGE'
  | 'PLANT_ONLY_CHANGE'
  | 'COINCIDENT_CHANGE'
  | 'TEMPORAL_ASSOCIATION'
  | 'LAGGED_ASSOCIATION'
  | 'NO_CLEAR_ASSOCIATION'
  | 'INSUFFICIENT_DATA'
  | 'CONFLICTING_EVIDENCE';

export type AssociationConfidenceLevel =
  | 'HIGH'
  | 'MODERATE'
  | 'LOW'
  | 'INSUFFICIENT';

export type AssociationStrength =
  | 'none'
  | 'weak'
  | 'moderate'
  | 'strong';

export type CorrelationMethod =
  | 'pearson'
  | 'spearman'
  | 'qualitative_pairing'
  | 'none';

export type CorrelationTimeWindow =
  | 'immediate'
  | 'same_day'
  | 'recent_trend'
  | 'baseline_comparison';

export interface EnvironmentPlantAssociation {
  id: string;
  plantId: string;
  timestamp: number;
  environmentMetric: 'ph' | 'tds' | 'waterLevel' | 'multiple';
  environmentLabel: string;
  environmentValue?: number;
  environmentBaseline?: number;
  environmentDirection: 'rising' | 'falling' | 'stable' | 'unavailable';
  plantMetric: 'visualHealthScore' | 'canopyCoverage' | 'chlorosis' | 'necrosis' | 'healthState';
  plantLabel: string;
  plantValue?: number | string;
  plantBaseline?: number | string;
  plantDirection: 'improved' | 'declined' | 'stable' | 'unknown';
  timeWindow: CorrelationTimeWindow;
  lagHours?: number;
  associationType: EnvironmentAssociationType;
  associationStrength: AssociationStrength;
  correlationCoefficient?: number; // Validly calculated Pearson r or Spearman rho
  correlationMethod: CorrelationMethod;
  sampleSize: number;
  confidence: AssociationConfidenceLevel;
  confidenceReason: string;
  dataQuality: 'good' | 'degraded' | 'poor';
  confoundingFactors: string[];
  evidenceIds: string[];
  relatedObservationIds: string[];
  relatedReasoningEventIds?: string[];
  summary: string;
  farmerSummary: {
    whatChanged: string;
    whatHappenedTogether: string;
    whatItMeans: string;
    whatToDo: string;
  };
  createdAt: number;
}

export type CorrelationAnalysisStatus =
  | 'active_associations'
  | 'no_clear_association'
  | 'insufficient_history'
  | 'sensor_unavailable';

export interface CorrelationAnalysisSummary {
  plantId: string;
  timestamp: number;
  status: CorrelationAnalysisStatus;
  primaryAssociation: EnvironmentPlantAssociation | null;
  associations: EnvironmentPlantAssociation[];
  multiSensorAnalysis?: {
    isMultiSensorEvent: boolean;
    environmentalFactors: string[];
    summary: string;
  };
  laggedAssociations: EnvironmentPlantAssociation[];
  confoundingFactors: string[];
  sampleSize: number;
  limitations: string[];
  farmerHeadline: string;
  farmerWhy: string;
  farmerAction: string;
}

// ============================================================================
// PHASE 10: CONFIDENCE-AWARE PLANT ALERTS & ACTIONABLE NOTIFICATIONS
// ============================================================================

export type PlantAlertSeverity = 'INFO' | 'ATTENTION' | 'URGENT';

export type PlantAlertCategory =
  | 'PLANT_HEALTH'
  | 'VISUAL_ANOMALY'
  | 'ENVIRONMENT'
  | 'WATER_LEVEL'
  | 'PH'
  | 'TDS'
  | 'GROWTH'
  | 'RECOVERY'
  | 'MULTIMODAL'
  | 'DATA_QUALITY';

export type PlantAlertStatus =
  | 'DETECTED'
  | 'ACTIVE'
  | 'ACKNOWLEDGED'
  | 'RESOLVED'
  | 'DISMISSED';

export type PlantAlertConfidence = 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';

export type PlantAlertTrigger =
  | 'visual_health_transition'
  | 'visual_anomaly'
  | 'sensor_out_of_range'
  | 'sensor_baseline_deviation'
  | 'sensor_stale'
  | 'sensor_missing'
  | 'phase9_association'
  | 'what_changed'
  | 'multimodal'
  | 'data_quality'
  | 'growth_decline'
  | 'recovery';

export interface PlantAlert {
  id: string;
  plantId: string;
  createdAt: number;
  updatedAt: number;
  status: PlantAlertStatus;
  severity: PlantAlertSeverity;
  category: PlantAlertCategory;
  triggerType: PlantAlertTrigger;
  metric?: string;
  currentValue?: number | string;
  baselineValue?: number | string;
  threshold?: number | string;
  direction?: 'rising' | 'falling' | 'stable' | 'unknown';
  confidence: PlantAlertConfidence;
  confidenceReason: string;
  title: string;
  farmerMessage: string;
  farmerWhy: string;
  farmerAction: string;
  technicalMessage: string;
  limitation: string;
  evidenceIds: string[];
  reasoningEventId?: string;
  changeEventIds: string[];
  environmentAssociationIds: string[];
  occurrenceCount: number;
  firstDetectedAt: number;
  lastDetectedAt: number;
  persistenceWindowMs: number;
  recommendedAction: string;
  source: 'visual' | 'sensor' | 'reasoning' | 'correlation' | 'system';
  dismissedAt?: number;
  resolvedAt?: number;
  hysteresisThreshold?: number;
}

export interface PlantAlertSummary {
  plantId: string;
  timestamp: number;
  activeAlerts: PlantAlert[];
  dismissedAlerts: PlantAlert[];
  resolvedAlerts: PlantAlert[];
  urgentCount: number;
  attentionCount: number;
  infoCount: number;
  hasAnyAlert: boolean;
  primaryAlert: PlantAlert | null;
}

