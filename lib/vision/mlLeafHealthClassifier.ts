// ============================================================
// HydroSmart — In-Browser ML Leaf Health & Anomaly Classifier
// Real TensorFlow.js Depthwise Separable CNN Model Inference
// Model: hydrosmart-leaf-health-v1
// ============================================================

import * as tf from '@tensorflow/tfjs';

export type LeafHealthClass = 'healthy_foliage' | 'chlorosis_yellowing' | 'necrotic_tissue';

export interface LeafHealthClassPrediction {
  id: LeafHealthClass;
  label: string;
  probability: number; // 0.0 - 1.0
  percentage: number;  // 0 - 100%
}

export interface LeafHealthMLResult {
  status: 'HEALTHY' | 'ATTENTION' | 'CRITICAL' | 'LOW_CONFIDENCE' | 'ERROR';
  modelId: string;
  modelVersion: string;
  topClass: LeafHealthClass;
  topConfidence: number;      // 0 - 100%
  margin: number;             // Top1 - Top2 probability
  shannonEntropy: number;     // Distribution uncertainty metric
  distribution: LeafHealthClassPrediction[];
  inferenceLatencyMs: number;
  timestamp: number;
}

export const LEAF_HEALTH_CLASSES: Record<LeafHealthClass, { label: string; defaultState: 'HEALTHY' | 'ATTENTION' | 'CRITICAL' }> = {
  healthy_foliage: {
    label: 'Healthy Foliage',
    defaultState: 'HEALTHY',
  },
  chlorosis_yellowing: {
    label: 'Chlorosis / Yellowing Stress',
    defaultState: 'ATTENTION',
  },
  necrotic_tissue: {
    label: 'Necrotic Browning / Tissue Lesions',
    defaultState: 'CRITICAL',
  },
};

const MODEL_PATH = '/models/leaf-health-v1/model.json';
const INPUT_SIZE = 160;

let cachedModel: tf.LayersModel | null = null;
let isLoadingModel = false;

/**
 * Load and cache the Leaf Health TFJS model singleton
 */
export async function getLeafHealthModel(): Promise<tf.LayersModel | null> {
  if (cachedModel) {
    return cachedModel;
  }
  if (isLoadingModel) {
    while (isLoadingModel) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return cachedModel;
  }

  isLoadingModel = true;
  try {
    const loaded = await tf.loadLayersModel(MODEL_PATH);
    cachedModel = loaded;
    return cachedModel;
  } catch (err) {
    console.warn('[LeafHealthClassifier] Notice: In-browser model fetch failed, using CV-only fallback:', err);
    return null;
  } finally {
    isLoadingModel = false;
  }
}

/**
 * Preprocess image or bounding-box region into [1, 160, 160, 3] normalized tensor
 */
export function preprocessLeafTensor(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageData,
  boundingBox?: { x: number; y: number; width: number; height: number }
): tf.Tensor4D {
  return tf.tidy(() => {
    let tensor: tf.Tensor3D;
    if (typeof ImageData !== 'undefined' && source instanceof ImageData) {
      tensor = tf.browser.fromPixels(source);
    } else {
      tensor = tf.browser.fromPixels(source as HTMLCanvasElement | HTMLImageElement | HTMLVideoElement);
    }

    if (boundingBox && boundingBox.width > 0.05 && boundingBox.height > 0.05) {
      const y1 = Math.max(0, boundingBox.y);
      const x1 = Math.max(0, boundingBox.x);
      const y2 = Math.min(1.0, boundingBox.y + boundingBox.height);
      const x2 = Math.min(1.0, boundingBox.x + boundingBox.width);

      const boxes = tf.tensor2d([[y1, x1, y2, x2]], [1, 4]);
      const boxInd = tf.tensor1d([0], 'int32');
      const cropped = tf.image.cropAndResize(
        tensor.expandDims(0) as tf.Tensor4D,
        boxes,
        boxInd,
        [INPUT_SIZE, INPUT_SIZE],
        'bilinear'
      );
      return cropped.div(255.0) as tf.Tensor4D;
    }

    const resized = tf.image.resizeBilinear(tensor, [INPUT_SIZE, INPUT_SIZE]);
    return resized.expandDims(0).div(255.0) as tf.Tensor4D;
  });
}

/**
 * Classify foliar condition using real in-browser ML model
 */
export async function classifyLeafHealthWithML(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement | ImageData,
  boundingBox?: { x: number; y: number; width: number; height: number }
): Promise<LeafHealthMLResult | null> {
  const model = await getLeafHealthModel();
  if (!model) {
    return null;
  }

  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  try {
    const probabilities = tf.tidy(() => {
      const inputTensor = preprocessLeafTensor(source, boundingBox);
      const logits = model.predict(inputTensor) as tf.Tensor;
      return Array.from(logits.dataSync());
    });

    const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const inferenceLatencyMs = Math.round(endTime - startTime);

    const classKeys: LeafHealthClass[] = ['healthy_foliage', 'chlorosis_yellowing', 'necrotic_tissue'];
    const distribution: LeafHealthClassPrediction[] = classKeys.map((key, i) => ({
      id: key,
      label: LEAF_HEALTH_CLASSES[key].label,
      probability: probabilities[i] ?? 0,
      percentage: Math.round((probabilities[i] ?? 0) * 100),
    }));

    // Sort descending by probability
    distribution.sort((a, b) => b.probability - a.probability);

    const top1 = distribution[0];
    const top2 = distribution[1] || { probability: 0 };
    const margin = top1.probability - top2.probability;

    // Calculate Shannon entropy: H = -sum(p * ln(p))
    let shannonEntropy = 0;
    for (const p of probabilities) {
      if (p > 1e-7) {
        shannonEntropy -= p * Math.log(p);
      }
    }

    let status: 'HEALTHY' | 'ATTENTION' | 'CRITICAL' | 'LOW_CONFIDENCE' = LEAF_HEALTH_CLASSES[top1.id].defaultState;

    // Out-of-distribution / high uncertainty check
    if (top1.probability < 0.50 || (margin < 0.12 && shannonEntropy > 1.05)) {
      status = 'LOW_CONFIDENCE';
    }

    return {
      status,
      modelId: 'hydrosmart-leaf-health-v1',
      modelVersion: '1.0.0',
      topClass: top1.id,
      topConfidence: Math.round(top1.probability * 100),
      margin: Math.round(margin * 100) / 100,
      shannonEntropy: Math.round(shannonEntropy * 1000) / 1000,
      distribution,
      inferenceLatencyMs,
      timestamp: Date.now(),
    };
  } catch (err) {
    console.error('[LeafHealthClassifier] Inference error:', err);
    return null;
  }
}
