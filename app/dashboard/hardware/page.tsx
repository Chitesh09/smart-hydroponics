'use client';

import { HardDrive, Layers, Zap } from 'lucide-react';
import styles from './page.module.css';

export default function HardwarePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-xs">Hardware Architecture</h1>
        <p className="text-secondary">Physical sensor nodes, channel wiring, and serial data flow.</p>
      </div>

      {/* Central Architecture Flow Diagram */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={18} style={{ color: 'var(--color-teal)' }} /> Core System Schematic
        </h2>

        {/* 1. Desktop Architecture Diagram (Hidden on Mobile) */}
        <div className={styles.desktopDiagram} style={{ position: 'relative', width: '100%', padding: '16px 0' }}>
          <svg viewBox="0 0 800 240" style={{ width: '100%', height: 'auto' }}>
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

        {/* 2. Mobile/Tablet Vertical Flow Diagram (Visible on Mobile) */}
        <div className={styles.mobileFlowDiagram}>
          <div className={styles.flowCard}>
            <div className={styles.flowCardTitle}>pH Electrode Probe</div>
            <div className={styles.flowCardDesc}>Analog Input (Pin VP / ADC)</div>
          </div>
          <div className={styles.flowArrow}>↓</div>

          <div className={styles.flowCard}>
            <div className={styles.flowCardTitle}>TDS Conductivity Probe</div>
            <div className={styles.flowCardDesc}>Analog Input (Pin 34 / ADC)</div>
          </div>
          <div className={styles.flowArrow}>↓</div>

          <div className={styles.flowCard}>
            <div className={styles.flowCardTitle}>HC-SR04 Ultrasonic Sensor</div>
            <div className={styles.flowCardDesc}>Digital Trigger (GPIO 12) & Echo (GPIO 13)</div>
          </div>
          <div className={styles.flowArrow}>↓</div>

          <div className={`${styles.flowCard} ${styles.flowCardActive}`}>
            <div className={styles.flowCardTitle} style={{ color: 'var(--color-teal)' }}>ESP32 Microcontroller Core</div>
            <div className={styles.flowCardDesc}>Aggregates telemetry, formats to JSON lines, and transmits</div>
          </div>
          <div className={styles.flowArrow} style={{ color: 'var(--color-teal)' }}>↓ (115200 Baud Serial)</div>

          <div className={styles.flowCard} style={{ borderColor: 'var(--color-green)' }}>
            <div className={styles.flowCardTitle} style={{ color: 'var(--color-green)' }}>Web Dashboard Console</div>
            <div className={styles.flowCardDesc}>Receives telemetry packets in browser state</div>
          </div>
        </div>
      </div>

      {/* Component Details Card List */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Zap size={18} style={{ color: 'var(--color-teal)' }} />
            <h3 className="text-md font-bold">Analog Conditioning Board</h3>
          </div>
          <p className="text-sm text-secondary mb-md">
            Signal amplifier circuits for high-impedance glass electrode pH probes and AC-driven TDS sensors to mitigate electrolytic polarization.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">ADC Resolution</span>
              <span className="font-mono text-primary">12-bit (0 - 4095)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">Operating Voltage</span>
              <span className="font-mono text-primary">3.3V / 5.0V Dual</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span className="text-muted">Filter Method</span>
              <span className="font-mono text-primary">Moving Median (N=10)</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <HardDrive size={18} style={{ color: 'var(--color-green)' }} />
            <h3 className="text-md font-bold">Actuation & Relay Interface</h3>
          </div>
          <p className="text-sm text-secondary mb-md">
            Peristaltic chemical dosing pump interfaces and 12V submersible circulation pump relay channels.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">Dosing Pumps</span>
              <span className="font-mono" style={{ color: 'var(--text-muted)' }}>Not Installed (Manual Dosing)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span className="text-muted">Relay Isolation</span>
              <span className="font-mono text-primary">Optocoupled (PC817)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
              <span className="text-muted">Failsafe Lockout</span>
              <span className="font-mono" style={{ color: 'var(--color-green)' }}>Hardware Timeout Engaged</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
