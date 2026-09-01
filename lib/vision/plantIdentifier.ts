// ============================================================
// HydroSmart — Botanical Species Identification Service
// Calls Server-Side Pl@ntNet API with High-Resolution Plant Cropping
// Supports Offline Fallback via Normalized Euclidean Taxonomy
// ============================================================

import {
  PlantIdentificationResult,
  PlantIdentificationCandidate,
  VisionConfidenceLevel
} from './types';
import { BoundingBox } from './plantDetector';
import { BOTANICAL_DATABASE, BotanicalTaxon } from '@/lib/intelligence/botanicalDatabase';

export interface CropOptions {
  boundingBox?: BoundingBox;
  targetMaxDimension?: number;
  quality?: number;
}

export interface BotanicalFeatures {
  canopyCoverage: number;
  aspectRatio: number;
  meanHue: number;
  meanExG: number;
  edgeComplexity: number;
  canopyRoundness: number;
}

/**
 * Score Taxon Match using Normalized Euclidean Distance (Offline fallback)
 */
export function scoreTaxonMatch(features: BotanicalFeatures, taxon: BotanicalTaxon): number {
  const m = taxon.morphology;
  const targetHueMid = (m.targetHueMin + m.targetHueMax) / 2;
  const hueTolerance = (m.targetHueMax - m.targetHueMin) / 2;

  const dHue = Math.abs(features.meanHue - targetHueMid) / Math.max(12, hueTolerance);
  const dAspect = Math.abs(features.aspectRatio - m.typicalAspectRatio) / 0.35;
  const dExg = Math.abs(features.meanExG - m.expectedExG) / 0.12;
  const dEdge = Math.abs(features.edgeComplexity - m.edgeComplexity) / 0.18;
  const dRound = Math.abs(features.canopyRoundness - m.canopyRoundness) / 0.20;

  const distance = Math.sqrt(
    0.25 * (dHue * dHue) +
    0.20 * (dAspect * dAspect) +
    0.20 * (dExg * dExg) +
    0.20 * (dEdge * dEdge) +
    0.15 * (dRound * dRound)
  );

  const similarity = Math.max(0, Math.min(1.0, Math.exp(-distance / 1.1)));
  return Math.round(similarity * 100);
}

/**
 * Offline botanical species identifier
 */
export function identifyPlantSpecies(
  features: BotanicalFeatures,
  isAcceptableImage = true
): PlantIdentificationResult {
  if (features.canopyCoverage < 2.5 || !isAcceptableImage) {
    return {
      status: 'NO_PLANT',
      primarySpecies: null,
      confidenceScore: 0,
      confidenceLevel: 'insufficient',
      rankedCandidates: [],
      guidanceMessage: 'No plant detected in the camera frame. Position a plant within the optical view.',
      source: 'fallback',
      extractedFeatures: {
        canopyCoverage: features.canopyCoverage,
        aspectRatio: features.aspectRatio,
        meanHue: Math.round(features.meanHue),
        meanExG: parseFloat(features.meanExG.toFixed(3)),
        edgeComplexity: features.edgeComplexity,
      },
    };
  }

  const scoredCandidates: PlantIdentificationCandidate[] = BOTANICAL_DATABASE.map((taxon) => {
    const rawMatch = scoreTaxonMatch(features, taxon);
    const normalized = parseFloat((rawMatch / 100).toFixed(2));
    let level: VisionConfidenceLevel = 'insufficient';
    if (normalized >= 0.80) level = 'high';
    else if (normalized >= 0.60) level = 'medium';
    else if (normalized >= 0.40) level = 'low';

    return {
      id: taxon.id,
      commonName: taxon.commonName,
      scientificName: taxon.scientificName,
      family: taxon.family,
      similarityScore: normalized,
      confidenceLevel: level,
      description: taxon.description,
    };
  });

  scoredCandidates.sort((a, b) => b.similarityScore - a.similarityScore);

  const top1 = scoredCandidates[0];
  const top2 = scoredCandidates[1];
  const margin = top1 && top2 ? top1.similarityScore - top2.similarityScore : 0;
  const isAccepted = top1 && top1.similarityScore >= 0.60 && (margin >= 0.06 || top1.similarityScore >= 0.80);

  if (!isAccepted || !top1) {
    return {
      status: 'UNKNOWN_PLANT',
      primarySpecies: null,
      confidenceScore: top1 ? top1.similarityScore : 0,
      confidenceLevel: top1 ? top1.confidenceLevel : 'insufficient',
      rankedCandidates: scoredCandidates.slice(0, 3),
      guidanceMessage: 'Plant resemblance to registered species is uncertain. Operating in Generic Mode.',
      source: 'fallback',
      extractedFeatures: {
        canopyCoverage: features.canopyCoverage,
        aspectRatio: features.aspectRatio,
        meanHue: Math.round(features.meanHue),
        meanExG: parseFloat(features.meanExG.toFixed(3)),
        edgeComplexity: features.edgeComplexity,
      },
    };
  }

  return {
    status: 'KNOWN_PLANT',
    primarySpecies: top1.commonName,
    scientificName: top1.scientificName,
    family: top1.family,
    confidenceScore: top1.similarityScore,
    confidenceLevel: top1.confidenceLevel,
    rankedCandidates: scoredCandidates.slice(0, 3),
    guidanceMessage: `High confidence match as ${top1.commonName} (${top1.scientificName}).`,
    source: 'fallback',
    extractedFeatures: {
      canopyCoverage: features.canopyCoverage,
      aspectRatio: features.aspectRatio,
      meanHue: Math.round(features.meanHue),
      meanExG: parseFloat(features.meanExG.toFixed(3)),
      edgeComplexity: features.edgeComplexity,
    },
  };
}

