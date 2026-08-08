'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { ESP32SerialProvider, useESP32Serial } from '@/lib/esp32/ESP32SerialContext';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ESP32SerialProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
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
      <Sidebar systemStatus={systemStatus} alertCount={alertCount} />
      <main className={styles.main}>
        {/* Unified route transition container */}
        <div key={pathname} className="page-transition">
          {children}
        </div>
      </main>
    </div>
  );
}
