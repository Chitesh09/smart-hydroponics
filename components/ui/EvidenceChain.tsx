'use client';

import React from 'react';

export interface EvidenceStep {
  stage: string;
  stageLabel?: string;
  headline: string;
  detail: React.ReactNode;
  status?: 'optimal' | 'warning' | 'critical' | 'neutral';
}

interface EvidenceChainProps {
  steps: EvidenceStep[];
  confidenceScore?: number;
  confidenceText?: string;
  confidenceLabel?: string;
}

export function EvidenceChain({
  steps,
  confidenceScore,
  confidenceText,
  confidenceLabel = 'Confidence',
}: EvidenceChainProps) {
  if (!steps || steps.length === 0) {
    return null;
  }

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'OBSERVATIONS':
      case 'CAMERA OBSERVATION':
        return 'OPTICAL';
      case 'ENVIRONMENT':
      case 'SENSOR OBSERVATION':
        return 'SENSORS';
      case 'HISTORICAL CONTEXT':
      case 'HISTORICAL TREND':
      case 'HISTORICAL CHANGE':
        return 'HISTORY';
      case 'ASSOCIATIONS':
        return 'CORRELATION';
      case 'REASONING':
      case 'INTERPRETATION':
        return 'INFERENCE';
      case 'RECOMMENDATION':
      case 'ACTION':
        return 'ACTION';
      case 'LIMITATIONS':
        return 'BOUNDS';
      default:
        return 'EVIDENCE';
    }
  };

  const getStatusColor = (status?: EvidenceStep['status']) => {
    if (status === 'critical') return 'var(--color-red)';
    if (status === 'warning') return 'var(--color-amber)';
    if (status === 'optimal') return 'var(--color-green)';
    return 'var(--text-muted)';
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
        width: '100%',
      }}
    >
      {/* Evidence Chain Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <span
          style={{
            fontSize: '0.6875rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
          }}
        >
          EVIDENCE CHAIN & REASONING TRACE
        </span>

        {(confidenceScore !== undefined || confidenceText) && (
          <span
            style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              color: 'var(--color-teal)',
            }}
          >
            {confidenceLabel}: {confidenceScore !== undefined ? `${confidenceScore}%` : confidenceText}
          </span>
        )}
      </div>

      {/* Step Nodes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {steps.map((step, idx) => {
          const statusColor = getStatusColor(step.status);
          const stageBadge = getStageBadge(step.stage);

          return (
            <div
              key={idx}
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-xs, 2px)',
                padding: '0.875rem 1rem',
                display: 'grid',
                gridTemplateColumns: '80px 1fr',
                gap: '1rem',
                alignItems: 'flex-start',
              }}
            >
              {/* Left Column: Stage Badge */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span
                  style={{
                    fontSize: '0.5625rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '2px',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-surface)',
                    color: statusColor,
                    textAlign: 'center',
                  }}
                >
                  {stageBadge}
                </span>
                <span
                  style={{
                    fontSize: '0.5625rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--text-dim)',
                    textAlign: 'center',
                  }}
                >
                  STEP 0{idx + 1}
                </span>
              </div>

              {/* Right Column: Finding Headline & Detail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      lineHeight: 1.3,
                    }}
                  >
                    {step.stageLabel || step.stage}: {step.headline}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                  }}
                >
                  {step.detail}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
