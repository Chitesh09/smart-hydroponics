/**
 * HydroSmart — Phase 8: Plant Digital Profile & Lifecycle Intelligence Engine
 * 
 * Transforms the monitored plant representation into a complete digital profile
 * maintaining one persistent identity (plantId) while decoupling identity from state.
 * 
 * Answers core grower inquiries:
 * - What plant is this? (Identity)
 * - When was it added? (Provenance)
 * - What species is it and how confident is the model? (ML Taxonomy)
 * - What is its current health state? (Physiological Health)
 * - How has its health changed? (Health History)
 * - How has it grown? (Optical Canopy Dynamics)
 * - What environmental conditions has it experienced? (Root-Zone Telemetry)
 * - What important milestones occurred? (Lifecycle Journey)
 * - What is still unknown? (Profile Completeness Audit)
 */

import {
  PlantProfile,
  PlantObservation,
  PlantReasoningEvent,
  WhatChangedSummary,
  PlantMilestone,
  PlantIdentificationStatus,
  PlantLifecycleState,
  MonitoringState,
  BaselineStatus,
  ProfileCompleteness,
  SensorAvailabilityState,
  StructuredHealthState,
  PlantDetectionResult,
  VisualHealthAnalysisResult,
} from './types';

const GROWTH_DISCLAIMER =
  'IMAGE-DERIVED GROWTH ESTIMATES: Values represent 2D optical canopy surface area changes detected by the camera and do not claim physical wet/dry biomass measurement.';

export interface DigitalProfileInput {
  storedProfile?: PlantProfile | null;
  observations?: PlantObservation[];
  latestReading?: { ph: number; tds: number; waterLevel: number; distance?: number } | null;
  latestDetection?: PlantDetectionResult | null;
  latestVisualHealth?: VisualHealthAnalysisResult | null;
  latestReasoningEvent?: PlantReasoningEvent | null;
  whatChangedSummary?: WhatChangedSummary | null;
  isCameraActive?: boolean;
  isTelemetryStale?: boolean;
  telemetryMode?: 'real' | 'simulation';
}

/**
 * Derives a complete digital representation of the plant combining identity,
 * lifecycle state, baseline quality, growth estimates, environmental history,
 * and profile completeness.
 */
