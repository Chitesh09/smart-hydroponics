'use client';

import { useMemo } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { getFarmerCopy, getLocalizedMilestone } from '@/lib/intelligence/farmerSemanticLayer';
import { LiveLineChart } from '@/components/LiveLineChart';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { PlantProfileCard } from '@/components/ui/PlantProfileCard';
import { WhatChangedCard } from '@/components/ui/WhatChangedCard';
import { EnvironmentPlantCard } from '@/components/ui/EnvironmentPlantCard';
import { PlantAlertCard } from '@/components/ui/PlantAlertCard';



export default function AnalyticsPage() {
  const { history, mode, isStale, latestReading } = useESP32Serial();
  const {
    observations,
    cropIdentity,
    plantProfile,
    digitalProfile,
    lifecycleMilestones,
    predictiveAnalytics,
    userMode,
    setUserMode,
    language,
    setLanguage,
    whatChangedSummary,
    correlationSummary,
    correlations,
    alertSummary,
    dismissAlert,
    acknowledgeAlert,
  } = usePlantIntelligence();

  const activeProfile = digitalProfile || plantProfile;
  const copy = useMemo(() => getFarmerCopy(language), [language]);
  const isKn = language === 'kn';
  const isFarmer = userMode === 'farmer';

  const isPlantIdentified = Boolean(
    (activeProfile.species && activeProfile.species !== 'Unknown Plant' && activeProfile.species !== 'unknown_plant') ||
    (cropIdentity.commonName && cropIdentity.commonName !== 'Plant' && cropIdentity.commonName !== 'Unknown Plant' && cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.cropKey !== 'unclassified_plant')
  );
  const plantDisplayName = isPlantIdentified
    ? (activeProfile.commonName || activeProfile.species || cropIdentity.commonName)
    : (isKn ? 'ಪರಿಶೀಲಿಸುತ್ತಿರುವ ಗಿಡ' : 'Monitored Specimen');
  const botanicalScientific = isPlantIdentified
    ? (activeProfile.scientificName || cropIdentity.scientificName || (isKn ? 'ವರ್ಗೀಕರಿಸದ ಪ್ರಭೇದ' : 'Species Unclassified'))
    : (isKn ? copy.ui.plantNotIdentified : 'Plant type not identified yet');

  // Format historical chart labels across telemetry history
  const labels = history.map((item) =>
    new Date(item.timestamp).toLocaleTimeString(isKn ? 'kn-IN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
  
  const phData = history.map((item) => item.ph);
  const tdsData = history.map((item) => item.tds);
  const waterLevelData = history.map((item) => item.waterLevel);

  // Calculate historical deltas over the recorded timeframe
  const historicalDeltas = useMemo(() => {
    if (history.length < 2) {
      return {
        phChange: 0,
        tdsChange: 0,
        waterChange: 0,
        hasSufficientData: false,
      };
    }
    const initial = history[0];
    const current = history[history.length - 1];
    return {
      phChange: current.ph - initial.ph,
      tdsChange: current.tds - initial.tds,
      waterChange: current.waterLevel - initial.waterLevel,
      hasSufficientData: true,
    };
  }, [history]);

  // Generate plant chronological milestones from Phase 8 lifecycle intelligence
  const displayMilestones = useMemo(() => {
    if (lifecycleMilestones && lifecycleMilestones.length > 0) {
      return lifecycleMilestones.map((m) => {
        const localized = getLocalizedMilestone(m, language);
        const statusLabel = m.status === 'optimal'
          ? copy.analytics.statusHealthy
          : m.status === 'critical'
            ? (isKn ? 'ಗಮನ ಬೇಕು' : 'Attention')
            : m.status === 'warning'
              ? (isKn ? 'ಎಚ್ಚರಿಕೆ' : 'Warning')
              : copy.analytics.statusStable;

        const badgeStatus = (m.status === 'optimal' ? 'healthy' : m.status || 'stable') as 'healthy' | 'warning' | 'critical' | 'stable';

        return {
          id: m.id,
          date: `${m.dateString} · ${localized.dayLabel}`,
          title: localized.title,
          description: localized.description,
          status: badgeStatus,
          statusLabel,
          confidence: m.confidence,
          type: m.type,
        };
      });
    }

    if (observations.length === 0) {
      return [];
    }

    return observations.slice(0, 6).map((obs, idx) => {
      const timeStr = new Date(obs.timestamp).toLocaleDateString(isKn ? 'kn-IN' : 'en-US', { month: 'short', day: 'numeric' });
      const checkpointNumber = observations.length - idx;
      const cycleText = isKn ? `ಹಂತ #${checkpointNumber}` : `Cycle #${checkpointNumber}`;
      const title = isPlantIdentified
        ? `${plantDisplayName} · ${copy.analytics.milestoneCheckpointTitle}`
        : `${copy.analytics.milestoneCheckpointTitle} #${checkpointNumber}`;
      
      const reasoning = obs.reasoningEvent;
      const description = isFarmer
        ? (reasoning?.farmerCopy?.observableSummary
            ? `${reasoning.farmerCopy.observableSummary} ${reasoning.farmerCopy.whySummary ? `(${reasoning.farmerCopy.whySummary})` : ''}`
            : (isKn
                ? `ಗಿಡ ಪರಿಶೀಲಿಸಲಾಗಿದೆ: ನೀರಿನ ಮಟ್ಟ ${Math.round(obs.waterLevel || 0)}%, ಆರೋಗ್ಯಕರ ಸ್ಥಿತಿ.`
                : `Plant check recorded: Water level ${Math.round(obs.waterLevel || 0)}%, healthy growth maintained.`))
        : (reasoning?.observations && reasoning.observations.length > 0
            ? `${reasoning.scenarioCode}: ${reasoning.observations.slice(0, 2).join('; ')}`
            : (isKn
                ? `ಸಂವೇದಕಗಳು [${obs.plantId || activeProfile.plantId}] pH ${obs.ph?.toFixed(2) || '--'} ಮತ್ತು TDS ${Math.round(obs.tds || 0)} PPM (${Math.round(obs.waterLevel || 0)}% ನೀರಿನ ಮಟ್ಟ) ದಾಖಲಿಸಿವೆ.`
                : `Sensors [${obs.plantId || activeProfile.plantId}] recorded pH ${obs.ph?.toFixed(2) || '--'} and TDS ${Math.round(obs.tds || 0)} PPM with ${obs.waterLevel || 0}% reservoir level.`));

      const isHealthy = reasoning ? reasoning.plantState === 'HEALTHY' : (obs.overallHealthScore && obs.overallHealthScore >= 80);
      const isUrgent = reasoning ? reasoning.plantState === 'CRITICAL' : false;
      const isAttention = reasoning ? reasoning.plantState === 'ATTENTION' : false;
      const status = (isUrgent ? 'attention' : isAttention ? 'warning' : isHealthy ? 'healthy' : 'stable') as 'healthy' | 'attention' | 'warning' | 'stable';
      return {
        id: `obs-${obs.id || idx}`,
        date: `${timeStr} · ${cycleText}`,
        title,
        description: isFarmer ? (reasoning?.farmerCopy?.observableSummary || description) : (reasoning?.observations?.[0] || description),
        context: isFarmer ? reasoning?.farmerCopy?.whySummary : (reasoning?.scenarioCode || 'Routine Check'),
        significance: isHealthy ? 'Nominal' : isUrgent ? 'Critical Action Required' : 'Requires Attention',
        status,
        statusLabel: isHealthy ? copy.analytics.statusHealthy : copy.analytics.statusStable,
      };
    });
  }, [lifecycleMilestones, observations, language, isKn, isFarmer, copy, isPlantIdentified, plantDisplayName, activeProfile.plantId]);

  const exportToCSV = () => {
    if (history.length === 0 && observations.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,Plant ID,Observation Type,pH Level,TDS (PPM),Water Level (%),Plant Species,Visual Health Score\n';

    // Export observations first
    observations.forEach((obs) => {
      const timeStr = new Date(obs.timestamp).toLocaleString();
      const row = `"${timeStr}","${obs.plantId || activeProfile.plantId}","Observation Checkpoint",${obs.ph?.toFixed(2) || ''},${obs.tds?.toFixed(1) || ''},${obs.waterLevel?.toFixed(1) || ''},"${obs.plantSpecies || plantDisplayName}",${obs.visualHealthScore || ''}`;
      csvContent += row + '\n';
    });

    // Export history intervals
    history.forEach((item) => {
      const timeStr = new Date(item.timestamp).toLocaleString();
      const row = `"${timeStr}","${activeProfile.plantId}","Telemetry Interval",${item.ph.toFixed(2)},${item.tds.toFixed(1)},${item.waterLevel.toFixed(1)},"${plantDisplayName}",`;
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `plant_journey_${plantDisplayName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* 1. Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="section-label">{copy.analytics.subtitle}</span>
          <h1 className="display-title">{copy.analytics.title}</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <ModeToggle mode={userMode} onModeChange={setUserMode} language={language} size="sm" />
          <LanguageToggle language={language} onLanguageChange={setLanguage} size="sm" />
          <button
            className="btn btn-secondary"
            onClick={exportToCSV}
            disabled={history.length === 0 && observations.length === 0}
            style={{ fontSize: '11.5px' }}
          >
            <span className="font-bold">↓</span>
            <span>{copy.analytics.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* 2. Primary Plant Profile */}
      <PlantProfileCard
        profile={activeProfile}
        observationsCount={observations.length}
        language={language}
        userMode={userMode}
      />

      {/* 2.5 Narrative Overview Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="text-emerald-400 font-bold text-2xl">◓</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {copy.analytics.lifecycleOf} {plantDisplayName}
              </span>
              <span style={{ fontSize: '12px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                ({botanicalScientific})
              </span>
              <DataSourceBadge mode={mode} isStale={isStale} hasData={history.length > 0} />
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              {isFarmer ? copy.analytics.lifecycleDescFarmer : copy.analytics.lifecycleDescTech}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="font-bold text-slate-500">[Date]</span>
            <span className="scientific-meta">{observations.length} {copy.analytics.checkpointsCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="font-bold text-slate-500">[Log]</span>
            <span className="scientific-meta">{history.length} {copy.analytics.dataIntervalsCount}</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. HISTORICAL PARAMETER DRIFT & NET CHANGES                  */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        
        {/* Card 1: pH / Water Acidity */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-label" style={{ fontSize: '10px' }}>
              {isFarmer ? copy.analytics.waterAcidityTitleFarmer : copy.analytics.waterAcidityTitleTech}
            </span>
            <span className="scientific-meta">
              {isFarmer ? copy.analytics.waterAcidityTargetFarmer : copy.analytics.waterAcidityTargetTech}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {latestReading
                ? (isFarmer
                    ? (Math.abs(latestReading.ph - 6.0) < 0.8 ? copy.analytics.qualitativeBalanced : copy.analytics.qualitativeAttention)
                    : latestReading.ph.toFixed(2))
                : '--'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              {historicalDeltas.hasSufficientData ? (
                <>
                  {historicalDeltas.phChange > 0.05 ? (
                    <span className="text-amber-400 font-bold">↗</span>
                  ) : historicalDeltas.phChange < -0.05 ? (
                    <span className="text-teal-400 font-bold">↘</span>
                  ) : (
                    <span className="text-emerald-400 font-bold">−</span>
                  )}
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {historicalDeltas.phChange >= 0 ? '+' : ''}{historicalDeltas.phChange.toFixed(2)} {copy.analytics.netShift}
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>{copy.analytics.initialBaseline}</span>
              )}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {isFarmer
              ? copy.analytics.waterAcidityDescFarmer
              : `${copy.analytics.waterAcidityDescTech} ${predictiveAnalytics.predictions.ph.driftPerDay >= 0 ? '+' : ''}${predictiveAnalytics.predictions.ph.driftPerDay.toFixed(2)} pH/day`}
          </span>
        </div>

        {/* Card 2: Nutrient TDS Consumption */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-label" style={{ fontSize: '10px' }}>
              {isFarmer ? copy.analytics.nutrientFoodTitleFarmer : copy.analytics.nutrientFoodTitleTech}
            </span>
            <span className="scientific-meta">
              {isFarmer ? copy.analytics.nutrientFoodTargetFarmer : copy.analytics.nutrientFoodTargetTech}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {latestReading
                ? (isFarmer
                    ? (latestReading.tds >= 700 && latestReading.tds <= 1400 ? copy.analytics.qualitativeNormal : copy.analytics.qualitativeAttention)
                    : `${Math.round(latestReading.tds)} PPM`)
                : '--'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              {historicalDeltas.hasSufficientData ? (
                <>
                  <span className="text-teal-400 font-bold">↘</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {historicalDeltas.tdsChange >= 0 ? '+' : ''}{Math.round(historicalDeltas.tdsChange)} PPM {copy.analytics.netShift}
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>{copy.analytics.initialBaseline}</span>
              )}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {isFarmer
              ? copy.analytics.nutrientFoodDescFarmer
              : `${copy.analytics.nutrientFoodDescTech} ${Math.round(predictiveAnalytics.predictions.tds.driftPerDay)} PPM/day`}
          </span>
        </div>

        {/* Card 3: Water Reservoir Depletion */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="section-label" style={{ fontSize: '10px' }}>
              {isFarmer ? copy.analytics.reservoirTitleFarmer : copy.analytics.reservoirTitleTech}
            </span>
            <span className="scientific-meta">
              {isFarmer ? copy.analytics.reservoirTargetFarmer : copy.analytics.reservoirTargetTech}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="font-mono" style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
              {latestReading ? `${Math.round(latestReading.waterLevel)}%` : '--'}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
              {historicalDeltas.hasSufficientData ? (
                <>
                  <span className="text-teal-400 font-bold">≈</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {historicalDeltas.waterChange >= 0 ? '+' : ''}{historicalDeltas.waterChange.toFixed(1)}% {copy.analytics.netShift}
                  </span>
                </>
              ) : (
                <span style={{ color: 'var(--text-muted)' }}>{copy.analytics.initialBaseline}</span>
              )}
            </div>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold !== null
              ? `${copy.analytics.reservoirDescTech} ~${predictiveAnalytics.predictions.waterLevel.estimatedDaysToThreshold} ${isKn ? 'ದಿನಗಳಲ್ಲಿ' : 'days'}`
              : copy.analytics.reservoirDescFarmer}
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3B. "WHAT CHANGED?" INTELLIGENCE                             */}
      {/* ============================================================ */}
      {whatChangedSummary && (
        <WhatChangedCard
          summary={whatChangedSummary}
          language={language}
          userMode={userMode}
          onUserModeChange={setUserMode}
        />
      )}

      {/* ============================================================ */}
      {/* 3C. ENVIRONMENT ↔ PLANT CORRELATION INTELLIGENCE (Phase 9)   */}
      {/* ============================================================ */}
      <EnvironmentPlantCard
        summary={correlationSummary}
        associations={correlations}
        language={language}
        userMode={userMode}
        onUserModeChange={setUserMode}
      />

      {/* ============================================================ */}
      {/* 3D. CONFIDENCE-AWARE ALERTS & NOTIFICATIONS (Phase 10)       */}
      {/* ============================================================ */}
      {alertSummary.hasAnyAlert && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="section-label">
                {isKn ? 'ಗಿಡದ ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು' : 'Active Plant Alerts & Warnings'}
              </span>
              <span className="badge badge-amber" style={{ fontSize: '10.5px', padding: '2px 8px' }}>
                {alertSummary.activeAlerts.length} {isKn ? 'ಸಕ್ರಿಯ' : 'active'}
              </span>
            </div>
            <span className="scientific-meta">
              {isKn ? 'ಸಾಕ್ಷ್ಯಾಧಾರಿತ ಎಚ್ಚರಿಕೆಗಳು' : 'Gated Longitudinal Evidence'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alertSummary.activeAlerts.map(alert => (
              <PlantAlertCard
                key={alert.id}
                alert={alert}
                mode={userMode}
                language={language}
                onDismiss={dismissAlert}
                onAcknowledge={acknowledgeAlert}
              />
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. CHRONOLOGICAL MILESTONE TIMELINE                         */}
      {/* ============================================================ */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="font-bold text-slate-500">[Date]</span>
            <span className="section-label">{copy.analytics.milestonesTitle}</span>
          </div>
          <span className="scientific-meta">{copy.analytics.milestonesSubtitle}</span>
        </div>

        {displayMilestones.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {isKn ? 'ಇನ್ನೂ ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ. ಐತಿಹಾಸಿಕ ಡೇಟಾ ಸಂಗ್ರಹಿಸಲು ಗಿಡವನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.' : 'Not enough historical data to generate a timeline. Keep monitoring the plant to build its journey.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', paddingLeft: '24px', marginLeft: '12px' }}>
            <div style={{ position: 'absolute', left: '0', top: '8px', bottom: '8px', width: '2px', background: 'var(--border-subtle)', borderRadius: '1px' }} />
            
            {displayMilestones.map((milestone, idx) => (
              <div
                key={milestone.id || idx}
                style={{
                  position: 'relative',
                  paddingBottom: idx !== displayMilestones.length - 1 ? '32px' : '0'
                }}
              >
                <div style={{ position: 'absolute', left: '-29px', top: '6px', width: '12px', height: '12px', borderRadius: '50%', background: 'var(--bg-canvas)', border: `2px solid var(--color-${milestone.status === 'healthy' ? 'green' : milestone.status === 'attention' ? 'red' : milestone.status === 'warning' ? 'amber' : 'teal'})`, zIndex: 10 }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="scientific-meta" style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {milestone.date}
                    </span>
                    <StatusBadge status={milestone.status} label={milestone.statusLabel} size="sm" />
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {milestone.title}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
                      <strong style={{ color: 'var(--color-teal)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '6px' }}>Observation:</strong>
                      {milestone.description}
                    </div>
                    {('context' in milestone && milestone.context) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--color-emerald)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '6px' }}>Context:</strong>
                        {(milestone as any).context}
                      </div>
                    )}
                    {('significance' in milestone && milestone.significance) && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <strong style={{ color: 'var(--color-amber)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '6px' }}>Significance:</strong>
                        {(milestone as any).significance}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. LONGITUDINAL TRAJECTORY CHARTS (HISTORICAL)              */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="text-emerald-400 font-bold text-lg leading-none mt-[-2px]">≡</span>
            <span className="section-label">
              {isFarmer ? copy.analytics.chartSectionTitleFarmer : copy.analytics.chartSectionTitleTech}
            </span>
          </div>
          <span className="scientific-meta">
            {isFarmer ? copy.analytics.chartSectionSubFarmer : copy.analytics.chartSectionSubTech}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {/* pH / Water Acidity Chart */}
          <div
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-label">
                {isFarmer ? copy.analytics.phChartTitleFarmer : copy.analytics.phChartTitleTech}
              </span>
              <span className="scientific-meta">
                {isFarmer ? copy.analytics.waterAcidityTargetFarmer : copy.analytics.waterAcidityTargetTech}
              </span>
            </div>
            <LiveLineChart 
              data={phData} 
              labels={labels} 
              title={isKn ? 'ನೀರಿನ ಸಮತೋಲನ (pH)' : 'pH Level'} 
              color="#1CA7A0" 
              min={4.0} 
              max={8.0} 
            />
          </div>

          {/* TDS / Nutrient Level Chart */}
          <div
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-label">
                {isFarmer ? copy.analytics.tdsChartTitleFarmer : copy.analytics.tdsChartTitleTech}
              </span>
              <span className="scientific-meta">
                {isFarmer ? copy.analytics.nutrientFoodTargetFarmer : copy.analytics.nutrientFoodTargetTech}
              </span>
            </div>
            <LiveLineChart 
              data={tdsData} 
              labels={labels} 
              title={isKn ? 'ಪೋಷಕಾಂಶಗಳು (PPM)' : 'TDS (PPM)'} 
              color="#2EB872" 
              min={600} 
              max={1400} 
            />
          </div>

          {/* Reservoir Capacity Chart */}
          <div
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="section-label">
                {isFarmer ? copy.analytics.waterChartTitleFarmer : copy.analytics.waterChartTitleTech}
              </span>
              <span className="scientific-meta">
                {isFarmer ? copy.analytics.reservoirTargetFarmer : copy.analytics.reservoirTargetTech}
              </span>
            </div>
            <LiveLineChart 
              data={waterLevelData} 
              labels={labels} 
              title={isKn ? 'ನೀರಿನ ಮಟ್ಟ (%)' : 'Water Level (%)'} 
              color="#1CA7A0" 
              min={0} 
              max={100} 
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. HISTORICAL PLANT OBSERVATIONS LOG ARCHIVE                */}
      {/* ============================================================ */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: '22px 24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="text-emerald-400 font-bold text-lg">★</span>
            <span className="section-label">
              {isFarmer ? copy.analytics.archiveTitleFarmer : copy.analytics.archiveTitleTech}
            </span>
          </div>
          <span className="scientific-meta">
            {observations.length} {copy.analytics.archiveSnapshots}
          </span>
        </div>

        {observations.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            {isFarmer ? copy.analytics.archiveEmptyFarmer : copy.analytics.archiveEmptyTech}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>{copy.analytics.thTimestamp}</th>
                  {!isFarmer && <th style={{ padding: '10px 12px', fontWeight: 600 }}>Plant ID</th>}
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>{copy.analytics.thSpecimen}</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>{copy.analytics.thVisualHealth}</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>{copy.analytics.thPh}</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>{copy.analytics.thTds}</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>{copy.analytics.thWater}</th>
                  <th style={{ padding: '10px 12px', fontWeight: 600 }}>{copy.analytics.thStatus}</th>
                </tr>
              </thead>
              <tbody>
                {observations.slice(0, 20).map((obs) => {
                  const isHealthy = obs.overallHealthScore && obs.overallHealthScore >= 80;
                  return (
                    <tr key={obs.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {new Date(obs.timestamp).toLocaleString(isKn ? 'kn-IN' : 'en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      {!isFarmer && (
                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--color-teal)' }}>
                          {obs.plantId || plantProfile.plantId}
                        </td>
                      )}
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {obs.plantSpecies || plantDisplayName}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                        {obs.visualHealthScore
                          ? (isFarmer
                              ? (obs.visualHealthScore >= 75 ? copy.analytics.qualitativeGood : copy.analytics.qualitativeAttention)
                              : `${obs.visualHealthScore}/100`)
                          : '--'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {obs.ph !== undefined
                          ? (isFarmer
                              ? (Math.abs(obs.ph - 6.0) < 0.8 ? copy.analytics.qualitativeBalanced : copy.analytics.qualitativeAttention)
                              : obs.ph.toFixed(2))
                          : '--'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {obs.tds !== undefined
                          ? (isFarmer
                              ? (obs.tds >= 700 && obs.tds <= 1400 ? copy.analytics.qualitativeAdequate : copy.analytics.qualitativeAttention)
                              : `${Math.round(obs.tds)} PPM`)
                          : '--'}
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                        {obs.waterLevel !== undefined ? `${Math.round(obs.waterLevel)}%` : '--'}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <StatusBadge
                          status={isHealthy ? 'optimal' : 'warning'}
                          label={isHealthy ? copy.analytics.statusHealthy : copy.analytics.statusWarning}
                          size="sm"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
