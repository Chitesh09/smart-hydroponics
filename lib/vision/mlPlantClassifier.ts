// ============================================================
// HydroSmart — In-Browser Botanical Species ML Classifier Engine
// Real Dataset-Backed Depthwise Separable CNN (TensorFlow.js)
// Model: hydrosmart-plant-classifier-v1
// Classes: 6 Hydroponic Crop Taxa + Unknown Handling
// ============================================================

import * as tf from '@tensorflow/tfjs';
import { BoundingBox } from './plantDetector';
import { CropTargetProfile } from '@/lib/intelligence/types';
import { BOTANICAL_DATABASE } from '@/lib/intelligence/botanicalDatabase';

export type ModelLifecycleState = 'MODEL_LOADING' | 'MODEL_READY' | 'MODEL_ERROR';

export type SpeciesClassificationState =
  | 'IDENTIFIED'
  | 'LOW_CONFIDENCE'
  | 'UNKNOWN_PLANT'
  | 'NO_PLANT_DETECTED'
  | 'SCAN_NOT_READY'
  | 'MODEL_UNAVAILABLE';

export interface MLClassProbability {
  classIndex: number;
  cropKey: string;
  commonName: string;
  scientificName: string;
  family: string;
  probability: number;      // 0.0 - 1.0
  confidencePercent: number; // 0 - 100%
  targetProfile: CropTargetProfile;
}

export interface MLPlantClassificationResult {
  state: SpeciesClassificationState;
  modelId: string;
  modelVersion: string;
  primaryCandidate?: MLClassProbability;
  rankedCandidates: MLClassProbability[];
  topConfidencePercent: number;
  top2Margin: number;
  entropy: number;
  inferenceLatencyMs: number;
  inputDimensions: [number, number, number];
  lifecycleState: ModelLifecycleState;
  guidanceMessage: string;
  rejectionReason?: string;
  timestamp: number;
}

export interface ClassifierOptions {
  boundingBox?: BoundingBox;
  confidenceThreshold?: number;
  lowConfidenceThreshold?: number;
  minMargin?: number;
  maxEntropy?: number;
}

// 6 Registered Hydroponic Taxa
export const MODEL_CLASSES_METADATA = [
  {
    classIndex: 0,
    cropKey: 'butterhead_lettuce',
    commonName: 'Butterhead Lettuce',
    scientificName: 'Lactuca sativa var. capitata',
    family: 'Asteraceae',
    botanicalId: 'lettuce_butterhead'
  },
  {
    classIndex: 1,
    cropKey: 'sweet_basil',
    commonName: 'Sweet Basil',
    scientificName: 'Ocimum basilicum',
    family: 'Lamiaceae',
    botanicalId: 'basil_sweet'
  },
  {
    classIndex: 2,
    cropKey: 'spinach',
    commonName: 'Spinach',
    scientificName: 'Spinacia oleracea',
    family: 'Amaranthaceae',
    botanicalId: 'spinach_bloomsdale'
  },
  {
    classIndex: 3,
    cropKey: 'curly_kale',
    commonName: 'Curly Kale',
    scientificName: 'Brassica oleracea var. sabellica',
    family: 'Brassicaceae',
    botanicalId: 'kale_curly'
  },
  {
    classIndex: 4,
    cropKey: 'spearmint',
    commonName: 'Spearmint',
    scientificName: 'Mentha spicata',
    family: 'Lamiaceae',
    botanicalId: 'mint_spearmint'
  },
  {
    classIndex: 5,
    cropKey: 'cherry_tomato',
    commonName: 'Cherry Tomato',
    scientificName: 'Solanum lycopersicum',
    family: 'Solanaceae',
    botanicalId: 'tomato_cherry'
  }
];

const DEFAULT_AGRONOMIC_PROFILE: CropTargetProfile = {
  name: 'Hydroponic Specimen',
  phMin: 5.5,
  phMax: 6.5,
  tdsMin: 800,
  tdsMax: 1200,
  idealWaterLevelMin: 40,
};

function resolveCropProfile(botanicalId: string, commonName: string): CropTargetProfile {
  const taxon = BOTANICAL_DATABASE.find(t => t.id === botanicalId || t.commonName.toLowerCase().includes(commonName.toLowerCase()));
  if (taxon) return taxon.targetProfile;
  return { ...DEFAULT_AGRONOMIC_PROFILE, name: commonName };
}

