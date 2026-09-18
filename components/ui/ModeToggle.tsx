'use client';

import React from 'react';
import { Sprout, Microchip } from 'lucide-react';
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
        borderRadius: 'var(--radius-full)',
        padding: '3px',
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
          gap: '6px',
          padding: size === 'sm' ? '4px 10px' : '6px 14px',
          fontSize: size === 'sm' ? '11px' : '12px',
          fontWeight: 700,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: isFarmer ? 'var(--color-green)' : 'transparent',
          color: isFarmer ? '#051311' : 'var(--text-secondary)',
          boxShadow: isFarmer ? '0 2px 8px rgba(46, 184, 114, 0.25)' : 'none',
        }}
      >
        <Sprout size={size === 'sm' ? 12 : 14} />
        <span>{isKn ? 'ರೈತರ ಮೋಡ್' : 'Farmer Mode'}</span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={!isFarmer}
        onClick={() => onModeChange('technical')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: size === 'sm' ? '4px 10px' : '6px 14px',
          fontSize: size === 'sm' ? '11px' : '12px',
          fontWeight: 700,
          borderRadius: 'var(--radius-full)',
          border: 'none',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          background: !isFarmer ? 'var(--color-teal)' : 'transparent',
          color: !isFarmer ? '#051311' : 'var(--text-secondary)',
          boxShadow: !isFarmer ? '0 2px 8px rgba(28, 167, 160, 0.25)' : 'none',
        }}
      >
        <Microchip size={size === 'sm' ? 12 : 14} />
        <span>{isKn ? 'ತಾಂತ್ರಿಕ ಮೋಡ್' : 'Technical Mode'}</span>
      </button>
    </div>
  );
}
