// ============================================================
// HydroSmart — Vision Model Registry & Inference Backend Manager
// Transparent Model State & Extensible Architecture
// ============================================================

import { VisionModelInfo } from './types';

export const REGISTERED_VISION_MODELS: VisionModelInfo[] = [
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
    enabled: true,
    statusText: 'Active — Classical ExG/HSV Chlorophyll Segmentation & Morphological Matching',
  },
  {
    id: 'onnx-plant-classifier-v1',
    name: 'Lightweight Plant Species ONNX Classifier',
    version: '1.0-preview',
    type: 'onnx',
    classes: ['Lettuce', 'Basil', 'Spinach', 'Kale', 'Unknown'],
    inputSize: [224, 224],
    enabled: false,
    statusText: 'ML model integration not yet activated (Awaiting validated weights bundle)',
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
