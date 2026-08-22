'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  LanguageOption
} from '@/lib/voice/voiceConfig';

interface LanguageSelectorProps {
  selectedLanguage: SupportedLanguageCode;
  onLanguageChange: (lang: SupportedLanguageCode) => void;
  disabled?: boolean;
}

export function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <Globe size={16} style={{ color: '#00E5FF', flexShrink: 0 }} />
      <select
        className="select"
        style={{
          fontSize: '12px',
          padding: '6px 26px 6px 10px',
          fontWeight: 700,
          background: 'rgba(13, 27, 42, 0.9)',
          borderColor: 'rgba(0, 229, 255, 0.3)',
          color: '#F4F7FB',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value as SupportedLanguageCode)}
        disabled={disabled}
        aria-label="Select voice language"
      >
        {SUPPORTED_LANGUAGES.map((lang: LanguageOption) => (
          <option key={lang.code} value={lang.code}>
            {lang.name} ({lang.englishName})
          </option>
        ))}
      </select>
    </div>
  );
}
