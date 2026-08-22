// ============================================================
// HydroSmart — Predictive Analytics & Recommendation Engine
// Time-Series Forecasting & Statistical Z-Score Outlier Analysis
// ============================================================

import {
  PlantObservation,
  CropTargetProfile,
  ParameterPrediction,
  StatisticalAnomalyResult,
  PredictiveAnalyticsResult,
  RecommendationItem
} from './types';

const PREDICTION_DISCLAIMER =
  'MATHEMATICAL PROJECTIONS: Drift rates and estimated threshold crossings are time-series statistical estimates based on observed historical consumption velocity and do not represent guaranteed physical outcomes.';

/**
 * Compute linear rate of change (slope per day) across historical observation points
 */
function calculateDriftPerDay(
  observations: PlantObservation[],
  metricKey: 'ph' | 'tds' | 'waterLevel'
): number {
  const validPoints = observations
    .filter(obs => obs[metricKey] !== undefined)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (validPoints.length < 2) {
    return 0;
  }

  // Use up to the 10 most recent points
  const points = validPoints.slice(-10);
  const n = points.length;

  const firstTime = points[0].timestamp;
  const xs: number[] = points.map(p => (p.timestamp - firstTime) / 86400000); // Days from start
  const ys: number[] = points.map(p => p[metricKey] as number);

  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0);
  const sumXX = xs.reduce((acc, x) => acc + x * x, 0);

  const denominator = n * sumXX - sumX * sumX;
  if (Math.abs(denominator) < 1e-6) {
    // If all points have nearly identical timestamps, use simple diff
    const timeSpanDays = Math.max(0.01, (points[n - 1].timestamp - points[0].timestamp) / 86400000);
    return parseFloat(((ys[n - 1] - ys[0]) / timeSpanDays).toFixed(2));
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  return parseFloat(slope.toFixed(2));
}

/**
 * Compute rolling mean, standard deviation, and Z-score for a metric
 */
function evaluateStatisticalAnomaly(
  currentVal: number | undefined,
  observations: PlantObservation[],
  metricKey: 'ph' | 'tds' | 'waterLevel',
  label: string
): StatisticalAnomalyResult {
  const defaultResult: StatisticalAnomalyResult = {
    id: `anomaly_stat_${metricKey}`,
    metric: metricKey,
    label,
    currentValue: currentVal ?? 0,
    rollingMean: currentVal ?? 0,
    standardDeviation: 0,
    zScore: 0,
    isAnomaly: false,
    severity: 'nominal',
    rateOfChange: 0,
    description: 'Insufficient historical samples for statistical deviation modeling.',
  };

  if (currentVal === undefined || !observations || observations.length < 3) {
    return defaultResult;
  }

  const values = observations
    .map(o => o[metricKey])
    .filter((v): v is number => v !== undefined);

  if (values.length < 3) {
    return defaultResult;
  }

  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;

  const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (n - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev < 1e-4) {
    return {
      ...defaultResult,
      currentValue: currentVal,
      rollingMean: parseFloat(mean.toFixed(2)),
      standardDeviation: 0,
      description: 'Historical values are completely uniform with zero standard deviation.',
    };
  }

  const zScore = parseFloat(((currentVal - mean) / stdDev).toFixed(2));
  const absZ = Math.abs(zScore);

  const isAnomaly = absZ >= 2.0;
  const severity = absZ >= 3.0 ? 'critical' : absZ >= 2.0 ? 'warning' : 'nominal';

  const rateOfChange = calculateDriftPerDay(observations, metricKey);

  const description = isAnomaly
    ? `Statistical outlier detected: ${label} is ${absZ}σ standard deviations from rolling baseline mean (${mean.toFixed(2)}), with rate of change ${rateOfChange >= 0 ? `+${rateOfChange}` : rateOfChange}/day.`
    : `${label} is within normal statistical distribution (${absZ}σ from rolling mean of ${mean.toFixed(2)}).`;

  return {
    id: `anomaly_stat_${metricKey}`,
    metric: metricKey,
    label,
    currentValue: currentVal,
    rollingMean: parseFloat(mean.toFixed(2)),
    standardDeviation: parseFloat(stdDev.toFixed(2)),
    zScore,
    isAnomaly,
    severity,
    rateOfChange,
    description,
  };
}

/**
 * Predict future threshold crossing for pH
 */
