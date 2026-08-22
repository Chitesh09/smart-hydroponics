// ============================================================
// HydroSmart — Plant Vision & Visual Health Service Boundary
// ============================================================

import { VisualAnalysisResult } from './types';

/**
 * Service Boundary for Plant Vision & Visual Health Assessment.
 * Explicitly marked NOT IMPLEMENTED for Phase 1.
 * Future phases will integrate real-time leaf color segmentation and defect classifiers.
 */
export async function analyzePlantVision(
  _imageBase64: string
): Promise<VisualAnalysisResult> {
  return {
    status: 'not_implemented',
    timestamp: Date.now(),
    message: 'Visual anomaly and canopy health neural network pipeline is scheduled for integration in a future phase. No synthetic diagnosis generated.',
  };
}
