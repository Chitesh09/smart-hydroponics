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
  StructuredHealthState,
  AnomalyReport,
  MultimodalScenarioCode,
  WhatChangedSummary,
  PlantChangeEvent,
  PlantLifecycleState,
  MonitoringState,
  ProfileCompletenessStatus,
  PlantIdentificationStatus,
  PlantMilestone,
  PlantProfile,
  EnvironmentPlantAssociation,
  EnvironmentAssociationType,
  AssociationStrength,
  CorrelationAnalysisSummary,
  PlantAlert,
  PlantAlertSeverity,
  PlantAlertCategory,
  PlantAlertStatus,
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
  visualHealthStatus: StructuredHealthState;

  // Standardized human interpretation wording (localized)
  plantMessage: string;
  environmentMessage: string;
  waterMessage: string;
  nutrientMessage: string;
  cameraMessage: string;
  visualHealthMessage: string;

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
  visualHealth: Record<StructuredHealthState, string>;
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
    plantIdentified: string;
    identifying: string;
    identifySpeciesBtn: string;
    identificationReliable: string;
    identificationUncertain: string;
    unknownPlantType: string;
    modelUnavailable: string;
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
  reasoning: {
    title: string;
    subtitle: string;
    whatsHappening: string;
    whyHappening: string;
    whatShouldIDo: string;
    evidenceChain: string;
    observations: string;
    interpretations: string;
    recommendations: string;
    limitations: string;
    conflictingSignals: string;
    confidence: string;
    confidenceHigh: string;
    confidenceModerate: string;
    confidenceLow: string;
    confidenceInsufficient: string;
    sensorUnavailable: string;
    cameraUnavailable: string;
    insufficientHistory: string;
    noPlantDetected: string;
    poorImageQuality: string;
    unknownSpecies: string;
    stableEquilibrium: string;
    visualChangeOnly: string;
    correlatedStress: string;
    temporalAssociation: string;
    conflictingEvidence: string;
    environmentalAnomalyOnly: string;
    recovering: string;
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
      NO_PLANT: 'No plant detected. Place the plant in front of the camera.',
      LOW_CONFIDENCE: 'We can see something that may be a plant. Try moving closer.',
      SCAN_NOT_READY: "Camera view isn't ready yet.",
    },
    environment: {
      GOOD: 'Growing conditions are good',
      ATTENTION: 'Growing conditions need attention',
      URGENT: 'Growing conditions need urgent action',
      UNKNOWN: 'Unable to assess environment',
    },
    visualHealth: {
      HEALTHY: 'Your plant looks healthy 🌱',
      STABLE: 'Your plant looks stable.',
      ATTENTION: 'We noticed a visual change in your plant.',
      CRITICAL: 'Your plant needs attention.',
      RECOVERING: 'Your plant appears to be recovering.',
      UNKNOWN: 'Not enough visual information to assess plant health.',
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
      plantIdentified: 'Plant identified',
      identifying: 'Identifying plant species...',
      identifySpeciesBtn: 'Identify Plant Species',
      identificationReliable: 'Identification looks reliable.',
      identificationUncertain: "We're not fully sure yet. Try another scan.",
      unknownPlantType: 'Plant type could not be identified.',
      modelUnavailable: 'Plant identification is temporarily unavailable.',
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
    reasoning: {
      title: 'Multimodal Plant Reasoning',
      subtitle: 'Evidence-based cross-modal synthesis of camera vision, ESP32 telemetry, and historical trends.',
      whatsHappening: "What's happening?",
      whyHappening: 'Why might it be happening?',
      whatShouldIDo: 'What should I do now?',
      evidenceChain: 'Botanical Evidence Chain',
      observations: 'Direct Observations',
      interpretations: 'Possible Interpretations',
      recommendations: 'Actionable Steps',
      limitations: 'Limitations & Missing Data',
      conflictingSignals: 'Conflicting Signals',
      confidence: 'Reasoning Confidence',
      confidenceHigh: 'High Confidence',
      confidenceModerate: 'Moderate Confidence',
      confidenceLow: 'Low Confidence',
      confidenceInsufficient: 'Insufficient Evidence',
      sensorUnavailable: 'Environmental sensor readings are currently unavailable.',
      cameraUnavailable: 'Camera vision is currently offline.',
      insufficientHistory: 'Insufficient history to determine trajectory.',
      noPlantDetected: 'No plant detected in front of the camera.',
      poorImageQuality: 'Camera image quality is insufficient for visual analysis.',
      unknownSpecies: 'Botanical crop species is currently unclassified.',
      stableEquilibrium: 'Plant appears stable. No significant environmental change was detected.',
      visualChangeOnly: 'Increased leaf discoloration was detected without an environmental sensor anomaly.',
      correlatedStress: 'Leaf discoloration co-occurs with nutrient parameter shifts.',
      temporalAssociation: 'Plant visual condition changed during a period of decreasing water level.',
      conflictingEvidence: 'Foliage appears healthy, but an environmental sensor anomaly was detected.',
      environmentalAnomalyOnly: 'Water level has decreased significantly while leaves remain stable.',
      recovering: 'Plant is recovering nicely 🌿',
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
      NO_PLANT: 'ಗಿಡ ಕಂಡುಬಂದಿಲ್ಲ. ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಗಿಡವನ್ನು ಇರಿಸಿ.',
      LOW_CONFIDENCE: 'ಗಿಡವಿರುವಂತೆ ಕಾಣುತ್ತಿದೆ. ಕ್ಯಾಮೆರಾವನ್ನು ಹತ್ತಿರಕ್ಕೆ ತನ್ನಿ.',
      SCAN_NOT_READY: 'ಕ್ಯಾಮೆರಾ ಸಿದ್ಧವಾಗಿಲ್ಲ.',
    },
    environment: {
      GOOD: 'ಬೆಳವಣಿಗೆಯ ವಾತಾವರಣ ಉತ್ತಮವಾಗಿದೆ.',
      ATTENTION: 'ವಾತಾವರಣದಲ್ಲಿ ಸ್ವಲ್ಪ ಬದಲಾವಣೆ ಅಗತ್ಯವಿದೆ.',
      URGENT: 'ವಾತಾವರಣವನ್ನು ತಕ್ಷಣ ಸರಿಪಡಿಸಬೇಕು.',
      UNKNOWN: 'ವಾತಾವರಣದ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.',
    },
    visualHealth: {
      HEALTHY: 'ನಿಮ್ಮ ಗಿಡ ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತಿದೆ 🌱',
      STABLE: 'ನಿಮ್ಮ ಗಿಡ ಸ್ಥಿರವಾಗಿದೆ.',
      ATTENTION: 'ನಿಮ್ಮ ಗಿಡದಲ್ಲಿ ದೃಶ್ಯ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ.',
      CRITICAL: 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ತುರ್ತು ಗಮನ ಬೇಕಾಗಿದೆ.',
      RECOVERING: 'ನಿಮ್ಮ ಗಿಡ ಚೇತರಿಸಿಕೊಳ್ಳುತ್ತಿರುವಂತೆ ಕಾಣುತ್ತಿದೆ.',
      UNKNOWN: 'ಗಿಡದ ಆರೋಗ್ಯವನ್ನು ನಿರ್ಣಯಿಸಲು ಸಾಕಷ್ಟು ದೃಶ್ಯ ಮಾಹಿತಿಯಿಲ್ಲ.',
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
      plantIdentified: 'ಗಿಡ ಪತ್ತೆಯಾಗಿದೆ',
      identifying: 'ಗಿಡದ ಪ್ರಭೇದವನ್ನು ಗುರುತಿಸಲಾಗುತ್ತಿದೆ...',
      identifySpeciesBtn: 'ಗಿಡದ ಪ್ರಭೇದ ಗುರುತಿಸಿ',
      identificationReliable: 'ಗುರುತಿಸುವಿಕೆ ವಿಶ್ವಾಸಾರ್ಹವಾಗಿದೆ.',
      identificationUncertain: 'ಇನ್ನೂ ಸಂಪೂರ್ಣವಾಗಿ ಖಚಿತವಾಗಿಲ್ಲ. ಇನ್ನೊಮ್ಮೆ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.',
      unknownPlantType: 'ಗಿಡದ ಪ್ರಕಾರವನ್ನು ಗುರುತಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
      modelUnavailable: 'ಗಿಡ ಗುರುತಿಸುವಿಕೆ ತಾತ್ಕಾಲಿಕವಾಗಿ ಲಭ್ಯವಿಲ್ಲ.',
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
    reasoning: {
      title: 'ಗಿಡದ ಸಮಗ್ರ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ವಿವರಣೆ',
      subtitle: 'ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ, ESP32 ಸಂವೇದಕಗಳು ಮತ್ತು ಹಿಂದಿನ ಇತಿಹಾಸದ ಆಧಾರದ ಮೇಲೆ ಪುರಾವೆ ಆಧಾರಿತ ತೀರ್ಮಾನ.',
      whatsHappening: 'ಏನಾಗುತ್ತಿದೆ?',
      whyHappening: 'ಏಕೆ ಹೀಗಾಗುತ್ತಿದೆ?',
      whatShouldIDo: 'ಈಗ ನಾನು ಏನು ಮಾಡಬೇಕು?',
      evidenceChain: 'ಪುರಾವೆಗಳ ಸರಣಿ',
      observations: 'ನೇರ ಅವಲೋಕನಗಳು',
      interpretations: 'ಸಾಧ್ಯವಿರುವ ಕಾರಣಗಳು',
      recommendations: 'ಶಿಫಾರಸು ಮಾಡಿದ ಕ್ರಮಗಳು',
      limitations: 'ಲಭ್ಯವಿಲ್ಲದ ಮಾಹಿತಿ ಮತ್ತು ಮಿತಿಗಳು',
      conflictingSignals: 'ಪರಸ್ಪರ ಭಿನ್ನ ಸಂಕೇತಗಳು',
      confidence: 'ವಿಶ್ವಾಸಾರ್ಹತೆ',
      confidenceHigh: 'ಹೆಚ್ಚು ವಿಶ್ವಾಸಾರ್ಹ',
      confidenceModerate: 'ಸಾಧಾರಣ ವಿಶ್ವಾಸಾರ್ಹ',
      confidenceLow: 'ಕಡಿಮೆ ವಿಶ್ವಾಸಾರ್ಹ',
      confidenceInsufficient: 'ಸಾಕಷ್ಟು ಪುರಾವೆಗಳಿಲ್ಲ',
      sensorUnavailable: 'ಪರಿಸರ ಸಂವೇದಕಗಳ ಮಾಹಿತಿ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ.',
      cameraUnavailable: 'ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ.',
      insufficientHistory: 'ಬದಲಾವಣೆಯ ಗತಿಯನ್ನು ಅಳೆಯಲು ಸಾಕಷ್ಟು ಹಿಂದಿನ ದಾಖಲೆಗಳಿಲ್ಲ.',
      noPlantDetected: 'ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಯಾವುದೇ ಗಿಡ ಕಂಡುಬಂದಿಲ್ಲ.',
      poorImageQuality: 'ವಿಶ್ವಾಸಾರ್ಹ ವಿಶ್ಲೇಷಣೆಗೆ ಕ್ಯಾಮೆರಾ ಗುಣಮಟ್ಟ ಸಾಕಾಗುತ್ತಿಲ್ಲ.',
      unknownSpecies: 'ಗಿಡದ ನಿರ್ದಿಷ್ಟ ಪ್ರಭೇದ ಇನ್ನೂ ವರ್ಗೀಕರಿಸಲಾಗಿಲ್ಲ.',
      stableEquilibrium: 'ಗಿಡವು ಸ್ಥಿರವಾಗಿ ಕಂಡುಬರುತ್ತಿದೆ. ಯಾವುದೇ ಪರಿಸರ ವೈಪರೀತ್ಯ ಪತ್ತೆಯಾಗಿಲ್ಲ.',
      visualChangeOnly: 'ಸಂವೇದಕಗಳಲ್ಲಿ ಯಾವುದೇ ವ್ಯತ್ಯಾಸವಿಲ್ಲದಿದ್ದರೂ ಎಲೆಗಳ ಬಣ್ಣದಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ.',
      correlatedStress: 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟ ಬದಲಾದಾಗ ಎಲೆಗಳಲ್ಲಿ ಬದಲಾವಣೆಗಳು ಕಂಡುಬಂದಿವೆ.',
      temporalAssociation: 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದ್ದ ಅವಧಿಯಲ್ಲಿ ಗಿಡದ ಎಲೆಗಳಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ.',
      conflictingEvidence: 'ಎಲೆಗಳು ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣುತ್ತಿದ್ದರೂ, ಸಂವೇದಕಗಳಲ್ಲಿ ವ್ಯತ್ಯಾಸ ದಾಖಲಾಗಿದೆ.',
      environmentalAnomalyOnly: 'ಎಲೆಗಳು ಆರೋಗ್ಯವಾಗಿದ್ದರೂ ನೀರಿನ ಮಟ್ಟ ಗಮನಾರ್ಹವಾಗಿ ಇಳಿಕೆಯಾಗಿದೆ.',
      recovering: 'ಗಿಡ ಚೇತರಿಸಿಕೊಳ್ಳುತ್ತಿದೆ 🌿',
    },
  },
};

