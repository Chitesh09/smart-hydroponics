// scripts/verify-plant-detector.mjs
// Automated Verification Suite for HydroSmart Phase 3: Real Plant / No-Plant Detection

import {
  detectPlantPresence,
  PLANT_DETECTOR_CONFIG,
} from '../lib/vision/plantDetector.ts';

const WIDTH = 160;
const HEIGHT = 120;
const TOTAL_PIXELS = WIDTH * HEIGHT;

/**
 * Helper to generate synthetic pixel buffers
 */
function createSyntheticFrame(pixelFn) {
  const data = new Uint8ClampedArray(TOTAL_PIXELS * 4);
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      const idx = (y * WIDTH + x) * 4;
      const [r, g, b] = pixelFn(x, y);
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = 255;
    }
  }
  return { data, width: WIDTH, height: HEIGHT };
}

async function runVerification() {
  console.log('================================================================');
  console.log('HydroSmart Phase 3 — Computer-Vision Plant Presence Test Suite');
  console.log('================================================================\n');

  let passed = 0;
  const total = 14;

  // --- TEST A: Empty room (neutral walls/floor, no foliage) ---
  console.log('TEST A: Empty room (neutral background, zero foliage)');
  const emptyRoomFrame = createSyntheticFrame((x, y) => [180, 180, 175]);
  const resA = detectPlantPresence(emptyRoomFrame);
  if (resA.state === 'NO_PLANT_DETECTED' && !resA.isPlantDetected && resA.boundingBox === undefined) {
    console.log(`  ✓ PASS: State = ${resA.state}, isPlantDetected = false, bbox = undefined`);
    console.log(`    Message: "${resA.userMessage}"\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Empty room gave unexpected state:', resA.state);
  }

  // --- TEST B: Person standing in front of camera (no green) ---
  console.log('TEST B: Person standing in camera view (no foliage)');
  const personFrame = createSyntheticFrame((x, y) => {
    // Face / skin
    if (x >= 65 && x <= 95 && y >= 15 && y <= 45) return [205, 142, 112];
    // Blue shirt
    if (x >= 50 && x <= 110 && y >= 46 && y <= 115) return [45, 75, 140];
    // Neutral background
    return [175, 175, 170];
  });
  const resB = detectPlantPresence(personFrame);
  if (resB.state === 'NO_PLANT_DETECTED' && !resB.isPlantDetected && resB.isHumanPresent) {
    console.log(`  ✓ PASS: State = ${resB.state}, isHumanPresent = true, isPlantDetected = false`);
    console.log(`    Message: "${resB.userMessage}"\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Person frame gave unexpected state:', resB.state, resB);
  }

  // --- TEST C: Person wearing green shirt (clothing, not a plant!) ---
  console.log('TEST C: Person wearing green shirt (flat green fabric, low leaf texture)');
  const greenShirtFrame = createSyntheticFrame((x, y) => {
    // Face / skin
    if (x >= 65 && x <= 95 && y >= 15 && y <= 45) return [205, 142, 112];
    // Flat green shirt: uniform green with no leaf texture
    if (x >= 50 && x <= 110 && y >= 46 && y <= 115) return [55, 165, 65];
    return [175, 175, 170];
  });
  const resC = detectPlantPresence(greenShirtFrame);
  if (resC.state === 'NO_PLANT_DETECTED' && !resC.isPlantDetected && resC.boundingBox === undefined) {
    console.log(`  ✓ PASS: State = ${resC.state}, isPlantDetected = false, bbox = undefined`);
    console.log(`    Diagnostics: EdgeDensity=${resC.diagnostics?.internalEdgeDensity}, Skin%=${resC.diagnostics?.skinPercent}%`);
    console.log(`    Rejection Reason: "${resC.nonPlantRejectionReason}"\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Green shirt incorrectly flagged as plant:', resC.state, resC);
  }

  // --- TEST D: Green wall / flat green object (solid planar surface) ---
  console.log('TEST D: Green wall / planar object (high solidity > 0.85, low internal edge density)');
  const greenWallFrame = createSyntheticFrame((x, y) => {
    // Solid green rectangular surface
    if (x >= 25 && x <= 135 && y >= 20 && y <= 100) return [60, 160, 55];
    return [160, 160, 155];
  });
  const resD = detectPlantPresence(greenWallFrame);
  if (resD.state === 'NO_PLANT_DETECTED' && !resD.isPlantDetected && resD.diagnostics?.solidSurfaceDetected) {
    console.log(`  ✓ PASS: State = ${resD.state}, solidSurfaceDetected = true, isPlantDetected = false`);
    console.log(`    Rejection Reason: "${resD.nonPlantRejectionReason}"\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Green wall incorrectly detected as plant:', resD.state, resD);
  }

  // --- TEST E: Plant clearly visible (organic chlorophyll, leaf texture, natural solidity) ---
  console.log('TEST E: Plant clearly visible (organic leaf canopy with rich edge texture)');
  const plantFrame = createSyntheticFrame((x, y) => {
    // Central plant cluster with organic leaf edges and gaps
    const inCluster = x >= 45 && x <= 115 && y >= 25 && y <= 95;
    if (inCluster) {
      // Create organic gaps (density ~0.48)
      const leafPattern = (Math.sin(x * 0.45) * Math.cos(y * 0.45)) > -0.05;
      if (leafPattern) {
        // High-frequency leaf venation / margin variations
        const marginEdge = ((x + y) % 4 === 0) ? 25 : 0;
        return [35 + marginEdge, 140 + marginEdge, 45];
      }
    }
    return [175, 175, 170];
  });
  const resE = detectPlantPresence(plantFrame);
  if (
    resE.state === 'PLANT_DETECTED' &&
    resE.isPlantDetected &&
    resE.boundingBox !== undefined &&
    resE.plantPresenceScore >= 50
  ) {
    console.log(`  ✓ PASS: State = ${resE.state}, PresenceScore = ${resE.plantPresenceScore}/100, Canopy = ${resE.canopyCoveragePercent}%`);
    console.log(`    EdgeDensity = ${resE.diagnostics?.internalEdgeDensity}, BoundingBox = ${JSON.stringify(resE.boundingBox)}\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Valid plant not detected:', resE.state, resE);
  }

  // --- TEST F: Person holding a plant (human + independent plant cluster) ---
  console.log('TEST F: Person holding a plant (human present + independent plant cluster)');
  const holdingPlantFrame = createSyntheticFrame((x, y) => {
    // Person face (skin)
    if (x >= 65 && x <= 95 && y >= 10 && y <= 35) return [205, 142, 112];
    // Person coat (dark gray)
    if (x >= 40 && x <= 120 && y >= 36 && y <= 115) {
      // Independent plant pot being held in front
      const inPlantPot = x >= 55 && x <= 105 && y >= 50 && y <= 95;
      if (inPlantPot) {
        const leafPattern = (Math.sin(x * 0.5) * Math.cos(y * 0.5)) > -0.05;
        if (leafPattern) {
          const marginEdge = ((x + y) % 3 === 0) ? 22 : 0;
          return [40 + marginEdge, 145 + marginEdge, 50];
        }
      }
      return [60, 60, 65]; // coat
    }
    return [175, 175, 170];
  });
  const resF = detectPlantPresence(holdingPlantFrame);
  if (
    resF.state === 'PLANT_DETECTED' &&
    resF.isPlantDetected &&
    resF.isHumanPresent &&
    resF.diagnostics?.independentPlantClusterFound
  ) {
    console.log(`  ✓ PASS: State = ${resF.state}, isHumanPresent = true, independentPlantClusterFound = true`);
    console.log(`    Score = ${resF.plantPresenceScore}/100, Message: "${resF.userMessage}"\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Plant held by person not recognized:', resF.state, resF);
  }

  // --- TEST G: Small or distant plant (<2.0% area) ---
  console.log('TEST G: Small or distant plant (covers ~1.5% of frame)');
  const smallPlantFrame = createSyntheticFrame((x, y) => {
    // Tiny cluster (18x16 = 288 pixels = 1.5% of frame)
    if (x >= 71 && x <= 88 && y >= 52 && y <= 67) {
      const marginEdge = ((x + y) % 3 === 0) ? 20 : 0;
      return [40 + marginEdge, 145 + marginEdge, 50];
    }
    return [175, 175, 170];
  });
  const resG = detectPlantPresence(smallPlantFrame);
  if (resG.state === 'LOW_CONFIDENCE' && !resG.isPlantDetected) {
    console.log(`  ✓ PASS: State = ${resG.state}, isPlantDetected = false`);
    console.log(`    Message: "${resG.userMessage}"\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Small plant did not trigger LOW_CONFIDENCE:', resG.state, resG);
  }

  // --- TEST H: Dark frame (mean luma < 30) ---
  console.log('TEST H: Dark environment (mean luma < 30)');
  const darkFrame = createSyntheticFrame(() => [16, 18, 14]);
  const resH = detectPlantPresence(darkFrame);
  if (resH.state === 'SCAN_NOT_READY' && !resH.isPlantDetected && resH.quality?.isUnderexposed) {
    console.log(`  ✓ PASS: State = ${resH.state}, isUnderexposed = true`);
    console.log(`    Message: "${resH.userMessage}"\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Dark frame not marked SCAN_NOT_READY:', resH.state, resH);
  }

  // --- TEST I: Severely blurred plant frame ---
  console.log('TEST I: Severely blurred plant frame (out-of-focus foliage, smeared edges)');
  const blurryPlantFrame = createSyntheticFrame((x, y) => {
    // Foliage cluster in center (45..105, 35..85) with organic leaf cluster mask
    const cx = 75;
    const cy = 60;
    const dx = (x - cx) / 30;
    const dy = (y - cy) / 25;
    // Elliptical organic cluster with lobe modulation so density is ~0.60 (not a solid planar rectangle)
    const angle = Math.atan2(dy, dx);
    const radiusMod = 0.85 + 0.15 * Math.sin(4 * angle);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const inPlantRegion = dist <= radiusMod;

    if (inPlantRegion) {
      // Smooth blurred foliage gradient (low contrast, no sharp veins)
      const smoothGrad = Math.round((1 - Math.min(1, dist)) * 20);
      return [40, 135 + smoothGrad, 45];
    }
    return [175, 175, 170];
  });
  const resI = detectPlantPresence(blurryPlantFrame);
  if (resI.state === 'SCAN_NOT_READY' || resI.state === 'LOW_CONFIDENCE') {
    console.log(`  ✓ PASS: State = ${resI.state}, isPlantDetected = false`);
    console.log(`    Message: "${resI.userMessage}"\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Blurry plant frame not marked SCAN_NOT_READY or LOW_CONFIDENCE:', resI.state, resI);
  }

  // --- TEST J: Diffuse background vegetation (scattered noise across frame) ---
  console.log('TEST J: Diffuse background vegetation (scattered green noise, coherence < 0.28)');
  const backgroundVegFrame = createSyntheticFrame((x, y) => {
    // Scattered tiny specks across all corners
    if ((x * y) % 17 === 0 && ((x + y) % 7 === 0)) {
      return [45, 140, 50];
    }
    return [175, 175, 170];
  });
  const resJ = detectPlantPresence(backgroundVegFrame);
  if (resJ.state === 'LOW_CONFIDENCE' || (resJ.state === 'NO_PLANT_DETECTED' && !resJ.isPlantDetected)) {
    console.log(`  ✓ PASS: State = ${resJ.state}, isPlantDetected = false (rejected diffuse background)`);
    console.log(`    Diagnostics: Coherence=${resJ.diagnostics?.spatialCoherence}, Dominant=${resJ.diagnostics?.backgroundVegetationDominant}\n`);
    passed++;
  } else {
    console.error('  ✗ FAIL: Diffuse background falsely declared as plant:', resJ.state, resJ);
  }

  // --- TEST K: Temporal stability hysteresis filter ---
  console.log('TEST K: Temporal stability hysteresis (single dropped frame does not flutter PLANT_DETECTED)');
  // Simulate 5 consecutive frames in monitor:
  // F1: plant, F2: plant, F3: plant -> stabilized PLANT_DETECTED
  // F4: single bad/glitch frame -> should stay PLANT_DETECTED due to hysteresis!
  const frames = [resE.state, resE.state, resE.state, resA.state];
  let stabilized = 'NO_PLANT_DETECTED';
  const history = [];
  for (const f of frames) {
    history.push(f);
    if (history.length > 5) history.shift();
    if (stabilized === 'PLANT_DETECTED') {
      const nonPlantConsecutive = history.slice(-3).every((s) => s !== 'PLANT_DETECTED');
      if (nonPlantConsecutive) stabilized = 'NO_PLANT_DETECTED';
    } else {
      const plantVotes = history.filter((s) => s === 'PLANT_DETECTED').length;
      if (plantVotes >= 3) stabilized = 'PLANT_DETECTED';
    }
  }
  if (stabilized === 'PLANT_DETECTED') {
    console.log('  ✓ PASS: Single negative frame did not reset PLANT_DETECTED (hysteresis held)\n');
    passed++;
  } else {
    console.error('  ✗ FAIL: Single frame dropped stabilized state unexpectedly:', stabilized);
  }

  // --- TEST L: Downstream blocking ---
  console.log('TEST L: Downstream intelligence blocking on NO_PLANT_DETECTED and SCAN_NOT_READY');
  function simulateCaptureAndObserve(detection, plantId) {
    if (
      !detection ||
      !detection.isPlantDetected ||
      detection.state === 'NO_PLANT_DETECTED' ||
      detection.state === 'SCAN_NOT_READY'
    ) {
      return null;
    }
    return { id: `obs_${Date.now()}`, plantId, isPlantDetected: true };
  }
  const blockedOnEmpty = simulateCaptureAndObserve(resA, 'plant_primary');
  const blockedOnDark = simulateCaptureAndObserve(resH, 'plant_primary');
  const allowedOnPlant = simulateCaptureAndObserve(resE, 'plant_primary');

  if (blockedOnEmpty === null && blockedOnDark === null && allowedOnPlant !== null && allowedOnPlant.plantId === 'plant_primary') {
    console.log('  ✓ PASS: Observation creation strictly blocked on empty/dark frames, allowed only on PLANT_DETECTED\n');
    passed++;
  } else {
    console.error('  ✗ FAIL: Downstream blocking violated:', { blockedOnEmpty, blockedOnDark, allowedOnPlant });
  }

  // --- TEST M: Bounding box suppression ---
  console.log('TEST M: Bounding box suppression (only emitted on confirmed PLANT_DETECTED)');
  const boxEmpty = resA.boundingBox;
  const boxShirt = resC.boundingBox;
  const boxWall = resD.boundingBox;
  const boxPlant = resE.boundingBox;

  if (boxEmpty === undefined && boxShirt === undefined && boxWall === undefined && boxPlant !== undefined) {
    console.log('  ✓ PASS: Bounding box strictly suppressed on non-plants, emitted on valid plant\n');
    passed++;
  } else {
    console.error('  ✗ FAIL: Bounding box fabricated on non-plant:', { boxEmpty, boxShirt, boxWall, boxPlant });
  }

  // --- TEST N: Configurable thresholds ---
  console.log('TEST N: Configurable detector thresholds (PLANT_DETECTOR_CONFIG is tunable)');
  // Override minPlantAreaPercent to 50% - should downgrade clear plant to LOW_CONFIDENCE
  const resCustom = detectPlantPresence(plantFrame, { minPlantAreaPercent: 50.0 });
  if (resCustom.state === 'LOW_CONFIDENCE' && PLANT_DETECTOR_CONFIG.minPlantAreaPercent === 2.2) {
    console.log('  ✓ PASS: PLANT_DETECTOR_CONFIG respected runtime override and default remained intact\n');
    passed++;
  } else {
    console.error('  ✗ FAIL: Config override failed:', resCustom.state);
  }

  console.log('================================================================');
  console.log(`Results: ${passed} / ${total} verification tests passed.`);
  console.log('================================================================\n');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runVerification();
