'use client';

import { useState, useEffect } from 'react';
import { LiveLineChart } from '@/components/LiveLineChart';
import { BarChart3, Download } from 'lucide-react';

export default function AnalyticsPage() {
  const [history, setHistory] = useState<{
    labels: string[], ph: number[], tds: number[], temp: number[]
  }>({ labels: [], ph: [], tds: [], temp: [] });

  useEffect(() => {
    // For demo purposes, we will build a history array from the live data stream
    // In a real app this would query the Firebase / MongoDB backend for historical data
    
    // Seed some initial demo data to make charts look good immediately
    const labels: string[] = [];
    const phData: number[] = [];
    const tdsData: number[] = [];
    const tempData: number[] = [];
    const now = new Date();
    
    for (let i = 40; i >= 0; i--) {
       const time = new Date(now.getTime() - i * 2000);
       labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' }));
       // simulate a past drop and correction
       phData.push(6.0 + (Math.sin(i * 0.2) * 0.1) + (Math.random() * 0.05));
       tdsData.push(1000 - (i * 2) + Math.random() * 10);
       tempData.push(22 + Math.random() * 0.2);
    }
    setHistory({ labels, ph: phData, tds: tdsData, temp: tempData });

    const poll = async () => {
      try {
        const res = await fetch('/api/simulate');
        if (res.ok) {
          const data = await res.json();
          const timeLabel = new Date(data.reading.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit', second:'2-digit' });
          
          setHistory(prev => {
            const newLabels = [...prev.labels, timeLabel].slice(-40);
            const newPh = [...prev.ph, data.reading.ph].slice(-40);
            const newTds = [...prev.tds, data.reading.tds].slice(-40);
            const newTemp = [...prev.temp, data.reading.temperature].slice(-40);
            return { labels: newLabels, ph: newPh, tds: newTds, temp: newTemp };
          });
        }
      } catch (e) {}
    };

    const init = setInterval(poll, 2000);
    return () => clearInterval(init);
  }, []);

  const exportToCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Timestamp,pH Level,TDS (PPM),Temperature (°C)\n';
    
    for (let i = 0; i < history.labels.length; i++) {
       const row = `${history.labels[i]},${history.ph[i].toFixed(2)},${history.tds[i].toFixed(1)},${history.temp[i].toFixed(1)}`;
       csvContent += row + '\n';
    }
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hydroponics_history_${Date.now()}.csv`);
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
        <button className="btn btn-ghost" onClick={exportToCSV}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
             <BarChart3 size={20} className="text-primary" />
             <h2 className="text-lg font-bold">pH Stability (24h)</h2>
          </div>
          <LiveLineChart 
             data={history.ph} 
             labels={history.labels} 
             title="pH Level" 
             color="#00d4aa" 
             min={4.0} 
             max={8.0} 
          />
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
             <BarChart3 size={20} className="text-accent" />
             <h2 className="text-lg font-bold">TDS Depletion / Dosing</h2>
          </div>
          <LiveLineChart 
             data={history.tds} 
             labels={history.labels} 
             title="TDS (PPM)" 
             color="#7c3aed" 
             min={600} 
             max={1400} 
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
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
