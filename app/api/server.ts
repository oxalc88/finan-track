/**
 * Fastify server setup
 */

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { loadConfig } from '../config/env.js';
import { initDb, closeDb } from '../repositories/db.js';
import { initStorage } from '../lib/storage.js';
import { initLogger } from '../utils/logger.js';
import { invoiceRoutes } from './routes/invoices.js';
import { transactionRoutes } from './routes/transactions.js';
import { dashboardRoutes } from './routes/dashboard.js';
import { whatsappRoutes } from './routes/whatsapp.js';

/**
 * Create and configure the Fastify server
 */
export async function createServer() {
  // Load configuration
  const config = loadConfig();

  // Initialize logger
  const logger = initLogger();

  // Create Fastify instance
  const app = Fastify({
    logger,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    disableRequestLogging: false,
  });

  // Register plugins
  await app.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max file size
      files: 1, // Max 1 file per request
    },
  });

  // Initialize services
  initDb();
  initStorage();

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register API routes
  await app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  await app.register(invoiceRoutes, { prefix: '/api/invoices' });
  await app.register(transactionRoutes, { prefix: '/api/transactions' });
  await app.register(whatsappRoutes, { prefix: '/api/whatsapp' });

  // Error handler
  app.setErrorHandler((error, request, reply) => {
    request.log.error(error);

    reply.status(500).send({
      success: false,
      error: 'Internal server error',
    });
  });

  // Graceful shutdown
  const signals = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      try {
        await app.close();
        await closeDb();
        logger.info('Server closed successfully');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });
  }

  return app;
}

/**
 * Start the server
 */
async function start() {
  try {
    const config = loadConfig();
    const app = await createServer();

    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });

    app.log.info(
      `🚀 Server listening on http://${config.server.host}:${config.server.port}`
    );
    app.log.info(`📝 Environment: ${config.server.env}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
