/**
 * HydroSmart — Phase 10: Plant Alert Store
 * 
 * Local persistence and lifecycle management for confidence-aware plant alerts.
 * Ensures plantId isolation and survives browser page reloads.
 */

import { PlantAlert } from './types';
import { ALERT_CONFIG } from './alertConfig';
import { saveAlert, updateAlertStatus } from '@/lib/backend/databaseService';

export const LOCAL_ALERTS_KEY = 'hydrosmart_plant_alerts_v1';

// In-memory runtime cache for seamless offline fallback
const memoryAlertsCache: Record<string, PlantAlert[]> = {};

/**
 * Retrieve stored alerts scoped to a specific plantId
 */
export function getStoredAlerts(plantId: string): PlantAlert[] {
  if (!plantId) return [];

  if (typeof window === 'undefined') {
    return memoryAlertsCache[plantId] || [];
  }

  try {
    const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
    if (raw) {
      const allAlerts: Record<string, PlantAlert[]> = JSON.parse(raw);
      if (allAlerts && Array.isArray(allAlerts[plantId])) {
        memoryAlertsCache[plantId] = allAlerts[plantId];
        return allAlerts[plantId];
      }
    }
  } catch (err) {
    console.warn('[AlertStore] Error reading local alerts:', err);
  }

  return memoryAlertsCache[plantId] || [];
}

/**
 * Persist alerts for a specific plantId, keeping only the latest maxStoredAlertsPerPlant
 */
export function saveStoredAlerts(plantId: string, alerts: PlantAlert[]): void {
  if (!plantId) return;

  const boundedAlerts = alerts
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, ALERT_CONFIG.timing.maxStoredAlertsPerPlant);

  memoryAlertsCache[plantId] = boundedAlerts;

  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
    const allAlerts: Record<string, PlantAlert[]> = raw ? JSON.parse(raw) : {};
    allAlerts[plantId] = boundedAlerts;
    localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(allAlerts));

    // Async sync to databaseService
    for (const a of boundedAlerts) {
      saveAlert(null, 'farm_main', 'station_esp32_1', plantId, a).catch(() => {});
    }
  } catch (err) {
    console.warn('[AlertStore] Error saving local alerts:', err);
  }
}

/**
 * Dismiss an active or acknowledged alert
 */
export function dismissStoredAlert(plantId: string, alertId: string): PlantAlert[] {
  const current = getStoredAlerts(plantId);
  const now = Date.now();
  const updated = current.map(alert => {
    if (alert.id === alertId) {
      return {
        ...alert,
        status: 'DISMISSED' as const,
        dismissedAt: now,
        updatedAt: now,
      };
    }
    return alert;
  });
  saveStoredAlerts(plantId, updated);
  updateAlertStatus(null, 'farm_main', 'station_esp32_1', plantId, alertId, 'DISMISSED').catch(() => {});
  return updated;
}

/**
 * Acknowledge an alert without dismissing it
 */
export function acknowledgeStoredAlert(plantId: string, alertId: string): PlantAlert[] {
  const current = getStoredAlerts(plantId);
  const now = Date.now();
  const updated = current.map(alert => {
    if (alert.id === alertId && (alert.status === 'ACTIVE' || alert.status === 'DETECTED')) {
      return {
        ...alert,
        status: 'ACKNOWLEDGED' as const,
        updatedAt: now,
      };
    }
    return alert;
  });
  saveStoredAlerts(plantId, updated);
  updateAlertStatus(null, 'farm_main', 'station_esp32_1', plantId, alertId, 'ACKNOWLEDGED').catch(() => {});
  return updated;
}

/**
 * Resolve an alert when underlying conditions safely normalize
 */
export function resolveStoredAlert(plantId: string, alertId: string): PlantAlert[] {
  const current = getStoredAlerts(plantId);
  const now = Date.now();
  const updated = current.map(alert => {
    if (alert.id === alertId && alert.status !== 'RESOLVED') {
      return {
        ...alert,
        status: 'RESOLVED' as const,
        resolvedAt: now,
        updatedAt: now,
      };
    }
    return alert;
  });
  saveStoredAlerts(plantId, updated);
  updateAlertStatus(null, 'farm_main', 'station_esp32_1', plantId, alertId, 'RESOLVED').catch(() => {});
  return updated;
}

/**
 * Remove resolved alerts for a plant
 */
export function clearResolvedStoredAlerts(plantId: string): PlantAlert[] {
  const current = getStoredAlerts(plantId);
  const updated = current.filter(a => a.status !== 'RESOLVED');
  saveStoredAlerts(plantId, updated);
  return updated;
}

/**
 * Clear all alerts for a specific plant or all plants
 */
export function clearAllStoredAlerts(plantId?: string): void {
  if (plantId) {
    delete memoryAlertsCache[plantId];
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_ALERTS_KEY);
        if (raw) {
          const allAlerts: Record<string, PlantAlert[]> = JSON.parse(raw);
          delete allAlerts[plantId];
          localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(allAlerts));
        }
      } catch (err) {
        console.warn('[AlertStore] Error clearing alerts for plant:', err);
      }
    }
  } else {
    for (const key of Object.keys(memoryAlertsCache)) {
      delete memoryAlertsCache[key];
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LOCAL_ALERTS_KEY);
      } catch (err) {
        console.warn('[AlertStore] Error removing alert storage key:', err);
      }
    }
  }
}
