'use client';

import React, { useState } from 'react';
import Link from 'next/link';

import { WhatChangedSummary, PlantChangeEvent } from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';
import { getLocalizedWhatChangedCopy, getLocalizedChangeEvent } from '@/lib/intelligence/farmerSemanticLayer';

interface WhatChangedCardProps {
  summary?: WhatChangedSummary | null;
  language?: SupportedLanguageCode;
  userMode?: AssistantMode;
  onUserModeChange?: (mode: AssistantMode) => void;
  className?: string;
}

export function WhatChangedCard({
  summary,
  language = 'en',
  userMode = 'farmer',
  className = '',
}: WhatChangedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'sensor' | 'visual' | 'growth'>('all');
  const isKn = language === 'kn';

  const localizedCopy = summary ? getLocalizedWhatChangedCopy(summary, language) : null;

  const filteredEvents = summary?.events.filter((e) => {
    if (activeTab === 'sensor') return e.category === 'sensor';
    if (activeTab === 'visual') return e.category === 'visual';
    if (activeTab === 'growth') return e.category === 'growth';
    return true;
  }) || [];

  const getSignificanceColor = (sig: string) => {
    switch (sig) {
      case 'CRITICAL':
        return {
          color: 'var(--color-red)',
          bg: 'var(--bg-canvas)',
          border: 'var(--color-red)',
        };
      case 'SIGNIFICANT':
      case 'MODERATE':
        return {
          color: 'var(--color-amber)',
          bg: 'var(--bg-canvas)',
          border: 'var(--color-amber)',
        };
      case 'MINOR':
        return {
          color: 'var(--color-green)',
          bg: 'var(--bg-canvas)',
          border: 'var(--color-green)',
        };
      default:
        return {
          color: 'var(--text-muted)',
          bg: 'var(--bg-canvas)',
          border: 'var(--border-default)',
        };
    }
  };

  const getDirectionMark = (dir: string) => {
    switch (dir) {
      case 'improved':
      case 'recovered':
        return '▲';
      case 'declined':
        return '▼';
      case 'changed':
        return '≈';
      default:
        return '—';
    }
  };

  // Find primary event for the primary change block
  const primaryEvent = summary?.events && summary.events.length > 0 ? summary.events[0] : null;
  const primaryEventCopy = primaryEvent ? getLocalizedChangeEvent(primaryEvent, language) : null;

  return (
    <section
      aria-label={isKn ? 'ಏನು ಬದಲಾಗಿದೆ?' : 'What Changed Analysis'}
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
      {/* ── 1. Top Review Banner (if identity shift or review required) ── */}
      {summary?.reviewRequiredItems && summary.reviewRequiredItems.length > 0 && (
        <div
          style={{
            background: 'var(--bg-canvas)',
            borderBottom: '1px solid var(--color-amber)',
            padding: '0.625rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-amber)', fontWeight: 800 }}>!</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {isKn ? 'ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ: ' : 'Review Required: '}
              {summary.reviewRequiredItems[0].summary}
            </span>
          </div>
          <span
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono, monospace)',
              padding: '0.15rem 0.5rem',
              borderRadius: '2px',
              border: '1px solid var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            {isKn ? 'ಸಸ್ಯದ ತಳಿ ಪರಿಶೀಲನೆ' : 'Specimen Identity Shift'}
          </span>
        </div>
      )}

      {/* ── 2. Header Bar ── */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
              <h2
                style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                  margin: 0,
                  textTransform: 'uppercase',
                }}
              >
                {isKn ? 'ಏನು ಬದಲಾಗಿದೆ?' : 'WHAT CHANGED?'}
              </h2>

              {summary && (
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '2px',
                    border: `1px solid ${
                      summary.status === 'stable_no_change'
                        ? 'var(--color-green)'
                        : getSignificanceColor(summary.overallSignificance).border
                    }`,
                    color:
                      summary.status === 'stable_no_change'
                        ? 'var(--color-green)'
                        : getSignificanceColor(summary.overallSignificance).color,
                    background: 'var(--bg-canvas)',
                  }}
                >
                  {summary.status === 'stable_no_change'
                    ? isKn
                      ? 'ಸ್ಥಿರವಾಗಿದೆ'
                      : 'STABLE EQUILIBRIUM'
                    : summary.status === 'insufficient_history'
                    ? isKn
                      ? 'ಇತಿಹಾಸ ಬೇಕಿದೆ'
                      : 'PENDING HISTORY'
                    : `[${summary.overallSignificance} DELTA]`}
                </span>
              )}
            </div>

            {summary ? (
              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  margin: '0.25rem 0 0',
                }}
              >
                <span>
                  {isKn
                    ? `ಕಳೆದ ${summary.timeframeDescription} ದಿನಗಳಿಗೆ ಹೋಲಿಸಿದಾಗ`
                    : `Compared with last ${summary.timeframeDescription}`}
                </span>
                <span>·</span>
                <span>
                  {summary.observationCount} {isKn ? 'ತಪಾಸಣೆಗಳು' : 'observations'}
                </span>
              </p>
            ) : (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                {isKn ? 'ಸಾಕಷ್ಟು ಡೇಟಾ ಇಲ್ಲ' : 'Insufficient historical observation checkpoints.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Content Body ── */}
      {!summary || summary.status === 'insufficient_history' ? (
        <div
          style={{
            padding: '2.5rem 1.5rem',
            textAlign: 'center',
            background: 'var(--bg-canvas)',
            color: 'var(--text-muted)',
          }}
        >
          <div
            style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: 'var(--text-dim)',
              marginBottom: '0.5rem',
            }}
          >
            —
          </div>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            {isKn
              ? 'ಬದಲಾವಣೆಯನ್ನು ಗುರುತಿಸಲು ಸಾಕಷ್ಟು ಇತಿಹಾಸವಿಲ್ಲ.'
              : 'Not enough historical data to compute longitudinal parameter drift.'}
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {isKn
              ? 'ಕಾಲಕ್ರಮೇಣ ಸಂವೇದಕ ಹಾಗೂ ಕ್ಯಾಮೆರಾ ದಾಖಲೆಗಳು ಸಂಗ್ರಹವಾದಂತೆ ಇದು ನವೀಕರಿಸಲ್ಪಡುತ್ತದೆ.'
              : 'Trajectories will populate automatically as observations accumulate across checkpoints.'}
          </p>
        </div>
      ) : (
        <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Structured Primary Change Block: LEFT / CENTER / RIGHT */}
          <div
            style={{
              background: 'var(--bg-canvas)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm, 4px)',
              padding: '1.125rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
                gap: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '1rem',
              }}
            >
              {/* LEFT: Category & Status */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                  {isKn ? 'ವರ್ಗ / ಸ್ಥಿತಿ' : 'CHANGE CATEGORY'}
                </span>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {primaryEvent?.label || (summary.status === 'stable_no_change' ? 'Equilibrium' : 'Biological State')}
                </span>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {summary.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* CENTER: What Happened */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                  {isKn ? 'ಏನು ಗಮನಿಸಲಾಗಿದೆ' : 'WHAT HAPPENED'}
                </span>
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                  {primaryEventCopy?.headline || localizedCopy?.headline || summary.summaryHeadline}
                </p>
              </div>

              {/* RIGHT: Magnitude / Value */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
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
                  {isKn ? 'ಪ್ರಮಾಣ / ಬದಲಾವಣೆ' : 'MEASURED DELTA'}
                </span>
                <span
                  style={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: primaryEvent?.delta && primaryEvent.delta < 0 ? 'var(--color-amber)' : 'var(--color-green)',
                  }}
                >
                  {primaryEvent?.delta !== undefined
                    ? `${primaryEvent.delta > 0 ? '+' : ''}${primaryEvent.delta} ${primaryEvent.unit || ''}`
                    : 'Nominal Range'}
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {primaryEvent?.direction ? `${primaryEvent.direction.toUpperCase()}` : 'STABLE'}
                </span>
              </div>
            </div>

            {/* Below: Why this matters & Suggested check */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
                gap: '1rem',
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
                  {isKn ? 'ಏಕೆ ಮುಖ್ಯ' : 'WHY THIS MATTERS'}
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                  {primaryEventCopy?.why || localizedCopy?.why || summary.summaryExplanation}
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
                  {isKn ? 'ಶಿಫಾರಸು ಮಾಡಿದ ಪರಿಶೀಲನೆ' : 'SUGGESTED CHECK'}
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                  {primaryEventCopy?.action || localizedCopy?.action || 'Continue standard cultivation routine.'}
                </p>
              </div>
            </div>
          </div>

          {/* ── 4. Horizontal Event Filters & Multi-Row Events ── */}
          {summary.events.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* Event Filter Row: Clean wrapped pills */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  borderBottom: '1px solid var(--border-subtle)',
                  paddingBottom: '0.625rem',
                }}
              >
                <div
                  role="tablist"
                  aria-label="Event category filters"
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    background: 'var(--bg-canvas)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-xs, 2px)',
                    padding: '3px',
                    gap: '4px',
                  }}
                >
                  {[
                    { id: 'all', label: isKn ? 'ಎಲ್ಲಾ' : 'All', count: summary.events.length },
                    { id: 'sensor', label: isKn ? 'ಸಂವೇದಕಗಳು' : 'Sensors', count: summary.sensorChanges.length },
                    { id: 'visual', label: isKn ? 'ದೃಶ್ಯ' : 'Visual', count: summary.visualChanges.length },
                    { id: 'growth', label: isKn ? 'ಬೆಳವಣಿಗೆ' : 'Growth', count: summary.growthChanges.length },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.3rem 0.65rem',
                          borderRadius: '2px',
                          border: isActive ? '1px solid #E8DFD5' : '1px solid transparent',
                          fontSize: '0.6875rem',
                          fontWeight: isActive ? 700 : 500,
                          fontFamily: 'var(--font-mono, monospace)',
                          cursor: 'pointer',
                          background: isActive ? 'var(--color-champagne)' : 'transparent',
                          color: isActive ? 'var(--color-emerald-ink)' : 'var(--text-secondary)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span>{tab.label}</span>
                        <span
                          style={{
                            fontSize: '0.625rem',
                            opacity: isActive ? 1 : 0.7,
                          }}
                        >
                          ({tab.count})
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  style={{
                    fontSize: '0.6875rem',
                    color: 'var(--text-muted)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {isExpanded
                    ? (isKn ? 'ಕಡಿಮೆ ತೋರಿಸಿ ↑' : 'Collapse event archive ↑')
                    : (isKn ? `ಎಲ್ಲಾ ${filteredEvents.length} ದಾಖಲೆಗಳನ್ನು ವೀಕ್ಷಿಸಿ ↓` : `View all ${filteredEvents.length} events ↓`)}
                </button>
              </div>

              {/* Individual Event Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {(isExpanded ? filteredEvents : filteredEvents.slice(0, 3)).map((event: PlantChangeEvent) => {
                  const eventCopy = getLocalizedChangeEvent(event, language);
                  const sigStyle = getSignificanceColor(event.significance);
                  const dirMark = getDirectionMark(event.direction);

                  return (
                    <div
                      key={event.id}
                      style={{
                        background: 'var(--bg-canvas)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-xs, 2px)',
                        padding: '0.75rem 1rem',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        alignItems: 'center',
                        gap: '0.875rem',
                      }}
                    >
                      {/* Direction mark */}
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 900,
                          color: sigStyle.color,
                          width: '1.25rem',
                          textAlign: 'center',
                        }}
                      >
                        {dirMark}
                      </span>

                      {/* Main text & metadata */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                            {userMode === 'farmer' ? eventCopy.headline : event.label}
                          </span>
                          <span
                            style={{
                              fontSize: '0.5625rem',
                              fontFamily: 'var(--font-mono, monospace)',
                              textTransform: 'uppercase',
                              padding: '1px 5px',
                              borderRadius: '2px',
                              border: `1px solid ${sigStyle.border}`,
                              color: sigStyle.color,
                            }}
                          >
                            {event.significance}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                          {userMode === 'farmer' ? eventCopy.why : event.summary}
                        </p>
                      </div>

                      {/* Delta magnitude */}
                      <div style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono, monospace)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                          }}
                        >
                          {event.delta !== undefined ? `${event.delta > 0 ? '+' : ''}${event.delta} ${event.unit || ''}` : 'Recorded'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── 5. Footer Links ── */}
          <div
            style={{
              paddingTop: '0.625rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
            }}
          >
            <Link
              href="/dashboard/intelligence"
              style={{
                color: 'var(--color-teal)',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>{isKn ? 'ತಾರ್ಕಿಕ ಪ್ರಯೋಗಾಲಯಕ್ಕೆ ಹೋಗಿ' : 'Open Plant Reasoning Lab'}</span>
              <span>→</span>
            </Link>

            <Link
              href="/dashboard/analytics"
              style={{
                color: 'var(--text-muted)',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>{isKn ? 'ಸಸ್ಯ ಪ್ರವಾಸ' : 'Plant Journey & Analytics'}</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
