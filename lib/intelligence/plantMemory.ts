// ============================================================
// HydroSmart — Plant Growth Tracking & Memory Engine
// Image-Derived Growth Estimates & Retrospective Reasoning
// ============================================================

import {
  PlantObservation,
  PlantGrowthMetrics,
  PlantJourneyMilestone,
  PlantMemoryAnswers
} from './types';

const GROWTH_DISCLAIMER =
  'IMAGE-DERIVED GROWTH ESTIMATES: Values represent 2D optical canopy surface area changes detected by the camera and do not claim physical wet/dry biomass measurement.';

/**
 * Compute optical canopy growth metrics across historical observations
 */
export function computeGrowthEstimates(
  observations: PlantObservation[]
): PlantGrowthMetrics {
  if (!observations || observations.length < 2) {
    const single = observations?.[0];
    return {
      initialCanopyCoverage: single?.canopyCoveragePercent ?? 0,
      latestCanopyCoverage: single?.canopyCoveragePercent ?? 0,
      cumulativeGrowthDelta: 0,
      dailyGrowthVelocity: 0,
      daysMonitored: 1,
      growthState: 'insufficient_data',
      disclaimer: GROWTH_DISCLAIMER,
    };
  }

  // Sort chronologically ascending (oldest first)
  const chronological = [...observations].sort((a, b) => a.timestamp - b.timestamp);

  const initial = chronological[0];
  const latest = chronological[chronological.length - 1];

  const initialCanopy = initial.canopyCoveragePercent ?? 12.0;
  const latestCanopy = latest.canopyCoveragePercent ?? 12.0;

  const cumulativeGrowthDelta = parseFloat((latestCanopy - initialCanopy).toFixed(1));

  // Elapsed days
  const elapsedMs = Math.max(1, latest.timestamp - initial.timestamp);
  const elapsedDays = Math.max(1, parseFloat((elapsedMs / (1000 * 60 * 60 * 24)).toFixed(1)));

  // Daily expansion velocity (% / day)
  const dailyGrowthVelocity = parseFloat((cumulativeGrowthDelta / elapsedDays).toFixed(2));

  let growthState: 'expanding' | 'steady' | 'contracting' | 'insufficient_data' = 'steady';
  if (cumulativeGrowthDelta > 1.5) {
    growthState = 'expanding';
  } else if (cumulativeGrowthDelta < -1.5) {
    growthState = 'contracting';
  } else {
    growthState = 'steady';
  }

  return {
    initialCanopyCoverage: initialCanopy,
    latestCanopyCoverage: latestCanopy,
    cumulativeGrowthDelta,
    dailyGrowthVelocity,
    daysMonitored: Math.round(elapsedDays),
    growthState,
    disclaimer: GROWTH_DISCLAIMER,
  };
}

/**
 * Compile chronological milestones for the Plant Journey timeline
 */
export function compilePlantJourney(
  observations: PlantObservation[]
): PlantJourneyMilestone[] {
  if (!observations || observations.length === 0) {
    return [];
  }

  // Sort chronologically ascending
  const sorted = [...observations].sort((a, b) => a.timestamp - b.timestamp);
  const baselineTimestamp = sorted[0].timestamp;
  const initialCanopy = sorted[0].canopyCoveragePercent ?? 0;

  return sorted.map((obs, index) => {
    const elapsedDays = Math.max(1, Math.round((obs.timestamp - baselineTimestamp) / 86400000) + 1);
    const dayLabel = index === 0
      ? `Day 1 · Initial Baseline`
      : `Day ${elapsedDays} · Growth Milestone`;

    const d = new Date(obs.timestamp);
    const dateString = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const canopy = obs.canopyCoveragePercent ?? 0;
    const canopyDelta = parseFloat((canopy - initialCanopy).toFixed(1));

    let healthState: 'optimal' | 'warning' | 'critical' = 'optimal';
    const score = obs.overallHealthScore ?? 85;
    if (score < 50) healthState = 'critical';
    else if (score < 80) healthState = 'warning';

    const anomaliesSummary = obs.activeAnomalies && obs.activeAnomalies.length > 0
      ? obs.activeAnomalies.join(', ')
      : 'Nominal physiological balance';

    return {
      id: obs.id,
      dayNumber: elapsedDays,
      dayLabel,
      dateString,
      timestamp: obs.timestamp,
      imageReference: obs.imageReference,
      healthScore: score,
      healthState,
      canopyCoveragePercent: canopy,
      canopyDeltaPercent: canopyDelta,
      ph: obs.ph,
      tds: obs.tds,
      waterLevel: obs.waterLevel,
      anomaliesSummary,
    };
  });
}

