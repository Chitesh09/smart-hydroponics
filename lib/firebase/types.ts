// ============================================================
// HydroSmart — Cloud Firestore Data Models & Types
// Production Hierarchy: User -> Farm -> Station -> Plant -> Observations
// ============================================================

export type CloudSyncStatus = 'synced' | 'syncing' | 'offline' | 'error';
export type ObservationSource = 'esp32' | 'simulation' | 'manual';

export interface FirestoreUserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FirestoreFarm {
  id: string;
  name: string;
  location?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FirestoreStation {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'standby';
  deviceType: string; // e.g. "ESP32"
  createdAt?: unknown;
  updatedAt?: unknown;
  lastSeenAt?: number;
}

export interface FirestorePlant {
  id: string;
  name: string;
  species: string;
  speciesConfidence?: number;
  healthState?: string;
  targetProfile?: {
    phMin: number;
    phMax: number;
    tdsMin: number;
    tdsMax: number;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface FirestoreObservation {
  id: string;
  timestamp: number; // Observation measurement epoch ms
  
  // Chemical & Hardware Telemetry
  ph?: number;
  tds?: number;
  waterLevel?: number;
  distance?: number;
  telemetryMode?: 'real' | 'simulation';
  isTelemetryStale?: boolean;

  // Optical & Visual Health Metrics
  cameraActive?: boolean;
  plantDetected: boolean;
  plantDetectionConfidence?: number;
  canopyCoverage?: number;
  canopyCoveragePercent?: number;
  vegetationIndex?: number;
  visualHealthScore?: number;
  healthState?: string;
  visualHealthState?: string;
  visualScoreBreakdown?: unknown;
  visualIndicators?: string[];
  chlorosisYellowPercent?: number;
  necroticBrownPercent?: number;
  imageReference?: string;

  // Botanical & Assessment Metrics
  plantSpecies?: string;
  speciesConfidence?: number;
  overallHealthScore?: number;
  environmentalHealthScore?: number;
  anomalyDetected?: boolean;
  activeAnomalies?: string[];
  recommendations?: string[];
  multimodalAssessment?: unknown;

  source: ObservationSource;
  createdAt?: unknown; // Firestore server write timestamp
}
