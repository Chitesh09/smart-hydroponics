// ============================================================
// HydroSmart — Cloud-First Observation Store & Memory Manager
// Primary persistence: Firestore users/{uid}/.../observations
// ============================================================

import { PlantObservation, PlantProfile } from './types';
import { FirestoreObservation } from '@/lib/firebase/types';
import {
  createObservation,
  getObservations as getFirestoreObservations,
  validateObservation
} from '@/lib/firebase/firestore';

export const DEFAULT_PRIMARY_PLANT_ID = 'plant_primary';
export const LOCAL_PLANT_PROFILE_KEY = 'hydrosmart_active_plant_profile_v2';
export const LOCAL_OBSERVATIONS_KEY = 'hydrosmart_plant_observations_v2';
const MIGRATION_FLAG_KEY = 'hydrosmart_firestore_migration_v1';
const LEGACY_STORAGE_KEY = 'hydrosmart_plant_observations_v1';
const MAX_OBSERVATIONS_CACHE = 100;

// In-memory runtime cache for seamless offline fallback
let memoryObservationCache: PlantObservation[] = [];

/**
 * Creates a default PlantProfile for initial onboarding
 */
export function createDefaultPlantProfile(plantId: string = DEFAULT_PRIMARY_PLANT_ID): PlantProfile {
  const now = Date.now();
  const dayMs = 86400000;

  return {
    plantId,
    species: undefined,
    commonName: undefined,
    scientificName: undefined,
    speciesConfidence: undefined,
    createdAt: now - 7 * dayMs,
    lastObservedAt: now - 1 * dayMs,
    monitoringStatus: 'active',
    currentHealthStatus: 'optimal',
    observationCount: 3,
    growthStage: 'vegetative',
  };
}

/**
 * Retrieve the active PlantProfile from localStorage with fallback
 */
