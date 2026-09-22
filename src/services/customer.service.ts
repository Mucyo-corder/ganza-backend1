/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Customer Service (Abakiriya)
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Customer } from '../types/index.ts';
import { AuditService } from './audit.service.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

const customerRepo = new FirestoreRepository<Customer>('customers');

export class CustomerService {
  static async create(
    businessId: string,
    userId: string,
    data: { name: string; phone: string; email?: string; address?: string }
  ): Promise<Customer> {
    const customer = await customerRepo.create({
      businessId,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      totalPurchases: 0,
      totalPaid: 0,
      outstandingBalance: 0,
      status: 'paid',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await AuditService.log({
      businessId,
      userId,
      action: 'CUSTOMER_CREATED',
      entityType: 'customer',
      entityId: customer.id,
      after: customer as unknown as Record<string, unknown>,
    });

    return customer;
  }

  static async getById(id: string, businessId: string): Promise<Customer | null> {
    return customerRepo.findById(id, businessId);
  }

  static async getAll(businessId: string): Promise<Customer[]> {
    return customerRepo.findByBusiness(businessId, 200, 'updatedAt', 'desc');
  }

  static async update(
    id: string,
    businessId: string,
    userId: string,
    updates: Partial<Pick<Customer, 'name' | 'phone' | 'email' | 'address'>>
  ): Promise<Customer> {
    const existing = await customerRepo.findById(id, businessId);
    if (!existing) {
      throw new Error(ERROR_MESSAGES.CUSTOMER_NOT_FOUND.rw);
    }
    const updated = await customerRepo.update(id, businessId, updates);
    if (!updated) {
      throw new Error(ERROR_MESSAGES.CUSTOMER_NOT_FOUND.rw);
    }

    await AuditService.log({
      businessId,
      userId,
      action: 'CUSTOMER_UPDATED',
      entityType: 'customer',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  /**
   * Internal balance adjuster when sale or payment occurs
   */
  static async adjustBalance(
    businessId: string,
    customerId: string,
    additionalPurchaseAmount: number,
    additionalPaidAmount: number
  ): Promise<Customer> {
    const existing = await customerRepo.findById(customerId, businessId);
    if (!existing) {
      throw new Error(ERROR_MESSAGES.CUSTOMER_NOT_FOUND.rw);
    }

    const newTotalPurchases = existing.totalPurchases + additionalPurchaseAmount;
    const newTotalPaid = existing.totalPaid + additionalPaidAmount;
    const newOutstandingBalance = Math.max(0, newTotalPurchases - newTotalPaid);

    const newStatus: Customer['status'] = newOutstandingBalance <= 0 ? 'paid' : 'outstanding';

    const updated = await customerRepo.update(customerId, businessId, {
      totalPurchases: newTotalPurchases,
      totalPaid: newTotalPaid,
      outstandingBalance: newOutstandingBalance,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    return updated as Customer;
  }
}