/**
 * Returns localized farmer headlines, explanations, and action guidance for a given scenario code
 */
export function getLocalizedReasoningCopy(
  scenarioCode: MultimodalScenarioCode,
  lang: SupportedLanguageCode = 'en'
): { headline: string; why: string; action: string } {
  const isKn = lang === 'kn';

  switch (scenarioCode) {
    case 'STABLE_EQUILIBRIUM':
      return {
        headline: isKn
          ? 'ಗಿಡವು ಸ್ಥಿರವಾಗಿ ಕಂಡುಬರುತ್ತಿದೆ. ಯಾವುದೇ ಪರಿಸರ ವೈಪರೀತ್ಯ ಪತ್ತೆಯಾಗಿಲ್ಲ.'
          : 'Plant appears stable. No significant environmental change was detected.',
        why: isKn
          ? 'ಎಲೆಗಳು ಆರೋಗ್ಯಕರ ಹಸಿರು ಬಣ್ಣದಲ್ಲಿವೆ ಮತ್ತು ಸಂವೇದಕಗಳು ನಿಗದಿತ ಮಿತಿಯೊಳಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ.'
          : 'Leaves show uniform chlorophyll and environmental telemetry remains within target limits.',
        action: isKn
          ? 'ಪ್ರಸ್ತುತ ನೀರಿನ ಪೋಷಕಾಂಶಗಳ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಮುಂದುವರಿಸಿ ಮತ್ತು ನಿಗಾ ಇರಿಸಿ.'
          : 'Maintain current nutrient delivery schedule and continue routine monitoring.',
      };

    case 'VISUAL_CHANGE_ONLY':
      return {
        headline: isKn
          ? 'ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಅಥವಾ ಕಂದು ಬಣ್ಣ ಕಂಡುಬಂದಿದೆ, ಆದರೆ ನೀರು ಮತ್ತು ಪೋಷಕಾಂಶಗಳು ಸಮತೋಲನದಲ್ಲಿವೆ.'
          : 'Increased leaf yellowing was detected. Current environmental readings do not show a corresponding anomaly.',
        why: isKn
          ? 'ಕ್ಯಾಮೆರಾ ಎಲೆಗಳಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡಿದೆ, ಆದರೆ ಸಂವೇದಕಗಳಲ್ಲಿ ಯಾವುದೇ ವ್ಯತ್ಯಾಸವಾಗಿಲ್ಲ.'
          : 'Optical change was observed without a concurrent pH, TDS, or water level deviation.',
        action: isKn
          ? 'ಗಿಡದ ಎಲೆಗಳ ಮೇಲೆ ನಿಗಾ ಇರಿಸಿ ಮತ್ತು ಬೆಳಕು ಅಥವಾ ಗಾಳಿಯ ಹರಿವನ್ನು ಪರಿಶೀಲಿಸಿ.'
          : 'Continue monitoring the plant foliage and verify probe cleanliness.',
      };

    case 'ENVIRONMENTAL_ANOMALY_ONLY':
      return {
        headline: isKn
          ? 'ನೀರಿನ ಮಟ್ಟ ಗಣನೀಯವಾಗಿ ಕಡಿಮೆಯಾಗಿದೆ.'
          : 'Water level has decreased significantly. No corresponding visual stress has been detected yet.',
        why: isKn
          ? 'ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರಿನ ಪ್ರಮಾಣ ಕಡಿಮೆಯಾಗಿದೆ, ಆದರೆ ಗಿಡದ ಎಲೆಗಳು ಇನ್ನೂ ಆರೋಗ್ಯವಾಗಿವೆ.'
          : 'Reservoir volume dropped, but leaf structure remains turgid with healthy pigmentation.',
        action: isKn
          ? 'ತೊಟ್ಟಿಗೆ ಹೊಸ ನೀರನ್ನು ಸೇರಿಸಿ ಮತ್ತು ಗಿಡ ಒಣಗದಂತೆ ನೋಡಿಕೊಳ್ಳಿ.'
          : 'Check the reservoir and add fresh water before stress symptoms manifest.',
      };

    case 'CORRELATED_ENVIRONMENTAL_STRESS':
      return {
        headline: isKn
          ? 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣ ಬದಲಾದಾಗ ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಅಥವಾ ಕಂದು ಬಣ್ಣ ಕಂಡುಬಂದಿದೆ.'
          : 'Leaf yellowing increased while nutrient TDS shifted. The plant may be experiencing environmental stress.',
        why: isKn
          ? 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟ ಅಥವಾ pH ಮಿತಿಯಿಂದ ಹೊರಬಂದಾಗ ಎಲೆಗಳ ಬಣ್ಣದಲ್ಲಿ ಬದಲಾವಣೆ ಹೆಚ್ಚಾಗಿದೆ.'
          : 'Foliar discoloration co-occurs with nutrient parameters drifting outside configured targets.',
        action: isKn
          ? 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಪರೀಕ್ಷಿಸಿ ಮತ್ತು pH ಸಮತೋಲನವನ್ನು ಸರಿಪಡಿಸಿ.'
          : 'Check the nutrient solution and calibrate pH balance.',
      };

    case 'TEMPORAL_ASSOCIATION':
      return {
        headline: isKn
          ? 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದ್ದ ಅವಧಿಯಲ್ಲಿ ಗಿಡದ ಎಲೆಗಳಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ.'
          : 'Plant visual condition changed during a period of decreasing water level. This may indicate environmental stress.',
        why: isKn
          ? 'ಹಿಂದಿನ ದಾಖಲೆಗಳ ಪ್ರಕಾರ, ನೀರಿನ ಮಟ್ಟ ಇಳಿಕೆಯಾದ ಸಮಯದಲ್ಲಿ ಎಲೆಗಳಲ್ಲಿ ಬದಲಾವಣೆಗಳು ದಾಖಲಾಗಿವೆ.'
          : 'Historical telemetry indicates the foliar change occurred alongside or following a recorded water-level decline.',
        action: isKn
          ? 'ತೊಟ್ಟಿಯ ನೀರಿನ ಮಟ್ಟವನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಗಿಡದ ಚೇತರಿಕೆಯನ್ನು ಗಮನಿಸಿ.'
          : 'Check the reservoir water level and continue monitoring.',
      };

    case 'CONFLICTING_EVIDENCE':
      return {
        headline: isKn
          ? 'ಗಿಡ ಚೆನ್ನಾಗಿ ಕಾಣಿಸುತ್ತಿದೆ, ಆದರೆ ನೀರಿನ ಅಥವಾ ಪೋಷಕಾಂಶಗಳ ಸಂವೇದಕದಲ್ಲಿ ಎಚ್ಚರಿಕೆ ಕಂಡುಬಂದಿದೆ.'
          : 'Plant appearance currently appears stable, but an environmental sensor anomaly was detected.',
        why: isKn
          ? 'ಎಲೆಗಳು ಸಾಮಾನ್ಯ ಹಸಿರು ಬಣ್ಣದಲ್ಲಿದ್ದರೂ, ಸಂವೇದಕಗಳು ನಿಗದಿತ ವ್ಯಾಪ್ತಿಯಿಂದ ಹೊರಗಿವೆ.'
          : 'Visual appearance indicates healthy foliage, but sensor telemetry indicates a parameter anomaly.',
        action: isKn
          ? 'ಎಲೆಗಳಿಗೆ ಒತ್ತಡ ಉಂಟಾಗುವ ಮೊದಲೇ ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಸರಿಪಡಿಸಿ.'
          : 'Monitor the plant closely and check the environmental condition.',
      };

    case 'SENSOR_UNAVAILABLE':
      return {
        headline: isKn
          ? 'ಗಿಡದ ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಬಣ್ಣ ಕಂಡುಬಂದಿದೆ; ಸಂವೇದಕ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ.'
          : 'Visual yellowing was detected. Environmental sensor data is currently unavailable.',
        why: isKn
          ? 'ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಪ್ರಮಾಣ ಕಾಣುತ್ತಿದೆ, ಆದರೆ ಸಂವೇದಕಗಳು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿವೆ.'
          : 'Environmental sensor data is currently unavailable, so the system cannot assess whether a sensor change is associated with this observation.',
        action: isKn
          ? 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಕೈಯಿಂದ ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸಂವೇದಕವನ್ನು ಸಂಪರ್ಕಿಸಿ.'
          : 'Inspect the nutrient solution manually and connect sensor hardware.',
      };

    case 'CAMERA_UNAVAILABLE':
      return {
        headline: isKn
          ? 'ಕ್ಯಾಮೆರಾ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ; ಸಂವೇದಕಗಳ ಆಧಾರದ ಮೇಲೆ ಪರಿಸರವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ.'
          : 'Water level has decreased significantly. Camera evidence is currently unavailable, so plant visual condition cannot be assessed.',
        why: isKn
          ? 'ಸಂವೇದಕಗಳು ಲಭ್ಯವಿದ್ದರೂ, ಕ್ಯಾಮೆರಾ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ.'
          : 'Camera evidence is currently unavailable, so plant visual condition cannot be assessed.',
        action: isKn
          ? 'ಗಿಡದ ಎಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಕ್ಯಾಮೆರಾವನ್ನು ಪ್ರಾರಂಭಿಸಿ.'
          : 'Start Dashboard camera to inspect plant growth.',
      };

    case 'INSUFFICIENT_HISTORY':
      return {
        headline: isKn
          ? 'ಎಲೆಗಳಲ್ಲಿ ಬಣ್ಣ ಬದಲಾಗಿದೆ; ಬದಲಾವಣೆಯ ಗತಿಯನ್ನು ತಿಳಿಯಲು ಹೆಚ್ಚಿನ ದಾಖಲೆಗಳು ಬೇಕು.'
          : 'Yellowing is currently visible, but there is not enough historical data to determine whether it is increasing.',
        why: isKn
          ? 'ಕೇವಲ ಒಂದೇ ಅವಲೋಕನ ದಾಖಲಾಗಿದೆ. ಹಿಂದಿನ ಇತಿಹಾಸವಿಲ್ಲದೆ ವೇಗವನ್ನು ತಿಳಿಯಲು ಸಾಧ್ಯವಿಲ್ಲ.'
          : 'Only one observation checkpoint exists. The system cannot establish rate of progression yet.',
        action: isKn
          ? 'ಮುಂದಿನ ಅವಲೋಕನವನ್ನು ದಾಖಲಿಸಿ ಮತ್ತು ಸಂವೇದಕಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆಯೇ ಎಂದು ನೋಡಿ.'
          : 'Log subsequent observations to calculate change over time.',
      };

    case 'NO_PLANT_DETECTED':
      return {
        headline: isKn
          ? 'ಯಾವುದೇ ಗಿಡ ಕಂಡುಬಂದಿಲ್ಲ. ಗಿಡವನ್ನು ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಇರಿಸಿ.'
          : 'No plant detected. Position the plant in front of the camera and try again.',
        why: isKn
          ? 'ಕ್ಯಾಮೆರಾ ನೋಟ ಸ್ಪಷ್ಟವಾಗಿದ್ದರೂ, ಜೀವಂತ ಗಿಡದ ಎಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.'
          : 'The camera view is clear, but no living plant canopy was detected.',
        action: isKn
          ? 'ನಿಮ್ಮ ಗಿಡವನ್ನು ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಸ್ಪಷ್ಟವಾಗಿ ಇರಿಸಿ.'
          : 'Position specimen inside camera view.',
      };

    case 'POOR_IMAGE_QUALITY':
      return {
        headline: isKn
          ? 'ಕ್ಯಾಮೆರಾ ಮಸುಕಾಗಿದೆ ಅಥವಾ ಬೆಳಕು ಸಾಕಷ್ಟಿಲ್ಲ.'
          : 'Camera image quality is insufficient for reliable visual assessment.',
        why: isKn
          ? 'ಕ್ಯಾಮೆರಾ ಫ್ರೇಮ್ ಗುಣಮಟ್ಟವು ವಿಶ್ವಾಸಾರ್ಹ ವಿಶ್ಲೇಷಣೆಗೆ ಸಾಕಾಗುತ್ತಿಲ್ಲ.'
          : 'Optical scan quality is below the required sharpness or illumination threshold.',
        action: isKn
          ? 'ಲೆನ್ಸ್ ಸ್ವಚ್ಛಗೊಳಿಸಿ, ಫೋಕಸ್ ಸರಿಪಡಿಸಿ ಅಥವಾ ಬೆಳಕನ್ನು ಹೆಚ್ಚಿಸಿ.'
          : 'Clean the lens, focus the camera, or adjust ambient lighting.',
      };

    case 'UNKNOWN_SPECIES':
      return {
        headline: isKn
          ? 'ಎಲೆಗಳ ಬಣ್ಣ ಬದಲಾವಣೆ ಕಾಣುತ್ತಿದೆ, ಆದರೆ ಗಿಡದ ಪ್ರಭೇದವನ್ನು ಗುರುತಿಸಲಾಗಿಲ್ಲ.'
          : 'Leaf yellowing is visible, but the plant species could not be identified.',
        why: isKn
          ? 'ಸಾಮಾನ್ಯ ಗಿಡದ ನಿಯತಾಂಕಗಳ ಅಡಿಯಲ್ಲಿ ವಿಶ್ಲೇಷಣೆ ನಡೆಸಲಾಗಿದೆ.'
          : 'Reasoning evaluates generalized botanical parameters without a species-specific envelope.',
        action: isKn
          ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ಇನ್ನೊಮ್ಮೆ ಸ್ಪಷ್ಟವಾಗಿ ಸ್ಕ್ಯಾನ್ ಮಾಡಿ.'
          : 'Perform a clear scan from Dashboard or continue monitoring.',
      };

    case 'RECOVERING_TRAJECTORY':
      return {
        headline: isKn
          ? 'ಗಿಡದ ನೋಟ ಮತ್ತು ಆರೋಗ್ಯ ಸುಧಾರಿಸುತ್ತಿದೆ 🌿'
          : 'Plant visual condition is recovering nicely 🌿',
        why: isKn
          ? 'ಹಿಂದಿನ ಒತ್ತಡದ ನಂತರ ಎಲೆಗಳ ಹಸಿರು ಪ್ರಮಾಣ ಹೆಚ್ಚಾಗಿದೆ.'
          : 'Foliar chlorosis has decreased and leaf vigor has stabilized.',
        action: isKn
          ? 'ಪ್ರಸ್ತುತ ಆರೈಕೆಯನ್ನು ಮುಂದುವರಿಸಿ.'
          : 'Maintain current growing conditions and continue monitoring.',
      };

    default:
      return {
        headline: isKn
          ? 'ಗಿಡವು ಸ್ಥಿರವಾಗಿ ಕಂಡುಬರುತ್ತಿದೆ.'
          : 'Plant appears stable.',
        why: isKn
          ? 'ಎಲ್ಲಾ ನಿಯತಾಂಕಗಳು ಸಾಮಾನ್ಯ ವ್ಯಾಪ್ತಿಯಲ್ಲಿವೆ.'
          : 'All biological and environmental parameters are nominal.',
        action: isKn
          ? 'ನಿಯಮಿತ ನಿಗಾ ಮುಂದುವರಿಸಿ.'
          : 'Continue routine monitoring.',
      };
  }
}

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
    if (latestDetection?.state === 'PLANT_DETECTED' || (latestDetection?.isPlantDetected && (latestDetection?.confidence ?? 0) >= 45)) {
      cameraStatus = 'PLANT_DETECTED';
      cameraMessage = copy.camera.PLANT_DETECTED || fallbackCopy.camera.PLANT_DETECTED;
      cameraColor = 'teal';
    } else if (latestDetection?.state === 'SCAN_NOT_READY') {
      cameraStatus = 'SCAN_NOT_READY';
      cameraMessage = copy.camera.SCAN_NOT_READY || fallbackCopy.camera.SCAN_NOT_READY;
      cameraColor = 'gray';
    } else if (latestDetection?.state === 'LOW_CONFIDENCE' || ((latestDetection?.confidence ?? 0) < 45 && (latestDetection?.confidence ?? 0) >= 25)) {
      cameraStatus = 'LOW_CONFIDENCE';
      cameraMessage = copy.camera.LOW_CONFIDENCE || fallbackCopy.camera.LOW_CONFIDENCE;
      cameraColor = 'amber';
    } else {
      cameraStatus = 'NO_PLANT';
      cameraMessage = copy.camera.NO_PLANT || fallbackCopy.camera.NO_PLANT;
      cameraColor = 'amber';
    }
  }

  // 5. Visual Health Status
  let visualHealthStatus: StructuredHealthState = 'UNKNOWN';
  let visualHealthMessage = copy.visualHealth.UNKNOWN || fallbackCopy.visualHealth.UNKNOWN;

  if (isCameraActive && latestDetection?.isPlantDetected && latestVisualHealth) {
    const rawState = (latestVisualHealth.healthState as string).toUpperCase();
    if (rawState === 'HEALTHY') {
      visualHealthStatus = 'HEALTHY';
      visualHealthMessage = copy.visualHealth.HEALTHY || fallbackCopy.visualHealth.HEALTHY;
    } else if (rawState === 'STABLE') {
      visualHealthStatus = 'STABLE';
      visualHealthMessage = copy.visualHealth.STABLE || fallbackCopy.visualHealth.STABLE;
    } else if (rawState === 'RECOVERING') {
      visualHealthStatus = 'RECOVERING';
      visualHealthMessage = copy.visualHealth.RECOVERING || fallbackCopy.visualHealth.RECOVERING;
    } else if (rawState === 'ATTENTION' || rawState === 'MILD_STRESS' || rawState === 'POSSIBLE_ANOMALY') {
      visualHealthStatus = 'ATTENTION';
      visualHealthMessage = copy.visualHealth.ATTENTION || fallbackCopy.visualHealth.ATTENTION;
    } else if (rawState === 'CRITICAL' || rawState === 'SIGNIFICANT_ANOMALY') {
      visualHealthStatus = 'CRITICAL';
      visualHealthMessage = copy.visualHealth.CRITICAL || fallbackCopy.visualHealth.CRITICAL;
    } else {
      visualHealthStatus = 'UNKNOWN';
      visualHealthMessage = copy.visualHealth.UNKNOWN || fallbackCopy.visualHealth.UNKNOWN;
    }
  }

  // 6. Overall Plant Status
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
    visualHealthStatus === 'CRITICAL' ||
    activeAnomalies.some(a => a.severity === 'critical')
  ) {
    plantStatus = 'URGENT';
    plantMessage = copy.plant.URGENT || fallbackCopy.plant.URGENT;
    plantColor = 'red';
  } else if (
    multimodalAssessment.overallHealthState === 'warning' ||
    environmentStatus === 'ATTENTION' ||
    visualHealthStatus === 'ATTENTION' ||
    activeAnomalies.length > 0
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
    visualHealthStatus,
    plantMessage,
    environmentMessage,
    waterMessage,
    nutrientMessage,
    cameraMessage,
    visualHealthMessage,
    plantColor,
    waterColor,
    nutrientColor,
    cameraColor,
    actionableSummary,
    hasSufficientData,
  };
}

