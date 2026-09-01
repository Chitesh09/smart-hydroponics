'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth/AuthContext';
import { ESP32SerialProvider, useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { CameraProvider } from '@/lib/camera/CameraContext';
import { PlantIntelligenceProvider } from '@/lib/intelligence/PlantIntelligenceContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Menu } from 'lucide-react';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ESP32SerialProvider>
      <CameraProvider>
        <PlantIntelligenceProvider>
          <DashboardLayoutContent>{children}</DashboardLayoutContent>
        </PlantIntelligenceProvider>
      </CameraProvider>
    </ESP32SerialProvider>
  );
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { mode, latestReading, isStale } = useESP32Serial();
  const [simSystemStatus, setSimSystemStatus] = useState<'stable' | 'correcting' | 'fault'>('stable');
  const [alertCount, setAlertCount] = useState(0);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Route security gate: Enforce Firebase authenticated session
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [authLoading, isAuthenticated, router]);

  // Automatically collapse mobile drawer upon route navigation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMobileOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Derive systemStatus dynamically based on the active mode
  const systemStatus = mode === 'real'
    ? (isStale || (latestReading && latestReading.waterLevel < 15) ? 'fault' : 'stable')
    : simSystemStatus;

  useEffect(() => {
    if (mode === 'real') {
      return; // No simulation polling in real mode
    }

    // If in simulation mode, poll simulator status
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/simulate');
        if (res.ok) {
          const data = await res.json();
          setSimSystemStatus(data.status);
          if (data.status === 'fault') setAlertCount(prev => prev + 1);
        }
      } catch (_err) {
        setSimSystemStatus('fault');
      }
    };

    const interval = setInterval(fetchStatus, 2000);
    fetchStatus();
    return () => clearInterval(interval);
  }, [mode]);

  // While determining Firebase authentication state, render loading shell
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#071A17',
        color: '#F1F7F4'
      }}>
        <BrandLogo size={56} priority />
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '12px', marginBottom: '4px' }}>
          HydroSmart
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          Verifying authenticated session...
        </p>
      </div>
    );
  }

  // Do not render any dashboard markup if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.layout}>
      {/* Mobile Top Header (Visible only on mobile/tablet viewports) */}
      <header className={styles.mobileHeader}>
        <button 
          className={styles.menuBtn} 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label="Toggle navigation drawer"
        >
          <Menu size={22} />
        </button>
        <div className={styles.mobileLogo}>
          <BrandLogo size={22} showText />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: mode === 'real' && !isStale ? 'var(--color-green)' : 'var(--color-warning)'
          }} />
          <span style={{ color: 'var(--text-secondary)' }}>{mode === 'real' ? 'LIVE' : 'DEMO'}</span>
        </div>
      </header>

      {/* Drawer Overlay Backdrop (Mobile viewports only) */}
      {isMobileOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar (Responsive drawer on mobile, static side panel on desktop) */}
      <Sidebar 
        systemStatus={systemStatus} 
        alertCount={alertCount} 
        isOpen={isMobileOpen}
        onClose={() => setIsMobileOpen(false)}
      />

      <main className={styles.main}>
        {/* Unified route transition container */}
        <div key={pathname} className="page-transition">
          {children}
        </div>
      </main>
    </div>
  );
}
