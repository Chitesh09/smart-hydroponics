'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  Radio,
  Settings,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react';
import styles from './Sidebar.module.css';

interface NavItemDef {
  href: string;
  icon: React.ElementType;
  label: string;
}

const navSections: { title: string; items: NavItemDef[] }[] = [
  {
    title: 'Observation',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Plant Command' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/dashboard/intelligence', icon: Sparkles, label: 'Reasoning Lab' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Plant Journey' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/dashboard/devices', icon: Radio, label: 'IoT Station' },
      { href: '/dashboard/profile', icon: Settings, label: 'Settings' },
    ],
  },
];

interface SidebarProps {
  systemStatus?: 'stable' | 'correcting' | 'fault';
  alertCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  systemStatus = 'stable',
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, userProfile, signOut } = useAuth();

  const statusConfig = {
    stable: { color: 'var(--color-green)', label: 'Biological Node Stable' },
    correcting: { color: 'var(--color-amber)', label: 'Calibrating Telemetry' },
    fault: { color: 'var(--color-red)', label: 'Action Required' },
  }[systemStatus];

  const displayName = currentUser?.displayName || userProfile?.displayName || 'Grower';

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* Brand Header with Official Logo */}
      <div className={styles.brand}>
        <BrandLogo size={32} showText subtitle="Living Intelligence" priority />
      </div>

      {/* Hardware Node Status */}
      <div className={styles.nodeStatus}>
        <div
          className={styles.statusDot}
          style={{ '--status-color': statusConfig.color } as React.CSSProperties}
        />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {statusConfig.label}
          </span>
          <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Station HS-ESP32</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {navSections.map((section) => (
          <div key={section.title} className={styles.navSection}>
            <div className={styles.sectionHeading}>{section.title}</div>
            {section.items.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={onClose}
                >
                  <div className={styles.navIcon}>
                    <Icon size={16} />
                  </div>
                  <span style={{ flex: 1 }}>{label}</span>
                  {isActive && <ChevronRight size={13} style={{ color: 'var(--text-dim)' }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Operator Session Footer */}
      <div className={styles.userFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: 'var(--radius-xs)',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-green)',
            }}
          >
            <User size={13} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>Operator</span>
          </div>
        </div>

        <button
          className="btn-ghost"
          style={{ padding: '6px', color: 'var(--text-muted)' }}
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out of account"
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
