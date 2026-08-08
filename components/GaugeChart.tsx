'use client';

import { useAnimatedNumber } from '@/lib/hooks/useAnimatedNumber';
import styles from './GaugeChart.module.css';

interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  optimalMin: number;
  optimalMax: number;
  label: string;
  unit: string;
  colorPrimary?: string;
}

export function GaugeChart({
  value,
  min,
  max,
  optimalMin,
  optimalMax,
  label,
  unit,
  colorPrimary = '#00d4aa'
}: GaugeChartProps) {
  // Interpolate numerical value for central display readout
  const animatedValue = useAnimatedNumber(value, 600);

  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate percentage (0 to 1) based on display value
  const percent = Math.max(0, Math.min(1, (animatedValue - min) / (max - min)));
  
  // The gauge uses 240 degrees out of 360 (which is 2/3 of the circle)
  // Rotate it so the gap is at the bottom
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (percent * circumference * 0.666);
  
  // Calculate optimal range markers
  const optimalMinPercent = (optimalMin - min) / (max - min);
  const optimalMaxPercent = (optimalMax - min) / (max - min);

  // Status color logic based on optimal ranges
  let statusColor = colorPrimary;
  if (value < optimalMin) statusColor = '#f59e0b';
  if (value > optimalMax) statusColor = '#ef4444';

  return (
    <div className={styles.gaugeContainer}>
      <svg width="100%" height="100%" viewBox="0 0 160 160" className={styles.svg}>
        {/* Background track */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={styles.track}
        />
        
        {/* Optimal range indicator (background line) */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke="rgba(34, 197, 94, 0.2)"
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeDasharray={`${circumference * 0.666 * (optimalMaxPercent - optimalMinPercent)} ${circumference}`}
          strokeDashoffset={-(circumference * 0.666 * optimalMinPercent) + (circumference * 0.166)}
          className={styles.optimalTrack}
        />

        {/* Value indicator */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={statusColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={styles.valueTrack}
        />
        
        {/* Glow effect */}
        <circle
          cx="80" cy="80" r={radius}
          fill="none"
          stroke={statusColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={styles.glowTrack}
        />
      </svg>
      
      <div className={styles.content}>
        <div className={styles.value} style={{ color: statusColor }}>
          {animatedValue.toFixed(1)}
        </div>
        <div className={styles.label}>{label}</div>
        <div className={styles.unit}>{unit}</div>
      </div>
    </div>
  );
}
