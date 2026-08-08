'use client';

import { Cpu, HardDrive, Layers, Zap } from 'lucide-react';
import styles from './page.module.css';

export default function HardwarePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary mb-sm">Hardware Architecture</h1>
        <p className="text-secondary">Physical sensor nodes, channel wiring, and serial data flow.</p>
      </div>

      {/* Central Architecture Flow Diagram */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h2 className="text-lg font-bold mb-lg" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={18} className="text-primary" /> Core System Schematic
        </h2>

        {/* 1. Desktop Architecture Diagram (Hidden on Mobile) */}
        <div className={styles.desktopDiagram} style={{ position: 'relative', width: '100%', padding: '16px 0' }}>
          <svg viewBox="0 0 800 240" style={{ width: '100%', height: 'auto' }}>
            <defs>
              <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#00E5FF" />
              </marker>
            </defs>

            {/* Sensor Blocks */}
            <rect x="20" y="20" width="160" height="48" rx="4" fill="#0D1B2A" stroke="rgba(255, 255, 255, 0.08)" />
            <text x="35" y="48" fill="#F4F7FB" fontSize="12" fontWeight="700">pH Electrode Probe</text>
            <text x="35" y="60" fill="#8FA3B8" fontSize="9">Analog input (Pin VP / ADC)</text>

            <rect x="20" y="96" width="160" height="48" rx="4" fill="#0D1B2A" stroke="rgba(255, 255, 255, 0.08)" />
            <text x="35" y="124" fill="#F4F7FB" fontSize="12" fontWeight="700">TDS Conductivity Probe</text>
            <text x="35" y="136" fill="#8FA3B8" fontSize="9">Analog input (Pin 34 / ADC)</text>

            <rect x="20" y="172" width="160" height="48" rx="4" fill="#0D1B2A" stroke="rgba(255, 255, 255, 0.08)" />
            <text x="35" y="200" fill="#F4F7FB" fontSize="12" fontWeight="700">HC-SR04 Ultrasonic</text>
            <text x="35" y="212" fill="#8FA3B8" fontSize="9">Digital (Pins 12 Trig / 13 Echo)</text>

            {/* Central ESP32 Controller */}
            <rect x="320" y="80" width="180" height="80" rx="6" fill="#10253A" stroke="#00E5FF" strokeWidth="1.5" />
            <text x="345" y="115" fill="#00E5FF" fontSize="15" fontWeight="800">ESP32 Core</text>
            <text x="345" y="132" fill="#F4F7FB" fontSize="11" fontWeight="600">32-bit Tensilica MCU</text>
            <text x="345" y="146" fill="#8FA3B8" fontSize="9">JSON Conversion & Serial Tx</text>

            {/* Dashboard Output Block */}
            <rect x="620" y="96" width="160" height="48" rx="4" fill="#0D1B2A" stroke="#B7FF3C" strokeWidth="1" />
            <text x="635" y="124" fill="#B7FF3C" fontSize="12" fontWeight="700">Web Dashboard</text>
            <text x="635" y="136" fill="#8FA3B8" fontSize="9">Web Serial parser API</text>

            {/* Flow Arrows */}
            <path d="M 180 44 L 250 44 L 250 100 L 320 100" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <path d="M 180 120 L 320 120" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" markerEnd="url(#arrow)" />
            <path d="M 180 196 L 250 196 L 250 140 L 320 140" fill="none" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" markerEnd="url(#arrow)" />
            
            <path d="M 500 120 L 620 120" fill="none" stroke="#00E5FF" strokeWidth="2" strokeDasharray="4 2" markerEnd="url(#arrow)" />
            <text x="515" y="112" fill="#00E5FF" fontSize="9" fontFamily="var(--font-mono)">115200 Baud</text>
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
            <div className={styles.flowCardTitle} style={{ color: '#00E5FF' }}>ESP32 Microcontroller Core</div>
            <div className={styles.flowCardDesc}>Aggregates telemetry, formats to JSON lines, and transmits</div>
          </div>
          <div className={styles.flowArrow} style={{ color: '#00E5FF' }}>↓ (115200 Baud Serial)</div>

          <div className={styles.flowCard} style={{ borderColor: '#B7FF3C' }}>
            <div className={styles.flowCardTitle} style={{ color: '#B7FF3C' }}>Web Dashboard Console</div>
            <div className={styles.flowCardDesc}>Receives telemetry packets in browser state</div>
          </div>
        </div>
      </div>

      {/* Component Details Card List */}
      <div className="grid-2">
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Cpu size={20} className="text-primary" />
            <h3 className="text-md font-bold">ESP32 MCU Specifications</h3>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)', paddingLeft: '20px' }}>
            <li><strong>CPU:</strong> Xtensa Dual-Core 32-bit LX6 running at 240 MHz.</li>
            <li><strong>RAM:</strong> 520 KB SRAM on-chip, optimized for handling concurrent tasks.</li>
            <li><strong>Baud Rate:</strong> 115200 bps Serial over USB, delivering low latency packets.</li>
            <li><strong>Datalogger Format:</strong> JSON Lines text formatting (1 reading per second).</li>
          </ul>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Zap size={20} className="text-accent" />
            <h3 className="text-md font-bold">Ultrasonic Calibration & Level</h3>
          </div>
          <p className="text-sm text-secondary mb-md">
            The HC-SR04 sensor measures the distance from the top of the reservoir lid down to the water surface. 
            A smaller measured distance represents a higher water level.
          </p>
          <div style={{ background: 'rgba(7, 17, 31, 0.5)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: '#00E5FF' }}>Calibration:</span><br />
            Empty Tank Distance = 60.0 cm<br />
            Full Tank Distance = 10.0 cm<br />
            Percent Level = ((60 - Distance) / 50) * 100%
          </div>
        </div>
      </div>

      {/* Sensor Calibration Overview */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HardDrive size={18} className="text-primary" /> Sensor Modules List
        </h3>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Hardware Module</th>
                <th>Pin Interface</th>
                <th>Target Range</th>
                <th>Data Representation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>pH Electrode Module</strong></td>
                <td>ADC (VP/36)</td>
                <td>5.5 – 6.5 pH</td>
                <td>Logarithmic Hydrogen Ion Potential</td>
              </tr>
              <tr>
                <td><strong>TDS Conductivity Module</strong></td>
                <td>ADC (34)</td>
                <td>800 – 1200 PPM</td>
                <td>Nutrient Salt Concentration (PPM)</td>
              </tr>
              <tr>
                <td><strong>HC-SR04 Ultrasonic</strong></td>
                <td>GPIO 12 (Trig) / 13 (Echo)</td>
                <td>Distance: 10 - 60 cm</td>
                <td>Water Level Percentage & Surface Offset</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
