// ============================================================
// HydroSmart — Multilingual Grounded Text Plant Assistant Engine
// Native Grounded Responses for English (en) and Kannada (kn)
// ============================================================

import { StructuredPlantContext } from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from './assistantConfig';

export interface GroundedTextResponse {
  text: string;
  language: SupportedLanguageCode;
  mode: AssistantMode;
  epistemicBadges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'>;
}

/**
 * Generate a grounded multilingual text response from plant context
 */
export async function generatePlantTextResponse(
  rawQuery: string,
  context: StructuredPlantContext,
  language: SupportedLanguageCode = 'en',
  mode: AssistantMode = 'farmer'
): Promise<GroundedTextResponse> {
  const query = rawQuery.trim().toLowerCase();
  const { plant, visualState, environment, historical, predictions, recommendations } = context;

  const hasPh = environment.ph !== undefined && !environment.isTelemetryStale;
  const hasTds = environment.tds !== undefined && !environment.isTelemetryStale;
  const hasWater = environment.waterLevel !== undefined && !environment.isTelemetryStale;
  const hasVisual = visualState.healthScore !== undefined && visualState.healthState !== 'unknown';

  const isKn = language === 'kn';

  // 1. Water Level & Thirst Inquiries
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
      const text = isKn
        ? 'ESP32 ಸೆನ್ಸರ್ ಸಂಪರ್ಕದಲ್ಲಿಲ್ಲದ ಕಾರಣ ನೀರಿನ ಮಟ್ಟವನ್ನು ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಾಧನವನ್ನು ಪರಿಶೀಲಿಸಿ.'
        : 'I cannot check the water level right now because the ESP32 telemetry is disconnected. Please verify the hardware link.';
      return { text, language, mode, epistemicBadges: [] };
    }

    const currentWl = Math.round(environment.waterLevel ?? 0);
    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = ['measured_fact'];

    if (currentWl < 25) {
      badges.push('grower_advisory');
      const text = isKn
        ? (mode === 'farmer'
            ? `ಹೌದು, ಗಿಡಕ್ಕೆ ನೀರಿನ ಅಗತ್ಯವಿದೆ. ತೊಟ್ಟಿಯಲ್ಲಿ ನೀರು ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ (${currentWl}%). ಪಂಪ್ ಹಾಳಾಗದಂತೆ ದಯವಿಟ್ಟು ನೀರನ್ನು ತುಂಬಿಸಿ.`
            : `ಎಚ್ಚರಿಕೆ: ನೀರಿನ ಮಟ್ಟವು ${currentWl}% ಗೆ ಇಳಿದಿದೆ (ಅಲ್ಟ್ರಾಸಾನಿಕ್ ಅಂತರ ${environment.distance?.toFixed(1) ?? '--'} cm). ತುರ್ತಾಗಿ ನೀರು ತುಂಬಿಸಿ.`)
        : (mode === 'farmer'
            ? `Yes, your plant needs water. The reservoir is low at ${currentWl}%. Please top up the tank with fresh water.`
            : `Water alert: Tank level is down to ${currentWl}% (${environment.distance?.toFixed(1) ?? '--'} cm). Immediate refill required.`);
      return { text, language, mode, epistemicBadges: badges };
    }

    if (currentWl < 50) {
      badges.push('mathematical_projection');
      const text = isKn
        ? (mode === 'farmer'
            ? `ಈಗ ಸದ್ಯಕ್ಕೆ ನೀರಿನ ಪ್ರಮಾಣ ಸಾಧಾರಣವಾಗಿದೆ (${currentWl}%). ಮುಂದಿನ ಎರಡು ಮೂರು ದಿನಗಳಲ್ಲಿ ನೀರು ತುಂಬಿಸಬೇಕಾಗಬಹುದು.`
            : `ನೀರಿನ ಮಟ್ಟವು ${currentWl}% ಇದೆ. ಪ್ರಸ್ತುತ ಬಳಕೆಯ ದರದಲ್ಲಿ ಸುಮಾರು ${predictions.waterDaysToThreshold ?? 3} ದಿನಗಳ ನಂತರ ಮರುಪೂರಣ ಅಗತ್ಯವಿದೆ.`)
        : (mode === 'farmer'
            ? `Water level is moderate right now at ${currentWl}%. You may need to add water in a few days.`
            : `Water level is at ${currentWl}%. Estimated depletion threshold in ~${predictions.waterDaysToThreshold ?? 3} days.`);
      return { text, language, mode, epistemicBadges: badges };
    }

    const text = isKn
      ? (mode === 'farmer'
          ? `ಇಲ್ಲ, ನೀರಿನ ಮಟ್ಟ ಉತ್ತಮವಾಗಿದೆ (${currentWl}%). ಗಿಡಕ್ಕೆ ಸಾಕಷ್ಟು ನೀರಿದೆ.`
          : `ನೀರಿನ ಮಟ್ಟವು ಅತ್ಯುತ್ತಮವಾಗಿದೆ (${currentWl}%, ಅಂತರ ${environment.distance?.toFixed(1) ?? '--'} cm).`)
      : (mode === 'farmer'
          ? `No, your plant has plenty of water (${currentWl}%). Everything looks good in the tank.`
          : `Water level is optimal at ${currentWl}% (sensor distance ${environment.distance?.toFixed(1) ?? '--'} cm).`);
    return { text, language, mode, epistemicBadges: badges };
  }

  // 2. Leaf Appearance, Yellowing, Discoloration Inquiries
  if (
    query.includes('ಎಲೆ') ||
    query.includes('ಹಳದಿ') ||
    query.includes('ಕಂದು') ||
    query.includes('ಬಾಡಿದೆ') ||
    query.includes('ಕಲೆ') ||
    query.includes('leaf') ||
    query.includes('leaves') ||
    query.includes('yellow') ||
    query.includes('brown') ||
    query.includes('spots') ||
    query.includes('wilt') ||
    query.includes('chlorosis') ||
    query.includes('necrosis')
  ) {
    if (!hasVisual) {
      const text = isKn
        ? 'ಕ್ಯಾಮೆರಾ ಸಕ್ರಿಯವಾಗಿಲ್ಲದ ಕಾರಣ ಎಲೆಗಳ ಸ್ಥಿತಿಯನ್ನು ನೋಡಲು ಸಾಧ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಲೈವ್ ಕ್ಯಾಮೆರಾವನ್ನು ಆನ್ ಮಾಡಿ.'
        : 'The plant camera is inactive, so I cannot visually inspect the foliage. Please enable the camera stream.';
      return { text, language, mode, epistemicBadges: [] };
    }

    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = ['visual_observation'];
    const visualScore = visualState.healthScore ?? 0;
    const yellowIndicator = visualState.indicators.find((ind) => ind.toLowerCase().includes('yellow') || ind.toLowerCase().includes('chlorosis'));
    const brownIndicator = visualState.indicators.find((ind) => ind.toLowerCase().includes('brown') || ind.toLowerCase().includes('necrotic'));

    if (yellowIndicator || brownIndicator || visualState.healthState === 'possible_anomaly' || visualState.healthState === 'significant_anomaly') {
      badges.push('grower_advisory');
      const text = isKn
        ? (mode === 'farmer'
            ? `ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆಯ ಪ್ರಕಾರ ಎಲೆಗಳಲ್ಲಿ ಸ್ವಲ್ಪ ಹಳದಿ ಅಥವಾ ಕಲೆಗಳು ಕಾಣಿಸುತ್ತಿವೆ (ದೃಶ್ಯ ಆರೋಗ್ಯ ಸ್ಕೋರ್: ${visualScore}/100). ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನವನ್ನು ಪರೀಕ್ಷಿಸಿ.`
            : `ದೃಶ್ಯ ವಿಶ್ಲೇಷಣೆ: ಎಲೆಗಳಲ್ಲಿ ದೃಶ್ಯ ಅಸಹಜತೆ ಕಂಡುಬಂದಿದೆ (${visualState.indicators.join(', ') || 'ಬದಲಾವಣೆ'}). ಆಪ್ಟಿಕಲ್ ಸ್ಕೋರ್: ${visualScore}/100.`)
        : (mode === 'farmer'
            ? `Camera diagnostics detect some yellowing or spots on the leaves (visual health score: ${visualScore}/100). Check nutrient balance and pH.`
            : `Visual diagnostic: Optical stress detected (${visualState.indicators.join(', ') || 'Anomalous reflectance'}). Visual score is ${visualScore}/100.`);
      return { text, language, mode, epistemicBadges: badges };
    }

    const text = isKn
      ? (mode === 'farmer'
          ? `ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆಯ ಪ್ರಕಾರ ನಿಮ್ಮ ಗಿಡದ ಎಲೆಗಳು ಹಸಿರಾಗಿ ಮತ್ತು ಆರೋಗ್ಯಕರವಾಗಿವೆ (ಸ್ಕೋರ್: ${visualScore}/100). ಯಾವುದೇ ಹಳದಿ ಕಲೆಗಳಿಲ್ಲ.`
          : `ಎಲೆಗಳ ವರ್ಣದ್ರವ್ಯ ವಿಶ್ಲೇಷಣೆ ಅತ್ಯುತ್ತಮವಾಗಿದೆ (${visualScore}/100). ಹಸಿರು ವರ್ಣದ್ರವ್ಯ (ExG) ಸಾಂದ್ರತೆ ಸ್ಥಿರವಾಗಿದೆ.`)
      : (mode === 'farmer'
          ? `Your plant leaves look vibrant and green through the camera lens (visual score: ${visualScore}/100). No significant discoloration.`
          : `Canopy optical analysis is nominal (${visualScore}/100). Healthy chlorophyll ExG indices across foliage area.`);
    return { text, language, mode, epistemicBadges: badges };
  }

  // 3. Nutrients, EC, TDS, Fertilizer Inquiries
  if (
    query.includes('ಗೊಬ್ಬರ') ||
    query.includes('ರಸಗೊಬ್ಬರ') ||
    query.includes('ಪೋಷಕಾಂಶ') ||
    query.includes('ಟಿಡಿಎಸ್') ||
    query.includes('nutrient') ||
    query.includes('tds') ||
    query.includes('ec') ||
    query.includes('feed') ||
    query.includes('ppm') ||
    query.includes('fertilizer') ||
    query.includes('dosing')
  ) {
    if (!hasTds) {
      const text = isKn
        ? 'TDS ಸೆನ್ಸರ್‌ನಿಂದ ಡೇಟಾ ಸಿಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ESP32 ಹಾರ್ಡ್‌ವೇರ್ ಕನೆಕ್ಷನ್ ಪರಿಶೀಲಿಸಿ.'
        : 'TDS nutrient probe telemetry is unavailable. Please verify the ESP32 connection.';
      return { text, language, mode, epistemicBadges: [] };
    }

    const currentTds = Math.round(environment.tds ?? 0);
    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = ['measured_fact'];

    if (currentTds < 600) {
      badges.push('grower_advisory');
      const text = isKn
        ? (mode === 'farmer'
            ? `ನೀರಿನಲ್ಲಿ ರಸಗೊಬ್ಬರದ ಅಂಶ ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ (${currentTds} PPM). ಗಿಡದ ಉತ್ತಮ ಬೆಳವಣಿಗೆಗಾಗಿ ಹೈಡ್ರೋಪೋನಿಕ್ ನ್ಯೂಟ್ರಿಯೆಂಟ್ಸ್ ಸೇರಿಸಿ.`
            : `TDS ಮಟ್ಟವು ${currentTds} PPM ಗೆ ಕುಸಿದಿದೆ (ಶಿಫಾರಸು ಕನಿಷ್ಠ: 800 PPM). ವಿದ್ಯುತ್ ವಾಹಕತೆ ಕಡಿಮೆಯಾಗಿದೆ. ನ್ಯೂಟ್ರಿಯೆಂಟ್ ದ್ರಾವಣ ಸೇರಿಸಿ.`)
        : (mode === 'farmer'
            ? `Nutrient levels are quite low in the reservoir (${currentTds} PPM). Please add hydroponic nutrient solution.`
            : `TDS telemetry is low at ${currentTds} PPM (target minimum: 800 PPM). Mineral concentration depleted.`);
      return { text, language, mode, epistemicBadges: badges };
    }

    if (currentTds > 1400) {
      badges.push('grower_advisory');
      const text = isKn
        ? (mode === 'farmer'
            ? `ರಸಗೊಬ್ಬರದ ಪ್ರಮಾಣ ತುಂಬಾ ಹೆಚ್ಚಾಗಿದೆ (${currentTds} PPM). ಬೇರುಗಳು ಸುಡದಂತೆ ಸ್ವಲ್ಪ ಶುದ್ಧ ನೀರು ಸೇರಿಸಿ ತಿಳಿಗೊಳಿಸಿ.`
            : `ಎಚ್ಚರಿಕೆ: TDS ಸಾಂದ್ರತೆ ${currentTds} PPM ತಲುಪಿದೆ (ಶಿಫಾರಸು ಗರಿಷ್ಠ: 1200 PPM). ಬೇರುಗಳಿಗೆ ಹಾನಿಯಾಗದಂತೆ ತಾಜಾ ನೀರು ಸೇರಿಸಿ.`)
        : (mode === 'farmer'
            ? `Nutrient concentration is too strong (${currentTds} PPM). Please dilute with fresh clean water to avoid root burn.`
            : `TDS alert: High mineral salt concentration at ${currentTds} PPM (target maximum: 1200 PPM). Dilution recommended.`);
      return { text, language, mode, epistemicBadges: badges };
    }

    const text = isKn
      ? (mode === 'farmer'
          ? `ರಸಗೊಬ್ಬರದ ಪ್ರಮಾಣ ಸರಿಯಾದ ಮಟ್ಟದಲ್ಲಿದೆ (${currentTds} PPM). ಗಿಡಕ್ಕೆ ಸಮತೋಲಿತ ಪೋಷಕಾಂಶ ಸಿಗುತ್ತಿದೆ.`
          : `TDS ಪೋಷಕಾಂಶ ಸಾಂದ್ರತೆಯು ಅತ್ಯುತ್ತಮ ವ್ಯಾಪ್ತಿಯಲ್ಲಿದೆ (${currentTds} PPM). ವಿದ್ಯುತ್ ವಾಹಕತೆ ಸ್ಥಿರವಾಗಿದೆ.`)
      : (mode === 'farmer'
          ? `Nutrient concentration is in the ideal range (${currentTds} PPM). Your plant is well fed.`
          : `TDS telemetry is optimal at ${currentTds} PPM within target envelope.`);
    return { text, language, mode, epistemicBadges: badges };
  }

  // 4. pH & Solution Acidity Inquiries
  if (
    query.includes('ಪಿಎಚ್') ||
    query.includes('ಆಮ್ಲ') ||
    query.includes('ಕ್ಷಾರ') ||
    query.includes('ph') ||
    query.includes('acid') ||
    query.includes('alkaline') ||
    query.includes('acidity')
  ) {
    if (!hasPh) {
      const text = isKn
        ? 'pH ಸೆನ್ಸರ್ ರೀಡಿಂಗ್ ಸಿಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ESP32 ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.'
        : 'pH electrode probe reading is currently unavailable. Please check the hardware connection.';
      return { text, language, mode, epistemicBadges: [] };
    }

    const phVal = environment.ph ?? 7.0;
    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = ['measured_fact'];

    if (phVal < 5.5) {
      badges.push('grower_advisory');
      const text = isKn
        ? (mode === 'farmer'
            ? `ನೀರು ಹೆಚ್ಚು ಆಮ್ಲೀಯವಾಗಿದೆ (pH ${phVal.toFixed(2)}). ಇದನ್ನು ಸಮತೋಲನಗೊಳಿಸಲು ಸ್ವಲ್ಪ pH Up ದ್ರಾವಣ ಅಥವಾ ಶುದ್ಧ ನೀರು ಸೇರಿಸಿ.`
            : `pH ಎಚ್ಚರಿಕೆ: ನೀರಿನ ಆಮ್ಲೀಯತೆ ${phVal.toFixed(2)} ಗೆ ಇಳಿದಿದೆ (ಗುರಿ: 5.5 - 6.5). pH Up ಬಫರ್ ಸೇರಿಸಿ.`)
        : (mode === 'farmer'
            ? `The water is too acidic (pH ${phVal.toFixed(2)}). Add a little pH Up solution or fresh water to balance it.`
            : `pH alert: Acidity index is ${phVal.toFixed(2)} (target band: 5.5 - 6.5). pH Up buffering required.`);
      return { text, language, mode, epistemicBadges: badges };
    }

    if (phVal > 6.8) {
      badges.push('grower_advisory');
      const text = isKn
        ? (mode === 'farmer'
            ? `ನೀರಿನ pH ಮಟ್ಟ ಹೆಚ್ಚಾಗಿದೆ (${phVal.toFixed(2)}). ಗಿಡವು ಪೋಷಕಾಂಶಗಳನ್ನು ಹೀರಿಕೊಳ್ಳಲು pH Down ಸೇರಿಸಿ 6.0 ಕ್ಕೆ ತನ್ನಿ.`
            : `pH ಎಚ್ಚರಿಕೆ: ಕ್ಷಾರೀಯತೆ ${phVal.toFixed(2)} ಗೆ ಏರಿದೆ (ಗುರಿ: 5.5 - 6.5). ಪೋಷಕಾಂಶಗಳ ಹೀರಿಕೆಗೆ pH Down ಬಫರ್ ಅಗತ್ಯವಿದೆ.`)
        : (mode === 'farmer'
            ? `The water pH is too high (${phVal.toFixed(2)}). Add a few drops of pH Down to bring it closer to 6.0 for nutrient uptake.`
            : `pH alert: Alkaline drift detected at ${phVal.toFixed(2)} (target band: 5.5 - 6.5). Dose pH Down to restore absorption.`);
      return { text, language, mode, epistemicBadges: badges };
    }

    const text = isKn
      ? (mode === 'farmer'
          ? `ನೀರಿನ pH ಮಟ್ಟ ಸಂಪೂರ್ಣ ಸಮತೋಲನದಲ್ಲಿದೆ (${phVal.toFixed(2)}). ಗಿಡವು ಸುಲಭವಾಗಿ ಪೋಷಕಾಂಶಗಳನ್ನು ಹೀರಿಕೊಳ್ಳುತ್ತದೆ.`
          : `pH ಮಟ್ಟವು ಅತ್ಯುತ್ತಮ ಸ್ಥಿತಿಯಲ್ಲಿದೆ (${phVal.toFixed(2)}). ಪೋಷಕಾಂಶ ಲಭ್ಯತೆಯ ಕಿಟಕಿ ಸಮತೋಲಿತವಾಗಿದೆ.`)
      : (mode === 'farmer'
          ? `The water pH is nicely balanced at ${phVal.toFixed(2)}. Your plant can easily absorb all nutrients.`
          : `pH level is optimal at ${phVal.toFixed(2)} within the 5.5 - 6.5 nutrient bioavailability window.`);
    return { text, language, mode, epistemicBadges: badges };
  }

  // 5. Overall Health, Feeling & Status Inquiries
  if (
    query.includes('ಹೇಗಿದ್ದೀರಿ') ||
    query.includes('ಆರೋಗ್ಯ') ||
    query.includes('ಸ್ಥಿತಿ') ||
    query.includes('ಹೇಗಿದೆ') ||
    query.includes('feeling') ||
    query.includes('how are you') ||
    query.includes('health') ||
    query.includes('status') ||
    query.includes('condition') ||
    query.includes('wellbeing')
  ) {
    const healthScore = visualState.healthScore ?? 88;
    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = [
      'measured_fact',
      'visual_observation',
    ];

    const isHealthy = healthScore >= 75 && (!hasWater || (environment.waterLevel ?? 0) >= 30);

    if (isHealthy) {
      const text = isKn
        ? (mode === 'farmer'
            ? `ನಾನು ತುಂಬಾ ಚೆನ್ನಾಗಿದ್ದೇನೆ! ನನ್ನ ಆರೋಗ್ಯ ಸ್ಕೋರ್ ${healthScore}/100 ಇದೆ. ನೀರು (${Math.round(environment.waterLevel ?? 80)}%) ಮತ್ತು ಪೋಷಕಾಂಶಗಳು ಸಮತೋಲನದಲ್ಲಿವೆ.`
            : `ಒಟ್ಟಾರೆ ವ್ಯವಸ್ಥೆಯ ಸ್ಥಿತಿ ಅತ್ಯುತ್ತಮವಾಗಿದೆ. ಆಪ್ಟಿಕಲ್ ಸ್ಕೋರ್: ${healthScore}/100, pH: ${environment.ph?.toFixed(2) ?? '6.10'}, TDS: ${Math.round(environment.tds ?? 950)} PPM.`)
        : (mode === 'farmer'
            ? `I am doing great! My overall health score is ${healthScore}/100. Water level (${Math.round(environment.waterLevel ?? 80)}%) and nutrients are balanced.`
            : `System state is optimal. Health index: ${healthScore}/100, pH: ${environment.ph?.toFixed(2) ?? '6.10'}, TDS: ${Math.round(environment.tds ?? 950)} PPM, Water: ${Math.round(environment.waterLevel ?? 80)}%.`);
      return { text, language, mode, epistemicBadges: badges };
    }

    badges.push('grower_advisory');
    const firstRec = recommendations.items[0]?.action || recommendations.items[0]?.title;
    const text = isKn
      ? (mode === 'farmer'
          ? `ಸ್ವಲ್ಪ ಗಮನ ಬೇಕಾಗಿದೆ. ಆರೋಗ್ಯ ಸ್ಕೋರ್ ${healthScore}/100 ಇದೆ. ${firstRec ?? 'ದಯವಿಟ್ಟು ನೀರಿನ ಮಟ್ಟ ಮತ್ತು ರಸಗೊಬ್ಬರ ಪರಿಶೀಲಿಸಿ.'}`
          : `ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಗಮನಿಸಬೇಕಾದ ಅಂಶಗಳಿವೆ (ಸ್ಕೋರ್: ${healthScore}/100). ಸಕ್ರಿಯ ಶಿಫಾರಸು: ${firstRec ?? 'ಪರಿಶೀಲಿಸಿ.'}`)
      : (mode === 'farmer'
          ? `I need a little attention today (health score: ${healthScore}/100). ${firstRec ?? 'Please inspect water level and nutrients.'}`
          : `Telemetry alert: Health index is ${healthScore}/100. Primary advisory: ${firstRec ?? 'System adjustment required.'}`);
    return { text, language, mode, epistemicBadges: badges };
  }

  // 6. Growth & Progress Inquiries
  if (
    query.includes('ಬೆಳವಣಿಗೆ') ||
    query.includes('ಎತ್ತರ') ||
    query.includes('ದೊಡ್ಡದು') ||
    query.includes('growth') ||
    query.includes('grow') ||
    query.includes('height') ||
    query.includes('canopy') ||
    query.includes('progress') ||
    query.includes('bigger')
  ) {
    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = [
      'visual_observation',
      'mathematical_projection',
    ];
    const growthTrend = historical.longitudinalTrend || 'stable';
    const text = isKn
      ? (mode === 'farmer'
          ? `ಕ್ಯಾಮೆರಾ ವೀಕ್ಷಣೆಯ ಪ್ರಕಾರ ನನ್ನ ಎಲೆಗಳ ಹರಡುವಿಕೆ ಸ್ಥಿರವಾಗಿ ಬೆಳೆಯುತ್ತಿದೆ (${historical.canopyGrowthDelta >= 0 ? '+' : ''}${historical.canopyGrowthDelta}% ಬದಲಾವಣೆ).`
          : `ಕಾಲಾನುಕ್ರಮ ದೃಶ್ಯ ಬೆಳವಣಿಗೆ: ಮೇಲಾವರಣದ ವಿಸ್ತೀರ್ಣವು ${growthTrend === 'improving' ? 'ಧನಾತ್ಮಕ' : 'ಸ್ಥಿರ'} ಪ್ರವೃತ್ತಿಯಲ್ಲಿದೆ (${historical.canopyGrowthDelta}% ಡೆಲ್ಟಾ).`)
      : (mode === 'farmer'
          ? `Based on camera observations, canopy growth is steady (${historical.canopyGrowthDelta >= 0 ? '+' : ''}${historical.canopyGrowthDelta}% change).`
          : `Time-series canopy growth trajectory is ${growthTrend} with ${historical.canopyGrowthDelta}% optical canopy area delta.`);
    return { text, language, mode, epistemicBadges: badges };
  }

  // 7. General Recommendations & Action Checklist
  if (
    query.includes('ಮಾಡಬೇಕು') ||
    query.includes('ಸಲಹೆ') ||
    query.includes('ಏನು') ||
    query.includes('recommend') ||
    query.includes('advice') ||
    query.includes('should i do') ||
    query.includes('action') ||
    query.includes('task') ||
    query.includes('fix')
  ) {
    const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = ['grower_advisory'];
    const primaryRec = recommendations.items[0]?.action || recommendations.items[0]?.title || (isKn ? 'ಎಲ್ಲಾ ಸೆನ್ಸರ್‌ಗಳು ಸಾಮಾನ್ಯವಾಗಿವೆ. ನಿಯಮಿತ ಮೇಲ್ವಿಚಾರಣೆ ಮುಂದುವರಿಸಿ.' : 'All sensors are in nominal range. Continue regular monitoring.');

    const text = isKn
      ? (mode === 'farmer'
          ? `ಇಂದಿನ ಮುಖ್ಯ ಸಲಹೆ: ${primaryRec}`
          : `ಸ್ಮಾರ್ಟ್ ಹೈಡ್ರೋಪೋನಿಕ್ಸ್ ಸಲಹೆ: ${primaryRec} (ಸಸ್ಯ ಪ್ರಭೇದ: ${plant.species}).`)
      : (mode === 'farmer'
          ? `Today's recommendation: ${primaryRec}`
          : `HydroSmart telemetry advisory: ${primaryRec} (Crop profile: ${plant.species}).`);
    return { text, language, mode, epistemicBadges: badges };
  }

  // 8. General / Contextual Fallback
  const badges: Array<'measured_fact' | 'visual_observation' | 'mathematical_projection' | 'grower_advisory'> = ['measured_fact'];
  const text = isKn
    ? (mode === 'farmer'
        ? `ನಾನು ನಿಮ್ಮ ${plant.species} ಗಿಡ. ನನ್ನ ನೀರಿನ ಮಟ್ಟ ${Math.round(environment.waterLevel ?? 80)}%, pH ${environment.ph?.toFixed(1) ?? '6.1'}, ಮತ್ತು ಆರೋಗ್ಯ ${visualState.healthScore ?? 90}/100 ಇದೆ. ನೀರು, ಗೊಬ್ಬರ ಅಥವಾ ಎಲೆಗಳ ಬಗ್ಗೆ ನೀವು ಕೇಳಬಹುದು.`
        : `ಹೈಡ್ರೋಪೋನಿಕ್ ಸ್ಥಿತಿ ಸಾರಾಂಶ: ಸಸ್ಯ: ${plant.species}, pH: ${environment.ph?.toFixed(2) ?? '6.10'}, TDS: ${Math.round(environment.tds ?? 950)} PPM, ನೀರು: ${Math.round(environment.waterLevel ?? 80)}%, ದೃಶ್ಯ ಸ್ಕೋರ್: ${visualState.healthScore ?? 90}/100.`)
    : (mode === 'farmer'
        ? `I am your monitored ${plant.species}. My reservoir is at ${Math.round(environment.waterLevel ?? 80)}%, pH is ${environment.ph?.toFixed(1) ?? '6.1'}, and visual health is ${visualState.healthScore ?? 90}/100. Feel free to ask about water, nutrients, or leaf condition!`
        : `HydroSmart telemetry snapshot: Crop: ${plant.species}, pH: ${environment.ph?.toFixed(2) ?? '6.10'}, TDS: ${Math.round(environment.tds ?? 950)} PPM, Water: ${Math.round(environment.waterLevel ?? 80)}%, Visual Health: ${visualState.healthScore ?? 90}/100.`);

  return { text, language, mode, epistemicBadges: badges };
}
