'use client';

import React, { useState } from 'react';
import {
  CorrelationAnalysisSummary,
  EnvironmentPlantAssociation,
} from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';
import {
  getLocalizedCorrelationSummary,
  getLocalizedAssociation,
  getLocalizedAssociationType,
  getLocalizedAssociationStrength,
} from '@/lib/intelligence/farmerSemanticLayer';
import styles from './EnvironmentPlantCard.module.css';

interface EnvironmentPlantCardProps {
  summary?: CorrelationAnalysisSummary | null;
  associations?: EnvironmentPlantAssociation[];
  language?: SupportedLanguageCode;
  userMode?: AssistantMode;
  onUserModeChange?: (mode: AssistantMode) => void;
  className?: string;
}

function formatHumanLabel(raw: string, isKn: boolean): string {
  if (!raw) return isKn ? 'ಲಭ್ಯವಿಲ್ಲ' : 'Unspecified Metric';
  const lower = raw.toLowerCase().replace(/[_\-\s]/g, '');

  if (lower.includes('tds') || lower.includes('nutrient')) {
    return isKn ? 'ಪೋಷಕಾಂಶಗಳ ಸಾಂದ್ರತೆ (TDS)' : 'Total Dissolved Solids (TDS)';
  }
  if (lower.includes('water') || lower.includes('reservoir')) {
    return isKn ? 'ತೊಟ್ಟಿಯ ನೀರಿನ ಮಟ್ಟ' : 'Reservoir Water Level';
  }
  if (lower.includes('ph') || lower.includes('acidity')) {
    return isKn ? 'ದ್ರಾವಣದ ಆಮ್ಲೀಯತೆ (pH)' : 'Solution Acidity (pH)';
  }
  if (lower.includes('visual') || lower.includes('health') || lower.includes('foliage')) {
    return isKn ? 'ಎಲೆಗಳ ದೃಶ್ಯ ಆರೋಗ್ಯ' : 'Visual Foliage Health';
  }
  if (lower.includes('canopy') || lower.includes('area') || lower.includes('coverage')) {
    return isKn ? 'ಎಲೆಗಳ ವ್ಯಾಪ್ತಿ ಪ್ರದೇಶ' : 'Canopy Coverage Area';
  }
  if (lower.includes('chlorosis') || lower.includes('yellow')) {
    return isKn ? 'ಎಲೆಗಳ ಹಳದಿ ಬಣ್ಣ (ಕ್ಲೋರೋಸಿಸ್)' : 'Foliar Chlorosis Ratio';
  }

  // Fallback: title-case human string, stripping camelCase
  return raw
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_\-]+/g, ' ')
    .trim()
    .replace(/^./, (str) => str.toUpperCase());
}

