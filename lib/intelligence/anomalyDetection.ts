// ============================================================
// HydroSmart — Anomaly Detection Service
// ============================================================

import { SENSOR_THRESHOLDS } from '@/lib/sensorConfig';
import { AnomalyReport, CropTargetProfile, VisualAnomaly } from './types';
import { DEFAULT_CROP_PROFILE } from './healthScore';

export function detectEnvironmentalAnomalies(
  ph?: number,
  tds?: number,
  waterLevel?: number,
  distance?: number,
  cropProfile: CropTargetProfile = DEFAULT_CROP_PROFILE
): AnomalyReport[] {
  const anomalies: AnomalyReport[] = [];
  const now = Date.now();

  // 1. pH Out-of-Range Anomaly
  if (ph !== undefined) {
    if (ph < cropProfile.phMin) {
      anomalies.push({
        id: `anomaly_ph_low_${now}`,
        timestamp: now,
        category: 'environmental',
        title: 'Acidic pH Drift Detected',
        description: `Current pH (${ph.toFixed(2)}) is below the recommended minimum of ${cropProfile.phMin.toFixed(1)}. Nutrient lockout risk.`,
        severity: ph < cropProfile.phMin - 0.6 ? 'critical' : 'warning',
        sensorMetric: 'ph',
        currentValue: ph,
        targetRange: `${cropProfile.phMin} - ${cropProfile.phMax} pH`,
      });
    } else if (ph > cropProfile.phMax) {
      anomalies.push({
        id: `anomaly_ph_high_${now}`,
        timestamp: now,
        category: 'environmental',
        title: 'Alkaline pH Drift Detected',
        description: `Current pH (${ph.toFixed(2)}) exceeds the recommended ceiling of ${cropProfile.phMax.toFixed(1)}. Iron uptake inhibited.`,
        severity: ph > cropProfile.phMax + 0.6 ? 'critical' : 'warning',
        sensorMetric: 'ph',
        currentValue: ph,
        targetRange: `${cropProfile.phMin} - ${cropProfile.phMax} pH`,
      });
    }
  }

  // 2. TDS Nutrient Depletion / Toxicity Anomaly
  if (tds !== undefined) {
    if (tds < cropProfile.tdsMin) {
      anomalies.push({
        id: `anomaly_tds_low_${now}`,
        timestamp: now,
        category: 'environmental',
        title: 'Nutrient Salt Depletion',
        description: `TDS is currently ${Math.round(tds)} PPM, below target minimum of ${cropProfile.tdsMin} PPM. Slower growth rate expected.`,
        severity: tds < cropProfile.tdsMin - 300 ? 'critical' : 'warning',
        sensorMetric: 'tds',
        currentValue: tds,
        targetRange: `${cropProfile.tdsMin} - ${cropProfile.tdsMax} PPM`,
      });
    } else if (tds > cropProfile.tdsMax) {
      anomalies.push({
        id: `anomaly_tds_high_${now}`,
        timestamp: now,
        category: 'environmental',
        title: 'High Nutrient Concentration',
        description: `TDS is ${Math.round(tds)} PPM, exceeding safe ceiling of ${cropProfile.tdsMax} PPM. Tip burn and root stress danger.`,
        severity: tds > cropProfile.tdsMax + 400 ? 'critical' : 'warning',
        sensorMetric: 'tds',
        currentValue: tds,
        targetRange: `${cropProfile.tdsMin} - ${cropProfile.tdsMax} PPM`,
      });
    }
  }

  // 3. Reservoir Water Level Anomaly
  if (waterLevel !== undefined) {
    if (waterLevel < SENSOR_THRESHOLDS.waterLevel.critical) {
      anomalies.push({
        id: `anomaly_water_critical_${now}`,
        timestamp: now,
        category: 'environmental',
        title: 'Critical Low Water Level',
        description: `Reservoir capacity is at ${Math.round(waterLevel)}% (ultrasonic offset: ${distance !== undefined ? distance.toFixed(1) : '--'} cm). Pump dry-run hazard.`,
        severity: 'critical',
        sensorMetric: 'waterLevel',
        currentValue: waterLevel,
        targetRange: `> ${SENSOR_THRESHOLDS.waterLevel.warning}%`,
      });
    } else if (waterLevel < SENSOR_THRESHOLDS.waterLevel.warning) {
      anomalies.push({
        id: `anomaly_water_warning_${now}`,
        timestamp: now,
        category: 'environmental',
        title: 'Low Water Level Notice',
        description: `Reservoir volume is at ${Math.round(waterLevel)}%. Top-off recommended before depletion.`,
        severity: 'warning',
        sensorMetric: 'waterLevel',
        currentValue: waterLevel,
        targetRange: `> ${SENSOR_THRESHOLDS.waterLevel.warning}%`,
      });
    }
  }

  return anomalies;
}

// Service boundary for future visual anomaly ML model
export async function detectVisualAnomalies(_imageRef: string): Promise<VisualAnomaly[]> {
  // Service boundary: No fake ML - explicitly returns empty until computer vision pipeline is wired in Phase 2
  return [];
}
