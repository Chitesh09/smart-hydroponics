'use client';

// ============================================================
// HydroSmart — Operator Profile & Settings
// ============================================================

import { useState, useEffect } from 'react';
import { User, Mail, Shield, LogOut, CheckCircle, Fingerprint, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';
import { useAuth } from '@/lib/auth/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import styles from './page.module.css';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, userProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState('Operator');
  const [userEmail, setUserEmail] = useState('');

  // Synchronize state with authenticated Firebase User
  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.displayName || userProfile?.displayName || 'Operator');
      setUserEmail(currentUser.email || userProfile?.email || '');
    }
  }, [currentUser, userProfile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setSaving(true);
    try {
      if (userName.trim() && userName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: userName.trim() });
        if (firestore) {
          const userDocRef = doc(firestore, 'users', currentUser.uid);
          await setDoc(userDocRef, {
            displayName: userName.trim(),
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }
      }
      toast.success('Profile settings updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error('Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (err) {
      console.error('Error during sign out:', err);
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-primary mb-xs">Station Settings & Profile</h1>
        <p className="text-secondary">Operator credentials, station authentication, and platform preferences.</p>
      </div>

      <div className={styles.profileGrid}>
        
        {/* Left column - Account Basics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'var(--color-teal-dim)',
              border: '1px solid var(--color-teal-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-teal)',
              marginBottom: '14px'
            }}>
              <User size={32} />
            </div>
            <h2 className="text-md font-bold text-primary">{userName}</h2>
            <p className="text-xs text-secondary mb-md">Farm Station Operator</p>
            <span className="badge badge-success" style={{ marginBottom: '16px' }}>
              <CheckCircle size={11}/> Firebase Verified
            </span>
            
            <button
              className="btn btn-danger"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleLogout}
              disabled={loading}
            >
              <LogOut size={15} /> {loading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 className="text-sm font-bold mb-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
              <Fingerprint size={16} style={{ color: 'var(--color-teal)' }}/> Operator Identity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div>
                <span className="text-muted block text-xs">UID:</span>
                <span className="font-mono text-secondary" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                  {currentUser?.uid || 'Not available'}
                </span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
                <span className="text-muted block text-xs">Auth Provider:</span>
                <span className="text-primary font-medium">Email / Password</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Edit Profile & Preferences */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} style={{ color: 'var(--color-teal)' }}/> Operator Credentials
            </h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="text-xs font-bold uppercase text-secondary block mb-xs">Display Name</label>
                <input 
                  type="text" 
                  className="input" 
                  value={userName} 
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your Name"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-secondary block mb-xs">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="email" 
                    className="input" 
                    value={userEmail} 
                    disabled 
                    style={{ opacity: 0.7, cursor: 'not-allowed', paddingLeft: '36px' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                </div>
                <span className="text-xs text-muted" style={{ marginTop: '4px', display: 'block' }}>
                  Email is managed through Firebase Authentication.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--color-green)' }}/> System Preferences
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="text-sm font-bold text-primary">Autonomous Safety Failsafe</div>
                  <div className="text-xs text-secondary">Prevent chemical dosing over-correction lockouts</div>
                </div>
                <span className="badge badge-success">ACTIVE</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
                <div>
                  <div className="text-sm font-bold text-primary">Telemetry Interval</div>
                  <div className="text-xs text-secondary">ESP32 serial baud rate rate streaming at 115200 bps</div>
                </div>
                <span className="badge badge-teal">1000 MS</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
