'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/AuthContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import ESP32Connection from '@/components/esp32/ESP32Connection';
import { SENSOR_THRESHOLDS } from '@/lib/sensorConfig';
import { LiveLineChart } from '@/components/LiveLineChart';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import {
  FlaskConical,
  Sparkles,
  Droplets,
  Ruler,
  Cpu,
  Camera,
  CameraOff,
  Leaf,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
  Activity
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
    latestVisualHealth,
    multimodalAssessment,
    predictiveAnalytics
  } = usePlantIntelligence();

  const [selectedMetric, setSelectedMetric] = useState<'ph' | 'tds' | 'waterLevel' | 'distance'>('ph');

  const reading = latestReading || DEFAULT_READING;
  const isTelemetryAvailable = latestReading !== null && !isStale;
  const isCameraActive = cameraStatus === 'connected';

  // Personalize greeting
  const greeting = useMemo(() => {
    const resolvedName = currentUser?.displayName || userProfile?.displayName;
    const now = new Date();
    const hour = now.getHours();
    
    let timeGreeting = 'Welcome back';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (resolvedName && resolvedName !== 'null' && resolvedName !== 'undefined') {
      return `${timeGreeting}, ${resolvedName} 👋`;
    }
    return `${timeGreeting} 👋`;
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
        color: '#20B8B0',
        title: 'pH Acidity Telemetry (Real-time)',
        min: 4.0,
        max: 8.0,
      },
      tds: {
        data: dataMap.tds,
        color: '#39B86F',
        title: 'TDS Mineral Density Telemetry (Real-time)',
        min: 600,
        max: 1400,
      },
      waterLevel: {
        data: dataMap.waterLevel,
        color: '#20B8B0',
        title: 'Reservoir Capacity Percentage (Real-time)',
        min: 0,
        max: 100,
      },
      distance: {
        data: dataMap.distance,
        color: '#F2B84B',
        title: 'Ultrasonic Sensor Distance (Real-time)',
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

  // Status determinations
  const phStatus = reading.ph < SENSOR_THRESHOLDS.ph.min || reading.ph > SENSOR_THRESHOLDS.ph.max ? 'warning' : 'optimal';
  const tdsStatus = reading.tds < SENSOR_THRESHOLDS.tds.min || reading.tds > SENSOR_THRESHOLDS.tds.max ? 'warning' : 'optimal';
  const waterStatus = reading.waterLevel < SENSOR_THRESHOLDS.waterLevel.critical ? 'critical' : reading.waterLevel < SENSOR_THRESHOLDS.waterLevel.warning ? 'warning' : 'optimal';

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Unknown Plant';

  return (
    <div className={styles.dashboardContainer}>
      
      {/* 1. Page Header */}
      <div className={styles.dashboardHeader}>
        <div>
          <h1 className="text-3xl font-bold text-primary mb-xs">{greeting}</h1>
          <p className="text-secondary">Operational telemetry and real-time plant monitoring.</p>
        </div>

        <div className={styles.statusPill}>
          <DataSourceBadge mode={mode} isStale={isStale} hasData={latestReading !== null} />
          {secondsAgo !== null && (
            <span className="text-muted font-mono" style={{ fontSize: '11px' }}>
              · {secondsAgo}s ago
            </span>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1 — PLANT STATUS HERO BANNER                         */}
      {/* ============================================================ */}
      <div className={styles.plantStatusHero}>
        <div className={styles.heroItem}>
          <span className={styles.heroLabel}>Monitored Plant</span>
          <div className={styles.heroValue}>
            <Leaf size={18} style={{ color: 'var(--color-green)' }} />
            <span>{plantDisplayName}</span>
          </div>
          <span className={styles.heroSub}>
            {isPlantIdentified ? cropIdentity.scientificName || 'Botanical Species' : 'Identification pending in Intelligence'}
          </span>
        </div>

        <div className={styles.heroItem}>
          <span className={styles.heroLabel}>Overall Condition</span>
          <div className={styles.heroValue}>
            {isTelemetryAvailable || isCameraActive ? (
              <StatusBadge status={multimodalAssessment.overallHealthState} label={multimodalAssessment.overallHealthState.toUpperCase()} />
            ) : (
              <StatusBadge status="unavailable" label="UNAVAILABLE" />
            )}
          </div>
          <span className={styles.heroSub}>
            {isTelemetryAvailable ? `Composite score: ${multimodalAssessment.overallScore}/100` : 'Telemetry required'}
          </span>
        </div>

        <div className={styles.heroItem}>
          <span className={styles.heroLabel}>Environmental State</span>
          <div className={styles.heroValue}>
            {isTelemetryAvailable ? (
              <StatusBadge status={multimodalAssessment.environmentalState} label={multimodalAssessment.environmentalState.toUpperCase()} />
            ) : (
              <StatusBadge status="unavailable" label="UNAVAILABLE" />
            )}
          </div>
          <span className={styles.heroSub}>
            {isTelemetryAvailable ? 'Sensors within thresholds' : 'ESP32 disconnected'}
          </span>
        </div>

        <div className={styles.heroItem}>
          <span className={styles.heroLabel}>Visual Health</span>
          <div className={styles.heroValue}>
            {isCameraActive && latestDetection?.isPlantDetected ? (
              <StatusBadge status={latestVisualHealth?.healthState === 'healthy' ? 'healthy' : 'attention'} label={latestVisualHealth?.healthState.toUpperCase() || 'HEALTHY'} />
            ) : isCameraActive ? (
              <StatusBadge status="attention" label="STANDBY" />
            ) : (
              <StatusBadge status="unavailable" label="UNAVAILABLE" />
            )}
          </div>
          <span className={styles.heroSub}>
            {isCameraActive ? (latestDetection?.isPlantDetected ? `Canopy: ${latestDetection.canopyCoveragePercent}%` : 'Searching for foliage...') : 'Camera offline'}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2 — ENVIRONMENTAL CONDITIONS (Grouped Tiles)         */}
      {/* ============================================================ */}
      <div className={styles.conditionsGrid}>
        
        {/* pH Tile */}
        <div className={styles.metricTile}>
          <div className={styles.metricTileHeader}>
            <span className="text-xs font-bold uppercase text-secondary">Acidity (pH)</span>
            <FlaskConical size={16} style={{ color: 'var(--color-teal)' }} />
          </div>

          <div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>
                {isTelemetryAvailable ? reading.ph.toFixed(2) : '--'}
              </span>
              <span className={styles.metricUnit}>pH</span>
            </div>
            <StatusBadge status={isTelemetryAvailable ? phStatus : 'unavailable'} size="sm" />
          </div>

          <div className={styles.metricTileFooter}>
            <span className="text-muted">Target: 5.5 - 6.5</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              {predictiveAnalytics.predictions.ph.trendDirection === 'rising' ? (
                <TrendingUp size={12} style={{ color: 'var(--color-warning)' }} />
              ) : predictiveAnalytics.predictions.ph.trendDirection === 'falling' ? (
                <TrendingDown size={12} style={{ color: 'var(--color-warning)' }} />
              ) : (
                <Minus size={12} style={{ color: 'var(--color-green)' }} />
              )}
              <span style={{ fontSize: '10.5px' }}>{predictiveAnalytics.predictions.ph.trendDirection}</span>
            </div>
          </div>
        </div>

        {/* TDS Tile */}
        <div className={styles.metricTile}>
          <div className={styles.metricTileHeader}>
            <span className="text-xs font-bold uppercase text-secondary">Nutrients (TDS)</span>
            <Sparkles size={16} style={{ color: 'var(--color-green)' }} />
          </div>

          <div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>
                {isTelemetryAvailable ? Math.round(reading.tds) : '--'}
              </span>
              <span className={styles.metricUnit}>PPM</span>
            </div>
            <StatusBadge status={isTelemetryAvailable ? tdsStatus : 'unavailable'} size="sm" />
          </div>

          <div className={styles.metricTileFooter}>
            <span className="text-muted">Target: 800 - 1200 PPM</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              {predictiveAnalytics.predictions.tds.trendDirection === 'rising' ? (
                <TrendingUp size={12} style={{ color: 'var(--color-green)' }} />
              ) : predictiveAnalytics.predictions.tds.trendDirection === 'falling' ? (
                <TrendingDown size={12} style={{ color: 'var(--color-teal)' }} />
              ) : (
                <Minus size={12} style={{ color: 'var(--color-green)' }} />
              )}
              <span style={{ fontSize: '10.5px' }}>{predictiveAnalytics.predictions.tds.trendDirection}</span>
            </div>
          </div>
        </div>

        {/* Water Level Tile */}
        <div className={styles.metricTile}>
          <div className={styles.metricTileHeader}>
            <span className="text-xs font-bold uppercase text-secondary">Reservoir Level</span>
            <Droplets size={16} style={{ color: 'var(--color-teal)' }} />
          </div>

          <div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>
                {isTelemetryAvailable ? Math.round(reading.waterLevel) : '--'}
              </span>
              <span className={styles.metricUnit}>% capacity</span>
            </div>
            <StatusBadge status={isTelemetryAvailable ? waterStatus : 'unavailable'} size="sm" />
          </div>

          <div className={styles.metricTileFooter}>
            <span className="text-muted">Critical: &lt; 20%</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
              {predictiveAnalytics.predictions.waterLevel.trendDirection === 'falling' ? (
                <TrendingDown size={12} style={{ color: 'var(--color-danger)' }} />
              ) : (
                <Minus size={12} style={{ color: 'var(--color-green)' }} />
              )}
              <span style={{ fontSize: '10.5px' }}>{predictiveAnalytics.predictions.waterLevel.trendDirection}</span>
            </div>
          </div>
        </div>

        {/* Ultrasonic Distance Tile */}
        <div className={styles.metricTile}>
          <div className={styles.metricTileHeader}>
            <span className="text-xs font-bold uppercase text-secondary">Ultrasonic Distance</span>
            <Ruler size={16} style={{ color: 'var(--color-warning)' }} />
          </div>

          <div>
            <div className={styles.metricValueRow}>
              <span className={styles.metricValue}>
                {isTelemetryAvailable ? reading.distance.toFixed(1) : '--'}
              </span>
              <span className={styles.metricUnit}>cm</span>
            </div>
            <StatusBadge status={isTelemetryAvailable ? 'optimal' : 'unavailable'} size="sm" label={isTelemetryAvailable ? 'CALIBRATED' : 'OFFLINE'} />
          </div>

          <div className={styles.metricTileFooter}>
            <span className="text-muted">Sensor Air Gap</span>
            <span style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>Raw Telemetry</span>
          </div>
        </div>

      </div>

      {/* ============================================================ */}
      {/* SECTION 3 — 2-COLUMN OPERATIONAL STAGE                       */}
      {/* ============================================================ */}
      <div className={styles.stageGrid}>
        
        {/* Left Column: Live Instrumentation Chart + ESP32 Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Line Chart Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} style={{ color: 'var(--color-teal)' }} />
                <h3 className="text-sm font-bold uppercase text-secondary">Live Instrumentation Stream</h3>
              </div>

              {/* Metric Select Tabs */}
              <div className={styles.tabsContainer}>
                <button
                  className={`${styles.tabBtn} ${selectedMetric === 'ph' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedMetric('ph')}
                >
                  pH
                </button>
                <button
                  className={`${styles.tabBtn} ${selectedMetric === 'tds' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedMetric('tds')}
                >
                  TDS
                </button>
                <button
                  className={`${styles.tabBtn} ${selectedMetric === 'waterLevel' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedMetric('waterLevel')}
                >
                  Level
                </button>
                <button
                  className={`${styles.tabBtn} ${selectedMetric === 'distance' ? styles.tabBtnActive : ''}`}
                  onClick={() => setSelectedMetric('distance')}
                >
                  Distance
                </button>
              </div>
            </div>

            <div style={{ padding: '6px 0' }}>
              {history.length === 0 ? (
                <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                  Waiting for serial telemetry packets...
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
            </div>
          </div>

          {/* Web Serial Connection Bar */}
          <ESP32Connection />

        </div>

        {/* Right Column: Plant Vision Preview + Hardware Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Plant Vision Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={16} style={{ color: 'var(--color-teal)' }} />
                <h3 className="text-sm font-bold uppercase text-secondary">Plant Vision Status</h3>
              </div>
              <Link href="/dashboard/intelligence" className="text-xs text-teal" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Open Intelligence</span>
                <ChevronRight size={12} />
              </Link>
            </div>

            <div className={styles.compactCamBox}>
              <video
                ref={videoRef}
                className={styles.compactCamVideo}
                autoPlay
                playsInline
                muted
                style={{ display: isCameraActive ? 'block' : 'none' }}
              />

              {isCameraActive ? (
                <div className={styles.camOverlay}>
                  <StatusBadge
                    status={latestDetection?.isPlantDetected ? 'healthy' : 'attention'}
                    label={latestDetection?.isPlantDetected ? `🌱 Canopy: ${latestDetection.canopyCoveragePercent}%` : 'Standby'}
                    size="sm"
                  />
                  <span className="badge badge-teal" style={{ fontSize: '9.5px' }}>
                    {latestDetection?.plantPresenceScore || 0}% PRESENCE
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <CameraOff size={28} />
                  <span style={{ fontSize: '11.5px' }}>Camera Inactive</span>
                  <button className="btn btn-secondary" style={{ fontSize: '11.5px', padding: '4px 10px' }} onClick={() => startCamera()}>
                    Activate Camera
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Hardware & Sensor Integrity */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} style={{ color: 'var(--color-teal)' }} />
                <h3 className="text-sm font-bold uppercase text-secondary">Sensor Channel Integrity</h3>
              </div>
              <StatusBadge status={isTelemetryAvailable ? 'optimal' : 'unavailable'} label={isTelemetryAvailable ? 'CHANNELS ACTIVE' : 'OFFLINE'} size="sm" />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span className="text-secondary">Analog pH Probe</span>
                <span style={{ color: isTelemetryAvailable ? 'var(--color-green)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> {isTelemetryAvailable ? 'Calibrated (A0)' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span className="text-secondary">TDS Electrical Conductivity</span>
                <span style={{ color: isTelemetryAvailable ? 'var(--color-green)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> {isTelemetryAvailable ? 'Calibrated (A1)' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                <span className="text-secondary">HC-SR04 Ultrasonic Sensor</span>
                <span style={{ color: isTelemetryAvailable ? 'var(--color-green)' : 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={13} /> {isTelemetryAvailable ? 'Echo/Trig (GPIO)' : 'Inactive'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-secondary">Peristaltic Dosing Actuators</span>
                <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                  Not installed (Manual)
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
