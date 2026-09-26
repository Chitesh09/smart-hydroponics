// ============================================================
// HydroSmart — Visual Plant Health & Optical Anomaly Engine
// Deterministic Computer Vision + Species Calibration + ML Leaf Health
// ============================================================

import { VISUAL_HEALTH_CONFIG } from './visualHealthConfig';
import { assessImageQuality } from './imageQualityAnalyzer';
import { detectPlantPresence } from './plantDetector';
import {
  evaluatePlantHealthWithBaseline,
  VisualObservationFeatures,
  VisualChangeDeltas,
} from '@/lib/intelligence/visualBaselineEngine';
import { LeafHealthMLResult } from './mlLeafHealthClassifier';

export type StructuredHealthState =
  | 'HEALTHY'
  | 'STABLE'
  | 'ATTENTION'
  | 'CRITICAL'
  | 'RECOVERING'
  | 'UNKNOWN';

export type VisualHealthState =
  | StructuredHealthState
  | 'healthy'
  | 'mild_stress'
  | 'possible_anomaly'
  | 'significant_anomaly'
  | 'unknown';

export interface VisualScoreBreakdown {
  colorConditionScore: number;      // 0 - 100 (Weight: 35%)
  surfaceUniformityScore: number;   // 0 - 100 (Weight: 25%)
  canopyVigorScore: number;         // 0 - 100 (Weight: 20%)
  anomalyPenaltyScore: number;      // 0 - 100 (Weight: 20%)
}

export interface VisualStressIndicator {
  id: string;
  type: 'color' | 'texture' | 'structure' | 'anomaly';
  label: string;
  severity: 'nominal' | 'warning' | 'critical';
  details: string;
}

export interface VisualHealthAnalysisResult {
  visualHealthScore: number; // 0 - 100
  healthState: StructuredHealthState;
  legacyHealthState?: 'healthy' | 'mild_stress' | 'possible_anomaly' | 'significant_anomaly' | 'unknown';
  qualitativeConfidence: 'high' | 'moderate' | 'low' | 'unknown';
  breakdown: VisualScoreBreakdown;
  indicators: VisualStressIndicator[];
  vibrantGreenPercent: number;
  chlorosisYellowPercent: number;
  necroticBrownPercent: number;
  canopyCoveragePercent: number;
  avgTextureGradient: number;
  aspectRatio: number;
  canopyDensity: number;
  inferenceTimeMs: number;
  timestamp: number;
  statusText: string;
  baselineDeltas?: VisualChangeDeltas | null;
  mlResult?: LeafHealthMLResult | null;
  nonPlantRejectionReason?: string;
}

let offscreenHealthCanvas: HTMLCanvasElement | null = null;
let offscreenHealthCtx: CanvasRenderingContext2D | null = null;

const ANALYSIS_WIDTH = 320;
const ANALYSIS_HEIGHT = 240;

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  const delta = max - min;

  let h = 0;
  if (delta > 0) {
    if (max === rNorm) {
      h = 60 * (((gNorm - bNorm) / delta) % 6);
    } else if (max === gNorm) {
      h = 60 * ((bNorm - rNorm) / delta + 2);
    } else {
      h = 60 * ((rNorm - gNorm) / delta + 4);
    }
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return [h, s, v];
}

export interface VisualAnalysisOptions {
  plantId?: string;
  speciesKey?: string;
  skipPresenceGate?: boolean;
}

/**
 * Perform optical stress and visual health analysis on an image source
 */
