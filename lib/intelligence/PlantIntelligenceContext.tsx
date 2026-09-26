'use client';

// ============================================================
// HydroSmart — Plant Intelligence Context & State Provider
// Integrated with Cloud Firestore Persistence & Scoped User Identity
// ============================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { usePlantMonitor } from '@/lib/camera/usePlantMonitor';
import { PlantDetectionResult } from '@/lib/vision/plantDetector';
import { VisualHealthAnalysisResult } from '@/lib/vision/plantHealthAnalyzer';
import {
  PlantObservation,
  PlantIdentity,
  PlantProfile,
  PlantCandidate,
  PlantIdentificationResponse,
  EnvironmentalAssessment,
  PlantHealthReport,
  AnomalyReport,
  RecommendationItem,
  DemoScenario,
  MultimodalHealthAssessment,
  CameraHealthInput,
  ESP32HealthInput,
  HistoricalHealthInput,
  PlantGrowthMetrics,
  PlantJourneyMilestone,
  PlantMemoryAnswers,
  PredictiveAnalyticsResult,
  StatisticalAnomalyResult,
  StructuredPlantContext,
  AIPlantMessage,
  PlantReasoningEvent,
  WhatChangedSummary,
  PlantMilestone,
  CorrelationAnalysisSummary,
  EnvironmentPlantAssociation,
} from './types';
import { evaluateWhatChanged } from './whatChangedEngine';
import { deriveDigitalPlantProfile, compilePlantLifecycleMilestones } from './plantDigitalProfile';
import { evaluateEnvironmentPlantCorrelation } from './environmentPlantCorrelation';
import { CloudSyncStatus } from '@/lib/firebase/types';
import {
  DEFAULT_CROP_PROFILE,
  evaluateEnvironmentalHealth,
  generateHealthReport
} from './healthScore';
import { detectEnvironmentalAnomalies } from './anomalyDetection';
import { identifyPlant } from './plantIdentification';
import { multimodalHealthEngine } from './multimodalEngine';
import { runMultimodalPlantReasoning } from './multimodalReasoningEngine';
import {
  computeGrowthEstimates,
  compilePlantJourney,
  answerPlantMemoryQueries
} from './plantMemory';
import { runPredictiveAnalytics } from './predictiveAnalytics';
import { buildStructuredPlantContext } from './aiPlantContext';
import { askAIPlant } from './aiPlantEngine';
import {
  DEFAULT_PRIMARY_PLANT_ID,
  getStoredPlantProfile,
  saveStoredPlantProfile,
  getStoredObservations,
  saveObservation,
  clearStoredObservations,
  fetchObservationsFromCloud,
  persistObservationToCloud,
  migrateLegacyLocalStorageObservations
} from './observationStore';
import { ensureDefaultHierarchy } from '@/lib/firebase/firestore';
import { DEMO_SCENARIOS } from './demoScenarios';
import { deriveFarmerSemanticState, FarmerSemanticState } from './farmerSemanticLayer';
import {
  AssistantMode,
  ASSISTANT_MODE_STORAGE_KEY,
  SupportedLanguageCode,
  ASSISTANT_LANGUAGE_STORAGE_KEY
} from '@/lib/assistant/assistantConfig';

