// ============================================================
// HydroSmart — Precision Agronomic Computer Vision Engine
// Deterministic Computer-Vision Plant Presence Detection
// Multi-Signal Chlorophyll, Spatial Coherence & Internal Texture Extraction
// NOTE: This module uses deterministic computer vision, NOT machine learning.
// ============================================================

import { assessImageQuality } from './imageQualityAnalyzer';
import { ImageQualityAssessment } from './types';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ConnectedComponent {
  id: number;
  pixelCount: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  areaPercent: number;
  density: number; // pixelCount / (width * height) - organic solidity
  aspectRatio: number; // width / height
  internalEdgeCount: number;
  internalEdgeDensity: number; // internal edges per pixel inside component
  isAdjacentToSkin: boolean;
}

/**
 * Formal 4-State Detection Model for Plant Presence
 */
export type PlantPresenceState =
  | 'PLANT_DETECTED'
  | 'NO_PLANT_DETECTED'
  | 'LOW_CONFIDENCE'
  | 'SCAN_NOT_READY';

/**
 * Centralized, Configurable Heuristics for Plant Presence Computer Vision
 * NOTE: These are engineering heuristics tuned for indoor/hydroponic framing,
 * NOT universal biological constants. They are tunable based on calibration.
 */
export interface PlantDetectorConfig {
  // Pre-Scan Image Quality Limits
  minLumaScanReady: number;         // Below this luma (0-255), frame is underexposed
  maxLumaScanReady: number;         // Above this luma (0-255), frame is overexposed
  minSharpnessScanReady: number;    // Below this sharpness gradient with contrast, frame is blurry
  minContrastForBlurCheck: number;  // Contrast threshold before applying blur rejection

  // Chromaticity & Chlorophyll Heuristics
  foliageMinHue: number;            // Min hue degrees for live chlorophyll (55° yellow-green)
  foliageMaxHue: number;            // Max hue degrees for live chlorophyll (160° emerald)
  foliageMinSat: number;            // Min saturation for live foliage (0.16)
  foliageMaxSat: number;            // Max saturation before flagging synthetic neon green (0.82)
  foliageMinVal: number;            // Min brightness for foliage (0.14)
  foliageMinExG: number;            // Min Excess Green index (2g - r - b) (0.05)
  foliageMinExGR: number;           // Min Excess Green minus Red (0.01)

  // Structural & Morphological Limits
  minOrganicSolidity: number;       // Min fill density within bbox for organic leaf cluster (0.18)
  maxOrganicSolidity: number;       // Max fill density before suspecting solid surface (0.80)
  minOrganicAspectRatio: number;    // Min width/height for natural canopy (0.35)
  maxOrganicAspectRatio: number;    // Max width/height for natural canopy (2.80)
  minInternalEdgeDensity: number;   // Min internal high-frequency edge density for real leaf venation (0.10)
  maxPlanarDensity: number;         // High solidity threshold flagging flat posters/walls (0.84)

  // Foreground & Framing Checks
  minPlantAreaPercent: number;      // Min frame area % required to confirm primary plant (2.2%)
  smallPlantAreaPercent: number;    // Area % below which plant is flagged as small/distant (1.2%)
  minSpatialCoherence: number;      // Min ratio of primary cluster to total foliage (0.32)

  // Human Interaction & Clothing Discrimination
  humanSkinPercentThreshold: number;           // Skin pixel % indicating human presence (3.5%)
  minIndependentPlantAreaWithPerson: number;   // Min area % for an independent plant cluster held/near person (2.2%)
  minIndependentEdgeDensityWithPerson: number; // Min edge density for an independent plant held by person (0.10)

  // Decision Score Thresholds
  presenceScoreDetected: number;    // Score required for PLANT_DETECTED (50)
  presenceScoreLowConfidence: number; // Score required for LOW_CONFIDENCE (28)
}

