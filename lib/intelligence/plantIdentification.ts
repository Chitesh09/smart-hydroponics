// ============================================================
// HydroSmart — Replaceable Plant Species Identification Engine
// Multi-Feature Morphological & Chromatic Botanical Classifier
// ============================================================

import { PlantCandidate, PlantIdentificationResponse } from './types';
import { BOTANICAL_DATABASE, BotanicalTaxon } from './botanicalDatabase';

interface ExtractedFeatures {
  canopyCoverage: number;
  aspectRatio: number;
  meanHue: number;
  meanExG: number;
  edgeComplexity: number;
  canopyRoundness: number;
}

/**
 * Convert RGB to HSV
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
 * Extract optical, chromatic, and morphological features from an image
 */
function extractBotanicalFeatures(
  source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement
): ExtractedFeatures {
  const width = 320;
  const height = 240;

  if (typeof document === 'undefined') {
    return { canopyCoverage: 0, aspectRatio: 1, meanHue: 100, meanExG: 0, edgeComplexity: 0, canopyRoundness: 0 };
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return { canopyCoverage: 0, aspectRatio: 1, meanHue: 100, meanExG: 0, edgeComplexity: 0, canopyRoundness: 0 };
  }

  ctx.drawImage(source, 0, 0, width, height);
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const totalPixels = width * height;

  let foliagePixels = 0;
  let totalHue = 0;
  let totalExG = 0;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  // Simple Sobel horizontal/vertical edge accumulator for texture
  let edgeEnergy = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const sum = r + g + b;
      if (sum < 30) continue;

      const rNorm = r / sum;
      const gNorm = g / sum;
      const bNorm = b / sum;

      const exg = 2 * gNorm - rNorm - bNorm;
      const exgr = 3 * gNorm - 2.4 * rNorm - bNorm;
      const [h, s, v] = rgbToHsv(r, g, b);

      if (h >= 55 && h <= 165 && s >= 0.12 && v >= 0.12 && exg > 0.04 && exgr > 0.01) {
        foliagePixels++;
        totalHue += h;
        totalExG += exg;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;

        // Texture gradient (Sobel on green channel)
        const leftG = data[(y * width + (x - 1)) * 4 + 1];
        const rightG = data[(y * width + (x + 1)) * 4 + 1];
        const topG = data[((y - 1) * width + x) * 4 + 1];
        const botG = data[((y + 1) * width + x) * 4 + 1];

        const grad = Math.abs(rightG - leftG) + Math.abs(botG - topG);
        edgeEnergy += grad;
      }
    }
  }

  const canopyCoverage = parseFloat(((foliagePixels / totalPixels) * 100).toFixed(1));
  const meanHue = foliagePixels > 0 ? totalHue / foliagePixels : 100;
  const meanExG = foliagePixels > 0 ? totalExG / foliagePixels : 0;

  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);
  const aspectRatio = parseFloat((boxW / boxH).toFixed(2));
  const boundingArea = boxW * boxH;
  const canopyRoundness = boundingArea > 0 ? parseFloat((foliagePixels / boundingArea).toFixed(2)) : 0;

  // Normalized edge texture complexity
  const rawComplexity = foliagePixels > 0 ? edgeEnergy / (foliagePixels * 50) : 0;
  const edgeComplexity = parseFloat(Math.min(1.0, Math.max(0.05, rawComplexity)).toFixed(2));

  return {
    canopyCoverage,
    aspectRatio,
    meanHue,
    meanExG,
    edgeComplexity,
    canopyRoundness,
  };
}

/**
 * Compare extracted optical features with taxonomic reference profiles
 */
function scoreTaxonMatch(features: ExtractedFeatures, taxon: BotanicalTaxon): number {
  const m = taxon.morphology;

  // 1. Aspect ratio distance (normalized)
  const aspectDist = Math.abs(features.aspectRatio - m.typicalAspectRatio) / 1.5;
  const aspectScore = Math.max(0, 1.0 - aspectDist);

  // 2. Hue centroid distance
  const targetHueMid = (m.targetHueMin + m.targetHueMax) / 2;
  const hueTolerance = (m.targetHueMax - m.targetHueMin) / 2;
  const hueDist = Math.abs(features.meanHue - targetHueMid) / (hueTolerance * 1.5);
  const hueScore = Math.max(0, 1.0 - hueDist);

  // 3. Chlorophyll ExG distance
  const exgDist = Math.abs(features.meanExG - m.expectedExG) / 0.35;
  const exgScore = Math.max(0, 1.0 - exgDist);

  // 4. Edge complexity / leaf texture distance
  const edgeDist = Math.abs(features.edgeComplexity - m.edgeComplexity) / 0.6;
  const edgeScore = Math.max(0, 1.0 - edgeDist);

  // Weighted taxonomic similarity score
  const compositeScore = aspectScore * 0.25 + hueScore * 0.30 + exgScore * 0.25 + edgeScore * 0.20;

  // Scale to 0 - 100% confidence
  return Math.min(96, Math.max(10, Math.round(compositeScore * 96)));
}

