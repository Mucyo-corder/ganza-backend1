/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Expenses Service (Amafaranga nakoresheje)
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Expense, ExpenseCategory, PaymentMethod } from '../types/index.ts';
import { getExpenseCategoryName } from '../utils/i18n.ts';
import { AccountingService } from './accounting.service.ts';
import { AuditService } from './audit.service.ts';

const expenseRepo = new FirestoreRepository<Expense>('expenses');

export class ExpenseService {
  static async createExpense(
    businessId: string,
    userId: string,
    data: {
      category: ExpenseCategory;
      description: string;
      amount: number;
      paymentMethod: PaymentMethod;
      date?: string;
    }
  ): Promise<Expense> {
    const categoryNameRw = getExpenseCategoryName(data.category, 'rw');
    const date = data.date || new Date().toISOString();

    const expense = await expenseRepo.create({
      businessId,
      category: data.category,
      categoryNameRw,
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      date,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    });

    // Double-entry accounting
    await AccountingService.recordExpense({
      businessId,
      expenseId: expense.id,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      description: `${categoryNameRw}: ${data.description}`,
    });

    // Audit log
    await AuditService.log({
      businessId,
      userId,
      action: 'EXPENSE_CREATED',
      entityType: 'expense',
      entityId: expense.id,
      after: {
        amount: data.amount,
        category: data.category,
        description: data.description,
      },
    });

    return expense;
  }

  static async getExpenses(businessId: string, limit = 100): Promise<Expense[]> {
    return expenseRepo.findByBusiness(businessId, limit, 'date', 'desc');
  }
}
