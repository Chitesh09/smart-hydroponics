'use client';

import { useState, useEffect } from 'react';
import { GaugeChart } from '@/components/GaugeChart';
import { SensorCard } from '@/components/SensorCard';
import { AlertBanner, AlertData } from '@/components/AlertBanner';
import { Thermometer, Droplets, ActivitySquare, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [reading, setReading] = useState({ ph: 6.0, tds: 1000, temperature: 22, waterLevel: 85, timestamp: Date.now() });
  const [sysState, setSysState] = useState<any>({ status: 'stable', activeCorrection: null });
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    const pollSim = async () => {
      try {
        const res = await fetch('/api/simulate');
        if (res.ok) {
          const data = await res.json();
          setReading(data.reading);
          setSysState(data);

          if (data.status === 'fault' && data.faultMessage) {
            setAlerts(prev => {
              // Avoid spamming same alert
              if (prev.some(a => a.message === data.faultMessage)) return prev;
              return [{
                id: Date.now().toString(),
                type: 'danger' as const,
                title: 'System Fault',
                message: data.faultMessage,
                timestamp: Date.now()
              }, ...prev].slice(0, 3);
            });
          }
        }
      } catch (e) {
        // Suppress console.error to prevent Next.js dev overlay from showing up on harmless polling failures
        console.warn('Failed to fetch data from simulator');
      }
    };
    const init = setInterval(pollSim, 2000);
    pollSim();
    return () => clearInterval(init);
  }, []);

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-sm">Live Monitoring</h1>
        <p className="text-secondary">Real-time sensor telemetry and actuator status.</p>
      </div>

      {/* Alerts Area */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map(alert => (
            <AlertBanner key={alert.id} alert={alert} onDismiss={dismissAlert} />
          ))}
        </div>
      )}

      {/* Control Loop Status Panel */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
             <ActivitySquare size={24} style={{ color: sysState.status === 'correcting' ? '#f59e0b' : '#22c55e' }} />
             <h2 className="text-xl font-bold">Closed-Loop State</h2>
          </div>
          <div className={`badge badge-${sysState.status === 'correcting' ? 'warning' : sysState.status === 'fault' ? 'danger' : 'success'}`}>
             {sysState.status === 'correcting' ? 'Adjusting Chemistry' : sysState.status === 'fault' ? 'Action Required' : 'Optimized'}
          </div>
        </div>
        
        <div style={{ padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {sysState.status === 'correcting' && sysState.activeCorrection ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#f59e0b' }}>
               <RefreshCw size={18} className="animate-spin" />
               <span className="font-mono text-sm">{sysState.activeCorrection}</span>
             </div>
          ) : (
             <div style={{ color: '#7aadcc', fontSize: '14px' }}>
                Sensors stabilized within target ranges. No pump action required.
             </div>
          )}
        </div>
      </div>

      {/* Primary Gauges */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-lg">pH Level (Hydrogen)</h3>
          <GaugeChart 
            value={reading.ph} min={4.0} max={9.0} optimalMin={5.5} optimalMax={6.5} 
            label="pH" unit="potential Hydrogen" colorPrimary="#00d4aa" 
          />
        </div>
        
        <div className="glass-card" style={{ padding: '32px' }}>
          <h3 className="text-sm font-bold text-secondary uppercase tracking-wide mb-lg">TDS (Nutrients)</h3>
          <GaugeChart 
            value={reading.tds} min={100} max={2500} optimalMin={800} optimalMax={1200} 
            label="TDS" unit="Parts Per Million (PPM)" colorPrimary="#7c3aed" 
          />
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid-3">
        <SensorCard 
          title="Water Temperature" 
          value={reading.temperature.toFixed(1)} 
          unit="°C" 
          icon={<Thermometer size={20} />} 
          status={reading.temperature > 28 ? 'warning' : 'optimal'}
          subtitle="DS18B20 digital sensor"
        />
        <SensorCard 
          title="Reservoir Level" 
          value={Math.round(reading.waterLevel)} 
          unit="%" 
          icon={<Droplets size={20} />} 
          status={reading.waterLevel < 20 ? 'danger' : 'optimal'}
          subtitle="Ultrasonic distance"
        />
        <SensorCard 
          title="Control Loop Check" 
          value={sysState.correctionCount || 0} 
          unit="cycles" 
          icon={<RefreshCw size={20} />} 
          status="optimal"
          subtitle="Corrections applied today"
        />
      </div>
    </div>
  );
}
