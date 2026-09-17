// ============================================================
// HydroSmart — Farmer-Friendly Semantic Interpretation Layer
// Phase 1: Centralized Human Status Derivation & Copy Dictionary
// ============================================================

import {
  MultimodalHealthAssessment,
  EnvironmentalAssessment,
  PlantDetectionResult,
  VisualHealthAnalysisResult,
  AnomalyReport
} from './types';

export type PlantStatusLevel = 'GOOD' | 'ATTENTION' | 'URGENT' | 'UNKNOWN';
export type EnvironmentStatusLevel = 'GOOD' | 'ATTENTION' | 'URGENT' | 'UNKNOWN';
export type WaterStatusLevel = 'GOOD' | 'ATTENTION' | 'URGENT' | 'UNKNOWN';
export type NutrientStatusLevel = 'GOOD' | 'ATTENTION' | 'URGENT' | 'UNKNOWN';
export type CameraStatusLevel = 'PLANT_DETECTED' | 'NO_PLANT' | 'LOW_CONFIDENCE' | 'SCAN_NOT_READY';

export interface FarmerSemanticState {
  // Core status levels
  plantStatus: PlantStatusLevel;
  environmentStatus: EnvironmentStatusLevel;
  waterStatus: WaterStatusLevel;
  nutrientStatus: NutrientStatusLevel;
  cameraStatus: CameraStatusLevel;

  // Standardized human interpretation wording
  plantMessage: string;
  environmentMessage: string;
  waterMessage: string;
  nutrientMessage: string;
  cameraMessage: string;

  // Visual cues
  plantColor: 'green' | 'amber' | 'red' | 'gray';
  waterColor: 'green' | 'amber' | 'red' | 'gray';
  nutrientColor: 'green' | 'amber' | 'red' | 'gray';
  cameraColor: 'teal' | 'amber' | 'red' | 'gray';

  // Badges & Actionable Guidance for Farmers
  actionableSummary: string;
  hasSufficientData: boolean;
}

export const FARMER_COPY = {
  plant: {
    GOOD: 'Your plant is doing well',
    ATTENTION: 'Your plant may need attention',
    URGENT: 'Your plant needs attention now',
    UNKNOWN: 'Not enough information yet',
  },
  water: {
    GOOD: 'Water level is good',
    ATTENTION: 'Water level is getting low',
    URGENT: 'Water level needs attention now',
    UNKNOWN: 'Unable to check water level',
  },
  nutrient: {
    GOOD: 'Nutrient level looks good',
    ATTENTION: 'Nutrients may need attention',
    URGENT: 'Nutrients need attention now',
    UNKNOWN: 'Unable to assess nutrients',
  },
  camera: {
    PLANT_DETECTED: 'Plant detected',
    NO_PLANT: 'No plant detected',
    LOW_CONFIDENCE: 'Move the camera closer to the plant',
    SCAN_NOT_READY: 'Camera feed is offline',
  },
  environment: {
    GOOD: 'Growing conditions are good',
    ATTENTION: 'Growing conditions need attention',
    URGENT: 'Growing conditions need urgent action',
    UNKNOWN: 'Unable to assess environment',
  },
};

