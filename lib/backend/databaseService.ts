// ============================================================
// HydroSmart — Unified Database & Persistence Service Layer
// Phase 12: Production-grade multi-plant data access layer
// Bridges Cloud Firestore with reliable Local Offline Fallback
// ============================================================

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { firestore, isFirebaseConfigured } from '@/lib/firebase';
import {
  PersistenceResult,
  DbPlantProfile,
  DbPlantObservation,
  DbTelemetrySnapshot,
  DbPlantReasoningEvent,
  DbPlantChangeEvent,
  DbEnvironmentPlantAssociation,
  DbPlantAlert,
  DbSensorCalibrationProfile,
} from './types';
import { PlantAlertStatus } from '@/lib/intelligence/types';

export const DEFAULT_DEVICE_USER = 'usr_local_device';
export const DEFAULT_FARM_ID = 'farm_main';
export const DEFAULT_STATION_ID = 'station_esp32_1';
export const DEFAULT_PRIMARY_PLANT_ID = 'plant_primary';

// Local storage partition keys for offline fallback & client mounts
const STORAGE_PREFIX = 'hydrosmart_db_v12_';
function getLocalKey(subKey: string, plantId: string): string {
  return `${STORAGE_PREFIX}${subKey}_${plantId}`;
}

// Numerical sanitization helper
function isSanitizedNumber(n: unknown): boolean {
  return typeof n === 'number' && isFinite(n) && !isNaN(n);
}

// In-memory runtime cache for seamless offline operation & testing
const memoryStore: Record<string, unknown> = {};

function readFromLocalCache<T>(key: string): T | null {
  if (memoryStore[key] !== undefined) {
    return memoryStore[key] as T;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        memoryStore[key] = parsed;
        return parsed as T;
      }
    } catch (err) {
      console.warn(`[DatabaseService] Local storage read error for ${key}:`, err);
    }
  }
  return null;
}

function writeToLocalCache<T>(key: string, data: T): void {
  memoryStore[key] = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.warn(`[DatabaseService] Local storage write error for ${key}:`, err);
    }
  }
}

// ============================================================
// 1. Plant Profile Access
// ============================================================

export async function savePlantProfile(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  profile: DbPlantProfile
): Promise<PersistenceResult<DbPlantProfile>> {
  const plantId = profile.plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('profile', plantId);

  // Always update local cache immediately
  writeToLocalCache(localKey, profile);

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: profile,
      plantId,
      syncedAt: Date.now(),
    };
  }

  try {
    const plantRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      plantId
    );

    const payload = {
      ...profile,
      userId: ownerUid,
      farmId: farmId || DEFAULT_FARM_ID,
      stationId: stationId || DEFAULT_STATION_ID,
      updatedAt: serverTimestamp(),
    };

    await setDoc(plantRef, payload, { merge: true });

    return {
      status: 'SAVED',
      data: profile,
      plantId,
      syncedAt: Date.now(),
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] savePlantProfile cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: profile,
      plantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: Date.now(),
    };
  }
}

export async function getPlantProfile(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string
): Promise<DbPlantProfile | null> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('profile', effectivePlantId);

  if (isFirebaseConfigured && firestore) {
    try {
      const plantRef = doc(
        firestore,
        'users',
        ownerUid,
        'farms',
        farmId || DEFAULT_FARM_ID,
        'stations',
        stationId || DEFAULT_STATION_ID,
        'plants',
        effectivePlantId
      );
      const snapshot = await getDoc(plantRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as DbPlantProfile;
        writeToLocalCache(localKey, data);
        return data;
      }
    } catch (err) {
      console.warn('[DatabaseService] getPlantProfile cloud error (using cache):', err);
    }
  }

  return readFromLocalCache<DbPlantProfile>(localKey);
}

// ============================================================
// 2. Observations Access
// ============================================================

export function validateDbObservation(obs: Partial<DbPlantObservation>): boolean {
  if (!obs || typeof obs !== 'object') return false;
  if (!obs.timestamp || !isSanitizedNumber(obs.timestamp) || obs.timestamp <= 0) return false;
  if (obs.ph !== undefined && !isSanitizedNumber(obs.ph)) return false;
  if (obs.tds !== undefined && !isSanitizedNumber(obs.tds)) return false;
  if (obs.waterLevel !== undefined && !isSanitizedNumber(obs.waterLevel)) return false;
  if (obs.distance !== undefined && !isSanitizedNumber(obs.distance)) return false;
  return true;
}

