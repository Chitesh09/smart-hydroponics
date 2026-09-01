'use client';

import { useState, useEffect } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { PumpControl } from '@/components/PumpControl';
import { StatusBadge } from '@/components/ui/StatusBadge';
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
      });
    } else {
      toast.success('Autonomous closed-loop control engaged.');
    }
  };

  const handleManualActivate = async (pumpId: string, duration: number) => {
    if (mode === 'real') {
      toast.error('Hardware Not Installed: Actuators are disabled in Live ESP32 mode.');
      return;
    }

    try {
      toast('Activating simulated pump...', { icon: '⚙️' });
      await fetch('/api/pump-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pumpId, duration })
      });
      toast.success(`${pumpId} activated for ${duration}s (simulated)`);
    } catch (_e) {
      toast.error('Pump failed to respond');
    }
  };

  const isRealMode = mode === 'real';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-primary mb-xs">Actuation & System Control</h1>
        <p className="text-secondary">Closed-loop dosing thresholds and actuator management.</p>
      </div>

      {isRealMode ? (
        <div className="glass-card" style={{ padding: '18px 20px', borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <AlertTriangle style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: '2px' }} size={22} />
            <div>
              <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-warning)', marginBottom: '3px' }}>
                Monitor Only — Automation Actuators Not Installed
              </h3>
              <p className="text-sm text-secondary">
                You are currently connected to real ESP32 sensors. Peristaltic pumps and relay modules are not installed on this hardware revision. Controls are disabled to reflect physical reality.
              </p>
            </div>
          </div>
        </div>
      ) : (
        controlMode === 'manual' && (
          <div className="glass-card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--color-danger)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <ShieldAlert style={{ color: 'var(--color-danger)', flexShrink: 0, marginTop: '2px' }} size={22} />
              <div>
                <h3 style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--color-danger)', marginBottom: '3px' }}>
                  Manual Override Active (Simulation)
                </h3>
                <p className="text-sm text-secondary">Autonomous closed-loop regulation is paused.</p>
              </div>
            </div>
          </div>
        )
      )}

      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Cpu size={20} style={{ color: 'var(--color-teal)' }} />
            <h2 className="text-md font-bold">Operation Mode & Target Profile</h2>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label className="text-xs font-bold uppercase text-secondary mb-xs" style={{ display: 'block' }}>
                Control Strategy
              </label>
              <select 
                className="select" 
                value={isRealMode ? 'manual' : controlMode} 
                onChange={handleModeChange}
                disabled={isRealMode}
              >
                {isRealMode ? (
                  <option value="manual">Monitor Only (ESP32 Live Stream)</option>
                ) : (
                  <>
                    <option value="auto">Autonomous (Closed-Loop PID Simulation)</option>
                    <option value="manual">Manual Override</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold uppercase text-secondary mb-xs" style={{ display: 'block' }}>
                Target Crop Recipe
              </label>
              <select className="select" value={profile} onChange={(e) => setProfile(e.target.value)} disabled={isRealMode || controlMode === 'manual'}>
                <option value="lettuce">Butterhead Lettuce (pH 5.5-6.5 · TDS 800-1200 PPM)</option>
                <option value="tomato">Tomato (pH 5.8-6.8 · TDS 1400-2400 PPM)</option>
                <option value="spinach">Spinach (pH 6.0-7.0 · TDS 1000-1500 PPM)</option>
                <option value="basil">Sweet Basil (pH 5.5-6.5 · TDS 700-1100 PPM)</option>
              </select>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: '4px' }} disabled={isRealMode}>
              {isRealMode ? 'Actuation Disabled' : 'Save Configuration'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="text-md font-bold text-primary">
              {isRealMode ? 'Actuator Panel (Not Installed)' : 'Actuator Panel (Simulation Only)'}
            </h2>
            <StatusBadge status={isRealMode ? 'unavailable' : 'simulation'} size="sm" />
          </div>

          <div className="grid-2" style={{ gap: '14px' }}>
            <PumpControl 
              pumpId="phDown"
              pumpName={isRealMode ? "pH-Down Syringe" : "pH-Down Syringe (Sim)"}
              status={isRealMode ? 'idle' : (pumpStatus.phDown ? 'active' : 'idle')}
              onActivate={handleManualActivate}
              disabled={isRealMode ? true : (controlMode === 'auto')}
            />
            <PumpControl 
              pumpId="phUp"
              pumpName={isRealMode ? "pH-Up Syringe" : "pH-Up Syringe (Sim)"}
              status={isRealMode ? 'idle' : (pumpStatus.phUp ? 'active' : 'idle')}
              onActivate={handleManualActivate}
              disabled={isRealMode ? true : (controlMode === 'auto')}
            />
            <PumpControl 
              pumpId="nutrient"
              pumpName={isRealMode ? "Nutrient Pump" : "Nutrient Pump (Sim)"}
              status={isRealMode ? 'idle' : (pumpStatus.nutrient ? 'active' : 'idle')}
              onActivate={handleManualActivate}
              disabled={isRealMode ? true : (controlMode === 'auto')}
            />
            <PumpControl 
              pumpId="circulation"
              pumpName={isRealMode ? "Circulation Agitator" : "Circulation Agitator (Sim)"}
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
