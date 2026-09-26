// ============================================================
// HydroSmart — Backend & Database Domain Models
// Phase 12: Production Longitudinal Persistence Architecture
// Multi-plant isolated schema under users/{uid}/.../plants/{plantId}
// ============================================================

import {
  PlantProfile,
  PlantObservation,
  PlantReasoningEvent,
  PlantChangeEvent,
  EnvironmentPlantAssociation,
  PlantAlert,
} from '@/lib/intelligence/types';
import { SensorCalibrationProfile } from '@/lib/device/sensorCalibration';

export type PersistenceStatus = 'SAVED' | 'PENDING' | 'FAILED' | 'LOCAL_ONLY';

export interface PersistenceResult<T> {
  status: PersistenceStatus;
  data: T;
  plantId: string;
  error?: string;
  syncedAt?: number;
}

export type TelemetryDataSource = 'esp32_serial' | 'simulation' | 'manual_test';

export interface DbTelemetrySnapshot {
  id: string;
  plantId: string;
  timestamp: number;
  ph: number;
  tds: number;
  waterLevel: number;
  distance: number;
  rawPh?: number;
  rawTds?: number;
  rawDistance?: number;
  phStatus?: string;
  tdsStatus?: string;
  waterLevelStatus?: string;
  source: TelemetryDataSource;
  isSimulated: boolean;
  createdAt?: unknown;
}

export interface DbPlantProfile extends PlantProfile {
  userId?: string;
  farmId?: string;
  stationId?: string;
  updatedAt?: unknown;
}

export interface DbPlantObservation extends PlantObservation {
  userId?: string;
  farmId?: string;
  stationId?: string;
  createdAt?: unknown;
}

export interface DbPlantReasoningEvent extends PlantReasoningEvent {
  plantId: string;
  userId?: string;
  farmId?: string;
  stationId?: string;
  createdAt?: unknown;
}

export interface DbPlantChangeEvent extends PlantChangeEvent {
  plantId: string;
  userId?: string;
  farmId?: string;
  stationId?: string;
  createdAt?: unknown;
}

export interface DbEnvironmentPlantAssociation extends Omit<EnvironmentPlantAssociation, 'createdAt'> {
  plantId: string;
  userId?: string;
  farmId?: string;
  stationId?: string;
  createdAt?: unknown;
}

export interface DbPlantAlert extends PlantAlert {
  userId?: string;
  farmId?: string;
  stationId?: string;
}

export interface DbSensorCalibrationProfile extends SensorCalibrationProfile {
  id: string;
  plantId?: string;
  stationId: string;
  userId?: string;
  createdAt?: unknown;
}

export interface DbMigrationResult {
  migratedObservations: number;
  migratedAlerts: number;
  migratedProfiles: number;
  migratedCalibrations: number;
  unlinkedQuarantined: number;
  status: 'COMPLETED' | 'ALREADY_MIGRATED' | 'FAILED' | 'SKIPPED';
  errors: string[];
}
