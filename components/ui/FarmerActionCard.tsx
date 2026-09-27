'use client';

import React from 'react';
import Link from 'next/link';
import { FarmerSemanticState, getFarmerCopy } from '@/lib/intelligence/farmerSemanticLayer';
import { RecommendationItem, PlantReasoningEvent } from '@/lib/intelligence/types';

interface FarmerActionCardProps {
  semanticState: FarmerSemanticState;
  recommendations?: RecommendationItem[];
  reasoningEvent?: PlantReasoningEvent | null;
}

export function FarmerActionCard({
  semanticState,
  recommendations = [],
  reasoningEvent = null,
}: FarmerActionCardProps) {
  const { plantStatus, waterStatus, nutrientStatus, hasSufficientData } = semanticState;
  const [showAll, setShowAll] = React.useState(false);

  const copy = getFarmerCopy(semanticState.language);
  const isKn = semanticState.language === 'kn';

  // Determine condition badge and styling
  let conditionLabel = isKn ? 'ಸ್ಥಿರವಾಗಿದೆ' : 'Stable';
  let cardVariant: 'good' | 'attention' | 'urgent' | 'unknown' | 'info' = 'good';
  let badgeMarker = '✓';

  if (reasoningEvent) {
    if (reasoningEvent.scenarioCode === 'NO_PLANT_DETECTED' || reasoningEvent.scenarioCode === 'POOR_IMAGE_QUALITY') {
      cardVariant = 'unknown';
      conditionLabel = isKn ? 'ಕ್ಯಾಮೆರಾ ಪರಿಶೀಲನೆ' : 'Camera Check';
      badgeMarker = '?';
    } else if (reasoningEvent.scenarioCode === 'SENSOR_UNAVAILABLE') {
      cardVariant = 'attention';
      conditionLabel = isKn ? 'ಸೆನ್ಸರ್ ಪರಿಶೀಲನೆ' : 'Sensor Check';
      badgeMarker = '!';
    } else if (reasoningEvent.plantState === 'CRITICAL') {
      cardVariant = 'urgent';
      conditionLabel = isKn ? 'ತಕ್ಷಣದ ಕ್ರಮ' : 'Critical';
      badgeMarker = '▲';
    } else if (reasoningEvent.plantState === 'ATTENTION') {
      cardVariant = 'attention';
      conditionLabel = isKn ? 'ಗಮನಿಸಿ' : 'Attention';
      badgeMarker = '▲';
    } else if (reasoningEvent.plantState === 'HEALTHY') {
      cardVariant = 'good';
      conditionLabel = isKn ? 'ಸ್ಥಿರವಾಗಿದೆ' : 'Stable';
      badgeMarker = '✓';
    } else {
      cardVariant = 'unknown';
      conditionLabel = isKn ? 'ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕಿದೆ' : 'More Data Needed';
      badgeMarker = '…';
    }
  } else {
    if (!hasSufficientData) {
      cardVariant = 'unknown';
      conditionLabel = isKn ? 'ಮಾಹಿತಿ ಬೇಕು' : 'More Data Needed';
      badgeMarker = '…';
    } else if (plantStatus === 'URGENT' || waterStatus === 'URGENT' || nutrientStatus === 'URGENT') {
      cardVariant = 'urgent';
      conditionLabel = isKn ? 'ತಕ್ಷಣದ ಕ್ರಮ' : 'Urgent';
      badgeMarker = '▲';
    } else if (plantStatus === 'ATTENTION' || waterStatus === 'ATTENTION' || nutrientStatus === 'ATTENTION') {
      cardVariant = 'attention';
      conditionLabel = isKn ? 'ಗಮನಿಸಿ' : 'Attention';
      badgeMarker = '!';
    }
  }

  // Derive What's happening, Why, and What to do
  let whatsHappening = reasoningEvent?.farmerCopy?.observableSummary || (
    isKn ? 'ನಿಮ್ಮ ಗಿಡ ಮತ್ತು ವ್ಯವಸ್ಥೆ ಸ್ಥಿರವಾಗಿದೆ.' : 'Environmental readings and biological parameters are stable.'
  );

  let whyFactor = reasoningEvent?.farmerCopy?.whySummary || (
    isKn ? 'ಸೆನ್ಸರ್ ಮತ್ತು ಕ್ಯಾಮೆರಾ ಸೂಚಕಗಳು ಸಾಮಾನ್ಯ ಮಟ್ಟದಲ್ಲಿವೆ.' : 'All streaming sensor values are within nominal operating ranges.'
  );

  let whatToDo = reasoningEvent?.farmerCopy?.farmerAction || (
    recommendations.length > 0
      ? `${recommendations[0].title}. ${recommendations[0].action}`
      : (isKn ? 'ಯಾವುದೇ ತಕ್ಷಣದ ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ. ನಿಯಮಿತವಾಗಿ ಗಮನಿಸುತ್ತಿರಿ.' : 'No intervention required. Continue routine observation.')
  );

  if (!reasoningEvent) {
    if (!hasSufficientData) {
      whatsHappening = isKn
        ? 'ಕ್ರಮವನ್ನು ಸೂಚಿಸಲು ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಬೇಕು.'
        : 'Telemetry or optical data is currently insufficient for a confident assessment.';
      whyFactor = isKn
        ? 'ಸೆನ್ಸರ್ ಸಂಪರ್ಕ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಸಕ್ರಿಯವಾಗಿಲ್ಲ.'
        : 'Hardware sensor link or camera feed is initializing or offline.';
      whatToDo = isKn
        ? 'ಸೆನ್ಸರ್ ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ.'
        : 'Connect sensor hardware or start Dashboard camera to inspect plant growth.';
    } else if (plantStatus === 'URGENT' || waterStatus === 'URGENT' || nutrientStatus === 'URGENT') {
      whatsHappening = isKn ? 'ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಗಂಭೀರ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದೆ.' : 'Critical deviation detected across biological parameters.';
      if (waterStatus === 'URGENT') {
        whyFactor = isKn ? 'ನೀರಿನ ಮಟ್ಟ ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ.' : 'Water level is critically low in the reservoir.';
        whatToDo = isKn ? 'ಕೂಡಲೇ ತೊಟ್ಟಿಗೆ ನೀರನ್ನು ಹಾಕಿ.' : 'Add water to the reservoir immediately.';
      } else if (nutrientStatus === 'URGENT') {
        whyFactor = isKn ? 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟ ಮಿತಿ ಮೀರಿದೆ.' : 'Nutrient concentration is outside safe botanical thresholds.';
        whatToDo = isKn ? 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಸರಿಹೊಂದಿಸಿ.' : 'Check and balance nutrient solution concentration.';
      }
    } else if (plantStatus === 'ATTENTION' || waterStatus === 'ATTENTION' || nutrientStatus === 'ATTENTION') {
      whatsHappening = isKn ? 'ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಗಮನಿಸಬೇಕಾದ ಬದಲಾವಣೆ ಇದೆ.' : 'System indicates minor parameter drift or foliage stress.';
      if (waterStatus === 'ATTENTION') {
        whyFactor = isKn ? 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ.' : 'Water level is trending downward.';
        whatToDo = isKn ? 'ಶೀಘ್ರದಲ್ಲೇ ಹೊಸ ನೀರನ್ನು ಸೇರಿಸಿ.' : 'Top up reservoir with balanced water soon.';
      } else if (nutrientStatus === 'ATTENTION') {
        whyFactor = isKn ? 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ಪರೀಕ್ಷಿಸಿ.' : 'Nutrient absorption rate suggests solution replenishment.';
        whatToDo = isKn ? 'ತೊಟ್ಟಿಯಲ್ಲಿ ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನ ನೋಡಿ.' : 'Inspect nutrient concentration in the primary reservoir.';
      }
    }
  }

  const isSensorUnavailable = reasoningEvent
    ? (!reasoningEvent.sensorAvailable || reasoningEvent.scenarioCode === 'SENSOR_UNAVAILABLE')
    : (semanticState.waterStatus === 'UNKNOWN' || !semanticState.hasSufficientData);

  const variantStyles = {
    good: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: 'var(--bg-canvas)',
      titleColor: 'var(--color-emerald-ink)',
      statusColor: 'var(--color-green)',
    },
    attention: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: 'var(--bg-canvas)',
      titleColor: 'var(--color-amber)',
      statusColor: 'var(--color-amber)',
    },
    urgent: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: 'var(--bg-canvas)',
      titleColor: 'var(--color-red)',
      statusColor: 'var(--color-red)',
    },
    unknown: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: 'var(--bg-canvas)',
      titleColor: 'var(--color-emerald-ink)',
      statusColor: 'var(--text-muted)',
    },
    info: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: 'var(--bg-canvas)',
      titleColor: 'var(--color-teal)',
      statusColor: 'var(--color-teal)',
    },
  }[cardVariant];

  const hasMultipleRecs = reasoningEvent
    ? (reasoningEvent.recommendations.length > 1)
    : (recommendations.length > 1);

  return (
    <div
      style={{
        background: variantStyles.bg,
        border: `1px solid ${variantStyles.border}`,
        borderRadius: 'var(--radius-sm, 4px)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        position: 'relative',
        width: '100%',
      }}
    >
      {/* Header bar: Eyebrow, Action Title, Status Badge */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.875rem',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            style={{
              fontSize: '0.625rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {isKn ? 'ಕಾರ್ಯಸಾಧ್ಯ ಮಾರ್ಗದರ್ಶನ' : 'MULTIMODAL REASONING ACTION'}
          </span>
          <h2
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: variantStyles.titleColor,
              margin: 0,
              letterSpacing: '-0.02em',
            }}
          >
            {isKn ? copy.actions.title : 'What Should I Do Now?'}
          </h2>
        </div>

        {/* Condition Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontFamily: 'var(--font-mono, monospace)',
            background: variantStyles.badgeBg,
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <span
            style={{
              fontSize: '0.75rem',
              color: variantStyles.statusColor,
              fontWeight: 900,
            }}
          >
            {badgeMarker}
          </span>
          <span>{conditionLabel}</span>
        </div>
      </div>

      {/* Structured 3-Part Reasoning Grid: 3 columns on desktop */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1rem',
          width: '100%',
        }}
      >
        {/* Column 1: What's Happening */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '1rem 1.125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 800,
                color: 'var(--text-dim)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '2px',
                width: '1.25rem',
                height: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              1
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isKn ? 'ಏನಾಗುತ್ತಿದೆ?' : "WHAT'S HAPPENING?"}
            </span>
          </div>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            {whatsHappening}
          </p>
        </div>

        {/* Column 2: Why? (Associated factors) */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '1rem 1.125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 800,
                color: 'var(--text-dim)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: '2px',
                width: '1.25rem',
                height: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              2
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isKn ? 'ಕಾರಣ (ಸಂಬಂಧಿತ ಅಂಶಗಳು)' : 'WHY? (ASSOCIATED FACTORS)'}
            </span>
          </div>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {whyFactor}
          </p>
        </div>

        {/* Column 3: What to do */}
        <div
          style={{
            background: 'var(--bg-canvas)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '1rem 1.125rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.625rem',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 800,
                color: 'var(--color-emerald-ink)',
                background: 'var(--color-champagne)',
                borderRadius: '2px',
                width: '1.25rem',
                height: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              3
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                color: 'var(--color-emerald-ink)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {isKn ? 'ಏನು ಮಾಡಬೇಕು?' : 'WHAT TO DO?'}
            </span>
          </div>
          <p
            style={{
              fontSize: '0.8125rem',
              color: 'var(--text-primary)',
              margin: 0,
              lineHeight: 1.5,
              fontWeight: 600,
            }}
          >
            {whatToDo}
          </p>
        </div>
      </div>

      {/* Sensor Disconnected / Limitation Warning */}
      {isSensorUnavailable && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.625rem',
            fontSize: '0.75rem',
            color: 'var(--color-amber)',
            background: 'var(--bg-canvas)',
            padding: '0.5rem 0.875rem',
            borderRadius: 'var(--radius-xs, 2px)',
            border: '1px solid var(--border-default)',
          }}
        >
          <span style={{ fontWeight: 800 }}>!</span>
          <span>
            {isKn
              ? 'ಸೆನ್ಸರ್ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ — ಕ್ಯಾಮೆರಾ ತಪಾಸಣೆಯ ಆಧಾರದ ಮೇಲೆ ಮಾತ್ರ ಸಲಹೆ ನೀಡಲಾಗಿದೆ.'
              : 'Sensor telemetry offline — assessments derived from visual optical inspection.'}
          </span>
        </div>
      )}

      {/* Footer: Deep link to Reasoning Lab + More Recommendations toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.625rem',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.75rem',
        }}
      >
        <Link
          href="/dashboard/intelligence"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--color-teal)',
            textDecoration: 'none',
          }}
        >
          <span>{isKn ? 'ಸಂಪೂರ್ಣ ಕಾರಣ ವಿಶ್ಲೇಷಣೆ ವೀಕ್ಷಿಸಿ' : 'Open Plant Reasoning Lab'}</span>
          <span style={{ fontWeight: 700 }}>→</span>
        </Link>

        {hasMultipleRecs && (
          <button
            type="button"
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-muted)',
              background: 'transparent',
              border: 'none',
              padding: '0.2rem 0.4rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll
              ? (isKn ? 'ಕಡಿಮೆ ತೋರಿಸಿ' : 'Hide additional steps')
              : (isKn ? 'ಇನ್ನಷ್ಟು ಕ್ರಮಗಳು' : 'More steps')}
          </button>
        )}
      </div>

      {/* Expandable recommendations list */}
      {showAll && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
          {reasoningEvent ? (
            reasoningEvent.recommendations.slice(1).map((rec, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  padding: '0.4rem 0.75rem',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs, 2px)',
                }}
              >
                • {rec}
              </div>
            ))
          ) : (
            recommendations.slice(1).map((rec) => (
              <div
                key={rec.id}
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  padding: '0.4rem 0.75rem',
                  background: 'var(--bg-canvas)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-xs, 2px)',
                }}
              >
                • <strong style={{ color: 'var(--text-primary)' }}>{rec.title}</strong>: {rec.action}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