export async function saveObservation(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  observation: DbPlantObservation
): Promise<PersistenceResult<DbPlantObservation>> {
  const effectivePlantId = plantId || observation.plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const obsId = observation.id || `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const normalizedObs: DbPlantObservation = {
    ...observation,
    id: obsId,
    plantId: effectivePlantId,
  };

  if (!validateDbObservation(normalizedObs)) {
    return {
      status: 'FAILED',
      data: normalizedObs,
      plantId: effectivePlantId,
      error: 'Observation payload rejected: invalid timestamp or corrupted metrics.',
    };
  }

  // Update local cache
  const localKey = getLocalKey('observations', effectivePlantId);
  const currentList = readFromLocalCache<DbPlantObservation[]>(localKey) || [];
  const updatedList = [normalizedObs, ...currentList.filter(o => o.id !== obsId)].slice(0, 100);
  writeToLocalCache(localKey, updatedList);

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: normalizedObs,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  }

  try {
    const obsRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      effectivePlantId,
      'observations',
      obsId
    );

    const payload = {
      ...normalizedObs,
      userId: ownerUid,
      farmId: farmId || DEFAULT_FARM_ID,
      stationId: stationId || DEFAULT_STATION_ID,
      createdAt: serverTimestamp(),
    };

    await setDoc(obsRef, payload);

    return {
      status: 'SAVED',
      data: normalizedObs,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] saveObservation cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: normalizedObs,
      plantId: effectivePlantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: Date.now(),
    };
  }
}

export async function getObservations(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  limitCount = 50
): Promise<DbPlantObservation[]> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('observations', effectivePlantId);

  if (isFirebaseConfigured && firestore) {
    try {
      const obsCol = collection(
        firestore,
        'users',
        ownerUid,
        'farms',
        farmId || DEFAULT_FARM_ID,
        'stations',
        stationId || DEFAULT_STATION_ID,
        'plants',
        effectivePlantId,
        'observations'
      );
      const q = query(obsCol, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DbPlantObservation));
        writeToLocalCache(localKey, docs);
        return docs;
      }
    } catch (err) {
      console.warn('[DatabaseService] getObservations cloud error (using cache):', err);
    }
  }

  const cached = readFromLocalCache<DbPlantObservation[]>(localKey);
  return cached ? cached.slice(0, limitCount) : [];
}

// ============================================================
// 3. Telemetry Snapshots (Aggregated / Periodic Sensor History)
// ============================================================

export async function saveTelemetrySnapshot(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  snapshot: DbTelemetrySnapshot
): Promise<PersistenceResult<DbTelemetrySnapshot>> {
  const effectivePlantId = plantId || snapshot.plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const snapId = snapshot.id || `snap_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const normalizedSnap: DbTelemetrySnapshot = {
    ...snapshot,
    id: snapId,
    plantId: effectivePlantId,
  };

  // Validation
  if (
    !isSanitizedNumber(normalizedSnap.ph) ||
    !isSanitizedNumber(normalizedSnap.tds) ||
    !isSanitizedNumber(normalizedSnap.waterLevel)
  ) {
    return {
      status: 'FAILED',
      data: normalizedSnap,
      plantId: effectivePlantId,
      error: 'Telemetry snapshot rejected: NaN or non-finite values detected.',
    };
  }

  // Update local cache
  const localKey = getLocalKey('telemetry', effectivePlantId);
  const currentList = readFromLocalCache<DbTelemetrySnapshot[]>(localKey) || [];
  const updatedList = [normalizedSnap, ...currentList.filter(s => s.id !== snapId)].slice(0, 120);
  writeToLocalCache(localKey, updatedList);

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: normalizedSnap,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  }

  try {
    const snapRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      effectivePlantId,
      'telemetry_snapshots',
      snapId
    );

    const payload = {
      ...normalizedSnap,
      createdAt: serverTimestamp(),
    };

    await setDoc(snapRef, payload);

    return {
      status: 'SAVED',
      data: normalizedSnap,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] saveTelemetrySnapshot cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: normalizedSnap,
      plantId: effectivePlantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: Date.now(),
    };
  }
}

export async function getTelemetryHistory(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  limitCount = 60
): Promise<DbTelemetrySnapshot[]> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('telemetry', effectivePlantId);

  if (isFirebaseConfigured && firestore) {
    try {
      const snapCol = collection(
        firestore,
        'users',
        ownerUid,
        'farms',
        farmId || DEFAULT_FARM_ID,
        'stations',
        stationId || DEFAULT_STATION_ID,
        'plants',
        effectivePlantId,
        'telemetry_snapshots'
      );
      const q = query(snapCol, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DbTelemetrySnapshot));
        writeToLocalCache(localKey, docs);
        return docs;
      }
    } catch (err) {
      console.warn('[DatabaseService] getTelemetryHistory cloud error (using cache):', err);
    }
  }

  const cached = readFromLocalCache<DbTelemetrySnapshot[]>(localKey);
  return cached ? cached.slice(0, limitCount) : [];
}

