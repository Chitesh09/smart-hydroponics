// Smart Hydroponic System — ESP32 Sensor Simulator
// Mimics real sensor behavior with drift, noise, and closed-loop correction

export interface SensorReading {
  ph: number;
  tds: number;
  temperature: number;
  waterLevel: number; // 0-100%
  timestamp: number;
}

export interface PumpState {
  phUp: boolean;
  phDown: boolean;
  nutrient: boolean;
  circulation: boolean;
}

export interface SystemState {
  reading: SensorReading;
  pumps: PumpState;
  controlMode: 'auto' | 'manual';
  status: 'stable' | 'correcting' | 'fault';
  activeCorrection: string | null;
  faultMessage: string | null;
  correctionCount: number;
  lastCorrectionTime: number | null;
}

export interface TargetRanges {
  phMin: number;
  phMax: number;
  tdsMin: number;
  tdsMax: number;
  tempMin: number;
  tempMax: number;
}

export const CROP_PROFILES: Record<string, TargetRanges> = {
  lettuce: { phMin: 5.5, phMax: 6.5, tdsMin: 800, tdsMax: 1200, tempMin: 18, tempMax: 24 },
  tomato: { phMin: 5.8, phMax: 6.8, tdsMin: 1400, tdsMax: 3500, tempMin: 20, tempMax: 26 },
  spinach: { phMin: 6.0, phMax: 7.0, tdsMin: 1260, tdsMax: 1610, tempMin: 15, tempMax: 20 },
  basil: { phMin: 5.5, phMax: 6.5, tdsMin: 700, tdsMax: 1120, tempMin: 20, tempMax: 28 },
};

// Internal mutable state
let internalState = {
  ph: 6.0,
  tds: 1000,
  temperature: 22.0,
  waterLevel: 85,
  phDrift: 0.002,   // natural drift per tick
  tdsDrift: -0.5,   // natural TDS drop (plant uptake)
  noiseAmplitude: 0.01,
  correctionCooldown: 0,
  faultInjectionCountdown: 0,
  faultActive: false,
};

let pumpState: PumpState = {
  phUp: false,
  phDown: false,
  nutrient: false,
  circulation: true, // always on
};

let systemStatus: 'stable' | 'correcting' | 'fault' = 'stable';
let activeCorrection: string | null = null;
let faultMessage: string | null = null;
let correctionCount = 0;
let lastCorrectionTime: number | null = null;

function addNoise(val: number, amp: number): number {
  return val + (Math.random() - 0.5) * amp;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function tick(targets: TargetRanges, controlMode: 'auto' | 'manual'): SystemState {
  // Reset pumps each tick
  pumpState = { phUp: false, phDown: false, nutrient: false, circulation: true };
  activeCorrection = null;
  faultMessage = null;

  // Natural drift
  internalState.ph += internalState.phDrift;
  internalState.tds += internalState.tdsDrift;
  internalState.temperature += (Math.random() - 0.5) * 0.05;
  internalState.waterLevel -= 0.03; // slow evaporation

  // Clamp to physical limits
  internalState.ph = clamp(internalState.ph, 4.0, 9.0);
  internalState.tds = clamp(internalState.tds, 100, 3000);
  internalState.temperature = clamp(internalState.temperature, 10, 40);
  internalState.waterLevel = clamp(internalState.waterLevel, 0, 100);

  // Closed-loop P-Control (only in auto mode)
  if (controlMode === 'auto') {
    const phMid = (targets.phMin + targets.phMax) / 2;
    const tdsMid = (targets.tdsMin + targets.tdsMax) / 2;

    // pH correction
    if (internalState.ph > targets.phMax) {
      const error = internalState.ph - targets.phMax;
      const correction = 0.08 * error; // P-gain
      internalState.ph -= correction;
      pumpState.phDown = true;
      activeCorrection = `pH-Down: correcting by -${correction.toFixed(3)} pH units`;
      systemStatus = 'correcting';
      correctionCount++;
      lastCorrectionTime = Date.now();
    } else if (internalState.ph < targets.phMin) {
      const error = targets.phMin - internalState.ph;
      const correction = 0.08 * error;
      internalState.ph += correction;
      pumpState.phUp = true;
      activeCorrection = `pH-Up: correcting by +${correction.toFixed(3)} pH units`;
      systemStatus = 'correcting';
      correctionCount++;
      lastCorrectionTime = Date.now();
    }

    // TDS correction
    if (internalState.tds < targets.tdsMin) {
      const error = targets.tdsMin - internalState.tds;
      const correction = 2.5 * error * 0.05;
      internalState.tds += correction;
      pumpState.nutrient = true;
      if (!activeCorrection) {
        activeCorrection = `Nutrient: adding +${correction.toFixed(1)} ppm`;
        systemStatus = 'correcting';
      }
      correctionCount++;
      lastCorrectionTime = Date.now();
    }

    // Stable check
    if (!pumpState.phUp && !pumpState.phDown && !pumpState.nutrient) {
      systemStatus = 'stable';
    }
  }

  // Water level fault
  if (internalState.waterLevel < 15) {
    systemStatus = 'fault';
    faultMessage = 'Water level critically low — check reservoir';
    pumpState.circulation = false;
  }

  // Random fault injection every ~200 ticks
  if (internalState.faultInjectionCountdown <= 0) {
    internalState.faultInjectionCountdown = 180 + Math.floor(Math.random() * 60);
  } else {
    internalState.faultInjectionCountdown--;
  }

  const reading: SensorReading = {
    ph: parseFloat(addNoise(internalState.ph, internalState.noiseAmplitude).toFixed(2)),
    tds: parseFloat(addNoise(internalState.tds, 2).toFixed(1)),
    temperature: parseFloat(addNoise(internalState.temperature, 0.05).toFixed(1)),
    waterLevel: parseFloat(internalState.waterLevel.toFixed(1)),
    timestamp: Date.now(),
  };

  return {
    reading,
    pumps: { ...pumpState },
    controlMode,
    status: systemStatus,
    activeCorrection,
    faultMessage,
    correctionCount,
    lastCorrectionTime,
  };
}

export function resetSimulator(startPh = 6.0, startTds = 1000) {
  internalState.ph = startPh;
  internalState.tds = startTds;
  internalState.temperature = 22;
  internalState.waterLevel = 85;
  systemStatus = 'stable';
  correctionCount = 0;
  lastCorrectionTime = null;
}

export function injectFault(type: 'ph_spike' | 'tds_drop' | 'temp_spike' | 'low_water') {
  switch (type) {
    case 'ph_spike':
      internalState.ph = 7.8;
      break;
    case 'tds_drop':
      internalState.tds = 200;
      break;
    case 'temp_spike':
      internalState.temperature = 32;
      break;
    case 'low_water':
      internalState.waterLevel = 10;
      break;
  }
}

export function manualPumpActivate(pump: keyof PumpState, durationMs: number) {
  // In a real system this would trigger relay; here we apply immediate effect
  if (pump === 'phUp') internalState.ph = clamp(internalState.ph + 0.15, 4, 9);
  if (pump === 'phDown') internalState.ph = clamp(internalState.ph - 0.15, 4, 9);
  if (pump === 'nutrient') internalState.tds = clamp(internalState.tds + 50, 100, 3000);
}
