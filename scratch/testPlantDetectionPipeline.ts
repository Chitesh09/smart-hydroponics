/* eslint-disable @typescript-eslint/no-explicit-any */
import { detectPlantPresence } from '../lib/vision/plantDetector';

// Mock Canvas & Image Data generation helper
function createMockFrame(
  fillType:
    | 'empty_room'
    | 'human_face'
    | 'green_shirt'
    | 'green_bottle'
    | 'healthy_plant'
    | 'person_behind_plant'
    | 'partial_plant'
    | 'scattered_green_dots'
): any {
  const width = 160;
  const height = 120;
  const buffer = new Uint8ClampedArray(width * height * 4);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      if (fillType === 'empty_room') {
        // Neutral gray/beige room background
        buffer[idx] = 140;     // R
        buffer[idx + 1] = 135; // G
        buffer[idx + 2] = 130; // B
        buffer[idx + 3] = 255;
      } else if (fillType === 'human_face') {
        // Human face & torso in center (Skin chromaticity: R > G > B, R-G > 15)
        const isCenter = x >= 40 && x <= 120 && y >= 20 && y <= 100;
        if (isCenter) {
          buffer[idx] = 210;     // R
          buffer[idx + 1] = 160; // G
          buffer[idx + 2] = 130; // B
        } else {
          buffer[idx] = 100;
          buffer[idx + 1] = 100;
          buffer[idx + 2] = 110;
        }
        buffer[idx + 3] = 255;
      } else if (fillType === 'green_shirt') {
        // Human with a flat synthetic green shirt (Hyper-saturated flat green, skin above)
        const isHead = x >= 60 && x <= 100 && y >= 15 && y <= 45;
        const isShirt = x >= 35 && x <= 125 && y >= 46 && y <= 110;
        if (isHead) {
          buffer[idx] = 210;
          buffer[idx + 1] = 160;
          buffer[idx + 2] = 130;
        } else if (isShirt) {
          // Synthetic neon green shirt: s > 0.90, ExGR negative/flat
          buffer[idx] = 30;
          buffer[idx + 1] = 240;
          buffer[idx + 2] = 30;
        } else {
          buffer[idx] = 100;
          buffer[idx + 1] = 100;
          buffer[idx + 2] = 100;
        }
        buffer[idx + 3] = 255;
      } else if (fillType === 'green_bottle') {
        // A single vertical plastic bottle with flat reflective highlights
        const isBottle = x >= 70 && x <= 90 && y >= 30 && y <= 90;
        if (isBottle) {
          buffer[idx] = 20;
          buffer[idx + 1] = 220;
          buffer[idx + 2] = 20;
        } else {
          buffer[idx] = 120;
          buffer[idx + 1] = 120;
          buffer[idx + 2] = 120;
        }
        buffer[idx + 3] = 255;
      } else if (fillType === 'healthy_plant') {
        // Coherent vegetative leaf canopy (Organic chlorophyll reflectance, ExG > 0.15, natural green)
        const dx = (x - 80) / 40;
        const dy = (y - 65) / 35;
        const isCanopy = dx * dx + dy * dy <= 1.0;
        if (isCanopy) {
          // Leaf chlorophyll (R: 50, G: 160, B: 60) -> ExG ~ 0.35, natural leaf hue ~ 125 deg
          const noise = ((x * 17 + y * 23) % 15) - 7;
          buffer[idx] = Math.max(30, 50 + noise);
          buffer[idx + 1] = Math.min(220, 160 + noise * 2);
          buffer[idx + 2] = Math.max(30, 60 + noise);
        } else {
          buffer[idx] = 80;
          buffer[idx + 1] = 85;
          buffer[idx + 2] = 90;
        }
        buffer[idx + 3] = 255;
      } else if (fillType === 'person_behind_plant') {
        // Person in background (skin on top), prominent plant canopy in foreground
        const isHead = x >= 65 && x <= 95 && y >= 10 && y <= 35;
        const dx = (x - 80) / 45;
        const dy = (y - 75) / 35;
        const isPlant = dx * dx + dy * dy <= 1.0;

        if (isPlant) {
          buffer[idx] = 50;
          buffer[idx + 1] = 165;
          buffer[idx + 2] = 55;
        } else if (isHead) {
          buffer[idx] = 210;
          buffer[idx + 1] = 160;
          buffer[idx + 2] = 130;
        } else {
          buffer[idx] = 90;
          buffer[idx + 1] = 90;
          buffer[idx + 2] = 100;
        }
        buffer[idx + 3] = 255;
      } else if (fillType === 'scattered_green_dots') {
        // Scattered green dots (low spatial coherence across frame)
        const isDot = (x % 20 === 0 && y % 20 === 0);
        if (isDot) {
          buffer[idx] = 40;
          buffer[idx + 1] = 180;
          buffer[idx + 2] = 40;
        } else {
          buffer[idx] = 110;
          buffer[idx + 1] = 110;
          buffer[idx + 2] = 110;
        }
        buffer[idx + 3] = 255;
      } else {
        // Partial plant
        const isSmallPlant = x >= 60 && x <= 100 && y >= 50 && y <= 85;
        if (isSmallPlant) {
          buffer[idx] = 55;
          buffer[idx + 1] = 155;
          buffer[idx + 2] = 65;
        } else {
          buffer[idx] = 100;
          buffer[idx + 1] = 100;
          buffer[idx + 2] = 100;
        }
        buffer[idx + 3] = 255;
      }
    }
  }

  // Mock a canvas-like object with getImageData for test runner
  return {
    width,
    height,
    getContext: () => ({
      drawImage: () => {},
      getImageData: () => ({ data: buffer, width, height }),
    }),
  };
}

