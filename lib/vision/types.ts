// ============================================================
// HydroSmart — Vision Architecture & Abstraction Types
// Production Confidence-Aware Computer Vision Contract
// ============================================================

export type VisionConfidenceLevel = 'high' | 'medium' | 'low' | 'insufficient';

export type VisionHealthState =
  | 'HEALTHY'
  | 'MILD_STRESS'
  | 'MODERATE_STRESS'
  | 'SEVERE_STRESS'
  | 'INSUFFICIENT_DATA';

export type VisionDetectionStatus =
  | 'PLANT_DETECTED'
  | 'NO_PLANT'
  | 'INSUFFICIENT_VISIBILITY'
  | 'NO_CAMERA'
  | 'LOW_LIGHT'
  | 'OVEREXPOSED'
  | 'BLURRY';

export type PlantIdentificationStatus =
  | 'KNOWN_PLANT'
  | 'UNKNOWN_PLANT'
  | 'LOW_CONFIDENCE'
  | 'NO_PLANT';

export interface ImageQualityAssessment {
  brightnessScore: number; // 0 - 100
  contrastScore: number; // 0 - 100
  sharpnessScore: number; // 0 - 100
  foliageVisibilityScore: number; // 0 - 100
  overallQuality: number; // 0 - 100
  acceptable: boolean;
  isBlurry: boolean;
  isUnderexposed: boolean;
  isOverexposed: boolean;
  lightingColorCast: 'neutral' | 'warm_yellow' | 'cool_blue' | 'harsh_glare';
  qualityMessage: string;
}

export interface VisualAnomaly {
  type: 'possible_chlorosis' | 'possible_necrosis' | 'abnormal_texture' | 'canopy_reduction' | 'uneven_growth';
  severity: 'mild' | 'moderate' | 'severe';
  percentage: number;
  confidence: VisionConfidenceLevel;
  evidence: string;
}

export interface PlantIdentificationCandidate {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  similarityScore: number; // 0 - 1.0 (raw feature distance)
  confidenceLevel: VisionConfidenceLevel;
  description: string;
}

export interface PlantIdentificationResult {
  status: PlantIdentificationStatus;
  primarySpecies: string | null;
  scientificName?: string;
  confidenceScore: number; // 0.0 - 1.0
  confidenceLevel: VisionConfidenceLevel;
  rankedCandidates: PlantIdentificationCandidate[];
  guidanceMessage: string;
  extractedFeatures?: {
    canopyCoverage: number;
    aspectRatio: number;
    meanHue: number;
    meanExG: number;
    edgeComplexity: number;
  };
}

export interface VisualObservation {
  timestamp: number;
  detectionStatus: VisionDetectionStatus;
  plantDetected: boolean;
  plantSpecies: string | null;
  speciesConfidence: number;
  identificationStatus: PlantIdentificationStatus;
  visualHealthScore: number | null; // null if image is unacceptable
  healthState: VisionHealthState;
  anomalies: VisualAnomaly[];
  canopyCoveragePercent: number;
  vegetationIndex: number;
  imageQuality: ImageQualityAssessment;
  confidence: VisionConfidenceLevel;
  confidenceScore: number; // 0.0 - 1.0
  processingTimeMs: number;
  method: 'heuristic' | 'ml_model' | 'fallback';
  limitations: string[];
  explainableFindings: string[];
}

export interface VisionModelInfo {
  id: string;
  name: string;
  version: string;
  type: 'heuristic' | 'onnx' | 'tfjs';
  classes: string[];
  inputSize: [number, number];
  enabled: boolean;
  statusText: string;
}
