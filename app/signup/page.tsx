'use client';

import Link from 'next/link';
import { Leaf, User, Lock, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Save to localStorage
    const nameInput = document.getElementById('signup-name') as HTMLInputElement;
    const emailInput = document.getElementById('signup-email') as HTMLInputElement;
    if (nameInput && nameInput.value) localStorage.setItem('hydro_user_name', nameInput.value);
    if (emailInput && emailInput.value) localStorage.setItem('hydro_user_email', emailInput.value);
    
    // Mock authentication creation delay
    setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(0,212,170,0.15) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>
      <div style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }}></div>

      <div className="glass-card animate-slide-in" style={{ width: '100%', maxWidth: '420px', padding: '40px', zIndex: 10, position: 'relative' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, rgba(0,212,170,0.2), transparent)', border: '1px solid rgba(0,212,170,0.18)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00d4aa' }}>
            <Leaf size={24} />
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Create an Account</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '32px' }}>
          Join HydroSmart to monitor your crops.
        </p>

        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
               <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
               <input id="signup-name" type="text" required className="input" placeholder="John Doe" style={{ paddingLeft: '44px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
               <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
               <input id="signup-email" type="email" required className="input" placeholder="john@domain.com" style={{ paddingLeft: '44px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>Password</label>
            <div style={{ position: 'relative' }}>
               <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
               <input type="password" required className="input" placeholder="••••••••" style={{ paddingLeft: '44px' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px', padding: '12px' }} disabled={loading}>
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>

        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already have an account? <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Log In</Link>
        </div>

      </div>
    </div>
  );
}
