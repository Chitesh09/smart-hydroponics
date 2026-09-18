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
  ChevronUp
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
    setLanguage
  } = usePlantIntelligence();

  const { mode, isStale, latestReading } = useESP32Serial();
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);

  const copy = getFarmerCopy(language);
  const isKn = language === 'kn' && userMode === 'farmer';

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

  // Derived observation flags
  const isCanopyReduced = Boolean(latestDetection && latestDetection.canopyCoveragePercent < 15);
  const isChlorosisPresent = Boolean(latestVisualHealth && latestVisualHealth.chlorosisYellowPercent > 8);
  const isCameraChanged = isCanopyReduced || isChlorosisPresent;

  const isWaterLow = Boolean(latestReading && latestReading.waterLevel < 25);
  const isPhOff = Boolean(latestReading && (latestReading.ph < 5.5 || latestReading.ph > 6.8));
  const isTdsOff = Boolean(latestReading && (latestReading.tds < 700 || latestReading.tds > 1400));
  const isNutrientsOff = isPhOff || isTdsOff;

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

  const isWaterDecreased = (historicalDeltas.waterDelta !== null && historicalDeltas.waterDelta < -3) || isWaterLow;
  const isHistoryChanged = Boolean(
    (historicalDeltas.waterDelta !== null && historicalDeltas.waterDelta < -3) ||
    (historicalDeltas.phDelta !== null && Math.abs(historicalDeltas.phDelta) > 0.25) ||
    (historicalDeltas.tdsDelta !== null && Math.abs(historicalDeltas.tdsDelta) > 75)
  );

  // 1. SIMPLE HUMAN-READABLE EXPLANATION FIRST
  const simpleExplanation = useMemo(() => {
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

    // Explaining WHY the plant needs attention
    if (isCameraChanged && isWaterDecreased) {
      return isKn
        ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ ಏಕೆಂದರೆ ಕ್ಯಾಮೆರಾ ಎಲೆಗಳಲ್ಲಿ ಬದಲಾವಣೆಯನ್ನು ಕಂಡಿದೆ ಮತ್ತು ನೀರಿನ ಮಟ್ಟವೂ ಕಡಿಮೆಯಾಗಿದೆ.'
        : 'Your plant may need attention because the camera noticed a change in leaf appearance and the water level has also decreased.';
    }
    if (isCameraChanged && isNutrientsOff) {
      return isKn
        ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ ಏಕೆಂದರೆ ಕ್ಯಾಮೆರಾ ಎಲೆಗಳ ಬಣ್ಣದಲ್ಲಿ ಬದಲಾವಣೆಯನ್ನು ಕಂಡಿದೆ ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನವು ಸರಿಯಾಗಿಲ್ಲ.'
        : 'Your plant may need attention because the camera noticed leaf discoloration and the nutrient balance is outside the ideal range.';
    }
    if (isWaterDecreased) {
      return isKn
        ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ ಏಕೆಂದರೆ ನೀರಿನ ಮಟ್ಟವು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಕಡಿಮೆಯಾಗಿದೆ.'
        : 'Your plant needs attention because the water reservoir level has decreased below normal operating bounds.';
    }
    if (isNutrientsOff) {
      return isKn
        ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ ಏಕೆಂದರೆ ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವು ಸೂಕ್ತ ಪ್ರಮಾಣಕ್ಕಿಂತ ಹೊರಗಿದೆ.'
        : 'Your plant may need attention because nutrient acidity or salinity is drifting outside ideal crop baselines.';
    }
    if (isCameraChanged) {
      return isKn
        ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ ಏಕೆಂದರೆ ಕ್ಯಾಮೆರಾ ಎಲೆಗಳ ಬಣ್ಣ ಅಥವಾ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಬದಲಾವಣೆಯನ್ನು ಕಂಡಿದೆ.'
        : 'Your plant may need attention because the camera detected reduced green foliage canopy or discoloration.';
    }

    return isKn
      ? 'ಕ್ಯಾಮೆರಾ ಮತ್ತು ಸೆನ್ಸರ್‌ಗಳ ವೀಕ್ಷಣೆಯ ಆಧಾರದ ಮೇಲೆ ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ.'
      : 'Your plant may need attention based on combined camera and sensor observations.';
  }, [
    farmerSemanticState.hasSufficientData,
    farmerSemanticState.plantStatus,
    isKn,
    isCameraChanged,
    isWaterDecreased,
    isNutrientsOff
  ]);

  // 2. EVIDENCE CARDS DATA
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
    if (isHistoryChanged) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಕಾಲಕ್ರಮೇಣ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ' : 'Change observed over time',
        subtext: isKn
          ? (historicalDeltas.waterDelta !== null && historicalDeltas.waterDelta < -3
              ? `ರೆಕಾರ್ಡ್ ಮಾಡಿದ ಚಕ್ರಗಳಲ್ಲಿ ನೀರಿನ ಮಟ್ಟ ${Math.abs(Math.round(historicalDeltas.waterDelta))}% ರಷ್ಟು ಕಡಿಮೆಯಾಗಿದೆ.`
              : 'ಹಿಂದಿನ ದಾಖಲೆಗಳಿಗೆ ಹೋಲಿಸಿದರೆ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದೆ.')
          : (historicalDeltas.waterDelta !== null && historicalDeltas.waterDelta < -3
              ? `Water level decreased by ${Math.abs(Math.round(historicalDeltas.waterDelta))}% over recorded cycles.`
              : 'Chemical or physical parameter drift noticed compared to earlier baseline.'),
      };
    }
    return {
      status: 'optimal' as const,
      finding: isKn ? 'ಕಾಲಕ್ರಮೇಣ ಸ್ಥಿರತೆ ಕಾಯ್ದುಕೊಂಡಿದೆ' : 'Consistent stability over time',
      subtext: isKn
        ? `ಎಲ್ಲಾ ${observations.length} ಐತಿಹಾಸಿಕ ತಪಾಸಣೆಗಳಲ್ಲೂ ಸ್ಥಿರತೆ ಮುಂದುವರಿದಿದೆ.`
        : `Parameters have remained stable across all ${observations.length} historical checkpoints.`,
    };
  }, [observations.length, isHistoryChanged, historicalDeltas, isKn]);

  // 3. SCIENTIFIC EVIDENCE CHAIN STEPS
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
    const isUnderStress = farmerSemanticState.plantStatus === 'ATTENTION' || farmerSemanticState.plantStatus === 'URGENT';
    steps.push({
      stage: 'INTERPRETATION',
      stageLabel: isKn ? 'ಒಟ್ಟಾರೆ ತೀರ್ಮಾನ' : undefined,
      headline: isUnderStress
        ? (isKn ? 'ಈ ಎಲ್ಲಾ ವೀಕ್ಷಣೆಗಳು ಗಿಡಕ್ಕೆ ಗಮನ ಬೇಕಾಗಿದೆ ಎಂಬುದನ್ನು ತೋರಿಸುತ್ತವೆ.' : (userMode === 'farmer' ? 'Together, these observations indicate plant stress.' : (multimodalAssessment.interpretations[0] || 'Together, these observations indicate biological plant stress.')))
        : (isKn ? 'ಈ ಎಲ್ಲಾ ವೀಕ್ಷಣೆಗಳು ಗಿಡದ ಆರೋಗ್ಯಕರ ಬೆಳವಣಿಗೆಯನ್ನು ಖಚಿತಪಡಿಸುತ್ತವೆ.' : (userMode === 'farmer' ? 'Together, these observations confirm healthy growth.' : 'Together, sensory telemetry and foliage optics confirm vigorous, healthy growth.')),
      detail: isKn
        ? (isUnderStress ? 'ವಾತಾವರಣದ ಮಟ್ಟಗಳು ಅಥವಾ ಎಲೆಗಳ ಸ್ಥಿತಿಯು ಸಾಮಾನ್ಯಕ್ಕಿಂತ ಭಿನ್ನವಾಗಿದೆ.' : 'ಪರಿಸರದ ಮಟ್ಟಗಳು ಮತ್ತು ಎಲೆಗಳ ಸ್ಥಿತಿಯು ಉತ್ತಮವಾಗಿದೆ.')
        : (multimodalAssessment.explanations[0] || 'Environmental parameters and foliage condition align with crop baseline tolerances.'),
      status: isUnderStress ? 'warning' : 'optimal',
    });

    // Stage 5: Recommendation
    steps.push({
      stage: 'RECOMMENDATION',
      stageLabel: isKn ? 'ಶಿಫಾರಸು' : undefined,
      headline: userMode === 'farmer'
        ? farmerSemanticState.actionableSummary
        : (activeRecommendations[0]?.title || 'Maintain nominal operational parameters'),
      detail: isKn
        ? (farmerSemanticState.plantStatus === 'GOOD' ? 'ಎಲ್ಲಾ ವ್ಯವಸ್ಥೆಗಳು ಸರಿಯಾಗಿವೆ. ನಿಯಮಿತ ನಿಗಾ ಮುಂದುವರಿಸಿ.' : (activeRecommendations[0]?.action || farmerSemanticState.actionableSummary))
        : (activeRecommendations[0]
            ? `${activeRecommendations[0].action} — Reason: ${activeRecommendations[0].reasoning}`
            : 'All environmental parameters and plant health indicators are stable. Maintain regular monitoring.'),
      status: activeRecommendations[0]?.priority === 'urgent' || activeRecommendations[0]?.priority === 'high' ? 'warning' : 'optimal',
    });

    return steps;
  }, [
    cameraEvidence,
    waterEvidence,
    historyEvidence,
    userMode,
    latestDetection,
    latestVisualHealth,
    isTelemetryAvailable,
    latestReading,
    observations.length,
    predictiveAnalytics,
    farmerSemanticState,
    multimodalAssessment,
    activeRecommendations,
    isKn
  ]);

  const handleExportDiagnostics = () => {
    const diagnosticPayload = {
      timestamp: new Date().toISOString(),
      plant: {
        commonName: plantDisplayName,
        scientificName: botanicalScientific,
        isIdentified: isPlantIdentified,
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
            {isKn ? copy.ui.reasoningSubtitle : 'Understanding why HydroSmart reached its conclusions.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <ModeToggle mode={userMode} onModeChange={setUserMode} size="sm" />
          <LanguageToggle language={language} onLanguageChange={setLanguage} size="sm" />
          {userMode === 'technical' && (
            <button className="btn btn-secondary" onClick={handleExportDiagnostics} style={{ fontSize: '11.5px' }}>
              <Download size={13} />
              <span>Export Diagnostic JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. SIMPLE HUMAN EXPLANATION FIRST                            */}
      {/* ============================================================ */}
      <div className={styles.simpleExplanationCard}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle size={18} style={{ color: 'var(--color-teal)' }} />
            <span className="section-label">
              {farmerSemanticState.plantStatus === 'GOOD'
                ? (isKn ? 'ಗಿಡದ ಸ್ಥಿತಿ ಮೌಲ್ಯಮಾಪನ' : 'Plant Condition Assessment')
                : (isKn ? 'ಗಮನ ನೀಡಬೇಕಾದ ಕಾರಣ' : 'Attention Reasoning')}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <StatusBadge
              status={farmerSemanticState.plantStatus.toLowerCase()}
              label={farmerSemanticState.plantMessage}
              size="sm"
            />
            {isPlantIdentified && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-surface)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-xs)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {isKn
                  ? `ವಿಶ್ವಾಸಾರ್ಹತೆ: ${naturalConfidence}`
                  : `Confidence: ${userMode === 'technical' && cropIdentity.confidence ? `${naturalConfidence} (${cropIdentity.confidence}%)` : naturalConfidence}`}
              </span>
            )}
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
      {/* 3. EVIDENCE USED BY THE SYSTEM (3 PILLARS)                  */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span className="section-label">
          {isKn ? copy.ui.evidenceUsedBySystem : 'Evidence Used by the System'}
        </span>
        
        <div className={styles.evidenceCardsGrid}>
          {/* 1. Camera Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Eye size={15} style={{ color: 'var(--color-teal)' }} />
                <span>{isKn ? copy.ui.cameraEvidence : 'Camera'}</span>
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
              {userMode === 'technical' && latestDetection
                ? `Canopy: ${latestDetection.canopyCoveragePercent}% · Discoloration: ${latestVisualHealth?.chlorosisYellowPercent.toFixed(1) || '0.0'}%`
                : (isKn ? `ವಿಶ್ವಾಸಾರ್ಹತೆ: ${naturalConfidence}` : `Confidence: ${naturalConfidence}`)}
            </div>
          </div>

          {/* 2. Water & Nutrients Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Droplets size={15} style={{ color: 'var(--color-green)' }} />
                <span>{isKn ? copy.ui.waterEvidence : 'Water & Nutrients'}</span>
              </div>
              <StatusBadge status={waterEvidence.status} size="sm" />
            </div>
            <div className={styles.evidenceCardFinding}>
              {waterEvidence.finding}
            </div>
            <div className={styles.evidenceCardSubtext}>
              {waterEvidence.subtext}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              {userMode === 'technical' && latestReading
                ? `pH ${latestReading.ph.toFixed(2)} · TDS ${Math.round(latestReading.tds)} PPM · Level ${Math.round(latestReading.waterLevel)}%`
                : (isKn ? (isTelemetryAvailable ? 'ಸೆನ್ಸರ್‌ಗಳು ಕಾರ್ಯನಿರತವಾಗಿವೆ' : 'ಸೆನ್ಸರ್ ಸಂಪರ್ಕಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ') : (isTelemetryAvailable ? 'Probe sensors active' : 'Awaiting sensor stream'))}
            </div>
          </div>

          {/* 3. History Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Clock size={15} style={{ color: 'var(--color-amber)' }} />
                <span>{isKn ? copy.ui.historyEvidence : 'History'}</span>
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
              {userMode === 'technical'
                ? `pH drift: ${predictiveAnalytics.predictions.ph.driftPerDay >= 0 ? '+' : ''}${predictiveAnalytics.predictions.ph.driftPerDay.toFixed(2)}/day`
                : (isKn ? `${observations.length} ದಾಖಲೆಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡಲಾಗಿದೆ` : `Evaluated over ${observations.length} checkpoints`)}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. BOTANICAL EVIDENCE CHAIN (5-STAGE CAUSAL PIPELINE)       */}
      {/* ============================================================ */}
      <div className={styles.reasoningPanel}>
        <div className={styles.panelHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Brain size={16} style={{ color: 'var(--color-teal)' }} />
            <span className="section-label">
              {isKn ? copy.ui.botanicalEvidenceChain : 'Botanical Evidence Chain'}
            </span>
          </div>
          <span className="scientific-meta">
            {isKn ? '5-ಹಂತಗಳ ವಿವರಣಾ ಸರಣಿ' : '5-Stage Causal Pipeline'}
          </span>
        </div>

        <EvidenceChain
          steps={evidenceChainSteps}
          confidenceScore={userMode === 'technical' ? cropIdentity.confidence : undefined}
          confidenceText={userMode === 'farmer' ? naturalConfidence : undefined}
        />
      </div>

      {/* ============================================================ */}
      {/* 5. ACTION: "WHAT SHOULD I DO?"                              */}
      {/* ============================================================ */}
      <div className={styles.actionCard}>
        <div className={styles.actionCardHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} style={{ color: 'var(--color-green)' }} />
            <span className="section-label">
              {isKn ? copy.ui.recommendedAction : 'Recommended Action'}
            </span>
          </div>
          <span className="scientific-meta">
            {isKn ? copy.ui.actionGuidance : 'Action Guidance'}
          </span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {isKn ? copy.ui.whatShouldIDo : 'What should I do?'}
        </h3>

        {activeRecommendations.length > 0 ? (
          <div className={styles.actionCardContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isKn && farmerSemanticState.plantStatus === 'GOOD' ? 'ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ' : activeRecommendations[0].title}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: activeRecommendations[0].priority === 'urgent'
                    ? 'rgba(255, 107, 107, 0.15)'
                    : activeRecommendations[0].priority === 'high'
                    ? 'rgba(229, 169, 60, 0.15)'
                    : 'rgba(46, 184, 114, 0.15)',
                  color: activeRecommendations[0].priority === 'urgent'
                    ? 'var(--color-red)'
                    : activeRecommendations[0].priority === 'high'
                    ? 'var(--color-amber)'
                    : 'var(--color-green)',
                }}
              >
                {isKn
                  ? (activeRecommendations[0].priority === 'urgent' ? 'ತುರ್ತು ಆದ್ಯತೆ' : activeRecommendations[0].priority === 'high' ? 'ಹೆಚ್ಚಿನ ಆದ್ಯತೆ' : 'ಸಾಮಾನ್ಯ ಆದ್ಯತೆ')
                  : `${activeRecommendations[0].priority} priority`}
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {isKn && farmerSemanticState.plantStatus === 'GOOD'
                ? farmerSemanticState.actionableSummary
                : isKn && (activeRecommendations[0].action.toLowerCase().includes('water') || activeRecommendations[0].action.toLowerCase().includes('refill'))
                ? 'ತೊಟ್ಟಿಗೆ ನೀರನ್ನು ಹಾಕಿ ನೀರಿನ ಮಟ್ಟವನ್ನು ಹೆಚ್ಚಿಸಿ.'
                : isKn && (activeRecommendations[0].action.toLowerCase().includes('nutrient') || activeRecommendations[0].action.toLowerCase().includes('ph') || activeRecommendations[0].action.toLowerCase().includes('tds'))
                ? 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಪರಿಶೀಲಿಸಿ ಸರಿಪಡಿಸಿ.'
                : activeRecommendations[0].action}
            </p>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
              <strong>{isKn ? copy.ui.why : 'Why:'}</strong> {activeRecommendations[0].reasoning}
            </div>

            {/* Secondary actions expansion if more exist */}
            {activeRecommendations.length > 1 && (
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowSecondaryActions(!showSecondaryActions)}
                  className="btn btn-ghost"
                  style={{ padding: '4px 0', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <span>
                    {isKn
                      ? `${showSecondaryActions ? 'ಮರೆಮಾಡಿ' : 'ವೀಕ್ಷಿಸಿ'} ${activeRecommendations.length - 1} ಇತರೆ ಶಿಫಾರಸುಗಳನ್ನು`
                      : `${showSecondaryActions ? 'Hide' : 'View'} ${activeRecommendations.length - 1} other recommendation${activeRecommendations.length > 2 ? 's' : ''}`}
                  </span>
                  {showSecondaryActions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showSecondaryActions && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                    {activeRecommendations.slice(1).map((rec, idx) => (
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
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {rec.title}
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>
                          {rec.action}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
      {/* 6. TECHNICAL MODE DETAILS (ONLY SHOWN IN TECHNICAL MODE)    */}
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
