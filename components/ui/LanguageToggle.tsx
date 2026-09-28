'use client';

import React from 'react';
import { SupportedLanguageCode, SUPPORTED_LANGUAGES } from '@/lib/assistant/assistantConfig';

interface LanguageToggleProps {
  language: SupportedLanguageCode;
  onLanguageChange: (lang: SupportedLanguageCode) => void;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export function LanguageToggle({
  language,
  onLanguageChange,
  size = 'md',
  showIcon = false,
}: LanguageToggleProps) {
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
      aria-label="Language Selection"
    >
      {showIcon && (
        <span
          style={{
            padding: '0 5px',
            color: 'var(--text-dim)',
            fontSize: '10px',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
          }}
        >
          LANG
        </span>
      )}

      {SUPPORTED_LANGUAGES.map((opt) => {
        const isActive = language === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onLanguageChange(opt.code)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: size === 'sm' ? '3px 8px' : '5px 12px',
              fontSize: size === 'sm' ? '11px' : '12px',
              fontWeight: 700,
              borderRadius: 'var(--radius-xs, 2px)',
              border: isActive ? '1px solid #E8DFD5' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: isActive ? 'var(--color-champagne, #F8E7C9)' : 'transparent',
              color: isActive ? 'var(--color-emerald-ink, #064E3B)' : 'var(--text-secondary)',
            }}
          >
            <span>{opt.nativeScript}</span>
          </button>
        );
      })}
    </div>
  );
}