/**
 * Primary Modular Plant Identification Service
 * Can be swapped with an external API (PlantNet/Plant.id/Cloud Vision) without UI rewrites.
 */
export async function identifyPlant(
  imageBase64: string
): Promise<PlantIdentificationResponse> {
  const timestamp = Date.now();

  if (typeof window === 'undefined' || !imageBase64) {
    return {
      status: 'error',
      rankedCandidates: [],
      overallConfidence: 0,
      confidenceLevel: 'uncertain',
      guidanceMessage: 'Invalid image data or non-browser execution environment.',
      timestamp,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const features = extractBotanicalFeatures(img);

      // Condition 1: No plant detected in frame
      if (features.canopyCoverage < 2.5) {
        resolve({
          status: 'no_plant_detected',
          rankedCandidates: [],
          overallConfidence: 0,
          confidenceLevel: 'uncertain',
          guidanceMessage: 'No plant detected in the camera frame. Please place a plant in view of the webcam.',
          timestamp,
          imageReference: imageBase64,
          extractedFeatures: {
            aspectRatio: features.aspectRatio,
            meanExG: parseFloat(features.meanExG.toFixed(3)),
            meanHue: Math.round(features.meanHue),
            edgeComplexity: features.edgeComplexity,
            canopyCoverage: features.canopyCoverage,
          },
        });
        return;
      }

      // Condition 2: Score all taxa in botanical database
      const candidates: PlantCandidate[] = BOTANICAL_DATABASE.map((taxon) => {
        const confidence = scoreTaxonMatch(features, taxon);
        return {
          id: taxon.id,
          commonName: taxon.commonName,
          scientificName: taxon.scientificName,
          family: taxon.family,
          confidence,
          description: taxon.description,
          targetProfile: taxon.targetProfile,
        };
      });

      // Sort by confidence descending
      candidates.sort((a, b) => b.confidence - a.confidence);

      const primary = candidates[0];
      const overallConfidence = primary ? primary.confidence : 0;

      // Condition 3: Low Confidence / Blurry / Ambiguous image
      if (overallConfidence < 48 || features.edgeComplexity < 0.12) {
        resolve({
          status: 'low_confidence',
          primaryCandidate: primary,
          rankedCandidates: candidates.slice(0, 3),
          overallConfidence,
          confidenceLevel: 'uncertain',
          guidanceMessage: 'Identification uncertain. Try a clearer image showing distinct leaf shape and good lighting.',
          timestamp,
          imageReference: imageBase64,
          extractedFeatures: {
            aspectRatio: features.aspectRatio,
            meanExG: parseFloat(features.meanExG.toFixed(3)),
            meanHue: Math.round(features.meanHue),
            edgeComplexity: features.edgeComplexity,
            canopyCoverage: features.canopyCoverage,
          },
        });
        return;
      }

      // Condition 4: Successful Identification
      const confidenceLevel = overallConfidence >= 75 ? 'high' : 'moderate';
      const guidanceMessage = confidenceLevel === 'high'
        ? `High confidence identification as ${primary.commonName}.`
        : `Moderate confidence. Review ranked candidates below.`;

      resolve({
        status: 'success',
        primaryCandidate: primary,
        rankedCandidates: candidates.slice(0, 3),
        overallConfidence,
        confidenceLevel,
        guidanceMessage,
        timestamp,
        imageReference: imageBase64,
        extractedFeatures: {
          aspectRatio: features.aspectRatio,
          meanExG: parseFloat(features.meanExG.toFixed(3)),
          meanHue: Math.round(features.meanHue),
          edgeComplexity: features.edgeComplexity,
          canopyCoverage: features.canopyCoverage,
        },
      });
    };

    img.onerror = () => {
      resolve({
        status: 'error',
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage: 'Failed to decode image snapshot for botanical analysis.',
        timestamp,
      });
    };

    img.src = imageBase64;
  });
}
