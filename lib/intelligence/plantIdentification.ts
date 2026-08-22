// ============================================================
// HydroSmart — Plant Species Identification Service Boundary
// ============================================================

import { ServiceStatus } from './types';

export interface IdentificationResult {
  status: ServiceStatus;
  timestamp: number;
  speciesName?: string;
  scientificName?: string;
  confidence?: number;
  message: string;
}

/**
 * Service Boundary for Plant Identification (Vision ML).
 * Explicitly marked NOT IMPLEMENTED for Phase 1.
 * Future phases will connect local TensorFlow.js / Cloud Vision API.
 */
export async function identifyPlantSpecies(
  _imageBase64: string
): Promise<IdentificationResult> {
  return {
    status: 'not_implemented',
    timestamp: Date.now(),
    message: 'Plant Identification Vision model is scheduled for integration in a future phase. No fake ML predictions generated.',
  };
}
