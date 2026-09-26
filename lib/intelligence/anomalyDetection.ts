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

// Evidence-based visual anomaly detection from optical foliar analysis
export function detectVisualAnomaliesFromHealth(
  visualHealth?: {
    chlorosisYellowPercent: number;
    necroticBrownPercent: number;
    canopyCoveragePercent: number;
    avgTextureGradient?: number;
    baselineDeltas?: {
      canopyDeltaPercent: number;
      relativeCanopyChangePercent: number;
      chlorosisDeltaPercent: number;
      necrosisDeltaPercent: number;
    } | null;
  } | null
): VisualAnomaly[] {
  if (!visualHealth) return [];
  const anomalies: VisualAnomaly[] = [];

  // 1. Severe or Moderate Chlorosis Anomaly
  if (visualHealth.chlorosisYellowPercent >= 25.0) {
    anomalies.push({
      type: 'severe_chlorosis',
      description: `Severe foliage yellowing detected (${visualHealth.chlorosisYellowPercent}% of canopy). Chlorophyll depletion observed across leaf lamina.`,
      confidence: Math.min(95, Math.round(50 + visualHealth.chlorosisYellowPercent)),
      severity: 'high',
      affectedRegion: 'Upper and middle canopy foliage',
    });
  } else if (visualHealth.chlorosisYellowPercent >= 12.0) {
    anomalies.push({
      type: 'foliar_chlorosis',
      description: `Foliage yellowing detected (${visualHealth.chlorosisYellowPercent}% of canopy). Visual coloration is paler than healthy baseline.`,
      confidence: Math.min(88, Math.round(50 + visualHealth.chlorosisYellowPercent)),
      severity: 'medium',
      affectedRegion: 'Leaf margins and lamina',
    });
  }

  // 2. Severe or Moderate Necrosis Anomaly
  if (visualHealth.necroticBrownPercent >= 8.0) {
    anomalies.push({
      type: 'severe_necrosis',
      description: `Extensive necrotic tissue browning (${visualHealth.necroticBrownPercent}% of leaf area). Dried lesions or margin burn detected.`,
      confidence: Math.min(96, Math.round(60 + visualHealth.necroticBrownPercent * 3)),
      severity: 'high',
      affectedRegion: 'Leaf tips and margins',
    });
  } else if (visualHealth.necroticBrownPercent >= 4.0) {
    anomalies.push({
      type: 'foliar_necrosis',
      description: `Localized necrotic tip browning detected (${visualHealth.necroticBrownPercent}% of leaf area). Inspect for salt burn or drying.`,
      confidence: Math.min(85, Math.round(55 + visualHealth.necroticBrownPercent * 3)),
      severity: 'medium',
      affectedRegion: 'Leaf margins',
    });
  }

  // 3. Canopy Contraction Anomaly (relative to baseline)
  if (visualHealth.baselineDeltas) {
    const relDrop = visualHealth.baselineDeltas.relativeCanopyChangePercent;
    if (relDrop <= -30.0) {
      anomalies.push({
        type: 'canopy_collapse',
        description: `Severe canopy contraction (${relDrop}% drop from baseline). Significant reduction in visible foliage area.`,
        confidence: 90,
        severity: 'high',
        affectedRegion: 'Overall canopy stature',
      });
    } else if (relDrop <= -15.0) {
      anomalies.push({
        type: 'canopy_shrinkage',
        description: `Noticeable canopy reduction (${relDrop}% change from baseline). Inspect for foliage drooping or physical trimming.`,
        confidence: 80,
        severity: 'medium',
        affectedRegion: 'Canopy perimeter',
      });
    }
  }

  // 4. Textural Mottling / Spotting Anomaly
  if (visualHealth.avgTextureGradient && visualHealth.avgTextureGradient > 32.0) {
    anomalies.push({
      type: 'surface_mottling',
      description: 'High localized leaf texture variance detected. Inspect leaf surface for potential spotting, stippling, or lesions.',
      confidence: 75,
      severity: 'medium',
      affectedRegion: 'Leaf surface texture',
    });
  }

  return anomalies;
}

export async function detectVisualAnomalies(_imageRef: string): Promise<VisualAnomaly[]> {
  // Service boundary: imageRef async hook
  return [];
}
