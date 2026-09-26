'use client';

// ============================================================
// HydroSmart — ESP32 Serial & IoT Device Management Context
// Production Telemetry Pipeline, Heartbeat & Calibration Engine
// Phase 11: Sensor Calibration, Data Quality & Noise Filtering
// ============================================================

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  IoTDevice,
  SensorHealthStatus,
  DeviceCalibrationConfig,
  TelemetryLogEvent,
  SensorQualityStatus,
  SensorDataSource,
} from '@/lib/device/types';
import {
  validateAndSanitizePacket,
  evaluateSensorHealth,
  calculateDeviceHealthScore,
} from '@/lib/device/telemetryValidator';
import {
  SensorCalibrationProfile,
  DEFAULT_SENSOR_CALIBRATION_PROFILE,
  loadSensorCalibrationProfile,
  saveSensorCalibrationProfile,
  calibratePhTwoPoint,
  calibratePhSinglePoint,
  calibrateTdsReference,
  calibrateUltrasonic,
  CalibrationPoint,
  applyMovingMedianFilter,
  detectSensorNoise,
} from '@/lib/device/sensorCalibration';

// Unified Sensor Reading Interface with Raw vs Calibrated Separation
export interface MetricTelemetry {
  raw: number;
  calibrated: number;
  filtered: number;
  quality: SensorQualityStatus;
}

export interface SensorReading {
  waterLevel: number;
  distance: number;
  ph: number;
  tds: number;
  timestamp: number;

  // Phase 11 Enhancements:
  source?: SensorDataSource;
  rawPh?: number;
  rawTds?: number;
  rawDistance?: number;
  rawWaterLevel?: number;
  quality?: Record<'ph' | 'tds' | 'waterLevel' | 'distance', SensorQualityStatus>;
  overallQuality?: SensorQualityStatus;
  metrics?: {
    ph: MetricTelemetry;
    tds: MetricTelemetry;
    waterLevel: MetricTelemetry;
    distance: MetricTelemetry;
  };
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

interface SerialPort {
  readable: {
    pipeTo(writable: WritableStream<string>): Promise<void>;
  };
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  getInfo?(): { usbVendorId?: number; usbProductId?: number };
}

interface ESP32SerialContextType {
  supported: boolean;
  mode: 'real' | 'simulation';
  connectionState: ConnectionState;
  isStale: boolean;
  latestReading: SensorReading | null;
  lastUpdateTime: number | null;
  history: SensorReading[];
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  setMode: (mode: 'real' | 'simulation') => void;

  // IoT Device Management
  devices: IoTDevice[];
  activeDeviceId: string;
  activeDevice: IoTDevice;
  sensorHealth: Record<'ph' | 'tds' | 'ultrasonic' | 'temperature', SensorHealthStatus>;
  deviceHealthScore: number;

  // Legacy Calibration Compatibility
  calibration: DeviceCalibrationConfig;
  updateCalibration: (newConfig: Partial<DeviceCalibrationConfig>) => void;
  resetCalibration: () => void;

  // Phase 11 Calibration & Quality Actions
  calibrationProfile: SensorCalibrationProfile;
  calibratePh2Point: (p1: CalibrationPoint, p2: CalibrationPoint) => { success: boolean; error?: string };
  calibratePh1Point: (p: CalibrationPoint) => { success: boolean; error?: string };
  calibrateTds: (rawTds: number, refTds: number) => { success: boolean; error?: string };
  calibrateUltrasonicReservoir: (fullCm: number, emptyCm: number, minCm?: number, maxCm?: number) => { success: boolean; error?: string };
  resetSensorCalibration: (sensorKey?: 'ph' | 'tds' | 'ultrasonic' | 'all') => void;

