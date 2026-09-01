'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Radio,
  Sparkles,
  WifiOff,
  Activity
} from 'lucide-react';

export type StatusVariant =
  | 'thriving'
  | 'healthy'
  | 'optimal'
  | 'stable'
  | 'recovering'
  | 'live'
  | 'needs_attention'
  | 'attention'
  | 'warning'
  | 'critical'
  | 'danger'
  | 'insufficient_data'
  | 'unavailable'
  | 'offline'
  | 'simulation'
  | 'neutral';

interface StatusBadgeProps {
  status: StatusVariant | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
}: StatusBadgeProps) {
  const normalizedStatus = (status || '').toLowerCase().replace(/\s+/g, '_');

  const getConfig = () => {
    switch (normalizedStatus) {
      case 'thriving':
      case 'healthy':
      case 'optimal':
        return {
          bg: 'var(--bg-tint-green)',
          color: 'var(--color-green)',
          border: 'var(--border-accent-green)',
          icon: CheckCircle2,
          defaultLabel: normalizedStatus.toUpperCase(),
        };
      case 'stable':
      case 'recovering':
        return {
          bg: 'var(--bg-tint-teal)',
          color: 'var(--color-teal)',
          border: 'var(--border-accent-teal)',
          icon: Activity,
          defaultLabel: normalizedStatus.toUpperCase(),
        };
      case 'live':
        return {
          bg: 'var(--bg-tint-teal)',
          color: 'var(--color-teal)',
          border: 'var(--border-accent-teal)',
          icon: Radio,
          defaultLabel: 'ESP32 LIVE',
        };
      case 'needs_attention':
      case 'attention':
      case 'warning':
        return {
          bg: 'var(--bg-tint-amber)',
          color: 'var(--color-amber)',
          border: 'rgba(229, 169, 60, 0.35)',
          icon: AlertTriangle,
          defaultLabel: 'NEEDS ATTENTION',
        };
      case 'critical':
      case 'danger':
        return {
          bg: 'var(--bg-tint-red)',
          color: 'var(--color-red)',
          border: 'rgba(217, 93, 98, 0.35)',
          icon: AlertOctagon,
          defaultLabel: 'CRITICAL',
        };
      case 'simulation':
        return {
          bg: 'var(--bg-tint-amber)',
          color: 'var(--color-amber)',
          border: 'rgba(229, 169, 60, 0.35)',
          icon: Sparkles,
          defaultLabel: 'SIMULATION',
        };
      case 'insufficient_data':
      case 'unavailable':
      case 'offline':
        return {
          bg: 'rgba(94, 123, 116, 0.12)',
          color: 'var(--text-muted)',
          border: 'var(--border-subtle)',
          icon: WifiOff,
          defaultLabel: normalizedStatus === 'insufficient_data' ? 'INSUFFICIENT DATA' : 'UNAVAILABLE',
        };
      default:
        return {
          bg: 'rgba(94, 123, 116, 0.10)',
          color: 'var(--text-secondary)',
          border: 'var(--border-hairline)',
          icon: HelpCircle,
          defaultLabel: String(status).toUpperCase(),
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  const paddingMap = {
    sm: '2px 7px',
    md: '3px 10px',
    lg: '5px 14px',
  };

  const fontMap = {
    sm: '10px',
    md: '11px',
    lg: '12px',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: paddingMap[size],
        fontSize: fontMap[size],
        fontWeight: 700,
        borderRadius: 'var(--radius-full)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontFamily: 'var(--font-sans)',
        lineHeight: 1.2,
      }}
    >
      {showIcon && <Icon size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} />}
      <span>{displayLabel}</span>
    </span>
  );
}