// ============================================================================
// PHASE 7: "WHAT CHANGED?" BILINGUAL LOCALIZATION
// ============================================================================

/**
 * Returns localized farmer copy for the WhatChangedSummary in English or natural Kannada.
 */
export function getLocalizedWhatChangedCopy(
  summary: WhatChangedSummary,
  lang: SupportedLanguageCode = 'en'
): { headline: string; why: string; action: string } {
  const isKn = lang === 'kn';
  if (!isKn) {
    return {
      headline: summary.farmerHeadline,
      why: summary.farmerWhy,
      action: summary.farmerAction,
    };
  }

  switch (summary.status) {
    case 'insufficient_history':
      return {
        headline: 'ಹೆಚ್ಚಿನ ಅವಲೋಕನ ಇತಿಹಾಸಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ.',
        why: 'ಬದಲಾವಣೆಗಳನ್ನು ಗುರುತಿಸಲು ಕಾಲಾನಂತರದಲ್ಲಿ ಕನಿಷ್ಠ ಎರಡು ತಪಾಸಣೆಗಳು ಅಥವಾ ವಾಚನಗಳು ಬೇಕಾಗುತ್ತವೆ.',
        action: 'ಗಿಡದ ಮೂಲ ಇತಿಹಾಸವನ್ನು ನಿರ್ಮಿಸಲು ವ್ಯವಸ್ಥೆಯನ್ನು ಚಾಲನೆಯಲ್ಲಿಡಿ.',
      };
    case 'sensor_unavailable':
      return {
        headline: 'ಸಂವೇದಕಗಳ ಮಾಹಿತಿ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ.',
        why: 'ಸಂವೇದಕಗಳು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿವೆ ಅಥವಾ ನಿಯತಾಂಕಗಳನ್ನು ಕಳುಹಿಸುತ್ತಿಲ್ಲ.',
        action: 'IoT ಸಾಧನದ ಶಕ್ತಿ ಮತ್ತು ಸಂವೇದಕಗಳ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.',
      };
    case 'stable_no_change':
      return {
        headline: 'ಎಲ್ಲವೂ ಸ್ಥಿರವಾಗಿದೆ — ಯಾವುದೇ ಗಮನಾರ್ಹ ಬದಲಾವಣೆ ಇಲ್ಲ.',
        why: 'ಹಿಂದಿನ ತಪಾಸಣೆಯಿಂದ ನೀರು, ಪೋಷಕಾಂಶಗಳು ಮತ್ತು ಎಲೆಗಳ ಸ್ಥಿತಿಯಲ್ಲಿ ಯಾವುದೇ ವ್ಯತ್ಯಾಸವಾಗಿಲ್ಲ.',
        action: 'ಯಾವುದೇ ತುರ್ತು ಕ್ರಮ ಅಗತ್ಯವಿಲ್ಲ. ಪ್ರಸ್ತುತ ನಿರ್ವಹಣೆಯನ್ನು ಮುಂದುವರಿಸಿ.',
      };
    case 'meaningful_changes':
    default:
      if (summary.reviewRequiredItems && summary.reviewRequiredItems.length > 0) {
        return {
          headline: 'ಗಿಡದ ಗುರುತಿಸುವಿಕೆಯಲ್ಲಿ ಬದಲಾವಣೆ — ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ.',
          why: 'ಕ್ಯಾಮೆರಾ ಗುರುತಿಸಿದ ಗಿಡದ ತಳಿ ಹಿಂದಿನ ಪ್ರೊಫೈಲ್‌ಗಿಂತ ಭಿನ್ನವಾಗಿದೆ.',
          action: 'ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಸಸ್ಯದ ತಳಿಯನ್ನು ದೃಢೀಕರಿಸಿ ಅಥವಾ ಕ್ಯಾಮೆರಾವನ್ನು ಸರಿಯಾಗಿ ಜೋಡಿಸಿ.',
        };
      }
      if (summary.overallDirection === 'improved' || summary.overallDirection === 'recovered') {
        return {
          headline: 'ಗಿಡದ ಸ್ಥಿತಿ ಸುಧಾರಿಸಿದೆ ಅಥವಾ ಚೇತರಿಸಿಕೊಳ್ಳುತ್ತಿದೆ.',
          why: 'ಎಲೆಗಳ ಹಸಿರು ಮತ್ತು ಪರಿಸರದ ಸಮತೋಲನವು ಉತ್ತಮ ಮಟ್ಟಕ್ಕೆ ಮರಳಿದೆ.',
          action: 'ಪ್ರಸ್ತುತ ಪೋಷಕಾಂಶ ಮತ್ತು ನೀರಿನ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಮುಂದುವರಿಸಿ.',
        };
      }
      if (summary.overallDirection === 'declined') {
        return {
          headline: 'ಗಿಡ ಅಥವಾ ನೀರಿನ ನಿಯತಾಂಕಗಳಲ್ಲಿ ಇಳಿಕೆ ಕಂಡುಬಂದಿದೆ.',
          why: 'ಕಳೆದ ಅವಲೋಕನದಿಂದ ನೀರು, pH ಅಥವಾ ಎಲೆಗಳ ಆರೋಗ್ಯದಲ್ಲಿ ಬದಲಾವಣೆ ಉಂಟಾಗಿದೆ.',
          action: 'ಕೆಳಗಿನ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಸೂಕ್ತ ಕ್ರಮ ಕೈಗೊಳ್ಳಿ.',
        };
      }
      return {
        headline: 'ಕಳೆದ ತಪಾಸಣೆಯಿಂದ ಕೆಲವು ಬದಲಾವಣೆಗಳು ಕಂಡುಬಂದಿವೆ.',
        why: 'ಕೆಲವು ನಿಯತಾಂಕಗಳು ಸಾಮಾನ್ಯ ಮಿತಿಗಿಂತ ವ್ಯತ್ಯಾಸವಾಗಿವೆ.',
        action: 'ಸಂವೇದಕಗಳು ಮತ್ತು ಗಿಡದ ಎಲೆಗಳನ್ನು ಗಮನಿಸಿ.',
      };
  }
}

