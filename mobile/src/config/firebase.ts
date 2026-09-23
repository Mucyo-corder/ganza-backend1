import {initializeApp, getApps, FirebaseApp} from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
} from 'firebase/auth';

/**
 * Firebase configuration for ganza-app-412ff
 * Values can be overridden via environment or build config.
 * Do NOT commit real secrets – they are injected at build time via env.
 * The client SDK keys are safe to expose (they are not secrets), but
 * Admin credentials must never be in the app.
 */
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || 'AIzaSyPlaceholder-Ganza-App-412ff',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || 'ganza-app-412ff.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || 'ganza-app-412ff',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'ganza-app-412ff.appspot.com',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '1234567890',
  appId: process.env.FIREBASE_APP_ID || '1:1234567890:web:placeholder',
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0]!;
    return app;
  }
  app = initializeApp(firebaseConfig);
  return app;
}

export function getFirebaseAuthInstance(): Auth {
  if (auth) return auth;
  const firebaseApp = getFirebaseApp();
  auth = getAuth(firebaseApp);
  return auth;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.apiKey !== 'AIzaSyPlaceholder-Ganza-App-412ff' &&
      firebaseConfig.projectId
  );
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
};
export type {FirebaseUser};
