'use client';

import { useState } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { PlantCandidate } from '@/lib/intelligence/types';
import {
  Camera,
  CameraOff,
  AlertTriangle,
  CheckCircle2,
  Download,
  Layers,
  Activity,
  Scan,
  Leaf,
  Check,
  HeartPulse,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Clock,
  ShieldAlert,
  Sliders
} from 'lucide-react';
import styles from './page.module.css';

export default function IntelligencePage() {
  const { isStale, latestReading } = useESP32Serial();
  const {
    status: cameraStatus,
    videoRef,
    availableDevices,
    startCamera,
    stopCamera,
    switchDevice
  } = useCamera();

  const {
    cropIdentity,
    observations,
    latestDetection,
    latestVisualHealth,
    identificationResult,
    isIdentifying,
    identifyCurrentPlant,
    applyIdentifiedSpecies,
    environmentalAssessment,
    multimodalAssessment,
    growthMetrics,
    predictiveAnalytics,
    statisticalAnomalies,
    structuredPlantContext,
    activeAnomalies,
    activeRecommendations,
    captureAndObserve
  } = usePlantIntelligence();

  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const handleCapture = () => {
    const obs = captureAndObserve();
    if (obs) {
      setCaptureFeedback(`Observation snapshot recorded at ${new Date(obs.timestamp).toLocaleTimeString()}`);
      setTimeout(() => setCaptureFeedback(null), 4000);
    }
  };

  const handleApplyProfile = (candidate: PlantCandidate) => {
    applyIdentifiedSpecies(candidate);
    setAppliedFeedback(`Applied ${candidate.commonName} target parameters (pH ${candidate.targetProfile.phMin}-${candidate.targetProfile.phMax}, TDS ${candidate.targetProfile.tdsMin}-${candidate.targetProfile.tdsMax}).`);
    setTimeout(() => setAppliedFeedback(null), 5000);
  };

  const handleExportData = () => {
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      cropIdentity,
      multimodalAssessment,
      predictiveAnalytics,
      statisticalAnomalies,
      observationsCount: observations.length,
      recentObservations: observations.slice(0, 10),
      structuredContext: structuredPlantContext,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydrosmart_diagnostic_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Determine overall sensor data confidence
  const isTelemetryAvailable = latestReading !== null && !isStale;
  const isCameraAvailable = cameraStatus === 'connected' && latestDetection !== null;
  const dataConfidenceLevel =
    isTelemetryAvailable && isCameraAvailable ? 'High' :
    isTelemetryAvailable || isCameraAvailable ? 'Medium' : 'Limited';

  // Format species display name
  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Unknown Plant';

  // Extract component scores safely
  const envScore = environmentalAssessment.compositeEnvironmentalScore;
  const visScore = latestDetection?.isPlantDetected && latestVisualHealth?.visualHealthScore !== undefined
    ? latestVisualHealth.visualHealthScore
    : null;
  const histScore = multimodalAssessment.trend === 'improving' ? 95 : multimodalAssessment.trend === 'stable' ? 88 : multimodalAssessment.trend === 'declining' ? 65 : 75;

  return (
    <div className={styles.container}>
      
      {/* 1. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="text-3xl font-bold text-primary">Plant Intelligence</h1>
            <span className="badge badge-info" style={{ fontSize: '10px' }}>
              <Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Diagnostic Control Center
            </span>
          </div>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            Understand what is happening, why it is happening, and what requires attention.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" style={{ fontSize: '12px' }} onClick={handleExportData}>
            <Download size={14} /> Export Diagnostic JSON
          </button>
          <button className="btn btn-primary" style={{ fontSize: '12px' }} onClick={handleCapture}>
            <Activity size={14} /> Record Observation Snapshot
          </button>
        </div>
      </div>

      {captureFeedback && (
        <div style={{ padding: '10px 14px', background: 'rgba(183, 255, 60, 0.1)', border: '1px solid #B7FF3C', borderRadius: '6px', color: '#B7FF3C', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {captureFeedback}
        </div>
      )}

      {appliedFeedback && (
        <div style={{ padding: '10px 14px', background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00E5FF', borderRadius: '6px', color: '#00E5FF', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {appliedFeedback}
        </div>
      )}

      {/* ============================================================ */}
      {/* SECTION 1 — PLANT STATUS OVERVIEW (Diagnostic Header Banner) */}
      {/* ============================================================ */}
      <div className={styles.overviewBanner}>
        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Monitored Plant</span>
          <div className={styles.overviewValue}>
            <Leaf size={18} className="text-primary" />
            <span>{plantDisplayName}</span>
          </div>
          <span className={styles.overviewSub}>
            {isPlantIdentified ? `${cropIdentity.scientificName || 'Botanical Species'}` : 'Identification Pending (Scan below)'}
          </span>
        </div>

        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Overall Condition</span>
          <div className={styles.overviewValue} style={{ fontFamily: 'var(--font-mono)' }}>
            {multimodalAssessment.overallScore !== null ? (
              <>
                <span style={{ color: multimodalAssessment.overallScore >= 80 ? '#B7FF3C' : multimodalAssessment.overallScore >= 60 ? '#FFC857' : '#FF6B4A' }}>
                  {multimodalAssessment.overallScore}
                </span>
                <span style={{ fontSize: '13px', color: '#5A738E' }}>/ 100</span>
              </>
            ) : (
              <span style={{ fontSize: '14px', color: '#8FA3B8' }}>Unavailable</span>
            )}
          </div>
          <span className={styles.overviewSub}>
            {multimodalAssessment.overallScore !== null ? (
              multimodalAssessment.overallScore >= 80 ? 'Optimal Physiology' :
              multimodalAssessment.overallScore >= 60 ? 'Attention Required' : 'Critical Stress'
            ) : 'Sensors / Camera Inactive'}
          </span>
        </div>

        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Data Confidence</span>
          <div className={styles.overviewValue}>
            <span className={`badge badge-${dataConfidenceLevel === 'High' ? 'success' : dataConfidenceLevel === 'Medium' ? 'warning' : 'danger'}`}>
              ● {dataConfidenceLevel.toUpperCase()} CONFIDENCE
            </span>
          </div>
          <span className={styles.overviewSub}>
            ESP32: {isTelemetryAvailable ? 'Online' : 'Offline'} · Camera: {isCameraAvailable ? 'Active' : 'Standby'}
          </span>
        </div>

        <div className={styles.overviewItem}>
          <span className={styles.overviewLabel}>Last Analysis</span>
          <div className={styles.overviewValue} style={{ fontSize: '14px', color: '#8FA3B8', fontFamily: 'var(--font-mono)' }}>
            <Clock size={15} style={{ marginRight: '4px' }} />
            {new Date(multimodalAssessment.timestamp).toLocaleTimeString()}
          </div>
          <span className={styles.overviewSub}>Continuous real-time evaluation</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2 — MULTIMODAL HEALTH ANALYSIS (HERO SECTION)         */}
      {/* ============================================================ */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <HeartPulse size={20} className="text-primary" />
            <h2 className="text-lg font-bold">MULTIMODAL HEALTH ANALYSIS</h2>
          </div>
          <span className="badge badge-info" style={{ fontSize: '10.5px' }}>
            Cross-Domain Fusion (ESP32 + Camera + History)
          </span>
        </div>

        {/* 3 Pillars Grid */}
        <div className={styles.pillarsGrid}>
          
          {/* Pillar 1: Environmental Health */}
          <div className={styles.pillarCard}>
            <div className={styles.pillarCardHeader}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#00E5FF' }}>ENVIRONMENTAL</span>
              <span className={`badge badge-${multimodalAssessment.environmentalState === 'optimal' ? 'success' : multimodalAssessment.environmentalState === 'warning' ? 'warning' : 'danger'}`} style={{ fontSize: '9.5px' }}>
                {multimodalAssessment.environmentalState.toUpperCase()}
              </span>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">pH Level:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {latestReading?.ph !== undefined ? `${latestReading.ph.toFixed(2)} (${environmentalAssessment.phStatus})` : 'Unavailable'}
              </strong>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">TDS / Minerals:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {latestReading?.tds !== undefined ? `${Math.round(latestReading.tds)} PPM (${environmentalAssessment.tdsStatus})` : 'Unavailable'}
              </strong>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">Water Capacity:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {latestReading?.waterLevel !== undefined ? `${Math.round(latestReading.waterLevel)}% (${environmentalAssessment.waterLevelStatus})` : 'Unavailable'}
              </strong>
            </div>

            <div className={styles.pillarScoreRow}>
              <span className="text-muted">Pillar Score:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                {isTelemetryAvailable ? `${envScore} / 100` : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* Pillar 2: Visual Foliage Health */}
          <div className={styles.pillarCard}>
            <div className={styles.pillarCardHeader}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#B7FF3C' }}>VISUAL FOLIAGE</span>
              <span className={`badge badge-${latestDetection?.isPlantDetected ? 'success' : 'warning'}`} style={{ fontSize: '9.5px' }}>
                {latestDetection?.isPlantDetected ? 'PLANT DETECTED' : 'STANDBY'}
              </span>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">Plant Presence:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {latestDetection ? `${latestDetection.plantPresenceScore || latestDetection.confidence}%` : 'Unavailable'}
              </strong>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">Canopy Coverage:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>
                {latestDetection?.canopyCoveragePercent ? `${latestDetection.canopyCoveragePercent}%` : 'Unavailable'}
              </strong>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">Foliage Chlorophyll:</span>
              <strong style={{ textTransform: 'capitalize' }}>
                {latestDetection?.foliageColorAssessment?.replace('_', ' ') || 'Standby'}
              </strong>
            </div>

            <div className={styles.pillarScoreRow}>
              <span className="text-muted">Pillar Score:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#B7FF3C', fontFamily: 'var(--font-mono)' }}>
                {visScore !== null ? `${visScore} / 100` : 'Unavailable'}
              </span>
            </div>
          </div>

          {/* Pillar 3: Historical Stability */}
          <div className={styles.pillarCard}>
            <div className={styles.pillarCardHeader}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#C77DFF' }}>HISTORICAL STABILITY</span>
              <span className="badge badge-info" style={{ fontSize: '9.5px', textTransform: 'uppercase' }}>
                {multimodalAssessment.trend.replace('_', ' ')}
              </span>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">Logged Snapshots:</span>
              <strong style={{ fontFamily: 'var(--font-mono)' }}>{observations.length} records</strong>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">Cumulative Growth:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: growthMetrics?.cumulativeGrowthDelta && growthMetrics.cumulativeGrowthDelta > 0 ? '#B7FF3C' : '#F4F7FB' }}>
                {growthMetrics?.cumulativeGrowthDelta ? `${growthMetrics.cumulativeGrowthDelta > 0 ? '+' : ''}${growthMetrics.cumulativeGrowthDelta}%` : '--'}
              </strong>
            </div>

            <div className={styles.pillarMetricRow}>
              <span className="text-muted">Anomaly Frequency:</span>
              <strong>{activeAnomalies.length === 0 ? 'Nominal (Zero Outliers)' : `${activeAnomalies.length} Flagged`}</strong>
            </div>

            <div className={styles.pillarScoreRow}>
              <span className="text-muted">Pillar Score:</span>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#C77DFF', fontFamily: 'var(--font-mono)' }}>
                {observations.length >= 2 ? `${histScore} / 100` : 'Unavailable'}
              </span>
            </div>
          </div>
        </div>

        {/* "Why this score?" Breakdown Box */}
        <div className={styles.scoreBreakdownBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#00E5FF', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Why this composite score?
            </span>
            <span style={{ fontSize: '11px', color: '#8FA3B8' }}>
              Formula: (40% Env) + (35% Visual) + (25% History)
            </span>
          </div>

          <div className={styles.breakdownBars}>
            <div className={styles.breakdownBarItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span className="text-muted">Environmental (40%)</span>
                <strong style={{ color: '#00E5FF' }}>{isTelemetryAvailable ? envScore : '--'}</strong>
              </div>
              <div className={styles.progressBarTrack}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ width: `${isTelemetryAvailable ? envScore : 0}%`, background: '#00E5FF' }} 
                />
              </div>
            </div>

            <div className={styles.breakdownBarItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span className="text-muted">Visual Foliage (35%)</span>
                <strong style={{ color: '#B7FF3C' }}>{visScore ?? '--'}</strong>
              </div>
              <div className={styles.progressBarTrack}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ width: `${visScore ?? 0}%`, background: '#B7FF3C' }} 
                />
              </div>
            </div>

            <div className={styles.breakdownBarItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span className="text-muted">Historical Stability (25%)</span>
                <strong style={{ color: '#C77DFF' }}>{observations.length >= 2 ? histScore : '--'}</strong>
              </div>
              <div className={styles.progressBarTrack}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ width: `${observations.length >= 2 ? histScore : 0}%`, background: '#C77DFF' }} 
                />
              </div>
            </div>

            <div className={styles.breakdownBarItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span className="text-muted">Overall Composite</span>
                <strong style={{ color: '#B7FF3C' }}>{multimodalAssessment.overallScore ?? '--'}</strong>
              </div>
              <div className={styles.progressBarTrack}>
                <div 
                  className={styles.progressBarFill} 
                  style={{ width: `${multimodalAssessment.overallScore ?? 0}%`, background: '#B7FF3C' }} 
                />
              </div>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#8FA3B8', lineHeight: 1.5, marginTop: '8px' }}>
            {multimodalAssessment.explanations && multimodalAssessment.explanations.length > 0 ? (
              multimodalAssessment.explanations.map((exp, idx) => (
                <div key={idx}>• {exp}</div>
              ))
            ) : (
              <div>• Physiological metrics indicate balanced equilibrium across sensory domains.</div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 8 — AI DIAGNOSTIC SYNTHESIS (Why This Matters)       */}
      {/* ============================================================ */}
      <div className={styles.aiSynthesisCard}>
        <div className={styles.aiSynthesisHeader}>
          <Sparkles size={16} />
          <span>AI Diagnostic Synthesis — Why This Matters</span>
        </div>
        <p className={styles.aiSynthesisBody}>
          {multimodalAssessment.interpretations && multimodalAssessment.interpretations.length > 0 ? (
            multimodalAssessment.interpretations.join(' ')
          ) : (
            `The monitored ${plantDisplayName} is operating within nominal environmental thresholds. Electrical conductivity indicates sufficient dissolved mineral density for vegetative vigor, and visual canopy coverage reflects active photosynthetic development. No immediate chemical intervention is required.`
          )}
        </p>
      </div>

      {/* ============================================================ */}
      {/* 2-COLUMN ANALYTICAL STAGE: OBSERVATIONS + ANOMALIES/PREDICT  */}
      {/* ============================================================ */}
      <div className={styles.analyticalGrid}>
        
        {/* Left Column: SECTION 3 — DETECTED OBSERVATIONS TIMELINE */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleGroup}>
              <Activity size={18} className="text-primary" />
              <h3 className="text-md font-bold">DETECTED OBSERVATIONS STREAM</h3>
            </div>
            <span style={{ fontSize: '11px', color: '#8FA3B8' }}>
              Chronological Multi-Source Event Log
            </span>
          </div>

          <div className={styles.timelineList}>
            {multimodalAssessment.observations && multimodalAssessment.observations.length > 0 ? (
              multimodalAssessment.observations.map((obsText, idx) => {
                const isEsp = obsText.includes('ESP32') || obsText.includes('sensor');
                const isCam = obsText.includes('Camera') || obsText.includes('canopy') || obsText.includes('Foliage');
                const isHist = obsText.includes('historical') || obsText.includes('Trajectory');
                const sourceTag = isEsp ? 'ESP32' : isCam ? 'CAMERA' : isHist ? 'HISTORY' : 'ANALYTICS';
                const sourceClass = isEsp ? styles.sourceEsp32 : isCam ? styles.sourceCamera : isHist ? styles.sourceHistory : styles.sourceAnalytics;

                return (
                  <div key={idx} className={styles.timelineItem}>
                    <div className={styles.timelineMetaRow}>
                      <span className={`${styles.sourceBadge} ${sourceClass}`}>{sourceTag}</span>
                      <span style={{ fontSize: '10.5px', color: '#5A738E', fontFamily: 'var(--font-mono)' }}>
                        {new Date(multimodalAssessment.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#F4F7FB', lineHeight: 1.4 }}>
                      {obsText}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#8FA3B8', fontSize: '12px' }}>
                No active observations logged. Activate telemetry or camera to record stream events.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: SECTION 4 & 5 — ANOMALIES, PREDICTIONS, RECOMMEND */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* SECTION 4 — ANOMALIES & WARNINGS */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <ShieldAlert size={18} style={{ color: activeAnomalies.length > 0 ? '#FF6B4A' : '#B7FF3C' }} />
                <h3 className="text-md font-bold">ANOMALIES & DRIFT WARNINGS</h3>
              </div>
              <span className={`badge badge-${activeAnomalies.length > 0 ? 'danger' : 'success'}`} style={{ fontSize: '9.5px' }}>
                {activeAnomalies.length > 0 ? `${activeAnomalies.length} FLAGGED` : '0 ANOMALIES'}
              </span>
            </div>

            {activeAnomalies.length > 0 ? (
              <div className={styles.anomaliesList}>
                {activeAnomalies.map((anom) => (
                  <div key={anom.id} className={styles.anomalyItem}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#FF6B4A' }}>{anom.title}</strong>
                      <span className="badge badge-danger" style={{ fontSize: '9px' }}>{anom.severity.toUpperCase()}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#F4F7FB', margin: '2px 0' }}>{anom.description}</p>
                    {anom.suggestedAction && (
                      <div style={{ fontSize: '11px', color: '#FFC857' }}>
                        Corrective Focus: {anom.suggestedAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.anomalyCleanCard}>
                <CheckCircle2 size={18} />
                <span>All monitored parameters are currently within expected ranges. Zero statistical outliers detected.</span>
              </div>
            )}
          </div>

          {/* SECTION 5 — PREDICTIVE INSIGHTS */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <TrendingUp size={18} className="text-primary" />
                <h3 className="text-md font-bold">PREDICTIVE INSIGHTS</h3>
              </div>
              <span className="badge badge-warning" style={{ fontSize: '9.5px' }}>
                FORECAST (Statistical Projection)
              </span>
            </div>

            <div className={styles.predictionsGrid}>
              
              {/* pH Prediction */}
              <div className={styles.predictionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#00E5FF' }}>pH Drift</span>
                  {predictiveAnalytics.predictions.ph.trendDirection === 'rising' ? (
                    <TrendingUp size={14} style={{ color: '#FF6B4A' }} />
                  ) : predictiveAnalytics.predictions.ph.trendDirection === 'falling' ? (
                    <TrendingDown size={14} style={{ color: '#FF6B4A' }} />
                  ) : (
                    <Minus size={14} style={{ color: '#B7FF3C' }} />
                  )}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#F4F7FB', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.ph !== undefined ? latestReading.ph.toFixed(2) : '--'}
                </div>
                <div style={{ fontSize: '11px', color: '#8FA3B8' }}>
                  Rate: {predictiveAnalytics.predictions.ph.driftPerDay > 0 ? `+${predictiveAnalytics.predictions.ph.driftPerDay}` : predictiveAnalytics.predictions.ph.driftPerDay} / day
                </div>
                <div style={{ fontSize: '10.5px', color: '#FFC857', marginTop: '2px' }}>
                  {predictiveAnalytics.predictions.ph.estimatedDaysToThreshold
                    ? `Crosses limit in ~${predictiveAnalytics.predictions.ph.estimatedDaysToThreshold}d`
                    : 'Within safe boundary'}
                </div>
              </div>

              {/* TDS Prediction */}
              <div className={styles.predictionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#B7FF3C' }}>TDS Depletion</span>
                  {predictiveAnalytics.predictions.tds.trendDirection === 'rising' ? (
                    <TrendingUp size={14} style={{ color: '#FFC857' }} />
                  ) : predictiveAnalytics.predictions.tds.trendDirection === 'falling' ? (
                    <TrendingDown size={14} style={{ color: '#00E5FF' }} />
                  ) : (
                    <Minus size={14} style={{ color: '#B7FF3C' }} />
                  )}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#F4F7FB', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.tds !== undefined ? `${Math.round(latestReading.tds)} PPM` : '--'}
                </div>
                <div style={{ fontSize: '11px', color: '#8FA3B8' }}>
                  Rate: {predictiveAnalytics.predictions.tds.driftPerDay} PPM/day
                </div>
                <div style={{ fontSize: '10.5px', color: '#00E5FF', marginTop: '2px' }}>
                  {predictiveAnalytics.predictions.tds.estimatedDaysToThreshold
                    ? `Depletion in ~${predictiveAnalytics.predictions.tds.estimatedDaysToThreshold}d`
                    : 'Stable nutrient density'}
                </div>
              </div>

              {/* Water Level Prediction */}
              <div className={styles.predictionCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#00E5FF' }}>Reservoir</span>
                  {predictiveAnalytics.predictions.waterLevel.trendDirection === 'falling' ? (
                    <TrendingDown size={14} style={{ color: '#FF6B4A' }} />
                  ) : (
                    <Minus size={14} style={{ color: '#B7FF3C' }} />
                  )}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#F4F7FB', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.waterLevel !== undefined ? `${Math.round(latestReading.waterLevel)}%` : '--'}
                </div>
                <div style={{ fontSize: '11px', color: '#8FA3B8' }}>
                  Rate: {predictiveAnalytics.predictions.waterLevel.driftPerDay}% / day
                </div>
                <div style={{ fontSize: '10.5px', color: '#FF6B4A', marginTop: '2px' }}>
                  {predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold
                    ? `Depleted in ~${predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold}d`
                    : 'Sufficient capacity'}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 6 — RECOMMENDED ACTIONS */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <Sliders size={18} className="text-primary" />
                <h3 className="text-md font-bold">RECOMMENDED ACTIONS</h3>
              </div>
              <span className="badge badge-info" style={{ fontSize: '9.5px' }}>
                Advisory Only (Manual Adjustment)
              </span>
            </div>

            <div className={styles.recommendationsList}>
              {activeRecommendations.length > 0 ? (
                activeRecommendations.map((rec) => (
                  <div key={rec.id} className={styles.recommendationCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '13px', color: '#F4F7FB' }}>{rec.title}</strong>
                      <span className={`${styles.priorityBadge} ${rec.priority === 'high' ? styles.priorityHigh : rec.priority === 'medium' ? styles.priorityMedium : styles.priorityRoutine}`}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#8FA3B8', margin: '2px 0' }}>{rec.reasoning}</p>
                    <div style={{ fontSize: '11.5px', color: '#B7FF3C', background: 'rgba(0,0,0,0.25)', padding: '6px 10px', borderRadius: '4px' }}>
                      💡 Suggested Action: {rec.action}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '14px', background: 'rgba(183, 255, 60, 0.05)', border: '1px solid rgba(183, 255, 60, 0.2)', borderRadius: '6px', color: '#B7FF3C', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={16} /> All environmental setpoints are balanced. Maintain routine inspection schedule.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 7 — COMPACT VISUAL ANALYSIS & IDENTIFICATION PANEL   */}
      {/* ============================================================ */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <Camera size={18} className="text-primary" />
            <h3 className="text-md font-bold">COMPACT VISUAL ANALYSIS & SPECIES IDENTIFICATION</h3>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {cameraStatus === 'connected' ? (
              <button className="btn btn-ghost" style={{ fontSize: '11.5px', color: '#FF6B4A' }} onClick={stopCamera}>
                <CameraOff size={14} /> Stop Camera
              </button>
            ) : (
              <button className="btn btn-primary" style={{ fontSize: '11.5px' }} onClick={() => startCamera()}>
                <Camera size={14} /> Start Live Camera
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', alignItems: 'start' }}>
          
          {/* Compact Camera Preview Box */}
          <div>
            <div className={styles.compactVideoBox}>
              <video 
                ref={videoRef} 
                className={styles.compactVideo} 
                autoPlay 
                playsInline 
                muted 
                style={{ display: cameraStatus === 'connected' ? 'block' : 'none' }}
              />

              {cameraStatus === 'connected' ? (
                <div className={styles.compactVideoOverlay}>
                  <span className={`badge badge-${latestDetection?.isPlantDetected ? 'success' : 'warning'}`} style={{ fontSize: '10px' }}>
                    {latestDetection?.isPlantDetected ? `🌱 Canopy: ${latestDetection.canopyCoveragePercent}%` : '○ Standby'}
                  </span>
                  <span className="badge badge-info" style={{ fontSize: '10px' }}>
                    {latestDetection?.plantPresenceScore || 0}% PRESENCE
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: '#5A738E' }}>
                  <CameraOff size={28} />
                  <span style={{ fontSize: '11.5px' }}>Camera Inactive</span>
                </div>
              )}
            </div>

            {availableDevices.length > 1 && (
              <select 
                className="select" 
                style={{ fontSize: '11.5px', padding: '6px 12px', marginTop: '8px', width: '100%' }}
                onChange={(e) => switchDevice(e.target.value)}
              >
                {availableDevices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Species Identification Station */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#F4F7FB' }}>
                  Current Profile: {plantDisplayName}
                </div>
                <div style={{ fontSize: '12px', color: '#8FA3B8' }}>
                  {isPlantIdentified ? `${cropIdentity.scientificName} · Family: ${cropIdentity.family}` : 'Unclassified / Generic profile active'}
                </div>
              </div>

              <button 
                className="btn btn-primary"
                style={{ fontSize: '12px' }}
                onClick={identifyCurrentPlant}
                disabled={isIdentifying || cameraStatus !== 'connected'}
              >
                {isIdentifying ? <Scan className="spin" size={14} /> : <Scan size={14} />}
                {isIdentifying ? 'Analyzing Botanical ML...' : 'Scan & Identify Plant Species'}
              </button>
            </div>

            {/* Identification Result / Candidate Cards */}
            {identificationResult && (
              <div style={{ background: 'rgba(7, 17, 31, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#00E5FF' }}>
                    Botanical Identification Result
                  </span>
                  <span className={`badge badge-${identificationResult.confidenceLevel === 'high' ? 'success' : identificationResult.confidenceLevel === 'moderate' ? 'info' : 'warning'}`}>
                    {identificationResult.confidenceLevel.toUpperCase()} CONFIDENCE
                  </span>
                </div>

                {identificationResult.primaryCandidate && identificationResult.status === 'success' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#B7FF3C' }}>
                          {identificationResult.primaryCandidate.commonName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#00E5FF', fontStyle: 'italic' }}>
                          {identificationResult.primaryCandidate.scientificName} ({identificationResult.primaryCandidate.family})
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: '#B7FF3C', fontFamily: 'var(--font-mono)' }}>
                          {identificationResult.primaryCandidate.confidence}%
                        </div>
                        <div className="text-xs text-muted">Certainty</div>
                      </div>
                    </div>

                    <button 
                      className="btn btn-primary"
                      style={{ fontSize: '12px', alignSelf: 'flex-start' }}
                      onClick={() => handleApplyProfile(identificationResult.primaryCandidate!)}
                    >
                      <Check size={14} /> Apply {identificationResult.primaryCandidate.commonName} Target Profile
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '12.5px', color: '#FFC857' }}>
                    <AlertTriangle size={14} style={{ display: 'inline', marginRight: '6px' }} />
                    {identificationResult.guidanceMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
