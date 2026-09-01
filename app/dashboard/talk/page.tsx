'use client';

import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { PlantTextAssistant } from '@/components/assistant/PlantTextAssistant';
import {
  Camera,
  CameraOff,
  Leaf,
  MessageSquare,
  Sparkles,
  Info
} from 'lucide-react';
import styles from './page.module.css';

export default function TalkToPlantPage() {
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
    multimodalAssessment
  } = usePlantIntelligence();

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Unknown Plant';

  return (
    <div className={styles.talkContainer}>
      
      {/* 1. Conversational Page Header */}
      <div className={styles.talkHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 className="text-3xl font-bold text-primary">🌱 Talk to Your Plant</h1>
            <span className="badge badge-success" style={{ fontSize: '10px' }}>
              <MessageSquare size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Grounded AI Companion
            </span>
          </div>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            Ask about your plant&apos;s condition, water, nutrients, or what you should do next.
          </p>
        </div>

        <div className={styles.plantStatusBadge}>
          <Leaf size={16} className="text-primary" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#F4F7FB' }}>
              {plantDisplayName}
            </span>
            <span style={{ fontSize: '10.5px', color: isPlantIdentified ? '#00E5FF' : '#FFC857' }}>
              {isPlantIdentified ? 'Monitored Plant' : 'Identification pending in Intelligence'}
            </span>
          </div>
          <span className={`badge badge-${multimodalAssessment.overallHealthState === 'optimal' ? 'success' : multimodalAssessment.overallHealthState === 'warning' ? 'warning' : 'danger'}`} style={{ fontSize: '9px', marginLeft: '6px' }}>
            {multimodalAssessment.overallHealthState === 'optimal' ? '● HEALTHY' : multimodalAssessment.overallHealthState === 'warning' ? '● MILD STRESS' : '● ATTENTION'}
          </span>
        </div>
      </div>

      {/* 2. Conversational 2-Column Stage */}
      <div className={styles.talkLayout}>
        
        {/* Left Column: LIVE PLANT VIEW (Conversational Companion Camera) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className={styles.livePlantCard}>
            <div className={styles.cameraCardHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} className="text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider">LIVE PLANT VIEW</h3>
              </div>
              <span className={`badge badge-${cameraStatus === 'connected' ? 'success' : 'info'}`} style={{ fontSize: '9.5px' }}>
                ● {cameraStatus === 'connected' ? 'ACTIVE' : 'STANDBY'}
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

              {cameraStatus === 'connected' ? (
                <>
                  <div className={styles.videoOverlayGrid} />
                  <div className={styles.cameraPresencePill}>
                    <Sparkles size={12} />
                    <span>
                      {latestDetection?.isPlantDetected
                        ? `Looking at ${plantDisplayName}`
                        : 'Searching for plant canopy...'}
                    </span>
                  </div>
                </>
              ) : (
                <div className={styles.videoPlaceholder}>
                  <CameraOff size={32} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#F4F7FB' }}>Camera Inactive</div>
                  <div style={{ fontSize: '11px', color: '#8FA3B8', maxWidth: '200px' }}>
                    Activate webcam so your plant can evaluate its leaves while chatting.
                  </div>
                </div>
              )}
            </div>

            {/* Camera Switcher / Toggle Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cameraStatus === 'connected' ? (
                <button className="btn btn-ghost" style={{ fontSize: '11.5px', color: '#FF6B4A', width: '100%' }} onClick={stopCamera}>
                  <CameraOff size={14} /> Turn Off Camera
                </button>
              ) : (
                <button className="btn btn-primary" style={{ fontSize: '11.5px', width: '100%' }} onClick={() => startCamera()}>
                  <Camera size={14} /> Turn On Camera
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

          {/* Plant Companion Bio Card */}
          <div className={styles.plantCompanionCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00E5FF', fontSize: '12px', fontWeight: 700 }}>
              <Info size={14} />
              <span>Grounded Companion</span>
            </div>
            <p style={{ fontSize: '11.5px', color: '#8FA3B8', lineHeight: 1.5 }}>
              Your plant answers in first-person using live ESP32 chemical sensors, ultrasonic water levels, and optical leaf diagnostics.
            </p>
          </div>
        </div>

        {/* Right Column: Hero PlantTextAssistant Chat Interface */}
        <div>
          <PlantTextAssistant />
        </div>

      </div>

    </div>
  );
}
