// ============================================================
// HydroSmart — Botanical Taxonomy & Crop Database
// Morphological Signatures & Hydroponic Growth Parameters
// ============================================================

import { CropTargetProfile } from './types';

export interface BotanicalTaxon {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  description: string;
  // Morphological & Optical Reference Signatures
  morphology: {
    typicalAspectRatio: number; // Width / Height of leaf clusters (e.g. 0.8 - 1.6)
    targetHueMin: number;       // In HSV degrees (55 - 165)
    targetHueMax: number;
    expectedExG: number;        // Typical Excess Green value (0.15 - 0.50)
    edgeComplexity: number;     // Texture / edge density index (0.1 - 0.9)
    canopyRoundness: number;    // Circularity of canopy spread (0.2 - 0.9)
  };
  targetProfile: CropTargetProfile;
}

export const BOTANICAL_DATABASE: BotanicalTaxon[] = [
  {
    id: 'sweet_basil',
    commonName: 'Sweet Basil',
    scientificName: 'Ocimum basilicum',
    family: 'Lamiaceae',
    description: 'Aromatic tender herb with glossy, cup-shaped broad green leaves. Highly responsive to hydroponic nutrient dosing.',
    morphology: {
      typicalAspectRatio: 1.15,
      targetHueMin: 80,
      targetHueMax: 135,
      expectedExG: 0.32,
      edgeComplexity: 0.38,
      canopyRoundness: 0.72,
    },
    targetProfile: {
      name: 'Sweet Basil (Ocimum basilicum)',
      scientificName: 'Ocimum basilicum',
      phMin: 5.5,
      phMax: 6.5,
      tdsMin: 700,
      tdsMax: 1120,
      idealWaterLevelMin: 25,
      optimalTempMin: 20,
      optimalTempMax: 28,
    },
  },
  {
    id: 'butterhead_lettuce',
    commonName: 'Butterhead Lettuce',
    scientificName: 'Lactuca sativa var. capitata',
    family: 'Asteraceae',
    description: 'Fast-growing leafy green forming loose, tender rosette heads. Classic nutrient film technique (NFT) crop.',
    morphology: {
      typicalAspectRatio: 1.35,
      targetHueMin: 75,
      targetHueMax: 130,
      expectedExG: 0.38,
      edgeComplexity: 0.28,
      canopyRoundness: 0.85,
    },
    targetProfile: {
      name: 'Butterhead Lettuce (Lactuca sativa)',
      scientificName: 'Lactuca sativa',
      phMin: 5.5,
      phMax: 6.5,
      tdsMin: 800,
      tdsMax: 1200,
      idealWaterLevelMin: 25,
      optimalTempMin: 18,
      optimalTempMax: 24,
    },
  },
  {
    id: 'roma_tomato',
    commonName: 'Tomato',
    scientificName: 'Solanum lycopersicum',
    family: 'Solanaceae',
    description: 'Vigorous fruiting vine with pinnately compound serrated leaves and high heavy-feeding nutrient requirements.',
    morphology: {
      typicalAspectRatio: 0.85,
      targetHueMin: 90,
      targetHueMax: 145,
      expectedExG: 0.29,
      edgeComplexity: 0.68,
      canopyRoundness: 0.48,
    },
    targetProfile: {
      name: 'Tomato (Solanum lycopersicum)',
      scientificName: 'Solanum lycopersicum',
      phMin: 5.8,
      phMax: 6.8,
      tdsMin: 1400,
      tdsMax: 3200,
      idealWaterLevelMin: 30,
      optimalTempMin: 20,
      optimalTempMax: 26,
    },
  },
  {
    id: 'baby_spinach',
    commonName: 'Spinach',
    scientificName: 'Spinacia oleracea',
    family: 'Amaranthaceae',
    description: 'Nutrient-rich cool-season crop with deep dark-green ovate foliage. Sensitive to elevated electrical conductivity.',
    morphology: {
      typicalAspectRatio: 0.95,
      targetHueMin: 95,
      targetHueMax: 155,
      expectedExG: 0.42,
      edgeComplexity: 0.44,
      canopyRoundness: 0.65,
    },
    targetProfile: {
      name: 'Spinach (Spinacia oleracea)',
      scientificName: 'Spinacia oleracea',
      phMin: 6.0,
      phMax: 7.0,
      tdsMin: 1260,
      tdsMax: 1610,
      idealWaterLevelMin: 25,
      optimalTempMin: 15,
      optimalTempMax: 20,
    },
  },
  {
    id: 'peppermint',
    commonName: 'Peppermint',
    scientificName: 'Mentha x piperita',
    family: 'Lamiaceae',
    description: 'Fast-spreading perennial herb with lanceolate toothed leaves and robust root-zone vigor in water culture.',
    morphology: {
      typicalAspectRatio: 1.05,
      targetHueMin: 85,
      targetHueMax: 140,
      expectedExG: 0.35,
      edgeComplexity: 0.58,
      canopyRoundness: 0.60,
    },
    targetProfile: {
      name: 'Peppermint (Mentha x piperita)',
      scientificName: 'Mentha x piperita',
      phMin: 5.5,
      phMax: 6.5,
      tdsMin: 850,
      tdsMax: 1250,
      idealWaterLevelMin: 25,
      optimalTempMin: 18,
      optimalTempMax: 25,
    },
  },
  {
    id: 'curly_kale',
    commonName: 'Curly Kale',
    scientificName: 'Brassica oleracea var. sabellica',
    family: 'Brassicaceae',
    description: 'Hearty cruciferous crop with highly frilled, fibrous dark blue-green ruffled leaves and high calcium demand.',
    morphology: {
      typicalAspectRatio: 1.20,
      targetHueMin: 100,
      targetHueMax: 160,
      expectedExG: 0.36,
      edgeComplexity: 0.82,
      canopyRoundness: 0.52,
    },
    targetProfile: {
      name: 'Curly Kale (Brassica oleracea)',
      scientificName: 'Brassica oleracea',
      phMin: 6.0,
      phMax: 6.8,
      tdsMin: 1100,
      tdsMax: 1800,
      idealWaterLevelMin: 25,
      optimalTempMin: 16,
      optimalTempMax: 22,
    },
  },
  {
    id: 'hydro_strawberry',
    commonName: 'Strawberry',
    scientificName: 'Fragaria x ananassa',
    family: 'Rosaceae',
    description: 'Trifoliate serrated leaves with runner stems and high potassium requirement during flowering/fruiting cycles.',
    morphology: {
      typicalAspectRatio: 1.25,
      targetHueMin: 85,
      targetHueMax: 145,
      expectedExG: 0.30,
      edgeComplexity: 0.62,
      canopyRoundness: 0.58,
    },
    targetProfile: {
      name: 'Strawberry (Fragaria x ananassa)',
      scientificName: 'Fragaria x ananassa',
      phMin: 5.5,
      phMax: 6.5,
      tdsMin: 700,
      tdsMax: 1200,
      idealWaterLevelMin: 25,
      optimalTempMin: 18,
      optimalTempMax: 24,
    },
  },
  {
    id: 'bell_pepper',
    commonName: 'Bell Pepper',
    scientificName: 'Capsicum annuum',
    family: 'Solanaceae',
    description: 'Upright branching shrub with smooth, elliptic to lanceolate leaves and moderate nutrient uptake.',
    morphology: {
      typicalAspectRatio: 0.90,
      targetHueMin: 85,
      targetHueMax: 135,
      expectedExG: 0.31,
      edgeComplexity: 0.40,
      canopyRoundness: 0.64,
    },
    targetProfile: {
      name: 'Bell Pepper (Capsicum annuum)',
      scientificName: 'Capsicum annuum',
      phMin: 5.8,
      phMax: 6.5,
      tdsMin: 1200,
      tdsMax: 1900,
      idealWaterLevelMin: 25,
      optimalTempMin: 20,
      optimalTempMax: 27,
    },
  }
];
