// Firebase configuration and helpers
// For production: set these in .env.local
// For demo: works with mock data if Firebase not configured

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getDatabase, ref, push, onValue, query, limitToLast, type Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let db: Database | null = null;
let firebaseAvailable = false;

try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  if (firebaseConfig.databaseURL) {
    db = getDatabase(app);
    firebaseAvailable = true;
  }
} catch (_e) {
  console.warn('Firebase not configured — using local state only');
}

export { firebaseAvailable };

export async function pushSensorReading(data: object) {
  if (!db) return;
  try {
    const readingsRef = ref(db, 'hydroponics/readings');
    await push(readingsRef, data);
  } catch (e) {
    console.warn('Firebase push failed:', e);
  }
}

export async function pushAlert(alert: object) {
  if (!db) return;
  try {
    const alertsRef = ref(db, 'hydroponics/alerts');
    await push(alertsRef, alert);
  } catch (e) {
    console.warn('Firebase alert push failed:', e);
  }
}

export function subscribeToReadings(callback: (data: unknown[]) => void, limit = 100) {
  if (!db) return () => {};
  const q = query(ref(db, 'hydroponics/readings'), limitToLast(limit));
  const unsubscribe = onValue(q, (snapshot) => {
    const val = snapshot.val();
    if (val) callback(Object.values(val));
  });
  return unsubscribe;
}