function predictPh(
  currentPh: number | undefined,
  observations: PlantObservation[],
  cropProfile: CropTargetProfile
): ParameterPrediction {
  const val = currentPh ?? 6.0;
  const drift = calculateDriftPerDay(observations, 'ph');
  const isInside = val >= cropProfile.phMin && val <= cropProfile.phMax;

  let estimatedDaysToThreshold: number | null = null;
  let thresholdType: 'depletion_min' | 'toxicity_max' | 'critical_water' | 'none' = 'none';
  let trendDirection: 'rising' | 'falling' | 'stable' = 'stable';
  let forecastSummary = '';

  if (drift > 0.05) {
    trendDirection = 'rising';
    if (val < cropProfile.phMax) {
      estimatedDaysToThreshold = parseFloat(((cropProfile.phMax - val) / drift).toFixed(1));
      thresholdType = 'toxicity_max';
      forecastSummary = `Rising at +${drift} pH/day. Estimated upper boundary crossing (${cropProfile.phMax} pH) in ~${estimatedDaysToThreshold} days.`;
    } else {
      forecastSummary = `Currently above target ceiling (${cropProfile.phMax} pH) and continuing to rise (+${drift}/day).`;
    }
  } else if (drift < -0.05) {
    trendDirection = 'falling';
    if (val > cropProfile.phMin) {
      estimatedDaysToThreshold = parseFloat(((val - cropProfile.phMin) / Math.abs(drift)).toFixed(1));
      thresholdType = 'depletion_min';
      forecastSummary = `Drifting downward at ${drift} pH/day. Estimated lower boundary crossing (${cropProfile.phMin} pH) in ~${estimatedDaysToThreshold} days.`;
    } else {
      forecastSummary = `Currently below target floor (${cropProfile.phMin} pH) and continuing to decline (${drift}/day).`;
    }
  } else {
    trendDirection = 'stable';
    forecastSummary = 'pH equilibrium is stable with no projected boundary crossing in the 7-day horizon.';
  }

  return {
    metric: 'ph',
    label: 'pH Chemical Balance',
    currentValue: val,
    unit: 'pH',
    driftPerDay: drift,
    trendDirection,
    targetMin: cropProfile.phMin,
    targetMax: cropProfile.phMax,
    isInsideTarget: isInside,
    estimatedDaysToThreshold,
    thresholdType,
    forecastSummary,
    confidenceScore: observations.length >= 3 ? 92 : 65,
  };
}

/**
 * Predict future threshold crossing for TDS
 */
function predictTds(
  currentTds: number | undefined,
  observations: PlantObservation[],
  cropProfile: CropTargetProfile
): ParameterPrediction {
  const val = currentTds ?? 950;
  const drift = calculateDriftPerDay(observations, 'tds');
  const isInside = val >= cropProfile.tdsMin && val <= cropProfile.tdsMax;

  let estimatedDaysToThreshold: number | null = null;
  let thresholdType: 'depletion_min' | 'toxicity_max' | 'critical_water' | 'none' = 'none';
  let trendDirection: 'rising' | 'falling' | 'stable' = 'stable';
  let forecastSummary = '';

  if (drift < -15) {
    trendDirection = 'falling';
    if (val > cropProfile.tdsMin) {
      estimatedDaysToThreshold = parseFloat(((val - cropProfile.tdsMin) / Math.abs(drift)).toFixed(1));
      thresholdType = 'depletion_min';
      forecastSummary = `Nutrient consumption rate is ${drift} PPM/day. Estimated lower threshold (${cropProfile.tdsMin} PPM) depletion in ~${estimatedDaysToThreshold} days.`;
    } else {
      forecastSummary = `Currently depleted below target minimum (${cropProfile.tdsMin} PPM).`;
    }
  } else if (drift > 15) {
    trendDirection = 'rising';
    if (val < cropProfile.tdsMax) {
      estimatedDaysToThreshold = parseFloat(((cropProfile.tdsMax - val) / drift).toFixed(1));
      thresholdType = 'toxicity_max';
      forecastSummary = `Salinity rising at +${drift} PPM/day. Estimated upper safety ceiling (${cropProfile.tdsMax} PPM) in ~${estimatedDaysToThreshold} days.`;
    } else {
      forecastSummary = `Currently above target maximum salinity (${cropProfile.tdsMax} PPM).`;
    }
  } else {
    trendDirection = 'stable';
    forecastSummary = 'Nutrient salinity is stable with steady plant ion absorption.';
  }

  return {
    metric: 'tds',
    label: 'TDS Nutrient Salinity',
    currentValue: Math.round(val),
    unit: 'PPM',
    driftPerDay: drift,
    trendDirection,
    targetMin: cropProfile.tdsMin,
    targetMax: cropProfile.tdsMax,
    isInsideTarget: isInside,
    estimatedDaysToThreshold,
    thresholdType,
    forecastSummary,
    confidenceScore: observations.length >= 3 ? 94 : 65,
  };
}

