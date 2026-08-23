// ============================================================
// HydroSmart — Cloud Firestore Data Access Service Layer
// Scoped strictly to authenticated user UID: users/{uid}/...
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
  deleteDoc
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import {
  FirestoreFarm,
  FirestoreStation,
  FirestorePlant,
  FirestoreObservation
} from './types';

/**
 * Validate an observation before persisting to prevent NaN/Infinity corruptions
 */
export function validateObservation(obs: Partial<FirestoreObservation>): boolean {
  if (!obs || typeof obs !== 'object') return false;
  if (!obs.timestamp || typeof obs.timestamp !== 'number' || !isFinite(obs.timestamp)) return false;

  // Check numerical parameters if present
  const checkFinite = (val: unknown) => val === undefined || (typeof val === 'number' && isFinite(val) && !isNaN(val));

  if (!checkFinite(obs.ph)) return false;
  if (!checkFinite(obs.tds)) return false;
  if (!checkFinite(obs.waterLevel)) return false;
  if (!checkFinite(obs.distance)) return false;
  if (!checkFinite(obs.visualHealthScore)) return false;
  if (!checkFinite(obs.canopyCoverage)) return false;
  if (!checkFinite(obs.vegetationIndex)) return false;
  if (!checkFinite(obs.chlorosisYellowPercent)) return false;
  if (!checkFinite(obs.necroticBrownPercent)) return false;
  if (!checkFinite(obs.overallHealthScore)) return false;
  if (!checkFinite(obs.environmentalHealthScore)) return false;

  return true;
}

// ============================================================
// 1. Farms Data Access
// ============================================================

export async function createFarm(
  uid: string,
  farm: Omit<FirestoreFarm, 'createdAt' | 'updatedAt'>
): Promise<FirestoreFarm> {
  if (!firestore) throw new Error('Firestore is not initialized');
  if (!uid) throw new Error('Authenticated UID is required');

  const farmRef = doc(firestore, 'users', uid, 'farms', farm.id);
  const payload: FirestoreFarm = {
    ...farm,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(farmRef, payload, { merge: true });
  return payload;
}

export async function getFarms(uid: string): Promise<FirestoreFarm[]> {
  if (!firestore || !uid) return [];
  try {
    const farmsCol = collection(firestore, 'users', uid, 'farms');
    const snapshot = await getDocs(farmsCol);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreFarm));
  } catch (err) {
    console.warn('[Firestore] Error reading farms:', err);
    return [];
  }
}

