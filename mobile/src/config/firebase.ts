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
  apiKey: "AIzaSyCdPF2wrhBRQ5bxij5dfrRpXAGv417-3Dc",
  authDomain: "ganza-app-412ff.firebaseapp.com",
  projectId: "ganza-app-412ff",
  storageBucket: "ganza-app-412ff.firebasestorage.app",
  messagingSenderId: "565631957128",
  appId: "1:565631957128:web:bdc7f54b868a9c79c5873d",
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
      firebaseConfig.apiKey !== '' &&
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
