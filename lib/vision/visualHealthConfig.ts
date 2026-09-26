// ============================================================
// HydroSmart — Configurable Visual Plant Health Parameters
// Tunable computer vision and agronomic heuristic thresholds
// ============================================================

export interface VisualHealthConfig {
  // Chlorosis (Yellowing) Foliar Thresholds (%)
  chlorosisNominalMax: number;          // Canopy yellowing below this is considered normal
  chlorosisWarningThreshold: number;    // Exceeding triggers ATTENTION state
  chlorosisCriticalThreshold: number;   // Exceeding triggers CRITICAL state

  // Necrosis (Browning / Tip Burn) Foliar Thresholds (%)
  necrosisNominalMax: number;           // Canopy browning below this is considered normal
  necrosisWarningThreshold: number;     // Exceeding triggers ATTENTION state
  necrosisCriticalThreshold: number;    // Exceeding triggers CRITICAL state

  // Surface Texture / Spotting / Mottling Gradient Thresholds
  textureNominalMax: number;            // Average Sobel-like gradient variance
  textureWarningThreshold: number;      // High localized variance indicates spots or lesions

  // Canopy Morphology & Structural Posture
  wiltingAspectRatioMin: number;        // Normal upright foliage width/height ratio lower bound
  wiltingAspectRatioMax: number;        // Normal upright foliage width/height ratio upper bound
  canopyDensityMin: number;             // Minimum ratio of foliage to bounding box before flagging droop
  canopyDropWarningPercent: number;     // Relative canopy contraction (% drop from baseline)
  canopyDropCriticalPercent: number;    // Severe canopy contraction (% drop from baseline)

  // Recovery Dynamics
  recoveryImprovementDelta: number;     // Minimum % reduction in stress/yellowing or score rise for RECOVERING

  // Temporal Smoothing & Stability
  temporalWindowSize: number;           // Number of recent frames/observations evaluated
  minVotesForStateChange: number;       // Consecutive or majority votes required to alter health state

  // Optical Quality Bounds (Gating)
  minMeanLuma: number;                  // Minimum acceptable brightness (underexposure gate)
  maxMeanLuma: number;                  // Maximum acceptable brightness (overexposure gate)
  minSharpnessScore: number;            // Minimum Laplacian-like edge sharpness (blur gate)
  minCanopyCoveragePercent: number;     // Minimum canopy % of frame required for health analysis
}

export const VISUAL_HEALTH_CONFIG: VisualHealthConfig = {
  // Chlorosis (Yellowing)
  chlorosisNominalMax: 6.0,
  chlorosisWarningThreshold: 12.0,
  chlorosisCriticalThreshold: 25.0,

  // Necrosis (Browning / Tip Burn)
  necrosisNominalMax: 2.0,
  necrosisWarningThreshold: 4.0,
  necrosisCriticalThreshold: 8.0,

  // Texture Mottling
  textureNominalMax: 22.0,
  textureWarningThreshold: 32.0,

  // Canopy Posture & Structural Dynamics
  wiltingAspectRatioMin: 0.55,
  wiltingAspectRatioMax: 2.10,
  canopyDensityMin: 0.30,
  canopyDropWarningPercent: -15.0,
  canopyDropCriticalPercent: -30.0,

  // Recovery
  recoveryImprovementDelta: 5.0,

  // Temporal Smoothing
  temporalWindowSize: 5,
  minVotesForStateChange: 2,

  // Optical Quality
  minMeanLuma: 30.0,
  maxMeanLuma: 225.0,
  minSharpnessScore: 10.0,
  minCanopyCoveragePercent: 2.5,
};

// Species-specific baseline visual adaptations (when species is identified)
export interface SpeciesVisualProfile {
  cropKey: string;
  expectedExG: number;
  expectedTextureGradient: number;
  chlorosisToleranceOffset: number;
  notes: string;
}

export const SPECIES_VISUAL_PROFILES: Record<string, SpeciesVisualProfile> = {
  sweet_basil: {
    cropKey: 'sweet_basil',
    expectedExG: 0.12,
    expectedTextureGradient: 18.0, // Smooth broad leaves
    chlorosisToleranceOffset: 0.0,
    notes: 'Smooth, shiny foliage with uniform green chlorophyll distribution',
  },
  butterhead_lettuce: {
    cropKey: 'butterhead_lettuce',
    expectedExG: 0.10,
    expectedTextureGradient: 22.0, // Soft folds
    chlorosisToleranceOffset: 2.0, // Slightly lighter green naturally
    notes: 'Tender open rosette with pale to vibrant green inner leaves',
  },
  curly_kale: {
    cropKey: 'curly_kale',
    expectedExG: 0.11,
    expectedTextureGradient: 36.0, // High natural edge texture due to frills
    chlorosisToleranceOffset: -1.0, // Naturally dark green
    notes: 'Deep green frilled leaves with naturally high textural edge complexity',
  },
  spearmint: {
    cropKey: 'spearmint',
    expectedExG: 0.11,
    expectedTextureGradient: 26.0, // Serrated leaf margins
    chlorosisToleranceOffset: 0.0,
    notes: 'Serrated leaf margins with prominent venation patterns',
  },
  spinach: {
    cropKey: 'spinach',
    expectedExG: 0.13,
    expectedTextureGradient: 20.0, // Deep green leaves
    chlorosisToleranceOffset: -1.0,
    notes: 'Glossy dark green leaves with high natural chlorophyll density',
  },
  cherry_tomato: {
    cropKey: 'cherry_tomato',
    expectedExG: 0.09,
    expectedTextureGradient: 28.0, // Compound lobed leaves
    chlorosisToleranceOffset: 1.0,
    notes: 'Compound serrated foliage with glandular trichomes',
  },
};
