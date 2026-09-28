'use client';

import React, { useState, useEffect } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import styles from './ESP32Connection.module.css';

export default function ESP32Connection() {
  const {
    supported,
    mode,
    connectionState,
    isStale,
    latestReading,
    lastUpdateTime,
    error,
    hasAuthorizedPort,
    connect,
    reconnect,
    disconnect,
    setMode,
  } = useESP32Serial();

  const { language } = usePlantIntelligence();
  const isKn = language === 'kn';

  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);

  useEffect(() => {
    if (!lastUpdateTime) {
      setSecondsAgo(null);
      return;
    }
    const updateTime = () => {
      setSecondsAgo(Math.max(0, Math.floor((Date.now() - lastUpdateTime) / 1000)));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  // Handle unsupported browsers (not Chrome/Edge/Chromium)
  if (!supported) {
    return (
      <div className={styles.stationCard}>
        <div className={styles.stationHeader}>
          <div className={styles.headerLeft}>
            <span className={styles.categoryLabel}>HARDWARE GATEWAY · USB SERIAL</span>
            <h3 className={styles.stationTitle}>ESP32 STATION</h3>
          </div>
          <div className={styles.headerRight}>
            <span className={`${styles.statusPill} ${styles.statusUnsupported}`}>
              <span className={styles.statusDot} />
              <span>{isKn ? 'ಬ್ರೌಸರ್ ಬೆಂಬಲವಿಲ್ಲ' : 'WEB SERIAL UNSUPPORTED'}</span>
            </span>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.unsupportedBody}>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {isKn
              ? 'ನಿಮ್ಮ ವೆಬ್ ಬ್ರೌಸರ್ ನೇರ USB ಸೀರಿಯಲ್ ಸಂಪರ್ಕವನ್ನು ಬೆಂಬಲಿಸುವುದಿಲ್ಲ. ನೈಜ ESP32 ಹಾರ್ಡ್‌ವೇರ್ ಸಂಪರ್ಕಿಸಲು ದಯವಿಟ್ಟು Google Chrome, Microsoft Edge ಅಥವಾ Chromium ಆಧಾರಿತ ಬ್ರೌಸರ್ ಬಳಸಿ.'
              : 'Your browser does not support the Web Serial API for direct USB communication. Please open HydroSmart in Google Chrome, Microsoft Edge, or a Chromium-based browser to connect real ESP32 hardware.'}
          </p>
          <div style={{ marginTop: '12px' }}>
            <span className={styles.paramLabel}>{isKn ? 'ಪ್ರಸ್ತುತ ಮೂಲ' : 'Current Source'}: </span>
            <span className={styles.paramValue}>{isKn ? 'ಸ್ಥಳೀಯ ಸಿಮ್ಯುಲೇಶನ್' : 'Local Simulation'}</span>
          </div>
        </div>
      </div>
    );
  }

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';
  const isError = connectionState === 'error';

  // Sensor Channel Values (strictly pH, TDS, Water Level)
  const phVal = latestReading?.ph;
  const tdsVal = latestReading?.tds;
  const wlVal = latestReading?.waterLevel;
  const distVal = latestReading?.distance;

  const getChannelStatus = (val: number | undefined, unit: string) => {
    if (isConnected) {
      return val !== undefined ? `${val} ${unit} · Connected` : 'Connected';
    }
    if (mode === 'simulation') {
      return val !== undefined ? `${val} ${unit} · Simulated` : 'Simulated';
    }
    return 'Disconnected';
  };

  return (
    <div className={styles.stationCard}>
      {/* 1. Header */}
      <div className={styles.stationHeader}>
        <div className={styles.headerLeft}>
          <span className={styles.categoryLabel}>HARDWARE GATEWAY · 115200 BAUD</span>
          <h3 className={styles.stationTitle}>ESP32 STATION</h3>
        </div>

        <div className={styles.headerRight}>
          <span
            className={`${styles.statusPill} ${
              isConnected
                ? (isStale ? styles.statusStale : styles.statusConnected)
                : isConnecting
                ? styles.statusConnecting
                : isError
                ? styles.statusError
                : styles.statusDisconnected
            }`}
          >
            <span className={styles.statusDot} />
            <span>
              {isConnected
                ? (isStale ? (isKn ? 'ಡೇಟಾ ಹಳೆಯದಾಗಿದೆ' : 'STALE TELEMETRY') : (isKn ? 'ಸಂಪರ್ಕಗೊಂಡಿದೆ' : 'CONNECTED'))
                : isConnecting
                ? (isKn ? 'ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...' : 'CONNECTING...')
                : isError
                ? (isKn ? 'ದೋಷ' : 'ERROR')
                : (isKn ? 'ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ' : 'DISCONNECTED')}
            </span>
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* 2. Technical Metadata Grid */}
      <div className={styles.paramsGrid}>
        <div className={styles.paramItem}>
          <span className={styles.paramLabel}>Status</span>
          <span
            className={`${styles.paramValue} ${
              isConnected
                ? (isStale ? styles.textAmber : styles.textGreen)
                : isError
                ? styles.textRed
                : isConnecting
                ? styles.textAmber
                : styles.textMuted
            }`}
          >
            {isConnected ? (isStale ? 'STALE' : 'CONNECTED') : connectionState.toUpperCase()}
          </span>
        </div>

        <div className={styles.paramItem}>
          <span className={styles.paramLabel}>Source</span>
          <span className={styles.paramValue}>
            {mode === 'real' ? 'USB Serial' : 'Simulation'}
          </span>
        </div>

        <div className={styles.paramItem}>
          <span className={styles.paramLabel}>Baud</span>
          <span className={styles.paramValue}>115200</span>
        </div>

        <div className={styles.paramItem}>
          <span className={styles.paramLabel}>Telemetry</span>
          <span
            className={`${styles.paramValue} ${
              mode === 'real' && !isStale ? styles.textGreen : mode === 'real' ? styles.textAmber : styles.textChampagne
            }`}
          >
            {mode === 'real' ? (isStale ? 'STALE' : 'LIVE') : 'SIMULATION'}
          </span>
        </div>

        <div className={styles.paramItem}>
          <span className={styles.paramLabel}>Last Telemetry</span>
          <span className={styles.paramValue}>
            {secondsAgo !== null
              ? `${secondsAgo}s ago`
              : lastUpdateTime
              ? 'Just now'
              : 'Awaiting data'}
          </span>
        </div>
      </div>

      <div className={styles.divider} />

      {/* 3. Available Sensor Channels */}
      <div className={styles.channelsSection}>
        <div className={styles.channelsTitle}>
          <span>AVAILABLE SENSOR CHANNELS</span>
        </div>

        <div className={styles.channelsList}>
          {/* Channel 1: pH Sensor */}
          <div className={styles.channelRow}>
            <div className={styles.channelMeta}>
              <span className={styles.channelName}>pH</span>
              <span className={styles.channelDesc}>Analog Glass Electrode</span>
            </div>
            <div className={styles.channelStatus}>
              <span className={isConnected ? styles.channelBadgeLive : styles.channelBadgeSim}>
                {getChannelStatus(phVal ? Number(phVal.toFixed(2)) : undefined, 'pH')}
              </span>
            </div>
          </div>

          {/* Channel 2: TDS Sensor */}
          <div className={styles.channelRow}>
            <div className={styles.channelMeta}>
              <span className={styles.channelName}>TDS</span>
              <span className={styles.channelDesc}>Mineral Electrical Conductivity</span>
            </div>
            <div className={styles.channelStatus}>
              <span className={isConnected ? styles.channelBadgeLive : styles.channelBadgeSim}>
                {getChannelStatus(tdsVal ? Math.round(tdsVal) : undefined, 'PPM')}
              </span>
            </div>
          </div>

          {/* Channel 3: Water Level Sensor */}
          <div className={styles.channelRow}>
            <div className={styles.channelMeta}>
              <span className={styles.channelName}>Water Level</span>
              <span className={styles.channelDesc}>HC-SR04 Ultrasonic Air Gap</span>
            </div>
            <div className={styles.channelStatus}>
              <span className={isConnected ? styles.channelBadgeLive : styles.channelBadgeSim}>
                {isConnected
                  ? (wlVal !== undefined ? `${Math.round(wlVal)}% (${distVal?.toFixed(1) ?? '--'} cm) · Connected` : 'Connected')
                  : (mode === 'simulation' ? `${Math.round(wlVal ?? 82)}% (${distVal?.toFixed(1) ?? '21.0'} cm) · Simulated` : 'Disconnected')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Error & Recovery Banner */}
      {isError && (
        <div className={styles.errorBanner}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <span style={{ color: 'var(--color-danger)', fontWeight: 800, fontSize: '14px' }}>!</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--color-danger)' }}>
                Unable to connect to ESP32
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {error || 'The serial COM port could not be opened.'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Recovery Action: Close Arduino IDE Serial Monitor, PuTTY, or other terminal applications holding the COM port, ensure USB cable is connected, then retry.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Actions Row */}
      <div className={styles.actionsRow}>
        {isConnected ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={disconnect}
            style={{ fontSize: '12px', padding: '7px 16px' }}
          >
            Disconnect ESP32
          </button>
        ) : isConnecting ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled
            style={{ fontSize: '12px', padding: '7px 16px', opacity: 0.75 }}
          >
            Connecting to ESP32...
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={connect}
              style={{ fontSize: '12px', padding: '7px 18px', fontWeight: 700 }}
            >
              Connect ESP32
            </button>

            {hasAuthorizedPort && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={reconnect}
                style={{ fontSize: '12px', padding: '7px 14px' }}
              >
                Reconnect Previous Port
              </button>
            )}

            {mode === 'real' && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setMode('simulation')}
                style={{ fontSize: '11.5px', padding: '6px 12px' }}
              >
                Switch to Simulation
              </button>
            )}
          </div>
        )}

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {isConnected ? 'USB CDC @ 115200 8-N-1' : mode === 'real' ? 'Awaiting hardware link' : 'Autonomous simulation engine'}
        </div>
      </div>
    </div>
  );
}
