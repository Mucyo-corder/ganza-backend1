/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Standard API Response Handlers for WoodApp Backend
 */

import { Response } from 'express';

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, message?: string): Response {
  const payload: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(message ? { message } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details: ApiErrorDetail[] = []
): Response {
  const payload: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  return res.status(statusCode).json(payload);
}
