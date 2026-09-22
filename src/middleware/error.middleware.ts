/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Rate Limiter & Error Handling Middleware
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.ts';
import { logger } from '../utils/logger.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Mwarenze umubare w’ibikorwa byemewe mu gihe gito. Tegereza gato ubundi wongere ugerageze.',
      details: [],
    },
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      message: 'Mwarenze umubare w’inshuro zo kwinjira zemewe. Tegereza iminota 15.',
      details: [],
    },
  },
});

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  logger.error('Unhandled server error encountered', err, {
    path: req.path,
    method: req.method,
    businessId: req.businessId,
  });

  const statusCode = (err as unknown as { status?: number }).status || 500;
  const message = err.message || ERROR_MESSAGES.DATABASE_ERROR.rw;

  sendError(res, statusCode, 'INTERNAL_SERVER_ERROR', message);
}
