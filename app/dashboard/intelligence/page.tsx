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
  History,
  LineChart,
  ShieldAlert,
  HelpCircle,
  Send,
  Code2
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
    predictiveAnalytics,
    statisticalAnomalies,
    structuredPlantContext,
    aiMessages,
    isAILoading,
    askPlant,
    clearChat,
    activeAnomalies,
    activeRecommendations,
    activeScenario,
    setActiveScenario,
    captureAndObserve,
    clearHistory
  } = usePlantIntelligence();

  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);
  const [appliedFeedback, setAppliedFeedback] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState<string>('');
  const [showContextJson, setShowContextJson] = useState<boolean>(false);

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

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isAILoading) return;
    const query = chatInput;
    setChatInput('');
    askPlant(query);
  };

  const handlePromptChipClick = (chipPrompt: string) => {
    if (isAILoading) return;
    askPlant(chipPrompt);
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
            <span className="badge badge-success" style={{ fontSize: '10px' }}>Phase 8 Context-Aware AI Plant</span>
          </div>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            Real-time computer vision, ESP32 telemetry, time-series forecasting, and context-grounded AI plant companion.
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
              <div className={styles.memoryCard}>
                <div className={styles.memoryQuestion}>
                  <Sparkles size={15} /> How has the plant changed?
                </div>
                <div className={styles.memoryAnswer}>
                  {memoryAnswers.howHasPlantChanged}
                </div>
              </div>

              <div className={styles.memoryCard}>
                <div className={styles.memoryQuestion} style={{ color: '#B7FF3C' }}>
                  <HeartPulse size={15} /> Is the plant healthier than earlier?
                </div>
                <div className={styles.memoryAnswer} style={{ borderLeftColor: '#B7FF3C' }}>
                  {memoryAnswers.isPlantHealthier}
                </div>
              </div>

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

        {/* Right Column: PLANT CONDITION Station & Context-Aware AI Companion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* PHASE 8: CONTEXT-AWARE AI PLANT COMPANION TERMINAL */}
          <div className={styles.aiTerminalCard}>
            <div className={styles.aiHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div className={styles.aiAvatar}>
                  <Leaf size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="text-lg font-bold text-primary">AI Plant Companion</h3>
                    <span className={`badge badge-${multimodalAssessment.overallHealthState === 'optimal' ? 'success' : multimodalAssessment.overallHealthState === 'warning' ? 'warning' : 'danger'}`}>
                      {multimodalAssessment.overallHealthState === 'optimal' ? '● VIBRANT' : multimodalAssessment.overallHealthState === 'warning' ? '● MILD STRESS' : '● ATTENTION NEEDED'}
                    </span>
                  </div>
                  <p className="text-xs text-secondary">
                    Monitored {cropIdentity.commonName} · Grounded in live sensors & vision
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={() => setShowContextJson(!showContextJson)}
                  title="Inspect the exact JSON context grounding the AI"
                >
                  <Code2 size={13} /> {showContextJson ? 'Hide Context' : 'Inspect Context'}
                </button>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '4px 8px' }}
                  onClick={clearChat}
                  title="Reset chat conversation"
                >
                  Reset
                </button>
              </div>
            </div>

            {/* Context JSON Inspector */}
            {showContextJson && (
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-xs" style={{ display: 'block' }}>
                  Structured Plant Context (Ground Truth Payload)
                </span>
                <pre className={styles.contextJsonBox}>
                  {JSON.stringify(structuredPlantContext, null, 2)}
                </pre>
              </div>
            )}

            {/* Quick Suggestion Prompt Chips */}
            <div>
              <span className="text-xs text-muted mb-xs" style={{ display: 'block' }}>
                Suggested Inquiries (Click to Ask):
              </span>
              <div className={styles.promptChipsRow}>
                <button 
                  className={styles.promptChip}
                  onClick={() => handlePromptChipClick("How are you feeling today?")}
                >
                  🌿 How are you feeling today?
                </button>
                <button 
                  className={styles.promptChip}
                  onClick={() => handlePromptChipClick("Is my nutrient solution sufficient?")}
                >
                  🧪 Is my nutrient solution sufficient?
                </button>
                <button 
                  className={styles.promptChip}
                  onClick={() => handlePromptChipClick("Do you have enough water?")}
                >
                  💧 Do you have enough water?
                </button>
                <button 
                  className={styles.promptChip}
                  onClick={() => handlePromptChipClick("What changes should I watch out for?")}
                >
                  📈 What should I watch out for?
                </button>
                <button 
                  className={styles.promptChip}
                  onClick={() => handlePromptChipClick("How has your growth progressed?")}
                >
                  🌱 How has your growth progressed?
                </button>
              </div>
            </div>

            {/* Message Thread */}
            <div className={styles.chatMessagesThread}>
              {aiMessages.map((msg) => (
                <div 
                  key={msg.id}
                  className={msg.sender === 'user' ? styles.chatBubbleUser : styles.chatBubblePlant}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: msg.sender === 'user' ? '#00E5FF' : '#B7FF3C' }}>
                      {msg.sender === 'user' ? 'You' : `${cropIdentity.commonName} (AI Plant)`}
                    </span>
                    <span style={{ fontSize: '10px', color: '#5A738E' }}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>{msg.text}</div>

                  {/* Epistemic Badges */}
                  {msg.epistemicBadges && msg.epistemicBadges.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {msg.epistemicBadges.map((badge, idx) => (
                        <span 
                          key={idx}
                          className={`${styles.epistemicBadge} ${
                            badge === 'measured_fact'
                              ? styles.badgeMeasuredFact
                              : badge === 'visual_observation'
                                ? styles.badgeVisualObservation
                                : badge === 'mathematical_projection'
                                  ? styles.badgeProjection
                                  : styles.badgeAdvisory
                          }`}
                        >
                          {badge === 'measured_fact' && '✓ Measured Fact'}
                          {badge === 'visual_observation' && '👁 Visual Observation'}
                          {badge === 'mathematical_projection' && '📈 Time-Series Projection'}
                          {badge === 'grower_advisory' && '💡 Grower Advisory'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isAILoading && (
                <div className={styles.chatBubblePlant} style={{ fontStyle: 'italic', color: '#8FA3B8' }}>
                  Analyzing live telemetry & visual context...
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className={styles.chatInputBar}>
              <input
                type="text"
                className={styles.chatInputField}
                placeholder={`Ask ${cropIdentity.commonName} anything about its health, nutrients, or growth...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAILoading}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={!chatInput.trim() || isAILoading}
              >
                <Send size={15} /> Send
              </button>
            </form>
          </div>

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
                <div style={{ fontSize: '15px', fontWeight: 800, color: (multimodalAssessment.anomalies.length > 0 || statisticalAnomalies.some(a => a.isAnomaly)) ? '#FFC857' : '#B7FF3C', marginTop: '2px' }}>
                  {multimodalAssessment.anomalies.length + statisticalAnomalies.filter(a => a.isAnomaly).length > 0
                    ? multimodalAssessment.anomalies.length + statisticalAnomalies.filter(a => a.isAnomaly).length
                    : 'None'}
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

          {/* Environmental Rule-Based Anomalies Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={18} style={{ color: activeAnomalies.length > 0 ? '#FFC857' : '#B7FF3C' }} />
              <h3 className="text-md font-bold">
                {activeAnomalies.length > 0 ? `Environmental Anomalies (${activeAnomalies.length})` : 'System Equilibrium'}
              </h3>
            </div>

            {activeAnomalies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
              <div style={{ padding: '12px', background: 'rgba(183, 255, 60, 0.05)', border: '1px solid rgba(183, 255, 60, 0.2)', borderRadius: '6px', fontSize: '12px', color: '#B7FF3C' }}>
                ✓ No chemical or physical threshold violations detected for {cropIdentity.commonName}.
              </div>
            )}
          </div>

        </div>

      </div>

      {/* 3. PREDICTIONS SECTION */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <LineChart size={20} className="text-primary" />
              <h3 className="text-lg font-bold">PREDICTIONS & DRIFT FORECASTING</h3>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: '2px' }}>
              Mathematical rate-of-change regressions forecasting estimated time until crop target threshold crossing.
            </p>
          </div>
          <span className="badge badge-info">Time-Series Linear Regression</span>
        </div>

        <div className={styles.predictionsGrid}>
          {/* pH Prediction */}
          <div className={styles.predictionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#00E5FF' }}>pH Chemical Balance</span>
              <span className={`badge badge-${predictiveAnalytics.predictions.ph.trendDirection === 'rising' ? 'warning' : predictiveAnalytics.predictions.ph.trendDirection === 'falling' ? 'info' : 'success'}`}>
                {predictiveAnalytics.predictions.ph.trendDirection.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span className="text-xs text-muted">Current: </span>
                <strong style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', color: '#F4F7FB' }}>
                  {predictiveAnalytics.predictions.ph.currentValue.toFixed(2)}
                </strong>
              </div>
              <div>
                <span className="text-xs text-muted">Trend: </span>
                <strong style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: predictiveAnalytics.predictions.ph.driftPerDay >= 0 ? '#00E5FF' : '#FFC857' }}>
                  {predictiveAnalytics.predictions.ph.driftPerDay >= 0 ? `+${predictiveAnalytics.predictions.ph.driftPerDay}` : predictiveAnalytics.predictions.ph.driftPerDay} pH/day
                </strong>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: '#F4F7FB', lineHeight: 1.45 }}>
              <div style={{ color: '#8FA3B8', fontSize: '10.5px', marginBottom: '2px' }}>Estimated Threshold Crossing:</div>
              <strong style={{ color: predictiveAnalytics.predictions.ph.estimatedDaysToThreshold !== null ? '#FFC857' : '#B7FF3C' }}>
                {predictiveAnalytics.predictions.ph.estimatedDaysToThreshold !== null
                  ? `~${predictiveAnalytics.predictions.ph.estimatedDaysToThreshold} Days`
                  : 'Stable Equilibrium (>7 Days)'}
              </strong>
              <div style={{ marginTop: '4px', fontSize: '11px', color: '#8FA3B8' }}>
                {predictiveAnalytics.predictions.ph.forecastSummary}
              </div>
            </div>
          </div>

          {/* TDS Prediction */}
          <div className={styles.predictionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#B7FF3C' }}>TDS Nutrient Salinity</span>
              <span className={`badge badge-${predictiveAnalytics.predictions.tds.trendDirection === 'falling' ? 'warning' : predictiveAnalytics.predictions.tds.trendDirection === 'rising' ? 'warning' : 'success'}`}>
                {predictiveAnalytics.predictions.tds.trendDirection.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span className="text-xs text-muted">Current: </span>
                <strong style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', color: '#F4F7FB' }}>
                  {predictiveAnalytics.predictions.tds.currentValue} PPM
                </strong>
              </div>
              <div>
                <span className="text-xs text-muted">Trend: </span>
                <strong style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: predictiveAnalytics.predictions.tds.driftPerDay >= 0 ? '#00E5FF' : '#FFC857' }}>
                  {predictiveAnalytics.predictions.tds.driftPerDay >= 0 ? `+${predictiveAnalytics.predictions.tds.driftPerDay}` : predictiveAnalytics.predictions.tds.driftPerDay} PPM/day
                </strong>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: '#F4F7FB', lineHeight: 1.45 }}>
              <div style={{ color: '#8FA3B8', fontSize: '10.5px', marginBottom: '2px' }}>Estimated Threshold Crossing:</div>
              <strong style={{ color: predictiveAnalytics.predictions.tds.estimatedDaysToThreshold !== null ? '#FFC857' : '#B7FF3C' }}>
                {predictiveAnalytics.predictions.tds.estimatedDaysToThreshold !== null
                  ? `~${predictiveAnalytics.predictions.tds.estimatedDaysToThreshold} Days`
                  : 'Stable Absorption (>7 Days)'}
              </strong>
              <div style={{ marginTop: '4px', fontSize: '11px', color: '#8FA3B8' }}>
                {predictiveAnalytics.predictions.tds.forecastSummary}
              </div>
            </div>
          </div>

          {/* Water Level Prediction */}
          <div className={styles.predictionCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#00E5FF' }}>Reservoir Capacity</span>
              <span className={`badge badge-${predictiveAnalytics.predictions.waterLevel.trendDirection === 'falling' ? 'warning' : 'success'}`}>
                {predictiveAnalytics.predictions.waterLevel.trendDirection.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span className="text-xs text-muted">Current: </span>
                <strong style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', color: '#F4F7FB' }}>
                  {predictiveAnalytics.predictions.waterLevel.currentValue}%
                </strong>
              </div>
              <div>
                <span className="text-xs text-muted">Trend: </span>
                <strong style={{ fontSize: '13px', fontFamily: 'var(--font-mono)', color: predictiveAnalytics.predictions.waterLevel.driftPerDay >= 0 ? '#00E5FF' : '#FFC857' }}>
                  {predictiveAnalytics.predictions.waterLevel.driftPerDay >= 0 ? `+${predictiveAnalytics.predictions.waterLevel.driftPerDay}` : predictiveAnalytics.predictions.waterLevel.driftPerDay}%/day
                </strong>
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px', color: '#F4F7FB', lineHeight: 1.45 }}>
              <div style={{ color: '#8FA3B8', fontSize: '10.5px', marginBottom: '2px' }}>Estimated Critical Level (&lt;18%):</div>
              <strong style={{ color: predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold !== null ? '#FF6B4A' : '#B7FF3C' }}>
                {predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold !== null
                  ? `~${predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold} Days`
                  : 'Sufficient Volume (>7 Days)'}
              </strong>
              <div style={{ marginTop: '4px', fontSize: '11px', color: '#8FA3B8' }}>
                {predictiveAnalytics.predictions.waterLevel.forecastSummary}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.limitationsBox} style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#00E5FF', fontWeight: 700, marginBottom: '2px' }}>
            <Info size={13} /> Mathematical Forecasting Notice
          </div>
          <div>{predictiveAnalytics.disclaimer}</div>
        </div>
      </div>

      {/* 4. STATISTICAL ANOMALIES SECTION */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} className="text-accent" />
              <h3 className="text-lg font-bold">STATISTICAL ANOMALY DETECTION</h3>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: '2px' }}>
              Continuous Z-score (&mu;, &sigma;) outlier detection evaluating whether sensor drift exceeds normal biological variation.
            </p>
          </div>
          <span className="badge badge-info">Z-Score Outlier Filter (|Z| &ge; 2.0&sigma;)</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {statisticalAnomalies.map((stat) => (
            <div 
              key={stat.id} 
              className={styles.statAnomalyCard}
              style={{
                borderColor: stat.isAnomaly
                  ? stat.severity === 'critical' ? 'rgba(255, 107, 74, 0.4)' : 'rgba(255, 200, 87, 0.4)'
                  : 'rgba(255, 255, 255, 0.06)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#F4F7FB' }}>
                  {stat.label}
                </span>
                <span className={`badge badge-${stat.severity === 'critical' ? 'danger' : stat.severity === 'warning' ? 'warning' : 'success'}`}>
                  {stat.isAnomaly ? `${stat.severity.toUpperCase()} OUTLIER` : 'NOMINAL (Z < 2.0)'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'rgba(0,0,0,0.25)', padding: '8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                <div>
                  <span style={{ color: '#5A738E' }}>Mean (&mu;):</span><br />
                  <strong>{stat.rollingMean}</strong>
                </div>
                <div>
                  <span style={{ color: '#5A738E' }}>StdDev (&sigma;):</span><br />
                  <strong>{stat.standardDeviation}</strong>
                </div>
                <div>
                  <span style={{ color: '#5A738E' }}>Z-Score:</span><br />
                  <strong style={{ color: Math.abs(stat.zScore) >= 2.0 ? '#FFC857' : '#B7FF3C' }}>
                    {stat.zScore > 0 ? `+${stat.zScore}` : stat.zScore}&sigma;
                  </strong>
                </div>
              </div>

              <p style={{ fontSize: '11.5px', color: '#8FA3B8', lineHeight: 1.4 }}>
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. RECOMMENDATIONS SECTION (ADVISORY ONLY) */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} className="text-primary" />
              <h3 className="text-lg font-bold">GROWER RECOMMENDATIONS</h3>
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: '2px' }}>
              Structured, prioritized agronomic action steps based on predictive threshold crossings and sensor trends.
            </p>
          </div>
          <span className="badge badge-info">{activeRecommendations.length} Action Items</span>
        </div>

        {/* Advisory Only Banner */}
        <div className={styles.advisoryBanner} style={{ marginBottom: '16px' }}>
          <HelpCircle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>ADVISORY GUIDANCE ONLY — MANUAL GROWER ACTION REQUIRED:</strong> This hydroponic installation does not operate automatic dosing pumps or mechanical actuators. All recommendations represent diagnostic advice for human grower implementation.
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {activeRecommendations.map((rec) => (
            <div 
              key={rec.id} 
              style={{
                background: 'rgba(7, 17, 31, 0.6)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '6px',
                padding: '14px 16px',
                borderLeft: `4px solid ${rec.priority === 'immediate' ? '#FF6B4A' : rec.priority === 'high' ? '#FFC857' : '#00E5FF'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '13.5px', color: '#F4F7FB' }}>{rec.title}</span>
                <span className={`badge badge-${rec.priority === 'immediate' ? 'danger' : rec.priority === 'high' ? 'warning' : 'info'}`}>
                  {rec.priority.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#00E5FF', fontWeight: 600, marginBottom: '4px' }}>
                👉 Action: {rec.action}
              </div>
              <div style={{ fontSize: '11.5px', color: '#8FA3B8', lineHeight: 1.4 }}>
                <em>Agronomic Reasoning:</em> {rec.reasoning}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. PLANT JOURNEY — Chronological Growth Timeline */}
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