export function getStoredPlantProfile(fallbackId: string = DEFAULT_PRIMARY_PLANT_ID): PlantProfile {
  if (typeof window === 'undefined') {
    return createDefaultPlantProfile(fallbackId);
  }

  try {
    const raw = localStorage.getItem(LOCAL_PLANT_PROFILE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.plantId) {
        // Normalize legacy strings so "Unknown Plant" doesn't pollute the species
        if (parsed.species === 'Unknown Plant' || parsed.commonName === 'Unknown Plant') {
          parsed.species = undefined;
          parsed.commonName = undefined;
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[ObservationStore] Error reading local plant profile:', err);
  }

  const initial = createDefaultPlantProfile(fallbackId);
  saveStoredPlantProfile(initial);
  return initial;
}

/**
 * Persist the active PlantProfile to localStorage
 */
export function saveStoredPlantProfile(profile: PlantProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_PLANT_PROFILE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.warn('[ObservationStore] Error saving local plant profile:', err);
  }
}

/**
 * Seed baseline observation records for new cultivation journeys
 * Associated with a stable plantId and marked as baseline seed data
 */
export function createDefaultSeedObservations(plantId: string = DEFAULT_PRIMARY_PLANT_ID): PlantObservation[] {
  const now = Date.now();
  const dayMs = 86400000;

  return [
    {
      id: 'obs_seed_day7',
      plantId,
      timestamp: now - 1 * dayMs,
      isBaselineSeed: true,
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
      telemetryMode: 'simulation',
      isTelemetryStale: false,
      speciesConfidence: 94,
      environmentalHealthScore: 94,
      overallHealthScore: 93,
      anomalyDetected: false,
      activeAnomalies: [],
      recommendations: ['Maintain current nutrient reservoir dosing schedule.'],
    },
    {
      id: 'obs_seed_day4',
      plantId,
      timestamp: now - 4 * dayMs,
      isBaselineSeed: true,
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
      telemetryMode: 'simulation',
      isTelemetryStale: false,
      speciesConfidence: 91,
      environmentalHealthScore: 91,
      overallHealthScore: 90,
      anomalyDetected: false,
      activeAnomalies: [],
      recommendations: ['Slight pH buffer stabilization recommended.'],
    },
    {
      id: 'obs_seed_day1',
      plantId,
      timestamp: now - 7 * dayMs,
      isBaselineSeed: true,
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
      telemetryMode: 'simulation',
      isTelemetryStale: false,
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
function mapFirestoreToPlantObservation(
  fObs: FirestoreObservation,
  fallbackPlantId: string = DEFAULT_PRIMARY_PLANT_ID
): PlantObservation {
  return {
    id: fObs.id,
    plantId: fObs.plantId || fallbackPlantId,
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
    plantSpecies: (fObs.plantSpecies === 'Unknown Plant' || fObs.plantSpecies === 'unknown_plant') ? undefined : fObs.plantSpecies,
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
    plantId: obs.plantId,
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
 * Fetch observations from cloud Firestore with local cache fallback
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
      const mapped = cloudDocs.map(doc => mapFirestoreToPlantObservation(doc, plantId));
      saveStoredObservations(mapped);
      return mapped;
    }
  } catch (err) {
    console.warn('[ObservationStore] Cloud fetch error (using cache fallback):', err);
  }

  // Fallback to local storage or initial seed
  return getStoredObservations(plantId);
}

/**
 * Persist an observation to cloud Firestore and local storage
 */
export async function persistObservationToCloud(
  uid: string,
  farmId: string,
  stationId: string,
  plantId: string,
  observation: PlantObservation,
  source?: 'esp32' | 'simulation' | 'manual'
): Promise<PlantObservation[]> {
  // Update local persistent storage immediately
  const updated = saveObservation(observation);

  try {
    const firestorePayload = mapPlantObservationToFirestore(observation, source);
    if (validateObservation(firestorePayload)) {
      await createObservation(uid, farmId, stationId, plantId, firestorePayload);
    }
  } catch (err) {
    console.warn('[ObservationStore] Cloud persist error (observation retained in local cache):', err);
  }

  return updated;
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
      // Ensure legacy observation is associated with plantId
      const normalizedObs: PlantObservation = {
        ...item,
        plantId: item.plantId || plantId,
        plantSpecies: (item.plantSpecies === 'Unknown Plant' || item.plantSpecies === 'unknown_plant')
          ? undefined
          : item.plantSpecies,
      };

      const payload = mapPlantObservationToFirestore(normalizedObs);
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
 * Pulls from persistent localStorage if present, or initializes with seed
 */
export function getStoredObservations(plantId: string = DEFAULT_PRIMARY_PLANT_ID): PlantObservation[] {
  if (memoryObservationCache.length > 0) {
    return memoryObservationCache;
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_OBSERVATIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Normalize legacy observations lacking plantId or containing "Unknown Plant"
          const normalized: PlantObservation[] = (parsed as Record<string, unknown>[]).map((item) => ({
            ...(item as unknown as PlantObservation),
            plantId: (typeof item.plantId === 'string' && item.plantId) ? item.plantId : plantId,
            plantSpecies: (item.plantSpecies === 'Unknown Plant' || item.plantSpecies === 'unknown_plant')
              ? undefined
              : (item.plantSpecies as string | undefined),
          }));
          memoryObservationCache = normalized;
          return normalized;
        }
      }
    } catch (err) {
      console.warn('[ObservationStore] Error reading local observations:', err);
    }
  }

  const seed = createDefaultSeedObservations(plantId);
  memoryObservationCache = seed;
  saveStoredObservations(seed);
  return seed;
}

/**
 * Save an observation array to both in-memory cache and localStorage
 */
export function saveStoredObservations(observations: PlantObservation[]): void {
  memoryObservationCache = observations.slice(0, MAX_OBSERVATIONS_CACHE);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_OBSERVATIONS_KEY, JSON.stringify(memoryObservationCache));
    } catch (err) {
      console.warn('[ObservationStore] Error writing local observations:', err);
    }
  }
}

/**
 * Prepend a new observation and persist to both RAM and localStorage
 */
export function saveObservation(observation: PlantObservation): PlantObservation[] {
  const updated = [observation, ...memoryObservationCache.filter(o => o.id !== observation.id)].slice(0, MAX_OBSERVATIONS_CACHE);
  saveStoredObservations(updated);
  return updated;
}

/**
 * Clear stored observations across RAM and localStorage
 */
export function clearStoredObservations(): void {
  memoryObservationCache = [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(LOCAL_OBSERVATIONS_KEY);
    } catch (err) {
      console.warn('[ObservationStore] Error clearing local observations:', err);
    }
  }
}
