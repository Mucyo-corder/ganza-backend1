/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Auth Controller
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      sendSuccess(res, result, 201, 'Kwandikwa byagenze neza.');
    } catch (error) {
      sendError(res, 400, 'REGISTRATION_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, result, 200, 'Kwinjira byagenze neza.');
    } catch (error) {
      sendError(res, 401, 'LOGIN_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.UNAUTHORIZED.rw);
    }
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED.rw);
        return;
      }
      const user = await AuthService.getMe(req.user.userId);
      sendSuccess(res, user);
    } catch (error) {
      sendError(res, 500, 'INTERNAL_ERROR', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
