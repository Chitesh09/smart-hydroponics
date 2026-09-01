// ============================================================
// HydroSmart — Precision Agronomic Computer Vision Engine
// Multi-Signal Plant Presence Detection & Non-Plant Rejection
// Connected Component Analysis (CCA), Skin/Human Detection, Spatial Coherence
// ============================================================

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
  density: number; // pixelCount / (width * height)
  aspectRatio: number; // width / height
}

export interface PlantDetectionResult {
  isPlantDetected: boolean;
  plantPresenceScore: number; // 0 - 100
  confidence: number; // 0 - 100 (Alias for presence confidence)
  confidenceLevel: 'high' | 'medium' | 'low' | 'none';
  canopyCoveragePercent: number; // 0 - 100%
  vegetationIndex: number; // Average ExG score (-1.0 to +2.0)
  spatialCoherence: number; // 0.0 - 1.0
  foliageColorAssessment: 'vibrant_green' | 'pale_yellow' | 'chlorosis' | 'no_plant';
  boundingBox?: BoundingBox;
  isHumanPresent: boolean;
  nonPlantRejectionReason?: string;
  allowIdentification: boolean; // True only when plant presence is high & stable
  inferenceTimeMs: number;
  timestamp: number;
  statusText: string;
}

// Offscreen memory canvas for zero-allocation frame processing
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
  width: number,
  height: number
): ConnectedComponent[] {
  const labels = new Int32Array(width * height);
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
    // Filter tiny isolated dust components (< 0.25% of frame)
    if (stat.count < Math.round(totalPixels * 0.0025)) continue;

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
    });
  }

  // Sort descending by pixel count
  results.sort((a, b) => b.pixelCount - a.pixelCount);
  return results;
}

/**
 * Detect plant presence, canopy coverage, and spatial coherence
 * from an HTML5 video or canvas source.
 */