export function analyzeVisualPlantHealth(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageData,
  options: VisualAnalysisOptions = {}
): VisualHealthAnalysisResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const timestamp = Date.now();
  const plantId = options.plantId || 'plant_primary';

  // 1. Setup offscreen canvas buffer if needed
  let imgData: ImageData | null = null;

  if (typeof ImageData !== 'undefined' && source instanceof ImageData) {
    imgData = source;
  } else if (source && typeof source === 'object' && 'data' in source && 'width' in source && 'height' in source) {
    imgData = source as ImageData;
  } else if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    if (source.readyState < 2 || source.videoWidth === 0 || source.videoHeight === 0) {
      return createUnknownResult(timestamp, 'Video stream unavailable or initializing', 'low');
    }
    if (typeof document !== 'undefined') {
      if (!offscreenHealthCanvas) {
        offscreenHealthCanvas = document.createElement('canvas');
        offscreenHealthCanvas.width = ANALYSIS_WIDTH;
        offscreenHealthCanvas.height = ANALYSIS_HEIGHT;
        offscreenHealthCtx = offscreenHealthCanvas.getContext('2d', { willReadFrequently: true });
      }
      if (offscreenHealthCtx) {
        offscreenHealthCtx.drawImage(source, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
        imgData = offscreenHealthCtx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
      }
    }
  } else if (typeof document !== 'undefined' && (
    (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) ||
    (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement)
  )) {
    if (!offscreenHealthCanvas) {
      offscreenHealthCanvas = document.createElement('canvas');
      offscreenHealthCanvas.width = ANALYSIS_WIDTH;
      offscreenHealthCanvas.height = ANALYSIS_HEIGHT;
      offscreenHealthCtx = offscreenHealthCanvas.getContext('2d', { willReadFrequently: true });
    }
    if (offscreenHealthCtx) {
      offscreenHealthCtx.drawImage(source as CanvasImageSource, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
      imgData = offscreenHealthCtx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
    }
  }

  if (!imgData) {
    return createUnknownResult(timestamp, 'Unable to extract pixel frame from image source', 'low');
  }

  // 2. Plant Presence Gate
  if (!options.skipPresenceGate) {
    const presence = detectPlantPresence(imgData);
    if (presence.state === 'NO_PLANT_DETECTED') {
      return createUnknownResult(
        timestamp,
        presence.userMessage || 'No plant detected in camera frame for visual health analysis',
        'unknown',
        presence.nonPlantRejectionReason
      );
    }
    if (presence.state === 'SCAN_NOT_READY') {
      return createUnknownResult(
        timestamp,
        presence.userMessage || "Camera view isn't ready yet.",
        'unknown',
        presence.statusText
      );
    }
    if (presence.state === 'LOW_CONFIDENCE') {
      return createUnknownResult(
        timestamp,
        'Plant appears small or distant. Move camera closer for health assessment.',
        'low',
        'Low confidence plant detection'
      );
    }
  }

  // 3. Optical Quality Gate (Assess Illumination & Lens Blur)
  const quality = assessImageQuality(imgData.data, imgData.width, imgData.height);
  const cfg = VISUAL_HEALTH_CONFIG;

  if (quality.isUnderexposed) {
    return createUnknownResult(
      timestamp,
      'Image is too dark for health analysis. Increase ambient lighting.',
      'unknown',
      'Underexposure (Luma < 30)'
    );
  }
  if (quality.isOverexposed) {
    return createUnknownResult(
      timestamp,
      'Image is overexposed. Reduce glare or direct lamp reflection.',
      'unknown',
      'Overexposure (Luma > 225)'
    );
  }
  if (quality.isBlurry && quality.sharpnessScore < cfg.minSharpnessScore) {
    return createUnknownResult(
      timestamp,
      'Camera view is blurry. Focus or clean the camera lens.',
      'unknown',
      'Lens Blur (Sharpness < 10.0)'
    );
  }

  // 4. Deterministic Foliar Pixel-Level Feature Extraction
  const data = imgData.data;
  const width = imgData.width;
  const height = imgData.height;
  const totalPixels = width * height;

  let totalFoliagePixels = 0;
  let vibrantGreenPixels = 0;
  let chlorosisYellowPixels = 0;
  let necroticBrownPixels = 0;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  let localGradientVarianceSum = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const sum = r + g + b;
      if (sum < 30) continue; // Skip dark shadows

      const rNorm = r / sum;
      const gNorm = g / sum;
      const bNorm = b / sum;

      const exg = 2 * gNorm - rNorm - bNorm;
      const exgr = 3 * gNorm - 2.4 * rNorm - bNorm;
      const [h, s, v] = rgbToHsv(r, g, b);

      // Check if pixel belongs to plant canopy (including green chlorophyll, chlorotic pale/yellow, and necrotic brown)
      const isCanopy =
        (h >= 20 && h <= 170 && s >= 0.10 && v >= 0.10) ||
        (exg > 0.03 && exgr > 0) ||
        (r > g && g > b && h >= 18 && h <= 45 && s >= 0.15 && v >= 0.15);

      if (isCanopy) {
        totalFoliagePixels++;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Categorize chromatic condition
        if (h >= 75 && h <= 160 && exg >= 0.08) {
          // Vibrant healthy green (rich chlorophyll reflectance)
          vibrantGreenPixels++;
        } else if ((h >= 40 && h < 75) || (exg < 0.04 && g > r)) {
          // Chlorotic yellowing / pale foliage
          chlorosisYellowPixels++;
        } else if ((h >= 20 && h < 45) || (r > g && sum < 200)) {
          // Necrotic browning / tip burn
          necroticBrownPixels++;
        } else {
          vibrantGreenPixels++;
        }

        // Texture gradient for spotting & mottling detection (Sobel-like difference)
        const leftG = data[(y * width + (x - 1)) * 4 + 1];
        const rightG = data[(y * width + (x + 1)) * 4 + 1];
        const topG = data[((y - 1) * width + x) * 4 + 1];
        const botG = data[((y + 1) * width + x) * 4 + 1];

        const grad = Math.abs(rightG - leftG) + Math.abs(botG - topG);
        localGradientVarianceSum += grad;
      }
    }
  }

  const canopyCoveragePercent = parseFloat(((totalFoliagePixels / totalPixels) * 100).toFixed(1));

  if (canopyCoveragePercent < cfg.minCanopyCoveragePercent) {
    return createUnknownResult(
      timestamp,
      'Plant canopy too small or distant for confident visual health assessment',
      'low'
    );
  }

  const vibrantGreenPercent = parseFloat(((vibrantGreenPixels / totalFoliagePixels) * 100).toFixed(1));
  const chlorosisYellowPercent = parseFloat(((chlorosisYellowPixels / totalFoliagePixels) * 100).toFixed(1));
  const necroticBrownPercent = parseFloat(((necroticBrownPixels / totalFoliagePixels) * 100).toFixed(1));

  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const aspectRatio = parseFloat((boxW / boxH).toFixed(2));
  const boundingArea = boxW * boxH;
  const canopyDensity = boundingArea > 0 ? parseFloat((totalFoliagePixels / boundingArea).toFixed(2)) : 0;
  const avgTextureGradient = totalFoliagePixels > 0 ? parseFloat((localGradientVarianceSum / totalFoliagePixels).toFixed(1)) : 0;

  // 5. Four-Factor Quantitative Scoring
  let colorScore = 100;
  colorScore -= chlorosisYellowPercent * 1.5;
  colorScore -= necroticBrownPercent * 3.0;
  colorScore = Math.min(100, Math.max(0, Math.round(colorScore)));

  let textureScore = 100;
  if (avgTextureGradient > cfg.textureNominalMax) {
    textureScore -= (avgTextureGradient - cfg.textureNominalMax) * 1.8;
  }
  textureScore = Math.min(100, Math.max(0, Math.round(textureScore)));

  let vigorScore = 100;
  if (aspectRatio < cfg.wiltingAspectRatioMin || aspectRatio > cfg.wiltingAspectRatioMax) {
    vigorScore -= 20;
  }
  if (canopyDensity < cfg.canopyDensityMin) {
    vigorScore -= (cfg.canopyDensityMin - canopyDensity) * 100;
  }
  vigorScore = Math.min(100, Math.max(0, Math.round(vigorScore)));

  let penaltyScore = 100;
  if (chlorosisYellowPercent > cfg.chlorosisWarningThreshold) penaltyScore -= 25;
  if (necroticBrownPercent > cfg.necrosisWarningThreshold) penaltyScore -= 35;
  if (avgTextureGradient > cfg.textureWarningThreshold) penaltyScore -= 20;
  penaltyScore = Math.min(100, Math.max(0, Math.round(penaltyScore)));

  const visualHealthScore = Math.round(
    colorScore * 0.35 +
    textureScore * 0.25 +
    vigorScore * 0.20 +
    penaltyScore * 0.20
  );

  // 6. Instantaneous Raw State Determination
  let rawCVState: StructuredHealthState = 'STABLE';
  if (necroticBrownPercent >= cfg.necrosisCriticalThreshold || chlorosisYellowPercent >= cfg.chlorosisCriticalThreshold) {
    rawCVState = 'CRITICAL';
  } else if (chlorosisYellowPercent >= cfg.chlorosisWarningThreshold || necroticBrownPercent >= cfg.necrosisWarningThreshold) {
    rawCVState = 'ATTENTION';
  } else if (chlorosisYellowPercent <= cfg.chlorosisNominalMax && necroticBrownPercent <= cfg.necrosisNominalMax) {
    rawCVState = 'HEALTHY';
  } else {
    rawCVState = 'STABLE';
  }

  // 7. Baseline Comparison & Multi-Frame Temporal Smoothing
  const observationFeatures: VisualObservationFeatures = {
    canopyCoveragePercent,
    chlorosisYellowPercent,
    necroticBrownPercent,
    vibrantGreenPercent,
    avgTextureGradient,
    aspectRatio,
    canopyDensity,
    timestamp,
    speciesKey: options.speciesKey,
  };

  const baselineEval = evaluatePlantHealthWithBaseline(
    plantId,
    observationFeatures,
    rawCVState
  );

  const finalHealthState = baselineEval.healthState;

  // 8. Compile Stress Indicators
  const indicators: VisualStressIndicator[] = [];

  // Color Indicator
  if (chlorosisYellowPercent > cfg.chlorosisWarningThreshold) {
    indicators.push({
      id: 'ind_chlorosis',
      type: 'color',
      label: 'Foliage Yellowing (Chlorosis)',
      severity: chlorosisYellowPercent > cfg.chlorosisCriticalThreshold ? 'critical' : 'warning',
      details: `${chlorosisYellowPercent}% of detected canopy exhibits pale yellow coloration.`,
    });
  } else {
    indicators.push({
      id: 'ind_color_healthy',
      type: 'color',
      label: 'Healthy Green Pigmentation',
      severity: 'nominal',
      details: `${vibrantGreenPercent}% vibrant green foliage with healthy chlorophyll reflectance.`,
    });
  }

  // Necrosis / Browning Indicator
  if (necroticBrownPercent > cfg.necrosisWarningThreshold) {
    indicators.push({
      id: 'ind_necrosis',
      type: 'color',
      label: 'Necrotic Browning / Tip Burn',
      severity: necroticBrownPercent > cfg.necrosisCriticalThreshold ? 'critical' : 'warning',
      details: `${necroticBrownPercent}% leaf surface indicates dried necrotic tissue or tip burn.`,
    });
  } else {
    indicators.push({
      id: 'ind_necrosis_nominal',
      type: 'color',
      label: 'No Significant Necrotic Browning',
      severity: 'nominal',
      details: 'Leaf tips and margins appear free from dry necrotic lesions.',
    });
  }

  // Texture Mottling Indicator
  if (avgTextureGradient > cfg.textureWarningThreshold) {
    indicators.push({
      id: 'ind_texture_mottling',
      type: 'texture',
      label: 'Surface Mottling / Discoloration Spots',
      severity: 'warning',
      details: 'Localized variance spikes detected on leaf surface. Inspect for pest stippling or spotting.',
    });
  }

  // Canopy Posture / Wilting Indicator
  if (aspectRatio < cfg.wiltingAspectRatioMin || canopyDensity < cfg.canopyDensityMin) {
    indicators.push({
      id: 'ind_vigor_wilting',
      type: 'structure',
      label: 'Potential Wilting / Drooping Posture',
      severity: 'warning',
      details: 'Canopy compactness indicates possible loss of leaf turgor pressure or drooping posture.',
    });
  }

  // Qualitative confidence
  const qualitativeConfidence: 'high' | 'moderate' | 'low' | 'unknown' =
    quality.overallQuality >= 75 && canopyCoveragePercent >= 5.0
      ? 'high'
      : quality.overallQuality >= 50
        ? 'moderate'
        : 'low';

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const inferenceTimeMs = Math.round((endTime - startTime) * 10) / 10;

  // Map to legacy visual health state for backwards compatibility
  const legacyHealthState: 'healthy' | 'mild_stress' | 'possible_anomaly' | 'significant_anomaly' | 'unknown' =
    finalHealthState === 'HEALTHY'
      ? 'healthy'
      : finalHealthState === 'STABLE' || finalHealthState === 'RECOVERING'
        ? 'mild_stress'
        : finalHealthState === 'ATTENTION'
          ? 'possible_anomaly'
          : finalHealthState === 'CRITICAL'
            ? 'significant_anomaly'
            : 'unknown';

  return {
    visualHealthScore,
    healthState: finalHealthState,
    legacyHealthState,
    qualitativeConfidence,
    breakdown: {
      colorConditionScore: colorScore,
      surfaceUniformityScore: textureScore,
      canopyVigorScore: vigorScore,
      anomalyPenaltyScore: penaltyScore,
    },
    indicators,
    vibrantGreenPercent,
    chlorosisYellowPercent,
    necroticBrownPercent,
    canopyCoveragePercent,
    avgTextureGradient,
    aspectRatio,
    canopyDensity,
    inferenceTimeMs,
    timestamp,
    statusText: baselineEval.statusReason,
    baselineDeltas: baselineEval.deltas,
  };
}

function createUnknownResult(
  timestamp: number,
  statusText: string,
  confidence: 'high' | 'moderate' | 'low' | 'unknown' = 'unknown',
  rejectionReason?: string
): VisualHealthAnalysisResult {
  return {
    visualHealthScore: 0,
    healthState: 'UNKNOWN',
    legacyHealthState: 'unknown',
    qualitativeConfidence: confidence,
    breakdown: {
      colorConditionScore: 0,
      surfaceUniformityScore: 0,
      canopyVigorScore: 0,
      anomalyPenaltyScore: 0,
    },
    indicators: [
      {
        id: 'ind_unknown',
        type: 'anomaly',
        label: 'Visual Analysis Unavailable',
        severity: 'nominal',
        details: statusText,
      },
    ],
    vibrantGreenPercent: 0,
    chlorosisYellowPercent: 0,
    necroticBrownPercent: 0,
    canopyCoveragePercent: 0,
    avgTextureGradient: 0,
    aspectRatio: 1.0,
    canopyDensity: 0,
    inferenceTimeMs: 0,
    timestamp,
    statusText,
    nonPlantRejectionReason: rejectionReason,
  };
}
