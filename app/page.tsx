import Link from 'next/link';
import { Leaf, ArrowRight, ShieldCheck, Activity, BarChart2 } from 'lucide-react';
import styles from './page.module.css';

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <div className={styles.iconWrapper}>
            <Leaf size={24} />
          </div>
          <h1>HydroSmart</h1>
        </div>
        <div className={styles.actions}>
          <Link href="/dashboard" className="btn btn-primary">
            Enter Dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.badge}>IoT Based Control Architecture</div>
          <h2 className={styles.title}>
            Closed-Loop Precision.<br/>
            <span className="text-accent">Zero Human Intervention.</span>
          </h2>
          <p className={styles.subtitle}>
            An intelligent, automated platform for hydroponic environments. Real-time logging, P-control algorithms, and precise actuator management to guarantee optimal nutrient chemistry. 
          </p>
          
          <div className={styles.cta}>
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Launch Live Monitoring
            </Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-lg">
              View Architecture Docs
            </a>
          </div>
        </div>

        <div className={styles.features}>
          <div className="glass-card p-xl">
            <Activity className="text-accent mb-md" size={32} />
            <h3 className="text-lg font-bold mb-sm">Continuous Feedback</h3>
            <p className="text-secondary text-sm">Measures pH and TDS, computes deviation error, and actuates micro-doses to achieve stability.</p>
          </div>
          <div className="glass-card p-xl">
            <ShieldCheck className="text-accent mb-md" size={32} />
            <h3 className="text-lg font-bold mb-sm">Fault Tolerance</h3>
            <p className="text-secondary text-sm">Monitors for anomalies, failed pump actuations, to ensure crops never suffer lockout.</p>
          </div>
          <div className="glass-card p-xl">
            <BarChart2 className="text-accent mb-md" size={32} />
            <h3 className="text-lg font-bold mb-sm">Telemetry & Analytics</h3>
            <p className="text-secondary text-sm">All sensor inputs synced seamlessly to Firebase RTDB for timeline graphing and historical yield analysis.</p>
          </div>
        </div>
      </main>

      {/* Decorative background vectors */}
      <div className={styles.glowTop}></div>
      <div className={styles.glowBottom}></div>
    </div>
  );
}
