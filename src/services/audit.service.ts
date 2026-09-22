/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Audit Service (Amateka y’ibyakozwe)
 * Permanent tamper-resistant audit trail of all business operations.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { AuditLog } from '../types/index.ts';
import { logger } from '../utils/logger.ts';

const auditRepo = new FirestoreRepository<AuditLog>('audit_logs');

export class AuditService {
  static async log(params: {
    businessId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    ipAddress?: string;
  }): Promise<AuditLog> {
    try {
      const logEntry = await auditRepo.create({
        businessId: params.businessId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before || null,
        after: params.after || null,
        timestamp: new Date().toISOString(),
        ipAddress: params.ipAddress,
      });

      logger.audit(params.action, {
        businessId: params.businessId,
        userId: params.userId,
        entityType: params.entityType,
        entityId: params.entityId,
      });

      return logEntry;
    } catch (error) {
      logger.error('Failed to write audit log entry:', error);
      // Return uncommitted representation so critical transaction does not fail if audit logging fails
      return {
        id: 'unpersisted',
        businessId: params.businessId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        timestamp: new Date().toISOString(),
      };
    }
  }

  static async getLogs(businessId: string, limit = 100): Promise<AuditLog[]> {
    return auditRepo.findByBusiness(businessId, limit, 'timestamp', 'desc');
  }
}
