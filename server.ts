/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - Main Express Server Entry Point
 * Production-ready Timber Management & Accounting Backend for Rwanda
 */

import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { ENV, isFirebaseConfigured } from './src/config/environment.ts';
import { checkFirebaseConnection } from './src/config/firebase.ts';
import { apiRouter } from './src/routes/index.ts';
import { errorHandler } from './src/middleware/error.middleware.ts';
import { apiRateLimiter } from './src/middleware/rateLimiter.middleware.ts';
import { logger } from './src/utils/logger.ts';

const app = express();
const PORT = 3000;

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Vite dev tooling and preview iframe
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: ENV.CORS_ORIGIN === '*' ? '*' : ENV.CORS_ORIGIN.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-business-id', 'x-language'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Global Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path.startsWith('/api') || req.path === '/health') {
      logger.info(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
});

// Root / Health Check Endpoint
const healthCheckHandler = async (req: Request, res: Response) => {
  const isFbLive = await checkFirebaseConnection();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    service: 'WoodApp Backend API (Imbaho n’Ibiti)',
    version: '1.0.0',
    primaryLanguage: 'rw (Ikinyarwanda)',
    environment: ENV.NODE_ENV,
    database: {
      provider: 'Google Cloud Firestore',
      configured: isFirebaseConfigured(),
      connected: isFbLive,
      mode: isFbLive ? 'production_live' : 'in_memory_transient_fallback',
    },
  });
};

app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// Mount API routes with global rate limiting
app.use('/api', apiRateLimiter, apiRouter);

// Central error handler for API requests
app.use('/api', errorHandler);

// Frontend Vite Integration (for live preview and full-stack execution)
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

async function startServer() {
  try {
    await setupViteOrStatic();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🌲 WoodApp Backend Server yashyizwe ku muhanda kuri port ${PORT}`);
      logger.info(`Health check iraboneka kuri http://localhost:${PORT}/health`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      logger.info('Server irimo guhagarara (Graceful shutdown)...');
      server.close(() => {
        logger.info('Server yahagaze neza.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Byanze gutangiza server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
