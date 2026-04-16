'use client';

import { useState, useEffect } from 'react';
import { PumpControl } from '@/components/PumpControl';
import { Settings, ShieldAlert, Cpu } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export default function ControlPage() {
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [profile, setProfile] = useState('lettuce');
  const [pumpStatus, setPumpStatus] = useState<any>({ phUp: false, phDown: false, nutrient: false, circulation: true });

  useEffect(() => {
    // Keep UI pump statuss updated from simulator
    const poll = async () => {
      try {
         const res = await fetch('/api/simulate');
         if (res.ok) {
           const sys = await res.json();
           setPumpStatus(sys.pumps);
           // sync mode from backend just in case
           if (sys.controlMode !== mode) setMode(sys.controlMode);
         }
      } catch (e) {}
    };
    const i = setInterval(poll, 2000);
    return () => clearInterval(i);
  }, [mode]);

  const handleModeChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as 'auto' | 'manual';
    setMode(newMode);
    
    // update backend
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
    try {
      toast('Activating pump...', { icon: '⚙️' });
      await fetch('/api/pump-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pumpId, duration })
      });
      toast.success(`${pumpId} activated for ${duration}s`);
    } catch (e) {
      toast.error('Pump failed to respond');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-primary mb-sm">System Control</h1>
        <p className="text-secondary">Configure optimal ranges and override actuators manually.</p>
      </div>

      {mode === 'manual' && (
        <div className="glass-card" style={{ padding: '16px', borderLeft: '4px solid #ef4444', marginBottom: '-16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <ShieldAlert color="#ef4444" size={24} />
            <div>
              <h3 className="text-danger font-bold">Manual Override Active</h3>
              <p className="text-sm text-secondary">The PID/P-Control algorithm is paused. You are responsible for maintaining nutrient balance safely. Crop damage is possible.</p>
            </div>
          </div>
        </div>
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
              <select className="select" value={mode} onChange={handleModeChange}>
                <option value="auto">Autonomous (Closed-Loop)</option>
                <option value="manual">Manual Override</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-bold text-secondary mb-sm" style={{ display: 'block' }}>Crop Profile (Target Ranges)</label>
              <select className="select" value={profile} onChange={(e) => setProfile(e.target.value)} disabled={mode === 'manual'}>
                <option value="lettuce">Lettuce (pH 5.5-6.5 | TDS 800-1200)</option>
                <option value="tomato">Tomato (pH 5.8-6.8 | TDS 1400-3500)</option>
                <option value="spinach">Spinach (pH 6.0-7.0 | TDS 1260-1610)</option>
                <option value="basil">Basil (pH 5.5-6.5 | TDS 700-1120)</option>
              </select>
            </div>
            
            <button className="btn btn-primary" style={{ marginTop: '8px' }}>Save Configuration</button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
           <h2 className="text-lg font-bold text-primary">Actuator Panel</h2>
           <div className="grid-2" style={{ gap: '16px' }}>
             <PumpControl 
               pumpId="phDown"
               pumpName="pH-Down Syringe"
               status={pumpStatus.phDown ? 'active' : 'idle'}
               onActivate={handleManualActivate}
               disabled={mode === 'auto'}
             />
             <PumpControl 
               pumpId="phUp"
               pumpName="pH-Up Syringe"
               status={pumpStatus.phUp ? 'active' : 'idle'}
               onActivate={handleManualActivate}
               disabled={mode === 'auto'}
             />
             <PumpControl 
               pumpId="nutrient"
               pumpName="Nutrient Pump"
               status={pumpStatus.nutrient ? 'active' : 'idle'}
               onActivate={handleManualActivate}
               disabled={mode === 'auto'}
             />
             <PumpControl 
               pumpId="circulation"
               pumpName="Circulation Agitator"
               status={pumpStatus.circulation ? 'active' : 'idle'}
               onActivate={handleManualActivate}
               disabled={false} // Always overrideable
             />
           </div>
        </div>
      </div>
    </div>
  );
}
