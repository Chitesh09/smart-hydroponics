'use client';

import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { LiveLineChart } from '@/components/LiveLineChart';
import { BarChart3, Download, RefreshCw } from 'lucide-react';

export default function AnalyticsPage() {
  const { history, mode } = useESP32Serial();

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="text-3xl font-bold text-primary mb-sm">Historical Analytics</h1>
          <p className="text-secondary">Track trends, identify anomalies, and optimize future yield.</p>
        </div>
        <button 
          className="btn btn-ghost" 
          onClick={exportToCSV}
          disabled={history.length === 0}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Analytics Source Banner */}
      <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: mode === 'real' ? '4px solid var(--color-primary)' : '4px solid var(--color-warning)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BarChart3 size={20} className={mode === 'real' ? 'text-primary' : 'text-warning'} />
          <div>
            <h4 style={{ fontWeight: 'bold' }}>
              Data Source: {mode === 'real' ? 'Real ESP32 Telemetry (ESP32 LIVE)' : 'Simulation Engine (SIMULATION)'}
            </h4>
            <p className="text-sm text-secondary">
              Currently plotting the last {history.length} data points in the rolling buffer.
            </p>
          </div>
        </div>
        {mode === 'real' && (
          <span className="text-sm font-mono text-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={12} className="animate-spin" /> Stream Active
          </span>
        )}
      </div>

      {/* Main Chemistry Analytics */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
             <BarChart3 size={20} className="text-primary" />
             <h2 className="text-lg font-bold">pH Stability (Rolling Buffer)</h2>
          </div>
          <LiveLineChart 
             data={phData} 
             labels={labels} 
             title="pH Level" 
             color="#00E5FF" 
             min={4.0} 
             max={8.0} 
          />
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
             <BarChart3 size={20} className="text-accent" />
             <h2 className="text-lg font-bold">TDS Nutrient Depletion</h2>
          </div>
          <LiveLineChart 
             data={tdsData} 
             labels={labels} 
             title="TDS (PPM)" 
             color="#B7FF3C" 
             min={600} 
             max={1400} 
          />
        </div>
      </div>

      {/* Reservoir Level & Distance Analytics */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
             <BarChart3 size={20} style={{ color: '#00E5FF' }} />
             <h2 className="text-lg font-bold">Reservoir Water Level (%)</h2>
          </div>
          <LiveLineChart 
             data={waterLevelData} 
             labels={labels} 
             title="Water Level (%)" 
             color="#00E5FF" 
             min={0} 
             max={100} 
          />
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
             <BarChart3 size={20} style={{ color: '#FFC857' }} />
             <h2 className="text-lg font-bold">Sensor Distance (cm)</h2>
          </div>
          <LiveLineChart 
             data={distanceData} 
             labels={labels} 
             title="Distance (cm)" 
             color="#FFC857" 
             min={0} 
             max={120} 
          />
        </div>
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 className="text-lg font-bold mb-md">Nutrient Consumption Log</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Date / Time</th>
                <th>Event Type</th>
                <th>Correction</th>
                <th>Duration</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {mode === 'real' ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    Telemetry mode engaged. Closed-loop chemical corrections are disabled (Monitoring Only).
                  </td>
                </tr>
              ) : (
                <>
                  <tr>
                    <td>Today, 10:42 AM</td>
                    <td><span className="badge badge-warning">Low TDS</span></td>
                    <td>Nutrient Pump Actuated</td>
                    <td>12 sec</td>
                    <td><span className="text-success">+150 PPM Stabilized</span></td>
                  </tr>
                  <tr>
                    <td>Today, 08:15 AM</td>
                    <td><span className="badge badge-danger">High pH</span></td>
                    <td>pH-Down Pump Actuated</td>
                    <td>4 sec</td>
                    <td><span className="text-success">-0.3 pH Stabilized</span></td>
                  </tr>
                  <tr>
                    <td>Yesterday, 22:30 PM</td>
                    <td><span className="badge badge-warning">Low TDS</span></td>
                    <td>Nutrient Pump Actuated</td>
                    <td>18 sec</td>
                    <td><span className="text-success">+210 PPM Stabilized</span></td>
                  </tr>
                  <tr>
                    <td>Yesterday, 14:10 PM</td>
                    <td><span className="badge badge-info">Low pH</span></td>
                    <td>pH-Up Pump Actuated</td>
                    <td>2 sec</td>
                    <td><span className="text-success">+0.1 pH Stabilized</span></td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
