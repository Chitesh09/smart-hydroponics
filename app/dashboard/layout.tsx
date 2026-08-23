'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { useAuth } from '@/lib/auth/AuthContext';
import { ESP32SerialProvider, useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import { CameraProvider } from '@/lib/camera/CameraContext';
import { PlantIntelligenceProvider } from '@/lib/intelligence/PlantIntelligenceContext';
import { Menu, Leaf } from 'lucide-react';
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
        backgroundColor: '#07111F',
        color: '#F4F7FB'
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'rgba(0, 229, 255, 0.08)',
          border: '1px solid rgba(0, 229, 255, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          color: '#00E5FF'
        }}>
          <Leaf size={28} />
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>HydroSmart Console</h3>
        <p style={{ fontSize: '12.5px', color: '#8FA3B8' }}>Verifying session credentials...</p>
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
          <Leaf size={18} style={{ color: '#00E5FF', marginRight: '6px' }} />
          <span style={{ fontWeight: 800, fontSize: '15px', color: '#F4F7FB', letterSpacing: '-0.01em' }}>HydroSmart</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <span style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: mode === 'real' && !isStale ? '#B7FF3C' : '#FFC857',
            boxShadow: `0 0 6px ${mode === 'real' && !isStale ? '#B7FF3C' : '#FFC857'}`
          }} />
          <span style={{ color: '#8FA3B8' }}>{mode === 'real' ? 'LIVE' : 'DEMO'}</span>
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
