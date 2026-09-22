/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Supplier Controller (Abo tugura ho)
 */

import { Request, Response } from 'express';
import { SupplierService } from '../services/supplier.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class SupplierController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const supplier = await SupplierService.create(req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, supplier, 201, 'Uwo mugura ho yanditswe neza.');
    } catch (error) {
      sendError(res, 400, 'SUPPLIER_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const suppliers = await SupplierService.getAll(req.businessId!);
      sendSuccess(res, suppliers);
    } catch (error) {
      sendError(res, 500, 'SUPPLIERS_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const supplier = await SupplierService.getById(req.params.id, req.businessId!);
      if (!supplier) {
        sendError(res, 404, 'NOT_FOUND', ERROR_MESSAGES.SUPPLIER_NOT_FOUND.rw);
        return;
      }
      sendSuccess(res, supplier);
    } catch (error) {
      sendError(res, 500, 'SUPPLIER_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const updated = await SupplierService.update(req.params.id, req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, updated, 200, 'Amakuru yavuguruwe.');
    } catch (error) {
      sendError(res, 400, 'UPDATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
