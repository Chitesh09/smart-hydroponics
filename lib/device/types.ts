// ============================================================
// HydroSmart — IoT Device Management & Telemetry Models
// Production-grade IoT Station Hierarchy & Validation Types
// ============================================================

export type DeviceConnectionStatus =
  | 'online'
  | 'offline'
  | 'connecting'
  | 'reconnecting'
  | 'sleeping'
  | 'error';

export type SensorDiagnosticState =
  | 'working'
  | 'unavailable'
  | 'disconnected'
  | 'fault';

export interface IoTDevice {
  deviceId: string; // e.g. "HS-ESP32-001"
  name: string; // e.g. "Hydroponic Station 1"
  firmwareVersion: string; // e.g. "v1.2.0-prod"
  status: DeviceConnectionStatus;
  lastSeen: number; // Unix timestamp
  lastHeartbeat: number; // Unix timestamp
  stationAssignment: string;
  baudRate: number; // 115200
  portInfo?: {
    usbVendorId?: number;
    usbProductId?: number;
    portName?: string;
  };
  healthScore: number; // 0 - 100
  packetsReceived: number;
  packetsCorrupted: number;
}

export interface SensorHealthStatus {
  sensorKey: 'ph' | 'tds' | 'ultrasonic' | 'temperature';
  name: string;
  state: SensorDiagnosticState;
  lastReading?: number;
  unit: string;
  statusDetails: string;
  minThreshold: number;
  maxThreshold: number;
}

export interface DeviceCalibrationConfig {
  phOffset: number; // Default 0.0
  phSlopeMultiplier: number; // Default 1.0
  tdsCalibrationFactor: number; // Default 1.0
  ultrasonicEmptyDistanceCm: number; // Default 60.0 cm
  ultrasonicFullDistanceCm: number; // Default 13.0 cm
  heartbeatTimeoutMs: number; // Default 5000 ms
}

export interface TelemetryLogEvent {
  id: string;
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success';
  event: string;
  details?: string;
  deviceId: string;
}

export interface RawPacketValidationResult {
  isValid: boolean;
  sanitizedReading?: {
    ph?: number;
    tds?: number;
    waterLevel?: number;
    distance?: number;
    timestamp: number;
  };
  errorMessage?: string;
  isHeartbeat?: boolean;
}
