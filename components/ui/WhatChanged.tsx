'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, History } from 'lucide-react';

export interface MetricDelta {
  parameter: string;
  unit: string;
  delta: number;
  direction: 'rising' | 'falling' | 'stable';
  isBeneficial?: boolean;
}

interface WhatChangedProps {
  deltas: MetricDelta[];
  hasHistory: boolean;
}

export function WhatChanged({ deltas, hasHistory }: WhatChangedProps) {
  if (!hasHistory || deltas.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
        }}
      >
        <History size={16} style={{ color: 'var(--text-muted)' }} />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span className="section-label">What Changed Today</span>
          <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Building baseline telemetry — historical deltas will appear after multiple observation cycles.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '16px 20px',
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="section-label">What Changed Today (24h Trajectory)</span>
        <span className="scientific-meta">Measured Deltas</span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginTop: '4px',
        }}
      >
        {deltas.map((item, idx) => {
          const isUp = item.direction === 'rising';
          const isDown = item.direction === 'falling';
          const deltaSign = item.delta > 0 ? '+' : '';
          
          let deltaColor = 'var(--text-secondary)';
          if (item.isBeneficial !== undefined) {
            deltaColor = item.isBeneficial ? 'var(--color-green)' : 'var(--color-amber)';
          }

          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                padding: '8px 12px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {item.parameter}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isUp ? (
                  <ArrowUpRight size={15} style={{ color: deltaColor }} />
                ) : isDown ? (
                  <ArrowDownRight size={15} style={{ color: deltaColor }} />
                ) : (
                  <Minus size={15} style={{ color: 'var(--text-muted)' }} />
                )}
                <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {deltaSign}{item.delta.toFixed(item.parameter === 'pH' ? 2 : 1)} {item.unit}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