// ============================================================
// 4. Multimodal Reasoning Events
// ============================================================

export async function saveReasoningEvent(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  event: DbPlantReasoningEvent
): Promise<PersistenceResult<DbPlantReasoningEvent>> {
  const effectivePlantId = plantId || event.plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const eventId = event.id || `re_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const normalizedEvent: DbPlantReasoningEvent = {
    ...event,
    id: eventId,
    plantId: effectivePlantId,
  };

  const localKey = getLocalKey('reasoning', effectivePlantId);
  const currentList = readFromLocalCache<DbPlantReasoningEvent[]>(localKey) || [];
  // Prevent identical duplicate events
  if (
    currentList.length > 0 &&
    currentList[0].scenarioCode === event.scenarioCode &&
    currentList[0].confidence === event.confidence &&
    Math.abs(currentList[0].timestamp - event.timestamp) < 5000
  ) {
    return {
      status: 'SAVED',
      data: currentList[0],
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  }

  const updatedList = [normalizedEvent, ...currentList.filter(e => e.id !== eventId)].slice(0, 50);
  writeToLocalCache(localKey, updatedList);

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: normalizedEvent,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  }

  try {
    const eventRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      effectivePlantId,
      'reasoning_events',
      eventId
    );

    const payload = {
      ...normalizedEvent,
      createdAt: serverTimestamp(),
    };

    await setDoc(eventRef, payload);

    return {
      status: 'SAVED',
      data: normalizedEvent,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] saveReasoningEvent cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: normalizedEvent,
      plantId: effectivePlantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: Date.now(),
    };
  }
}

export async function getReasoningHistory(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  limitCount = 30
): Promise<DbPlantReasoningEvent[]> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('reasoning', effectivePlantId);

  if (isFirebaseConfigured && firestore) {
    try {
      const eventCol = collection(
        firestore,
        'users',
        ownerUid,
        'farms',
        farmId || DEFAULT_FARM_ID,
        'stations',
        stationId || DEFAULT_STATION_ID,
        'plants',
        effectivePlantId,
        'reasoning_events'
      );
      const q = query(eventCol, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DbPlantReasoningEvent));
        writeToLocalCache(localKey, docs);
        return docs;
      }
    } catch (err) {
      console.warn('[DatabaseService] getReasoningHistory cloud error (using cache):', err);
    }
  }

  const cached = readFromLocalCache<DbPlantReasoningEvent[]>(localKey);
  return cached ? cached.slice(0, limitCount) : [];
}

// ============================================================
// 5. Change Events ("What Changed")
// ============================================================

export async function saveChangeEvent(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  event: DbPlantChangeEvent
): Promise<PersistenceResult<DbPlantChangeEvent>> {
  const effectivePlantId = plantId || event.plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const eventId = event.id || `change_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const normalizedEvent: DbPlantChangeEvent = {
    ...event,
    id: eventId,
    plantId: effectivePlantId,
  };

  const localKey = getLocalKey('changes', effectivePlantId);
  const currentList = readFromLocalCache<DbPlantChangeEvent[]>(localKey) || [];
  const updatedList = [normalizedEvent, ...currentList.filter(c => c.id !== eventId)].slice(0, 50);
  writeToLocalCache(localKey, updatedList);

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: normalizedEvent,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  }

  try {
    const changeRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      effectivePlantId,
      'change_events',
      eventId
    );

    const payload = {
      ...normalizedEvent,
      createdAt: serverTimestamp(),
    };

    await setDoc(changeRef, payload);

    return {
      status: 'SAVED',
      data: normalizedEvent,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] saveChangeEvent cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: normalizedEvent,
      plantId: effectivePlantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: Date.now(),
    };
  }
}

export async function getChangeHistory(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  limitCount = 30
): Promise<DbPlantChangeEvent[]> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('changes', effectivePlantId);

  if (isFirebaseConfigured && firestore) {
    try {
      const changeCol = collection(
        firestore,
        'users',
        ownerUid,
        'farms',
        farmId || DEFAULT_FARM_ID,
        'stations',
        stationId || DEFAULT_STATION_ID,
        'plants',
        effectivePlantId,
        'change_events'
      );
      const q = query(changeCol, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DbPlantChangeEvent));
        writeToLocalCache(localKey, docs);
        return docs;
      }
    } catch (err) {
      console.warn('[DatabaseService] getChangeHistory cloud error (using cache):', err);
    }
  }

  const cached = readFromLocalCache<DbPlantChangeEvent[]>(localKey);
  return cached ? cached.slice(0, limitCount) : [];
}

