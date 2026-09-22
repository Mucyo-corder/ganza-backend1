/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Expenses Controller (Amafaranga nakoresheje)
 */

import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class ExpenseController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const expense = await ExpenseService.createExpense(req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, expense, 201, 'Amafaranga yakoreshejwe yanditswe.');
    } catch (error) {
      sendError(res, 400, 'EXPENSE_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const expenses = await ExpenseService.getExpenses(req.businessId!);
      sendSuccess(res, expenses);
    } catch (error) {
      sendError(res, 500, 'EXPENSES_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
