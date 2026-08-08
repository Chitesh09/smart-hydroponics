'use client';

import { useState, useEffect, useMemo } from 'react';
import { useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import ESP32Connection from '@/components/esp32/ESP32Connection';
import { SENSOR_THRESHOLDS } from '@/lib/sensorConfig';
import { LiveLineChart } from '@/components/LiveLineChart';
import { FlaskConical, Sparkles, Cpu, AlertTriangle, ShieldCheck } from 'lucide-react';
import styles from './page.module.css';

// Fallback values if data streams are inactive
const DEFAULT_READING = { ph: 6.0, tds: 1000, waterLevel: 85, distance: 23.5, timestamp: 0 };

export default function Dashboard() {
  const { mode, isStale, latestReading, history } = useESP32Serial();
  const [greeting, setGreeting] = useState('Welcome back 👋');
  const [selectedMetric, setSelectedMetric] = useState<'ph' | 'tds' | 'waterLevel' | 'distance'>('ph');

  const reading = latestReading || DEFAULT_READING;

  // Personalize dashboard greeting based on local time and session variables
  useEffect(() => {
    const name = localStorage.getItem('hydro_user_name');
    const now = new Date();
    const hour = now.getHours();
    
    let timeGreeting = 'Welcome back';
    if (hour < 12) {
      timeGreeting = 'Good morning';
    } else if (hour < 17) {
      timeGreeting = 'Good afternoon';
    } else {
      timeGreeting = 'Good evening';
    }

    const timer = setTimeout(() => {
      if (name && name !== 'null' && name !== 'undefined') {
        setGreeting(`${timeGreeting}, ${name} 👋`);
      } else {
        setGreeting('Welcome back 👋');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Format historical chart timestamps
  const chartLabels = useMemo(() => {
    return history.map((item) =>
      new Date(item.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, [history]);

  // Determine current active metric configuration
  const chartConfig = useMemo(() => {
    const dataMap = {
      ph: history.map((item) => item.ph),
      tds: history.map((item) => item.tds),
      waterLevel: history.map((item) => item.waterLevel),
      distance: history.map((item) => item.distance),
    };

    const configs = {
      ph: {
        data: dataMap.ph,
        color: '#00E5FF',
        title: 'pH Level Telemetry (1m Window)',
        min: 4.0,
        max: 8.0,
      },
      tds: {
        data: dataMap.tds,
        color: '#B7FF3C',
        title: 'TDS Nutrient Telemetry (1m Window)',
        min: 600,
        max: 1400,
      },
      waterLevel: {
        data: dataMap.waterLevel,
        color: '#00E5FF',
        title: 'Reservoir Percent Telemetry (1m Window)',
        min: 0,
        max: 100,
      },
      distance: {
        data: dataMap.distance,
        color: '#FFC857',
        title: 'Ultrasonic Distance Telemetry (1m Window)',
        min: 0,
        max: 60,
      },
    };

    return configs[selectedMetric];
  }, [history, selectedMetric]);

  // Compute seconds elapsed since the last telemetry packet
  const [secondsAgo, setSecondsAgo] = useState<number | null>(null);
  useEffect(() => {
    const updateTime = () => {
      if (reading.timestamp) {
        setSecondsAgo(Math.max(0, Math.floor((Date.now() - reading.timestamp) / 1000)));
      } else {
        setSecondsAgo(null);
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [reading.timestamp]);

  // Define sensor card statuses dynamically based on thresholds
  const phCardStatus = useMemo(() => {
    if (reading.ph < SENSOR_THRESHOLDS.ph.min || reading.ph > SENSOR_THRESHOLDS.ph.max) return 'warning';
    return 'optimal';
  }, [reading.ph]);

  const tdsCardStatus = useMemo(() => {
    if (reading.tds < SENSOR_THRESHOLDS.tds.min || reading.tds > SENSOR_THRESHOLDS.tds.max) return 'warning';
    return 'optimal';
  }, [reading.tds]);

  const waterCardStatus = useMemo(() => {
    if (reading.waterLevel < SENSOR_THRESHOLDS.waterLevel.critical) return 'danger';
    if (reading.waterLevel < SENSOR_THRESHOLDS.waterLevel.warning) return 'warning';
    return 'optimal';
  }, [reading.waterLevel]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 1. Personalized Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-sm">{greeting}</h1>
        <p className="text-secondary">Your hydroponic system is being monitored in real time.</p>
        
        {/* Status Line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '13px' }}>
          <span style={{ 
            display: 'inline-block',
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            background: mode === 'real' && !isStale ? '#B7FF3C' : '#FFC857',
            boxShadow: `0 0 8px ${mode === 'real' && !isStale ? '#B7FF3C' : '#FFC857'}`
          }} />
          <span className="font-mono text-secondary">
            {mode === 'real' ? 'ESP32 ● LIVE' : 'DEMO MODE (Simulated)'}
          </span>
          {secondsAgo !== null && (
            <span className="text-muted">· Last telemetry: {secondsAgo}s ago</span>
          )}
        </div>
      </div>

      {/* 2. Primary Sensor Focus Grid */}
      <div className={styles.sensorGrid}>
        
        {/* pH Card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-sm font-bold text-secondary uppercase">pH Level</span>
              <FlaskConical size={18} style={{ color: '#00E5FF' }} />
            </div>
            <div className="text-3xl font-bold text-primary font-mono" style={{ margin: '8px 0' }}>
              {reading.ph.toFixed(2)}
            </div>
          </div>
          
          <div>
            {/* pH Semicircular scale visualizer */}
            <div style={{ width: '100%', marginTop: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#5A738E', marginBottom: '4px' }}>
                <span>5.5</span>
                <span>6.5</span>
              </div>
              <div style={{ position: 'relative', width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '2px' }}>
                {/* Target optimal window */}
                <div style={{
                  position: 'absolute',
                  left: '30%',
                  right: '30%',
                  top: 0,
                  bottom: 0,
                  background: 'rgba(183, 255, 60, 0.15)',
                  borderRadius: '2px'
                }} />
                {/* Float marker dot */}
                <div style={{
                  position: 'absolute',
                  left: `${Math.max(0, Math.min(100, ((reading.ph - 4) / 5) * 100))}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: phCardStatus === 'optimal' ? '#B7FF3C' : '#FFC857',
                  boxShadow: `0 0 8px ${phCardStatus === 'optimal' ? '#B7FF3C' : '#FFC857'}`,
                  transition: 'left 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span className={`badge badge-${phCardStatus === 'optimal' ? 'success' : 'warning'}`}>
                ● {phCardStatus.toUpperCase()}
              </span>
              <span className="text-xs text-muted">LIVE SENSOR</span>
            </div>
          </div>
        </div>

        {/* TDS Card */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <span className="text-sm font-bold text-secondary uppercase">Nutrients (TDS)</span>
              <Sparkles size={18} style={{ color: '#B7FF3C' }} />
            </div>
            <div className="text-3xl font-bold text-primary font-mono" style={{ margin: '8px 0' }}>
              {Math.round(reading.tds)} <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>PPM</span>
            </div>
          </div>
          
          <div>
            {/* TDS Linear indicator bar */}
            <div style={{ width: '100%', marginTop: '16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#5A738E', marginBottom: '6px' }}>
                <span>100 PPM</span>
                <span>2500 PPM</span>
              </div>
              <div style={{ position: 'relative', width: '100%', height: '6px', background: 'rgba(7, 17, 31, 0.4)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{
                  width: `${Math.max(0, Math.min(100, ((reading.tds - 100) / 2400) * 100))}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #00E5FF 0%, #B7FF3C 100%)',
                  transition: 'width 0.4s ease-out'
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <span className={`badge badge-${tdsCardStatus === 'optimal' ? 'success' : 'warning'}`}>
                ● {tdsCardStatus.toUpperCase()}
              </span>
              <span className="text-xs text-muted">LIVE SENSOR</span>
            </div>
          </div>
        </div>

        {/* Double-Spanned Reservoir Level & Distance Visualization */}
        <div className={`glass-card ${styles.reservoirCard}`} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span className="text-sm font-bold text-secondary uppercase">Water Reservoir Status</span>
            <span className={`badge badge-${waterCardStatus === 'optimal' ? 'success' : waterCardStatus === 'warning' ? 'warning' : 'danger'}`}>
              ● LEVEL {waterCardStatus.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
            {/* industrial reservoir tank visualizer */}
            <div style={{ 
              position: 'relative', 
              width: '90px', 
              height: '130px', 
              background: '#07111F', 
              border: '2px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '6px 6px 10px 10px',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              {/* Liquid Level fill */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: `${Math.max(0, Math.min(100, reading.waterLevel))}%`,
                background: 'linear-gradient(180deg, rgba(0, 229, 255, 0.35) 0%, rgba(0, 150, 255, 0.08) 100%)',
                transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
              }}>
                {/* Wave effect layer overlay */}
                <div className={styles.waveEffect} style={{
                  width: '200%',
                  height: '10px',
                  background: 'rgba(0, 229, 255, 0.12)',
                  position: 'absolute',
                  top: '-4px',
                  left: 0
                }} />
              </div>
              
              {/* Value inside tank */}
              <div className="font-mono" style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '17px',
                fontWeight: 800,
                color: '#F4F7FB',
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                zIndex: 10
              }}>
                {Math.round(reading.waterLevel)}%
              </div>
            </div>

            {/* Hardware Metrics Column */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="grid-2" style={{ gap: '16px' }}>
                <div>
                  <div className="text-xs text-secondary uppercase">Water Level</div>
                  <div className="text-2xl font-bold text-primary font-mono">{Math.round(reading.waterLevel)}%</div>
                  <div className="text-xs text-muted" style={{ marginTop: '2px' }}>Capacity Percentage</div>
                </div>
                <div>
                  <div className="text-xs text-secondary uppercase">Ultrasonic Distance</div>
                  <div className="text-2xl font-bold text-accent font-mono">{reading.distance.toFixed(1)} <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>cm</span></div>
                  <div className="text-xs text-muted" style={{ marginTop: '2px' }}>Sensor Offset Value</div>
                </div>
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                Target: level &gt; {SENSOR_THRESHOLDS.waterLevel.warning}% · sensor calibration offset active.
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Hardware connection controls & Diagnostics layout */}
      <div className={styles.dashboardLayout}>
        
        {/* Left Column: Connection Status & System Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Connection controls wrapper */}
          <ESP32Connection />

          {/* System Diagnostics Panel */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-secondary uppercase tracking-wide">System Diagnostics</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span className="text-sm text-secondary">ESP32 Controller</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: mode === 'real' ? '#B7FF3C' : '#FFC857', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} /> {mode === 'real' ? 'ONLINE' : 'SIMULATOR'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span className="text-sm text-secondary">pH Sensor Channel</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#B7FF3C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} /> ACTIVE
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span className="text-sm text-secondary">TDS Nutrient Channel</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#B7FF3C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} /> ACTIVE
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '8px' }}>
                <span className="text-sm text-secondary">Ultrasonic Transceiver</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#B7FF3C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} /> ACTIVE
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm text-secondary">Telemetry Data Stream</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: isStale ? '#FF6B4A' : '#B7FF3C', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isStale ? <AlertTriangle size={14} /> : <ShieldCheck size={14} />} {isStale ? 'STALE' : 'STABLE'}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Live Telemetry Section (Charts) */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h3 className="text-sm font-bold text-secondary uppercase tracking-wide">Live Instrumentation Chart</h3>
            
            {/* Metric select tabs controls */}
            <div className={styles.tabsContainer}>
              <button 
                className={`${styles.tabBtn} ${selectedMetric === 'ph' ? styles.tabBtnActive : ''}`}
                onClick={() => setSelectedMetric('ph')}
              >
                pH
              </button>
              <button 
                className={`${styles.tabBtn} ${selectedMetric === 'tds' ? styles.tabBtnActive : ''}`}
                onClick={() => setSelectedMetric('tds')}
              >
                TDS
              </button>
              <button 
                className={`${styles.tabBtn} ${selectedMetric === 'waterLevel' ? styles.tabBtnActive : ''}`}
                onClick={() => setSelectedMetric('waterLevel')}
              >
                Level
              </button>
              <button 
                className={`${styles.tabBtn} ${selectedMetric === 'distance' ? styles.tabBtnActive : ''}`}
                onClick={() => setSelectedMetric('distance')}
              >
                Distance
              </button>
            </div>
          </div>

          {/* Chart Display area */}
          <div style={{ padding: '8px 0' }}>
            {history.length === 0 ? (
              <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Waiting for incoming serial telemetry packets...
              </div>
            ) : (
              <LiveLineChart 
                data={chartConfig.data} 
                labels={chartLabels} 
                title={chartConfig.title} 
                color={chartConfig.color} 
                min={chartConfig.min} 
                max={chartConfig.max} 
              />
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
