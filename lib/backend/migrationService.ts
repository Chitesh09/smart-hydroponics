// ============================================================
// HydroSmart — Safe Database & Storage Migration Service
// Phase 12: Safe migration of verified legacy localStorage data
// Quarantines unlinked records without plantId to prevent data pollution
// ============================================================

import { DbMigrationResult } from './types';
import {
  savePlantProfile,
  saveObservation,
  saveAlert,
  saveCalibration,
  DEFAULT_FARM_ID,
  DEFAULT_STATION_ID,
  DEFAULT_PRIMARY_PLANT_ID,
} from './databaseService';
import { PlantProfile, PlantObservation, PlantAlert } from '@/lib/intelligence/types';
import { SensorCalibrationProfile } from '@/lib/device/sensorCalibration';

export const MIGRATION_FLAG_KEY = 'hydrosmart_backend_migration_v12';
export const UNLINKED_LEGACY_QUARANTINE_KEY = 'hydrosmart_unlinked_legacy_v1';

const LEGACY_KEYS = {
  profile: 'hydrosmart_active_plant_profile_v2',
  observations: 'hydrosmart_plant_observations_v2',
  alerts: 'hydrosmart_plant_alerts_v1',
  calibration: 'hydrosmart_sensor_calibration_v2',
};

export async function executeSafeLocalStorageMigration(
  uid: string | null | undefined,
  farmId: string = DEFAULT_FARM_ID,
  stationId: string = DEFAULT_STATION_ID,
  activePlantId: string = DEFAULT_PRIMARY_PLANT_ID
): Promise<DbMigrationResult> {
  const result: DbMigrationResult = {
    migratedObservations: 0,
    migratedAlerts: 0,
    migratedProfiles: 0,
    migratedCalibrations: 0,
    unlinkedQuarantined: 0,
    status: 'COMPLETED',
    errors: [],
  };

  if (typeof window === 'undefined') {
    result.status = 'SKIPPED';
    return result;
  }

  // Idempotency check
  const isMigrated = localStorage.getItem(MIGRATION_FLAG_KEY);
  if (isMigrated === 'done') {
    result.status = 'ALREADY_MIGRATED';
    return result;
  }

  const unlinkedQuarantine: unknown[] = [];

  try {
    // 1. Migrate Active Plant Profile
    const rawProfile = localStorage.getItem(LEGACY_KEYS.profile);
    if (rawProfile) {
      try {
        const parsedProfile: PlantProfile = JSON.parse(rawProfile);
        if (parsedProfile && (parsedProfile.plantId || activePlantId)) {
          const targetPlantId = parsedProfile.plantId || activePlantId;
          await savePlantProfile(uid, farmId, stationId, {
            ...parsedProfile,
            plantId: targetPlantId,
          });
          result.migratedProfiles++;
        } else {
          unlinkedQuarantine.push({ type: 'profile', data: parsedProfile });
          result.unlinkedQuarantined++;
        }
      } catch (e) {
        result.errors.push(`Profile parse error: ${String(e)}`);
      }
    }

    // 2. Migrate Observations (Only with verifiable plantId)
    const rawObs = localStorage.getItem(LEGACY_KEYS.observations);
    if (rawObs) {
      try {
        const parsedObs = JSON.parse(rawObs);
        if (Array.isArray(parsedObs)) {
          for (const item of parsedObs) {
            // Strictly check if item has verifiable plantId or matches active plant
            if (item && item.id && (item.plantId || activePlantId)) {
              const plantId = item.plantId || activePlantId;
              const obs: PlantObservation = {
                ...item,
                plantId,
              };
              await saveObservation(uid, farmId, stationId, plantId, obs);
              result.migratedObservations++;
            } else {
              // Quarantine unlinked or corrupted record
              unlinkedQuarantine.push({ type: 'observation', data: item });
              result.unlinkedQuarantined++;
            }
          }
        }
      } catch (e) {
        result.errors.push(`Observations parse error: ${String(e)}`);
      }
    }

    // 3. Migrate Alerts (Grouped by plantId)
    const rawAlerts = localStorage.getItem(LEGACY_KEYS.alerts);
    if (rawAlerts) {
      try {
        const parsedAlerts = JSON.parse(rawAlerts);
        if (parsedAlerts && typeof parsedAlerts === 'object') {
          for (const [keyPlantId, alertsList] of Object.entries(parsedAlerts)) {
            if (Array.isArray(alertsList)) {
              for (const alert of alertsList as PlantAlert[]) {
                if (alert && alert.id && (alert.category || alert.severity || (alert as unknown as { type?: string }).type)) {
                  const targetPlantId = alert.plantId || keyPlantId || activePlantId;
                  await saveAlert(uid, farmId, stationId, targetPlantId, {
                    ...alert,
                    plantId: targetPlantId,
                  });
                  result.migratedAlerts++;
                } else {
                  unlinkedQuarantine.push({ type: 'alert', data: alert });
                  result.unlinkedQuarantined++;
                }
              }
            }
          }
        }
      } catch (e) {
        result.errors.push(`Alerts parse error: ${String(e)}`);
      }
    }

    // 4. Migrate Calibration Profile
    const rawCal = localStorage.getItem(LEGACY_KEYS.calibration);
    if (rawCal) {
      try {
        const parsedCal: SensorCalibrationProfile = JSON.parse(rawCal);
        if (parsedCal && parsedCal.ph && parsedCal.tds && parsedCal.ultrasonic) {
          await saveCalibration(uid, farmId, stationId, activePlantId, {
            ...parsedCal,
            id: `cal_${stationId}_v11`,
            stationId,
            plantId: activePlantId,
          });
          result.migratedCalibrations++;
        } else {
          unlinkedQuarantine.push({ type: 'calibration', data: parsedCal });
          result.unlinkedQuarantined++;
        }
      } catch (e) {
        result.errors.push(`Calibration parse error: ${String(e)}`);
      }
    }

    // Safely store quarantined unlinked records if any exist
    if (unlinkedQuarantine.length > 0) {
      try {
        const existingQuarantineRaw = localStorage.getItem(UNLINKED_LEGACY_QUARANTINE_KEY);
        const existingQuarantine = existingQuarantineRaw ? JSON.parse(existingQuarantineRaw) : [];
        localStorage.setItem(
          UNLINKED_LEGACY_QUARANTINE_KEY,
          JSON.stringify([...existingQuarantine, ...unlinkedQuarantine])
        );
      } catch (qErr) {
        console.warn('[MigrationService] Failed to quarantine unlinked items:', qErr);
      }
    }

    // Mark migration completed
    localStorage.setItem(MIGRATION_FLAG_KEY, 'done');
    result.status = 'COMPLETED';
    return result;
  } catch (err: unknown) {
    result.status = 'FAILED';
    result.errors.push(err instanceof Error ? err.message : String(err));
    return result;
  }
}
