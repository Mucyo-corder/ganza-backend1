/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Supplier Service (Abo tugura ho)
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Supplier } from '../types/index.ts';
import { AuditService } from './audit.service.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

const supplierRepo = new FirestoreRepository<Supplier>('suppliers');

export class SupplierService {
  static async create(
    businessId: string,
    userId: string,
    data: { name: string; phone: string; email?: string; address?: string }
  ): Promise<Supplier> {
    const supplier = await supplierRepo.create({
      businessId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await AuditService.log({
      businessId,
      userId,
      action: 'SUPPLIER_CREATED',
      entityType: 'supplier',
      entityId: supplier.id,
      after: supplier as unknown as Record<string, unknown>,
    });

    return supplier;
  }

  static async getById(id: string, businessId: string): Promise<Supplier | null> {
    return supplierRepo.findById(id, businessId);
  }

  static async getAll(businessId: string): Promise<Supplier[]> {
    return supplierRepo.findByBusiness(businessId, 200, 'updatedAt', 'desc');
  }

  static async update(
    id: string,
    businessId: string,
    userId: string,
    updates: Partial<Pick<Supplier, 'name' | 'phone' | 'email' | 'address'>>
  ): Promise<Supplier> {
    const existing = await supplierRepo.findById(id, businessId);
    if (!existing) {
      throw new Error(ERROR_MESSAGES.SUPPLIER_NOT_FOUND.rw);
    }
    const updated = await supplierRepo.update(id, businessId, updates);
    if (!updated) {
      throw new Error(ERROR_MESSAGES.SUPPLIER_NOT_FOUND.rw);
    }

    await AuditService.log({
      businessId,
      userId,
      action: 'SUPPLIER_UPDATED',
      entityType: 'supplier',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  static async adjustBalance(
    businessId: string,
    supplierId: string,
    additionalPurchaseAmount: number,
    additionalPaidAmount: number
  ): Promise<Supplier> {
    const existing = await supplierRepo.findById(supplierId, businessId);
    if (!existing) {
      throw new Error(ERROR_MESSAGES.SUPPLIER_NOT_FOUND.rw);
    }

    const newTotalPurchases = existing.totalPurchases + additionalPurchaseAmount;
    const newTotalPaid = existing.totalPaid + additionalPaidAmount;
    const newOutstandingBalance = Math.max(0, newTotalPurchases - newTotalPaid);

    const updated = await supplierRepo.update(supplierId, businessId, {
      totalPurchases: newTotalPurchases,
      totalPaid: newTotalPaid,
      outstandingBalance: newOutstandingBalance,
      updatedAt: new Date().toISOString(),
    });

    return updated as Supplier;
  }
}
