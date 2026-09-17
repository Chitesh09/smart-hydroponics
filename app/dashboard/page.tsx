'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import ESP32Connection from '@/components/esp32/ESP32Connection';
import { LiveLineChart } from '@/components/LiveLineChart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { WhatChanged, MetricDelta } from '@/components/ui/WhatChanged';
import {
  FlaskConical,
  Sparkles,
  Droplets,
  Ruler,
  Camera,
  CameraOff,
  AlertTriangle,
  CheckCircle2,
  Activity,
  ArrowRight
} from 'lucide-react';
import styles from './page.module.css';

const DEFAULT_READING = { ph: 6.0, tds: 1000, waterLevel: 85, distance: 23.5, timestamp: 0 };

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const { mode, isStale, latestReading, history } = useESP32Serial();
  const { status: cameraStatus, videoRef, startCamera } = useCamera();
  const {
    cropIdentity,
    latestDetection,
    multimodalAssessment,
    activeAnomalies,
    farmerSemanticState
  } = usePlantIntelligence();

  const [selectedMetric, setSelectedMetric] = useState<'ph' | 'tds' | 'waterLevel' | 'distance'>('ph');

  const reading = latestReading || DEFAULT_READING;
  const isTelemetryAvailable = latestReading !== null && !isStale;
  const isCameraActive = cameraStatus === 'connected';

  // Greeting
  const greeting = useMemo(() => {
    const resolvedName = currentUser?.displayName || userProfile?.displayName;
    const now = new Date();
    const hour = now.getHours();
    
    let timeGreeting = 'Welcome';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (resolvedName && resolvedName !== 'null' && resolvedName !== 'undefined') {
      return `${timeGreeting}, ${resolvedName}`;
    }
    return timeGreeting;
  }, [currentUser?.displayName, userProfile?.displayName]);

  // Chart timestamps
  const chartLabels = useMemo(() => {
    return history.map((item) =>
      new Date(item.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, [history]);

  // Active chart metric configuration
  const chartConfig = useMemo(() => {
    const dataMap = {
      ph: history.map((item) => item.ph),
      tds: history.map((item) => item.tds),
      waterLevel: history.map((item) => item.waterLevel),
      distance: history.map((item) => item.distance),
    };

    const configs = {
      ph: {
        data: dataMap.ph,
        color: '#1CA7A0',
        title: 'pH Acidity Telemetry',
        min: 4.0,
        max: 8.0,
      },
      tds: {
        data: dataMap.tds,
        color: '#2EB872',
        title: 'TDS Dissolved Mineral Density (PPM)',
        min: 600,
        max: 1400,
      },
      waterLevel: {
        data: dataMap.waterLevel,
        color: '#1CA7A0',
        title: 'Reservoir Capacity Percentage',
        min: 0,
        max: 100,
      },
      distance: {
        data: dataMap.distance,
        color: '#E5A93C',
        title: 'Ultrasonic Air Gap (cm)',
        min: 0,
        max: 60,
      },
    };

    return configs[selectedMetric];
  }, [history, selectedMetric]);

  // Seconds elapsed since last packet
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  useEffect(() => {
    const updateTime = () => {
      if (reading.timestamp) {
        setSecondsAgo(Math.max(0, Math.floor((Date.now() - reading.timestamp) / 1000)));
      } else {
        setSecondsAgo(null);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [reading.timestamp]);

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Unknown Plant';
  const botanicalScientific = isPlantIdentified ? cropIdentity.scientificName || 'Botanical Species' : 'Botanical identification unavailable';

  // Real historical deltas calculation for "WHAT CHANGED TODAY"
  const calculatedDeltas = useMemo((): MetricDelta[] => {
    if (history.length < 5) return [];

    const first = history[0];
    const last = history[history.length - 1];

    const phDelta = last.ph - first.ph;
    const tdsDelta = last.tds - first.tds;
    const waterDelta = last.waterLevel - first.waterLevel;

    return [
      {
        parameter: 'pH Level',
        unit: 'pH',
        delta: phDelta,
        direction: Math.abs(phDelta) < 0.05 ? 'stable' : phDelta > 0 ? 'rising' : 'falling',
        isBeneficial: Math.abs(phDelta) < 0.2,
      },
      {
        parameter: 'Nutrient TDS',
        unit: 'PPM',
        delta: tdsDelta,
        direction: Math.abs(tdsDelta) < 10 ? 'stable' : tdsDelta > 0 ? 'rising' : 'falling',
        isBeneficial: tdsDelta >= -50 && tdsDelta <= 50,
      },
      {
        parameter: 'Reservoir',
        unit: '%',
        delta: waterDelta,
        direction: Math.abs(waterDelta) < 1 ? 'stable' : waterDelta > 0 ? 'rising' : 'falling',
        isBeneficial: waterDelta > -15,
      },
    ];
  }, [history]);

  // Optical detection progression label
  const opticalProgression = useMemo(() => {
    if (!isCameraActive) return 'CAMERA OFFLINE';
    if (!latestDetection?.isPlantDetected) return 'SCANNING ENVIRONMENT';
    if (latestDetection.isPlantDetected && !isPlantIdentified) return 'PLANT STRUCTURE DETECTED';
    if (latestDetection.isPlantDetected && isPlantIdentified) return 'READY · LIVE MONITORING';
    return 'ANALYZING FOLIAGE';
  }, [isCameraActive, latestDetection, isPlantIdentified]);

  const hasActiveAttention = activeAnomalies.length > 0;

  return (
    <div className={styles.container}>
      
      {/* 1. Scientific Header Bar */}
      <div className={styles.headerRow}>
        <div className={styles.greetingBlock}>
          <span className="section-label">Plant Command Center</span>
          <h1 className="display-title">{greeting}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <DataSourceBadge mode={mode} isStale={isStale} hasData={latestReading !== null} />
          {secondsAgo !== null && (
            <span className="scientific-meta">
              Synced {secondsAgo}s ago
            </span>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. HERO PLANT EXPERIENCE (The Central Visual Object)         */}
      {/* ============================================================ */}
      <div className={styles.plantHeroStage}>
        
        {/* Left: Optical Camera Viewport */}
        <div className={styles.opticalViewport}>
          <video
            ref={videoRef}
            className={styles.opticalVideo}
            autoPlay
            playsInline
            muted
            style={{ display: isCameraActive ? 'block' : 'none' }}
          />

          {isCameraActive ? (
            <>
              {/* Subtle Botanical Scanning Reticle */}
              <div className={styles.opticalReticle}>
                <div className={styles.reticleCornerTL} />
                <div className={styles.reticleCornerBR} />
              </div>

              {/* Status Overlay */}
              <div className={styles.opticalStatusOverlay}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(5, 19, 17, 0.85)',
                    color: latestDetection?.isPlantDetected ? 'var(--color-green)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {opticalProgression}
                </span>

                {latestDetection?.isPlantDetected && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(5, 19, 17, 0.85)',
                      color: 'var(--color-teal)',
                      border: '1px solid var(--border-default)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    Canopy: {latestDetection.canopyCoveragePercent}%
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className={styles.cameraOfflinePlaceholder}>
              <CameraOff size={32} style={{ color: 'var(--text-muted)' }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Optical Stream Offline
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Activate camera to stream live botanical foliage observations.
                </div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '11.5px', padding: '5px 12px', marginTop: '4px' }}
                onClick={() => startCamera()}
              >
                <Camera size={13} />
                <span>Initialize Camera</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Botanical Identity & Digital Twin State */}
        <div className={styles.botanicalStateBlock}>
          <div>
            <span className="section-label">Monitored Plant</span>
            <div className={styles.speciesBlock} style={{ marginTop: '4px' }}>
              <div className={styles.commonName}>{plantDisplayName}</div>
              <div className={styles.scientificName}>{botanicalScientific}</div>
            </div>

            <div className={styles.stateRow}>
              <StatusBadge status={farmerSemanticState.plantStatus.toLowerCase()} label={farmerSemanticState.plantMessage} size="md" />
              {isTelemetryAvailable && (
                <div className={styles.conditionScoreDisplay}>
                  <span className={styles.scoreNumber}>{multimodalAssessment.overallScore}</span>
                  <span className={styles.scoreOutOf}>/ 100</span>
                </div>
              )}
            </div>
          </div>

          {/* Plant State Digital Twin Matrix (Farmer Semantic Interpretation) */}
          <div className={styles.twinPillars}>
            <div className={styles.pillarItem}>
              <span className={styles.pillarLabel}>Water Status</span>
              <span className={styles.pillarValue} style={{ color: `var(--color-${farmerSemanticState.waterColor})` }}>
                {farmerSemanticState.waterMessage}
              </span>
            </div>

            <div className={styles.pillarItem}>
              <span className={styles.pillarLabel}>Nutrients</span>
              <span className={styles.pillarValue} style={{ color: `var(--color-${farmerSemanticState.nutrientColor})` }}>
                {farmerSemanticState.nutrientMessage}
              </span>
            </div>

            <div className={styles.pillarItem}>
              <span className={styles.pillarLabel}>Camera View</span>
              <span className={styles.pillarValue} style={{ color: `var(--color-${farmerSemanticState.cameraColor})` }}>
                {farmerSemanticState.cameraMessage}
              </span>
            </div>
          </div>

          {/* Reasoning Lab Link */}
          <Link
            href="/dashboard/intelligence"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-teal)',
              padding: '8px 12px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <span>Open Plant Reasoning Lab</span>
            <ArrowRight size={13} />
          </Link>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. WHAT CHANGED TODAY (Historical Deltas)                     */}
      {/* ============================================================ */}
      <WhatChanged deltas={calculatedDeltas} hasHistory={history.length >= 5} />

      {/* ============================================================ */}
      {/* 4. WHAT NEEDS YOUR ATTENTION                                 */}
      {/* ============================================================ */}
      {hasActiveAttention ? (
        <div className={`${styles.attentionBanner} ${styles.attentionWarning}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--color-amber)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-amber)' }}>
                {activeAnomalies[0].title}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginTop: '2px' }}>
                {activeAnomalies[0].description} · Suggested: {activeAnomalies[0].suggestedAction}
              </div>
            </div>
          </div>
          <Link href="/dashboard/intelligence" className="btn btn-secondary" style={{ fontSize: '11.5px', padding: '4px 10px' }}>
            Diagnostic Details
          </Link>
        </div>
      ) : (
        <div className={`${styles.attentionBanner} ${styles.attentionStable}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--color-green)' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              Everything Looks Stable
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              — All biological parameters and environmental channels are within optimal ranges.
            </span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. PLANT ENVIRONMENT (Open Strip Layout)                     */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="section-label">Plant Environment</span>
        
        <div className={styles.environmentalStrip}>
          
          {/* pH Node */}
          <div className={styles.envNode}>
            <div className={styles.envNodeHeader}>
              <span className="section-label" style={{ fontSize: '9.5px' }}>Acidity (pH)</span>
              <FlaskConical size={14} style={{ color: 'var(--color-teal)' }} />
            </div>
            <div className={styles.envValueRow}>
              <span className={styles.envValue}>
                {isTelemetryAvailable ? reading.ph.toFixed(2) : '--'}
              </span>
              <span className={styles.envUnit}>pH</span>
            </div>
            <div className={styles.envFooter}>
              <span>Target: 5.5 - 6.5</span>
              <StatusBadge status={isTelemetryAvailable ? farmerSemanticState.nutrientStatus.toLowerCase() : 'unavailable'} size="sm" />
            </div>
          </div>

          {/* TDS Node */}
          <div className={styles.envNode}>
            <div className={styles.envNodeHeader}>
              <span className="section-label" style={{ fontSize: '9.5px' }}>Nutrients (TDS)</span>
              <Sparkles size={14} style={{ color: 'var(--color-green)' }} />
            </div>
            <div className={styles.envValueRow}>
              <span className={styles.envValue}>
                {isTelemetryAvailable ? Math.round(reading.tds) : '--'}
              </span>
              <span className={styles.envUnit}>PPM</span>
            </div>
            <div className={styles.envFooter}>
              <span>Target: 800 - 1200</span>
              <StatusBadge status={isTelemetryAvailable ? farmerSemanticState.nutrientStatus.toLowerCase() : 'unavailable'} size="sm" />
            </div>
          </div>

          {/* Reservoir Node */}
          <div className={styles.envNode}>
            <div className={styles.envNodeHeader}>
              <span className="section-label" style={{ fontSize: '9.5px' }}>Reservoir Level</span>
              <Droplets size={14} style={{ color: 'var(--color-teal)' }} />
            </div>
            <div className={styles.envValueRow}>
              <span className={styles.envValue}>
                {isTelemetryAvailable ? Math.round(reading.waterLevel) : '--'}
              </span>
              <span className={styles.envUnit}>%</span>
            </div>
            <div className={styles.envFooter}>
              <span>Critical: &lt; 20%</span>
              <StatusBadge status={isTelemetryAvailable ? farmerSemanticState.waterStatus.toLowerCase() : 'unavailable'} size="sm" />
            </div>
          </div>

          {/* Distance Node */}
          <div className={styles.envNode}>
            <div className={styles.envNodeHeader}>
              <span className="section-label" style={{ fontSize: '9.5px' }}>Ultrasonic Air Gap</span>
              <Ruler size={14} style={{ color: 'var(--color-amber)' }} />
            </div>
            <div className={styles.envValueRow}>
              <span className={styles.envValue}>
                {isTelemetryAvailable ? reading.distance.toFixed(1) : '--'}
              </span>
              <span className={styles.envUnit}>cm</span>
            </div>
            <div className={styles.envFooter}>
              <span>Sensor Depth</span>
              <span className="scientific-meta" style={{ fontSize: '10px' }}>Calibrated</span>
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. LIVE INSTRUMENTATION & SERIAL STREAM                      */}
      {/* ============================================================ */}
      <div className={styles.instrumentationSection}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} style={{ color: 'var(--color-teal)' }} />
            <span className="section-label">Live Telemetry Sparkline</span>
          </div>

          <div className={styles.tabsRow}>
            <button
              className={`${styles.tabButton} ${selectedMetric === 'ph' ? styles.tabButtonActive : ''}`}
              onClick={() => setSelectedMetric('ph')}
            >
              pH
            </button>
            <button
              className={`${styles.tabButton} ${selectedMetric === 'tds' ? styles.tabButtonActive : ''}`}
              onClick={() => setSelectedMetric('tds')}
            >
              TDS
            </button>
            <button
              className={`${styles.tabButton} ${selectedMetric === 'waterLevel' ? styles.tabButtonActive : ''}`}
              onClick={() => setSelectedMetric('waterLevel')}
            >
              Level
            </button>
            <button
              className={`${styles.tabButton} ${selectedMetric === 'distance' ? styles.tabButtonActive : ''}`}
              onClick={() => setSelectedMetric('distance')}
            >
              Distance
            </button>
          </div>
        </div>

        {history.length === 0 ? (
          <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '12.5px' }}>
            Awaiting serial telemetry packets from ESP32...
          </div>
        ) : (
          <LiveLineChart
            data={chartConfig.data}
            labels={chartLabels}
            title={chartConfig.title}
            color={chartConfig.color}
            min={chartConfig.min}
            max={chartConfig.max}
          />
        )}

        <div style={{ marginTop: '16px' }}>
          <ESP32Connection />
        </div>
      </div>

    </div>
  );
}