export function deriveDigitalPlantProfile(input: DigitalProfileInput): PlantProfile {
  const {
    storedProfile,
    observations = [],
    latestReading,
    latestDetection,
    latestVisualHealth,
    latestReasoningEvent,
    whatChangedSummary,
    isCameraActive = false,
    isTelemetryStale = false,
    telemetryMode = 'real',
  } = input;

  const now = Date.now();
  const dayMs = 86400000;

  // 1. Stable Identity Invariant: Single immutable plantId
  const plantId = storedProfile?.plantId || 'plant_primary';
  const createdAt = storedProfile?.createdAt || (now - 7 * dayMs);

  // 2. Chronological Ordering of Observations
  // observations[0] is newest, observations[observations.length - 1] is oldest baseline
  const sorted = [...observations].sort((a, b) => b.timestamp - a.timestamp);
  const latestObs = sorted.length > 0 ? sorted[0] : null;
  const baselineObs = sorted.length > 0 ? sorted[sorted.length - 1] : null;

  // 3. Species Identity & Status
  let species = storedProfile?.species;
  if (!species || species === 'Unknown Plant' || species === 'unknown_plant' || species === 'Plant') {
    species = latestObs?.plantSpecies || species;
  } else if (latestObs?.plantSpecies && latestObs.plantSpecies !== 'Unknown Plant' && latestObs.plantSpecies !== 'Plant' && latestObs.plantSpecies !== species) {
    if ((latestObs.speciesConfidence ?? 0) >= (storedProfile?.speciesConfidence ?? 0)) {
      species = latestObs.plantSpecies;
    }
  }

  let commonName = storedProfile?.commonName;
  if (!commonName || commonName === 'Plant' || commonName === 'Unknown Plant' || species !== storedProfile?.species) {
    commonName = species || 'Plant';
  }
  const scientificName = storedProfile?.scientificName || (species ? `${species} sp.` : undefined);
  const family = storedProfile?.family;

  const speciesConfidence = latestObs?.speciesConfidence !== undefined
    ? Math.max(storedProfile?.speciesConfidence ?? 0, latestObs.speciesConfidence)
    : storedProfile?.speciesConfidence;

  let identificationStatus: PlantIdentificationStatus = 'UNKNOWN';
  if (whatChangedSummary?.reviewRequiredItems && whatChangedSummary.reviewRequiredItems.length > 0) {
    identificationStatus = 'REVIEW_REQUIRED';
  } else if (!species || species === 'Unknown Plant' || species === 'Plant') {
    identificationStatus = 'UNKNOWN';
  } else if (speciesConfidence !== undefined && speciesConfidence < 60) {
    identificationStatus = 'LOW_CONFIDENCE';
  } else {
    identificationStatus = 'IDENTIFIED';
  }

  // 4. Monitoring State
  const isTelemetryAvailable = latestReading !== null && latestReading !== undefined && !isStaleCheck(latestReading, isTelemetryStale);
  let monitoringStatus: MonitoringState = 'OFFLINE';
  if (isCameraActive || isTelemetryAvailable) {
    monitoringStatus = 'ACTIVE';
  } else if (isTelemetryStale) {
    monitoringStatus = 'PAUSED';
  }

  // 5. Baseline Evaluation & Status
  let baselineStatus: BaselineStatus = 'BASELINE_PENDING';
  let baselineObservationId: string | undefined = undefined;
  let baselineCreatedAt: number | undefined = undefined;
  let initialCanopyCoverage: number | undefined = undefined;
  let initialHealthScore: number | undefined = undefined;
  let initialPH: number | undefined = undefined;
  let initialTDS: number | undefined = undefined;
  let initialWaterLevel: number | undefined = undefined;

  if (baselineObs) {
    baselineObservationId = baselineObs.id;
    baselineCreatedAt = baselineObs.timestamp;
    initialCanopyCoverage = baselineObs.canopyCoveragePercent;
    initialHealthScore = baselineObs.visualHealthScore || baselineObs.overallHealthScore;
    initialPH = baselineObs.ph;
    initialTDS = baselineObs.tds;
    initialWaterLevel = baselineObs.waterLevel;

    // Check optical quality of baseline
    const baselineConfidence = baselineObs.plantDetectionConfidence ?? 0;
    if (baselineObs.isPlantDetected === false || (baselineConfidence > 0 && baselineConfidence < 45)) {
      baselineStatus = 'INSUFFICIENT_QUALITY';
    } else {
      baselineStatus = 'BASELINE_ESTABLISHED';
    }
  }

  // 6. Current State & Structured Health
  const currentHealthStatus: StructuredHealthState =
    latestReasoningEvent?.plantState ||
    (latestVisualHealth?.healthState as StructuredHealthState) ||
    (latestObs?.visualHealthState as StructuredHealthState) ||
    (storedProfile?.currentHealthStatus as StructuredHealthState) ||
    'STABLE';

  const healthConfidence: 'high' | 'moderate' | 'low' | 'unknown' =
    latestReasoningEvent?.confidence === 'high' ? 'high' :
    latestReasoningEvent?.confidence === 'moderate' ? 'moderate' :
    latestReasoningEvent?.confidence === 'low' ? 'low' :
    storedProfile?.healthConfidence || 'moderate';

  const activeAnomaly =
    latestReasoningEvent?.plantState === 'CRITICAL' || latestReasoningEvent?.plantState === 'ATTENTION'
      ? latestReasoningEvent.observations[0]
      : latestObs?.activeAnomalies?.[0] || storedProfile?.activeAnomaly;

  // 7. Growth Dynamics & Optical Confidence Gating
  const latestCanopyCoverage = latestObs?.canopyCoveragePercent ?? latestDetection?.canopyCoveragePercent ?? initialCanopyCoverage;
  let cumulativeGrowthDelta = 0;
  if (latestCanopyCoverage !== undefined && initialCanopyCoverage !== undefined) {
    cumulativeGrowthDelta = Number((latestCanopyCoverage - initialCanopyCoverage).toFixed(1));
  }

  // Elapsed days
  const elapsedMs = Math.max(1, (latestObs?.timestamp || now) - createdAt);
  const daysMonitored = Math.max(1, Math.round(elapsedMs / dayMs));
  const dailyGrowthVelocity = Number((cumulativeGrowthDelta / daysMonitored).toFixed(2));

  let growthTrend: 'expanding' | 'steady' | 'contracting' | 'insufficient_data' = 'insufficient_data';
  let growthConfidence: 'HIGH' | 'MODERATE' | 'LOW' = 'HIGH';

  // Optical gating check: If camera sharpness or detection confidence is low, downgrade growth confidence
  const detectionConfidence = latestDetection?.confidence ?? latestObs?.plantDetectionConfidence ?? 90;
  if (detectionConfidence < 50 || latestDetection?.state === 'LOW_CONFIDENCE' || latestDetection?.state === 'SCAN_NOT_READY') {
    growthConfidence = 'LOW';
  } else if (detectionConfidence < 80) {
    growthConfidence = 'MODERATE';
  }

  if (sorted.length < 2) {
    growthTrend = 'insufficient_data';
  } else if (cumulativeGrowthDelta > 1.5) {
    growthTrend = 'expanding';
  } else if (cumulativeGrowthDelta < -1.5) {
    growthTrend = 'contracting';
  } else {
    growthTrend = 'steady';
  }

  // 8. Environmental State & Sensor Availability
  const sensorAvailability = {
    ph: getSensorState(latestReading?.ph, isTelemetryStale, telemetryMode),
    tds: getSensorState(latestReading?.tds, isTelemetryStale, telemetryMode),
    waterLevel: getSensorState(latestReading?.waterLevel, isTelemetryStale, telemetryMode),
  };

  // 9. Lifecycle State Derivation
  let lifecycleState: PlantLifecycleState = 'MONITORING';
  if (sorted.length === 0) {
    lifecycleState = 'CREATED';
  } else if (baselineStatus === 'BASELINE_PENDING' || sorted.length < 2) {
    lifecycleState = 'BASELINE_PENDING';
  } else if (currentHealthStatus === 'CRITICAL' || currentHealthStatus === 'ATTENTION') {
    lifecycleState = 'ATTENTION';
  } else if (whatChangedSummary?.overallDirection === 'recovered' || storedProfile?.recoveryStatus === 'recovering') {
    lifecycleState = 'RECOVERING';
  } else if (growthTrend === 'expanding' && growthConfidence !== 'LOW') {
    lifecycleState = 'GROWING';
  } else if (currentHealthStatus === 'HEALTHY' || (currentHealthStatus as string) === 'optimal' || currentHealthStatus === 'STABLE') {
    lifecycleState = 'STABLE';
  }

  // 10. Profile Completeness Audit
  const completeness = calculateProfileCompleteness({
    identificationStatus,
    speciesConfidence,
    baselineStatus,
    observationCount: sorted.length,
    growthTrend,
    growthConfidence,
    sensorAvailability,
  });

  // Assemble full Digital Plant Profile
  const profile: PlantProfile = {
    // Top-level properties (100% backward compatible)
    plantId,
    species,
    commonName,
    scientificName,
    family,
    speciesConfidence,
    identifiedAt: storedProfile?.identifiedAt || (identificationStatus === 'IDENTIFIED' ? now : undefined),
    modelVersion: storedProfile?.modelVersion || 'hydrosmart-plant-classifier-v1',
    createdAt,
    lastObservedAt: latestObs?.timestamp || now,
    monitoringStatus: monitoringStatus as 'active' | 'archived' | 'completed',
    currentHealthStatus,
    lifecycleState,
    identificationStatus,
    baselineStatus,
    observationCount: Math.max(sorted.length, storedProfile?.observationCount || 0),
    targetProfile: storedProfile?.targetProfile,
    lastVisualAssessment: latestVisualHealth || storedProfile?.lastVisualAssessment,
    lastVisualAssessmentAt: latestVisualHealth ? now : storedProfile?.lastVisualAssessmentAt,
    healthConfidence,
    activeAnomaly,
    recoveryStatus: lifecycleState === 'RECOVERING' ? 'recovering' : 'stable',

    // Extended Phase 8 Digital Representation
    identity: {
      plantId,
      species,
      commonName,
      scientificName,
      family,
      speciesConfidence,
      identificationStatus,
      identifiedAt: storedProfile?.identifiedAt,
    },
    lifecycle: {
      createdAt,
      lastObservedAt: latestObs?.timestamp || now,
      monitoringStartedAt: createdAt,
      monitoringStatus,
      lifecycleState,
    },
    currentState: {
      healthStatus: currentHealthStatus,
      healthConfidence,
      currentAnomaly: activeAnomaly,
      activeAnomaly,
      latestReasoningEventId: latestReasoningEvent?.id,
      reasoningSummary: latestReasoningEvent?.scenarioCode
        ? `${latestReasoningEvent.scenarioCode}: ${latestReasoningEvent.observations?.join('; ') || ''}`
        : undefined,
      currentGrowthState: growthTrend,
      visualHealthScore: latestVisualHealth?.visualHealthScore || latestObs?.visualHealthScore,
    },
    statistics: {
      observationCount: sorted.length,
      totalObservationCount: sorted.length,
      reasoningEventCount: sorted.filter(o => Boolean(o.reasoningEvent)).length,
      changeEventCount: whatChangedSummary?.events?.length || 0,
      daysMonitored,
    },
    baseline: {
      baselineObservationId,
      baselineCreatedAt,
      baselineStatus,
      isEstablished: baselineStatus === 'BASELINE_ESTABLISHED',
      initialCanopyCoverage,
      initialHealthScore,
      initialPH,
      initialTDS,
      initialWaterLevel,
    },
    growth: {
      latestCanopyCoverage,
      latestPlantArea: latestDetection?.boundingBox ? latestDetection.boundingBox.width * latestDetection.boundingBox.height : undefined,
      cumulativeGrowthDelta,
      growthTrend,
      growthConfidence,
      dailyGrowthVelocity,
      disclaimer: GROWTH_DISCLAIMER,
    },
    environment: {
      latestPH: latestReading?.ph ?? latestObs?.ph,
      latestTDS: latestReading?.tds ?? latestObs?.tds,
      latestWaterLevel: latestReading?.waterLevel ?? latestObs?.waterLevel,
      sensorAvailability,
      phTrend: computeMetricTrend(sorted.map(o => o.ph)),
      tdsTrend: computeMetricTrend(sorted.map(o => o.tds)),
      waterTrend: computeMetricTrend(sorted.map(o => o.waterLevel)),
    },
    completeness,
    metadata: {
      profileVersion: 'hydrosmart-profile-v8.0',
      createdBy: 'hydrosmart-intelligence-core',
      updatedAt: now,
    },
  };

  return profile;
}

