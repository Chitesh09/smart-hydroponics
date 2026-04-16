'use client';

import { ReactNode } from 'react';
import styles from './SensorCard.module.css';

interface SensorCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  status?: 'optimal' | 'warning' | 'danger';
  subtitle?: string;
}

export function SensorCard({ title, value, unit, icon, trend, status = 'optimal', subtitle }: SensorCardProps) {
  const statusColor = {
    optimal: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  }[status];

  return (
    <div className={`glass-card ${styles.card} ${styles[`status-${status}`]}`}>
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.iconWrapper} style={{ color: statusColor }}>
          {icon}
        </div>
      </div>
      
      <div className={styles.body}>
        <div className={styles.valueWrapper}>
          <span className={styles.value} style={{ color: statusColor }}>{value}</span>
          <span className={styles.unit}>{unit}</span>
        </div>
        
        {trend && (
          <div className={styles.trend}>
            {trend === 'up' && <span className={styles.trendUp}>↑</span>}
            {trend === 'down' && <span className={styles.trendDown}>↓</span>}
            {trend === 'stable' && <span className={styles.trendStable}>-</span>}
          </div>
        )}
      </div>

      {subtitle && <div className={styles.footer}>{subtitle}</div>}
    </div>
  );
}
