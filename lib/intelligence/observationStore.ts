// ============================================================
// HydroSmart — Cloud-First Observation Store & Memory Manager
// Primary persistence: Firestore users/{uid}/.../observations
// ============================================================

import { PlantObservation } from './types';
import { FirestoreObservation } from '@/lib/firebase/types';
import {
  createObservation,
  getObservations as getFirestoreObservations,
  validateObservation
} from '@/lib/firebase/firestore';

const MIGRATION_FLAG_KEY = 'hydrosmart_firestore_migration_v1';
const LEGACY_STORAGE_KEY = 'hydrosmart_plant_observations_v1';
const MAX_OBSERVATIONS_CACHE = 100;

// In-memory runtime cache for seamless offline fallback
let memoryObservationCache: PlantObservation[] = [];

/**
 * Seed baseline observation records for new cultivation journeys
 */
export function createDefaultSeedObservations(): PlantObservation[] {
  const now = Date.now();
  const dayMs = 86400000;

  return [
    {
      id: 'obs_seed_day7',
      timestamp: now - 1 * dayMs,
      cameraActive: true,
      isPlantDetected: true,
      plantDetectionConfidence: 94,
      canopyCoveragePercent: 22.4,
      vegetationIndex: 0.38,
      visualHealthScore: 92,
      visualHealthState: 'healthy',
      visualIndicators: [
        'Optimal Chlorophyll Pigmentation',
        'No Significant Necrotic Browning',
        'Upright Canopy Vigor',
      ],
      ph: 6.10,
      tds: 980,
      waterLevel: 82,
      distance: 21.5,
      telemetryMode: 'real',
      isTelemetryStale: false,
      plantSpecies: 'Butterhead Lettuce',
      speciesConfidence: 94,
      environmentalHealthScore: 94,
      overallHealthScore: 93,
      anomalyDetected: false,
      activeAnomalies: [],
      recommendations: ['Maintain current nutrient reservoir dosing schedule.'],
    },
    {
      id: 'obs_seed_day4',
      timestamp: now - 4 * dayMs,
      cameraActive: true,
      isPlantDetected: true,
      plantDetectionConfidence: 91,
      canopyCoveragePercent: 17.8,
      vegetationIndex: 0.34,
      visualHealthScore: 89,
      visualHealthState: 'healthy',
      visualIndicators: [
        'Optimal Chlorophyll Pigmentation',
        'Uniform Leaf Surface Texture',
      ],
      ph: 5.95,
      tds: 920,
      waterLevel: 88,
      distance: 18.6,
      telemetryMode: 'real',
      isTelemetryStale: false,
      plantSpecies: 'Butterhead Lettuce',
      speciesConfidence: 91,
      environmentalHealthScore: 91,
      overallHealthScore: 90,
      anomalyDetected: false,
      activeAnomalies: [],
      recommendations: ['Slight pH buffer stabilization recommended.'],
    },
    {
      id: 'obs_seed_day1',
      timestamp: now - 7 * dayMs,
      cameraActive: true,
      isPlantDetected: true,
      plantDetectionConfidence: 88,
      canopyCoveragePercent: 13.5,
      vegetationIndex: 0.29,
      visualHealthScore: 86,
      visualHealthState: 'healthy',
      visualIndicators: [
        'Optimal Chlorophyll Pigmentation',
        'Young Seedling Canopy Spread',
      ],
      ph: 5.80,
      tds: 850,
      waterLevel: 95,
      distance: 15.3,
      telemetryMode: 'real',
      isTelemetryStale: false,
      plantSpecies: 'Butterhead Lettuce',
      speciesConfidence: 88,
      environmentalHealthScore: 88,
      overallHealthScore: 87,
      anomalyDetected: false,
      activeAnomalies: [],
      recommendations: ['Initial transplant baseline established.'],
    },
  ];
}

/**
 * Convert a Firestore observation document into standard PlantObservation
 */
function mapFirestoreToPlantObservation(fObs: FirestoreObservation): PlantObservation {
  return {
    id: fObs.id,
    timestamp: fObs.timestamp,
    cameraActive: fObs.cameraActive ?? (fObs.plantDetected || false),
    isPlantDetected: fObs.plantDetected,
    plantDetectionConfidence: fObs.plantDetectionConfidence,
    canopyCoveragePercent: fObs.canopyCoveragePercent ?? fObs.canopyCoverage,
    vegetationIndex: fObs.vegetationIndex,
    visualHealthScore: fObs.visualHealthScore,
    visualHealthState: (fObs.visualHealthState as PlantObservation['visualHealthState']) || (fObs.healthState as PlantObservation['visualHealthState']),
    visualScoreBreakdown: fObs.visualScoreBreakdown as PlantObservation['visualScoreBreakdown'],
    visualIndicators: fObs.visualIndicators,
    ph: fObs.ph,
    tds: fObs.tds,
    waterLevel: fObs.waterLevel,
    distance: fObs.distance,
    telemetryMode: fObs.telemetryMode || (fObs.source === 'simulation' ? 'simulation' : 'real'),
    isTelemetryStale: fObs.isTelemetryStale ?? false,
    plantSpecies: fObs.plantSpecies,
    speciesConfidence: fObs.speciesConfidence,
    environmentalHealthScore: fObs.environmentalHealthScore,
    overallHealthScore: fObs.overallHealthScore,
    multimodalAssessment: fObs.multimodalAssessment as PlantObservation['multimodalAssessment'],
    anomalyDetected: fObs.anomalyDetected ?? (fObs.activeAnomalies && fObs.activeAnomalies.length > 0) ?? false,
    activeAnomalies: fObs.activeAnomalies,
    recommendations: fObs.recommendations,
    imageReference: fObs.imageReference,
  };
}

