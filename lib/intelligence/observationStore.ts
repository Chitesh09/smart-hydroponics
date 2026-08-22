// ============================================================
// HydroSmart — Centralized Plant Observation Store
// ============================================================

import { PlantObservation } from './types';

const STORAGE_KEY = 'hydrosmart_plant_observations';
const MAX_OBSERVATIONS = 100;

export function getStoredObservations(): PlantObservation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
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
