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
          if (resolvedUser.approvalStatus === 'Approved') {
            setCurrentUser(resolvedUser);
          } else {
            // User exists but is not approved. Do not let them in via the global listener.
            // Sign them out of Firebase so they don't get stuck in a weird authenticated state.
            auth?.signOut();
            setCurrentUser(null);
          }
        } else {
          // If the Firebase user exists but is NOT in our database/store yet,
          // it means they are a new Google sign-in who hasn't completed the signup form.
          // We MUST NOT let them into the dashboard by setting a fake currentUser.
          setCurrentUser(null);
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