/**
 * Returns localized farmer copy for an individual PlantChangeEvent in English or natural Kannada.
 */
export function getLocalizedChangeEvent(
  event: PlantChangeEvent,
  lang: SupportedLanguageCode = 'en'
): { headline: string; why: string; action: string } {
  const isKn = lang === 'kn';
  if (!isKn) {
    return {
      headline: event.farmerHeadline,
      why: event.farmerWhy,
      action: event.farmerAction,
    };
  }

  if (event.direction === 'unavailable') {
    return {
      headline: `${event.label} ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ`,
      why: 'ಸಂವೇದಕವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ ಅಥವಾ ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ.',
      action: 'ಸಂವೇದಕದ ವೈರಿಂಗ್ ಮತ್ತು ಪವರ್ ಪರಿಶೀಲಿಸಿ.',
    };
  }

  if (event.metric === 'ph') {
    return {
      headline: (event.delta ?? 0) > 0 ? 'ನೀರಿನ pH ಮಟ್ಟ ಹೆಚ್ಚಾಗಿದೆ' : 'ನೀರಿನ pH ಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ',
      why: `ನೀರಿನ ಆಮ್ಲೀಯತೆ ${Math.abs(event.delta ?? 0)} ಪಾಯಿಂಟ್‌ಗಳಷ್ಟು ಬದಲಾಗಿದೆ.`,
      action: (event.currentValue as number) > 6.5
        ? 'pH Down ಸೇರಿಸಿ pH ಮಟ್ಟವನ್ನು 5.5–6.5 ಗೆ ತನ್ನಿ.'
        : 'pH Up ಸೇರಿಸಿ ಅಥವಾ ತಾಜಾ ನೀರನ್ನು ಸೇರಿಸಿ.',
    };
  }

  if (event.metric === 'tds') {
    return {
      headline: (event.delta ?? 0) > 0 ? 'ಪೋಷಕಾಂಶಗಳ ಸಾಂದ್ರತೆ ಹೆಚ್ಚಾಗಿದೆ' : 'ಪೋಷಕಾಂಶಗಳ ಸಾಂದ್ರತೆ ಕಡಿಮೆಯಾಗಿದೆ',
      why: (event.delta ?? 0) > 0
        ? 'ನೀರು ಆವಿಯಾಗಿ ಲವಣಗಳ ಸಾಂದ್ರತೆ ಹೆಚ್ಚಾಗಿದೆ.'
        : 'ಗಿಡಗಳು ಪೋಷಕಾಂಶಗಳನ್ನು ಹೀರಿಕೊಂಡಿವೆ ಅಥವಾ ನೀರನ್ನು ಸೇರಿಸಲಾಗಿದೆ.',
      action: (event.delta ?? 0) > 0 ? 'ತಾಜಾ ನೀರನ್ನು ಸೇರಿಸಿ ಸಾಂದ್ರತೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಿ.' : 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಸೇರಿಸಿ.',
    };
  }

  if (event.metric === 'waterLevel') {
    return {
      headline: (event.delta ?? 0) < 0 ? 'ನೀರಿನ ಮಟ್ಟ ಗಣನೀಯವಾಗಿ ಕಡಿಮೆಯಾಗಿದೆ' : 'ನೀರಿನ ತೊಟ್ಟಿಯನ್ನು ಮರುತುಂಬಿಸಲಾಗಿದೆ',
      why: (event.delta ?? 0) < 0
        ? `ಗಿಡದ ಬಳಕೆಯಿಂದ ನೀರಿನ ಮಟ್ಟ ${Math.abs(event.delta ?? 0)}% ರಷ್ಟು ಇಳಿಕೆಯಾಗಿದೆ.`
        : 'ಹೊಸ ದ್ರಾವಣ ಅಥವಾ ನೀರನ್ನು ಸೇರಿಸಲಾಗಿದೆ.',
      action: (event.currentValue as number) < 35 ? 'ಪಂಪ್ ಸುರಕ್ಷತೆಗಾಗಿ ಕೂಡಲೇ ನೀರನ್ನು ಸೇರಿಸಿ.' : 'ನಿಯಮಿತ ನೀರಾವರಿ ಮುಂದುವರಿಸಿ.',
    };
  }

  if (event.metric === 'canopyCoveragePercent') {
    return {
      headline: (event.delta ?? 0) > 0 ? 'ಗಿಡದ ಎಲೆಗಳು ಬೆಳೆಯುತ್ತಿವೆ' : 'ಎಲೆಗಳ ವ್ಯಾಪ್ತಿ ಕಡಿಮೆಯಾಗಿದೆ',
      why: (event.delta ?? 0) > 0
        ? `ಆರೋಗ್ಯಕರ ಬೆಳವಣಿಗೆಯಿಂದ ಎಲೆಗಳ ವ್ಯಾಪ್ತಿ +${event.delta}% ಹೆಚ್ಚಾಗಿದೆ.`
        : 'ಎಲೆಗಳು ಬಾಡಿರಬಹುದು ಅಥವಾ ಕತ್ತರಿಸಿರಬಹುದು.',
      action: 'ಪ್ರಸ್ತುತ ಬೆಳಕು ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ವ್ಯವಸ್ಥೆ ಮುಂದುವರಿಸಿ.',
    };
  }

  if (event.metric === 'chlorosis') {
    return {
      headline: (event.delta ?? 0) > 0 ? 'ಎಲೆಗಳಲ್ಲಿ ಹಳದಿ ಬಣ್ಣ ಹೆಚ್ಚಾಗಿದೆ' : 'ಎಲೆಗಳ ಹಳದಿ ಬಣ್ಣ ಕಡಿಮೆಯಾಗಿದೆ',
      why: 'ಎಲೆಗಳ ಅಂಗಾಂಶದಲ್ಲಿ ಕ್ಲೋರೊಫಿಲ್ ಪ್ರಮಾಣದಲ್ಲಿ ವ್ಯತ್ಯಾಸವಾಗಿದೆ.',
      action: 'ದ್ರಾವಣದ pH ಪರಿಶೀಲಿಸಿ ಮತ್ತು ನೈಟ್ರೋಜನ್/ಕಬ್ಬಿಣದ ಲಭ್ಯತೆಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
    };
  }

  if (event.metric === 'species') {
    return {
      headline: `ಸಸ್ಯದ ತಳಿ ಬದಲಾಗಿದೆ: ${event.currentValue}`,
      why: `ಕ್ಯಾಮೆರಾ ಮಾದರಿಯು ${event.currentValue} ತಳಿಯನ್ನು ಗುರುತಿಸಿದೆ.`,
      action: 'ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಸಸ್ಯದ ತಳಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.',
    };
  }

  return {
    headline: event.farmerHeadline,
    why: event.farmerWhy,
    action: event.farmerAction,
  };
}

// ============================================================================
// PHASE 8: PLANT DIGITAL PROFILE & LIFECYCLE LOCALIZATION
// ============================================================================

