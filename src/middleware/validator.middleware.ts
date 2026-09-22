/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Request Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const rawIssues = (error as unknown as { issues?: Array<{ path: Array<string | number>; message: string }>; errors?: Array<{ path: Array<string | number>; message: string }> }).issues ||
                           (error as unknown as { errors?: Array<{ path: Array<string | number>; message: string }> }).errors || [];
        const details = rawIssues.map((e) => ({
          field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
          message: e.message,
        }));
        sendError(res, 400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_ERROR.rw, details);
        return;
      }
      sendError(res, 400, 'VALIDATION_ERROR', ERROR_MESSAGES.VALIDATION_ERROR.rw);
    }
  };
}
