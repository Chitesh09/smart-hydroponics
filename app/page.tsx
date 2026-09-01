'use client';

// ============================================================
// HydroSmart — Authentication & Gateway Entry
// Production Firebase Authentication Gateway
// ============================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { Leaf, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
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
          <div className={styles.logoIcon}>
            <Leaf size={24} />
          </div>
          <h2 className={styles.transitionTitle}>HydroSmart Agri-Tech</h2>
          <p className={styles.transitionSubtitle}>Verifying authenticated session credentials...</p>
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
          <CheckCircle2 size={40} style={{ marginBottom: '16px', color: 'var(--color-teal)' }} />
          <h2 className={styles.transitionTitle}>Session Active</h2>
          <p className={styles.transitionSubtitle}>Redirecting to operational dashboard...</p>
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

      {/* 1. Authentication Form Card */}
      {flowState === 'auth' && (
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.logoIcon}>
              <Leaf size={24} />
            </div>
            <h2 className={styles.title}>HydroSmart Platform</h2>
            <p className={styles.subtitle}>
              {authMode === 'signin' ? 'Sign in to access precision cultivation telemetry' : 'Configure operator credentials'}
            </p>
          </div>

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
            <div className={styles.errorBanner}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{activeError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {authMode === 'signup' && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Operator Name</label>
                <div className={styles.inputWrapper}>
                  <User size={16} className={styles.inputIcon} />
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

            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <div className={styles.inputWrapper}>
                <Mail size={16} className={styles.inputIcon} />
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

            <div className={styles.formGroup}>
              <label className={styles.label}>Password</label>
              <div className={styles.inputWrapper}>
                <Lock size={16} className={styles.inputIcon} />
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
                  <span className={styles.spinner} />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>{authMode === 'signin' ? 'Access Console' : 'Register Station'}</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className={styles.footer}>
            Protected with Firebase Security Rules & AES Encrypted Tokens
          </div>
        </div>
      )}

      {/* 2. Connecting Screen */}
      {flowState === 'connecting' && (
        <div className={styles.transitionContainer}>
          <CheckCircle2 size={40} style={{ marginBottom: '16px', color: 'var(--color-teal)' }} />
          <h2 className={styles.transitionTitle}>Authorization Granted</h2>
          <p className={styles.transitionSubtitle}>Synchronizing telemetry stream with station...</p>
          <div className={styles.spinner} />
        </div>
      )}
    </div>
  );
}
