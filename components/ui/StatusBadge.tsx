'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Radio,
  Sparkles,
  WifiOff
} from 'lucide-react';

export type StatusVariant =
  | 'healthy'
  | 'optimal'
  | 'stable'
  | 'live'
  | 'attention'
  | 'warning'
  | 'critical'
  | 'danger'
  | 'unavailable'
  | 'offline'
  | 'simulation'
  | 'neutral';

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
}: StatusBadgeProps) {
  const getVariantStyles = () => {
    switch (status) {
      case 'healthy':
      case 'optimal':
      case 'stable':
        return {
          bg: 'rgba(57, 184, 111, 0.12)',
          color: '#39B86F',
          border: 'rgba(57, 184, 111, 0.30)',
          icon: CheckCircle2,
          defaultLabel: 'Optimal',
        };
      case 'live':
        return {
          bg: 'rgba(32, 184, 176, 0.12)',
          color: '#20B8B0',
          border: 'rgba(32, 184, 176, 0.30)',
          icon: Radio,
          defaultLabel: 'Live Stream',
        };
      case 'attention':
      case 'warning':
        return {
          bg: 'rgba(242, 184, 75, 0.12)',
          color: '#F2B84B',
          border: 'rgba(242, 184, 75, 0.30)',
          icon: AlertTriangle,
          defaultLabel: 'Attention',
        };
      case 'critical':
      case 'danger':
        return {
          bg: 'rgba(229, 107, 111, 0.12)',
          color: '#E56B6F',
          border: 'rgba(229, 107, 111, 0.30)',
          icon: AlertOctagon,
          defaultLabel: 'Critical',
        };
      case 'simulation':
        return {
          bg: 'rgba(242, 184, 75, 0.12)',
          color: '#F2B84B',
          border: 'rgba(242, 184, 75, 0.30)',
          icon: Sparkles,
          defaultLabel: 'Simulation Mode',
        };
      case 'unavailable':
      case 'offline':
        return {
          bg: 'rgba(101, 126, 120, 0.12)',
          color: '#9DB4AE',
          border: 'rgba(101, 126, 120, 0.25)',
          icon: WifiOff,
          defaultLabel: 'Unavailable',
        };
      default:
        return {
          bg: 'rgba(133, 160, 154, 0.10)',
          color: '#9DB4AE',
          border: 'rgba(255, 255, 255, 0.08)',
          icon: HelpCircle,
          defaultLabel: status,
        };
    }
  };

  const config = getVariantStyles();
  const Icon = config.icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '2px 6px' : '3px 9px',
        fontSize: size === 'sm' ? '10px' : '11px',
        fontWeight: 700,
        borderRadius: '4px',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontFamily: 'var(--font-sans)',
      }}
    >
      {showIcon && <Icon size={size === 'sm' ? 11 : 12} />}
      <span>{displayLabel}</span>
    </span>
  );
}
