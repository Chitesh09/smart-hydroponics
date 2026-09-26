'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from './CameraContext';
import {
  detectPlantPresence,
  PlantDetectionResult,
  PlantPresenceState,
} from '@/lib/vision/plantDetector';
import {
  analyzeVisualPlantHealth,
  VisualHealthAnalysisResult,
} from '@/lib/vision/plantHealthAnalyzer';

interface UsePlantMonitorOptions {
  sampleIntervalMs?: number;
  autoScanDefault?: boolean;
}

export function usePlantMonitor({
  sampleIntervalMs = 1500,
  autoScanDefault = true,
}: UsePlantMonitorOptions = {}) {
  const { status: cameraStatus, videoRef } = useCamera();

  const [latestDetection, setLatestDetection] = useState<PlantDetectionResult | null>(null);
  const [latestVisualHealth, setLatestVisualHealth] = useState<VisualHealthAnalysisResult | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(autoScanDefault);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);

  // Multi-frame temporal smoothing window (5 frames)
  const stateHistoryRef = useRef<PlantPresenceState[]>([]);
  const presenceScoresRef = useRef<number[]>([]);
  const stabilizedStateRef = useRef<PlantPresenceState>('NO_PLANT_DETECTED');

  // Analyze single current frame immediately
  const analyzeNow = useCallback((): {
    detection: PlantDetectionResult;
    health: VisualHealthAnalysisResult;
  } | null => {
    if (!videoRef.current || cameraStatus !== 'connected') {
      return null;
    }

    const rawDetection = detectPlantPresence(videoRef.current);

    // Update temporal sliding window (max 5 frames)
    stateHistoryRef.current.push(rawDetection.state);
    presenceScoresRef.current.push(rawDetection.plantPresenceScore);
    if (stateHistoryRef.current.length > 5) {
      stateHistoryRef.current.shift();
      presenceScoresRef.current.shift();
    }

    const history = stateHistoryRef.current;
    const scores = presenceScoresRef.current;

    // Smoothed average presence score
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // Count votes in window
    const plantVotes = history.filter((s) => s === 'PLANT_DETECTED').length;
    const scanNotReadyVotes = history.filter((s) => s === 'SCAN_NOT_READY').length;
    const lowConfVotes = history.filter((s) => s === 'LOW_CONFIDENCE' || s === 'PLANT_DETECTED').length;

    let stabilizedState: PlantPresenceState = stabilizedStateRef.current;

    // 1. Scan Not Ready priority (if 2+ consecutive frames indicate optical issue)
    if (scanNotReadyVotes >= 2 && rawDetection.state === 'SCAN_NOT_READY') {
      stabilizedState = 'SCAN_NOT_READY';
    }
    // 2. Currently in PLANT_DETECTED state: require hysteresis to exit
    else if (stabilizedStateRef.current === 'PLANT_DETECTED') {
      // Need 3 or more negative frames to fall back
      const nonPlantConsecutive = history.slice(-3).every((s) => s !== 'PLANT_DETECTED');
      if (nonPlantConsecutive) {
        stabilizedState = lowConfVotes >= 2 ? 'LOW_CONFIDENCE' : 'NO_PLANT_DETECTED';
      } else {
        stabilizedState = 'PLANT_DETECTED';
      }
    }
    // 3. Not in PLANT_DETECTED state: require at least 3 positive frames to enter
    else {
      if (plantVotes >= 3) {
        stabilizedState = 'PLANT_DETECTED';
      } else if (lowConfVotes >= 2 || rawDetection.state === 'LOW_CONFIDENCE') {
        stabilizedState = 'LOW_CONFIDENCE';
      } else {
        stabilizedState = 'NO_PLANT_DETECTED';
      }
    }

    stabilizedStateRef.current = stabilizedState;
    const isPlantDetected = stabilizedState === 'PLANT_DETECTED';

    let userMessage = rawDetection.userMessage;
    let statusText = rawDetection.statusText;

    if (stabilizedState === 'PLANT_DETECTED') {
      userMessage = 'Plant detected 🌱';
      statusText = `Plant detected (${avgScore}% presence score, ${rawDetection.canopyCoveragePercent}% canopy)`;
    } else if (stabilizedState === 'SCAN_NOT_READY') {
      userMessage = rawDetection.userMessage;
      statusText = rawDetection.statusText;
    } else if (stabilizedState === 'LOW_CONFIDENCE') {
      userMessage = rawDetection.userMessage || 'We can see something that may be a plant. Try moving closer.';
      statusText = `Low confidence plant detection (${avgScore}% presence score)`;
    } else {
      userMessage = rawDetection.isHumanPresent && !rawDetection.diagnostics?.independentPlantClusterFound
        ? 'No plant detected. Move clear of camera view or place plant in front.'
        : 'No plant detected. Place the plant in front of the camera.';
      statusText = rawDetection.statusText;
    }

    const smoothedDetection: PlantDetectionResult = {
      ...rawDetection,
      state: stabilizedState,
      isPlantDetected,
      plantPresenceScore: isPlantDetected ? Math.max(50, avgScore) : Math.min(48, avgScore),
      confidence: isPlantDetected ? Math.max(50, avgScore) : Math.min(48, avgScore),
      confidenceLevel:
        stabilizedState === 'PLANT_DETECTED'
          ? avgScore >= 75
            ? 'high'
            : 'medium'
          : stabilizedState === 'LOW_CONFIDENCE'
            ? 'low'
            : 'none',
      statusText,
      userMessage,
      // Suppress bounding box if not stably confirmed plant
      boundingBox: isPlantDetected ? rawDetection.boundingBox : undefined,
    };

    // Gate Visual Health Analysis: ONLY run on confirmed plant presence
    let health: VisualHealthAnalysisResult;
    if (isPlantDetected) {
      health = analyzeVisualPlantHealth(videoRef.current, {
        skipPresenceGate: true // Already verified by presence detector above
      });
    } else {
      health = {
        visualHealthScore: 0,
        healthState: 'UNKNOWN',
        legacyHealthState: 'unknown',
        qualitativeConfidence: 'unknown',
        breakdown: {
          colorConditionScore: 0,
          surfaceUniformityScore: 0,
          canopyVigorScore: 0,
          anomalyPenaltyScore: 0,
        },
        indicators: [],
        vibrantGreenPercent: 0,
        chlorosisYellowPercent: 0,
        necroticBrownPercent: 0,
        canopyCoveragePercent: 0,
        avgTextureGradient: 0,
        aspectRatio: 1.0,
        canopyDensity: 0,
        inferenceTimeMs: 0,
        timestamp: Date.now(),
        statusText: 'Visual health analysis paused — No plant detected in frame',
        nonPlantRejectionReason: rawDetection.nonPlantRejectionReason,
      };
    }

    setLatestDetection(smoothedDetection);
    setLatestVisualHealth(health);
    setLastScanTime(Date.now());

    return {
      detection: smoothedDetection,
      health,
    };
  }, [cameraStatus, videoRef]);

  // Periodic sampling loop
  useEffect(() => {
    if (cameraStatus !== 'connected' || !isScanning) {
      return;
    }

    // Run initial frame scan immediately upon connection
    analyzeNow();

    const interval = setInterval(() => {
      analyzeNow();
    }, sampleIntervalMs);

    return () => clearInterval(interval);
  }, [cameraStatus, isScanning, sampleIntervalMs, analyzeNow]);

  // Reset state on camera disconnect
  useEffect(() => {
    if (cameraStatus !== 'connected') {
      const timer = setTimeout(() => {
        setLatestDetection(null);
        setLatestVisualHealth(null);
        stateHistoryRef.current = [];
        presenceScoresRef.current = [];
        stabilizedStateRef.current = 'NO_PLANT_DETECTED';
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [cameraStatus]);

  return {
    latestDetection,
    latestVisualHealth,
    isScanning,
    setIsScanning,
    lastScanTime,
    analyzeNow,
  };
}