/**
 * Crop and compress a plant region from a video/canvas element
 */
export function cropPlantRegion(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  options: CropOptions = {}
): string | null {
  if (typeof document === 'undefined') return null;

  const { boundingBox, targetMaxDimension = 800, quality = 0.88 } = options;

  let srcWidth = 0;
  let srcHeight = 0;

  if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
    srcWidth = source.videoWidth;
    srcHeight = source.videoHeight;
  } else if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
    srcWidth = source.width;
    srcHeight = source.height;
  } else if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
    srcWidth = source.naturalWidth || source.width;
    srcHeight = source.naturalHeight || source.height;
  }

  if (srcWidth === 0 || srcHeight === 0) return null;

  let sx = 0;
  let sy = 0;
  let sw = srcWidth;
  let sh = srcHeight;

  if (boundingBox) {
    sx = Math.max(0, Math.floor(boundingBox.x * srcWidth));
    sy = Math.max(0, Math.floor(boundingBox.y * srcHeight));
    sw = Math.min(srcWidth - sx, Math.ceil(boundingBox.width * srcWidth));
    sh = Math.min(srcHeight - sy, Math.ceil(boundingBox.height * srcHeight));
  }

  if (sw <= 10 || sh <= 10) {
    sx = 0;
    sy = 0;
    sw = srcWidth;
    sh = srcHeight;
  }

  let outW = sw;
  let outH = sh;
  if (outW > targetMaxDimension || outH > targetMaxDimension) {
    if (outW >= outH) {
      outH = Math.round((outH * targetMaxDimension) / outW);
      outW = targetMaxDimension;
    } else {
      outW = Math.round((outW * targetMaxDimension) / outH);
      outH = targetMaxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Identify plant species using the Pl@ntNet / PlantCLEF ML API
 */
export async function identifyPlantWithML(
  imagePayload: string,
  organ: 'leaf' | 'flower' | 'auto' = 'leaf'
): Promise<PlantIdentificationResult> {
  if (!imagePayload) {
    return {
      status: 'NO_PLANT',
      primarySpecies: null,
      confidenceScore: 0,
      confidenceLevel: 'insufficient',
      rankedCandidates: [],
      guidanceMessage: 'No image snapshot available for identification.',
      source: 'offline',
    };
  }

  try {
    const res = await fetch('/api/plant-identification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imagePayload, organ }),
    });

    if (!res.ok) {
      return {
        status: 'ERROR',
        primarySpecies: null,
        confidenceScore: 0,
        confidenceLevel: 'insufficient',
        rankedCandidates: [],
        guidanceMessage: `Botanical identification service returned status ${res.status}.`,
        source: 'plantnet_api',
      };
    }

    const data = await res.json();

    const candidates: PlantIdentificationCandidate[] = (data.rankedCandidates || []).map(
      (c: {
        id: string;
        commonName: string;
        scientificName: string;
        family: string;
        similarityScore: number;
        confidence: number;
        confidenceLevel?: VisionConfidenceLevel;
      }) => ({
        id: c.id,
        commonName: c.commonName,
        scientificName: c.scientificName,
        family: c.family,
        similarityScore: c.similarityScore,
        confidenceLevel: c.confidenceLevel || (c.confidence >= 75 ? 'high' : c.confidence >= 50 ? 'medium' : 'low'),
        description: `${c.commonName} (${c.scientificName}) — ${c.confidence}% model certainty.`,
      })
    );

    let status: PlantIdentificationResult['status'] = 'LOW_CONFIDENCE';
    if (data.status === 'success' && data.primaryCandidate) {
      status = 'KNOWN_PLANT';
    } else if (data.status === 'unconfigured_api') {
      status = 'UNKNOWN_PLANT';
    }

    return {
      status,
      primarySpecies: data.primaryCandidate ? data.primaryCandidate.commonName : null,
      scientificName: data.primaryCandidate ? data.primaryCandidate.scientificName : undefined,
      family: data.primaryCandidate ? data.primaryCandidate.family : undefined,
      confidenceScore: data.overallConfidence / 100,
      confidenceLevel: data.confidenceLevel || 'insufficient',
      rankedCandidates: candidates,
      guidanceMessage: data.guidanceMessage || 'Plant identification completed.',
      source: data.source || 'plantnet_api',
    };
  } catch (err) {
    console.error('[identifyPlantWithML] Error calling API:', err);
    return {
      status: 'ERROR',
      primarySpecies: null,
      confidenceScore: 0,
      confidenceLevel: 'insufficient',
      rankedCandidates: [],
      guidanceMessage: 'Could not connect to the botanical identification server.',
      source: 'offline',
    };
  }
}
