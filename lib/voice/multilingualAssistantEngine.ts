// ============================================================
// HydroSmart — Multilingual Grounded Plant Assistant Engine
// Native Support for Kannada (ಕನ್ನಡ) and English (Indian)
// ============================================================

import { StructuredPlantContext } from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from './voiceConfig';

export interface MultilingualAIResponse {
  spokenText: string;
  displayText: string;
  language: SupportedLanguageCode;
  mode: AssistantMode;
  epistemicBadges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'>;
}

/**
 * Generate a grounded multilingual response for farmer speech input
 */
export async function generateMultilingualPlantResponse(
  rawTranscript: string,
  context: StructuredPlantContext,
  language: SupportedLanguageCode = 'kn-IN',
  mode: AssistantMode = 'farmer'
): Promise<MultilingualAIResponse> {
  const query = rawTranscript.trim().toLowerCase();
  const { plant, visualState, environment, historical, predictions, recommendations } = context;

  const hasPh = environment.ph !== undefined && !environment.isTelemetryStale;
  const hasTds = environment.tds !== undefined && !environment.isTelemetryStale;
  const hasWater = environment.waterLevel !== undefined && !environment.isTelemetryStale;
  const hasVisual = visualState.healthScore !== undefined && visualState.healthState !== 'unknown';

  const isKannada = language === 'kn-IN';

  // 1. Water Level & Thirst Inquiries
  // Kannada: ನೀರು, ಬಾಯಾರಿಕೆ, ತೊಟ್ಟಿ, ಟ್ಯಾಂಕ್, ನೀರಿನ ಮಟ್ಟ
  // English: water, thirsty, tank, level, reservoir
  if (
    query.includes('ನೀರು') ||
    query.includes('ಬಾಯಾರಿಕೆ') ||
    query.includes('ತೊಟ್ಟಿ') ||
    query.includes('ಟ್ಯಾಂಕ್') ||
    query.includes('water') ||
    query.includes('thirsty') ||
    query.includes('tank') ||
    query.includes('reservoir')
  ) {
    if (!hasWater) {
      const spokenText = isKannada
        ? 'ESP32 ಸೆನ್ಸರ್ ಸಂಪರ್ಕದಲ್ಲಿಲ್ಲದ ಕಾರಣ ನೀರಿನ ಮಟ್ಟವನ್ನು ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಾಧನವನ್ನು ಪರಿಶೀಲಿಸಿ.'
        : "I cannot check the water level right now because the ESP32 sensor is disconnected. Please check the hardware connection.";
      return {
        spokenText,
        displayText: spokenText,
        language,
        mode,
        epistemicBadges: [],
      };
    }

    const currentWl = Math.round(environment.waterLevel ?? 0);
    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = ['measured_fact'];

    if (currentWl < 25) {
      badges.push('grower_advisory');
      const spokenText = isKannada
        ? (mode === 'farmer'
            ? `ಹೌದು, ಗಿಡಕ್ಕೆ ನೀರಿನ ಅಗತ್ಯವಿದೆ. ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರು ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ (${currentWl}%). ಪಂಪ್ ಹಾಳಾಗದಂತೆ ದಯವಿಟ್ಟು ನೀರನ್ನು ತುಂಬಿಸಿ.`
            : `ಎಚ್ಚರಿಕೆ: ನೀರಿನ ಮಟ್ಟವು ${currentWl}% ಗೆ ಇಳಿದಿದೆ (ಅಲ್ಟ್ರಾಸಾನಿಕ್ ಅಂತರ ${environment.distance?.toFixed(1) ?? '--'} cm). ತುರ್ತಾಗಿ ನೀರು ತುಂಬಿಸಿ.`)
        : (mode === 'farmer'
            ? `Yes, your plant needs water. The tank water is very low at ${currentWl}%. Please top up the tank with fresh water.`
            : `Water alert: Tank level is down to ${currentWl}% (${environment.distance?.toFixed(1) ?? '--'} cm). Immediate refill required.`);
      return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
    }

    if (currentWl < 50) {
      const spokenText = isKannada
        ? (mode === 'farmer'
            ? `ಈಗ ಸದ್ಯಕ್ಕೆ ನೀರಿನ ಪ್ರಮಾಣ ಸಾಧಾರಣವಾಗಿದೆ (${currentWl}%). ಮುಂದಿನ ಎರಡು ಮೂರು ದಿನಗಳಲ್ಲಿ ನೀರು ತುಂಬಿಸಬೇಕಾಗಬಹುದು.`
            : `ನೀರಿನ ಮಟ್ಟವು ${currentWl}% ಇದೆ. ಪ್ರಸ್ತುತ ಬಳಕೆಯ ದರದಲ್ಲಿ ಸುಮಾರು ${predictions.waterDaysToThreshold ?? 3} ದಿನಗಳ ನಂತರ ಮರುಪೂರಣ ಅಗತ್ಯವಿದೆ.`)
        : (mode === 'farmer'
            ? `Water level is moderate right now at ${currentWl}%. You may need to add water in a couple of days.`
            : `Water level is at ${currentWl}%. Estimated threshold in ~${predictions.waterDaysToThreshold ?? 3} days.`);
      return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
    }

    const spokenText = isKannada
      ? (mode === 'farmer'
          ? `ಇಲ್ಲ, ನೀರಿನ ಮಟ್ಟ ಉತ್ತಮವಾಗಿದೆ (${currentWl}%). ಗಿಡಕ್ಕೆ ಸಾಕಷ್ಟು ನೀರಿದೆ.`
          : `ನೀರಿನ ಮಟ್ಟವು ಅತ್ಯುತ್ತಮವಾಗಿದೆ (${currentWl}%, ${environment.distance?.toFixed(1) ?? '--'} cm).`)
      : (mode === 'farmer'
          ? `No, your plant has plenty of water (${currentWl}%). Everything looks good in the tank.`
          : `Water level is optimal at ${currentWl}% (${environment.distance?.toFixed(1) ?? '--'} cm).`);
    return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
  }

  // 2. Leaf Appearance, Yellowing, Discoloration Inquiries
  // Kannada: ಎಲೆ, ಹಳದಿ, ಕಂದು, ಬಾಡಿದೆ, ಕಲೆ
  // English: leaf, leaves, yellow, brown, spots, wilt
  if (
    query.includes('ಎಲೆ') ||
    query.includes('ಹಳದಿ') ||
    query.includes('ಕಂದು') ||
    query.includes('ಬಾಡಿದೆ') ||
    query.includes('leaf') ||
    query.includes('leaves') ||
    query.includes('yellow') ||
    query.includes('brown') ||
    query.includes('wilt') ||
    query.includes('spot')
  ) {
    if (!hasVisual) {
      const spokenText = isKannada
        ? 'ಕ್ಯಾಮೆರಾ ಆನ್ ಇಲ್ಲದ ಕಾರಣ ಎಲೆಗಳನ್ನು ನೋಡಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಗಿಡದ ಕ್ಯಾಮೆರಾವನ್ನು ಆನ್ ಮಾಡಿ.'
        : "I don't have an active camera view of the leaves right now. Please start the plant camera to inspect foliage.";
      return {
        spokenText,
        displayText: spokenText,
        language,
        mode,
        epistemicBadges: [],
      };
    }

    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = ['visual_observation'];

    if (visualState.healthState === 'healthy') {
      const spokenText = isKannada
        ? (mode === 'farmer'
            ? 'ಎಲೆಗಳು ಹಸಿರಾಗಿ ಮತ್ತು ಆರೋಗ್ಯಕರವಾಗಿ ಕಾಣಿಸುತ್ತಿವೆ. ಯಾವುದೇ ಹಳದಿ ಅಥವಾ ಕಂದು ಕಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ.'
            : `ಕ್ಯಾಮೆರಾ ದೃಶ್ಯ ಸ್ಕೋರ್: ${visualState.healthScore}/100. ಎಲೆಗಳ ಕ್ಲೋರೊಫಿಲ್ ಮಟ್ಟ ಸೂಕ್ತವಾಗಿದೆ.`)
        : (mode === 'farmer'
            ? "Your plant's leaves look green and healthy. No yellowing or wilting was detected by the camera."
            : `Visual health score: ${visualState.healthScore}/100. Optimal ExG chlorophyll reflectance with no active stress flags.`);
      return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
    }

    const spokenText = isKannada
      ? (mode === 'farmer'
          ? 'ಕ್ಯಾಮೆರಾದಲ್ಲಿ ಎಲೆಗಳ ಬಣ್ಣದಲ್ಲಿ ಸ್ವಲ್ಪ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದೆ. ಇದು ನೀರಿನ ಪೋಷಕಾಂಶ ಅಥವಾ ಬೆಳಕಿನ ಕೊರತೆಯಿಂದಾಗಿರಬಹುದು.'
          : `ದೃಶ್ಯ ವಿಶ್ಲೇಷಣೆ: ಸ್ಕೋರ್ ${visualState.healthScore}/100 (${visualState.indicators.join(', ')}).`)
      : (mode === 'farmer'
          ? "The camera detected some slight color changes on the leaves that might indicate mild stress. Please check the nutrient mixture."
          : `Visual stress analysis: Score ${visualState.healthScore}/100. Detected flags: ${visualState.indicators.join(', ')}.`);
    return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
  }

  // 3. Overall Health & Condition Inquiries
  // Kannada: ಹೇಗಿದೆ, ಆರೋಗ್ಯ, ಸ್ಥಿತಿ, ಗಿಡ
  // English: how is, health, feeling, condition, status
  if (
    query.includes('ಹೇಗಿದೆ') ||
    query.includes('ಆರೋಗ್ಯ') ||
    query.includes('ಸ್ಥಿತಿ') ||
    query.includes('how') ||
    query.includes('health') ||
    query.includes('feeling') ||
    query.includes('status')
  ) {
    if (!hasPh && !hasTds && !hasVisual) {
      const spokenText = isKannada
        ? 'ಸೆನ್ಸರ್ ಮತ್ತು ಕ್ಯಾಮೆರಾ ಡೇಟಾ ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ ಗಿಡದ ಸ್ಥಿತಿಯನ್ನು ತಿಳಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ.'
        : "I don't have enough sensor or camera data right now to evaluate overall plant health.";
      return { spokenText, displayText: spokenText, language, mode, epistemicBadges: [] };
    }

    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = [
      'measured_fact',
      'visual_observation',
    ];

    const score = historical.overallHealthScore;

    if (score >= 80) {
      const spokenText = isKannada
        ? (mode === 'farmer'
            ? `ನಮಸ್ಕಾರ! ನಿಮ್ಮ ${plant.species} ಗಿಡ ಇಂದು ತುಂಬಾ ಆರೋಗ್ಯಕರವಾಗಿದೆ ಮತ್ತು ಚೆನ್ನಾಗಿ ಬೆಳೆಯುತ್ತಿದೆ.`
            : `ಒಟ್ಟಾರೆ ಆರೋಗ್ಯ ಸ್ಕೋರ್: ${score}/100. pH ${environment.ph?.toFixed(2) ?? '--'}, TDS ${Math.round(environment.tds ?? 0)} PPM. ಎಲ್ಲಾ ಮಾನದಂಡಗಳು ಸೂಕ್ತವಾಗಿವೆ.`)
        : (mode === 'farmer'
            ? `Hello! Your ${plant.species} plant looks healthy and is growing well today.`
            : `Overall condition score: ${score}/100. pH is ${environment.ph?.toFixed(2) ?? '--'}, TDS is ${Math.round(environment.tds ?? 0)} PPM.`);
      return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
    }

    if (score >= 60) {
      const spokenText = isKannada
        ? (mode === 'farmer'
            ? `ಗಿಡದಲ್ಲಿ ಸ್ವಲ್ಪ ಒತ್ತಡ ಕಂಡುಬರುತ್ತಿದೆ (ಆರೋಗ್ಯ ಸ್ಕೋರ್ ${score}/100). ನೀರಿನ ಪೋಷಕಾಂಶ ಅಥವಾ ಮಟ್ಟವನ್ನು ಒಮ್ಮೆ ಗಮನಿಸಿ.`
            : `ಸಾಧಾರಣ ಸ್ಥಿತಿ: ${score}/100. pH ${environment.ph?.toFixed(2) ?? '--'}, TDS ${Math.round(environment.tds ?? 0)} PPM.`)
        : (mode === 'farmer'
            ? `Your plant is experiencing mild stress today (health score ${score}/100). Please check the nutrient water.`
            : `Moderate health: ${score}/100. pH is ${environment.ph?.toFixed(2) ?? '--'}, TDS is ${Math.round(environment.tds ?? 0)} PPM.`);
      return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
    }

    badges.push('grower_advisory');
    const spokenText = isKannada
      ? (mode === 'farmer'
          ? `ಗಿಡಕ್ಕೆ ತಕ್ಷಣದ ಗಮನ ಬೇಕು (ಸ್ಕೋರ್ ${score}/100). ದಯವಿಟ್ಟು ತೊಟ್ಟಿಯ ನೀರು ಮತ್ತು ಪೋಷಕಾಂಶಗಳನ್ನು ತಕ್ಷಣ ಪರಿಶೀಲಿಸಿ.`
          : `ಎಚ್ಚರಿಕೆ: ಆರೋಗ್ಯ ಸ್ಕೋರ್ ${score}/100 ಕ್ಕೆ ಇಳಿದಿದೆ. ತಕ್ಷಣ ಕ್ರಮ ಕೈಗೊಳ್ಳಿ.`)
      : (mode === 'farmer'
          ? `Your plant needs urgent attention (health score ${score}/100). Please inspect the reservoir nutrients immediately.`
          : `Critical alert: Overall score down to ${score}/100. Immediate grower action recommended.`);
    return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
  }

  // 4. Comparison & Timeline Inquiries ("Compared to yesterday / last week")
  // Kannada: ನಿನ್ನೆ, ಕಳೆದ ವಾರ, ಮೊದಲಿಗಿಂತ, ಬದಲಾವಣೆ, ಸುಧಾರಣೆ
  // English: yesterday, last week, improved, better, changed, before
  if (
    query.includes('ನಿನ್ನೆ') ||
    query.includes('ಕಳೆದ ವಾರ') ||
    query.includes('ಮೊದಲಿಗಿಂತ') ||
    query.includes('ಬದಲಾವಣೆ') ||
    query.includes('yesterday') ||
    query.includes('last week') ||
    query.includes('improved') ||
    query.includes('better') ||
    query.includes('compare')
  ) {
    const badges: Array<'measured_fact' | 'visual_observation'> = ['measured_fact', 'visual_observation'];
    const growthDelta = historical.canopyGrowthDelta;
    const sign = growthDelta >= 0 ? `+${growthDelta}%` : `${growthDelta}%`;

    const spokenText = isKannada
      ? (mode === 'farmer'
          ? `ಹಿಂದಿನ ದಿನಗಳಿಗೆ ಹೋಲಿಸಿದರೆ ಗಿಡದ ಬೆಳವಣಿಗೆಯು ${sign} ವಿಸ್ತರಿಸಿದೆ ಮತ್ತು ಆರೋಗ್ಯವು ಸ್ಥಿರವಾಗಿದೆ.`
          : `ಹಿಂದಿನ ಅವಧಿಗೆ ಹೋಲಿಸಿದರೆ ಎಲೆಗಳ ವಿಸ್ತೀರ್ಣ ${sign} ಬದಲಾಗಿದೆ. ಪ್ರಸ್ತುತ ಟ್ರೆಂಡ್: ${historical.longitudinalTrend}.`)
      : (mode === 'farmer'
          ? `Compared to earlier observations, your plant's canopy has expanded by ${sign} and its health is steady.`
          : `Longitudinal comparison: 2D canopy delta ${sign}, longitudinal trend is ${historical.longitudinalTrend}.`);
    return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
  }

  // 5. Nutrients & Fertilizer Inquiries
  // Kannada: ಪೋಷಕಾಂಶ, ಗೊಬ್ಬರ, ಟಿಡಿಎಸ್, ಸಾಲ್ಟ್
  // English: nutrient, fertilizer, tds, ppm, feed
  if (
    query.includes('ಪೋಷಕಾಂಶ') ||
    query.includes('ಗೊಬ್ಬರ') ||
    query.includes('ಟಿಡಿಎಸ್') ||
    query.includes('nutrient') ||
    query.includes('fertilizer') ||
    query.includes('tds') ||
    query.includes('ppm')
  ) {
    if (!hasTds) {
      const spokenText = isKannada
        ? 'ESP32 ಸಂಪರ್ಕವಿಲ್ಲದ ಕಾರಣ ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ಓದಲು ಸಾಧ್ಯವಿಲ್ಲ.'
        : "I cannot measure the nutrient levels right now because the ESP32 TDS sensor is disconnected.";
      return { spokenText, displayText: spokenText, language, mode, epistemicBadges: [] };
    }

    const currentTds = Math.round(environment.tds ?? 0);
    const badges: Array<'measured_fact'> = ['measured_fact'];

    const spokenText = isKannada
      ? (mode === 'farmer'
          ? `ನೀರಿನಲ್ಲಿ ಪೋಷಕಾಂಶಗಳ ಪ್ರಮಾಣ (${currentTds} PPM) ${environment.tdsStatus === 'optimal' ? 'ಸೂಕ್ತವಾಗಿದೆ' : 'ಸ್ವಲ್ಪ ವ್ಯತ್ಯಾಸವಾಗಿದೆ'}.`
          : `ಪ್ರಸ್ತುತ TDS: ${currentTds} PPM. ನಿಗದಿತ ಮಿತಿ: ${environment.targetEnvelope.tdsMin}-${environment.targetEnvelope.tdsMax} PPM.`)
      : (mode === 'farmer'
          ? `The nutrient concentration in the water (${currentTds} PPM) looks ${environment.tdsStatus === 'optimal' ? 'good' : 'a bit off target'}.`
          : `Current TDS is ${currentTds} PPM (Target envelope: ${environment.targetEnvelope.tdsMin}-${environment.targetEnvelope.tdsMax} PPM).`);
    return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
  }

  // 6. Action Guidance / Recommendations ("What should I do?")
  // Kannada: ಏನು ಮಾಡಬೇಕು, ಸಲಹೆ, ಕ್ರಮ
  // English: what should i do, recommend, action, help
  if (
    query.includes('ಏನು ಮಾಡಬೇಕು') ||
    query.includes('ಸಲಹೆ') ||
    query.includes('ಕ್ರಮ') ||
    query.includes('what should') ||
    query.includes('action') ||
    query.includes('recommend') ||
    query.includes('advice')
  ) {
    const badges: Array<'grower_advisory'> = ['grower_advisory'];

    if (recommendations.items.length === 0) {
      const spokenText = isKannada
        ? 'ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ! ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಹೆಚ್ಚುವರಿ ಕೆಲಸದ ಅಗತ್ಯವಿಲ್ಲ. ಗಿಡವನ್ನು ಹೀಗೆಯೇ ಗಮನಿಸುತ್ತಿರಿ.'
        : "Everything is operating in balance! No immediate actions are needed. Keep monitoring the system.";
      return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
    }

    const topRec = recommendations.items[0];
    const spokenText = isKannada
      ? `ಮುಖ್ಯ ಸಲಹೆ: ${topRec.action}. (${topRec.title})`
      : `Top advice: ${topRec.action}. (${topRec.title})`;
    return { spokenText, displayText: spokenText, language, mode, epistemicBadges: badges };
  }

  // Fallback General Response
  const spokenText = isKannada
    ? `ನಾನು ನಿಮ್ಮ ${plant.species} ಗಿಡದ ಸಹಾಯಕ. ನೀರಿನ ಮಟ್ಟ, ಎಲೆಗಳ ಆರೋಗ್ಯ ಅಥವಾ ಪೋಷಕಾಂಶಗಳ ಬಗ್ಗೆ ನೀವು ನನ್ನನ್ನು ಕೇಳಬಹುದು.`
    : `I am your ${plant.species} assistant. You can ask me about water levels, leaf health, or nutrients!`;

  return {
    spokenText,
    displayText: spokenText,
    language,
    mode,
    epistemicBadges: ['measured_fact'],
  };
}
