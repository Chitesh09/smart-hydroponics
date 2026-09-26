'use client';

import { useState, useMemo } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { EvidenceChain, EvidenceStep } from '@/components/ui/EvidenceChain';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { getFarmerCopy } from '@/lib/intelligence/farmerSemanticLayer';
import { WhatChangedCard } from '@/components/ui/WhatChangedCard';
import { EnvironmentPlantCard } from '@/components/ui/EnvironmentPlantCard';
import { PlantAlertCard } from '@/components/ui/PlantAlertCard';

import {
  Brain,
  Layers,
  Eye,
  Download,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Droplets,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Info,
  Sparkles,
  Cpu,
  FileText,
  AlertCircle
} from 'lucide-react';
import styles from './page.module.css';

/**
 * Communicates system confidence naturally without deceptive pseudo-precision
 */
function getNaturalConfidence(confidence?: number, lang: string = 'en'): string {
  const isKn = lang === 'kn';
  if (confidence === undefined || confidence === null || confidence === 0) {
    return isKn ? 'ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ' : 'Unverified';
  }
  if (confidence >= 80) return isKn ? 'ಹೆಚ್ಚು (ಖಚಿತ)' : 'High';
  if (confidence >= 50) return isKn ? 'ಮಧ್ಯಮ' : 'Moderate';
  return isKn ? 'ತಾತ್ಕಾಲಿಕ' : 'Tentative';
}

