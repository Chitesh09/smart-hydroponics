// ============================================================
// HydroSmart — Farmer-Friendly Semantic Interpretation Layer
// Centralized Human Status Derivation & Bilingual Copy Dictionary
// Strictly Text-to-Text: English (en) and Simple Kannada (kn)
// ============================================================

import {
  MultimodalHealthAssessment,
  EnvironmentalAssessment,
  PlantDetectionResult,
  VisualHealthAnalysisResult,
  AnomalyReport
} from './types';
import { SupportedLanguageCode } from '@/lib/assistant/assistantConfig';

export type PlantStatusLevel = 'GOOD' | 'ATTENTION' | 'URGENT' | 'UNKNOWN';
export type EnvironmentStatusLevel = 'GOOD' | 'ATTENTION' | 'URGENT' | 'UNKNOWN';
export type WaterStatusLevel = 'GOOD' | 'ATTENTION' | 'URGENT' | 'UNKNOWN';
export type NutrientStatusLevel = 'GOOD' | 'ATTENTION' | 'URGENT' | 'UNKNOWN';
export type CameraStatusLevel = 'PLANT_DETECTED' | 'NO_PLANT' | 'LOW_CONFIDENCE' | 'SCAN_NOT_READY';

export interface FarmerSemanticState {
  // Active language
  language: SupportedLanguageCode;

  // Core status levels
  plantStatus: PlantStatusLevel;
  environmentStatus: EnvironmentStatusLevel;
  waterStatus: WaterStatusLevel;
  nutrientStatus: NutrientStatusLevel;
  cameraStatus: CameraStatusLevel;

  // Standardized human interpretation wording (localized)
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

  // Badges & Actionable Guidance for Farmers (localized)
  actionableSummary: string;
  hasSufficientData: boolean;
}

export interface FarmerCopyGroup {
  plant: Record<PlantStatusLevel, string>;
  water: Record<WaterStatusLevel, string>;
  nutrient: Record<NutrientStatusLevel, string>;
  camera: Record<CameraStatusLevel, string>;
  environment: Record<EnvironmentStatusLevel, string>;
  actions: {
    addWater: string;
    checkNutrients: string;
    waterLow: string;
    nutrientsAttention: string;
    moveCamera: string;
    allGood: string;
    noActionNeeded: string;
  };
  ui: {
    whatShouldIDo: string;
    currentCondition: string;
    whyNeedsAttention: string;
    whyDoingWell: string;
    whyNeedMoreInfo: string;
    cameraEvidence: string;
    waterEvidence: string;
    historyEvidence: string;
    confidenceHigh: string;
    confidenceModerate: string;
    confidenceTentative: string;
    confidenceUnverified: string;
    noPlant: string;
    cameraUnclear: string;
    cameraOffline: string;
    waterDecreased: string;
    waterBalanced: string;
    historyChanged: string;
    historyStable: string;
    historyBaseline: string;
    whatChangedToday: string;
    notEnoughHistory: string;
    plantNotIdentified: string;
    plantCommandCenter: string;
    plantEnvironmentSummary: string;
    everythingStable: string;
    allParametersOptimal: string;
    startLiveCamera: string;
    openReasoningLab: string;
    diagnosticWorkspace: string;
    plantReasoningLab: string;
    reasoningSubtitle: string;
    evidenceUsedBySystem: string;
    botanicalEvidenceChain: string;
    recommendedAction: string;
    actionGuidance: string;
    why: string;
    waterLevelLabel: string;
    nutrientLevelLabel: string;
    solutionAcidityLabel: string;
    growingConditionsLabel: string;
  };
}

