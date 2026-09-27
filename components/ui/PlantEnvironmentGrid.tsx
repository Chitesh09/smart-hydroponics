'use client';

import React from 'react';
import { Droplet, Beaker, Leaf, Thermometer, Sprout } from 'lucide-react';
import { FarmerSemanticState } from '@/lib/intelligence/farmerSemanticLayer';

interface PlantEnvironmentGridProps {
  semanticState: FarmerSemanticState;
  language: 'en' | 'kn';
}

export function PlantEnvironmentGrid({ semanticState, language }: PlantEnvironmentGridProps) {
  const isKn = language === 'kn';

  // Derived statuses
  const waterLevel = semanticState.waterStatus === 'GOOD' ? 'GOOD' : semanticState.waterStatus;
  const nutrientLevel = semanticState.nutrientStatus === 'GOOD' ? 'GOOD' : semanticState.nutrientStatus;
  
  // Default pH to Good since we don't have it natively in farmerSemanticState yet
  let phStatus = 'GOOD';
  let phMessage = isKn ? 'pH ಸಮತೋಲನದಲ್ಲಿದೆ' : 'pH is within configured range.';

  const growingConditions = semanticState.environmentStatus === 'GOOD' ? 'GOOD' : semanticState.environmentStatus;

  return (
    <div style={{ marginTop: 'var(--space-md)' }}>
      {/* Header section with badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <div style={{
          background: 'var(--color-emerald-ink)',
          color: 'var(--color-champagne)',
          width: '28px',
          height: '28px',
          borderRadius: 'var(--radius-xs)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Sprout size={16} />
        </div>
        <span style={{
          fontSize: '11px',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '0.05em',
          textTransform: 'uppercase'
        }}>
          {isKn ? 'ಗಿಡದ ಪರಿಸರ ಸಾರಾಂಶ' : 'Plant Environment Summary'}
        </span>
      </div>

      {/* 4 Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px'
      }}>
        
        {/* 1. Water Level */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Droplet size={18} color="var(--text-primary)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isKn ? 'ನೀರಿನ ಮಟ್ಟ' : 'Water Level'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: `var(--color-${semanticState.waterColor})`, textTransform: 'uppercase' }}>
              {waterLevel}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
              {semanticState.waterMessage}
            </div>
          </div>
        </div>

        {/* 2. Nutrient Balance */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Beaker size={18} color="var(--text-primary)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isKn ? 'ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನ' : 'Nutrient Balance'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: `var(--color-${semanticState.nutrientColor})`, textTransform: 'uppercase' }}>
              {nutrientLevel}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
              {semanticState.nutrientMessage}
            </div>
          </div>
        </div>

        {/* 3. Solution Acidity */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--bg-surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold'
            }}>pH</div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isKn ? 'ನೀರಿನ ಆಮ್ಲೀಯತೆ (pH)' : 'Solution Acidity'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: phStatus === 'GOOD' ? 'var(--color-green)' : 'var(--color-amber)', textTransform: 'uppercase' }}>
              {phStatus}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
              {phMessage}
            </div>
          </div>
        </div>

        {/* 4. Growing Conditions */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Leaf size={18} color="var(--text-primary)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {isKn ? 'ಬೆಳವಣಿಗೆಯ ಪರಿಸ್ಥಿತಿ' : 'Growing Conditions'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: `var(--color-green)`, textTransform: 'uppercase' }}>
              {growingConditions}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
              {semanticState.environmentMessage}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
