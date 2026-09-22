/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Inventory Controller (Imbaho mfite)
 */

import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class InventoryController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.userId;
      const item = await InventoryService.createItem(businessId, userId, req.body);
      sendSuccess(res, item, 201, 'Wongeye imbaho muri stock.');
    } catch (error) {
      sendError(res, 400, 'INVENTORY_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.businessId!;
      const { species, status, search } = req.query as { species?: string; status?: string; search?: string };
      const items = await InventoryService.getItems(businessId, { species, status, search });
      sendSuccess(res, items);
    } catch (error) {
      sendError(res, 500, 'INVENTORY_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.businessId!;
      const item = await InventoryService.getItemById(req.params.id, businessId);
      if (!item) {
        sendError(res, 404, 'NOT_FOUND', ERROR_MESSAGES.INVENTORY_ITEM_NOT_FOUND.rw);
        return;
      }
      sendSuccess(res, item);
    } catch (error) {
      sendError(res, 500, 'INVENTORY_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async adjust(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.businessId!;
      const userId = req.user!.userId;
      const { quantityChange, type, reason } = req.body;
      const result = await InventoryService.adjustStock(businessId, userId, req.params.id, {
        quantityChange,
        type,
        reason,
      });
      sendSuccess(res, result, 200, 'Stock yahinduwe neza.');
    } catch (error) {
      sendError(res, 400, 'ADJUSTMENT_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getMovements(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.businessId!;
      const movements = await InventoryService.getMovements(businessId, req.params.id);
      sendSuccess(res, movements);
    } catch (error) {
      sendError(res, 500, 'MOVEMENTS_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
