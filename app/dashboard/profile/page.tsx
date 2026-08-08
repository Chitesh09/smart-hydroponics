'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Shield, Bell, LogOut, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast, Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('Admin');
  const [userEmail, setUserEmail] = useState('admin@hydrosmart.app');

  // Load user data on mount asynchronously to prevent hydration warnings
  useEffect(() => {
    const name = localStorage.getItem('hydro_user_name');
    const email = localStorage.getItem('hydro_user_email');
    const timer = setTimeout(() => {
      if (name) setUserName(name);
      if (email) setUserEmail(email);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile settings updated successfully!');
  };

  const handleLogout = () => {
    setLoading(true);
    // Clear user session details from storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hydro_user_email');
      localStorage.removeItem('hydro_user_name');
    }
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px' }}>
      <Toaster position="top-right" />
      <div>
        <h1 className="text-3xl font-bold text-primary mb-sm">User Profile</h1>
        <p className="text-secondary">Manage your account settings, preferences, and security.</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Left column - Account Basics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(0,212,170,0.2), transparent)', border: '1px solid rgba(0,212,170,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4aa', marginBottom: '16px' }}>
              <User size={36} />
            </div>
            <h2 className="text-lg font-bold">{userName}</h2>
            <p className="text-sm text-secondary mb-md">Farm Manager</p>
            <span className="badge badge-success" style={{ marginBottom: '16px' }}><CheckCircle size={12}/> Account Active</span>
            
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={handleLogout} disabled={loading}>
              <LogOut size={16} /> {loading ? 'Logging out...' : 'Sign Out'}
            </button>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} className="text-primary"/> Security
            </h3>
            <button className="btn btn-ghost" style={{ width: '100%', marginBottom: '12px' }}>Change Password</button>
            <button className="btn btn-ghost" style={{ width: '100%' }}>Enable 2FA</button>
          </div>
        </div>

        {/* Right column - Preferences Data */}
        <div className="glass-card" style={{ padding: '32px' }}>
          <h2 className="text-lg font-bold mb-lg" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>Account Information</h2>
          
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="grid-2">
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>First Name</label>
                <div style={{ position: 'relative' }}>
                   <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                   <input type="text" className="input" value={userName} onChange={(e) => setUserName(e.target.value)} style={{ paddingLeft: '44px' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Last Name</label>
                <input type="text" className="input" defaultValue="User" />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                 <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                 <input type="email" className="input" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} style={{ paddingLeft: '44px' }} readOnly />
              </div>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Email cannot be changed directly. Contact support.</p>
            </div>

            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              <h3 className="text-md font-bold mb-md" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} className="text-primary"/> Notifications
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>System Alerts</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Push notifications for fault detected in pumps.</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>Daily Reports</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Email summary of nutrient consumption.</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" className="btn btn-ghost">Cancel</button>
              <button type="submit" className="btn btn-primary">Save Changes</button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
