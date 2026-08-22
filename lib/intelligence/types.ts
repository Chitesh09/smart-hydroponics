// ============================================================
// HydroSmart Multimodal Intelligence Engine — Core Types
// Phase 1, Phase 2, Phase 3, Phase 4, Phase 5
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
  status: 'success' | 'low_confidence' | 'no_plant_detected' | 'error';
  primaryCandidate?: PlantCandidate;
  rankedCandidates: PlantCandidate[];
  overallConfidence: number; // 0 - 100%
  confidenceLevel: 'high' | 'moderate' | 'low' | 'uncertain';
  guidanceMessage: string;
  timestamp: number;
  imageReference?: string;
  extractedFeatures?: {
    aspectRatio: number;
    meanExG: number;
    meanHue: number;
    edgeComplexity: number;
    canopyCoverage: number;
  };
}

export interface PlantIdentity {
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

import { PlantDetectionResult } from '@/lib/vision/plantDetector';
import {
  VisualHealthAnalysisResult,
  VisualHealthState,
  VisualScoreBreakdown,
  VisualStressIndicator
} from '@/lib/vision/plantHealthAnalyzer';

export type {
  PlantDetectionResult,
  VisualHealthAnalysisResult,
  VisualHealthState,
  VisualScoreBreakdown,
  VisualStressIndicator
};

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

// Unified Multimodal Observation Model
export interface PlantObservation {
  id: string;
  timestamp: number;
  
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
}