// Model Singleton References
let cachedModel: tf.LayersModel | null = null;
let modelLoadingPromise: Promise<tf.LayersModel | null> | null = null;
let currentLifecycleState: ModelLifecycleState = 'MODEL_LOADING';
let lastLoadError: string | null = null;

/**
 * Builds the Depthwise Separable CNN Topology matching trained weights
 */
function buildModelArchitecture(): {
  model: tf.LayersModel;
  layersMap: {
    stemConv: tf.layers.Layer;
    stemBn: tf.layers.Layer;
    dw1Conv: tf.layers.Layer;
    dw1Bn: tf.layers.Layer;
    pw1Conv: tf.layers.Layer;
    pw1Bn: tf.layers.Layer;
    dw2Conv: tf.layers.Layer;
    dw2Bn: tf.layers.Layer;
    pw2Conv: tf.layers.Layer;
    pw2Bn: tf.layers.Layer;
    dw3Conv: tf.layers.Layer;
    dw3Bn: tf.layers.Layer;
    pw3Conv: tf.layers.Layer;
    pw3Bn: tf.layers.Layer;
    fc1: tf.layers.Layer;
    outLayer: tf.layers.Layer;
  };
} {
  const input = tf.input({ shape: [160, 160, 3], name: 'image_input' });

  // Stem
  const stemConv = tf.layers.conv2d({ filters: 16, kernelSize: 3, strides: 2, padding: 'same', useBias: false, name: 'stem_conv' });
  let x = stemConv.apply(input) as tf.SymbolicTensor;
  const stemBn = tf.layers.batchNormalization({ name: 'stem_bn' });
  x = stemBn.apply(x) as tf.SymbolicTensor;
  x = tf.layers.reLU({ maxValue: 6.0, name: 'stem_relu' }).apply(x) as tf.SymbolicTensor;

  // Block 1
  const dw1Conv = tf.layers.depthwiseConv2d({ kernelSize: 3, padding: 'same', useBias: false, name: 'dw1_conv' });
  x = dw1Conv.apply(x) as tf.SymbolicTensor;
  const dw1Bn = tf.layers.batchNormalization({ name: 'dw1_bn' });
  x = dw1Bn.apply(x) as tf.SymbolicTensor;
  x = tf.layers.reLU({ maxValue: 6.0, name: 'dw1_relu' }).apply(x) as tf.SymbolicTensor;
  const pw1Conv = tf.layers.conv2d({ filters: 32, kernelSize: 1, padding: 'same', useBias: false, name: 'pw1_conv' });
  x = pw1Conv.apply(x) as tf.SymbolicTensor;
  const pw1Bn = tf.layers.batchNormalization({ name: 'pw1_bn' });
  x = pw1Bn.apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'pool1' }).apply(x) as tf.SymbolicTensor;

  // Block 2
  const dw2Conv = tf.layers.depthwiseConv2d({ kernelSize: 3, padding: 'same', useBias: false, name: 'dw2_conv' });
  x = dw2Conv.apply(x) as tf.SymbolicTensor;
  const dw2Bn = tf.layers.batchNormalization({ name: 'dw2_bn' });
  x = dw2Bn.apply(x) as tf.SymbolicTensor;
  x = tf.layers.reLU({ maxValue: 6.0, name: 'dw2_relu' }).apply(x) as tf.SymbolicTensor;
  const pw2Conv = tf.layers.conv2d({ filters: 64, kernelSize: 1, padding: 'same', useBias: false, name: 'pw2_conv' });
  x = pw2Conv.apply(x) as tf.SymbolicTensor;
  const pw2Bn = tf.layers.batchNormalization({ name: 'pw2_bn' });
  x = pw2Bn.apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'pool2' }).apply(x) as tf.SymbolicTensor;

  // Block 3
  const dw3Conv = tf.layers.depthwiseConv2d({ kernelSize: 3, padding: 'same', useBias: false, name: 'dw3_conv' });
  x = dw3Conv.apply(x) as tf.SymbolicTensor;
  const dw3Bn = tf.layers.batchNormalization({ name: 'dw3_bn' });
  x = dw3Bn.apply(x) as tf.SymbolicTensor;
  x = tf.layers.reLU({ maxValue: 6.0, name: 'dw3_relu' }).apply(x) as tf.SymbolicTensor;
  const pw3Conv = tf.layers.conv2d({ filters: 128, kernelSize: 1, padding: 'same', useBias: false, name: 'pw3_conv' });
  x = pw3Conv.apply(x) as tf.SymbolicTensor;
  const pw3Bn = tf.layers.batchNormalization({ name: 'pw3_bn' });
  x = pw3Bn.apply(x) as tf.SymbolicTensor;
  x = tf.layers.maxPooling2d({ poolSize: [2, 2], name: 'pool3' }).apply(x) as tf.SymbolicTensor;

  // Head
  x = tf.layers.globalAveragePooling2d({ name: 'gap' }).apply(x) as tf.SymbolicTensor;
  const fc1 = tf.layers.dense({ units: 64, activation: 'relu', name: 'fc1' });
  x = fc1.apply(x) as tf.SymbolicTensor;
  const outLayer = tf.layers.dense({ units: 6, activation: 'softmax', name: 'species_probabilities' });
  const out = outLayer.apply(x) as tf.SymbolicTensor;

  const model = tf.model({ inputs: input, outputs: out });

  return {
    model,
    layersMap: {
      stemConv, stemBn,
      dw1Conv, dw1Bn, pw1Conv, pw1Bn,
      dw2Conv, dw2Bn, pw2Conv, pw2Bn,
      dw3Conv, dw3Bn, pw3Conv, pw3Bn,
      fc1, outLayer
    }
  };
}

