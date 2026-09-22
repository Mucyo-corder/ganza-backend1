/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Tests - Double-Entry Accounting Engine
 */

import { describe, it, expect } from 'vitest';
import { AccountingService } from '../src/services/accounting.service.ts';

describe('AccountingService (Double-Entry General Ledger)', () => {
  it('generates balanced journal entries for a cash and debt sale', async () => {
    const businessId = 'test_biz_1';
    const saleId = 'test_sale_1';
    const amountPaid = 250_000;
    const amountDue = 150_000;
    const total = 400_000;
    const totalCost = 280_000;

    const entries = await AccountingService.recordSale({
      businessId,
      saleId,
      amountPaid,
      amountDue,
      total,
      totalCost,
      paymentMethod: 'cash',
      customerName: 'Kagina Jean',
    });

    expect(entries.length).toBeGreaterThanOrEqual(4);

    // Verify Debits equal Credits
    const totalDebits = entries.reduce((acc, e) => acc + e.debit, 0);
    const totalCredits = entries.reduce((acc, e) => acc + e.credit, 0);

    // Debits: Cash (250,000) + Accounts Receivable (150,000) + COGS (280,000) = 680,000
    // Credits: Sales Revenue (400,000) + Inventory (280,000) = 680,000
    expect(totalDebits).toBe(totalCredits);
    expect(totalDebits).toBe(680_000);
  });

  it('generates balanced journal entries for timber purchases', async () => {
    const businessId = 'test_biz_1';
    const purchaseId = 'test_pur_1';
    const amountPaid = 500_000;
    const amountDue = 200_000;
    const total = 700_000;

    const entries = await AccountingService.recordPurchase({
      businessId,
      purchaseId,
      amountPaid,
      amountDue,
      total,
      paymentMethod: 'bank',
      supplierName: 'Gatsibo Forest Cooperative',
    });

    const totalDebits = entries.reduce((acc, e) => acc + e.debit, 0);
    const totalCredits = entries.reduce((acc, e) => acc + e.credit, 0);

    // Debits: Inventory (700,000)
    // Credits: Bank (500,000) + Accounts Payable (200,000) = 700,000
    expect(totalDebits).toBe(totalCredits);
    expect(totalDebits).toBe(700_000);
  });
});
