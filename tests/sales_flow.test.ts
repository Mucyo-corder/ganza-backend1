/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Tests - End-to-End Sales, Stock & Debt Flow
 */

import { describe, it, expect } from 'vitest';
import { CustomerService } from '../src/services/customer.service.ts';
import { InventoryService } from '../src/services/inventory.service.ts';
import { SaleService } from '../src/services/sale.service.ts';
import { PaymentService } from '../src/services/payment.service.ts';
import { ERROR_MESSAGES } from '../src/utils/i18n.ts';

describe('WoodApp Sales, Stock & Customer Debt Consistency Flow', () => {
  const businessId = 'biz_wood_kigali_01';
  const userId = 'user_manager_01';

  it('completes the full sales and credit payment lifecycle with perfect financial consistency', async () => {
    // 1. Create Customer
    const customer = await CustomerService.create(businessId, userId, {
      name: 'Gakuba Alexis',
      phone: '0788123456',
    });
    expect(customer.outstandingBalance).toBe(0);
    expect(customer.status).toBe('paid');

    // 2. Add Timber Inventory (50 pieces of Eucalyptus / Inturusu)
    const timber = await InventoryService.createItem(businessId, userId, {
      productName: 'Imbaho z’inturusu 4x2',
      woodType: 'Hardwood',
      species: 'Eucalyptus',
      dimensions: {
        length: 4,
        width: 10,
        thickness: 5,
        dimensionUnit: 'cm',
      },
      quantity: 50,
      unit: 'piece',
      buyingPrice: 30_000,
      sellingPrice: 45_000,
      minimumStock: 15,
      location: 'Hangari ya 1',
    });
    expect(timber.quantity).toBe(50);
    expect(timber.status).toBe('in_stock');
    expect(timber.totalValue).toBe(1_500_000);

    // 3. Customer buys 10 pieces (Total: 450,000 RWF, Pays: 300,000 RWF, Owes: 150,000 RWF)
    const sale = await SaleService.createSale(businessId, userId, {
      customerId: customer.id,
      items: [
        {
          inventoryId: timber.id,
          quantity: 10,
          unitPrice: 45_000,
        },
      ],
      amountPaid: 300_000,
      paymentMethod: 'cash',
    });

    expect(sale.total).toBe(450_000);
    expect(sale.totalCost).toBe(300_000); // 10 * 30,000 buying cost
    expect(sale.profit).toBe(150_000); // 450,000 - 300,000
    expect(sale.amountPaid).toBe(300_000);
    expect(sale.amountDue).toBe(150_000);
    expect(sale.paymentStatus).toBe('partially_paid');

    // 4. Verify Stock was deducted to 40
    const updatedTimber = await InventoryService.getItemById(timber.id, businessId);
    expect(updatedTimber?.quantity).toBe(40);
    expect(updatedTimber?.status).toBe('in_stock');

    // 5. Verify Customer Debt
    const updatedCustomer = await CustomerService.getById(customer.id, businessId);
    expect(updatedCustomer?.totalPurchases).toBe(450_000);
    expect(updatedCustomer?.totalPaid).toBe(300_000);
    expect(updatedCustomer?.outstandingBalance).toBe(150_000);
    expect(updatedCustomer?.status).toBe('outstanding');

    // 6. Customer makes a partial debt payment of 100,000 RWF
    await PaymentService.createPayment(businessId, userId, {
      type: 'customer_payment',
      customerId: customer.id,
      saleId: sale.id,
      amount: 100_000,
      method: 'mobile_money',
    });

    const customerAfterPayment = await CustomerService.getById(customer.id, businessId);
    expect(customerAfterPayment?.outstandingBalance).toBe(50_000);

    // 7. Verify Excess Payment is Blocked with Kinyarwanda error
    await expect(
      PaymentService.createPayment(businessId, userId, {
        type: 'customer_payment',
        customerId: customer.id,
        amount: 80_000, // Owes 50,000 but tries to pay 80,000
        method: 'cash',
      })
    ).rejects.toThrow(ERROR_MESSAGES.EXCESS_PAYMENT.rw);

    // 8. Customer pays exact remaining 50,000 RWF
    await PaymentService.createPayment(businessId, userId, {
      type: 'customer_payment',
      customerId: customer.id,
      saleId: sale.id,
      amount: 50_000,
      method: 'cash',
    });

    const settledCustomer = await CustomerService.getById(customer.id, businessId);
    expect(settledCustomer?.outstandingBalance).toBe(0);
    expect(settledCustomer?.status).toBe('paid');
  });

  it('matches critical specification: initial 45 Eucalyptus, sale 10 @ 40,000 RWF -> stock 35, sale total 400,000 RWF, paid 250,000 RWF, outstanding 150,000 RWF', async () => {
    // Customer
    const customer = await CustomerService.create(businessId, userId, {
      name: 'Nshimiyimana Jean Spec',
      phone: '0788000111',
    });

    // 1. Initial stock: 45 Eucalyptus
    const eucalyptus = await InventoryService.createItem(businessId, userId, {
      productName: 'Eucalyptus Imbaho 4x2',
      species: 'Eucalyptus',
      woodType: 'Hardwood',
      dimensions: { length: 4, width: 10, thickness: 5, dimensionUnit: 'cm' },
      quantity: 45,
      unit: 'piece',
      buyingPrice: 25_000,
      sellingPrice: 40_000,
      minimumStock: 10,
      location: 'Hangari ya 2',
    });
    expect(eucalyptus.quantity).toBe(45);

    // 2. Sale: 10 x 40,000 RWF, Paid: 250,000 RWF
    const sale = await SaleService.createSale(businessId, userId, {
      customerId: customer.id,
      items: [
        {
          inventoryId: eucalyptus.id,
          quantity: 10,
          unitPrice: 40_000,
        },
      ],
      amountPaid: 250_000,
      paymentMethod: 'mobile_money',
    });

    // 3. Expected: Stock = 35
    const updatedEucalyptus = await InventoryService.getItemById(eucalyptus.id, businessId);
    expect(updatedEucalyptus?.quantity).toBe(35);

    // 4. Expected: Sale total = 400,000 RWF
    expect(sale.total).toBe(400_000);

    // 5. Expected: Paid = 250,000 RWF
    expect(sale.amountPaid).toBe(250_000);

    // 6. Expected: Outstanding = 150,000 RWF
    expect(sale.amountDue).toBe(150_000);

    // Check Customer Outstanding Balance = 150,000 RWF
    const updatedCustomer = await CustomerService.getById(customer.id, businessId);
    expect(updatedCustomer?.outstandingBalance).toBe(150_000);
  });
});
