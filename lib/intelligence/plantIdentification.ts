// ============================================================
// HydroSmart — Botanical Species Identification Service
// Real ML Species Identification backed by In-Browser TFJS CNN
// Model: hydrosmart-plant-classifier-v1
// ============================================================

import { PlantCandidate, PlantIdentificationResponse, CropTargetProfile } from './types';
import {
  classifyPlantWithML,
  MLPlantClassificationResult,
  ClassifierOptions
} from '@/lib/vision/mlPlantClassifier';
import { BOTANICAL_DATABASE } from './botanicalDatabase';

const DEFAULT_AGRONOMIC_PROFILE: CropTargetProfile = {
  name: 'Hydroponic Crop',
  phMin: 5.5,
  phMax: 6.5,
  tdsMin: 800,
  tdsMax: 1200,
  idealWaterLevelMin: 40,
};

/**
 * Match a recognized botanical name with registered agronomic target profiles
 */
export function resolveAgronomicProfile(commonName: string, scientificName: string): CropTargetProfile {
  const normCommon = commonName.toLowerCase();
  const normSci = scientificName.toLowerCase();

  const matched = BOTANICAL_DATABASE.find(
    (taxon) =>
      normCommon.includes(taxon.commonName.toLowerCase()) ||
      taxon.commonName.toLowerCase().includes(normCommon) ||
      normSci.includes(taxon.scientificName.toLowerCase()) ||
      taxon.scientificName.toLowerCase().includes(normSci)
  );

  if (matched) {
    return matched.targetProfile;
  }

  return {
    ...DEFAULT_AGRONOMIC_PROFILE,
    name: commonName,
    scientificName,
  };
}

/**
 * Convert HTMLImageElement, HTMLCanvasElement, HTMLVideoElement, or Base64 into drawable target
 */
async function resolveDrawableSource(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | string
): Promise<HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | null> {
  if (typeof window === 'undefined') return null;

  if (typeof source !== 'string') {
    return source;
  }

  // If Base64/DataURL string, load into HTMLImageElement
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = source;
  });
}

/**
 * Primary Modular Plant Identification Service using In-Browser Deep Learning
 */
export async function identifyPlant(
  sourceInput: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | string,
  options: ClassifierOptions = {}
): Promise<PlantIdentificationResponse> {
  const timestamp = Date.now();

  if (typeof window === 'undefined' || !sourceInput) {
    return {
      status: 'error',
      rankedCandidates: [],
      overallConfidence: 0,
      confidenceLevel: 'uncertain',
      guidanceMessage: 'No image snapshot available for identification.',
      timestamp,
    };
  }

  const drawable = await resolveDrawableSource(sourceInput);
  if (!drawable) {
    return {
      status: 'error',
      rankedCandidates: [],
      overallConfidence: 0,
      confidenceLevel: 'uncertain',
      guidanceMessage: 'Failed to process image buffer for ML inference.',
      timestamp,
    };
  }

  try {
    // 1. Run real in-browser ML inference
    const mlResult: MLPlantClassificationResult = await classifyPlantWithML(drawable, options);

    // 2. Map ML candidates to PlantCandidate format
    const candidates: PlantCandidate[] = mlResult.rankedCandidates.map((c) => ({
      id: c.cropKey,
      commonName: c.commonName,
      scientificName: c.scientificName,
      family: c.family,
      confidence: c.confidencePercent,
      description: `${c.commonName} (${c.scientificName}) — Family: ${c.family}. ML Model: ${mlResult.modelVersion}.`,
      targetProfile: c.targetProfile,
    }));

    const top1 = mlResult.primaryCandidate ? candidates.find(c => c.id === mlResult.primaryCandidate?.cropKey) : undefined;
    const overallConfidence = mlResult.topConfidencePercent;

    const baseResponse: Omit<PlantIdentificationResponse, 'status' | 'guidanceMessage' | 'primaryCandidate'> = {
      rankedCandidates: candidates.slice(0, 4),
      overallConfidence,
      confidenceLevel:
        overallConfidence >= 80 ? 'high' : overallConfidence >= 55 ? 'moderate' : overallConfidence >= 35 ? 'low' : 'uncertain',
      timestamp,
      modelId: mlResult.modelId,
      modelVersion: mlResult.modelVersion,
      inferenceLatencyMs: mlResult.inferenceLatencyMs,
      imageReference: typeof sourceInput === 'string' ? sourceInput : undefined,
    };

    if (mlResult.state === 'IDENTIFIED' && top1) {
      return {
        ...baseResponse,
        status: 'success',
        primaryCandidate: top1,
        guidanceMessage: `Confirmed identification as ${top1.commonName} (${top1.scientificName}) · ${overallConfidence}% ML confidence.`,
      };
    }

    if (mlResult.state === 'LOW_CONFIDENCE') {
      return {
        ...baseResponse,
        status: 'low_confidence',
        primaryCandidate: undefined,
        guidanceMessage: mlResult.guidanceMessage,
      };
    }

    if (mlResult.state === 'UNKNOWN_PLANT') {
      return {
        ...baseResponse,
        status: 'unknown_plant',
        primaryCandidate: undefined,
        guidanceMessage: mlResult.guidanceMessage,
      };
    }

    if (mlResult.state === 'MODEL_UNAVAILABLE') {
      return {
        ...baseResponse,
        status: 'model_unavailable',
        primaryCandidate: undefined,
        guidanceMessage: mlResult.guidanceMessage,
      };
    }

    return {
      ...baseResponse,
      status: 'error',
      primaryCandidate: undefined,
      guidanceMessage: 'Botanical classification could not be completed.',
    };
  } catch (err) {
    console.error('[identifyPlant] In-browser ML classification error:', err);
    return {
      status: 'error',
      rankedCandidates: [],
      overallConfidence: 0,
      confidenceLevel: 'uncertain',
      guidanceMessage: 'An error occurred during botanical species inference.',
      timestamp,
      imageReference: typeof sourceInput === 'string' ? sourceInput : undefined,
    };
  }
}
