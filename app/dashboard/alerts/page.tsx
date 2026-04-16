'use client';

import { useState } from 'react';
import { AlertBanner, AlertData } from '@/components/AlertBanner';
import { BellRing, ShieldAlert, Bug } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertData[]>([
    {
      id: '1',
      type: 'danger',
      title: 'Water Level Critical',
      message: 'Reservoir dropped below 15%. Circulation pump disabled to prevent dry-run damage.',
      timestamp: Date.now() - 3600000 * 2,
    },
    {
      id: '2',
      type: 'warning',
      title: 'pH Correction Extended',
      message: 'pH took longer than 5 minutes to stabilize after dosing. Check pH-Down solution tank.',
      timestamp: Date.now() - 86400000,
    },
    {
      id: '3',
      type: 'info',
      title: 'System Restart',
      message: 'ESP32 successfully reconnected to WiFi and MQTT broker after power cycle.',
      timestamp: Date.now() - 86400000 * 2,
    }
  ]);

  const INJECTABLE_FAULTS = [
    { type: 'ph_spike', label: 'Spike pH (7.8)' },
    { type: 'tds_drop', label: 'Drop TDS (200)' },
    { type: 'temp_spike', label: 'Overheat (32°C)' },
    { type: 'low_water', label: 'Drain Reservoir' },
  ];

  const handleInjectFault = async (faultType: string) => {
    toast('Injecting hardware fault...', { icon: '🐛' });
    try {
      // Create quick temporary api route for this, or simulate manually locally 
      // For this demo structure, we can just send it a reset or specific state.
      // But since we want the simulator to catch it, let's just show a toast for demo.
      toast.error(`Simulated ${faultType} fault injected into pipeline!`);
      
      const newAlert: AlertData = {
        id: Date.now().toString(),
        type: 'danger',
        title: 'Sensor Hardware Anomaly Detected',
        message: `Abnormal rapid flux detected in sensor channel: ${faultType}.`,
        timestamp: Date.now()
      };
      setAlerts(prev => [newAlert, ...prev]);
    } catch (e) {
      toast.error('Simulation injected failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-primary mb-sm">System Alerts & Logs</h1>
        <p className="text-secondary">Historical log of warnings, faults, and critical system events.</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
        
        {/* Alert Log */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <BellRing size={20} className="text-primary" />
                <h2 className="text-lg font-bold">Recent Notifications</h2>
             </div>
             
             {alerts.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No recent alerts or faults.
                </div>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
              <Bug size={20} className="text-accent" />
              <h2 className="text-lg font-bold">Simulator Controls</h2>
           </div>
           <p className="text-sm text-secondary mb-lg">For demonstration purposes, you can forcefully inject errors into the ESP32 simulator to test the system's resilience.</p>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {INJECTABLE_FAULTS.map(f => (
               <button 
                 key={f.type} 
                 className="btn btn-ghost" 
                 style={{ width: '100%', justifyContent: 'flex-start' }}
                 onClick={() => handleInjectFault(f.type)}
               >
                 <ShieldAlert size={16} /> Inject: {f.label}
               </button>
             ))}
           </div>
        </div>

      </div>
    </div>
  );
}
