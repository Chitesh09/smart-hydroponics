'use client';

import { useMemo } from 'react';
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
  Minus
} from 'lucide-react';
import styles from './page.module.css';

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

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Unknown Plant';
  const botanicalScientific = isPlantIdentified ? cropIdentity.scientificName || 'Species Unclassified' : 'Identification pending';

  const isTelemetryAvailable = latestReading !== null && !isStale;
  const hasVisualData = Boolean(latestDetection || (latestObservation && latestObservation.isPlantDetected !== undefined));

  // Build the dynamic scientific Evidence Chain from real system state
  const evidenceChainSteps = useMemo((): EvidenceStep[] => {
    const steps: EvidenceStep[] = [];

    // Stage 1: Camera Observation
    if (latestDetection?.isPlantDetected) {
      const isCanopyReduced = latestDetection.canopyCoveragePercent < 15;
      const isChlorosisPresent = latestVisualHealth && latestVisualHealth.chlorosisYellowPercent > 8;

      if (isCanopyReduced || isChlorosisPresent) {
        steps.push({
          stage: 'CAMERA OBSERVATION',
          headline: userMode === 'farmer'
            ? 'Camera detected reduced green canopy.'
            : `Camera detected reduced green canopy (${latestDetection.canopyCoveragePercent}% coverage, ${latestVisualHealth?.chlorosisYellowPercent.toFixed(1)}% chlorosis)`,
          detail: userMode === 'farmer'
            ? farmerSemanticState.plantMessage
            : (latestVisualHealth
                ? `Visual health evaluated at ${latestVisualHealth.visualHealthScore}/100 with ${latestVisualHealth.chlorosisYellowPercent.toFixed(1)}% discoloration ratio.`
                : `Foliage presence confirmed with ${latestDetection.canopyCoveragePercent}% canopy coverage.`),
          status: 'warning',
        });
      } else {
        steps.push({
          stage: 'CAMERA OBSERVATION',
          headline: userMode === 'farmer'
            ? 'Camera detected healthy green canopy.'
            : `Camera detected uniform green canopy (${latestDetection.canopyCoveragePercent}% canopy coverage)`,
          detail: userMode === 'farmer'
            ? farmerSemanticState.plantMessage
            : (latestVisualHealth
                ? `Visual health evaluated at ${latestVisualHealth.visualHealthScore}/100 with optimal pigmentation.`
                : 'Foliage canopy detected and verified in optical frame.'),
          status: 'optimal',
        });
      }
    } else {
      steps.push({
        stage: 'CAMERA OBSERVATION',
        headline: userMode === 'farmer' ? 'No plant detected in camera frame.' : 'Visual observation standby — No plant detected',
        detail: 'Position specimen under the Dashboard camera to capture visual foliage observations.',
        status: 'neutral',
      });
    }

    // Stage 2: Sensor Observation
    if (isTelemetryAvailable && latestReading) {
      const isWaterLow = latestReading.waterLevel < 25;
      const isPhOff = latestReading.ph < 5.5 || latestReading.ph > 6.8;
      const isTdsOff = latestReading.tds < 700 || latestReading.tds > 1400;
      const isEnvOptimal = !isWaterLow && !isPhOff && !isTdsOff && multimodalAssessment.environmentalState === 'optimal';

      let headline = '';
      if (isWaterLow) {
        headline = userMode === 'farmer'
          ? `Water level is low (${Math.round(latestReading.waterLevel)}% reservoir).`
          : `Sensory probe telemetry: Low reservoir capacity (${Math.round(latestReading.waterLevel)}%)`;
      } else if (isPhOff) {
        headline = userMode === 'farmer'
          ? `Water pH is outside normal range (${latestReading.ph.toFixed(2)}).`
          : `Sensory probe telemetry: pH deviation at ${latestReading.ph.toFixed(2)}`;
      } else if (isTdsOff) {
        headline = userMode === 'farmer'
          ? `Nutrient salinity is off target (${Math.round(latestReading.tds)} PPM).`
          : `Sensory probe telemetry: TDS deviation at ${Math.round(latestReading.tds)} PPM`;
      } else {
        headline = userMode === 'farmer'
          ? 'Sensors indicate balanced water and nutrient solution.'
          : `Sensory telemetry: pH ${latestReading.ph.toFixed(2)} · TDS ${Math.round(latestReading.tds)} PPM · Reservoir ${Math.round(latestReading.waterLevel)}%`;
      }

      steps.push({
        stage: 'SENSOR OBSERVATION',
        headline,
        detail: userMode === 'farmer'
          ? `${farmerSemanticState.waterMessage}. ${farmerSemanticState.nutrientMessage}.`
          : (isEnvOptimal
              ? 'All chemical and physical sensor measurements are within target biological tolerances.'
              : 'One or more environmental sensor channels deviate from preferred crop baseline.'),
        status: isEnvOptimal ? 'optimal' : 'warning',
      });
    } else {
      steps.push({
        stage: 'SENSOR OBSERVATION',
        headline: userMode === 'farmer' ? 'Sensory telemetry unavailable.' : 'Environmental probe telemetry offline',
        detail: 'Connect ESP32 receiver or engage simulation mode in IoT Station to stream measurements.',
        status: 'neutral',
      });
    }

    // Stage 3: Historical Change
    if (observations.length >= 2) {
      const oldest = observations[observations.length - 1];
      const newest = observations[0];
      const waterDelta = newest.waterLevel !== undefined && oldest.waterLevel !== undefined ? newest.waterLevel - oldest.waterLevel : null;
      const phDelta = newest.ph !== undefined && oldest.ph !== undefined ? newest.ph - oldest.ph : null;
      const tdsDelta = newest.tds !== undefined && oldest.tds !== undefined ? newest.tds - oldest.tds : null;

      let historyHeadline = '';
      let historyStatus: EvidenceStep['status'] = 'neutral';

      if (waterDelta !== null && waterDelta < -3) {
        historyHeadline = userMode === 'farmer'
          ? `Water level decreased over the last period (${Math.abs(Math.round(waterDelta))}% drop).`
          : `Historical drift: Water reservoir decreased by ${Math.abs(waterDelta).toFixed(1)}%`;
        historyStatus = 'warning';
      } else if (phDelta !== null && Math.abs(phDelta) > 0.25) {
        historyHeadline = userMode === 'farmer'
          ? `pH shifted ${phDelta > 0 ? 'upwards' : 'downwards'} (${phDelta > 0 ? '+' : ''}${phDelta.toFixed(2)}) over recent cycles.`
          : `Historical drift: pH shifted by ${phDelta > 0 ? '+' : ''}${phDelta.toFixed(2)}`;
        historyStatus = 'warning';
      } else if (tdsDelta !== null && Math.abs(tdsDelta) > 75) {
        historyHeadline = userMode === 'farmer'
          ? `Nutrient TDS changed by ${Math.round(tdsDelta)} PPM over recent cycles.`
          : `Historical drift: TDS shifted by ${Math.round(tdsDelta)} PPM`;
        historyStatus = 'warning';
      } else {
        historyHeadline = userMode === 'farmer'
          ? 'Plant parameters have remained stable over observation history.'
          : `Longitudinal trajectory: Parameters stable across ${observations.length} observation cycles`;
        historyStatus = 'optimal';
      }

      steps.push({
        stage: 'HISTORICAL CHANGE',
        headline: historyHeadline,
        detail: userMode === 'farmer'
          ? `Evaluated across ${observations.length} recorded observation cycles.`
          : `Trajectory calculated across ${observations.length} checkpoints (pH trend: ${predictiveAnalytics.predictions.ph.trendDirection}, TDS trend: ${predictiveAnalytics.predictions.tds.trendDirection}).`,
        status: historyStatus,
      });
    } else {
      steps.push({
        stage: 'HISTORICAL CHANGE',
        headline: userMode === 'farmer' ? 'Initial baseline observation established.' : 'Initial observation checkpoint logged',
        detail: `Longitudinal trajectory tracking will expand as further observation cycles accumulate (currently ${observations.length} snapshot).`,
        status: 'neutral',
      });
    }

    // Stage 4: Interpretation
    const isUnderStress = multimodalAssessment.overallHealthState === 'critical' ||
      multimodalAssessment.overallHealthState === 'warning' ||
      farmerSemanticState.plantStatus === 'ATTENTION' ||
      farmerSemanticState.plantStatus === 'URGENT';

    steps.push({
      stage: 'INTERPRETATION',
      headline: isUnderStress
        ? (userMode === 'farmer' ? 'Together, these observations indicate plant stress.' : (multimodalAssessment.interpretations[0] || 'Together, these observations indicate biological plant stress.'))
        : (userMode === 'farmer' ? 'Together, these observations indicate healthy vegetative growth.' : 'Together, sensory telemetry and foliage optics confirm vigorous, healthy growth.'),
      detail: multimodalAssessment.explanations[0] || 'Environmental parameters and foliage condition align with standard growth profile.',
      status: isUnderStress ? 'warning' : 'optimal',
    });

    // Stage 5: Recommendation
    steps.push({
      stage: 'RECOMMENDATION',
      headline: userMode === 'farmer' ? farmerSemanticState.actionableSummary : (activeRecommendations[0]?.title || 'No urgent action needed'),
      detail: activeRecommendations[0]
        ? `${activeRecommendations[0].action} — Reason: ${activeRecommendations[0].reasoning}`
        : 'All environmental parameters and plant health indicators are stable. Maintain standard schedule.',
      status: activeRecommendations[0]?.priority === 'urgent' || activeRecommendations[0]?.priority === 'high' ? 'warning' : 'optimal',
    });

    return steps;
  }, [
    userMode,
    farmerSemanticState,
    latestDetection,
    latestVisualHealth,
    isTelemetryAvailable,
    latestReading,
    multimodalAssessment,
    predictiveAnalytics,
    observations,
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
      
      {/* 1. Reasoning Lab Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <span className="section-label">Scientific Workspace</span>
          <h1 className="display-title">Plant Reasoning Lab</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <ModeToggle mode={userMode} onModeChange={setUserMode} size="sm" />
          <button className="btn btn-secondary" onClick={handleExportDiagnostics} style={{ fontSize: '11.5px' }}>
            <Download size={13} />
            <span>Export Diagnostic JSON</span>
          </button>
        </div>
      </div>

      {/* 2. Diagnostic Overview Banner */}
      <div className={styles.diagnosticBanner}>
        <div className={styles.bannerItem}>
          <span className="section-label">Specimen</span>
          <div className={styles.bannerValue}>
            <span>{plantDisplayName}</span>
            <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-secondary)', fontWeight: 400 }}>
              ({botanicalScientific})
            </span>
          </div>
        </div>

        <div className={styles.bannerItem}>
          <span className="section-label">Plant Condition</span>
          <div className={styles.bannerValue}>
            <StatusBadge
              status={farmerSemanticState.plantStatus.toLowerCase()}
              label={farmerSemanticState.plantMessage}
              size="sm"
            />
            {isTelemetryAvailable && (
              <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                ({multimodalAssessment.overallScore}/100)
              </span>
            )}
          </div>
        </div>

        <div className={styles.bannerItem}>
          <span className="section-label">Telemetry Feed</span>
          <div className={styles.bannerValue}>
            <DataSourceBadge mode={mode} isStale={isStale} hasData={latestReading !== null} />
          </div>
        </div>

        <div className={styles.bannerItem}>
          <span className="section-label">Observation Horizon</span>
          <div className={styles.bannerValue} style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
            {observations.length} Snapshots
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. ASYMMETRIC REASONING STAGE                                */}
      {/* ============================================================ */}
      <div className={styles.reasoningStage}>
        
        {/* Left Column: Evidence Chain & Scientific Synthesis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Signature Evidence Chain */}
          <div className={styles.reasoningPanel}>
            <div className={styles.panelHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain size={16} style={{ color: 'var(--color-teal)' }} />
                <span className="section-label">Botanical Evidence Chain</span>
              </div>
              <span className="scientific-meta">Inference Pipeline</span>
            </div>

            <EvidenceChain steps={evidenceChainSteps} confidenceScore={cropIdentity.confidence} />
          </div>

          {/* Multimodal Health Fusion: 3 Pillars */}
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

        {/* Right Column: Visual Evidence & Observations Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Visual Evidence (Consumed from Dashboard Camera Pipeline) */}
          <div className={styles.reasoningPanel}>
            <div className={styles.panelHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} style={{ color: 'var(--color-teal)' }} />
                <span className="section-label">Visual Evidence</span>
              </div>
              <span className="scientific-meta">Dashboard Camera Stream</span>
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
                  <span className={styles.evidenceLabel}>Plant Species</span>
                  <span className={styles.evidenceValue}>
                    {isPlantIdentified ? cropIdentity.commonName : 'Unclassified'}
                  </span>
                </div>

                <div className={styles.evidenceTile}>
                  <span className={styles.evidenceLabel}>Identification Confidence</span>
                  <span className={styles.evidenceValue}>
                    {isPlantIdentified && cropIdentity.confidence ? `${cropIdentity.confidence}%` : '--'}
                  </span>
                </div>

                <div className={styles.evidenceTile}>
                  <span className={styles.evidenceLabel}>Canopy Coverage</span>
                  <span className={styles.evidenceValue}>
                    {latestDetection ? `${latestDetection.canopyCoveragePercent}%` : '--'}
                  </span>
                </div>

                <div className={styles.evidenceTile}>
                  <span className={styles.evidenceLabel}>Visual Health</span>
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
  );
}

