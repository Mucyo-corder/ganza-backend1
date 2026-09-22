/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Customer Controller (Abakiriya)
 */

import { Request, Response } from 'express';
import { CustomerService } from '../services/customer.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class CustomerController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const customer = await CustomerService.create(req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, customer, 201, 'Umukiriya yanditswe neza.');
    } catch (error) {
      sendError(res, 400, 'CUSTOMER_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const customers = await CustomerService.getAll(req.businessId!);
      sendSuccess(res, customers);
    } catch (error) {
      sendError(res, 500, 'CUSTOMERS_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const customer = await CustomerService.getById(req.params.id, req.businessId!);
      if (!customer) {
        sendError(res, 404, 'NOT_FOUND', ERROR_MESSAGES.CUSTOMER_NOT_FOUND.rw);
        return;
      }
      sendSuccess(res, customer);
    } catch (error) {
      sendError(res, 500, 'CUSTOMER_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const updated = await CustomerService.update(req.params.id, req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, updated, 200, 'Amakuru y’umukiriya yavuguruwe.');
    } catch (error) {
      sendError(res, 400, 'UPDATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
