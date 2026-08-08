'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';
import styles from './page.module.css';

export default function EntryPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [flowState, setFlowState] = useState<'auth' | 'connecting'>('auth');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('admin@hydrosmart.app');
  const [password, setPassword] = useState('password123');
  const [name, setName] = useState('');

  // Gatekeeper: Validate if a user session already exists
  useEffect(() => {
    const activeEmail = localStorage.getItem('hydro_user_email');
    const timer = setTimeout(() => {
      if (activeEmail) {
        setIsAuthenticated(true);
      }
      setCheckingAuth(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Mock authentication delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('hydro_user_email', email);
        const resolvedName = authMode === 'signin' 
          ? (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1))
          : name;
        localStorage.setItem('hydro_user_name', resolvedName || 'Operator');
      }
      setFlowState('connecting');
      setLoading(false);

      // System loading transition to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }, 1200);
  };

  // Block mounting forms for authenticated users to prevent visible flashes during startup
  if (checkingAuth || isAuthenticated) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* 1. Authentication Container */}
      {flowState === 'auth' && (
        <div className={styles.authContainer}>
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
                onClick={() => setAuthMode('signin')}
              >
                Sign In
              </button>
              <button 
                type="button" 
                className={`${styles.tabButton} ${authMode === 'signup' ? styles.tabButtonActive : ''}`}
                onClick={() => setAuthMode('signup')}
              >
                Create Account
              </button>
            </div>

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
                      placeholder="Operator Name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
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
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label className={styles.label}>Password</label>
                  {authMode === 'signin' && (
                    <a href="#" className={styles.forgotLink} onClick={(e) => e.preventDefault()}>
                      Forgot?
                    </a>
                  )}
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
                  />
                </div>
              </div>

              {authMode === 'signin' && (
                <div className={styles.checkboxContainer}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" defaultChecked style={{ accentColor: '#00E5FF' }} />
                    <span>Remember this station</span>
                  </label>
                </div>
              )}

              <button type="submit" className={styles.submitButton} disabled={loading}>
                {loading ? (
                  <>
                    <span className={styles.spinner} style={{ width: '16px', height: '16px', borderWidth: '1.5px' }} />
                    <span>Verifying...</span>
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
