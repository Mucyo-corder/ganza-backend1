/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Business Management Service
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Business, Membership } from '../types/index.ts';
import { AuditService } from './audit.service.ts';

const businessRepo = new FirestoreRepository<Business>('businesses');
const membershipRepo = new FirestoreRepository<Membership>('memberships');

export class BusinessService {
  static async createBusiness(
    ownerId: string,
    data: {
      name: string;
      phone: string;
      email?: string;
      tinNumber?: string;
      address: {
        district: string;
        sector?: string;
        description?: string;
      };
      currency?: string;
    }
  ): Promise<{ business: Business; membership: Membership }> {
    const business = await businessRepo.create({
      name: data.name,
      ownerId,
      phone: data.phone,
      email: data.email,
      tinNumber: data.tinNumber,
      address: data.address,
      currency: data.currency || 'RWF',
      settings: {
        language: 'rw',
        lowStockThresholdDefault: 10,
        vatRatePercent: 18,
        withholdingTaxRatePercent: 3,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create owner membership
    const membership = await membershipRepo.create({
      businessId: business.id,
      userId: ownerId,
      role: 'owner',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await AuditService.log({
      businessId: business.id,
      userId: ownerId,
      action: 'BUSINESS_CREATED',
      entityType: 'business',
      entityId: business.id,
      after: business as unknown as Record<string, unknown>,
    });

    return { business, membership };
  }

  static async getById(id: string): Promise<Business | null> {
    return businessRepo.findById(id);
  }

  static async updateBusiness(
    id: string,
    userId: string,
    updates: Partial<Business>
  ): Promise<Business | null> {
    const existing = await businessRepo.findById(id);
    if (!existing) return null;

    const updated = await businessRepo.update(id, id, updates);

    await AuditService.log({
      businessId: id,
      userId,
      action: 'BUSINESS_UPDATED',
      entityType: 'business',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }
}