/**
 * Initializes and caches the TensorFlow.js plant classifier model
 */
export async function initializePlantClassifier(): Promise<tf.LayersModel | null> {
  if (cachedModel) return cachedModel;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      currentLifecycleState = 'MODEL_LOADING';

      // 1. Fetch model.json and binary shard
      const modelJsonRes = await fetch('/models/plant-classifier-v1/model.json');
      if (!modelJsonRes.ok) {
        throw new Error(`Failed to load model.json (${modelJsonRes.status})`);
      }
      const modelJson = await modelJsonRes.json();

      const binRes = await fetch('/models/plant-classifier-v1/group1-shard1of1.bin');
      if (!binRes.ok) {
        throw new Error(`Failed to load weights binary (${binRes.status})`);
      }
      const weightBuf = await binRes.arrayBuffer();

      // 2. Parse weights manifest and unpack tensors
      const specs: Array<{ name: string; shape: number[]; dtype: 'float32' }> =
        modelJson.weightsManifest[0].weights;

      let offset = 0;
      const weightMap = new Map<string, tf.Tensor>();
      for (const spec of specs) {
        const count = spec.shape.reduce((a, b) => a * b, 1);
        const byteLen = count * 4;
        const slice = weightBuf.slice(offset, offset + byteLen);
        const floatArr = new Float32Array(slice);
        const tensor = tf.tensor(floatArr, spec.shape, spec.dtype);
        weightMap.set(spec.name, tensor);
        offset += byteLen;
      }

      // 3. Construct model layers and inject weights
      const { model, layersMap } = buildModelArchitecture();

      layersMap.stemConv.setWeights([weightMap.get('stem_conv/kernel')!]);
      layersMap.stemBn.setWeights([
        weightMap.get('stem_bn/gamma')!,
        weightMap.get('stem_bn/beta')!,
        weightMap.get('stem_bn/moving_mean')!,
        weightMap.get('stem_bn/moving_variance')!
      ]);

      layersMap.dw1Conv.setWeights([weightMap.get('dw1_conv/kernel')!]);
      layersMap.dw1Bn.setWeights([
        weightMap.get('dw1_bn/gamma')!,
        weightMap.get('dw1_bn/beta')!,
        weightMap.get('dw1_bn/moving_mean')!,
        weightMap.get('dw1_bn/moving_variance')!
      ]);
      layersMap.pw1Conv.setWeights([weightMap.get('pw1_conv/kernel')!]);
      layersMap.pw1Bn.setWeights([
        weightMap.get('pw1_bn/gamma')!,
        weightMap.get('pw1_bn/beta')!,
        weightMap.get('pw1_bn/moving_mean')!,
        weightMap.get('pw1_bn/moving_variance')!
      ]);

      layersMap.dw2Conv.setWeights([weightMap.get('dw2_conv/kernel')!]);
      layersMap.dw2Bn.setWeights([
        weightMap.get('dw2_bn/gamma')!,
        weightMap.get('dw2_bn/beta')!,
        weightMap.get('dw2_bn/moving_mean')!,
        weightMap.get('dw2_bn/moving_variance')!
      ]);
      layersMap.pw2Conv.setWeights([weightMap.get('pw2_conv/kernel')!]);
      layersMap.pw2Bn.setWeights([
        weightMap.get('pw2_bn/gamma')!,
        weightMap.get('pw2_bn/beta')!,
        weightMap.get('pw2_bn/moving_mean')!,
        weightMap.get('pw2_bn/moving_variance')!
      ]);

      layersMap.dw3Conv.setWeights([weightMap.get('dw3_conv/kernel')!]);
      layersMap.dw3Bn.setWeights([
        weightMap.get('dw3_bn/gamma')!,
        weightMap.get('dw3_bn/beta')!,
        weightMap.get('dw3_bn/moving_mean')!,
        weightMap.get('dw3_bn/moving_variance')!
      ]);
      layersMap.pw3Conv.setWeights([weightMap.get('pw3_conv/kernel')!]);
      layersMap.pw3Bn.setWeights([
        weightMap.get('pw3_bn/gamma')!,
        weightMap.get('pw3_bn/beta')!,
        weightMap.get('pw3_bn/moving_mean')!,
        weightMap.get('pw3_bn/moving_variance')!
      ]);

      layersMap.fc1.setWeights([
        weightMap.get('fc1/kernel')!,
        weightMap.get('fc1/bias')!
      ]);
      layersMap.outLayer.setWeights([
        weightMap.get('species_probabilities/kernel')!,
        weightMap.get('species_probabilities/bias')!
      ]);

      cachedModel = model;
      currentLifecycleState = 'MODEL_READY';
      lastLoadError = null;
      console.log('[MLPlantClassifier] hydrosmart-plant-classifier-v1 ready for in-browser inference.');
      return cachedModel;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error('[MLPlantClassifier] Model initialization failed:', errMsg);
      currentLifecycleState = 'MODEL_ERROR';
      lastLoadError = errMsg;
      cachedModel = null;
      return null;
    } finally {
      modelLoadingPromise = null;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Returns current model lifecycle state and error description
 */
export function getModelLifecycleState(): {
  state: ModelLifecycleState;
  modelId: string;
  version: string;
  error: string | null;
} {
  return {
    state: currentLifecycleState,
    modelId: 'hydrosmart-plant-classifier-v1',
    version: '1.0.0',
    error: lastLoadError
  };
}

/**
 * Crop and preprocess a plant region from a video or canvas element
 */
export function preprocessPlantImage(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  boundingBox?: BoundingBox
): tf.Tensor4D {
  return tf.tidy(() => {
    let srcW = 0;
    let srcH = 0;
    if (typeof HTMLVideoElement !== 'undefined' && source instanceof HTMLVideoElement) {
      srcW = source.videoWidth;
      srcH = source.videoHeight;
    } else if (typeof HTMLCanvasElement !== 'undefined' && source instanceof HTMLCanvasElement) {
      srcW = source.width;
      srcH = source.height;
    } else if (typeof HTMLImageElement !== 'undefined' && source instanceof HTMLImageElement) {
      srcW = source.naturalWidth || source.width;
      srcH = source.naturalHeight || source.height;
    }

    if (srcW === 0 || srcH === 0) {
      return tf.zeros([1, 160, 160, 3]);
    }

    const tensor = tf.browser.fromPixels(source);

    // Crop to bounding box if specified and reliable
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
        [160, 160],
        'bilinear'
      );
      // Normalize [0, 255] to [0.0, 1.0]
      return cropped.div(255.0) as tf.Tensor4D;
    }

    // Default: resize entire frame to 160x160 and normalize
    const resized = tf.image.resizeBilinear(tensor, [160, 160]);
    return resized.expandDims(0).div(255.0) as tf.Tensor4D;
  });
}