export const FARMER_COPY: Record<SupportedLanguageCode, FarmerCopyGroup> = {
  en: {
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
    actions: {
      addWater: 'Add water to the reservoir immediately.',
      checkNutrients: 'Check and balance nutrient solution.',
      waterLow: 'Water level is getting low.',
      nutrientsAttention: 'Nutrients may need attention.',
      moveCamera: 'Move the camera closer to the plant for a better view.',
      allGood: 'Your plant is doing well. All systems normal.',
      noActionNeeded: 'No action is needed based on the information currently available.',
    },
    ui: {
      whatShouldIDo: 'What should I do now?',
      currentCondition: 'Current Plant Condition',
      whyNeedsAttention: 'Why does HydroSmart think your plant needs attention?',
      whyDoingWell: 'Why does HydroSmart think your plant is doing well?',
      whyNeedMoreInfo: 'Why does HydroSmart need more information?',
      cameraEvidence: 'Camera',
      waterEvidence: 'Water & Nutrients',
      historyEvidence: 'History',
      confidenceHigh: 'Confidence: High',
      confidenceModerate: 'Confidence: Moderate',
      confidenceTentative: 'Confidence: Tentative',
      confidenceUnverified: 'Confidence: Unverified',
      noPlant: 'No plant detected in camera frame',
      cameraUnclear: 'Camera view is unclear. Move closer or improve lighting.',
      cameraOffline: 'Camera feed is offline. Check hardware connection.',
      waterDecreased: 'Water level decreased below normal',
      waterBalanced: 'Water level and nutrients are in balance',
      historyChanged: 'Change observed over time',
      historyStable: 'Parameters have remained stable over time',
      historyBaseline: 'Baseline observation established',
      whatChangedToday: 'What Changed Today',
      notEnoughHistory: 'Not enough history yet',
      plantNotIdentified: 'Plant type not identified yet',
      plantCommandCenter: 'Plant Command Center',
      plantEnvironmentSummary: 'Plant Environment Summary',
      everythingStable: 'Everything Looks Stable',
      allParametersOptimal: 'All biological parameters and environmental channels are within optimal ranges.',
      startLiveCamera: 'Start Live Plant Camera',
      openReasoningLab: 'Open Plant Reasoning Lab',
      diagnosticWorkspace: 'Diagnostic Workspace',
      plantReasoningLab: 'Plant Reasoning Lab',
      reasoningSubtitle: 'Understanding why HydroSmart reached its conclusions.',
      evidenceUsedBySystem: 'Evidence Used by the System',
      botanicalEvidenceChain: 'Botanical Evidence Chain',
      recommendedAction: 'Recommended Action',
      actionGuidance: 'Action Guidance',
      why: 'Why:',
      waterLevelLabel: 'Water Level',
      nutrientLevelLabel: 'Nutrient Balance',
      solutionAcidityLabel: 'Solution Acidity',
      growingConditionsLabel: 'Growing Conditions',
    },
  },
  kn: {
    plant: {
      GOOD: 'ನಿಮ್ಮ ಗಿಡ ಚೆನ್ನಾಗಿದೆ.',
      ATTENTION: 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ.',
      URGENT: 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ತಕ್ಷಣ ಗಮನ ಬೇಕಾಗಿದೆ.',
      UNKNOWN: 'ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಬೇಕಾಗಿದೆ.',
    },
    water: {
      GOOD: 'ನೀರಿನ ಮಟ್ಟ ಸರಿಯಾಗಿದೆ.',
      ATTENTION: 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ.',
      URGENT: 'ನೀರಿನ ಮಟ್ಟ ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ, ಕೂಡಲೇ ನೀರು ತುಂಬಿಸಿ.',
      UNKNOWN: 'ನೀರಿನ ಮಟ್ಟ ತಿಳಿಯುತ್ತಿಲ್ಲ.',
    },
    nutrient: {
      GOOD: 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟ ಸರಿಯಾಗಿದೆ.',
      ATTENTION: 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ಪರೀಕ್ಷಿಸಬೇಕು.',
      URGENT: 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟ ಸರಿಪಡಿಸಬೇಕಾಗಿದೆ.',
      UNKNOWN: 'ಪೋಷಕಾಂಶಗಳ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.',
    },
    camera: {
      PLANT_DETECTED: 'ಗಿಡ ಪತ್ತೆಯಾಗಿದೆ.',
      NO_PLANT: 'ಗಿಡ ಕಂಡುಬಂದಿಲ್ಲ.',
      LOW_CONFIDENCE: 'ಕ್ಯಾಮೆರಾವನ್ನು ಗಿಡದ ಹತ್ತಿರಕ್ಕೆ ತಂದು ನೋಡಿ.',
      SCAN_NOT_READY: 'ಕ್ಯಾಮೆರಾ ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ.',
    },
    environment: {
      GOOD: 'ಬೆಳವಣಿಗೆಯ ವಾತಾವರಣ ಉತ್ತಮವಾಗಿದೆ.',
      ATTENTION: 'ವಾತಾವರಣದಲ್ಲಿ ಸ್ವಲ್ಪ ಬದಲಾವಣೆ ಅಗತ್ಯವಿದೆ.',
      URGENT: 'ವಾತಾವರಣವನ್ನು ತಕ್ಷಣ ಸರಿಪಡಿಸಬೇಕು.',
      UNKNOWN: 'ವಾತಾವರಣದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.',
    },
    actions: {
      addWater: 'ತೊಟ್ಟಿಗೆ ಕೂಡಲೇ ನೀರನ್ನು ಹಾಕಿ.',
      checkNutrients: 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಸರಿಪಡಿಸಿ.',
      waterLow: 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ.',
      nutrientsAttention: 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ಪರೀಕ್ಷಿಸಿ.',
      moveCamera: 'ಉತ್ತಮ ನೋಟಕ್ಕಾಗಿ ಕ್ಯಾಮೆರಾವನ್ನು ಗಿಡದ ಹತ್ತಿರಕ್ಕೆ ತನ್ನಿ.',
      allGood: 'ನಿಮ್ಮ ಗಿಡ ಚೆನ್ನಾಗಿದೆ. ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ.',
      noActionNeeded: 'ಲಭ್ಯವಿರುವ ಮಾಹಿತಿಯ ಪ್ರಕಾರ ಯಾವುದೇ ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ.',
    },
    ui: {
      whatShouldIDo: 'ಈಗ ನಾನು ಏನು ಮಾಡಬೇಕು?',
      currentCondition: 'ಈಗಿನ ಗಿಡದ ಸ್ಥಿತಿ',
      whyNeedsAttention: 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕು ಎಂದು ಹೈಡ್ರೋಸ್ಮಾರ್ಟ್ ಏಕೆ ಹೇಳುತ್ತಿದೆ?',
      whyDoingWell: 'ನಿಮ್ಮ ಗಿಡ ಚೆನ್ನಾಗಿದೆ ಎಂದು ಹೈಡ್ರೋಸ್ಮಾರ್ಟ್ ಏಕೆ ಹೇಳುತ್ತಿದೆ?',
      whyNeedMoreInfo: 'ಹೈಡ್ರೋಸ್ಮಾರ್ಟ್ ಗೆ ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಏಕೆ ಬೇಕು?',
      cameraEvidence: 'ಕ್ಯಾಮೆರಾ',
      waterEvidence: 'ನೀರು ಮತ್ತು ಪೋಷಕಾಂಶಗಳು',
      historyEvidence: 'ಹಿಂದಿನ ಇತಿಹಾಸ',
      confidenceHigh: 'ವಿಶ್ವಾಸಾರ್ಹತೆ: ಹೆಚ್ಚು',
      confidenceModerate: 'ವಿಶ್ವಾಸಾರ್ಹತೆ: ಸಾಧಾರಣ',
      confidenceTentative: 'ವಿಶ್ವಾಸಾರ್ಹತೆ: ಕಡಿಮೆ',
      confidenceUnverified: 'ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ',
      noPlant: 'ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಗಿಡ ಕಂಡುಬಂದಿಲ್ಲ.',
      cameraUnclear: 'ಕ್ಯಾಮೆರಾ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ಹತ್ತಿರ ತನ್ನಿ ಅಥವಾ ಬೆಳಕು ಹೆಚ್ಚಿಸಿ.',
      cameraOffline: 'ಕ್ಯಾಮೆರಾ ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ. ಹಾರ್ಡ್‌ವೇರ್ ಪರಿಶೀಲಿಸಿ.',
      waterDecreased: 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ',
      waterBalanced: 'ನೀರು ಮತ್ತು ಪೋಷಕಾಂಶಗಳು ಸಮತೋಲನದಲ್ಲಿವೆ',
      historyChanged: 'ಕಾಲಕ್ರಮೇಣ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ',
      historyStable: 'ಕಾಲಕ್ರಮೇಣ ಸ್ಥಿರತೆ ಕಾಯ್ದುಕೊಂಡಿದೆ',
      historyBaseline: 'ಆರಂಭಿಕ ಅವಲೋಕನ ದಾಖಲಾಗಿದೆ',
      whatChangedToday: 'ಇವತ್ತಿನ ಬದಲಾವಣೆಗಳು',
      notEnoughHistory: 'ಇನ್ನೂ ಸಾಕಷ್ಟು ಇತಿಹಾಸವಿಲ್ಲ',
      plantNotIdentified: 'ಗಿಡದ ಪ್ರಕಾರ ಇನ್ನೂ ಗುರುತಿಸಿಲ್ಲ',
      plantCommandCenter: 'ಗಿಡದ ಮುಖ್ಯ ಕೇಂದ್ರ',
      plantEnvironmentSummary: 'ಗಿಡದ ಪರಿಸರ ಸಾರಾಂಶ',
      everythingStable: 'ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ',
      allParametersOptimal: 'ಎಲ್ಲಾ ನೀರಿನ ಮತ್ತು ಪರಿಸರದ ಮಟ್ಟಗಳು ಸೂಕ್ತವಾಗಿವೆ.',
      startLiveCamera: 'ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ',
      openReasoningLab: 'ಗಿಡದ ವಿವರಣಾ ಲ್ಯಾಬ್ ತೆರೆಯಿರಿ',
      diagnosticWorkspace: 'ರೋಗನಿರ್ಣಯ ಕಾರ್ಯಕ್ಷೇತ್ರ',
      plantReasoningLab: 'ಗಿಡದ ವಿವರಣಾ ಲ್ಯಾಬ್',
      reasoningSubtitle: 'ಹೈಡ್ರೋಸ್ಮಾರ್ಟ್ ಈ ತೀರ್ಮಾನಕ್ಕೆ ಏಕೆ ಬಂದಿದೆ ಎಂಬುದನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.',
      evidenceUsedBySystem: 'ವ್ಯವಸ್ಥೆ ಬಳಸಿದ ಪುರಾವೆಗಳು',
      botanicalEvidenceChain: 'ಪುರಾವೆಗಳ ಸರಣಿ',
      recommendedAction: 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮ',
      actionGuidance: 'ಮಾರ್ಗದರ್ಶನ',
      why: 'ಕಾರಣ:',
      waterLevelLabel: 'ನೀರಿನ ಮಟ್ಟ',
      nutrientLevelLabel: 'ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನ',
      solutionAcidityLabel: 'ನೀರಿನ ಆಮ್ಲೀಯತೆ (pH)',
      growingConditionsLabel: 'ಬೆಳವಣಿಗೆಯ ಪರಿಸ್ಥಿತಿ',
    },
  },
};

