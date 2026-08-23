'use client';

// ============================================================
// HydroSmart — IoT Device Management & Telemetry Dashboard
// Multi-Device Registry, Diagnostics, Calibration & Event Logs
// ============================================================

import React, { useState } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import {
  Cpu,
  Activity,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Radio,
  FileText,
  Trash2,
  Edit3
} from 'lucide-react';
import styles from './page.module.css';

export default function DeviceManagementPage() {
  const {
    supported,
    mode,
    connectionState,
    isStale,
    connect,
    disconnect,
    activeDevice,
    sensorHealth,
    deviceHealthScore,
    calibration,
    updateCalibration,
    resetCalibration,
    renameDevice,
    telemetryLogs,
    clearLogs
  } = useESP32Serial();

  // Calibration Form State
  const [phOffset, setPhOffset] = useState<number>(calibration.phOffset);
  const [phSlope, setPhSlope] = useState<number>(calibration.phSlopeMultiplier);
  const [tdsFactor, setTdsFactor] = useState<number>(calibration.tdsCalibrationFactor);
  const [emptyDist, setEmptyDist] = useState<number>(calibration.ultrasonicEmptyDistanceCm);
  const [fullDist, setFullDist] = useState<number>(calibration.ultrasonicFullDistanceCm);
  const [timeoutMs, setTimeoutMs] = useState<number>(calibration.heartbeatTimeoutMs);
  const [calibSavedMsg, setCalibSavedMsg] = useState<boolean>(false);

  // Device Renaming State
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [editedName, setEditedName] = useState<string>(activeDevice.name);

  const handleSaveCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    updateCalibration({
      phOffset,
      phSlopeMultiplier: phSlope,
      tdsCalibrationFactor: tdsFactor,
      ultrasonicEmptyDistanceCm: emptyDist,
      ultrasonicFullDistanceCm: fullDist,
      heartbeatTimeoutMs: timeoutMs,
    });
    setCalibSavedMsg(true);
    setTimeout(() => setCalibSavedMsg(false), 3000);
  };

  const handleResetCalibration = () => {
    resetCalibration();
    setPhOffset(0.0);
    setPhSlope(1.0);
    setTdsFactor(1.0);
    setEmptyDist(60.0);
    setFullDist(13.0);
    setTimeoutMs(5000);
  };

  const handleSaveName = () => {
    if (editedName.trim()) {
      renameDevice(activeDevice.deviceId, editedName.trim());
      setIsEditingName(false);
    }
  };

  const isDeviceOnline = (mode === 'simulation' || connectionState === 'connected') && !isStale;

  return (
    <div className={styles.container}>
      {/* 1. Header Row */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>IoT Device Management</h1>
          <p className={styles.headerSub}>
            Real-time station telemetry pipeline, hardware diagnostic matrices, and sensor calibration.
          </p>
        </div>

        <div className={styles.actionRow}>
          {supported && (
            connectionState === 'connected' ? (
              <button
                onClick={disconnect}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
              >
                <Radio size={16} style={{ color: '#FF6B6B' }} />
                Disconnect Port
              </button>
            ) : (
              <button
                onClick={connect}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
              >
                <Radio size={16} />
                Connect ESP32 Serial
              </button>
            )
          )}
        </div>
      </div>

      {/* 2. Top Metrics Overview Grid */}
      <div className={styles.metricsGrid}>
        {/* Node Status */}
        <div className={styles.metricCard} style={{ '--card-accent': isDeviceOnline ? '#B7FF3C' : '#FF6B6B' } as React.CSSProperties}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Hardware Link</span>
            <Radio size={18} style={{ color: isDeviceOnline ? '#B7FF3C' : '#FF6B6B' }} />
          </div>
          <div className={styles.metricValue}>
            {isDeviceOnline ? 'ONLINE' : isStale ? 'STALE' : 'OFFLINE'}
          </div>
          <div className={styles.metricSub}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isDeviceOnline ? '#B7FF3C' : '#FF6B6B',
              boxShadow: `0 0 8px ${isDeviceOnline ? '#B7FF3C' : '#FF6B6B'}`
            }} />
            {mode === 'real' ? 'Direct USB Web Serial (115200 Baud)' : 'Local Simulated Hardware Stream'}
          </div>
        </div>

        {/* Device Health Score */}
        <div className={styles.metricCard} style={{ '--card-accent': '#00E5FF' } as React.CSSProperties}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Station Health Score</span>
            <Activity size={18} style={{ color: '#00E5FF' }} />
          </div>
          <div className={styles.metricValue} style={{ color: '#00E5FF' }}>
            {deviceHealthScore} <span style={{ fontSize: '16px', color: '#8FA3B8', fontWeight: 500 }}>/ 100</span>
          </div>
          <div className={styles.metricSub}>
            {deviceHealthScore >= 90 ? 'All 4 sensor channels & packet feeds nominal' : 'Attention required on hardware telemetry'}
          </div>
        </div>

        {/* Packet Validation Reliability */}
        <div className={styles.metricCard} style={{ '--card-accent': '#FFC857' } as React.CSSProperties}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Telemetry Reliability</span>
            <CheckCircle2 size={18} style={{ color: '#FFC857' }} />
          </div>
          <div className={styles.metricValue}>
            {activeDevice.packetsReceived > 0
              ? `${(((activeDevice.packetsReceived - activeDevice.packetsCorrupted) / activeDevice.packetsReceived) * 100).toFixed(1)}%`
              : '100%'}
          </div>
          <div className={styles.metricSub}>
            {activeDevice.packetsCorrupted} corrupted / {activeDevice.packetsReceived} total packets parsed
          </div>
        </div>
      </div>

      {/* 3. Primary Registered Device Card */}
      <div className={styles.deviceDetailsCard}>
        <div className={styles.sensorTop}>
          <div className={styles.sectionHeading}>
            <Cpu size={20} style={{ color: '#00E5FF' }} />
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className={styles.fieldInput}
                  style={{ padding: '4px 10px', fontSize: '15px' }}
                />
                <button onClick={handleSaveName} className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                  Save
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>{activeDevice.name}</span>
                <button
                  onClick={() => setIsEditingName(true)}
                  style={{ background: 'none', border: 'none', color: '#8FA3B8', cursor: 'pointer', padding: '2px' }}
                  title="Rename Device"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            )}
          </div>
          <span className={`${styles.sensorBadge} ${isDeviceOnline ? styles.sensorBadgeWorking : styles.sensorBadgeDisconnected}`}>
            {activeDevice.status.toUpperCase()}
          </span>
        </div>

        <div className={styles.deviceInfoGrid}>
          <div className={styles.infoBlock}>
            <span className={styles.infoKey}>Device Identifier</span>
            <span className={styles.infoVal}>{activeDevice.deviceId}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.infoKey}>Firmware Version</span>
            <span className={styles.infoVal}>{activeDevice.firmwareVersion}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.infoKey}>Station Assignment</span>
            <span className={styles.infoVal}>{activeDevice.stationAssignment}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.infoKey}>Baud Rate</span>
            <span className={styles.infoVal}>{activeDevice.baudRate} bps</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.infoKey}>Port Info</span>
            <span className={styles.infoVal}>{activeDevice.portInfo?.portName || 'Virtual USB / Simulated'}</span>
          </div>
          <div className={styles.infoBlock}>
            <span className={styles.infoKey}>Heartbeat Interval</span>
            <span className={styles.infoVal}>{calibration.heartbeatTimeoutMs / 1000}s Watcher</span>
          </div>
        </div>
      </div>

      {/* 4. Per-Sensor Health Diagnostics Matrix */}
      <div>
        <h2 className={styles.sectionHeading} style={{ marginBottom: '16px' }}>
          <Activity size={18} style={{ color: '#00E5FF' }} /> Sensor Diagnostic Matrix
        </h2>
        <div className={styles.sensorGrid}>
          {Object.values(sensorHealth).map((sensor) => {
            const isWorking = sensor.state === 'working';
            const isFault = sensor.state === 'fault';
            return (
              <div key={sensor.sensorKey} className={styles.sensorCard}>
                <div className={styles.sensorTop}>
                  <span className={styles.sensorName}>{sensor.name}</span>
                  <span className={`${styles.sensorBadge} ${isWorking ? styles.sensorBadgeWorking : isFault ? styles.sensorBadgeFault : styles.sensorBadgeDisconnected}`}>
                    {sensor.state}
                  </span>
                </div>

                <div className={styles.sensorValueBig}>
                  {sensor.lastReading !== undefined
                    ? `${sensor.lastReading} ${sensor.unit}`
                    : '--'}
                </div>

                <p className={styles.sensorDetails}>{sensor.statusDetails}</p>

                <div style={{ fontSize: '11px', color: '#8FA3B8', fontFamily: 'var(--font-mono)' }}>
                  Envelope: {sensor.minThreshold} - {sensor.maxThreshold} {sensor.unit}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Hardware Calibration Console */}
      <div className={styles.calibrationSection}>
        <div className={styles.sensorTop}>
          <div className={styles.sectionHeading}>
            <Sliders size={18} style={{ color: '#00E5FF' }} /> Hardware Calibration & Transducer Offsets
          </div>
          {calibSavedMsg && (
            <span style={{ fontSize: '12px', color: '#B7FF3C', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={14} /> Calibration Coefficients Persisted!
            </span>
          )}
        </div>

        <form onSubmit={handleSaveCalibration} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>pH Calibration Offset (ΔpH)</label>
              <input
                type="number"
                step="0.01"
                value={phOffset}
                onChange={(e) => setPhOffset(parseFloat(e.target.value) || 0)}
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>pH Slope Multiplier (gain)</label>
              <input
                type="number"
                step="0.01"
                value={phSlope}
                onChange={(e) => setPhSlope(parseFloat(e.target.value) || 1)}
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>TDS Calibration Factor (multiplier)</label>
              <input
                type="number"
                step="0.01"
                value={tdsFactor}
                onChange={(e) => setTdsFactor(parseFloat(e.target.value) || 1)}
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Reservoir Empty Distance (cm)</label>
              <input
                type="number"
                step="0.5"
                value={emptyDist}
                onChange={(e) => setEmptyDist(parseFloat(e.target.value) || 60)}
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Reservoir Full Distance (cm)</label>
              <input
                type="number"
                step="0.5"
                value={fullDist}
                onChange={(e) => setFullDist(parseFloat(e.target.value) || 13)}
                className={styles.fieldInput}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Heartbeat Timeout (ms)</label>
              <input
                type="number"
                step="500"
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(parseInt(e.target.value) || 5000)}
                className={styles.fieldInput}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleResetCalibration}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <RotateCcw size={14} /> Reset Defaults
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <CheckCircle2 size={14} /> Apply Calibration
            </button>
          </div>
        </form>
      </div>

      {/* 6. Telemetry Event Log Stream */}
      <div className={styles.logsContainer}>
        <div className={styles.sensorTop}>
          <div className={styles.sectionHeading}>
            <FileText size={18} style={{ color: '#00E5FF' }} /> Telemetry & System Event Stream
          </div>
          {telemetryLogs.length > 0 && (
            <button
              onClick={clearLogs}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={13} /> Clear Logs
            </button>
          )}
        </div>

        <div className={styles.logTableWrapper}>
          <table className={styles.logTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event</th>
                <th>Type</th>
                <th>Details</th>
                <th>Device</th>
              </tr>
            </thead>
            <tbody>
              {telemetryLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: '#8FA3B8', padding: '24px' }}>
                    No telemetry events recorded yet.
                  </td>
                </tr>
              ) : (
                telemetryLogs.map((log) => {
                  let badgeClass = styles.logBadgeInfo;
                  if (log.type === 'success') badgeClass = styles.logBadgeSuccess;
                  if (log.type === 'warning') badgeClass = styles.logBadgeWarning;
                  if (log.type === 'error') badgeClass = styles.logBadgeError;

                  return (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: '#8FA3B8' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td style={{ fontWeight: 600 }}>{log.event}</td>
                      <td>
                        <span className={`${styles.logBadge} ${badgeClass}`}>
                          {log.type}
                        </span>
                      </td>
                      <td style={{ color: '#8FA3B8' }}>{log.details || '--'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{log.deviceId}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
