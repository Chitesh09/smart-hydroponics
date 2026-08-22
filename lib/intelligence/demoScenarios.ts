// ============================================================
// HydroSmart — Demo & Simulation Intelligence Scenarios
// ============================================================

import { DemoScenario } from './types';

export interface ScenarioProfile {
  id: DemoScenario;
  name: string;
  description: string;
  targetPh: number;
  targetTds: number;
  targetWaterLevel: number;
  expectedHealthState: 'optimal' | 'warning' | 'critical';
}

export const DEMO_SCENARIOS: Record<DemoScenario, ScenarioProfile> = {
  healthy: {
    id: 'healthy',
    name: 'Optimal Homeostasis',
    description: 'All nutrient, chemical, and physical telemetry parameters within biological targets for vigorous crop growth.',
    targetPh: 6.10,
    targetTds: 1000,
    targetWaterLevel: 85,
    expectedHealthState: 'optimal',
  },
  ph_drift: {
    id: 'ph_drift',
    name: 'Alkaline pH Drift',
    description: 'Unbuffered water drift causing pH to rise to 7.80, inducing iron lockout and slower nutrient absorption.',
    targetPh: 7.80,
    targetTds: 950,
    targetWaterLevel: 80,
    expectedHealthState: 'warning',
  },
  tds_decline: {
    id: 'tds_decline',
    name: 'Nutrient Salt Depletion',
    description: 'Rapid nutrient salt consumption without replenishment dropping dissolved minerals to 450 PPM.',
    targetPh: 6.05,
    targetTds: 450,
    targetWaterLevel: 75,
    expectedHealthState: 'warning',
  },
  water_depletion: {
    id: 'water_depletion',
    name: 'Critical Water Depletion',
    description: 'Severe reservoir evaporation and uptake lowering water level to 12% capacity, triggering pump dry-run fault.',
    targetPh: 6.20,
    targetTds: 1150,
    targetWaterLevel: 12,
    expectedHealthState: 'critical',
  },
  sensor_anomaly: {
    id: 'sensor_anomaly',
    name: 'Extreme Combined Stress',
    description: 'Multi-parameter anomaly with severe acidic crash (4.30 pH) and high salinity stress (2200 PPM).',
    targetPh: 4.30,
    targetTds: 2200,
    targetWaterLevel: 18,
    expectedHealthState: 'critical',
  },
};
