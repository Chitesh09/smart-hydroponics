'use client';

import Link from 'next/link';
import { Leaf, ArrowRight, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Save to localStorage
    const emailInput = document.getElementById('login-email') as HTMLInputElement;
    if (emailInput && emailInput.value) {
      localStorage.setItem('hydro_user_email', emailInput.value);
      const name = emailInput.value.split('@')[0];
      localStorage.setItem('hydro_user_name', name.charAt(0).toUpperCase() + name.slice(1));
    }
    
    // Mock authentication delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {/* Decorative background vectors */}
      <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,212,170,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>

      <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '420px', padding: '40px', zIndex: 10, position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, rgba(0,212,170,0.2), transparent)', border: '1px solid rgba(0,212,170,0.18)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4aa' }}>
            <Leaf size={28} />
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Welcome Back</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          Log in to access your hydroponics dashboard.
        </p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
               <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
               <input id="login-email" type="email" required className="input" placeholder="admin@domain.com" style={{ paddingLeft: '44px' }} defaultValue="admin@hydrosmart.app" />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
               <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>Password</label>
               <a href="#" style={{ fontSize: '12px', color: 'var(--color-primary)' }}>Forgot Password?</a>
            </div>
            <div style={{ position: 'relative' }}>
               <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
               <input type="password" required className="input" placeholder="••••••••" style={{ paddingLeft: '44px' }} defaultValue="password123" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>

        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          Don't have an account? <Link href="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Create Account</Link>
        </div>

      </div>
    </div>
  );
}
