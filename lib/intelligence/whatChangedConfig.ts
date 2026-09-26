/**
 * HydroSmart — Phase 7: "What Changed?" Intelligence Engine Configuration
 * 
 * Centralized, configurable thresholds for detecting meaningful longitudinal changes
 * across visual, sensor, health, growth, and identity telemetry.
 * 
 * NOTE: These thresholds represent tunable engineering heuristics based on hydroponic
 * domain knowledge and sensor tolerances, not universal immutable biological constants.
 */

export interface MetricThresholds {
  minor: number;
  moderate: number;
  significant: number;
  critical: number;
}

export interface WhatChangedConfig {
  /** Minimum number of valid observations required to compute temporal change */
  minObservationsRequired: number;

  /** Minimum time delta in milliseconds to consider a temporal window valid */
  minTimeDeltaMs: number;

  /** Thresholds for pH delta (absolute difference) */
  ph: MetricThresholds;

  /** Thresholds for TDS delta in PPM */
  tds: MetricThresholds;

  /** Thresholds for Water Level delta in percentage points */
  waterLevel: MetricThresholds;

  /** Thresholds for Canopy Coverage change in percentage points */
  canopyCoverage: {
    minor: number;
    moderate: number;
    significant: number;
  };

  /** Thresholds for Chlorosis leaf area change in percentage points */
  chlorosis: {
    minor: number;
    moderate: number;
    significant: number;
  };

  /** Thresholds for Necrosis leaf area change in percentage points */
  necrosis: {
    minor: number;
    moderate: number;
    significant: number;
  };

  /** Thresholds for Overall Health Score delta (0-100 scale) */
  healthScore: MetricThresholds;

  /** Optical quality gating parameters to prevent false growth deductions from blurry frames */
  opticalGating: {
    /** Minimum plant presence confidence required to trust visual delta */
    minPlantConfidence: number;
    /** Minimum image sharpness score required before computing visual growth deltas */
    minSharpness: number;
    /** Minimum canopy coverage threshold below which leaf change is unreliable */
    minCanopyCoverage: number;
  };
}

export const WHAT_CHANGED_CONFIG: WhatChangedConfig = {
  minObservationsRequired: 2,
  minTimeDeltaMs: 10_000, // 10 seconds min between frames to avoid duplicate frame noise

  ph: {
    minor: 0.15,      // Small drift, standard sensor noise or daily fluctuation
    moderate: 0.25,   // Noticeable shift, indicates solution buffering change
    significant: 0.50,// Serious drift, nutrient lockout risk begins
    critical: 0.80,   // Severe excursion, roots under immediate stress
  },

  tds: {
    minor: 40,        // Normal transpiration / small dilution fluctuation
    moderate: 75,     // Active feeding or evaporation concentration
    significant: 150, // Substantial salt accumulation or severe dilution
    critical: 300,    // High risk of salt burn or nutrient deficiency starvation
  },

  waterLevel: {
    minor: 3.0,       // Routine daily consumption
    moderate: 5.0,    // Normal uptake across checking window
    significant: 15.0,// Accelerated uptake or minor leak/drain
    critical: 25.0,   // Reservoir depletion alert / critical low
  },

  canopyCoverage: {
    minor: 1.5,       // Micro growth or slight leaf repositioning
    moderate: 3.0,    // Meaningful canopy expansion or slight wilting reduction
    significant: 8.0, // Substantial vegetative growth milestone or severe defoliation
  },

  chlorosis: {
    minor: 2.0,       // Slight yellowing onset or light adjustment
    moderate: 4.0,    // Clear interveinal or leaf-wide yellowing (nutrient lockout/deficiency)
    significant: 10.0,// Extensive chlorotic spread across canopy
  },

  necrosis: {
    minor: 1.0,       // Tip burn onset or small lesion
    moderate: 2.0,    // Spreading necrotic brown/black tissue
    significant: 5.0, // Severe tissue death requiring immediate pruning/intervention
  },

  healthScore: {
    minor: 3.0,       // Minor score vibration
    moderate: 6.0,    // Noticeable composite change
    significant: 15.0,// Major physiological shift
    critical: 25.0,   // Severe health decline or major recovery
  },

  opticalGating: {
    minPlantConfidence: 0.45,
    minSharpness: 6.0,
    minCanopyCoverage: 2.0,
  },
};
