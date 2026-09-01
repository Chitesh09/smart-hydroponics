'use client';

import { useCamera } from '@/lib/camera/CameraContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { PlantTextAssistant } from '@/components/assistant/PlantTextAssistant';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  Camera,
  CameraOff
} from 'lucide-react';
import styles from './page.module.css';

export default function TalkToPlantPage() {
  const { status: cameraStatus, videoRef, startCamera, stopCamera } = useCamera();
  const { cropIdentity, multimodalAssessment } = usePlantIntelligence();

  const isCameraActive = cameraStatus === 'connected';
  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Your Plant';
  const botanicalScientific = isPlantIdentified ? cropIdentity.scientificName || 'Botanical Species' : 'Identification pending';

  return (
    <div className={styles.container}>
      
      {/* 1. Conversational Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <span className="section-label">Interactive Companion</span>
          <h1 className="display-title">Talk to {plantDisplayName}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <StatusBadge
            status={multimodalAssessment.overallHealthState}
            label={multimodalAssessment.overallHealthState.toUpperCase()}
            size="md"
          />
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. CONVERSATIONAL STAGE (2-Column Layout)                     */}
      {/* ============================================================ */}
      <div className={styles.conversationalStage}>
        
        {/* Left Column: Live Plant Viewport ("Looking directly at your plant") */}
        <div className={styles.plantCompanionPanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BrandLogo size={18} />
              <span className="section-label">Live Plant View</span>
            </div>
            
            <button
              className="btn btn-ghost"
              style={{ fontSize: '11px', padding: '3px 8px' }}
              onClick={() => isCameraActive ? stopCamera() : startCamera()}
            >
              {isCameraActive ? 'Turn Off' : 'Turn On'}
            </button>
          </div>

          <div className={styles.companionViewport}>
            <video
              ref={videoRef}
              className={styles.companionVideo}
              autoPlay
              playsInline
              muted
              style={{ display: isCameraActive ? 'block' : 'none' }}
            />

            {isCameraActive ? (
              <div className={styles.companionPresenceBadge}>
                <span>🌱</span>
                <span>Looking at {plantDisplayName}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                <CameraOff size={28} />
                <span style={{ fontSize: '11.5px' }}>Companion Feed Inactive</span>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => startCamera()}
                >
                  <Camera size={12} />
                  <span>Start Camera</span>
                </button>
              </div>
            )}
          </div>

          {/* Plant Companion Grounding Summary */}
          <div className={styles.companionMetaBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {plantDisplayName}
              </span>
              <span className="scientific-meta" style={{ fontSize: '10px' }}>
                {isPlantIdentified ? `${cropIdentity.confidence}% Match` : 'Unclassified'}
              </span>
            </div>
            <div style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
              {botanicalScientific}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', lineHeight: 1.4, borderTop: '1px solid var(--border-subtle)', paddingTop: '6px', marginTop: '2px' }}>
              Conversations are grounded in real sensory observations (pH, TDS, canopy coverage, and predictive models).
            </div>
          </div>
        </div>

        {/* Right Column: Dominant Hero Chat Assistant */}
        <div style={{ minHeight: '520px' }}>
          <PlantTextAssistant />
        </div>

      </div>

    </div>
  );
}
