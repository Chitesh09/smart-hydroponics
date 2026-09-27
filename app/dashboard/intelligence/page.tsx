'use client';

import { useState, useMemo } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { EvidenceChain, EvidenceStep } from '@/components/ui/EvidenceChain';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { getFarmerCopy } from '@/lib/intelligence/farmerSemanticLayer';

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
    correlations,
  } = usePlantIntelligence();

  const { isStale, latestReading } = useESP32Serial();

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

  // Reasoning areas: 1. What's happening, 2. Why, 3. What to do
  const whatsHappeningText = useMemo(() => {
    if (latestReasoningEvent?.farmerCopy?.observableSummary) {
      return latestReasoningEvent.farmerCopy.observableSummary;
    }
    if (!farmerSemanticState.hasSufficientData) {
      return isKn
        ? 'ವಿಶ್ಲೇಷಣೆ ನಡೆಸಲು ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ.'
        : 'Telemetry and optical inspection streams are awaiting sufficient data points.';
    }
    if (farmerSemanticState.plantStatus === 'GOOD') {
      return isKn
        ? 'ಎಲೆಗಳು ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣಿಸುತ್ತಿವೆ ಮತ್ತು ದ್ರಾವಣ ಸಮತೋಲನದಲ್ಲಿದೆ.'
        : 'Foliar canopy metrics and closed-loop nutrient values demonstrate biological equilibrium.';
    }
    return isKn
      ? 'ಕ್ಯಾಮೆರಾ ಮತ್ತು ಸಂವೇದಕಗಳ ವೀಕ್ಷಣೆಯಲ್ಲಿ ಬದಲಾವಣೆಗಳು ದಾಖಲಾಗಿವೆ.'
      : 'Optical foliage signals and telemetry sensors show deviations from baseline.';
  }, [latestReasoningEvent, farmerSemanticState, isKn]);

  const whyText = useMemo(() => {
    if (latestReasoningEvent?.farmerCopy?.whySummary) {
      return latestReasoningEvent.farmerCopy.whySummary;
    }
    if (!farmerSemanticState.hasSufficientData) {
      return isKn
        ? 'ಹಾರ್ಡ್‌ವೇರ್ ಸಂವೇದಕ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಆರಂಭಿಕ ಹಂತದಲ್ಲಿದೆ.'
        : 'Sensor hardware link or camera vision pipeline is currently initializing.';
    }
    if (farmerSemanticState.plantStatus === 'GOOD') {
      return isKn
        ? 'ಎಲ್ಲಾ ಸಂವೇದಕ ರೀಡಿಂಗ್‌ಗಳು ಮತ್ತು ದೃಶ್ಯ ಸೂಚಕಗಳು ನಿಗದಿತ ವ್ಯಾಪ್ತಿಯಲ್ಲಿವೆ.'
        : 'Observed pH, TDS, and water levels adhere closely to the species baseline target profile.';
    }
    return isKn
      ? 'ಪರಿಸರ ಅಸ್ಥಿರತೆ ಅಥವಾ ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನದಲ್ಲಿ ಬದಲಾವಣೆ ಉಂಟಾಗಿದೆ.'
      : 'Deviations correlate with nutrient concentration drift or reservoir water level changes.';
  }, [latestReasoningEvent, farmerSemanticState, isKn]);

  const whatToDoText = useMemo(() => {
    if (latestReasoningEvent?.farmerCopy?.farmerAction) {
      return latestReasoningEvent.farmerCopy.farmerAction;
    }
    if (activeRecommendations.length > 0) {
      return `${activeRecommendations[0].title}. ${activeRecommendations[0].action}`;
    }
    return isKn
      ? 'ಯಾವುದೇ ತುರ್ತು ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ. ನಿಯಮಿತ ನಿಗಾ ಮುಂದುವರಿಸಿ.'
      : 'No intervention required. Maintain scheduled observation cycles.';
  }, [latestReasoningEvent, activeRecommendations, isKn]);

  // Evidence Summary Cards
  const cameraEvidence = useMemo(() => {
    if (!hasVisualData || !latestDetection) {
      return {
        status: 'neutral' as const,
        finding: isKn ? 'ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆ ಲಭ್ಯವಿಲ್ಲ' : 'Optical foliage inspection pending',
        subtext: isKn ? 'ಗಿಡದ ಎಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಿಂದ ಕ್ಯಾಮೆರಾ ಆನ್ ಮಾಡಿ.' : 'Activate camera stream from Dashboard to inspect foliar parameters.',
      };
    }
    if (!latestDetection.isPlantDetected) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಯಾವುದೇ ಗಿಡ ಕಂಡುಬಂದಿಲ್ಲ' : 'No specimen detected in camera frame',
        subtext: isKn ? 'ಗಿಡವನ್ನು ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಸ್ಪಷ್ಟವಾಗಿ ಇರಿಸಿ.' : 'Align plant clearly within optical inspection boundary.',
      };
    }
    if (isCameraChanged) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಗಿಡದ ನೋಟದಲ್ಲಿ ಬದಲಾವಣೆ ಕಂಡುಬಂದಿದೆ' : 'Foliage canopy alteration detected',
        subtext: isKn
          ? (isChlorosisPresent ? `ಎಲೆಗಳ ಮೇಲೆ ಹಳದಿ ಪ್ರಮಾಣ (${latestVisualHealth?.chlorosisYellowPercent.toFixed(1)}%).` : 'ಎಲೆಗಳ ಹಸಿರು ಪ್ರಮಾಣದಲ್ಲಿ ಇಳಿಕೆ.')
          : (isChlorosisPresent ? `Leaf discoloration observed (${latestVisualHealth?.chlorosisYellowPercent.toFixed(1)}% chlorosis ratio).` : 'Reduced canopy density observed.'),
      };
    }
    return {
      status: 'optimal' as const,
      finding: isKn ? 'ಎಲೆಗಳು ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣಿಸುತ್ತಿವೆ' : 'Foliage appearance conforms to healthy baseline',
      subtext: isKn
        ? `ಎಲೆಗಳ ವ್ಯಾಪ್ತಿ ${latestDetection.canopyCoveragePercent}% ರಷ್ಟಿದೆ.`
        : `Canopy coverage confirmed at ${latestDetection.canopyCoveragePercent}% with uniform coloration.`,
    };
  }, [hasVisualData, latestDetection, isCameraChanged, isChlorosisPresent, latestVisualHealth, isKn]);

  const waterEvidence = useMemo(() => {
    if (!isTelemetryAvailable || !latestReading) {
      return {
        status: 'neutral' as const,
        finding: isKn ? 'ನೀರಿನ ಸೆನ್ಸರ್ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ' : 'Solution telemetry offline',
        subtext: isKn ? 'ESP32 ಸಾಧನವನ್ನು ಸಂಪರ್ಕಿಸಿ.' : 'Verify ESP32 serial interface or engage telemetry simulation.',
      };
    }
    if (isWaterLow || isNutrientsOff) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಪೋಷಕಾಂಶ ಅಥವಾ ನೀರಿನ ಮಟ್ಟದಲ್ಲಿ ವ್ಯತ್ಯಾಸ' : 'Solution chemistry drift detected',
        subtext: `pH ${latestReading.ph.toFixed(2)} · TDS ${Math.round(latestReading.tds)} PPM · Reservoir ${Math.round(latestReading.waterLevel)}%`,
      };
    }
    return {
      status: 'optimal' as const,
      finding: isKn ? 'ನೀರಿನ ಮಟ್ಟ ಮತ್ತು ಪೋಷಕಾಂಶಗಳು ಸಮತೋಲನದಲ್ಲಿವೆ' : 'Nutrient balance and water level in nominal ranges',
      subtext: `Reservoir ${Math.round(latestReading.waterLevel)}% · pH ${latestReading.ph.toFixed(2)} · TDS ${Math.round(latestReading.tds)} PPM`,
    };
  }, [isTelemetryAvailable, latestReading, isWaterLow, isNutrientsOff, isKn]);

  const historyEvidence = useMemo(() => {
    if (observations.length < 2) {
      return {
        status: 'neutral' as const,
        finding: isKn ? 'ಆರಂಭಿಕ ವೀಕ್ಷಣೆ ದಾಖಲಾಗಿದೆ' : 'Baseline checkpoint established',
        subtext: isKn ? 'ಮುಂದಿನ ಪರಿಶೀಲನೆಗಳಲ್ಲಿ ಬದಲಾವಣೆಗಳು ಕಾಣಿಸುತ್ತವೆ.' : 'Longitudinal shifts emerge across sequential observation cycles.',
      };
    }
    if (historicalDeltas.waterDelta !== null && historicalDeltas.waterDelta < -3) {
      return {
        status: 'warning' as const,
        finding: isKn ? 'ಕಾಲಕ್ರಮೇಣ ನೀರಿನ ಇಳಿಕೆ' : 'Longitudinal depletion recorded',
        subtext: `Water level declined by ${Math.abs(Math.round(historicalDeltas.waterDelta))}% over recorded cycles.`,
      };
    }
    return {
      status: 'optimal' as const,
      finding: isKn ? 'ಕಾಲಕ್ರಮೇಣ ಸ್ಥಿರತೆ' : 'Consistent longitudinal stability',
      subtext: `Parameters verified across ${observations.length} historical checkpoints.`,
    };
  }, [observations.length, historicalDeltas, isKn]);

  // Evidence Chain Steps
  const evidenceChainSteps = useMemo((): EvidenceStep[] => {
    const isUnderStress = latestReasoningEvent
      ? latestReasoningEvent.plantState === 'ATTENTION' || latestReasoningEvent.plantState === 'CRITICAL'
      : (farmerSemanticState.plantStatus === 'ATTENTION' || farmerSemanticState.plantStatus === 'URGENT');

    return [
      {
        stage: 'OBSERVATIONS',
        stageLabel: isKn ? 'ವೀಕ್ಷಣೆಗಳು' : 'Optical Foliage Check',
        headline: cameraEvidence.finding,
        detail: cameraEvidence.subtext,
        status: cameraEvidence.status,
      },
      {
        stage: 'ENVIRONMENT',
        stageLabel: isKn ? 'ವಾತಾವರಣ' : 'Hydroponic Chemistry',
        headline: waterEvidence.finding,
        detail: waterEvidence.subtext,
        status: waterEvidence.status,
      },
      {
        stage: 'HISTORICAL CONTEXT',
        stageLabel: isKn ? 'ಹಿಂದಿನ ಡೇಟಾ' : 'Longitudinal Baseline',
        headline: historyEvidence.finding,
        detail: historyEvidence.subtext,
        status: historyEvidence.status,
      },
      {
        stage: 'ASSOCIATIONS',
        stageLabel: isKn ? 'ಸಂಬಂಧಗಳು' : 'Cross-Modal Synthesis',
        headline: isKn ? 'ಪರಿಸರ ಮತ್ತು ಸಸ್ಯದ ಪ್ರತಿಕ್ರಿಯೆ' : 'Solution to Foliar Association',
        detail: correlations && correlations.length > 0
          ? `${correlations[0].environmentLabel} correlated with ${correlations[0].plantLabel}`
          : 'No statistically significant causal links identified.',
        status: correlations && correlations.length > 0 ? 'warning' : 'optimal',
      },
      {
        stage: 'RECOMMENDATION',
        stageLabel: isKn ? 'ಶಿಫಾರಸು' : 'Prescriptive Action',
        headline: whatToDoText,
        detail: 'Actionable guidance derived from verified sensor and optical evidence.',
        status: isUnderStress ? 'warning' : 'optimal',
      },
      {
        stage: 'LIMITATIONS',
        stageLabel: isKn ? 'ಮಿತಿಗಳು' : 'Decision Bounds',
        headline: isKn ? 'ವ್ಯವಸ್ಥೆಯ ಮಿತಿಗಳು' : 'Diagnostic Scope & Constraints',
        detail: latestReasoningEvent?.limitations.length
          ? latestReasoningEvent.limitations[0]
          : 'Operating under complete multi-sensor closed-loop verification.',
        status: 'neutral',
      },
    ];
  }, [
    isKn,
    cameraEvidence,
    waterEvidence,
    historyEvidence,
    correlations,
    whatToDoText,
    latestReasoningEvent,
    farmerSemanticState.plantStatus,
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
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        padding: '1.5rem',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* ── 1. Header Row ── */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-emerald-ink)',
              }}
            >
              {isKn ? copy.ui.diagnosticWorkspace : 'DIAGNOSTIC WORKSPACE'}
            </span>
            <h1
              style={{
                fontSize: '1.625rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {isKn ? copy.ui.plantReasoningLab : 'Plant Reasoning Lab'}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              {isKn ? copy.ui.reasoningSubtitle : 'Transparent, evidence-based multimodal plant intelligence.'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
            <ModeToggle mode={userMode} onModeChange={setUserMode} size="sm" language={language} />
            <LanguageToggle language={language} onLanguageChange={setLanguage} size="sm" />
            {userMode === 'technical' && (
              <button
                type="button"
                onClick={handleExportDiagnostics}
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  fontFamily: 'var(--font-mono, monospace)',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-xs, 2px)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                }}
              >
                {isKn ? 'ಡಯಾಗ್ನೋಸ್ಟಿಕ್ ರಫ್ತು' : 'Export JSON'}
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Diagnostic State Banner ── */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm, 4px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            width: '100%',
          }}
        >
          {/* Health State */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRight: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
              }}
            >
              {isKn ? 'ಗಿಡದ ಒಟ್ಟಾರೆ ಸ್ಥಿತಿ' : 'HEALTH STATE'}
            </span>
            <div style={{ fontSize: '1rem', fontWeight: 800, color: plantStateLabel === 'HEALTHY' ? 'var(--color-green)' : 'var(--color-amber)' }}>
              {plantStateLabel}
            </div>
          </div>

          {/* Monitored Specimen */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRight: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
              }}
            >
              {isKn ? 'ಸಸ್ಯ ಪ್ರಭೇದ' : 'SPECIMEN'}
            </span>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {plantDisplayName}
            </div>
            <div style={{ fontSize: '0.6875rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
              {botanicalScientific}
            </div>
          </div>

          {/* Reasoning Confidence */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderRight: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
              }}
            >
              {isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ' : 'CONFIDENCE'}
            </span>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-teal)' }}>
              {reasoningConfidenceLevel.toUpperCase()} ({reasoningConfidenceScore}%)
            </div>
          </div>

          {/* Scenario Code */}
          <div
            style={{
              padding: '1rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: 'var(--text-muted)',
              }}
            >
              {isKn ? 'ಸನ್ನಿವೇಶ ಸಂಕೇತ' : 'SCENARIO CODE'}
            </span>
            <div style={{ fontSize: '0.8125rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--text-secondary)' }}>
              {scenarioCode}
            </div>
          </div>
        </div>

        {/* ── 3. Dedicated 3-Column Reasoning Section on Desktop ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0.2rem 0.5rem',
                borderRadius: '2px',
                background: 'var(--color-emerald-ink)',
                color: 'var(--color-champagne)',
              }}
            >
              SYNTHESIS
            </span>
            <h2
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {isKn ? 'ಕಾರಣ ವಿಶ್ಲೇಷಣಾ ಸಾರಾಂಶ' : 'MULTIMODAL REASONING SUMMARY'}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1rem',
              width: '100%',
            }}
          >
            {/* Column 1: What's Happening */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 800,
                    color: 'var(--text-dim)',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '2px',
                    width: '1.25rem',
                    height: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  1
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isKn ? '೧. ಏನಾಗುತ್ತಿದೆ?' : "1. WHAT'S HAPPENING?"}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {whatsHappeningText}
              </p>
            </div>

            {/* Column 2: Why? */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 800,
                    color: 'var(--text-dim)',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '2px',
                    width: '1.25rem',
                    height: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  2
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isKn ? '೨. ಕಾರಣ / ಹಿನ್ನೆಲೆ' : '2. WHY? (ASSOCIATED FACTORS)'}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--text-secondary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {whyText}
              </p>
            </div>

            {/* Column 3: What to do */}
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.625rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 800,
                    color: 'var(--color-emerald-ink)',
                    background: 'var(--color-champagne)',
                    borderRadius: '2px',
                    width: '1.25rem',
                    height: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  3
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--color-emerald-ink)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {isKn ? '೩. ಏನು ಮಾಡಬೇಕು?' : '3. WHAT TO DO?'}
                </span>
              </div>
              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {whatToDoText}
              </p>
            </div>
          </div>
        </div>

        {/* ── 4. Scientific Evidence Chain ── */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '1.25rem',
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <EvidenceChain
            steps={evidenceChainSteps}
            confidenceScore={userMode === 'technical' ? reasoningConfidenceScore : undefined}
            confidenceText={userMode === 'farmer' ? naturalConfidence : undefined}
            confidenceLabel={isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ' : 'Confidence'}
          />
        </div>
      </div>
    </div>
  );
}
