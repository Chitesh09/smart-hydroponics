// ============================================================
// HydroSmart — Visual Plant Health & Stress Analysis Engine
// Reproducible 4-Factor Optical Stress Assessment (No Fake ML)
// ============================================================

export type VisualHealthState =
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
  healthState: VisualHealthState;
  breakdown: VisualScoreBreakdown;
  indicators: VisualStressIndicator[];
  vibrantGreenPercent: number;
  chlorosisYellowPercent: number;
  necroticBrownPercent: number;
  canopyCoveragePercent: number;
  inferenceTimeMs: number;
  timestamp: number;
  statusText: string;
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

/**
 * Perform optical stress and visual health analysis on an image source
 */
export function analyzeVisualPlantHealth(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): VisualHealthAnalysisResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const timestamp = Date.now();

  // Validate video readiness
  if (source instanceof HTMLVideoElement) {
    if (source.readyState < 2 || source.videoWidth === 0 || source.videoHeight === 0) {
      return createUnknownResult(timestamp, 'Video stream unavailable or initializing');
    }
  }

  // Setup offscreen canvas buffer
  if (typeof document !== 'undefined') {
    if (!offscreenHealthCanvas) {
      offscreenHealthCanvas = document.createElement('canvas');
      offscreenHealthCanvas.width = ANALYSIS_WIDTH;
      offscreenHealthCanvas.height = ANALYSIS_HEIGHT;
      offscreenHealthCtx = offscreenHealthCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  if (!offscreenHealthCtx || !offscreenHealthCanvas) {
    return createUnknownResult(timestamp, 'Canvas context unavailable');
  }

  offscreenHealthCtx.drawImage(source, 0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
  const imgData = offscreenHealthCtx.getImageData(0, 0, ANALYSIS_WIDTH, ANALYSIS_HEIGHT);
  const data = imgData.data;
  const totalPixels = ANALYSIS_WIDTH * ANALYSIS_HEIGHT;

  let totalFoliagePixels = 0;
  let vibrantGreenPixels = 0;
  let chlorosisYellowPixels = 0;
  let necroticBrownPixels = 0;

  let minX = ANALYSIS_WIDTH;
  let minY = ANALYSIS_HEIGHT;
  let maxX = 0;
  let maxY = 0;

  let localGradientVarianceSum = 0;

  // 1. Pixel-level chromatic and spectral evaluation
  for (let y = 1; y < ANALYSIS_HEIGHT - 1; y++) {
    for (let x = 1; x < ANALYSIS_WIDTH - 1; x++) {
      const idx = (y * ANALYSIS_WIDTH + x) * 4;
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

      // Check if pixel belongs to plant canopy
      const isCanopy = (h >= 35 && h <= 170 && s >= 0.10 && v >= 0.10) || (exg > 0.03 && exgr > 0);

      if (isCanopy) {
        totalFoliagePixels++;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Categorize chromatic condition
        if (h >= 75 && h <= 160 && exg >= 0.08) {
          // Vibrant healthy green
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

        // Texture gradient for spotting & mottling detection
        const leftG = data[(y * ANALYSIS_WIDTH + (x - 1)) * 4 + 1];
        const rightG = data[(y * ANALYSIS_WIDTH + (x + 1)) * 4 + 1];
        const topG = data[((y - 1) * ANALYSIS_WIDTH + x) * 4 + 1];
        const botG = data[((y + 1) * ANALYSIS_WIDTH + x) * 4 + 1];

        const grad = Math.abs(rightG - leftG) + Math.abs(botG - topG);
        localGradientVarianceSum += grad;
      }
    }
  }

  const canopyCoveragePercent = parseFloat(((totalFoliagePixels / totalPixels) * 100).toFixed(1));

  // If no plant detected, return unknown state
  if (canopyCoveragePercent < 2.5) {
    return createUnknownResult(timestamp, 'No plant detected in camera frame for visual health analysis');
  }

  // Ratios relative to total canopy
  const vibrantGreenPercent = parseFloat(((vibrantGreenPixels / totalFoliagePixels) * 100).toFixed(1));
  const chlorosisYellowPercent = parseFloat(((chlorosisYellowPixels / totalFoliagePixels) * 100).toFixed(1));
  const necroticBrownPercent = parseFloat(((necroticBrownPixels / totalFoliagePixels) * 100).toFixed(1));

  // Canopy geometry
  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const aspectRatio = parseFloat((boxW / boxH).toFixed(2));
  const boundingArea = boxW * boxH;
  const canopyDensity = boundingArea > 0 ? totalFoliagePixels / boundingArea : 0;

  // Surface texture / spotting index
  const avgTextureGradient = totalFoliagePixels > 0 ? localGradientVarianceSum / totalFoliagePixels : 0;

  // ==========================================================
  // REPRODUCIBLE 4-FACTOR HEALTH SCORE CALCULATION
  // ==========================================================

  // Factor 1: Color Condition Score (0 - 100) — Weight: 35%
  // 100 points baseline, deducted heavily for yellowing & necrosis
  let colorScore = 100;
  colorScore -= chlorosisYellowPercent * 1.5; // -15 pts per 10% yellowing
  colorScore -= necroticBrownPercent * 3.0;   // -30 pts per 10% necrosis
  colorScore = Math.min(100, Math.max(0, Math.round(colorScore)));

  // Factor 2: Surface Texture & Spotting Score (0 - 100) — Weight: 25%
  // High abrupt localized gradient spikes indicate mottled spots / lesions
  let textureScore = 100;
  if (avgTextureGradient > 25) {
    textureScore -= (avgTextureGradient - 25) * 1.8;
  }
  textureScore = Math.min(100, Math.max(0, Math.round(textureScore)));

  // Factor 3: Canopy Vigor & Stature (0 - 100) — Weight: 20%
  // Evaluates upright stature and fullness vs flattened/drooping wilting posture
  let vigorScore = 100;
  if (aspectRatio < 0.6 || aspectRatio > 2.0) {
    vigorScore -= 20; // Abnormal collapse or lateral stretch
  }
  if (canopyDensity < 0.35) {
    vigorScore -= (0.35 - canopyDensity) * 100; // Sparse foliage
  }
  vigorScore = Math.min(100, Math.max(0, Math.round(vigorScore)));

  // Factor 4: Detected Anomaly Deductions (0 - 100) — Weight: 20%
  let penaltyScore = 100;
  if (chlorosisYellowPercent > 12) penaltyScore -= 25;
  if (necroticBrownPercent > 5) penaltyScore -= 35;
  if (avgTextureGradient > 38) penaltyScore -= 20;
  penaltyScore = Math.min(100, Math.max(0, Math.round(penaltyScore)));

  // Composite Weighted Visual Health Score (0 - 100)
  const visualHealthScore = Math.round(
    colorScore * 0.35 +
    textureScore * 0.25 +
    vigorScore * 0.20 +
    penaltyScore * 0.20
  );

  // Determine Health State
  let healthState: VisualHealthState = 'healthy';
  if (visualHealthScore >= 85) {
    healthState = 'healthy';
  } else if (visualHealthScore >= 70) {
    healthState = 'mild_stress';
  } else if (visualHealthScore >= 50) {
    healthState = 'possible_anomaly';
  } else {
    healthState = 'significant_anomaly';
  }

  // Compile Detected Visual Indicators
  const indicators: VisualStressIndicator[] = [];

  // Color Indicator
  if (chlorosisYellowPercent > 12) {
    indicators.push({
      id: 'ind_chlorosis',
      type: 'color',
      label: 'Foliage Chlorosis (Yellowing)',
      severity: chlorosisYellowPercent > 25 ? 'critical' : 'warning',
      details: `${chlorosisYellowPercent}% of detected canopy exhibits pale yellow chlorotic coloration.`,
    });
  } else {
    indicators.push({
      id: 'ind_color_healthy',
      type: 'color',
      label: 'Optimal Chlorophyll Pigmentation',
      severity: 'nominal',
      details: `${vibrantGreenPercent}% vibrant green foliage with healthy chlorophyll reflectance.`,
    });
  }

  // Necrosis / Browning Indicator
  if (necroticBrownPercent > 4) {
    indicators.push({
      id: 'ind_necrosis',
      type: 'color',
      label: 'Necrotic Browning / Tip Burn',
      severity: necroticBrownPercent > 10 ? 'critical' : 'warning',
      details: `${necroticBrownPercent}% leaf surface indicates dried necrotic tissue or nutrient burn.`,
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

  // Surface Texture / Spotting Indicator
  if (avgTextureGradient > 32) {
    indicators.push({
      id: 'ind_texture_mottling',
      type: 'texture',
      label: 'Surface Mottling / Discoloration Spots',
      severity: 'warning',
      details: 'Localized variance spikes detected on leaf surface. Inspect for pest stippling or spotting.',
    });
  } else {
    indicators.push({
      id: 'ind_texture_nominal',
      type: 'texture',
      label: 'Uniform Leaf Surface Texture',
      severity: 'nominal',
      details: 'Smooth, consistent coloration across the leaf lamina.',
    });
  }

  // Canopy Stature / Wilting Indicator
  if (aspectRatio < 0.6 || canopyDensity < 0.35) {
    indicators.push({
      id: 'ind_vigor_wilting',
      type: 'structure',
      label: 'Potential Wilting / Drooping Posture',
      severity: 'warning',
      details: 'Canopy compactness indicates possible loss of leaf turgor pressure or drooping posture.',
    });
  } else {
    indicators.push({
      id: 'ind_vigor_nominal',
      type: 'structure',
      label: 'Upright Canopy Vigor & Turgidity',
      severity: 'nominal',
      details: 'Well-spread foliage structure indicating healthy hydraulic root uptake.',
    });
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const inferenceTimeMs = Math.round((endTime - startTime) * 10) / 10;

  const statusText = healthState === 'healthy'
    ? 'Foliage appears vigorous with no visible stress indicators'
    : healthState === 'mild_stress'
      ? 'Mild optical stress detected on leaf margins'
      : healthState === 'possible_anomaly'
        ? 'Visible discoloration or chlorosis anomaly present'
        : 'Significant foliage degradation or necrosis observed';

  return {
    visualHealthScore,
    healthState,
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
    inferenceTimeMs,
    timestamp,
    statusText,
  };
}

function createUnknownResult(timestamp: number, statusText: string): VisualHealthAnalysisResult {
  return {
    visualHealthScore: 0,
    healthState: 'unknown',
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
    inferenceTimeMs: 0,
    timestamp,
    statusText,
  };
}
