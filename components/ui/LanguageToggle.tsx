'use client';

import React from 'react';
import { SupportedLanguageCode, SUPPORTED_LANGUAGES } from '@/lib/assistant/assistantConfig';
import { Languages } from 'lucide-react';

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
        borderRadius: 'var(--radius-full)',
        padding: '3px',
        gap: '2px',
      }}
      role="radiogroup"
      aria-label="Language Selection"
    >
      {showIcon && (
        <div style={{ padding: '0 6px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
          <Languages size={size === 'sm' ? 12 : 14} />
        </div>
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
              gap: '5px',
              padding: size === 'sm' ? '4px 10px' : '6px 14px',
              fontSize: size === 'sm' ? '11px' : '12px',
              fontWeight: 700,
              borderRadius: 'var(--radius-full)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: isActive ? 'var(--color-teal)' : 'transparent',
              color: isActive ? '#051311' : 'var(--text-secondary)',
              boxShadow: isActive ? '0 2px 8px rgba(28, 167, 160, 0.25)' : 'none',
            }}
          >
            <span>{opt.nativeScript}</span>
          </button>
        );
      })}
    </div>
  );
}
