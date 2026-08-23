// ============================================================
// HydroSmart — Botanical Species Identification & Unknown Class Handler
// Strict Calibrated Confidence & Ambiguity Rejection Engine
// ============================================================

import {
  PlantIdentificationResult,
  PlantIdentificationCandidate,
  VisionConfidenceLevel
} from './types';
import { BOTANICAL_DATABASE, BotanicalTaxon } from '@/lib/intelligence/botanicalDatabase';

export interface BotanicalFeatures {
  canopyCoverage: number;
  aspectRatio: number;
  meanHue: number;
  meanExG: number;
  edgeComplexity: number;
  canopyRoundness: number;
}

/**
 * Score Taxon Match using Normalized Euclidean Distance
 */
export function scoreTaxonMatch(features: BotanicalFeatures, taxon: BotanicalTaxon): number {
  const m = taxon.morphology;
  const targetHueMid = (m.targetHueMin + m.targetHueMax) / 2;
  const hueTolerance = (m.targetHueMax - m.targetHueMin) / 2;

  // Normalized distance across dimensions
  const dHue = Math.abs(features.meanHue - targetHueMid) / Math.max(12, hueTolerance);
  const dAspect = Math.abs(features.aspectRatio - m.typicalAspectRatio) / 0.35;
  const dExg = Math.abs(features.meanExG - m.expectedExG) / 0.12;
  const dEdge = Math.abs(features.edgeComplexity - m.edgeComplexity) / 0.18;
  const dRound = Math.abs(features.canopyRoundness - m.canopyRoundness) / 0.20;

  // Weighted Euclidean norm
  const distance = Math.sqrt(
    0.25 * (dHue * dHue) +
    0.20 * (dAspect * dAspect) +
    0.20 * (dExg * dExg) +
    0.20 * (dEdge * dEdge) +
    0.15 * (dRound * dRound)
  );

  // Exponential decay similarity scaled to 0 - 100%
  const similarity = Math.max(0, Math.min(1.0, Math.exp(-distance / 1.1)));
  return Math.round(similarity * 100);
}

/**
 * Map similarity score (0 - 100) to calibrated confidence level
 */
export function getCalibratedConfidence(score: number): {
  level: VisionConfidenceLevel;
  normalized: number;
} {
  const normalized = parseFloat((score / 100).toFixed(2));
  if (normalized >= 0.80) return { level: 'high', normalized };
  if (normalized >= 0.60) return { level: 'medium', normalized };
  if (normalized >= 0.40) return { level: 'low', normalized };
  return { level: 'insufficient', normalized };
}

/**
 * Identify species with strict unknown-plant rejection
 */
export function identifyPlantSpecies(
  features: BotanicalFeatures,
  isAcceptableImage = true
): PlantIdentificationResult {
  // Condition 1: No plant visible in frame
  if (features.canopyCoverage < 2.5) {
    return {
      status: 'NO_PLANT',
      primarySpecies: null,
      confidenceScore: 0,
      confidenceLevel: 'insufficient',
      rankedCandidates: [],
      guidanceMessage: 'No plant detected in the camera frame. Position a plant within the optical view.',
      extractedFeatures: {
        canopyCoverage: features.canopyCoverage,
        aspectRatio: features.aspectRatio,
        meanHue: Math.round(features.meanHue),
        meanExG: parseFloat(features.meanExG.toFixed(3)),
        edgeComplexity: features.edgeComplexity,
      },
    };
  }

  // Score all botanical taxa
  const scoredCandidates: PlantIdentificationCandidate[] = BOTANICAL_DATABASE.map((taxon) => {
    const rawMatch = scoreTaxonMatch(features, taxon);
    const { level, normalized } = getCalibratedConfidence(rawMatch);
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

  // Sort descending by similarity
  scoredCandidates.sort((a, b) => b.similarityScore - a.similarityScore);

  const top1 = scoredCandidates[0];
  const top2 = scoredCandidates[1];

  // Condition 2: Ambiguous or Low Match -> Reject forced classification
  const isAmbiguous = top1 && top2 && (top1.similarityScore - top2.similarityScore) < 0.06 && top1.similarityScore < 0.75;
  const isInsufficient = !top1 || top1.similarityScore < 0.55 || !isAcceptableImage;

  if (isInsufficient || isAmbiguous) {
    return {
      status: 'UNKNOWN_PLANT',
      primarySpecies: null,
      confidenceScore: top1 ? top1.similarityScore : 0,
      confidenceLevel: 'insufficient',
      rankedCandidates: scoredCandidates.slice(0, 3),
      guidanceMessage: isAmbiguous
        ? `Optical features are ambiguous between multiple species. Classified as Unknown Crop.`
        : 'Botanical features do not match registered hydroponic profiles with sufficient confidence.',
      extractedFeatures: {
        canopyCoverage: features.canopyCoverage,
        aspectRatio: features.aspectRatio,
        meanHue: Math.round(features.meanHue),
        meanExG: parseFloat(features.meanExG.toFixed(3)),
        edgeComplexity: features.edgeComplexity,
      },
    };
  }

  // Condition 3: Low Confidence identification
  if (top1.similarityScore < 0.65) {
    return {
      status: 'LOW_CONFIDENCE',
      primarySpecies: top1.commonName,
      scientificName: top1.scientificName,
      confidenceScore: top1.similarityScore,
      confidenceLevel: 'low',
      rankedCandidates: scoredCandidates.slice(0, 3),
      guidanceMessage: `Moderate resemblance to ${top1.commonName} (${(top1.similarityScore * 100).toFixed(0)}%), but confidence is low. Verify manually.`,
      extractedFeatures: {
        canopyCoverage: features.canopyCoverage,
        aspectRatio: features.aspectRatio,
        meanHue: Math.round(features.meanHue),
        meanExG: parseFloat(features.meanExG.toFixed(3)),
        edgeComplexity: features.edgeComplexity,
      },
    };
  }

  // Condition 4: Known Species Identified
  return {
    status: 'KNOWN_PLANT',
    primarySpecies: top1.commonName,
    scientificName: top1.scientificName,
    confidenceScore: top1.similarityScore,
    confidenceLevel: top1.confidenceLevel,
    rankedCandidates: scoredCandidates.slice(0, 3),
    guidanceMessage: `High confidence optical match with ${top1.commonName} (${top1.scientificName}).`,
    extractedFeatures: {
      canopyCoverage: features.canopyCoverage,
      aspectRatio: features.aspectRatio,
      meanHue: Math.round(features.meanHue),
      meanExG: parseFloat(features.meanExG.toFixed(3)),
      edgeComplexity: features.edgeComplexity,
    },
  };
}
