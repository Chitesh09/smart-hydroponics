'use client';

import React from 'react';
import { Sprout, Clock, Sparkles, Activity } from 'lucide-react';
import { PlantProfile } from '@/lib/intelligence/types';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SupportedLanguageCode, AssistantMode } from '@/lib/assistant/assistantConfig';

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
  const isTechnical = userMode === 'technical';

  const isIdentified = Boolean(
    profile.species &&
    profile.species !== 'Unknown Plant' &&
    profile.species !== 'unknown_plant'
  );

  const plantName = isIdentified
    ? (profile.commonName || profile.species)
    : (isKn ? 'ಗಿಡ' : 'Plant');

  const speciesSubtitle = isIdentified
    ? (profile.scientificName || (isKn ? 'ವರ್ಗೀಕರಿಸಿದ ಪ್ರಭೇದ' : 'Botanical Specimen'))
    : (isKn ? 'ಗಿಡದ ಪ್ರಕಾರ ಇನ್ನೂ ಗುರುತಿಸಲಾಗಿಲ್ಲ' : 'Plant type not identified yet');

  const [now, setNow] = React.useState<number | null>(null);

  React.useEffect(() => {
    setNow(Date.now());
  }, []);

  const ageDays = (now && profile.createdAt)
    ? Math.max(1, Math.round((now - profile.createdAt) / 86400000) + 1)
    : 1;
  const totalObs = observationsCount !== undefined ? observationsCount : profile.observationCount;

  // Format relative last observed string
  const lastObservedStr = React.useMemo(() => {
    if (!profile.lastObservedAt || !now) {
      return isKn ? 'ದಾಖಲೆಯಿಲ್ಲ' : 'No records yet';
    }
    const diffMs = now - profile.lastObservedAt;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMin / 60);

    if (diffMin < 2) return isKn ? 'ಈಗಷ್ಟೇ' : 'Just now';
    if (diffMin < 60) return isKn ? `${diffMin} ನಿಮಿಷದ ಹಿಂದೆ` : `${diffMin}m ago`;
    if (diffHours < 24) return isKn ? `${diffHours} ಗಂಟೆಯ ಹಿಂದೆ` : `${diffHours}h ago`;
    return new Date(profile.lastObservedAt).toLocaleDateString(isKn ? 'kn-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  }, [profile.lastObservedAt, now, isKn]);

  const conditionLabel = React.useMemo(() => {
    switch (profile.currentHealthStatus) {
      case 'optimal':
        return isKn ? 'ಉತ್ತಮವಾಗಿದೆ' : 'Doing well';
      case 'warning':
        return isKn ? 'ಗಮನ ಅಗತ್ಯವಿದೆ' : 'Needs attention';
      case 'critical':
        return isKn ? 'ತುರ್ತು ಗಮನಿಸಿ' : 'Urgent attention';
      default:
        return isKn ? 'ಸ್ಥಿರವಾಗಿದೆ' : 'Stable';
    }
  }, [profile.currentHealthStatus, isKn]);

  return (
    <div
      style={{
        background: 'var(--bg-canvas)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: compact ? '16px 18px' : '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sprout size={16} style={{ color: 'var(--color-green)' }} />
          <span className="section-label" style={{ fontSize: '11px', letterSpacing: '0.08em' }}>
            {isKn ? 'ನನ್ನ ಗಿಡ' : 'MY PLANT'}
          </span>
        </div>
        <StatusBadge
          status={profile.currentHealthStatus === 'critical' ? 'critical' : profile.currentHealthStatus === 'warning' ? 'warning' : 'optimal'}
          label={conditionLabel}
          size="sm"
        />
      </div>

      {/* Specimen Identity */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{isIdentified ? '🌿' : '🌱'}</span>
            <span>{plantName}</span>
          </div>
          <div style={{ fontSize: '12px', fontStyle: isIdentified ? 'italic' : 'normal', color: isIdentified ? 'var(--text-secondary)' : 'var(--color-teal)', marginTop: '2px' }}>
            {speciesSubtitle}
          </div>
        </div>

        {/* Growth Age Badge */}
        <div
          style={{
            padding: '6px 14px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
          }}
        >
          <span className="scientific-meta" style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
            {isKn ? 'ಬೆಳವಣಿಗೆಯ ಅವಧಿ' : 'MONITORING AGE'}
          </span>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-green)', marginTop: '1px' }}>
            {isKn ? `ದಿನ ${ageDays}` : `Day ${ageDays}`}
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '10px',
          paddingTop: '6px',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        {/* Observations count */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={14} style={{ color: 'var(--color-teal)' }} />
          <div>
            <div className="scientific-meta" style={{ fontSize: '9.5px' }}>
              {isKn ? 'ಒಟ್ಟು ತಪಾಸಣೆಗಳು' : 'OBSERVATIONS'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {totalObs}
            </div>
          </div>
        </div>

        {/* Last observed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={14} style={{ color: 'var(--color-green)' }} />
          <div>
            <div className="scientific-meta" style={{ fontSize: '9.5px' }}>
              {isKn ? 'ಕೊನೆಯ ತಪಾಸಣೆ' : 'LAST CHECKED'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {lastObservedStr}
            </div>
          </div>
        </div>

        {/* Condition status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={14} style={{ color: 'var(--color-amber)' }} />
          <div>
            <div className="scientific-meta" style={{ fontSize: '9.5px' }}>
              {isKn ? 'ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ' : 'CONDITION'}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {conditionLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Technical Diagnostics Details */}
      {isTechnical && (
        <div
          style={{
            marginTop: '2px',
            padding: '8px 12px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span>plantId: <strong style={{ color: 'var(--text-primary)' }}>{profile.plantId}</strong></span>
          <span>status: <strong>{profile.monitoringStatus}</strong></span>
          {profile.speciesConfidence && (
            <span>confidence: <strong>{profile.speciesConfidence}%</strong></span>
          )}
        </div>
      )}
    </div>
  );
}
