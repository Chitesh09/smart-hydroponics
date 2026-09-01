'use client';

import { useState, useMemo } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { EvidenceChain, EvidenceStep } from '@/components/ui/EvidenceChain';
import {
  Brain,
  Layers,
  Eye,
  CameraOff,
  Download,
  Search,
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
    multimodalAssessment,
    predictiveAnalytics,
    activeAnomalies,
    activeRecommendations,
    observations,
    identifyCurrentPlant,
    isIdentifying
  } = usePlantIntelligence();

  const { mode, isStale, latestReading } = useESP32Serial();
  const { status: cameraStatus, videoRef, startCamera } = useCamera();

  const [identificationError, setIdentificationError] = useState<string | null>(null);

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Unknown Plant';
  const botanicalScientific = isPlantIdentified ? cropIdentity.scientificName || 'Species Unclassified' : 'Identification pending';

  const isTelemetryAvailable = latestReading !== null && !isStale;
  const isCameraActive = cameraStatus === 'connected';

  // Build the dynamic scientific Evidence Chain from real system state
  const evidenceChainSteps = useMemo((): EvidenceStep[] => {
    const steps: EvidenceStep[] = [];

    // Step 1: Observation
    if (isCameraActive && latestDetection?.isPlantDetected) {
      steps.push({
        stage: 'OBSERVATION',
        headline: `Foliage presence confirmed (${latestDetection.canopyCoveragePercent}% canopy coverage)`,
        detail: latestVisualHealth
          ? `Visual health evaluated at ${latestVisualHealth.visualHealthScore}/100 with ${latestVisualHealth.chlorosisYellowPercent.toFixed(1)}% discoloration ratio.`
          : 'Foliage canopy detected in optical frame.',
        status: latestVisualHealth?.healthState === 'healthy' ? 'optimal' : 'warning',
      });
    } else {
      steps.push({
        stage: 'OBSERVATION',
        headline: isCameraActive ? 'Searching for plant foliage structure' : 'Optical camera offline',
        detail: isCameraActive ? 'Position a plant inside the optical view.' : 'Activate camera for real-time visual inspection.',
        status: 'neutral',
      });
    }

    // Step 2: Environment
    if (isTelemetryAvailable && latestReading) {
      const isEnvOptimal = multimodalAssessment.environmentalState === 'optimal';
      steps.push({
        stage: 'ENVIRONMENT',
        headline: `Sensory telemetry: pH ${latestReading.ph.toFixed(2)} · TDS ${Math.round(latestReading.tds)} PPM · Reservoir ${Math.round(latestReading.waterLevel)}%`,
        detail: isEnvOptimal
          ? 'All chemical and physical sensor measurements are within target biological tolerances.'
          : 'One or more environmental sensor channels deviate from preferred crop baseline.',
        status: isEnvOptimal ? 'optimal' : 'warning',
      });
    } else {
      steps.push({
        stage: 'ENVIRONMENT',
        headline: 'Environmental telemetry unavailable',
        detail: 'Connect ESP32 receiver to stream live probe measurements.',
        status: 'neutral',
      });
    }

    // Step 3: Historical Trend
    steps.push({
      stage: 'HISTORICAL TREND',
      headline: `pH ${predictiveAnalytics.predictions.ph.trendDirection} · TDS ${predictiveAnalytics.predictions.tds.trendDirection} · Water ${predictiveAnalytics.predictions.waterLevel.trendDirection}`,
      detail: `Trend direction calculated across ${observations.length} longitudinal observation cycles.`,
      status: 'neutral',
    });

    // Step 4: Interpretation
    steps.push({
      stage: 'INTERPRETATION',
      headline: multimodalAssessment.interpretations[0] || 'Biological condition stable',
      detail: multimodalAssessment.explanations[0] || 'Environmental parameters and foliage condition align with standard growth profile.',
      status: multimodalAssessment.overallHealthState === 'optimal' ? 'optimal' : 'warning',
    });

    // Step 5: Action
    if (activeRecommendations.length > 0) {
      steps.push({
        stage: 'ACTION',
        headline: activeRecommendations[0].title,
        detail: `${activeRecommendations[0].action} — Reason: ${activeRecommendations[0].reasoning}`,
        status: activeRecommendations[0].priority === 'urgent' || activeRecommendations[0].priority === 'high' ? 'warning' : 'optimal',
      });
    }

    return steps;
  }, [
    isCameraActive,
    latestDetection,
    latestVisualHealth,
    isTelemetryAvailable,
    latestReading,
    multimodalAssessment,
    predictiveAnalytics,
    observations.length,
    activeRecommendations
  ]);

  const handleTriggerIdentification = async () => {
    setIdentificationError(null);
    try {
      await identifyCurrentPlant();
    } catch (err: unknown) {
      setIdentificationError(err instanceof Error ? err.message : 'Identification request failed');
    }
  };

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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
          <span className="section-label">Condition</span>
          <div className={styles.bannerValue}>
            <StatusBadge
              status={isTelemetryAvailable || isCameraActive ? multimodalAssessment.overallHealthState : 'insufficient_data'}
              size="sm"
            />
            {isTelemetryAvailable && (
              <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {multimodalAssessment.overallScore}/100
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
                  <StatusBadge status={isCameraActive && latestDetection?.isPlantDetected ? (latestVisualHealth?.healthState || 'healthy') : 'unavailable'} size="sm" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className={styles.pillarMetricRow}>
                    <span className="text-secondary">Canopy Cover</span>
                    <span className="font-mono text-primary">{isCameraActive && latestDetection?.isPlantDetected ? `${latestDetection.canopyCoveragePercent}%` : '--'}</span>
                  </div>
                  <div className={styles.pillarMetricRow}>
                    <span className="text-secondary">Foliage State</span>
                    <span className="text-primary font-medium">{isCameraActive && latestDetection?.isPlantDetected ? 'Uniform' : 'Standby'}</span>
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
                    <span className="font-mono text-primary">{isCameraActive && latestDetection?.isPlantDetected ? '32%' : '0%'}</span>
                  </div>
                  <div className={styles.barTrack}>
                    <div className={styles.barFill} style={{ width: isCameraActive && latestDetection?.isPlantDetected ? '90%' : '0%', background: 'var(--color-green)' }} />
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

        {/* Right Column: Optical Station, ML Identification & Observations Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Optical Analysis & Botanical ML Trigger */}
          <div className={styles.reasoningPanel}>
            <div className={styles.panelHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Eye size={16} style={{ color: 'var(--color-teal)' }} />
                <span className="section-label">Optical Observation Station</span>
              </div>
              <StatusBadge status={isCameraActive ? 'live' : 'offline'} size="sm" />
            </div>

            <div className={styles.opticalLabBox}>
              <video
                ref={videoRef}
                className={styles.opticalLabVideo}
                autoPlay
                playsInline
                muted
                style={{ display: isCameraActive ? 'block' : 'none' }}
              />

              {!isCameraActive && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <CameraOff size={24} />
                  <span style={{ fontSize: '11px' }}>Camera Offline</span>
                  <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '3px 8px' }} onClick={() => startCamera()}>
                    Start Optical Feed
                  </button>
                </div>
              )}
            </div>

            {/* Pl@ntNet ML Identification Trigger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Botanical ML Identification
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Query Pl@ntNet botanical database using live optical frame
                  </div>
                </div>

                <button
                  className="btn btn-primary"
                  style={{ fontSize: '11px', padding: '5px 12px' }}
                  onClick={handleTriggerIdentification}
                  disabled={!isCameraActive || isIdentifying}
                >
                  <Search size={12} />
                  <span>{isIdentifying ? 'Analyzing...' : 'Identify Specimen'}</span>
                </button>
              </div>

              {identificationError && (
                <span style={{ fontSize: '11px', color: 'var(--color-red)' }}>
                  {identificationError}
                </span>
              )}
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