export function detectPlantPresence(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement
): PlantDetectionResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const timestamp = Date.now();

  // Validate source readiness
  if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    if (source.readyState < 2 || source.videoWidth === 0 || source.videoHeight === 0) {
      return {
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
      statusText: 'Canvas context unavailable',
    };
  }

  // Draw scaled frame onto offscreen buffer
  offscreenCtx.drawImage(source, 0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
  const imgData = offscreenCtx.getImageData(0, 0, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
  const data = imgData.data;
  const totalPixels = DOWNSAMPLE_WIDTH * DOWNSAMPLE_HEIGHT;

  const vegetationMask = new Uint8Array(totalPixels);
  let foliagePixelCount = 0;
  let totalExG = 0;
  let yellowFoliageCount = 0;
  let humanSkinPixelCount = 0;
  let artificialGreenPixelCount = 0;

  // Process raw pixel buffer
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const pixelIdx = i / 4;

    const sum = r + g + b;
    if (sum < 35) continue; // Ignore dark shadows / noise

    // 1. Normalized Chromaticity Coordinates
    const rNorm = r / sum;
    const gNorm = g / sum;
    const bNorm = b / sum;

    // 2. Excess Green & Excess Red
    const exg = 2 * gNorm - rNorm - bNorm;
    const exgr = 3 * gNorm - 2.4 * rNorm - bNorm;

    // 3. HSV Color Space
    const [h, s, v] = rgbToHsv(r, g, b);

    // 4. Human Skin Chromaticity Check (Face / Arms / Body)
    // Skin: r > g > b, strong red/orange hue (h in [0, 40] or [340, 360]), s in [0.15, 0.75], v >= 0.25
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
      humanSkinPixelCount++;
    }

    // 5. Genuine Chlorophyll Foliage Criteria:
    // - Hue between 55° (yellow-green) and 160° (emerald green)
    // - Positive chlorophyll indices (ExG > 0.05 and ExGR > 0.01)
    // - Green must dominate moderately over red and blue (gNorm between 0.38 and 0.68)
    // - Moderate saturation (0.16 <= s <= 0.82). Pure neon/hyper-saturated green (s > 0.82 or gNorm > 0.70) is plastic/clothing/poster
    const isFoliageHue = h >= 55 && h <= 160 && s >= 0.16 && s <= 0.82 && v >= 0.14;
    const hasChlorophyllReflectance = exg > 0.05 && exgr > 0.01 && gNorm > rNorm * 1.05 && gNorm > bNorm * 1.05 && gNorm <= 0.70;

    // Check for artificial / synthetic flat green (e.g. green bottles, green wall, neon shirt)
    const isArtificialGreen = isFoliageHue && (s > 0.82 || gNorm > 0.70 || (exg > 0.35 && exgr < -0.02));
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

  const humanSkinPercent = (humanSkinPixelCount / totalPixels) * 100;
  const isHumanPresent = humanSkinPercent >= 3.5;

  // Run Connected Component Analysis (CCA) on vegetation mask
  const components = extractConnectedComponents(vegetationMask, DOWNSAMPLE_WIDTH, DOWNSAMPLE_HEIGHT);
  const primaryComponent = components[0];

  const totalVegetationPercent = parseFloat(((foliagePixelCount / totalPixels) * 100).toFixed(1));
  const primaryComponentArea = primaryComponent ? primaryComponent.areaPercent : 0;
  const avgExG = foliagePixelCount > 0 ? parseFloat((totalExG / foliagePixelCount).toFixed(3)) : 0;

  // Spatial coherence: fraction of total vegetation gathered in the largest coherent blob
  const spatialCoherence =
    foliagePixelCount > 0 && primaryComponent
      ? parseFloat((primaryComponent.pixelCount / foliagePixelCount).toFixed(2))
      : 0;

  // -------------------------------------------------------------
  // Multi-Signal Plant Presence Scoring Model (0 - 100)
  // -------------------------------------------------------------
  let presenceScore = 0;
  let rejectionReason: string | undefined = undefined;

  if (primaryComponent && primaryComponentArea >= 1.5) {
    // 1. Coherence & Size Score (0 - 35 pts)
    const sizeFactor = Math.min(1.0, primaryComponentArea / 12.0); // Saturates at 12% frame area
    const coherenceFactor = Math.min(1.0, spatialCoherence / 0.65);
    const sizeCoherenceScore = (sizeFactor * 0.6 + coherenceFactor * 0.4) * 35;

    // 2. Component Morphology & Solidity (0 - 25 pts)
    // Organic leaf canopies have solidity between 0.20 and 0.78 and aspect ratio between 0.35 and 2.8
    const densityOptimal = primaryComponent.density >= 0.18 && primaryComponent.density <= 0.78;
    const aspectOptimal = primaryComponent.aspectRatio >= 0.35 && primaryComponent.aspectRatio <= 2.8;
    const morphologyScore = (densityOptimal ? 15 : 4) + (aspectOptimal ? 10 : 3);

    // 3. Chlorophyll Spectral Strength (0 - 25 pts)
    const exgScore = Math.min(25, Math.max(0, (avgExG - 0.05) / 0.20 * 25));

    // 4. Cluster Compactness (0 - 15 pts)
    const clusterScore = components.length <= 8 ? 15 : Math.max(0, 15 - (components.length - 8));

    presenceScore = Math.round(sizeCoherenceScore + morphologyScore + exgScore + clusterScore);
  } else {
    presenceScore = Math.round(totalVegetationPercent * 2);
  }

  // Apply Non-Plant & Human Presence Penalties
  if (isHumanPresent) {
    // If a human is present in frame:
    // Case A: Confirmed prominent plant canopy in foreground (Area >= 4.0% and Coherence >= 0.45)
    if (primaryComponent && primaryComponentArea >= 4.0 && spatialCoherence >= 0.45) {
      presenceScore = Math.max(0, presenceScore - 10);
    } else {
      // Case B: Human without dominant plant canopy (or green clothing/reflections)
      presenceScore = Math.max(0, presenceScore - 70);
      rejectionReason = 'Human subject present in optical view with no dominant plant canopy.';
    }
  }

  if (artificialGreenPixelCount > foliagePixelCount * 0.4) {
    presenceScore = Math.max(0, presenceScore - 40);
    rejectionReason = 'Synthetic/artificial non-plant green reflectance detected.';
  }

  // Solid block non-plant rejection (e.g. green poster / flat surface)
  if (primaryComponent && primaryComponent.density > 0.85 && primaryComponentArea > 10.0) {
    presenceScore = Math.max(0, presenceScore - 45);
    rejectionReason = 'Solid planar non-foliar green surface detected.';
  }

  // Fragmented scattered noise penalty (green everywhere without a central canopy)
  if (totalVegetationPercent > 5.0 && spatialCoherence < 0.30) {
    presenceScore = Math.max(0, presenceScore - 40);
    rejectionReason = 'Vegetation is fragmented across background with low spatial coherence.';
  }

  presenceScore = Math.min(100, Math.max(0, presenceScore));

  // Decision Thresholds
  const isPlantDetected = presenceScore >= 50 && primaryComponentArea >= 1.8 && spatialCoherence >= 0.30;
  const allowIdentification = presenceScore >= 70 && primaryComponentArea >= 3.0;

  let confidenceLevel: 'high' | 'medium' | 'low' | 'none' = 'none';
  if (presenceScore >= 75) {
    confidenceLevel = 'high';
  } else if (presenceScore >= 50) {
    confidenceLevel = 'medium';
  } else if (presenceScore >= 25) {
    confidenceLevel = 'low';
  }

  // Compute normalized bounding box of primary plant region
  let boundingBox: BoundingBox | undefined = undefined;
  if (isPlantDetected && primaryComponent) {
    const padX = Math.round((primaryComponent.maxX - primaryComponent.minX) * 0.05);
    const padY = Math.round((primaryComponent.maxY - primaryComponent.minY) * 0.05);

    const minX = Math.max(0, primaryComponent.minX - padX);
    const minY = Math.max(0, primaryComponent.minY - padY);
    const maxX = Math.min(DOWNSAMPLE_WIDTH, primaryComponent.maxX + padX);
    const maxY = Math.min(DOWNSAMPLE_HEIGHT, primaryComponent.maxY + padY);

    boundingBox = {
      x: parseFloat((minX / DOWNSAMPLE_WIDTH).toFixed(3)),
      y: parseFloat((minY / DOWNSAMPLE_HEIGHT).toFixed(3)),
      width: parseFloat(((maxX - minX) / DOWNSAMPLE_WIDTH).toFixed(3)),
      height: parseFloat(((maxY - minY) / DOWNSAMPLE_HEIGHT).toFixed(3)),
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
  if (isPlantDetected) {
    statusText = `Plant detected (${presenceScore}% presence, ${primaryComponentArea}% canopy)`;
  } else if (isHumanPresent) {
    statusText = 'No plant detected — Human subject in frame';
  } else if (rejectionReason) {
    statusText = `No plant detected — ${rejectionReason}`;
  }

  return {
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
  };
}