export const PLANT_DETECTOR_CONFIG: PlantDetectorConfig = {
  minLumaScanReady: 30,
  maxLumaScanReady: 225,
  minSharpnessScanReady: 5.0,
  minContrastForBlurCheck: 20.0,

  foliageMinHue: 55,
  foliageMaxHue: 160,
  foliageMinSat: 0.16,
  foliageMaxSat: 0.82,
  foliageMinVal: 0.14,
  foliageMinExG: 0.05,
  foliageMinExGR: 0.01,

  minOrganicSolidity: 0.18,
  maxOrganicSolidity: 0.80,
  minOrganicAspectRatio: 0.35,
  maxOrganicAspectRatio: 2.80,
  minInternalEdgeDensity: 0.10,
  maxPlanarDensity: 0.84,

  minPlantAreaPercent: 2.2,
  smallPlantAreaPercent: 1.2,
  minSpatialCoherence: 0.32,

  humanSkinPercentThreshold: 3.5,
  minIndependentPlantAreaWithPerson: 2.2,
  minIndependentEdgeDensityWithPerson: 0.10,

  presenceScoreDetected: 50,
  presenceScoreLowConfidence: 28,
};

export interface PlantDetectorDiagnostics {
  internalEdgeDensity: number;
  spatialCoherence: number;
  canopyCoveragePercent: number;
  totalVegetationPercent: number;
  skinPercent: number;
  artificialGreenPercent: number;
  solidSurfaceDetected: boolean;
  humanSubjectDetected: boolean;
  independentPlantClusterFound: boolean;
  backgroundVegetationDominant: boolean;
  meanLuma: number;
  sharpness: number;
}

export interface PlantDetectionResult {
  state: PlantPresenceState;
  isPlantDetected: boolean;
  plantPresenceScore: number; // 0 - 100
  confidence: number; // 0 - 100
  confidenceLevel: 'high' | 'medium' | 'low' | 'none';
  canopyCoveragePercent: number; // 0 - 100%
  vegetationIndex: number; // Average ExG score (-1.0 to +2.0)
  spatialCoherence: number; // 0.0 - 1.0
  foliageColorAssessment: 'vibrant_green' | 'pale_yellow' | 'chlorosis' | 'no_plant';
  boundingBox?: BoundingBox;
  isHumanPresent: boolean;
  nonPlantRejectionReason?: string;
  allowIdentification: boolean; // True only when state === 'PLANT_DETECTED' and confidence high/medium
  inferenceTimeMs: number;
  timestamp: number;
  statusText: string;
  userMessage: string;
  quality?: ImageQualityAssessment;
  diagnostics?: PlantDetectorDiagnostics;
}

export type PlantDetectionSource =
  | HTMLVideoElement
  | HTMLCanvasElement
  | HTMLImageElement
  | { data: Uint8ClampedArray; width: number; height: number };

// Offscreen memory canvas for zero-allocation frame processing in browser
let offscreenCanvas: HTMLCanvasElement | null = null;
let offscreenCtx: CanvasRenderingContext2D | null = null;

const DOWNSAMPLE_WIDTH = 160;
const DOWNSAMPLE_HEIGHT = 120;

/**
 * Convert RGB (0-255) to HSV Color Space
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
 * Connected Component Labeling (Two-Pass with Disjoint Set)
 */
