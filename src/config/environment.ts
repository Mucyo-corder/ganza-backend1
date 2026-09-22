/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Environment Configuration for WoodApp Backend
 */

import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Firebase Admin Credentials
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || '',
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
  // Handle escaped newlines in private key string
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : '',
  FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || '',

  // Security & Authentication
  JWT_SECRET: process.env.JWT_SECRET || 'woodapp-secure-jwt-secret-key-rwanda-2026',
  JWT_EXPIRES_IN: '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // WhatsApp Business Integration
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN || '',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',

  // Camera Integration Microservice
  CAMERA_SERVICE_URL: process.env.CAMERA_SERVICE_URL || '',
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    ENV.FIREBASE_PROJECT_ID &&
    ENV.FIREBASE_CLIENT_EMAIL &&
    ENV.FIREBASE_PRIVATE_KEY
  );
}
