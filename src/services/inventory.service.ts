/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Inventory & Stock Movements Service
 * Manages timber items, dimensional specifications, and atomic stock history.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { InventoryItem, StockMovement, StockMovementType } from '../types/index.ts';
import { AuditService } from './audit.service.ts';
import { NotificationService } from './notification.service.ts';
import { buildLowStockAlertMessage, buildOutOfStockAlertMessage, ERROR_MESSAGES } from '../utils/i18n.ts';

const inventoryRepo = new FirestoreRepository<InventoryItem>('inventory');
const movementRepo = new FirestoreRepository<StockMovement>('stock_movements');

export class InventoryService {
  /**
   * Determine item stock status
   */
  static computeStatus(quantity: number, minStock: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (quantity <= 0) return 'out_of_stock';
    if (quantity <= minStock) return 'low_stock';
    return 'in_stock';
  }

  /**
   * Add new timber product to inventory
   */
  static async createItem(
    businessId: string,
    userId: string,
    data: Omit<InventoryItem, 'id' | 'businessId' | 'totalValue' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<InventoryItem> {
    const totalValue = data.quantity * data.buyingPrice;
    const status = this.computeStatus(data.quantity, data.minimumStock);

    const item = await inventoryRepo.create({
      ...data,
      businessId,
      productId: data.productId || `prod_${Date.now()}`,
      totalValue,
      status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Record initial stock entry movement
    if (data.quantity > 0) {
      await movementRepo.create({
        businessId,
        inventoryId: item.id,
        productId: item.productId || item.id,
        productName: item.productName,
        type: 'manual_add',
        quantity: data.quantity,
        previousQuantity: 0,
        newQuantity: data.quantity,
        referenceType: 'manual',
        referenceId: item.id,
        reason: 'Kwinjiza imbaho bwa mbere muri stock',
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });
    }

    await AuditService.log({
      businessId,
      userId,
      action: 'INVENTORY_CREATED',
      entityType: 'inventory',
      entityId: item.id,
      after: item as unknown as Record<string, unknown>,
    });

    return item;
  }

  static async getItems(businessId: string, queryParams?: { species?: string; status?: string; search?: string }): Promise<InventoryItem[]> {
    let items = await inventoryRepo.findByBusiness(businessId, 200, 'updatedAt', 'desc');

    if (queryParams?.species) {
      items = items.filter((i) => i.species.toLowerCase() === queryParams.species?.toLowerCase());
    }
    if (queryParams?.status) {
      items = items.filter((i) => i.status === queryParams.status);
    }
    if (queryParams?.search) {
      const term = queryParams.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.productName.toLowerCase().includes(term) ||
          i.species.toLowerCase().includes(term) ||
          i.woodType.toLowerCase().includes(term) ||
          i.location.toLowerCase().includes(term)
      );
    }
    return items;
  }

  static async getItemById(id: string, businessId: string): Promise<InventoryItem | null> {
    return inventoryRepo.findById(id, businessId);
  }

  /**
   * Adjust stock manually or via specific operation with full audit & movement trail
   */
  static async adjustStock(
    businessId: string,
    userId: string,
    inventoryId: string,
    params: {
      quantityChange: number;
      type: StockMovementType;
      reason: string;
      referenceType?: StockMovement['referenceType'];
      referenceId?: string;
    }
  ): Promise<{ item: InventoryItem; movement: StockMovement }> {
    const existing = await inventoryRepo.findById(inventoryId, businessId);
    if (!existing) {
      throw new Error(ERROR_MESSAGES.INVENTORY_ITEM_NOT_FOUND.rw);
    }

    const previousQuantity = existing.quantity;
    const newQuantity = previousQuantity + params.quantityChange;

    if (newQuantity < 0) {
      throw new Error(ERROR_MESSAGES.INSUFFICIENT_STOCK.rw);
    }

    const newStatus = this.computeStatus(newQuantity, existing.minimumStock);
    const newTotalValue = newQuantity * existing.buyingPrice;

    const updatedItem = (await inventoryRepo.update(inventoryId, businessId, {
      quantity: newQuantity,
      status: newStatus,
      totalValue: newTotalValue,
      updatedAt: new Date().toISOString(),
    })) as InventoryItem;

    const movement = await movementRepo.create({
      businessId,
      inventoryId,
      productId: existing.productId || existing.id,
      productName: existing.productName,
      type: params.type,
      quantity: Math.abs(params.quantityChange),
      previousQuantity,
      newQuantity,
      referenceType: params.referenceType || 'adjustment',
      referenceId: params.referenceId || inventoryId,
      reason: params.reason,
      createdBy: userId,
      createdAt: new Date().toISOString(),
    });

    await AuditService.log({
      businessId,
      userId,
      action: 'INVENTORY_ADJUSTED',
      entityType: 'inventory',
      entityId: inventoryId,
      before: { quantity: previousQuantity, status: existing.status },
      after: { quantity: newQuantity, status: newStatus, type: params.type, reason: params.reason },
    });

    // Alert triggers
    if (newStatus === 'low_stock' && existing.status !== 'low_stock') {
      await NotificationService.create({
        businessId,
        type: 'low_stock',
        title: 'Hasigaye bike muri stock',
        message: buildLowStockAlertMessage(existing.species, newQuantity),
      });
    } else if (newStatus === 'out_of_stock' && existing.status !== 'out_of_stock') {
      await NotificationService.create({
        businessId,
        type: 'low_stock',
        title: 'Imbaho zarashize muri stock',
        message: buildOutOfStockAlertMessage(existing.species),
      });
    }

    return { item: updatedItem, movement };
  }

  static async getMovements(businessId: string, inventoryId?: string): Promise<StockMovement[]> {
    if (inventoryId) {
      return movementRepo.query(
        [
          { field: 'businessId', op: '==', value: businessId },
          { field: 'inventoryId', op: '==', value: inventoryId },
        ],
        { orderBy: 'createdAt', orderDir: 'desc', limit: 100 }
      );
    }
    return movementRepo.findByBusiness(businessId, 100, 'createdAt', 'desc');
  }
}
