'use client';

// ============================================================
// HydroSmart — Plant Intelligence Context & State Provider
// Integrated with Cloud Firestore Persistence & Scoped User Identity
// ============================================================

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  AIPlantMessage
} from './types';
import { CloudSyncStatus } from '@/lib/firebase/types';
import {
  DEFAULT_CROP_PROFILE,
  evaluateEnvironmentalHealth,
  generateHealthReport
} from './healthScore';
import { detectEnvironmentalAnomalies } from './anomalyDetection';
import { identifyPlant } from './plantIdentification';
import { cropPlantRegion } from '@/lib/vision/plantIdentifier';
import { multimodalHealthEngine } from './multimodalEngine';
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
}

const PlantIntelligenceContext = createContext<PlantIntelligenceContextType | undefined>(undefined);

export function PlantIntelligenceProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { mode, isStale, latestReading } = useESP32Serial();
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
    const visualScore = latestVisualHealth && latestVisualHealth.healthState !== 'unknown'
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

  // Identify plant from current camera frame
  const identifyCurrentPlant = useCallback(async (): Promise<PlantIdentificationResponse | null> => {
    // Gate: Require plant presence before identifying
    if (!latestDetection?.isPlantDetected) {
      const noPlantResp: PlantIdentificationResponse = {
        status: 'no_plant_detected',
        rankedCandidates: [],
        overallConfidence: 0,
        confidenceLevel: 'uncertain',
        guidanceMessage: 'No plant detected in camera frame. Position a plant clearly within the camera view before identifying.',
        timestamp: Date.now(),
      };
      setIdentificationResult(noPlantResp);
      return noPlantResp;
    }

    let snapshot: string | null = null;
    if (videoRef?.current && latestDetection?.boundingBox) {
      snapshot = cropPlantRegion(videoRef.current, { boundingBox: latestDetection.boundingBox, targetMaxDimension: 800 });
    }
    if (!snapshot) {
      snapshot = captureFrame();
    }
    if (!snapshot) return null;

    setIsIdentifying(true);
    try {
      const response = await identifyPlant(snapshot);
      setIdentificationResult(response);
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
  }, [captureFrame, latestDetection, videoRef]);

  // Apply identified candidate as active crop profile
  const applyIdentifiedSpecies = useCallback((candidate: PlantCandidate, imageRef?: string) => {
    const now = Date.now();
    // 1. Update persistent plantProfile while preserving the stable plantId
    setPlantProfile(prev => ({
      ...prev,
      species: candidate.commonName,
      commonName: candidate.commonName,
      scientificName: candidate.scientificName,
      family: candidate.family,
      speciesConfidence: candidate.confidence,
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

  // Capture Current Webcam Frame + Telemetry to Save an Observation
  const captureAndObserve = useCallback((): PlantObservation | null => {
    const scan = analyzeNow();
    const detection = scan?.detection;
    const visualHealth = scan?.health;
    const now = Date.now();

    // Gate 1: Check plant presence (TEST 7: NO_PLANT_DETECTED does not create a false plant health observation)
    if (!detection || !detection.isPlantDetected) {
      console.warn('[PlantIntelligence] Observation rejected: No plant detected in frame.');
      return null;
    }

    // Gate 2: Check confidence (TEST 8: LOW_CONFIDENCE does not create a confident plant conclusion)
    const isLowConfidence = (detection.confidence !== undefined && detection.confidence < 45) ||
      (detection.plantPresenceScore !== undefined && detection.plantPresenceScore < 45);

    const snapshot = captureFrame();

    const isVisualAnomaly = visualHealth
      ? visualHealth.healthState === 'possible_anomaly' || visualHealth.healthState === 'significant_anomaly'
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
      visualHealthState: isLowConfidence ? 'unknown' : visualHealth?.healthState,
      visualScoreBreakdown: isLowConfidence ? undefined : visualHealth?.breakdown,
      visualIndicators: visualHealth?.indicators.map(i => i.label),
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
    };

    // Update plant profile observation counter and recency
    setPlantProfile(prev => ({
      ...prev,
      observationCount: prev.observationCount + 1,
      lastObservedAt: now,
      currentHealthStatus: multimodalAssessment.overallHealthState || 'optimal',
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
        plantId
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
