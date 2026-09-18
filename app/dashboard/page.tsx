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
import { ModeToggle } from '@/components/ui/ModeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { FarmerActionCard } from '@/components/ui/FarmerActionCard';
import { WhatChanged, MetricDelta } from '@/components/ui/WhatChanged';
import { getFarmerCopy } from '@/lib/intelligence/farmerSemanticLayer';
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
    activeRecommendations,
    farmerSemanticState,
    userMode,
    setUserMode,
    language,
    setLanguage
  } = usePlantIntelligence();

  const [selectedMetric, setSelectedMetric] = useState<'ph' | 'tds' | 'waterLevel' | 'distance'>('ph');

  const copy = getFarmerCopy(language);
  const isKn = language === 'kn';
  const reading = latestReading || DEFAULT_READING;
  const isTelemetryAvailable = latestReading !== null && !isStale;
  const isCameraActive = cameraStatus === 'connected';

  // Greeting
  const greeting = useMemo(() => {
    const resolvedName = currentUser?.displayName || userProfile?.displayName;
    const now = new Date();
    const hour = now.getHours();

    if (isKn) {
      let knGreeting = 'ಸ್ವಾಗತ';
      if (hour < 12) knGreeting = 'ಶುಭೋದಯ';
      else if (hour < 17) knGreeting = 'ಶುಭ ಮಧ್ಯಾಹ್ನ';
      else knGreeting = 'ಶುಭ ಸಂಜೆ';

      if (resolvedName && resolvedName !== 'null' && resolvedName !== 'undefined') {
        return `${knGreeting}, ${resolvedName}`;
      }
      return knGreeting;
    }
    
    let timeGreeting = 'Welcome';
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    if (resolvedName && resolvedName !== 'null' && resolvedName !== 'undefined') {
      return `${timeGreeting}, ${resolvedName}`;
    }
    return timeGreeting;
  }, [currentUser?.displayName, userProfile?.displayName, isKn]);

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
  const plantDisplayName = isPlantIdentified
    ? cropIdentity.commonName
    : (isKn ? copy.ui.plantNotIdentified : 'Plant type not identified yet');
  const botanicalScientific = isPlantIdentified
    ? cropIdentity.scientificName || (isKn ? 'ವರ್ಗೀಕರಿಸದ ಪ್ರಭೇದ' : 'Species Unclassified')
    : (isKn ? 'ಕ್ಯಾಮೆರಾ ಸ್ಕ್ಯಾನ್‌ಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ' : 'Awaiting visual identification scan');

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
    if (!isCameraActive) return isKn ? copy.ui.cameraOffline : 'Camera View Offline';
    if (!latestDetection?.isPlantDetected) {
      return isKn ? copy.ui.noPlant : 'No plant detected. Place the plant in front of the camera.';
    }
    if (latestDetection.confidence && latestDetection.confidence < 45) {
      return isKn ? copy.ui.cameraUnclear : 'Camera view is unclear. Move closer or improve lighting.';
    }
    if (isPlantIdentified) {
      return isKn
        ? `ಗಿಡ ಪತ್ತೆಯಾಗಿದೆ · ${cropIdentity.commonName} (${cropIdentity.confidence}% ಹೊಂದಾಣಿಕೆ)`
        : `Plant Detected · ${cropIdentity.commonName} (${cropIdentity.confidence}% Match)`;
    }
    return isKn
      ? `ಗಿಡ ಪತ್ತೆಯಾಗಿದೆ · ಎಲೆಗಳ ವ್ಯಾಪ್ತಿ ${latestDetection.canopyCoveragePercent}%`
      : `Plant Detected · Canopy ${latestDetection.canopyCoveragePercent}%`;
  }, [isCameraActive, latestDetection, isPlantIdentified, cropIdentity.commonName, cropIdentity.confidence, isKn, copy]);

  const hasActiveAttention = activeAnomalies.length > 0;

  return (
    <div className={styles.container}>
      
      {/* 1. Header Bar */}
      <div className={styles.headerRow}>
        <div className={styles.greetingBlock}>
          <span className="section-label">
            {isKn ? copy.ui.plantCommandCenter : 'Plant Command Center'}
          </span>
          <h1 className="display-title">{greeting}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <ModeToggle mode={userMode} onModeChange={setUserMode} size="sm" language={language} />
          <LanguageToggle language={language} onLanguageChange={setLanguage} size="sm" />
          <DataSourceBadge mode={mode} isStale={isStale} hasData={latestReading !== null} />
          {secondsAgo !== null && (
            <span className="scientific-meta">
              {isKn ? `${secondsAgo}ಸೆ ಹಿಂದೆ ಸಿಂಕ್ ಆಗಿದೆ` : `Synced ${secondsAgo}s ago`}
            </span>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. PRIMARY: PLANT CONDITION HERO BANNER                       */}
      {/* ============================================================ */}
      <div className={styles.plantHeroStage}>
        
        {/* Left: Live Plant Camera Viewport (Single Primary Camera Interface) */}
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
              {/* Botanical Scanning Reticle */}
              <div className={styles.opticalReticle}>
                <div className={styles.reticleCornerTL} />
                <div className={styles.reticleCornerBR} />
              </div>

              {/* Status Overlay */}
              <div className={styles.opticalStatusOverlay}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-xs)',
                    background: 'rgba(5, 19, 17, 0.90)',
                    color: latestDetection?.isPlantDetected ? 'var(--color-green)' : 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {opticalProgression}
                </span>

                {latestDetection?.isPlantDetected && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'rgba(5, 19, 17, 0.90)',
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
                  {isKn ? copy.ui.cameraOffline : 'Live Plant Camera Offline'}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {isKn
                    ? 'ಗಿಡದ ಎಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಕ್ಯಾಮೆರಾ ಆನ್ ಮಾಡಿ.'
                    : 'Activate camera to inspect plant foliage and stream observations.'}
                </div>
              </div>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '11.5px', padding: '6px 14px', marginTop: '4px' }}
                onClick={() => startCamera()}
              >
                <Camera size={13} />
                <span>{isKn ? copy.ui.startLiveCamera : 'Start Live Plant Camera'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Botanical Identity & Current Plant Status */}
        <div className={styles.botanicalStateBlock}>
          <div>
            <span className="section-label">
              {isKn ? 'ಪರಿಶೀಲಿಸುತ್ತಿರುವ ಗಿಡ' : 'Monitored Crop'}
            </span>
            <div className={styles.speciesBlock} style={{ marginTop: '4px' }}>
              <div className={styles.commonName}>{plantDisplayName}</div>
              <div className={styles.scientificName}>{botanicalScientific}</div>
            </div>

            <div className={styles.stateRow}>
              <StatusBadge status={farmerSemanticState.plantStatus.toLowerCase()} label={farmerSemanticState.plantMessage} size="md" />
              {isTelemetryAvailable && userMode === 'technical' && (
                <div className={styles.conditionScoreDisplay}>
                  <span className={styles.scoreNumber}>{multimodalAssessment.overallScore}</span>
                  <span className={styles.scoreOutOf}>/ 100</span>
                </div>
              )}
            </div>
          </div>

          {/* Farmer Status Summary Matrix */}
          <div className={styles.twinPillars}>
            <div className={styles.pillarItem}>
              <span className={styles.pillarLabel}>
                {isKn ? copy.ui.waterLevelLabel : 'Water Level'}
              </span>
              <span className={styles.pillarValue} style={{ color: `var(--color-${farmerSemanticState.waterColor})` }}>
                {farmerSemanticState.waterMessage}
              </span>
            </div>

            <div className={styles.pillarItem}>
              <span className={styles.pillarLabel}>
                {isKn ? copy.ui.nutrientLevelLabel : 'Nutrient Level'}
              </span>
              <span className={styles.pillarValue} style={{ color: `var(--color-${farmerSemanticState.nutrientColor})` }}>
                {farmerSemanticState.nutrientMessage}
              </span>
            </div>

            <div className={styles.pillarItem}>
              <span className={styles.pillarLabel}>
                {isKn ? copy.ui.cameraEvidence : 'Camera View'}
              </span>
              <span className={styles.pillarValue} style={{ color: `var(--color-${farmerSemanticState.cameraColor})` }}>
                {farmerSemanticState.cameraMessage}
              </span>
            </div>
          </div>

          {/* Plant Reasoning Lab Link */}
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
            <span>{isKn ? copy.ui.openReasoningLab : 'Open Plant Reasoning Lab'}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. SECONDARY: PROMINENT "WHAT SHOULD I DO NOW?" SECTION       */}
      {/* ============================================================ */}
      <FarmerActionCard semanticState={farmerSemanticState} recommendations={activeRecommendations} />

      {/* ============================================================ */}
      {/* 4. SECONDARY: WHAT NEEDS YOUR ATTENTION                       */}
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
            {isKn ? 'ವಿವರಗಳು' : 'Diagnostic Details'}
          </Link>
        </div>
      ) : (
        <div className={`${styles.attentionBanner} ${styles.attentionStable}`}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle2 size={16} style={{ color: 'var(--color-green)' }} />
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isKn ? copy.ui.everythingStable : 'Everything Looks Stable'}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {isKn
                ? `— ${copy.ui.allParametersOptimal}`
                : '— All biological parameters and environmental channels are within optimal ranges.'}
            </span>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. SUPPORTING: PLANT ENVIRONMENT OVERVIEW                    */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="section-label">
          {isKn ? copy.ui.plantEnvironmentSummary : 'Plant Environment Summary'}
        </span>
        
        <div className={styles.environmentalStrip}>
          
          {/* Water Node */}
          <div className={styles.envNode}>
            <div className={styles.envNodeHeader}>
              <span className="section-label" style={{ fontSize: '9.5px' }}>
                {isKn ? copy.ui.waterLevelLabel : 'Water Level'}
              </span>
              <Droplets size={14} style={{ color: 'var(--color-teal)' }} />
            </div>
            <div className={styles.envValueRow}>
              <span className={styles.envValue}>
                {userMode === 'technical' ? (isTelemetryAvailable ? `${Math.round(reading.waterLevel)}%` : '--') : farmerSemanticState.waterStatus}
              </span>
            </div>
            <div className={styles.envFooter}>
              <span>{farmerSemanticState.waterMessage}</span>
              <StatusBadge status={isTelemetryAvailable ? farmerSemanticState.waterStatus.toLowerCase() : 'unavailable'} size="sm" />
            </div>
          </div>

          {/* Nutrient Node */}
          <div className={styles.envNode}>
            <div className={styles.envNodeHeader}>
              <span className="section-label" style={{ fontSize: '9.5px' }}>
                {isKn ? copy.ui.nutrientLevelLabel : 'Nutrient Balance'}
              </span>
              <Sparkles size={14} style={{ color: 'var(--color-green)' }} />
            </div>
            <div className={styles.envValueRow}>
              <span className={styles.envValue}>
                {userMode === 'technical' ? (isTelemetryAvailable ? `${Math.round(reading.tds)} PPM` : '--') : farmerSemanticState.nutrientStatus}
              </span>
            </div>
            <div className={styles.envFooter}>
              <span>{farmerSemanticState.nutrientMessage}</span>
              <StatusBadge status={isTelemetryAvailable ? farmerSemanticState.nutrientStatus.toLowerCase() : 'unavailable'} size="sm" />
            </div>
          </div>

          {/* Acidity / pH Node */}
          <div className={styles.envNode}>
            <div className={styles.envNodeHeader}>
              <span className="section-label" style={{ fontSize: '9.5px' }}>
                {isKn ? copy.ui.solutionAcidityLabel : 'Solution Acidity'}
              </span>
              <FlaskConical size={14} style={{ color: 'var(--color-teal)' }} />
            </div>
            <div className={styles.envValueRow}>
              <span className={styles.envValue}>
                {userMode === 'technical' ? (isTelemetryAvailable ? `${reading.ph.toFixed(2)} pH` : '--') : farmerSemanticState.nutrientStatus}
              </span>
            </div>
            <div className={styles.envFooter}>
              <span>{userMode === 'technical' ? (isKn ? 'ಗುರಿ: 5.5 - 6.5 pH' : 'Target: 5.5 - 6.5 pH') : farmerSemanticState.nutrientMessage}</span>
              <StatusBadge status={isTelemetryAvailable ? farmerSemanticState.nutrientStatus.toLowerCase() : 'unavailable'} size="sm" />
            </div>
          </div>

          {/* Environment Status Node */}
          <div className={styles.envNode}>
            <div className={styles.envNodeHeader}>
              <span className="section-label" style={{ fontSize: '9.5px' }}>
                {isKn ? copy.ui.growingConditionsLabel : 'Growing Conditions'}
              </span>
              <Ruler size={14} style={{ color: 'var(--color-amber)' }} />
            </div>
            <div className={styles.envValueRow}>
              <span className={styles.envValue}>
                {farmerSemanticState.environmentStatus}
              </span>
            </div>
            <div className={styles.envFooter}>
              <span>{farmerSemanticState.environmentMessage}</span>
              <StatusBadge status={farmerSemanticState.environmentStatus.toLowerCase()} size="sm" />
            </div>
          </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. SUPPORTING: WHAT CHANGED TODAY? (Historical Deltas)        */}
      {/* ============================================================ */}
      <WhatChanged deltas={calculatedDeltas} hasHistory={history.length >= 5} language={language} />

      {/* ============================================================ */}
      {/* 7. ADVANCED: TECHNICAL MODE TELEMETRY & SERIAL (Conditional) */}
      {/* ============================================================ */}
      {userMode === 'technical' && (
        <div className={styles.instrumentationSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} style={{ color: 'var(--color-teal)' }} />
              <span className="section-label">{isKn ? 'ತಾಂತ್ರಿಕ ಟೆಲಿಮೆಟ್ರಿ ಮತ್ತು ಪ್ರೋಬ್ ಇತಿಹಾಸ' : 'Technical Telemetry Sparkline & Probe History'}</span>
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
              {isKn ? 'ESP32 ನಿಂದ ಸೀರಿಯಲ್ ಟೆಲಿಮೆಟ್ರಿ ಪ್ಯಾಕೆಟ್‌ಗಳಿಗಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ...' : 'Awaiting serial telemetry packets from ESP32...'}
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
      )}

    </div>
  );
}
