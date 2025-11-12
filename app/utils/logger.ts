/**
 * Logger utility using Pino
 */

import pino from 'pino';
import { getConfig } from '../config/env.js';

let logger: pino.Logger;

/**
 * Initialize logger
 */
export function initLogger(): pino.Logger {
  if (logger) {
    return logger;
  }

  const config = getConfig();

  logger = pino({
    level: config.server.logLevel,
    transport:
      config.server.env === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
  });

  return logger;
}

/**
 * Get logger instance
 */
export function getLogger(): pino.Logger {
  if (!logger) {
    initLogger();
  }
  return logger;
}
