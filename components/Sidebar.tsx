'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Cpu,
  Settings,
  Leaf,
  Activity,
  ChevronRight
} from 'lucide-react';
import styles from './Sidebar.module.css';

const overviewItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Live monitoring' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', description: 'Historical data' },
];

const systemItems = [
  { href: '/dashboard/hardware', icon: Cpu, label: 'Hardware', description: 'System Overview' },
  { href: '/dashboard/profile', icon: Settings, label: 'Settings', description: 'Station config' },
];

interface SidebarProps {
  systemStatus?: 'stable' | 'correcting' | 'fault';
  alertCount?: number;
}

export function Sidebar({ systemStatus = 'stable', alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  // Vibrant semantic mapping matching design tokens
  const statusColor = {
    stable: '#B7FF3C',      // Vibrant Lime
    correcting: '#FFC857',  // Amber
    fault: '#FF6B4A',       // Coral
  }[systemStatus];

  const statusLabel = {
    stable: 'System Optimal',
    correcting: 'Stabilizing...',
    fault: 'Action Required',
  }[systemStatus];

  const renderLink = (href: string, Icon: React.ElementType, label: string, description: string) => {
    const isActive = pathname === href;
    const showBadge = href === '/dashboard/alerts' && alertCount > 0;
    return (
      <Link
        key={href}
        href={href}
        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
      >
        <div className={styles.navIcon}>
          <Icon size={18} />
        </div>
        <div className={styles.navText}>
          <span className={styles.navLabel2}>{label}</span>
          <span className={styles.navDesc}>{description}</span>
        </div>
        {showBadge && (
          <span className={styles.navBadge}>{alertCount}</span>
        )}
        {isActive && <ChevronRight size={14} className={styles.navArrow} />}
      </Link>
    );
  };

  return (
    <aside className={`${styles.sidebar} sidebar-animate`}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Leaf size={22} />
        </div>
        <div>
          <div className={styles.logoName}>HydroSmart</div>
          <div className={styles.logoSub}>v1.2 — Expo Ready</div>
        </div>
      </div>

      {/* System Health */}
      <div className={styles.healthCard}>
        <div className={styles.healthIndicator} style={{ '--status-color': statusColor } as React.CSSProperties}>
          <div className={styles.healthDot} />
        </div>
        <div>
          <div className={styles.healthLabel}>{statusLabel}</div>
          <div className={styles.healthSub}>ESP32 · Live Link</div>
        </div>
        <Activity size={15} className={styles.activityIcon} style={{ color: statusColor }} />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navLabel}>Overview</div>
        {overviewItems.map(({ href, icon, label, description }) => 
          renderLink(href, icon, label, description)
        )}
        
        <div className={styles.navLabel} style={{ marginTop: '16px' }}>System</div>
        {systemItems.map(({ href, icon, label, description }) => 
          renderLink(href, icon, label, description)
        )}
      </nav>

      {/* Bottom */}
      <div className={styles.bottom}>
        <div className={styles.sdgBadges}>
          <span className={styles.sdgBadge} title="Zero Hunger">SDG 2</span>
          <span className={styles.sdgBadge} title="Clean Water">SDG 6</span>
          <span className={styles.sdgBadge} title="Responsible Consumption">SDG 12</span>
        </div>
        <div className={styles.bottomMeta}>Smart Hydroponic System · ESP32</div>
      </div>
    </aside>
  );
}