export function deriveFarmerSemanticState({
  isTelemetryAvailable,
  latestReading,
  environmentalAssessment,
  multimodalAssessment,
  latestDetection,
  latestVisualHealth,
  activeAnomalies,
  isCameraActive,
}: {
  isTelemetryAvailable: boolean;
  latestReading: { ph: number; tds: number; waterLevel: number; distance: number } | null;
  environmentalAssessment: EnvironmentalAssessment;
  multimodalAssessment: MultimodalHealthAssessment;
  latestDetection: PlantDetectionResult | null;
  latestVisualHealth: VisualHealthAnalysisResult | null;
  activeAnomalies: AnomalyReport[];
  isCameraActive: boolean;
}): FarmerSemanticState {
  // 1. Water Status
  let waterStatus: WaterStatusLevel = 'UNKNOWN';
  let waterMessage = FARMER_COPY.water.UNKNOWN;
  let waterColor: 'green' | 'amber' | 'red' | 'gray' = 'gray';

  if (isTelemetryAvailable && latestReading !== null) {
    if (environmentalAssessment.waterLevelStatus === 'critical' || latestReading.waterLevel < 20) {
      waterStatus = 'URGENT';
      waterMessage = FARMER_COPY.water.URGENT;
      waterColor = 'red';
    } else if (environmentalAssessment.waterLevelStatus === 'warning' || latestReading.waterLevel < 45) {
      waterStatus = 'ATTENTION';
      waterMessage = FARMER_COPY.water.ATTENTION;
      waterColor = 'amber';
    } else {
      waterStatus = 'GOOD';
      waterMessage = FARMER_COPY.water.GOOD;
      waterColor = 'green';
    }
  }

  // 2. Nutrient Status
  let nutrientStatus: NutrientStatusLevel = 'UNKNOWN';
  let nutrientMessage = FARMER_COPY.nutrient.UNKNOWN;
  let nutrientColor: 'green' | 'amber' | 'red' | 'gray' = 'gray';

  if (isTelemetryAvailable && latestReading !== null) {
    if (environmentalAssessment.phStatus === 'critical' || environmentalAssessment.tdsStatus === 'critical') {
      nutrientStatus = 'URGENT';
      nutrientMessage = FARMER_COPY.nutrient.URGENT;
      nutrientColor = 'red';
    } else if (
      environmentalAssessment.phStatus === 'warning' ||
      environmentalAssessment.tdsStatus === 'warning' ||
      environmentalAssessment.phStatus === 'low' ||
      environmentalAssessment.phStatus === 'high' ||
      environmentalAssessment.tdsStatus === 'low' ||
      environmentalAssessment.tdsStatus === 'high'
    ) {
      nutrientStatus = 'ATTENTION';
      nutrientMessage = FARMER_COPY.nutrient.ATTENTION;
      nutrientColor = 'amber';
    } else {
      nutrientStatus = 'GOOD';
      nutrientMessage = FARMER_COPY.nutrient.GOOD;
      nutrientColor = 'green';
    }
  }

  // 3. Environment Status
  let environmentStatus: EnvironmentStatusLevel = 'UNKNOWN';
  let environmentMessage = FARMER_COPY.environment.UNKNOWN;

  if (waterStatus === 'URGENT' || nutrientStatus === 'URGENT') {
    environmentStatus = 'URGENT';
    environmentMessage = FARMER_COPY.environment.URGENT;
  } else if (waterStatus === 'ATTENTION' || nutrientStatus === 'ATTENTION') {
    environmentStatus = 'ATTENTION';
    environmentMessage = FARMER_COPY.environment.ATTENTION;
  } else if (waterStatus === 'GOOD' && nutrientStatus === 'GOOD') {
    environmentStatus = 'GOOD';
    environmentMessage = FARMER_COPY.environment.GOOD;
  }

  // 4. Camera Status
  let cameraStatus: CameraStatusLevel = 'SCAN_NOT_READY';
  let cameraMessage = FARMER_COPY.camera.SCAN_NOT_READY;
  let cameraColor: 'teal' | 'amber' | 'red' | 'gray' = 'gray';

  if (isCameraActive) {
    if (latestDetection?.isPlantDetected) {
      if (latestDetection.confidence && latestDetection.confidence < 45) {
        cameraStatus = 'LOW_CONFIDENCE';
        cameraMessage = FARMER_COPY.camera.LOW_CONFIDENCE;
        cameraColor = 'amber';
      } else {
        cameraStatus = 'PLANT_DETECTED';
        cameraMessage = FARMER_COPY.camera.PLANT_DETECTED;
        cameraColor = 'teal';
      }
    } else {
      cameraStatus = 'NO_PLANT';
      cameraMessage = FARMER_COPY.camera.NO_PLANT;
      cameraColor = 'amber';
    }
  }

  // 5. Overall Plant Status
  const hasSufficientData = isTelemetryAvailable || (isCameraActive && Boolean(latestDetection?.isPlantDetected));
  let plantStatus: PlantStatusLevel = 'UNKNOWN';
  let plantMessage = FARMER_COPY.plant.UNKNOWN;
  let plantColor: 'green' | 'amber' | 'red' | 'gray' = 'gray';

  if (!hasSufficientData) {
    plantStatus = 'UNKNOWN';
    plantMessage = FARMER_COPY.plant.UNKNOWN;
    plantColor = 'gray';
  } else if (
    multimodalAssessment.overallHealthState === 'critical' ||
    environmentStatus === 'URGENT' ||
    activeAnomalies.some(a => a.severity === 'critical')
  ) {
    plantStatus = 'URGENT';
    plantMessage = FARMER_COPY.plant.URGENT;
    plantColor = 'red';
  } else if (
    multimodalAssessment.overallHealthState === 'warning' ||
    environmentStatus === 'ATTENTION' ||
    activeAnomalies.length > 0 ||
    (latestVisualHealth && latestVisualHealth.healthState !== 'healthy' && latestVisualHealth.healthState !== 'unknown')
  ) {
    plantStatus = 'ATTENTION';
    plantMessage = FARMER_COPY.plant.ATTENTION;
    plantColor = 'amber';
  } else {
    plantStatus = 'GOOD';
    plantMessage = FARMER_COPY.plant.GOOD;
    plantColor = 'green';
  }

  // Actionable Summary Wording
  let actionableSummary = plantMessage;
  if (waterStatus === 'URGENT') {
    actionableSummary = 'Add water to the reservoir immediately.';
  } else if (nutrientStatus === 'URGENT') {
    actionableSummary = 'Check and balance nutrient solution.';
  } else if (waterStatus === 'ATTENTION') {
    actionableSummary = 'Water level is getting low.';
  } else if (nutrientStatus === 'ATTENTION') {
    actionableSummary = 'Nutrients may need attention.';
  } else if (cameraStatus === 'LOW_CONFIDENCE') {
    actionableSummary = 'Move the camera closer to the plant for a better view.';
  } else if (plantStatus === 'GOOD') {
    actionableSummary = 'Your plant is doing well. All systems normal.';
  }

  return {
    plantStatus,
    environmentStatus,
    waterStatus,
    nutrientStatus,
    cameraStatus,
    plantMessage,
    environmentMessage,
    waterMessage,
    nutrientMessage,
    cameraMessage,
    plantColor,
    waterColor,
    nutrientColor,
    cameraColor,
    actionableSummary,
    hasSufficientData,
  };
}
