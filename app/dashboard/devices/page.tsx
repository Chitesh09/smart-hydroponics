'use client';

// ============================================================
// HydroSmart — IoT Device Management & Telemetry Dashboard
// Multi-Device Registry, Diagnostics, Calibration & Event Logs
// ============================================================

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { getFarmerCopy } from '@/lib/intelligence/farmerSemanticLayer';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import {
  Cpu,
  Activity,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Radio,
  FileText,
  Trash2,
  Edit3,
  Layers,
  ChevronDown,
  ChevronUp,
  Microchip,
  ArrowLeft
} from 'lucide-react';
import styles from './page.module.css';

export default function DeviceManagementPage() {
  const router = useRouter();
  const { userMode, setUserMode, language, setLanguage } = usePlantIntelligence();
  const copy = getFarmerCopy(language);

  const {
    supported,
    mode,
    setMode,
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

  const [showSchematic, setShowSchematic] = useState<boolean>(false);

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

  // Guard: If Farmer Mode is active, display clear Technical Mode Required screen
  if (userMode === 'farmer') {
    return (
      <div style={{
        maxWidth: '640px',
        margin: '60px auto',
        padding: '36px 32px',
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '16px',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(229, 169, 60, 0.15)',
          border: '1px solid rgba(229, 169, 60, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-amber)',
        }}>
          <Radio size={28} />
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          {copy.devices.techModeRequiredTitle}
        </h2>

        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, maxWidth: '500px' }}>
          {copy.devices.techModeRequiredDesc}
        </p>

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
            onClick={() => setUserMode('technical')}
          >
            <Microchip size={16} />
            <span>{copy.devices.switchToTechBtn}</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '13px' }}
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft size={16} />
            <span>{copy.devices.returnDashboardBtn}</span>
          </button>
        </div>
      </div>
    );
  }

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
          <h1 className={styles.headerTitle}>{copy.devices.title}</h1>
          <p className={styles.headerSub}>
            {copy.devices.subtitle}
          </p>
        </div>

        <div className={styles.actionRow}>
          <ModeToggle mode={userMode} onModeChange={setUserMode} language={language} size="sm" />
          <LanguageToggle language={language} onLanguageChange={setLanguage} size="sm" />

          {/* Simulation vs Real Mode Toggle */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px',
            gap: '2px',
          }}>
            <button
              onClick={() => setMode('simulation')}
              className={`btn ${mode === 'simulation' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 12px', fontSize: '11.5px' }}
            >
              {copy.devices.simModeBtn}
            </button>
            <button
              onClick={() => setMode('real')}
              className={`btn ${mode === 'real' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 12px', fontSize: '11.5px' }}
            >
              {copy.devices.realSerialBtn}
            </button>
          </div>

          {supported && (
            connectionState === 'connected' ? (
              <button
                onClick={disconnect}
                className="btn btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
              >
                <Radio size={16} style={{ color: '#FF6B6B' }} />
                {copy.devices.disconnectPort}
              </button>
            ) : (
              <button
                onClick={connect}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}
              >
                <Radio size={16} />
                {copy.devices.connectPort}
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
            <span className={styles.metricLabel}>{copy.devices.hardwareLink}</span>
            <Radio size={18} style={{ color: isDeviceOnline ? '#B7FF3C' : '#FF6B6B' }} />
          </div>
          <div className={styles.metricValue}>
            {isDeviceOnline ? copy.devices.online : isStale ? copy.devices.stale : copy.devices.offline}
          </div>
          <div className={styles.metricSub}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isDeviceOnline ? '#B7FF3C' : '#FF6B6B',
              boxShadow: `0 0 8px ${isDeviceOnline ? '#B7FF3C' : '#FF6B6B'}`
            }} />
            {mode === 'real' ? copy.devices.directUsb : copy.devices.simHardware}
          </div>
        </div>

        {/* Device Health Score */}
        <div className={styles.metricCard} style={{ '--card-accent': '#00E5FF' } as React.CSSProperties}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>{copy.devices.deviceHealthScore}</span>
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
            <span className={styles.metricLabel}>{copy.devices.activeTelemetryMode}</span>
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
          <Activity size={18} style={{ color: '#00E5FF' }} /> {copy.devices.sensorDiagnostics}
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
            <Sliders size={18} style={{ color: '#00E5FF' }} /> {copy.devices.calibrationPanel}
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
              <RotateCcw size={14} /> {copy.devices.resetDefaults}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <CheckCircle2 size={14} /> {copy.devices.saveCalibration}
            </button>
          </div>
        </form>
      </div>

      {/* 6. Hardware Architecture & Schematic Section */}
      <div className={styles.calibrationContainer}>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            cursor: 'pointer',
            userSelect: 'none'
          }}
          onClick={() => setShowSchematic(!showSchematic)}
        >
          <div className={styles.sectionHeading}>
            <Layers size={18} style={{ color: '#00E5FF' }} /> Station Hardware Schematic & Channel Pinouts
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '4px 8px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>{showSchematic ? 'Hide Schematic' : 'View Schematic'}</span>
            {showSchematic ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showSchematic && (
          <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p className={styles.sectionDesc}>
              Physical ESP32 channel pinout mapping, analog signal conditioning, and USB Web Serial communication topology.
            </p>

            <div style={{ position: 'relative', width: '100%', padding: '12px 0', overflowX: 'auto' }}>
              <svg viewBox="0 0 800 240" style={{ width: '100%', minWidth: '640px', height: 'auto' }}>
                <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#20B8B0" />
                  </marker>
                </defs>

                {/* Sensor Blocks */}
                <rect x="20" y="20" width="160" height="48" rx="6" fill="#0D2420" stroke="#20473F" />
                <text x="35" y="48" fill="#F1F7F4" fontSize="12" fontWeight="700">pH Electrode Probe</text>
                <text x="35" y="60" fill="#9DB4AE" fontSize="9">Analog input (Pin VP / ADC)</text>

                <rect x="20" y="96" width="160" height="48" rx="6" fill="#0D2420" stroke="#20473F" />
                <text x="35" y="124" fill="#F1F7F4" fontSize="12" fontWeight="700">TDS Conductivity Probe</text>
                <text x="35" y="136" fill="#9DB4AE" fontSize="9">Analog input (Pin 34 / ADC)</text>

                <rect x="20" y="172" width="160" height="48" rx="6" fill="#0D2420" stroke="#20473F" />
                <text x="35" y="200" fill="#F1F7F4" fontSize="12" fontWeight="700">HC-SR04 Ultrasonic</text>
                <text x="35" y="212" fill="#9DB4AE" fontSize="9">Digital (Pins 12 Trig / 13 Echo)</text>

                {/* Central ESP32 Controller */}
                <rect x="320" y="80" width="180" height="80" rx="8" fill="#13332D" stroke="#20B8B0" strokeWidth="1.5" />
                <text x="345" y="115" fill="#20B8B0" fontSize="15" fontWeight="800">ESP32 Core</text>
                <text x="345" y="132" fill="#F1F7F4" fontSize="11" fontWeight="600">32-bit Tensilica MCU</text>
                <text x="345" y="146" fill="#9DB4AE" fontSize="9">JSON Conversion & Serial Tx</text>

                {/* Dashboard Output Block */}
                <rect x="620" y="96" width="160" height="48" rx="6" fill="#0D2420" stroke="#39B86F" strokeWidth="1" />
                <text x="635" y="124" fill="#39B86F" fontSize="12" fontWeight="700">Web Dashboard</text>
                <text x="635" y="136" fill="#9DB4AE" fontSize="9">Web Serial parser API</text>

                {/* Flow Arrows */}
                <path d="M 180 44 L 250 44 L 250 100 L 320 100" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <path d="M 180 120 L 320 120" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                <path d="M 180 196 L 250 196 L 250 140 L 320 140" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                
                <path d="M 500 120 L 620 120" fill="none" stroke="#20B8B0" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#arrow)" />
                <text x="515" y="112" fill="#20B8B0" fontSize="9" fontFamily="var(--font-mono)">115200 Baud</text>
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 7. Telemetry Event Log Stream */}
      <div className={styles.logsContainer}>
        <div className={styles.sensorTop}>
          <div className={styles.sectionHeading}>
            <FileText size={18} style={{ color: '#00E5FF' }} /> {copy.devices.liveTelemetryTerminal}
          </div>
          {telemetryLogs.length > 0 && (
            <button
              onClick={clearLogs}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={13} /> {copy.devices.clearLogs}
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
