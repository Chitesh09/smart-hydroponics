'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  BarChart3,
  Sliders,
  BellRing,
  Leaf,
  Activity,
  ChevronRight,
  User
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', description: 'Live monitoring' },
  { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics', description: 'Historical data' },
  { href: '/dashboard/control', icon: Sliders, label: 'Control', description: 'Pump management' },
  { href: '/dashboard/alerts', icon: BellRing, label: 'Alerts', description: 'Notifications' },
  { href: '/dashboard/profile', icon: User, label: 'Profile', description: 'Account settings' },
];

interface SidebarProps {
  systemStatus?: 'stable' | 'correcting' | 'fault';
  alertCount?: number;
}

export function Sidebar({ systemStatus = 'stable', alertCount = 0 }: SidebarProps) {
  const pathname = usePathname();

  const statusColor = {
    stable: '#22c55e',
    correcting: '#f59e0b',
    fault: '#ef4444',
  }[systemStatus];

  const statusLabel = {
    stable: 'System Stable',
    correcting: 'Correcting…',
    fault: 'Fault Detected',
  }[systemStatus];

  return (
    <aside className={styles.sidebar}>
      {/* Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Leaf size={22} />
        </div>
        <div>
          <div className={styles.logoName}>HydroSmart</div>
          <div className={styles.logoSub}>v1.0 — Phase 1</div>
        </div>
      </div>

      {/* System Health */}
      <div className={styles.healthCard}>
        <div className={styles.healthIndicator} style={{ '--status-color': statusColor } as React.CSSProperties}>
          <div className={styles.healthDot} />
        </div>
        <div>
          <div className={styles.healthLabel}>{statusLabel}</div>
          <div className={styles.healthSub}>ESP32 · Firebase</div>
        </div>
        <Activity size={16} className={styles.activityIcon} />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navLabel}>Navigation</div>
        {navItems.map(({ href, icon: Icon, label, description }) => {
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
        })}
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
