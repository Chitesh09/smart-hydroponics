// ============================================================
// HydroSmart Intelligence Foundation — Data Models & Contracts
// ============================================================

export type ServiceStatus = 'not_implemented' | 'ready' | 'processing' | 'error';

export type CameraStatus = 'idle' | 'requesting' | 'connected' | 'disconnected' | 'error';

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

export interface EnvironmentalAssessment {
  timestamp: number;
  phScore: number; // 0-100
  tdsScore: number; // 0-100
  waterLevelScore: number; // 0-100
  compositeEnvironmentalScore: number; // 0-100
  phStatus: 'optimal' | 'warning' | 'critical';
  tdsStatus: 'optimal' | 'warning' | 'critical';
  waterLevelStatus: 'optimal' | 'warning' | 'critical';
}

export interface PlantHealthReport {
  timestamp: number;
  overallHealthScore: number; // 0-100
  environmentalScore: number; // 0-100
  visualScore?: number; // 0-100 (undefined if no visual model run)
  healthState: 'optimal' | 'warning' | 'critical';
  summary: string;
}

export interface AnomalyReport {
  id: string;
  timestamp: number;
  category: 'environmental' | 'visual' | 'sensor_drift' | 'system';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  sensorMetric?: 'ph' | 'tds' | 'waterLevel' | 'distance' | 'camera';
  currentValue?: number;
  targetRange?: string;
}

export interface RecommendationItem {
  id: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  action: string;
  reasoning: string;
  category: 'nutrient' | 'ph' | 'water' | 'lighting' | 'inspection';
  status: 'pending' | 'applied' | 'dismissed';
}

export interface PredictionResult {
  status: ServiceStatus;
  timestamp: number;
  estimatedHarvestTimestamp?: number;
  predictedGrowthRate?: string;
  nextInterventionPrediction?: string;
  confidence?: number;
  message?: string;
}

import { PlantDetectionResult } from '@/lib/vision/plantDetector';
export type { PlantDetectionResult };

// Unified Multimodal Observation Model
export interface PlantObservation {
  id: string;
  timestamp: number;
  
  // Multimodal Data Sources
  imageReference?: string; // Base64 data URL or storage reference
  cameraActive: boolean;
  
  // Real Computer Vision Plant Detection Metrics
  isPlantDetected?: boolean;
  plantDetectionConfidence?: number; // 0 - 100%
  canopyCoveragePercent?: number;
  vegetationIndex?: number;
  
  // Sensor Telemetry (from ESP32 or Simulator)
  ph?: number;
  tds?: number;
  waterLevel?: number;
  distance?: number;
  telemetryMode: 'real' | 'simulation';
  isTelemetryStale: boolean;

  // Plant Identification
  plantSpecies?: string;
  speciesConfidence?: number;

  // Visual Analysis (Future ML)
  visualHealthScore?: number;
  visualAnomalies?: string[];

  // Environmental Assessment (Rule-based)
  environmentalHealthScore?: number;
  overallHealthScore?: number;
  
  // Anomaly & Action Summary
  anomalyDetected: boolean;
  activeAnomalies?: string[];
  recommendations?: string[];
}

export type DemoScenario = 
  | 'healthy'
  | 'ph_drift'
  | 'tds_decline'
  | 'water_depletion'
  | 'sensor_anomaly';
