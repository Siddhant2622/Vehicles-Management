"use client";

import { useEffect } from 'react';
import { auth, onAuthStateChanged, isFirebaseConfigured } from '@/lib/firebase';
import { useTransitStore } from '@/lib/store/transitStore';

export function AuthListener() {
  const { setCurrentUser, setAuthLoading, users } = useTransitStore();

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) return;

    setAuthLoading(true);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const resolvedUser = users.find(
          (u) => u.email.toLowerCase() === firebaseUser.email?.toLowerCase()
        );
        if (resolvedUser) {
          setCurrentUser(resolvedUser);
        } else {
          setCurrentUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            fullName: (firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User').toUpperCase(),
            role: 'Fleet Manager',
          });
        }
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [setCurrentUser, setAuthLoading, users]);

  return null;
}