/**
 * Perform real in-browser ML classification on a plant frame
 */
export async function classifyPlantWithML(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  options: ClassifierOptions = {}
): Promise<MLPlantClassificationResult> {
  const now = Date.now();
  const {
    boundingBox,
    confidenceThreshold = 0.65,
    lowConfidenceThreshold = 0.40,
    minMargin = 0.12,
    maxEntropy = 1.45
  } = options;

  const model = await initializePlantClassifier();

  if (!model) {
    return {
      state: 'MODEL_UNAVAILABLE',
      modelId: 'hydrosmart-plant-classifier-v1',
      modelVersion: '1.0.0',
      rankedCandidates: [],
      topConfidencePercent: 0,
      top2Margin: 0,
      entropy: 0,
      inferenceLatencyMs: 0,
      inputDimensions: [160, 160, 3],
      lifecycleState: currentLifecycleState,
      guidanceMessage: 'Plant identification model is initializing or unavailable.',
      rejectionReason: lastLoadError || 'Model not loaded',
      timestamp: now
    };
  }

  const startTime = performance.now();
  const inputTensor = preprocessPlantImage(source, boundingBox);

  let rawProbabilities: Float32Array;
  try {
    const predictionTensor = model.predict(inputTensor) as tf.Tensor;
    rawProbabilities = (await predictionTensor.data()) as Float32Array;
  } finally {
    tf.dispose(inputTensor);
  }
  const latencyMs = Math.round(performance.now() - startTime);

  // Map to candidate structures
  const candidates: MLClassProbability[] = MODEL_CLASSES_METADATA.map(meta => {
    const prob = rawProbabilities[meta.classIndex] ?? 0;
    return {
      classIndex: meta.classIndex,
      cropKey: meta.cropKey,
      commonName: meta.commonName,
      scientificName: meta.scientificName,
      family: meta.family,
      probability: parseFloat(prob.toFixed(4)),
      confidencePercent: Math.round(prob * 100),
      targetProfile: resolveCropProfile(meta.botanicalId, meta.commonName)
    };
  });

  // Sort descending by probability
  candidates.sort((a, b) => b.probability - a.probability);

  const top1 = candidates[0];
  const top2 = candidates[1];
  const top1Prob = top1 ? top1.probability : 0;
  const top2Prob = top2 ? top2.probability : 0;
  const margin = parseFloat((top1Prob - top2Prob).toFixed(4));

  // Compute Shannon Entropy
  let entropy = 0;
  for (const c of candidates) {
    if (c.probability > 0.0001) {
      entropy -= c.probability * Math.log(c.probability);
    }
  }
  entropy = parseFloat(entropy.toFixed(3));

  // Decision Logic (Unknown plant rejection)
  let state: SpeciesClassificationState = 'UNKNOWN_PLANT';
  let guidanceMessage = 'Plant type could not be identified confidently.';
  let rejectionReason: string | undefined;

  if (top1Prob >= confidenceThreshold && margin >= minMargin && entropy <= maxEntropy) {
    state = 'IDENTIFIED';
    guidanceMessage = `Plant identified as ${top1.commonName} (${top1.scientificName}).`;
  } else if (top1Prob >= lowConfidenceThreshold) {
    state = 'LOW_CONFIDENCE';
    guidanceMessage = `Plant resemblance detected (${top1.commonName} ~${top1.confidencePercent}%), but confidence is low. Try another scan.`;
    rejectionReason = `Confidence (${top1.confidencePercent}%) below optimal threshold (${Math.round(confidenceThreshold * 100)}%) or margin (${Math.round(margin * 100)}%) too close.`;
  } else {
    state = 'UNKNOWN_PLANT';
    guidanceMessage = 'Plant type could not be identified. The specimen may be an unmodeled species or obscured.';
    rejectionReason = `Maximum class probability (${top1.confidencePercent}%) is insufficient for classification.`;
  }

  return {
    state,
    modelId: 'hydrosmart-plant-classifier-v1',
    modelVersion: '1.0.0',
    primaryCandidate: state === 'IDENTIFIED' ? top1 : undefined,
    rankedCandidates: candidates,
    topConfidencePercent: top1.confidencePercent,
    top2Margin: margin,
    entropy,
    inferenceLatencyMs: latencyMs,
    inputDimensions: [160, 160, 3],
    lifecycleState: currentLifecycleState,
    guidanceMessage,
    rejectionReason,
    timestamp: now
  };
}
