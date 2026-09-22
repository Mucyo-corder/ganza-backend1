/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Sales Controller (Igurisha)
 */

import { Request, Response } from 'express';
import { SaleService } from '../services/sale.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class SaleController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const sale = await SaleService.createSale(req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, sale, 201, 'Igurisha ryanditswe neza.');
    } catch (error) {
      sendError(res, 400, 'SALE_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const sales = await SaleService.getSales(req.businessId!);
      sendSuccess(res, sales);
    } catch (error) {
      sendError(res, 500, 'SALES_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const sale = await SaleService.getSaleById(req.params.id, req.businessId!);
      if (!sale) {
        sendError(res, 404, 'NOT_FOUND', 'Igurisha ntiryabonetse.');
        return;
      }
      sendSuccess(res, sale);
    } catch (error) {
      sendError(res, 500, 'SALE_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
