// ============================================================
// HydroSmart — Unified Vision Intelligence Engine & Abstraction
// Production Fallback-Aware Computer Vision Architecture
// ============================================================

import {
  VisualObservation,
  VisionDetectionStatus
} from './types';
import { assessImageQuality } from './imageQualityAnalyzer';
import { detectPlantPresence } from './plantDetector';
import { evaluateVisualHealth, FoliagePigmentMetrics } from './visualHealthEngine';
import { getActiveVisionModel } from './modelRegistry';

let processingCanvas: HTMLCanvasElement | null = null;
let processingCtx: CanvasRenderingContext2D | null = null;

const FRAME_WIDTH = 160;
const FRAME_HEIGHT = 120;

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
    let renderableSource: CanvasImageSource;
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
        renderableSource = img;
      } else {
        processingCtx.drawImage(source, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
        renderableSource = source;
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
        method: activeModel.type === 'plantnet_api' ? 'plantnet_ml' : 'fallback',
        limitations: [imageQuality.qualityMessage],
        explainableFindings: [imageQuality.qualityMessage],
      };
    }

    // Step 2: Multi-Signal Plant Presence Detection (with CCA & Non-Plant Rejection)
    const detection = detectPlantPresence(renderableSource as HTMLVideoElement | HTMLCanvasElement | HTMLImageElement);
    const isPlantDetected = detection.isPlantDetected;

    // Step 3: Visual Health & Stress Assessment
    const totalPixels = FRAME_WIDTH * FRAME_HEIGHT;
    const totalFoliage = Math.round((detection.canopyCoveragePercent / 100) * totalPixels);

    const pigmentMetrics: FoliagePigmentMetrics = {
      totalFoliagePixels: totalFoliage,
      vibrantGreenPixels: detection.foliageColorAssessment === 'vibrant_green' ? totalFoliage : 0,
      chlorosisYellowPixels: detection.foliageColorAssessment === 'chlorosis' ? totalFoliage : 0,
      necroticBrownPixels: 0,
      canopyCoveragePercent: detection.canopyCoveragePercent,
      edgeComplexity: 0.18,
    };

    const healthResult = evaluateVisualHealth(pigmentMetrics, imageQuality, isPlantDetected);
    const processingTimeMs = Math.round(performance.now() - startTime);

    return {
      timestamp,
      detectionStatus: isPlantDetected ? 'PLANT_DETECTED' : 'NO_PLANT',
      plantDetected: isPlantDetected,
      plantSpecies: null,
      speciesConfidence: detection.confidence / 100,
      identificationStatus: isPlantDetected ? 'KNOWN_PLANT' : 'NO_PLANT',
      visualHealthScore: isPlantDetected ? healthResult.score : null,
      healthState: isPlantDetected ? healthResult.state : 'INSUFFICIENT_DATA',
      anomalies: isPlantDetected ? healthResult.anomalies : [],
      canopyCoveragePercent: detection.canopyCoveragePercent,
      vegetationIndex: detection.vegetationIndex,
      imageQuality,
      confidence: healthResult.confidence,
      confidenceScore: healthResult.confidenceScore,
      processingTimeMs,
      method: activeModel.type === 'plantnet_api' ? 'plantnet_ml' : 'fallback',
      limitations: isPlantDetected ? healthResult.limitations : ['No plant detected in frame.'],
      explainableFindings: [
        detection.statusText,
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
      method: 'fallback',
      limitations: [reason],
      explainableFindings: [reason],
    };
  }
}
