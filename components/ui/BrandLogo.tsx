'use client';

import React from 'react';
import Image from 'next/image';

export type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

interface BrandLogoProps {
  size?: BrandLogoSize;
  showText?: boolean;
  subtitle?: string;
  className?: string;
  style?: React.CSSProperties;
  variant?: 'standard' | 'watermark' | 'hero';
  priority?: boolean;
  alt?: string;
}

export function BrandLogo({
  size = 'md',
  showText = false,
  subtitle,
  className,
  style,
  variant = 'standard',
  priority = false,
  alt = 'HydroSmart Official Brand Logo',
}: BrandLogoProps) {
  const getDimension = (s: BrandLogoSize): number => {
    if (typeof s === 'number') return s;
    switch (s) {
      case 'xs':
        return 20;
      case 'sm':
        return 28;
      case 'md':
        return 36;
      case 'lg':
        return 56;
      case 'xl':
        return 110;
      default:
        return 36;
    }
  };

  const dimension = getDimension(size);

  const opacity = variant === 'watermark' ? 0.12 : 1;

  const imageElement = (
    <div
      style={{
        position: 'relative',
        width: `${dimension}px`,
        height: `${dimension}px`,
        flexShrink: 0,
        opacity,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
      className={className}
    >
      <Image
        src="/logo.png"
        alt={alt}
        width={dimension}
        height={dimension}
        priority={priority}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          imageRendering: 'pixelated', // Keeps pixel art ultra-crisp at any resolution
        }}
      />
    </div>
  );

  if (!showText) {
    return imageElement;
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: dimension >= 48 ? '14px' : '10px' }}>
      {imageElement}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span
          style={{
            fontSize: dimension >= 48 ? '22px' : dimension >= 36 ? '16px' : '14px',
            fontWeight: 800,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
          }}
        >
          HydroSmart
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: dimension >= 48 ? '11px' : '9.5px',
              fontWeight: 600,
              color: 'var(--text-muted)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
