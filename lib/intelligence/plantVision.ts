// ============================================================
// HydroSmart — Plant Vision & Visual Health Service
// ============================================================

import { VisualAnalysisResult } from './types';
import { detectPlantPresence } from '@/lib/vision/plantDetector';

/**
 * Perform computer vision analysis on an image snapshot using
 * chlorophyll ExG spectral indices and HSV segmentation.
 */
export async function analyzePlantVision(
  imageBase64: string
): Promise<VisualAnalysisResult> {
  if (typeof window === 'undefined' || !imageBase64) {
    return {
      status: 'error',
      timestamp: Date.now(),
      message: 'Invalid image input or non-browser execution environment.',
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const detection = detectPlantPresence(img);
      resolve({
        status: 'ready',
        timestamp: Date.now(),
        canopyCoveragePercent: detection.canopyCoveragePercent,
        visualHealthScore: detection.isPlantDetected ? detection.confidence : 0,
        leafColorAssessment: detection.foliageColorAssessment === 'vibrant_green' 
          ? 'healthy_green' 
          : detection.foliageColorAssessment === 'chlorosis' 
            ? 'chlorosis' 
            : detection.foliageColorAssessment === 'pale_yellow' 
              ? 'pale_yellow' 
              : 'unknown',
        message: detection.statusText,
      });
    };
    img.onerror = () => {
      resolve({
        status: 'error',
        timestamp: Date.now(),
        message: 'Failed to decode image buffer for vision analysis.',
      });
    };
    img.src = imageBase64;
  });
}
