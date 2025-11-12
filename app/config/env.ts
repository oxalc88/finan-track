/**
 * Environment configuration with Zod validation
 * Loads and validates all environment variables
 */

import { z } from 'zod';

const configSchema = z.object({
  // Server
  server: z.object({
    env: z.enum(['development', 'production', 'test']).default('development'),
    port: z.coerce.number().int().positive().default(3000),
    host: z.string().default('0.0.0.0'),
    logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  }),

  // Database
  database: z.object({
    url: z.string().url(),
  }),

  // Storage (S3-compatible)
  storage: z.object({
    endpoint: z.string().url().optional(),
    region: z.string().default('us-east-1'),
    bucket: z.string().min(1),
    accessKey: z.string().min(1),
    secretKey: z.string().min(1),
    forcePathStyle: z.coerce.boolean().default(false),
  }),

  // Queue
  queue: z.object({
    type: z.enum(['sqs', 'rabbitmq', 'memory']).default('memory'),
    url: z.string().optional(),
  }),

  // OCR
  ocr: z.object({
    provider: z.enum(['tesseract', 'textract', 'cloudflare-ai']).default('tesseract'),
    language: z.string().default('eng'),
  }),

  // AWS (optional, for services like Textract)
  aws: z.object({
    region: z.string().default('us-east-1'),
    accessKeyId: z.string().optional(),
    secretAccessKey: z.string().optional(),
  }),

  // WhatsApp (Kapso.ai)
  whatsapp: z.object({
    apiKey: z.string().optional(),
    apiUrl: z.string().url().default('https://api.kapso.ai'),
    webhookSecret: z.string().optional(),
  }),

  // Cache
  cache: z.object({
    type: z.enum(['redis', 'memory']).default('memory'),
    redisUrl: z.string().optional(),
  }),
});

export type Config = z.infer<typeof configSchema>;

let config: Config | null = null;

/**
 * Load and validate configuration from environment variables
 */
export function loadConfig(): Config {
  if (config) {
    return config;
  }

  try {
    config = configSchema.parse({
      server: {
        env: process.env.NODE_ENV,
        port: process.env.PORT,
        host: process.env.HOST,
        logLevel: process.env.LOG_LEVEL,
      },
      database: {
        url: process.env.DATABASE_URL,
      },
      storage: {
        endpoint: process.env.STORAGE_ENDPOINT,
        region: process.env.STORAGE_REGION,
        bucket: process.env.STORAGE_BUCKET,
        accessKey: process.env.STORAGE_ACCESS_KEY,
        secretKey: process.env.STORAGE_SECRET_KEY,
        forcePathStyle: process.env.STORAGE_FORCE_PATH_STYLE,
      },
      queue: {
        type: process.env.QUEUE_TYPE,
        url: process.env.QUEUE_URL,
      },
      ocr: {
        provider: process.env.OCR_PROVIDER,
        language: process.env.OCR_LANGUAGE,
      },
      aws: {
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      whatsapp: {
        apiKey: process.env.KAPSO_API_KEY,
        apiUrl: process.env.KAPSO_API_URL,
        webhookSecret: process.env.KAPSO_WEBHOOK_SECRET,
      },
      cache: {
        type: process.env.CACHE_TYPE,
        redisUrl: process.env.REDIS_URL,
      },
    });

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Configuration validation failed:');
      for (const issue of error.issues) {
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
      }
      throw new Error('Invalid configuration. Please check your environment variables.');
    }
    throw error;
  }
}

/**
 * Get the current configuration
 * Loads it if not already loaded
 */
export function getConfig(): Config {
  if (!config) {
    return loadConfig();
  }
  return config;
}
