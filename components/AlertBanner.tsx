'use client';

import { AlertTriangle, X, Info, CheckCircle, AlertOctagon } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from './AlertBanner.module.css';

export interface AlertData {
  id: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  title: string;
  message: string;
  timestamp: number;
}

interface AlertBannerProps {
  alert: AlertData;
  onDismiss?: (id: string) => void;
  autoDismiss?: boolean;
}

export function AlertBanner({ alert, onDismiss, autoDismiss = true }: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [alert.id, autoDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(alert.id);
    }, 300); // match fade-out transition duration
  };

  const Icon = {
    info: Info,
    warning: AlertTriangle,
    danger: AlertOctagon,
    success: CheckCircle,
  }[alert.type];

  if (!isVisible) return null;

  return (
    <div className={`${styles.banner} ${styles[`type-${alert.type}`]} animate-slide-in`}>
      <div className={styles.iconWrapper}>
        <Icon size={20} />
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <span className={styles.title}>{alert.title}</span>
          <span className={styles.time}>
             {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <div className={styles.message}>{alert.message}</div>
      </div>

      {onDismiss && (
        <button onClick={handleDismiss} className={styles.dismissBtn}>
          <X size={16} />
        </button>
      )}
    </div>
  );
}
