/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Daily & Monthly Reports Engine (Raporo)
 * Generates structured summaries with WhatsApp dispatch preparation.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Sale, Purchase, Expense, StockMovement, Customer, Supplier, DailyReport } from '../types/index.ts';
import { formatRwf } from '../utils/i18n.ts';

const reportRepo = new FirestoreRepository<DailyReport>('daily_reports');
const saleRepo = new FirestoreRepository<Sale>('sales');
const purchaseRepo = new FirestoreRepository<Purchase>('purchases');
const expenseRepo = new FirestoreRepository<Expense>('expenses');
const movementRepo = new FirestoreRepository<StockMovement>('stock_movements');
const customerRepo = new FirestoreRepository<Customer>('customers');
const supplierRepo = new FirestoreRepository<Supplier>('suppliers');

export class ReportService {
  static async generateDailyReport(businessId: string, targetDateStr?: string): Promise<DailyReport> {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    const [sales, purchases, expenses, movements, customers, suppliers] = await Promise.all([
      saleRepo.findByBusiness(businessId, 500, 'saleDate', 'desc'),
      purchaseRepo.findByBusiness(businessId, 500, 'purchaseDate', 'desc'),
      expenseRepo.findByBusiness(businessId, 500, 'date', 'desc'),
      movementRepo.findByBusiness(businessId, 500, 'createdAt', 'desc'),
      customerRepo.findByBusiness(businessId, 500, 'updatedAt', 'desc'),
      supplierRepo.findByBusiness(businessId, 500, 'updatedAt', 'desc'),
    ]);

    const daySales = sales.filter((s) => {
      const d = new Date(s.saleDate || s.createdAt);
      return d >= start && d <= end;
    });

    const dayPurchases = purchases.filter((p) => {
      const d = new Date(p.purchaseDate || p.createdAt);
      return d >= start && d <= end;
    });

    const dayExpenses = expenses.filter((e) => {
      const d = new Date(e.date || e.createdAt);
      return d >= start && d <= end;
    });

    const dayMovements = movements.filter((m) => {
      const d = new Date(m.createdAt);
      return d >= start && d <= end;
    });

    const salesTotal = daySales.reduce((acc, s) => acc + s.total, 0);
    const cashReceived = daySales.reduce((acc, s) => acc + s.amountPaid, 0);
    const accountsReceivableTotal = daySales.reduce((acc, s) => acc + s.amountDue, 0);
    const purchasesTotal = dayPurchases.reduce((acc, p) => acc + p.total, 0);
    const expensesTotal = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const totalCostOfSoldTimber = daySales.reduce((acc, s) => acc + (s.totalCost || 0), 0);
    const profitTotal = salesTotal - totalCostOfSoldTimber - expensesTotal;

    const debtorsCount = customers.filter((c) => c.outstandingBalance > 0).length;
    const payingCustomersCount = daySales.filter((s) => s.amountPaid > 0).length;
    const suppliersPaidTotal = dayPurchases.reduce((acc, p) => acc + p.amountPaid, 0);

    const alerts: string[] = [];
    if (accountsReceivableTotal > 0) {
      alerts.push(`Amafaranga abakiriya batarishyura uyu munsi: ${formatRwf(accountsReceivableTotal)}`);
    }

    const dateFormatted = start.toISOString().split('T')[0];

    // Prepare WhatsApp Message text format
    const whatsAppText = [
      `📊 *WoodApp - Raporo y'umunsi (${dateFormatted})*`,
      ``,
      `💰 *Nagurishije:* ${formatRwf(salesTotal)}`,
      `💵 *Amafaranga yakiriwe:* ${formatRwf(cashReceived)}`,
      `👥 *Abakiriya batarishyura:* ${formatRwf(accountsReceivableTotal)}`,
      `📦 *Ibyo twaguze:* ${formatRwf(purchasesTotal)}`,
      `💸 *Amafaranga yakoreshejwe:* ${formatRwf(expensesTotal)}`,
      `📈 *Inyungu:* ${formatRwf(profitTotal)}`,
      `🪵 *Stock movements:* ${dayMovements.length}`,
      ``,
      `_Iyi raporo yabazwe mu buryo bwikora na WoodApp Backend._`,
    ].join('\n');

    const report: Omit<DailyReport, 'id'> = {
      businessId,
      reportDate: dateFormatted,
      salesTotal,
      cashReceived,
      accountsReceivableTotal,
      purchasesTotal,
      expensesTotal,
      profitTotal,
      stockMovementsCount: dayMovements.length,
      payingCustomersCount,
      debtorsCount,
      suppliersPaidTotal,
      alerts,
      whatsAppPayload: {
        recipientPhone: '',
        formattedText: whatsAppText,
      },
      createdAt: new Date().toISOString(),
    };

    return reportRepo.create(report);
  }

  static async getDailyReports(businessId: string, limit = 30): Promise<DailyReport[]> {
    return reportRepo.findByBusiness(businessId, limit, 'reportDate', 'desc');
  }

  static async getMonthlyReport(businessId: string, year: number, month: number) {
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);

    const [sales, expenses, purchases] = await Promise.all([
      saleRepo.findByBusiness(businessId, 1000, 'saleDate', 'desc'),
      expenseRepo.findByBusiness(businessId, 1000, 'date', 'desc'),
      purchaseRepo.findByBusiness(businessId, 1000, 'purchaseDate', 'desc'),
    ]);

    const mSales = sales.filter((s) => {
      const d = new Date(s.saleDate || s.createdAt);
      return d >= start && d <= end;
    });

    const mExpenses = expenses.filter((e) => {
      const d = new Date(e.date || e.createdAt);
      return d >= start && d <= end;
    });

    const mPurchases = purchases.filter((p) => {
      const d = new Date(p.purchaseDate || p.createdAt);
      return d >= start && d <= end;
    });

    const totalSales = mSales.reduce((sum, s) => sum + s.total, 0);
    const totalCash = mSales.reduce((sum, s) => sum + s.amountPaid, 0);
    const totalExpenses = mExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalPurchases = mPurchases.reduce((sum, p) => sum + p.total, 0);
    const totalCOGS = mSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
    const netProfit = totalSales - totalCOGS - totalExpenses;

    return {
      businessId,
      year,
      month,
      salesCount: mSales.length,
      totalSales,
      totalCashReceived: totalCash,
      totalExpenses,
      totalPurchases,
      totalCostOfGoodsSold: totalCOGS,
      netProfit,
      formattedSummaryRw: `Ukwezi kwa ${month}/${year}: Nagurishije ${formatRwf(totalSales)}, Nakoresheje ${formatRwf(totalExpenses)}, Inyungu: ${formatRwf(netProfit)}.`,
    };
  }
}
