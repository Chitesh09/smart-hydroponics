// ============================================================
// HydroSmart — Multimodal Plant Health Engine
// Cross-Domain Relational Data Fusion (Camera + ESP32 + History)
// ============================================================

import {
  CameraHealthInput,
  ESP32HealthInput,
  HistoricalHealthInput,
  CropTargetProfile,
  MultimodalHealthAssessment,
  HealthTrend,
  VisualHealthState
} from './types';

/**
 * Calculate historical trajectory from recent observation records
 */
function evaluateHistoricalTrends(
  history: HistoricalHealthInput
): {
  trend: HealthTrend;
  trendExplanation?: string;
} {
  const records = history.previousObservations;
  if (!records || records.length < 3) {
    return {
      trend: 'insufficient_data',
      trendExplanation: 'Fewer than 3 observations logged. Continuous monitoring will establish longitudinal trend trajectory.',
    };
  }

  // Look at recent 5 scores
  const recent = records.slice(0, 5);
  const scores = recent.map(r => r.overallHealthScore ?? 75).reverse();

  let deltaSum = 0;
  for (let i = 1; i < scores.length; i++) {
    deltaSum += scores[i] - scores[i - 1];
  }
  const avgDelta = deltaSum / (scores.length - 1);

  if (avgDelta > 2.5) {
    return {
      trend: 'improving',
      trendExplanation: `Health trajectory is improving (+${avgDelta.toFixed(1)} pts/step) as environmental balance stabilizes.`,
    };
  } else if (avgDelta < -2.5) {
    return {
      trend: 'declining',
      trendExplanation: `Health trajectory is declining (${avgDelta.toFixed(1)} pts/step). Environmental or optical stress is compounding.`,
    };
  } else {
    return {
      trend: 'stable',
      trendExplanation: 'System equilibrium is stable with consistent physiological metrics across recent snapshots.',
    };
  }
}

/**
 * Multimodal Plant Health Fusion Engine
 * Combines Camera + ESP32 + Historical data into a relational assessment.
 */
