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
  attachVideoElement: (el: HTMLVideoElement | null) => void;
  ensureCameraActive: () => Promise<boolean>;
  isVideoReady: boolean;
  startCamera: (deviceId?: string) => Promise<boolean>;
  stopCamera: () => void;
  captureFrame: () => string | null;
  switchDevice: (deviceId: string) => Promise<boolean>;
}

const CameraContext = createContext<CameraContextType | undefined>(undefined);

// Helper to determine if a media stream is active and has live video tracks
function isStreamLive(mediaStream: MediaStream | null): boolean {
  if (!mediaStream || !mediaStream.active) return false;
  const tracks = mediaStream.getVideoTracks();
  if (tracks.length === 0) return false;
  return tracks.every(track => track.readyState === 'live' && track.enabled);
}

export function CameraProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CameraStatus>('idle');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<CameraDevice[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVideoReady, setIsVideoReady] = useState<boolean>(false);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isUserDesiredRef = useRef<boolean>(false);

  // Initialize user desired state from sessionStorage on mount (survives client-side route transitions)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('hydrosmart_camera_desired') === 'true') {
          isUserDesiredRef.current = true;
        }
      } catch {}
    }
  }, []);

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

  // Helper to attach stream to a video element and trigger play
  const bindStreamToElement = useCallback((element: HTMLVideoElement, mediaStream: MediaStream) => {
    if (element.srcObject !== mediaStream) {
      element.srcObject = mediaStream;
    }
    element.play().catch(playErr => {
      console.warn('[CameraProvider] Video autoplay warning:', playErr);
    });
  }, []);

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    isUserDesiredRef.current = false;
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('hydrosmart_camera_desired');
      }
    } catch {}

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
    setIsVideoReady(false);
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
      streamRef.current = null;
    }

    setStatus('requesting');
    setIsVideoReady(false);
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
      isUserDesiredRef.current = true;
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('hydrosmart_camera_desired', 'true');
        }
      } catch {}

      if (videoRef.current) {
        bindStreamToElement(videoRef.current, mediaStream);
      }

      // Track active device ID and monitor track health
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.onended = () => {
          console.warn('[CameraProvider] Video track ended unexpectedly.');
          setIsVideoReady(false);
          setStatus('disconnected');
        };

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
      setIsVideoReady(false);
      
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
  }, [enumerateDevices, bindStreamToElement]);

  // Ensure camera is active, recovering stream if stale or re-binding if mounted
  const ensureCameraActive = useCallback(async (): Promise<boolean> => {
    // If we have a healthy, live stream:
    if (streamRef.current && isStreamLive(streamRef.current)) {
      if (videoRef.current) {
        bindStreamToElement(videoRef.current, streamRef.current);
        if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
          setIsVideoReady(true);
        }
      }
      setStatus('connected');
      return true;
    }

    // If stream is dead/null but camera was connected or desired:
    const desired = isUserDesiredRef.current || (typeof window !== 'undefined' && sessionStorage.getItem('hydrosmart_camera_desired') === 'true');
    if (status === 'connected' || desired) {
      return await startCamera(activeDeviceId || undefined);
    }

    return false;
  }, [status, activeDeviceId, startCamera, bindStreamToElement]);

  // Callback ref for mounting video element to guarantee immediate attachment and event handling
  const attachVideoElement = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;

    if (!element) {
      setIsVideoReady(false);
      return;
    }

    const checkReady = () => {
      if (element.videoWidth > 0 && element.videoHeight > 0 && !element.paused) {
        setIsVideoReady(true);
      }
    };

    element.addEventListener('loadedmetadata', checkReady);
    element.addEventListener('canplay', checkReady);
    element.addEventListener('playing', checkReady);

    // If stream is already live, immediately attach and play
    if (streamRef.current && isStreamLive(streamRef.current)) {
      bindStreamToElement(element, streamRef.current);
      checkReady();
    } else {
      const desired = isUserDesiredRef.current || (typeof window !== 'undefined' && sessionStorage.getItem('hydrosmart_camera_desired') === 'true');
      if (status === 'connected' || desired) {
        ensureCameraActive();
      }
    }
  }, [bindStreamToElement, ensureCameraActive, status]);

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
        streamRef.current = null;
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
        attachVideoElement,
        ensureCameraActive,
        isVideoReady,
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