/**
 * Safe copy getter that guarantees never returning undefined or null
 */
export function getFarmerCopy(lang: SupportedLanguageCode = 'en'): FarmerCopyGroup {
  return FARMER_COPY[lang] || FARMER_COPY['en'];
}

export function deriveFarmerSemanticState({
  isTelemetryAvailable,
  latestReading,
  environmentalAssessment,
  multimodalAssessment,
  latestDetection,
  latestVisualHealth,
  activeAnomalies,
  isCameraActive,
  language = 'en',
}: {
  isTelemetryAvailable: boolean;
  latestReading: { ph: number; tds: number; waterLevel: number; distance: number } | null;
  environmentalAssessment: EnvironmentalAssessment;
  multimodalAssessment: MultimodalHealthAssessment;
  latestDetection: PlantDetectionResult | null;
  latestVisualHealth: VisualHealthAnalysisResult | null;
  activeAnomalies: AnomalyReport[];
  isCameraActive: boolean;
  language?: SupportedLanguageCode;
}): FarmerSemanticState {
  const copy = getFarmerCopy(language);
  const fallbackCopy = FARMER_COPY['en'];

  // 1. Water Status
  let waterStatus: WaterStatusLevel = 'UNKNOWN';
  let waterMessage = copy.water.UNKNOWN || fallbackCopy.water.UNKNOWN;
  let waterColor: 'green' | 'amber' | 'red' | 'gray' = 'gray';

  if (isTelemetryAvailable && latestReading !== null) {
    if (environmentalAssessment.waterLevelStatus === 'critical' || latestReading.waterLevel < 20) {
      waterStatus = 'URGENT';
      waterMessage = copy.water.URGENT || fallbackCopy.water.URGENT;
      waterColor = 'red';
    } else if (environmentalAssessment.waterLevelStatus === 'warning' || latestReading.waterLevel < 45) {
      waterStatus = 'ATTENTION';
      waterMessage = copy.water.ATTENTION || fallbackCopy.water.ATTENTION;
      waterColor = 'amber';
    } else {
      waterStatus = 'GOOD';
      waterMessage = copy.water.GOOD || fallbackCopy.water.GOOD;
      waterColor = 'green';
    }
  }

  // 2. Nutrient Status
  let nutrientStatus: NutrientStatusLevel = 'UNKNOWN';
  let nutrientMessage = copy.nutrient.UNKNOWN || fallbackCopy.nutrient.UNKNOWN;
  let nutrientColor: 'green' | 'amber' | 'red' | 'gray' = 'gray';

  if (isTelemetryAvailable && latestReading !== null) {
    if (environmentalAssessment.phStatus === 'critical' || environmentalAssessment.tdsStatus === 'critical') {
      nutrientStatus = 'URGENT';
      nutrientMessage = copy.nutrient.URGENT || fallbackCopy.nutrient.URGENT;
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
      nutrientMessage = copy.nutrient.ATTENTION || fallbackCopy.nutrient.ATTENTION;
      nutrientColor = 'amber';
    } else {
      nutrientStatus = 'GOOD';
      nutrientMessage = copy.nutrient.GOOD || fallbackCopy.nutrient.GOOD;
      nutrientColor = 'green';
    }
  }

  // 3. Environment Status
  let environmentStatus: EnvironmentStatusLevel = 'UNKNOWN';
  let environmentMessage = copy.environment.UNKNOWN || fallbackCopy.environment.UNKNOWN;

  if (waterStatus === 'URGENT' || nutrientStatus === 'URGENT') {
    environmentStatus = 'URGENT';
    environmentMessage = copy.environment.URGENT || fallbackCopy.environment.URGENT;
  } else if (waterStatus === 'ATTENTION' || nutrientStatus === 'ATTENTION') {
    environmentStatus = 'ATTENTION';
    environmentMessage = copy.environment.ATTENTION || fallbackCopy.environment.ATTENTION;
  } else if (waterStatus === 'GOOD' && nutrientStatus === 'GOOD') {
    environmentStatus = 'GOOD';
    environmentMessage = copy.environment.GOOD || fallbackCopy.environment.GOOD;
  }

  // 4. Camera Status
  let cameraStatus: CameraStatusLevel = 'SCAN_NOT_READY';
  let cameraMessage = copy.camera.SCAN_NOT_READY || fallbackCopy.camera.SCAN_NOT_READY;
  let cameraColor: 'teal' | 'amber' | 'red' | 'gray' = 'gray';

  if (isCameraActive) {
    if (latestDetection?.isPlantDetected) {
      if (latestDetection.confidence && latestDetection.confidence < 45) {
        cameraStatus = 'LOW_CONFIDENCE';
        cameraMessage = copy.camera.LOW_CONFIDENCE || fallbackCopy.camera.LOW_CONFIDENCE;
        cameraColor = 'amber';
      } else {
        cameraStatus = 'PLANT_DETECTED';
        cameraMessage = copy.camera.PLANT_DETECTED || fallbackCopy.camera.PLANT_DETECTED;
        cameraColor = 'teal';
      }
    } else {
      cameraStatus = 'NO_PLANT';
      cameraMessage = copy.camera.NO_PLANT || fallbackCopy.camera.NO_PLANT;
      cameraColor = 'amber';
    }
  }

  // 5. Overall Plant Status
  const hasSufficientData = isTelemetryAvailable || (isCameraActive && Boolean(latestDetection?.isPlantDetected));
  let plantStatus: PlantStatusLevel = 'UNKNOWN';
  let plantMessage = copy.plant.UNKNOWN || fallbackCopy.plant.UNKNOWN;
  let plantColor: 'green' | 'amber' | 'red' | 'gray' = 'gray';

  if (!hasSufficientData) {
    plantStatus = 'UNKNOWN';
    plantMessage = copy.plant.UNKNOWN || fallbackCopy.plant.UNKNOWN;
    plantColor = 'gray';
  } else if (
    multimodalAssessment.overallHealthState === 'critical' ||
    environmentStatus === 'URGENT' ||
    activeAnomalies.some(a => a.severity === 'critical')
  ) {
    plantStatus = 'URGENT';
    plantMessage = copy.plant.URGENT || fallbackCopy.plant.URGENT;
    plantColor = 'red';
  } else if (
    multimodalAssessment.overallHealthState === 'warning' ||
    environmentStatus === 'ATTENTION' ||
    activeAnomalies.length > 0 ||
    (latestDetection?.isPlantDetected && latestVisualHealth && latestVisualHealth.healthState !== 'healthy' && latestVisualHealth.healthState !== 'unknown')
  ) {
    plantStatus = 'ATTENTION';
    plantMessage = copy.plant.ATTENTION || fallbackCopy.plant.ATTENTION;
    plantColor = 'amber';
  } else {
    plantStatus = 'GOOD';
    plantMessage = copy.plant.GOOD || fallbackCopy.plant.GOOD;
    plantColor = 'green';
  }

  // Actionable Summary Wording (Localized)
  let actionableSummary = plantMessage;
  if (waterStatus === 'URGENT') {
    actionableSummary = copy.actions.addWater || fallbackCopy.actions.addWater;
  } else if (nutrientStatus === 'URGENT') {
    actionableSummary = copy.actions.checkNutrients || fallbackCopy.actions.checkNutrients;
  } else if (waterStatus === 'ATTENTION') {
    actionableSummary = copy.actions.waterLow || fallbackCopy.actions.waterLow;
  } else if (nutrientStatus === 'ATTENTION') {
    actionableSummary = copy.actions.nutrientsAttention || fallbackCopy.actions.nutrientsAttention;
  } else if (cameraStatus === 'LOW_CONFIDENCE') {
    actionableSummary = copy.actions.moveCamera || fallbackCopy.actions.moveCamera;
  } else if (plantStatus === 'GOOD') {
    actionableSummary = copy.actions.allGood || fallbackCopy.actions.allGood;
  }

  return {
    language,
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
