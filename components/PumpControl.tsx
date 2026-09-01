'use client';

import { useState } from 'react';
import { Play, Activity } from 'lucide-react';
import styles from './PumpControl.module.css';

interface PumpControlProps {
  pumpId: string;
  pumpName: string;
  status: 'active' | 'idle' | 'fault';
  onActivate: (pumpId: string, duration: number) => void;
  disabled?: boolean;
}

export function PumpControl({ pumpId, pumpName, status, onActivate, disabled }: PumpControlProps) {
  const [duration, setDuration] = useState(5); // default 5 seconds
  const [isRunning, setIsRunning] = useState(false);

  const handleActivate = () => {
    if (disabled || isRunning || status === 'active') return;
    setIsRunning(true);
    onActivate(pumpId, duration);
    
    // reset visual state after duration
    setTimeout(() => {
      setIsRunning(false);
    }, duration * 1000);
  };

  const statusColor = {
    idle: 'var(--text-muted)',
    active: 'var(--color-teal)',
    fault: 'var(--color-danger)',
  }[status];

  return (
    <div className={`glass-card ${styles.container} ${status === 'active' ? styles.activeCard : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
           <div className={styles.icon} style={{ color: statusColor }}>
             <Activity size={16} />
           </div>
           <div>
             <div className={styles.name}>{pumpName}</div>
             <div className={styles.status} style={{ color: statusColor }}>
               {status === 'active' ? 'Dispensing...' : status === 'fault' ? 'Fault Detected' : 'Idle / Standby'}
             </div>
           </div>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <span>Dose Duration</span>
            <span className="font-mono">{duration}s</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="30" 
            value={duration} 
            onChange={(e) => setDuration(Number(e.target.value))}
            className={styles.slider}
            disabled={disabled || isRunning}
          />
        </div>

        <button 
          className="btn btn-primary" 
          style={{ width: '100%', fontSize: '12px', minHeight: '34px' }}
          onClick={handleActivate}
          disabled={disabled || isRunning}
        >
          <Play size={13} /> {disabled ? 'Actuator Disabled' : isRunning ? 'Dosing...' : 'Execute Pulse'}
        </button>
      </div>
    </div>
  );
}
