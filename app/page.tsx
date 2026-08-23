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
      }, 1200);
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
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(0, 229, 255, 0.08)',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px',
            color: '#00E5FF'
          }}>
            <Leaf size={32} />
          </div>
          <h2 className={styles.transitionTitle}>HydroSmart</h2>
          <p className={styles.transitionSubtitle}>Checking authentication session...</p>
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
          <CheckCircle2 size={44} style={{ marginBottom: '20px', color: '#00E5FF' }} />
          <h2 className={styles.transitionTitle}>Session Active</h2>
          <p className={styles.transitionSubtitle}>Redirecting to dashboard...</p>
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

      {/* 1. Authentication Container */}
      {flowState === 'auth' && (
        <div className={styles.authContainer} style={{ opacity: 1, transform: 'none', animation: 'none' }}>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <div className={styles.authLogo}>
                <Leaf size={20} />
                <span>Smart Hydroponics</span>
              </div>
              <p className={styles.authSubtitle}>
                {authMode === 'signin' ? 'Sign in to access cultivation telemetry' : 'Configure operator credentials'}
              </p>
            </div>

            {/* Switch Tabs */}
            <div className={styles.tabGroup}>
              <button 
                type="button" 
                className={`${styles.tabButton} ${authMode === 'signin' ? styles.tabButtonActive : ''}`}
                onClick={() => handleTabSwitch('signin')}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`${styles.tabButton} ${authMode === 'signup' ? styles.tabButtonActive : ''}`}
                onClick={() => handleTabSwitch('signup')}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert Display */}
            {activeError && (
              <div style={{
                background: 'rgba(255, 107, 74, 0.12)',
                border: '1px solid rgba(255, 107, 74, 0.35)',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12.5px',
                color: '#FF8A70'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{activeError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {authMode === 'signup' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Full Name</label>
                  <div className={styles.inputWrapper}>
                    <User size={16} className={styles.inputIcon} />
                    <input 
                      type="text" 
                      required 
                      className={styles.inputField} 
                      placeholder="Operator Name (e.g. Chitesh)" 
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
                    className={styles.inputField} 
                    placeholder="operator@hydrosmart.app" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className={styles.label}>Password</label>
                </div>
                <div className={styles.inputWrapper}>
                  <Lock size={16} className={styles.inputIcon} />
                  <input 
                    type="password" 
                    required 
                    className={styles.inputField} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitButton} disabled={submitting}>
                {submitting ? (
                  <>
                    <span className={styles.spinner} style={{ width: '16px', height: '16px', borderWidth: '1.5px' }} />
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
          </div>
        </div>
      )}

      {/* 2. Connecting / System Loading Page */}
      {flowState === 'connecting' && (
        <div className={styles.transitionContainer}>
          <CheckCircle2 size={44} className="text-primary" style={{ marginBottom: '24px', color: '#00E5FF' }} />
          <h2 className={styles.transitionTitle}>Authorization Granted</h2>
          <p className={styles.transitionSubtitle}>Synchronizing metrics with ESP32 receiver...</p>
          <div className={styles.spinner} />
        </div>
      )}
    </div>
  );
}
