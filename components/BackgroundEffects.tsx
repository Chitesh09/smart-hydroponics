'use client';

import { useEffect, useState } from 'react';
import styles from './BackgroundEffects.module.css';

export function BackgroundEffects() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.backgroundContainer}>
      {/* Base generated calming image */}
      <div className={styles.backgroundImage} />
      
      {/* Dark overlay to ensure contrast and readability over the app */}
      <div className={styles.overlay} />

      {/* Floating particles (bubbles / glowing orbs) */}
      <div className={styles.floater} style={{ left: '10%', animationDuration: '24s', animationDelay: '0s', width: '40px', height: '40px' }} />
      <div className={styles.floater} style={{ left: '80%', animationDuration: '32s', animationDelay: '2s', width: '60px', height: '60px' }} />
      <div className={styles.floater} style={{ left: '30%', animationDuration: '28s', animationDelay: '5s', width: '30px', height: '30px' }} />
      <div className={styles.floater} style={{ left: '60%', animationDuration: '26s', animationDelay: '8s', width: '50px', height: '50px' }} />
      <div className={styles.floater} style={{ left: '90%', animationDuration: '35s', animationDelay: '12s', width: '80px', height: '80px' }} />
      <div className={styles.floater} style={{ left: '45%', animationDuration: '40s', animationDelay: '15s', width: '100px', height: '100px' }} />
      <div className={styles.floater} style={{ left: '20%', animationDuration: '22s', animationDelay: '18s', width: '25px', height: '25px' }} />
    </div>
  );
}
