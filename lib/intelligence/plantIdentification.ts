// ============================================================
// HydroSmart — Botanical Species Identification Service
// Real ML Species Identification backed by Pl@ntNet / PlantCLEF
// ============================================================

import { PlantCandidate, PlantIdentificationResponse, CropTargetProfile } from './types';
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
function resolveAgronomicProfile(commonName: string, scientificName: string): CropTargetProfile {
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
 * Primary Modular Plant Identification Service
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
      guidanceMessage: 'No image snapshot available for identification.',
      timestamp,
    };
  }

  try {
    const res = await fetch('/api/plant-identification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64, organ: 'leaf' }),
    });

    if (!res.ok) {
      return {
        status: 'error',
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage: `Botanical identification service returned error (${res.status}).`,
        timestamp,
        imageReference: imageBase64,
      };
    }

    const data = await res.json();

    if (data.status === 'unconfigured_api') {
      return {
        status: 'low_confidence',
        primaryCandidate: undefined,
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage:
          'Pl@ntNet API Key is not set in server environment. Set PLANTNET_API_KEY in .env.local to enable live model identification.',
        timestamp,
        imageReference: imageBase64,
      };
    }

    const candidates: PlantCandidate[] = (data.rankedCandidates || []).map(
      (c: {
        id: string;
        commonName: string;
        scientificName: string;
        family: string;
        confidence: number;
        similarityScore: number;
      }) => {
        const targetProfile = resolveAgronomicProfile(c.commonName, c.scientificName);
        return {
          id: c.id,
          commonName: c.commonName,
          scientificName: c.scientificName,
          family: c.family,
          confidence: c.confidence,
          description: `${c.commonName} (${c.scientificName}) — Family: ${c.family}. Pl@ntNet ML confidence: ${c.confidence}%.`,
          targetProfile,
        };
      }
    );

    const top1 = candidates[0];
    const overallConfidence = data.overallConfidence || 0;

    if (data.status === 'success' && top1 && overallConfidence >= 70) {
      return {
        status: 'success',
        primaryCandidate: top1,
        rankedCandidates: candidates.slice(0, 3),
        overallConfidence,
        confidenceLevel: overallConfidence >= 80 ? 'high' : 'moderate',
        guidanceMessage: `Confirmed identification as ${top1.commonName} (${top1.scientificName}) · ${overallConfidence}% ML confidence.`,
        timestamp,
        imageReference: imageBase64,
      };
    }

    return {
      status: 'low_confidence',
      primaryCandidate: undefined, // Reject declaring a forced species
      rankedCandidates: candidates.slice(0, 3),
      overallConfidence,
      confidenceLevel: overallConfidence >= 45 ? 'moderate' : 'uncertain',
      guidanceMessage:
        top1
          ? `Plant detected, but species could not be identified confidently (${top1.commonName} ~${overallConfidence}%).`
          : 'Unknown or unsupported botanical species.',
      timestamp,
      imageReference: imageBase64,
    };
  } catch (err) {
    console.error('[identifyPlant] Network or processing error:', err);
    return {
      status: 'error',
      rankedCandidates: [],
      overallConfidence: 0,
      confidenceLevel: 'uncertain',
      guidanceMessage: 'Failed to connect to the botanical identification service.',
      timestamp,
      imageReference: imageBase64,
    };
  }
}