function extractConnectedComponents(
  binaryMask: Uint8Array,
  labels: Int32Array,
  width: number,
  height: number
): ConnectedComponent[] {
  labels.fill(0);
  const parent: number[] = [0];
  let nextLabel = 1;

  function find(i: number): number {
    let root = i;
    while (root < parent.length && parent[root] !== root) {
      root = parent[root];
    }
    let curr = i;
    while (curr < parent.length && curr !== root) {
      const nxt = parent[curr];
      parent[curr] = root;
      curr = nxt;
    }
    return root;
  }

  function union(i: number, j: number) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ && rootI < parent.length && rootJ < parent.length) {
      parent[rootJ] = rootI;
    }
  }

  // Pass 1: Label pixels and record equivalences
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binaryMask[idx] === 0) continue;

      const left = x > 0 ? labels[idx - 1] : 0;
      const up = y > 0 ? labels[idx - width] : 0;

      if (left === 0 && up === 0) {
        labels[idx] = nextLabel;
        parent[nextLabel] = nextLabel;
        nextLabel++;
      } else if (left !== 0 && up === 0) {
        labels[idx] = left;
      } else if (left === 0 && up !== 0) {
        labels[idx] = up;
      } else {
        labels[idx] = left;
        if (left !== up) {
          union(left, up);
        }
      }
    }
  }

  // Pass 2: Flatten labels and calculate bounding boxes
  const componentStats = new Map<
    number,
    { count: number; minX: number; minY: number; maxX: number; maxY: number }
  >();

  const totalPixels = width * height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const lbl = labels[idx];
      if (lbl === 0) continue;

      const root = find(lbl);
      labels[idx] = root;

      let stat = componentStats.get(root);
      if (!stat) {
        stat = { count: 0, minX: x, minY: y, maxX: x, maxY: y };
        componentStats.set(root, stat);
      }
      stat.count++;
      if (x < stat.minX) stat.minX = x;
      if (x > stat.maxX) stat.maxX = x;
      if (y < stat.minY) stat.minY = y;
      if (y > stat.maxY) stat.maxY = y;
    }
  }

  const results: ConnectedComponent[] = [];
  for (const [id, stat] of componentStats.entries()) {
    // Filter tiny isolated dust components (< 0.20% of frame)
    if (stat.count < Math.round(totalPixels * 0.0020)) continue;

    const w = stat.maxX - stat.minX + 1;
    const h = stat.maxY - stat.minY + 1;
    const bboxArea = w * h;
    const density = bboxArea > 0 ? stat.count / bboxArea : 0;
    const aspectRatio = h > 0 ? w / h : 1;
    const areaPercent = parseFloat(((stat.count / totalPixels) * 100).toFixed(2));

    results.push({
      id,
      pixelCount: stat.count,
      minX: stat.minX,
      minY: stat.minY,
      maxX: stat.maxX,
      maxY: stat.maxY,
      areaPercent,
      density,
      aspectRatio,
      internalEdgeCount: 0,
      internalEdgeDensity: 0,
      isAdjacentToSkin: false,
    });
  }

  // Sort descending by pixel count
  results.sort((a, b) => b.pixelCount - a.pixelCount);
  return results;
}

/**
 * Compute high-frequency internal leaf edge texture and skin adjacency for a component
 */
function computeComponentEdgeMetrics(
  component: ConnectedComponent,
  labels: Int32Array,
  lumaBuffer: Uint8Array,
  skinMask: Uint8Array,
  width: number,
  height: number
): void {
  let edgeCount = 0;
  let skinAdjacentPixels = 0;
  const targetRoot = component.id;

  for (let y = component.minY; y <= component.maxY; y++) {
    for (let x = component.minX; x <= component.maxX; x++) {
      const idx = y * width + x;
      if (labels[idx] !== targetRoot) continue;

      const currentLuma = lumaBuffer[idx];

      // Check horizontal edge
      if (x + 1 <= component.maxX && labels[idx + 1] === targetRoot) {
        if (Math.abs(currentLuma - lumaBuffer[idx + 1]) >= 14) {
          edgeCount++;
        }
      }
      // Check vertical edge
      if (y + 1 <= component.maxY && labels[idx + width] === targetRoot) {
        if (Math.abs(currentLuma - lumaBuffer[idx + width]) >= 14) {
          edgeCount++;
        }
      }

      // Check skin proximity (within 2 pixels)
      let adjacentToSkin = false;
      for (let dy = -2; dy <= 2 && !adjacentToSkin; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -2; dx <= 2; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;
          if (skinMask[ny * width + nx] === 1) {
            skinAdjacentPixels++;
            adjacentToSkin = true;
            break;
          }
        }
      }
    }
  }

  component.internalEdgeCount = edgeCount;
  component.internalEdgeDensity = component.pixelCount > 0
    ? parseFloat((edgeCount / component.pixelCount).toFixed(3))
    : 0;
  component.isAdjacentToSkin = skinAdjacentPixels > Math.min(15, component.pixelCount * 0.05);
}