export function getLocalizedLifecycleState(
  state?: PlantLifecycleState,
  lang: SupportedLanguageCode = 'en'
): string {
  const isKn = lang === 'kn';
  switch (state) {
    case 'CREATED':
      return isKn ? 'ಪ್ರೊಫೈಲ್ ಆರಂಭಿಸಲಾಗಿದೆ' : 'Profile Initialized';
    case 'BASELINE_PENDING':
      return isKn ? 'ಮೂಲ ಮಾಪನಾಂಕ ಬಾಕಿ ಇದೆ' : 'Baseline Pending';
    case 'MONITORING':
      return isKn ? 'ನಿರಂತರ ಮೇಲ್ವಿಚಾರಣೆ' : 'Actively Monitored';
    case 'GROWING':
      return isKn ? 'ಬೆಳೆಯುತ್ತಿದೆ 🌱' : 'Vegetative Growth 🌱';
    case 'ATTENTION':
      return isKn ? 'ಗಮನ ಅಗತ್ಯವಿದೆ ⚠️' : 'Needs Attention ⚠️';
    case 'RECOVERING':
      return isKn ? 'ಚೇತರಿಸಿಕೊಳ್ಳುತ್ತಿದೆ 🌿' : 'Recovering 🌿';
    case 'STABLE':
      return isKn ? 'ಸ್ಥಿರವಾಗಿದೆ ಹಾಗೂ ಆರೋಗ್ಯಕರ' : 'Stable & Healthy';
    case 'INACTIVE':
      return isKn ? 'ನಿಷ್ಕ್ರಿಯವಾಗಿದೆ' : 'Inactive';
    case 'ARCHIVED':
      return isKn ? 'ಸಂಗ್ರಹಿಸಲಾಗಿದೆ' : 'Archived';
    default:
      return isKn ? 'ಸ್ಥಿರವಾಗಿದೆ' : 'Stable';
  }
}

export function getLocalizedMonitoringStatus(
  status?: MonitoringState | string,
  lang: SupportedLanguageCode = 'en'
): string {
  const isKn = lang === 'kn';
  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      return isKn ? 'ಸಕ್ರಿಯವಾಗಿದೆ' : 'Active';
    case 'PAUSED':
      return isKn ? 'ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ' : 'Paused';
    case 'OFFLINE':
      return isKn ? 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದೆ' : 'Offline';
    default:
      return isKn ? 'ಸಕ್ರಿಯ' : 'Active';
  }
}

export function getLocalizedIdentificationStatus(
  status?: PlantIdentificationStatus,
  lang: SupportedLanguageCode = 'en'
): string {
  const isKn = lang === 'kn';
  switch (status) {
    case 'IDENTIFIED':
      return isKn ? 'ದೃಢೀಕೃತ ಸಸ್ಯ' : 'Identified Specimen';
    case 'UNKNOWN':
      return isKn ? 'ಗುರುತಿಸಲಾಗದ ಸಸ್ಯ' : 'Unknown Specimen';
    case 'LOW_CONFIDENCE':
      return isKn ? 'ಕಡಿಮೆ ವಿಶ್ವಾಸಾರ್ಹತೆ' : 'Tentative Identification';
    case 'REVIEW_REQUIRED':
      return isKn ? 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ' : 'Review Required';
    default:
      return isKn ? 'ಪರಿಶೀಲನೆ ಬಾಕಿ' : 'Pending';
  }
}

export function getLocalizedCompletenessStatus(
  status?: ProfileCompletenessStatus,
  lang: SupportedLanguageCode = 'en'
): string {
  const isKn = lang === 'kn';
  switch (status) {
    case 'COMPLETE':
      return isKn ? 'ಸಂಪೂರ್ಣ ಮಾಹಿತಿ (೧೦೦%)' : 'Complete Profile (100%)';
    case 'PARTIAL':
      return isKn ? 'ಭಾಗಶಃ ಮಾಹಿತಿ' : 'Partial Profile';
    case 'LIMITED':
      return isKn ? 'ಸೀಮಿತ ಮಾಹಿತಿ' : 'Limited Data';
    case 'INSUFFICIENT_DATA':
      return isKn ? 'ಅಪೂರ್ಣ ಮಾಹಿತಿ' : 'Insufficient Data';
    default:
      return isKn ? 'ಮಾಹಿತಿ' : 'Profile';
  }
}

export function getLocalizedMilestone(
  milestone: PlantMilestone,
  lang: SupportedLanguageCode = 'en'
): { title: string; description: string; dayLabel: string } {
  const isKn = lang === 'kn';
  if (!isKn) {
    return {
      title: milestone.title,
      description: milestone.description,
      dayLabel: milestone.dayLabel,
    };
  }

  const dayLabel = `ದಿನ ${milestone.dayNumber}`;

  switch (milestone.type) {
    case 'CREATED':
      return {
        title: 'ಸಸ್ಯ ಪ್ರೊಫೈಲ್ ರಚಿಸಲಾಗಿದೆ',
        description: `ಗಿಡದ ನಿರಂತರ ಮೇಲ್ವಿಚಾರಣೆ ಪ್ರಾರಂಭವಾಗಿದೆ (ID: ${milestone.plantId}).`,
        dayLabel: `${dayLabel} · ಆರಂಭ`,
      };
    case 'BASELINE_ESTABLISHED':
      return {
        title: 'ಆರಂಭಿಕ ಮೂಲ ಮಾಪನಾಂಕ ಸ್ಥಾಪಿಸಲಾಗಿದೆ',
        description: 'ಕ್ಯಾಮೆರಾ ಮತ್ತು ಸಂವೇದಕಗಳ ಮೊದಲ ಸಮತೋಲಿತ ದಾಖಲೆ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ.',
        dayLabel: `${dayLabel} · ಮೂಲ ಮಾಪನಾಂಕ`,
      };
    case 'SPECIES_IDENTIFIED':
      return {
        title: milestone.title.includes('Review') ? 'ಸಸ್ಯದ ತಳಿ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ' : 'ಸಸ್ಯದ ತಳಿ ದೃಢಪಟ್ಟಿದೆ',
        description: milestone.description,
        dayLabel: `${dayLabel} · ಸಸ್ಯ ವರ್ಗೀಕರಣ`,
      };
    case 'HEALTH_CHANGE':
      return {
        title: 'ಆರೋಗ್ಯ ಸ್ಥಿತಿಯಲ್ಲಿ ಬದಲಾವಣೆ',
        description: milestone.description,
        dayLabel: `${dayLabel} · ಆರೋಗ್ಯ ಬದಲಾವಣೆ`,
      };
    case 'RECOVERY_DETECTED':
      return {
        title: 'ಒತ್ತಡದಿಂದ ಸಸ್ಯ ಚೇತರಿಸಿಕೊಂಡಿದೆ',
        description: 'ಎಲೆಗಳ ಹಸಿರು ಹಾಗೂ ಸಂವೇದಕಗಳ ಮಟ್ಟ ಸಾಮಾನ್ಯ ಸ್ಥಿತಿಗೆ ಮರಳಿವೆ.',
        dayLabel: `${dayLabel} · ಚೇತರಿಕೆ`,
      };
    case 'GROWTH_DETECTED':
      return {
        title: 'ಗಮನಾರ್ಹ ಎಲೆಗಳ ಬೆಳವಣಿಗೆ',
        description: milestone.description,
        dayLabel: `${dayLabel} · ಬೆಳವಣಿಗೆ`,
      };
    case 'REASONING_EVENT':
      return {
        title: 'ತಾರ್ಕಿಕ ಪರಸ್ಪರ ಸಂಬಂಧ ಪತ್ತೆಯಾಗಿದೆ',
        description: milestone.description,
        dayLabel: `${dayLabel} · ತಾರ್ಕಿಕ ವಿಶ್ಲೇಷಣೆ`,
      };
    case 'CORRELATION_DETECTED':
      return {
        title: 'ಪರಿಸರ ↔ ಸಸ್ಯ ಪರಸ್ಪರ ಸಂಬಂಧ',
        description: milestone.description,
        dayLabel: `${dayLabel} · ಪರಿಸರ ಸಂಬಂಧ`,
      };
    default:
      return {
        title: milestone.title,
        description: milestone.description,
        dayLabel: milestone.dayLabel,
      };
  }
}

export function getLocalizedDigitalProfileSummary(
  profile: PlantProfile,
  lang: SupportedLanguageCode = 'en'
): { story: string; stateLabel: string; growthLabel: string; action: string } {
  const isKn = lang === 'kn';
  const state = profile.lifecycle?.lifecycleState || 'STABLE';
  const stateLabel = getLocalizedLifecycleState(state, lang);

  const growthTrend = profile.growth?.growthTrend || 'steady';
  const growthLabel = isKn
    ? growthTrend === 'expanding' ? 'ಚೆನ್ನಾಗಿ ಬೆಳೆಯುತ್ತಿದೆ 🌱' : growthTrend === 'contracting' ? 'ಎಲೆಗಳ ಗಾತ್ರ ಕುಗ್ಗಿದೆ' : 'ಸ್ಥಿರವಾದ ಬೆಳವಣಿಗೆ'
    : growthTrend === 'expanding' ? 'Expanding steadily 🌱' : growthTrend === 'contracting' ? 'Canopy contracted' : 'Steady canopy';

  if (!isKn) {
    if (state === 'ATTENTION') {
      return {
        story: `Your ${profile.commonName || 'plant'} is experiencing physiological stress. Review latest sensor readings and foliage.`,
        stateLabel,
        growthLabel,
        action: 'Inspect reservoir levels and pH balance.',
      };
    }
    if (state === 'RECOVERING') {
      return {
        story: `Your ${profile.commonName || 'plant'} is recovering well from recent environmental stress.`,
        stateLabel,
        growthLabel,
        action: 'Maintain current nutrient and light schedules.',
      };
    }
    if (state === 'GROWING') {
      return {
        story: `Your ${profile.commonName || 'plant'} is expanding its canopy with vibrant foliage.`,
        stateLabel,
        growthLabel,
        action: 'Keep up current cultivation routine.',
      };
    }
    return {
      story: `Your ${profile.commonName || 'plant'} is in stable physiological equilibrium.`,
      stateLabel,
      growthLabel,
      action: 'No urgent intervention needed right now.',
    };
  }

  if (state === 'ATTENTION') {
    return {
      story: `ನಿಮ್ಮ ${profile.commonName || 'ಗಿಡ'} ಒತ್ತಡವನ್ನು ಎದುರಿಸುತ್ತಿದೆ. ನೀರಿನ ಮಟ್ಟ ಮತ್ತು ಎಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.`,
      stateLabel,
      growthLabel,
      action: 'ನೀರಿನ ತೊಟ್ಟಿ ಮತ್ತು pH ಮಟ್ಟವನ್ನು ತಕ್ಷಣವೇ ಪರಿಶೀಲಿಸಿ.',
    };
  }
  if (state === 'RECOVERING') {
    return {
      story: `ನಿಮ್ಮ ${profile.commonName || 'ಗಿಡ'} ಇತ್ತೀಚಿನ ಒತ್ತಡದಿಂದ ಚೇತರಿಸಿಕೊಳ್ಳುತ್ತಿದೆ.`,
      stateLabel,
      growthLabel,
      action: 'ಪ್ರಸ್ತುತ ಪೋಷಕಾಂಶಗಳ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಮುಂದುವರಿಸಿ.',
    };
  }
  if (state === 'GROWING') {
    return {
      story: `ನಿಮ್ಮ ${profile.commonName || 'ಗಿಡ'} ಆರೋಗ್ಯಕರವಾಗಿ ಎಲೆಗಳನ್ನು ಹರಡಿಕೊಳ್ಳುತ್ತಿದೆ.`,
      stateLabel,
      growthLabel,
      action: 'ನಿಯಮಿತ ಬೆಳಕು ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ನಿರ್ವಹಣೆ ಮುಂದುವರಿಸಿ.',
    };
  }
  return {
    story: `ನಿಮ್ಮ ${profile.commonName || 'ಗಿಡ'} ಸಮತೋಲಿತ ಮತ್ತು ಸ್ಥಿರವಾಗಿದೆ.`,
    stateLabel,
    growthLabel,
    action: 'ಯಾವುದೇ ತುರ್ತು ಕ್ರಮ ಅಗತ್ಯವಿಲ್ಲ. ನಿಯಮಿತವಾಗಿ ಗಮನಿಸಿ.',
  };
}

