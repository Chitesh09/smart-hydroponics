export interface SensorReading {
  ph: number;
  tds: number;
  temperature: number;
  waterLevel: number; // 0-100%
  timestamp: number;
}

let lastRealReading: SensorReading | null = null;
let lastUpdate: number = 0;

export function setRealReading(reading: Omit<SensorReading, 'timestamp'>) {
  lastRealReading = {
    ...reading,
    timestamp: Date.now(),
  };
  lastUpdate = Date.now();
}

export function getRealReading(): SensorReading | null {
  // If no updates in the last 15 seconds, consider the board offline and fall back to simulator
  if (!lastRealReading || Date.now() - lastUpdate > 15000) {
    return null;
  }
  return lastRealReading;
}
