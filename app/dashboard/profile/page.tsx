'use client';

// ============================================================
// HydroSmart — Operator Profile & Authentication Settings
// ============================================================

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Bell, LogOut, CheckCircle, Fingerprint } from 'lucide-react';
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-primary mb-sm">User Profile</h1>
        <p className="text-secondary">Manage your operator credentials, system access, and security.</p>
      </div>

      <div className={styles.profileGrid}>
        
        {/* Left column - Account Basics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,170,0.2), transparent)', border: '1px solid rgba(0,212,170,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4aa', marginBottom: '16px' }}>
              <User size={36} />
            </div>
            <h2 className="text-lg font-bold">{userName}</h2>
            <p className="text-sm text-secondary mb-md">Farm Station Operator</p>
            <span className="badge badge-success" style={{ marginBottom: '16px' }}><CheckCircle size={12}/> Firebase Authenticated</span>
            
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={handleLogout} disabled={loading}>
              <LogOut size={16} /> {loading ? 'Logging out...' : 'Sign Out'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint size={18} className="text-primary"/> Operator Identity
            </h3>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Firebase UID:</div>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '8px 10px',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              wordBreak: 'break-all',
              color: '#00E5FF'
            }}>
              {currentUser?.uid || 'Not authenticated'}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} className="text-primary"/> Security
            </h3>
            <button className="btn btn-ghost" style={{ width: '100%', marginBottom: '12px' }} onClick={() => toast('Password reset emails can be triggered from Firebase Console')}>Change Password</button>
            <button className="btn btn-ghost" style={{ width: '100%' }} onClick={() => toast('2FA configuration')}>Security Logs</button>
          </div>
        </div>

        {/* Right column - Preferences Data */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 className="text-lg font-bold mb-lg" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>Account Information</h2>
          
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Display Name</label>
              <div style={{ position: 'relative' }}>
                 <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                 <input type="text" className="input" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ paddingLeft: '44px' }} placeholder="Operator Display Name" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                 <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                 <input type="email" className="input" value={userEmail} style={{ paddingLeft: '44px', opacity: 0.8 }} readOnly />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Primary identifier linked to Firebase Authentication.</p>
            </div>

            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <h3 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} className="text-primary"/> Notifications
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>System Alerts</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Push notifications for telemetry faults & critical thresholds.</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Daily Agronomic Reports</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Summary of nutrient consumption and canopy expansion.</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
