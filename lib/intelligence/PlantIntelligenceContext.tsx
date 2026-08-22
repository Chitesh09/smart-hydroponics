'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { useCamera } from '@/lib/camera/CameraContext';
import {
  PlantObservation,
  PlantIdentity,
  EnvironmentalAssessment,
  PlantHealthReport,
  AnomalyReport,
  RecommendationItem,
  DemoScenario
} from './types';
import {
  DEFAULT_CROP_PROFILE,
  evaluateEnvironmentalHealth,
  generateHealthReport
} from './healthScore';
import { detectEnvironmentalAnomalies } from './anomalyDetection';
import { generateRecommendations } from './recommendations';
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
  environmentalAssessment: EnvironmentalAssessment;
  healthReport: PlantHealthReport;
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

  // Crop Identity State
  const [cropIdentity, setCropIdentity] = useState<PlantIdentity>(() => ({
    cropKey: 'lettuce_butterhead',
    commonName: 'Butterhead Lettuce',
    scientificName: 'Lactuca sativa var. capitata',
    plantedTimestamp: undefined,
    growthStage: 'vegetative',
    targetProfile: DEFAULT_CROP_PROFILE,
  }));

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

  // Active reading values (fallback to defaults if hardware not connected or simulator not reporting yet)
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

  // 3. Actionable Recommendations Generation
  const activeRecommendations = useMemo(() => {
    return generateRecommendations(
      activeAnomalies,
      currentPh,
      currentTds,
      currentWaterLevel,
      cropIdentity.targetProfile
    );
  }, [activeAnomalies, currentPh, currentTds, currentWaterLevel, cropIdentity.targetProfile]);

  // 4. Overall Health Assessment
  const healthReport = useMemo(() => {
    return generateHealthReport(environmentalAssessment);
  }, [environmentalAssessment]);

  // Capture Current Webcam Frame + Telemetry to Save an Observation
  const captureAndObserve = useCallback((): PlantObservation | null => {
    const snapshot = captureFrame();
    const now = Date.now();

    const newObservation: PlantObservation = {
      id: `obs_${now}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: now,
      imageReference: snapshot || undefined,
      cameraActive: cameraStatus === 'connected',
      ph: currentPh,
      tds: currentTds,
      waterLevel: currentWaterLevel,
      distance: currentDistance,
      telemetryMode: mode,
      isTelemetryStale: isStale,
      plantSpecies: cropIdentity.commonName,
      environmentalHealthScore: environmentalAssessment.compositeEnvironmentalScore,
      overallHealthScore: healthReport.overallHealthScore,
      anomalyDetected: activeAnomalies.length > 0,
      activeAnomalies: activeAnomalies.map(a => a.title),
      recommendations: activeRecommendations.map(r => r.title),
    };

    const updatedList = saveObservation(newObservation);
    setObservations(updatedList);
    return newObservation;
  }, [
    captureFrame,
    cameraStatus,
    currentPh,
    currentTds,
    currentWaterLevel,
    currentDistance,
    mode,
    isStale,
    cropIdentity.commonName,
    environmentalAssessment.compositeEnvironmentalScore,
    healthReport.overallHealthScore,
    activeAnomalies,
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
        environmentalAssessment,
        healthReport,
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
