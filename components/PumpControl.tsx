'use client';

import { useState } from 'react';
import { Settings, Play, Square, Activity } from 'lucide-react';
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
    active: 'var(--color-primary)',
    fault: 'var(--color-danger)',
  }[status];

  return (
    <div className={`glass-card ${styles.container} ${status === 'active' ? styles.activeCard : ''}`}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
           <div className={styles.icon} style={{ color: statusColor }}>
             <Activity size={18} />
           </div>
           <div>
             <div className={styles.name}>{pumpName}</div>
             <div className={styles.status} style={{ color: statusColor }}>
               {status === 'active' ? 'Dispensing...' : status === 'fault' ? 'Fault Detected' : 'Idle'}
             </div>
           </div>
        </div>
        
        {/* Status Dot */}
        <div className={`status-dot ${status === 'active' ? 'online' : status === 'fault' ? 'offline' : 'idle'}`} />
      </div>

      <div className={styles.controls}>
        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label>Dose Duration</label>
            <span>{duration}s</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={duration}
            onChange={(e) => setDuration(parseInt(e.target.value))}
            disabled={disabled || isRunning || status === 'active'}
          />
        </div>

        <button 
          className={`btn ${styles.actionBtn} ${(isRunning || status === 'active') ? 'btn-danger' : 'btn-primary'}`}
          onClick={handleActivate}
          disabled={disabled || status === 'fault'}
        >
          {isRunning || status === 'active' ? (
            <>
              <Square size={16} /> Stop
            </>
          ) : (
            <>
              <Play size={16} /> Override
            </>
          )}
        </button>
      </div>
    </div>
  );
}
