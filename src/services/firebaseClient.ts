/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Firebase Client Authentication Service
 * Safely initializes Firebase Client SDK with graceful fallback for dev preview
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  onAuthStateChanged, 
  User as FirebaseUser,
  getIdToken,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

export const getFirebaseAuth = (): Auth | null => {
  if (!isFirebaseConfigured()) {
    return null;
  }
  if (!app) {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  }
  if (!auth && app) {
    auth = getAuth(app);
  }
  return auth;
};

export async function getCurrentFirebaseIdToken(): Promise<string | null> {
  const currentAuth = getFirebaseAuth();
  if (!currentAuth) {
    return null;
  }

  const user = currentAuth.currentUser;
  if (!user) {
    return null;
  }

  return user.getIdToken().catch(() => null);
}

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  fbSignOut, 
  onAuthStateChanged,
};
export type { FirebaseUser };