// ============================================================
// 6. Correlations (Environment ↔ Plant Associations)
// ============================================================

export async function saveAssociation(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  association: DbEnvironmentPlantAssociation
): Promise<PersistenceResult<DbEnvironmentPlantAssociation>> {
  const effectivePlantId = plantId || association.plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const assocId = association.id || `assoc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const normalizedAssoc: DbEnvironmentPlantAssociation = {
    ...association,
    id: assocId,
    plantId: effectivePlantId,
  };

  const localKey = getLocalKey('correlations', effectivePlantId);
  const currentList = readFromLocalCache<DbEnvironmentPlantAssociation[]>(localKey) || [];
  const updatedList = [normalizedAssoc, ...currentList.filter(a => a.id !== assocId)].slice(0, 50);
  writeToLocalCache(localKey, updatedList);

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: normalizedAssoc,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  }

  try {
    const assocRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      effectivePlantId,
      'correlations',
      assocId
    );

    const payload = {
      ...normalizedAssoc,
      createdAt: serverTimestamp(),
    };

    await setDoc(assocRef, payload);

    return {
      status: 'SAVED',
      data: normalizedAssoc,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] saveAssociation cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: normalizedAssoc,
      plantId: effectivePlantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: Date.now(),
    };
  }
}

export async function getAssociations(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  limitCount = 30
): Promise<DbEnvironmentPlantAssociation[]> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('correlations', effectivePlantId);

  if (isFirebaseConfigured && firestore) {
    try {
      const assocCol = collection(
        firestore,
        'users',
        ownerUid,
        'farms',
        farmId || DEFAULT_FARM_ID,
        'stations',
        stationId || DEFAULT_STATION_ID,
        'plants',
        effectivePlantId,
        'correlations'
      );
      const q = query(assocCol, orderBy('timestamp', 'desc'), limit(limitCount));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DbEnvironmentPlantAssociation));
        writeToLocalCache(localKey, docs);
        return docs;
      }
    } catch (err) {
      console.warn('[DatabaseService] getAssociations cloud error (using cache):', err);
    }
  }

  const cached = readFromLocalCache<DbEnvironmentPlantAssociation[]>(localKey);
  return cached ? cached.slice(0, limitCount) : [];
}

// ============================================================
// 7. Plant Alerts & Lifecycle Management
// ============================================================

export async function saveAlert(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  alert: DbPlantAlert
): Promise<PersistenceResult<DbPlantAlert>> {
  const effectivePlantId = plantId || alert.plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const alertId = alert.id || `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const normalizedAlert: DbPlantAlert = {
    ...alert,
    id: alertId,
    plantId: effectivePlantId,
  };

  const localKey = getLocalKey('alerts', effectivePlantId);
  const currentList = readFromLocalCache<DbPlantAlert[]>(localKey) || [];
  const updatedList = [normalizedAlert, ...currentList.filter(a => a.id !== alertId)].slice(0, 50);
  writeToLocalCache(localKey, updatedList);

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: normalizedAlert,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  }

  try {
    const alertRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      effectivePlantId,
      'alerts',
      alertId
    );

    const payload = {
      ...normalizedAlert,
      updatedAt: serverTimestamp(),
    };

    await setDoc(alertRef, payload, { merge: true });

    return {
      status: 'SAVED',
      data: normalizedAlert,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] saveAlert cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: normalizedAlert,
      plantId: effectivePlantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: Date.now(),
    };
  }
}

export async function getAlerts(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string
): Promise<DbPlantAlert[]> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('alerts', effectivePlantId);

  if (isFirebaseConfigured && firestore) {
    try {
      const alertCol = collection(
        firestore,
        'users',
        ownerUid,
        'farms',
        farmId || DEFAULT_FARM_ID,
        'stations',
        stationId || DEFAULT_STATION_ID,
        'plants',
        effectivePlantId,
        'alerts'
      );
      const q = query(alertCol, orderBy('updatedAt', 'desc'), limit(50));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as DbPlantAlert));
        writeToLocalCache(localKey, docs);
        return docs;
      }
    } catch (err) {
      console.warn('[DatabaseService] getAlerts cloud error (using cache):', err);
    }
  }

  return readFromLocalCache<DbPlantAlert[]>(localKey) || [];
}

