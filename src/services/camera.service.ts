/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Camera & Live Monitoring Service
 * Camera management, stream registry, and event ingestion architecture.
 */

import { FirestoreRepository } from '../repositories/firestore.repository.ts';
import { Camera, CameraEvent } from '../types/index.ts';
import { AuditService } from './audit.service.ts';
import { NotificationService } from './notification.service.ts';

const cameraRepo = new FirestoreRepository<Camera>('cameras');
const cameraEventRepo = new FirestoreRepository<CameraEvent>('camera_events');

export class CameraService {
  static async createCamera(
    businessId: string,
    userId: string,
    data: Omit<Camera, 'id' | 'businessId' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<Camera> {
    const camera = await cameraRepo.create({
      ...data,
      businessId,
      status: 'online',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await AuditService.log({
      businessId,
      userId,
      action: 'CAMERA_ADDED',
      entityType: 'camera',
      entityId: camera.id,
      after: camera as unknown as Record<string, unknown>,
    });

    return camera;
  }

  static async getCameras(businessId: string): Promise<Camera[]> {
    return cameraRepo.findByBusiness(businessId, 50, 'createdAt', 'asc');
  }

  static async getCameraById(id: string, businessId: string): Promise<Camera | null> {
    return cameraRepo.findById(id, businessId);
  }

  static async updateCamera(
    id: string,
    businessId: string,
    userId: string,
    updates: Partial<Camera>
  ): Promise<Camera | null> {
    const existing = await cameraRepo.findById(id, businessId);
    if (!existing) return null;

    const updated = await cameraRepo.update(id, businessId, updates);

    await AuditService.log({
      businessId,
      userId,
      action: 'CAMERA_UPDATED',
      entityType: 'camera',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  static async deleteCamera(id: string, businessId: string, userId: string): Promise<boolean> {
    const existing = await cameraRepo.findById(id, businessId);
    if (!existing) return false;

    await cameraRepo.delete(id, businessId);

    await AuditService.log({
      businessId,
      userId,
      action: 'CAMERA_DELETED',
      entityType: 'camera',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
    });

    return true;
  }

  /**
   * Log an event detected by camera streams or edge processing
   */
  static async logEvent(
    businessId: string,
    data: Omit<CameraEvent, 'id' | 'businessId' | 'createdAt'>
  ): Promise<CameraEvent> {
    const event = await cameraEventRepo.create({
      ...data,
      businessId,
      createdAt: new Date().toISOString(),
    });

    // If unusual activity or offline, create immediate business notification
    if (data.eventType === 'camera_offline' || data.eventType === 'unusual_activity') {
      await NotificationService.create({
        businessId,
        type: 'camera_alert',
        title: data.eventType === 'camera_offline' ? 'Kamera ntiri kuri Internet' : 'Ikintu kidasanzwe kibonetse kuri kamera',
        message: `Kamera yabonye ikintu kidasanzwe muri ${data.eventType}.`,
      });
    }

    return event;
  }

  static async getCameraEvents(businessId: string, cameraId?: string): Promise<CameraEvent[]> {
    if (cameraId) {
      return cameraEventRepo.query(
        [
          { field: 'businessId', op: '==', value: businessId },
          { field: 'cameraId', op: '==', value: cameraId },
        ],
        { orderBy: 'createdAt', orderDir: 'desc', limit: 100 }
      );
    }
    return cameraEventRepo.findByBusiness(businessId, 100, 'createdAt', 'desc');
  }
}
