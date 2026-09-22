/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Purchases Controller (Ibyo naguze)
 */

import { Request, Response } from 'express';
import { PurchaseService } from '../services/purchase.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class PurchaseController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const purchase = await PurchaseService.createPurchase(req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, purchase, 201, 'Ibyo mwaguze byanditswe muri stock.');
    } catch (error) {
      sendError(res, 400, 'PURCHASE_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const purchases = await PurchaseService.getPurchases(req.businessId!);
      sendSuccess(res, purchases);
    } catch (error) {
      sendError(res, 500, 'PURCHASES_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const purchase = await PurchaseService.getPurchaseById(req.params.id, req.businessId!);
      if (!purchase) {
        sendError(res, 404, 'NOT_FOUND', 'Ibyaguzwe ntibyabonetse.');
        return;
      }
      sendSuccess(res, purchase);
    } catch (error) {
      sendError(res, 500, 'PURCHASE_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
