// ============================================================
// HydroSmart — Context-Aware Grounded AI Plant Companion Engine
// Strictly grounded in StructuredPlantContext with Epistemic Badging
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

  // 1. "How are you feeling today?" / Overall Condition Inquiries
  if (
    prompt.includes('how are you') ||
    prompt.includes('feeling') ||
    prompt.includes('how do you feel') ||
    prompt.includes('status') ||
    prompt.includes('healthy') ||
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

  // 2. Nutrients & TDS Inquiries
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

  // 3. Water Level & Reservoir Inquiries
  if (
    prompt.includes('water') ||
    prompt.includes('reservoir') ||
    prompt.includes('tank') ||
    prompt.includes('thirsty') ||
    prompt.includes('level')
  ) {
    if (!hasWater) {
      return {
        message:
          "I don't have enough current ultrasonic water-level data to evaluate reservoir volume. Please verify the HC-SR04 sensor connection.",
        epistemicBadges: [],
        groundedFacts: ['Ultrasonic telemetry unavailable'],
      };
    }

    badges.push('measured_fact');
    groundedFacts.push(`Water Level: ${Math.round(environment.waterLevel ?? 0)}%`, `Distance: ${environment.distance?.toFixed(1) ?? '--'} cm`);

    let msg = `My reservoir is currently at ${Math.round(environment.waterLevel ?? 0)}% capacity (ultrasonic distance offset: ${environment.distance?.toFixed(1) ?? '--'} cm).`;

    if (predictions.waterDriftPerDay < 0) {
      badges.push('mathematical_projection');
      msg += ` Daily evaporation and root uptake rate is estimated at ${predictions.waterDriftPerDay}%/day.`;
      if (predictions.waterDaysToThreshold !== null) {
        msg += ` At current uptake, critical depletion (<18%) is projected in ~${predictions.waterDaysToThreshold} days.`;
      }
    }

    if (environment.waterLevel !== undefined && environment.waterLevel < 25) {
      badges.push('grower_advisory');
      msg += ` [Grower Advisory]: Please top off the reservoir with fresh pH-balanced water to avoid pump dry-run cavitation.`;
    }

    return {
      message: msg,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 4. pH Chemical Balance Inquiries
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

  // 5. Growth & Visual Development Inquiries
  if (
    prompt.includes('grow') ||
    prompt.includes('size') ||
    prompt.includes('canopy') ||
    prompt.includes('leaf') ||
    prompt.includes('leaves') ||
    prompt.includes('look like')
  ) {
    badges.push('visual_observation');
    groundedFacts.push(
      `Canopy Coverage: ${visualState.canopyCoveragePercent ?? 0}%`,
      `Cumulative Delta: ${historical.canopyGrowthDelta >= 0 ? `+${historical.canopyGrowthDelta}` : historical.canopyGrowthDelta}%`,
      `Monitoring Span: ${plant.daysMonitored} days`
    );

    const canopyStr = visualState.canopyCoveragePercent !== undefined
      ? `My 2D optical canopy coverage is currently ${visualState.canopyCoveragePercent}%.`
      : 'Canopy coverage is being tracked via the camera.';

    const deltaSign = historical.canopyGrowthDelta >= 0 ? `+${historical.canopyGrowthDelta}%` : `${historical.canopyGrowthDelta}%`;
    const growthStr = `Over ${plant.daysMonitored} days of monitoring, my image-derived canopy expansion has changed by ${deltaSign}. Note that this is a 2D optical surface estimate rather than a wet biomass measurement.`;

    const indicatorsStr = visualState.indicators.length > 0
      ? ` Detected visual markers include: ${visualState.indicators.join(', ')}.`
      : ' No optical stress indicators are currently active.';

    return {
      message: `${canopyStr} ${growthStr}${indicatorsStr}`,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 6. Future Projections & "What should I watch out for?"
  if (
    prompt.includes('watch out') ||
    prompt.includes('future') ||
    prompt.includes('predict') ||
    prompt.includes('forecast') ||
    prompt.includes('change')
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

  // 7. Advice & Action Inquiries ("What should I do?")
  if (
    prompt.includes('what should i do') ||
    prompt.includes('advice') ||
    prompt.includes('recommend') ||
    prompt.includes('action') ||
    prompt.includes('need anything')
  ) {
    badges.push('grower_advisory');

    if (recommendations.items.length === 0) {
      return {
        message:
          'Everything is operating within safe targets! Continue periodic camera checks and maintain current reservoir levels. (ADVISORY GUIDANCE ONLY)',
        epistemicBadges: badges,
        groundedFacts: ['All parameters within nominal bounds'],
      };
    }

    const topRec = recommendations.items[0];
    groundedFacts.push(`Top Action: ${topRec.title}`, `Priority: ${topRec.priority}`);

    return {
      message: `Here is my highest priority advisory guidance: **${topRec.title}** (${topRec.priority.toUpperCase()} priority). ${topRec.action}. (Please note: All recommendations represent advisory guidance for manual grower execution, as no automated dosing pumps are connected.)`,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // 8. Species & Botanical Identity Inquiries
  if (
    prompt.includes('who are you') ||
    prompt.includes('what plant') ||
    prompt.includes('species') ||
    prompt.includes('identity') ||
    prompt.includes('name')
  ) {
    badges.push('measured_fact');
    groundedFacts.push(`Species: ${plant.species}`, `Scientific: ${plant.scientificName ?? 'N/A'}`);

    return {
      message: `I am your monitored **${plant.species}** (${plant.scientificName ?? 'Lactuca sativa'}), currently in the ${plant.growthStage} stage. I have been monitored across ${plant.daysMonitored} days with ${historical.totalObservations} recorded multimodal snapshots.`,
      epistemicBadges: badges,
      groundedFacts,
    };
  }

  // Fallback Grounded General Response
  badges.push('measured_fact', 'visual_observation');
  return {
    message: `I am your monitored ${plant.species}. My current overall condition score is ${historical.overallHealthScore}/100. Current measured telemetry shows pH at ${environment.ph?.toFixed(2) ?? '--'}, TDS at ${Math.round(environment.tds ?? 0)} PPM, and water level at ${Math.round(environment.waterLevel ?? 0)}%. Ask me about my nutrients, water level, visual growth, or future trend forecasts!`,
    epistemicBadges: badges,
    groundedFacts: [`Overall Health: ${historical.overallHealthScore}/100`],
  };
}
