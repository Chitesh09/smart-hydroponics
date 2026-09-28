'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { PlantAlertCard } from '@/components/ui/PlantAlertCard';
import styles from './alerts.module.css';

export default function AlertsPage() {
  const {
    alertSummary,
    language,
    userMode,
    dismissAlert,
    acknowledgeAlert,
    plantProfile,
  } = usePlantIntelligence();

  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED' | 'DISMISSED'>('ACTIVE');

  const {
    activeAlerts,
    dismissedAlerts,
    resolvedAlerts,
    urgentCount,
    attentionCount,
    infoCount,
  } = alertSummary;

  const currentList =
    activeTab === 'ACTIVE'
      ? activeAlerts
      : activeTab === 'RESOLVED'
      ? resolvedAlerts
      : dismissedAlerts;

  const isKn = language === 'kn';

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        color: 'var(--text-primary)',
        padding: '1.5rem',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
        }}
      >
        {/* ── 1. Page Header ── */}
        <div
          style={{
            paddingBottom: '1.25rem',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <Link
              href="/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.25rem 0.65rem',
                borderRadius: 'var(--radius-xs, 2px)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                textDecoration: 'none',
              }}
            >
              ← {isKn ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Dashboard'}
            </Link>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--color-emerald-ink)',
              }}
            >
              HYDROSMART ALERT ENGINE
            </span>
          </div>

          <div>
            <h1
              style={{
                fontSize: '1.625rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {isKn ? 'ಗಿಡದ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಅಧಿಸೂಚನೆಗಳು' : 'Plant Alerts & Notifications'}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
              {isKn
                ? `${plantProfile?.commonName || 'ಗಿಡ'}ಕ್ಕಾಗಿ ಸಾಕ್ಷ್ಯಾಧಾರಿತ ಎಚ್ಚರಿಕೆಗಳು ಮತ್ತು ಪರಿಹಾರ ಕ್ರಮಗಳು.`
                : `Confidence-aware, evidence-based alerts and actionable notifications for ${plantProfile?.commonName || 'your plant'}.`}
            </p>
          </div>
        </div>

        {/* ── 2. Proper Horizontal Summary Section ── */}
        <div className={styles.summaryContainer}>
          {/* Row 1 — Severity Levels: URGENT | ATTENTION | INFO */}
          <div className={styles.severityRow}>
            {/* Urgent */}
            <div className={styles.severityCard}>
              <div
                className={styles.severityLabel}
                style={{ color: 'var(--color-red)' }}
              >
                {isKn ? 'ತುರ್ತು' : 'URGENT'}
              </div>
              <div
                className={styles.severityCount}
                style={{ color: 'var(--color-red)' }}
              >
                {urgentCount}
              </div>
            </div>

            {/* Attention */}
            <div className={styles.severityCard}>
              <div
                className={styles.severityLabel}
                style={{ color: 'var(--color-amber)' }}
              >
                {isKn ? 'ಗಮನಿಸಿ' : 'ATTENTION'}
              </div>
              <div
                className={styles.severityCount}
                style={{ color: 'var(--color-amber)' }}
              >
                {attentionCount}
              </div>
            </div>

            {/* Info */}
            <div className={styles.severityCard}>
              <div
                className={styles.severityLabel}
                style={{ color: 'var(--color-teal)' }}
              >
                {isKn ? 'ಮಾಹಿತಿ' : 'INFO'}
              </div>
              <div
                className={styles.severityCount}
                style={{ color: 'var(--color-teal)' }}
              >
                {infoCount}
              </div>
            </div>
          </div>

          {/* Row 2 — Status Lifecycle: ACTIVE | RESOLVED | DISMISSED */}
          <div className={styles.tabRow}>
            {[
              { label: isKn ? 'ಸಕ್ರಿಯ' : 'ACTIVE', count: activeAlerts.length, tabKey: 'ACTIVE' as const },
              { label: isKn ? 'ಪರಿಹರಿಸಲಾಗಿದೆ' : 'RESOLVED', count: resolvedAlerts.length, tabKey: 'RESOLVED' as const },
              { label: isKn ? 'ವಜಾಗೊಳಿಸಲಾಗಿದೆ' : 'DISMISSED', count: dismissedAlerts.length, tabKey: 'DISMISSED' as const },
            ].map((item) => (
              <button
                key={item.tabKey}
                type="button"
                onClick={() => setActiveTab(item.tabKey)}
                className={styles.tabBtn}
                style={{
                  background: activeTab === item.tabKey ? 'var(--bg-surface)' : 'transparent',
                }}
              >
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono, monospace)',
                    letterSpacing: '0.06em',
                    color: activeTab === item.tabKey ? 'var(--color-emerald-ink)' : 'var(--text-muted)',
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: activeTab === item.tabKey ? 'var(--text-primary)' : 'var(--text-muted)',
                    backgroundColor: activeTab === item.tabKey ? 'var(--bg-canvas)' : 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '2px',
                    padding: '1px 6px',
                  }}
                >
                  {item.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. Alert Cards or Centered Contained Empty State ── */}
        <div style={{ width: '100%' }}>
          {currentList.length === 0 ? (
            /* Deliberate Centered/Contained Empty State */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '3.5rem 2rem',
                borderRadius: 'var(--radius-sm, 4px)',
                border: '1px solid var(--border-default)',
                backgroundColor: 'var(--bg-surface)',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              {/* Typographic status mark */}
              <div
                style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '2px',
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px solid var(--color-green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  color: 'var(--color-green)',
                  marginBottom: '1rem',
                  fontWeight: 900,
                }}
              >
                ✓
              </div>

              <h2
                style={{
                  fontSize: '1.125rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  margin: '0 0 0.35rem',
                  letterSpacing: '-0.01em',
                }}
              >
                {activeTab === 'ACTIVE'
                  ? (isKn ? 'ಎಲ್ಲ ವ್ಯವಸ್ಥೆಗಳು ಸ್ಥಿರವಾಗಿವೆ' : 'All Systems Stable')
                  : activeTab === 'RESOLVED'
                  ? (isKn ? 'ಯಾವುದೇ ಪರಿಹರಿಸಿದ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ' : 'No Resolved Alerts')
                  : (isKn ? 'ಯಾವುದೇ ವಜಾಗೊಳಿಸಿದ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ' : 'No Dismissed Alerts')}
              </h2>

              <p
                style={{
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-green)',
                  margin: '0 0 0.5rem',
                }}
              >
                {activeTab === 'ACTIVE'
                  ? (isKn ? 'ಯಾವುದೇ ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳಿಲ್ಲ' : 'No active alerts')
                  : (isKn ? 'ದಾಖಲೆಗಳು ಖಾಲಿಯಾಗಿವೆ' : 'No records in this archive')}
              </p>

              <p
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  maxWidth: '460px',
                  margin: '0 0 1.5rem',
                  lineHeight: 1.5,
                }}
              >
                {activeTab === 'ACTIVE'
                  ? (isKn
                    ? 'ಪರಿಸರ ಸಂವೇದಕಗಳು ಮತ್ತು ಸಸ್ಯದ ಅವಲೋಕನಗಳಿಗೆ ಪ್ರಸ್ತುತ ಯಾವುದೇ ಎಚ್ಚರಿಕೆಯ ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ.'
                    : 'Environmental and plant observations currently require no alert action.')
                  : (isKn
                    ? 'ಹಿಂದಿನ ತಪಾಸಣೆಗಳಲ್ಲಿ ಯಾವುದೇ ಸಂಬಂಧಿತ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸಂಗ್ರಹಿಸಲಾಗಿಲ್ಲ.'
                    : 'Archive will reflect historical alerts as notifications are processed.')}
              </p>

              <Link
                href="/dashboard"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.5rem 1.125rem',
                  borderRadius: 'var(--radius-xs, 2px)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--color-champagne)',
                  backgroundColor: 'var(--color-emerald-ink)',
                  border: 'none',
                  textDecoration: 'none',
                }}
              >
                ← {isKn ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Return to Dashboard'}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentList.map((alert) => (
                <PlantAlertCard
                  key={alert.id}
                  alert={alert}
                  mode={userMode}
                  language={language}
                  onDismiss={activeTab === 'ACTIVE' ? dismissAlert : undefined}
                  onAcknowledge={activeTab === 'ACTIVE' ? acknowledgeAlert : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
