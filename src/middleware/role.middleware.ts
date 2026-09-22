/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Role-Based Access Control (RBAC)
 */

import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/index.ts';
import { sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export function authorizeRoles(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 401, 'UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED.rw);
      return;
    }

    // Owner and Boss have global access across allowed roles
    if (req.user.role === 'owner' || req.user.role === 'boss') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 403, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN.rw);
      return;
    }

    next();
  };
}