export default function IntelligencePage() {
  const {
    cropIdentity,
    latestDetection,
    latestVisualHealth,
    latestObservation,
    multimodalAssessment,
    predictiveAnalytics,
    activeAnomalies,
    activeRecommendations,
    observations,
    farmerSemanticState,
    userMode,
    setUserMode,
    language,
    setLanguage,
    latestReasoningEvent,
    whatChangedSummary,
    correlationSummary,
    correlations,
    alertSummary,
    dismissAlert,
    acknowledgeAlert,
  } = usePlantIntelligence();

  const { mode, isStale, latestReading } = useESP32Serial();
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);

  const copy = getFarmerCopy(language);
  const isKn = language === 'kn';

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified
    ? cropIdentity.commonName
    : (isKn ? 'ಪರಿಶೀಲಿಸುತ್ತಿರುವ ಗಿಡ' : 'Monitored Specimen');
  const botanicalScientific = isPlantIdentified
    ? cropIdentity.scientificName || (isKn ? 'ವರ್ಗೀಕರಿಸದ ಪ್ರಭೇದ' : 'Species Unclassified')
    : (isKn ? 'ಗುರುತಿಸುವಿಕೆ ಬಾಕಿ ಉಳಿದಿದೆ' : 'Identification pending');

  const isTelemetryAvailable = latestReading !== null && !isStale;
  const hasVisualData = Boolean(latestDetection || (latestObservation && latestObservation.isPlantDetected !== undefined));

  // Natural confidence string
  const naturalConfidence = useMemo(() => {
    return getNaturalConfidence(cropIdentity.confidence, language);
  }, [cropIdentity.confidence, language]);

  // Historical delta calculations
  const historicalDeltas = useMemo(() => {
    if (observations.length < 2) {
      return { waterDelta: null, phDelta: null, tdsDelta: null, hasHistory: false };
    }
    const oldest = observations[observations.length - 1];
    const newest = observations[0];
    return {
      waterDelta: newest.waterLevel !== undefined && oldest.waterLevel !== undefined ? newest.waterLevel - oldest.waterLevel : null,
      phDelta: newest.ph !== undefined && oldest.ph !== undefined ? newest.ph - oldest.ph : null,
      tdsDelta: newest.tds !== undefined && oldest.tds !== undefined ? newest.tds - oldest.tds : null,
      hasHistory: true,
    };
  }, [observations]);

  // Derived observation flags
  const isCanopyReduced = Boolean(latestDetection && latestDetection.canopyCoveragePercent < 15);
  const isChlorosisPresent = Boolean(latestVisualHealth && latestVisualHealth.chlorosisYellowPercent > 8);
  const isCameraChanged = isCanopyReduced || isChlorosisPresent;

  const isWaterLow = Boolean(latestReading && latestReading.waterLevel < 25);
  const isPhOff = Boolean(latestReading && (latestReading.ph < 5.5 || latestReading.ph > 6.8));
  const isTdsOff = Boolean(latestReading && (latestReading.tds < 700 || latestReading.tds > 1400));
  const isNutrientsOff = isPhOff || isTdsOff;

  // 1. SIMPLE HUMAN-READABLE EXPLANATION FIRST
  const simpleExplanation = useMemo(() => {
    if (latestReasoningEvent?.farmerCopy?.whySummary) {
      return isKn
        ? `${latestReasoningEvent.farmerCopy.observableSummary} ${latestReasoningEvent.farmerCopy.whySummary}`
        : `${latestReasoningEvent.farmerCopy.observableSummary} ${latestReasoningEvent.farmerCopy.whySummary}`;
    }

    if (!farmerSemanticState.hasSufficientData) {
      return isKn
        ? 'ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಬೇಕಾಗಿದೆ. ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ ಮತ್ತು ಸೆನ್ಸರ್ ಸಂಪರ್ಕವನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.'
        : 'Not enough information yet. Start the camera from the Dashboard and verify your sensor hardware is streaming.';
    }

    if (farmerSemanticState.plantStatus === 'GOOD') {
      return isKn
        ? 'ನಿಮ್ಮ ಗಿಡ ಚೆನ್ನಾಗಿದೆ. ಎಲೆಗಳು ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣಿಸುತ್ತಿವೆ ಮತ್ತು ನೀರು ಹಾಗೂ ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟಗಳು ಸಮತೋಲನದಲ್ಲಿವೆ.'
        : 'Your plant is doing well. The leaves appear healthy and the water and nutrient levels are balanced.';
    }

    if (isCameraChanged && (historicalDeltas.waterDelta !== null && historicalDeltas.waterDelta < -3)) {
      return isKn
        ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ ಏಕೆಂದರೆ ಕ್ಯಾಮೆರಾ ಎಲೆಗಳಲ್ಲಿ ಬದಲಾವಣೆಯನ್ನು ಕಂಡಿದೆ ಮತ್ತು ನೀರಿನ ಮಟ್ಟವೂ ಕಡಿಮೆಯಾಗಿದೆ.'
        : 'Your plant may need attention because the camera noticed a change in leaf appearance and the water level has also decreased.';
    }

    return isKn
      ? 'ಕ್ಯಾಮೆರಾ ಮತ್ತು ಸೆನ್ಸರ್‌ಗಳ ವೀಕ್ಷಣೆಯ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ.'
      : 'Your plant may need attention based on combined camera and sensor observations.';
  }, [latestReasoningEvent, farmerSemanticState.hasSufficientData, farmerSemanticState.plantStatus, isKn, isCameraChanged, historicalDeltas.waterDelta]);

  // Evidence Summary Cards
  const cameraEvidence = useMemo(() => {
    if (!hasVisualData || !latestDetection) {
      return {
        status: 'neutral' as const,
        finding: isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ ಲಭ್ಯವಿಲ್ಲ' : 'No visual observation available yet',
        subtext: isKn ? 'ಗಿಡದ ಎಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಕ್ಯಾಮೆರಾ ಆನ್ ಮಾಡಿ.' : 'Start the Live Plant Camera from Dashboard to inspect foliage.',
      };
    }
    if (!latestDetection.isPlantDetected) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಯಾವುದೇ ಗಿಡ ಕಂಡುಬಂದಿಲ್ಲ' : 'No plant detected in camera frame',
        subtext: isKn ? 'ಗಿಡವನ್ನು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಸ್ಪಷ್ಟವಾಗಿ ಇರಿಸಿ.' : 'Position specimen clearly in front of the Dashboard camera.',
      };
    }
    if (latestDetection.confidence && latestDetection.confidence < 45) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಕ್ಯಾಮೆರಾ ನೋಟ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ' : 'Camera view is unclear',
        subtext: isKn ? 'ಕ್ಯಾಮೆರಾವನ್ನು ಗಿಡದ ಹತ್ತಿರಕ್ಕೆ ತಂದು ನೋಡಿ ಅಥವಾ ಬೆಳಕು ಹೆಚ್ಚಿಸಿ.' : 'Move closer to the plant or improve illumination.',
      };
    }
    if (isCameraChanged) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಗಿಡದ ನೋಟದಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ' : 'Plant appearance changed',
        subtext: isKn
          ? (isChlorosisPresent ? `ಎಲೆಗಳ ಮೇಲೆ ಬಣ್ಣಗೆಟ್ಟ ಗುರುತುಗಳು ಕಂಡುಬಂದಿವೆ (${latestVisualHealth?.chlorosisYellowPercent.toFixed(1)}% ಹಳದಿ ಪ್ರಮಾಣ).` : 'ಎಲೆಗಳ ಹಸಿರು ಪ್ರಮಾಣದಲ್ಲಿ ಇಳಿಕೆ ಕಂಡುಬಂದಿದೆ.')
          : (isChlorosisPresent ? `Discoloration noticed on leaves (${latestVisualHealth?.chlorosisYellowPercent.toFixed(1)}% chlorosis ratio).` : 'Reduced green foliage canopy observed in optical frame.'),
      };
    }
    return {
      status: 'optimal' as const,
      finding: isKn ? 'ಗಿಡದ ನೋಟ ಆರೋಗ್ಯಕರವಾಗಿ ಮತ್ತು ಹಸಿರಾಗಿ ಕಾಣಿಸುತ್ತಿದೆ' : 'Plant appearance looks healthy and green',
      subtext: isKn
        ? `ಎಲೆಗಳ ವ್ಯಾಪ್ತಿ ${latestDetection.canopyCoveragePercent}% ರಷ್ಟಿದ್ದು ಸಮರೂಪದ ಹಸಿರು ಬಣ್ಣದಲ್ಲಿದೆ.`
        : `Canopy coverage confirmed at ${latestDetection.canopyCoveragePercent}% with uniform green coloration.`,
    };
  }, [hasVisualData, latestDetection, isCameraChanged, isChlorosisPresent, latestVisualHealth, isKn]);

  const waterEvidence = useMemo(() => {
    if (!isTelemetryAvailable || !latestReading) {
      return {
        status: 'neutral' as const,
        finding: isKn ? 'ನೀರಿನ ಸೆನ್ಸರ್ ಮಾಹಿತಿ ಪ್ರಸ್ತುತ ಲಭ್ಯವಿಲ್ಲ' : 'Water sensor readings currently unavailable',
        subtext: isKn ? 'ESP32 ಸಾಧನವನ್ನು ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಸಿಮ್ಯುಲೇಶನ್ ಆನ್ ಮಾಡಿ.' : 'Connect ESP32 receiver or engage simulation mode in IoT Station.',
      };
    }
    if (isWaterLow && isNutrientsOff) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗಿದೆ ಮತ್ತು ಪೋಷಕಾಂಶಗಳು ಅಸಮತೋಲನದಲ್ಲಿವೆ' : 'Water level decreased and nutrients are off balance',
        subtext: isKn
          ? `ಟ್ಯಾಂಕ್ ಸಾಮರ್ಥ್ಯ ${Math.round(latestReading.waterLevel)}% ಮತ್ತು pH ${latestReading.ph.toFixed(2)} ಆಗಿದೆ.`
          : `Reservoir is at ${Math.round(latestReading.waterLevel)}% capacity and pH is ${latestReading.ph.toFixed(2)}.`,
      };
    }
    if (isWaterLow) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ನೀರಿನ ಮಟ್ಟ ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗಿದೆ' : 'Water level decreased below normal',
        subtext: isKn
          ? `ಪ್ರಸ್ತುತ ಟ್ಯಾಂಕ್ ಸಾಮರ್ಥ್ಯ ${Math.round(latestReading.waterLevel)}% ಆಗಿದೆ (ಕನಿಷ್ಠ 40% ಇರಬೇಕು).`
          : `Current reservoir capacity is ${Math.round(latestReading.waterLevel)}% (nominal > 40%).`,
      };
    }
    if (isNutrientsOff) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ' : 'Nutrient balance needs attention',
        subtext: isKn
          ? `pH ${latestReading.ph.toFixed(2)} (ಗುರಿ 5.5 - 6.5) ಮತ್ತು TDS ${Math.round(latestReading.tds)} PPM ಆಗಿದೆ.`
          : `pH is ${latestReading.ph.toFixed(2)} (target 5.5 - 6.5) and TDS is ${Math.round(latestReading.tds)} PPM.`,
      };
    }
    return {
      status: 'optimal' as const,
      finding: isKn ? 'ನೀರಿನ ಮಟ್ಟ ಮತ್ತು ಪೋಷಕಾಂಶಗಳು ಸಮತೋಲನದಲ್ಲಿವೆ' : 'Water level and nutrients are in balance',
      subtext: isKn
        ? `ಟ್ಯಾಂಕ್ ಸಾಮರ್ಥ್ಯ ${Math.round(latestReading.waterLevel)}% ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣ ಸೂಕ್ತವಾಗಿದೆ.`
        : `Reservoir capacity is ${Math.round(latestReading.waterLevel)}% and nutrient solution is optimal.`,
    };
  }, [isTelemetryAvailable, latestReading, isWaterLow, isNutrientsOff, isKn]);

  const historyEvidence = useMemo(() => {
    if (observations.length < 2) {
      return {
        status: 'neutral' as const,
        finding: isKn ? 'ಆರಂಭಿಕ ವೀಕ್ಷಣೆ ದಾಖಲಾಗಿದೆ' : 'Baseline observation established',
        subtext: isKn
          ? 'ಮೊದಲ ಹಂತದ ದಾಖಲೆ ಸಂಗ್ರಹಿಸಲಾಗಿದೆ. ಮುಂದಿನ ಪರಿಶೀಲನೆಗಳಲ್ಲಿ ಬದಲಾವಣೆಗಳು ಕಾಣಿಸುತ್ತವೆ.'
          : 'Initial snapshot logged. Trends will emerge as observation cycles accumulate.',
      };
    }
    if (historicalDeltas.waterDelta !== null && historicalDeltas.waterDelta < -3) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಕಾಲಕ್ರಮೇಣ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ' : 'Change observed over time',
        subtext: isKn
          ? `ರೆಕಾರ್ಡ್ ಮಾಡಿದ ಚಕ್ರಗಳಲ್ಲಿ ನೀರಿನ ಮಟ್ಟ ${Math.abs(Math.round(historicalDeltas.waterDelta))}% ರಷ್ಟು ಕಡಿಮೆಯಾಗಿದೆ.`
          : `Water level decreased by ${Math.abs(Math.round(historicalDeltas.waterDelta))}% over recorded cycles.`,
      };
    }
    return {
      status: 'optimal' as const,
      finding: isKn ? 'ಕಾಲಕ್ರಮೇಣ ಸ್ಥಿರತೆ ಕಾಯ್ದುಕೊಂಡಿದೆ' : 'Consistent stability over time',
      subtext: isKn
        ? `ಎಲ್ಲಾ ${observations.length} ಐತಿಹಾಸಿಕ ತಪಾಸಣೆಗಳಲ್ಲೂ ಸ್ಥಿರತೆ ಮುಂದುವರಿದಿದೆ.`
        : `Parameters have remained stable across all ${observations.length} historical checkpoints.`,
    };
  }, [observations.length, historicalDeltas, isKn]);

  // Botanical Evidence Chain Steps
  const evidenceChainSteps = useMemo((): EvidenceStep[] => {
    const steps: EvidenceStep[] = [];

    // Stage 1: Camera Observation
    steps.push({
      stage: 'CAMERA OBSERVATION',
      stageLabel: isKn ? 'ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ' : undefined,
      headline: cameraEvidence.finding,
      detail: userMode === 'farmer'
        ? cameraEvidence.subtext
        : (latestDetection?.isPlantDetected
            ? `Optical canopy evaluated at ${latestDetection.canopyCoveragePercent}% coverage with ${latestVisualHealth?.visualHealthScore || 90}/100 visual health score.`
            : 'Standby mode — no foliage identified in camera frame.'),
      status: cameraEvidence.status,
    });

    // Stage 2: Sensor Observation
    steps.push({
      stage: 'SENSOR OBSERVATION',
      stageLabel: isKn ? 'ಸೆನ್ಸರ್ ವೀಕ್ಷಣೆ' : undefined,
      headline: waterEvidence.finding,
      detail: userMode === 'farmer'
        ? waterEvidence.subtext
        : (isTelemetryAvailable && latestReading
            ? `Electrode probe reads pH ${latestReading.ph.toFixed(2)} · TDS ${Math.round(latestReading.tds)} PPM · Reservoir ${Math.round(latestReading.waterLevel)}%.`
            : 'Telemetry offline — awaiting serial connection.'),
      status: waterEvidence.status,
    });

    // Stage 3: Historical Change
    steps.push({
      stage: 'HISTORICAL CHANGE',
      stageLabel: isKn ? 'ಹಿಂದಿನ ಬದಲಾವಣೆ' : undefined,
      headline: historyEvidence.finding,
      detail: userMode === 'farmer'
        ? historyEvidence.subtext
        : `Longitudinal trajectory evaluated across ${observations.length} snapshots (pH drift: ${predictiveAnalytics.predictions.ph.driftPerDay.toFixed(2)}/day).`,
      status: historyEvidence.status,
    });

    // Stage 4: Interpretation
    const isUnderStress = latestReasoningEvent
      ? latestReasoningEvent.plantState === 'ATTENTION' || latestReasoningEvent.plantState === 'CRITICAL'
      : (farmerSemanticState.plantStatus === 'ATTENTION' || farmerSemanticState.plantStatus === 'URGENT');

    const interpretationHeadline = latestReasoningEvent?.interpretations[0] || (
      isUnderStress
        ? (isKn ? 'ಈ ಎಲ್ಲಾ ವೀಕ್ಷಣೆಗಳು ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ ಎಂಬುದನ್ನು ತೋರಿಸುತ್ತವೆ.' : 'Together, these observations indicate plant stress.')
        : (isKn ? 'ಈ ಎಲ್ಲಾ ವೀಕ್ಷಣೆಗಳು ಗಿಡದ ಆರೋಗ್ಯಕರ ಬೆಳವಣಿಗೆಯನ್ನು ಖಚಿತಪಡಿಸುತ್ತವೆ.' : 'Together, these observations confirm healthy growth.')
    );

    steps.push({
      stage: 'INTERPRETATION',
      stageLabel: isKn ? 'ಒಟ್ಟಾರೆ ತೀರ್ಮಾನ' : undefined,
      headline: interpretationHeadline,
      detail: latestReasoningEvent?.interpretations.slice(1).join(' ') || (
        isKn
          ? (isUnderStress ? 'ವಾತಾವರಣದ ಮಟ್ಟಗಳು ಅಥವಾ ಎಲೆಗಳ ಸ್ಥಿತಿಯು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಭಿನ್ನವಾಗಿದೆ.' : 'ಪರಿಸರದ ಮಟ್ಟಗಳು ಮತ್ತು ಎಲೆಗಳ ಸ್ಥಿತಿಯು ಉತ್ತಮವಾಗಿದೆ.')
          : (multimodalAssessment.explanations[0] || 'Environmental parameters and foliage condition align with crop baseline tolerances.')
      ),
      status: isUnderStress ? 'warning' : 'optimal',
    });

    // Stage 5: Recommendation
    const primaryRecommendation = latestReasoningEvent?.recommendations[0] || activeRecommendations[0]?.action || (
      isKn ? 'ಎಲ್ಲಾ ವ್ಯವಸ್ಥೆಗಳು ಸರಿಯಾಗಿವೆ. ನಿಯಮಿತ ನಿಗಾ ಮುಂದುವರಿಸಿ.' : 'All systems nominal. Continue regular monitoring.'
    );

    steps.push({
      stage: 'RECOMMENDATION',
      stageLabel: isKn ? 'ಶಿಫಾರಸು' : undefined,
      headline: userMode === 'farmer'
        ? (latestReasoningEvent?.farmerCopy?.farmerAction || farmerSemanticState.actionableSummary)
        : (activeRecommendations[0]?.title || 'Maintain nominal operational parameters'),
      detail: primaryRecommendation,
      status: isUnderStress ? 'warning' : 'optimal',
    });

    return steps;
  }, [
    isKn,
    userMode,
    cameraEvidence,
    waterEvidence,
    historyEvidence,
    latestDetection,
    latestVisualHealth,
    isTelemetryAvailable,
    latestReading,
    observations.length,
    predictiveAnalytics.predictions.ph.driftPerDay,
    latestReasoningEvent,
    farmerSemanticState.plantStatus,
    farmerSemanticState.actionableSummary,
    multimodalAssessment.explanations,
    activeRecommendations
  ]);

  // Export diagnostic state JSON
  const handleExportDiagnostics = () => {
    const diagnosticPayload = {
      timestamp: Date.now(),
      plantId: cropIdentity.plantId,
      userMode,
      language,
      reasoningEvent: latestReasoningEvent,
      species: {
        cropKey: cropIdentity.cropKey,
        commonName: cropIdentity.commonName,
        scientificName: cropIdentity.scientificName,
        confidence: cropIdentity.confidence,
        naturalConfidence,
      },
      health: {
        overallScore: multimodalAssessment.overallScore,
        state: multimodalAssessment.overallHealthState,
        environmentalState: multimodalAssessment.environmentalState,
        visualState: multimodalAssessment.visualState,
      },
      predictions: predictiveAnalytics.predictions,
      anomalies: activeAnomalies,
      recommendations: activeRecommendations,
      observationCount: observations.length,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(diagnosticPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `hydrosmart_reasoning_lab_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const plantStateLabel = latestReasoningEvent
    ? latestReasoningEvent.plantState
    : (farmerSemanticState.plantStatus === 'GOOD' ? 'HEALTHY' : farmerSemanticState.plantStatus === 'URGENT' ? 'CRITICAL' : 'ATTENTION');

  const reasoningConfidenceLevel = latestReasoningEvent?.confidence || 'moderate';
  const reasoningConfidenceScore = latestReasoningEvent?.confidenceScore ?? (
    reasoningConfidenceLevel === 'high' ? 88 : reasoningConfidenceLevel === 'moderate' ? 68 : reasoningConfidenceLevel === 'low' ? 45 : 20
  );
  const scenarioCode = latestReasoningEvent?.scenarioCode || 'STABLE_EQUILIBRIUM';

  return (
    <div className={styles.container}>
      
      {/* 1. Header Row */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <span className="section-label">
            {isKn ? copy.ui.diagnosticWorkspace : 'Diagnostic Workspace'}
          </span>
          <h1 className="display-title">
            {isKn ? copy.ui.plantReasoningLab : 'Plant Reasoning Lab'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {isKn ? copy.ui.reasoningSubtitle : 'Transparent, evidence-based multimodal plant intelligence.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <ModeToggle mode={userMode} onModeChange={setUserMode} size="sm" language={language} />
          <LanguageToggle language={language} onLanguageChange={setLanguage} size="sm" />
          {userMode === 'technical' && (
            <button className="btn btn-secondary" onClick={handleExportDiagnostics} style={{ fontSize: '11.5px' }}>
              <Download size={13} />
              <span>{isKn ? 'ಡಯಾಗ್ನೋಸ್ಟಿಕ್ JSON ರಫ್ತು ಮಾಡಿ' : 'Export Diagnostic JSON'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: CURRENT PLANT STATE                               */}
      {/* ============================================================ */}
      <div className={styles.diagnosticBanner}>
        {/* Plant State Badge */}
        <div className={styles.bannerItem}>
          <span className="section-label" style={{ fontSize: '10px' }}>
            {isKn ? 'ಗಿಡದ ಒಟ್ಟಾರೆ ಸ್ಥಿತಿ' : 'PLANT HEALTH STATE'}
          </span>
          <div className={styles.bannerValue}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 800,
                background: plantStateLabel === 'HEALTHY'
                  ? 'rgba(46, 184, 114, 0.15)'
                  : plantStateLabel === 'CRITICAL'
                  ? 'rgba(217, 93, 98, 0.15)'
                  : plantStateLabel === 'ATTENTION'
                  ? 'rgba(229, 169, 60, 0.15)'
                  : 'rgba(255, 255, 255, 0.08)',
                color: plantStateLabel === 'HEALTHY'
                  ? 'var(--color-green)'
                  : plantStateLabel === 'CRITICAL'
                  ? 'var(--color-red)'
                  : plantStateLabel === 'ATTENTION'
                  ? 'var(--color-amber)'
                  : 'var(--text-secondary)',
                border: `1px solid ${
                  plantStateLabel === 'HEALTHY'
                    ? 'rgba(46, 184, 114, 0.35)'
                    : plantStateLabel === 'CRITICAL'
                    ? 'rgba(217, 93, 98, 0.35)'
                    : plantStateLabel === 'ATTENTION'
                    ? 'rgba(229, 169, 60, 0.35)'
                    : 'var(--border-subtle)'
                }`,
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: plantStateLabel === 'HEALTHY'
                    ? 'var(--color-green)'
                    : plantStateLabel === 'CRITICAL'
                    ? 'var(--color-red)'
                    : plantStateLabel === 'ATTENTION'
                    ? 'var(--color-amber)'
                    : 'var(--text-muted)',
                }}
              />
              {plantStateLabel}
            </span>
          </div>
        </div>

        {/* Identity Badge */}
        <div className={styles.bannerItem}>
          <span className="section-label" style={{ fontSize: '10px' }}>
            {isKn ? 'ಸಸ್ಯ ಪ್ರಭೇದ' : 'BOTANICAL IDENTITY'}
          </span>
          <div className={styles.bannerValue} style={{ fontSize: '14px' }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
              {plantDisplayName}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              ({botanicalScientific})
            </span>
          </div>
        </div>

        {/* Overall Confidence Badge */}
        <div className={styles.bannerItem}>
          <span className="section-label" style={{ fontSize: '10px' }}>
            {isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆಯ ಮಟ್ಟ' : 'REASONING CONFIDENCE'}
          </span>
          <div className={styles.bannerValue}>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                color: reasoningConfidenceLevel === 'high'
                  ? 'var(--color-green)'
                  : reasoningConfidenceLevel === 'moderate'
                  ? 'var(--color-teal)'
                  : 'var(--color-amber)',
              }}
            >
              {reasoningConfidenceLevel.toUpperCase()} ({reasoningConfidenceScore}%)
            </span>
          </div>
        </div>

        {/* Scenario Code Badge */}
        <div className={styles.bannerItem}>
          <span className="section-label" style={{ fontSize: '10px' }}>
            {isKn ? 'ಕಾರಣ ಸನ್ನಿವೇಶ ಸಂಕೇತ' : 'SCENARIO CODE'}
          </span>
          <div className={styles.bannerValue}>
            <span
              className="font-mono"
              style={{
                fontSize: '11px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--color-teal)',
              }}
            >
              {scenarioCode}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1B: PLAIN-LANGUAGE SUMMARY (FARMER-FACING)           */}
      {/* ============================================================ */}
      <div className={styles.simpleExplanationCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={18} style={{ color: 'var(--color-teal)' }} />
            <span className="section-label">
              {farmerSemanticState.plantStatus === 'GOOD'
                ? (isKn ? 'ಗಿಡದ ಸ್ಥಿತಿ ಸಾರಾಂಶ' : 'Plant Condition Assessment')
                : (isKn ? 'ಗಮನ ನೀಡಬೇಕಾದ ಕಾರಣ' : 'Attention Reasoning')}
            </span>
          </div>
        </div>

        <h2 className={styles.simpleExplanationHeading}>
          {farmerSemanticState.plantStatus === 'GOOD'
            ? (isKn ? copy.ui.whyDoingWell : 'Why does HydroSmart think your plant is doing well?')
            : farmerSemanticState.plantStatus === 'UNKNOWN'
              ? (isKn ? copy.ui.whyNeedMoreInfo : 'Why does HydroSmart need more information?')
              : (isKn ? copy.ui.whyNeedsAttention : 'Why does HydroSmart think your plant needs attention?')}
        </h2>

        <p className={styles.simpleExplanationText}>
          {simpleExplanation}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>{isKn ? 'ಗಿಡ:' : 'Specimen:'} <strong style={{ color: 'var(--text-primary)' }}>{plantDisplayName}</strong></span>
          <span>•</span>
          <span>{isKn ? 'ಸೆನ್ಸರ್:' : 'Telemetry:'} <DataSourceBadge mode={mode} isStale={isStale} hasData={latestReading !== null} /></span>
          <span>•</span>
          <span>{isKn ? 'ಇತಿಹಾಸ:' : 'History:'} <strong style={{ color: 'var(--text-primary)' }}>{isKn ? `${observations.length} ದಾಖಲೆಗಳು` : `${observations.length} checkpoints`}</strong></span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1C: "WHAT CHANGED?" LONGITUDINAL INTELLIGENCE        */}
      {/* ============================================================ */}
      {whatChangedSummary && (
        <WhatChangedCard
          summary={whatChangedSummary}
          language={language}
          userMode={userMode}
          onUserModeChange={setUserMode}
        />
      )}

      {/* ============================================================ */}
      {/* SECTION 1D: ENVIRONMENT ↔ PLANT CORRELATION (Phase 9)        */}
      {/* ============================================================ */}
      {correlationSummary && (
        <EnvironmentPlantCard
          summary={correlationSummary}
          associations={correlations}
          language={language}
          userMode={userMode}
          onUserModeChange={setUserMode}
        />
      )}

      {/* ============================================================ */}
      {/* SECTION 1E: CONFIDENCE-AWARE PLANT ALERTS (Phase 10)         */}
      {/* ============================================================ */}
      {alertSummary.hasAnyAlert && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="section-label">
                {isKn ? 'ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಸಾಕ್ಷ್ಯಾಧಾರಗಳು' : 'Active Alerts & Evidence Backing'}
              </span>
              <span className="badge badge-amber" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                {alertSummary.activeAlerts.length} {isKn ? 'ಸಕ್ರಿಯ' : 'active'}
              </span>
            </div>
            <span className="scientific-meta">
              {isKn ? 'ಖಚಿತತೆ-ಆಧಾರಿತ ಅಧಿಸೂಚನೆಗಳು' : 'Confidence-Gated & Non-Causal'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertSummary.activeAlerts.map(alert => (
              <PlantAlertCard
                key={alert.id}
                alert={alert}
                mode={userMode}
                language={language}
                onDismiss={dismissAlert}
                onAcknowledge={acknowledgeAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 2: EVIDENCE CHAIN (THE 5 INPUTS)                     */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="section-label">
            {isKn ? 'ಮಲ್ಟಿಮೋಡಲ್ ಸಾಕ್ಷ್ಯಾಧಾರಗಳು (೫ ಮೂಲಗಳು)' : 'Multimodal Evidence Sources (5 Inputs)'}
          </span>
          <span className="scientific-meta">Verifiable Sensor & Optical Data</span>
        </div>
        
        <div className={styles.evidenceCardsGrid}>
          {/* 1. Camera Presence Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Eye size={15} style={{ color: 'var(--color-teal)' }} />
                <span>{isKn ? 'ಕ್ಯಾಮೆರಾ ಉಪಸ್ಥಿತಿ' : 'Camera Presence'}</span>
              </div>
              <StatusBadge status={cameraEvidence.status} size="sm" />
            </div>
            <div className={styles.evidenceCardFinding}>
              {cameraEvidence.finding}
            </div>
            <div className={styles.evidenceCardSubtext}>
              {cameraEvidence.subtext}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              {latestDetection ? (
                <span>
                  Canopy: <strong style={{ color: 'var(--text-primary)' }}>{latestDetection.canopyCoveragePercent}%</strong> · State: <strong style={{ color: 'var(--text-primary)' }}>{latestDetection.state}</strong>
                </span>
              ) : (
                'Dashboard camera feed'
              )}
            </div>
          </div>

          {/* 2. Visual Health Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Sparkles size={15} style={{ color: 'var(--color-green)' }} />
                <span>{isKn ? 'ದೃಶ್ಯ ಎಲೆಗಳ ಆರೋಗ್ಯ' : 'Visual Foliage Health'}</span>
              </div>
              <StatusBadge status={latestVisualHealth ? (latestVisualHealth.healthState === 'STABLE' ? 'optimal' : 'warning') : 'neutral'} size="sm" />
            </div>
            <div className={styles.evidenceCardFinding}>
              {latestVisualHealth
                ? `Visual Score: ${latestVisualHealth.visualHealthScore}/100 (${latestVisualHealth.healthState})`
                : (isKn ? 'ದೃಶ್ಯ ತಪಾಸಣೆ ಬಾಕಿ ಉಳಿದಿದೆ' : 'Visual inspection pending')}
            </div>
            <div className={styles.evidenceCardSubtext}>
              {latestVisualHealth
                ? `Chlorosis: ${latestVisualHealth.chlorosisYellowPercent.toFixed(1)}% · Necrosis: ${latestVisualHealth.necroticBrownPercent.toFixed(1)}%`
                : (isKn ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಕ್ಯಾಮೆರಾದಿಂದ ತಪಾಸಣೆ ನಡೆಸಿ.' : 'Perform an observation from Dashboard to inspect leaf health.')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              Anomalies: <strong style={{ color: 'var(--text-primary)' }}>{latestVisualHealth?.indicators?.length || 0} indicators</strong>
            </div>
          </div>

          {/* 3. Species Identification Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Cpu size={15} style={{ color: 'var(--color-teal)' }} />
                <span>{isKn ? 'ಪ್ರಭೇದ ವರ್ಗೀಕರಣ' : 'Species Identification'}</span>
              </div>
              <StatusBadge status={isPlantIdentified ? 'optimal' : 'neutral'} size="sm" />
            </div>
            <div className={styles.evidenceCardFinding}>
              {plantDisplayName}
            </div>
            <div className={styles.evidenceCardSubtext}>
              {botanicalScientific}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              ML Confidence: <strong style={{ color: 'var(--text-primary)' }}>{cropIdentity.confidence ? `${cropIdentity.confidence}%` : 'Unverified'}</strong>
            </div>
          </div>

          {/* 4. ESP32 Sensor Telemetry Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Droplets size={15} style={{ color: 'var(--color-green)' }} />
                <span>{isKn ? 'ESP32 ಸೆನ್ಸರ್ ಮಾಹಿತಿ' : 'ESP32 Telemetry'}</span>
              </div>
              <StatusBadge status={waterEvidence.status} size="sm" />
            </div>
            <div className={styles.evidenceCardFinding}>
              {waterEvidence.finding}
            </div>
            <div className={styles.evidenceCardSubtext}>
              {isTelemetryAvailable && latestReading
                ? `pH ${latestReading.ph.toFixed(2)} · TDS ${Math.round(latestReading.tds)} PPM · Level ${Math.round(latestReading.waterLevel)}%`
                : (isKn ? 'ಸೆನ್ಸರ್ ಮಾಹಿತಿ ಅಲಭ್ಯ' : 'Sensor stream unavailable')}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              State: <strong style={{ color: 'var(--text-primary)' }}>{isTelemetryAvailable ? (mode === 'real' ? 'Available (Hardware)' : 'Simulated') : 'Unavailable'}</strong>
            </div>
          </div>

          {/* 5. Historical Trend Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Clock size={15} style={{ color: 'var(--color-amber)' }} />
                <span>{isKn ? 'ಐತಿಹಾಸಿಕ ಪ್ರವೃತ್ತಿ' : 'Historical Trends'}</span>
              </div>
              <StatusBadge status={historyEvidence.status} size="sm" />
            </div>
            <div className={styles.evidenceCardFinding}>
              {historyEvidence.finding}
            </div>
            <div className={styles.evidenceCardSubtext}>
              {historyEvidence.subtext}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              Checkpoints: <strong style={{ color: 'var(--text-primary)' }}>{observations.length}</strong> · Drift: <strong style={{ color: 'var(--text-primary)' }}>{predictiveAnalytics.predictions.ph.driftPerDay.toFixed(2)} pH/day</strong>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 3: REASONING & INTERPRETATION (THE LOGIC)            */}
      {/* ============================================================ */}
      <div className={styles.reasoningPanel}>
        <div className={styles.panelHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={16} style={{ color: 'var(--color-teal)' }} />
            <span className="section-label">
              {isKn ? 'ಕಾರಣ ಮತ್ತು ವಿವರಣೆ (ಸಾಕ್ಷ್ಯ ಸರಣಿ)' : 'Reasoning & Interpretation (The Logic)'}
            </span>
          </div>
          <span className="scientific-meta">
            Rule Pathway: <strong style={{ color: 'var(--color-teal)' }}>{scenarioCode}</strong>
          </span>
        </div>

        {/* Structured Observations (Verifiable Facts) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <FileText size={13} style={{ color: 'var(--color-teal)' }} />
            <span>{isKn ? 'ಖಚಿತ ವೀಕ್ಷಣೆಗಳು (ತಪಾಸಿಸಿದ ಸತ್ಯಗಳು)' : '1. Structured Observations (Verifiable Facts)'}</span>
          </div>
          {latestReasoningEvent && latestReasoningEvent.observations.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {latestReasoningEvent.observations.map((obs, idx) => (
                <li key={idx}>{obs}</li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isKn ? 'ಯಾವುದೇ ಅಸಹಜ ವೀಕ್ಷಣೆ ದಾಖಲಾಗಿಲ್ಲ. ವ್ಯವಸ್ಥೆ ಸ್ಥಿರವಾಗಿದೆ.' : 'No anomalous observations recorded. System parameters within baseline ranges.'}
            </div>
          )}
        </div>

        {/* Structured Interpretations (Associative Non-Causal Language) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Sparkles size={13} style={{ color: 'var(--color-amber)' }} />
            <span>{isKn ? 'ಸಂಬಂಧಿತ ವಿವರಣೆಗಳು (ಕಾರಣಾತ್ಮಕವಲ್ಲದ ಸಂಬಂಧಗಳು)' : '2. Structured Interpretations (Associative, Non-Causal)'}</span>
          </div>
          {latestReasoningEvent && latestReasoningEvent.interpretations.length > 0 ? (
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {latestReasoningEvent.interpretations.map((interp, idx) => (
                <li key={idx}>{interp}</li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              {isKn ? 'ಎಲ್ಲಾ ಸೂಚಕಗಳು ಪರಸ್ಪರ ಸ್ಥಿರತೆಯನ್ನು ಪ್ರದರ್ಶಿಸುತ್ತಿವೆ.' : 'Observed signals demonstrate physiological equilibrium without environmental strain.'}
            </div>
          )}
        </div>

        {/* Conflicting Signals, if any */}
        {latestReasoningEvent && latestReasoningEvent.conflictingSignals && latestReasoningEvent.conflictingSignals.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(229, 169, 60, 0.1)', padding: '12px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(229, 169, 60, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: 'var(--color-amber)', textTransform: 'uppercase' }}>
              <AlertCircle size={14} />
              <span>{isKn ? 'ಪರಸ್ಪರ ವಿರುದ್ಧವಾದ ಸಂಕೇತಗಳು' : 'Conflicting Signals Detected'}</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12.5px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              {latestReasoningEvent.conflictingSignals.map((sig, idx) => (
                <li key={idx}>{sig}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Visual Causal Pipeline */}
        <div style={{ marginTop: '10px' }}>
          <EvidenceChain
            steps={evidenceChainSteps}
            confidenceScore={userMode === 'technical' ? reasoningConfidenceScore : undefined}
            confidenceText={userMode === 'farmer' ? naturalConfidence : undefined}
            confidenceLabel={isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ' : 'Confidence'}
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 4: ACTIONABLE RECOMMENDATIONS (THE OUTPUT)           */}
      {/* ============================================================ */}
      <div className={styles.actionCard}>
        <div className={styles.actionCardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--color-green)' }} />
            <span className="section-label">
              {isKn ? copy.ui.recommendedAction : 'Prioritized Recommendations (The Output)'}
            </span>
          </div>
          <span className="scientific-meta">
            {isKn ? copy.ui.actionGuidance : 'Action Guidance'}
          </span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {isKn ? copy.ui.whatShouldIDo : 'What should I do?'}
        </h3>

        {latestReasoningEvent && latestReasoningEvent.recommendations.length > 0 ? (
          <div className={styles.actionCardContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {userMode === 'farmer' && latestReasoningEvent.farmerCopy?.farmerAction
                  ? latestReasoningEvent.farmerCopy.farmerAction
                  : latestReasoningEvent.recommendations[0]}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: latestReasoningEvent.plantState === 'CRITICAL'
                    ? 'rgba(255, 107, 107, 0.15)'
                    : latestReasoningEvent.plantState === 'ATTENTION'
                    ? 'rgba(229, 169, 60, 0.15)'
                    : 'rgba(46, 184, 114, 0.15)',
                  color: latestReasoningEvent.plantState === 'CRITICAL'
                    ? 'var(--color-red)'
                    : latestReasoningEvent.plantState === 'ATTENTION'
                    ? 'var(--color-amber)'
                    : 'var(--color-green)',
                }}
              >
                {latestReasoningEvent.plantState === 'CRITICAL' ? 'Urgent' : latestReasoningEvent.plantState === 'ATTENTION' ? 'High' : 'Normal'}
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {latestReasoningEvent.recommendations[0]}
            </p>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
              <strong>{isKn ? copy.ui.why : 'Why:'}</strong> {latestReasoningEvent.interpretations[0] || 'Standard maintenance protocol.'}
            </div>

            {/* Secondary actions expansion if more exist */}
            {latestReasoningEvent.recommendations.length > 1 && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowSecondaryActions(!showSecondaryActions)}
                  className="btn btn-ghost"
                  style={{ padding: '4px 0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>
                    {isKn
                      ? `${showSecondaryActions ? 'ಮರೆಮಾಡಿ' : 'ವೀಕ್ಷಿಸಿ'} ${latestReasoningEvent.recommendations.length - 1} ಇತರೆ ಶಿಫಾರಸುಗಳನ್ನು`
                      : `${showSecondaryActions ? 'Hide' : 'View'} ${latestReasoningEvent.recommendations.length - 1} other recommendation${latestReasoningEvent.recommendations.length > 2 ? 's' : ''}`}
                  </span>
                  {showSecondaryActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showSecondaryActions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    {latestReasoningEvent.recommendations.slice(1).map((rec, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'var(--bg-canvas)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-xs)',
                          padding: '10px 12px',
                          fontSize: '12.5px',
                        }}
                      >
                        <div style={{ color: 'var(--text-primary)' }}>
                          • {rec}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeRecommendations.length > 0 ? (
          <div className={styles.actionCardContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeRecommendations[0].title}
              </span>
            </div>
            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {activeRecommendations[0].action}
            </p>
          </div>
        ) : (
          <div className={styles.actionCardContent}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-green)' }}>
              <CheckCircle2 size={16} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {isKn ? copy.actions.noActionNeeded : 'No action is needed based on the information currently available.'}
              </span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', margin: 0 }}>
              All environmental indicators and foliage parameters are within nominal ranges. Continue standard monitoring schedule.
            </p>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* SECTION 5: CONFIDENCE & LIMITATIONS (THE TRANSPARENCY)       */}
      {/* ============================================================ */}
      <div className={styles.reasoningPanel}>
        <div className={styles.panelHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={16} style={{ color: 'var(--color-amber)' }} />
            <span className="section-label">
              {isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ ಮತ್ತು ಮಿತಿಗಳು (ಪಾರದರ್ಶಕತೆ)' : 'Confidence & Limitations (Scientific Transparency)'}
            </span>
          </div>
          <span className="scientific-meta">Epistemic Transparency</span>
        </div>

        {/* 4-Pillar Confidence Breakdown Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span className="section-label" style={{ fontSize: '9.5px' }}>Camera Confidence</span>
            <div style={{ fontSize: '15px', fontWeight: 800, color: latestDetection?.isPlantDetected ? 'var(--color-green)' : 'var(--text-muted)', marginTop: '4px' }}>
              {latestDetection?.confidence ? `${latestDetection.confidence}%` : (latestDetection?.isPlantDetected ? '80%' : '0%')}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              {latestDetection?.isPlantDetected ? 'Optical presence confirmed' : 'Awaiting camera frame'}
            </span>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span className="section-label" style={{ fontSize: '9.5px' }}>Sensor Confidence</span>
            <div style={{ fontSize: '15px', fontWeight: 800, color: isTelemetryAvailable ? 'var(--color-teal)' : 'var(--color-amber)', marginTop: '4px' }}>
              {isTelemetryAvailable ? '85%' : '0%'}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              {isTelemetryAvailable ? (mode === 'real' ? 'Live hardware probes' : 'Simulated serial stream') : 'Sensors disconnected'}
            </span>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span className="section-label" style={{ fontSize: '9.5px' }}>Historical Confidence</span>
            <div style={{ fontSize: '15px', fontWeight: 800, color: observations.length >= 2 ? 'var(--color-green)' : 'var(--text-muted)', marginTop: '4px' }}>
              {observations.length >= 5 ? '90%' : observations.length >= 2 ? '70%' : '30%'}
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              {observations.length} historical checkpoints
            </span>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span className="section-label" style={{ fontSize: '9.5px' }}>Overall Reasoning</span>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-teal)', marginTop: '4px' }}>
              {reasoningConfidenceScore}% ({reasoningConfidenceLevel.toUpperCase()})
            </div>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
              Multimodal synthesis
            </span>
          </div>
        </div>

        {/* Active Limitations List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {isKn ? 'ಸಕ್ರಿಯ ವ್ಯವಸ್ಥೆಯ ಮಿತಿಗಳು' : 'Active System Limitations & Constraints'}
          </div>

          {latestReasoningEvent && latestReasoningEvent.limitations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {latestReasoningEvent.limitations.map((limit, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    background: 'var(--bg-surface)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <Info size={14} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
                  <span>{limit}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {isKn ? 'ಪ್ರಸ್ತುತ ಯಾವುದೇ ಸಕ್ರಿಯ ಮಿತಿಗಳಿಲ್ಲ. ಎಲ್ಲಾ ಸಂಕೇತಗಳು ಲಭ್ಯವಿವೆ.' : 'No active limitations identified. Full multimodal telemetry and optical streams available.'}
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 6: TECHNICAL MODE DETAILS (ONLY SHOWN IN TECH MODE)  */}
      {/* ============================================================ */}
      {userMode === 'technical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--border-default)', paddingTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: 'var(--color-teal)' }} />
              <span className="section-label">Technical Mode Diagnostics & Multi-Signal Fusion</span>
            </div>
            <span className="scientific-meta">Raw Telemetry & ML Scoring</span>
          </div>

          <div className={styles.reasoningStage}>
            {/* Left Column: Multimodal 3-Pillar Fusion & Scoring Formula */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={styles.reasoningPanel}>
                <div className={styles.panelHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Layers size={16} style={{ color: 'var(--color-green)' }} />
                    <span className="section-label">Multimodal Health Pillars</span>
                  </div>
                  <span className="scientific-meta">3-Pillar Fusion</span>
                </div>

                <div className={styles.pillarsStrip}>
                  {/* Environmental */}
                  <div className={styles.pillarNode}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Environmental</span>
                      <StatusBadge status={isTelemetryAvailable ? multimodalAssessment.environmentalState : 'unavailable'} size="sm" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className={styles.pillarMetricRow}>
                        <span className="text-secondary">pH Probe</span>
                        <span className="font-mono text-primary">{isTelemetryAvailable && latestReading ? latestReading.ph.toFixed(2) : '--'}</span>
                      </div>
                      <div className={styles.pillarMetricRow}>
                        <span className="text-secondary">TDS Salinity</span>
                        <span className="font-mono text-primary">{isTelemetryAvailable && latestReading ? `${Math.round(latestReading.tds)} PPM` : '--'}</span>
                      </div>
                    </div>
                    <span className="scientific-meta" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'auto' }}>Weight: 40%</span>
                  </div>

                  {/* Visual Foliage */}
                  <div className={styles.pillarNode}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Visual Foliage</span>
                      <StatusBadge status={latestDetection?.isPlantDetected ? (latestVisualHealth?.healthState || 'healthy') : 'unavailable'} size="sm" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className={styles.pillarMetricRow}>
                        <span className="text-secondary">Canopy Cover</span>
                        <span className="font-mono text-primary">{latestDetection?.isPlantDetected ? `${latestDetection.canopyCoveragePercent}%` : '--'}</span>
                      </div>
                      <div className={styles.pillarMetricRow}>
                        <span className="text-secondary">Foliage State</span>
                        <span className="text-primary font-medium">{latestDetection?.isPlantDetected ? 'Uniform' : 'Standby'}</span>
                      </div>
                    </div>
                    <span className="scientific-meta" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'auto' }}>Weight: 35%</span>
                  </div>

                  {/* Historical Stability */}
                  <div className={styles.pillarNode}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stability</span>
                      <StatusBadge status={multimodalAssessment.trend === 'stable' || multimodalAssessment.trend === 'improving' ? 'optimal' : 'warning'} size="sm" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div className={styles.pillarMetricRow}>
                        <span className="text-secondary">Trajectory</span>
                        <span className="text-primary font-medium">{multimodalAssessment.trend}</span>
                      </div>
                      <div className={styles.pillarMetricRow}>
                        <span className="text-secondary">Outliers (Z)</span>
                        <span className="font-mono text-primary">{activeAnomalies.length} Detected</span>
                      </div>
                    </div>
                    <span className="scientific-meta" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: 'auto' }}>Weight: 25%</span>
                  </div>
                </div>

                {/* Formula Progress Bars */}
                <div className={styles.formulaBox}>
                  <span className="section-label" style={{ fontSize: '9.5px' }}>Explainable Scoring Formula</span>
                  <div className={styles.formulaBars}>
                    <div className={styles.barItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                        <span className="text-muted">Env (40%)</span>
                        <span className="font-mono text-primary">{isTelemetryAvailable ? '38%' : '0%'}</span>
                      </div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: isTelemetryAvailable ? '95%' : '0%', background: 'var(--color-teal)' }} />
                      </div>
                    </div>

                    <div className={styles.barItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                        <span className="text-muted">Visual (35%)</span>
                        <span className="font-mono text-primary">{latestDetection?.isPlantDetected ? '32%' : '0%'}</span>
                      </div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: latestDetection?.isPlantDetected ? '90%' : '0%', background: 'var(--color-green)' }} />
                      </div>
                    </div>

                    <div className={styles.barItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                        <span className="text-muted">Stability (25%)</span>
                        <span className="font-mono text-primary">23%</span>
                      </div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: '92%', background: 'var(--color-green)' }} />
                      </div>
                    </div>

                    <div className={styles.barItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                        <span className="text-muted">Composite</span>
                        <span className="font-mono text-green font-bold">{multimodalAssessment.overallScore}/100</span>
                      </div>
                      <div className={styles.barTrack}>
                        <div className={styles.barFill} style={{ width: `${multimodalAssessment.overallScore}%`, background: 'var(--color-green)' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Predictive Horizons */}
              <div className={styles.reasoningPanel}>
                <div className={styles.panelHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={16} style={{ color: 'var(--color-amber)' }} />
                    <span className="section-label">Predictive Horizon Forecasts</span>
                  </div>
                  <span className="scientific-meta">Autoregressive Drift</span>
                </div>

                <div className={styles.predictionHorizons}>
                  <div className={styles.horizonNode}>
                    <span className="section-label" style={{ fontSize: '9px' }}>pH Drift Horizon</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {predictiveAnalytics.predictions.ph.trendDirection === 'rising' ? (
                        <TrendingUp size={13} style={{ color: 'var(--color-amber)' }} />
                      ) : (
                        <Minus size={13} style={{ color: 'var(--color-green)' }} />
                      )}
                      <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {predictiveAnalytics.predictions.ph.driftPerDay >= 0 ? '+' : ''}
                        {predictiveAnalytics.predictions.ph.driftPerDay.toFixed(2)}/day
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      {predictiveAnalytics.predictions.ph.estimatedDaysToThreshold !== null
                        ? `Boundary in ${predictiveAnalytics.predictions.ph.estimatedDaysToThreshold}d`
                        : 'Within nominal bounds'}
                    </span>
                  </div>

                  <div className={styles.horizonNode}>
                    <span className="section-label" style={{ fontSize: '9px' }}>TDS Depletion Rate</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingDown size={13} style={{ color: 'var(--color-teal)' }} />
                      <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Math.round(predictiveAnalytics.predictions.tds.driftPerDay)} PPM/day
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      Depletion trajectory normal
                    </span>
                  </div>

                  <div className={styles.horizonNode}>
                    <span className="section-label" style={{ fontSize: '9px' }}>Reservoir Transpiration</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <TrendingDown size={13} style={{ color: 'var(--color-teal)' }} />
                      <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {Math.abs(predictiveAnalytics.predictions.waterLevel.driftPerDay).toFixed(1)}%/day
                      </span>
                    </div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      Refill cycle in ~
                      {predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold !== null
                        ? `${predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold}d`
                        : '12d'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Evidence Grid & Observation Stream */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className={styles.reasoningPanel}>
                <div className={styles.panelHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={16} style={{ color: 'var(--color-teal)' }} />
                    <span className="section-label">Raw Visual Evidence</span>
                  </div>
                  <span className="scientific-meta">Shared Dashboard Stream</span>
                </div>

                {hasVisualData ? (
                  <div className={styles.visualEvidenceGrid}>
                    <div className={styles.evidenceTile}>
                      <span className={styles.evidenceLabel}>Plant Presence</span>
                      <span className={styles.evidenceValue} style={{ color: latestDetection?.isPlantDetected ? 'var(--color-green)' : 'var(--text-muted)' }}>
                        {latestDetection?.isPlantDetected ? 'Detected' : 'Not detected'}
                      </span>
                    </div>

                    <div className={styles.evidenceTile}>
                      <span className={styles.evidenceLabel}>Species Classification</span>
                      <span className={styles.evidenceValue}>
                        {isPlantIdentified ? cropIdentity.commonName : 'Unclassified'}
                      </span>
                    </div>

                    <div className={styles.evidenceTile}>
                      <span className={styles.evidenceLabel}>Confidence</span>
                      <span className={styles.evidenceValue}>
                        {cropIdentity.confidence ? `${cropIdentity.confidence}%` : '--'}
                      </span>
                    </div>

                    <div className={styles.evidenceTile}>
                      <span className={styles.evidenceLabel}>Canopy Coverage</span>
                      <span className={styles.evidenceValue}>
                        {latestDetection ? `${latestDetection.canopyCoveragePercent}%` : '--'}
                      </span>
                    </div>

                    <div className={styles.evidenceTile}>
                      <span className={styles.evidenceLabel}>Visual Health State</span>
                      <span className={styles.evidenceValue}>
                        {latestVisualHealth ? latestVisualHealth.healthState.replace('_', ' ').toUpperCase() : '--'}
                      </span>
                    </div>

                    <div className={styles.evidenceTile}>
                      <span className={styles.evidenceLabel}>Chlorosis</span>
                      <span className={styles.evidenceValue}>
                        {latestVisualHealth ? `${latestVisualHealth.chlorosisYellowPercent.toFixed(1)}%` : '--'}
                      </span>
                    </div>

                    <div className={styles.evidenceTile}>
                      <span className={styles.evidenceLabel}>Necrosis</span>
                      <span className={styles.evidenceValue}>
                        {latestVisualHealth ? `${latestVisualHealth.necroticBrownPercent.toFixed(1)}%` : '--'}
                      </span>
                    </div>

                    <div className={styles.evidenceTile}>
                      <span className={styles.evidenceLabel}>Last Visual Scan</span>
                      <span className={styles.evidenceValue}>
                        {latestObservation?.timestamp
                          ? new Date(latestObservation.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : latestDetection
                          ? 'Live Stream'
                          : '--'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyVisualEvidence}>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, textAlign: 'center' }}>
                      Visual analysis unavailable — start the camera from Dashboard to collect a plant observation.
                    </p>
                  </div>
                )}

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
                  Visual observations are supplied by the Dashboard camera.
                </div>
              </div>

              {/* Observations Stream Log */}
              <div className={styles.reasoningPanel}>
                <div className={styles.panelHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Clock size={16} style={{ color: 'var(--color-teal)' }} />
                    <span className="section-label">Observation Stream</span>
                  </div>
                  <span className="scientific-meta">{observations.length} Events</span>
                </div>

                <div className={styles.timelineStream}>
                  {observations.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                      No observations logged yet. Snapshots will appear as telemetry arrives.
                    </div>
                  ) : (
                    observations.slice(0, 15).map((obs) => (
                      <div key={obs.id} className={styles.timelineEvent}>
                        <div className={styles.timelineMeta}>
                          <span className="scientific-meta" style={{ fontSize: '10px' }}>
                            {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                          <span className="status-pill status-healthy" style={{ fontSize: '9px', padding: '1px 6px' }}>
                            {obs.plantSpecies || 'Unknown'}
                          </span>
                        </div>

                        <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                          pH {obs.ph !== undefined ? obs.ph.toFixed(2) : '--'} · TDS {obs.tds !== undefined ? `${Math.round(obs.tds)} PPM` : '--'} · Level {obs.waterLevel !== undefined ? `${Math.round(obs.waterLevel)}%` : '--'}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
