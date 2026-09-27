'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Info,
  Activity
} from 'lucide-react';
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
  let Icon = CheckCircle2;

  if (reasoningEvent) {
    if (reasoningEvent.scenarioCode === 'NO_PLANT_DETECTED' || reasoningEvent.scenarioCode === 'POOR_IMAGE_QUALITY') {
      cardVariant = 'unknown';
      conditionLabel = isKn ? 'ಕ್ಯಾಮೆರಾ ಪರಿಶೀಲನೆ' : 'Camera Check';
      Icon = HelpCircle;
    } else if (reasoningEvent.scenarioCode === 'SENSOR_UNAVAILABLE') {
      cardVariant = 'attention';
      conditionLabel = isKn ? 'ಸೆನ್ಸರ್ ಪರಿಶೀಲನೆ' : 'Sensor Check';
      Icon = Info;
    } else if (reasoningEvent.plantState === 'CRITICAL') {
      cardVariant = 'urgent';
      conditionLabel = isKn ? 'ತಕ್ಷಣದ ಕ್ರಮ' : 'Critical';
      Icon = AlertTriangle;
    } else if (reasoningEvent.plantState === 'ATTENTION') {
      cardVariant = 'attention';
      conditionLabel = isKn ? 'ಗಮನಿಸಿ' : 'Attention';
      Icon = AlertTriangle;
    } else if (reasoningEvent.plantState === 'HEALTHY') {
      cardVariant = 'good';
      conditionLabel = isKn ? 'ಸ್ಥಿರವಾಗಿದೆ' : 'Stable';
      Icon = CheckCircle2;
    } else {
      cardVariant = 'unknown';
      conditionLabel = isKn ? 'ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕಿದೆ' : 'More Data Needed';
      Icon = HelpCircle;
    }
  } else {
    if (!hasSufficientData) {
      cardVariant = 'unknown';
      conditionLabel = isKn ? 'ಮಾಹಿತಿ ಬೇಕು' : 'More Data Needed';
      Icon = HelpCircle;
    } else if (plantStatus === 'URGENT' || waterStatus === 'URGENT' || nutrientStatus === 'URGENT') {
      cardVariant = 'urgent';
      conditionLabel = isKn ? 'ತಕ್ಷಣದ ಕ್ರಮ' : 'Urgent';
      Icon = AlertTriangle;
    } else if (plantStatus === 'ATTENTION' || waterStatus === 'ATTENTION' || nutrientStatus === 'ATTENTION') {
      cardVariant = 'attention';
      conditionLabel = isKn ? 'ಗಮನಿಸಿ' : 'Attention';
      Icon = AlertTriangle;
    }
  }

  // Derive What's happening, Why, and What to do
  let whatsHappening = reasoningEvent?.farmerCopy?.observableSummary || (
    isKn ? 'ನಿಮ್ಮ ಗಿಡ ಮತ್ತು ವ್ಯವಸ್ಥೆ ಸ್ಥಿರವಾಗಿದೆ.' : 'Your plant and system appear stable.'
  );

  let whyFactor = reasoningEvent?.farmerCopy?.whySummary || (
    isKn ? 'ಸೆನ್ಸರ್ ಮತ್ತು ಕ್ಯಾಮೆರಾ ಸೂಚಕಗಳು ಸಾಮಾನ್ಯ ಮಟ್ಟದಲ್ಲಿವೆ.' : 'Sensor readings and camera signals are within expected operational range.'
  );

  let whatToDo = reasoningEvent?.farmerCopy?.farmerAction || (
    recommendations.length > 0
      ? `${recommendations[0].title}. ${recommendations[0].action}`
      : (isKn ? 'ಯಾವುದೇ ತಕ್ಷಣದ ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ. ನಿಯಮಿತವಾಗಿ ಗಮನಿಸುತ್ತಿರಿ.' : 'No urgent action needed. Continue routine monitoring.')
  );

  // If no reasoning event, fallback to legacy copy derivation
  if (!reasoningEvent) {
    if (!hasSufficientData) {
      whatsHappening = isKn
        ? 'ಕ್ರಮವನ್ನು ಸೂಚಿಸಲು ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಬೇಕು.'
        : 'Telemetry or camera data is currently insufficient for a confident assessment.';
      whyFactor = isKn
        ? 'ಸೆನ್ಸರ್ ಸಂಪರ್ಕ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಸಕ್ರಿಯವಾಗಿಲ್ಲ.'
        : 'ESP32 serial sensor or camera feed is disconnected or initializing.';
      whatToDo = isKn
        ? 'ಸೆನ್ಸರ್ ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ.'
        : 'Connect your ESP32 hardware or start the camera from Dashboard.';
    } else if (plantStatus === 'URGENT' || waterStatus === 'URGENT' || nutrientStatus === 'URGENT') {
      whatsHappening = isKn ? 'ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಗಂಭೀರ ವ್ಯತ್ಯಾಸ ಕಂಡುಬಂದಿದೆ.' : 'A critical threshold deviation requires immediate intervention.';
      if (waterStatus === 'URGENT') {
        whyFactor = isKn ? 'ನೀರಿನ ಮಟ್ಟ ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ.' : 'Water level is critically low in the reservoir.';
        whatToDo = isKn ? 'ಕೂಡಲೇ ತೊಟ್ಟಿಗೆ ನೀರನ್ನು ಹಾಕಿ.' : 'Add water to the reservoir immediately.';
      } else if (nutrientStatus === 'URGENT') {
        whyFactor = isKn ? 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟ ಮಿತಿ ಮೀರಿದೆ.' : 'Nutrient readings are out of safe operating range.';
        whatToDo = isKn ? 'ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಸರಿಹೊಂದಿಸಿ.' : 'Check and adjust nutrient solution balance.';
      }
    } else if (plantStatus === 'ATTENTION' || waterStatus === 'ATTENTION' || nutrientStatus === 'ATTENTION') {
      whatsHappening = isKn ? 'ವ್ಯವಸ್ಥೆಯಲ್ಲಿ ಗಮನಿಸಬೇಕಾದ ಬದಲಾವಣೆ ಇದೆ.' : 'System indicates minor stress or environmental drift.';
      if (waterStatus === 'ATTENTION') {
        whyFactor = isKn ? 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ.' : 'Water level is drifting downward.';
        whatToDo = isKn ? 'ಶೀಘ್ರದಲ್ಲೇ ಹೊಸ ನೀರನ್ನು ಸೇರಿಸಿ.' : 'Top up reservoir with fresh water soon.';
      } else if (nutrientStatus === 'ATTENTION') {
        whyFactor = isKn ? 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ಪರೀಕ್ಷಿಸಿ.' : 'Nutrient balance needs adjustment.';
        whatToDo = isKn ? 'ತೊಟ್ಟಿಯಲ್ಲಿ ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನ ನೋಡಿ.' : 'Check nutrient concentration in tank.';
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
      badgeBg: '#F5EDE4',
      titleColor: '#064E3B',
      iconColor: '#F8E7C9',
      iconBg: '#064E3B',
    },
    attention: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: '#F5EDE4',
      titleColor: '#B47514',
      iconColor: '#F8E7C9',
      iconBg: '#B47514',
    },
    urgent: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: '#F5EDE4',
      titleColor: '#B22222',
      iconColor: '#F8E7C9',
      iconBg: '#B22222',
    },
    unknown: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: '#F5EDE4',
      titleColor: '#064E3B',
      iconColor: '#F8E7C9',
      iconBg: '#064E3B',
    },
    info: {
      border: 'var(--border-default)',
      bg: 'var(--bg-surface)',
      badgeBg: '#F5EDE4',
      titleColor: '#0A7771',
      iconColor: '#F8E7C9',
      iconBg: '#0A7771',
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
        borderRadius: 'var(--radius-lg)',
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        boxShadow: 'var(--shadow-subtle)',
        position: 'relative',
      }}
    >
      {/* Header bar: Icon, Condition Badge, Title */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: variantStyles.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: variantStyles.iconColor,
              flexShrink: 0,
            }}
          >
            <Icon size={18} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="section-label" style={{ fontSize: '10px', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              {isKn ? 'ಕಾರ್ಯಸಾಧ್ಯ ಮಾರ್ಗದರ್ಶನ' : 'MULTIMODAL REASONING ACTION'}
            </span>
            <div style={{ fontSize: '18px', fontWeight: 800, color: variantStyles.titleColor }}>
              {isKn ? copy.actions.title : 'What Should I Do Now?'}
            </div>
          </div>
        </div>

        {/* Condition Badge */}
        <div
          style={{
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: variantStyles.badgeBg,
            color: 'var(--text-primary)',
            border: `1px solid var(--border-default)`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Icon size={14} style={{ color: 'var(--text-primary)' }} />
          {conditionLabel}
        </div>
      </div>

      {/* Structured 3-Part Reasoning Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          borderTop: '1px solid var(--border-default)',
          marginTop: '10px'
        }}
      >
        {/* 1. What's Happening */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--bg-canvas)', width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isKn ? '೧. ಏನಾಗುತ್ತಿದೆ?' : "1. What's happening?"}
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45, fontWeight: 500, paddingLeft: '38px' }}>
            {whatsHappening}
          </p>
        </div>

        {/* 2. Why (Non-causal factor) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRight: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--bg-canvas)', width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isKn ? '೨. ಕಾರಣ / ಸಂಬಂಧಿತ ಅಂಶಗಳು' : '2. Why? (Associated factors)'}
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45, paddingLeft: '38px' }}>
            {whyFactor}
          </p>
        </div>

        {/* 3. What to do */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--bg-canvas)', width: '28px', height: '28px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {isKn ? '೩. ಏನು ಮಾಡಬೇಕು?' : '3. What to do?'}
            </div>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.45, fontWeight: 600, paddingLeft: '38px' }}>
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
            gap: '8px',
            fontSize: '11.5px',
            color: 'var(--color-amber)',
            background: 'rgba(229, 169, 60, 0.1)',
            padding: '7px 12px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(229, 169, 60, 0.25)',
          }}
        >
          <AlertTriangle size={14} style={{ flexShrink: 0 }} />
          <span>
            {isKn
              ? 'ಸೆನ್ಸರ್ ಮಾಹಿತಿ ಲಭ್ಯವಿಲ್ಲ — ಕ್ಯಾಮೆರಾ ತಪಾಸಣೆಯ ಆಧಾರದ ಮೇಲೆ ಮಾತ್ರ ಸಲಹೆ ನೀಡಲಾಗಿದೆ.'
              : 'Sensor data unavailable — recommendations based on visual camera inspection only.'}
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
          gap: '10px',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '10px',
        }}
      >
        <Link
          href="/dashboard/intelligence"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-teal)',
            textDecoration: 'none',
          }}
        >
          <Activity size={14} />
          <span>{isKn ? 'ಸಂಪೂರ್ಣ ಕಾರಣ ವಿಶ್ಲೇಷಣೆ ವೀಕ್ಷಿಸಿ →' : 'View Full Plant Reasoning Lab →'}</span>
        </Link>

        {hasMultipleRecs && (
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px', cursor: 'pointer' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
          {reasoningEvent ? (
            reasoningEvent.recommendations.slice(1).map((rec, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  padding: '6px 10px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                • {rec}
              </div>
            ))
          ) : (
            recommendations.slice(1).map((rec) => (
              <div key={rec.id} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                • <strong style={{ color: 'var(--text-primary)' }}>{rec.title}</strong>: {rec.action}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
