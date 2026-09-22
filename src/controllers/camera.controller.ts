/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Camera Controller (Kamera z’ububiko n’aho bakorera)
 */

import { Request, Response } from 'express';
import { CameraService } from '../services/camera.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class CameraController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const camera = await CameraService.createCamera(req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, camera, 201, 'Kamera yashyizwemo neza.');
    } catch (error) {
      sendError(res, 400, 'CAMERA_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const cameras = await CameraService.getCameras(req.businessId!);
      sendSuccess(res, cameras);
    } catch (error) {
      sendError(res, 500, 'CAMERAS_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const camera = await CameraService.getCameraById(req.params.id, req.businessId!);
      if (!camera) {
        sendError(res, 404, 'NOT_FOUND', 'Kamera ntiyabonetse.');
        return;
      }
      sendSuccess(res, camera);
    } catch (error) {
      sendError(res, 500, 'CAMERA_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const updated = await CameraService.updateCamera(req.params.id, req.businessId!, req.user!.userId, req.body);
      if (!updated) {
        sendError(res, 404, 'NOT_FOUND', 'Kamera ntiyabonetse.');
        return;
      }
      sendSuccess(res, updated, 200, 'Kamera yavuguruwe neza.');
    } catch (error) {
      sendError(res, 400, 'UPDATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await CameraService.deleteCamera(req.params.id, req.businessId!, req.user!.userId);
      if (!deleted) {
        sendError(res, 404, 'NOT_FOUND', 'Kamera ntiyabonetse.');
        return;
      }
      sendSuccess(res, { deleted: true }, 200, 'Kamera yasibwe neza.');
    } catch (error) {
      sendError(res, 400, 'DELETE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async logEvent(req: Request, res: Response): Promise<void> {
    try {
      const event = await CameraService.logEvent(req.businessId!, req.body);
      sendSuccess(res, event, 201, 'Igikorwa cya kamera cyakiriwe.');
    } catch (error) {
      sendError(res, 400, 'EVENT_LOG_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const cameraId = req.query.cameraId as string | undefined;
      const events = await CameraService.getCameraEvents(req.businessId!, cameraId);
      sendSuccess(res, events);
    } catch (error) {
      sendError(res, 500, 'EVENTS_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
