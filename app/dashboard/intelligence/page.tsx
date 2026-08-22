'use client';

import { useState } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { DEMO_SCENARIOS } from '@/lib/intelligence/demoScenarios';
import { DemoScenario, PlantCandidate } from '@/lib/intelligence/types';
import {
  Camera,
  CameraOff,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Download,
  Trash2,
  Layers,
  Activity,
  Scan,
  Leaf,
  Check,
  Search,
  HeartPulse,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Compass,
  Calendar,
  Clock,
  History
} from 'lucide-react';
import styles from './page.module.css';

export default function IntelligencePage() {
  const { mode, isStale, latestReading } = useESP32Serial();
  const {
    status: cameraStatus,
    errorMessage: cameraError,
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
    isScanning,
    setIsScanning,
    identificationResult,
    isIdentifying,
    identifyCurrentPlant,
    applyIdentifiedSpecies,
    environmentalAssessment,
    multimodalAssessment,
    growthMetrics,
    plantJourney,
    memoryAnswers,
    activeAnomalies,
    activeRecommendations,
    activeScenario,
    setActiveScenario,
    captureAndObserve,
    clearHistory
  } = usePlantIntelligence();

  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);

  const handleCapture = () => {
    const obs = captureAndObserve();
    if (obs) {
      setCaptureFeedback(`Multimodal observation recorded at ${new Date(obs.timestamp).toLocaleTimeString()}`);
      setTimeout(() => setCaptureFeedback(null), 4000);
    }
  };

  const handleApplyProfile = (candidate: PlantCandidate) => {
    applyIdentifiedSpecies(candidate);
    setAppliedFeedback(`Applied ${candidate.commonName} targets (pH ${candidate.targetProfile.phMin}-${candidate.targetProfile.phMax}, TDS ${candidate.targetProfile.tdsMin}-${candidate.targetProfile.tdsMax}) to system.`);
    setTimeout(() => setAppliedFeedback(null), 5000);
  };

  const handleExport = () => {
    if (observations.length === 0) return;
    const jsonStr = JSON.stringify(observations, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hydrosmart_multimodal_observations_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Multimodal health state colors
  const overallColor = {
    optimal: '#B7FF3C',
    warning: '#FFC857',
    critical: '#FF6B4A',
  }[multimodalAssessment.overallHealthState];

  const visualStateColor = {
    healthy: '#B7FF3C',
    mild_stress: '#00E5FF',
    possible_anomaly: '#FFC857',
    significant_anomaly: '#FF6B4A',
    unknown: '#8FA3B8',
  }[multimodalAssessment.visualState];

  const envStateColor = {
    optimal: '#B7FF3C',
    warning: '#FFC857',
    critical: '#FF6B4A',
  }[multimodalAssessment.environmentalState];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. Header & Quick Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="text-3xl font-bold text-primary">Multimodal Plant Intelligence</h1>
            <span className="badge badge-success" style={{ fontSize: '10px' }}>Phase 6 Growth & Memory</span>
          </div>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            Computer-vision canopy monitoring, persistent Plant Journey timeline, and retrospective plant memory.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-ghost"
            onClick={handleExport}
            disabled={observations.length === 0}
            title="Export observation data as JSON"
          >
            <Download size={15} /> Export JSON
          </button>
          {observations.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={clearHistory}
              title="Clear observation history"
            >
              <Trash2 size={15} /> Clear Log
            </button>
          )}
        </div>
      </div>

      {/* Multimodal Architecture Status Bar */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', borderLeft: `4px solid ${overallColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          {/* Telemetry Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={17} style={{ color: mode === 'real' && !isStale ? '#B7FF3C' : '#FFC857' }} />
            <div>
              <div className="text-xs text-muted">Telemetry Source</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4F7FB' }}>
                {mode === 'real' ? (isStale ? 'ESP32 (Stale)' : 'ESP32 Live Serial') : 'Simulation Engine'}
              </div>
            </div>
          </div>

          {/* Camera Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={17} style={{ color: cameraStatus === 'connected' ? '#00E5FF' : '#8FA3B8' }} />
            <div>
              <div className="text-xs text-muted">Webcam Sensor</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4F7FB' }}>
                {cameraStatus === 'connected' ? 'Connected (Live)' : cameraStatus === 'requesting' ? 'Requesting...' : cameraStatus === 'error' ? 'Access Blocked' : 'Standby / Idle'}
              </div>
            </div>
          </div>

          {/* Multimodal Fusion Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HeartPulse size={17} style={{ color: overallColor }} />
            <div>
              <div className="text-xs text-muted">Condition State</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: overallColor, textTransform: 'capitalize' }}>
                {multimodalAssessment.overallHealthState} ({multimodalAssessment.overallScore}/100)
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Leaf size={13} />
            <span>Active Crop: <strong>{cropIdentity.commonName}</strong></span>
          </span>
        </div>
      </div>

      {appliedFeedback && (
        <div style={{ padding: '12px 16px', background: 'rgba(183, 255, 60, 0.1)', border: '1px solid rgba(183, 255, 60, 0.3)', borderRadius: '6px', fontSize: '13px', color: '#B7FF3C', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} /> {appliedFeedback}
        </div>
      )}

      {/* 2. Main Intelligence Grid */}
      <div className={styles.intelligenceLayout}>
        
        {/* Left Column: LIVE PLANT VIEW & Visual Stress Station */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Live Plant View Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} className="text-primary" />
                <h3 className="text-md font-bold">LIVE PLANT VIEW</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {cameraStatus === 'connected' && (
                  <span className={`badge badge-${latestDetection?.isPlantDetected ? 'success' : 'warning'}`}>
                    {latestDetection?.isPlantDetected ? `● PLANT DETECTED (${latestDetection.confidence}%)` : '○ NO PLANT DETECTED'}
                  </span>
                )}
                <span className={`badge badge-${cameraStatus === 'connected' ? 'success' : cameraStatus === 'error' ? 'danger' : 'info'}`}>
                  ● {cameraStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Video Viewport with Vision HUD & Reticle */}
            <div className={styles.videoViewport}>
              <video 
                ref={videoRef} 
                className={styles.videoElement} 
                autoPlay 
                playsInline 
                muted 
                style={{ display: cameraStatus === 'connected' ? 'block' : 'none' }}
              />
              
              {cameraStatus === 'connected' && (
                <>
                  <div className={styles.videoOverlayGrid} />

                  {/* Top HUD Overlay */}
                  <div className={styles.cameraHudBar}>
                    <div className={styles.hudPill} style={{ color: '#00E5FF' }}>
                      <Activity size={12} />
                      <span>FPS: 60 (Live Stream)</span>
                    </div>

                    <div 
                      className={styles.hudPill} 
                      style={{ color: latestDetection?.isPlantDetected ? '#B7FF3C' : '#FFC857' }}
                    >
                      <Scan size={12} />
                      <span>
                        {latestDetection?.isPlantDetected 
                          ? `CANOPY: ${latestDetection.canopyCoveragePercent}%` 
                          : 'STANDBY'}
                      </span>
                    </div>
                  </div>

                  {/* Computer Vision Bounding Box Overlay */}
                  {latestDetection?.isPlantDetected && latestDetection.boundingBox && (
                    <div 
                      className={styles.boundingBoxOverlay}
                      style={{
                        left: `${latestDetection.boundingBox.x * 100}%`,
                        top: `${latestDetection.boundingBox.y * 100}%`,
                        width: `${latestDetection.boundingBox.width * 100}%`,
                        height: `${latestDetection.boundingBox.height * 100}%`,
                      }}
                    >
                      <span className={styles.boundingBoxTag}>
                        {cropIdentity.commonName} · {latestDetection.confidence}%
                      </span>
                    </div>
                  )}
                </>
              )}

              {cameraStatus !== 'connected' && (
                <div className={styles.videoPlaceholder}>
                  <CameraOff size={42} style={{ color: '#5A738E' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#F4F7FB', fontSize: '15px' }}>Live Plant Camera Inactive</div>
                    <div style={{ fontSize: '12px', color: '#8FA3B8', marginTop: '4px' }}>
                      Click below to activate laptop camera for real-time computer vision canopy detection and visual health analysis.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Computer Vision Metrics Bar */}
            {cameraStatus === 'connected' && latestDetection && (
              <div className={styles.metricsRow}>
                <div className={styles.metricPill}>
                  <span className="text-xs text-muted">Canopy Coverage</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: latestDetection.isPlantDetected ? '#B7FF3C' : '#FFC857', fontFamily: 'var(--font-mono)' }}>
                    {latestDetection.canopyCoveragePercent}%
                  </span>
                </div>
                <div className={styles.metricPill}>
                  <span className="text-xs text-muted">Chlorophyll (ExG)</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                    {latestDetection.vegetationIndex > 0 ? `+${latestDetection.vegetationIndex}` : latestDetection.vegetationIndex}
                  </span>
                </div>
                <div className={styles.metricPill}>
                  <span className="text-xs text-muted">Foliage Quality</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#F4F7FB' }}>
                    {latestDetection.foliageColorAssessment === 'vibrant_green' ? 'Vibrant Green' : latestDetection.foliageColorAssessment === 'chlorosis' ? 'Chlorosis Alert' : latestDetection.foliageColorAssessment === 'pale_yellow' ? 'Pale Foliage' : 'No Foliage'}
                  </span>
                </div>
                <div className={styles.metricPill}>
                  <span className="text-xs text-muted">CV Latency</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#8FA3B8', fontFamily: 'var(--font-mono)' }}>
                    {latestDetection.inferenceTimeMs} ms
                  </span>
                </div>
              </div>
            )}

            {/* Camera Error Banner */}
            {cameraError && (
              <div style={{ marginTop: '14px', padding: '10px 14px', background: 'rgba(255, 107, 74, 0.1)', border: '1px solid rgba(255, 107, 74, 0.25)', borderRadius: '6px', fontSize: '12px', color: 'var(--color-danger)' }}>
                {cameraError}
              </div>
            )}

            {/* Camera Action Buttons */}
            <div className={styles.cameraControls}>
              {cameraStatus === 'connected' ? (
                <>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => identifyCurrentPlant()}
                    disabled={isIdentifying}
                  >
                    <Search size={16} /> {isIdentifying ? 'Analyzing...' : 'Identify Plant'}
                  </button>
                  <button className="btn btn-ghost" onClick={handleCapture}>
                    <Camera size={16} /> Capture Record
                  </button>
                  <button 
                    className={`btn btn-${isScanning ? 'ghost' : 'secondary'}`} 
                    onClick={() => setIsScanning(!isScanning)}
                  >
                    <Scan size={16} /> {isScanning ? 'Auto-Scan: ON' : 'Auto-Scan: OFF'}
                  </button>
                  <button className="btn btn-ghost" onClick={stopCamera}>
                    <CameraOff size={16} /> Stop
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={() => startCamera()}
                  disabled={cameraStatus === 'requesting'}
                >
                  <Camera size={16} /> {cameraStatus === 'requesting' ? 'Starting Camera...' : 'Start Live Plant Camera'}
                </button>
              )}

              {availableDevices.length > 1 && (
                <select 
                  className="select" 
                  style={{ fontSize: '12px', padding: '8px 24px 8px 12px' }}
                  onChange={(e) => switchDevice(e.target.value)}
                >
                  {availableDevices.map(d => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label}</option>
                  ))}
                </select>
              )}
            </div>

            {captureFeedback && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#B7FF3C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} /> {captureFeedback}
              </div>
            )}
          </div>

          {/* Plant Species Identification Results Card */}
          {identificationResult && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Leaf size={18} className="text-primary" />
                  <h3 className="text-md font-bold">PLANT IDENTIFICATION</h3>
                </div>
                <span className={`badge badge-${identificationResult.confidenceLevel === 'high' ? 'success' : identificationResult.confidenceLevel === 'moderate' ? 'info' : 'warning'}`}>
                  {identificationResult.confidenceLevel.toUpperCase()} CONFIDENCE
                </span>
              </div>

              {identificationResult.primaryCandidate && identificationResult.status === 'success' ? (
                <div className={styles.identificationCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#F4F7FB' }}>
                        {identificationResult.primaryCandidate.commonName}
                      </div>
                      <div style={{ fontSize: '13px', color: '#00E5FF', fontStyle: 'italic' }}>
                        {identificationResult.primaryCandidate.scientificName} · Family: {identificationResult.primaryCandidate.family}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div className="text-xs text-muted">Confidence</div>
                      <div style={{ fontSize: '20px', fontWeight: 800, color: '#B7FF3C', fontFamily: 'var(--font-mono)' }}>
                        {identificationResult.primaryCandidate.confidence}%
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#8FA3B8', lineHeight: 1.5 }}>
                    {identificationResult.primaryCandidate.description}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px', fontSize: '11.5px', fontFamily: 'var(--font-mono)' }}>
                    <div>
                      <span className="text-muted">Target pH:</span><br />
                      <strong style={{ color: '#00E5FF' }}>
                        {identificationResult.primaryCandidate.targetProfile.phMin} - {identificationResult.primaryCandidate.targetProfile.phMax}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted">Target TDS:</span><br />
                      <strong style={{ color: '#B7FF3C' }}>
                        {identificationResult.primaryCandidate.targetProfile.tdsMin} - {identificationResult.primaryCandidate.targetProfile.tdsMax} PPM
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted">Optimal Temp:</span><br />
                      <strong style={{ color: '#FFC857' }}>
                        {identificationResult.primaryCandidate.targetProfile.optimalTempMin ?? 18} - {identificationResult.primaryCandidate.targetProfile.optimalTempMax ?? 26}°C
                      </strong>
                    </div>
                  </div>

                  <button 
                    className="btn btn-primary"
                    onClick={() => handleApplyProfile(identificationResult.primaryCandidate!)}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Check size={16} /> Apply {identificationResult.primaryCandidate.commonName} Target Profile
                  </button>
                </div>
              ) : (
                <div style={{ padding: '16px', background: 'rgba(255, 200, 87, 0.08)', border: '1px solid rgba(255, 200, 87, 0.25)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFC857', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                    <AlertTriangle size={16} /> Identification Uncertain
                  </div>
                  <p style={{ fontSize: '12px', color: '#F4F7FB', lineHeight: 1.4 }}>
                    {identificationResult.guidanceMessage}
                  </p>
                </div>
              )}

              {identificationResult.rankedCandidates.length > 1 && (
                <div style={{ marginTop: '16px' }}>
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-sm" style={{ display: 'block' }}>
                    Ranked Botanical Candidates
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {identificationResult.rankedCandidates.map((cand) => (
                      <div key={cand.id} className={styles.candidateRow}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: '#F4F7FB' }}>
                            {cand.commonName} <span style={{ fontSize: '11px', color: '#8FA3B8', fontWeight: 400, fontStyle: 'italic' }}>({cand.scientificName})</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#5A738E' }}>
                            pH {cand.targetProfile.phMin}-{cand.targetProfile.phMax} · TDS {cand.targetProfile.tdsMin}-{cand.targetProfile.tdsMax} PPM
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: cand.confidence > 70 ? '#B7FF3C' : '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                            {cand.confidence}%
                          </span>
                          <button 
                            className="btn btn-ghost"
                            style={{ fontSize: '11px', padding: '4px 8px' }}
                            onClick={() => handleApplyProfile(cand)}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VISUAL PLANT HEALTH / STRESS ANALYSIS CARD */}
          {latestVisualHealth && latestVisualHealth.healthState !== 'unknown' && (
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <span className="text-xs font-bold text-secondary uppercase tracking-wider">Computer Vision Diagnostics</span>
                  <h3 className="text-lg font-bold text-primary" style={{ marginTop: '2px' }}>
                    VISUAL PLANT HEALTH / STRESS ANALYSIS
                  </h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className={`badge badge-${latestVisualHealth.healthState === 'healthy' ? 'success' : latestVisualHealth.healthState === 'mild_stress' ? 'info' : 'warning'}`}>
                    {latestVisualHealth.healthState.replace('_', ' ').toUpperCase()}
                  </span>
                  <div 
                    className={styles.healthScoreCircle}
                    style={{ borderColor: visualStateColor, color: visualStateColor }}
                  >
                    {latestVisualHealth.visualHealthScore}
                  </div>
                </div>
              </div>

              <p className="text-xs text-secondary mb-md">
                {latestVisualHealth.statusText}
              </p>

              {/* 4-Factor Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(7, 17, 31, 0.5)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span className="text-secondary">1. Color Condition (35% Weight)</span>
                    <span style={{ fontWeight: 700, color: latestVisualHealth.breakdown.colorConditionScore > 80 ? '#B7FF3C' : '#FFC857' }}>
                      {latestVisualHealth.breakdown.colorConditionScore}/100
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${latestVisualHealth.breakdown.colorConditionScore}%`, background: latestVisualHealth.breakdown.colorConditionScore > 80 ? '#B7FF3C' : '#FFC857' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span className="text-secondary">2. Surface Uniformity (25% Weight)</span>
                    <span style={{ fontWeight: 700, color: latestVisualHealth.breakdown.surfaceUniformityScore > 80 ? '#B7FF3C' : '#FFC857' }}>
                      {latestVisualHealth.breakdown.surfaceUniformityScore}/100
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${latestVisualHealth.breakdown.surfaceUniformityScore}%`, background: latestVisualHealth.breakdown.surfaceUniformityScore > 80 ? '#B7FF3C' : '#FFC857' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span className="text-secondary">3. Canopy Vigor (20% Weight)</span>
                    <span style={{ fontWeight: 700, color: latestVisualHealth.breakdown.canopyVigorScore > 80 ? '#B7FF3C' : '#FFC857' }}>
                      {latestVisualHealth.breakdown.canopyVigorScore}/100
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${latestVisualHealth.breakdown.canopyVigorScore}%`, background: latestVisualHealth.breakdown.canopyVigorScore > 80 ? '#B7FF3C' : '#FFC857' }} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span className="text-secondary">4. Anomaly Deductions (20% Weight)</span>
                    <span style={{ fontWeight: 700, color: latestVisualHealth.breakdown.anomalyPenaltyScore > 80 ? '#B7FF3C' : '#FF6B4A' }}>
                      {latestVisualHealth.breakdown.anomalyPenaltyScore}/100
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${latestVisualHealth.breakdown.anomalyPenaltyScore}%`, background: latestVisualHealth.breakdown.anomalyPenaltyScore > 80 ? '#B7FF3C' : '#FF6B4A' }} />
                  </div>
                </div>
              </div>

              {/* Indicators */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {latestVisualHealth.indicators.map((ind) => (
                  <div key={ind.id} className={styles.indicatorItem}>
                    {ind.severity === 'nominal' ? (
                      <CheckCircle2 size={16} style={{ color: '#B7FF3C', flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: ind.severity === 'critical' ? '#FF6B4A' : '#FFC857', flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '12.5px', color: '#F4F7FB' }}>
                        {ind.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8FA3B8', marginTop: '2px' }}>
                        {ind.details}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* IMAGE-DERIVED GROWTH ESTIMATES STATION */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} className="text-primary" />
                <h3 className="text-md font-bold">IMAGE-DERIVED GROWTH ESTIMATES</h3>
              </div>
              <span className={`badge badge-${growthMetrics.growthState === 'expanding' ? 'success' : growthMetrics.growthState === 'contracting' ? 'warning' : 'info'}`}>
                {growthMetrics.growthState.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Cumulative Expansion</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: growthMetrics.cumulativeGrowthDelta >= 0 ? '#B7FF3C' : '#FFC857', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {growthMetrics.cumulativeGrowthDelta >= 0 ? `+${growthMetrics.cumulativeGrowthDelta}%` : `${growthMetrics.cumulativeGrowthDelta}%`}
                </div>
                <span style={{ fontSize: '10.5px', color: '#8FA3B8' }}>
                  From {growthMetrics.initialCanopyCoverage}% Baseline
                </span>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Expansion Velocity</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {growthMetrics.dailyGrowthVelocity >= 0 ? `+${growthMetrics.dailyGrowthVelocity}` : growthMetrics.dailyGrowthVelocity} <span style={{ fontSize: '11px', fontWeight: 400 }}>%/day</span>
                </div>
                <span style={{ fontSize: '10.5px', color: '#8FA3B8' }}>
                  2D Optical Spread Rate
                </span>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Monitoring Span</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F4F7FB', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {growthMetrics.daysMonitored} <span style={{ fontSize: '11px', fontWeight: 400 }}>Days</span>
                </div>
                <span style={{ fontSize: '10.5px', color: '#8FA3B8' }}>
                  {observations.length} Snapshots Logged
                </span>
              </div>
            </div>

            <div className={styles.limitationsBox}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00E5FF', fontWeight: 700, marginBottom: '2px' }}>
                <Info size={13} /> Optical Growth Modeling Disclaimer
              </div>
              <div>{growthMetrics.disclaimer}</div>
            </div>
          </div>

          {/* PLANT MEMORY RETROSPECTIVE STATION */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <History size={18} className="text-primary" />
              <div>
                <h3 className="text-md font-bold">PLANT MEMORY</h3>
                <p className="text-xs text-secondary">
                  Retrospective intelligence answering longitudinal questions about plant development.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Question 1: How has the plant changed? */}
              <div className={styles.memoryCard}>
                <div className={styles.memoryQuestion}>
                  <Sparkles size={15} /> How has the plant changed?
                </div>
                <div className={styles.memoryAnswer}>
                  {memoryAnswers.howHasPlantChanged}
                </div>
              </div>

              {/* Question 2: Is the plant healthier? */}
              <div className={styles.memoryCard}>
                <div className={styles.memoryQuestion} style={{ color: '#B7FF3C' }}>
                  <HeartPulse size={15} /> Is the plant healthier than earlier?
                </div>
                <div className={styles.memoryAnswer} style={{ borderLeftColor: '#B7FF3C' }}>
                  {memoryAnswers.isPlantHealthier}
                </div>
              </div>

              {/* Question 3: What changed recently? */}
              <div className={styles.memoryCard}>
                <div className={styles.memoryQuestion} style={{ color: '#FFC857' }}>
                  <Clock size={15} /> What changed recently?
                </div>
                <div className={styles.memoryAnswer} style={{ borderLeftColor: '#FFC857' }}>
                  {memoryAnswers.whatChangedRecently}
                </div>
              </div>

            </div>
          </div>

          {/* Demo Intelligence Scenarios (Simulation Mode) */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Layers size={18} className="text-primary" />
              <h3 className="text-md font-bold">Simulation Scenarios</h3>
            </div>
            <p className="text-xs text-secondary mb-md">
              Test multimodal diagnostics and rule-based threshold evaluation without physical hardware.
            </p>

            <div className={styles.scenariosGrid}>
              {(Object.keys(DEMO_SCENARIOS) as DemoScenario[]).map((key) => {
                const scenario = DEMO_SCENARIOS[key];
                const isSelected = activeScenario === key;
                return (
                  <div
                    key={key}
                    className={`${styles.scenarioCard} ${isSelected ? styles.scenarioCardActive : ''}`}
                    onClick={() => setActiveScenario(key)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#00E5FF' : '#F4F7FB' }}>
                        {scenario.name}
                      </span>
                      <span className={`badge badge-${scenario.expectedHealthState === 'optimal' ? 'success' : scenario.expectedHealthState === 'warning' ? 'warning' : 'danger'}`}>
                        {scenario.expectedHealthState.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: '#8FA3B8', lineHeight: 1.4 }}>
                      {scenario.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: PLANT CONDITION Station & Epistemological Separation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* UNIFIED PLANT CONDITION STATION */}
          <div className="glass-card" style={{ padding: '24px', borderTop: `4px solid ${overallColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Unified Multimodal Assessment</span>
                <h3 className="text-xl font-bold text-primary" style={{ marginTop: '2px' }}>
                  PLANT CONDITION
                </h3>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div 
                  className={styles.healthScoreCircle} 
                  style={{ borderColor: overallColor, color: overallColor }}
                >
                  {multimodalAssessment.overallScore}
                </div>
                <span className="text-xs text-muted" style={{ fontSize: '10px', marginTop: '2px', display: 'block' }}>
                  OVERALL / 100
                </span>
              </div>
            </div>

            {/* 4-Item Status Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
              
              <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs text-muted">Visual Condition</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: visualStateColor, marginTop: '2px', textTransform: 'capitalize' }}>
                  {multimodalAssessment.visualState.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '10.5px', color: '#8FA3B8' }}>
                  Foliage & Canopy
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs text-muted">Environment</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: envStateColor, marginTop: '2px', textTransform: 'capitalize' }}>
                  {multimodalAssessment.environmentalState}
                </div>
                <div style={{ fontSize: '10.5px', color: '#8FA3B8' }}>
                  pH, TDS & Reservoir
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs text-muted">Active Anomalies</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: multimodalAssessment.anomalies.length > 0 ? '#FFC857' : '#B7FF3C', marginTop: '2px' }}>
                  {multimodalAssessment.anomalies.length > 0 ? multimodalAssessment.anomalies.length : 'None'}
                </div>
                <div style={{ fontSize: '10.5px', color: '#8FA3B8' }}>
                  Cross-Domain Flags
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs text-muted">Longitudinal Trend</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#00E5FF', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'capitalize' }}>
                  {multimodalAssessment.trend === 'improving' ? (
                    <><TrendingUp size={16} style={{ color: '#B7FF3C' }} /> Improving</>
                  ) : multimodalAssessment.trend === 'declining' ? (
                    <><TrendingDown size={16} style={{ color: '#FF6B4A' }} /> Declining</>
                  ) : multimodalAssessment.trend === 'stable' ? (
                    <><Minus size={16} style={{ color: '#00E5FF' }} /> Stable</>
                  ) : (
                    'Gathering...'
                  )}
                </div>
                <div style={{ fontSize: '10.5px', color: '#8FA3B8' }}>
                  Trajectory Tracking
                </div>
              </div>

            </div>

            {/* EPISTEMOLOGICAL SEPARATION SECTIONS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* 1. OBSERVATIONS (Raw Facts) */}
              <div className={styles.epistemicSection}>
                <div className={styles.epistemicHeader} style={{ color: '#00E5FF' }}>
                  <Search size={14} /> Observations (Sensory Facts)
                </div>
                <div className={styles.epistemicList}>
                  {multimodalAssessment.observations.map((obs, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#00E5FF' }}>•</span>
                      <span>{obs}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. INTERPRETATIONS (Cross-Domain Relationships) */}
              <div className={styles.epistemicSection}>
                <div className={styles.epistemicHeader} style={{ color: '#FFC857' }}>
                  <Compass size={14} /> Interpretations (Cross-Domain Relationships)
                </div>
                <div className={styles.epistemicList}>
                  {multimodalAssessment.interpretations.map((interp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#FFC857' }}>⚡</span>
                      <span>{interp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. EXPLANATIONS (Agronomic Physiological Reasoning) */}
              <div className={styles.epistemicSection}>
                <div className={styles.epistemicHeader} style={{ color: '#B7FF3C' }}>
                  <Sparkles size={14} /> Agronomic Explanations (Reasoning)
                </div>
                <div className={styles.epistemicList}>
                  {multimodalAssessment.explanations.map((exp, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ color: '#B7FF3C' }}>💡</span>
                      <span>{exp}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Synchronized Sensor Telemetry Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} className="text-accent" />
                <h3 className="text-md font-bold">Synchronized Telemetry</h3>
              </div>
              <span className="badge badge-info">{mode === 'real' ? 'HARDWARE' : 'SIMULATION'}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">pH Level</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {latestReading?.ph ? latestReading.ph.toFixed(2) : '--'}
                </div>
                <span style={{ fontSize: '10.5px', color: environmentalAssessment.phStatus === 'optimal' ? '#B7FF3C' : '#FFC857' }}>
                  Target: {cropIdentity.targetProfile.phMin} - {cropIdentity.targetProfile.phMax}
                </span>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Nutrients (TDS)</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#B7FF3C', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {latestReading?.tds ? Math.round(latestReading.tds) : '--'} <span style={{ fontSize: '11px', fontWeight: 400 }}>PPM</span>
                </div>
                <span style={{ fontSize: '10.5px', color: environmentalAssessment.tdsStatus === 'optimal' ? '#B7FF3C' : '#FFC857' }}>
                  Target: {cropIdentity.targetProfile.tdsMin} - {cropIdentity.targetProfile.tdsMax}
                </span>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Water Level</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {latestReading?.waterLevel ? `${Math.round(latestReading.waterLevel)}%` : '--'}
                </div>
                <span style={{ fontSize: '10.5px', color: environmentalAssessment.waterLevelStatus === 'optimal' ? '#B7FF3C' : '#FF6B4A' }}>
                  Critical: &lt;18%
                </span>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Ultrasonic Distance</span>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#F4F7FB', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                  {latestReading?.distance ? `${latestReading.distance.toFixed(1)}` : '--'} <span style={{ fontSize: '11px', fontWeight: 400 }}>cm</span>
                </div>
                <span style={{ fontSize: '10.5px', color: '#8FA3B8' }}>
                  Full: 13cm · Empty: 60cm
                </span>
              </div>
            </div>
          </div>

          {/* Active Anomalies & Recommendations */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={18} style={{ color: activeAnomalies.length > 0 ? '#FFC857' : '#B7FF3C' }} />
              <h3 className="text-md font-bold">
                {activeAnomalies.length > 0 ? `Active Anomalies (${activeAnomalies.length})` : 'System Equilibrium'}
              </h3>
            </div>

            {activeAnomalies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                {activeAnomalies.map((anom) => (
                  <div 
                    key={anom.id}
                    style={{ 
                      padding: '12px', 
                      borderRadius: '6px', 
                      background: anom.severity === 'critical' ? 'rgba(255, 107, 74, 0.08)' : 'rgba(255, 200, 87, 0.08)',
                      border: `1px solid ${anom.severity === 'critical' ? 'rgba(255, 107, 74, 0.25)' : 'rgba(255, 200, 87, 0.25)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#F4F7FB' }}>{anom.title}</span>
                      <span className={`badge badge-${anom.severity === 'critical' ? 'danger' : 'warning'}`}>
                        {anom.severity.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#8FA3B8', lineHeight: 1.4 }}>
                      {anom.description}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '12px', background: 'rgba(183, 255, 60, 0.05)', border: '1px solid rgba(183, 255, 60, 0.2)', borderRadius: '6px', marginBottom: '18px', fontSize: '12px', color: '#B7FF3C' }}>
                ✓ No chemical or physical anomalies detected for {cropIdentity.commonName}.
              </div>
            )}

            <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-sm">Agronomic Recommendations</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeRecommendations.map((rec) => (
                <div key={rec.id} style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '12.5px', color: '#00E5FF' }}>{rec.title}</span>
                    <span className="badge badge-info">{rec.priority.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: '11.5px', color: '#F4F7FB', marginBottom: '4px' }}>{rec.action}</p>
                  <p style={{ fontSize: '10.5px', color: '#5A738E' }}><em>Reason:</em> {rec.reasoning}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 3. PLANT JOURNEY — Chronological Growth Timeline */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} className="text-primary" />
              <h3 className="text-lg font-bold">PLANT JOURNEY</h3>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: '2px' }}>
              Chronological visual memory tracking development from initial seedling transplant to harvest readiness.
            </p>
          </div>
          <span className="badge badge-info">{plantJourney.length} Milestones Tracked</span>
        </div>

        {plantJourney.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No journey milestones recorded yet. Capture camera snapshots above to begin building your plant&apos;s chronological visual journey.
          </div>
        ) : (
          <div className={styles.journeyTimeline}>
            {plantJourney.map((milestone) => (
              <div key={milestone.id} className={styles.journeyCard}>
                
                {/* Milestone Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#00E5FF' }}>
                    {milestone.dayLabel}
                  </span>
                  <span className="text-xs text-muted">{milestone.dateString}</span>
                </div>

                {/* Milestone Photo / Thumbnail */}
                {milestone.imageReference ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={milestone.imageReference} alt={milestone.dayLabel} className={styles.journeyThumbnail} />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    <Leaf size={28} style={{ color: '#5A738E' }} />
                    <span>Baseline Milestone Snapshot</span>
                  </div>
                )}

                {/* Health & Growth Delta Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="text-xs text-muted">Health: </span>
                    <strong style={{ color: milestone.healthScore > 80 ? '#B7FF3C' : '#FFC857', fontSize: '13px' }}>
                      {milestone.healthScore} / 100
                    </strong>
                  </div>
                  <span className={`badge badge-${milestone.canopyDeltaPercent !== undefined && milestone.canopyDeltaPercent >= 0 ? 'success' : 'info'}`}>
                    {milestone.canopyDeltaPercent !== undefined && milestone.canopyDeltaPercent >= 0 ? `+${milestone.canopyDeltaPercent}% Canopy` : `${milestone.canopyDeltaPercent}% Canopy`}
                  </span>
                </div>

                {/* Environmental Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'rgba(0,0,0,0.25)', padding: '8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div>
                    <span style={{ color: '#5A738E' }}>pH: </span>
                    <strong>{milestone.ph?.toFixed(2) ?? '--'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5A738E' }}>TDS: </span>
                    <strong>{milestone.tds ? Math.round(milestone.tds) : '--'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5A738E' }}>WL: </span>
                    <strong>{milestone.waterLevel ? `${Math.round(milestone.waterLevel)}%` : '--'}</strong>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