export function EnvironmentPlantCard({
  summary,
  associations = summary?.associations || [],
  language = 'en',
  userMode = 'farmer',
  className = '',
}: EnvironmentPlantCardProps) {
  const [isLimitationsOpen, setIsLimitationsOpen] = useState(false);
  const isKn = language === 'kn';

  const localizedSummary = summary ? getLocalizedCorrelationSummary(summary, language) : null;
  const primaryAssoc = summary?.primaryAssociation || (associations.length > 0 ? associations[0] : null);
  const activeAssoc = primaryAssoc;
  const localizedAssoc = activeAssoc ? getLocalizedAssociation(activeAssoc, language) : null;

  // Human-readable labels
  const envMetricName = activeAssoc ? formatHumanLabel(activeAssoc.environmentMetric || activeAssoc.environmentLabel, isKn) : (isKn ? 'ಪರಿಸರ ಅಳತೆ' : 'Nutrient & Water Chemistry');
  const plantMetricName = activeAssoc ? formatHumanLabel(activeAssoc.plantMetric || activeAssoc.plantLabel, isKn) : (isKn ? 'ಸಸ್ಯದ ಆರೋಗ್ಯ' : 'Visual Foliage Condition');

  return (
    <section
      aria-label={isKn ? 'ಪರಿಸರ ↔ ಸಸ್ಯ ಪರಸ್ಪರ ಸಂಬಂಧ' : 'Environment to Plant Correlation'}
      className={className}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm, 4px)',
        overflow: 'hidden',
        width: '100%',
        marginTop: '1.25rem',
        marginBottom: '1.25rem',
      }}
    >
      {/* ── 1. Header Bar ── */}
      <div
        style={{
          padding: '1.125rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '0.2rem 0.5rem',
                borderRadius: '2px',
                background: 'var(--color-emerald-ink)',
                color: 'var(--color-champagne)',
              }}
            >
              SYNTHESIS
            </span>
            <h2
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                letterSpacing: '-0.01em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {isKn ? 'ಪರಿಸರ ↔ ಸಸ್ಯ ಪರಸ್ಪರ ಸಂಬಂಧ' : 'Environment ↔ Plant Correlation'}
            </h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            {isKn
              ? 'ನೀರಿನ ಸಂವೇದಕಗಳು ಮತ್ತು ಎಲೆಗಳ ದೃಶ್ಯ ಬದಲಾವಣೆಗಳ ಸಾಕ್ಷ್ಯಾಧಾರಿತ ವಿಶ್ಲೇಷಣೆ.'
              : 'Evidence-based cross-modal synthesis between solution chemistry and foliar health.'}
          </p>
        </div>

        {summary && (
          <span
            style={{
              fontSize: '0.6875rem',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              textTransform: 'uppercase',
              padding: '0.2rem 0.6rem',
              borderRadius: '2px',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              background: 'var(--bg-canvas)',
            }}
          >
            {localizedSummary?.statusLabel || summary.status.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* ── 2. Card Body ── */}
      {!summary || summary.status === 'insufficient_history' || !localizedSummary ? (
        <div
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: 'var(--bg-canvas)',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-dim)', marginBottom: '0.5rem' }}>
            ≡
          </div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {isKn
              ? 'ಪರಸ್ಪರ ಸಂಬಂಧವನ್ನು ನಿರ್ಧರಿಸಲು ಸಾಕಷ್ಟು ಡೇಟಾ ಇಲ್ಲ.'
              : 'Not enough historical data to compute statistical correlation.'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isKn
              ? 'ಪರಿಸರ ಸಂವೇದಕಗಳು ಮತ್ತು ಸಸ್ಯ ತಪಾಸಣೆಗಳ ಡೇಟಾ ಸಂಗ್ರಹವಾದಂತೆ ಇದು ಸಕ್ರಿಯಗೊಳ್ಳುತ್ತದೆ.'
              : 'Coincident shift trajectories require at least 3 paired observation cycles.'}
          </p>
        </div>
      ) : (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Association Status Panel: STATUS | EVIDENCE | CONFIDENCE */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.875rem',
              width: '100%',
            }}
          >
            {/* Status Field */}
            <div
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '0.875rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                }}
              >
                {isKn ? 'ಸ್ಥಿತಿ' : 'STATUS'}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {activeAssoc
                  ? getLocalizedAssociationStrength(activeAssoc.associationStrength, language)
                  : summary.status === 'no_clear_association'
                  ? (isKn ? 'ಯಾವುದೇ ಸಂಖ್ಯಾಶಾಸ್ತ್ರೀಯ ಸಂಬಂಧವಿಲ್ಲ' : 'No statistical association')
                  : localizedSummary.statusLabel}
              </span>
            </div>

            {/* Evidence Field */}
            <div
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '0.875rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                }}
              >
                {isKn ? 'ಪುರಾವೆ' : 'EVIDENCE'}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-teal)' }}>
                {activeAssoc
                  ? getLocalizedAssociationType(activeAssoc.associationType, language)
                  : (isKn ? 'ಏಕಕಾಲಿಕ ಬದಲಾವಣೆಗಳು' : 'Coincident shifts')}
              </span>
            </div>

            {/* Confidence Field */}
            <div
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '0.875rem 1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'var(--text-muted)',
                }}
              >
                {isKn ? 'ವಿಶ್ವಾಸಾರ್ಹತೆ' : 'CONFIDENCE'}
              </span>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: 'var(--color-green)',
                }}
              >
                {activeAssoc ? activeAssoc.confidence : 'MODERATE'}
              </span>
            </div>
          </div>

          {/* Evidence Relationship Layout: ENVIRONMENT -> ↓ -> PLANT */}
          {activeAssoc && (
            <div
              style={{
                background: 'var(--bg-canvas)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-sm, 4px)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
              }}
            >
              <div className={styles.evidenceFlow}>
                {/* ENVIRONMENT Panel */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm, 4px)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--color-teal)',
                    }}
                  >
                    ENVIRONMENT
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {envMetricName}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-teal)' }}>
                      {activeAssoc.environmentDirection || 'Observed shift'}
                    </span>
                    {activeAssoc.environmentValue !== undefined && (
                      <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted)' }}>
                        ({activeAssoc.environmentBaseline !== undefined
                          ? `${(activeAssoc.environmentValue - activeAssoc.environmentBaseline) > 0 ? '+' : ''}${(activeAssoc.environmentValue - activeAssoc.environmentBaseline).toFixed(1)} shift`
                          : `${activeAssoc.environmentValue}`})
                      </span>
                    )}
                  </div>
                </div>

                {/* Relational Direction Indicator: ↔ on desktop, ↓ on mobile */}
                <div className={styles.directionIndicator}>
                  <span className={styles.arrowDesktop}>↔</span>
                  <span className={styles.arrowMobile}>↓</span>
                </div>

                {/* PLANT Panel */}
                <div
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm, 4px)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--color-green)',
                    }}
                  >
                    PLANT
                  </span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {plantMetricName}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-green)' }}>
                      {activeAssoc.plantDirection || 'Observed foliage response'}
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      {activeAssoc.lagHours ? `${activeAssoc.lagHours}h delay` : 'Concurrent'}
                    </span>
                  </div>
                </div>
              </div>

              {/* What Does This Mean? & What Should I Do? */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {isKn ? 'ಇದರ ಅರ್ಥವೇನು?' : 'WHAT DOES THIS MEAN?'}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                    {localizedAssoc?.whatItMeans || activeAssoc.summary}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--color-emerald-ink)',
                    }}
                  >
                    {isKn ? 'ನಾನು ಏನು ಮಾಡಬೇಕು?' : 'WHAT SHOULD I DO?'}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                    {localizedAssoc?.whatToDo || 'Maintain stable nutrient dosing and verify probe calibration.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── 3. Other Associations Table (Structured Grid, Human Readable) ── */}
          {associations.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                }}
              >
                {isKn ? 'ಇತರ ಸಂಭವನೀಯ ಸಂಬಂಧಗಳು' : 'ASSOCIATION MATRIX'}
              </span>

              <div
                style={{
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-xs, 2px)',
                  overflow: 'hidden',
                }}
              >
                {/* Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1.2fr 1.2fr 1fr',
                    padding: '0.5rem 0.875rem',
                    background: 'var(--bg-canvas)',
                    borderBottom: '1px solid var(--border-default)',
                    fontSize: '0.625rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div>{isKn ? 'ಪರಿಸರ ಅಂಶ' : 'Environment Factor'}</div>
                  <div>{isKn ? 'ಸಸ್ಯ ಮಾಪನ' : 'Plant Measure'}</div>
                  <div>{isKn ? 'ಫಲಿತಾಂಶ' : 'Result'}</div>
                </div>

                {/* Table Rows */}
                {associations.map((assoc, idx) => {
                  const envName = formatHumanLabel(assoc.environmentMetric || assoc.environmentLabel, isKn);
                  const plantName = formatHumanLabel(assoc.plantMetric || assoc.plantLabel, isKn);
                  const resultStr = assoc.associationStrength === 'none'
                    ? (isKn ? 'ಸಂಬಂಧವಿಲ್ಲ' : 'No statistical association')
                    : getLocalizedAssociationStrength(assoc.associationStrength, language);

                  return (
                    <div
                      key={assoc.id || idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1.2fr 1fr',
                        padding: '0.625rem 0.875rem',
                        background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-canvas)',
                        borderBottom: idx < associations.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                        fontSize: '0.75rem',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{envName}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{plantName}</div>
                      <div style={{ color: assoc.associationStrength === 'strong' ? 'var(--color-green)' : 'var(--text-muted)', fontWeight: 500 }}>
                        {resultStr}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 4. Data Integrity & Scientific Limitations Note (Clean Collapsible) ── */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={() => setIsLimitationsOpen(!isLimitationsOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '0.25rem 0',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--text-muted)',
                }}
              >
                {isKn ? 'ಡೇಟಾ ಸಮಗ್ರತೆ ಮತ್ತು ಇತಿಮಿತಿಗಳು' : 'DATA INTEGRITY & SCIENTIFIC LIMITATIONS'}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                {isLimitationsOpen ? 'Hide ▲' : 'Details ▼'}
              </span>
            </button>

            {isLimitationsOpen && (
              <div
                style={{
                  marginTop: '0.5rem',
                  padding: '0.875rem 1rem',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs, 2px)',
                  fontSize: '0.6875rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                }}
              >
                <p style={{ margin: 0, marginBottom: '0.5rem' }}>
                  {isKn
                    ? 'ಗಮನಿಸಿ: ಹೈಡ್ರೋಸ್ಮಾರ್ಟ್ ಸಂವೇದಕಗಳ ಅಂಕಿಅಂಶಗಳ ಆಧಾರದ ಮೇಲೆ ಪ್ರಾಯೋಗಿಕ ಸಾಂದರ್ಭಿಕ ಸಂಬಂಧಗಳನ್ನು ಮಾತ್ರ ಗುರುತಿಸುತ್ತದೆ. ಇದು ಸಂಪೂರ್ಣ ಜೈವಿಕ ಸಾಬೀತುಪಡಿಸುವಿಕೆಯನ್ನು ಸೂಚಿಸುವುದಿಲ್ಲ.'
                    : 'Methodological Note: Correlation reflects empirical co-occurrence and lag analysis. In hydroponic closed-loops, multi-sensor shifts may present confounding variables. Interpret as diagnostic decision-support rather than isolated causality.'}
                </p>
                {summary.confoundingFactors && summary.confoundingFactors.length > 0 && (
                  <div style={{ marginTop: '0.4rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--color-amber)' }}>
                      {isKn ? 'ಗೊಂದಲದ ಅಂಶಗಳು: ' : 'Confounding Factors: '}
                    </span>
                    {summary.confoundingFactors.join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
