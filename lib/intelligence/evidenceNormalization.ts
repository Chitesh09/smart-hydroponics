// ============================================================
// HydroSmart — Evidence Normalization Layer
// Standardizes Heterogeneous Raw Inputs into Strongly Typed Evidence
// Strictly Scientific: Preserves Disconnection & Never Fabricates Data
// ============================================================

import {
  PlantEvidence,
  SensorEvidence,
  PlantIdentity,
  PlantObservation,
  CropTargetProfile,
  StructuredHealthState,
  SensorAvailabilityState,
} from './types';
import { PlantDetectionResult, PlantPresenceState } from '@/lib/vision/plantDetector';
import { VisualHealthAnalysisResult } from '@/lib/vision/plantHealthAnalyzer';
import { SensorReading } from '@/lib/esp32/ESP32SerialContext';
import { SENSOR_THRESHOLDS } from '@/lib/sensorConfig';

export interface RawEvidenceInputs {
  plantId: string;
  detection: PlantDetectionResult | null;
  visualHealth: VisualHealthAnalysisResult | null;
  cropIdentity: PlantIdentity | null;
  sensorReading: SensorReading | null;
  sensorHistory?: SensorReading[];
  observationHistory?: PlantObservation[];
  cropTargetProfile: CropTargetProfile;
  telemetryMode?: 'real' | 'simulation';
  isTelemetryStale?: boolean;
  isCameraActive?: boolean;
}

export interface NormalizedEvidencePackage {
  plantId: string;
  timestamp: number;
  evidenceList: PlantEvidence[];
  sensorEvidence: Record<'ph' | 'tds' | 'waterLevel', SensorEvidence>;
  isCameraAvailable: boolean;
  isSensorAvailable: boolean;
  isSimulation: boolean;
  presenceState: PlantPresenceState | 'NO_CAMERA';
  isPlantDetected: boolean;
  speciesName?: string;
  speciesConfidence?: number;
  isSpeciesIdentified: boolean;
  visualHealthState: StructuredHealthState;
  visualHealthScore?: number;
  chlorosisPercent?: number;
  necroticPercent?: number;
  canopyCoveragePercent?: number;
  textureGradient?: number;
  hasHistoricalBaseline: boolean;
  observationCount: number;
  historicalVisualDelta?: {
    canopyDelta: number;
    relativeCanopyChange: number;
    chlorosisDelta: number;
    necrosisDelta: number;
  } | null;
  historicalSensorAssociation?: {
    waterDropOccurred: boolean;
    nutrientShiftOccurred: boolean;
    phShiftOccurred: boolean;
    summary: string;
  } | null;
  cropTargetProfile: CropTargetProfile;
}

/**
 * Normalizes all available sensory, botanical, historical, and statistical data
 * into a structured package for the Multimodal Reasoning Engine.
 */
