/**
 * HydroSmart — Phase 9: Environment ↔ Plant Correlation Intelligence Configuration
 * 
 * Centralized, configurable thresholds for detecting associations between
 * hydroponic environmental telemetry (pH, TDS, Water Level) and visual plant indicators
 * (Health Score, Canopy Coverage, Chlorosis, Necrosis).
 * 
 * NOTE: All associations represent empirical co-movements and temporal correlations.
 * They describe observed patterns, NOT isolated biological proof of causality.
 */

export interface CorrelationConfig {
  /** Minimum paired observations required to detect qualitative environmental trends */
  minPairsForTrend: number;

  /** Minimum paired observations required to compute Pearson r and Spearman rho */
  minPairsForStats: number;

  /** Time difference windows in milliseconds */
  timeWindows: {
    /** Max time difference to align sensor reading with observation as 'immediate' */
    immediateMaxDeltaMs: number;
    /** Time window for same-day evaluation */
    sameDayMs: number;
    /** Time window for recent trend evaluation (2-7 days) */
    recentTrendMs: number;
  };

  /** Candidate lag lookback windows in hours to test for delayed plant responses */
  lagWindowsHours: number[];

  /** Optical quality gating parameters to avoid false correlations from blurry/unreliable frames */
  opticalGating: {
    /** Minimum plant presence confidence required to trust visual metrics */
    minConfidence: number;
    /** Minimum image sharpness score required */
    minSharpness: number;
  };

  /** Correlation coefficient magnitude thresholds (|r| or |rho|) */
  strengthThresholds: {
    strong: number;   // >= 0.70
    moderate: number; // >= 0.40
    weak: number;     // >= 0.20
  };

  /** Meaningful shift thresholds for change detection */
  shifts: {
    phDeltaSignificant: number;
    tdsDeltaSignificant: number;
    waterLevelDeltaSignificant: number;
    healthScoreDeltaSignificant: number;
    chlorosisDeltaSignificant: number;
    necrosisDeltaSignificant: number;
    canopyDeltaSignificant: number;
  };
}

export const CORRELATION_CONFIG: CorrelationConfig = {
  minPairsForTrend: 3,
  minPairsForStats: 5,

  timeWindows: {
    immediateMaxDeltaMs: 15 * 60 * 1000,    // 15 minutes
    sameDayMs: 24 * 60 * 60 * 1000,          // 24 hours
    recentTrendMs: 7 * 24 * 60 * 60 * 1000,  // 7 days
  },

  lagWindowsHours: [6, 12, 24, 48],

  opticalGating: {
    minConfidence: 0.50,
    minSharpness: 6.0,
  },

  strengthThresholds: {
    strong: 0.70,
    moderate: 0.40,
    weak: 0.20,
  },

  shifts: {
    phDeltaSignificant: 0.30,
    tdsDeltaSignificant: 80,
    waterLevelDeltaSignificant: 8.0,
    healthScoreDeltaSignificant: 5.0,
    chlorosisDeltaSignificant: 2.0,
    necrosisDeltaSignificant: 1.5,
    canopyDeltaSignificant: 3.0,
  },
};