// ============================================================================
// PHASE 9: ENVIRONMENT <-> PLANT CORRELATION LOCALIZATION
// ============================================================================

export function getLocalizedAssociationType(
  type: EnvironmentAssociationType,
  lang: SupportedLanguageCode = 'en'
): string {
  const isKn = lang === 'kn';
  switch (type) {
    case 'ENVIRONMENT_ONLY_CHANGE':
      return isKn ? 'ಪರಿಸರ ಬದಲಾವಣೆ ಮಾತ್ರ' : 'Environmental Shift Only';
    case 'PLANT_ONLY_CHANGE':
      return isKn ? 'ಗಿಡದ ಎಲೆಗಳಲ್ಲಿ ಮಾತ್ರ ಬದಲಾವಣೆ' : 'Plant Visual Shift Only';
    case 'COINCIDENT_CHANGE':
      return isKn ? 'ಏಕಕಾಲಿಕ ಬದಲಾವಣೆಗಳು' : 'Coincident Shifts';
    case 'TEMPORAL_ASSOCIATION':
      return isKn ? 'ಕಾಲಾನುಕ್ರಮ ಪರಸ್ಪರ ಸಂಬಂಧ' : 'Temporal Association';
    case 'LAGGED_ASSOCIATION':
      return isKn ? 'ವಿಳಂಬಿತ ಪರಿಸರ ಪರಿಣಾಮ' : 'Delayed Environmental Response';
    case 'CONFLICTING_EVIDENCE':
      return isKn ? 'ಪರಸ್ಪರ ವಿರುದ್ಧ ಪುರಾವೆಗಳು' : 'Conflicting Evidence';
    case 'INSUFFICIENT_DATA':
      return isKn ? 'ಸಾಕಷ್ಟು ಇತಿಹಾಸವಿಲ್ಲ' : 'Insufficient History';
    case 'NO_CLEAR_ASSOCIATION':
    default:
      return isKn ? 'ಯಾವುದೇ ನೇರ ಸಂಬಂಧವಿಲ್ಲ' : 'No Clear Association';
  }
}

export function getLocalizedAssociationStrength(
  strength: AssociationStrength,
  lang: SupportedLanguageCode = 'en'
): string {
  const isKn = lang === 'kn';
  switch (strength) {
    case 'strong':
      return isKn ? 'ದೃಢವಾದ ಸಂಬಂಧ' : 'Strong Association';
    case 'moderate':
      return isKn ? 'ಮಧ್ಯಮ ಸಂಬಂಧ' : 'Moderate Association';
    case 'weak':
      return isKn ? 'ದುರ್ಬಲ ಸಂಬಂಧ' : 'Weak Association';
    case 'none':
    default:
      return isKn ? 'ಸಂಬಂಧವಿಲ್ಲ' : 'No Statistical Association';
  }
}

export function getLocalizedAssociation(
  assoc: EnvironmentPlantAssociation,
  lang: SupportedLanguageCode = 'en'
): {
  headline: string;
  summary: string;
  whatChanged: string;
  whatHappenedTogether: string;
  whatItMeans: string;
  whatToDo: string;
} {
  const isKn = lang === 'kn';
  if (!isKn) {
    return {
      headline: `${assoc.environmentLabel} & ${assoc.plantLabel}`,
      summary: assoc.summary,
      whatChanged: assoc.farmerSummary.whatChanged,
      whatHappenedTogether: assoc.farmerSummary.whatHappenedTogether,
      whatItMeans: assoc.farmerSummary.whatItMeans,
      whatToDo: assoc.farmerSummary.whatToDo,
    };
  }

  // Kannada translations
  let whatChanged = assoc.farmerSummary.whatChanged;
  let whatHappenedTogether = assoc.farmerSummary.whatHappenedTogether;
  let whatItMeans = assoc.farmerSummary.whatItMeans;
  let whatToDo = assoc.farmerSummary.whatToDo;

  const env = assoc.environmentMetric;
  const envDir = assoc.environmentDirection;
  const plantDir = assoc.plantDirection;

  if (env === 'tds') {
    whatChanged = envDir === 'rising'
      ? `ಪೋಷಕಾಂಶಗಳ ಸಾಂದ್ರತೆ (TDS) ಹೆಚ್ಚಾಗಿದೆ (${Math.round(assoc.environmentValue || 0)} PPM).`
      : envDir === 'falling'
      ? `ಪೋಷಕಾಂಶಗಳ ಸಾಂದ್ರತೆ (TDS) ಕಡಿಮೆಯಾಗಿದೆ (${Math.round(assoc.environmentValue || 0)} PPM).`
      : `ಪೋಷಕಾಂಶಗಳ ಸಾಂದ್ರತೆ ಸ್ಥಿರವಾಗಿದೆ.`;
  } else if (env === 'waterLevel') {
    whatChanged = envDir === 'falling'
      ? `ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ (${Math.round(assoc.environmentValue || 0)}%).`
      : envDir === 'rising'
      ? `ತೊಟ್ಟಿಗೆ ನೀರು ಸೇರಿಸಲಾಗಿದೆ (${Math.round(assoc.environmentValue || 0)}%).`
      : `ನೀರಿನ ಮಟ್ಟ ಸ್ಥಿರವಾಗಿದೆ.`;
  } else if (env === 'ph') {
    whatChanged = `ನೀರಿನ pH ಮಟ್ಟ ${assoc.environmentValue ? assoc.environmentValue.toFixed(2) : ''} ಕ್ಕೆ ಬದಲಾಗಿದೆ.`;
  }

  if (assoc.associationType === 'ENVIRONMENT_ONLY_CHANGE') {
    whatHappenedTogether = 'ಆದರೆ ಗಿಡದ ಎಲೆಗಳು ಯಾವುದೇ ಒತ್ತಡವಿಲ್ಲದೆ ಹಸಿರಾಗಿಯೇ ಉಳಿದಿವೆ.';
    whatItMeans = 'ನೀರಿನಲ್ಲಿ ಬದಲಾವಣೆಯಾಗಿದ್ದರೂ ಗಿಡದ ಮೇಲೆ ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಪರಿಣಾಮ ಬೀರಿಲ್ಲ.';
    whatToDo = 'ನೀರಿನ ಮಟ್ಟವನ್ನು ನಿಯಮಿತವಾಗಿ ಗಮನಿಸುತ್ತಿರಿ.';
  } else if (assoc.associationType === 'PLANT_ONLY_CHANGE') {
    whatChanged = plantDir === 'declined' ? 'ಗಿಡದ ಎಲೆಗಳಲ್ಲಿ ಕೊಂಚ ಬಣ್ಣ ಬದಲಾವಣೆ ಅಥವಾ ಒತ್ತಡ ಕಂಡುಬಂದಿದೆ.' : 'ಗಿಡದ ಎಲೆಗಳ ಬೆಳವಣಿಗೆ ಹೆಚ್ಚಾಗಿದೆ.';
    whatHappenedTogether = 'ಆದರೆ ನೀರಿನ ಸಂವೇದಕಗಳ ಮಟ್ಟ ಸಾಮಾನ್ಯವಾಗಿದೆ.';
    whatItMeans = 'ನೀರಿನಲ್ಲಿ ಯಾವುದೇ ವ್ಯತ್ಯಾಸವಿಲ್ಲದಿದ್ದರೂ ಎಲೆಗಳಲ್ಲಿ ಸಣ್ಣ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ.';
    whatToDo = 'ಬೆಳಕು ಮತ್ತು ಗಾಳಿಯ ಪ್ರಸರಣವನ್ನು ಪರಿಶೀಲಿಸಿ.';
  } else if (assoc.associationType === 'CONFLICTING_EVIDENCE') {
    whatHappenedTogether = 'ಸಂವೇದಕಗಳು ಎಚ್ಚರಿಕೆ ತೋರಿಸುತ್ತಿದ್ದರೂ ಗಿಡವು ಆರೋಗ್ಯಕರವಾಗಿದೆ.';
    whatItMeans = 'ಸಂವೇದಕ ಮತ್ತು ಕ್ಯಾಮೆರಾ ನಡುವೆ ಭಿನ್ನತೆ ಇದೆ. ಸಂವೇದಕ ಸರಿಯಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತಿದೆಯೇ ಪರೀಕ್ಷಿಸಿ.';
    whatToDo = 'ಸಂವೇದಕಗಳ ಶುದ್ಧತೆ ಹಾಗೂ ನೀರಿನ ನೈಜ ಮಟ್ಟವನ್ನು ಕೈಯಾರೆ ಪರಿಶೀಲಿಸಿ.';
  } else if (assoc.associationType === 'LAGGED_ASSOCIATION') {
    whatChanged = `${assoc.lagHours || 24} ಗಂಟೆಗಳ ಹಿಂದೆ ನೀರಿನ ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಬದಲಾವಣೆಯಾಗಿತ್ತು.`;
    whatHappenedTogether = 'ಅದರ ನಂತರ ಈಗ ಗಿಡದ ಎಲೆಗಳಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡುಬರುತ್ತಿದೆ.';
    whatItMeans = 'ನೀರಿನ ವ್ಯತ್ಯಾಸವಾದ ಕೆಲ ಗಂಟೆಗಳ ನಂತರ ಗಿಡದ ಮೇಲೆ ಪರಿಣಾಮ ಕಾಣಿಸಿಕೊಳ್ಳುವುದು ಸಹಜ.';
    whatToDo = 'ತೊಟ್ಟಿಯ ಸಮತೋಲನವನ್ನು ಸರಿಪಡಿಸಿ ಮತ್ತು ಮುಂದಿನ ಅವಲೋಕನ ಗಮನಿಸಿ.';
  } else {
    whatHappenedTogether = plantDir === 'declined'
      ? 'ಅದೇ ಸಮಯದಲ್ಲಿ ಗಿಡದ ಎಲೆಗಳು ಕೊಂಚ ಬಾಡಿದ ಅಥವಾ ಹಳದಿಯಾದ ಲಕ್ಷಣ ತೋರಿಸಿವೆ.'
      : plantDir === 'improved'
      ? 'ಅದೇ ಸಮಯದಲ್ಲಿ ಗಿಡದ ಎಲೆಗಳು ಇನ್ನಷ್ಟು ಹಸಿರಾಗಿ ಬೆಳೆದಿವೆ.'
      : 'ಗಿಡದ ಸ್ಥಿತಿ ಸ್ಥಿರವಾಗಿದೆ.';
    whatItMeans = 'ನೀರಿನ ಪರಿಸ್ಥಿತಿ ಮತ್ತು ಗಿಡದ ನೋಟ ಎರಡೂ ಒಂದೇ ಕಾಲದಲ್ಲಿ ಬದಲಾಗಿವೆ.';
    whatToDo = 'ನೀರು ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನ ಪರಿಶೀಲಿಸಿ.';
  }

  return {
    headline: `${getLocalizedAssociationType(assoc.associationType, lang)}`,
    summary: isKn ? `${getLocalizedAssociationStrength(assoc.associationStrength, lang)} · ${whatChanged}` : assoc.summary,
    whatChanged,
    whatHappenedTogether,
    whatItMeans,
    whatToDo,
  };
}

