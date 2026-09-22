/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV, isFirebaseConfigured } from '../config/environment.ts';
import { getFirebaseAuth } from '../config/firebase.ts';
import { sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';
import { UserRole } from '../types/index.ts';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  businessId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      businessId?: string;
    }
  }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, 'UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED.rw);
    return;
  }

  const token = authHeader.split(' ')[1];

  // Try JWT verification first
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    if (decoded.businessId && !req.headers['x-business-id']) {
      req.businessId = decoded.businessId;
    }
    return next();
  } catch (jwtError) {
    // If not standard JWT, check if it is a Firebase ID Token
    if (isFirebaseConfigured()) {
      try {
        const decodedFirebase = await getFirebaseAuth().verifyIdToken(token);
        let role = (decodedFirebase.role as UserRole) || 'worker';
        let businessId = decodedFirebase.businessId as string | undefined;

        // If custom claims are not present, look up membership in Firestore
        if (!businessId || !decodedFirebase.role) {
          const { getFirestoreDb } = await import('../config/firebase.ts');
          const db = getFirestoreDb();
          if (db) {
            const memberSnap = await db
              .collection('memberships')
              .where('userId', '==', decodedFirebase.uid)
              .limit(1)
              .get();
            if (!memberSnap.empty) {
              const memData = memberSnap.docs[0].data();
              businessId = memData.businessId || businessId;
              role = (memData.role as UserRole) || role;
            }
          }
        }

        req.user = {
          userId: decodedFirebase.uid,
          email: decodedFirebase.email || '',
          role,
          businessId,
        };
        if (req.user.businessId) {
          req.businessId = req.user.businessId;
        }
        return next();
      } catch (fbError) {
        sendError(res, 401, 'UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED.rw);
        return;
      }
    }
    sendError(res, 401, 'UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED.rw);
  }
}
