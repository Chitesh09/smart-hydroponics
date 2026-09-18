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
    title: string;
    addWater: string;
    checkNutrients: string;
    waterLow: string;
    nutrientsAttention: string;
    moveCamera: string;
    allGood: string;
    noActionNeeded: string;
    viewMore: string;
    hideMore: string;
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
  nav: {
    observation: string;
    intelligence: string;
    system: string;
    plantCommand: string;
    reasoningLab: string;
    plantJourney: string;
    iotStation: string;
    settings: string;
    operator: string;
    grower: string;
    nodeStable: string;
    nodeCalibrating: string;
    nodeActionRequired: string;
    signOut: string;
    livingIntelligence: string;
  };
  analytics: {
    title: string;
    subtitle: string;
    exportCsv: string;
    lifecycleOf: string;
    baselineProfile: string;
    lifecycleDescFarmer: string;
    lifecycleDescTech: string;
    checkpointsCount: string;
    dataIntervalsCount: string;
    waterAcidityTitleFarmer: string;
    waterAcidityTitleTech: string;
    waterAcidityTargetFarmer: string;
    waterAcidityTargetTech: string;
    waterAcidityDescFarmer: string;
    waterAcidityDescTech: string;
    nutrientFoodTitleFarmer: string;
    nutrientFoodTitleTech: string;
    nutrientFoodTargetFarmer: string;
    nutrientFoodTargetTech: string;
    nutrientFoodDescFarmer: string;
    nutrientFoodDescTech: string;
    reservoirTitleFarmer: string;
    reservoirTitleTech: string;
    reservoirTargetFarmer: string;
    reservoirTargetTech: string;
    reservoirDescFarmer: string;
    reservoirDescTech: string;
    initialBaseline: string;
    netShift: string;
    milestonesTitle: string;
    milestonesSubtitle: string;
    milestoneBaselineTitle: string;
    milestoneBaselineDescFarmer: string;
    milestoneBaselineDescTech: string;
    milestoneCheckpointTitle: string;
    milestoneCheckpointDescFarmer: string;
    milestoneCheckpointDescTech: string;
    chartSectionTitleFarmer: string;
    chartSectionTitleTech: string;
    chartSectionSubFarmer: string;
    chartSectionSubTech: string;
    phChartTitleFarmer: string;
    phChartTitleTech: string;
    tdsChartTitleFarmer: string;
    tdsChartTitleTech: string;
    waterChartTitleFarmer: string;
    waterChartTitleTech: string;
    archiveTitleFarmer: string;
    archiveTitleTech: string;
    archiveSnapshots: string;
    archiveEmptyFarmer: string;
    archiveEmptyTech: string;
    thTimestamp: string;
    thSpecimen: string;
    thVisualHealth: string;
    thPh: string;
    thTds: string;
    thWater: string;
    thStatus: string;
    qualitativeBalanced: string;
    qualitativeAdequate: string;
    qualitativeNormal: string;
    qualitativeGood: string;
    qualitativeAttention: string;
    statusHealthy: string;
    statusStable: string;
    statusWarning: string;
  };
  devices: {
    title: string;
    subtitle: string;
    simModeBtn: string;
    realSerialBtn: string;
    disconnectPort: string;
    connectPort: string;
    hardwareLink: string;
    deviceHealthScore: string;
    activeTelemetryMode: string;
    sensorDiagnostics: string;
    calibrationPanel: string;
    liveTelemetryTerminal: string;
    saveCalibration: string;
    resetDefaults: string;
    clearLogs: string;
    online: string;
    offline: string;
    stale: string;
    directUsb: string;
    simHardware: string;
    techModeRequiredTitle: string;
    techModeRequiredDesc: string;
    switchToTechBtn: string;
    returnDashboardBtn: string;
  };
  settings: {
    title: string;
    subtitle: string;
    operatorRole: string;
    accountDetails: string;
    displayName: string;
    email: string;
    saveChanges: string;
    saving: string;
    signOut: string;
    profileUpdated: string;
    profileUpdateFailed: string;
    preferences: string;
    activeMode: string;
    activeLanguage: string;
    verified: string;
    signingOut: string;
    identity: string;
    authProvider: string;
    credentials: string;
    emailManaged: string;
    safetyFailsafe: string;
    safetyFailsafeDesc: string;
    activeBadge: string;
    telemetryInterval: string;
    telemetryIntervalDesc: string;
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
      title: 'What should I do now?',
      addWater: 'Add water to the reservoir immediately.',
      checkNutrients: 'Check and balance nutrient solution.',
      waterLow: 'Water level is getting low.',
      nutrientsAttention: 'Nutrients may need attention.',
      moveCamera: 'Move the camera closer to the plant for a better view.',
      allGood: 'Your plant is doing well. All systems normal.',
      noActionNeeded: 'No action is needed based on the information currently available.',
      viewMore: 'View additional recommendation(s)',
      hideMore: 'Hide additional recommendations',
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
    nav: {
      observation: 'Observation',
      intelligence: 'Intelligence',
      system: 'System',
      plantCommand: 'Plant Command',
      reasoningLab: 'Reasoning Lab',
      plantJourney: 'Plant Journey',
      iotStation: 'IoT Station',
      settings: 'Settings',
      operator: 'Operator',
      grower: 'Grower',
      nodeStable: 'Biological Node Stable',
      nodeCalibrating: 'Calibrating Telemetry',
      nodeActionRequired: 'Action Required',
      signOut: 'Sign Out',
      livingIntelligence: 'Living Intelligence',
    },
    analytics: {
      title: 'Plant Journey & Analytics',
      subtitle: 'Historical Plant Journey',
      exportCsv: 'Export Journey CSV',
      lifecycleOf: 'Cultivation Lifecycle of',
      baselineProfile: 'Baseline Profile',
      lifecycleDescFarmer: 'Track how your plant has been doing over time, water usage, and growth health.',
      lifecycleDescTech: 'Longitudinal cultivation timeline tracking parameter drift, nutrient consumption, and visual checkpoints.',
      checkpointsCount: 'Checkpoints',
      dataIntervalsCount: 'Data Intervals',
      waterAcidityTitleFarmer: 'Water Acidity & Balance',
      waterAcidityTitleTech: 'pH Stability Drift',
      waterAcidityTargetFarmer: 'Target: Balanced',
      waterAcidityTargetTech: 'Target: 5.5 – 6.5 pH',
      waterAcidityDescFarmer: 'Good water balance keeps roots healthy and absorbs nutrients.',
      waterAcidityDescTech: 'Estimated drift rate:',
      nutrientFoodTitleFarmer: 'Plant Nutrient Food',
      nutrientFoodTitleTech: 'TDS Nutrient Consumption',
      nutrientFoodTargetFarmer: 'Target: Adequate',
      nutrientFoodTargetTech: 'Target: 800 – 1200 PPM',
      nutrientFoodDescFarmer: 'The plant is absorbing food solution at a steady rate.',
      nutrientFoodDescTech: 'Depletion rate:',
      reservoirTitleFarmer: 'Water Reservoir Level',
      reservoirTitleTech: 'Water Reservoir Depletion',
      reservoirTargetFarmer: 'Safe Capacity',
      reservoirTargetTech: 'Critical: < 20%',
      reservoirDescFarmer: 'Sufficient water remaining in the tank.',
      reservoirDescTech: 'Estimated refill in',
      initialBaseline: 'Initial baseline',
      netShift: 'net shift',
      milestonesTitle: 'Chronological Growth Milestones',
      milestonesSubtitle: 'Historical Timeline',
      milestoneBaselineTitle: 'Cultivation Observation Initialized',
      milestoneBaselineDescFarmer: 'Initial plant monitoring started. Water and plant appearance recorded.',
      milestoneBaselineDescTech: 'Baseline sensory telemetry active. Optical foliage inspection established.',
      milestoneCheckpointTitle: 'Observation Checkpoint',
      milestoneCheckpointDescFarmer: 'Plant check recorded: healthy conditions maintained.',
      milestoneCheckpointDescTech: 'Sensors recorded pH and TDS with active reservoir.',
      chartSectionTitleFarmer: 'Plant Condition & Water History',
      chartSectionTitleTech: 'Longitudinal Measurement Trajectories',
      chartSectionSubFarmer: 'Visual view of how your water and nutrients changed over time',
      chartSectionSubTech: 'Historical Trends Over Time',
      phChartTitleFarmer: 'Water Balance History',
      phChartTitleTech: 'pH Acidity Trajectory',
      tdsChartTitleFarmer: 'Nutrient Level History',
      tdsChartTitleTech: 'Nutrient TDS Consumption (PPM)',
      waterChartTitleFarmer: 'Water Reservoir History',
      waterChartTitleTech: 'Reservoir Water Level Capacity (%)',
      archiveTitleFarmer: 'Past Plant Checks',
      archiveTitleTech: 'Historical Observation Archive',
      archiveSnapshots: 'Recorded Snapshots',
      archiveEmptyFarmer: 'No plant checks logged yet. Checks are recorded when you view or scan the plant on the Dashboard.',
      archiveEmptyTech: 'No observation checkpoints logged yet. Checkpoints are recorded during plant scans on the Dashboard.',
      thTimestamp: 'Timestamp',
      thSpecimen: 'Specimen',
      thVisualHealth: 'Plant Health',
      thPh: 'Water Acidity',
      thTds: 'Nutrients',
      thWater: 'Reservoir',
      thStatus: 'Status',
      qualitativeBalanced: 'Balanced',
      qualitativeAdequate: 'Adequate',
      qualitativeNormal: 'Normal',
      qualitativeGood: 'Good',
      qualitativeAttention: 'Attention',
      statusHealthy: 'Healthy',
      statusStable: 'Stable',
      statusWarning: 'Attention',
    },
    devices: {
      title: 'IoT Station',
      subtitle: 'Hardware device management, ESP32 Web Serial pipeline, sensor health status, simulation mode, and technical diagnostics.',
      simModeBtn: 'Simulation Mode',
      realSerialBtn: 'Real ESP32 Serial',
      disconnectPort: 'Disconnect Port',
      connectPort: 'Connect ESP32 Serial',
      hardwareLink: 'Hardware Link',
      deviceHealthScore: 'Device Health Score',
      activeTelemetryMode: 'Telemetry Stream',
      sensorDiagnostics: 'Sensor Diagnostics & Signal Health',
      calibrationPanel: 'Sensor Calibration & Offsets',
      liveTelemetryTerminal: 'Raw Telemetry & Packet Log',
      saveCalibration: 'Save Calibration',
      resetDefaults: 'Reset Defaults',
      clearLogs: 'Clear Terminal',
      online: 'ONLINE',
      offline: 'OFFLINE',
      stale: 'STALE',
      directUsb: 'Direct USB Web Serial (115200 Baud)',
      simHardware: 'Local Simulated Hardware Stream',
      techModeRequiredTitle: 'Technical Mode Required',
      techModeRequiredDesc: 'The IoT Station is a technical hardware and sensor management area containing ESP32 diagnostics, serial configurations, and telemetry calibration. To access this station, switch to Technical Mode.',
      switchToTechBtn: 'Switch to Technical Mode',
      returnDashboardBtn: 'Return to Plant Command',
    },
    settings: {
      title: 'Station Settings & Profile',
      subtitle: 'Operator credentials, station authentication, and platform preferences.',
      operatorRole: 'Farm Station Operator',
      accountDetails: 'Profile Information',
      displayName: 'Display Name',
      email: 'Email Address',
      saveChanges: 'Save Changes',
      saving: 'Saving...',
      signOut: 'Sign Out',
      profileUpdated: 'Profile settings updated successfully!',
      profileUpdateFailed: 'Failed to update profile settings.',
      preferences: 'System Preferences',
      activeMode: 'Active Experience Mode',
      activeLanguage: 'Interface Language',
      verified: 'Firebase Verified',
      signingOut: 'Signing out...',
      identity: 'Operator Identity',
      authProvider: 'Auth Provider',
      credentials: 'Operator Credentials',
      emailManaged: 'Email is managed through Firebase Authentication.',
      safetyFailsafe: 'Autonomous Safety Failsafe',
      safetyFailsafeDesc: 'Prevent chemical dosing over-correction lockouts',
      activeBadge: 'ACTIVE',
      telemetryInterval: 'Telemetry Interval',
      telemetryIntervalDesc: 'ESP32 serial baud rate streaming at 115200 bps',
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
      title: 'ನಾನು ಈಗ ಏನು ಮಾಡಬೇಕು?',
      addWater: 'ತೊಟ್ಟಿಗೆ ಕೂಡಲೇ ನೀರನ್ನು ಹಾಕಿ.',
      checkNutrients: 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಸರಿಪಡಿಸಿ.',
      waterLow: 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ.',
      nutrientsAttention: 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ಪರೀಕ್ಷಿಸಿ.',
      moveCamera: 'ಉತ್ತಮ ನೋಟಕ್ಕಾಗಿ ಕ್ಯಾಮೆರಾವನ್ನು ಗಿಡದ ಹತ್ತಿರಕ್ಕೆ ತನ್ನಿ.',
      allGood: 'ನಿಮ್ಮ ಗಿಡ ಚೆನ್ನಾಗಿದೆ. ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ.',
      noActionNeeded: 'ಲಭ್ಯವಿರುವ ಮಾಹಿತಿಯ ಪ್ರಕಾರ ಯಾವುದೇ ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ.',
      viewMore: 'ಹೆಚ್ಚುವರಿ ಶಿಫಾರಸುಗಳನ್ನು ವೀಕ್ಷಿಸಿ',
      hideMore: 'ಹೆಚ್ಚುವರಿ ಶಿಫಾರಸುಗಳನ್ನು ಮರೆಮಾಡಿ',
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
    nav: {
      observation: 'ವೀಕ್ಷಣೆ',
      intelligence: 'ವಿವರಣೆ',
      system: 'ವ್ಯವಸ್ಥೆ',
      plantCommand: 'ಮುಖ್ಯ ಕೇಂದ್ರ',
      reasoningLab: 'ವಿವರಣಾ ಲ್ಯಾಬ್',
      plantJourney: 'ಗಿಡದ ಇತಿಹಾಸ',
      iotStation: 'ಸಾಧನ ಕೇಂದ್ರ',
      settings: 'ಸೆಟ್ಟಿಂಗ್ಸ್',
      operator: 'ನಿರ್ವಾಹಕರು',
      grower: 'ರೈತರು',
      nodeStable: 'ವ್ಯವಸ್ಥೆ ಸ್ಥಿರವಾಗಿದೆ',
      nodeCalibrating: 'ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ',
      nodeActionRequired: 'ಕ್ರಮ ಅಗತ್ಯವಿದೆ',
      signOut: 'ಲಾಗ್ ಔಟ್',
      livingIntelligence: 'ಗಿಡದ ಸ್ಮಾರ್ಟ್ ನಿಗಾ',
    },
    analytics: {
      title: 'ಗಿಡದ ಬೆಳವಣಿಗೆಯ ಇತಿಹಾಸ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ',
      subtitle: 'ಗಿಡದ ಇತಿಹಾಸ',
      exportCsv: 'ಇತಿಹಾಸ CSV ಡೌನ್‌ಲೋಡ್',
      lifecycleOf: 'ಬೆಳವಣಿಗೆಯ ಇತಿಹಾಸ:',
      baselineProfile: 'ಮೂಲ ವಿವರ',
      lifecycleDescFarmer: 'ಕಾಲಕ್ರಮೇಣ ಗಿಡದ ಬೆಳವಣಿಗೆ, ನೀರಿನ ಬಳಕೆ ಮತ್ತು ಆರೋಗ್ಯದ ವಿವರಗಳನ್ನು ಇಲ್ಲಿ ನೋಡಬಹುದು.',
      lifecycleDescTech: 'ಕಾಲಕ್ರಮೇಣ ನಿಯತಾಂಕಗಳ ಬದಲಾವಣೆ, ಪೋಷಕಾಂಶಗಳ ಬಳಕೆ ಮತ್ತು ಕ್ಯಾಮೆರಾ ತಪಾಸಣೆಗಳ ಕಾಲರೇಖೆ.',
      checkpointsCount: 'ತಪಾಸಣೆಗಳು',
      dataIntervalsCount: 'ಡೇಟಾ ದಾಖಲೆಗಳು',
      waterAcidityTitleFarmer: 'ನೀರಿನ ಸಮತೋಲನ (ಆಮ್ಲೀಯತೆ)',
      waterAcidityTitleTech: 'pH ಸ್ಥಿರತೆಯ ಬದಲಾವಣೆ',
      waterAcidityTargetFarmer: 'ಗುರಿ: ಸಮತೋಲನ',
      waterAcidityTargetTech: 'ಗುರಿ: 5.5 – 6.5 pH',
      waterAcidityDescFarmer: 'ಉತ್ತಮ ನೀರಿನ ಸಮತೋಲನವು ಬೇರುಗಳನ್ನು ಆರೋಗ್ಯವಾಗಿರಿಸುತ್ತದೆ.',
      waterAcidityDescTech: 'ಅಂದಾಜು ದಿನದ ಬದಲಾವಣೆ ದರ:',
      nutrientFoodTitleFarmer: 'ಗಿಡದ ಪೋಷಕಾಂಶದ ಆಹಾರ',
      nutrientFoodTitleTech: 'TDS ಪೋಷಕಾಂಶಗಳ ಬಳಕೆ',
      nutrientFoodTargetFarmer: 'ಗುರಿ: ಸೂಕ್ತ ಪ್ರಮಾಣ',
      nutrientFoodTargetTech: 'ಗುರಿ: 800 – 1200 PPM',
      nutrientFoodDescFarmer: 'ಗಿಡವು ಸೂಕ್ತ ಪ್ರಮಾಣದಲ್ಲಿ ಪೋಷಕಾಂಶಗಳನ್ನು ಹೀರಿಕೊಳ್ಳುತ್ತಿದೆ.',
      nutrientFoodDescTech: 'ಖಾಲಿಯಾಗುವ ದರ:',
      reservoirTitleFarmer: 'ತೊಟ್ಟಿಯ ನೀರಿನ ಮಟ್ಟ',
      reservoirTitleTech: 'ತೊಟ್ಟಿಯ ನೀರಿನ ಬಳಕೆ',
      reservoirTargetFarmer: 'ಸುರಕ್ಷಿತ ಮಟ್ಟ',
      reservoirTargetTech: 'ತುರ್ತು ಮಟ್ಟ: < 20%',
      reservoirDescFarmer: 'ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರಿನ ಮಟ್ಟ ಸಾಕಷ್ಟಿದೆ.',
      reservoirDescTech: 'ಅಂದಾಜು ಮರುಪೂರಣ:',
      initialBaseline: 'ಆರಂಭಿಕ ಸ್ಥಿತಿ',
      netShift: 'ಬದಲಾವಣೆ',
      milestonesTitle: 'ಬೆಳವಣಿಗೆಯ ಹಂತಗಳು ಮತ್ತು ಇತಿಹಾಸ',
      milestonesSubtitle: 'ಕಾಲಾನುಕ್ರಮ ಇತಿಹಾಸ',
      milestoneBaselineTitle: 'ಗಿಡದ ಪರಿಶೀಲನೆ ಆರಂಭಿಸಲಾಗಿದೆ',
      milestoneBaselineDescFarmer: 'ಗಿಡದ ಆರಂಭಿಕ ನಿಗಾ ಶುರುವಾಗಿದೆ. ನೀರು ಮತ್ತು ಗಿಡದ ಸ್ಥಿತಿ ದಾಖಲಾಗಿದೆ.',
      milestoneBaselineDescTech: 'ಮೂಲ ಸಂವೇದಕ ಟೆಲಿಮೆಟ್ರಿ ಸಕ್ರಿಯವಾಗಿದೆ. ಎಲೆಗಳ ತಪಾಸಣೆ ಸ್ಥಾಪಿಸಲಾಗಿದೆ.',
      milestoneCheckpointTitle: 'ಪರಿಶೀಲನಾ ಹಂತ',
      milestoneCheckpointDescFarmer: 'ಗಿಡ ಪರಿಶೀಲಿಸಲಾಗಿದೆ: ಆರೋಗ್ಯಕರ ಬೆಳವಣಿಗೆ ಮುಂದುವರೆದಿದೆ.',
      milestoneCheckpointDescTech: 'ಸಂವೇದಕಗಳು pH, TDS ಮತ್ತು ನೀರಿನ ಮಟ್ಟ ದಾಖಲಿಸಿವೆ.',
      chartSectionTitleFarmer: 'ಗಿಡದ ಪರಿಸ್ಥಿತಿಯ ಇತಿಹಾಸ ಚಾರ್ಟ್‌ಗಳು',
      chartSectionTitleTech: 'ದೀರ್ಘಕಾಲೀನ ಸಂವೇದಕ ಮಾಪನ ರೇಖೆಗಳು',
      chartSectionSubFarmer: 'ನೀರು ಮತ್ತು ಪೋಷಕಾಂಶಗಳು ಹೇಗೆ ಬದಲಾಗಿವೆ ಎಂಬುದರ ಚಿತ್ರಣ',
      chartSectionSubTech: 'ಕಾಲಕ್ರಮೇಣ ಐತಿಹಾಸಿಕ ಬದಲಾವಣೆಗಳು',
      phChartTitleFarmer: 'ನೀರಿನ ಸಮತೋಲನದ ಇತಿಹಾಸ',
      phChartTitleTech: 'pH ಆಮ್ಲೀಯತೆಯ ಕಾಲರೇಖೆ',
      tdsChartTitleFarmer: 'ಪೋಷಕಾಂಶ ಮಟ್ಟದ ಇತಿಹಾಸ',
      tdsChartTitleTech: 'TDS ಪೋಷಕಾಂಶಗಳ ಬಳಕೆ (PPM)',
      waterChartTitleFarmer: 'ತೊಟ್ಟಿಯ ನೀರಿನ ಇತಿಹಾಸ',
      waterChartTitleTech: 'ತೊಟ್ಟಿಯ ನೀರಿನ ಮಟ್ಟದ ಸಾಮರ್ಥ್ಯ (%)',
      archiveTitleFarmer: 'ಹಿಂದಿನ ಗಿಡದ ತಪಾಸಣೆಗಳು',
      archiveTitleTech: 'ಐತಿಹಾಸಿಕ ಅವಲೋಕನಗಳ ಸಂಗ್ರಹ',
      archiveSnapshots: 'ದಾಖಲಾದ ತಪಾಸಣೆಗಳು',
      archiveEmptyFarmer: 'ಇನ್ನೂ ಯಾವುದೇ ತಪಾಸಣೆಗಳು ದಾಖಲಾಗಿಲ್ಲ. ಮುಖಪುಟದಲ್ಲಿ ಗಿಡವನ್ನು ಪರಿಶೀಲಿಸಿದಾಗ ದಾಖಲೆಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.',
      archiveEmptyTech: 'ಯಾವುದೇ ಅವಲೋಕನ ದಾಖಲಾಗಿಲ್ಲ. ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿದಾಗ ದಾಖಲೆಗಳು ರೂಪುಗೊಳ್ಳುತ್ತವೆ.',
      thTimestamp: 'ಸಮಯ',
      thSpecimen: 'ಗಿಡದ ಮಾದರಿ',
      thVisualHealth: 'ಗಿಡದ ಆರೋಗ್ಯ',
      thPh: 'ನೀರಿನ ಆಮ್ಲೀಯತೆ (pH)',
      thTds: 'ಪೋಷಕಾಂಶಗಳು (TDS)',
      thWater: 'ತೊಟ್ಟಿ',
      thStatus: 'ಸ್ಥಿತಿ',
      qualitativeBalanced: 'ಸಮತೋಲನ',
      qualitativeAdequate: 'ಸಾಕಷ್ಟು',
      qualitativeNormal: 'ಸಾಮಾನ್ಯ',
      qualitativeGood: 'ಉತ್ತಮ',
      qualitativeAttention: 'ಗಮನಿಸಿ',
      statusHealthy: 'ಆರೋಗ್ಯಕರ',
      statusStable: 'ಸ್ಥಿರ',
      statusWarning: 'ಗಮನಿಸಿ',
    },
    devices: {
      title: 'IoT ಸಾಧನ ಕೇಂದ್ರ',
      subtitle: 'ಹಾರ್ಡ್‌ವೇರ್ ಸಾಧನ ನಿರ್ವಹಣೆ, ESP32 ವೆಬ್ ಸೀರಿಯಲ್ ಸಂಪರ್ಕ, ಸಂವೇದಕಗಳ ಆರೋಗ್ಯ ಮತ್ತು ತಾಂತ್ರಿಕ ರೋಗನಿರ್ಣಯ.',
      simModeBtn: 'ಸಿಮ್ಯುಲೇಶನ್ ಮೋಡ್',
      realSerialBtn: 'ನೈಜ ESP32 ಸೀರಿಯಲ್',
      disconnectPort: 'ಪೋರ್ಟ್ ಸಂಪರ್ಕ ಕಡಿತಗೊಳಿಸಿ',
      connectPort: 'ESP32 ಸೀರಿಯಲ್ ಸಂಪರ್ಕಿಸಿ',
      hardwareLink: 'ಹಾರ್ಡ್‌ವೇರ್ ಸಂಪರ್ಕ',
      deviceHealthScore: 'ಸಾಧನದ ಆರೋಗ್ಯ ಸ್ಕೋರ್',
      activeTelemetryMode: 'ಟೆಲಿಮೆಟ್ರಿ ಸ್ಟ್ರೀಮ್',
      sensorDiagnostics: 'ಸಂವೇದಕಗಳ ರೋಗನಿರ್ಣಯ ಮತ್ತು ಸಿಗ್ನಲ್ ಸ್ಥಿತಿ',
      calibrationPanel: 'ಸಂವೇದಕಗಳ ಮಾಪನಾಂಕ ನಿರ್ಣಯ (Calibration)',
      liveTelemetryTerminal: 'ಟೆಲಿಮೆಟ್ರಿ ಲಾಗ್‌ಗಳು ಮತ್ತು ಪ್ಯಾಕೆಟ್‌ಗಳು',
      saveCalibration: 'ಮಾಪನಾಂಕಗಳನ್ನು ಉಳಿಸಿ',
      resetDefaults: 'ಡೀಫಾಲ್ಟ್‌ಗೆ ಮರುಹೊಂದಿಸಿ',
      clearLogs: 'ಟರ್ಮಿನಲ್ ತೆರವುಗೊಳಿಸಿ',
      online: 'ಸಕ್ರಿಯ (ONLINE)',
      offline: 'ಸ್ಥಗಿತ (OFFLINE)',
      stale: 'ತಡೆಹಿಡಿಯಲಾಗಿದೆ (STALE)',
      directUsb: 'ನೇರ USB ವೆಬ್ ಸೀರಿಯಲ್ (115200 Baud)',
      simHardware: 'ಸ್ಥಳೀಯ ಸಿಮ್ಯುಲೇಟೆಡ್ ಹಾರ್ಡ್‌ವೇರ್ ಸ್ಟ್ರೀಮ್',
      techModeRequiredTitle: 'ತಾಂತ್ರಿಕ ಮೋಡ್ ಅಗತ್ಯವಿದೆ',
      techModeRequiredDesc: 'IoT ಸಾಧನ ಕೇಂದ್ರವು ESP32 ರೋಗನಿರ್ಣಯ, ಸೀರಿಯಲ್ ಸೆಟ್ಟಿಂಗ್ಸ್ ಮತ್ತು ಸಂವೇದಕಗಳ ಮಾಪನಾಂಕಗಳನ್ನು ಒಳಗೊಂಡ ತಾಂತ್ರಿಕ ಪ್ರದೇಶವಾಗಿದೆ. ಇದನ್ನು ಬಳಸಲು ತಾಂತ್ರಿಕ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ.',
      switchToTechBtn: 'ತಾಂತ್ರಿಕ ಮೋಡ್‌ಗೆ ಬದಲಿಸಿ',
      returnDashboardBtn: 'ಗಿಡದ ಮುಖ್ಯ ಕೇಂದ್ರಕ್ಕೆ ಹಿಂತಿರುಗಿ',
    },
    settings: {
      title: 'ಕೇಂದ್ರದ ಸೆಟ್ಟಿಂಗ್ಸ್ ಮತ್ತು ಪ್ರೊಫೈಲ್',
      subtitle: 'ಬಳಕೆದಾರರ ವಿವರಗಳು, ಕೇಂದ್ರದ ದೃಢೀಕರಣ ಮತ್ತು ವ್ಯವಸ್ಥೆಯ ಆದ್ಯತೆಗಳು.',
      operatorRole: 'ಕೃಷಿ ಕೇಂದ್ರದ ನಿರ್ವಾಹಕರು',
      accountDetails: 'ಪ್ರೊಫೈಲ್ ಮಾಹಿತಿ',
      displayName: 'ಹೆಸರು',
      email: 'ಇಮೇಲ್ ವಿಳಾಸ',
      saveChanges: 'ಬದಲಾವಣೆಗಳನ್ನು ಉಳಿಸಿ',
      saving: 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
      signOut: 'ಲಾಗ್ ಔಟ್',
      profileUpdated: 'ಪ್ರೊಫೈಲ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!',
      profileUpdateFailed: 'ಪ್ರೊಫೈಲ್ ನವೀಕರಣ ವಿಫಲವಾಗಿದೆ.',
      preferences: 'ವ್ಯವಸ್ಥೆಯ ಆದ್ಯತೆಗಳು',
      activeMode: 'ಪ್ರಸ್ತುತ ಮೋಡ್',
      activeLanguage: 'ಇಂಟರ್‌ಫೇಸ್ ಭಾಷೆ',
      verified: 'ದೃಢೀಕರಿಸಲಾಗಿದೆ',
      signingOut: 'ಲಾಗ್ ಔಟ್ ಆಗುತ್ತಿದೆ...',
      identity: 'ನಿರ್ವಾಹಕರ ಗುರುತು',
      authProvider: 'ದೃಢೀಕರಣ ಪೂರೈಕೆದಾರ',
      credentials: 'ನಿರ್ವಾಹಕರ ವಿವರಗಳು',
      emailManaged: 'ಇಮೇಲ್ ಅನ್ನು Firebase Authentication ಮೂಲಕ ನಿರ್ವಹಿಸಲಾಗುತ್ತದೆ.',
      safetyFailsafe: 'ಸ್ವಯಂಚಾಲಿತ ಸುರಕ್ಷತೆ',
      safetyFailsafeDesc: 'ರಾಸಾಯನಿಕ ಅಧಿಕ-ತಿದ್ದುಪಡಿ ಲಾಕ್‌ಔಟ್‌ಗಳನ್ನು ತಡೆಯಿರಿ',
      activeBadge: 'ಸಕ್ರಿಯ',
      telemetryInterval: 'ಟೆಲಿಮೆಟ್ರಿ ಮಧ್ಯಂತರ',
      telemetryIntervalDesc: 'ESP32 ಸೀರಿಯಲ್ ಬಾಡ್ ದರ 115200 bps ನಲ್ಲಿ ಸ್ಟ್ರೀಮಿಂಗ್ ಆಗುತ್ತಿದೆ',
    },
  },
};

/**
 * Safe copy getter that guarantees never returning undefined or null
 */
export function getFarmerCopy(lang: SupportedLanguageCode = 'en'): FarmerCopyGroup {
  return FARMER_COPY[lang] || FARMER_COPY['en'];
}

export const getAppCopy = getFarmerCopy;

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
