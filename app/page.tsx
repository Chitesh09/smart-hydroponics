'use client';

// ============================================================
// HydroSmart — Authentication & Gateway Entry
// Production Firebase Authentication Gateway
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

export default function EntryPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading, signIn, signUp, authError, clearAuthError } = useAuth();
  const [flowState, setFlowState] = useState<'auth' | 'connecting'>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // If already authenticated, redirect straight to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleTabSwitch = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setLocalError(null);
    clearAuthError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearAuthError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (authMode === 'signup' && !name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    setSubmitting(true);

    try {
      if (authMode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
      setFlowState('connecting');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (_err) {
      // Handled via authError state in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Initial Session Verification Screen
  if (authLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.gridOverlay} />
        <div className={styles.ambientGlow} />
        <div className={styles.transitionContainer}>
          <BrandLogo size={80} priority />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            HydroSmart
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Verifying authenticated session credentials...
          </p>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  // If already authenticated and redirecting, avoid flashing the login card
  if (isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.gridOverlay} />
        <div className={styles.ambientGlow} />
        <div className={styles.transitionContainer}>
          <BrandLogo size={80} priority />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
            Session Active
          </h2>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
            Redirecting to operational dashboard...
          </p>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  const activeError = localError || authError;

  return (
    <div className={styles.container}>
      <div className={styles.gridOverlay} />
      <div className={styles.ambientGlow} />

      <div className={styles.authWrapper}>
        
        {/* Brand Hero Display */}
        <div className={styles.brandHero}>
          <div className={styles.brandLogoWrapper}>
            <BrandLogo size={96} priority />
          </div>
          <h1 className={styles.brandTitle}>HydroSmart</h1>
          <span className={styles.brandSubtitle}>Living Intelligence for Plants</span>
        </div>

        {/* 1. Authentication Form Card */}
        {flowState === 'auth' && (
          <div className={styles.card}>
            
            {/* Switch Tabs */}
            <div className={styles.tabGroup}>
              <button 
                type="button" 
                className={`${styles.tab} ${authMode === 'signin' ? styles.tabActive : ''}`}
                onClick={() => handleTabSwitch('signin')}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`${styles.tab} ${authMode === 'signup' ? styles.tabActive : ''}`}
                onClick={() => handleTabSwitch('signup')}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert Display */}
            {activeError && (
              <div className={styles.errorBox}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{activeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              {authMode === 'signup' && (
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Operator Name</label>
                  <div className={styles.inputWrapper}>
                    <User size={15} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      required 
                      className={styles.input} 
                      placeholder="e.g. Chitesh" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
              )}

              <div className={styles.inputGroup}>
                <label className={styles.label}>Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail size={15} className={styles.inputIcon} />
                  <input 
                    type="email" 
                    required 
                    className={styles.input} 
                    placeholder="operator@hydrosmart.app" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={15} className={styles.inputIcon} />
                  <input 
                    type="password" 
                    required 
                    className={styles.input} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? (
                  <>
                    <span className={styles.spinner} style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <span>{authMode === 'signin' ? 'Access Command Center' : 'Register Station'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', paddingTop: '4px' }}>
              Precision IoT cultivation telemetry & scientific observation platform
            </div>
          </div>
        )}

        {/* 2. Connecting Screen */}
        {flowState === 'connecting' && (
          <div className={styles.transitionContainer}>
            <CheckCircle2 size={36} style={{ color: 'var(--color-green)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Authorization Granted
            </h2>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              Synchronizing telemetry stream with station...
            </p>
            <div className={styles.spinner} />
          </div>
        )}

      </div>
    </div>
  );
}