/**
 * Detect plant presence, canopy coverage, and spatial coherence
 * using multi-signal computer vision heuristics.
 */
export function detectPlantPresence(
  source: PlantDetectionSource,
  configOverride?: Partial<PlantDetectorConfig>
): PlantDetectionResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const timestamp = Date.now();
  const config = { ...PLANT_DETECTOR_CONFIG, ...configOverride };

  // Validate HTMLVideoElement readiness if applicable
  if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    if (source.readyState < 2 || source.videoWidth === 0 || source.videoHeight === 0) {
      return {
        state: 'SCAN_NOT_READY',
        isPlantDetected: false,
        plantPresenceScore: 0,
        confidence: 0,
        confidenceLevel: 'none',
        canopyCoveragePercent: 0,
        vegetationIndex: 0,
        spatialCoherence: 0,
        foliageColorAssessment: 'no_plant',
        isHumanPresent: false,
        allowIdentification: false,
        inferenceTimeMs: 0,
        timestamp,
        statusText: 'Camera stream initializing...',
        userMessage: 'Camera is starting...',
      };
    }
  }

  let data: Uint8ClampedArray;
  const width = DOWNSAMPLE_WIDTH;
  const height = DOWNSAMPLE_HEIGHT;
  const totalPixels = width * height;

  // Direct pixel buffer support (for headless Node.js tests)
  if ('data' in source && source.data instanceof Uint8ClampedArray) {
    data = source.data;
  } else {
    // Browser canvas downsampling
    if (typeof document !== 'undefined') {
      if (!offscreenCanvas) {
        offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = width;
        offscreenCanvas.height = height;
        offscreenCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      }
    }

    if (!offscreenCtx || !offscreenCanvas) {
      return {
        state: 'SCAN_NOT_READY',
        isPlantDetected: false,
        plantPresenceScore: 0,
        confidence: 0,
        confidenceLevel: 'none',
        canopyCoveragePercent: 0,
        vegetationIndex: 0,
        spatialCoherence: 0,
        foliageColorAssessment: 'no_plant',
        isHumanPresent: false,
        allowIdentification: false,
        inferenceTimeMs: 0,
        timestamp,
        statusText: 'Canvas rendering context unavailable',
        userMessage: "Camera view isn't ready yet.",
      };
    }

    offscreenCtx.drawImage(source as CanvasImageSource, 0, 0, width, height);
    const imgData = offscreenCtx.getImageData(0, 0, width, height);
    data = imgData.data;
  }

  // 1. Pre-Scan Optical Quality Assessment
  const quality = assessImageQuality(data, width, height);

  // Optical Readiness & Illumination Checks based on configurable heuristics
  const isUnderexposed = quality.isUnderexposed;
  const isOverexposed = quality.isOverexposed;
  const isSevereBlur = quality.contrastScore >= config.minContrastForBlurCheck && quality.sharpnessScore < config.minSharpnessScanReady;

  if (isUnderexposed || isOverexposed || (isSevereBlur && quality.sharpnessScore < 3.0)) {
    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    let scanReadyMsg = "Camera view isn't ready yet.";
    let rejection = '';
    if (isUnderexposed) {
      scanReadyMsg = 'Image is too dark. Increase ambient lighting.';
      rejection = 'Underexposed frame (insufficient illumination).';
    } else if (isOverexposed) {
      scanReadyMsg = 'Frame is overexposed. Reduce glare or direct lighting.';
      rejection = 'Overexposed frame (excessive optical glare).';
    } else if (isSevereBlur) {
      scanReadyMsg = 'Camera view is blurry. Focus or clean the camera lens.';
      rejection = 'Optical blur (camera out of focus or lens smudged).';
    }

    return {
      state: 'SCAN_NOT_READY',
      isPlantDetected: false,
      plantPresenceScore: 0,
      confidence: 0,
      confidenceLevel: 'none',
      canopyCoveragePercent: 0,
      vegetationIndex: 0,
      spatialCoherence: 0,
      foliageColorAssessment: 'no_plant',
      isHumanPresent: false,
      nonPlantRejectionReason: rejection,
      allowIdentification: false,
      inferenceTimeMs: Math.round((endTime - startTime) * 10) / 10,
      timestamp,
      statusText: `Scan not ready: ${rejection}`,
      userMessage: scanReadyMsg,
      quality,
      diagnostics: {
        internalEdgeDensity: 0,
        spatialCoherence: 0,
        canopyCoveragePercent: 0,
        totalVegetationPercent: 0,
        skinPercent: 0,
        artificialGreenPercent: 0,
        solidSurfaceDetected: false,
        humanSubjectDetected: false,
        independentPlantClusterFound: false,
        backgroundVegetationDominant: false,
        meanLuma: quality.brightnessScore,
        sharpness: quality.sharpnessScore,
      },
    };
  }

  // 2. Pixel-Level Classification
  const vegetationMask = new Uint8Array(totalPixels);
  const skinMask = new Uint8Array(totalPixels);
  const lumaBuffer = new Uint8Array(totalPixels);

  let foliagePixelCount = 0;
  let totalExG = 0;
  let yellowFoliageCount = 0;
  let humanSkinPixelCount = 0;
  let artificialGreenPixelCount = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pixelIdx = i / 4;

    const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    lumaBuffer[pixelIdx] = luma;

    const sum = r + g + b;
    if (sum < 35) continue; // Ignore deep shadow / black noise

    const rNorm = r / sum;
    const gNorm = g / sum;
    const bNorm = b / sum;

    const exg = 2 * gNorm - rNorm - bNorm;
    const exgr = 3 * gNorm - 2.4 * rNorm - bNorm;
    const [h, s, v] = rgbToHsv(r, g, b);

    // Human skin chromaticity
    const isSkinColor =
      r > 60 &&
      g > 40 &&
      b > 20 &&
      r > g &&
      g > b &&
      r - g >= 12 &&
      rNorm > 0.36 &&
      bNorm < 0.28 &&
      ((h >= 0 && h <= 42) || h >= 335) &&
      s >= 0.15 &&
      s <= 0.75 &&
      v >= 0.22;

    if (isSkinColor) {
      skinMask[pixelIdx] = 1;
      humanSkinPixelCount++;
    }

    // Live Chlorophyll Foliage Criteria
    const isFoliageHue =
      h >= config.foliageMinHue &&
      h <= config.foliageMaxHue &&
      s >= config.foliageMinSat &&
      s <= config.foliageMaxSat &&
      v >= config.foliageMinVal;

    const hasChlorophyllReflectance =
      exg >= config.foliageMinExG &&
      exgr >= config.foliageMinExGR &&
      gNorm > rNorm * 1.05 &&
      gNorm > bNorm * 1.05 &&
      gNorm <= 0.70;

    const isArtificialGreen =
      isFoliageHue &&
      (s > config.foliageMaxSat || gNorm > 0.70 || (exg > 0.35 && exgr < -0.02));

    if (isArtificialGreen) {
      artificialGreenPixelCount++;
    }

    if (isFoliageHue && hasChlorophyllReflectance && !isArtificialGreen) {
      vegetationMask[pixelIdx] = 1;
      foliagePixelCount++;
      totalExG += exg;

      if (h < 75) {
        yellowFoliageCount++;
      }
    }
  }

  const skinPercent = parseFloat(((humanSkinPixelCount / totalPixels) * 100).toFixed(1));
  const isHumanPresent = skinPercent >= config.humanSkinPercentThreshold;
  const artificialGreenPercent = foliagePixelCount > 0
    ? parseFloat(((artificialGreenPixelCount / foliagePixelCount) * 100).toFixed(1))
    : 0;

  // 3. Connected Component Analysis
  const labels = new Int32Array(totalPixels);
  const components = extractConnectedComponents(vegetationMask, labels, width, height);

  // Compute internal leaf edge texture and skin adjacency for components
  for (const comp of components) {
    computeComponentEdgeMetrics(comp, labels, lumaBuffer, skinMask, width, height);
  }

  const totalVegetationPercent = parseFloat(((foliagePixelCount / totalPixels) * 100).toFixed(1));
  let primaryComponent = components[0];
  const primaryComponentArea = primaryComponent ? primaryComponent.areaPercent : 0;
  const avgExG = foliagePixelCount > 0 ? parseFloat((totalExG / foliagePixelCount).toFixed(3)) : 0;

  // Spatial coherence: fraction of total vegetation gathered in the largest coherent blob
  const spatialCoherence =
    foliagePixelCount > 0 && primaryComponent
      ? parseFloat((primaryComponent.pixelCount / foliagePixelCount).toFixed(2))
      : 0;

  // 4. Person + Plant Separation Logic
  // Check if any candidate foliage component represents an INDEPENDENT plant cluster
  let independentPlantClusterFound = false;
  let independentPlantComponent: ConnectedComponent | undefined = undefined;

  for (const comp of components) {
    const hasSufficientArea = comp.areaPercent >= config.minIndependentPlantAreaWithPerson;
    const hasLeafTexture = comp.internalEdgeDensity >= config.minIndependentEdgeDensityWithPerson;
    const hasOrganicSolidity =
      comp.density >= config.minOrganicSolidity && comp.density <= config.maxOrganicSolidity;
    const hasOrganicAspect =
      comp.aspectRatio >= config.minOrganicAspectRatio && comp.aspectRatio <= config.maxOrganicAspectRatio;

    // If component is not a flat clothing piece attached to skin, but an independent organic cluster
    if (hasSufficientArea && hasLeafTexture && hasOrganicSolidity && hasOrganicAspect) {
      independentPlantClusterFound = true;
      independentPlantComponent = comp;
      break;
    }
  }

  // If human is present and an independent plant cluster was found (e.g. farmer holding a plant):
  if (isHumanPresent && independentPlantComponent) {
    primaryComponent = independentPlantComponent;
  }

  // 5. Multi-Signal Scoring
  let presenceScore = 0;
  let rejectionReason: string | undefined = undefined;
  let solidSurfaceDetected = false;
  let backgroundVegetationDominant = false;

  if (primaryComponent && primaryComponentArea >= 1.0) {
    // 1. Size Score (0 - 30 pts)
    const sizeScore = Math.min(1.0, primaryComponent.areaPercent / 10.0) * 30;

    // 2. Spatial Coherence Score (0 - 20 pts)
    const coherenceScore = Math.min(1.0, spatialCoherence / 0.55) * 20;

    // 3. Morphology & Solidity Score (0 - 20 pts)
    const densityOptimal =
      primaryComponent.density >= config.minOrganicSolidity &&
      primaryComponent.density <= config.maxOrganicSolidity;
    const aspectOptimal =
      primaryComponent.aspectRatio >= config.minOrganicAspectRatio &&
      primaryComponent.aspectRatio <= config.maxOrganicAspectRatio;
    const morphologyScore = (densityOptimal ? 12 : 3) + (aspectOptimal ? 8 : 2);

    // 4. Internal Leaf Texture & Edge Score (0 - 20 pts)
    let textureScore = 0;
    if (primaryComponent.internalEdgeDensity >= 0.12) {
      textureScore = 20;
    } else if (primaryComponent.internalEdgeDensity >= config.minInternalEdgeDensity) {
      textureScore = 14;
    } else if (primaryComponent.internalEdgeDensity >= 0.06) {
      textureScore = 7;
    } else {
      textureScore = 0; // Flat uniform non-plant surface
    }

    // 5. Chlorophyll Spectral Strength Score (0 - 10 pts)
    const chlorophyllScore = Math.min(10, Math.max(0, ((avgExG - 0.05) / 0.15) * 10));

    presenceScore = Math.round(sizeScore + coherenceScore + morphologyScore + textureScore + chlorophyllScore);
  } else {
    presenceScore = Math.round(totalVegetationPercent * 2);
  }

  // Check for flat planar surfaces (e.g. green binder, poster, green wall)
  if (
    primaryComponent &&
    primaryComponent.density > config.maxPlanarDensity &&
    primaryComponent.internalEdgeDensity < 0.08 &&
    primaryComponent.areaPercent > 3.5
  ) {
    solidSurfaceDetected = true;
    presenceScore = Math.max(0, presenceScore - 55);
    rejectionReason = 'Solid planar non-foliar surface detected (e.g. green wall or flat object).';
  }

  // Artificial neon green penalty
  if (artificialGreenPixelCount > foliagePixelCount * 0.35) {
    presenceScore = Math.max(0, presenceScore - 45);
    rejectionReason = 'Synthetic or non-chlorophyll green reflectance detected.';
  }

  // Human presence check
  if (isHumanPresent) {
    if (independentPlantClusterFound) {
      // Farmer holding plant or standing behind it: mild adjustment
      presenceScore = Math.max(0, presenceScore - 5);
    } else {
      // Human subject with green clothing / reflections but NO independent plant cluster
      presenceScore = Math.max(0, presenceScore - 70);
      rejectionReason = 'Human subject in camera view with no independent plant canopy.';
    }
  }

  // Diffuse background vegetation check (green everywhere without a focused foreground subject)
  if (totalVegetationPercent > 5.0 && spatialCoherence < config.minSpatialCoherence) {
    backgroundVegetationDominant = true;
    presenceScore = Math.max(0, presenceScore - 35);
    rejectionReason = 'Distant or fragmented background vegetation detected without a prominent foreground specimen.';
  }

  presenceScore = Math.min(100, Math.max(0, presenceScore));

  // 6. Decision State Resolution
  let state: PlantPresenceState = 'NO_PLANT_DETECTED';
  let userMessage = 'No plant detected. Place the plant in front of the camera.';

  if (foliagePixelCount === 0) {
    state = 'NO_PLANT_DETECTED';
    userMessage = 'No plant detected. Place the plant in front of the camera.';
  } else if (isHumanPresent && !independentPlantClusterFound) {
    state = 'NO_PLANT_DETECTED';
    userMessage = 'No plant detected. Move clear of camera view or place plant in front.';
  } else if (solidSurfaceDetected) {
    state = 'NO_PLANT_DETECTED';
    userMessage = 'No plant detected — Flat surface or green object detected.';
  } else if (
    primaryComponent &&
    primaryComponent.areaPercent >= config.minPlantAreaPercent &&
    (quality.isBlurry || quality.sharpnessScore < 15) &&
    primaryComponent.internalEdgeDensity < 0.08
  ) {
    state = 'SCAN_NOT_READY';
    userMessage = 'Camera view is blurry. Focus or clean the camera lens.';
    rejectionReason = 'Optical blur on plant foliage (camera out of focus or lens smudged).';
  } else if (
    presenceScore >= config.presenceScoreDetected &&
    primaryComponent &&
    primaryComponent.areaPercent >= config.minPlantAreaPercent &&
    spatialCoherence >= config.minSpatialCoherence
  ) {
    state = 'PLANT_DETECTED';
    userMessage = 'Plant detected 🌱';
  } else if (
    presenceScore >= config.presenceScoreLowConfidence ||
    (primaryComponent && primaryComponent.areaPercent >= config.smallPlantAreaPercent)
  ) {
    state = 'LOW_CONFIDENCE';
    if (primaryComponent && primaryComponent.areaPercent < config.minPlantAreaPercent) {
      userMessage = 'Plant appears small or distant. Move camera closer.';
      rejectionReason = rejectionReason || 'Plant canopy covers less than optimal area of camera view.';
    } else if (backgroundVegetationDominant) {
      userMessage = 'Distant or background vegetation detected. Move camera closer to center the plant.';
      rejectionReason = rejectionReason || 'Diffuse background vegetation without dominant foreground center.';
    } else {
      userMessage = 'We can see something that may be a plant. Try moving closer or improving lighting.';
    }
  } else {
    state = 'NO_PLANT_DETECTED';
    userMessage = rejectionReason
      ? `No plant detected — ${rejectionReason}`
      : 'No plant detected. Place the plant in front of the camera.';
  }

  const isPlantDetected = state === 'PLANT_DETECTED';
  const allowIdentification = state === 'PLANT_DETECTED' && presenceScore >= 65 && primaryComponentArea >= 3.0;

  let confidenceLevel: 'high' | 'medium' | 'low' | 'none' = 'none';
  if (state === 'PLANT_DETECTED') {
    confidenceLevel = presenceScore >= 75 ? 'high' : 'medium';
  } else if (state === 'LOW_CONFIDENCE') {
    confidenceLevel = 'low';
  }

  // 7. Bounding Box: ONLY emitted on verified PLANT_DETECTED
  let boundingBox: BoundingBox | undefined = undefined;
  if (state === 'PLANT_DETECTED' && primaryComponent) {
    const padX = Math.round((primaryComponent.maxX - primaryComponent.minX) * 0.05);
    const padY = Math.round((primaryComponent.maxY - primaryComponent.minY) * 0.05);

    const minX = Math.max(0, primaryComponent.minX - padX);
    const minY = Math.max(0, primaryComponent.minY - padY);
    const maxX = Math.min(width, primaryComponent.maxX + padX);
    const maxY = Math.min(height, primaryComponent.maxY + padY);

    boundingBox = {
      x: parseFloat((minX / width).toFixed(3)),
      y: parseFloat((minY / height).toFixed(3)),
      width: parseFloat(((maxX - minX) / width).toFixed(3)),
      height: parseFloat(((maxY - minY) / height).toFixed(3)),
    };
  }

  // Foliage Color Assessment
  let foliageColorAssessment: 'vibrant_green' | 'pale_yellow' | 'chlorosis' | 'no_plant' = 'no_plant';
  if (isPlantDetected && foliagePixelCount > 0) {
    const yellowRatio = yellowFoliageCount / foliagePixelCount;
    if (yellowRatio > 0.38) {
      foliageColorAssessment = 'chlorosis';
    } else if (yellowRatio > 0.18) {
      foliageColorAssessment = 'pale_yellow';
    } else {
      foliageColorAssessment = 'vibrant_green';
    }
  }

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const inferenceTimeMs = Math.round((endTime - startTime) * 10) / 10;

  let statusText = 'No plant detected in camera frame';
  if (state === 'PLANT_DETECTED') {
    statusText = `Plant detected (${presenceScore}% presence score, ${primaryComponentArea}% canopy)`;
  } else if (state === 'LOW_CONFIDENCE') {
    statusText = `Low confidence plant detection (${presenceScore}% presence score) — ${rejectionReason || 'Move closer'}`;
  } else if (isHumanPresent && !independentPlantClusterFound) {
    statusText = 'No plant detected — Human subject present in frame';
  } else if (rejectionReason) {
    statusText = `No plant detected — ${rejectionReason}`;
  }

  return {
    state,
    isPlantDetected,
    plantPresenceScore: presenceScore,
    confidence: presenceScore,
    confidenceLevel,
    canopyCoveragePercent: primaryComponentArea,
    vegetationIndex: avgExG,
    spatialCoherence,
    foliageColorAssessment,
    boundingBox,
    isHumanPresent,
    nonPlantRejectionReason: rejectionReason,
    allowIdentification,
    inferenceTimeMs,
    timestamp,
    statusText,
    userMessage,
    quality,
    diagnostics: {
      internalEdgeDensity: primaryComponent ? primaryComponent.internalEdgeDensity : 0,
      spatialCoherence,
      canopyCoveragePercent: primaryComponentArea,
      totalVegetationPercent,
      skinPercent,
      artificialGreenPercent,
      solidSurfaceDetected,
      humanSubjectDetected: isHumanPresent,
      independentPlantClusterFound,
      backgroundVegetationDominant,
      meanLuma: quality.brightnessScore,
      sharpness: quality.sharpnessScore,
    },
  };
}
