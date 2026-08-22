'use client';

import { useState } from 'react';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { DEMO_SCENARIOS } from '@/lib/intelligence/demoScenarios';
import { DemoScenario } from '@/lib/intelligence/types';
import {
  Camera,
  CameraOff,
  Scan,
  Leaf,
  Send,
  Sparkles,
  LineChart,
  Compass,
  Trophy
} from 'lucide-react';
import styles from './page.module.css';

export default function ExpoShowcasePage() {
  const { mode, isStale, latestReading } = useESP32Serial();
  const {
    status: cameraStatus,
    videoRef,
    startCamera,
    stopCamera
  } = useCamera();

  const {
    cropIdentity,
    latestDetection,
    latestVisualHealth,
    multimodalAssessment,
    growthMetrics,
    predictiveAnalytics,
    activeRecommendations,
    activeScenario,
    setActiveScenario,
    aiMessages,
    isAILoading,
    askPlant
  } = usePlantIntelligence();

  const [chatInput, setChatInput] = useState<string>('');

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

  const overallColor = {
    optimal: '#B7FF3C',
    warning: '#FFC857',
    critical: '#FF6B4A',
  }[multimodalAssessment.overallHealthState];

  return (
    <div className={styles.expoLayout}>
      
      {/* 1. Expo Showcase Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="text-3xl font-bold text-primary">🏆 HydroSmart Expo Showcase</h1>
            <span className="badge badge-success" style={{ fontSize: '10px' }}>Exhibition Mode v1.2</span>
          </div>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            Live multimodal hydroponics exhibition console — unifying hardware telemetry, computer vision, time-series forecasting, and context-grounded AI.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className={`badge badge-${mode === 'real' && !isStale ? 'success' : 'warning'}`} style={{ padding: '6px 12px', fontSize: '11px' }}>
            {mode === 'real' && !isStale ? '● LIVE ESP32 HARDWARE' : '● DEMO MODE (SIMULATED SCENARIO)'}
          </span>
        </div>
      </div>

      {/* 2. Core Conceptual Pipeline Stepper */}
      <div className={styles.pipelineStepper}>
        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <div className={`${styles.stepNumber} ${styles.stepNumberActive}`}>1</div>
          <span>Observe</span>
        </div>
        <span className={styles.stepDivider}>→</span>
        
        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <div className={`${styles.stepNumber} ${styles.stepNumberActive}`}>2</div>
          <span>Analyze</span>
        </div>
        <span className={styles.stepDivider}>→</span>

        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <div className={`${styles.stepNumber} ${styles.stepNumberActive}`}>3</div>
          <span>Understand</span>
        </div>
        <span className={styles.stepDivider}>→</span>

        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <div className={`${styles.stepNumber} ${styles.stepNumberActive}`}>4</div>
          <span>Predict</span>
        </div>
        <span className={styles.stepDivider}>→</span>

        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <div className={`${styles.stepNumber} ${styles.stepNumberActive}`}>5</div>
          <span>Recommend</span>
        </div>
        <span className={styles.stepDivider}>→</span>

        <div className={`${styles.stepItem} ${styles.stepItemActive}`}>
          <div className={`${styles.stepNumber} ${styles.stepNumberActive}`}>6</div>
          <span>Interact</span>
        </div>
      </div>

      {/* 3. Controlled Demo Scenarios Selector */}
      <div className={styles.scenariosBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} style={{ color: '#00E5FF' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#F4F7FB' }}>EXHIBITION DEMO SCENARIOS</div>
            <div style={{ fontSize: '11px', color: '#8FA3B8' }}>Select preset to demonstrate cross-domain intelligence</div>
          </div>
        </div>

        <div className={styles.scenarioButtons}>
          {(Object.keys(DEMO_SCENARIOS) as DemoScenario[]).map((key) => {
            const sc = DEMO_SCENARIOS[key];
            const isSelected = activeScenario === key;
            return (
              <button
                key={key}
                className={`${styles.scenarioBtn} ${isSelected ? styles.scenarioBtnActive : ''}`}
                onClick={() => setActiveScenario(key)}
              >
                <span>{sc.name}</span>
                <span className={`badge badge-${sc.expectedHealthState === 'optimal' ? 'success' : sc.expectedHealthState === 'warning' ? 'warning' : 'danger'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                  {sc.expectedHealthState.toUpperCase()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. The 6-Stage Core Showcase Grid */}
      <div className={styles.showcaseGrid}>
        
        {/* Left Column: STAGE 1 (OBSERVE) & STAGE 2 (ANALYZE) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STAGE 1: OBSERVE (Live Camera + Telemetry) */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className={styles.stageHeader}>
              <div className={styles.stageTitle}>
                <Camera size={18} /> STAGE 1: OBSERVE (Sensory Acquisition)
              </div>
              <span className="badge badge-info">Dual-Stream Input</span>
            </div>

            {/* Video Viewport */}
            <div className={styles.videoViewport}>
              <video 
                ref={videoRef} 
                className={styles.videoElement} 
                autoPlay 
                playsInline 
                muted 
                style={{ display: cameraStatus === 'connected' ? 'block' : 'none' }}
              />

              {cameraStatus === 'connected' ? (
                <>
                  <div className={styles.boundingBoxOverlay} style={{ inset: '15%' }}>
                    <span className={styles.boundingBoxTag}>
                      {cropIdentity.commonName} · {latestDetection?.confidence ?? 94}%
                    </span>
                  </div>
                  <button 
                    className="btn btn-ghost" 
                    style={{ position: 'absolute', bottom: '10px', right: '10px', fontSize: '10.5px', padding: '4px 8px', zIndex: 10 }}
                    onClick={stopCamera}
                  >
                    <CameraOff size={13} /> Stop
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: '#8FA3B8' }}>
                  <CameraOff size={32} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4F7FB' }}>Webcam Sensor Standby</div>
                  <button className="btn btn-primary" style={{ marginTop: '10px' }} onClick={() => startCamera()}>
                    Start Live Camera
                  </button>
                </div>
              )}
            </div>

            {/* Synchronized Telemetry Chips */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '14px' }}>
              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">pH Level</span>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.ph ? latestReading.ph.toFixed(2) : '6.10'}
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">TDS Nutrients</span>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#B7FF3C', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.tds ? Math.round(latestReading.tds) : '980'} <span style={{ fontSize: '9px', fontWeight: 400 }}>PPM</span>
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Water Level</span>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.waterLevel ? `${Math.round(latestReading.waterLevel)}%` : '82%'}
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="text-xs text-muted">Distance</span>
                <div style={{ fontSize: '17px', fontWeight: 800, color: '#F4F7FB', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.distance ? `${latestReading.distance.toFixed(1)}` : '21.5'} <span style={{ fontSize: '9px', fontWeight: 400 }}>cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 2: ANALYZE (Species Identification & Visual Stress) */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className={styles.stageHeader}>
              <div className={styles.stageTitle}>
                <Scan size={18} /> STAGE 2: ANALYZE (Botanical & Optical)
              </div>
              <span className="badge badge-success">4-Factor Model</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '14px' }}>
              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs text-muted">Species Identification</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#F4F7FB', marginTop: '2px' }}>
                  {cropIdentity.commonName}
                </div>
                <div style={{ fontSize: '11px', color: '#00E5FF', fontStyle: 'italic' }}>
                  {cropIdentity.scientificName ?? 'Lactuca sativa'} ({cropIdentity.confidence ?? 94}%)
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="text-xs text-muted">Visual Health Score</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#B7FF3C', marginTop: '2px' }}>
                  {latestVisualHealth?.visualHealthScore ?? 92}/100
                </div>
                <div style={{ fontSize: '11px', color: '#8FA3B8' }}>
                  Chlorophyll: ExG +{latestDetection?.vegetationIndex ?? 0.38}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11.5px', color: '#8FA3B8', lineHeight: 1.45, background: 'rgba(0,0,0,0.25)', padding: '10px 12px', borderRadius: '6px' }}>
              <strong>Image-Derived Growth:</strong> {growthMetrics.cumulativeGrowthDelta >= 0 ? `+${growthMetrics.cumulativeGrowthDelta}%` : `${growthMetrics.cumulativeGrowthDelta}%`} 2D canopy expansion over {growthMetrics.daysMonitored} days of monitoring.
            </div>
          </div>

          {/* STAGE 3: UNDERSTAND (Multimodal Relational Fusion) */}
          <div className="glass-card" style={{ padding: '24px', borderLeft: `4px solid ${overallColor}` }}>
            <div className={styles.stageHeader}>
              <div className={styles.stageTitle} style={{ color: overallColor }}>
                <Compass size={18} /> STAGE 3: UNDERSTAND (Relational Fusion)
              </div>
              <div className={styles.healthScoreCircle} style={{ borderColor: overallColor, color: overallColor }}>
                {multimodalAssessment.overallScore}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px' }}>
                <span style={{ color: '#00E5FF', fontWeight: 700 }}>🔍 Observation: </span>
                <span>{multimodalAssessment.observations[0] ?? 'Sensor readings and visual canopy within nominal limits.'}</span>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px' }}>
                <span style={{ color: '#FFC857', fontWeight: 700 }}>⚡ Interpretation: </span>
                <span>{multimodalAssessment.interpretations[0] ?? 'Cross-domain physiological equilibrium verified.'}</span>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '10px 12px', borderRadius: '6px', fontSize: '11.5px' }}>
                <span style={{ color: '#B7FF3C', fontWeight: 700 }}>💡 Explanation: </span>
                <span>{multimodalAssessment.explanations[0] ?? 'Target envelope parameters support optimal nutrient assimilation without disease claims.'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: STAGE 4 (PREDICT), STAGE 5 (RECOMMEND), STAGE 6 (INTERACT) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* STAGE 4: PREDICT (Time-Series Rate of Change) */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className={styles.stageHeader}>
              <div className={styles.stageTitle}>
                <LineChart size={18} /> STAGE 4: PREDICT (Time-Series Regressions)
              </div>
              <span className="badge badge-info">Drift Velocity</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px' }}>
                <span className="text-xs text-muted">pH Drift</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                  {predictiveAnalytics.predictions.ph.driftPerDay >= 0 ? `+${predictiveAnalytics.predictions.ph.driftPerDay}` : predictiveAnalytics.predictions.ph.driftPerDay} <span style={{ fontSize: '9px' }}>/day</span>
                </div>
                <div style={{ fontSize: '10px', color: '#8FA3B8' }}>
                  {predictiveAnalytics.predictions.ph.estimatedDaysToThreshold !== null ? `~${predictiveAnalytics.predictions.ph.estimatedDaysToThreshold}d threshold` : 'Stable (>7d)'}
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px' }}>
                <span className="text-xs text-muted">TDS Drift</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#B7FF3C', fontFamily: 'var(--font-mono)' }}>
                  {predictiveAnalytics.predictions.tds.driftPerDay >= 0 ? `+${predictiveAnalytics.predictions.tds.driftPerDay}` : predictiveAnalytics.predictions.tds.driftPerDay} <span style={{ fontSize: '9px' }}>/day</span>
                </div>
                <div style={{ fontSize: '10px', color: '#8FA3B8' }}>
                  {predictiveAnalytics.predictions.tds.estimatedDaysToThreshold !== null ? `~${predictiveAnalytics.predictions.tds.estimatedDaysToThreshold}d threshold` : 'Stable (>7d)'}
                </div>
              </div>

              <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '10px', borderRadius: '6px' }}>
                <span className="text-xs text-muted">Water Uptake</span>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                  {predictiveAnalytics.predictions.waterLevel.driftPerDay >= 0 ? `+${predictiveAnalytics.predictions.waterLevel.driftPerDay}` : predictiveAnalytics.predictions.waterLevel.driftPerDay} <span style={{ fontSize: '9px' }}>/day</span>
                </div>
                <div style={{ fontSize: '10px', color: '#8FA3B8' }}>
                  {predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold !== null ? `~${predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold}d threshold` : 'Safe Buffer'}
                </div>
              </div>
            </div>
          </div>

          {/* STAGE 5: RECOMMEND (Advisory Actions) */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div className={styles.stageHeader}>
              <div className={styles.stageTitle}>
                <Sparkles size={18} /> STAGE 5: RECOMMEND (Grower Action Advisory)
              </div>
              <span className="badge badge-warning" style={{ fontSize: '9px' }}>ADVISORY ONLY</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activeRecommendations.slice(0, 2).map((rec) => (
                <div key={rec.id} style={{ background: 'rgba(7, 17, 31, 0.6)', padding: '10px 14px', borderRadius: '6px', borderLeft: `3px solid ${rec.priority === 'immediate' ? '#FF6B4A' : '#00E5FF'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '12.5px', color: '#F4F7FB' }}>{rec.title}</strong>
                    <span className="badge badge-info" style={{ fontSize: '9px' }}>{rec.priority.toUpperCase()}</span>
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#00E5FF', marginTop: '2px' }}>
                    👉 {rec.action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* STAGE 6: INTERACT (Talk to Plant Companion) */}
          <div className="glass-card" style={{ padding: '24px', borderTop: '3px solid #00E5FF' }}>
            <div className={styles.stageHeader}>
              <div className={styles.stageTitle}>
                <Leaf size={18} /> STAGE 6: INTERACT (Grounded AI Companion)
              </div>
              <span className="badge badge-success">Grounded Plant Persona</span>
            </div>

            {/* Quick Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
              <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handlePromptChipClick("How are you?")}>
                🌿 How are you?
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handlePromptChipClick("Do you need water?")}>
                💧 Do you need water?
              </button>
              <button className="btn btn-ghost" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handlePromptChipClick("What changed today?")}>
                ⚡ What changed today?
              </button>
            </div>

            {/* Latest AI Message Bubble */}
            <div style={{ background: 'rgba(13, 27, 42, 0.9)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #B7FF3C', fontSize: '12px', lineHeight: 1.5, color: '#F4F7FB', marginBottom: '12px', minHeight: '60px' }}>
              {aiMessages.length > 0 ? aiMessages[aiMessages.length - 1].text : 'Hello! Ask me about my health, water level, or nutrients!'}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="input"
                style={{ flex: 1, fontSize: '12px', padding: '8px 12px' }}
                placeholder={`Ask ${cropIdentity.commonName}...`}
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAILoading}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 14px' }} disabled={!chatInput.trim() || isAILoading}>
                <Send size={13} />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
