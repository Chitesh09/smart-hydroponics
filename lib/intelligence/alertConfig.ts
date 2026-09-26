/**
 * HydroSmart — Phase 10: Plant Alert Configuration
 * 
 * Centralized configurable thresholds, persistence windows, hysteresis values,
 * and debounce rules for confidence-aware plant alerts.
 */

export interface AlertThresholdConfig {
  ph: {
    warningOffset: number; // e.g. deviation from crop profile min/max
    criticalOffset: number; // deviation triggering URGENT
    hysteresis: number; // buffer to prevent alert bouncing
    baselineDeviationThreshold: number; // deviation from plantProfile.baseline.initialPH
  };
  tds: {
    warningOffset: number;
    criticalOffset: number;
    hysteresis: number;
    baselineDeviationThreshold: number; // deviation from plantProfile.baseline.initialTDS
  };
  waterLevel: {
    warningPercent: number;
    criticalPercent: number;
    hysteresisPercent: number;
    rapidDeclinePerHour: number; // %/h drop indicating possible leak/abnormal consumption
  };
  visual: {
    chlorosisAttentionPercent: number; // >= 12%
    chlorosisUrgentPercent: number;    // >= 25%
    necrosisAttentionPercent: number;  // >= 4%
    necrosisUrgentPercent: number;     // >= 8%
    canopyContractionAttention: number; // <= -15%
    canopyContractionUrgent: number;    // <= -30%
    minConsecutiveStressFrames: number; // >= 2 observations to avoid single-frame noise
    minDetectionConfidence: number;     // >= 50%
  };
  timing: {
    telemetryStaleTimeoutMs: number;    // 15,000 ms (15s)
    debounceWindowMs: number;           // 30 mins (1,800,000 ms)
    minSensorPersistenceCount: number;  // >= 3 consecutive readings for sensor alert
    resolutionPersistenceCount: number; // >= 2 clean checks to resolve
    maxStoredAlertsPerPlant: number;    // 50
  };
}

export const ALERT_CONFIG: AlertThresholdConfig = {
  ph: {
    warningOffset: 0.1,
    criticalOffset: 0.6,
    hysteresis: 0.2,
    baselineDeviationThreshold: 0.4,
  },
  tds: {
    warningOffset: 50,
    criticalOffset: 300,
    hysteresis: 50,
    baselineDeviationThreshold: 150,
  },
  waterLevel: {
    warningPercent: 25,
    criticalPercent: 15,
    hysteresisPercent: 3,
    rapidDeclinePerHour: 5,
  },
  visual: {
    chlorosisAttentionPercent: 12.0,
    chlorosisUrgentPercent: 25.0,
    necrosisAttentionPercent: 4.0,
    necrosisUrgentPercent: 8.0,
    canopyContractionAttention: -15.0,
    canopyContractionUrgent: -30.0,
    minConsecutiveStressFrames: 2,
    minDetectionConfidence: 50,
  },
  timing: {
    telemetryStaleTimeoutMs: 15000,
    debounceWindowMs: 30 * 60 * 1000,
    minSensorPersistenceCount: 3,
    resolutionPersistenceCount: 2,
    maxStoredAlertsPerPlant: 50,
  },
};