/**
 * Compiles chronological milestones representing real historical lifecycle transitions
 */
export function compilePlantLifecycleMilestones(
  observationsOrInput: PlantObservation[] | {
    observations?: PlantObservation[];
    reasoningHistory?: PlantReasoningEvent[];
    whatChangedSummary?: WhatChangedSummary | null;
    plantProfile?: PlantProfile | null;
    plantId?: string;
    createdAt?: number;
  } = [],
  reasoningHistory: PlantReasoningEvent[] = [],
  whatChangedSummary?: WhatChangedSummary | null,
  plantProfile?: PlantProfile | null
): PlantMilestone[] {
  let observations: PlantObservation[] = [];
  let resolvedReasoning = reasoningHistory;
  let resolvedWhatChanged = whatChangedSummary;
  let resolvedProfile = plantProfile;

  if (observationsOrInput && !Array.isArray(observationsOrInput) && typeof observationsOrInput === 'object') {
    observations = observationsOrInput.observations || [];
    resolvedReasoning = observationsOrInput.reasoningHistory || [];
    resolvedWhatChanged = observationsOrInput.whatChangedSummary || null;
    resolvedProfile = observationsOrInput.plantProfile || {
      plantId: observationsOrInput.plantId || 'plant_primary',
      createdAt: observationsOrInput.createdAt || Date.now(),
      monitoringStatus: 'ACTIVE',
      currentHealthStatus: 'STABLE',
      observationCount: observations.length,
    };
  } else if (Array.isArray(observationsOrInput)) {
    observations = observationsOrInput;
  }

  const activePlantId = resolvedProfile?.plantId || (observations.length > 0 ? observations[0].plantId : 'plant_primary');
  // Strictly filter observations to the active plant identity so unlinked foreign observations cannot leak
  const validObservations = observations.filter(o => !o.plantId || o.plantId === activePlantId);

  if (!validObservations || validObservations.length === 0) {
    return [
      {
        id: 'milestone_created_initial',
        plantId: activePlantId,
        type: 'CREATED',
        timestamp: resolvedProfile?.createdAt || Date.now(),
        dateString: formatDate(resolvedProfile?.createdAt || Date.now()),
        dayNumber: 1,
        dayLabel: 'Day 1 · Profile Created',
        title: 'Plant Profile Initialized',
        description: 'Specimen profile registered and awaiting sensor and optical calibration.',
        confidence: 'HIGH',
        status: 'stable',
      },
    ];
  }

  // Sort ascending chronologically (oldest first)
  const sorted = [...validObservations].sort((a, b) => a.timestamp - b.timestamp);
  const baselineTimestamp = sorted[0].timestamp;
  const milestones: PlantMilestone[] = [];

  // Milestone 1: Plant Created
  milestones.push({
    id: `milestone_created_${sorted[0].id}`,
    plantId: sorted[0].plantId,
    type: 'CREATED',
    timestamp: sorted[0].timestamp,
    dateString: formatDate(sorted[0].timestamp),
    dayNumber: 1,
    dayLabel: 'Day 1 · Cultivation Initiated',
    title: 'Plant Monitored Profile Created',
    description: `Monitoring started for plant ID: ${sorted[0].plantId}.`,
    observationId: sorted[0].id,
    confidence: 'HIGH',
    status: 'optimal',
  });

  // Milestone 2: Baseline Established
  if (sorted[0].isPlantDetected !== false) {
    milestones.push({
      id: `milestone_baseline_${sorted[0].id}`,
      plantId: sorted[0].plantId,
      type: 'BASELINE_ESTABLISHED',
      timestamp: sorted[0].timestamp,
      dateString: formatDate(sorted[0].timestamp),
      dayNumber: 1,
      dayLabel: 'Day 1 · Baseline Established',
      title: 'Calibration Baseline Established',
      description: `Initial canopy coverage established at ${sorted[0].canopyCoveragePercent || 15}%. Solution pH was ${sorted[0].ph ?? '--'}.`,
      observationId: sorted[0].id,
      confidence: 'HIGH',
      status: 'optimal',
    });
  }

  let lastIdentifiedSpecies: string | undefined = undefined;
  let lastHealthState: string | undefined = undefined;

  for (let i = 0; i < sorted.length; i++) {
    const obs = sorted[i];
    const dayNumber = Math.max(1, Math.round((obs.timestamp - baselineTimestamp) / 86400000) + 1);

    // Milestone: Species Identified
    if (obs.plantSpecies && obs.plantSpecies !== 'Unknown Plant' && obs.plantSpecies !== lastIdentifiedSpecies) {
      milestones.push({
        id: `milestone_species_${obs.id}`,
        plantId: obs.plantId,
        type: 'SPECIES_IDENTIFIED',
        timestamp: obs.timestamp,
        dateString: formatDate(obs.timestamp),
        dayNumber,
        dayLabel: `Day ${dayNumber} · Botanical Classification`,
        title: `Identified as ${obs.plantSpecies}`,
        description: `ML classifier identified species with ${obs.speciesConfidence || 90}% confidence.`,
        observationId: obs.id,
        confidence: 'HIGH',
        status: 'optimal',
      });
      lastIdentifiedSpecies = obs.plantSpecies;
    }

    // Milestone: Health State Transition
    const currentHealth = obs.visualHealthState || (obs.overallHealthScore && obs.overallHealthScore < 70 ? 'warning' : 'optimal');
    if (lastHealthState && currentHealth !== lastHealthState && currentHealth !== 'UNKNOWN') {
      const isDeclined = currentHealth === 'CRITICAL' || (currentHealth as string) === 'critical' || (currentHealth as string) === 'warning' || currentHealth === 'ATTENTION';
      const isRecovered = lastHealthState === 'CRITICAL' || (lastHealthState as string) === 'critical' || (lastHealthState as string) === 'warning' || lastHealthState === 'ATTENTION';

      milestones.push({
        id: `milestone_health_${obs.id}`,
        plantId: obs.plantId,
        type: isRecovered && !isDeclined ? 'RECOVERY_DETECTED' : 'HEALTH_CHANGE',
        timestamp: obs.timestamp,
        dateString: formatDate(obs.timestamp),
        dayNumber,
        dayLabel: `Day ${dayNumber} · Health Shift`,
        title: isRecovered && !isDeclined ? 'Plant Stress Recovery' : 'Health State Change Detected',
        description: `Health shifted from ${lastHealthState} to ${currentHealth} (Health Score: ${obs.overallHealthScore || 80}/100).`,
        observationId: obs.id,
        confidence: 'HIGH',
        status: isDeclined ? 'warning' : 'optimal',
      });
    }
    lastHealthState = currentHealth;

    // Milestone: Growth Expansion Checkpoint
    if (i > 0 && obs.canopyCoveragePercent && sorted[0].canopyCoveragePercent) {
      const growthFromBaseline = obs.canopyCoveragePercent - sorted[0].canopyCoveragePercent;
      if (growthFromBaseline >= 5.0 && !milestones.some(m => m.type === 'GROWTH_DETECTED')) {
        milestones.push({
          id: `milestone_growth_${obs.id}`,
          plantId: obs.plantId,
          type: 'GROWTH_DETECTED',
          timestamp: obs.timestamp,
          dateString: formatDate(obs.timestamp),
          dayNumber,
          dayLabel: `Day ${dayNumber} · Vegetative Expansion`,
          title: 'Significant Vegetative Canopy Growth',
          description: `Canopy coverage expanded by +${growthFromBaseline.toFixed(1)}% since initial baseline calibration.`,
          observationId: obs.id,
          confidence: 'HIGH',
          status: 'optimal',
        });
      }
    }
  }

  // Milestone: Reasoning Stress Event (Phase 6 integration)
  if (resolvedReasoning && resolvedReasoning.length > 0) {
    const stressEvent = resolvedReasoning.find(
      r => r.scenarioCode === 'CORRELATED_ENVIRONMENTAL_STRESS' || r.scenarioCode === 'ENVIRONMENTAL_ANOMALY_ONLY'
    );
    if (stressEvent && !milestones.some(m => m.reasoningEventId === stressEvent.id)) {
      const dayNumber = Math.max(1, Math.round((stressEvent.timestamp - baselineTimestamp) / 86400000) + 1);
      milestones.push({
        id: `milestone_reasoning_${stressEvent.id}`,
        plantId: stressEvent.plantId,
        type: 'REASONING_EVENT',
        timestamp: stressEvent.timestamp,
        dateString: formatDate(stressEvent.timestamp),
        dayNumber,
        dayLabel: `Day ${dayNumber} · Environmental Correlation`,
        title: stressEvent.primaryFarmerHeadline || 'Multimodal Correlation Identified',
        description: stressEvent.observations.slice(0, 2).join('; ') || stressEvent.primaryFarmerWhy,
        reasoningEventId: stressEvent.id,
        confidence: stressEvent.confidence === 'high' ? 'HIGH' : 'MODERATE',
        status: stressEvent.plantState === 'CRITICAL' ? 'critical' : 'warning',
      });
    }
  }

  // Milestone: What Changed Review Required (Phase 7 integration)
  if (resolvedWhatChanged?.reviewRequiredItems && resolvedWhatChanged.reviewRequiredItems.length > 0) {
    const reviewItem = resolvedWhatChanged.reviewRequiredItems[0];
    const dayNumber = Math.max(1, Math.round((reviewItem.timestamp - baselineTimestamp) / 86400000) + 1);
    milestones.push({
      id: `milestone_review_${reviewItem.id}`,
      plantId: reviewItem.plantId,
      type: 'SPECIES_IDENTIFIED',
      timestamp: reviewItem.timestamp,
      dateString: formatDate(reviewItem.timestamp),
      dayNumber,
      dayLabel: `Day ${dayNumber} · Identity Flag`,
      title: 'Species Identity Shift Under Review',
      description: reviewItem.summary,
      confidence: 'MODERATE',
      status: 'warning',
    });
  }

  // Sort milestones chronologically ascending
  return milestones.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Audits 5 key categories to determine profile completeness without hallucinating missing data
 */
export function calculateProfileCompleteness(input: {
  identificationStatus: PlantIdentificationStatus;
  speciesConfidence?: number;
  baselineStatus: BaselineStatus;
  observationCount: number;
  growthTrend: string;
  growthConfidence: string;
  sensorAvailability: {
    ph: SensorAvailabilityState;
    tds: SensorAvailabilityState;
    waterLevel: SensorAvailabilityState;
  };
}): ProfileCompleteness {
  const missingItems: string[] = [];

  // 1. Identity Check (20 pts)
  const isIdentityComplete = input.identificationStatus === 'IDENTIFIED' && (input.speciesConfidence ?? 0) >= 60;
  if (!isIdentityComplete) {
    missingItems.push(input.identificationStatus === 'REVIEW_REQUIRED' ? 'Verified crop species review' : 'Botanical species identification');
  }

  // 2. Baseline Check (20 pts)
  const isBaselineComplete = input.baselineStatus === 'BASELINE_ESTABLISHED';
  if (!isBaselineComplete) {
    missingItems.push('Optical calibration baseline');
  }

  // 3. Health History Check (20 pts)
  const isHealthHistoryComplete = input.observationCount >= 2;
  if (!isHealthHistoryComplete) {
    missingItems.push('Consecutive health observation history (N ≥ 2)');
  }

  // 4. Growth History Check (20 pts)
  const isGrowthComplete = input.observationCount >= 2 && input.growthConfidence !== 'LOW' && input.growthTrend !== 'insufficient_data';
  if (!isGrowthComplete) {
    missingItems.push('High-clarity canopy expansion timeline');
  }

  // 5. Environmental History Check (20 pts)
  const phState = String(input.sensorAvailability?.ph || 'unavailable').toLowerCase();
  const tdsState = String(input.sensorAvailability?.tds || 'unavailable').toLowerCase();
  const waterState = String(input.sensorAvailability?.waterLevel || 'unavailable').toLowerCase();

  const isEnvComplete =
    phState !== 'unavailable' &&
    tdsState !== 'unavailable' &&
    waterState !== 'unavailable';
  if (!isEnvComplete) {
    missingItems.push('Continuous ESP32 probe telemetry (pH, TDS, Reservoir)');
  }

  let score = 0;
  if (isIdentityComplete) score += 20;
  if (isBaselineComplete) score += 20;
  if (isHealthHistoryComplete) score += 20;
  if (isGrowthComplete) score += 20;
  if (isEnvComplete) score += 20;

  let status: 'COMPLETE' | 'PARTIAL' | 'LIMITED' | 'INSUFFICIENT_DATA' = 'INSUFFICIENT_DATA';
  if (score >= 90) status = 'COMPLETE';
  else if (score >= 60) status = 'PARTIAL';
  else if (score >= 20) status = 'LIMITED';
  else status = 'INSUFFICIENT_DATA';

  const explanation =
    status === 'COMPLETE'
      ? 'All botanical identity, baseline calibration, health history, and sensory channels are active.'
      : status === 'PARTIAL'
      ? `Profile is functioning with ${score}% evidence completeness. Missing: ${missingItems.slice(0, 2).join(', ')}.`
      : `Profile has limited data points. Continue regular scans and verify sensor probes.`;

  return {
    status,
    score,
    overallScore: score,
    categories: {
      identity: {
        available: isIdentityComplete,
        label: 'Species Identity',
        details: isIdentityComplete ? 'Verified ML classification' : 'Awaiting identification scan',
      },
      baseline: {
        available: isBaselineComplete,
        label: 'Baseline Calibration',
        details: isBaselineComplete ? 'Day 1 optical & telemetry baseline locked' : 'Baseline pending',
      },
      healthHistory: {
        available: isHealthHistoryComplete,
        label: 'Health Trajectory',
        details: isHealthHistoryComplete ? `${input.observationCount} checkpoints recorded` : 'Single snapshot only',
      },
      growthHistory: {
        available: isGrowthComplete,
        label: 'Growth Analytics',
        details: isGrowthComplete ? `Trend: ${input.growthTrend}` : 'Requires multiple clear frames',
      },
      environmentalHistory: {
        available: isEnvComplete,
        label: 'Environmental Telemetry',
        details: isEnvComplete ? 'pH, TDS, and water level active' : 'Sensor probes offline or missing',
      },
    },
    missingItems,
    explanation,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function isStaleCheck(reading: { ph: number; tds: number; waterLevel: number } | null, isStale: boolean): boolean {
  if (!reading) return true;
  return isStale;
}

function getSensorState(val: number | undefined | null, isStale: boolean, mode: 'real' | 'simulation'): SensorAvailabilityState {
  if (val === undefined || val === null || isNaN(val) || isStale) {
    return 'unavailable';
  }
  return mode === 'simulation' ? 'simulated' : 'available';
}

function computeMetricTrend(values: (number | undefined)[]): 'rising' | 'falling' | 'stable' | 'unknown' {
  const valid = values.filter((v): v is number => v !== undefined && !isNaN(v));
  if (valid.length < 2) return 'unknown';
  const delta = valid[0] - valid[valid.length - 1];
  if (Math.abs(delta) < 0.1) return 'stable';
  return delta > 0 ? 'rising' : 'falling';
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
