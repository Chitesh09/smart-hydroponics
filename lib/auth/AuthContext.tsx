'use client';

// ============================================================
// HydroSmart — Centralized Firebase Authentication Context
// Secure User Identity & Production Authentication Foundation
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
import { auth, firestore } from '@/lib/firebase';

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
      return 'An account with this email already exists.';
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
    default:
      return 'Authentication failed. Please verify your credentials and try again.';
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(() => {
    return !!auth;
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

    if (!firestore) {
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
        // Create initial document in Firestore
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
      console.warn('[AuthContext] Firestore profile sync error (using auth state fallback):', err);
      setUserProfile(defaultProfile);
      return defaultProfile;
    }
  }, []);

  // Subscribe to Firebase Authentication state
  useEffect(() => {
    if (!auth) {
      return;
    }

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
  }, [syncUserProfile]);

  // Sign In with email & password
  const signIn = useCallback(async (email: string, pass: string): Promise<User> => {
    setAuthError(null);
    if (!auth) {
      throw new Error('Firebase Authentication is not initialized.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
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
  }, [syncUserProfile]);

  // Sign Up with email, password & display name
  const signUp = useCallback(async (email: string, pass: string, name: string): Promise<User> => {
    setAuthError(null);
    if (!auth) {
      throw new Error('Firebase Authentication is not initialized.');
    }

    try {
      const trimmedName = name.trim() || 'Operator';
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const user = userCredential.user;

      // Update Firebase Auth profile
      try {
        await updateProfile(user, { displayName: trimmedName });
      } catch (profileErr) {
        console.warn('[AuthContext] Profile display name update error:', profileErr);
      }

      // Create profile record in Firestore
      await syncUserProfile(user, trimmedName);
      setCurrentUser(user);
      return user;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      const friendlyMsg = getFriendlyAuthErrorMessage(code);
      setAuthError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  }, [syncUserProfile]);

  // Sign Out
  const signOut = useCallback(async (): Promise<void> => {
    setAuthError(null);
    if (auth) {
      try {
        await firebaseSignOut(auth);
      } catch (err) {
        console.error('[AuthContext] Sign out error:', err);
      }
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
