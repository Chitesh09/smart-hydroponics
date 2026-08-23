// ============================================================
// HydroSmart — Unified Vision Intelligence Engine & Abstraction
// Production Fallback-Aware Computer Vision Architecture
// ============================================================

import {
  VisualObservation,
  VisionDetectionStatus
} from './types';
import { assessImageQuality } from './imageQualityAnalyzer';
import { identifyPlantSpecies, BotanicalFeatures } from './plantIdentifier';
import { evaluateVisualHealth, FoliagePigmentMetrics } from './visualHealthEngine';
import { getActiveVisionModel } from './modelRegistry';

let processingCanvas: HTMLCanvasElement | null = null;
let processingCtx: CanvasRenderingContext2D | null = null;

const FRAME_WIDTH = 320;
const FRAME_HEIGHT = 240;

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

export class VisionEngine {
  /**
   * Process a single video frame / canvas / image through the production vision pipeline
   */
  public static async analyzeFrame(
    source: CanvasImageSource | string
  ): Promise<VisualObservation> {
    const startTime = performance.now();
    const timestamp = Date.now();
    const activeModel = getActiveVisionModel();

    if (typeof document === 'undefined') {
      return this.createEmptyObservation(timestamp, 'NO_CAMERA', 'Server-side rendering environment.');
    }

    // Prepare offscreen canvas
    if (!processingCanvas) {
      processingCanvas = document.createElement('canvas');
      processingCanvas.width = FRAME_WIDTH;
      processingCanvas.height = FRAME_HEIGHT;
      processingCtx = processingCanvas.getContext('2d', { willReadFrequently: true });
    }

    if (!processingCtx) {
      return this.createEmptyObservation(timestamp, 'INSUFFICIENT_VISIBILITY', 'Canvas 2D context unavailable.');
    }

    // Draw frame onto canvas
    try {
      if (typeof source === 'string') {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise((res, rej) => {
          img.onload = () => res(img);
          img.onerror = rej;
          img.src = source;
        });
        processingCtx.drawImage(img, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      } else {
        processingCtx.drawImage(source, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      }
    } catch {
      return this.createEmptyObservation(timestamp, 'NO_CAMERA', 'Failed to render camera stream.');
    }

    const frameData = processingCtx.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
    const pixels = frameData.data;

    // Step 1: Evaluate Optical Frame Quality & Lighting Cast
    const imageQuality = assessImageQuality(pixels, FRAME_WIDTH, FRAME_HEIGHT);

    if (!imageQuality.acceptable) {
      const detectionStatus: VisionDetectionStatus = imageQuality.isUnderexposed
        ? 'LOW_LIGHT'
        : imageQuality.isOverexposed
        ? 'OVEREXPOSED'
        : imageQuality.isBlurry
        ? 'BLURRY'
        : 'INSUFFICIENT_VISIBILITY';

      const processingTimeMs = Math.round(performance.now() - startTime);

      return {
        timestamp,
        detectionStatus,
        plantDetected: false,
        plantSpecies: null,
        speciesConfidence: 0,
        identificationStatus: 'NO_PLANT',
        visualHealthScore: null,
        healthState: 'INSUFFICIENT_DATA',
        anomalies: [],
        canopyCoveragePercent: 0,
        vegetationIndex: 0,
        imageQuality,
        confidence: 'insufficient',
        confidenceScore: 0,
        processingTimeMs,
        method: activeModel.type === 'heuristic' ? 'heuristic' : 'ml_model',
        limitations: [imageQuality.qualityMessage],
        explainableFindings: [imageQuality.qualityMessage],
      };
    }

    // Step 2: Foliage Pixel Extraction & Chromatic Analysis
    let totalFoliage = 0;
    let vibrantGreen = 0;
    let chlorosisYellow = 0;
    let necroticBrown = 0;
    let sumExG = 0;
    let sumHue = 0;
    let minX = FRAME_WIDTH;
    let maxX = 0;
    let minY = FRAME_HEIGHT;
    let maxY = 0;

    for (let y = 0; y < FRAME_HEIGHT; y++) {
      for (let x = 0; x < FRAME_WIDTH; x++) {
        const i = (y * FRAME_WIDTH + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];

        // Excess Green calculation: ExG = 2G - R - B
        const exg = 2 * g - r - b;
        const [h, s, v] = rgbToHsv(r, g, b);

        // Foliage criteria
        const isFoliage = (exg > 15 && g > r && g > b) || (h >= 32 && h <= 165 && s > 0.18 && v > 0.15);

        if (isFoliage) {
          totalFoliage++;
          sumExG += exg / 255;
          sumHue += h;

          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;

          // Categorize pigment
          if (h >= 35 && h <= 65 && s > 0.25) {
            chlorosisYellow++;
          } else if (v < 0.28 && s > 0.15 && r > g * 0.9) {
            necroticBrown++;
          } else if (h >= 75 && h <= 155 && s > 0.22) {
            vibrantGreen++;
          }
        }
      }
    }

    const totalPixels = FRAME_WIDTH * FRAME_HEIGHT;
    const canopyCoveragePercent = parseFloat(((totalFoliage / totalPixels) * 100).toFixed(1));
    const isPlantDetected = canopyCoveragePercent >= 2.5;

    const meanExG = totalFoliage > 0 ? sumExG / totalFoliage : 0;
    const meanHue = totalFoliage > 0 ? sumHue / totalFoliage : 0;
    const bboxWidth = maxX >= minX ? maxX - minX + 1 : 0;
    const bboxHeight = maxY >= minY ? maxY - minY + 1 : 0;
    const aspectRatio = bboxHeight > 0 ? parseFloat((bboxWidth / bboxHeight).toFixed(2)) : 1.0;

    // Edge Complexity Estimation
    const edgeComplexity = totalFoliage > 0
      ? parseFloat((((bboxWidth * bboxHeight) / Math.max(1, totalFoliage)) * 0.12).toFixed(2))
      : 0.15;

    // Step 3: Botanical Species Identification (with Unknown Plant rejection)
    const botanicalFeatures: BotanicalFeatures = {
      canopyCoverage: canopyCoveragePercent,
      aspectRatio,
      meanHue,
      meanExG,
      edgeComplexity,
      canopyRoundness: parseFloat((totalFoliage / Math.max(1, bboxWidth * bboxHeight)).toFixed(2)),
    };

    const speciesResult = identifyPlantSpecies(botanicalFeatures, imageQuality.acceptable);

    // Step 4: Visual Health & Stress Assessment
    const pigmentMetrics: FoliagePigmentMetrics = {
      totalFoliagePixels: totalFoliage,
      vibrantGreenPixels: vibrantGreen,
      chlorosisYellowPixels: chlorosisYellow,
      necroticBrownPixels: necroticBrown,
      canopyCoveragePercent,
      edgeComplexity,
    };

    const healthResult = evaluateVisualHealth(pigmentMetrics, imageQuality, isPlantDetected);

    const processingTimeMs = Math.round(performance.now() - startTime);

    return {
      timestamp,
      detectionStatus: isPlantDetected ? 'PLANT_DETECTED' : 'NO_PLANT',
      plantDetected: isPlantDetected,
      plantSpecies: speciesResult.primarySpecies,
      speciesConfidence: speciesResult.confidenceScore,
      identificationStatus: speciesResult.status,
      visualHealthScore: healthResult.score,
      healthState: healthResult.state,
      anomalies: healthResult.anomalies,
      canopyCoveragePercent,
      vegetationIndex: parseFloat(meanExG.toFixed(3)),
      imageQuality,
      confidence: healthResult.confidence,
      confidenceScore: healthResult.confidenceScore,
      processingTimeMs,
      method: activeModel.type === 'heuristic' ? 'heuristic' : 'ml_model',
      limitations: healthResult.limitations,
      explainableFindings: [
        speciesResult.guidanceMessage,
        ...healthResult.explainableFindings,
      ],
    };
  }

  private static createEmptyObservation(
    timestamp: number,
    status: VisionDetectionStatus,
    reason: string
  ): VisualObservation {
    return {
      timestamp,
      detectionStatus: status,
      plantDetected: false,
      plantSpecies: null,
      speciesConfidence: 0,
      identificationStatus: 'NO_PLANT',
      visualHealthScore: null,
      healthState: 'INSUFFICIENT_DATA',
      anomalies: [],
      canopyCoveragePercent: 0,
      vegetationIndex: 0,
      imageQuality: {
        brightnessScore: 0,
        contrastScore: 0,
        sharpnessScore: 0,
        foliageVisibilityScore: 0,
        overallQuality: 0,
        acceptable: false,
        isBlurry: false,
        isUnderexposed: false,
        isOverexposed: false,
        lightingColorCast: 'neutral',
        qualityMessage: reason,
      },
      confidence: 'insufficient',
      confidenceScore: 0,
      processingTimeMs: 1,
      method: 'heuristic',
      limitations: [reason],
      explainableFindings: [reason],
    };
  }
}
