// ============================================================
// HydroSmart — Context-Aware Grounded AI Plant Companion Engine
// Phase 9 Dedicated Conversational Grounding Engine
// ============================================================

import { StructuredPlantContext, AIPlantResponse } from './types';

/**
 * Resolve user inquiries grounded strictly in actual plant context
 */
export async function askAIPlant(
  rawPrompt: string,
  context: StructuredPlantContext
): Promise<AIPlantResponse> {
  const prompt = rawPrompt.trim().toLowerCase();
  const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = [];
  const groundedFacts: string[] = [];

  const { plant, visualState, environment, historical, predictions, recommendations } = context;

  const hasPh = environment.ph !== undefined && !environment.isTelemetryStale;
  const hasTds = environment.tds !== undefined && !environment.isTelemetryStale;
  const hasWater = environment.waterLevel !== undefined && !environment.isTelemetryStale;
  const hasVisual = visualState.healthScore !== undefined && visualState.healthState !== 'unknown';

  // 1. "Do you need water?" / Water Level & Reservoir Inquiries
  if (
    prompt.includes('need water') ||
    prompt.includes('thirsty') ||
    prompt.includes('water level') ||
    prompt.includes('reservoir') ||
    prompt.includes('tank')
  ) {
    if (!hasWater) {
      return {
        message:
          "I don't have enough current ultrasonic water-level data to determine if I need water. Please verify the HC-SR04 ultrasonic sensor connection on the ESP32.",
        epistemicBadges: [],
        groundedFacts: ['Ultrasonic telemetry unavailable'],
      };
    }

    badges.push('measured_fact');
    groundedFacts.push(`Water Level: ${Math.round(environment.waterLevel ?? 0)}%`, `Distance: ${environment.distance?.toFixed(1) ?? '--'} cm`);

    const currentWl = Math.round(environment.waterLevel ?? 0);
    let msg = '';

    if (currentWl < 25) {
      badges.push('grower_advisory');
      msg = `Yes, I need water! My reservoir is currently down to ${currentWl}% capacity (ultrasonic distance: ${environment.distance?.toFixed(1) ?? '--'} cm), which is close to the critical threshold of 18%. Please top off the reservoir with fresh pH-balanced water to prevent pump dry-run.`;
    } else if (currentWl < 50) {
      msg = `I have adequate water for now (${currentWl}% capacity), but volume is moderately low.`;
      if (predictions.waterDriftPerDay < 0 && predictions.waterDaysToThreshold !== null) {
        badges.push('mathematical_projection');
        msg += ` At current root uptake and evaporation (${predictions.waterDriftPerDay}%/day), I project needing a refill in approximately ${predictions.waterDaysToThreshold} days.`;
      }
    } else {
      msg = `No, my water level is optimal! The reservoir is at ${currentWl}% capacity (ultrasonic distance: ${environment.distance?.toFixed(1) ?? '--'} cm), providing plenty of buffer for root uptake.`;
    }

    return {
      message: msg,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 2. "Why do your leaves look different?" / Leaf Appearance & Visual Stress
  if (
    prompt.includes('leaves look') ||
    prompt.includes('leaf look') ||
    prompt.includes('different') ||
    prompt.includes('yellow') ||
    prompt.includes('brown') ||
    prompt.includes('spots') ||
    prompt.includes('wilting')
  ) {
    if (!hasVisual) {
      return {
        message:
          "I don't have active camera vision data right now to inspect my leaves. Please start the laptop plant camera so my computer-vision model can analyze my foliage.",
        epistemicBadges: [],
        groundedFacts: ['Camera stream inactive'],
      };
    }

    badges.push('visual_observation');
    groundedFacts.push(
      `Visual Health Score: ${visualState.healthScore}/100`,
      `Visual State: ${visualState.healthState}`,
      `Active Indicators: ${visualState.indicators.length > 0 ? visualState.indicators.join(', ') : 'None'}`
    );

    if (visualState.healthState === 'healthy') {
      return {
        message: `My leaves appear healthy! The computer-vision analysis gave my foliage a visual score of ${visualState.healthScore}/100 with optimal Excess Green (ExG) chlorophyll reflectance and upright canopy vigor. No significant discoloration, browning, or wilting was detected.`,
        epistemicBadges: badges,
        groundedFacts,
      };
    }

    const stressDetails = visualState.indicators.length > 0
      ? `The optical model detected: ${visualState.indicators.join(', ')}.`
      : 'The optical model detected mild visual deviations in leaf surface uniformity.';

    let envCorrelation = '';
    if (hasTds && environment.tds !== undefined && environment.tds < environment.targetEnvelope.tdsMin) {
      badges.push('measured_fact');
      envCorrelation = ` Note that my TDS is currently ${Math.round(environment.tds)} PPM (below target ${environment.targetEnvelope.tdsMin} PPM), which may correlate with lighter foliage color.`;
    } else if (hasPh && environment.ph !== undefined && environment.ph > environment.targetEnvelope.phMax) {
      badges.push('measured_fact');
      envCorrelation = ` Additionally, solution pH is elevated at ${environment.ph.toFixed(2)}, which can inhibit micronutrient uptake.`;
    }

    return {
      message: `The camera detected visual indicators that may indicate stress (visual health: ${visualState.healthScore}/100). ${stressDetails}${envCorrelation} (Note: This is an optical stress analysis and not a definitive biological disease diagnosis.)`,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 3. "How are you compared with last week?" / "How are you compared to baseline?"
  if (
    prompt.includes('compared') ||
    prompt.includes('last week') ||
    prompt.includes('earlier') ||
    prompt.includes('before') ||
    prompt.includes('timeline')
  ) {
    if (historical.totalObservations < 2) {
      return {
        message: `I have only recorded ${historical.totalObservations} baseline observation so far. As you log more snapshots over the coming days, I will be able to provide detailed longitudinal comparisons with last week!`,
        epistemicBadges: ['measured_fact'],
        groundedFacts: ['Baseline established'],
      };
    }

    badges.push('measured_fact', 'visual_observation');

    const deltaSign = historical.canopyGrowthDelta >= 0 ? `+${historical.canopyGrowthDelta}%` : `${historical.canopyGrowthDelta}%`;
    groundedFacts.push(
      `Canopy Delta: ${deltaSign}`,
      `Current Health: ${historical.overallHealthScore}/100`,
      `Trend: ${historical.longitudinalTrend}`
    );

    const trendWord = historical.longitudinalTrend === 'improving'
      ? 'improving'
      : historical.longitudinalTrend === 'declining'
        ? 'under mild downward drift'
        : 'stable and steady';

    return {
      message: `Compared to my initial monitoring baseline (${plant.daysMonitored} days ago across ${historical.totalObservations} snapshots), my 2D optical canopy coverage has changed by ${deltaSign} (image-derived estimate). My overall multimodal condition score is currently ${historical.overallHealthScore}/100, reflecting a ${trendWord} physiological trajectory.`,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 4. "What changed today?" / Recent Telemetry & Observation Shifts
  if (
    prompt.includes('changed today') ||
    prompt.includes('what changed') ||
    prompt.includes('recent change') ||
    prompt.includes('latest change')
  ) {
    badges.push('measured_fact');

    const phStr = hasPh ? `pH is at ${environment.ph?.toFixed(2)}` : 'pH awaiting reading';
    const tdsStr = hasTds ? `TDS is ${Math.round(environment.tds ?? 0)} PPM (drift: ${predictions.tdsDriftPerDay >= 0 ? `+${predictions.tdsDriftPerDay}` : predictions.tdsDriftPerDay} PPM/day)` : 'TDS awaiting reading';
    const wlStr = hasWater ? `water level is ${Math.round(environment.waterLevel ?? 0)}%` : 'water level awaiting reading';

    groundedFacts.push(phStr, tdsStr, wlStr);

    let anomalyNotice = 'No new physiological anomalies have occurred today.';
    if (historical.activeAnomalies.length > 0) {
      anomalyNotice = `Active alerts today: ${historical.activeAnomalies.join(', ')}.`;
    }

    return {
      message: `Here is what changed recently: Current telemetry shows ${phStr}, ${tdsStr}, and ${wlStr}. ${anomalyNotice}`,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 5. "Have you grown?" / Growth Progression Inquiries
  if (
    prompt.includes('grow') ||
    prompt.includes('grown') ||
    prompt.includes('growth') ||
    prompt.includes('size') ||
    prompt.includes('bigger')
  ) {
    badges.push('visual_observation');
    const deltaSign = historical.canopyGrowthDelta >= 0 ? `+${historical.canopyGrowthDelta}%` : `${historical.canopyGrowthDelta}%`;
    groundedFacts.push(
      `Canopy Coverage: ${visualState.canopyCoveragePercent ?? 0}%`,
      `Canopy Expansion: ${deltaSign}`,
      `Days Monitored: ${plant.daysMonitored}`
    );

    const canopyNow = visualState.canopyCoveragePercent ?? 0;
    const growthState = historical.canopyGrowthDelta > 1.5
      ? 'actively expanding'
      : historical.canopyGrowthDelta < -1.5
        ? 'contracting (check leaf turgor or camera angle)'
        : 'steady';

    return {
      message: `Yes! Over ${plant.daysMonitored} days of monitoring, my 2D optical canopy coverage has changed by ${deltaSign} (currently at ${canopyNow}% coverage), and my vegetative state is ${growthState}. (Please note: This represents an image-derived 2D optical surface area estimate rather than a wet biomass measurement.)`,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 6. "How are you?" / "How is your health?" / Overall Condition Inquiries
  if (
    prompt.includes('how are you') ||
    prompt.includes('feeling') ||
    prompt.includes('how is your health') ||
    prompt.includes('health') ||
    prompt.includes('status') ||
    prompt.includes('doing')
  ) {
    if (!hasPh && !hasTds && !hasVisual) {
      return {
        message:
          "I don't have enough current sensor or camera data to determine how I am feeling right now. Please ensure the ESP32 sensors are connected and the live plant camera is active so I can give you an accurate, grounded update.",
        epistemicBadges: [],
        groundedFacts: ['Insufficient real-time sensory data'],
      };
    }

    badges.push('measured_fact', 'visual_observation');

    const visualDesc = hasVisual
      ? `My computer-vision visual health score is ${visualState.healthScore}/100 (${visualState.healthState.replace('_', ' ')}).`
      : 'Visual camera monitoring is currently on standby.';

    let envDesc = '';
    if (hasPh && hasTds && hasWater) {
      envDesc = `My reservoir environment is currently measured at pH ${environment.ph?.toFixed(2)} (${environment.phStatus}), TDS ${Math.round(environment.tds ?? 0)} PPM (${environment.tdsStatus}), and water level at ${Math.round(environment.waterLevel ?? 0)}%.`;
      groundedFacts.push(`pH: ${environment.ph?.toFixed(2)}`, `TDS: ${Math.round(environment.tds ?? 0)} PPM`, `WL: ${Math.round(environment.waterLevel ?? 0)}%`);
    } else {
      envDesc = 'Some environmental sensor metrics are currently awaiting fresh telemetry.';
    }

    let trendNote = '';
    if (predictions.tdsDaysToThreshold !== null && predictions.tdsDaysToThreshold < 5) {
      badges.push('mathematical_projection');
      trendNote = ` Keep in mind that my nutrient salinity is declining at ${predictions.tdsDriftPerDay} PPM/day, with estimated depletion in ~${predictions.tdsDaysToThreshold} days.`;
    }

    const stateGreeting = historical.overallHealthScore >= 80
      ? `I appear to be doing well based on my latest multimodal telemetry! ${visualDesc} ${envDesc}${trendNote}`
      : historical.overallHealthScore >= 60
        ? `I am experiencing mild stress right now. ${visualDesc} ${envDesc}${trendNote}`
        : `I need some grower attention. ${visualDesc} ${envDesc}${trendNote}`;

    return {
      message: stateGreeting,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 7. Nutrients & Fertilizer Inquiries
  if (
    prompt.includes('nutrient') ||
    prompt.includes('tds') ||
    prompt.includes('ppm') ||
    prompt.includes('fertilizer') ||
    prompt.includes('feed')
  ) {
    if (!hasTds) {
      return {
        message:
          "I don't have enough current TDS telemetry data to assess my nutrient concentration. Please check that the ESP32 TDS sensor probe is submerged and transmitting.",
        epistemicBadges: [],
        groundedFacts: ['TDS sensor metric unavailable'],
      };
    }

    badges.push('measured_fact');
    groundedFacts.push(`Measured TDS: ${Math.round(environment.tds ?? 0)} PPM`, `Target Band: ${environment.targetEnvelope.tdsMin}–${environment.targetEnvelope.tdsMax} PPM`);

    let msg = `My current nutrient concentration is measured at ${Math.round(environment.tds ?? 0)} PPM. My ideal target band for ${plant.species} is ${environment.targetEnvelope.tdsMin} to ${environment.targetEnvelope.tdsMax} PPM.`;

    if (predictions.tdsDriftPerDay !== 0) {
      badges.push('mathematical_projection');
      msg += ` Recent consumption drift is ${predictions.tdsDriftPerDay >= 0 ? `+${predictions.tdsDriftPerDay}` : predictions.tdsDriftPerDay} PPM/day.`;
      if (predictions.tdsDaysToThreshold !== null) {
        msg += ` At this rate, I project reaching the boundary threshold in approximately ${predictions.tdsDaysToThreshold} days.`;
      }
    }

    if (recommendations.items.some(r => r.title.toLowerCase().includes('nutrient') || r.title.toLowerCase().includes('tds'))) {
      badges.push('grower_advisory');
      const rec = recommendations.items.find(r => r.title.toLowerCase().includes('nutrient') || r.title.toLowerCase().includes('tds'))!;
      msg += ` [Grower Advisory]: ${rec.action}`;
    }

    return {
      message: msg,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 8. pH Chemical Balance Inquiries
  if (
    prompt.includes('ph') ||
    prompt.includes('acid') ||
    prompt.includes('alkaline') ||
    prompt.includes('chemistry')
  ) {
    if (!hasPh) {
      return {
        message:
          "I don't have enough current pH sensor data to evaluate chemical balance. Please verify the analog pH probe connection.",
        epistemicBadges: [],
        groundedFacts: ['pH sensor telemetry unavailable'],
      };
    }

    badges.push('measured_fact');
    groundedFacts.push(`Measured pH: ${environment.ph?.toFixed(2)}`, `Target Range: ${environment.targetEnvelope.phMin}–${environment.targetEnvelope.phMax}`);

    let msg = `My solution pH is currently measured at ${environment.ph?.toFixed(2)}, which is evaluated as ${environment.phStatus}. The target envelope for ${plant.species} is ${environment.targetEnvelope.phMin} to ${environment.targetEnvelope.phMax}.`;

    if (predictions.phDriftPerDay !== 0) {
      badges.push('mathematical_projection');
      msg += ` Current drift velocity is ${predictions.phDriftPerDay >= 0 ? `+${predictions.phDriftPerDay}` : predictions.phDriftPerDay} pH/day.`;
      if (predictions.phDaysToThreshold !== null) {
        msg += ` Boundary crossing is projected in ~${predictions.phDaysToThreshold} days.`;
      }
    }

    return {
      message: msg,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 9. Future Forecasts / "What should I watch out for?"
  if (
    prompt.includes('watch out') ||
    prompt.includes('future') ||
    prompt.includes('predict') ||
    prompt.includes('forecast')
  ) {
    badges.push('mathematical_projection');

    const phNote = predictions.phDaysToThreshold !== null
      ? `pH boundary crossing (~${predictions.phDaysToThreshold} days)`
      : 'pH is stable';
    const tdsNote = predictions.tdsDaysToThreshold !== null
      ? `TDS depletion (~${predictions.tdsDaysToThreshold} days)`
      : 'TDS is stable';
    const waterNote = predictions.waterDaysToThreshold !== null
      ? `Critical water depletion (~${predictions.waterDaysToThreshold} days)`
      : 'Water level is sufficient';

    groundedFacts.push(phNote, tdsNote, waterNote);

    return {
      message: `Based on linear time-series regressions: pH is drifting at ${predictions.phDriftPerDay >= 0 ? `+${predictions.phDriftPerDay}` : predictions.phDriftPerDay}/day (${phNote}), TDS rate is ${predictions.tdsDriftPerDay >= 0 ? `+${predictions.tdsDriftPerDay}` : predictions.tdsDriftPerDay} PPM/day (${tdsNote}), and reservoir capacity change is ${predictions.waterDriftPerDay}%/day (${waterNote}). Remember these are mathematical projections based on historical consumption velocity rather than guaranteed physical outcomes.`,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // Fallback Grounded General Response
  badges.push('measured_fact', 'visual_observation');
  return {
    message: `I am your monitored ${plant.species}. My current overall condition score is ${historical.overallHealthScore}/100. Current measured telemetry shows pH at ${environment.ph?.toFixed(2) ?? '--'}, TDS at ${Math.round(environment.tds ?? 0)} PPM, and water level at ${Math.round(environment.waterLevel ?? 0)}%. Ask me if I need water, why my leaves look different, or how I compare to last week!`,
    epistemicBadges: badges,
    groundedFacts: [`Overall Health: ${historical.overallHealthScore}/100`],
  };
}
