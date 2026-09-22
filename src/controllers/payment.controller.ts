/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Payment Controller (Kwishyura)
 */

import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class PaymentController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const payment = await PaymentService.createPayment(req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, payment, 201, 'Kwishyura kwanditswe neza.');
    } catch (error) {
      sendError(res, 400, 'PAYMENT_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const payments = await PaymentService.getPayments(req.businessId!);
      sendSuccess(res, payments);
    } catch (error) {
      sendError(res, 500, 'PAYMENTS_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
