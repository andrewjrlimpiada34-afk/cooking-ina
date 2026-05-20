'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Initializes Firebase services safely.
 * Returns null for services if configuration is missing to avoid crashing during SSR/Hydration.
 */
export function initializeFirebase(): { 
  firebaseApp: FirebaseApp | null; 
  firestore: Firestore | null; 
  auth: Auth | null 
} {
  const hasConfig = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'undefined';

  if (!hasConfig) {
    if (typeof window !== 'undefined') {
      console.warn(
        'Firebase configuration is missing or invalid. Please check your .env file or Project Settings.'
      );
    }
    return { firebaseApp: null, firestore: null, auth: null };
  }

  try {
    const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(firebaseApp);
    const auth = getAuth(firebaseApp);

    return { firebaseApp, firestore, auth };
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return { firebaseApp: null, firestore: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export { useMemo as useMemoFirebase } from 'react';