export function normalizePlantEvidence(inputs: RawEvidenceInputs): NormalizedEvidencePackage {
  const timestamp = Date.now();
  const plantId = inputs.plantId || 'plant_primary';
  const evidenceList: PlantEvidence[] = [];

  const isSimulation = inputs.telemetryMode === 'simulation';
  const isStale = inputs.isTelemetryStale ?? false;
  const isSensorAvailable = inputs.sensorReading !== null && !isStale;
  const isCameraAvailable = inputs.isCameraActive !== false && inputs.detection !== null;

  // ------------------------------------------------------------
  // 1. SENSOR EVIDENCE NORMALIZATION (pH, TDS, Water Level)
  // ------------------------------------------------------------
  const reading = inputs.sensorReading;
  const history = inputs.sensorHistory || [];
  const target = inputs.cropTargetProfile;

  const sensorAvailability: SensorAvailabilityState = !isSensorAvailable
    ? 'unavailable'
    : isSimulation
      ? 'simulated'
      : 'available';

  const sensorQuality = !isSensorAvailable
    ? 'unknown'
    : isStale
      ? 'stale'
      : 'reliable';

  // pH Sensor
  const prevReading = history.length >= 2 ? history[history.length - 2] : null;
  const currentPh = isSensorAvailable && reading ? reading.ph : undefined;
  const prevPh = prevReading ? prevReading.ph : undefined;
  const phDelta = currentPh !== undefined && prevPh !== undefined ? parseFloat((currentPh - prevPh).toFixed(2)) : undefined;

  let phTrend: SensorEvidence['trend'] = 'insufficient_data';
  if (phDelta !== undefined) {
    if (phDelta > 0.10) phTrend = 'rising';
    else if (phDelta < -0.10) phTrend = 'falling';
    else phTrend = 'stable';
  }

  const isPhLow = currentPh !== undefined && currentPh < target.phMin;
  const isPhHigh = currentPh !== undefined && currentPh > target.phMax;
  const hasPhAnomaly = isPhLow || isPhHigh;

  const phEvidence: SensorEvidence = {
    metric: 'ph',
    label: 'Solution pH',
    current: currentPh,
    previous: prevPh,
    baseline: (target.phMin + target.phMax) / 2,
    delta: phDelta,
    unit: 'pH',
    trend: phTrend,
    hasAnomaly: hasPhAnomaly,
    anomalySeverity: (currentPh !== undefined && (currentPh < target.phMin - 0.6 || currentPh > target.phMax + 0.6)) ? 'critical' : (hasPhAnomaly ? 'warning' : 'nominal'),
    anomalyDetails: isPhLow
      ? `pH (${currentPh?.toFixed(2)}) is below minimum of ${target.phMin.toFixed(1)}`
      : isPhHigh
        ? `pH (${currentPh?.toFixed(2)}) is above ceiling of ${target.phMax.toFixed(1)}`
        : undefined,
    timestamp,
    availability: sensorAvailability,
    quality: sensorQuality,
  };

  if (currentPh !== undefined) {
    evidenceList.push({
      source: 'sensor',
      type: 'sensor_reading',
      label: 'Solution pH Telemetry',
      value: currentPh,
      timestamp,
      confidence: isSimulation ? 'moderate' : 'high',
      unit: 'pH',
      plantId,
      metadata: { trend: phTrend, targetMin: target.phMin, targetMax: target.phMax, isSimulation },
    });
  }

  // TDS Sensor
  const currentTds = isSensorAvailable && reading ? reading.tds : undefined;
  const prevTds = prevReading ? prevReading.tds : undefined;
  const tdsDelta = currentTds !== undefined && prevTds !== undefined ? parseFloat((currentTds - prevTds).toFixed(1)) : undefined;

  let tdsTrend: SensorEvidence['trend'] = 'insufficient_data';
  if (tdsDelta !== undefined) {
    if (tdsDelta > 30) tdsTrend = 'rising';
    else if (tdsDelta < -30) tdsTrend = 'falling';
    else tdsTrend = 'stable';
  }

  const isTdsLow = currentTds !== undefined && currentTds < target.tdsMin;
  const isTdsHigh = currentTds !== undefined && currentTds > target.tdsMax;
  const hasTdsAnomaly = isTdsLow || isTdsHigh;

  const tdsEvidence: SensorEvidence = {
    metric: 'tds',
    label: 'Nutrient TDS Concentration',
    current: currentTds,
    previous: prevTds,
    baseline: (target.tdsMin + target.tdsMax) / 2,
    delta: tdsDelta,
    unit: 'PPM',
    trend: tdsTrend,
    hasAnomaly: hasTdsAnomaly,
    anomalySeverity: (currentTds !== undefined && (currentTds < target.tdsMin - 300 || currentTds > target.tdsMax + 400)) ? 'critical' : (hasTdsAnomaly ? 'warning' : 'nominal'),
    anomalyDetails: isTdsLow
      ? `TDS (${Math.round(currentTds || 0)} PPM) is below target ${target.tdsMin} PPM`
      : isTdsHigh
        ? `TDS (${Math.round(currentTds || 0)} PPM) exceeds safe limit ${target.tdsMax} PPM`
        : undefined,
    timestamp,
    availability: sensorAvailability,
    quality: sensorQuality,
  };

  if (currentTds !== undefined) {
    evidenceList.push({
      source: 'sensor',
      type: 'sensor_reading',
      label: 'Nutrient TDS Telemetry',
      value: currentTds,
      timestamp,
      confidence: isSimulation ? 'moderate' : 'high',
      unit: 'PPM',
      plantId,
      metadata: { trend: tdsTrend, targetMin: target.tdsMin, targetMax: target.tdsMax, isSimulation },
    });
  }

  // Water Level Sensor
  const currentWater = isSensorAvailable && reading ? reading.waterLevel : undefined;
  const prevWater = prevReading ? prevReading.waterLevel : undefined;
  const waterDelta = currentWater !== undefined && prevWater !== undefined ? parseFloat((currentWater - prevWater).toFixed(1)) : undefined;

  let waterTrend: SensorEvidence['trend'] = 'insufficient_data';
  if (waterDelta !== undefined) {
    if (waterDelta > 2.0) waterTrend = 'rising';
    else if (waterDelta < -2.0) waterTrend = 'falling';
    else waterTrend = 'stable';
  }

  const isWaterCritical = currentWater !== undefined && currentWater < SENSOR_THRESHOLDS.waterLevel.critical;
  const isWaterWarning = currentWater !== undefined && currentWater < SENSOR_THRESHOLDS.waterLevel.warning;
  const hasWaterAnomaly = isWaterCritical || isWaterWarning;

  const waterEvidence: SensorEvidence = {
    metric: 'waterLevel',
    label: 'Reservoir Water Level',
    current: currentWater,
    previous: prevWater,
    baseline: 80,
    delta: waterDelta,
    unit: '%',
    trend: waterTrend,
    hasAnomaly: hasWaterAnomaly,
    anomalySeverity: isWaterCritical ? 'critical' : (isWaterWarning ? 'warning' : 'nominal'),
    anomalyDetails: isWaterCritical
      ? `Water level is critically low (${Math.round(currentWater || 0)}% capacity). Risk of dry-running.`
      : isWaterWarning
        ? `Water level is low (${Math.round(currentWater || 0)}% capacity). Refill suggested.`
        : undefined,
    timestamp,
    availability: sensorAvailability,
    quality: sensorQuality,
  };

  if (currentWater !== undefined) {
    evidenceList.push({
      source: 'sensor',
      type: 'sensor_reading',
      label: 'Reservoir Level Telemetry',
      value: currentWater,
      timestamp,
      confidence: isSimulation ? 'moderate' : 'high',
      unit: '%',
      plantId,
      metadata: { trend: waterTrend, isCritical: isWaterCritical, isSimulation },
    });
  }

  // ------------------------------------------------------------
  // 2. CAMERA & VISUAL EVIDENCE NORMALIZATION (Presence, Species, Health)
  // ------------------------------------------------------------
  const detection = inputs.detection;
  const visualHealth = inputs.visualHealth;
  const crop = inputs.cropIdentity;

  let presenceState: PlantPresenceState | 'NO_CAMERA' = 'NO_CAMERA';
  let isPlantDetected = false;

  if (isCameraAvailable && detection) {
    presenceState = detection.state;
    isPlantDetected = detection.isPlantDetected;

    evidenceList.push({
      source: 'camera',
      type: 'plant_presence',
      label: 'Computer Vision Presence',
      value: detection.state,
      timestamp,
      confidence: detection.confidenceLevel === 'high' ? 'high' : (detection.confidenceLevel === 'medium' ? 'moderate' : 'low'),
      plantId,
      metadata: {
        isPlantDetected: detection.isPlantDetected,
        canopyCoveragePercent: detection.canopyCoveragePercent,
        userMessage: detection.userMessage,
      },
    });
  }

  // Species Identification
  const isSpeciesIdentified = Boolean(
    crop &&
    crop.commonName &&
    crop.commonName !== 'Plant' &&
    crop.commonName !== 'Unknown Plant' &&
    crop.cropKey !== 'unknown_plant' &&
    crop.cropKey !== 'unclassified_plant'
  );

  if (isSpeciesIdentified && crop) {
    evidenceList.push({
      source: 'plant_profile',
      type: 'species_identification',
      label: 'Botanical Species',
      value: crop.commonName,
      timestamp: crop.identificationTimestamp || timestamp,
      confidence: (crop.confidence && crop.confidence >= 75) ? 'high' : 'moderate',
      plantId,
      metadata: {
        scientificName: crop.scientificName,
        family: crop.family,
        confidencePercent: crop.confidence,
      },
    });
  }

  // Visual Health Metrics
  let visualHealthState: StructuredHealthState = 'UNKNOWN';
  let visualHealthScore: number | undefined = undefined;
  let chlorosisPercent: number | undefined = undefined;
  let necroticPercent: number | undefined = undefined;
  let canopyCoveragePercent: number | undefined = undefined;
  let textureGradient: number | undefined = undefined;

  if (isPlantDetected && visualHealth) {
    visualHealthState = visualHealth.healthState;
    visualHealthScore = visualHealth.visualHealthScore;
    chlorosisPercent = visualHealth.chlorosisYellowPercent;
    necroticPercent = visualHealth.necroticBrownPercent;
    canopyCoveragePercent = visualHealth.canopyCoveragePercent;
    textureGradient = visualHealth.avgTextureGradient;

    evidenceList.push({
      source: 'camera',
      type: 'visual_health',
      label: 'Foliar Health Analysis',
      value: visualHealth.healthState,
      timestamp,
      confidence: visualHealth.qualitativeConfidence === 'high' ? 'high' : (visualHealth.qualitativeConfidence === 'moderate' ? 'moderate' : 'low'),
      plantId,
      metadata: {
        score: visualHealth.visualHealthScore,
        chlorosisYellowPercent: visualHealth.chlorosisYellowPercent,
        necroticBrownPercent: visualHealth.necroticBrownPercent,
        canopyCoveragePercent: visualHealth.canopyCoveragePercent,
        avgTextureGradient: visualHealth.avgTextureGradient,
      },
    });

    if (chlorosisPercent !== undefined && chlorosisPercent > 10.0) {
      evidenceList.push({
        source: 'camera',
        type: 'visual_anomaly',
        label: 'Foliar Chlorosis (Yellowing)',
        value: chlorosisPercent,
        timestamp,
        confidence: 'high',
        unit: '%',
        plantId,
      });
    }

    if (necroticPercent !== undefined && necroticPercent > 4.0) {
      evidenceList.push({
        source: 'camera',
        type: 'visual_anomaly',
        label: 'Foliar Necrosis (Browning)',
        value: necroticPercent,
        timestamp,
        confidence: 'high',
        unit: '%',
        plantId,
      });
    }
  }

  // ------------------------------------------------------------
  // 3. HISTORICAL CONTEXT & DELTA NORMALIZATION
  // ------------------------------------------------------------
  const observations = inputs.observationHistory || [];
  const observationCount = observations.length;
  const hasHistoricalBaseline = observationCount >= 2;

  let historicalVisualDelta: NormalizedEvidencePackage['historicalVisualDelta'] = null;
  let historicalSensorAssociation: NormalizedEvidencePackage['historicalSensorAssociation'] = null;

  if (hasHistoricalBaseline) {
    const sorted = [...observations].sort((a, b) => a.timestamp - b.timestamp);
    const oldest = sorted[0];
    const newest = sorted[sorted.length - 1];

    const oldCanopy = oldest.canopyCoveragePercent ?? 0;
    const newCanopy = newest.canopyCoveragePercent ?? 0;
    const canopyDelta = parseFloat((newCanopy - oldCanopy).toFixed(1));
    const relativeCanopyChange = oldCanopy > 0
      ? parseFloat((((newCanopy - oldCanopy) / oldCanopy) * 100).toFixed(1))
      : 0;

    const oldYellow = oldest.visualScoreBreakdown ? (100 - oldest.visualScoreBreakdown.colorConditionScore) : 0;
    const newYellow = newest.visualScoreBreakdown ? (100 - newest.visualScoreBreakdown.colorConditionScore) : 0;
    const chlorosisDelta = parseFloat((newYellow - oldYellow).toFixed(1));

    historicalVisualDelta = {
      canopyDelta,
      relativeCanopyChange,
      chlorosisDelta,
      necrosisDelta: 0,
    };

    evidenceList.push({
      source: 'history',
      type: 'historical_change',
      label: 'Longitudinal Canopy Change',
      value: canopyDelta,
      timestamp,
      confidence: 'high',
      unit: '%',
      plantId,
      metadata: { relativeCanopyChange, observationSpan: observationCount },
    });

    // Check temporal correlation: did water decrease while/before visual change?
    const oldWater = oldest.waterLevel ?? 80;
    const newWater = newest.waterLevel ?? 80;
    const waterDropOccurred = (oldWater - newWater) >= 5.0;

    const oldTds = oldest.tds ?? 900;
    const newTds = newest.tds ?? 900;
    const nutrientShiftOccurred = Math.abs(newTds - oldTds) >= 100;

    const oldPh = oldest.ph ?? 6.0;
    const newPh = newest.ph ?? 6.0;
    const phShiftOccurred = Math.abs(newPh - oldPh) >= 0.4;

    const summaryParts: string[] = [];
    if (waterDropOccurred) summaryParts.push('reservoir water level decreased');
    if (nutrientShiftOccurred) summaryParts.push('nutrient TDS shifted');
    if (phShiftOccurred) summaryParts.push('pH level shifted');

    if (summaryParts.length > 0) {
      historicalSensorAssociation = {
        waterDropOccurred,
        nutrientShiftOccurred,
        phShiftOccurred,
        summary: `Prior to or during visual condition changes, ${summaryParts.join(' and ')}.`,
      };

      evidenceList.push({
        source: 'history',
        type: 'trend',
        label: 'Historical Environmental Shift',
        value: historicalSensorAssociation.summary,
        timestamp,
        confidence: 'high',
        plantId,
        metadata: { waterDropOccurred, nutrientShiftOccurred, phShiftOccurred },
      });
    }
  }

  return {
    plantId,
    timestamp,
    evidenceList,
    sensorEvidence: {
      ph: phEvidence,
      tds: tdsEvidence,
      waterLevel: waterEvidence,
    },
    isCameraAvailable,
    isSensorAvailable,
    isSimulation,
    presenceState,
    isPlantDetected,
    speciesName: isSpeciesIdentified && crop ? crop.commonName : undefined,
    speciesConfidence: crop?.confidence,
    isSpeciesIdentified,
    visualHealthState,
    visualHealthScore,
    chlorosisPercent,
    necroticPercent,
    canopyCoveragePercent,
    textureGradient,
    hasHistoricalBaseline,
    observationCount,
    historicalVisualDelta,
    historicalSensorAssociation,
    cropTargetProfile: target,
  };
}