export async function updateAlertStatus(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  alertId: string,
  newStatus: PlantAlertStatus
): Promise<PersistenceResult<DbPlantAlert | null>> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('alerts', effectivePlantId);
  const currentList = readFromLocalCache<DbPlantAlert[]>(localKey) || [];

  const now = Date.now();
  let targetAlert: DbPlantAlert | null = null;
  const updatedList = currentList.map(a => {
    if (a.id === alertId) {
      targetAlert = {
        ...a,
        status: newStatus,
        updatedAt: now,
        dismissedAt: newStatus === 'DISMISSED' ? now : a.dismissedAt,
        resolvedAt: newStatus === 'RESOLVED' ? now : a.resolvedAt,
      };
      return targetAlert;
    }
    return a;
  });

  if (targetAlert) {
    writeToLocalCache(localKey, updatedList);
  }

  if (!targetAlert) {
    return {
      status: 'FAILED',
      data: null,
      plantId: effectivePlantId,
      error: `Alert ${alertId} not found.`,
    };
  }

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: targetAlert,
      plantId: effectivePlantId,
      syncedAt: now,
    };
  }

  try {
    const alertRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      effectivePlantId,
      'alerts',
      alertId
    );

    await updateDoc(alertRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...(newStatus === 'DISMISSED' ? { dismissedAt: now } : {}),
      ...(newStatus === 'RESOLVED' ? { resolvedAt: now } : {}),
    });

    return {
      status: 'SAVED',
      data: targetAlert,
      plantId: effectivePlantId,
      syncedAt: now,
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] updateAlertStatus cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: targetAlert,
      plantId: effectivePlantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: now,
    };
  }
}

// ============================================================
// 8. Sensor Calibration Profiles
// ============================================================

export async function saveCalibration(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string,
  calibration: DbSensorCalibrationProfile
): Promise<PersistenceResult<DbSensorCalibrationProfile>> {
  const effectivePlantId = plantId || calibration.plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const profileId = calibration.id || `cal_${stationId || DEFAULT_STATION_ID}_v11`;
  const normalizedCal: DbSensorCalibrationProfile = {
    ...calibration,
    id: profileId,
    plantId: effectivePlantId,
    stationId: stationId || DEFAULT_STATION_ID,
  };

  const localKey = getLocalKey('calibration', effectivePlantId);
  writeToLocalCache(localKey, normalizedCal);

  if (!isFirebaseConfigured || !firestore) {
    return {
      status: 'LOCAL_ONLY',
      data: normalizedCal,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  }

  try {
    const calRef = doc(
      firestore,
      'users',
      ownerUid,
      'farms',
      farmId || DEFAULT_FARM_ID,
      'stations',
      stationId || DEFAULT_STATION_ID,
      'plants',
      effectivePlantId,
      'calibrations',
      profileId
    );

    const payload = {
      ...normalizedCal,
      createdAt: serverTimestamp(),
    };

    await setDoc(calRef, payload, { merge: true });

    return {
      status: 'SAVED',
      data: normalizedCal,
      plantId: effectivePlantId,
      syncedAt: Date.now(),
    };
  } catch (err: unknown) {
    console.warn('[DatabaseService] saveCalibration cloud fallback:', err);
    return {
      status: 'LOCAL_ONLY',
      data: normalizedCal,
      plantId: effectivePlantId,
      error: err instanceof Error ? err.message : String(err),
      syncedAt: Date.now(),
    };
  }
}

export async function getCalibration(
  uid: string | null | undefined,
  farmId: string,
  stationId: string,
  plantId: string
): Promise<DbSensorCalibrationProfile | null> {
  const effectivePlantId = plantId || DEFAULT_PRIMARY_PLANT_ID;
  const ownerUid = uid || DEFAULT_DEVICE_USER;
  const localKey = getLocalKey('calibration', effectivePlantId);

  if (isFirebaseConfigured && firestore) {
    try {
      const calRef = doc(
        firestore,
        'users',
        ownerUid,
        'farms',
        farmId || DEFAULT_FARM_ID,
        'stations',
        stationId || DEFAULT_STATION_ID,
        'plants',
        effectivePlantId,
        'calibrations',
        `cal_${stationId || DEFAULT_STATION_ID}_v11`
      );
      const snapshot = await getDoc(calRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as DbSensorCalibrationProfile;
        writeToLocalCache(localKey, data);
        return data;
      }
    } catch (err) {
      console.warn('[DatabaseService] getCalibration cloud error (using cache):', err);
    }
  }

  return readFromLocalCache<DbSensorCalibrationProfile>(localKey);
}

// Testing / Reset utility
export function clearInMemoryDbCache(): void {
  for (const k of Object.keys(memoryStore)) {
    delete memoryStore[k];
  }
}
