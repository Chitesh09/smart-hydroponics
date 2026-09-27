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
import { WhatChangedCard } from '@/components/ui/WhatChangedCard';
import { EnvironmentPlantCard } from '@/components/ui/EnvironmentPlantCard';
import { PlantEnvironmentGrid } from '@/components/ui/PlantEnvironmentGrid';
import { PlantAlertCard } from '@/components/ui/PlantAlertCard';
import { getFarmerCopy, getLocalizedLifecycleState } from '@/lib/intelligence/farmerSemanticLayer';

import styles from './page.module.css';

const DEFAULT_READING = { ph: 6.0, tds: 1000, waterLevel: 85, distance: 23.5, timestamp: 0 };

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const { mode, isStale, latestReading, history } = useESP32Serial();
  const {
    status: cameraStatus,
    errorMessage: cameraErrorMessage,
    videoRef,
    attachVideoElement,
    ensureCameraActive,
    isVideoReady,
    startCamera,
  } = useCamera();
  const {
    cropIdentity,
    plantProfile,
    digitalProfile,
    observations,
    latestDetection,
    latestVisualHealth,
    multimodalAssessment,
    activeRecommendations,
    farmerSemanticState,
    userMode,
    setUserMode,
    language,
    setLanguage,
    identifyCurrentPlant,
    isIdentifying,
    identificationResult,
    latestReasoningEvent,
    whatChangedSummary,
    correlationSummary,
    correlations,
    alertSummary,
    dismissAlert,
    acknowledgeAlert,
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

  const activeProfile = digitalProfile || plantProfile;

  const isPlantIdentified = Boolean(
    (activeProfile.species && activeProfile.species !== 'Unknown Plant' && activeProfile.species !== 'unknown_plant') ||
    (cropIdentity.commonName && cropIdentity.commonName !== 'Plant' && cropIdentity.commonName !== 'Unknown Plant' && cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.cropKey !== 'unclassified_plant')
  );
  const plantDisplayName = isPlantIdentified
    ? (activeProfile.commonName || activeProfile.species || cropIdentity.commonName)
    : (isKn ? 'ಗಿಡ' : 'Plant');
  const botanicalScientific = isPlantIdentified
    ? (activeProfile.scientificName || cropIdentity.scientificName || (isKn ? 'ವರ್ಗೀಕರಿಸದ ಪ್ರಭೇದ' : 'Species Unclassified'))
    : (isKn ? copy.ui.plantNotIdentified : 'Plant type not identified yet');

  const [ageDays, setAgeDays] = useState<number>(1);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeProfile.createdAt) {
        setAgeDays(Math.max(1, Math.round((Date.now() - activeProfile.createdAt) / 86400000) + 1));
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeProfile.createdAt]);



  // Restore camera stream when mounting or navigating back to Dashboard
  useEffect(() => {
    const isDesired = cameraStatus === 'connected' || (typeof window !== 'undefined' && sessionStorage.getItem('hydrosmart_camera_desired') === 'true');
    if (isDesired) {
      ensureCameraActive();
    }
  }, [cameraStatus, ensureCameraActive]);

  // Optical detection progression label
  const opticalProgression = useMemo(() => {
    if (cameraStatus === 'error') {
      return isKn ? 'ಕ್ಯಾಮೆರಾ ಲಭ್ಯವಿಲ್ಲ' : (cameraErrorMessage || 'Camera unavailable');
    }
    if (!isCameraActive) return isKn ? copy.ui.cameraOffline : 'Camera View Offline';
    if (!isVideoReady || !latestDetection) return isKn ? copy.camera.SCAN_NOT_READY : 'Camera is starting...';

    if (latestDetection.state === 'SCAN_NOT_READY') {
      return isKn ? copy.camera.SCAN_NOT_READY : (latestDetection.userMessage || 'Camera is starting...');
    }

    if (latestDetection.state === 'NO_PLANT_DETECTED' || !latestDetection.isPlantDetected) {
      return isKn ? copy.camera.NO_PLANT : (latestDetection.userMessage || copy.ui.noPlant);
    }

    if (latestDetection.state === 'LOW_CONFIDENCE') {
      return isKn ? copy.camera.LOW_CONFIDENCE : latestDetection.userMessage;
    }

    if (isPlantIdentified) {
      return isKn
        ? `ಗಿಡ ಪತ್ತೆಯಾಗಿದೆ · ${cropIdentity.commonName} (${cropIdentity.confidence}% ಹೊಂದಾಣಿಕೆ)`
        : `Plant Detected · ${cropIdentity.commonName} (${cropIdentity.confidence}% Match)`;
    }
    return isKn
      ? `ಗಿಡ ಪತ್ತೆಯಾಗಿದೆ · ಎಲೆಗಳ ವ್ಯಾಪ್ತಿ ${latestDetection.canopyCoveragePercent}%`
      : `Plant Detected · Canopy ${latestDetection.canopyCoveragePercent}%`;
  }, [cameraStatus, cameraErrorMessage, isCameraActive, isVideoReady, latestDetection, isPlantIdentified, cropIdentity.commonName, cropIdentity.confidence, isKn, copy]);

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
            ref={attachVideoElement}
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

                {latestDetection?.isPlantDetected && latestDetection.state === 'PLANT_DETECTED' && (
                  <button
                    onClick={() => identifyCurrentPlant()}
                    disabled={isIdentifying}
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-xs)',
                      background: isIdentifying ? 'rgba(234, 179, 8, 0.25)' : 'rgba(16, 185, 129, 0.25)',
                      color: isIdentifying ? 'var(--color-amber)' : 'var(--color-green)',
                      border: '1px solid var(--border-default)',
                      cursor: isIdentifying ? 'wait' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'var(--font-sans)',
                    }}
                  >
                    {isIdentifying
                      ? (isKn ? copy.ui.identifying : 'Identifying...')
                      : isPlantIdentified
                      ? `🌿 ${cropIdentity.commonName}`
                      : (isKn ? `🔍 ${copy.ui.identifySpeciesBtn}` : '🔍 Identify Species')}
                  </button>
                )}
              </div>

              {/* Technical Mode Diagnostics Banner */}
              {userMode === 'technical' && latestDetection && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '8px',
                    right: '8px',
                    padding: '6px 8px',
                    background: 'rgba(5, 19, 17, 0.92)',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid var(--border-default)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '9.5px',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '6px',
                    zIndex: 10,
                  }}
                >
                  <span>
                    STATE: <strong style={{ color: latestDetection.state === 'PLANT_DETECTED' ? 'var(--color-green)' : latestDetection.state === 'LOW_CONFIDENCE' ? 'var(--color-amber)' : 'var(--color-red)' }}>{latestDetection.state}</strong>
                  </span>
                  <span>·</span>
                  <span>SCORE: <strong style={{ color: 'var(--text-primary)' }}>{latestDetection.plantPresenceScore}/100</strong></span>
                  <span>·</span>
                  <span>HEALTH: <strong style={{ color: latestVisualHealth?.healthState === 'HEALTHY' ? 'var(--color-green)' : latestVisualHealth?.healthState === 'CRITICAL' ? 'var(--color-red)' : latestVisualHealth?.healthState === 'ATTENTION' ? 'var(--color-amber)' : 'var(--color-teal)' }}>{latestVisualHealth?.healthState ?? 'UNKNOWN'}</strong></span>
                  <span>·</span>
                  <span>CHLOR: <strong style={{ color: (latestVisualHealth?.chlorosisYellowPercent ?? 0) > 12 ? 'var(--color-amber)' : 'var(--text-primary)' }}>{latestVisualHealth?.chlorosisYellowPercent ?? 0}%</strong></span>
                  <span>·</span>
                  <span>NECR: <strong style={{ color: (latestVisualHealth?.necroticBrownPercent ?? 0) > 4 ? 'var(--color-red)' : 'var(--text-primary)' }}>{latestVisualHealth?.necroticBrownPercent ?? 0}%</strong></span>
                  {latestVisualHealth?.baselineDeltas && (
                    <>
                      <span>·</span>
                      <span>ΔCANOPY: <strong style={{ color: latestVisualHealth.baselineDeltas.canopyDeltaPercent >= 0 ? 'var(--color-green)' : 'var(--color-amber)' }}>{latestVisualHealth.baselineDeltas.canopyDeltaPercent > 0 ? '+' : ''}{latestVisualHealth.baselineDeltas.canopyDeltaPercent}%</strong></span>
                    </>
                  )}
                  <span>·</span>
                  <span>EDGE: <strong style={{ color: 'var(--text-primary)' }}>{latestDetection.diagnostics?.internalEdgeDensity ?? '--'}</strong></span>
                  <span>·</span>
                  <span>COH: <strong style={{ color: 'var(--text-primary)' }}>{latestDetection.diagnostics?.spatialCoherence ?? '--'}</strong></span>
                  <span>·</span>
                  <span>SKIN: <strong style={{ color: (latestDetection.diagnostics?.skinPercent ?? 0) > 3 ? 'var(--color-amber)' : 'var(--text-primary)' }}>{latestDetection.diagnostics?.skinPercent ?? 0}%</strong></span>
                  <span>·</span>
                  <span>SPECIES: <strong style={{ color: cropIdentity.confidence ? 'var(--color-green)' : 'var(--text-muted)' }}>{isPlantIdentified ? `${cropIdentity.commonName} (${cropIdentity.confidence}%)` : 'Pending'}</strong></span>
                  {identificationResult?.inferenceLatencyMs !== undefined && (
                    <>
                      <span>·</span>
                      <span>ML-LAT: <strong style={{ color: 'var(--color-teal)' }}>{identificationResult.inferenceLatencyMs}ms</strong></span>
                    </>
                  )}
                  {latestDetection.nonPlantRejectionReason && (
                    <div style={{ width: '100%', color: 'var(--color-amber)', marginTop: '2px', fontSize: '9px' }}>
                      REASON: {latestDetection.nonPlantRejectionReason}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={styles.cameraOfflinePlaceholder}>
              <span className="text-3xl font-bold font-mono text-slate-500 mb-2">×</span>
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
                <span className="font-bold">+</span>
                <span>{isKn ? copy.ui.startLiveCamera : 'Start Live Plant Camera'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Right: Botanical Identity & Current Plant Status */}
        <div className={styles.botanicalStateBlock}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-label">
                {isKn ? 'ಪರಿಶೀಲಿಸುತ್ತಿರುವ ಗಿಡ' : 'Monitored Specimen'}
              </span>
              <span className="scientific-meta" style={{ color: 'var(--color-green)', fontSize: '10px' }}>
                {isKn ? `ದಿನ ${ageDays}` : `Day ${ageDays}`} · {activeProfile.observationCount} {isKn ? 'ತಪಾಸಣೆ' : 'checks'}
              </span>
            </div>
            <div className={styles.speciesBlock} style={{ marginTop: '4px' }}>
              <div className={styles.commonName}>{plantDisplayName}</div>
              <div className={styles.scientificName}>{botanicalScientific}</div>
            </div>

            {observations.length === 0 && !isPlantIdentified && (
              <div style={{
                margin: '10px 0',
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(28, 167, 160, 0.08)',
                border: '1px solid rgba(28, 167, 160, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-teal)' }}>
                  {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ಗಿಡವನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿಲ್ಲ' : 'No plant is being monitored yet'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {isKn
                    ? 'ಕ್ಯಾಮೆರಾ ಮೂಲಕ ಗಿಡವನ್ನು ಗುರುತಿಸಿ ಅಥವಾ ಬೆಳೆ ಪ್ರೊಫೈಲ್ ಅನ್ನು ಕಾನ್ಫಿಗರ್ ಮಾಡಿ.'
                    : 'Prompt: Identify your plant via camera or assign identity to begin tracking.'}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <button
                    onClick={() => {
                      if (!isCameraActive) startCamera();
                      else identifyCurrentPlant();
                    }}
                    className="btn btn-secondary"
                    style={{ fontSize: '10.5px', padding: '4px 10px' }}
                  >
                    <span className="font-bold">+</span>
                    <span>{isKn ? 'ಕ್ಯಾಮೆರಾ ಮೂಲಕ ಗುರುತಿಸಿ' : 'Identify via Camera'}</span>
                  </button>
                  <Link
                    href="/dashboard/plants"
                    className="btn btn-secondary"
                    style={{ fontSize: '10.5px', padding: '4px 10px' }}
                  >
                    <span>{isKn ? 'ಪ್ರೊಫೈಲ್ ಹೊಂದಿಸಿ' : 'Assign Identity'}</span>
                  </Link>
                </div>
              </div>
            )}

            <div className={styles.stateRow} style={{ flexWrap: 'wrap', gap: '6px' }}>
              <StatusBadge status={farmerSemanticState.plantStatus.toLowerCase()} label={farmerSemanticState.visualHealthMessage || farmerSemanticState.plantMessage} size="md" />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-canvas)',
                  color: 'var(--color-green)',
                  border: '1px solid var(--border-default)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title={getLocalizedLifecycleState(activeProfile.lifecycleState || 'MONITORING', language)}
              >
                <span style={{ fontSize: '9px', fontWeight: 800 }}>◆</span>
                <span>{getLocalizedLifecycleState(activeProfile.lifecycleState || 'MONITORING', language)}</span>
              </span>
              {activeProfile.completeness && (
                <span
                  style={{
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)',
                    alignSelf: 'center',
                  }}
                  title={isKn ? `ಪ್ರೊಫೈಲ್ ಪೂರ್ಣತೆ: ${activeProfile.completeness.score}%` : `Profile Completeness: ${activeProfile.completeness.score}%`}
                >
                  {activeProfile.completeness.score}% {isKn ? 'ಪೂರ್ಣ' : 'complete'}
                </span>
              )}
              {isTelemetryAvailable && userMode === 'technical' && (
                <div className={styles.conditionScoreDisplay}>
                  <span className={styles.scoreNumber}>{multimodalAssessment.overallScore}</span>
                  <span className={styles.scoreOutOf}>/ 100</span>
                </div>
              )}
            </div>

            {userMode === 'technical' && (
              <div style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: '4px' }}>
                Specimen ID: <span style={{ color: 'var(--color-teal)' }}>{activeProfile.plantId === 'plant_primary' ? 'HS-01' : activeProfile.plantId}</span>
              </div>
            )}
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
            <span className="font-bold">→</span>
          </Link>
        </div>

      </div>

      {/* ============================================================ */}
      {/* 3. SECONDARY: PROMINENT "WHAT SHOULD I DO NOW?" SECTION       */}
      {/* ============================================================ */}
      <FarmerActionCard
        semanticState={farmerSemanticState}
        recommendations={activeRecommendations}
        reasoningEvent={latestReasoningEvent}
      />

      <PlantEnvironmentGrid 
        semanticState={farmerSemanticState}
        language={language}
      />

      {/* ============================================================ */}
      {/* 3B. LONGITUDINAL "WHAT CHANGED?" INTELLIGENCE                */}
      {/* ============================================================ */}
      <WhatChangedCard
        summary={whatChangedSummary}
        language={language}
        userMode={userMode}
        onUserModeChange={setUserMode}
      />

      {/* ============================================================ */}
      {/* 3C. ENVIRONMENT ↔ PLANT CORRELATION INTELLIGENCE (Phase 9)   */}
      {/* ============================================================ */}
      <EnvironmentPlantCard
        summary={correlationSummary}
        associations={correlations}
        language={language}
        userMode={userMode}
        onUserModeChange={setUserMode}
      />

      {/* ============================================================ */}
      {/* 4. CONFIDENCE-AWARE PLANT ALERTS & NOTIFICATIONS (Phase 10)  */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="section-label">
              {isKn ? 'ನಿಮ್ಮ ಗಮನ ಅಗತ್ಯವಿದೆ' : 'Needs Your Attention'}
            </span>
            {alertSummary.hasAnyAlert && (
              <span className="badge badge-amber" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                {alertSummary.activeAlerts.length} {isKn ? 'ಸಕ್ರಿಯ' : 'active'}
              </span>
            )}
          </div>
          <Link
            href="/dashboard/alerts"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-emerald-light)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>{isKn ? 'ಎಲ್ಲಾ ಎಚ್ಚರಿಕೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ' : 'View all alerts'}</span>
            <span className="font-bold">→</span>
          </Link>
        </div>

        {alertSummary.hasAnyAlert ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertSummary.activeAlerts.slice(0, 2).map(alert => (
              <PlantAlertCard
                key={alert.id}
                alert={alert}
                mode={userMode}
                language={language}
                onDismiss={dismissAlert}
                onAcknowledge={acknowledgeAlert}
              />
            ))}
            {alertSummary.activeAlerts.length > 2 && (
              <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                <Link
                  href="/dashboard/alerts"
                  className="btn btn-secondary"
                  style={{ fontSize: '12px', padding: '6px 14px' }}
                >
                  {isKn
                    ? `ಇನ್ನಷ್ಟು ${alertSummary.activeAlerts.length - 2} ಎಚ್ಚರಿಕೆಗಳನ್ನು ನೋಡಿ →`
                    : `See ${alertSummary.activeAlerts.length - 2} more active alerts →`}
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className={`${styles.attentionBanner} ${styles.attentionStable}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-green)', padding: '2px 6px', border: '1px solid var(--border-accent-green)', borderRadius: 'var(--radius-xs)', background: 'var(--bg-tint-green)' }}>
                OPTIMAL
              </span>
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
      </div>

      {/* ============================================================ */}
      {/* 6. ADVANCED: TECHNICAL MODE TELEMETRY & SERIAL (Conditional) */}
      {/* ============================================================ */}
      {userMode === 'technical' && (
        <div className={styles.instrumentationSection}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="text-teal-400 font-bold text-lg leading-none mt-[-2px]">~</span>
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
