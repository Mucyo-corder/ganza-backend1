/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Product Controller
 */

import { Request, Response } from 'express';
import { ProductService } from '../services/product.service.ts';
import { sendSuccess, sendError } from '../utils/response.ts';
import { ERROR_MESSAGES } from '../utils/i18n.ts';

export class ProductController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.createProduct(req.businessId!, req.user!.userId, req.body);
      sendSuccess(res, product, 201, 'Igicuruzwa cyashyizwe muri catalog.');
    } catch (error) {
      sendError(res, 400, 'PRODUCT_CREATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const products = await ProductService.getProducts(req.businessId!);
      sendSuccess(res, products);
    } catch (error) {
      sendError(res, 500, 'PRODUCTS_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const product = await ProductService.getProductById(req.params.id, req.businessId!);
      if (!product) {
        sendError(res, 404, 'NOT_FOUND', 'Igicuruzwa nticyabonetse.');
        return;
      }
      sendSuccess(res, product);
    } catch (error) {
      sendError(res, 500, 'PRODUCT_FETCH_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const updated = await ProductService.updateProduct(req.params.id, req.businessId!, req.user!.userId, req.body);
      if (!updated) {
        sendError(res, 404, 'NOT_FOUND', 'Igicuruzwa nticyabonetse.');
        return;
      }
      sendSuccess(res, updated, 200, 'Igicuruzwa cyavuguruwe.');
    } catch (error) {
      sendError(res, 400, 'UPDATE_FAILED', error instanceof Error ? error.message : ERROR_MESSAGES.DATABASE_ERROR.rw);
    }
  }
}
