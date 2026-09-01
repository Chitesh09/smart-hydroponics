'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  MessageSquare,
  Radio,
  Settings,
  Leaf,
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
    title: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ],
  },
  {
    title: 'Intelligence',
    items: [
      { href: '/dashboard/intelligence', icon: Sparkles, label: 'Intelligence' },
      { href: '/dashboard/analytics', icon: BarChart3, label: 'Analytics' },
    ],
  },
  {
    title: 'Plant',
    items: [
      { href: '/dashboard/talk', icon: MessageSquare, label: 'Talk to Plant' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/dashboard/devices', icon: Radio, label: 'Devices' },
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
  alertCount = 0,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, userProfile, signOut } = useAuth();

  const statusConfig = {
    stable: { color: 'var(--color-green)', label: 'System Stable' },
    correcting: { color: 'var(--color-warning)', label: 'Stabilizing' },
    fault: { color: 'var(--color-danger)', label: 'Attention Required' },
  }[systemStatus];

  const displayName = currentUser?.displayName || userProfile?.displayName || 'Grower';

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* Brand Logo */}
      <div className={styles.logo}>
        <div className={styles.logoIcon}>
          <Leaf size={20} />
        </div>
        <div>
          <div className={styles.logoName}>HydroSmart</div>
          <div className={styles.logoSub}>Agri-Tech Platform</div>
        </div>
      </div>

      {/* System Health Overview Pill */}
      <div className={styles.healthCard}>
        <div
          className={styles.healthDot}
          style={{ '--status-color': statusConfig.color } as React.CSSProperties}
        />
        <div>
          <div className={styles.healthLabel}>{statusConfig.label}</div>
          <div className={styles.healthSub}>Automated Monitoring</div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
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
                    <Icon size={17} />
                  </div>
                  <div className={styles.navText}>
                    <span className={styles.navLabel}>{label}</span>
                  </div>
                  {href === '/dashboard/alerts' && alertCount > 0 && (
                    <span className={styles.navBadge}>{alertCount}</span>
                  )}
                  {isActive && <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Identity & Sign Out Footer */}
      <div className={styles.userFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-teal)',
            }}
          >
            <User size={14} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Online</span>
          </div>
        </div>

        <button
          className="btn-ghost"
          style={{ padding: '6px', color: 'var(--text-muted)' }}
          onClick={signOut}
          title="Sign out"
          aria-label="Sign out of account"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
