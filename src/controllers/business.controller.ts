/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Business Controller
 */

import { Request, Response } from 'express';
import { BusinessService } from '../services/business.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class BusinessController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED.rw);
        return;
      }
      const result = await BusinessService.createBusiness(req.user.userId, req.body);
      sendSuccess(res, result, 201, 'Business yashinzwe neza.');
    } catch (error) {
      sendError(res, 400, 'CREATION_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const business = await BusinessService.getById(req.params.id);
      if (!business) {
        sendError(res, 404, 'NOT_FOUND', ERROR_MESSAGES.BUSINESS_NOT_FOUND.rw);
        return;
      }
      sendSuccess(res, business);
    } catch (error) {
      sendError(res, 500, 'INTERNAL_ERROR', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 401, 'UNAUTHORIZED', ERROR_MESSAGES.UNAUTHORIZED.rw);
        return;
      }
      const updated = await BusinessService.updateBusiness(req.params.id, req.user.userId, req.body);
      if (!updated) {
        sendError(res, 404, 'NOT_FOUND', ERROR_MESSAGES.BUSINESS_NOT_FOUND.rw);
        return;
      }
      sendSuccess(res, updated, 200, 'Amakuru ya business yavuguruwe neza.');
    } catch (error) {
      sendError(res, 400, 'UPDATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
