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
    const isUnderStress = latestReasoningEvent
      ? latestReasoningEvent.plantState === 'ATTENTION' || latestReasoningEvent.plantState === 'CRITICAL'
      : (farmerSemanticState.plantStatus === 'ATTENTION' || farmerSemanticState.plantStatus === 'URGENT');

    const steps: EvidenceStep[] = [];

    // OBSERVATIONS
    steps.push({
      stage: 'OBSERVATIONS',
      stageLabel: isKn ? 'ವೀಕ್ಷಣೆಗಳು' : undefined,
      headline: cameraEvidence.finding,
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{userMode === 'farmer' ? cameraEvidence.subtext : (latestDetection?.isPlantDetected ? `Optical canopy evaluated at ${latestDetection.canopyCoveragePercent}% coverage with ${latestVisualHealth?.visualHealthScore || 90}/100 visual health score.` : 'Standby mode — no foliage identified in camera frame.')}</span>
        </div>
      ),
      status: cameraEvidence.status,
    });

    // ENVIRONMENT
    steps.push({
      stage: 'ENVIRONMENT',
      stageLabel: isKn ? 'ವಾತಾವರಣ' : undefined,
      headline: waterEvidence.finding,
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{userMode === 'farmer' ? waterEvidence.subtext : (isTelemetryAvailable && latestReading ? `Electrode probe reads pH ${latestReading.ph.toFixed(2)} · TDS ${Math.round(latestReading.tds)} PPM · Reservoir ${Math.round(latestReading.waterLevel)}%.` : 'Telemetry offline — awaiting serial connection.')}</span>
        </div>
      ),
      status: waterEvidence.status,
    });

    // HISTORICAL CONTEXT
    steps.push({
      stage: 'HISTORICAL CONTEXT',
      stageLabel: isKn ? 'ಹಿಂದಿನ ಡೇಟಾ' : undefined,
      headline: historyEvidence.finding,
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{userMode === 'farmer' ? historyEvidence.subtext : `Longitudinal trajectory evaluated across ${observations.length} snapshots (pH drift: ${predictiveAnalytics.predictions.ph.driftPerDay.toFixed(2)}/day).`}</span>
        </div>
      ),
      status: historyEvidence.status,
    });

    // ASSOCIATIONS
    steps.push({
      stage: 'ASSOCIATIONS',
      stageLabel: isKn ? 'ಸಂಬಂಧಗಳು' : undefined,
      headline: isKn ? 'ಪರಿಸರ ಮತ್ತು ಗಿಡದ ಆರೋಗ್ಯದ ಸಂಬಂಧ' : 'Environment to Plant Associations',
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{userMode === 'farmer' 
            ? (latestReasoningEvent?.interpretations.length ? latestReasoningEvent.interpretations[0] : (isKn ? 'ಯಾವುದೇ ಹೊಸ ಸಂಬಂಧಗಳು ಕಂಡುಬಂದಿಲ್ಲ.' : 'No new associations detected.')) 
            : (correlations && correlations.length > 0 ? correlations.map(c => `${c.environmentMetric} ↔ ${c.plantMetric}`).join(', ') : 'No causal associations identified.')}</span>
        </div>
      ),
      status: correlations && correlations.length > 0 ? 'warning' : 'optimal',
    });

    // REASONING
    steps.push({
      stage: 'REASONING',
      stageLabel: isKn ? 'ಕಾರಣ ಮತ್ತು ವಿವರಣೆ' : undefined,
      headline: isKn ? 'ಒಟ್ಟಾರೆ ತೀರ್ಮಾನ' : 'Overall Assessment',
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{simpleExplanation}</span>
          {userMode === 'technical' && latestReasoningEvent?.observations && latestReasoningEvent.observations.length > 0 && (
            <ul style={{ margin: '8px 0 0 16px', padding: 0, fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              {latestReasoningEvent.observations.map((o, i) => <li key={i}>{o}</li>)}
            </ul>
          )}
        </div>
      ),
      status: isUnderStress ? 'warning' : 'optimal',
    });

    // RECOMMENDATION
    const primaryRecommendation = latestReasoningEvent?.recommendations[0] || activeRecommendations[0]?.action || (isKn ? 'ಎಲ್ಲಾ ವ್ಯವಸ್ಥೆಗಳು ಸರಿಯಾಗಿವೆ. ನಿಯಮಿತ ನಿಗಾ ಮುಂದುವರಿಸಿ.' : 'All systems nominal. Continue regular monitoring.');
    steps.push({
      stage: 'RECOMMENDATION',
      stageLabel: isKn ? 'ಶಿಫಾರಸು' : undefined,
      headline: userMode === 'farmer' ? (latestReasoningEvent?.farmerCopy?.farmerAction || farmerSemanticState.actionableSummary) : (activeRecommendations[0]?.title || 'Maintain nominal operational parameters'),
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{primaryRecommendation}</span>
        </div>
      ),
      status: isUnderStress ? 'warning' : 'optimal',
    });

    // LIMITATIONS
    steps.push({
      stage: 'LIMITATIONS',
      stageLabel: isKn ? 'ಮಿತಿಗಳು' : undefined,
      headline: isKn ? 'ವ್ಯವಸ್ಥೆಯ ಮಿತಿಗಳು' : 'System Constraints',
      detail: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span>{latestReasoningEvent?.limitations.length ? latestReasoningEvent.limitations[0] : (isKn ? 'ಯಾವುದೇ ಮಿತಿಗಳಿಲ್ಲ.' : 'Full multimodal telemetry available. No active constraints.')}</span>
          {userMode === 'technical' && (
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px', flexWrap: 'wrap' }}>
               <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Camera Confidence: {latestDetection?.confidence ? `${latestDetection.confidence}%` : (latestDetection?.isPlantDetected ? '80%' : '0%')}</span>
               <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Sensor Confidence: {isTelemetryAvailable ? '85%' : '0%'}</span>
               <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Historical Confidence: {observations.length >= 5 ? '90%' : observations.length >= 2 ? '70%' : '30%'}</span>
            </div>
          )}
        </div>
      ),
      status: 'neutral',
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
      {/* SECTION 2: SCIENTIFIC REASONING CHAIN                        */}
      {/* ============================================================ */}
      <div style={{ marginTop: '16px' }}>
        <EvidenceChain
          steps={evidenceChainSteps}
          confidenceScore={userMode === 'technical' ? reasoningConfidenceScore : undefined}
          confidenceText={userMode === 'farmer' ? naturalConfidence : undefined}
          confidenceLabel={isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ' : 'Confidence'}
        />
      </div>

    </div>
  );
}