/**
 * Predict reservoir depletion time
 */
function predictWaterLevel(
  currentWaterLevel: number | undefined,
  observations: PlantObservation[]
): ParameterPrediction {
  const val = currentWaterLevel ?? 80;
  const drift = calculateDriftPerDay(observations, 'waterLevel');
  const criticalThreshold = 18; // 18% capacity critical threshold
  const isInside = val >= 30;

  let estimatedDaysToThreshold: number | null = null;
  let thresholdType: 'depletion_min' | 'toxicity_max' | 'critical_water' | 'none' = 'none';
  let trendDirection: 'rising' | 'falling' | 'stable' = 'stable';
  let forecastSummary = '';

  if (drift < -1.5) {
    trendDirection = 'falling';
    if (val > criticalThreshold) {
      estimatedDaysToThreshold = parseFloat(((val - criticalThreshold) / Math.abs(drift)).toFixed(1));
      thresholdType = 'critical_water';
      forecastSummary = `Evaporation & root uptake rate is ${drift}%/day. Estimated critical depletion (<${criticalThreshold}%) in ~${estimatedDaysToThreshold} days.`;
    } else {
      forecastSummary = `Reservoir is already in critical low capacity (<${criticalThreshold}%).`;
    }
  } else if (drift > 1.5) {
    trendDirection = 'rising';
    forecastSummary = `Water level has increased (+${drift}%/day) from recent reservoir top-off.`;
  } else {
    trendDirection = 'stable';
    forecastSummary = 'Reservoir capacity is stable with minimal evaporation loss.';
  }

  return {
    metric: 'waterLevel',
    label: 'Reservoir Capacity',
    currentValue: Math.round(val),
    unit: '%',
    driftPerDay: drift,
    trendDirection,
    targetMin: 30,
    targetMax: 100,
    isInsideTarget: isInside,
    estimatedDaysToThreshold,
    thresholdType,
    forecastSummary,
    confidenceScore: observations.length >= 3 ? 95 : 70,
  };
}

/**
 * Generate structured, prioritized ADVISORY grower recommendations
 */
