/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Purchases Service (Ibyo naguze)
 * Increases stock, updates supplier debt (Accounts Payable), and creates audit trail.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Purchase, PurchaseItem, PaymentStatus } from '../types/index.ts';
import { SupplierService } from './supplier.service.ts';
import { InventoryService } from './inventory.service.ts';
import { AccountingService } from './accounting.service.ts';
import { AuditService } from './audit.service.ts';
import { NotificationService } from './notification.service.ts';
import { ERROR_MESSAGES, buildStockAddedMessage } from '../utils/i18n.ts';

const purchaseRepo = new FirestoreRepository<Purchase>('purchases');

export class PurchaseService {
  static async createPurchase(
    businessId: string,
    userId: string,
    data: {
      supplierId: string;
      items: Array<{
        inventoryId?: string;
        productName: string;
        woodType: string;
        species: string;
        dimensions: {
          length: number;
          width: number;
          thickness: number;
          dimensionUnit: 'cm' | 'mm' | 'm';
        };
        quantity: number;
        unit: 'piece' | 'board' | 'plank' | 'sheet' | 'cubic_meter' | 'square_meter' | 'meter' | 'kg';
        unitCost: number;
        sellingPrice: number;
        location?: string;
      }>;
      discount?: number;
      amountPaid?: number;
      paymentMethod?: string;
      purchaseDate?: string;
      notes?: string;
    }
  ): Promise<Purchase> {
    const supplier = await SupplierService.getById(data.supplierId, businessId);
    if (!supplier) {
      throw new Error(ERROR_MESSAGES.SUPPLIER_NOT_FOUND.rw);
    }

    const processedItems: PurchaseItem[] = [];
    let calculatedSubtotal = 0;

    for (const itemInput of data.items) {
      const itemTotalCost = itemInput.quantity * itemInput.unitCost;
      calculatedSubtotal += itemTotalCost;

      let targetInventoryId = itemInput.inventoryId;

      // If existing item specified, increment quantity
      if (targetInventoryId) {
        await InventoryService.adjustStock(businessId, userId, targetInventoryId, {
          quantityChange: itemInput.quantity,
          type: 'purchase',
          reason: `Ibyo naguze kuri ${supplier.name}`,
          referenceType: 'purchase',
        });
      } else {
        // Create new inventory entry
        const createdInv = await InventoryService.createItem(businessId, userId, {
          productId: `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          productName: itemInput.productName,
          woodType: itemInput.woodType,
          species: itemInput.species,
          dimensions: itemInput.dimensions,
          quantity: itemInput.quantity,
          unit: itemInput.unit,
          buyingPrice: itemInput.unitCost,
          sellingPrice: itemInput.sellingPrice,
          minimumStock: 10,
          location: itemInput.location || 'Ububiko',
        });
        targetInventoryId = createdInv.id;
      }

      processedItems.push({
        inventoryId: targetInventoryId,
        productId: `prod_${itemInput.species.toLowerCase()}`,
        productName: itemInput.productName,
        woodType: itemInput.woodType,
        species: itemInput.species,
        dimensions: itemInput.dimensions,
        quantity: itemInput.quantity,
        unit: itemInput.unit,
        unitCost: itemInput.unitCost,
        totalCost: itemTotalCost,
        sellingPrice: itemInput.sellingPrice,
      });
    }

    const discount = Math.max(0, data.discount || 0);
    const total = Math.max(0, calculatedSubtotal - discount);
    const amountPaid = Math.min(total, Math.max(0, data.amountPaid || 0));
    const amountDue = total - amountPaid;

    let paymentStatus: PaymentStatus = 'unpaid';
    if (amountPaid >= total) {
      paymentStatus = 'paid';
    } else if (amountPaid > 0) {
      paymentStatus = 'partially_paid';
    }

    const purchase = await purchaseRepo.create({
      businessId,
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: processedItems,
      subtotal: calculatedSubtotal,
      discount,
      total,
      amountPaid,
      amountDue,
      paymentStatus,
      purchaseDate: data.purchaseDate || new Date().toISOString(),
      createdBy: userId,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Update supplier accounts payable balance
    await SupplierService.adjustBalance(businessId, supplier.id, total, amountPaid);

    // Double-entry accounting
    await AccountingService.recordPurchase({
      businessId,
      purchaseId: purchase.id,
      amountPaid,
      amountDue,
      total,
      paymentMethod: data.paymentMethod || 'cash',
      supplierName: supplier.name,
    });

    // Audit log
    await AuditService.log({
      businessId,
      userId,
      action: 'PURCHASE_CREATED',
      entityType: 'purchase',
      entityId: purchase.id,
      after: {
        total,
        amountPaid,
        amountDue,
        itemsCount: processedItems.length,
      },
    });

    // Notification
    const totalPieces = processedItems.reduce((acc, i) => acc + i.quantity, 0);
    const firstSpecies = processedItems[0]?.species || 'imbaho';
    await NotificationService.create({
      businessId,
      userId,
      type: 'system',
      title: 'Wongeye imbaho muri stock',
      message: buildStockAddedMessage(totalPieces, firstSpecies),
    });

    return purchase;
  }

  static async getPurchases(businessId: string, limit = 100): Promise<Purchase[]> {
    return purchaseRepo.findByBusiness(businessId, limit, 'purchaseDate', 'desc');
  }

  static async getPurchaseById(id: string, businessId: string): Promise<Purchase | null> {
    return purchaseRepo.findById(id, businessId);
  }
}
