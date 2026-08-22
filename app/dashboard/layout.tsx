'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
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
  const { mode, latestReading, isStale } = useESP32Serial();
  const [simSystemStatus, setSimSystemStatus] = useState<'stable' | 'correcting' | 'fault'>('stable');
  const [alertCount, setAlertCount] = useState(0);
  const [authorized, setAuthorized] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Route security gate: check for user session to prevent flashes of protected content
  useEffect(() => {
    const email = typeof window !== 'undefined' ? localStorage.getItem('hydro_user_email') : null;
    if (!email) {
      router.replace('/');
    } else {
      const timer = setTimeout(() => {
        setAuthorized(true);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [router]);

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

  // Do not render any shell markup if not authorized
  if (!authorized) {
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