function generateStructuredRecommendations(
  predictions: {
    ph: ParameterPrediction;
    tds: ParameterPrediction;
    waterLevel: ParameterPrediction;
  },
  anomalies: StatisticalAnomalyResult[],
  cropProfile: CropTargetProfile
): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  const now = Date.now();

  // 1. Water Level Critical Prediction
  if (predictions.waterLevel.estimatedDaysToThreshold !== null && predictions.waterLevel.estimatedDaysToThreshold < 2.0) {
    recommendations.push({
      id: `rec_water_crit_${now}`,
      category: 'water',
      priority: 'immediate',
      title: 'Top-Off Reservoir Water',
      action: `Prepare fresh pH-balanced water and refill reservoir before pump intake is exposed (estimated ${predictions.waterLevel.estimatedDaysToThreshold} days remaining).`,
      reasoning: `Consumption velocity is ${predictions.waterLevel.driftPerDay}%/day, leading to rapid dry-run risk if unreplenished. (ADVISORY GUIDANCE ONLY — MANUAL GROWER ACTION REQUIRED)`,
      timestamp: now,
    });
  }

  // 2. TDS Depletion Prediction
  if (predictions.tds.thresholdType === 'depletion_min' && predictions.tds.estimatedDaysToThreshold !== null) {
    recommendations.push({
      id: `rec_tds_depletion_${now}`,
      category: 'nutrient',
      priority: predictions.tds.estimatedDaysToThreshold < 3 ? 'high' : 'medium',
      title: 'Prepare Nutrient Solution Dosing',
      action: `Review nutrient concentration. Add calibrated A/B nutrient solution to maintain TDS within ${cropProfile.tdsMin}–${cropProfile.tdsMax} PPM.`,
      reasoning: `TDS is currently ${predictions.tds.currentValue} PPM and declining at ${predictions.tds.driftPerDay} PPM/day (projected depletion in ~${predictions.tds.estimatedDaysToThreshold} days). (ADVISORY GUIDANCE ONLY)`,
      timestamp: now,
    });
  }

  // 3. pH Drift Prediction
  if (predictions.ph.thresholdType === 'toxicity_max' && predictions.ph.estimatedDaysToThreshold !== null) {
    recommendations.push({
      id: `rec_ph_rise_${now}`,
      category: 'ph_balance',
      priority: predictions.ph.estimatedDaysToThreshold < 3 ? 'high' : 'medium',
      title: 'Prepare pH Down Acid Adjuster',
      action: `Prepare diluted pH Down (phosphoric/citric acid). Add incrementally to maintain pH between ${cropProfile.phMin} and ${cropProfile.phMax}.`,
      reasoning: `pH is rising at +${predictions.ph.driftPerDay}/day toward ceiling (projected boundary crossing in ~${predictions.ph.estimatedDaysToThreshold} days). (ADVISORY GUIDANCE ONLY)`,
      timestamp: now,
    });
  } else if (predictions.ph.thresholdType === 'depletion_min' && predictions.ph.estimatedDaysToThreshold !== null) {
    recommendations.push({
      id: `rec_ph_fall_${now}`,
      category: 'ph_balance',
      priority: predictions.ph.estimatedDaysToThreshold < 3 ? 'high' : 'medium',
      title: 'Prepare pH Up Alkaline Adjuster',
      action: `Prepare potassium hydroxide pH Up buffer to prevent root-zone acidification below ${cropProfile.phMin}.`,
      reasoning: `pH is falling at ${predictions.ph.driftPerDay}/day toward floor (projected boundary crossing in ~${predictions.ph.estimatedDaysToThreshold} days). (ADVISORY GUIDANCE ONLY)`,
      timestamp: now,
    });
  }

  // 4. Statistical Anomaly Alerts
  const activeStatAnomalies = anomalies.filter(a => a.isAnomaly);
  for (const anom of activeStatAnomalies) {
    recommendations.push({
      id: `rec_stat_${anom.metric}_${now}`,
      category: 'inspection',
      priority: anom.severity === 'critical' ? 'high' : 'medium',
      title: `Inspect ${anom.label} Sensor Probe`,
      action: `Inspect probe calibration and root-zone physical status for sudden ${anom.zScore}σ deviation.`,
      reasoning: `Statistical outlier detected: ${anom.description}. Verify probe cleanliness. (ADVISORY GUIDANCE ONLY)`,
      timestamp: now,
    });
  }

  // Fallback nominal guidance
  if (recommendations.length === 0) {
    recommendations.push({
      id: `rec_nominal_${now}`,
      category: 'inspection',
      priority: 'low',
      title: 'Maintain Current Regimen',
      action: 'Continue periodic camera scans and routine reservoir inspections. All trajectories are within safe parameters.',
      reasoning: 'System chemistry and visual canopy development are in equilibrium with no immediate corrective interventions required. (ADVISORY GUIDANCE ONLY)',
      timestamp: now,
    });
  }

  return recommendations;
}

/**
 * Execute full Predictive Analytics & Recommendation Engine
 */
export function runPredictiveAnalytics(
  currentPh: number | undefined,
  currentTds: number | undefined,
  currentWaterLevel: number | undefined,
  observations: PlantObservation[],
  cropProfile: CropTargetProfile
): PredictiveAnalyticsResult {
  const timestamp = Date.now();

  const phPred = predictPh(currentPh, observations, cropProfile);
  const tdsPred = predictTds(currentTds, observations, cropProfile);
  const waterPred = predictWaterLevel(currentWaterLevel, observations);

  const phStat = evaluateStatisticalAnomaly(currentPh, observations, 'ph', 'pH Chemical Balance');
  const tdsStat = evaluateStatisticalAnomaly(currentTds, observations, 'tds', 'TDS Nutrient Salinity');
  const waterStat = evaluateStatisticalAnomaly(currentWaterLevel, observations, 'waterLevel', 'Reservoir Water Level');

  const anomalies: StatisticalAnomalyResult[] = [phStat, tdsStat, waterStat];

  const recommendations = generateStructuredRecommendations(
    { ph: phPred, tds: tdsPred, waterLevel: waterPred },
    anomalies,
    cropProfile
  );

  return {
    timestamp,
    predictions: {
      ph: phPred,
      tds: tdsPred,
      waterLevel: waterPred,
    },
    anomalies,
    recommendations,
    disclaimer: PREDICTION_DISCLAIMER,
  };
}
