'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import styles from './layout.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [systemStatus, setSystemStatus] = useState<'stable' | 'correcting' | 'fault'>('stable');
  const [alertCount, setAlertCount] = useState(0);

  // Poll simulator to update global layout status (health dot on sidebar)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/simulate');
        if (res.ok) {
          const data = await res.json();
          setSystemStatus(data.status);
          if (data.status === 'fault') setAlertCount(prev => prev + 1);
        }
      } catch (err) {
        setSystemStatus('fault');
      }
    };

    const interval = setInterval(fetchStatus, 2000);
    fetchStatus();
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.layout}>
      <Sidebar systemStatus={systemStatus} alertCount={alertCount} />
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
