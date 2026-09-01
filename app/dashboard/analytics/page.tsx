'use client';

import { useMemo } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { LiveLineChart } from '@/components/LiveLineChart';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Compass,
  Download,
  Calendar,
  History
} from 'lucide-react';

export default function AnalyticsPage() {
  const { history, mode, isStale } = useESP32Serial();
  const { observations, cropIdentity } = usePlantIntelligence();

  const isPlantIdentified = cropIdentity.cropKey !== 'unknown_plant' && cropIdentity.commonName !== 'Unknown Plant';
  const plantDisplayName = isPlantIdentified ? cropIdentity.commonName : 'Monitored Specimen';

  // Format chart labels and dataset streams
  const labels = history.map((item) =>
    new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  );
  
  const phData = history.map((item) => item.ph);
  const tdsData = history.map((item) => item.tds);
  const waterLevelData = history.map((item) => item.waterLevel);
  const distanceData = history.map((item) => item.distance);

  // Generate plant chronological milestones from observations
  const plantMilestones = useMemo(() => {
    if (observations.length === 0) {
      return [
        {
          date: 'Day 1 · Baseline',
          title: 'Station Observation Initialized',
          description: 'Baseline sensory telemetry active. Optical foliage inspection engaged.',
          status: 'stable',
        },
      ];
    }

    return observations.slice(0, 6).map((obs, idx) => {
      const timeStr = new Date(obs.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
      return {
        date: `${timeStr} · Cycle #${observations.length - idx}`,
        title: obs.plantSpecies ? `${obs.plantSpecies} Observation Logged` : 'Foliage Snapshot',
        description: `Sensors recorded pH ${obs.ph?.toFixed(2) || '--'} and TDS ${Math.round(obs.tds || 0)} PPM with ${obs.waterLevel || 0}% reservoir level.`,
        status: obs.overallHealthScore && obs.overallHealthScore >= 80 ? 'healthy' : 'stable',
      };
    });
  }, [observations]);

  const exportToCSV = () => {
    if (history.length === 0) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,pH Level,TDS (PPM),Water Level (%),Distance (cm)\n';

    history.forEach((item) => {
      const timeStr = new Date(item.timestamp).toLocaleString();
      const row = `"${timeStr}",${item.ph.toFixed(2)},${item.tds.toFixed(1)},${item.waterLevel.toFixed(1)},${item.distance.toFixed(1)}`;
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1240px', margin: '0 auto' }}>
      
      {/* 1. Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px', paddingBottom: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span className="section-label">Chronological Narrative</span>
          <h1 className="display-title">Plant Journey</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={exportToCSV} disabled={history.length === 0} style={{ fontSize: '11.5px' }}>
            <Download size={13} />
            <span>Export Journey CSV</span>
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
          <Compass size={20} style={{ color: 'var(--color-green)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Cultivation Lifecycle of {plantDisplayName}
              </span>
              <DataSourceBadge mode={mode} isStale={isStale} hasData={history.length > 0} />
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-secondary)' }}>
              Plotting longitudinal growth history across {observations.length} observation checkpoints.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="scientific-meta">{history.length} Telemetry Intervals</span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. PLANT JOURNEY CHRONOLOGICAL TIMELINE                     */}
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
            <span className="section-label">Chronological Milestones</span>
          </div>
          <span className="scientific-meta">Biological Story</span>
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
                <StatusBadge status={milestone.status} size="sm" />
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
      {/* 4. SUPPORTING TELEMETRY TRAJECTORIES                         */}
      {/* ============================================================ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        
        {/* pH Stability */}
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
            <span className="section-label">pH Acidity Stability Horizon</span>
            <span className="scientific-meta">Target: 5.5 - 6.5</span>
          </div>
          <LiveLineChart 
            data={phData} 
            labels={labels} 
            title="pH Level" 
            color="#1CA7A0" 
            min={4.0} 
            max={8.0} 
          />
        </div>

        {/* TDS Nutrient Depletion */}
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
            <span className="section-label">Nutrient TDS Consumption (PPM)</span>
            <span className="scientific-meta">Target: 800 - 1200 PPM</span>
          </div>
          <LiveLineChart 
            data={tdsData} 
            labels={labels} 
            title="TDS (PPM)" 
            color="#2EB872" 
            min={600} 
            max={1400} 
          />
        </div>

        {/* Reservoir Capacity */}
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
            <span className="section-label">Reservoir Water Level Capacity (%)</span>
            <span className="scientific-meta">Critical: &lt; 20%</span>
          </div>
          <LiveLineChart 
            data={waterLevelData} 
            labels={labels} 
            title="Water Level (%)" 
            color="#1CA7A0" 
            min={0} 
            max={100} 
          />
        </div>

        {/* Ultrasonic Air Gap */}
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
            <span className="section-label">Ultrasonic Air Gap Distance (cm)</span>
            <span className="scientific-meta">Sensor Calibration Offset</span>
          </div>
          <LiveLineChart 
            data={distanceData} 
            labels={labels} 
            title="Distance (cm)" 
            color="#E5A93C" 
            min={0} 
            max={60} 
          />
        </div>

      </div>

    </div>
  );
}
