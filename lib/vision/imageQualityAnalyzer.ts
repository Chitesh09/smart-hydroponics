// ============================================================
// HydroSmart — Optical Image Quality & Lighting Assessment Engine
// Evaluates Luminance, RMS Contrast, High-Frequency Sharpness & Color Cast
// ============================================================

import { ImageQualityAssessment } from './types';

/**
 * Assess frame quality, illumination balance, blur, and chromatic casts
 */
export function assessImageQuality(
  pixels: Uint8ClampedArray,
  width: number,
  height: number
): ImageQualityAssessment {
  const totalPixels = width * height;
  if (totalPixels === 0 || pixels.length < totalPixels * 4) {
    return {
      brightnessScore: 0,
      contrastScore: 0,
      sharpnessScore: 0,
      foliageVisibilityScore: 0,
      overallQuality: 0,
      acceptable: false,
      isBlurry: true,
      isUnderexposed: true,
      isOverexposed: false,
      lightingColorCast: 'neutral',
      qualityMessage: 'Empty or invalid pixel buffer received.',
    };
  }

  let sumLuma = 0;
  let sumLumaSq = 0;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let foliageCount = 0;

  // Step 1: Pixel Statistics & Luminance
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    sumR += r;
    sumG += g;
    sumB += b;

    // Rec. 601 Luma
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    sumLuma += luma;
    sumLumaSq += luma * luma;

    // Fast Excess Green check for visible foliage
    const exg = 2 * g - r - b;
    if (exg > 15 && g > r && g > b) {
      foliageCount++;
    }
  }

  const meanLuma = sumLuma / totalPixels;
  const varianceLuma = Math.max(0, (sumLumaSq / totalPixels) - (meanLuma * meanLuma));
  const rmsContrast = Math.sqrt(varianceLuma);

  const meanR = sumR / totalPixels;
  const meanG = sumG / totalPixels;
  const meanB = sumB / totalPixels;

  // Step 2: High-Frequency Gradient Sharpness (Neighbor difference estimation)
  let gradientSum = 0;
  let sampleCount = 0;
  const step = 2; // Downsampled stride for efficiency

  for (let y = 0; y < height - step; y += step) {
    for (let x = 0; x < width - step; x += step) {
      const idx = (y * width + x) * 4;
      const idxRight = (y * width + (x + step)) * 4;
      const idxDown = ((y + step) * width + x) * 4;

      const luma = 0.299 * pixels[idx] + 0.587 * pixels[idx + 1] + 0.114 * pixels[idx + 2];
      const lumaR = 0.299 * pixels[idxRight] + 0.587 * pixels[idxRight + 1] + 0.114 * pixels[idxRight + 2];
      const lumaD = 0.299 * pixels[idxDown] + 0.587 * pixels[idxDown + 1] + 0.114 * pixels[idxDown + 2];

      gradientSum += Math.abs(luma - lumaR) + Math.abs(luma - lumaD);
      sampleCount++;
    }
  }

  const sharpness = sampleCount > 0 ? gradientSum / sampleCount : 0;

  // Step 3: Chromatic Color Temperature & Lighting Cast
  let colorCast: ImageQualityAssessment['lightingColorCast'] = 'neutral';
  if (meanB > 0) {
    const rbRatio = meanR / meanB;
    const gbRatio = meanG / meanB;
    if (rbRatio > 1.35 && gbRatio > 1.2) {
      colorCast = 'warm_yellow';
    } else if (meanB / Math.max(1, meanR) > 1.35) {
      colorCast = 'cool_blue';
    }
  }

  // Step 4: Quality Scores (0 - 100)
  // Optimal mean luminance is between 90 and 165
  const brightnessScore = Math.max(0, Math.min(100, 100 - Math.abs(meanLuma - 128) * 0.8));
  const contrastScore = Math.max(0, Math.min(100, (rmsContrast / 60) * 100));
  const sharpnessScore = Math.max(0, Math.min(100, (sharpness / 25) * 100));
  const foliageVisibilityScore = Math.min(100, (foliageCount / totalPixels) * 100 * 2.5);

  const isUnderexposed = meanLuma < 35;
  const isOverexposed = meanLuma > 225;
  const isBlurry = sharpness < 10.0;

  const acceptable = !isUnderexposed && !isOverexposed && !isBlurry;
  const overallQuality = parseFloat(
    ((brightnessScore * 0.35 + contrastScore * 0.35 + sharpnessScore * 0.3) * (acceptable ? 1.0 : 0.4)).toFixed(1)
  );

  let qualityMessage = 'Optical image quality is suitable for biological analysis.';
  if (isUnderexposed) {
    qualityMessage = 'Frame is too dark for optical analysis. Increase ambient illumination.';
  } else if (isOverexposed) {
    qualityMessage = 'Frame is overexposed; excess glare impairs foliage pigment reading.';
  } else if (isBlurry) {
    qualityMessage = 'Image blur prevents reliable leaf edge and texture assessment.';
  } else if (colorCast === 'warm_yellow') {
    qualityMessage = 'Noticeable warm yellow lighting detected. Confidence will be adjusted for chlorosis evaluation.';
  } else if (colorCast === 'cool_blue') {
    qualityMessage = 'Cool ambient lighting detected; leaf color temperature normalized.';
  }

  return {
    brightnessScore: parseFloat(brightnessScore.toFixed(1)),
    contrastScore: parseFloat(contrastScore.toFixed(1)),
    sharpnessScore: parseFloat(sharpnessScore.toFixed(1)),
    foliageVisibilityScore: parseFloat(foliageVisibilityScore.toFixed(1)),
    overallQuality,
    acceptable,
    isBlurry,
    isUnderexposed,
    isOverexposed,
    lightingColorCast: colorCast,
    qualityMessage,
  };
}
