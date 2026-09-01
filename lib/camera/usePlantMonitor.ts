'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from './CameraContext';
import { detectPlantPresence, PlantDetectionResult } from '@/lib/vision/plantDetector';
import { analyzeVisualPlantHealth, VisualHealthAnalysisResult } from '@/lib/vision/plantHealthAnalyzer';

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

  // Temporal smoothing window (5 frames) to prevent single-frame glitches/flickering
  const historyWindowRef = useRef<boolean[]>([]);
  const presenceScoresRef = useRef<number[]>([]);

  // Analyze single current frame immediately
  const analyzeNow = useCallback((): {
    detection: PlantDetectionResult;
    health: VisualHealthAnalysisResult;
  } | null => {
    if (!videoRef.current || cameraStatus !== 'connected') {
      return null;
    }

    const rawDetection = detectPlantPresence(videoRef.current);
    
    // Apply temporal smoothing (rolling window of 5 frames)
    historyWindowRef.current.push(rawDetection.isPlantDetected);
    presenceScoresRef.current.push(rawDetection.plantPresenceScore);
    if (historyWindowRef.current.length > 5) {
      historyWindowRef.current.shift();
      presenceScoresRef.current.shift();
    }

    // Stabilized detection decision (At least 3 positive frames out of 5)
    const positiveVotes = historyWindowRef.current.filter(Boolean).length;
    const stabilizedDetected = positiveVotes >= 3;

    // Smoothed average presence score
    const avgScore = Math.round(
      presenceScoresRef.current.reduce((a, b) => a + b, 0) / presenceScoresRef.current.length
    );

    const smoothedDetection: PlantDetectionResult = {
      ...rawDetection,
      isPlantDetected: stabilizedDetected,
      plantPresenceScore: stabilizedDetected ? Math.max(50, avgScore) : Math.min(45, avgScore),
      confidence: stabilizedDetected ? Math.max(50, avgScore) : Math.min(45, avgScore),
      statusText: stabilizedDetected
        ? `Plant detected (${avgScore}% presence score, ${rawDetection.canopyCoveragePercent}% canopy)`
        : rawDetection.isHumanPresent
          ? 'No plant detected — Human subject present'
          : rawDetection.nonPlantRejectionReason
            ? `No plant detected — ${rawDetection.nonPlantRejectionReason}`
            : 'No plant detected in camera frame',
    };

    // Gate Visual Health Analysis: ONLY run on confirmed plant presence
    let health: VisualHealthAnalysisResult;
    if (stabilizedDetected) {
      health = analyzeVisualPlantHealth(videoRef.current);
    } else {
      health = {
        visualHealthScore: 0,
        healthState: 'unknown',
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
        inferenceTimeMs: 0,
        timestamp: Date.now(),
        statusText: 'Visual health analysis paused — No plant detected in frame',
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
        historyWindowRef.current = [];
        presenceScoresRef.current = [];
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
