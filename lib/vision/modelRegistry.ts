// ============================================================
// HydroSmart — Vision Model Registry & Inference Backend Manager
// Transparent Model State & Extensible Architecture
// ============================================================

import { VisionModelInfo } from './types';

export const REGISTERED_VISION_MODELS: VisionModelInfo[] = [
  {
    id: 'hydrosmart-plant-classifier-v1',
    name: 'HydroSmart Depthwise-Separable CNN Species Classifier',
    version: '1.0.0',
    type: 'tfjs',
    classes: [
      'Butterhead Lettuce',
      'Sweet Basil',
      'Spinach',
      'Curly Kale',
      'Spearmint',
      'Cherry Tomato',
      'Unknown Plant',
    ],
    inputSize: [160, 160],
    enabled: true,
    statusText: 'Active — In-Browser Depthwise Separable CNN (TensorFlow.js / WebGL)',
  },
  {
    id: 'hydrosmart-leaf-health-v1',
    name: 'HydroSmart Foliar Health & Anomaly Classifier',
    version: '1.0.0',
    type: 'tfjs',
    classes: [
      'Healthy Foliage',
      'Chlorosis / Yellowing Stress',
      'Necrotic Browning / Tissue Lesions',
    ],
    inputSize: [160, 160],
    enabled: true,
    statusText: 'Active — In-Browser Foliar Health CNN (TensorFlow.js / WebGL)',
  },
  {
    id: 'heuristic-v2-production',
    name: 'HydroSmart Classical Agronomic Vision Engine',
    version: '2.0-prod',
    type: 'heuristic',
    classes: [
      'Butterhead Lettuce',
      'Sweet Basil',
      'Spinach',
      'Curly Kale',
      'Bok Choy',
      'Wild Rocket Arugula',
      'Spearmint',
      'Unknown Plant',
    ],
    inputSize: [320, 240],
    enabled: false,
    statusText: 'Standby — Classical ExG/HSV Morphological Engine (ML Fallback)',
  },
];

export function getActiveVisionModel(): VisionModelInfo {
  const active = REGISTERED_VISION_MODELS.find((m) => m.enabled);
  return active || REGISTERED_VISION_MODELS[0];
}

export function isMLModelActive(): boolean {
  const active = getActiveVisionModel();
  return active.type === 'onnx' || active.type === 'tfjs';
}
