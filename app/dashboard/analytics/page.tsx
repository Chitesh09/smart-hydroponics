'use client';

import { useMemo } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { getFarmerCopy } from '@/lib/intelligence/farmerSemanticLayer';
import { LiveLineChart } from '@/components/LiveLineChart';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Compass,
  Download,
  Calendar,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Layers,
  Droplets
} from 'lucide-react';

export default function AnalyticsPage() {
  const { history, mode, isStale, latestReading } = useESP32Serial();
  const { observations, cropIdentity, predictiveAnalytics, userMode, language } = usePlantIntelligence();

  const copy = useMemo(() => getFarmerCopy(language), [language]);
  const isKn = language === 'kn';
  const isFarmer = userMode === 'farmer';

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified
    ? cropIdentity.commonName
    : (isKn ? 'ಪರಿಶೀಲಿಸುತ್ತಿರುವ ಗಿಡ' : 'Monitored Specimen');
  const botanicalScientific = isPlantIdentified
    ? cropIdentity.scientificName || (isKn ? 'ವರ್ಗೀಕರಿಸದ ಪ್ರಭೇದ' : 'Species Unclassified')
    : copy.analytics.baselineProfile;

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

  // Generate plant chronological milestones from observations
  const plantMilestones = useMemo(() => {
    if (observations.length === 0) {
      return [
        {
          date: isKn ? 'ದಿನ 1 · ಆರಂಭಿಕ ದಾಖಲೆ' : 'Day 1 · Baseline',
          title: copy.analytics.milestoneBaselineTitle,
          description: isFarmer
            ? copy.analytics.milestoneBaselineDescFarmer
            : copy.analytics.milestoneBaselineDescTech,
          status: 'stable',
          statusLabel: copy.analytics.statusStable,
        },
      ];
    }

    return observations.slice(0, 6).map((obs, idx) => {
      const timeStr = new Date(obs.timestamp).toLocaleDateString(isKn ? 'kn-IN' : 'en-US', { month: 'short', day: 'numeric' });
      const cycleText = isKn ? `ಹಂತ #${observations.length - idx}` : `Cycle #${observations.length - idx}`;
      const title = obs.plantSpecies
        ? `${obs.plantSpecies} ${copy.analytics.milestoneCheckpointTitle}`
        : (isKn ? 'ಗಿಡದ ಪರಿಶೀಲನೆ' : 'Foliage Snapshot');
      
      const description = isFarmer
        ? (isKn
            ? `ಗಿಡ ಪರಿಶೀಲಿಸಲಾಗಿದೆ: ನೀರಿನ ಮಟ್ಟ ${Math.round(obs.waterLevel || 0)}%, ಆರೋಗ್ಯಕರ ಸ್ಥಿತಿ.`
            : `Plant check recorded: Water level ${Math.round(obs.waterLevel || 0)}%, healthy growth maintained.`)
        : (isKn
            ? `ಸಂವೇದಕಗಳು pH ${obs.ph?.toFixed(2) || '--'} ಮತ್ತು TDS ${Math.round(obs.tds || 0)} PPM (${Math.round(obs.waterLevel || 0)}% ನೀರಿನ ಮಟ್ಟ) ದಾಖಲಿಸಿವೆ.`
            : `Sensors recorded pH ${obs.ph?.toFixed(2) || '--'} and TDS ${Math.round(obs.tds || 0)} PPM with ${obs.waterLevel || 0}% reservoir level.`);

      const isHealthy = obs.overallHealthScore && obs.overallHealthScore >= 80;
      return {
        date: `${timeStr} · ${cycleText}`,
        title,
        description,
        status: isHealthy ? 'healthy' : 'stable',
        statusLabel: isHealthy ? copy.analytics.statusHealthy : copy.analytics.statusStable,
      };
    });
  }, [observations, isKn, isFarmer, copy]);

  const exportToCSV = () => {
    if (history.length === 0 && observations.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,Observation Type,pH Level,TDS (PPM),Water Level (%),Plant Species,Visual Health Score\n';

    // Export observations first
    observations.forEach((obs) => {
      const timeStr = new Date(obs.timestamp).toLocaleString();
      const row = `"${timeStr}","Observation Checkpoint",${obs.ph?.toFixed(2) || ''},${obs.tds?.toFixed(1) || ''},${obs.waterLevel?.toFixed(1) || ''},"${obs.plantSpecies || 'Unknown'}",${obs.visualHealthScore || ''}`;
      csvContent += row + '\n';
    });

    // Export history intervals
    history.forEach((item) => {
      const timeStr = new Date(item.timestamp).toLocaleString();
      const row = `"${timeStr}","Telemetry Interval",${item.ph.toFixed(2)},${item.tds.toFixed(1)},${item.waterLevel.toFixed(1)},"",`;
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className="btn btn-secondary"
            onClick={exportToCSV}
            disabled={history.length === 0 && observations.length === 0}
            style={{ fontSize: '11.5px' }}
          >
            <Download size={13} />
            <span>{copy.analytics.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* 2. Narrative Overview Banner */}
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
          <Compass size={22} style={{ color: 'var(--color-green)' }} />
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
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="scientific-meta">{observations.length} {copy.analytics.checkpointsCount}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <History size={14} style={{ color: 'var(--text-muted)' }} />
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
                    <TrendingUp size={13} style={{ color: 'var(--color-amber)' }} />
                  ) : historicalDeltas.phChange < -0.05 ? (
                    <TrendingDown size={13} style={{ color: 'var(--color-teal)' }} />
                  ) : (
                    <Minus size={13} style={{ color: 'var(--color-green)' }} />
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
                  <TrendingDown size={13} style={{ color: 'var(--color-teal)' }} />
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
                  <Droplets size={13} style={{ color: 'var(--color-teal)' }} />
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
            <Calendar size={16} style={{ color: 'var(--color-teal)' }} />
            <span className="section-label">{copy.analytics.milestonesTitle}</span>
          </div>
          <span className="scientific-meta">{copy.analytics.milestonesSubtitle}</span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
          }}
        >
          {plantMilestones.map((milestone, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                padding: '14px 16px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="scientific-meta" style={{ fontSize: '10px', color: 'var(--color-green)' }}>
                  {milestone.date}
                </span>
                <StatusBadge status={milestone.status} label={milestone.statusLabel} size="sm" />
              </div>

              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                {milestone.title}
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {milestone.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. LONGITUDINAL TRAJECTORY CHARTS (HISTORICAL)              */}
      {/* ============================================================ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} style={{ color: 'var(--color-green)' }} />
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
            <Sparkles size={16} style={{ color: 'var(--color-green)' }} />
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
                      <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {obs.plantSpecies || (isKn ? 'ಪರಿಶೀಲಿಸುತ್ತಿರುವ ಗಿಡ' : 'Unknown Plant')}
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
