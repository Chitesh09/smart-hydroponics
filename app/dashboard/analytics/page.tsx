'use client';

import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { LiveLineChart } from '@/components/LiveLineChart';
import { DataSourceBadge } from '@/components/ui/DataSourceBadge';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BarChart3, Download, RefreshCw, Layers } from 'lucide-react';

export default function AnalyticsPage() {
  const { history, mode, isStale } = useESP32Serial();
  const { observations } = usePlantIntelligence();

  // Dynamically map context history to labels and dataset arrays for the charts
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
    link.setAttribute('download', `hydroponics_history_${mode}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="text-3xl font-bold text-primary mb-xs">Historical Analytics</h1>
          <p className="text-secondary">Longitudinal sensor trajectories, chemical stability, and time-series telemetry.</p>
        </div>
        <button 
          className="btn btn-secondary" 
          onClick={exportToCSV}
          disabled={history.length === 0}
        >
          <Download size={15} /> Export Historical CSV
        </button>
      </div>

      {/* Analytics Source Banner */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={20} style={{ color: 'var(--color-teal)' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>Telemetry Time-Series Buffer</span>
              <DataSourceBadge mode={mode} isStale={isStale} hasData={history.length > 0} />
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: '2px' }}>
              Plotting {history.length} continuous telemetry intervals in the rolling operational window.
            </p>
          </div>
        </div>

        {mode === 'real' && !isStale && (
          <span className="text-xs font-mono text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} className="spin" style={{ color: 'var(--color-teal)' }} /> Stream Active
          </span>
        )}
      </div>

      {/* Chemistry Charts */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-teal)' }} />
            <h2 className="text-md font-bold">pH Acidity Stability (Rolling Buffer)</h2>
          </div>
          <LiveLineChart 
            data={phData} 
            labels={labels} 
            title="pH Level" 
            color="#20B8B0" 
            min={4.0} 
            max={8.0} 
          />
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-green)' }} />
            <h2 className="text-md font-bold">TDS Dissolved Mineral Density (PPM)</h2>
          </div>
          <LiveLineChart 
            data={tdsData} 
            labels={labels} 
            title="TDS (PPM)" 
            color="#39B86F" 
            min={600} 
            max={1400} 
          />
        </div>
      </div>

      {/* Reservoir Level & Distance Charts */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-teal)' }} />
            <h2 className="text-md font-bold">Reservoir Water Level Capacity (%)</h2>
          </div>
          <LiveLineChart 
            data={waterLevelData} 
            labels={labels} 
            title="Water Level (%)" 
            color="#20B8B0" 
            min={0} 
            max={100} 
          />
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <BarChart3 size={18} style={{ color: 'var(--color-warning)' }} />
            <h2 className="text-md font-bold">Ultrasonic Sensor Air Gap (cm)</h2>
          </div>
          <LiveLineChart 
            data={distanceData} 
            labels={labels} 
            title="Distance (cm)" 
            color="#F2B84B" 
            min={0} 
            max={60} 
          />
        </div>
      </div>

      {/* Historical Telemetry Snapshots Table */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--color-teal)' }} />
            <h2 className="text-md font-bold">Historical Observation & Telemetry Log</h2>
          </div>
          <span className="text-xs text-muted font-mono">{observations.length} Recorded Snapshots</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>
                <th style={{ padding: '10px 12px' }}>Timestamp</th>
                <th style={{ padding: '10px 12px' }}>Plant Identity</th>
                <th style={{ padding: '10px 12px' }}>pH Level</th>
                <th style={{ padding: '10px 12px' }}>TDS Nutrients</th>
                <th style={{ padding: '10px 12px' }}>Water Level</th>
                <th style={{ padding: '10px 12px' }}>Condition</th>
              </tr>
            </thead>
            <tbody>
              {observations.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '28px' }}>
                    No recorded observations in the database. Use Intelligence or Dashboard to log snapshots.
                  </td>
                </tr>
              ) : (
                observations.slice(0, 10).map((obs) => (
                  <tr key={obs.id} style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                      {new Date(obs.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-primary)', fontWeight: 600 }}>
                      {obs.plantSpecies || 'Unknown Plant'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                      {obs.ph !== undefined ? obs.ph.toFixed(2) : '--'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                      {obs.tds !== undefined ? `${Math.round(obs.tds)} PPM` : '--'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)' }}>
                      {obs.waterLevel !== undefined ? `${Math.round(obs.waterLevel)}%` : '--'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <StatusBadge
                        status={obs.overallHealthScore && obs.overallHealthScore >= 80 ? 'healthy' : obs.overallHealthScore && obs.overallHealthScore >= 60 ? 'attention' : 'critical'}
                        size="sm"
                        label={obs.overallHealthScore ? `${obs.overallHealthScore}/100` : 'LOGGED'}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
