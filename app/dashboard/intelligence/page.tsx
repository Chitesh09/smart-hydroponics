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
  Sparkles,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Download,
  Trash2,
  Layers
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
    environmentalAssessment,
    healthReport,
    activeAnomalies,
    activeRecommendations,
    activeScenario,
    setActiveScenario,
    captureAndObserve,
    clearHistory
  } = usePlantIntelligence();

  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);

  const handleCapture = () => {
    const obs = captureAndObserve();
    if (obs) {
      setCaptureFeedback(`Observation recorded at ${new Date(obs.timestamp).toLocaleTimeString()}`);
      setTimeout(() => setCaptureFeedback(null), 4000);
    }
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

  // Status colors based on calculated score
  const healthColor = {
    optimal: '#B7FF3C',
    warning: '#FFC857',
    critical: '#FF6B4A',
  }[healthReport.healthState];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* 1. Header & Multimodal Status Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="text-3xl font-bold text-primary">Plant Intelligence Hub</h1>
            <span className="badge badge-info" style={{ fontSize: '10px' }}>Phase 1 Foundation</span>
          </div>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            Multimodal sensor fusion, laptop webcam monitoring, and rule-based agronomic diagnostics.
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
      <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', borderLeft: `4px solid ${healthColor}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
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
              <div className="text-xs text-muted">Webcam Stream</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4F7FB' }}>
                {cameraStatus === 'connected' ? 'Connected (Live)' : cameraStatus === 'requesting' ? 'Requesting...' : cameraStatus === 'error' ? 'Permission Denied' : 'Standby / Idle'}
              </div>
            </div>
          </div>

          {/* AI Foundation Note */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={17} style={{ color: '#00E5FF' }} />
            <div>
              <div className="text-xs text-muted">AI & Vision Pipeline</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#00E5FF' }}>
                Ready for ML Integration
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="text-xs text-secondary font-mono">
            Crop: <strong style={{ color: '#F4F7FB' }}>{cropIdentity.commonName}</strong>
          </span>
        </div>
      </div>

      {/* 2. Main Intelligence Grid */}
      <div className={styles.intelligenceLayout}>
        
        {/* Left Column: Webcam Monitor & Demo Scenarios */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Webcam Vision Monitor Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} className="text-primary" />
                <h3 className="text-md font-bold">Webcam Plant Monitor</h3>
              </div>
              <span className={`badge badge-${cameraStatus === 'connected' ? 'success' : cameraStatus === 'error' ? 'danger' : 'info'}`}>
                ● {cameraStatus.toUpperCase()}
              </span>
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
              
              {cameraStatus === 'connected' && <div className={styles.videoOverlayGrid} />}

              {cameraStatus !== 'connected' && (
                <div className={styles.videoPlaceholder}>
                  <CameraOff size={38} style={{ color: '#5A738E' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#F4F7FB', fontSize: '14px' }}>Webcam Feed Offline</div>
                    <div style={{ fontSize: '12px', color: '#8FA3B8', marginTop: '4px' }}>
                      Click below to activate laptop camera for real-time visual plant monitoring.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Error Banner */}
            {cameraError && (
              <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(255, 107, 74, 0.1)', border: '1px solid rgba(255, 107, 74, 0.25)', borderRadius: '6px', fontSize: '12px', color: 'var(--color-danger)' }}>
                {cameraError}
              </div>
            )}

            {/* Camera Action Buttons */}
            <div className={styles.cameraControls}>
              {cameraStatus === 'connected' ? (
                <>
                  <button className="btn btn-primary" onClick={handleCapture}>
                    <Camera size={16} /> Capture Observation
                  </button>
                  <button className="btn btn-ghost" onClick={stopCamera}>
                    <CameraOff size={16} /> Stop Camera
                  </button>
                </>
              ) : (
                <button 
                  className="btn btn-primary" 
                  onClick={() => startCamera()}
                  disabled={cameraStatus === 'requesting'}
                >
                  <Camera size={16} /> {cameraStatus === 'requesting' ? 'Starting...' : 'Start Camera'}
                </button>
              )}

              {/* Multiple Device Picker */}
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

          {/* Demo Intelligence Scenarios (Simulation Mode) */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Layers size={18} className="text-primary" />
              <h3 className="text-md font-bold">Simulation Scenarios</h3>
            </div>
            <p className="text-xs text-secondary mb-md">
              Test multimodal diagnostics and rule-based threshold evaluation without hardware.
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

        {/* Right Column: Health Assessment & Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Real-time Health Assessment Card */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Health Assessment</span>
                <h3 className="text-lg font-bold text-primary" style={{ marginTop: '2px' }}>
                  {healthReport.healthState === 'optimal' ? 'Optimal Balance' : healthReport.healthState === 'warning' ? 'Moderate Stress' : 'Critical Hazard'}
                </h3>
              </div>

              {/* Score circle */}
              <div 
                className={styles.healthScoreCircle} 
                style={{ borderColor: healthColor, color: healthColor }}
              >
                {healthReport.overallHealthScore}
              </div>
            </div>

            <p className="text-xs text-secondary mb-md">
              {healthReport.summary}
            </p>

            {/* Parameter Component Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(7, 17, 31, 0.5)', padding: '14px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span className="text-secondary">pH Index ({latestReading?.ph?.toFixed(2) ?? '--'})</span>
                  <span style={{ fontWeight: 700, color: environmentalAssessment.phStatus === 'optimal' ? '#B7FF3C' : '#FFC857' }}>
                    {environmentalAssessment.phScore}/100
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${environmentalAssessment.phScore}%`, background: environmentalAssessment.phStatus === 'optimal' ? '#B7FF3C' : '#FFC857' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span className="text-secondary">TDS Nutrient Salinity ({latestReading?.tds ? Math.round(latestReading.tds) : '--'} PPM)</span>
                  <span style={{ fontWeight: 700, color: environmentalAssessment.tdsStatus === 'optimal' ? '#B7FF3C' : '#FFC857' }}>
                    {environmentalAssessment.tdsScore}/100
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${environmentalAssessment.tdsScore}%`, background: environmentalAssessment.tdsStatus === 'optimal' ? '#B7FF3C' : '#FFC857' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span className="text-secondary">Reservoir Water Level ({latestReading?.waterLevel ? Math.round(latestReading.waterLevel) : '--'}%)</span>
                  <span style={{ fontWeight: 700, color: environmentalAssessment.waterLevelStatus === 'optimal' ? '#B7FF3C' : '#FF6B4A' }}>
                    {environmentalAssessment.waterLevelScore}/100
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${environmentalAssessment.waterLevelScore}%`, background: environmentalAssessment.waterLevelStatus === 'optimal' ? '#B7FF3C' : '#FF6B4A' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Active Anomalies & Recommendations */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <AlertTriangle size={18} style={{ color: activeAnomalies.length > 0 ? '#FFC857' : '#B7FF3C' }} />
              <h3 className="text-md font-bold">
                {activeAnomalies.length > 0 ? `Detected Anomalies (${activeAnomalies.length})` : 'System Equilibrium'}
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
                ✓ No chemical or physical anomalies detected. All sensors are within biological safety bands.
              </div>
            )}

            {/* Explainable Recommendations */}
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

      {/* 3. Multimodal Observation History Timeline */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="text-md font-bold">Multimodal Observation Log</h3>
            <p className="text-xs text-secondary">
              Synchronized records combining webcam snapshots and hardware telemetry at capture time.
            </p>
          </div>
          <span className="badge badge-info">{observations.length} Observations</span>
        </div>

        {observations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
            No observations recorded yet. Start your camera above and click <strong>&quot;Capture Observation&quot;</strong> to create a multimodal record.
          </div>
        ) : (
          <div className={styles.observationTimeline}>
            {observations.slice(0, 6).map((obs) => (
              <div key={obs.id} className={styles.observationCard}>
                {obs.imageReference ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={obs.imageReference} alt="Plant observation" className={styles.observationThumbnail} />
                ) : (
                  <div className={styles.thumbnailPlaceholder}>
                    No image attached (Camera Idle)
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#8FA3B8' }}>
                  <span>{new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  <span className={`badge badge-${obs.overallHealthScore && obs.overallHealthScore > 75 ? 'success' : 'warning'}`}>
                    Score: {obs.overallHealthScore ?? '--'}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '6px 8px', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <div>
                    <span style={{ color: '#5A738E' }}>pH: </span>
                    <strong>{obs.ph?.toFixed(2) ?? '--'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5A738E' }}>TDS: </span>
                    <strong>{obs.tds ? Math.round(obs.tds) : '--'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#5A738E' }}>WL: </span>
                    <strong>{obs.waterLevel ? `${Math.round(obs.waterLevel)}%` : '--'}</strong>
                  </div>
                </div>

                {obs.activeAnomalies && obs.activeAnomalies.length > 0 && (
                  <div style={{ fontSize: '10.5px', color: 'var(--color-warning)' }}>
                    ⚠️ {obs.activeAnomalies[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
