/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Report Controller (Raporo)
 */

import { Request, Response } from 'express';
import { ReportService } from '../services/report.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class ReportController {
  static async getDaily(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.businessId!;
      const date = req.query.date as string | undefined;
      const report = await ReportService.generateDailyReport(businessId, date);
      sendSuccess(res, report);
    } catch (error) {
      sendError(res, 500, 'REPORT_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getMonthly(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.businessId!;
      const now = new Date();
      const year = parseInt(req.query.year as string, 10) || now.getFullYear();
      const month = parseInt(req.query.month as string, 10) || now.getMonth() + 1;

      const report = await ReportService.getMonthlyReport(businessId, year, month);
      sendSuccess(res, report);
    } catch (error) {
      sendError(res, 500, 'REPORT_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
