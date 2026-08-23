// ============================================================
// HydroSmart — Vision & Multimodal Validation Test Suite
// Validates 15 Edge Scenarios & Boundary Conditions
// ============================================================

import { assessImageQuality } from './imageQualityAnalyzer';
import { identifyPlantSpecies, BotanicalFeatures } from './plantIdentifier';
import { evaluateVisualHealth, FoliagePigmentMetrics } from './visualHealthEngine';
import { analyzeTemporalVisionSequence } from './temporalVisionSmoother';
import { VisualObservation } from './types';
import { validateAndSanitizePacket } from '@/lib/device/telemetryValidator';

export interface TestResult {
  scenario: string;
  passed: boolean;
  notes: string;
}

export function runAllVisionTests(): TestResult[] {
  const results: TestResult[] = [];

  // Helper to make mock pixel buffer
  const createMockBuffer = (
    width: number,
    height: number,
    generator: (x: number, y: number) => [number, number, number, number]
  ): Uint8ClampedArray => {
    const buf = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const [r, g, b, a] = generator(x, y);
        buf[i] = r;
        buf[i + 1] = g;
        buf[i + 2] = b;
        buf[i + 3] = a;
      }
    }
    return buf;
  };

  // Test 1: No Plant in Frame
  const emptyFeatures: BotanicalFeatures = {
    canopyCoverage: 0.5,
    aspectRatio: 1.0,
    meanHue: 0,
    meanExG: 0,
    edgeComplexity: 0,
    canopyRoundness: 0,
  };
  const res1 = identifyPlantSpecies(emptyFeatures, true);
  results.push({
    scenario: '1. No Plant Detected',
    passed: res1.status === 'NO_PLANT',
    notes: `Result: ${res1.status} (${res1.guidanceMessage})`,
  });

  // Test 2: Healthy Plant (Butterhead Lettuce profile)
  const healthyFeatures: BotanicalFeatures = {
    canopyCoverage: 28.5,
    aspectRatio: 1.15,
    meanHue: 110,
    meanExG: 0.38,
    edgeComplexity: 0.16,
    canopyRoundness: 0.78,
  };
  const res2 = identifyPlantSpecies(healthyFeatures, true);
  results.push({
    scenario: '2. Healthy Plant (Known Species)',
    passed: res2.status === 'KNOWN_PLANT' && res2.primarySpecies === 'Butterhead Lettuce',
    notes: `Identified: ${res2.primarySpecies} (Confidence: ${(res2.confidenceScore * 100).toFixed(0)}%)`,
  });

  // Test 3: Green Object (Artificial non-plant with square edges & uniform hue)
  const greenBoxFeatures: BotanicalFeatures = {
    canopyCoverage: 40.0,
    aspectRatio: 2.8,
    meanHue: 175,
    meanExG: 0.05,
    edgeComplexity: 0.02,
    canopyRoundness: 0.95,
  };
  const res3 = identifyPlantSpecies(greenBoxFeatures, true);
  results.push({
    scenario: '3. Green Non-Plant Object',
    passed: res3.status === 'UNKNOWN_PLANT' || res3.status === 'LOW_CONFIDENCE',
    notes: `Status: ${res3.status} (Rejected forced classification)`,
  });

  // Test 4: Dark Environment (<35 mean luminance)
  const darkBuffer = createMockBuffer(100, 100, () => [15, 18, 12, 255]);
  const res4 = assessImageQuality(darkBuffer, 100, 100);
  results.push({
    scenario: '4. Dark Environment',
    passed: !res4.acceptable && res4.isUnderexposed,
    notes: `isUnderexposed: ${res4.isUnderexposed}, acceptable: ${res4.acceptable}`,
  });

  // Test 5: Bright Environment (>225 mean luminance)
  const brightBuffer = createMockBuffer(100, 100, () => [240, 245, 238, 255]);
  const res5 = assessImageQuality(brightBuffer, 100, 100);
  results.push({
    scenario: '5. Bright / Overexposed Environment',
    passed: !res5.acceptable && res5.isOverexposed,
    notes: `isOverexposed: ${res5.isOverexposed}, acceptable: ${res5.acceptable}`,
  });

  // Test 6: Warm Lighting Cast (Red/Yellow imbalance)
  const warmBuffer = createMockBuffer(100, 100, () => [210, 190, 80, 255]);
  const res6 = assessImageQuality(warmBuffer, 100, 100);
  results.push({
    scenario: '6. Warm Lighting Cast',
    passed: res6.lightingColorCast === 'warm_yellow',
    notes: `Color Cast: ${res6.lightingColorCast}`,
  });

  // Test 7: Blurry Frame
  const flatBuffer = createMockBuffer(100, 100, () => [120, 120, 120, 255]);
  const res7 = assessImageQuality(flatBuffer, 100, 100);
  results.push({
    scenario: '7. Blurry / Low Sharpness Frame',
    passed: res7.isBlurry,
    notes: `isBlurry: ${res7.isBlurry}, Sharpness: ${res7.sharpnessScore}`,
  });

  // Test 8: Unknown Plant (Features outside registered profiles)
  const exoticFeatures: BotanicalFeatures = {
    canopyCoverage: 15.0,
    aspectRatio: 3.5,
    meanHue: 45,
    meanExG: 0.1,
    edgeComplexity: 0.8,
    canopyRoundness: 0.2,
  };
  const res8 = identifyPlantSpecies(exoticFeatures, true);
  results.push({
    scenario: '8. Unknown Botanical Species',
    passed: res8.status === 'UNKNOWN_PLANT' && res8.primarySpecies === null,
    notes: `Classification: ${res8.status} (Species: ${res8.primarySpecies ?? 'None'})`,
  });

  // Test 9: Low-Confidence Identification
  const borderlineFeatures: BotanicalFeatures = {
    canopyCoverage: 8.0,
    aspectRatio: 1.85,
    meanHue: 72,
    meanExG: 0.16,
    edgeComplexity: 0.48,
    canopyRoundness: 0.45,
  };
  const res9 = identifyPlantSpecies(borderlineFeatures, true);
  results.push({
    scenario: '9. Low-Confidence Classification',
    passed: res9.status === 'LOW_CONFIDENCE' || res9.status === 'UNKNOWN_PLANT',
    notes: `Status: ${res9.status} (Score: ${(res9.confidenceScore * 100).toFixed(0)}%)`,
  });

  // Test 10: Plant Growth Over Time
  const now = Date.now();
  const mockObs: VisualObservation[] = [
    {
      timestamp: now - 86400000 * 7,
      detectionStatus: 'PLANT_DETECTED',
      plantDetected: true,
      plantSpecies: 'Butterhead Lettuce',
      speciesConfidence: 0.9,
      identificationStatus: 'KNOWN_PLANT',
      visualHealthScore: 86,
      healthState: 'HEALTHY',
      anomalies: [],
      canopyCoveragePercent: 12.0,
      vegetationIndex: 0.3,
      imageQuality: {
        brightnessScore: 80,
        contrastScore: 80,
        sharpnessScore: 80,
        foliageVisibilityScore: 70,
        overallQuality: 80,
        acceptable: true,
        isBlurry: false,
        isUnderexposed: false,
        isOverexposed: false,
        lightingColorCast: 'neutral',
        qualityMessage: 'OK',
      },
      confidence: 'high',
      confidenceScore: 0.9,
      processingTimeMs: 12,
      method: 'heuristic',
      limitations: [],
      explainableFindings: [],
    },
    {
      timestamp: now,
      detectionStatus: 'PLANT_DETECTED',
      plantDetected: true,
      plantSpecies: 'Butterhead Lettuce',
      speciesConfidence: 0.92,
      identificationStatus: 'KNOWN_PLANT',
      visualHealthScore: 92,
      healthState: 'HEALTHY',
      anomalies: [],
      canopyCoveragePercent: 24.5,
      vegetationIndex: 0.38,
      imageQuality: {
        brightnessScore: 85,
        contrastScore: 85,
        sharpnessScore: 85,
        foliageVisibilityScore: 85,
        overallQuality: 85,
        acceptable: true,
        isBlurry: false,
        isUnderexposed: false,
        isOverexposed: false,
        lightingColorCast: 'neutral',
        qualityMessage: 'OK',
      },
      confidence: 'high',
      confidenceScore: 0.92,
      processingTimeMs: 11,
      method: 'heuristic',
      limitations: [],
      explainableFindings: [],
    },
  ];
  const res10 = analyzeTemporalVisionSequence(mockObs);
  results.push({
    scenario: '10. Observed Canopy Growth',
    passed: res10.changePercent === 12.5 && res10.temporalHealthTrend === 'improving',
    notes: `Canopy Delta: +${res10.changePercent}%, Trend: ${res10.temporalHealthTrend}`,
  });

  // Test 11: Camera Displacement / Movement Detection
  const shiftedObs: VisualObservation[] = [
    mockObs[0],
    {
      ...mockObs[1],
      canopyCoveragePercent: 48.0, // Jump > 20% suddenly
    },
  ];
  const res11 = analyzeTemporalVisionSequence(shiftedObs);
  results.push({
    scenario: '11. Camera Displacement / FOV Shift',
    passed: res11.cameraConsistency === 'displaced',
    notes: `Camera Consistency: ${res11.cameraConsistency} (Confidence downgraded to ${res11.confidence})`,
  });

  // Test 12: Visual Health Withheld on Low Light
  const badPigment: FoliagePigmentMetrics = {
    totalFoliagePixels: 1000,
    vibrantGreenPixels: 900,
    chlorosisYellowPixels: 80,
    necroticBrownPixels: 20,
    canopyCoveragePercent: 15,
    edgeComplexity: 0.18,
  };
  const res12 = evaluateVisualHealth(badPigment, res4, true);
  results.push({
    scenario: '12. Health Withheld on Inadequate Light',
    passed: res12.score === null && res12.state === 'INSUFFICIENT_DATA',
    notes: `Score: ${res12.score ?? 'null'}, State: ${res12.state}`,
  });

  // Test 13: Chlorosis Anomaly Detection & Explainability
  const chlorosisPigment: FoliagePigmentMetrics = {
    totalFoliagePixels: 1000,
    vibrantGreenPixels: 650,
    chlorosisYellowPixels: 280, // 28% yellowing
    necroticBrownPixels: 70,
    canopyCoveragePercent: 20,
    edgeComplexity: 0.19,
  };
  const res13 = evaluateVisualHealth(chlorosisPigment, {
    brightnessScore: 80,
    contrastScore: 80,
    sharpnessScore: 80,
    foliageVisibilityScore: 80,
    overallQuality: 80,
    acceptable: true,
    isBlurry: false,
    isUnderexposed: false,
    isOverexposed: false,
    lightingColorCast: 'neutral',
    qualityMessage: 'OK',
  }, true);
  results.push({
    scenario: '13. Possible Chlorosis Anomaly Detected',
    passed: res13.anomalies.some((a) => a.type === 'possible_chlorosis') && res13.state === 'MODERATE_STRESS',
    notes: `Health State: ${res13.state}, Anomalies: ${res13.anomalies.map((a) => a.type).join(', ')}`,
  });

  // Test 14: Valid ESP32 + Valid Camera Contract Check
  const validTelemetry = validateAndSanitizePacket('{"ph": 6.15, "tds": 940, "waterLevel": 85, "distance": 20.0}');
  results.push({
    scenario: '14. Valid ESP32 + Valid Camera Data Contract',
    passed: validTelemetry.isValid && res2.status === 'KNOWN_PLANT',
    notes: `Telemetry Valid: ${validTelemetry.isValid}, Vision Valid: ${res2.status}`,
  });

  // Test 15: Invalid Sensor Value Rejection
  const invalidTelemetry = validateAndSanitizePacket('{"ph": 18.5, "tds": -400}');
  results.push({
    scenario: '15. Invalid Impossible Sensor Value Rejection',
    passed: !invalidTelemetry.isValid,
    notes: `Invalid packet rejected: ${invalidTelemetry.errorMessage}`,
  });

  return results;
}