  renameDevice: (deviceId: string, newName: string) => void;
  telemetryLogs: TelemetryLogEvent[];
  addTelemetryLog: (type: 'info' | 'warning' | 'error' | 'success', event: string, details?: string) => void;
  clearLogs: () => void;
}

const ESP32SerialContext = createContext<ESP32SerialContextType | undefined>(undefined);

export function ESP32SerialProvider({ children }: { children: React.ReactNode }) {
  const [supported] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'serial' in navigator;
  });
  const [mode, setModeState] = useState<'real' | 'simulation'>('simulation');
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [latestReading, setLatestReading] = useState<SensorReading | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modern Calibration Profile State
  const [calibrationProfile, setCalibrationProfile] = useState<SensorCalibrationProfile>(() => {
    return loadSensorCalibrationProfile();
  });
  const calibrationProfileRef = useRef<SensorCalibrationProfile>(calibrationProfile);

  // Keep ref in sync
  useEffect(() => {
    calibrationProfileRef.current = calibrationProfile;
    saveSensorCalibrationProfile(calibrationProfile);
  }, [calibrationProfile]);

  // Rolling sample buffers for noise detection & filtering (window size = 5)
  const phWindowRef = useRef<number[]>([]);
  const tdsWindowRef = useRef<number[]>([]);
  const distWindowRef = useRef<number[]>([]);

  // Synthesize legacy DeviceCalibrationConfig for backward compatibility
  const calibration = useMemo<DeviceCalibrationConfig>(() => ({
    phOffset: calibrationProfile.ph.offset,
    phSlopeMultiplier: calibrationProfile.ph.slope,
    tdsCalibrationFactor: calibrationProfile.tds.factor,
    ultrasonicEmptyDistanceCm: calibrationProfile.ultrasonic.emptyDistanceCm,
    ultrasonicFullDistanceCm: calibrationProfile.ultrasonic.fullDistanceCm,
    heartbeatTimeoutMs: calibrationProfile.heartbeatTimeoutMs,
  }), [calibrationProfile]);

  const [history, setHistory] = useState<SensorReading[]>(() => {
    const initialHistory: SensorReading[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const time = now - i * 2000;
      const phVal = parseFloat((6.0 + Math.sin(i * 0.2) * 0.1 + (i % 5) * 0.01).toFixed(2));
      const tdsVal = parseFloat((1000 - i * 2 + (i % 10)).toFixed(1));
      const wlVal = parseFloat((85.0 - i * 0.05).toFixed(1));
      const distVal = parseFloat((100.0 - (85.0 - i * 0.05) * 0.9).toFixed(2));
      initialHistory.push({
        ph: phVal,
        tds: tdsVal,
        waterLevel: wlVal,
        distance: distVal,
        timestamp: time,
        source: 'simulated',
        rawPh: phVal,
        rawTds: tdsVal,
        rawDistance: distVal,
        rawWaterLevel: wlVal,
        quality: { ph: 'UNCALIBRATED', tds: 'UNCALIBRATED', waterLevel: 'UNCALIBRATED', distance: 'UNCALIBRATED' },
        overallQuality: 'UNCALIBRATED',
      });
    }
    return initialHistory;
  });

  // IoT Devices Registry
  const [devices, setDevices] = useState<IoTDevice[]>(() => {
    const defaultStation: IoTDevice = {
      deviceId: 'HS-ESP32-001',
      name: 'Hydroponic Station 1 (Primary ESP32)',
      firmwareVersion: 'v1.2.4-prod',
      status: 'offline',
      lastSeen: 0,
      lastHeartbeat: 0,
      stationAssignment: 'Bay 1 · Main Reservoir',
      baudRate: 115200,
      healthScore: 92,
      packetsReceived: 0,
      packetsCorrupted: 0,
    };
    return [defaultStation];
  });
  const activeDeviceId = 'HS-ESP32-001';

  // Telemetry Event Log Stream
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLogEvent[]>(() => [
    {
      id: 'log_init_0',
      timestamp: Date.now(),
      type: 'info',
      event: 'IoT Telemetry Pipeline Initialized',
      details: 'Strict physical boundary checking, noise filtering, and heartbeat watcher active.',
      deviceId: 'HS-ESP32-001',
    },
  ]);

  // References
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const keepReadingRef = useRef(false);
  const lastUpdateRef = useRef<number | null>(null);
  const lastHeartbeatRef = useRef<number>(0);

  // Add Log Entry Helper
  const addTelemetryLog = useCallback((
    type: 'info' | 'warning' | 'error' | 'success',
    event: string,
    details?: string
  ) => {
    const newLog: TelemetryLogEvent = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      type,
      event,
      details,
      deviceId: activeDeviceId,
    };
    setTelemetryLogs((prev) => [newLog, ...prev].slice(0, 50));
  }, [activeDeviceId]);

  const clearLogs = useCallback(() => {
    setTelemetryLogs([]);
  }, []);

  // Update Calibration & Persist
  const updateCalibration = useCallback((newConfig: Partial<DeviceCalibrationConfig>) => {
    setCalibrationProfile((prev) => {
      const next: SensorCalibrationProfile = {
        ...prev,
        ph: {
          ...prev.ph,
          offset: newConfig.phOffset !== undefined ? newConfig.phOffset : prev.ph.offset,
          slope: newConfig.phSlopeMultiplier !== undefined ? newConfig.phSlopeMultiplier : prev.ph.slope,
          status: 'CALIBRATED',
        },
        tds: {
          ...prev.tds,
          factor: newConfig.tdsCalibrationFactor !== undefined ? newConfig.tdsCalibrationFactor : prev.tds.factor,
          status: 'CALIBRATED',
        },
        ultrasonic: {
          ...prev.ultrasonic,
          emptyDistanceCm: newConfig.ultrasonicEmptyDistanceCm !== undefined ? newConfig.ultrasonicEmptyDistanceCm : prev.ultrasonic.emptyDistanceCm,
          fullDistanceCm: newConfig.ultrasonicFullDistanceCm !== undefined ? newConfig.ultrasonicFullDistanceCm : prev.ultrasonic.fullDistanceCm,
          status: 'CALIBRATED',
        },
        heartbeatTimeoutMs: newConfig.heartbeatTimeoutMs !== undefined ? newConfig.heartbeatTimeoutMs : prev.heartbeatTimeoutMs,
        updatedAt: Date.now(),
      };
      saveSensorCalibrationProfile(next);
      return next;
    });
    addTelemetryLog('info', 'Calibration Parameters Updated', 'Sensor slope and offset coefficients persisted.');
  }, [addTelemetryLog]);

  const resetCalibration = useCallback(() => {
    setCalibrationProfile(DEFAULT_SENSOR_CALIBRATION_PROFILE);
    saveSensorCalibrationProfile(DEFAULT_SENSOR_CALIBRATION_PROFILE);
    addTelemetryLog('info', 'Calibration Reset to Factory Defaults');
  }, [addTelemetryLog]);

  // Phase 11 Explicit Calibration Functions
  const calibratePh2Point = useCallback((p1: CalibrationPoint, p2: CalibrationPoint) => {
    const res = calibratePhTwoPoint(p1, p2);
    if (res.status === 'CALIBRATION_INVALID') {
      addTelemetryLog('error', 'pH 2-Point Calibration Failed', res.error);
      return { success: false, error: res.error };
    }
    setCalibrationProfile((prev) => {
      const next: SensorCalibrationProfile = {
        ...prev,
        ph: {
          ...prev.ph,
          status: 'CALIBRATED',
          method: 'two_point',
          slope: res.slope,
          offset: res.offset,
          point1: p1,
          point2: p2,
          lastCalibratedAt: Date.now(),
          version: (prev.ph.version || 1) + 1,
        },
        updatedAt: Date.now(),
      };
      saveSensorCalibrationProfile(next);
      return next;
    });
    addTelemetryLog('success', 'pH 2-Point Calibrated', `Slope: ${res.slope}, Offset: ${res.offset}`);
    return { success: true };
  }, [addTelemetryLog]);

  const calibratePh1Point = useCallback((p: CalibrationPoint) => {
    const res = calibratePhSinglePoint(p);
    if (res.status === 'CALIBRATION_INVALID') {
      addTelemetryLog('error', 'pH 1-Point Calibration Failed', res.error);
      return { success: false, error: res.error };
    }
    setCalibrationProfile((prev) => {
      const next: SensorCalibrationProfile = {
        ...prev,
        ph: {
          ...prev.ph,
          status: 'CALIBRATED',
          method: 'single_point',
          slope: res.slope,
          offset: res.offset,
          point1: p,
          lastCalibratedAt: Date.now(),
          version: (prev.ph.version || 1) + 1,
        },
        updatedAt: Date.now(),
      };
      saveSensorCalibrationProfile(next);
      return next;
    });
    addTelemetryLog('success', 'pH Single-Point Offset Calibrated', `Offset: ${res.offset}`);
    return { success: true };
  }, [addTelemetryLog]);

  const calibrateTds = useCallback((rawTds: number, refTds: number) => {
    const res = calibrateTdsReference(rawTds, refTds);
    if (res.status === 'CALIBRATION_INVALID') {
      addTelemetryLog('error', 'TDS Reference Calibration Failed', res.error);
      return { success: false, error: res.error };
    }
    setCalibrationProfile((prev) => {
      const next: SensorCalibrationProfile = {
        ...prev,
        tds: {
          ...prev.tds,
          status: 'CALIBRATED',
          method: 'reference_solution',
          factor: res.factor,
          referenceValue: refTds,
          measuredRaw: rawTds,
          lastCalibratedAt: Date.now(),
          version: (prev.tds.version || 1) + 1,
        },
        updatedAt: Date.now(),
      };
      saveSensorCalibrationProfile(next);
      return next;
    });
    addTelemetryLog('success', 'TDS Calibrated against Reference Standard', `Factor: ${res.factor}`);
    return { success: true };
  }, [addTelemetryLog]);

  const calibrateUltrasonicReservoir = useCallback((
    fullDist: number,
    emptyDist: number,
    minValid: number = 5.0,
    maxValid: number = 120.0
  ) => {
    const res = calibrateUltrasonic(fullDist, emptyDist, minValid, maxValid);
    if (res.status === 'CALIBRATION_INVALID') {
      addTelemetryLog('error', 'Ultrasonic Calibration Failed', res.error);
      return { success: false, error: res.error };
    }
    setCalibrationProfile((prev) => {
      const next: SensorCalibrationProfile = {
        ...prev,
        ultrasonic: {
          ...prev.ultrasonic,
          status: 'CALIBRATED',
          fullDistanceCm: fullDist,
          emptyDistanceCm: emptyDist,
          minValidDistanceCm: minValid,
          maxValidDistanceCm: maxValid,
          lastCalibratedAt: Date.now(),
          version: (prev.ultrasonic.version || 1) + 1,
        },
        updatedAt: Date.now(),
      };
      saveSensorCalibrationProfile(next);
      return next;
    });
    addTelemetryLog('success', 'Ultrasonic Reservoir Dimensions Calibrated', `Full: ${fullDist}cm, Empty: ${emptyDist}cm`);
    return { success: true };
  }, [addTelemetryLog]);

  const resetSensorCalibration = useCallback((sensorKey: 'ph' | 'tds' | 'ultrasonic' | 'all' = 'all') => {
    setCalibrationProfile((prev) => {
      let next: SensorCalibrationProfile;
      if (sensorKey === 'ph') {
        next = { ...prev, ph: DEFAULT_SENSOR_CALIBRATION_PROFILE.ph, updatedAt: Date.now() };
      } else if (sensorKey === 'tds') {
        next = { ...prev, tds: DEFAULT_SENSOR_CALIBRATION_PROFILE.tds, updatedAt: Date.now() };
      } else if (sensorKey === 'ultrasonic') {
        next = { ...prev, ultrasonic: DEFAULT_SENSOR_CALIBRATION_PROFILE.ultrasonic, updatedAt: Date.now() };
      } else {
        next = DEFAULT_SENSOR_CALIBRATION_PROFILE;
      }
      saveSensorCalibrationProfile(next);
      return next;
    });
    addTelemetryLog('info', `Sensor Calibration Reset: ${sensorKey.toUpperCase()}`);
  }, [addTelemetryLog]);

  const renameDevice = useCallback((deviceId: string, newName: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.deviceId === deviceId ? { ...d, name: newName } : d))
    );
    addTelemetryLog('info', 'Device Renamed', `Device ${deviceId} name changed to: ${newName}`);
  }, [addTelemetryLog]);

  // 1. Heartbeat & Freshness Monitor
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeoutThreshold = calibrationProfile.heartbeatTimeoutMs || 5000;

      if (connectionState === 'connected' || mode === 'real') {
        const timeSinceLastData = lastUpdateRef.current ? now - lastUpdateRef.current : Infinity;
        const timeSinceLastHb = now - lastHeartbeatRef.current;

        if (timeSinceLastData > timeoutThreshold && timeSinceLastHb > timeoutThreshold) {
          setIsStale(true);
          setDevices((prev) =>
            prev.map((d) =>
              d.deviceId === activeDeviceId ? { ...d, status: 'offline' } : d
            )
          );
        } else {
          setIsStale(false);
          setDevices((prev) =>
            prev.map((d) =>
              d.deviceId === activeDeviceId ? { ...d, status: 'online', lastSeen: now } : d
            )
          );
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionState, mode, calibrationProfile.heartbeatTimeoutMs, activeDeviceId]);

  // 2. Simulated Polling Loop with Filtering & Quality Tagging
  useEffect(() => {
    if (mode !== 'simulation') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const mockRawObj = {
        ph: parseFloat((6.05 + Math.sin(now / 15000) * 0.15 + (Math.random() - 0.5) * 0.03).toFixed(2)),
        tds: parseFloat((980 + Math.cos(now / 20000) * 40 + (Math.random() - 0.5) * 10).toFixed(1)),
        distance: parseFloat((21.0 + Math.sin(now / 30000) * 1.5).toFixed(2)),
        waterLevel: parseFloat((82.0 + Math.cos(now / 30000) * 2.0).toFixed(1)),
      };

      const validation = validateAndSanitizePacket(JSON.stringify(mockRawObj), calibrationProfileRef.current);
      if (validation.isValid && validation.sanitizedReading) {
        const r = validation.sanitizedReading;
        const raw = validation.rawReading || mockRawObj;

        // Apply moving median filtering to simulated readings
        phWindowRef.current = [...phWindowRef.current, r.ph ?? 6.0].slice(-5);
        tdsWindowRef.current = [...tdsWindowRef.current, r.tds ?? 980].slice(-5);
        distWindowRef.current = [...distWindowRef.current, r.distance ?? 21.0].slice(-5);

        const filteredPh = applyMovingMedianFilter(phWindowRef.current);
        const filteredTds = applyMovingMedianFilter(tdsWindowRef.current);
        const filteredDist = applyMovingMedianFilter(distWindowRef.current);

        const isPhNoisy = detectSensorNoise(phWindowRef.current, 0.25);
        const isTdsNoisy = detectSensorNoise(tdsWindowRef.current, 50.0);
        const isDistNoisy = detectSensorNoise(distWindowRef.current, 4.0);

        const qualityObj: Record<'ph' | 'tds' | 'waterLevel' | 'distance', SensorQualityStatus> = {
          ph: isPhNoisy ? 'NOISY' : (validation.quality?.ph || 'VALID'),
          tds: isTdsNoisy ? 'NOISY' : (validation.quality?.tds || 'VALID'),
          waterLevel: isDistNoisy ? 'NOISY' : (validation.quality?.waterLevel || 'VALID'),
          distance: isDistNoisy ? 'NOISY' : (validation.quality?.distance || 'VALID'),
        };

        const reading: SensorReading = {
          ph: filteredPh,
          tds: filteredTds,
          waterLevel: r.waterLevel ?? 82,
          distance: filteredDist,
          timestamp: now,
          source: 'simulated', // Strictly identified as simulated
          rawPh: raw.ph,
          rawTds: raw.tds,
          rawDistance: raw.distance,
          rawWaterLevel: raw.waterLevel,
          quality: qualityObj,
          overallQuality: qualityObj.ph === 'NOISY' || qualityObj.tds === 'NOISY' ? 'NOISY' : 'VALID',
          metrics: {
            ph: { raw: raw.ph ?? 6.0, calibrated: r.ph ?? 6.0, filtered: filteredPh, quality: qualityObj.ph },
            tds: { raw: raw.tds ?? 980, calibrated: r.tds ?? 980, filtered: filteredTds, quality: qualityObj.tds },
            waterLevel: { raw: raw.waterLevel ?? 82, calibrated: r.waterLevel ?? 82, filtered: r.waterLevel ?? 82, quality: qualityObj.waterLevel },
            distance: { raw: raw.distance ?? 21.0, calibrated: r.distance ?? 21.0, filtered: filteredDist, quality: qualityObj.distance },
          },
        };

        setLatestReading(reading);
        setLastUpdateTime(now);
        lastUpdateRef.current = now;
        lastHeartbeatRef.current = now;
        setIsStale(false);

        setHistory((prev) => [...prev, reading].slice(-60));
        setDevices((prev) =>
          prev.map((d) =>
            d.deviceId === activeDeviceId
              ? { ...d, status: 'online', lastSeen: now, lastHeartbeat: now }
              : d
          )
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [mode, activeDeviceId]);

  // Direct Serial Stream Parser with Telemetry Pipeline
  const readSerialLoop = useCallback(async (port: SerialPort) => {
    let decoder: TextDecoderStream | null = null;
    let buffer = '';

    try {
      decoder = new TextDecoderStream();
      port.readable.pipeTo(decoder.writable as unknown as WritableStream<string>);
      const reader = decoder.readable.getReader();
      readerRef.current = reader;

      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        if (done) break;

        if (value) {
          buffer += value;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const rawPacket = line.trim();
            if (!rawPacket) continue;

            const validation = validateAndSanitizePacket(rawPacket, calibrationProfileRef.current);

            // Increment packet stats
            setDevices((prev) =>
              prev.map((d) =>
                d.deviceId === activeDeviceId
                  ? {
                      ...d,
                      packetsReceived: d.packetsReceived + 1,
                      packetsCorrupted: validation.isValid ? d.packetsCorrupted : d.packetsCorrupted + 1,
                    }
                  : d
              )
            );

            if (!validation.isValid) {
              addTelemetryLog(
                'warning',
                'Malformed Packet Filtered',
                `Rejected: "${rawPacket.slice(0, 35)}..." (${validation.errorMessage})`
              );
              continue;
            }

            if (validation.isHeartbeat) {
              lastHeartbeatRef.current = Date.now();
              continue;
            }

            const r = validation.sanitizedReading;
            const raw = validation.rawReading;
            if (r) {
              const now = Date.now();
              lastUpdateRef.current = now;
              lastHeartbeatRef.current = now;
              setLastUpdateTime(now);
              setIsStale(false);

              // Update noise buffers
              if (r.ph !== undefined) phWindowRef.current = [...phWindowRef.current, r.ph].slice(-5);
              if (r.tds !== undefined) tdsWindowRef.current = [...tdsWindowRef.current, r.tds].slice(-5);
              if (r.distance !== undefined) distWindowRef.current = [...distWindowRef.current, r.distance].slice(-5);

              const filteredPh = applyMovingMedianFilter(phWindowRef.current) || (r.ph ?? 6.0);
              const filteredTds = applyMovingMedianFilter(tdsWindowRef.current) || (r.tds ?? 1000);
              const filteredDist = applyMovingMedianFilter(distWindowRef.current) || (r.distance ?? 23.5);

              const isPhNoisy = detectSensorNoise(phWindowRef.current, 0.35);
              const isTdsNoisy = detectSensorNoise(tdsWindowRef.current, 80.0);
              const isDistNoisy = detectSensorNoise(distWindowRef.current, 5.0);

              const qualityObj: Record<'ph' | 'tds' | 'waterLevel' | 'distance', SensorQualityStatus> = {
                ph: isPhNoisy ? 'NOISY' : (validation.quality?.ph || 'VALID'),
                tds: isTdsNoisy ? 'NOISY' : (validation.quality?.tds || 'VALID'),
                waterLevel: isDistNoisy ? 'NOISY' : (validation.quality?.waterLevel || 'VALID'),
                distance: isDistNoisy ? 'NOISY' : (validation.quality?.distance || 'VALID'),
              };

              setLatestReading((prev) => {
                const base = prev || { ph: 6.0, tds: 1000, waterLevel: 85, distance: 23.5, timestamp: now };
                const updated: SensorReading = {
                  ph: filteredPh,
                  tds: filteredTds,
                  waterLevel: r.waterLevel !== undefined ? r.waterLevel : base.waterLevel,
                  distance: filteredDist,
                  timestamp: now,
                  source: 'esp32_serial', // Real physical hardware reading
                  rawPh: raw?.ph,
                  rawTds: raw?.tds,
                  rawDistance: raw?.distance,
                  rawWaterLevel: raw?.waterLevel,
                  quality: qualityObj,
                  overallQuality: isPhNoisy || isTdsNoisy || isDistNoisy ? 'NOISY' : 'VALID',
                  metrics: {
                    ph: { raw: raw?.ph ?? r.ph ?? 6.0, calibrated: r.ph ?? 6.0, filtered: filteredPh, quality: qualityObj.ph },
                    tds: { raw: raw?.tds ?? r.tds ?? 1000, calibrated: r.tds ?? 1000, filtered: filteredTds, quality: qualityObj.tds },
                    waterLevel: { raw: raw?.waterLevel ?? r.waterLevel ?? 85, calibrated: r.waterLevel ?? 85, filtered: r.waterLevel ?? 85, quality: qualityObj.waterLevel },
                    distance: { raw: raw?.distance ?? r.distance ?? 23.5, calibrated: r.distance ?? 23.5, filtered: filteredDist, quality: qualityObj.distance },
                  },
                };

                setHistory((h) => [...h, updated].slice(-60));
                return updated;
              });
            }
          }
        }
      }
    } catch (streamErr) {
      console.warn('[ESP32 Web Serial] Reader stream error (cable disconnected/reboot):', streamErr);
      addTelemetryLog('error', 'Serial Stream Interrupted', 'Device disconnected or USB link severed.');
      setConnectionState('disconnected');
    }
  }, [activeDeviceId, addTelemetryLog]);

  // Connect Web Serial Port
  const connect = useCallback(async () => {
    setError(null);
    setConnectionState('connecting');

    if (!('serial' in navigator)) {
      const msg = 'Web Serial API is not supported in this browser. Please use Chrome, Edge, or Chromium.';
      setError(msg);
      setConnectionState('error');
      addTelemetryLog('error', 'Connection Failed', msg);
      return;
    }

    try {
      const serialNav = navigator as unknown as {
        serial: {
          requestPort: () => Promise<SerialPort>;
        };
      };

      const port = await serialNav.serial.requestPort();
      portRef.current = port;

      await port.open({ baudRate: 115200 });

      setConnectionState('connected');
      setModeState('real');
      keepReadingRef.current = true;
      lastHeartbeatRef.current = Date.now();

      const portInfo = port.getInfo ? port.getInfo() : {};
      setDevices((prev) =>
        prev.map((d) =>
          d.deviceId === activeDeviceId
            ? {
                ...d,
                status: 'online',
                portInfo: {
                  usbVendorId: portInfo.usbVendorId,
                  usbProductId: portInfo.usbProductId,
                  portName: 'USB Serial (COM)',
                },
              }
            : d
        )
      );

      addTelemetryLog('success', 'ESP32 Connected', 'Serial port opened at 115200 Baud.');
      readSerialLoop(port);
    } catch (err: unknown) {
      setConnectionState('disconnected');
      const errObject = err as { name?: string; message?: string };

      if (errObject.name === 'NotFoundError') {
        setError('No serial device was selected from the pairing prompt.');
        addTelemetryLog('warning', 'Device Pairing Cancelled', 'No port selected.');
      } else if (
        errObject.name === 'NetworkError' ||
        errObject.message?.includes('Failed to open serial port') ||
        errObject.message?.includes('Access denied') ||
        errObject.message?.includes('device or resource busy')
      ) {
        const busyMsg = 'COM port busy or locked. Close Arduino Serial Monitor, PuTTY, or other tabs and try again.';
        setError(busyMsg);
        addTelemetryLog('error', 'Port Conflict / Access Denied', busyMsg);
      } else {
        const genMsg = errObject.message || String(err);
        setError(`Failed to open serial port: ${genMsg}`);
        addTelemetryLog('error', 'Connection Error', genMsg);
      }
    }
  }, [activeDeviceId, addTelemetryLog, readSerialLoop]);

  // Disconnect Port
  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;

    if (readerRef.current) {
      try {
        await readerRef.current.cancel();
      } catch {
        // Ignore cancel errors
      }
      readerRef.current = null;
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch {
        // Ignore close errors
      }
      portRef.current = null;
    }

    setConnectionState('disconnected');
    setModeState('simulation');
    setIsStale(false);
    addTelemetryLog('info', 'ESP32 Disconnected', 'Switched to local simulated telemetry mode.');
  }, [addTelemetryLog]);

  const setMode = useCallback((newMode: 'real' | 'simulation') => {
    if (newMode === 'simulation' && connectionState === 'connected') {
      disconnect();
    }
    setModeState(newMode);
    addTelemetryLog('info', `Mode Switched to ${newMode.toUpperCase()}`);
  }, [connectionState, disconnect, addTelemetryLog]);

  // Active Device Object
  const activeDevice = useMemo(() => {
    return devices.find((d) => d.deviceId === activeDeviceId) || devices[0];
  }, [devices, activeDeviceId]);

  // Evaluate Sensor Health Matrix
  const sensorHealth = useMemo(() => {
    const isOnline = (mode === 'simulation' || connectionState === 'connected') && !isStale;
    return evaluateSensorHealth(
      latestReading
        ? {
            ph: latestReading.ph,
            tds: latestReading.tds,
            waterLevel: latestReading.waterLevel,
            distance: latestReading.distance,
            rawPh: latestReading.rawPh,
            rawTds: latestReading.rawTds,
            rawDistance: latestReading.rawDistance,
            quality: latestReading.quality,
            calibrationStatus: {
              ph: calibrationProfile.ph.status,
              tds: calibrationProfile.tds.status,
              ultrasonic: calibrationProfile.ultrasonic.status,
            },
          }
        : null,
      isOnline
    );
  }, [latestReading, mode, connectionState, isStale, calibrationProfile]);

  // Compute Overall Device Health Score
  const deviceHealthScore = useMemo(() => {
    return calculateDeviceHealthScore(activeDevice, sensorHealth, isStale);
  }, [activeDevice, sensorHealth, isStale]);

  return (
    <ESP32SerialContext.Provider
      value={{
        supported,
        mode,
        connectionState,
        isStale,
        latestReading,
        lastUpdateTime,
        history,
        error,
        connect,
        disconnect,
        setMode,
        devices,
        activeDeviceId,
        activeDevice,
        sensorHealth,
        deviceHealthScore,
        calibration,
        updateCalibration,
        resetCalibration,
        calibrationProfile,
        calibratePh2Point,
        calibratePh1Point,
        calibrateTds,
        calibrateUltrasonicReservoir,
        resetSensorCalibration,
        renameDevice,
        telemetryLogs,
        addTelemetryLog,
        clearLogs,
      }}
    >
      {children}
    </ESP32SerialContext.Provider>
  );
}

export function useESP32Serial() {
  const context = useContext(ESP32SerialContext);
  if (!context) {
    throw new Error('useESP32Serial must be used within an ESP32SerialProvider');
  }
  return context;
}