export function getLocalizedCorrelationSummary(
  summary: CorrelationAnalysisSummary,
  lang: SupportedLanguageCode = 'en'
): {
  headline: string;
  why: string;
  action: string;
  statusLabel: string;
} {
  const isKn = lang === 'kn';
  if (!isKn) {
    return {
      headline: summary.farmerHeadline,
      why: summary.farmerWhy,
      action: summary.farmerAction,
      statusLabel: summary.status === 'active_associations'
        ? 'Active Associations Detected'
        : summary.status === 'insufficient_history'
        ? 'Collecting Historical Data'
        : summary.status === 'sensor_unavailable'
        ? 'Sensors Offline'
        : 'Stable Equilibrium',
    };
  }

  let statusLabel = 'ಸ್ಥಿರ ಸಮತೋಲನ';
  if (summary.status === 'active_associations') statusLabel = 'ಪರಿಸರ ↔ ಗಿಡ ಸಂಬಂಧ ಪತ್ತೆಯಾಗಿದೆ';
  else if (summary.status === 'insufficient_history') statusLabel = 'ಇತಿಹಾಸ ಸಂಗ್ರಹಿಸಲಾಗುತ್ತಿದೆ';
  else if (summary.status === 'sensor_unavailable') statusLabel = 'ಸಂವೇದಕಗಳು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿವೆ';

  if (summary.status === 'insufficient_history') {
    return {
      headline: 'ಪರಿಸರ ಸಂಬಂಧ ತಿಳಿಯಲು ಹೆಚ್ಚಿನ ಇತಿಹಾಸ ಬೇಕು',
      why: 'ಗಿಡ ಮತ್ತು ನೀರಿನ ಸಂಬಂಧವನ್ನು ನಿಖರವಾಗಿ ವಿಶ್ಲೇಷಿಸಲು ಕನಿಷ್ಠ 3 ಅವಲೋಕನಗಳು ಅಗತ್ಯ.',
      action: 'ದಿನವಿಡೀ ವ್ಯವಸ್ಥೆಯನ್ನು ಚಾಲನೆಯಲ್ಲಿರಿಸಿ.',
      statusLabel,
    };
  }

  if (summary.status === 'sensor_unavailable') {
    return {
      headline: 'ನೀರಿನ ಸಂವೇದಕಗಳು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿವೆ',
      why: 'ಸಂವೇದಕಗಳ ಮಾಹಿತಿಯಿಲ್ಲದೆ ಪರಿಸರದ ಪ್ರಭಾವವನ್ನು ಅಳೆಯಲು ಸಾಧ್ಯವಿಲ್ಲ.',
      action: 'ESP32 ಸಂವೇದಕಗಳ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.',
      statusLabel,
    };
  }

  if (summary.primaryAssociation) {
    const loc = getLocalizedAssociation(summary.primaryAssociation, lang);
    return {
      headline: loc.whatHappenedTogether || loc.whatChanged,
      why: loc.whatItMeans,
      action: loc.whatToDo,
      statusLabel,
    };
  }

  return {
    headline: 'ಗಿಡ ಮತ್ತು ಪರಿಸರ ಸ್ಥಿರವಾಗಿವೆ',
    why: 'ನೀರಿನ ಮಟ್ಟ ಹಾಗೂ ಎಲೆಗಳ ಆರೋಗ್ಯ ಎರಡೂ ಸಾಮಾನ್ಯ ಸ್ಥಿತಿಯಲ್ಲಿವೆ.',
    action: 'ನಿಯಮಿತ ಮೇಲ್ವಿಚಾರಣೆಯನ್ನು ಮುಂದುವರಿಸಿ.',
    statusLabel,
  };
}

// ============================================================================
// PHASE 10: CONFIDENCE-AWARE ALERT LOCALIZATION
// ============================================================================

export function getLocalizedAlertSeverity(
  severity: PlantAlertSeverity,
  lang: SupportedLanguageCode = 'en'
): string {
  if (lang !== 'kn') return severity;
  switch (severity) {
    case 'URGENT':
      return 'ತುರ್ತು ಗಮನ';
    case 'ATTENTION':
      return 'ಗಮನಿಸಿ';
    case 'INFO':
      return 'ಮಾಹಿತಿ';
    default:
      return severity;
  }
}

export function getLocalizedAlertCategory(
  category: PlantAlertCategory,
  lang: SupportedLanguageCode = 'en'
): string {
  if (lang !== 'kn') {
    switch (category) {
      case 'PLANT_HEALTH': return 'Plant Health';
      case 'VISUAL_ANOMALY': return 'Visual Anomaly';
      case 'ENVIRONMENT': return 'Environment';
      case 'WATER_LEVEL': return 'Water Level';
      case 'PH': return 'Nutrient pH';
      case 'TDS': return 'Nutrient TDS';
      case 'GROWTH': return 'Growth';
      case 'RECOVERY': return 'Recovery';
      case 'MULTIMODAL': return 'Multimodal';
      case 'DATA_QUALITY': return 'Data Quality';
      default: return category;
    }
  }

  switch (category) {
    case 'PLANT_HEALTH':
      return 'ಗಿಡದ ಆರೋಗ್ಯ';
    case 'VISUAL_ANOMALY':
      return 'ದೃಷ್ಟಿಗೋಚರ ವ್ಯತ್ಯಾಸ';
    case 'ENVIRONMENT':
      return 'ಬೆಳವಣಿಗೆಯ ಪರಿಸರ';
    case 'WATER_LEVEL':
      return 'ನೀರಿನ ಮಟ್ಟ';
    case 'PH':
      return 'pH ಆಮ್ಲೀಯತೆ';
    case 'TDS':
      return 'ಪೋಷಕಾಂಶ ಪ್ರಮಾಣ (TDS)';
    case 'GROWTH':
      return 'ಬೆಳವಣಿಗೆ';
    case 'RECOVERY':
      return 'ಚೇತರಿಕೆ';
    case 'MULTIMODAL':
      return 'ಸಂಯೋಜಿತ ವಿಶ್ಲೇಷಣೆ';
    case 'DATA_QUALITY':
      return 'ಮಾಹಿತಿ ನಿಖರತೆ';
    default:
      return category;
  }
}

export function getLocalizedAlertStatus(
  status: PlantAlertStatus,
  lang: SupportedLanguageCode = 'en'
): string {
  if (lang !== 'kn') return status;
  switch (status) {
    case 'ACTIVE':
      return 'ಸಕ್ರಿಯ';
    case 'ACKNOWLEDGED':
      return 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ';
    case 'RESOLVED':
      return 'ಪರಿಹರಿಸಲಾಗಿದೆ';
    case 'DISMISSED':
      return 'ವಜಾಗೊಳಿಸಲಾಗಿದೆ';
    case 'DETECTED':
      return 'ಪತ್ತೆಯಾಗಿದೆ';
    default:
      return status;
  }
}

