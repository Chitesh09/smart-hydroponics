'use client';

// ============================================================
// HydroSmart — Centralized Authentication Context
// Production Firebase Authentication & Development Fallback
// ============================================================

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore, isFirebaseConfigured } from '@/lib/firebase';

const DEMO_SESSION_KEY = 'hydrosmart_demo_session_v1';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface AuthContextValue {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  signIn: (email: string, pass: string) => Promise<User>;
  signUp: (email: string, pass: string, name: string) => Promise<User>;
  signOut: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Format raw Firebase Auth error codes into friendly user messages
 */
function getFriendlyAuthErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please Sign In.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Please choose a stronger password (at least 6 characters).';
    case 'auth/network-request-failed':
      return 'Unable to connect to authentication server. Please check your network connection.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed attempts. Please try again later.';
    case 'auth/user-disabled':
      return 'This account has been disabled by an administrator.';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is not enabled in Firebase Console.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
    case 'auth/configuration-not-found':
      return 'Firebase API configuration pending. Operating in local mode.';
    default:
      return 'Authentication failed. Please verify your credentials and try again.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (!isFirebaseConfigured && typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          return {
            uid: saved.uid,
            email: saved.email,
            displayName: saved.displayName,
            emailVerified: true,
          } as unknown as User;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (!isFirebaseConfigured && typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
        if (raw) return JSON.parse(raw);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    return isFirebaseConfigured && !!auth;
  });

  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Fetch or construct Firestore user profile
  const syncUserProfile = useCallback(async (user: User, fallbackName?: string): Promise<UserProfile> => {
    const defaultProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || fallbackName || 'Operator',
      email: user.email || '',
    };

    if (!firestore || !isFirebaseConfigured) {
      setUserProfile(defaultProfile);
      return defaultProfile;
    }

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        const resolved: UserProfile = {
          uid: user.uid,
          displayName: data.displayName || user.displayName || defaultProfile.displayName,
          email: data.email || user.email || defaultProfile.email,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
        setUserProfile(resolved);
        return resolved;
      } else {
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || fallbackName || 'Operator',
          email: user.email || '',
        };
        await setDoc(userDocRef, {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }, { merge: true });
        setUserProfile(newProfile);
        return newProfile;
      }
    } catch (err) {
      console.warn('[AuthContext] Profile sync fallback:', err);
      setUserProfile(defaultProfile);
      return defaultProfile;
    }
  }, []);

  // Subscribe to Authentication State
  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          setCurrentUser(user);
          await syncUserProfile(user);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [syncUserProfile]);

  // Sign In with email & password
  const signIn = useCallback(async (email: string, pass: string): Promise<User> => {
    setAuthError(null);
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !pass.trim()) {
      const msg = 'Please enter both email and password.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, pass);
        const user = userCredential.user;
        setCurrentUser(user);
        await syncUserProfile(user);
        return user;
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        const friendlyMsg = getFriendlyAuthErrorMessage(code);
        setAuthError(friendlyMsg);
        throw new Error(friendlyMsg);
      }
    } else {
      // Local Development Sign-in Fallback
      const displayName = trimmedEmail.split('@')[0]
        ? trimmedEmail.split('@')[0].charAt(0).toUpperCase() + trimmedEmail.split('@')[0].slice(1)
        : 'Operator';
      const uid = `usr_${Math.abs(trimmedEmail.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0))}`;
      
      const mockUser = {
        uid,
        email: trimmedEmail,
        displayName,
        emailVerified: true,
      } as unknown as User;

      const profile: UserProfile = {
        uid,
        email: trimmedEmail,
        displayName,
        createdAt: Date.now(),
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
      }

      setCurrentUser(mockUser);
      setUserProfile(profile);
      return mockUser;
    }
  }, [syncUserProfile]);

  // Sign Up with email, password & display name
  const signUp = useCallback(async (email: string, pass: string, name: string): Promise<User> => {
    setAuthError(null);
    const trimmedEmail = email.trim();
    const trimmedName = name.trim() || 'Operator';

    if (!trimmedEmail || !pass.trim()) {
      const msg = 'Please enter both email and password.';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (pass.length < 6) {
      const msg = 'Please choose a stronger password (at least 6 characters).';
      setAuthError(msg);
      throw new Error(msg);
    }

    if (isFirebaseConfigured && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
        const user = userCredential.user;

        try {
          await updateProfile(user, { displayName: trimmedName });
        } catch (profileErr) {
          console.warn('[AuthContext] Profile display name error:', profileErr);
        }

        await syncUserProfile(user, trimmedName);
        setCurrentUser(user);
        return user;
      } catch (err: unknown) {
        const code = (err as { code?: string })?.code || '';
        const friendlyMsg = getFriendlyAuthErrorMessage(code);
        setAuthError(friendlyMsg);
        throw new Error(friendlyMsg);
      }
    } else {
      // Local Development Sign-up Fallback
      const uid = `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
      const mockUser = {
        uid,
        email: trimmedEmail,
        displayName: trimmedName,
        emailVerified: true,
      } as unknown as User;

      const profile: UserProfile = {
        uid,
        email: trimmedEmail,
        displayName: trimmedName,
        createdAt: Date.now(),
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(profile));
      }

      setCurrentUser(mockUser);
      setUserProfile(profile);
      return mockUser;
    }
  }, [syncUserProfile]);

  // Sign Out
  const signOut = useCallback(async (): Promise<void> => {
    setAuthError(null);
    if (isFirebaseConfigured && auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('[AuthContext] Sign out error:', err);
      }
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(DEMO_SESSION_KEY);
    }
    setCurrentUser(null);
    setUserProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    currentUser,
    userProfile,
    loading,
    isAuthenticated: !!currentUser,
    authError,
    signIn,
    signUp,
    signOut,
    clearAuthError,
  }), [currentUser, userProfile, loading, authError, signIn, signUp, signOut, clearAuthError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
