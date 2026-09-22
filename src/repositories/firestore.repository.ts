/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Firestore Data Repository
 * Real Google Cloud Firestore operations with graceful in-memory storage fallback
 * when credentials are not yet configured (e.g. testing or local startup).
 */

import { getFirestoreDb } from '../config/firebase.ts';
import { logger } from '../utils/logger.ts';

// In-memory tenant store fallback when Firebase credentials are not provided
const inMemoryStores = new Map<string, Map<string, Record<string, unknown>>>();

export class FirestoreRepository<T extends { id: string; businessId?: string }> {
  protected collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
    if (!inMemoryStores.has(collectionName)) {
      inMemoryStores.set(collectionName, new Map());
    }
  }

  private get memStore(): Map<string, Record<string, unknown>> {
    return inMemoryStores.get(this.collectionName)!;
  }

  async findById(id: string, businessId?: string): Promise<T | null> {
    const db = getFirestoreDb();
    if (db) {
      const docRef = db.collection(this.collectionName).doc(id);
      const snapshot = await docRef.get();
      if (!snapshot.exists) {
        return null;
      }
      const data = snapshot.data() as T;
      if (businessId && data.businessId && data.businessId !== businessId) {
        logger.warn('Cross-tenant data access blocked in repository', {
          requestedId: id,
          expectedBusinessId: businessId,
          actualBusinessId: data.businessId,
          collection: this.collectionName,
        });
        return null;
      }
      return { ...data, id: snapshot.id };
    }

    // In-memory fallback
    const item = this.memStore.get(id);
    if (!item) return null;
    if (businessId && item.businessId && item.businessId !== businessId) {
      return null;
    }
    return { ...(item as unknown as T), id };
  }

  async findByBusiness(
    businessId: string,
    limit = 100,
    orderByField = 'createdAt',
    orderDir: 'asc' | 'desc' = 'desc'
  ): Promise<T[]> {
    const db = getFirestoreDb();
    if (db) {
      const query = db
        .collection(this.collectionName)
        .where('businessId', '==', businessId)
        .orderBy(orderByField, orderDir)
        .limit(limit);

      const snapshot = await query.get();
      return snapshot.docs.map((doc) => ({ ...(doc.data() as T), id: doc.id }));
    }

    // In-memory fallback
    const items = Array.from(this.memStore.values())
      .filter((i) => i.businessId === businessId)
      .sort((a, b) => {
        const valA = String(a[orderByField] || '');
        const valB = String(b[orderByField] || '');
        return orderDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      })
      .slice(0, limit);

    return items as unknown as T[];
  }

  async query(
    conditions: Array<{ field: string; op: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains'; value: unknown }>,
    options?: { limit?: number; orderBy?: string; orderDir?: 'asc' | 'desc' }
  ): Promise<T[]> {
    const db = getFirestoreDb();
    if (db) {
      let q = db.collection(this.collectionName) as FirebaseFirestore.Query;
      for (const c of conditions) {
        q = q.where(c.field, c.op, c.value);
      }
      if (options?.orderBy) {
        q = q.orderBy(options.orderBy, options.orderDir || 'desc');
      }
      if (options?.limit) {
        q = q.limit(options.limit);
      }
      const snapshot = await q.get();
      return snapshot.docs.map((doc) => ({ ...(doc.data() as T), id: doc.id }));
    }

    // In-memory fallback
    let items = Array.from(this.memStore.values());
    for (const c of conditions) {
      items = items.filter((item) => {
        const val = item[c.field];
        if (c.op === '==') return val === c.value;
        if (c.op === '!=') return val !== c.value;
        if (c.op === '>') return Number(val) > Number(c.value);
        if (c.op === '>=') return Number(val) >= Number(c.value);
        if (c.op === '<') return Number(val) < Number(c.value);
        if (c.op === '<=') return Number(val) <= Number(c.value);
        return true;
      });
    }

    if (options?.orderBy) {
      const field = options.orderBy;
      const dir = options.orderDir || 'desc';
      items.sort((a, b) => {
        const valA = String(a[field] || '');
        const valB = String(b[field] || '');
        return dir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }

    if (options?.limit) {
      items = items.slice(0, options.limit);
    }

    return items as unknown as T[];
  }

  async create(data: Omit<T, 'id'> & { id?: string }): Promise<T> {
    const db = getFirestoreDb();
    const id = data.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const payload = {
      ...data,
      id,
      createdAt: (data as unknown as Record<string, unknown>).createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (db) {
      await db.collection(this.collectionName).doc(id).set(payload);
    } else {
      this.memStore.set(id, payload as unknown as Record<string, unknown>);
    }

    return payload as unknown as T;
  }

  async update(id: string, businessId?: string, updates?: Partial<T>): Promise<T | null> {
    const existing = await this.findById(id, businessId);
    if (!existing) {
      return null;
    }

    const payload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const db = getFirestoreDb();
    if (db) {
      await db.collection(this.collectionName).doc(id).update(payload);
    } else {
      this.memStore.set(id, { ...existing, ...payload } as Record<string, unknown>);
    }

    return { ...existing, ...payload } as T;
  }

  async delete(id: string, businessId?: string): Promise<boolean> {
    const existing = await this.findById(id, businessId);
    if (!existing) {
      return false;
    }

    const db = getFirestoreDb();
    if (db) {
      await db.collection(this.collectionName).doc(id).delete();
    } else {
      this.memStore.delete(id);
    }

    return true;
  }
}
