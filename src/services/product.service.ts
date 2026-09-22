/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Products Master Catalog Service
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Product } from '../types/index.ts';
import { AuditService } from './audit.service.ts';

const productRepo = new FirestoreRepository<Product>('products');

export class ProductService {
  static async createProduct(
    businessId: string,
    userId: string,
    data: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>
  ): Promise<Product> {
    const product = await productRepo.create({
      ...data,
      businessId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await AuditService.log({
      businessId,
      userId,
      action: 'PRODUCT_CREATED',
      entityType: 'product',
      entityId: product.id,
      after: product as unknown as Record<string, unknown>,
    });

    return product;
  }

  static async getProducts(businessId: string): Promise<Product[]> {
    return productRepo.findByBusiness(businessId, 200, 'name', 'asc');
  }

  static async getProductById(id: string, businessId: string): Promise<Product | null> {
    return productRepo.findById(id, businessId);
  }

  static async updateProduct(
    id: string,
    businessId: string,
    userId: string,
    updates: Partial<Product>
  ): Promise<Product | null> {
    const existing = await productRepo.findById(id, businessId);
    if (!existing) return null;

    const updated = await productRepo.update(id, businessId, updates);

    await AuditService.log({
      businessId,
      userId,
      action: 'PRODUCT_UPDATED',
      entityType: 'product',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }
}
