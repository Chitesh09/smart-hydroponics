'use client';

import React from 'react';
import { AssistantMode, SupportedLanguageCode } from '@/lib/assistant/assistantConfig';

interface ModeToggleProps {
  mode: AssistantMode;
  onModeChange: (mode: AssistantMode) => void;
  language?: SupportedLanguageCode;
  size?: 'sm' | 'md';
}

export function ModeToggle({ mode, onModeChange, language = 'en', size = 'md' }: ModeToggleProps) {
  const isFarmer = mode === 'farmer';
  const isKn = language === 'kn';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-sm, 4px)',
        padding: '2px',
        gap: '2px',
      }}
      role="radiogroup"
      aria-label={isKn ? 'ಅಪ್ಲಿಕೇಶನ್ ಮೋಡ್ ಆಯ್ಕೆ' : 'Application View Mode'}
    >
      <button
        type="button"
        role="radio"
        aria-checked={isFarmer}
        onClick={() => onModeChange('farmer')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: size === 'sm' ? '3px 8px' : '5px 12px',
          fontSize: size === 'sm' ? '11px' : '12px',
          fontWeight: 700,
          borderRadius: 'var(--radius-xs, 2px)',
          border: isFarmer ? '1px solid #E8DFD5' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: isFarmer ? 'var(--color-champagne, #F8E7C9)' : 'transparent',
          color: isFarmer ? 'var(--color-emerald-ink, #064E3B)' : 'var(--text-secondary)',
        }}
      >
        <span style={{ fontSize: '9px', lineHeight: 1 }}>{isFarmer ? '●' : '○'}</span>
        <span>{isKn ? 'ರೈತರ ಮೋಡ್' : 'Farmer'}</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={!isFarmer}
        onClick={() => onModeChange('technical')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          padding: size === 'sm' ? '3px 8px' : '5px 12px',
          fontSize: size === 'sm' ? '11px' : '12px',
          fontWeight: 700,
          borderRadius: 'var(--radius-xs, 2px)',
          border: !isFarmer ? '1px solid #E8DFD5' : '1px solid transparent',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: !isFarmer ? 'var(--color-champagne, #F8E7C9)' : 'transparent',
          color: !isFarmer ? 'var(--color-emerald-ink, #064E3B)' : 'var(--text-secondary)',
        }}
      >
        <span style={{ fontSize: '9px', lineHeight: 1 }}>{!isFarmer ? '●' : '○'}</span>
        <span>{isKn ? 'ತಾಂತ್ರಿಕ ಮೋಡ್' : 'Technical'}</span>
      </button>
    </div>
  );
}
