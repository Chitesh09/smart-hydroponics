'use client';

import React from 'react';
import {
  VoiceState,
  SupportedLanguageCode,
  VOICE_STATE_MAP
} from '@/lib/voice/voiceConfig';
import styles from './PlantVoiceAssistant.module.css';

interface VoiceStatusProps {
  voiceState: VoiceState;
  language: SupportedLanguageCode;
  customError?: string;
}

export function VoiceStatus({
  voiceState,
  language,
  customError,
}: VoiceStatusProps) {
  const stateTexts = VOICE_STATE_MAP[voiceState]?.[language] || VOICE_STATE_MAP[voiceState]?.['en-IN'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
      <div className={styles.statusLabel}>
        {voiceState === 'error' && customError ? customError : stateTexts?.label}
      </div>
      <div className={styles.statusSublabel}>
        {stateTexts?.sublabel}
      </div>
    </div>
  );
}