export function getLocalizedAlert(
  alert: PlantAlert,
  lang: SupportedLanguageCode = 'en'
): {
  title: string;
  farmerMessage: string;
  farmerWhy: string;
  farmerAction: string;
  limitation: string;
} {
  if (lang !== 'kn') {
    return {
      title: alert.title,
      farmerMessage: alert.farmerMessage,
      farmerWhy: alert.farmerWhy,
      farmerAction: alert.farmerAction,
      limitation: alert.limitation,
    };
  }

  // Kannada localization mapping based on category and triggerType
  switch (alert.category) {
    case 'WATER_LEVEL':
      return {
        title: alert.severity === 'URGENT' ? 'ತುರ್ತು: ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರಿನ ಕೊರತೆ' : 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ',
        farmerMessage: alert.severity === 'URGENT'
          ? `ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರಿನ ಪ್ರಮಾಣ ಅತ್ಯಂತ ಕಡಿಮೆಯಾಗಿದೆ (${alert.currentValue || ''}%). ಪಂಪ್ ಒಣಗುವ ಅಪಾಯವಿದೆ.`
          : `ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರಿನ ಪ್ರಮಾಣ ಕಡಿಮೆಯಾಗಿದೆ (${alert.currentValue || ''}%).`,
        farmerWhy: 'ಗಿಡವು ನೀರನ್ನು ಹೀರಿಕೊಂಡಿದೆ ಮತ್ತು ಆವಿಯಾಗುವಿಕೆಯಿಂದ ನೀರಿನ ಮಟ್ಟ ಇಳಿದಿದೆ.',
        farmerAction: 'ತೊಟ್ಟಿಗೆ ತಕ್ಷಣ ಶುದ್ಧ ನೀರನ್ನು ತುಂಬಿಸಿ.',
        limitation: 'ಅಲ್ಟ್ರಾಸಾನಿಕ್ ಸಂವೇದಕದಿಂದ ಲೆಕ್ಕಾಚಾರ ಮಾಡಲಾಗಿದೆ; ತೊಟ್ಟಿಯ ಆಳವನ್ನು ಕಣ್ಣಾರೆ ಪರೀಕ್ಷಿಸಿ.',
      };

    case 'PH':
      return {
        title: alert.direction === 'falling' ? 'ಆಮ್ಲೀಯ pH ವ್ಯತ್ಯಾಸ' : 'ಕ್ಷಾರೀಯ pH ವ್ಯತ್ಯಾಸ',
        farmerMessage: alert.direction === 'falling'
          ? `ನೀರಿನ pH ಮೌಲ್ಯ (${alert.currentValue || ''}) ಶಿಫಾರಸು ಮಾಡಿದ ವ್ಯಾಪ್ತಿಗಿಂತ ಕಡಿಮೆಯಾಗಿದೆ.`
          : `ನೀರಿನ pH ಮೌಲ್ಯ (${alert.currentValue || ''}) ಶಿಫಾರಸು ಮಾಡಿದ ವ್ಯಾಪ್ತಿಗಿಂತ ಹೆಚ್ಚಾಗಿದೆ.`,
        farmerWhy: 'ಸರಿಯಾದ pH ಇಲ್ಲದಿದ್ದರೆ ಗಿಡಕ್ಕೆ ಅಗತ್ಯ ಪೋಷಕಾಂಶಗಳು ಸಿಗುವುದಿಲ್ಲ.',
        farmerAction: 'ನೀರಿನ pH ಪರೀಕ್ಷಿಸಿ ನಿಗದಿತ ಬಫರ್ ದ್ರಾವಣವನ್ನು ಬಳಸಿ ಸರಿಹೊಂದಿಸಿ.',
        limitation: 'ರಾಸಾಯನಿಕ ಪರೀಕ್ಷೆಯು ನೀರಿನ ಆಮ್ಲೀಯತೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆ; ನೇರ ಪೋಷಕಾಂಶ ರೋಗನಿರ್ಣಯವಲ್ಲ.',
      };

    case 'TDS':
      return {
        title: alert.direction === 'falling' ? 'ಪೋಷಕಾಂಶಗಳ ಕೊರತೆ (TDS)' : 'ಹೆಚ್ಚಿನ ಪೋಷಕಾಂಶ ಸಾಂದ್ರತೆ (TDS)',
        farmerMessage: alert.direction === 'falling'
          ? `ಪೋಷಕಾಂಶ ಲವಣಗಳ ಸಾಂದ್ರತೆ ಕಡಿಮೆಯಾಗಿದೆ (${alert.currentValue || ''} PPM).`
          : `ಪೋಷಕಾಂಶ ಲವಣಗಳ ಸಾಂದ್ರತೆ ಹೆಚ್ಚಾಗಿದೆ (${alert.currentValue || ''} PPM).`,
        farmerWhy: alert.direction === 'falling'
          ? 'ಗಿಡದ ಬೆಳವಣಿಗೆಯಿಂದಾಗಿ ದ್ರಾವ್ಯ ಲವಣಗಳು ಖಾಲಿಯಾಗುತ್ತಿವೆ.'
          : 'ಅತಿಯಾದ ಲವಣಾಂಶವು ಬೇರುಗಳಿಗೆ ಹಾನಿ ಉಂಟುಮಾಡಬಹುದು.',
        farmerAction: alert.direction === 'falling'
          ? 'ಸಮತೋಲಿತ ಪೋಷಕಾಂಶ ದ್ರಾವಣವನ್ನು ಸೇರಿಸಿ.'
          : 'ಸ್ವಚ್ಛ ನೀರನ್ನು ಸೇರಿಸಿ ರಸಗೊಬ್ಬರದ ಸಾಂದ್ರತೆಯನ್ನು ತಗ್ಗಿಸಿ.',
        limitation: 'TDS ಒಟ್ಟು ಕರಗಿದ ಲವಣಗಳನ್ನು ಅಳೆಯುತ್ತದೆ; ಪ್ರತ್ಯೇಕ ಧಾತುಗಳ ಅನುಪಾತವನ್ನು ತಿಳಿಸುವುದಿಲ್ಲ.',
      };

    case 'PLANT_HEALTH':
      return {
        title: alert.severity === 'URGENT' ? 'ಎಲೆಗಳ ಸ್ಥಿತಿ ಗಂಭೀರ ಒತ್ತಡದಲ್ಲಿದೆ' : 'ಎಲೆಗಳ ಆರೋಗ್ಯ ಪರಿಶೀಲನೆ ಅಗತ್ಯ',
        farmerMessage: alert.severity === 'URGENT'
          ? `ಎಲೆಗಳಲ್ಲಿ ಗಮನಾರ್ಹ ಒತ್ತಡದ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ (ಆರೋಗ್ಯ ಅಂಕ: ${alert.currentValue || ''}).`
          : `ಎಲೆಗಳ ಬಣ್ಣ ಮತ್ತು ಚೈತನ್ಯದಲ್ಲಿ ಇಳಿಕೆ ಕಂಡುಬಂದಿದೆ (ಆರೋಗ್ಯ ಅಂಕ: ${alert.currentValue || ''}).`,
        farmerWhy: 'ದೃಷ್ಟಿಗೋಚರ ವಿಶ್ಲೇಷಣೆಯಲ್ಲಿ ಎಲೆಗಳ ಹಸಿರು ಬಣ್ಣ ಮತ್ತು ತಾಜಾತನ ಕಡಿಮೆಯಾಗಿರುವುದು ಪತ್ತೆಯಾಗಿದೆ.',
        farmerAction: 'ಎಲೆಗಳನ್ನು ಹತ್ತಿರದಿಂದ ಪರೀಕ್ಷಿಸಿ ನೀರಿನ ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ಪರಿಶೀಲಿಸಿ.',
        limitation: 'ಕ್ಯಾಮರಾ ಮೇಲ್ಮೈ ಬಣ್ಣವನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತದೆ; ನೇರ ರೋಗಾಣು ಪತ್ತೆ ಸಾಧ್ಯವಿಲ್ಲ.',
      };

    case 'VISUAL_ANOMALY':
      if (alert.metric === 'chlorosis') {
        return {
          title: alert.severity === 'URGENT' ? 'ಎಲೆಗಳು ವ್ಯಾಪಕವಾಗಿ ಹಳದಿಯಾಗುತ್ತಿವೆ' : 'ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿರುವುದು ಪತ್ತೆಯಾಗಿದೆ',
          farmerMessage: `ಎಲೆಗಳ ಮೇಲೆ ಹಳದಿ ಬಣ್ಣ ಹೆಚ್ಚಾಗಿದೆ (ವ್ಯಾಪ್ತಿ: ${alert.currentValue || ''}).`,
          farmerWhy: 'ಕ್ಲೋರೊಫಿಲ್ ಪ್ರಮಾಣ ಕಡಿಮೆಯಾಗುತ್ತಿರುವುದು ಎಲೆಗಳ ಹಳದಿ ಬಣ್ಣಕ್ಕೆ ಕಾರಣವಾಗಬಹುದು.',
          farmerAction: 'ಎಲೆಗಳನ್ನು ಪರೀಕ್ಷಿಸಿ ಮತ್ತು ಇತ್ತೀಚಿನ ನೀರಿನ ಪೋಷಕಾಂಶ ಮಟ್ಟಗಳನ್ನು ಗಮನಿಸಿ.',
          limitation: 'ಹಳದಿ ಬಣ್ಣವು ಬೆಳಕು, ನೀರು ಅಥವಾ ಪೋಷಕಾಂಶ ಬದಲಾವಣೆಯೊಂದಿಗೆ ಕಂಡುಬರಬಹುದು.',
        };
      }
      return {
        title: 'ಎಲೆಗಳ ಅಂಚು ಕಂದುಬಣ್ಣಕ್ಕೆ ತಿರುಗಿದೆ',
        farmerMessage: `ಎಲೆಗಳ ಅಂಚುಗಳು ಒಣಗಿ ಕಂದುಬಣ್ಣಕ್ಕೆ ತಿರುಗಿರುವುದು ಕಂಡುಬಂದಿದೆ (${alert.currentValue || ''}).`,
        farmerWhy: 'ಹೆಚ್ಚಿನ ಉಪ್ಪಿನಾಂಶ ಅಥವಾ ನೀರಿನ ಕೊರತೆಯಿಂದ ಎಲೆಗಳ ತುದಿ ಒಣಗಬಹುದು.',
        farmerAction: 'TDS ಮಟ್ಟವನ್ನು ಪರೀಕ್ಷಿಸಿ ಬೇರುಗಳ ತೇವಾಂಶವನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
        limitation: 'ಕ್ಯಾಮರಾ ಒಣಗಿದ ಅಂಗಾಂಶದ ಬಣ್ಣವನ್ನು ಗುರುತಿಸುತ್ತದೆ; ಸೂಕ್ಷ್ಮಾಣು ಪರೀಕ್ಷೆಯಲ್ಲ.',
      };

    case 'GROWTH':
      return {
        title: 'ಗಿಡದ ಹರಡುವಿಕೆಯಲ್ಲಿ ಇಳಿಕೆ ಕಂಡುಬಂದಿದೆ',
        farmerMessage: `ಗಿಡದ ಎಲೆಗಳ ಹರಡುವಿಕೆ ಮುಂಚೆಗಿಂತ ಕಡಿಮೆಯಾಗಿ ಕಾಣುತ್ತಿದೆ (${alert.currentValue || ''}).`,
        farmerWhy: 'ಎಲೆಗಳು ಬಾಡಿರುವುದು ಅಥವಾ ಬಾಗಿರುವುದರಿಂದ ಇದು ಸಂಭವಿಸಿರಬಹುದು.',
        farmerAction: 'ಗಿಡ ಬಾಡುತ್ತಿದೆಯೇ ಎಂದು ಪರೀಕ್ಷಿಸಿ ಮತ್ತು ಬೇರುಗಳಿಗೆ ಗಾಳಿ ಸಿಗುತ್ತಿದೆಯೇ ಗಮನಿಸಿ.',
        limitation: 'ಕ್ಯಾಮರಾ ಕೋನ ಅಥವಾ ಬೆಳಕಿನ ವ್ಯತ್ಯಾಸದಿಂದಲೂ ಎಲೆಗಳ ಹರಡುವಿಕೆ ಬದಲಾಗಬಹುದು.',
      };

    case 'MULTIMODAL':
      return {
        title: alert.title || 'ಪರಿಸರ ಬದಲಾವಣೆಯೊಂದಿಗೆ ಎಲೆಗಳ ಸ್ಥಿತಿಯಲ್ಲಿ ವ್ಯತ್ಯಾಸ',
        farmerMessage: alert.farmerMessage || 'ಪರಿಸರ ನಿಯತಾಂಕಗಳ ವ್ಯತ್ಯಾಸದ ಜೊತೆಗೆ ಗಿಡದಲ್ಲೂ ಒತ್ತಡದ ಲಕ್ಷಣಗಳು ಕಂಡುಬಂದಿವೆ.',
        farmerWhy: alert.farmerWhy || 'ಪರಿಸರ ಬದಲಾವಣೆಯ ಅವಧಿಯಲ್ಲೇ ಎಲೆಗಳಲ್ಲೂ ಬದಲಾವಣೆ ಸಂಭವಿಸಿದೆ.',
        farmerAction: 'ತೊಟ್ಟಿಯ ಪರಿಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ನಿಗಾ ಇರಿಸಿ.',
        limitation: 'ಇದು ಏಕಕಾಲದಲ್ಲಿ ಸಂಭವಿಸಿದ ಘಟನೆಗಳ ಸಹಸಂಬಂಧವಾಗಿದೆ; ನೇರ ಜೈವಿಕ ಕಾರಣವನ್ನು ಸಾಬೀತುಪಡಿಸುವುದಿಲ್ಲ.',
      };

    case 'DATA_QUALITY':
      if (alert.metric === 'telemetry') {
        return {
          title: 'ಸಂವೇದಕಗಳ ಮಾಹಿತಿ ಸ್ಥಗಿತಗೊಂಡಿದೆ',
          farmerMessage: 'ಸೆನ್ಸರ್‌ಗಳಿಂದ ಹೊಸ ಮಾಹಿತಿ ಬರುತ್ತಿಲ್ಲ. ಹಿಂದಿನ ಮೌಲ್ಯಗಳನ್ನು ಮಾತ್ರ ತೋರಿಸಲಾಗುತ್ತಿದೆ.',
          farmerWhy: 'ESP32 ಸಂವೇದಕದಿಂದ ಸಂವಹನ ಸ್ಥಗಿತಗೊಂಡಿದೆ.',
          farmerAction: 'ಸಾಧನದ ಪವರ್ ಮತ್ತು ಯುಎಸ್‌ಬಿ/ಸೀರಿಯಲ್ ಸಂಪರ್ಕವನ್ನು ಪರಿಶೀಲಿಸಿ.',
          limitation: 'ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲದಿದ್ದಾಗ ಪರಿಸರದ ನಿಖರ ಮೌಲ್ಯಮಾಪನ ಸಾಧ್ಯವಿಲ್ಲ.',
        };
      }
      return {
        title: 'ಕ್ಯಾಮರಾದಲ್ಲಿ ಗಿಡ ಸ್ಪಷ್ಟವಾಗಿ ಕಾಣಿಸುತ್ತಿಲ್ಲ',
        farmerMessage: 'ಕ್ಯಾಮರಾ ಮುಂದೆ ಗಿಡದ ಎಲೆಗಳು ಪತ್ತೆಯಾಗಿಲ್ಲ.',
        farmerWhy: 'ಕ್ಯಾಮರಾ ದೃಷ್ಟಿಕೋನ ಸರಿಯಾಗಿಲ್ಲದಿರಬಹುದು ಅಥವಾ ಬೆಳಕಿನ ಕೊರತೆ ಇರಬಹುದು.',
        farmerAction: 'ಕ್ಯಾಮರಾವನ್ನು ಗಿಡದ ಎಲೆಗಳ ಕಡೆಗೆ ಸರಿಯಾಗಿ ಹೊಂದಿಸಿ.',
        limitation: 'ಕ್ಯಾಮರಾದಲ್ಲಿ ಎಲೆಗಳು ಸ್ಪಷ್ಟವಾಗಿರದಿದ್ದಾಗ ಆರೋಗ್ಯ ವಿಶ್ಲೇಷಣೆ ಸಾಧ್ಯವಿಲ್ಲ.',
      };

    default:
      return {
        title: alert.title,
        farmerMessage: alert.farmerMessage,
        farmerWhy: alert.farmerWhy,
        farmerAction: alert.farmerAction,
        limitation: alert.limitation,
      };
  }
}



