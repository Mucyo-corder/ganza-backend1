/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Multi-Tenant Business Isolation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export function requireBusiness(req: Request, res: Response, next: NextFunction): void {
  // Never blindly trust client-supplied businessId over verified user businessId
  let businessId = req.user?.businessId;
  const requestedBusinessId = (req.headers['x-business-id'] as string) || (req.query.businessId as string) || req.businessId;

  if (businessId) {
    if (requestedBusinessId && requestedBusinessId !== businessId) {
      // Non-owner/non-boss users cannot switch tenant context
      if (req.user?.role !== 'owner' && req.user?.role !== 'boss') {
        sendError(res, 403, 'FORBIDDEN', ERROR_MESSAGES.FORBIDDEN.rw);
        return;
      }
      businessId = requestedBusinessId;
    }
  } else {
    businessId = requestedBusinessId;
  }

  if (!businessId) {
    sendError(
      res,
      400,
      'BUSINESS_REQUIRED',
      'Hitamo business ukoreramo (shiraho header "x-business-id" cyangwa query param "businessId").'
    );
    return;
  }

  req.businessId = businessId;
  next();
}
