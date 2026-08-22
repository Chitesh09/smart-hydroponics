'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import { usePlantMonitor } from '@/lib/camera/usePlantMonitor';
import { PlantDetectionResult } from '@/lib/vision/plantDetector';
import { VisualHealthAnalysisResult } from '@/lib/vision/plantHealthAnalyzer';
import {
  PlantObservation,
  PlantIdentity,
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
  StatisticalAnomalyResult
} from './types';
import {
  DEFAULT_CROP_PROFILE,
  evaluateEnvironmentalHealth,
  generateHealthReport
} from './healthScore';
import { detectEnvironmentalAnomalies } from './anomalyDetection';
import { identifyPlant } from './plantIdentification';
import { multimodalHealthEngine } from './multimodalEngine';
import {
  computeGrowthEstimates,
  compilePlantJourney,
  answerPlantMemoryQueries
} from './plantMemory';
import { runPredictiveAnalytics } from './predictiveAnalytics';
import {
  getStoredObservations,
  saveObservation,
  clearStoredObservations
} from './observationStore';
import { DEMO_SCENARIOS } from './demoScenarios';

interface PlantIntelligenceContextType {
  cropIdentity: PlantIdentity;
  setCropIdentity: React.Dispatch<React.SetStateAction<PlantIdentity>>;
  observations: PlantObservation[];
  latestObservation: PlantObservation | null;
  latestDetection: PlantDetectionResult | null;
  latestVisualHealth: VisualHealthAnalysisResult | null;
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
  activeAnomalies: AnomalyReport[];
  activeRecommendations: RecommendationItem[];
  activeScenario: DemoScenario;
  setActiveScenario: (scenario: DemoScenario) => void;
  captureAndObserve: () => PlantObservation | null;
  clearHistory: () => void;
}

const PlantIntelligenceContext = createContext<PlantIntelligenceContextType | undefined>(undefined);

export function PlantIntelligenceProvider({ children }: { children: React.ReactNode }) {
  const { mode, isStale, latestReading } = useESP32Serial();
  const { status: cameraStatus, captureFrame } = useCamera();
  const { latestDetection, latestVisualHealth, isScanning, setIsScanning, analyzeNow } = usePlantMonitor();

  // Crop Identity State (Initial defaults to Butterhead Lettuce)
  const [cropIdentity, setCropIdentity] = useState<PlantIdentity>(() => ({
    cropKey: 'butterhead_lettuce',
    commonName: 'Butterhead Lettuce',
    scientificName: 'Lactuca sativa var. capitata',
    family: 'Asteraceae',
    plantedTimestamp: undefined,
    growthStage: 'vegetative',
    targetProfile: DEFAULT_CROP_PROFILE,
  }));

  // Identification State
  const [identificationResult, setIdentificationResult] = useState<PlantIdentificationResponse | null>(null);
  const [isIdentifying, setIsIdentifying] = useState<boolean>(false);

  // Multimodal Observation History (loaded asynchronously on client mount)
  const [observations, setObservations] = useState<PlantObservation[]>([]);
  const [activeScenario, setActiveScenarioState] = useState<DemoScenario>('healthy');

  useEffect(() => {
    const stored = getStoredObservations();
    const timer = setTimeout(() => {
      setObservations(stored);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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

  // 3. Phase 7: Predictive Analytics & Statistical Anomaly Engine
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

  // 5. Phase 5 Multimodal Health Engine
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

  // 6. Phase 6 Plant Growth & Memory Calculations
  const growthMetrics = useMemo(() => {
    return computeGrowthEstimates(observations);
  }, [observations]);

  const plantJourney = useMemo(() => {
    return compilePlantJourney(observations);
  }, [observations]);

  const memoryAnswers = useMemo(() => {
    return answerPlantMemoryQueries(observations, cropIdentity.commonName);
  }, [observations, cropIdentity.commonName]);

  // Identify plant from current camera frame
  const identifyCurrentPlant = useCallback(async (): Promise<PlantIdentificationResponse | null> => {
    const snapshot = captureFrame();
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
  }, [captureFrame]);

  // Apply identified candidate as active crop profile
  const applyIdentifiedSpecies = useCallback((candidate: PlantCandidate, imageRef?: string) => {
    const now = Date.now();
    setCropIdentity({
      cropKey: candidate.id,
      commonName: candidate.commonName,
      scientificName: candidate.scientificName,
      family: candidate.family,
      confidence: candidate.confidence,
      identificationTimestamp: now,
      imageReference: imageRef || identificationResult?.imageReference,
      plantedTimestamp: now - 7 * 86400000,
      growthStage: 'vegetative',
      targetProfile: candidate.targetProfile,
    });
  }, [identificationResult]);

  // Capture Current Webcam Frame + Telemetry to Save an Observation
  const captureAndObserve = useCallback((): PlantObservation | null => {
    const snapshot = captureFrame();
    const scan = analyzeNow();
    const detection = scan?.detection;
    const visualHealth = scan?.health;
    const now = Date.now();

    const isVisualAnomaly = visualHealth
      ? visualHealth.healthState === 'possible_anomaly' || visualHealth.healthState === 'significant_anomaly'
      : false;

    const newObservation: PlantObservation = {
      id: `obs_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      imageReference: snapshot || undefined,
      cameraActive: cameraStatus === 'connected',
      isPlantDetected: detection?.isPlantDetected,
      plantDetectionConfidence: detection?.confidence,
      canopyCoveragePercent: detection?.canopyCoveragePercent,
      vegetationIndex: detection?.vegetationIndex,
      visualHealthScore: visualHealth?.visualHealthScore,
      visualHealthState: visualHealth?.healthState,
      visualScoreBreakdown: visualHealth?.breakdown,
      visualIndicators: visualHealth?.indicators.map(i => i.label),
      ph: currentPh,
      tds: currentTds,
      waterLevel: currentWaterLevel,
      distance: currentDistance,
      telemetryMode: mode,
      isTelemetryStale: isStale,
      plantSpecies: cropIdentity.commonName,
      speciesConfidence: cropIdentity.confidence,
      environmentalHealthScore: environmentalAssessment.compositeEnvironmentalScore,
      overallHealthScore: multimodalAssessment.overallScore,
      multimodalAssessment,
      anomalyDetected: activeAnomalies.length > 0 || isVisualAnomaly || statisticalAnomalies.some(a => a.isAnomaly),
      activeAnomalies: activeAnomalies.map(a => a.title),
      recommendations: activeRecommendations.map(r => r.title),
    };

    const updatedList = saveObservation(newObservation);
    setObservations(updatedList);
    return newObservation;
  }, [
    captureFrame,
    analyzeNow,
    cameraStatus,
    currentPh,
    currentTds,
    currentWaterLevel,
    currentDistance,
    mode,
    isStale,
    cropIdentity.commonName,
    cropIdentity.confidence,
    environmentalAssessment.compositeEnvironmentalScore,
    multimodalAssessment,
    activeAnomalies,
    statisticalAnomalies,
    activeRecommendations
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

  const latestObservation = observations.length > 0 ? observations[0] : null;

  return (
    <PlantIntelligenceContext.Provider
      value={{
        cropIdentity,
        setCropIdentity,
        observations,
        latestObservation,
        latestDetection,
        latestVisualHealth,
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
        activeAnomalies,
        activeRecommendations,
        activeScenario,
        setActiveScenario,
        captureAndObserve,
        clearHistory
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
