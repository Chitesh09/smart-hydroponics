'use client';

import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';

interface EmptyStateProps {
  icon?: LucideIcon;
  useBrandLogo?: boolean;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export function EmptyState({
  icon: Icon = HelpCircle,
  useBrandLogo = false,
  title,
  description,
  action,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '36px 20px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        gap: '12px',
      }}
    >
      {useBrandLogo ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '4px',
          }}
        >
          <BrandLogo size={42} variant="watermark" />
        </div>
      ) : (
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'rgba(101, 126, 120, 0.12)',
            border: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}
        >
          <Icon size={22} />
        </div>
      )}

      <div style={{ maxWidth: '360px' }}>
        <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
          {title}
        </h4>
        <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>

      {action && (
        <button
          className="btn btn-secondary"
          style={{ fontSize: '12.5px', marginTop: '6px' }}
          onClick={action.onClick}
        >
          {ActionIcon && <ActionIcon size={14} />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
}