// Global document mock for Node.js test execution
(global as any).document = {
  createElement: (tag: string) => {
    if (tag === 'canvas') {
      return {
        width: 160,
        height: 120,
        getContext: () => ({
          drawImage: () => {},
          getImageData: (_x: number, _y: number, w: number, h: number) => ({
            data: (global as any).__currentTestData || new Uint8ClampedArray(w * h * 4),
            width: w,
            height: h,
          }),
        }),
      };
    }
    return {};
  },
};

function runTest(name: string, fillType: any, expectedDetected: boolean, minPresence?: number, maxPresence?: number) {
  const mockFrame = createMockFrame(fillType);
  (global as any).__currentTestData = mockFrame.getContext().getImageData().data;

  const result = detectPlantPresence(mockFrame as any);
  const passed =
    result.isPlantDetected === expectedDetected &&
    (minPresence === undefined || result.plantPresenceScore >= minPresence) &&
    (maxPresence === undefined || result.plantPresenceScore <= maxPresence);

  console.log(
    `${passed ? '✅ PASS' : '❌ FAIL'}: ${name} -> isPlantDetected: ${result.isPlantDetected} | PresenceScore: ${result.plantPresenceScore}% | Status: "${result.statusText}"`
  );

  if (!passed) {
    throw new Error(`Test failed for ${name}`);
  }
}

console.log('=== HYDROSMART PLANT DETECTION & NON-PLANT REJECTION TEST SUITE ===');

// 1. Human sitting in front of camera -> MUST BE REJECTED
runTest('1. Human in front of camera', 'human_face', false, undefined, 35);

// 2. Empty room -> MUST BE REJECTED
runTest('2. Empty room background', 'empty_room', false, undefined, 20);

// 3. Human with green shirt -> MUST BE REJECTED
runTest('3. Human with green shirt', 'green_shirt', false, undefined, 45);

// 4. Green plastic bottle -> MUST BE REJECTED
runTest('4. Green plastic bottle', 'green_bottle', false, undefined, 45);

// 5. Scattered green noise -> MUST BE REJECTED (Low spatial coherence)
runTest('5. Scattered green noise', 'scattered_green_dots', false, undefined, 35);

// 6. Healthy Plant with organic canopy -> MUST BE DETECTED
runTest('6. Healthy plant canopy', 'healthy_plant', true, 65, 100);

// 7. Person standing behind visible plant canopy -> MUST BE DETECTED
runTest('7. Person standing behind plant', 'person_behind_plant', true, 50, 100);

console.log('-------------------------------------------------------------------');
console.log('RESULT: ALL PLANT DETECTION & REJECTION SCENARIOS PASSED (100%)');
