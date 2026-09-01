'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import styles from './StartupIntro.module.css';

export function StartupIntro() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // If the intro has already completed, do not run the startup redirect logic again
    if (!visible) return;

    // Trigger visual fade-out sequence at 2.1 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2100);

    // Unmount and coordinate routes at 2.5 seconds
    const unmountTimer = setTimeout(() => {
      setVisible(false);

      if (!loading) {
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
      }
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [pathname, router, visible, isAuthenticated, loading]);

  if (!visible) return null;

  return (
    <div className={`${styles.overlay} ${fadeOut ? styles.fadeOut : ''}`}>
      <div className={styles.gridOverlay} />
      <div className={styles.ambientGlow} />
      <div className={styles.content}>
        <div className={styles.logoAura}>
          <BrandLogo size={88} priority />
        </div>
        <h1 className={styles.brandName}>HydroSmart</h1>
        <p className={styles.brandSubtitle}>Living Intelligence for Plants</p>
        <div className={styles.loadingLine}>
          <div className={styles.loadingProgress} />
        </div>
      </div>
    </div>
  );
}