interface PlantIntelligenceContextType {
  cropIdentity: PlantIdentity;
  setCropIdentity: React.Dispatch<React.SetStateAction<PlantIdentity>>;
  plantProfile: PlantProfile;
  setPlantProfile: React.Dispatch<React.SetStateAction<PlantProfile>>;
  observations: PlantObservation[];
  latestObservation: PlantObservation | null;
  latestDetection: PlantDetectionResult | null;
  latestVisualHealth: VisualHealthAnalysisResult | null;
  farmerSemanticState: FarmerSemanticState;
  language: SupportedLanguageCode;
  setLanguage: (lang: SupportedLanguageCode) => void;
  userMode: AssistantMode;
  setUserMode: (mode: AssistantMode) => void;
  isScanning: boolean;
  setIsScanning: (scanning: boolean) => void;
  analyzeNow: () => { detection: PlantDetectionResult; health: VisualHealthAnalysisResult } | null;
  identificationResult: PlantIdentificationResponse | null;
  isIdentifying: boolean;
  identifyCurrentPlant: () => Promise<PlantIdentificationResponse | null>;
  applyIdentifiedSpecies: (candidate: PlantCandidate, imageRef?: string) => void;
  environmentalAssessment: EnvironmentalAssessment;
  healthReport: PlantHealthReport;
  multimodalAssessment: MultimodalHealthAssessment;
  growthMetrics: PlantGrowthMetrics;
  plantJourney: PlantJourneyMilestone[];
  memoryAnswers: PlantMemoryAnswers;
  predictiveAnalytics: PredictiveAnalyticsResult;
  statisticalAnomalies: StatisticalAnomalyResult[];
  structuredPlantContext: StructuredPlantContext;
  aiMessages: AIPlantMessage[];
  isAILoading: boolean;
  askPlant: (query: string) => Promise<void>;
  clearChat: () => void;
  activeAnomalies: AnomalyReport[];
  activeRecommendations: RecommendationItem[];
  activeScenario: DemoScenario;
  setActiveScenario: (scenario: DemoScenario) => void;
  captureAndObserve: () => PlantObservation | null;
  clearHistory: () => void;
  syncStatus: CloudSyncStatus;
  farmId: string;
  stationId: string;
  plantId: string;
  latestReasoningEvent: PlantReasoningEvent | null;
  reasoningHistory: PlantReasoningEvent[];
  whatChangedSummary: WhatChangedSummary;
  digitalProfile: PlantProfile;
  lifecycleMilestones: PlantMilestone[];
  correlationSummary: CorrelationAnalysisSummary;
  correlations: EnvironmentPlantAssociation[];
}

const PlantIntelligenceContext = createContext<PlantIntelligenceContextType | undefined>(undefined);

