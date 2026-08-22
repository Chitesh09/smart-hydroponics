'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CameraStatus, CameraDevice } from '@/lib/intelligence/types';

interface CameraContextType {
  status: CameraStatus;
  stream: MediaStream | null;
  activeDeviceId: string | null;
  availableDevices: CameraDevice[];
  errorMessage: string | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: (deviceId?: string) => Promise<boolean>;
  stopCamera: () => void;
  captureFrame: () => string | null;
  switchDevice: (deviceId: string) => Promise<boolean>;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<CameraDevice[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Enumerate video input devices safely
  const enumerateDevices = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices
        .filter(d => d.kind === 'videoinput')
        .map((d, idx) => ({
          deviceId: d.deviceId || `device_${idx}`,
          label: d.label || `Camera ${idx + 1}`
        }));
      setAvailableDevices(videoInputs);
    } catch (_err) {
      console.warn('[CameraProvider] Unable to enumerate devices:', _err);
    }
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStream(null);
    setStatus('disconnected');
  }, []);

  // Start camera with requested or default deviceId
  const startCamera = useCallback(async (targetDeviceId?: string): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      setErrorMessage('Webcam access is not supported in this browser environment.');
      return false;
    }

    // Stop existing stream first if active
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setStatus('requesting');
    setErrorMessage(null);

    const constraints: MediaStreamConstraints = {
      video: targetDeviceId 
        ? { deviceId: { exact: targetDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(playErr => {
          console.warn('[CameraProvider] Video autoplay warning:', playErr);
        });
      }

      // Track active device ID
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        const settings = videoTrack.getSettings();
        if (settings.deviceId) {
          setActiveDeviceId(settings.deviceId);
        }
      }

      setStatus('connected');
      await enumerateDevices();
      return true;
    } catch (err: unknown) {
      const errObj = err as Error;
      setStatus('error');
      
      if (errObj.name === 'NotAllowedError' || errObj.name === 'PermissionDeniedError') {
        setErrorMessage('Camera permission was denied. Please grant webcam permission in your browser address bar.');
      } else if (errObj.name === 'NotFoundError' || errObj.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera device detected on this workstation.');
      } else if (errObj.name === 'NotReadableError' || errObj.name === 'TrackStartError') {
        setErrorMessage('Camera is currently in use by another application or tab.');
      } else {
        setErrorMessage(`Camera error: ${errObj.message || 'Failed to start video stream.'}`);
      }
      console.error('[CameraProvider] Start error:', err);
      return false;
    }
  }, [enumerateDevices]);

  // Switch camera device
  const switchDevice = useCallback(async (deviceId: string): Promise<boolean> => {
    setActiveDeviceId(deviceId);
    return await startCamera(deviceId);
  }, [startCamera]);

  // Capture high resolution snapshot to data URL
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || status !== 'connected') {
      return null;
    }

    const video = videoRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      return null;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      return dataUrl;
    } catch (err) {
      console.error('[CameraProvider] Snapshot capture error:', err);
      return null;
    }
  }, [status]);

  // Cleanup on provider unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  return (
    <CameraContext.Provider
      value={{
        status,
        stream,
        activeDeviceId,
        availableDevices,
        errorMessage,
        videoRef,
        startCamera,
        stopCamera,
        captureFrame,
        switchDevice
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  const context = useContext(CameraContext);
  if (context === undefined) {
    throw new Error('useCamera must be used within a CameraProvider');
  }
  return context;
}
