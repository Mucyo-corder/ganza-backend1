/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend Structured Logger
 */

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : '');
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context ? JSON.stringify(context) : '');
  },
  error: (message: string, error?: unknown, context?: Record<string, unknown>) => {
    console.error(
      `[ERROR] [${new Date().toISOString()}] ${message}`,
      error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : error,
      context ? JSON.stringify(context) : ''
    );
  },
  audit: (action: string, details: Record<string, unknown>) => {
    console.log(`[AUDIT] [${new Date().toISOString()}] Action: ${action}`, JSON.stringify(details));
  }
};
