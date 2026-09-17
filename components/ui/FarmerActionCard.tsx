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

  // Derive the clear primary action text
  let actionTitle = 'System Stable';
  let actionMessage = 'Your plant appears to be doing well. No action needed right now.';
  let cardVariant: 'good' | 'attention' | 'urgent' | 'unknown' = 'good';
  let Icon = CheckCircle2;

  if (!hasSufficientData) {
    cardVariant = 'unknown';
    actionTitle = 'More Data Needed';
    actionMessage = 'We need more information before suggesting an action. Connect sensors or start the camera from Dashboard.';
    Icon = HelpCircle;
  } else if (plantStatus === 'URGENT' || waterStatus === 'URGENT' || nutrientStatus === 'URGENT') {
    cardVariant = 'urgent';
    actionTitle = 'Immediate Action Suggested';
    Icon = AlertTriangle;

    if (waterStatus === 'URGENT') {
      actionMessage = 'Water level is critically low. Add water to the reservoir immediately.';
    } else if (nutrientStatus === 'URGENT') {
      actionMessage = 'Nutrient readings need urgent attention. Check and adjust the nutrient solution.';
    } else if (recommendations.length > 0) {
      actionMessage = `${recommendations[0].title}. ${recommendations[0].action}`;
    } else {
      actionMessage = 'Your plant needs attention right now. Inspect reservoir and probe connections.';
    }
  } else if (
    plantStatus === 'ATTENTION' ||
    waterStatus === 'ATTENTION' ||
    nutrientStatus === 'ATTENTION' ||
    cameraStatus === 'LOW_CONFIDENCE' ||
    cameraStatus === 'NO_PLANT'
  ) {
    cardVariant = 'attention';
    actionTitle = 'Recommended Action';
    Icon = AlertTriangle;

    if (waterStatus === 'ATTENTION') {
      actionMessage = 'Water level is getting low. Consider adding fresh water soon.';
    } else if (nutrientStatus === 'ATTENTION') {
      actionMessage = 'Nutrient readings need attention. Check nutrient balance in the tank.';
    } else if (cameraStatus === 'LOW_CONFIDENCE') {
      actionMessage = 'Your plant view is unclear. Move the camera closer and try again.';
    } else if (cameraStatus === 'NO_PLANT') {
      actionMessage = 'No plant detected in camera frame. Position your plant inside camera view.';
    } else if (recommendations.length > 0) {
      actionMessage = `${recommendations[0].title}. ${recommendations[0].action}`;
    } else {
      actionMessage = 'Your plant may need minor attention. Monitor water and nutrient levels.';
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

  return (
    <div
      style={{
        background: variantStyles.bg,
        border: `1px solid ${variantStyles.border}`,
        borderRadius: 'var(--radius-lg)',
        padding: '18px 22px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
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
  );
}
