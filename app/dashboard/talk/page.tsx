'use client';

import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { PlantTextAssistant } from '@/components/assistant/PlantTextAssistant';
import {
  Camera,
  CameraOff,
  Activity,
  Scan,
  Leaf,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import styles from './page.module.css';

export default function TalkToPlantPage() {
  const { latestReading } = useESP32Serial();
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
    latestDetection,
    growthMetrics
  } = usePlantIntelligence();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="text-3xl font-bold text-primary">🌱 Talk to Your Plant</h1>
            <span className="badge badge-success" style={{ fontSize: '10px' }}>
              <MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Grounded Text Assistant (English & ಕನ್ನಡ)
            </span>
          </div>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            Interact with your monitored plant in English or Kannada (ಕನ್ನಡ). Responses are 100% grounded in real-time camera vision and ESP32 telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Leaf size={13} />
            <span>Monitored Crop: <strong>{cropIdentity.commonName}</strong></span>
          </span>
        </div>
      </div>

      {/* 2. Main Talk Stage Layout */}
      <div className={styles.talkLayout}>
        
        {/* Left Column: LIVE PLANT VIEW + STATUS + ENVIRONMENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Camera Viewport */}
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} className="text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-wider">LIVE PLANT CAMERA</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {cameraStatus === 'connected' && (
                  <span className={`badge badge-${latestDetection?.isPlantDetected ? 'success' : 'warning'}`}>
                    {latestDetection?.isPlantDetected ? `● PLANT DETECTED (${latestDetection.confidence}%)` : '○ STANDBY'}
                  </span>
                )}
                <span className={`badge badge-${cameraStatus === 'connected' ? 'success' : 'info'}`}>
                  ● {cameraStatus.toUpperCase()}
                </span>
              </div>
            </div>

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

                  <div className={styles.cameraHudBar}>
                    <div className={styles.hudPill} style={{ color: '#00E5FF' }}>
                      <Activity size={12} />
                      <span>FPS: 60 (Live)</span>
                    </div>

                    <div 
                      className={styles.hudPill} 
                      style={{ color: latestDetection?.isPlantDetected ? '#B7FF3C' : '#FFC857' }}
                    >
                      <Scan size={12} />
                      <span>
                        {latestDetection?.isPlantDetected 
                          ? `Canopy: ${latestDetection.canopyCoveragePercent}%` 
                          : 'Searching for foliage...'}
                      </span>
                    </div>
                  </div>

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
                        🌱 FOLIAGE DETECTED ({latestDetection.confidence}%)
                      </span>
                    </div>
                  )}
                </>
              )}

              {cameraStatus !== 'connected' && (
                <div className={styles.videoPlaceholder}>
                  <CameraOff size={38} style={{ color: '#5A738E' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#F4F7FB', fontSize: '14px' }}>Plant Camera Inactive</div>
                    <div style={{ fontSize: '11.5px', color: '#8FA3B8', marginTop: '2px' }}>
                      Activate webcam to allow your plant to evaluate its leaves and canopy during conversation.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Camera Switcher Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              {cameraStatus === 'connected' ? (
                <button className="btn btn-ghost" style={{ fontSize: '11.5px', color: '#FF6B4A' }} onClick={stopCamera}>
                  <CameraOff size={14} /> Deactivate Camera
                </button>
              ) : (
                <button className="btn btn-primary" style={{ fontSize: '11.5px' }} onClick={() => startCamera()}>
                  <Camera size={14} /> Start Live Camera
                </button>
              )}

              {availableDevices.length > 1 && (
                <select 
                  className={styles.cameraSelect}
                  onChange={(e) => switchDevice(e.target.value)}
                >
                  {availableDevices.map((dev) => (
                    <option key={dev.deviceId} value={dev.deviceId}>
                      {dev.label || `Camera ${dev.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Environmental Telemetry Synchronized Chips */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted">LIVE TELEMETRY CONTEXT</h3>
              <span className="badge badge-success">ESP32 Online</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              <div className={styles.telemetryMiniCard}>
                <span className="text-xs text-muted">pH</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.ph ? latestReading.ph.toFixed(2) : '--'}
                </div>
              </div>

              <div className={styles.telemetryMiniCard}>
                <span className="text-xs text-muted">TDS</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#B7FF3C', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.tds ? Math.round(latestReading.tds) : '--'} <span style={{ fontSize: '9px', fontWeight: 400 }}>PPM</span>
                </div>
              </div>

              <div className={styles.telemetryMiniCard}>
                <span className="text-xs text-muted">Water</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#00E5FF', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.waterLevel ? `${Math.round(latestReading.waterLevel)}%` : '--'}
                </div>
              </div>

              <div className={styles.telemetryMiniCard}>
                <span className="text-xs text-muted">Distance</span>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#F4F7FB', fontFamily: 'var(--font-mono)' }}>
                  {latestReading?.distance ? `${latestReading.distance.toFixed(1)}` : '--'} <span style={{ fontSize: '9px', fontWeight: 400 }}>cm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Growth Summary Pill */}
          <div className="glass-card" style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} className="text-primary" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#F4F7FB' }}>
                Image-Derived Growth: {growthMetrics.cumulativeGrowthDelta >= 0 ? `+${growthMetrics.cumulativeGrowthDelta}%` : `${growthMetrics.cumulativeGrowthDelta}%`} Canopy
              </span>
            </div>
            <span className="text-xs text-muted">{growthMetrics.daysMonitored} Days Monitored</span>
          </div>

        </div>

        {/* Right Column: GROUNDED TEXT ASSISTANT */}
        <div>
          <PlantTextAssistant />
        </div>

      </div>

    </div>
  );
}