export function multimodalHealthEngine(
  camera: CameraHealthInput,
  esp32: ESP32HealthInput,
  history: HistoricalHealthInput,
  cropProfile: CropTargetProfile
): MultimodalHealthAssessment {
  const timestamp = Date.now();

  const observations: string[] = [];
  const interpretations: string[] = [];
  const explanations: string[] = [];
  const anomalies: string[] = [];

  // ============================================================
  // 1. RAW SENSORY OBSERVATIONS (Verifiable Facts)
  // ============================================================

  // ESP32 Observations
  if (esp32.ph !== undefined) {
    observations.push(`ESP32 chemical sensor measured pH at ${esp32.ph.toFixed(2)} (Configured target: ${cropProfile.phMin} - ${cropProfile.phMax}).`);
  } else {
    observations.push('ESP32 pH telemetry is currently unavailable.');
  }

  if (esp32.tds !== undefined) {
    observations.push(`ESP32 electrical conductivity measured TDS at ${Math.round(esp32.tds)} PPM (Configured target: ${cropProfile.tdsMin} - ${cropProfile.tdsMax} PPM).`);
  } else {
    observations.push('ESP32 TDS telemetry is currently unavailable.');
  }

  if (esp32.waterLevel !== undefined) {
    observations.push(`Ultrasonic sensor measured reservoir water level at ${Math.round(esp32.waterLevel)}% capacity (${esp32.distance ? esp32.distance.toFixed(1) : '--'} cm distance).`);
  }

  // Camera Observations
  if (camera.isPlantDetected) {
    observations.push(`Camera vision detected active plant canopy covering ${camera.canopyCoveragePercent ?? '--'}% of frame (${camera.speciesName ?? 'Unknown crop'}).`);
    if (camera.chlorosisYellowPercent && camera.chlorosisYellowPercent > 8) {
      observations.push(`Optical chromatic analysis detected ${camera.chlorosisYellowPercent}% yellowing/chlorosis on leaf lamina.`);
    }
    if (camera.necroticBrownPercent && camera.necroticBrownPercent > 3) {
      observations.push(`Optical spectral analysis detected ${camera.necroticBrownPercent}% necrotic browning on leaf margins/tips.`);
    }
  } else {
    observations.push('Camera vision indicates no plant canopy or webcam sensor is in standby.');
  }

  // Historical Trends
  const { trend, trendExplanation } = evaluateHistoricalTrends(history);
  if (trendExplanation) {
    observations.push(`Historical log: ${trendExplanation}`);
  }

  // ============================================================
  // 2. CROSS-DOMAIN RELATIONAL INTERPRETATIONS
  // ============================================================

  const hasPh = esp32.ph !== undefined;
  const hasTds = esp32.tds !== undefined;
  const hasWater = esp32.waterLevel !== undefined;
  const isCameraActive = !!camera.isPlantDetected;

  const phVal = esp32.ph ?? 6.0;
  const tdsVal = esp32.tds ?? 900;
  const waterVal = esp32.waterLevel ?? 80;

  const isPhHigh = hasPh && phVal > cropProfile.phMax;
  const isPhLow = hasPh && phVal < cropProfile.phMin;
  const isTdsHigh = hasTds && tdsVal > cropProfile.tdsMax;
  const isTdsLow = hasTds && tdsVal < cropProfile.tdsMin;
  const isWaterCritical = hasWater && waterVal < 18;
  const isWaterLow = hasWater && waterVal < 30;

  const hasChlorosis = (camera.chlorosisYellowPercent ?? 0) > 12;
  const hasNecrosis = (camera.necroticBrownPercent ?? 0) > 4;

  let environmentalState: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (isWaterCritical || (isPhHigh && isTdsHigh) || (isPhLow && isTdsLow)) {
    environmentalState = 'critical';
  } else if (isPhHigh || isPhLow || isTdsHigh || isTdsLow || isWaterLow) {
    environmentalState = 'warning';
  }

  const visualState: VisualHealthState = camera.visualHealthState || (isCameraActive ? 'healthy' : 'unknown');

  // Relational Scenario A: Correlated Nutrient Deprivation
  if (hasChlorosis && isTdsLow) {
    anomalies.push('Correlated Nutrient Deprivation');
    interpretations.push('Visual leaf yellowing co-occurs with TDS concentration below the target threshold.');
    explanations.push('Visual stress was detected while TDS is below the configured range. These combined conditions may be associated with environmental or nutrient stress due to sub-optimal mineral salts in the reservoir solution.');
  }

  // Relational Scenario B: Alkaline Nutrient Lockout
  else if (hasChlorosis && isPhHigh) {
    anomalies.push('Alkaline Chemical Lockout');
    interpretations.push('Visual chlorosis occurs despite adequate/elevated TDS due to high alkaline pH.');
    explanations.push('Foliage discoloration co-occurs with alkaline pH (> target max). In hydroponic media, elevated pH can precipitate micro-nutrients like Iron (Fe) and Magnesium (Mg) into insoluble forms, causing optical chlorosis even if overall nutrient concentration is sufficient.');
  }

  // Relational Scenario C: Osmotic Fertilizer Burn
  else if (hasNecrosis && isTdsHigh) {
    anomalies.push('Osmotic Fertilizer Burn');
    interpretations.push('Leaf tip necrotic browning correlates with elevated TDS salinity above safe threshold.');
    explanations.push('Necrotic browning on leaf margins co-occurs with TDS above the maximum threshold. Excessively high salt concentration increases osmotic pressure around the root zone, causing cell dehydration at the leaf margins (tip burn).');
  }

  // Relational Scenario D: Hydraulic Drought / Cavitation
  else if (isWaterCritical) {
    anomalies.push('Severe Hydraulic Deficit');
    interpretations.push('Critical reservoir volume poses immediate risk of pump cavitation and hydraulic drought.');
    explanations.push('Water level is in the critical zone (<18%). Submersible pump intake may suck air, leading to rapid root desiccation and loss of plant turgor pressure within hours.');
  }

  // Relational Scenario E: Pre-Symptomatic Environmental Hazard
  else if (visualState === 'healthy' && (isPhHigh || isPhLow || isTdsHigh || isTdsLow)) {
    anomalies.push('Pre-Symptomatic Environmental Drift');
    interpretations.push('Foliage currently appears healthy, but chemical parameters have drifted outside the biological target envelope.');
    explanations.push('Visual plant structure shows healthy chlorophyll pigmentation, but environmental parameters have drifted outside configured targets. Hydroponic plants possess internal physiological buffers, but uncorrected drift typically manifests as visible stress within 24 to 72 hours.');
  }

  // Relational Scenario F: Optimal Equilibrium
  else if (visualState === 'healthy' && environmentalState === 'optimal') {
    interpretations.push('Both optical foliage indicators and physical environmental chemistry are synchronized within optimal bounds.');
    explanations.push('The hydroponic system is in biological equilibrium. Root-zone nutrient availability matches crop metabolic requirements, and optical chlorophyll reflectance indicates vigorous photosynthesis.');
  }

  // Default interpretation if no specific scenario triggered
  if (interpretations.length === 0) {
    interpretations.push('Environmental and optical metrics are within tolerable physiological ranges.');
    explanations.push('All measured parameters are within standard operating thresholds for the selected crop.');
  }

  // ============================================================
  // 3. COMPOSITE OVERALL SCORE CALCULATION
  // Non-linear evaluation respecting limiting factor dynamics
  // ============================================================

  const envScore = (hasPh ? (isPhHigh || isPhLow ? 65 : 95) : 80) * 0.35 +
                   (hasTds ? (isTdsHigh || isTdsLow ? 65 : 95) : 80) * 0.35 +
                   (hasWater ? (isWaterCritical ? 10 : isWaterLow ? 60 : 95) : 80) * 0.30;

  const visScore = camera.visualHealthScore ?? (isCameraActive ? 90 : envScore);

  // Apply limiting factor (Liebig's Law): Severe water depletion caps overall score
  let overallScore = Math.round(envScore * 0.50 + visScore * 0.50);
  if (isWaterCritical) {
    overallScore = Math.min(overallScore, 42); // Critical reservoir limits health
  } else if (anomalies.length > 0) {
    overallScore = Math.min(overallScore, 78);
  }

  let overallHealthState: 'optimal' | 'warning' | 'critical' = 'optimal';
  if (overallScore < 50 || isWaterCritical) {
    overallHealthState = 'critical';
  } else if (overallScore < 80 || anomalies.length > 0) {
    overallHealthState = 'warning';
  }

  // Confidence based on active sensor modalities
  let confidence = 50;
  if (esp32.mode === 'real' && !esp32.isStale) confidence += 25;
  else if (esp32.mode === 'simulation') confidence += 20;
  if (isCameraActive) confidence += 25;

  return {
    timestamp,
    overallScore,
    visualState,
    environmentalState,
    overallHealthState,
    trend,
    anomalies,
    observations,
    interpretations,
    explanations,
    confidence: Math.min(98, confidence),
  };
}
