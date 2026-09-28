'use client';

import React from 'react';

interface DataSourceBadgeProps {
  mode: 'real' | 'simulation';
  isStale?: boolean;
  hasData?: boolean;
}

export function DataSourceBadge({
  mode,
  isStale = false,
  hasData = true,
}: DataSourceBadgeProps) {
  if (!hasData) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 7px',
          fontSize: '10.5px',
          fontWeight: 700,
          borderRadius: '4px',
          background: 'rgba(101, 126, 120, 0.12)',
          color: '#9DB4AE',
          border: '1px solid rgba(101, 126, 120, 0.25)',
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{ fontSize: '8px' }}>×</span>
        <span>UNAVAILABLE</span>
      </span>
    );
  }

  if (mode === 'real') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          fontSize: '10.5px',
          fontWeight: 700,
          borderRadius: '4px',
          background: isStale ? 'rgba(242, 184, 75, 0.12)' : 'rgba(32, 184, 176, 0.12)',
          color: isStale ? '#F2B84B' : '#20B8B0',
          border: `1px solid ${isStale ? 'rgba(242, 184, 75, 0.30)' : 'rgba(32, 184, 176, 0.30)'}`,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <span style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: isStale ? '#F2B84B' : '#20B8B0',
          boxShadow: isStale ? 'none' : '0 0 6px #20B8B0',
          display: 'inline-block',
        }} />
        <span>{isStale ? 'ESP32 STALE' : 'ESP32 LIVE'}</span>
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '2px 8px',
        fontSize: '10.5px',
        fontWeight: 700,
        borderRadius: '4px',
        background: 'rgba(242, 184, 75, 0.12)',
        color: '#F2B84B',
        border: '1px solid rgba(242, 184, 75, 0.30)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      <span style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: '#F2B84B',
        display: 'inline-block',
      }} />
      <span>SIMULATION</span>
    </span>
  );
}
