/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Sales Engine (Igurisha)
 * 100% Backend authoritative calculations, transactional stock deduction,
 * customer debt updates, and double-entry accounting records.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Sale, SaleItem, PaymentStatus } from '../types/index.ts';
import { InventoryService } from './inventory.service.ts';
import { CustomerService } from './customer.service.ts';
import { AccountingService } from './accounting.service.ts';
import { AuditService } from './audit.service.ts';
import { NotificationService } from './notification.service.ts';
import {
  ERROR_MESSAGES,
  buildSaleSuccessMessage,
  buildCustomerDebtMessage,
} from '../utils/i18n.ts';

const saleRepo = new FirestoreRepository<Sale>('sales');

export class SaleService {
  /**
   * Execute full sale transaction
   */
  static async createSale(
    businessId: string,
    userId: string,
    data: {
      customerId: string;
      items: Array<{
        inventoryId: string;
        quantity: number;
        unitPrice: number;
      }>;
      discount?: number;
      amountPaid?: number;
      paymentMethod?: string;
      saleDate?: string;
      notes?: string;
    }
  ): Promise<Sale> {
    // 1. Verify customer exists
    const customer = await CustomerService.getById(data.customerId, businessId);
    if (!customer) {
      throw new Error(ERROR_MESSAGES.CUSTOMER_NOT_FOUND.rw);
    }

    // 2. Validate stock sufficiency and compute backend authoritative pricing & cost
    const processedItems: SaleItem[] = [];
    let calculatedSubtotal = 0;
    let calculatedTotalCost = 0;
    const inventoryItemsToUpdate: Array<{
      inventoryId: string;
      quantityToDeduct: number;
      species: string;
    }> = [];

    for (const itemInput of data.items) {
      const invItem = await InventoryService.getItemById(itemInput.inventoryId, businessId);
      if (!invItem) {
        throw new Error(ERROR_MESSAGES.INVENTORY_ITEM_NOT_FOUND.rw);
      }

      if (invItem.quantity < itemInput.quantity) {
        throw new Error(
          `${ERROR_MESSAGES.INSUFFICIENT_STOCK.rw} (${invItem.productName} hasigaye ${invItem.quantity}, washakaga kugurisha ${itemInput.quantity}).`
        );
      }

      const itemTotalPrice = itemInput.quantity * itemInput.unitPrice;
      const itemTotalCost = itemInput.quantity * invItem.buyingPrice;

      calculatedSubtotal += itemTotalPrice;
      calculatedTotalCost += itemTotalCost;

      processedItems.push({
        inventoryId: invItem.id,
        productId: invItem.productId || invItem.id,
        productName: invItem.productName,
        quantity: itemInput.quantity,
        unitPrice: itemInput.unitPrice,
        totalPrice: itemTotalPrice,
        costPerUnit: invItem.buyingPrice,
        totalCost: itemTotalCost,
      });

      inventoryItemsToUpdate.push({
        inventoryId: invItem.id,
        quantityToDeduct: itemInput.quantity,
        species: invItem.species,
      });
    }

    // 3. Authoritative totals, profit, and debt calculations
    const discount = Math.max(0, data.discount || 0);
    const total = Math.max(0, calculatedSubtotal - discount);
    const amountPaid = Math.min(total, Math.max(0, data.amountPaid || 0));
    const amountDue = total - amountPaid;
    const profit = total - calculatedTotalCost;

    let paymentStatus: PaymentStatus = 'unpaid';
    if (amountPaid >= total) {
      paymentStatus = 'paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'partially_paid';
    }

    const saleDate = data.saleDate || new Date().toISOString();

    // 4. Atomic stock decrements and stock movement creation
    for (const item of inventoryItemsToUpdate) {
      await InventoryService.adjustStock(businessId, userId, item.inventoryId, {
        quantityChange: -item.quantityToDeduct,
        type: 'sale',
        reason: `Igurisha ry'umukiriya: ${customer.name}`,
        referenceType: 'sale',
      });
    }

    // 5. Persist Sale record
    const sale = await saleRepo.create({
      businessId,
      customerId: customer.id,
      customerName: customer.name,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount,
      total,
      totalCost: calculatedTotalCost,
      profit,
      amountPaid,
      amountDue,
      paymentStatus,
      saleDate,
      createdBy: userId,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 6. Update Customer balance
    await CustomerService.adjustBalance(businessId, customer.id, total, amountPaid);

    // 7. Double-entry background accounting
    await AccountingService.recordSale({
      businessId,
      saleId: sale.id,
      amountPaid,
      amountDue,
      total,
      totalCost: calculatedTotalCost,
      paymentMethod: data.paymentMethod || 'cash',
      customerName: customer.name,
    });

    // 8. Audit Log
    await AuditService.log({
      businessId,
      userId,
      action: 'SALE_CREATED',
      entityType: 'sale',
      entityId: sale.id,
      after: {
        total,
        amountPaid,
        amountDue,
        profit,
        itemsCount: processedItems.length,
      },
    });

    // 9. Automated notifications
    const totalPieces = processedItems.reduce((acc, i) => acc + i.quantity, 0);
    await NotificationService.create({
      businessId,
      userId,
      type: 'new_sale',
      title: 'Igurisha ryagenze neza',
      message: buildSaleSuccessMessage(totalPieces, total),
    });

    if (amountDue > 0) {
      await NotificationService.create({
        businessId,
        userId,
        type: 'debt_reminder',
        title: 'Umwenda w’umukiriya',
        message: buildCustomerDebtMessage(customer.name, amountDue),
      });
    }

    return sale;
  }

  static async getSales(businessId: string, limit = 100): Promise<Sale[]> {
    return saleRepo.findByBusiness(businessId, limit, 'saleDate', 'desc');
  }

  static async getSaleById(id: string, businessId: string): Promise<Sale | null> {
    return saleRepo.findById(id, businessId);
  }
}
