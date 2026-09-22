/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Tests - Health & API Integration
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server.ts';

describe('Health & API Endpoints', () => {
  it('GET /health returns 200 with Rwandan language specification and service status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toContain('WoodApp');
    expect(res.body.primaryLanguage).toContain('rw');
  });

  it('POST /api/auth/register rejects invalid email with Kinyarwanda error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalid-email',
        name: 'Murenzi Claude',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toContain('Amakuru watanze');
  });
});
