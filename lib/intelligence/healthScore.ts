// ============================================================
// HydroSmart — Rule-Based Health Assessment Service
// ============================================================

import { SENSOR_THRESHOLDS } from '@/lib/sensorConfig';
import { CropTargetProfile, EnvironmentalAssessment, PlantHealthReport } from './types';

// Default target profile (Lettuce) if none specified
export const DEFAULT_CROP_PROFILE: CropTargetProfile = {
  name: 'Lettuce (Lactuca sativa)',
  scientificName: 'Lactuca sativa',
  phMin: SENSOR_THRESHOLDS.ph.min,
  phMax: SENSOR_THRESHOLDS.ph.max,
  tdsMin: SENSOR_THRESHOLDS.tds.min,
  tdsMax: SENSOR_THRESHOLDS.tds.max,
  idealWaterLevelMin: SENSOR_THRESHOLDS.waterLevel.warning,
  optimalTempMin: 18,
  optimalTempMax: 24,
};

export function evaluateEnvironmentalHealth(
  ph?: number,
  tds?: number,
  waterLevel?: number,
  cropProfile: CropTargetProfile = DEFAULT_CROP_PROFILE
): EnvironmentalAssessment {
  const timestamp = Date.now();

  // 1. pH Score Calculation (0 - 100)
  let phScore = 100;
  let phStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (ph !== undefined) {
    if (ph >= cropProfile.phMin && ph <= cropProfile.phMax) {
      phScore = 100;
      phStatus = 'optimal';
    } else {
      const error = ph < cropProfile.phMin 
        ? cropProfile.phMin - ph 
        : ph - cropProfile.phMax;
      
      // Reduce score by 35 points per 0.5 pH unit deviation
      phScore = Math.max(0, Math.round(100 - (error / 0.5) * 35));
      phStatus = error > 0.8 ? 'critical' : 'warning';
    }
  }

  // 2. TDS Nutrient Score Calculation (0 - 100)
  let tdsScore = 100;
  let tdsStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (tds !== undefined) {
    if (tds >= cropProfile.tdsMin && tds <= cropProfile.tdsMax) {
      tdsScore = 100;
      tdsStatus = 'optimal';
    } else {
      const error = tds < cropProfile.tdsMin
        ? cropProfile.tdsMin - tds
        : tds - cropProfile.tdsMax;
      
      // Reduce score by 25 points per 200 PPM deviation
      tdsScore = Math.max(0, Math.round(100 - (error / 200) * 25));
      tdsStatus = error > 400 ? 'critical' : 'warning';
    }
  }

  // 3. Water Level Score Calculation (0 - 100)
  let waterLevelScore = 100;
  let waterLevelStatus: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (waterLevel !== undefined) {
    if (waterLevel >= SENSOR_THRESHOLDS.waterLevel.warning) {
      waterLevelScore = Math.min(100, Math.round(80 + (waterLevel / 100) * 20));
      waterLevelStatus = 'optimal';
    } else if (waterLevel >= SENSOR_THRESHOLDS.waterLevel.critical) {
      waterLevelScore = Math.round(40 + ((waterLevel - 15) / 10) * 30);
      waterLevelStatus = 'warning';
    } else {
      waterLevelScore = Math.max(0, Math.round((waterLevel / 15) * 35));
      waterLevelStatus = 'critical';
    }
  }

  // Composite Environmental Score (Weighted: 35% pH, 35% TDS, 30% Water Level)
  const compositeEnvironmentalScore = Math.round(
    phScore * 0.35 + tdsScore * 0.35 + waterLevelScore * 0.30
  );

  return {
    timestamp,
    phScore,
    tdsScore,
    waterLevelScore,
    compositeEnvironmentalScore,
    phStatus,
    tdsStatus,
    waterLevelStatus,
  };
}

export function generateHealthReport(
  environmental: EnvironmentalAssessment,
  visualScore?: number
): PlantHealthReport {
  const timestamp = Date.now();
  const envScore = environmental.compositeEnvironmentalScore;

  // If visual score is available (future ML model), combine (50% env + 50% visual)
  const overallHealthScore = visualScore !== undefined
    ? Math.round(envScore * 0.5 + visualScore * 0.5)
    : envScore;

  let healthState: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (overallHealthScore < 50 || environmental.phStatus === 'critical' || environmental.waterLevelStatus === 'critical') {
    healthState = 'critical';
  } else if (overallHealthScore < 80 || environmental.phStatus === 'warning' || environmental.tdsStatus === 'warning') {
    healthState = 'warning';
  }

  let summary = 'System environment is optimal for vigorous crop development.';
  if (healthState === 'critical') {
    summary = 'Critical parameters require immediate intervention to prevent root stress.';
  } else if (healthState === 'warning') {
    summary = 'Environmental conditions are slightly drifted from target crop envelope.';
  }

  return {
    timestamp,
    overallHealthScore,
    environmentalScore: envScore,
    visualScore,
    healthState,
    summary,
  };
}
