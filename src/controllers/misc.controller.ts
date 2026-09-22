/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Notification, Audit & Tax Controllers
 */

import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service.ts';
import { AuditService } from '../services/audit.service.ts';
import { TaxService } from '../services/tax.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class NotificationController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const notifications = await NotificationService.getNotifications(req.businessId!);
      sendSuccess(res, notifications);
    } catch (error) {
      sendError(res, 500, 'FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async markRead(req: Request, res: Response): Promise<void> {
    try {
      const updated = await NotificationService.markAsRead(req.params.id, req.businessId!);
      sendSuccess(res, updated, 200, 'Ubutumwa bwasomwe.');
    } catch (error) {
      sendError(res, 500, 'UPDATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}

export class AuditController {
  static async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await AuditService.getLogs(req.businessId!);
      sendSuccess(res, logs);
    } catch (error) {
      sendError(res, 500, 'FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}

export class TaxController {
  static calculateEstimate(req: Request, res: Response): void {
    try {
      const grossSales = parseFloat(req.query.grossSales as string) || 0;
      const totalExpenses = parseFloat(req.query.totalExpenses as string) || 0;
      const isVatRegistered = req.query.isVatRegistered === 'true';

      const estimate = TaxService.calculateEstimate(grossSales, totalExpenses, {
        isVatRegistered,
      });

      sendSuccess(res, estimate);
    } catch (error) {
      sendError(res, 400, 'TAX_CALC_FAILED', error instanceof Error ? error.message : 'Kugereranya umusoro byanze.');
    }
  }
}
