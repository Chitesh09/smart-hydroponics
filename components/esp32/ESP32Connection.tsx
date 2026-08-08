'use client';

import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { Cpu, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './ESP32Connection.module.css';

export default function ESP32Connection() {
  const {
    supported,
    mode,
    connectionState,
    isStale,
    lastUpdateTime,
    error,
    connect,
    disconnect,
    setMode,
  } = useESP32Serial();

  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  // Compute how long ago the last reading was received
  useEffect(() => {
    if (!lastUpdateTime) {
      return;
    }

    const updateTime = () => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdateTime) / 1000));
    };

    const interval = setInterval(updateTime, 1000);
    updateTime();

    return () => {
      clearInterval(interval);
      setSecondsAgo(null);
    };
  }, [lastUpdateTime]);

  // Handle unsupported browsers (not Chrome/Edge/Opera or standard Chromium)
  if (!supported) {
    return (
      <div className={`glass-card ${styles.unsupportedCard}`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
          <div className={styles.warningIconWrapper}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className={styles.cardTitle}>Web Serial Unsupported</h3>
            <p className={styles.cardText}>
              Your browser does not support direct USB Serial communication. Please open this app in Google Chrome, Microsoft Edge, or a Chromium-based browser to stream live telemetry from your ESP32.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isDisconnected = connectionState === 'disconnected';

  return (
    <div className={`glass-card ${styles.container}`}>
      {/* Header Info */}
      <div className={styles.header}>
        <div className={styles.statusSection}>
          <div className={styles.iconWrapper} style={{ 
            color: isConnected ? 'var(--color-primary)' : isConnecting ? 'var(--color-warning)' : 'var(--text-muted)'
          }}>
            {isConnected ? <Wifi size={20} /> : <WifiOff size={20} />}
          </div>
          <div>
            <div className={styles.title}>ESP32 Telemetry Status</div>
            <div className={styles.badgeRow}>
              {/* Connection Status Badge */}
              <span className={`${styles.badge} ${
                isConnected ? styles.badgeConnected : isConnecting ? styles.badgeConnecting : styles.badgeDisconnected
              }`}>
                <span className={styles.dot} />
                {isConnected ? 'ESP32 Live' : isConnecting ? 'Connecting...' : 'Disconnected'}
              </span>

              {/* Data Source Badge */}
              <span className={`${styles.badge} ${
                mode === 'real' ? styles.badgeReal : styles.badgeSim
              }`}>
                Data Source: {mode === 'real' ? 'Hardware' : 'Simulation'}
              </span>
            </div>
          </div>
        </div>

        {/* Refresh / Freshness indicators */}
        {isConnected && (
          <div className={styles.freshnessContainer}>
            {isStale ? (
              <span className={styles.staleWarning}>
                <AlertTriangle size={14} /> Sensor data stale
              </span>
            ) : (
              <span className={styles.freshInfo}>
                <RefreshCw size={12} className={styles.spin} /> 
                Live {secondsAgo !== null ? `(${secondsAgo}s ago)` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Connection controls */}
      <div className={styles.controls}>
        {isDisconnected && (
          <div className={styles.actionRow}>
            <button className="btn btn-primary" onClick={connect}>
              <Cpu size={16} /> Connect ESP32
            </button>
            {mode !== 'simulation' && (
              <button className="btn btn-ghost" onClick={() => setMode('simulation')}>
                Switch to Simulation
              </button>
            )}
          </div>
        )}

        {isConnecting && (
          <div className={styles.actionRow}>
            <button className="btn btn-primary" disabled style={{ opacity: 0.7 }}>
              <RefreshCw size={16} className={styles.spin} /> Selecting Port...
            </button>
          </div>
        )}

        {isConnected && (
          <div className={styles.actionRow}>
            <button className="btn btn-danger" onClick={disconnect}>
              Disconnect ESP32
            </button>
            {mode === 'simulation' && (
              <button className="btn btn-ghost" onClick={() => setMode('real')}>
                Resume Live stream
              </button>
            )}
          </div>
        )}

        {/* Display error messages if any */}
        {error && (
          <div className={styles.errorBanner}>
            <AlertTriangle size={14} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
