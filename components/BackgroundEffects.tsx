'use client';

import { useEffect, useState } from 'react';
import styles from './BackgroundEffects.module.css';

export function BackgroundEffects() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return (
    <div className={styles.backgroundContainer}>
      <div className={styles.backgroundImage} />
      <div className={styles.overlay} />
    </div>
  );
}