export function PlantIntelligenceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { mode, isStale, latestReading, history: sensorHistory } = useESP32Serial();
  const { status: cameraStatus, captureFrame, videoRef } = useCamera();
  const { latestDetection, latestVisualHealth, isScanning, setIsScanning, analyzeNow } = usePlantMonitor();

  // Persistent Plant Profile State
  const [plantProfile, setPlantProfileState] = useState<PlantProfile>(() => getStoredPlantProfile());

  const setPlantProfile = useCallback((updater: React.SetStateAction<PlantProfile>) => {
    setPlantProfileState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveStoredPlantProfile(next);
      return next;
    });
  }, []);

  const [farmId, setFarmId] = useState<string>('farm_main');
  const [stationId, setStationId] = useState<string>('station_esp32_1');
  const [plantId, setPlantIdState] = useState<string>(() => plantProfile.plantId || DEFAULT_PRIMARY_PLANT_ID);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>('offline');

  // Crop Identity State (kept in sync with persistent plantProfile)
  const [cropIdentity, setCropIdentityState] = useState<PlantIdentity>(() => {
    const prof = getStoredPlantProfile();
    const isIdentified = Boolean(prof.commonName || prof.species);
    return {
      plantId: prof.plantId,
      cropKey: isIdentified ? (prof.commonName || prof.species)!.toLowerCase().replace(/\s+/g, '_') : 'unclassified_plant',
      commonName: isIdentified ? (prof.commonName || prof.species)! : 'Plant',
      scientificName: prof.scientificName || (isIdentified ? undefined : 'Identification pending'),
      family: prof.family || (isIdentified ? undefined : 'Unclassified'),
      confidence: prof.speciesConfidence,
      plantedTimestamp: prof.createdAt,
      growthStage: prof.growthStage || 'vegetative',
      targetProfile: prof.targetProfile || DEFAULT_CROP_PROFILE,
    };
  });

  const setCropIdentity = useCallback((updater: React.SetStateAction<PlantIdentity>) => {
    setCropIdentityState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const isIdentified = Boolean(next.commonName && next.commonName !== 'Plant' && next.commonName !== 'Unknown Plant');
      setPlantProfile(p => ({
        ...p,
        commonName: isIdentified ? next.commonName : undefined,
        species: isIdentified ? next.commonName : undefined,
        scientificName: next.scientificName,
        family: next.family,
        speciesConfidence: next.confidence,
        targetProfile: next.targetProfile,
        growthStage: next.growthStage,
      }));
      return next;
    });
  }, [setPlantProfile]);

  // Identification State
  const [identificationResult, setIdentificationResult] = useState<PlantIdentificationResponse | null>(null);
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);
  const recentSpeciesScansRef = useRef<Array<{ cropKey: string; commonName: string; confidence: number; timestamp: number }>>([]);

  // User Experience Mode State ('farmer' by default)
  const [userMode, setUserModeState] = useState<AssistantMode>('farmer');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(ASSISTANT_MODE_STORAGE_KEY) as AssistantMode;
      if (savedMode === 'technical' || savedMode === 'farmer') {
        setUserModeState(savedMode);
      }
    }
  }, []);

  const setUserMode = useCallback((newMode: AssistantMode) => {
    setUserModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASSISTANT_MODE_STORAGE_KEY, newMode);
    }
  }, []);

  // Supported Language State ('en' by default, persisted across sessions)
  const [language, setLanguageState] = useState<SupportedLanguageCode>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem(ASSISTANT_LANGUAGE_STORAGE_KEY) as SupportedLanguageCode;
      if (savedLang === 'en' || savedLang === 'kn') {
        setLanguageState(savedLang);
      }
    }
  }, []);

  const setLanguage = useCallback((newLang: SupportedLanguageCode) => {
    setLanguageState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ASSISTANT_LANGUAGE_STORAGE_KEY, newLang);
    }
  }, []);

  // Multimodal Observation History (loaded from Firestore or local fallback)
  const [observations, setObservations] = useState<PlantObservation[]>(() => getStoredObservations());
  const [activeScenario, setActiveScenarioState] = useState<DemoScenario>('healthy');

  // AI Plant Conversation Thread
  const [aiMessages, setAiMessages] = useState<AIPlantMessage[]>(() => [
    {
      id: 'msg_welcome',
      sender: 'plant',
      text: 'Hello grower! I am your monitored hydroponic plant assistant. Ask me how I am feeling, about my nutrient solution, water level, or future trend forecasts!',
      timestamp: Date.now(),
      epistemicBadges: ['measured_fact', 'visual_observation'],
    },
  ]);
  const [isAILoading, setIsAILoading] = useState<boolean>(false);

  // Synchronize Cloud Firestore Observations & Execute Safe One-Time Migration
  useEffect(() => {
    let isCancelled = false;

    async function syncCloudData() {
      if (!currentUser?.uid) {
        setSyncStatus('offline');
        return;
      }

      setSyncStatus('syncing');
      try {
        // 1. Ensure user's Farm -> Station -> Plant documents exist
        const hierarchy = await ensureDefaultHierarchy(currentUser.uid, cropIdentity.commonName);
        if (isCancelled) return;

        setFarmId(hierarchy.farmId);
        setStationId(hierarchy.stationId);
        setPlantIdState(hierarchy.plantId);
        setPlantProfile(prev => ({ ...prev, plantId: hierarchy.plantId }));

        // 2. Perform safe one-time migration of any legacy localStorage observations
        await migrateLegacyLocalStorageObservations(
          currentUser.uid,
          hierarchy.farmId,
          hierarchy.stationId,
          hierarchy.plantId
        );

        // 3. Fetch authenticated observation history from Firestore
        const cloudObservations = await fetchObservationsFromCloud(
          currentUser.uid,
          hierarchy.farmId,
          hierarchy.stationId,
          hierarchy.plantId
        );

        if (!isCancelled) {
          setObservations(cloudObservations);
          setSyncStatus('synced');
        }
      } catch (err) {
        console.warn('[PlantIntelligence] Firestore synchronization notice (using memory cache):', err);
        if (!isCancelled) {
          setSyncStatus('offline');
        }
      }
    }

    syncCloudData();

    return () => {
      isCancelled = true;
    };
  }, [currentUser?.uid, cropIdentity.commonName, setPlantProfile]);

  // Active reading values
  const currentPh = latestReading?.ph;
  const currentTds = latestReading?.tds;
  const currentWaterLevel = latestReading?.waterLevel;
  const currentDistance = latestReading?.distance;

  // 1. Reactive Rule-Based Environmental Assessment
  const environmentalAssessment = useMemo(() => {
    return evaluateEnvironmentalHealth(
      currentPh,
      currentTds,
      currentWaterLevel,
      cropIdentity.targetProfile
    );
  }, [currentPh, currentTds, currentWaterLevel, cropIdentity.targetProfile]);

  // 2. Real-Time Environmental Anomalies Detection
  const activeAnomalies = useMemo(() => {
    return detectEnvironmentalAnomalies(
      currentPh,
      currentTds,
      currentWaterLevel,
      currentDistance,
      cropIdentity.targetProfile
    );
  }, [currentPh, currentTds, currentWaterLevel, currentDistance, cropIdentity.targetProfile]);

  // 3. Predictive Analytics & Statistical Anomaly Engine
  const predictiveAnalytics = useMemo(() => {
    return runPredictiveAnalytics(
      currentPh,
      currentTds,
      currentWaterLevel,
      observations,
      cropIdentity.targetProfile
    );
  }, [currentPh, currentTds, currentWaterLevel, observations, cropIdentity.targetProfile]);

  const statisticalAnomalies = predictiveAnalytics.anomalies;
  const activeRecommendations = predictiveAnalytics.recommendations;

  // 4. Overall Health Assessment
  const healthReport = useMemo(() => {
    const visualScore = latestVisualHealth && latestVisualHealth.healthState !== 'UNKNOWN' && (latestVisualHealth.healthState as string) !== 'unknown'
      ? latestVisualHealth.visualHealthScore
      : undefined;
    return generateHealthReport(environmentalAssessment, visualScore);
  }, [environmentalAssessment, latestVisualHealth]);

  // 5. Multimodal Health Engine
  const multimodalAssessment = useMemo(() => {
    const cameraInput: CameraHealthInput = {
      isPlantDetected: latestDetection?.isPlantDetected,
      speciesName: cropIdentity.commonName,
      speciesConfidence: cropIdentity.confidence,
      visualHealthScore: latestVisualHealth?.visualHealthScore,
      visualHealthState: latestVisualHealth?.healthState,
      canopyCoveragePercent: latestDetection?.canopyCoveragePercent,
      vegetationIndex: latestDetection?.vegetationIndex,
      chlorosisYellowPercent: latestVisualHealth?.chlorosisYellowPercent,
      necroticBrownPercent: latestVisualHealth?.necroticBrownPercent,
      indicators: latestVisualHealth?.indicators,
    };

    const esp32Input: ESP32HealthInput = {
      ph: currentPh,
      tds: currentTds,
      waterLevel: currentWaterLevel,
      distance: currentDistance,
      isStale,
      mode,
    };

    const historicalInput: HistoricalHealthInput = {
      previousObservations: observations,
    };

    return multimodalHealthEngine(
      cameraInput,
      esp32Input,
      historicalInput,
      cropIdentity.targetProfile
    );
  }, [
    latestDetection,
    latestVisualHealth,
    cropIdentity,
    currentPh,
    currentTds,
    currentWaterLevel,
    currentDistance,
    isStale,
    mode,
    observations
  ]);

  // 5B. Multimodal Plant Reasoning Engine
  const latestReasoningEvent = useMemo(() => {
    return runMultimodalPlantReasoning({
      plantId: plantProfile.plantId,
      detection: latestDetection,
      visualHealth: latestVisualHealth,
      cropIdentity,
      sensorReading: latestReading,
      sensorHistory,
      observationHistory: observations,
      cropTargetProfile: cropIdentity.targetProfile,
      telemetryMode: mode,
      isTelemetryStale: isStale,
      isCameraActive: cameraStatus === 'connected',
    });
  }, [
    plantProfile.plantId,
    latestDetection,
    latestVisualHealth,
    cropIdentity,
    latestReading,
    sensorHistory,
    observations,
    mode,
    isStale,
    cameraStatus,
  ]);

  const [reasoningHistory, setReasoningHistory] = useState<PlantReasoningEvent[]>([]);

  useEffect(() => {
    if (!latestReasoningEvent) return;
    setReasoningHistory(prev => {
      if (prev.length > 0 && prev[prev.length - 1].scenarioCode === latestReasoningEvent.scenarioCode) {
        return prev;
      }
      return [...prev.slice(-19), latestReasoningEvent];
    });
  }, [latestReasoningEvent]);

  // 6. Plant Growth & Memory Calculations
  const growthMetrics = useMemo(() => {
    return computeGrowthEstimates(observations);
  }, [observations]);

  const plantJourney = useMemo(() => {
    return compilePlantJourney(observations);
  }, [observations]);

  const memoryAnswers = useMemo(() => {
    return answerPlantMemoryQueries(observations, cropIdentity.commonName);
  }, [observations, cropIdentity.commonName]);

  // 7. Structured Plant Context Object
  const structuredPlantContext = useMemo(() => {
    return buildStructuredPlantContext(
      cropIdentity,
      latestVisualHealth,
      latestDetection,
      currentPh,
      currentTds,
      currentWaterLevel,
      currentDistance,
      mode,
      isStale,
      environmentalAssessment,
      multimodalAssessment,
      growthMetrics,
      predictiveAnalytics,
      observations
    );
  }, [
    cropIdentity,
    latestVisualHealth,
    latestDetection,
    currentPh,
    currentTds,
    currentWaterLevel,
    currentDistance,
    mode,
    isStale,
    environmentalAssessment,
    multimodalAssessment,
    growthMetrics,
    predictiveAnalytics,
    observations
  ]);

  // Handle Asking the AI Plant Companion
  const askPlant = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: AIPlantMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: queryText.trim(),
      timestamp: Date.now(),
    };

    setAiMessages(prev => [...prev, userMsg]);
    setIsAILoading(true);

    try {
      const response = await askAIPlant(queryText, structuredPlantContext);
      const plantMsg: AIPlantMessage = {
        id: `plant_${Date.now()}`,
        sender: 'plant',
        text: response.message,
        timestamp: Date.now(),
        epistemicBadges: response.epistemicBadges,
      };
      setAiMessages(prev => [...prev, plantMsg]);
    } catch (err) {
      console.error('[AIPlant] Error processing query:', err);
      const errorMsg: AIPlantMessage = {
        id: `plant_err_${Date.now()}`,
        sender: 'plant',
        text: "I encountered an error processing that question against my plant telemetry context.",
        timestamp: Date.now(),
      };
      setAiMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAILoading(false);
    }
  }, [structuredPlantContext]);

  const clearChat = useCallback(() => {
    setAiMessages([
      {
        id: `msg_welcome_${Date.now()}`,
        sender: 'plant',
        text: `Chat reset. I am your monitored ${cropIdentity.commonName}. How can I assist you with my telemetry or growth today?`,
        timestamp: Date.now(),
        epistemicBadges: ['measured_fact'],
      },
    ]);
  }, [cropIdentity.commonName]);

  // Apply identified candidate as active crop profile
  const applyIdentifiedSpecies = useCallback((candidate: PlantCandidate, imageRef?: string) => {
    const now = Date.now();
    // 1. Update persistent plantProfile while strictly preserving the stable plantId
    setPlantProfile(prev => ({
      ...prev,
      species: candidate.commonName,
      commonName: candidate.commonName,
      scientificName: candidate.scientificName,
      family: candidate.family,
      speciesConfidence: candidate.confidence,
      identifiedAt: now,
      modelVersion: 'hydrosmart-plant-classifier-v1',
      lastObservedAt: now,
      targetProfile: candidate.targetProfile,
    }));

    // 2. Update reactive cropIdentity
    setCropIdentityState({
      plantId: plantProfile.plantId,
      cropKey: candidate.id,
      commonName: candidate.commonName,
      scientificName: candidate.scientificName,
      family: candidate.family,
      confidence: candidate.confidence,
      identificationTimestamp: now,
      imageReference: imageRef || identificationResult?.imageReference,
      plantedTimestamp: plantProfile.createdAt,
      growthStage: 'vegetative',
      targetProfile: candidate.targetProfile,
    });
  }, [identificationResult, plantProfile.plantId, plantProfile.createdAt, setPlantProfile]);

  // Identify plant from current camera frame
  const identifyCurrentPlant = useCallback(async (): Promise<PlantIdentificationResponse | null> => {
    // Gate 1: Check plant presence
    if (!latestDetection || !latestDetection.isPlantDetected || latestDetection.state === 'NO_PLANT_DETECTED') {
      const guidanceMessage = latestDetection?.userMessage || 'No plant detected in camera frame. Position a plant clearly within the camera view before identifying.';
      const noPlantResp: PlantIdentificationResponse = {
        status: 'no_plant_detected',
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage,
        timestamp: Date.now(),
      };
      setIdentificationResult(noPlantResp);
      return noPlantResp;
    }

    // Gate 2: Optical scan readiness
    if (latestDetection.state === 'SCAN_NOT_READY') {
      const guidanceMessage = latestDetection.userMessage || 'Camera view is blurry or lighting is poor. Adjust camera before identifying.';
      const notReadyResp: PlantIdentificationResponse = {
        status: 'scan_not_ready',
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage,
        timestamp: Date.now(),
      };
      setIdentificationResult(notReadyResp);
      return notReadyResp;
    }

    // Gate 3: Low confidence presence
    if (latestDetection.state === 'LOW_CONFIDENCE') {
      const guidanceMessage = latestDetection.userMessage || 'Plant appears small or distant. Move camera closer before identifying.';
      const lowConfResp: PlantIdentificationResponse = {
        status: 'low_confidence',
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage,
        timestamp: Date.now(),
      };
      setIdentificationResult(lowConfResp);
      return lowConfResp;
    }

    let sourceInput: HTMLVideoElement | string | null = null;
    if (videoRef?.current) {
      sourceInput = videoRef.current;
    } else {
      sourceInput = captureFrame();
    }
    if (!sourceInput) return null;

    setIsIdentifying(true);
    try {
      const response = await identifyPlant(sourceInput, {
        boundingBox: latestDetection?.boundingBox
      });
      setIdentificationResult(response);

      // Temporal voting consistency
      if (response.status === 'success' && response.primaryCandidate) {
        const now = Date.now();
        const candidate = response.primaryCandidate;

        recentSpeciesScansRef.current.push({
          cropKey: candidate.id,
          commonName: candidate.commonName,
          confidence: candidate.confidence,
          timestamp: now
        });
        recentSpeciesScansRef.current = recentSpeciesScansRef.current
          .filter((s: { timestamp: number }) => now - s.timestamp < 300000)
          .slice(-5);

        const recent = recentSpeciesScansRef.current;
        const matchingVotes = recent.filter((s: { cropKey: string }) => s.cropKey === candidate.id).length;

        const isCurrentlyUnclassified =
          !plantProfile.species ||
          plantProfile.species === 'Unknown Plant' ||
          plantProfile.species === 'Plant';

        if (matchingVotes >= 2 || candidate.confidence >= 80 || isCurrentlyUnclassified) {
          applyIdentifiedSpecies(candidate, response.imageReference);
        }
      }

      return response;
    } catch (err) {
      console.error('[PlantIntelligence] Identification error:', err);
      const errorResp: PlantIdentificationResponse = {
        status: 'error',
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage: 'An error occurred during botanical identification.',
        timestamp: Date.now(),
      };
      setIdentificationResult(errorResp);
      return errorResp;
    } finally {
      setIsIdentifying(false);
    }
  }, [captureFrame, latestDetection, videoRef, plantProfile.species, applyIdentifiedSpecies]);

  // Capture Current Webcam Frame + Telemetry to Save an Observation
  const captureAndObserve = useCallback((): PlantObservation | null => {
    const scan = analyzeNow();
    const detection = scan?.detection;
    const visualHealth = scan?.health;
    const now = Date.now();

    // Gate 1: Check plant presence and scan readiness
    if (
      !detection ||
      !detection.isPlantDetected ||
      detection.state === 'NO_PLANT_DETECTED' ||
      detection.state === 'SCAN_NOT_READY'
    ) {
      console.warn('[PlantIntelligence] Observation rejected: No plant detected or scan not ready in frame.');
      return null;
    }

    // Gate 2: Check confidence (LOW_CONFIDENCE flags tentative observation without confident health score)
    const isLowConfidence =
      detection.state === 'LOW_CONFIDENCE' ||
      (detection.confidence !== undefined && detection.confidence < 45) ||
      (detection.plantPresenceScore !== undefined && detection.plantPresenceScore < 45);

    const snapshot = captureFrame();

    const isVisualAnomaly = visualHealth
      ? visualHealth.healthState === 'ATTENTION' ||
        visualHealth.healthState === 'CRITICAL' ||
        (visualHealth.healthState as string) === 'possible_anomaly' ||
        (visualHealth.healthState as string) === 'significant_anomaly'
      : false;

    const source: 'esp32' | 'simulation' = mode === 'real' ? 'esp32' : 'simulation';

    const isSpeciesIdentified = cropIdentity.commonName !== 'Plant' &&
      cropIdentity.commonName !== 'Unknown Plant' &&
      cropIdentity.cropKey !== 'unknown_plant' &&
      cropIdentity.cropKey !== 'unclassified_plant';

    const newObservation: PlantObservation = {
      id: `obs_${now}_${Math.random().toString(36).substring(2, 7)}`,
      plantId: plantProfile.plantId,
      timestamp: now,
      imageReference: snapshot || undefined,
      cameraActive: cameraStatus === 'connected',
      isPlantDetected: true,
      plantDetectionConfidence: detection.confidence,
      canopyCoveragePercent: detection.canopyCoveragePercent,
      vegetationIndex: detection.vegetationIndex,
      visualHealthScore: isLowConfidence ? undefined : visualHealth?.visualHealthScore,
      visualHealthState: isLowConfidence ? 'UNKNOWN' : (visualHealth?.healthState || 'UNKNOWN'),
      visualScoreBreakdown: isLowConfidence ? undefined : visualHealth?.breakdown,
      visualIndicators: visualHealth?.indicators.map(i => i.label),
      healthConfidence: isLowConfidence ? 'low' : (visualHealth?.qualitativeConfidence || 'moderate'),
      baselineDeltas: visualHealth?.baselineDeltas || null,
      ph: currentPh,
      tds: currentTds,
      waterLevel: currentWaterLevel,
      distance: currentDistance,
      telemetryMode: mode,
      isTelemetryStale: isStale,
      plantSpecies: isSpeciesIdentified ? cropIdentity.commonName : undefined,
      speciesConfidence: cropIdentity.confidence,
      environmentalHealthScore: environmentalAssessment.compositeEnvironmentalScore,
      overallHealthScore: isLowConfidence ? 70 : multimodalAssessment.overallScore,
      multimodalAssessment: isLowConfidence ? undefined : multimodalAssessment,
      anomalyDetected: activeAnomalies.length > 0 || isVisualAnomaly || statisticalAnomalies.some(a => a.isAnomaly),
      activeAnomalies: activeAnomalies.map(a => a.title),
      recommendations: activeRecommendations.map(r => r.title),
      reasoningEvent: latestReasoningEvent || undefined,
    };

    // Update plant profile observation counter, recency, and structured health status
    const effectiveHealthStatus = isLowConfidence
      ? 'UNKNOWN'
      : (visualHealth?.healthState || 'STABLE');

    setPlantProfile(prev => ({
      ...prev,
      observationCount: prev.observationCount + 1,
      lastObservedAt: now,
      currentHealthStatus: effectiveHealthStatus,
      lastVisualAssessment: visualHealth || undefined,
      lastVisualAssessmentAt: now,
      healthConfidence: isLowConfidence ? 'low' : (visualHealth?.qualitativeConfidence || 'moderate'),
      activeAnomaly: visualHealth?.indicators.find(i => i.severity === 'critical' || i.severity === 'warning')?.label,
    }));

    if (currentUser?.uid) {
      persistObservationToCloud(
        currentUser.uid,
        farmId,
        stationId,
        plantProfile.plantId,
        newObservation,
        source
      ).then(updated => {
        setObservations(updated);
      }).catch(_err => {
        const fallbackList = saveObservation(newObservation);
        setObservations(fallbackList);
      });
    } else {
      const fallbackList = saveObservation(newObservation);
      setObservations(fallbackList);
    }

    return newObservation;
  }, [
    analyzeNow,
    captureFrame,
    cameraStatus,
    currentPh,
    currentTds,
    currentWaterLevel,
    currentDistance,
    mode,
    isStale,
    cropIdentity.commonName,
    cropIdentity.cropKey,
    cropIdentity.confidence,
    environmentalAssessment.compositeEnvironmentalScore,
    multimodalAssessment,
    activeAnomalies,
    statisticalAnomalies,
    activeRecommendations,
    latestReasoningEvent,
    currentUser?.uid,
    farmId,
    stationId,
    plantProfile.plantId,
    setPlantProfile
  ]);

  const clearHistory = useCallback(() => {
    clearStoredObservations();
    setObservations([]);
  }, []);

  const setActiveScenario = useCallback((scenario: DemoScenario) => {
    setActiveScenarioState(scenario);
    const target = DEMO_SCENARIOS[scenario];
    if (target && mode === 'simulation') {
      console.log(`[PlantIntelligence] Selected demo scenario: ${target.name}`);
    }
  }, [mode]);

  // 8. Farmer-Friendly Semantic Interpretation Layer
  const farmerSemanticState = useMemo(() => {
    return deriveFarmerSemanticState({
      isTelemetryAvailable: latestReading !== null && !isStale,
      latestReading,
      environmentalAssessment,
      multimodalAssessment,
      latestDetection,
      latestVisualHealth,
      activeAnomalies,
      isCameraActive: cameraStatus === 'connected',
      language,
    });
  }, [
    latestReading,
    isStale,
    environmentalAssessment,
    multimodalAssessment,
    latestDetection,
    latestVisualHealth,
    activeAnomalies,
    cameraStatus,
    language
  ]);

  const latestObservation = observations.length > 0 ? observations[0] : null;

  // 9. Longitudinal "What Changed?" Intelligence Engine
  const whatChangedSummary = useMemo(() => {
    return evaluateWhatChanged(latestObservation, observations, plantProfile);
  }, [latestObservation, observations, plantProfile]);

  // 10. Plant Digital Profile & Lifecycle Intelligence Engine (Phase 8)
  const digitalProfile = useMemo(() => {
    return deriveDigitalPlantProfile({
      storedProfile: plantProfile,
      observations,
      latestReading,
      latestDetection,
      latestVisualHealth,
      latestReasoningEvent,
      whatChangedSummary,
      isCameraActive: cameraStatus === 'connected',
      isTelemetryStale: isStale,
      telemetryMode: mode,
    });
  }, [
    plantProfile,
    observations,
    latestReading,
    latestDetection,
    latestVisualHealth,
    latestReasoningEvent,
    whatChangedSummary,
    cameraStatus,
    isStale,
    mode,
  ]);

  // 11. Environment ↔ Plant Correlation Intelligence Engine (Phase 9)
  const correlationSummary = useMemo(() => {
    return evaluateEnvironmentPlantCorrelation({
      plantId: plantProfile.plantId,
      observations,
      sensorHistory,
      latestReading,
      plantProfile,
      whatChangedSummary,
    });
  }, [plantProfile, observations, sensorHistory, latestReading, whatChangedSummary]);

  const lifecycleMilestones = useMemo(() => {
    const baseMilestones = compilePlantLifecycleMilestones(
      observations,
      reasoningHistory,
      whatChangedSummary,
      plantProfile
    );

    if (
      correlationSummary.primaryAssociation &&
      (correlationSummary.primaryAssociation.associationType === 'TEMPORAL_ASSOCIATION' ||
        correlationSummary.primaryAssociation.associationType === 'LAGGED_ASSOCIATION')
    ) {
      const assoc = correlationSummary.primaryAssociation;
      const dayNumber = Math.max(
        1,
        Math.round((assoc.timestamp - (plantProfile.createdAt || assoc.timestamp)) / 86400000) + 1
      );
      const isAlreadyIncluded = baseMilestones.some(m => m.id === `milestone_corr_${assoc.id}`);
      if (!isAlreadyIncluded) {
        baseMilestones.push({
          id: `milestone_corr_${assoc.id}`,
          plantId: assoc.plantId,
          type: 'CORRELATION_DETECTED',
          timestamp: assoc.timestamp,
          dateString: new Date(assoc.timestamp).toLocaleDateString(),
          dayNumber,
          dayLabel: `Day ${dayNumber} · Environment Association`,
          title: `${assoc.environmentLabel} Coincided with Visual Shift`,
          description: assoc.summary,
          confidence: assoc.confidence === 'HIGH' ? 'HIGH' : assoc.confidence === 'MODERATE' ? 'MODERATE' : 'LOW',
          status: assoc.plantDirection === 'declined' ? 'warning' : 'optimal',
          sourceMetric: assoc.environmentMetric,
        });
      }
    }

    return baseMilestones.sort((a, b) => b.timestamp - a.timestamp);
  }, [observations, reasoningHistory, whatChangedSummary, plantProfile, correlationSummary]);

  return (
    <PlantIntelligenceContext.Provider
      value={{
        cropIdentity,
        setCropIdentity,
        plantProfile,
        setPlantProfile,
        observations,
        latestObservation,
        latestDetection,
        latestVisualHealth,
        farmerSemanticState,
        language,
        setLanguage,
        userMode,
        setUserMode,
        isScanning,
        setIsScanning,
        analyzeNow,
        identificationResult,
        isIdentifying,
        identifyCurrentPlant,
        applyIdentifiedSpecies,
        environmentalAssessment,
        healthReport,
        multimodalAssessment,
        growthMetrics,
        plantJourney,
        memoryAnswers,
        predictiveAnalytics,
        statisticalAnomalies,
        structuredPlantContext,
        aiMessages,
        isAILoading,
        askPlant,
        clearChat,
        activeAnomalies,
        activeRecommendations,
        activeScenario,
        setActiveScenario,
        captureAndObserve,
        clearHistory,
        syncStatus,
        farmId,
        stationId,
        plantId,
        latestReasoningEvent,
        reasoningHistory,
        whatChangedSummary,
        digitalProfile,
        lifecycleMilestones,
        correlationSummary,
        correlations: correlationSummary.associations,
      }}
    >
      {children}
    </PlantIntelligenceContext.Provider>
  );
}

export function usePlantIntelligence() {
  const context = useContext(PlantIntelligenceContext);
  if (context === undefined) {
    throw new Error('usePlantIntelligence must be used within a PlantIntelligenceProvider');
  }
  return context;
}
