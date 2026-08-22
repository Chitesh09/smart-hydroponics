'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useCamera } from './CameraContext';
import { detectPlantPresence, PlantDetectionResult } from '@/lib/vision/plantDetector';

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
  const [isScanning, setIsScanning] = useState<boolean>(autoScanDefault);
  const [lastScanTime, setLastScanTime] = useState<number | null>(null);

  // Temporal smoothing window to prevent single-frame flickering
  const historyWindowRef = useRef<boolean[]>([]);

  // Analyze single current frame immediately
  const analyzeNow = useCallback((): PlantDetectionResult | null => {
    if (!videoRef.current || cameraStatus !== 'connected') {
      return null;
    }

    const result = detectPlantPresence(videoRef.current);
    
    // Apply temporal smoothing (rolling window of 3 frames)
    historyWindowRef.current.push(result.isPlantDetected);
    if (historyWindowRef.current.length > 3) {
      historyWindowRef.current.shift();
    }

    // Stabilized detection decision
    const positiveVotes = historyWindowRef.current.filter(Boolean).length;
    const stabilizedDetected = positiveVotes >= 2;

    const smoothedResult: PlantDetectionResult = {
      ...result,
      isPlantDetected: stabilizedDetected,
    };

    setLatestDetection(smoothedResult);
    setLastScanTime(Date.now());
    return smoothedResult;
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
        historyWindowRef.current = [];
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [cameraStatus]);

  return {
    latestDetection,
    isScanning,
    setIsScanning,
    lastScanTime,
    analyzeNow,
  };
}
