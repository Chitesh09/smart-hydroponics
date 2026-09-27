'use client';

import React, { useState } from 'react';
import { PlantAlert } from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';
import {
  getLocalizedAlert,
  getLocalizedAlertSeverity,
  getLocalizedAlertCategory,
  getLocalizedAlertStatus,
} from '@/lib/intelligence/farmerSemanticLayer';

export interface PlantAlertCardProps {
  alert: PlantAlert;
  mode?: AssistantMode;
  language?: SupportedLanguageCode;
  onDismiss?: (alertId: string) => void;
  onAcknowledge?: (alertId: string) => void;
  compact?: boolean;
}

export const PlantAlertCard: React.FC<PlantAlertCardProps> = ({
  alert,
  mode = 'farmer',
  language = 'en',
  onDismiss,
  onAcknowledge,
  compact = false,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const loc = getLocalizedAlert(alert, language);
  const severityLabel = getLocalizedAlertSeverity(alert.severity, language);
  const categoryLabel = getLocalizedAlertCategory(alert.category, language);
  const statusLabel = getLocalizedAlertStatus(alert.status, language);

  const isUrgent = alert.severity === 'URGENT';
  const isAttention = alert.severity === 'ATTENTION';

  const severityColor = isUrgent
    ? 'var(--color-red)'
    : isAttention
    ? 'var(--color-amber)'
    : 'var(--color-teal)';

  const formattedTime = new Date(alert.lastDetectedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Compact View
  if (compact) {
    return (
      <div
        style={{
          padding: '0.875rem 1rem',
          borderRadius: 'var(--radius-xs, 2px)',
          border: `1px solid ${severityColor}`,
          background: 'var(--bg-surface)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '0.1rem 0.4rem',
                borderRadius: '2px',
                border: `1px solid ${severityColor}`,
                color: severityColor,
                background: 'var(--bg-canvas)',
              }}
            >
              {severityLabel}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{categoryLabel}</span>
            <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-dim)' }}>
              {formattedTime}
            </span>
          </div>
          <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {loc.title}
          </h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
            {loc.farmerMessage}
          </p>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={() => onDismiss(alert.id)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 800,
              padding: '0.2rem 0.4rem',
            }}
            title={language === 'kn' ? 'ವಜಾಗೊಳಿಸಿ' : 'Dismiss'}
          >
            ×
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 'var(--radius-sm, 4px)',
        border: `1px solid ${severityColor}`,
        background: 'var(--bg-surface)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '0.2rem 0.5rem',
              borderRadius: '2px',
              border: `1px solid ${severityColor}`,
              color: severityColor,
              background: 'var(--bg-canvas)',
            }}
          >
            {severityLabel}
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              padding: '0.15rem 0.4rem',
              borderRadius: '2px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-canvas)',
              color: 'var(--text-secondary)',
            }}
          >
            {categoryLabel}
          </span>
          {alert.occurrenceCount > 1 && (
            <span
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--text-muted)',
              }}
            >
              {language === 'kn' ? `${alert.occurrenceCount} ಬಾರಿ ಪತ್ತೆ` : `${alert.occurrenceCount}x detected`}
            </span>
          )}
          <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-dim)' }}>
            {formattedTime}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {onAcknowledge && alert.status === 'ACTIVE' && (
            <button
              type="button"
              onClick={() => onAcknowledge(alert.id)}
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                fontFamily: 'var(--font-mono, monospace)',
                padding: '0.25rem 0.65rem',
                borderRadius: '2px',
                border: '1px solid var(--border-default)',
                background: 'var(--bg-canvas)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
              }}
            >
              {language === 'kn' ? 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ' : 'Acknowledge'}
            </button>
          )}
          {onDismiss && alert.status !== 'DISMISSED' && (
            <button
              type="button"
              onClick={() => onDismiss(alert.id)}
              style={{
                fontSize: '0.875rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '0.2rem 0.4rem',
              }}
              title={language === 'kn' ? 'ವಜಾಗೊಳಿಸಿ' : 'Dismiss'}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Title */}
      <h3
        style={{
          fontSize: '1rem',
          fontWeight: 800,
          color: 'var(--text-primary)',
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        {loc.title}
      </h3>

      {/* Structured Farmer Presentation: What, Why, Action */}
      <div
        style={{
          background: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xs, 2px)',
          padding: '1rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {language === 'kn' ? 'ಏನು ಸಂಭವಿಸಿದೆ?' : 'WHAT IS HAPPENING'}
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
            {loc.farmerMessage}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--color-amber)',
            }}
          >
            {language === 'kn' ? 'ಏಕೆ ಹೀಗಾಗಿದೆ?' : 'WHY AM I SEEING THIS'}
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
            {loc.farmerWhy}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 800,
              textTransform: 'uppercase',
              color: 'var(--color-emerald-ink)',
            }}
          >
            {language === 'kn' ? 'ಮುಂದಿನ ಕ್ರಮ' : 'RECOMMENDED ACTION'}
          </span>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.45 }}>
            {loc.farmerAction}
          </p>
        </div>
      </div>

      {loc.limitation && (
        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
          Note: {loc.limitation}
        </div>
      )}

      {/* Technical Mode Toggle & Diagnostic Panel */}
      {(mode === 'technical' || showTechnicalDetails) && (
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.625rem',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '0.5rem',
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            <div style={{ background: 'var(--bg-canvas)', padding: '0.5rem', border: '1px solid var(--border-default)', borderRadius: '2px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.5625rem' }}>METRIC</span>
              <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{alert.metric || 'general'}</span>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '0.5rem', border: '1px solid var(--border-default)', borderRadius: '2px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.5625rem' }}>MEASURED</span>
              <span style={{ fontWeight: 700, color: 'var(--color-green)' }}>{alert.currentValue ?? '--'}</span>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '0.5rem', border: '1px solid var(--border-default)', borderRadius: '2px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.5625rem' }}>BASELINE</span>
              <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>{alert.baselineValue ?? '--'}</span>
            </div>
            <div style={{ background: 'var(--bg-canvas)', padding: '0.5rem', border: '1px solid var(--border-default)', borderRadius: '2px' }}>
              <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.5625rem' }}>THRESHOLD</span>
              <span style={{ fontWeight: 700, color: 'var(--color-amber)' }}>{alert.threshold ?? '--'}</span>
            </div>
          </div>

          <div
            style={{
              background: 'var(--bg-canvas)',
              padding: '0.625rem 0.75rem',
              borderRadius: '2px',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono, monospace)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>TRIGGER: {alert.triggerType}</span>
              <span style={{ color: 'var(--color-teal)', fontWeight: 700 }}>CONFIDENCE: {alert.confidence}</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>
              LOG: {alert.technicalMessage}
            </div>
          </div>
        </div>
      )}

      {/* Technical Diagnostics Toggle (for farmer mode) */}
      {mode === 'farmer' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {showTechnicalDetails
              ? (language === 'kn' ? 'ತಾಂತ್ರಿಕ ವಿವರಗಳನ್ನು ಮರೆಮಾಡಿ ↑' : 'Hide technical diagnostics ↑')
              : (language === 'kn' ? 'ತಾಂತ್ರಿಕ ವಿವರಗಳು ↓' : 'Diagnostic telemetry details ↓')}
          </button>
        </div>
      )}
    </div>
  );
};
