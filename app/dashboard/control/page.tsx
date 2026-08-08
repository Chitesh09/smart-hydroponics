'use client';

import { useState, useEffect } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { PumpControl } from '@/components/PumpControl';
import { ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface PumpStatus {
  phUp: boolean;
  phDown: boolean;
  nutrient: boolean;
  circulation: boolean;
}

export default function ControlPage() {
  const { mode } = useESP32Serial();
  const [controlMode, setControlMode] = useState<'auto' | 'manual'>('auto');
  const [profile, setProfile] = useState('lettuce');
  const [simPumpStatus, setSimPumpStatus] = useState<PumpStatus>({ 
    phUp: false, 
    phDown: false, 
    nutrient: false, 
    circulation: true 
  });

  // Derive active pump statuses based on mode
  const pumpStatus = mode === 'real'
    ? { phUp: false, phDown: false, nutrient: false, circulation: false }
    : simPumpStatus;

  useEffect(() => {
    if (mode === 'real') return;

    // Keep UI pump status updated from simulator in simulation mode
    const poll = async () => {
      try {
         const res = await fetch('/api/simulate');
         if (res.ok) {
           const sys = await res.json();
           setSimPumpStatus(sys.pumps);
           if (sys.controlMode !== controlMode) setControlMode(sys.controlMode);
         }
      } catch (_e) {}
    };
    
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, [mode, controlMode]);

  const handleModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (mode === 'real') return;

    const newMode = e.target.value as 'auto' | 'manual';
    setControlMode(newMode);
    
    await fetch('/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'setMode', mode: newMode })
    });
    
    if (newMode === 'manual') {
      toast.error('Warning: Closed-loop control disabled. Manual mode engaged.', {
        icon: '⚠️',
        style: { background: '#ef4444', color: '#fff' }
      });
    } else {
      toast.success('Autonomous closed-loop control engaged.', {
        style: { background: '#22c55e', color: '#fff' }
      });
    }
  };

  const handleManualActivate = async (pumpId: string, duration: number) => {
    if (mode === 'real') {
      toast.error('Hardware Offline: Pump controls are deactivated in Live mode.', {
        style: { background: '#ef4444', color: '#fff' }
      });
      return;
    }

    try {
      toast('Activating pump...', { icon: '⚙️' });
      await fetch('/api/pump-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pumpId, duration })
      });
      toast.success(`${pumpId} activated for ${duration}s`);
    } catch (_e) {
      toast.error('Pump failed to respond');
    }
  };

  const isRealMode = mode === 'real';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-primary mb-sm">System Control</h1>
        <p className="text-secondary">Configure optimal ranges and override actuators manually.</p>
      </div>

      {isRealMode ? (
        <div className="glass-card" style={{ padding: '20px', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle color="var(--color-warning)" size={24} />
            <div>
              <h3 className="text-warning font-bold">Monitor Only — Automation Hardware Not Connected</h3>
              <p className="text-sm text-secondary">
                You are currently connected to real ESP32 sensors. Dosing pumps, relays, and actuator hardware are not connected. Controls are disabled to reflect the physical configuration.
              </p>
            </div>
          </div>
        </div>
      ) : (
        controlMode === 'manual' && (
          <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #ef4444', marginBottom: '-16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <ShieldAlert color="#ef4444" size={24} />
              <div>
                <h3 className="text-danger font-bold">Manual Override Active</h3>
                <p className="text-sm text-secondary">The PID/P-Control algorithm is paused. You are responsible for maintaining nutrient balance safely. Crop damage is possible.</p>
              </div>
            </div>
          </div>
        )
      )}

      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
             <Cpu size={24} className="text-primary" />
             <h2 className="text-xl font-bold">Operation Mode</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="text-sm font-bold text-secondary mb-sm" style={{ display: 'block' }}>Control State</label>
              <select 
                className="select" 
                value={isRealMode ? 'manual' : controlMode} 
                onChange={handleModeChange}
                disabled={isRealMode}
              >
                {isRealMode ? (
                  <option value="manual">Monitor Only (ESP32 Live)</option>
                ) : (
                  <>
                    <option value="auto">Autonomous (Closed-Loop)</option>
                    <option value="manual">Manual Override</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-bold text-secondary mb-sm" style={{ display: 'block' }}>Crop Profile (Target Ranges)</label>
              <select className="select" value={profile} onChange={(e) => setProfile(e.target.value)} disabled={isRealMode || controlMode === 'manual'}>
                <option value="lettuce">Lettuce (pH 5.5-6.5 | TDS 800-1200)</option>
                <option value="tomato">Tomato (pH 5.8-6.8 | TDS 1400-3500)</option>
                <option value="spinach">Spinach (pH 6.0-7.0 | TDS 1260-1610)</option>
                <option value="basil">Basil (pH 5.5-6.5 | TDS 700-1120)</option>
              </select>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: '8px' }} disabled={isRealMode}>
              {isRealMode ? 'Control Disabled' : 'Save Configuration'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           <h2 className="text-lg font-bold text-primary">
             {isRealMode ? 'Actuator Panel (Offline)' : 'Actuator Panel (Simulation Only)'}
           </h2>
           <div className="grid-2" style={{ gap: '16px' }}>
             <PumpControl 
               pumpId="phDown"
               pumpName={isRealMode ? "pH-Down Syringe" : "pH-Down Syringe (Simulated)"}
               status={isRealMode ? 'idle' : (pumpStatus.phDown ? 'active' : 'idle')}
               onActivate={handleManualActivate}
               disabled={isRealMode ? true : (controlMode === 'auto')}
             />
             <PumpControl 
               pumpId="phUp"
               pumpName={isRealMode ? "pH-Up Syringe" : "pH-Up Syringe (Simulated)"}
               status={isRealMode ? 'idle' : (pumpStatus.phUp ? 'active' : 'idle')}
               onActivate={handleManualActivate}
               disabled={isRealMode ? true : (controlMode === 'auto')}
             />
             <PumpControl 
               pumpId="nutrient"
               pumpName={isRealMode ? "Nutrient Pump" : "Nutrient Pump (Simulated)"}
               status={isRealMode ? 'idle' : (pumpStatus.nutrient ? 'active' : 'idle')}
               onActivate={handleManualActivate}
               disabled={isRealMode ? true : (controlMode === 'auto')}
             />
             <PumpControl 
               pumpId="circulation"
               pumpName={isRealMode ? "Circulation Agitator" : "Circulation Agitator (Simulated)"}
               status={isRealMode ? 'idle' : (pumpStatus.circulation ? 'active' : 'idle')}
               onActivate={handleManualActivate}
               disabled={isRealMode ? true : (controlMode === 'auto')}
             />
           </div>
        </div>
      </div>
    </div>
  );
}
