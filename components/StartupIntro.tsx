'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './StartupIntro.module.css';

export function StartupIntro() {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // If the intro has already completed, do not run the startup redirect logic again
    if (!visible) return;

    // Check if session exists in browser storage
    const email = typeof window !== 'undefined' ? localStorage.getItem('hydro_user_email') : null;
    const isAuthenticated = !!email;

    // Trigger visual fade-out sequence at 2.3 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2300);

    // Unmount and coordinate routes at 2.7 seconds
    const unmountTimer = setTimeout(() => {
      setVisible(false);

      if (isAuthenticated) {
        // Authenticated user landing on sign-in or splash is routed to the dashboard
        if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
          router.replace('/dashboard');
        }
      } else {
        // Unauthenticated user attempting to access dashboard is routed to entry
        if (pathname.startsWith('/dashboard')) {
          router.replace('/');
        }
      }
    }, 2700);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [pathname, router, visible]);

  if (!visible) return null;

  return (
    <div className={`${styles.overlay} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.gridOverlay} />
      <div className={styles.ambientGlow} />
      <div className={styles.content}>
        <svg className={styles.svgTrace} viewBox="0 0 100 100">
          {/* Water Waves */}
          <path className={styles.drawWater} d="M 15,80 Q 32.5,73 50,80 T 85,80" />
          
          {/* Sensor probe */}
          <line className={styles.drawSensor} x1="50" y1="45" x2="50" y2="76" />
          <circle className={styles.drawSensor} cx="50" cy="45" r="3" />
          <line className={styles.drawSensor} x1="45" y1="65" x2="55" y2="65" />
          <line className={styles.drawSensor} x1="47" y1="70" x2="53" y2="70" />
          
          {/* Plant structure growing upwards */}
          <path className={styles.drawPlant} d="M 50,42 L 50,15 M 50,30 Q 62,22 65,22 M 50,22 Q 38,15 35,15" />
        </svg>
        <h1 className={styles.brandName}>Smart Hydroponics</h1>
        <p className={styles.brandSubtitle}>Precision Cultivation & Telemetry Platform</p>
      </div>
    </div>
  );
}
