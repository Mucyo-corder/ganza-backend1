/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Dashboard Engine (Business yanjye)
 * Real-time financial aggregation without complex accounting friction for Rwandan timber business owners.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Sale, Expense, InventoryItem, Customer, Supplier, DashboardSummary } from '../types/index.ts';

const saleRepo = new FirestoreRepository<Sale>('sales');
const expenseRepo = new FirestoreRepository<Expense>('expenses');
const inventoryRepo = new FirestoreRepository<InventoryItem>('inventory');
const customerRepo = new FirestoreRepository<Customer>('customers');
const supplierRepo = new FirestoreRepository<Supplier>('suppliers');

export class DashboardService {
  private static getDateBoundaries(range: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);

    switch (range) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'yesterday':
        start.setDate(now.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        end.setDate(now.getDate() - 1);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_week':
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
        start.setDate(diff);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'this_month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'custom':
        if (customStart) start.setTime(new Date(customStart).getTime());
        if (customEnd) end.setTime(new Date(customEnd).getTime());
        break;
      default:
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  static async getSummary(
    businessId: string,
    range: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom' = 'today',
    customStart?: string,
    customEnd?: string
  ): Promise<DashboardSummary> {
    const { start, end } = this.getDateBoundaries(range, customStart, customEnd);

    // Fetch collections for this business
    const [sales, expenses, inventoryItems, customers, suppliers] = await Promise.all([
      saleRepo.findByBusiness(businessId, 500, 'saleDate', 'desc'),
      expenseRepo.findByBusiness(businessId, 500, 'date', 'desc'),
      inventoryRepo.findByBusiness(businessId, 500, 'updatedAt', 'desc'),
      customerRepo.findByBusiness(businessId, 500, 'updatedAt', 'desc'),
      supplierRepo.findByBusiness(businessId, 500, 'updatedAt', 'desc'),
    ]);

    // Filter sales within the target date range
    const filteredSales = sales.filter((s) => {
      const d = new Date(s.saleDate || s.createdAt);
      return d >= start && d <= end;
    });

    // Filter expenses within range
    const filteredExpenses = expenses.filter((e) => {
      const d = new Date(e.date || e.createdAt);
      return d >= start && d <= end;
    });

    const salesTotal = filteredSales.reduce((sum, s) => sum + s.total, 0);
    const cashReceived = filteredSales.reduce((sum, s) => sum + s.amountPaid, 0);
    const totalCOGS = filteredSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const expensesTotal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Inyungu = (Sales Revenue - Cost of Timber Sold) - Expenses
    const grossMargin = salesTotal - totalCOGS;
    const estimatedProfit = grossMargin - expensesTotal;

    // Inventory aggregate
    const inventoryTotalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockCount = inventoryItems.filter((item) => item.status === 'low_stock').length;
    const outOfStockCount = inventoryItems.filter((item) => item.status === 'out_of_stock').length;

    // Receivables & Payables
    const accountsReceivable = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);
    const accountsPayable = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

    // Recent transactions unified
    const recentTransactions: DashboardSummary['recentTransactions'] = [];
    for (const s of filteredSales.slice(0, 5)) {
      recentTransactions.push({
        id: s.id,
        type: 'sale',
        description: `Igurisha kuri ${s.customerName}`,
        amount: s.total,
        date: s.saleDate || s.createdAt,
      });
    }
    for (const e of filteredExpenses.slice(0, 5)) {
      recentTransactions.push({
        id: e.id,
        type: 'expense',
        description: `${e.categoryNameRw}: ${e.description}`,
        amount: -e.amount,
        date: e.date || e.createdAt,
      });
    }
    recentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Alerts
    const alerts: DashboardSummary['alerts'] = [];
    if (outOfStockCount > 0) {
      alerts.push({
        type: 'error',
        title: 'Imbaho zarashize',
        message: `Hari ubwoko bw'imbaho ${outOfStockCount} bwashize burundu muri stock.`,
      });
    }
    if (lowStockCount > 0) {
      alerts.push({
        type: 'warning',
        title: 'Hasigaye bike muri stock',
        message: `Hari ubwoko bw'imbaho ${lowStockCount} buri munsi ya minimum stock.`,
      });
    }
    if (accountsReceivable > 0) {
      alerts.push({
        type: 'info',
        title: 'Amafaranga abakiriya batarishyura',
        message: `Abakiriya bagufitiye umwenda wa ${new Intl.NumberFormat('rw-RW').format(accountsReceivable)} RWF.`,
      });
    }

    return {
      range,
      salesTotal,
      cashReceived,
      expensesTotal,
      estimatedProfit,
      inventoryTotalValue,
      accountsReceivable,
      accountsPayable,
      lowStockCount,
      outOfStockCount,
      recentTransactions: recentTransactions.slice(0, 10),
      alerts,
    };
  }
}