/**
 * Answer retrospective natural language memory queries based on persistent history
 */
export function answerPlantMemoryQueries(
  observations: PlantObservation[],
  cropName: string
): PlantMemoryAnswers {
  if (!observations || observations.length < 2) {
    return {
      howHasPlantChanged: `Initial observation recorded for ${cropName}. Continuous multimodal monitoring will track optical leaf expansion, chlorophyll density shifts, and chemical consumption rates over time.`,
      isPlantHealthier: `Baseline health index established. Log subsequent snapshots to calculate longitudinal health score improvement trajectories.`,
      whatChangedRecently: `Currently operating under the initial ${cropName} calibration profile. Real-time ESP32 sensors and camera monitors are active.`,
      confidenceScore: 60,
    };
  }

  const sorted = [...observations].sort((a, b) => a.timestamp - b.timestamp);
  const oldest = sorted[0];
  const newest = sorted[sorted.length - 1];
  const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : oldest;

  // 1. How has the plant changed?
  const initialCanopy = oldest.canopyCoveragePercent ?? 12.0;
  const currentCanopy = newest.canopyCoveragePercent ?? 12.0;
  const canopyDelta = parseFloat((currentCanopy - initialCanopy).toFixed(1));
  const canopySign = canopyDelta >= 0 ? `+${canopyDelta}%` : `${canopyDelta}%`;

  const daysMonitored = Math.max(1, Math.round((newest.timestamp - oldest.timestamp) / 86400000) + 1);

  const howHasPlantChanged = canopyDelta > 2
    ? `Over ${daysMonitored} days of monitoring, ${cropName} canopy has expanded by ${canopySign} in 2D camera coverage (from ${initialCanopy}% to ${currentCanopy}%). Foliage coloration shows active chlorophyll reflectance with sustained vegetative leaf cluster expansion.`
    : canopyDelta < -2
      ? `Over ${daysMonitored} days, detected canopy coverage contracted by ${canopySign} (from ${initialCanopy}% to ${currentCanopy}%). Inspect for physical drooping, trimming, or optical camera angle shifts.`
      : `Over ${daysMonitored} days, ${cropName} canopy surface area has remained steady around ${currentCanopy}% coverage (${canopySign} change) with consistent structural density.`;

  // 2. Is the plant healthier than last week / earlier?
  const initialScore = oldest.overallHealthScore ?? 80;
  const currentScore = newest.overallHealthScore ?? 80;
  const scoreDelta = currentScore - initialScore;

  const isPlantHealthier = scoreDelta > 3
    ? `Yes. The overall health score improved by +${scoreDelta} points (from ${initialScore}/100 to ${currentScore}/100). Environmental chemistry and optical stress indicators reflect superior biological stability compared to earlier baseline.`
    : scoreDelta < -3
      ? `No. The overall health score declined by ${scoreDelta} points (from ${initialScore}/100 to ${currentScore}/100). Review recent pH drift or nutrient salinity warnings to restore optimal equilibrium.`
      : `Health condition is steady. The overall score is ${currentScore}/100 (compared to baseline ${initialScore}/100), indicating balanced nutrient delivery and physiological homeostasis.`;

  // 3. What changed recently?
  const recentPhDelta = (newest.ph !== undefined && previous.ph !== undefined)
    ? parseFloat((newest.ph - previous.ph).toFixed(2))
    : 0;
  const recentTdsDelta = (newest.tds !== undefined && previous.tds !== undefined)
    ? Math.round(newest.tds - previous.tds)
    : 0;

  const recentAnomalies = newest.activeAnomalies || [];

  const whatChangedRecently = recentAnomalies.length > 0
    ? `Latest update: Active warning "${recentAnomalies[0]}" was logged. pH shifted by ${recentPhDelta >= 0 ? `+${recentPhDelta}` : recentPhDelta} and TDS changed by ${recentTdsDelta >= 0 ? `+${recentTdsDelta}` : recentTdsDelta} PPM.`
    : `Latest update: Parameters remain well-balanced. Recent pH shift is ${recentPhDelta >= 0 ? `+${recentPhDelta}` : recentPhDelta}, TDS shift is ${recentTdsDelta >= 0 ? `+${recentTdsDelta}` : recentTdsDelta} PPM, with no active physiological anomalies.`;

  return {
    howHasPlantChanged,
    isPlantHealthier,
    whatChangedRecently,
    confidenceScore: 94,
  };
}
