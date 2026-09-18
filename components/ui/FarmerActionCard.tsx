'use client';

import React from 'react';
import { ClipboardCheck, AlertTriangle, CheckCircle2, HelpCircle } from 'lucide-react';
import { FarmerSemanticState } from '@/lib/intelligence/farmerSemanticLayer';
import { RecommendationItem } from '@/lib/intelligence/types';

interface FarmerActionCardProps {
  semanticState: FarmerSemanticState;
  recommendations?: RecommendationItem[];
}

export function FarmerActionCard({ semanticState, recommendations = [] }: FarmerActionCardProps) {
  const { plantStatus, waterStatus, nutrientStatus, cameraStatus, hasSufficientData } = semanticState;
  const [showAll, setShowAll] = React.useState(false);

  const isKn = semanticState.language === 'kn';

  // Derive the clear primary action text
  let actionTitle = isKn ? 'ಎಲ್ಲವೂ ಸರಿಯಾಗಿದೆ' : 'System Stable';
  let actionMessage = isKn
    ? 'ನಿಮ್ಮ ಗಿಡ ಚೆನ್ನಾಗಿದೆ. ಈಗ ಯಾವುದೇ ಕ್ರಮದ ಅಗತ್ಯವಿಲ್ಲ.'
    : 'Your plant appears to be doing well. No action needed right now.';
  let cardVariant: 'good' | 'attention' | 'urgent' | 'unknown' = 'good';
  let Icon = CheckCircle2;

  if (!hasSufficientData) {
    cardVariant = 'unknown';
    actionTitle = isKn ? 'ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಬೇಕಾಗಿದೆ' : 'More Data Needed';
    actionMessage = isKn
      ? 'ಕ್ರಮವನ್ನು ಸೂಚಿಸಲು ಇನ್ನಷ್ಟು ಮಾಹಿತಿ ಬೇಕು. ಸೆನ್ಸರ್ ಸಂಪರ್ಕಿಸಿ ಅಥವಾ ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ.'
      : 'We need more information before suggesting an action. Connect sensors or start the camera from Dashboard.';
    Icon = HelpCircle;
  } else if (plantStatus === 'URGENT' || waterStatus === 'URGENT' || nutrientStatus === 'URGENT') {
    cardVariant = 'urgent';
    actionTitle = isKn ? 'ತಕ್ಷಣದ ಕ್ರಮದ ಅಗತ್ಯವಿದೆ' : 'Immediate Action Suggested';
    Icon = AlertTriangle;

    if (waterStatus === 'URGENT') {
      actionMessage = isKn
        ? 'ನೀರಿನ ಮಟ್ಟ ತುಂಬಾ ಕಡಿಮೆಯಾಗಿದೆ. ಕೂಡಲೇ ತೊಟ್ಟಿಗೆ ನೀರನ್ನು ಹಾಕಿ.'
        : 'Water level is critically low. Add water to the reservoir immediately.';
    } else if (nutrientStatus === 'URGENT') {
      actionMessage = isKn
        ? 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟ ಸರಿಪಡಿಸಬೇಕಾಗಿದೆ. ಪೋಷಕಾಂಶಗಳ ದ್ರಾವಣವನ್ನು ಸರಿಹೊಂದಿಸಿ.'
        : 'Nutrient readings need urgent attention. Check and adjust the nutrient solution.';
    } else if (recommendations.length > 0) {
      actionMessage = `${recommendations[0].title}. ${recommendations[0].action}`;
    } else {
      actionMessage = semanticState.actionableSummary || (isKn
        ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಈಗಲೇ ಗಮನ ಬೇಕಾಗಿದೆ. ತೊಟ್ಟಿ ಮತ್ತು ಸೆನ್ಸರ್ ಸಂಪರ್ಕ ಪರಿಶೀಲಿಸಿ.'
        : 'Your plant needs attention right now. Inspect reservoir and probe connections.');
    }
  } else if (
    plantStatus === 'ATTENTION' ||
    waterStatus === 'ATTENTION' ||
    nutrientStatus === 'ATTENTION' ||
    cameraStatus === 'LOW_CONFIDENCE' ||
    cameraStatus === 'NO_PLANT'
  ) {
    cardVariant = 'attention';
    actionTitle = isKn ? 'ಸಲಹೆ ನೀಡಲಾದ ಕ್ರಮ' : 'Recommended Action';
    Icon = AlertTriangle;

    if (waterStatus === 'ATTENTION') {
      actionMessage = isKn
        ? 'ನೀರಿನ ಮಟ್ಟ ಕಡಿಮೆಯಾಗುತ್ತಿದೆ. ಶೀಘ್ರದಲ್ಲೇ ಹೊಸ ನೀರನ್ನು ಸೇರಿಸಿ.'
        : 'Water level is getting low. Consider adding fresh water soon.';
    } else if (nutrientStatus === 'ATTENTION') {
      actionMessage = isKn
        ? 'ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ಪರೀಕ್ಷಿಸಿ. ತೊಟ್ಟಿಯಲ್ಲಿ ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನ ನೋಡಿ.'
        : 'Nutrient readings need attention. Check nutrient balance in the tank.';
    } else if (cameraStatus === 'LOW_CONFIDENCE') {
      actionMessage = isKn
        ? 'ಗಿಡದ ನೋಟ ಸ್ಪಷ್ಟವಾಗಿಲ್ಲ. ಕ್ಯಾಮೆರಾವನ್ನು ಗಿಡದ ಹತ್ತಿರಕ್ಕೆ ತಂದು ನೋಡಿ.'
        : 'Your plant view is unclear. Move the camera closer and try again.';
    } else if (cameraStatus === 'NO_PLANT') {
      actionMessage = isKn
        ? 'ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಗಿಡ ಕಂಡುಬಂದಿಲ್ಲ. ಗಿಡವನ್ನು ಕ್ಯಾಮೆರಾ ಮುಂದೆ ಇಡಿ.'
        : 'No plant detected in camera frame. Position your plant inside camera view.';
    } else if (recommendations.length > 0) {
      actionMessage = `${recommendations[0].title}. ${recommendations[0].action}`;
    } else {
      actionMessage = semanticState.actionableSummary || (isKn
        ? 'ನಿಮ್ಮ ಗಿಡಕ್ಕೆ ಸ್ವಲ್ಪ ಗಮನ ಬೇಕಾಗಿದೆ. ನೀರು ಮತ್ತು ಪೋಷಕಾಂಶಗಳನ್ನು ಗಮನಿಸಿ.'
        : 'Your plant may need minor attention. Monitor water and nutrient levels.');
    }
  }

  const variantStyles = {
    good: {
      border: 'rgba(46, 184, 114, 0.35)',
      bg: 'var(--bg-tint-green)',
      titleColor: 'var(--color-green)',
      iconColor: 'var(--color-green)',
    },
    attention: {
      border: 'rgba(229, 169, 60, 0.35)',
      bg: 'var(--bg-tint-amber)',
      titleColor: 'var(--color-amber)',
      iconColor: 'var(--color-amber)',
    },
    urgent: {
      border: 'rgba(217, 93, 98, 0.45)',
      bg: 'var(--bg-tint-red)',
      titleColor: 'var(--color-red)',
      iconColor: 'var(--color-red)',
    },
    unknown: {
      border: 'var(--border-subtle)',
      bg: 'var(--bg-surface)',
      titleColor: 'var(--text-secondary)',
      iconColor: 'var(--text-muted)',
    },
  }[cardVariant];

  const hasMultiple = recommendations.length > 1;

  return (
    <div
      style={{
        background: variantStyles.bg,
        border: `1px solid ${variantStyles.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '18px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(5, 19, 17, 0.5)',
            border: `1px solid ${variantStyles.border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: variantStyles.iconColor,
            flexShrink: 0,
          }}
        >
          <Icon size={20} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardCheck size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="section-label" style={{ fontSize: '10px' }}>
              What should I do now?
            </span>
          </div>

          <div style={{ fontSize: '15px', fontWeight: 800, color: variantStyles.titleColor }}>
            {actionTitle}
          </div>

          <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4, fontWeight: 500 }}>
            {actionMessage}
          </p>
        </div>
      </div>

      {hasMultiple && (
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '11px', color: 'var(--color-teal)', padding: '2px 0', cursor: 'pointer' }}
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Hide additional recommendations' : `View ${recommendations.length - 1} additional recommendation(s)`}
          </button>

          {showAll && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
              {recommendations.slice(1).map((rec) => (
                <div key={rec.id} style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  • <strong style={{ color: 'var(--text-primary)' }}>{rec.title}</strong>: {rec.action}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
