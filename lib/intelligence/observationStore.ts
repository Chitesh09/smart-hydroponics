// ============================================================
// HydroSmart — Centralized Plant Observation Store & Memory
// ============================================================

import { PlantObservation } from './types';

const STORAGE_KEY = 'hydrosmart_plant_observations_v1';
const MAX_OBSERVATIONS = 100;

function createDefaultSeedObservations(): PlantObservation[] {
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

export function getStoredObservations(): PlantObservation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = createDefaultSeedObservations();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const seed = createDefaultSeedObservations();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  } catch (err) {
    console.warn('[ObservationStore] Failed to read stored observations:', err);
    return [];
  }
}

export function saveObservation(observation: PlantObservation): PlantObservation[] {
  if (typeof window === 'undefined') return [observation];
  try {
    const current = getStoredObservations();
    const updated = [observation, ...current].slice(0, MAX_OBSERVATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[ObservationStore] Failed to save observation:', err);
    return [observation];
  }
}

export function getLatestObservation(): PlantObservation | null {
  const observations = getStoredObservations();
  return observations.length > 0 ? observations[0] : null;
}

export function clearStoredObservations(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('[ObservationStore] Failed to clear observations:', err);
  }
}

export function exportObservationsJSON(): string {
  const observations = getStoredObservations();
  return JSON.stringify(observations, null, 2);
}
