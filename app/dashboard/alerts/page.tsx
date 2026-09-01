'use client';

import { useState } from 'react';
import { AlertBanner, AlertData } from '@/components/AlertBanner';
import { BellRing, Bug } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

function createFaultAlert(faultType: string): AlertData {
  return {
    id: `fault-${Date.now()}-${Math.random()}`,
    type: 'danger',
    title: 'Sensor Telemetry Anomaly Detected',
    message: `Abnormal rapid flux detected in sensor channel: ${faultType}.`,
    timestamp: Date.now()
  };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertData[]>(() => [
    {
      id: '1',
      type: 'danger',
      title: 'Water Reservoir Low Threshold',
      message: 'Reservoir dropped below 20%. Refill required.',
      timestamp: Date.now() - 3600000 * 2,
    },
    {
      id: '2',
      type: 'warning',
      title: 'pH Upward Drift Detected',
      message: 'pH drift rate exceeded +0.15 pH/day over last 6 observation cycles.',
      timestamp: Date.now() - 86400000,
    },
    {
      id: '3',
      type: 'info',
      title: 'Serial Port Initialized',
      message: 'ESP32 serial connection established at 115200 baud.',
      timestamp: Date.now() - 86400000 * 2,
    }
  ]);

  const INJECTABLE_FAULTS = [
    { type: 'ph_spike', label: 'Spike pH (7.8)' },
    { type: 'tds_drop', label: 'Drop TDS (200)' },
    { type: 'low_water', label: 'Drain Reservoir' },
  ];

  const handleInjectFault = (faultType: string) => {
    toast.error(`Simulated ${faultType} fault logged!`);
    const newAlert = createFaultAlert(faultType);
    setAlerts(prev => [newAlert, ...prev]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-primary mb-xs">System Alerts & Logs</h1>
        <p className="text-secondary">Historical log of warnings, faults, and critical system events.</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* Alert Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <BellRing size={18} style={{ color: 'var(--color-teal)' }} />
                <h2 className="text-md font-bold">Recent Notifications</h2>
             </div>
             
             {alerts.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No recent alerts or faults.
                </div>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {alerts.map(a => (
                     <AlertBanner key={a.id} alert={a} autoDismiss={false} />
                  ))}
                </div>
             )}
          </div>
        </div>

        {/* Demo Simulator Panel */}
        <div className="glass-card" style={{ padding: '24px', alignSelf: 'flex-start' }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Bug size={18} style={{ color: 'var(--color-warning)' }} />
              <h2 className="text-md font-bold">Simulator Controls</h2>
           </div>
           <p className="text-xs text-secondary mb-md">
             Inject simulated edge-case conditions to test platform anomaly handlers.
           </p>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {INJECTABLE_FAULTS.map(f => (
                <button
                  key={f.type} 
                  className="btn btn-secondary" 
                  style={{ justifyContent: 'space-between', width: '100%', fontSize: '12px' }}
                  onClick={() => handleInjectFault(f.type)}
                >
                  <span>{f.label}</span>
                  <span className="badge badge-warning" style={{ fontSize: '9px' }}>INJECT</span>
                </button>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
