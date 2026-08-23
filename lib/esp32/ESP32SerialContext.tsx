'use client';

// ============================================================
// HydroSmart — ESP32 Serial & IoT Device Management Context
// Production Telemetry Pipeline, Heartbeat & Calibration Engine
// ============================================================

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  IoTDevice,
  SensorHealthStatus,
  DeviceCalibrationConfig,
  TelemetryLogEvent
} from '@/lib/device/types';
import {
  DEFAULT_CALIBRATION,
  validateAndSanitizePacket,
  evaluateSensorHealth,
  calculateDeviceHealthScore
} from '@/lib/device/telemetryValidator';

// Unified Sensor Reading Interface
export interface SensorReading {
  waterLevel: number;
  distance: number;
  ph: number;
  tds: number;
  timestamp: number;
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

const CALIBRATION_STORAGE_KEY = 'hydrosmart_device_calibration_v1';

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

  // Phase 1C IoT Device Management Extensions
  devices: IoTDevice[];
  activeDeviceId: string;
  activeDevice: IoTDevice;
  sensorHealth: Record<'ph' | 'tds' | 'ultrasonic' | 'temperature', SensorHealthStatus>;
  deviceHealthScore: number;
  calibration: DeviceCalibrationConfig;
  updateCalibration: (newConfig: Partial<DeviceCalibrationConfig>) => void;
  resetCalibration: () => void;
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
  const [history, setHistory] = useState<SensorReading[]>(() => {
    const initialHistory: SensorReading[] = [];
    const now = Date.now();
    for (let i = 59; i >= 0; i--) {
      const time = now - i * 2000;
      initialHistory.push({
        ph: parseFloat((6.0 + Math.sin(i * 0.2) * 0.1 + (i % 5) * 0.01).toFixed(2)),
        tds: parseFloat((1000 - i * 2 + (i % 10)).toFixed(1)),
        waterLevel: parseFloat((85.0 - i * 0.05).toFixed(1)),
        distance: parseFloat((100.0 - (85.0 - i * 0.05) * 0.9).toFixed(2)),
        timestamp: time,
      });
    }
    return initialHistory;
  });
  const [error, setError] = useState<string | null>(null);

  // Calibration State
  const [calibration, setCalibration] = useState<DeviceCalibrationConfig>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(CALIBRATION_STORAGE_KEY);
        if (saved) return { ...DEFAULT_CALIBRATION, ...JSON.parse(saved) };
      } catch {
        // Ignore parse errors
      }
    }
    return DEFAULT_CALIBRATION;
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
      details: 'Strict physical boundary checking and heartbeat watcher active.',
      deviceId: 'HS-ESP32-001',
    },
  ]);

  // References
  const portRef = useRef<SerialPort | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<string> | null>(null);
  const keepReadingRef = useRef(false);
  const lastUpdateRef = useRef<number | null>(null);
  const lastHeartbeatRef = useRef<number>(0);
  const calibrationRef = useRef<DeviceCalibrationConfig>(calibration);

  // Synchronize calibration ref
  useEffect(() => {
    calibrationRef.current = calibration;
  }, [calibration]);

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
    setCalibration((prev) => {
      const merged = { ...prev, ...newConfig };
      if (typeof window !== 'undefined') {
        localStorage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(merged));
      }
      return merged;
    });
    addTelemetryLog('info', 'Calibration Parameters Updated', 'Sensor slope and offset coefficients persisted.');
  }, [addTelemetryLog]);

  const resetCalibration = useCallback(() => {
    setCalibration(DEFAULT_CALIBRATION);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(CALIBRATION_STORAGE_KEY);
    }
    addTelemetryLog('info', 'Calibration Reset to Factory Defaults');
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
      const timeoutThreshold = calibration.heartbeatTimeoutMs || 5000;

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
  }, [connectionState, mode, calibration.heartbeatTimeoutMs, activeDeviceId]);

  // 2. Simulated Polling Loop
  useEffect(() => {
    if (mode !== 'simulation') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const mockRaw = JSON.stringify({
        ph: 6.05 + Math.sin(now / 15000) * 0.15 + (Math.random() - 0.5) * 0.03,
        tds: 980 + Math.cos(now / 20000) * 40 + (Math.random() - 0.5) * 10,
        distance: 21.0 + Math.sin(now / 30000) * 1.5,
        waterLevel: 82.0 + Math.cos(now / 30000) * 2.0,
      });

      const validation = validateAndSanitizePacket(mockRaw, calibrationRef.current);
      if (validation.isValid && validation.sanitizedReading) {
        const r = validation.sanitizedReading;
        const reading: SensorReading = {
          ph: r.ph ?? 6.0,
          tds: r.tds ?? 980,
          waterLevel: r.waterLevel ?? 82,
          distance: r.distance ?? 21.0,
          timestamp: now,
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

            const validation = validateAndSanitizePacket(rawPacket, calibrationRef.current);

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
            if (r) {
              const now = Date.now();
              lastUpdateRef.current = now;
              lastHeartbeatRef.current = now;
              setLastUpdateTime(now);
              setIsStale(false);

              setLatestReading((prev) => {
                const base = prev || { ph: 6.0, tds: 1000, waterLevel: 85, distance: 23.5, timestamp: now };
                const updated: SensorReading = {
                  ph: r.ph !== undefined ? r.ph : base.ph,
                  tds: r.tds !== undefined ? r.tds : base.tds,
                  waterLevel: r.waterLevel !== undefined ? r.waterLevel : base.waterLevel,
                  distance: r.distance !== undefined ? r.distance : base.distance,
                  timestamp: now,
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
    return evaluateSensorHealth(latestReading, isOnline);
  }, [latestReading, mode, connectionState, isStale]);

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