export async function updateFarm(
  uid: string,
  farmId: string,
  data: Partial<FirestoreFarm>
): Promise<void> {
  if (!firestore || !uid || !farmId) return;
  const farmRef = doc(firestore, 'users', uid, 'farms', farmId);
  await updateDoc(farmRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteFarm(uid: string, farmId: string): Promise<void> {
  if (!firestore || !uid || !farmId) return;
  const farmRef = doc(firestore, 'users', uid, 'farms', farmId);
  await deleteDoc(farmRef);
}

// ============================================================
// 2. Stations Data Access
// ============================================================

export async function createStation(
  uid: string,
  farmId: string,
  station: Omit<FirestoreStation, 'createdAt' | 'updatedAt'>
): Promise<FirestoreStation> {
  if (!firestore) throw new Error('Firestore is not initialized');
  if (!uid || !farmId) throw new Error('Authenticated UID and Farm ID are required');

  const stationRef = doc(firestore, 'users', uid, 'farms', farmId, 'stations', station.id);
  const payload: FirestoreStation = {
    ...station,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(stationRef, payload, { merge: true });
  return payload;
}

export async function getStations(uid: string, farmId: string): Promise<FirestoreStation[]> {
  if (!firestore || !uid || !farmId) return [];
  try {
    const stationsCol = collection(firestore, 'users', uid, 'farms', farmId, 'stations');
    const snapshot = await getDocs(stationsCol);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreStation));
  } catch (err) {
    console.warn('[Firestore] Error reading stations:', err);
    return [];
  }
}

export async function updateStation(
  uid: string,
  farmId: string,
  stationId: string,
  data: Partial<FirestoreStation>
): Promise<void> {
  if (!firestore || !uid || !farmId || !stationId) return;
  const stationRef = doc(firestore, 'users', uid, 'farms', farmId, 'stations', stationId);
  await updateDoc(stationRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// 3. Plants Data Access
// ============================================================

export async function createPlant(
  uid: string,
  farmId: string,
  stationId: string,
  plant: Omit<FirestorePlant, 'createdAt' | 'updatedAt'>
): Promise<FirestorePlant> {
  if (!firestore) throw new Error('Firestore is not initialized');
  if (!uid || !farmId || !stationId) throw new Error('Authenticated UID, Farm ID, and Station ID are required');

  const plantRef = doc(firestore, 'users', uid, 'farms', farmId, 'stations', stationId, 'plants', plant.id);
  const payload: FirestorePlant = {
    ...plant,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(plantRef, payload, { merge: true });
  return payload;
}

export async function getPlants(uid: string, farmId: string, stationId: string): Promise<FirestorePlant[]> {
  if (!firestore || !uid || !farmId || !stationId) return [];
  try {
    const plantsCol = collection(firestore, 'users', uid, 'farms', farmId, 'stations', stationId, 'plants');
    const snapshot = await getDocs(plantsCol);
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FirestorePlant));
  } catch (err) {
    console.warn('[Firestore] Error reading plants:', err);
    return [];
  }
}

export async function updatePlant(
  uid: string,
  farmId: string,
  stationId: string,
  plantId: string,
  data: Partial<FirestorePlant>
): Promise<void> {
  if (!firestore || !uid || !farmId || !stationId || !plantId) return;
  const plantRef = doc(firestore, 'users', uid, 'farms', farmId, 'stations', stationId, 'plants', plantId);
  await updateDoc(plantRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ============================================================
// 4. Plant Observations Data Access
// ============================================================

export async function createObservation(
  uid: string,
  farmId: string,
  stationId: string,
  plantId: string,
  observation: FirestoreObservation
): Promise<FirestoreObservation> {
  if (!firestore) throw new Error('Firestore is not initialized');
  if (!uid || !farmId || !stationId || !plantId) throw new Error('Complete path identifiers required');

  if (!validateObservation(observation)) {
    throw new Error('Invalid or corrupted observation record rejected.');
  }

  const obsId = observation.id || `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const obsRef = doc(
    firestore,
    'users',
    uid,
    'farms',
    farmId,
    'stations',
    stationId,
    'plants',
    plantId,
    'observations',
    obsId
  );

  const payload: FirestoreObservation = {
    ...observation,
    id: obsId,
    createdAt: serverTimestamp(),
  };

  await setDoc(obsRef, payload);
  return payload;
}

export async function getObservations(
  uid: string,
  farmId: string,
  stationId: string,
  plantId: string,
  limitCount = 50
): Promise<FirestoreObservation[]> {
  if (!firestore || !uid || !farmId || !stationId || !plantId) return [];

  try {
    const obsCol = collection(
      firestore,
      'users',
      uid,
      'farms',
      farmId,
      'stations',
      stationId,
      'plants',
      plantId,
      'observations'
    );

    const q = query(obsCol, orderBy('timestamp', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as FirestoreObservation));
  } catch (err) {
    console.warn('[Firestore] Error querying observations (using fallback):', err);
    return [];
  }
}

// ============================================================
// 5. Hierarchy Auto-Provisioning for Authenticated Users
// ============================================================

export interface ActiveHierarchy {
  farmId: string;
  stationId: string;
  plantId: string;
  farm: FirestoreFarm;
  station: FirestoreStation;
  plant: FirestorePlant;
}

export async function ensureDefaultHierarchy(
  uid: string,
  initialSpeciesName = 'Butterhead Lettuce'
): Promise<ActiveHierarchy> {
  if (!firestore) throw new Error('Firestore is not initialized');

  const defaultFarmId = 'farm_main';
  const defaultStationId = 'station_esp32_1';
  const defaultPlantId = 'plant_crop_1';

  // 1. Ensure Farm
  const farmRef = doc(firestore, 'users', uid, 'farms', defaultFarmId);
  const farmSnap = await getDoc(farmRef);
  let farmData: FirestoreFarm;

  if (farmSnap.exists()) {
    farmData = farmSnap.data() as FirestoreFarm;
  } else {
    farmData = {
      id: defaultFarmId,
      name: 'Main Hydroponic Facility',
      location: 'Primary Indoor Bay',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(farmRef, farmData);
  }

  // 2. Ensure Station
  const stationRef = doc(firestore, 'users', uid, 'farms', defaultFarmId, 'stations', defaultStationId);
  const stationSnap = await getDoc(stationRef);
  let stationData: FirestoreStation;

  if (stationSnap.exists()) {
    stationData = stationSnap.data() as FirestoreStation;
  } else {
    stationData = {
      id: defaultStationId,
      name: 'Hydroponic Station 1',
      status: 'online',
      deviceType: 'ESP32',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastSeenAt: Date.now(),
    };
    await setDoc(stationRef, stationData);
  }

  // 3. Ensure Plant
  const plantRef = doc(
    firestore,
    'users',
    uid,
    'farms',
    defaultFarmId,
    'stations',
    defaultStationId,
    'plants',
    defaultPlantId
  );
  const plantSnap = await getDoc(plantRef);
  let plantData: FirestorePlant;

  if (plantSnap.exists()) {
    plantData = plantSnap.data() as FirestorePlant;
  } else {
    plantData = {
      id: defaultPlantId,
      name: 'Active Crop 1',
      species: initialSpeciesName,
      speciesConfidence: 94,
      healthState: 'optimal',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(plantRef, plantData);
  }

  return {
    farmId: defaultFarmId,
    stationId: defaultStationId,
    plantId: defaultPlantId,
    farm: farmData,
    station: stationData,
    plant: plantData,
  };
}
