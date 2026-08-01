import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, firebaseConfigured } from '../lib/firebase.js';
import { createUserProfile } from '../lib/users.js';

const AuthContext = createContext(null);

const notConfiguredError = () =>
  Promise.reject(new Error('Firebase is not configured. See .env.example.'));

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(firebaseConfigured);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    authLoading,
    signUp: firebaseConfigured
      ? async (email, password, displayName) => {
          const cred = await createUserWithEmailAndPassword(auth, email, password);
          if (displayName) {
            await updateProfile(cred.user, { displayName });
            await createUserProfile(cred.user.uid, displayName);
            setUser({ ...cred.user });
          }
          return cred;
        }
      : notConfiguredError,
    logIn: firebaseConfigured
      ? (email, password) => signInWithEmailAndPassword(auth, email, password)
      : notConfiguredError,
    logInWithGoogle: firebaseConfigured
      ? () => signInWithPopup(auth, googleProvider)
      : notConfiguredError,
    logOut: firebaseConfigured ? () => signOut(auth) : notConfiguredError,
    refreshUser: () => {
      if (auth.currentUser) setUser({ ...auth.currentUser });
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
