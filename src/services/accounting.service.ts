/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Accounting & Financial Transaction Engine
 * Automated internal double-entry system operating seamlessly in the background.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { FinancialAccount, FinancialTransaction } from '../types/index.ts';

const transactionRepo = new FirestoreRepository<FinancialTransaction>('financial_transactions');

export interface EntryLine {
  account: FinancialAccount;
  debit: number;
  credit: number;
  description: string;
}

export class AccountingService {
  /**
   * Records a balanced double-entry transaction set
   */
  static async recordEntries(params: {
    businessId: string;
    type: FinancialTransaction['type'];
    referenceType: FinancialTransaction['referenceType'];
    referenceId: string;
    entries: EntryLine[];
  }): Promise<FinancialTransaction[]> {
    const results: FinancialTransaction[] = [];
    const now = new Date().toISOString();

    for (const entry of params.entries) {
      if (entry.debit > 0 || entry.credit > 0) {
        const item = await transactionRepo.create({
          businessId: params.businessId,
          type: params.type,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          account: entry.account,
          debit: entry.debit,
          credit: entry.credit,
          description: entry.description,
          createdAt: now,
        });
        results.push(item);
      }
    }

    return results;
  }

  /**
   * Helper: Record Sale Double-Entry
   * - Cash / Bank: Debit (Amount Paid)
   * - Accounts Receivable: Debit (Amount Due / Debt)
   * - Sales Revenue: Credit (Total Sale Price)
   * - Cost of Goods Sold (COGS): Debit (Total Timber Cost)
   * - Inventory: Credit (Total Timber Cost)
   */
  static async recordSale(params: {
    businessId: string;
    saleId: string;
    amountPaid: number;
    amountDue: number;
    total: number;
    totalCost: number;
    paymentMethod: string;
    customerName: string;
  }): Promise<FinancialTransaction[]> {
    const entries: EntryLine[] = [];

    // Cash or Bank received
    if (params.amountPaid > 0) {
      const isBank = params.paymentMethod === 'bank' || params.paymentMethod === 'mobile_money';
      entries.push({
        account: isBank ? 'bank' : 'cash',
        debit: params.amountPaid,
        credit: 0,
        description: `Amafaranga yakiriwe ku igurisha (${params.customerName})`,
      });
    }

    // Accounts receivable for unpaid debt
    if (params.amountDue > 0) {
      entries.push({
        account: 'accounts_receivable',
        debit: params.amountDue,
        credit: 0,
        description: `Umwenda w'umukiriya ku igurisha (${params.customerName})`,
      });
    }

    // Total sales revenue
    entries.push({
      account: 'sales_revenue',
      debit: 0,
      credit: params.total,
      description: `Amafaranga yagurishijwe ku igurisha (${params.customerName})`,
    });

    // COGS and Inventory asset decrement
    if (params.totalCost > 0) {
      entries.push({
        account: 'cost_of_goods_sold',
        debit: params.totalCost,
        credit: 0,
        description: `Igiciro cy'imbaho zagurishijwe (COGS)`,
      });
      entries.push({
        account: 'inventory',
        debit: 0,
        credit: params.totalCost,
        description: `Kugabanyuka k'agaciro k'imbaho muri stock`,
      });
    }

    return this.recordEntries({
      businessId: params.businessId,
      type: 'sale',
      referenceType: 'sales',
      referenceId: params.saleId,
      entries,
    });
  }

  /**
   * Helper: Record Purchase Double-Entry
   * - Inventory: Debit (Total Purchase Timber Value)
   * - Cash / Bank: Credit (Amount Paid)
   * - Accounts Payable: Credit (Amount Due / Debt to supplier)
   */
  static async recordPurchase(params: {
    businessId: string;
    purchaseId: string;
    amountPaid: number;
    amountDue: number;
    total: number;
    paymentMethod: string;
    supplierName: string;
  }): Promise<FinancialTransaction[]> {
    const entries: EntryLine[] = [
      {
        account: 'inventory',
        debit: params.total,
        credit: 0,
        description: `Wongereye agaciro k'imbaho zinjijwe muri stock (${params.supplierName})`,
      },
    ];

    if (params.amountPaid > 0) {
      const isBank = params.paymentMethod === 'bank' || params.paymentMethod === 'mobile_money';
      entries.push({
        account: isBank ? 'bank' : 'cash',
        debit: 0,
        credit: params.amountPaid,
        description: `Kwishyura uwo twaguzeho (${params.supplierName})`,
      });
    }

    if (params.amountDue > 0) {
      entries.push({
        account: 'accounts_payable',
        debit: 0,
        credit: params.amountDue,
        description: `Amafaranga dufitiye uwo twaguzeho (${params.supplierName})`,
      });
    }

    return this.recordEntries({
      businessId: params.businessId,
      type: 'purchase',
      referenceType: 'purchases',
      referenceId: params.purchaseId,
      entries,
    });
  }

  /**
   * Helper: Record Customer Payment
   */
  static async recordCustomerPayment(params: {
    businessId: string;
    paymentId: string;
    amount: number;
    paymentMethod: string;
    customerName: string;
  }): Promise<FinancialTransaction[]> {
    const isBank = params.paymentMethod === 'bank' || params.paymentMethod === 'mobile_money';
    const entries: EntryLine[] = [
      {
        account: isBank ? 'bank' : 'cash',
        debit: params.amount,
        credit: 0,
        description: `Kwakira kwishyura k'umukiriya (${params.customerName})`,
      },
      {
        account: 'accounts_receivable',
        debit: 0,
        credit: params.amount,
        description: `Kugabanya umwenda w'umukiriya (${params.customerName})`,
      },
    ];

    return this.recordEntries({
      businessId: params.businessId,
      type: 'payment_received',
      referenceType: 'payments',
      referenceId: params.paymentId,
      entries,
    });
  }

  /**
   * Helper: Record Expense
   */
  static async recordExpense(params: {
    businessId: string;
    expenseId: string;
    amount: number;
    paymentMethod: string;
    description: string;
  }): Promise<FinancialTransaction[]> {
    const isBank = params.paymentMethod === 'bank' || params.paymentMethod === 'mobile_money';
    const entries: EntryLine[] = [
      {
        account: 'expenses',
        debit: params.amount,
        credit: 0,
        description: params.description,
      },
      {
        account: isBank ? 'bank' : 'cash',
        debit: 0,
        credit: params.amount,
        description: `Amafaranga yishyuwe mu bikoresho/gahunda (${params.description})`,
      },
    ];

    return this.recordEntries({
      businessId: params.businessId,
      type: 'expense',
      referenceType: 'expenses',
      referenceId: params.expenseId,
      entries,
    });
  }
}
