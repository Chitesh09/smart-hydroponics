// ============================================================
// HydroSmart — Precision Agronomic Computer Vision Engine
// Chlorophyll Reflectance (ExG) & Foliage HSV Segmentation
// ============================================================

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlantDetectionResult {
  isPlantDetected: boolean;
  confidence: number; // 0 - 100%
  canopyCoveragePercent: number; // 0 - 100%
  vegetationIndex: number; // Average ExG score (-1.0 to +2.0)
  foliageColorAssessment: 'vibrant_green' | 'pale_yellow' | 'chlorosis' | 'no_plant';
  boundingBox?: BoundingBox;
  inferenceTimeMs: number;
  timestamp: number;
  statusText: string;
}

// Offscreen memory canvas for zero-allocation frame processing
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

const DOWNSAMPLE_WIDTH = 320;
const DOWNSAMPLE_HEIGHT = 240;

/**
 * Convert RGB (0-255) to HSV Color Space
 * H in [0, 360], S in [0, 1], V in [0, 1]
 */
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
 * Detect plant presence, canopy coverage, and chlorophyll density
 * from an HTML5 video or canvas source.
 */
export function detectPlantPresence(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): PlantDetectionResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const timestamp = Date.now();

  // Validate source readiness
  if (source instanceof HTMLVideoElement) {
    if (source.readyState < 2 || source.videoWidth === 0 || source.videoHeight === 0) {
      return {
        isPlantDetected: false,
        confidence: 0,
        canopyCoveragePercent: 0,
        vegetationIndex: 0,
        foliageColorAssessment: 'no_plant',
        inferenceTimeMs: 0,
        timestamp,
        statusText: 'Video stream initializing...',
      };
    }
  }

  // Initialize offscreen memory canvas if needed
  if (typeof document !== 'undefined') {
    if (!offscreenCanvas) {
      offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = DOWNSAMPLE_WIDTH;
      offscreenCanvas.height = DOWNSAMPLE_HEIGHT;
      offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    }
  }

  if (!offscreenCtx || !offscreenCanvas) {
    return {
      isPlantDetected: false,
      confidence: 0,
      canopyCoveragePercent: 0,
      vegetationIndex: 0,
      foliageColorAssessment: 'no_plant',
      inferenceTimeMs: 0,
      timestamp,
      statusText: 'Canvas context unavailable',
    };
  }

  // Draw scaled frame onto offscreen buffer
  offscreenCtx.drawImage(source, 0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
  const imgData = offscreenCtx.getImageData(0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
  const data = imgData.data;
  const totalPixels = DOWNSAMPLE_WIDTH * DOWNSAMPLE_HEIGHT;

  let foliagePixelCount = 0;
  let totalExG = 0;
  let yellowFoliageCount = 0;

  let minX = DOWNSAMPLE_WIDTH;
  let minY = DOWNSAMPLE_HEIGHT;
  let maxX = 0;
  let maxY = 0;

  // Process raw pixel buffer
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const sum = r + g + b;
    if (sum < 30) continue; // Ignore pure black shadows/dark noise

    // 1. Normalized Chromaticity Coordinates
    const rNorm = r / sum;
    const gNorm = g / sum;
    const bNorm = b / sum;

    // 2. Excess Green Index (ExG = 2g - r - b)
    const exg = 2 * gNorm - rNorm - bNorm;

    // 3. Excess Green minus Excess Red (ExGR = 3g - 2.4r - b)
    // Isolates live chlorophyll from soil/skin/background
    const exgr = 3 * gNorm - 2.4 * rNorm - bNorm;

    // 4. HSV Foliage Hue Check
    const [h, s, v] = rgbToHsv(r, g, b);

    // Foliage Criteria:
    // - Hue between 55 deg (yellow-green) and 165 deg (deep emerald green)
    // - Positive chlorophyll index (ExG > 0.05 and ExGR > 0)
    // - Saturation > 0.12 and Brightness > 0.12
    const isFoliageHue = h >= 55 && h <= 165 && s >= 0.12 && v >= 0.12;
    const hasChlorophyllReflectance = exg > 0.04 && exgr > 0.01;

    if (isFoliageHue && hasChlorophyllReflectance) {
      foliagePixelCount++;
      totalExG += exg;

      if (h < 75) {
        yellowFoliageCount++;
      }

      // Track bounding box coordinates
      const pixelIdx = i / 4;
      const x = pixelIdx % DOWNSAMPLE_WIDTH;
      const y = Math.floor(pixelIdx / DOWNSAMPLE_WIDTH);

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const canopyCoveragePercent = parseFloat(((foliagePixelCount / totalPixels) * 100).toFixed(1));
  const avgExG = foliagePixelCount > 0 ? parseFloat((totalExG / foliagePixelCount).toFixed(3)) : 0;

  // Decision Logic for Plant Presence:
  // Plant is present when foliage coverage is >= 2.5% of the total frame
  const isPlantDetected = canopyCoveragePercent >= 2.5;

  let confidence = 0;
  if (isPlantDetected) {
    // Confidence formula based on canopy coverage, ExG strength, and spectral uniformity
    // Scaling from 60% (threshold minimum) to 98% (dense vibrant canopy)
    const coverageFactor = Math.min(1.0, canopyCoveragePercent / 20.0); // saturates at 20% coverage
    const exgFactor = Math.min(1.0, Math.max(0, (avgExG - 0.05) / 0.25)); // saturates at ExG = 0.30
    
    confidence = Math.round(60 + coverageFactor * 25 + exgFactor * 13);
    if (confidence > 98) confidence = 98;
  } else {
    // Background noise confidence < 20%
    confidence = Math.round(canopyCoveragePercent * 4);
    if (confidence > 25) confidence = 25;
  }

  // Foliage Color Assessment
  let foliageColorAssessment: 'vibrant_green' | 'pale_yellow' | 'chlorosis' | 'no_plant' = 'no_plant';
  if (isPlantDetected) {
    const yellowRatio = yellowFoliageCount / foliagePixelCount;
    if (yellowRatio > 0.4) {
      foliageColorAssessment = 'chlorosis';
    } else if (yellowRatio > 0.2) {
      foliageColorAssessment = 'pale_yellow';
    } else {
      foliageColorAssessment = 'vibrant_green';
    }
  }

  // Normalise bounding box to 0.0 - 1.0 coordinates relative to frame
  let boundingBox: BoundingBox | undefined = undefined;
  if (isPlantDetected && maxX > minX && maxY > minY) {
    boundingBox = {
      x: parseFloat((minX / DOWNSAMPLE_WIDTH).toFixed(3)),
      y: parseFloat((minY / DOWNSAMPLE_HEIGHT).toFixed(3)),
      width: parseFloat(((maxX - minX) / DOWNSAMPLE_WIDTH).toFixed(3)),
      height: parseFloat(((maxY - minY) / DOWNSAMPLE_HEIGHT).toFixed(3)),
    };
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const inferenceTimeMs = Math.round((endTime - startTime) * 10) / 10;

  const statusText = isPlantDetected
    ? `Plant detected (${canopyCoveragePercent}% canopy, ${confidence}% conf)`
    : 'No plant detected in camera frame';

  return {
    isPlantDetected,
    confidence,
    canopyCoveragePercent,
    vegetationIndex: avgExG,
    foliageColorAssessment,
    boundingBox,
    inferenceTimeMs,
    timestamp,
    statusText,
  };
}
