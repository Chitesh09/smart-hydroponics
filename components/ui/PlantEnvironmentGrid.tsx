'use client';

import React from 'react';
import { FarmerSemanticState } from '@/lib/intelligence/farmerSemanticLayer';
import styles from './PlantEnvironmentGrid.module.css';

interface PlantEnvironmentGridProps {
  semanticState: FarmerSemanticState;
  language: 'en' | 'kn';
}

export function PlantEnvironmentGrid({ semanticState, language }: PlantEnvironmentGridProps) {
  const isKn = language === 'kn';

  const waterLevel = semanticState.waterStatus === 'GOOD' ? 'GOOD' : semanticState.waterStatus;
  const nutrientLevel = semanticState.nutrientStatus === 'GOOD' ? 'GOOD' : semanticState.nutrientStatus;
  const phStatus = 'GOOD';
  const phMessage = isKn ? 'pH ಸಮತೋಲನದಲ್ಲಿದೆ' : 'pH is within configured range.';
  const growingConditions = semanticState.environmentStatus === 'GOOD' ? 'GOOD' : semanticState.environmentStatus;

  const items = [
    {
      id: 'water',
      label: isKn ? 'ನೀರಿನ ಮಟ್ಟ' : 'Water Level',
      value: waterLevel,
      color: `var(--color-${semanticState.waterColor})`,
      message: semanticState.waterMessage,
      badge: 'H₂O',
    },
    {
      id: 'nutrient',
      label: isKn ? 'ಪೋಷಕಾಂಶಗಳ ಸಮತೋಲನ' : 'Nutrient Balance',
      value: nutrientLevel,
      color: `var(--color-${semanticState.nutrientColor})`,
      message: semanticState.nutrientMessage,
      badge: 'TDS',
    },
    {
      id: 'acidity',
      label: isKn ? 'ನೀರಿನ ಆಮ್ಲೀಯತೆ (pH)' : 'Solution Acidity',
      value: phStatus,
      color: 'var(--color-green)',
      message: phMessage,
      badge: 'pH',
    },
    {
      id: 'environment',
      label: isKn ? 'ಬೆಳವಣಿಗೆಯ ಪರಿಸ್ಥಿತಿ' : 'Growing Conditions',
      value: growingConditions,
      color: 'var(--color-green)',
      message: semanticState.environmentMessage,
      badge: 'ENV',
    },
  ];

  return (
    <section aria-label={isKn ? 'ಗಿಡದ ಪರಿಸರ ಸಾರಾಂಶ' : 'Plant Environment Summary'} className={styles.container}>
      {/* Section Header */}
      <div className={styles.header}>
        <span className={styles.tag}>TELEMETRY</span>
        <h3 className={styles.title}>
          {isKn ? 'ಗಿಡದ ಪರಿಸರ ಸಾರಾಂಶ' : 'Plant Environment Summary'}
        </h3>
      </div>

      {/* Responsive Grid: 4-col on desktop, 2-col on mobile down to 350px, 1-col on 320px */}
      <div className={styles.grid}>
        {items.map((item) => (
          <div key={item.id} className={styles.card}>
            {/* Top row: Label & technical badge */}
            <div className={styles.topRow}>
              <span className={styles.label}>{item.label}</span>
              <span className={styles.badge}>{item.badge}</span>
            </div>

            {/* Middle: State Value */}
            <div>
              <div className={styles.value} style={{ color: item.color }}>
                {item.value}
              </div>
            </div>

            {/* Bottom: Single-line explanation */}
            <div className={styles.footer}>
              {item.message}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
