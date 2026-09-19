'use client';

import React from 'react';
import {
  Eye,
  Thermometer,
  TrendingUp,
  Brain,
  CheckCircle,
  ArrowDown,
  AlertCircle
} from 'lucide-react';

export type EvidenceStage =
  | 'CAMERA OBSERVATION'
  | 'SENSOR OBSERVATION'
  | 'HISTORICAL CHANGE'
  | 'INTERPRETATION'
  | 'RECOMMENDATION'
  | 'OBSERVATION'
  | 'ENVIRONMENT'
  | 'HISTORICAL TREND'
  | 'ACTION';

export interface EvidenceStep {
  stage: EvidenceStage;
  stageLabel?: string;
  headline: string;
  detail: string;
  status?: 'optimal' | 'warning' | 'critical' | 'neutral';
}

interface EvidenceChainProps {
  steps: EvidenceStep[];
  confidenceScore?: number;
  confidenceText?: string;
  confidenceLabel?: string;
}

export function EvidenceChain({ steps, confidenceScore, confidenceText, confidenceLabel = 'Confidence' }: EvidenceChainProps) {
  const getIconForStage = (stage: EvidenceStage) => {
    switch (stage) {
      case 'CAMERA OBSERVATION':
      case 'OBSERVATION':
        return Eye;
      case 'SENSOR OBSERVATION':
      case 'ENVIRONMENT':
        return Thermometer;
      case 'HISTORICAL CHANGE':
      case 'HISTORICAL TREND':
        return TrendingUp;
      case 'INTERPRETATION':
        return Brain;
      case 'RECOMMENDATION':
      case 'ACTION':
        return CheckCircle;
      default:
        return AlertCircle;
    }
  };

  const getStageColor = (stage: EvidenceStage, status?: EvidenceStep['status']) => {
    if (status === 'critical') return 'var(--color-red)';
    if (status === 'warning') return 'var(--color-amber)';
    if (status === 'optimal') return 'var(--color-green)';
    if (stage === 'RECOMMENDATION' || stage === 'ACTION') return 'var(--color-green)';
    if (stage === 'INTERPRETATION') return 'var(--color-teal)';
    return 'var(--text-secondary)';
  };

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
      {steps.map((step, idx) => {
        const Icon = getIconForStage(step.stage);
        const stageColor = getStageColor(step.stage, step.status);
        const isLast = idx === steps.length - 1;

        return (
          <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
            {/* Step Node */}
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '12px 16px',
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius-xs)',
                  background: 'var(--bg-surface)',
                  border: `1px solid ${stageColor}`,
                  color: stageColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Icon size={16} />
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      color: stageColor,
                      textTransform: 'uppercase',
                    }}
                  >
                    {step.stageLabel || step.stage}
                  </span>
                  {idx === 0 && (confidenceText || confidenceScore !== undefined) && (
                    <span className="scientific-meta" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {confidenceLabel}: {confidenceText || `${confidenceScore}%`}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>
                  {step.headline}
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {step.detail}
                </div>
              </div>
            </div>

            {/* Connecting Arrow */}
            {!isLast && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px 0',
                  color: 'var(--text-dim)',
                }}
              >
                <ArrowDown size={14} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
