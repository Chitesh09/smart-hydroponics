import React from 'react'
import CybercoreBackground from '@/components/ui/cybercore-section-hero'

const App: React.FC = () => (
  <div style={{ position: 'relative', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
    <CybercoreBackground beamCount={70} />

    <div className="content-wrapper" style={{ zIndex: 10, position: 'relative', padding: '24px' }}>
      <header className="main-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '64px' }}>
        <div className="logo" style={{ fontSize: '24px', fontWeight: 'bold' }}>CYBERCORE</div>
        <nav style={{ display: 'flex', gap: '16px' }}>
          <a href="#">Protocols</a>
          <a href="#">Network</a>
          <a href="#">Developers</a>
          <a href="#">Connect</a>
        </nav>
      </header>

      <main className="hero-section" style={{ textAlign: 'center', marginTop: '100px' }}>
        <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>Enter the Grid</h1>
        <p style={{ maxWidth: '600px', margin: '0 auto 32px', fontSize: '18px', color: 'var(--text-secondary)' }}>
          Experience the next evolution of decentralized infrastructure, where data
          flows with unparalleled speed and security.
        </p>
        <button className="cta-button btn btn-primary">Explore the Network</button>
      </main>
    </div>
  </div>
)

export default App
