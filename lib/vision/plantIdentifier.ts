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
 * Score Taxon Match against botanical database profiles
 */
function scoreTaxonMatch(features: BotanicalFeatures, taxon: BotanicalTaxon): number {
  const m = taxon.morphology;
  const targetHueMid = (m.targetHueMin + m.targetHueMax) / 2;
  const hueTolerance = (m.targetHueMax - m.targetHueMin) / 2;

  // 1. Hue Score (Weight: 25%)
  const hueDiff = Math.abs(features.meanHue - targetHueMid);
  const hueScore = Math.max(0, 100 - (hueDiff / Math.max(10, hueTolerance)) * 100);

  // 2. Aspect Ratio Score (Weight: 20%)
  const arDiff = Math.abs(features.aspectRatio - m.typicalAspectRatio);
  const arScore = Math.max(0, 100 - (arDiff / 0.8) * 100);

  // 3. Edge Complexity / Leaf Margin Score (Weight: 25%)
  const edgeDiff = Math.abs(features.edgeComplexity - m.edgeComplexity);
  const edgeScore = Math.max(0, 100 - (edgeDiff / 0.3) * 100);

  // 4. Excess Green / Pigment Score (Weight: 15%)
  const exgDiff = Math.abs(features.meanExG - m.expectedExG);
  const exgScore = Math.max(0, 100 - (exgDiff / 0.25) * 100);

  // 5. Canopy Roundness Score (Weight: 15%)
  const roundDiff = Math.abs(features.canopyRoundness - m.canopyRoundness);
  const roundScore = Math.max(0, 100 - (roundDiff / 0.4) * 100);

  const rawScore = (
    hueScore * 0.25 +
    arScore * 0.20 +
    edgeScore * 0.25 +
    exgScore * 0.15 +
    roundScore * 0.15
  );

  return parseFloat(Math.min(100, Math.max(0, rawScore)).toFixed(1));
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
  const isAmbiguous = top1 && top2 && (top1.similarityScore - top2.similarityScore) < 0.05 && top1.similarityScore < 0.70;
  const isInsufficient = !top1 || top1.similarityScore < 0.40 || !isAcceptableImage;

  if (isInsufficient || isAmbiguous) {
    return {
      status: 'UNKNOWN_PLANT',
      primarySpecies: null,
      confidenceScore: top1 ? top1.similarityScore : 0,
      confidenceLevel: 'insufficient',
      rankedCandidates: scoredCandidates.slice(0, 3),
      guidanceMessage: isAmbiguous
        ? 'Morphological features are ambiguous between multiple species. Plant classified as Unknown.'
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
  if (top1.similarityScore < 0.60) {
    return {
      status: 'LOW_CONFIDENCE',
      primarySpecies: top1.commonName,
      scientificName: top1.scientificName,
      confidenceScore: top1.similarityScore,
      confidenceLevel: 'low',
      rankedCandidates: scoredCandidates.slice(0, 3),
      guidanceMessage: `Possible resemblance to ${top1.commonName}, but confidence is low. Verify manually.`,
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
