// Centralized sensor configuration and thresholds for the HydroSmart system
// Adjust these thresholds according to the specific crop and system requirements.
export const SENSOR_THRESHOLDS = {
  ph: {
    min: 5.5,
    max: 6.5,
  },
  tds: {
    min: 800,
    max: 1200,
  },
  waterLevel: {
    warning: 25,    // Warning when level falls below 25%
    critical: 15,   // Critical warning when level falls below 15%
  }
};
