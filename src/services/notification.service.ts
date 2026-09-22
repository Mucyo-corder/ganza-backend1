/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Notification Service (Ubutumwa)
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Notification } from '../types/index.ts';
import { logger } from '../utils/logger.ts';

const notificationRepo = new FirestoreRepository<Notification>('notifications');

export class NotificationService {
  static async create(params: {
    businessId: string;
    userId?: string;
    type: Notification['type'];
    title: string;
    message: string;
  }): Promise<Notification> {
    try {
      return await notificationRepo.create({
        businessId: params.businessId,
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        read: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Failed to create notification', error);
      return {
        id: 'tmp-id',
        ...params,
        read: false,
        createdAt: new Date().toISOString(),
      };
    }
  }

  static async getNotifications(businessId: string, limit = 50): Promise<Notification[]> {
    return notificationRepo.findByBusiness(businessId, limit, 'createdAt', 'desc');
  }

  static async markAsRead(id: string, businessId: string): Promise<Notification | null> {
    return notificationRepo.update(id, businessId, { read: true });
  }
}
