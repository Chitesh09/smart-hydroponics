'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { usePlantIntelligence } from '@/lib/intelligence/PlantIntelligenceContext';
import { getFarmerCopy } from '@/lib/intelligence/farmerSemanticLayer';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ModeToggle } from '@/components/ui/ModeToggle';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import styles from './Sidebar.module.css';

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
  const { userMode, setUserMode, language, setLanguage, alertSummary } = usePlantIntelligence();

  const copy = useMemo(() => getFarmerCopy(language), [language]);

  const statusConfig = {
    stable: { color: 'var(--color-green)', label: copy.nav.nodeStable },
    correcting: { color: 'var(--color-amber)', label: copy.nav.nodeCalibrating },
    fault: { color: 'var(--color-red)', label: copy.nav.nodeActionRequired },
  }[systemStatus];

  const localizedNavSections = useMemo(() => {
    const sections = [
      {
        title: copy.nav.observation,
        items: [
          { href: '/dashboard', mark: '◓', label: copy.nav.plantCommand },
        ],
      },
      {
        title: copy.nav.intelligence,
        items: [
          { href: '/dashboard/intelligence', mark: '✦', label: copy.nav.reasoningLab },
          { href: '/dashboard/analytics', mark: '≡', label: copy.nav.plantJourney },
          {
            href: '/dashboard/alerts',
            mark: '!',
            label: language === 'kn' ? 'ಎಚ್ಚರಿಕೆಗಳು' : 'Alerts',
            badge: alertSummary?.activeAlerts?.length || 0,
          },
        ],
      },
    ];

    // IoT Station and Research Metrics are strictly TECHNICAL MODE ONLY
    const systemItems = [];
    if (userMode === 'technical') {
      systemItems.push({ href: '/dashboard/devices', mark: '☵', label: copy.nav.iotStation });
      systemItems.push({ href: '/dashboard/research', mark: '▤', label: language === 'kn' ? 'ಸಂಶೋಧನಾ ವರದಿ' : 'Research Metrics' });
    }
    systemItems.push({ href: '/dashboard/profile', mark: '⚙', label: copy.nav.settings });

    sections.push({
      title: copy.nav.system,
      items: systemItems,
    });

    return sections;
  }, [copy, userMode, language, alertSummary?.activeAlerts?.length]);

  const displayName = currentUser?.displayName || userProfile?.displayName || (userMode === 'farmer' ? copy.nav.grower : copy.nav.operator);

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      {/* Brand Header with Official Logo */}
      <div className={styles.brand}>
        <BrandLogo size={32} showText subtitle={copy.nav.livingIntelligence} priority />
      </div>

      {/* Hardware Node Status */}
      <div className={styles.nodeStatus}>
        <div
          className={styles.statusDot}
          style={{ '--status-color': statusConfig.color } as React.CSSProperties}
        />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--sidebar-text)' }}>
            {statusConfig.label}
          </span>
          <span style={{ fontSize: '9.5px', color: 'var(--sidebar-text-muted)' }}>Station HS-ESP32</span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
        {localizedNavSections.map((section) => (
          <div key={section.title} className={styles.navSection}>
            <div className={styles.sectionHeading}>{section.title}</div>
            {section.items.map(({ href, mark, label, badge }: { href: string; mark: string; label: string; badge?: number }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                  onClick={onClose}
                >
                  <span className={styles.navMark}>{mark}</span>
                  <span style={{ flex: 1 }}>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span style={{
                      background: 'var(--color-amber)',
                      color: '#000',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '1px 6px',
                      borderRadius: '10px',
                      marginRight: '4px',
                    }}>
                      {badge}
                    </span>
                  )}
                  {isActive && <span className={styles.activeChevron}>›</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Global Preferences: Single canonical location for Mode & Language */}
      <div className={styles.globalPreferences}>
        <div className={styles.sectionHeading}>
          {language === 'kn' ? 'ಆದ್ಯತೆಗಳು' : 'PREFERENCES'}
        </div>
        <div className={styles.preferenceRow}>
          <ModeToggle mode={userMode} onModeChange={setUserMode} language={language} size="sm" />
          <LanguageToggle language={language} onLanguageChange={setLanguage} size="sm" />
        </div>
      </div>

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
              fontSize: '12px',
              fontWeight: 800,
            }}
          >
            ◉
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {displayName}
            </span>
            <span style={{ fontSize: '9.5px', color: 'var(--text-muted)' }}>
              {userMode === 'farmer' ? copy.nav.grower : copy.nav.operator}
            </span>
          </div>
        </div>

        <button
          className="btn-ghost"
          style={{ padding: '6px 8px', color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
          onClick={signOut}
          title={copy.nav.signOut}
          aria-label={copy.nav.signOut}
        >
          ⎋
        </button>
      </div>
    </aside>
  );
}
