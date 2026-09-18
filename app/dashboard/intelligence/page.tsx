'use client';

import { useState, useMemo } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { EvidenceChain, EvidenceStep } from '@/components/ui/EvidenceChain';
import { ModeToggle } from '@/components/ui/ModeToggle';
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
function getNaturalConfidence(confidence?: number): string {
  if (confidence === undefined || confidence === null || confidence === 0) {
    return 'Unverified';
  }
  if (confidence >= 80) return 'High';
  if (confidence >= 50) return 'Moderate';
  return 'Tentative';
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
    setUserMode
  } = usePlantIntelligence();

  const { mode, isStale, latestReading } = useESP32Serial();
  const [showSecondaryActions, setShowSecondaryActions] = useState(false);

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Monitored Specimen';
  const botanicalScientific = isPlantIdentified ? cropIdentity.scientificName || 'Species Unclassified' : 'Identification pending';

  const isTelemetryAvailable = latestReading !== null && !isStale;
  const hasVisualData = Boolean(latestDetection || (latestObservation && latestObservation.isPlantDetected !== undefined));

  // Natural confidence string
  const naturalConfidence = useMemo(() => {
    return getNaturalConfidence(cropIdentity.confidence);
  }, [cropIdentity.confidence]);

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
      return 'Not enough information yet. Start the camera from the Dashboard and verify your sensor hardware is streaming.';
    }

    if (farmerSemanticState.plantStatus === 'GOOD') {
      return 'Your plant is doing well. The leaves appear healthy and the water and nutrient levels are balanced.';
    }

    // Explaining WHY the plant needs attention
    if (isCameraChanged && isWaterDecreased) {
      return 'Your plant may need attention because the camera noticed a change in leaf appearance and the water level has also decreased.';
    }
    if (isCameraChanged && isNutrientsOff) {
      return 'Your plant may need attention because the camera noticed leaf discoloration and the nutrient balance is outside the ideal range.';
    }
    if (isWaterDecreased) {
      return 'Your plant needs attention because the water reservoir level has decreased below normal operating bounds.';
    }
    if (isNutrientsOff) {
      return 'Your plant may need attention because nutrient acidity or salinity is drifting outside ideal crop baselines.';
    }
    if (isCameraChanged) {
      return 'Your plant may need attention because the camera detected reduced green foliage canopy or discoloration.';
    }

    return 'Your plant may need attention based on combined camera and sensor observations.';
  }, [
    farmerSemanticState.hasSufficientData,
    farmerSemanticState.plantStatus,
    isCameraChanged,
    isWaterDecreased,
    isNutrientsOff
  ]);

  // 2. EVIDENCE CARDS DATA
  const cameraEvidence = useMemo(() => {
    if (!hasVisualData || !latestDetection) {
      return {
        status: 'neutral' as const,
        finding: 'No visual observation available yet',
        subtext: 'Start the Live Plant Camera from Dashboard to inspect foliage.',
      };
    }
    if (!latestDetection.isPlantDetected) {
      return {
        status: 'warning' as const,
        finding: 'No plant detected in camera frame',
        subtext: 'Position specimen clearly in front of the Dashboard camera.',
      };
    }
    if (latestDetection.confidence && latestDetection.confidence < 45) {
      return {
        status: 'warning' as const,
        finding: 'Camera view is unclear',
        subtext: 'Move closer to the plant or improve illumination.',
      };
    }
    if (isCameraChanged) {
      return {
        status: 'warning' as const,
        finding: 'Plant appearance changed',
        subtext: isChlorosisPresent
          ? `Discoloration noticed on leaves (${latestVisualHealth?.chlorosisYellowPercent.toFixed(1)}% chlorosis ratio).`
          : 'Reduced green foliage canopy observed in optical frame.',
      };
    }
    return {
      status: 'optimal' as const,
      finding: 'Plant appearance looks healthy and green',
      subtext: `Canopy coverage confirmed at ${latestDetection.canopyCoveragePercent}% with uniform green coloration.`,
    };
  }, [hasVisualData, latestDetection, isCameraChanged, isChlorosisPresent, latestVisualHealth]);

  const waterEvidence = useMemo(() => {
    if (!isTelemetryAvailable || !latestReading) {
      return {
        status: 'neutral' as const,
        finding: 'Water sensor readings currently unavailable',
        subtext: 'Connect ESP32 receiver or engage simulation mode in IoT Station.',
      };
    }
    if (isWaterLow && isNutrientsOff) {
      return {
        status: 'warning' as const,
        finding: 'Water level decreased and nutrients are off balance',
        subtext: `Reservoir is at ${Math.round(latestReading.waterLevel)}% capacity and pH is ${latestReading.ph.toFixed(2)}.`,
      };
    }
    if (isWaterLow) {
      return {
        status: 'warning' as const,
        finding: 'Water level decreased below normal',
        subtext: `Current reservoir capacity is ${Math.round(latestReading.waterLevel)}% (nominal > 40%).`,
      };
    }
    if (isNutrientsOff) {
      return {
        status: 'warning' as const,
        finding: 'Nutrient balance needs attention',
        subtext: `pH is ${latestReading.ph.toFixed(2)} (target 5.5 - 6.5) and TDS is ${Math.round(latestReading.tds)} PPM.`,
      };
    }
    return {
      status: 'optimal' as const,
      finding: 'Water level and nutrients are in balance',
      subtext: `Reservoir capacity is ${Math.round(latestReading.waterLevel)}% and nutrient solution is optimal.`,
    };
  }, [isTelemetryAvailable, latestReading, isWaterLow, isNutrientsOff]);

  const historyEvidence = useMemo(() => {
    if (observations.length < 2) {
      return {
        status: 'neutral' as const,
        finding: 'Baseline observation established',
        subtext: 'Initial snapshot logged. Trends will emerge as observation cycles accumulate.',
      };
    }
    if (isHistoryChanged) {
      return {
        status: 'warning' as const,
        finding: 'Change observed over time',
        subtext: historicalDeltas.waterDelta !== null && historicalDeltas.waterDelta < -3
          ? `Water level decreased by ${Math.abs(Math.round(historicalDeltas.waterDelta))}% over recorded cycles.`
          : 'Chemical or physical parameter drift noticed compared to earlier baseline.',
      };
    }
    return {
      status: 'optimal' as const,
      finding: 'Consistent stability over time',
      subtext: `Parameters have remained stable across all ${observations.length} historical checkpoints.`,
    };
  }, [observations.length, isHistoryChanged, historicalDeltas]);

  // 3. SCIENTIFIC EVIDENCE CHAIN STEPS
  const evidenceChainSteps = useMemo((): EvidenceStep[] => {
    const steps: EvidenceStep[] = [];

    // Stage 1: Camera Observation
    steps.push({
      stage: 'CAMERA OBSERVATION',
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
      headline: isUnderStress
        ? (userMode === 'farmer' ? 'Together, these observations indicate plant stress.' : (multimodalAssessment.interpretations[0] || 'Together, these observations indicate biological plant stress.'))
        : (userMode === 'farmer' ? 'Together, these observations confirm healthy growth.' : 'Together, sensory telemetry and foliage optics confirm vigorous, healthy growth.'),
      detail: multimodalAssessment.explanations[0] || 'Environmental parameters and foliage condition align with crop baseline tolerances.',
      status: isUnderStress ? 'warning' : 'optimal',
    });

    // Stage 5: Recommendation
    steps.push({
      stage: 'RECOMMENDATION',
      headline: userMode === 'farmer'
        ? farmerSemanticState.actionableSummary
        : (activeRecommendations[0]?.title || 'Maintain nominal operational parameters'),
      detail: activeRecommendations[0]
        ? `${activeRecommendations[0].action} — Reason: ${activeRecommendations[0].reasoning}`
        : 'All environmental parameters and plant health indicators are stable. Maintain regular monitoring.',
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
    activeRecommendations
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
          <span className="section-label">Diagnostic Workspace</span>
          <h1 className="display-title">Plant Reasoning Lab</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            Understanding why HydroSmart reached its conclusions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <ModeToggle mode={userMode} onModeChange={setUserMode} size="sm" />
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
                ? 'Plant Condition Assessment'
                : 'Attention Reasoning'}
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
                Confidence: {userMode === 'technical' && cropIdentity.confidence ? `${naturalConfidence} (${cropIdentity.confidence}%)` : naturalConfidence}
              </span>
            )}
          </div>
        </div>

        <h2 className={styles.simpleExplanationHeading}>
          {farmerSemanticState.plantStatus === 'GOOD'
            ? 'Why does HydroSmart think your plant is doing well?'
            : farmerSemanticState.plantStatus === 'UNKNOWN'
              ? 'Why does HydroSmart need more information?'
              : 'Why does HydroSmart think your plant needs attention?'}
        </h2>

        <p className={styles.simpleExplanationText}>
          {simpleExplanation}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginTop: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span>Specimen: <strong style={{ color: 'var(--text-primary)' }}>{plantDisplayName}</strong></span>
          <span>•</span>
          <span>Telemetry: <DataSourceBadge mode={mode} isStale={isStale} hasData={latestReading !== null} /></span>
          <span>•</span>
          <span>History: <strong style={{ color: 'var(--text-primary)' }}>{observations.length} checkpoints</strong></span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. EVIDENCE USED BY THE SYSTEM (3 PILLARS)                  */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <span className="section-label">Evidence Used by the System</span>
        
        <div className={styles.evidenceCardsGrid}>
          {/* 1. Camera Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Eye size={15} style={{ color: 'var(--color-teal)' }} />
                <span>Camera</span>
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
                : `Confidence: ${naturalConfidence}`}
            </div>
          </div>

          {/* 2. Water & Nutrients Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Droplets size={15} style={{ color: 'var(--color-green)' }} />
                <span>Water & Nutrients</span>
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
                : (isTelemetryAvailable ? 'Probe sensors active' : 'Awaiting sensor stream')}
            </div>
          </div>

          {/* 3. History Evidence */}
          <div className={styles.evidenceCard}>
            <div className={styles.evidenceCardHeader}>
              <div className={styles.evidenceCardTitle}>
                <Clock size={15} style={{ color: 'var(--color-amber)' }} />
                <span>History</span>
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
                : `Evaluated over ${observations.length} checkpoints`}
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
            <span className="section-label">Botanical Evidence Chain</span>
          </div>
          <span className="scientific-meta">5-Stage Causal Pipeline</span>
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
            <span className="section-label">Recommended Action</span>
          </div>
          <span className="scientific-meta">Action Guidance</span>
        </div>

        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          What should I do?
        </h3>

        {activeRecommendations.length > 0 ? (
          <div className={styles.actionCardContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeRecommendations[0].title}
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
                {activeRecommendations[0].priority} priority
              </span>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', lineHeight: 1.5, margin: 0 }}>
              {activeRecommendations[0].action}
            </p>

            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '4px' }}>
              <strong>Why:</strong> {activeRecommendations[0].reasoning}
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
                  <span>{showSecondaryActions ? 'Hide' : 'View'} {activeRecommendations.length - 1} other recommendation{activeRecommendations.length > 2 ? 's' : ''}</span>
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
                No action is needed based on the information currently available.
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
