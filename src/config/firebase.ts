/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Firebase Admin SDK Initialization for WoodApp Backend
 * Connects directly to real Firebase Firestore & Auth.
 */

import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { ENV, isFirebaseConfigured } from './environment.ts';
import { logger } from '../utils/logger.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

let firebaseApp: App | null = null;

export function initializeFirebaseAdmin(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  if (isFirebaseConfigured()) {
    try {
      firebaseApp = initializeApp({
        credential: cert({
          projectId: ENV.FIREBASE_PROJECT_ID,
          clientEmail: ENV.FIREBASE_CLIENT_EMAIL,
          privateKey: ENV.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        storageBucket: ENV.FIREBASE_STORAGE_BUCKET || undefined,
      });
      logger.info('Firebase Admin initialized successfully with provided service account credentials.');
      return firebaseApp;
    } catch (err) {
      logger.error('Failed to initialize Firebase Admin with provided credentials:', err);
      throw new Error(ERROR_MESSAGES.FIREBASE_NOT_CONFIGURED.rw);
    }
  }

  // Fallback: Check if explicit service account file is provided
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    try {
      firebaseApp = initializeApp({
        projectId: ENV.FIREBASE_PROJECT_ID || undefined,
      });
      logger.info('Firebase Admin initialized using GOOGLE_APPLICATION_CREDENTIALS.');
      return firebaseApp;
    } catch (err) {
      logger.warn('Could not initialize Firebase Admin via GOOGLE_APPLICATION_CREDENTIALS:', { error: String(err) });
    }
  }

  logger.warn('Firebase Admin credentials are not yet configured in environment variables.');
  return null as unknown as App;
}

// Call on startup
try {
  initializeFirebaseAdmin();
} catch (e) {
  logger.warn('Firebase Admin initial start status:', { error: String(e) });
}

export function getFirestoreDb(): Firestore | null {
  if (!isFirebaseConfigured() && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return null;
  }
  try {
    return getFirestore(firebaseApp || getApp());
  } catch {
    return null;
  }
}

export function getFirebaseAuth(): Auth {
  if (!isFirebaseConfigured() && !process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.K_SERVICE) {
    throw new Error(
      `${ERROR_MESSAGES.FIREBASE_NOT_CONFIGURED.rw} Shyiramo credentials za Firebase kugira ngo Authentication ikore.`
    );
  }
  return getAuth(firebaseApp || getApp());
}

export async function checkFirebaseConnection(): Promise<boolean> {
  const db = getFirestoreDb();
  if (!db) return false;
  try {
    await db.collection('_health_check').limit(1).get();
    return true;
  } catch {
    return false;
  }
}
