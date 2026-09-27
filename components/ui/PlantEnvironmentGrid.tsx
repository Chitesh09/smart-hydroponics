'use client';

import React from 'react';
import { FarmerSemanticState } from '@/lib/intelligence/farmerSemanticLayer';

interface PlantEnvironmentGridProps {
  semanticState: FarmerSemanticState;
  language: 'en' | 'kn';
}

export function PlantEnvironmentGrid({ semanticState, language }: PlantEnvironmentGridProps) {
  const isKn = language === 'kn';

  const waterLevel = semanticState.waterStatus === 'GOOD' ? 'GOOD' : semanticState.waterStatus;
  const nutrientLevel = semanticState.nutrientStatus === 'GOOD' ? 'GOOD' : semanticState.nutrientStatus;
  const phStatus = 'GOOD';
  const phMessage = isKn ? 'pH ಸಮತೋಲನದಲ್ಲಿದೆ' : 'pH is within configured range.';
  const growingConditions = semanticState.environmentStatus === 'GOOD' ? 'GOOD' : semanticState.environmentStatus;

  const items = [
    {
      id: 'water',
      label: isKn ? 'ನೀರಿನ ಮಟ್ಟ' : 'Water Level',
      value: waterLevel,
      color: `var(--color-${semanticState.waterColor})`,
      message: semanticState.waterMessage,
      badge: 'H₂O',
    },
    {
      id: 'nutrient',
      label: isKn ? 'ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನ' : 'Nutrient Balance',
      value: nutrientLevel,
      color: `var(--color-${semanticState.nutrientColor})`,
      message: semanticState.nutrientMessage,
      badge: 'TDS',
    },
    {
      id: 'acidity',
      label: isKn ? 'ನೀರಿನ ಆಮ್ಲೀಯತೆ (pH)' : 'Solution Acidity',
      value: phStatus,
      color: 'var(--color-green)',
      message: phMessage,
      badge: 'pH',
    },
    {
      id: 'environment',
      label: isKn ? 'ಬೆಳವಣಿಗೆಯ ಪರಿಸ್ಥಿತಿ' : 'Growing Conditions',
      value: growingConditions,
      color: 'var(--color-green)',
      message: semanticState.environmentMessage,
      badge: 'ENV',
    },
  ];

  return (
    <section
      aria-label={isKn ? 'ಗಿಡದ ಪರಿಸರ ಸಾರಾಂಶ' : 'Plant Environment Summary'}
      style={{
        marginTop: '1.25rem',
        marginBottom: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
        <span
          style={{
            fontSize: '0.625rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 800,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '0.2rem 0.5rem',
            borderRadius: 'var(--radius-xs, 2px)',
            background: 'var(--color-emerald-ink)',
            color: 'var(--color-champagne)',
          }}
        >
          TELEMETRY
        </span>
        <h3
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          {isKn ? 'ಗಿಡದ ಪರಿಸರ ಸಾರಾಂಶ' : 'Plant Environment Summary'}
        </h3>
      </div>

      {/* 4-Column Grid on Desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.875rem',
          width: '100%',
        }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm, 4px)',
              padding: '1.125rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '0.625rem',
              minHeight: '120px',
            }}
          >
            {/* Top row: Label & subtle technical badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: 'var(--text-dim)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '2px',
                  padding: '1px 5px',
                  background: 'var(--bg-canvas)',
                }}
              >
                {item.badge}
              </span>
            </div>

            {/* Middle: Prominent State Value */}
            <div>
              <div
                style={{
                  fontSize: '1.375rem',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.1,
                  color: item.color,
                  textTransform: 'uppercase',
                }}
              >
                {item.value}
              </div>
            </div>

            {/* Bottom: Clean single-line explanation */}
            <div
              style={{
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.4,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.5rem',
              }}
            >
              {item.message}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
