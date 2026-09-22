/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Dashboard Controller (Business yanjye)
 */

import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class DashboardController {
  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const businessId = req.businessId!;
      const range = (req.query.range as 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom') || 'today';
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      const summary = await DashboardService.getSummary(businessId, range, startDate, endDate);
      sendSuccess(res, summary);
    } catch (error) {
      sendError(res, 500, 'DASHBOARD_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