/**
 * Convert standard PlantObservation into Firestore document payload
 */
function mapPlantObservationToFirestore(
  obs: PlantObservation,
  sourceOverride?: 'esp32' | 'simulation' | 'manual'
): FirestoreObservation {
  return {
    id: obs.id,
    timestamp: obs.timestamp,
    ph: obs.ph,
    tds: obs.tds,
    waterLevel: obs.waterLevel,
    distance: obs.distance,
    telemetryMode: obs.telemetryMode,
    isTelemetryStale: obs.isTelemetryStale,
    cameraActive: obs.cameraActive,
    plantDetected: obs.isPlantDetected ?? false,
    plantDetectionConfidence: obs.plantDetectionConfidence,
    canopyCoveragePercent: obs.canopyCoveragePercent,
    vegetationIndex: obs.vegetationIndex,
    visualHealthScore: obs.visualHealthScore,
    visualHealthState: obs.visualHealthState,
    visualScoreBreakdown: obs.visualScoreBreakdown,
    visualIndicators: obs.visualIndicators,
    plantSpecies: obs.plantSpecies,
    speciesConfidence: obs.speciesConfidence,
    overallHealthScore: obs.overallHealthScore,
    environmentalHealthScore: obs.environmentalHealthScore,
    anomalyDetected: obs.anomalyDetected,
    activeAnomalies: obs.activeAnomalies,
    recommendations: obs.recommendations,
    multimodalAssessment: obs.multimodalAssessment,
    imageReference: obs.imageReference,
    source: sourceOverride || (obs.telemetryMode === 'simulation' ? 'simulation' : 'esp32'),
  };
}

/**
 * Fetch observations from cloud Firestore with memory cache fallback
 */
export async function fetchObservationsFromCloud(
  uid: string,
  farmId: string,
  stationId: string,
  plantId: string,
  limitCount = 50
): Promise<PlantObservation[]> {
  try {
    const cloudDocs = await getFirestoreObservations(uid, farmId, stationId, plantId, limitCount);
    if (cloudDocs && cloudDocs.length > 0) {
      const mapped = cloudDocs.map(mapFirestoreToPlantObservation);
      memoryObservationCache = mapped;
      return mapped;
    }
  } catch (err) {
    console.warn('[ObservationStore] Cloud fetch error (using cache fallback):', err);
  }

  // Fallback to cache or initial seed
  if (memoryObservationCache.length > 0) {
    return memoryObservationCache;
  }

  const seed = createDefaultSeedObservations();
  memoryObservationCache = seed;
  return seed;
}

/**
 * Persist an observation to cloud Firestore
 */
export async function persistObservationToCloud(
  uid: string,
  farmId: string,
  stationId: string,
  plantId: string,
  observation: PlantObservation,
  source?: 'esp32' | 'simulation' | 'manual'
): Promise<PlantObservation[]> {
  // Update memory cache immediately
  memoryObservationCache = [observation, ...memoryObservationCache].slice(0, MAX_OBSERVATIONS_CACHE);

  try {
    const firestorePayload = mapPlantObservationToFirestore(observation, source);
    if (validateObservation(firestorePayload)) {
      await createObservation(uid, farmId, stationId, plantId, firestorePayload);
    }
  } catch (err) {
    console.warn('[ObservationStore] Cloud persist error (observation retained in local cache):', err);
  }

  return memoryObservationCache;
}

/**
 * Safe One-Time Migration: Migrate legacy localStorage observations to Firestore
 */
export async function migrateLegacyLocalStorageObservations(
  uid: string,
  farmId: string,
  stationId: string,
  plantId: string
): Promise<{ migratedCount: number; status: 'migrated' | 'already_migrated' | 'none' | 'error' }> {
  if (typeof window === 'undefined' || !uid) {
    return { migratedCount: 0, status: 'none' };
  }

  try {
    const isMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (isMigrated === 'done') {
      return { migratedCount: 0, status: 'already_migrated' };
    }

    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'done');
      return { migratedCount: 0, status: 'none' };
    }

    const legacyList = JSON.parse(raw);
    if (!Array.isArray(legacyList) || legacyList.length === 0) {
      localStorage.setItem(MIGRATION_FLAG_KEY, 'done');
      return { migratedCount: 0, status: 'none' };
    }

    let count = 0;
    for (const item of legacyList) {
      const payload = mapPlantObservationToFirestore(item);
      if (validateObservation(payload)) {
        try {
          await createObservation(uid, farmId, stationId, plantId, payload);
          count++;
        } catch (uploadErr) {
          console.warn('[ObservationStore] Skipping invalid migration item:', uploadErr);
        }
      }
    }

    localStorage.setItem(MIGRATION_FLAG_KEY, 'done');
    console.log(`[ObservationStore] Successfully migrated ${count} observations to Firestore.`);
    return { migratedCount: count, status: 'migrated' };
  } catch (err) {
    console.error('[ObservationStore] Migration error:', err);
    return { migratedCount: 0, status: 'error' };
  }
}

/**
 * Synchronous local memory/cache reader for initial SSR/client mounts
 */
export function getStoredObservations(): PlantObservation[] {
  if (memoryObservationCache.length > 0) {
    return memoryObservationCache;
  }
  const seed = createDefaultSeedObservations();
  memoryObservationCache = seed;
  return seed;
}

export function saveObservation(observation: PlantObservation): PlantObservation[] {
  memoryObservationCache = [observation, ...memoryObservationCache].slice(0, MAX_OBSERVATIONS_CACHE);
  return memoryObservationCache;
}

export function clearStoredObservations(): void {
  memoryObservationCache = [];
}
