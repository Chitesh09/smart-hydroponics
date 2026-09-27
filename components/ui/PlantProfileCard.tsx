'use client';

import React from 'react';
import { PlantProfile } from '@/lib/intelligence/types';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';
import {
  getLocalizedLifecycleState,
  getLocalizedIdentificationStatus,
} from '@/lib/intelligence/farmerSemanticLayer';

interface PlantProfileCardProps {
  profile: PlantProfile;
  observationsCount?: number;
  language?: SupportedLanguageCode;
  userMode?: AssistantMode;
  compact?: boolean;
}

export function PlantProfileCard({
  profile,
  observationsCount,
  language = 'en',
  userMode = 'farmer',
  compact = false,
}: PlantProfileCardProps) {
  const isKn = language === 'kn';

  const isIdentified = Boolean(
    profile.species &&
    profile.species !== 'Unknown Plant' &&
    profile.species !== 'unknown_plant'
  );

  const plantName = isIdentified
    ? (profile.commonName || profile.species)
    : (isKn ? 'ಪರಿಶೀಲಿಸುತ್ತಿರುವ ಗಿಡ' : 'Monitored Specimen');

  const speciesSubtitle = isIdentified
    ? (profile.scientificName || (isKn ? 'ವರ್ಗೀಕರಿಸಿದ ಸಸ್ಯ' : 'Botanical Specimen'))
    : (isKn ? 'ಸಸ್ಯ ಪ್ರಭೇದ ಇನ್ನೂ ವರ್ಗೀಕರಿಸಲಾಗಿಲ್ಲ' : 'Botanical classification pending identification');

  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  const ageDays = (now && profile.createdAt)
    ? Math.max(1, Math.round((now - profile.createdAt) / 86400000) + 1)
    : 1;

  const totalObs = observationsCount !== undefined ? observationsCount : profile.observationCount;

  const lifecycleState = profile.lifecycle?.lifecycleState || 'MONITORING';
  const identificationStatus = profile.identity?.identificationStatus || (isIdentified ? 'IDENTIFIED' : 'UNKNOWN');

  // Genuinely available ML confidence only
  const hasGenuinelyAvailableConfidence = Boolean(
    isIdentified && profile.speciesConfidence && profile.speciesConfidence > 0
  );

  // Evidence Items definition
  const evidenceItems = [
    {
      id: 'species',
      label: isKn ? 'ಸಸ್ಯ ಪ್ರಭೇದ ಗುರುತಿಸುವಿಕೆ' : 'Species Identity',
      state: isIdentified ? (isKn ? 'ದೃಢೀಕರಿಸಲಾಗಿದೆ' : 'Identified') : (isKn ? 'ಬಾಕಿ ಇದೆ' : 'Pending'),
      status: isIdentified ? 'optimal' : 'neutral',
      supportingValue: isIdentified ? (profile.commonName || profile.species) : (isKn ? 'ವರ್ಗೀಕರಿಸದ' : 'Unclassified'),
      explanation: isIdentified
        ? (profile.scientificName ? `Taxonomic rank: ${profile.scientificName}` : 'Optical foliage matching completed.')
        : 'Awaiting camera capture or manual assignment.',
    },
    {
      id: 'baseline',
      label: isKn ? 'ಮೂಲ ಮಾಪನಾಂಕ ನಿರ್ಣಯ' : 'Baseline Calibration',
      state: profile.baseline ? (isKn ? 'ಸ್ಥಾಪಿಸಲಾಗಿದೆ' : 'Established') : (isKn ? 'ಪ್ರಕ್ರಿಯೆಯಲ್ಲಿದೆ' : 'Calibrating'),
      status: profile.baseline ? 'optimal' : 'neutral',
      supportingValue: profile.baseline ? `${totalObs} checkpoints` : 'Initial cycle',
      explanation: profile.baseline
        ? 'Reference parameters for pH, TDS, and water consumption active.'
        : 'Accumulating initial observation data.',
    },
    {
      id: 'health',
      label: isKn ? 'ಆರೋಗ್ಯ ಪಥ' : 'Health Trajectory',
      state: profile.currentHealthStatus ? String(profile.currentHealthStatus) : (isKn ? 'ಸ್ಥಿರ' : 'Stable'),
      status: profile.currentHealthStatus === 'HEALTHY' || !profile.currentHealthStatus ? 'optimal' : 'warning',
      supportingValue: profile.healthConfidence ? `${profile.healthConfidence} confidence` : 'Normal range',
      explanation: 'Evaluated across multi-sensor readings and optical foliar checks.',
    },
    {
      id: 'growth',
      label: isKn ? 'ಬೆಳವಣಿಗೆ ವಿಶ್ಲೇಷಣೆ' : 'Growth Analytics',
      state: profile.growth?.latestCanopyCoverage !== undefined ? (isKn ? 'ಸಕ್ರಿಯ' : 'Active') : (isKn ? 'ಮಾಹಿತಿ ಇಲ್ಲ' : 'Awaiting data'),
      status: profile.growth?.latestCanopyCoverage !== undefined ? 'optimal' : 'neutral',
      supportingValue: profile.growth?.latestCanopyCoverage !== undefined ? `${profile.growth.latestCanopyCoverage}% canopy` : '--',
      explanation: '2D optical foliage canopy coverage estimated from camera frame.',
    },
    {
      id: 'telemetry',
      label: isKn ? 'ಪರಿಸರ ಟೆಲಿಮೆಟ್ರಿ' : 'Environmental Telemetry',
      state: profile.environment ? (isKn ? 'ಸಕ್ರಿಯ' : 'Streaming') : (isKn ? 'ಸ್ಟ್ಯಾಂಡ್‌ಬೈ' : 'Standby'),
      status: profile.environment ? 'optimal' : 'neutral',
      supportingValue: profile.environment?.latestPH ? `pH ${profile.environment.latestPH.toFixed(1)} · ${Math.round(profile.environment.latestTDS || 0)} PPM` : 'Sensor ready',
      explanation: 'Continuous closed-loop solution chemistry and reservoir metrics.',
    },
  ];

  return (
    <article
      aria-label={isKn ? 'ಸಸ್ಯ ಡಿಜಿಟಲ್ ಪ್ರೊಫೈಲ್' : 'Plant Digital Profile'}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm, 4px)',
        overflow: 'hidden',
        width: '100%',
        marginBottom: '1.25rem',
      }}
    >
      {/* ── 1. Proper Profile Header ── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-default)',
          background: 'var(--bg-canvas)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        {/* Top Eyebrow Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
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
              DIGITAL SPECIMEN
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--text-muted)',
              }}
            >
              ID: {profile.plantId || 'HS-01'}
            </span>
          </div>

          {/* Growth Stage badge */}
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '0.2rem 0.6rem',
              borderRadius: '2px',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              color: 'var(--color-green)',
            }}
          >
            {getLocalizedLifecycleState(lifecycleState, language)}
          </span>
        </div>

        {/* Primary Specimen Identity Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {plantName}
            </h1>
            <p
              style={{
                fontSize: '0.8125rem',
                fontStyle: isIdentified ? 'italic' : 'normal',
                color: 'var(--text-secondary)',
                margin: '0.25rem 0 0',
              }}
            >
              {speciesSubtitle}
            </p>
          </div>

          {/* ML Identification Status & Confidence (only when genuinely available) */}
          {hasGenuinelyAvailableConfidence && (
            <div
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-xs, 2px)',
                padding: '0.4rem 0.75rem',
                textAlign: 'right',
              }}
            >
              <span
                style={{
                  fontSize: '0.625rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  display: 'block',
                }}
              >
                {isKn ? 'ವರ್ಗೀಕರಣ ವಿಶ್ವಾಸಾರ್ಹತೆ' : 'ML Identification'}
              </span>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--color-green)',
                }}
              >
                {profile.speciesConfidence}%
              </span>
            </div>
          )}
        </div>

        {/* Structured Metadata Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingTop: '0.5rem',
            borderTop: '1px solid var(--border-subtle)',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{isKn ? 'ವಯಸ್ಸು:' : 'Cultivation Age:'}</span>
            <strong style={{ color: 'var(--text-primary)' }}>{isKn ? `ದಿನ ${ageDays}` : `Day ${ageDays}`}</strong>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{isKn ? 'ಒಟ್ಟು ಪರಿಶೀಲನೆಗಳು:' : 'Checkpoints:'}</span>
            <strong style={{ color: 'var(--text-primary)' }}>{totalObs}</strong>
          </div>
          <span style={{ color: 'var(--border-subtle)' }}>|</span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>{isKn ? 'ಸ್ಥಿತಿ:' : 'Identity Status:'}</span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {getLocalizedIdentificationStatus(identificationStatus, language)}
            </strong>
          </div>
        </div>
      </div>

      {/* ── 2. Clean 2-Column Profile Attributes Grid ── */}
      <div
        style={{
          padding: '1.25rem 1.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.25rem',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {/* Column 1: Botanical & Lifecycle Parameters */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs, 2px)',
            padding: '1rem 1.125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.4rem',
            }}
          >
            {isKn ? 'ಜೈವಿಕ ಮತ್ತು ಬೆಳವಣಿಗೆ ವಿವರ' : 'CROP & LIFECYCLE ATTRIBUTES'}
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKn ? 'ಸಾಮಾನ್ಯ ಹೆಸರು' : 'Common Name'}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile.commonName || 'Unspecified'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKn ? 'ವೈಜ್ಞಾನಿಕ ಹೆಸರು' : 'Botanical Scientific'}
              </span>
              <span style={{ fontSize: '0.8125rem', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                {profile.scientificName || 'Unclassified'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKn ? 'ಬೆಳವಣಿಗೆಯ ಹಂತ' : 'Lifecycle Phase'}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-green)' }}>
                {getLocalizedLifecycleState(lifecycleState, language)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKn ? 'ಆರೋಗ್ಯ ಸ್ಥಿತಿ' : 'Health Evaluation'}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {profile.currentHealthStatus || 'STABLE'}
              </span>
            </div>
          </div>
        </div>

        {/* Column 2: Environmental Baseline & Telemetry Attributes */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs, 2px)',
            padding: '1rem 1.125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <span
            style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              fontFamily: 'var(--font-mono, monospace)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              borderBottom: '1px solid var(--border-subtle)',
              paddingBottom: '0.4rem',
            }}
          >
            {isKn ? 'ದ್ರಾವಣ ಮತ್ತು ಪರಿಸರ ವಿವರ' : 'CULTIVATION TELEMETRY TARGETS'}
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKn ? 'ದ್ರಾವಣ pH ವ್ಯಾಪ್ತಿ' : 'Target Solution pH'}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary)' }}>
                5.5 – 6.5 pH
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKn ? 'ಪೋಷಕಾಂಶ ಗುರಿ' : 'Target Nutrients'}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary)' }}>
                800 – 1200 PPM
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKn ? 'ಇತ್ತೀಚಿನ pH' : 'Latest Measured pH'}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary)' }}>
                {profile.environment?.latestPH ? profile.environment.latestPH.toFixed(2) : '--'}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)', display: 'block' }}>
                {isKn ? 'ಇತ್ತೀಚಿನ TDS' : 'Latest Measured TDS'}
              </span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-primary)' }}>
                {profile.environment?.latestTDS ? `${Math.round(profile.environment.latestTDS)} PPM` : '--'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Profile Evidence & Completeness Section ── */}
      {!compact && (
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 800,
                fontFamily: 'var(--font-mono, monospace)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
              {isKn ? 'ಪ್ರೊಫೈಲ್ ಸಾಕ್ಷ್ಯ ಮತ್ತು ಡೇಟಾ ಸಂಪೂರ್ಣತೆ' : 'PROFILE EVIDENCE & VERIFICATION STATUS'}
            </span>

            {profile.completeness && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 700,
                  color: 'var(--color-teal)',
                }}
              >
                Completeness: {profile.completeness.score}%
              </span>
            )}
          </div>

          {/* Structured Evidence Rows */}
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
                gridTemplateColumns: '1.4fr 1fr 1.2fr 2fr',
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
              <div>{isKn ? 'ಸಾಕ್ಷ್ಯ ವರ್ಗ' : 'Evidence Domain'}</div>
              <div>{isKn ? 'ಸ್ಥಿತಿ' : 'Current State'}</div>
              <div>{isKn ? 'ಮಾಪನ / ವಿವರ' : 'Supporting Value'}</div>
              <div>{isKn ? 'ಟಿಪ್ಪಣಿ' : 'Scientific Explanation'}</div>
            </div>

            {/* Evidence Rows */}
            {evidenceItems.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr 1.2fr 2fr',
                  padding: '0.625rem 0.875rem',
                  background: idx % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-canvas)',
                  borderBottom: idx < evidenceItems.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  fontSize: '0.75rem',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</div>
                <div>
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 700,
                      color: item.status === 'optimal' ? 'var(--color-green)' : 'var(--text-muted)',
                    }}
                  >
                    {item.state}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-secondary)' }}>
                  {item.supportingValue}
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {item.explanation}
                </div>
              </div>
            ))}
          </div>

          {/* Growth Methodology Disclaimer */}
          <p
            style={{
              fontSize: '0.625rem',
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--text-dim)',
              margin: '0.25rem 0 0',
              lineHeight: 1.4,
            }}
          >
            {profile.growth?.disclaimer ||
              'METHODOLOGICAL NOTE: Foliage growth values represent 2D optical canopy surface area computed from camera vision frames. Values provide relative longitudinal tracking and do not claim physical wet/dry biomass weight.'}
          </p>
        </div>
      )}
    </article>
  );
}
