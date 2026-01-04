# Invoice Processing App - Layered Functional Architecture

## Overview
Pragmatic, functional architecture designed for a solo developer. No classes, no over-abstraction, just clean, maintainable code that gets the job done.

---

## Project Structure

```
finan-track/
│
├── app/                              # Application code
│   │
│   ├── api/                         # HTTP API
│   │   ├── routes/
│   │   │   ├── invoices.ts
│   │   │   ├── vendors.ts
│   │   │   ├── categories.ts
│   │   │   ├── cards.ts
│   │   │   ├── analytics.ts
│   │   │   ├── payments.ts
│   │   │   └── webhook.ts
│   │   ├── middleware/
│   │   │   ├── error-handler.ts
│   │   │   ├── validation.ts
│   │   │   └── logger.ts
│   │   └── server.ts
│   │
│   ├── services/                    # Business logic
│   │   ├── invoice-service.ts
│   │   ├── vendor-service.ts
│   │   ├── category-service.ts
│   │   ├── card-service.ts
│   │   ├── payment-service.ts
│   │   ├── analytics-service.ts
│   │   └── webhook-service.ts
│   │
│   ├── repositories/                # Data access
│   │   ├── invoice-repo.ts
│   │   ├── vendor-repo.ts
│   │   ├── category-repo.ts
│   │   ├── card-repo.ts
│   │   ├── payment-repo.ts
│   │   └── db.ts
│   │
│   ├── jobs/                        # Background workers
│   │   ├── ocr-worker.ts
│   │   ├── reminder-worker.ts
│   │   └── worker.ts
│   │
│   ├── lib/                         # Utilities & clients
│   │   ├── storage.ts              # S3/R2/MinIO
│   │   ├── queue.ts                # SQS/RabbitMQ
│   │   ├── whatsapp.ts             # Kapso client
│   │   ├── ocr.ts                  # OCR service
│   │   ├── cache.ts                # Redis/KV
│   │   └── logger.ts
│   │
│   ├── types/                       # TypeScript types
│   │   ├── invoice.ts
│   │   ├── vendor.ts
│   │   ├── card.ts
│   │   ├── payment.ts
│   │   └── index.ts
│   │
│   ├── utils/                       # Helper functions
│   │   ├── date.ts
│   │   ├── money.ts
│   │   ├── validation.ts
│   │   └── card-cycles.ts
│   │
│   ├── config/                      # Configuration
│   │   ├── env.ts
│   │   └── index.ts
│   │
│   └── frontend/                    # Dashboard UI
│       ├── src/
│       ├── public/
│       └── package.json
│
├── infra/                           # Infrastructure as Code
│   ├── terraform/
│   │   ├── modules/
│   │   ├── providers/
│   │   └── environments/
│   └── scripts/
│
├── deployments/                     # Deployment configs
│   ├── docker/
│   │   ├── Dockerfile
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   ├── aws/
│   │   └── serverless.yml
│   └── cloudflare/
│       └── wrangler.toml
│
├── migrations/                      # Database migrations
│   ├── 001_initial_schema.sql
│   └── ...
│
├── scripts/                         # Utility scripts
│   ├── dev.sh
│   ├── build.sh
│   └── migrate.sh
│
├── tests/                          # Tests
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── theme.config.json
└── README.md
```

---

## Architecture Layers

### Layer 1: Routes (HTTP Interface)
Simple HTTP handlers, minimal logic

### Layer 2: Services (Business Logic)
Pure functions containing business rules

### Layer 3: Repositories (Data Access)
Database queries and data mapping

### Layer 4: Libraries (External Services)
Clients for storage, queues, messaging, etc.

---

## Code Examples (Functional Style)

### Configuration (app/config/env.ts)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  PORT: z.string().default('3000'),

  // Database
  DATABASE_URL: z.string(),

  // Storage (works with S3, R2, MinIO)
  STORAGE_ENDPOINT: z.string(),
  STORAGE_REGION: z.string().default('auto'),
  STORAGE_BUCKET: z.string(),
  STORAGE_ACCESS_KEY: z.string(),
  STORAGE_SECRET_KEY: z.string(),

  // Queue
  QUEUE_TYPE: z.enum(['sqs', 'rabbitmq', 'memory']),
  QUEUE_URL: z.string().optional(),

  // Cache
  CACHE_TYPE: z.enum(['redis', 'memory']),
  REDIS_URL: z.string().optional(),

  // WhatsApp (Kapso)
  KAPSO_API_KEY: z.string(),
  KAPSO_WEBHOOK_SECRET: z.string(),
  KAPSO_API_URL: z.string().default('https://api.kapso.ai'),

  // OCR
  OCR_PROVIDER: z.enum(['textract', 'cloudflare-ai', 'tesseract']),
  OCR_API_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let config: Env;

export function loadConfig(): Env {
  if (config) return config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  config = result.data;
  return config;
}

export function getConfig(): Env {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return config;
}
```

---

### Storage Library (app/lib/storage.ts)

```typescript
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getConfig } from '../config/env';

let s3Client: S3Client;

/**
 * Initialize storage client (S3-compatible)
 * Works with: AWS S3, Cloudflare R2, MinIO
 */
export function initStorage() {
  const config = getConfig();

  s3Client = new S3Client({
    endpoint: config.STORAGE_ENDPOINT,
    region: config.STORAGE_REGION,
    credentials: {
      accessKeyId: config.STORAGE_ACCESS_KEY,
      secretAccessKey: config.STORAGE_SECRET_KEY,
    },
    // Required for MinIO and some S3-compatible services
    forcePathStyle: config.STORAGE_ENDPOINT.includes('localhost') ||
                    config.STORAGE_ENDPOINT.includes('minio'),
  });

  return s3Client;
}

function getClient(): S3Client {
  if (!s3Client) {
    initStorage();
  }
  return s3Client;
}

/**
 * Upload file to storage
 */
export async function uploadFile(
  key: string,
  data: Buffer,
  contentType?: string
): Promise<string> {
  const config = getConfig();
  const client = getClient();

  await client.send(new PutObjectCommand({
    Bucket: config.STORAGE_BUCKET,
    Key: key,
    Body: data,
    ContentType: contentType,
  }));

  return key;
}

/**
 * Download file from storage
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const config = getConfig();
  const client = getClient();

  const response = await client.send(new GetObjectCommand({
    Bucket: config.STORAGE_BUCKET,
    Key: key,
  }));

  const stream = response.Body as any;
  const chunks: Uint8Array[] = [];

  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

/**
 * Delete file from storage
 */
export async function deleteFile(key: string): Promise<void> {
  const config = getConfig();
  const client = getClient();

  await client.send(new DeleteObjectCommand({
    Bucket: config.STORAGE_BUCKET,
    Key: key,
  }));
}

/**
 * Get signed URL for temporary file access
 */
export async function getSignedFileUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const config = getConfig();
  const client = getClient();

  const command = new GetObjectCommand({
    Bucket: config.STORAGE_BUCKET,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn });
}

/**
 * Check if file exists
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await downloadFile(key);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate storage key for invoice file
 */
export function generateInvoiceKey(
  userId: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitized = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `invoices/${userId}/${timestamp}-${sanitized}`;
}
```

---

### Queue Library (app/lib/queue.ts)

```typescript
import { SQSClient, SendMessageCommand, ReceiveMessageCommand, DeleteMessageCommand } from '@aws-sdk/client-sqs';
import amqp from 'amqplib';
import { getConfig } from '../config/env';

type QueueMessage = {
  id: string;
  body: any;
  receiptHandle?: string;
};

/**
 * Queue abstraction - works with SQS or RabbitMQ
 */

let sqsClient: SQSClient;
let rabbitConnection: amqp.Connection;
let rabbitChannel: amqp.Channel;

async function getSQSClient(): Promise<SQSClient> {
  if (!sqsClient) {
    sqsClient = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  return sqsClient;
}

async function getRabbitChannel(): Promise<amqp.Channel> {
  if (!rabbitChannel) {
    const config = getConfig();
    rabbitConnection = await amqp.connect(config.QUEUE_URL!);
    rabbitChannel = await rabbitConnection.createChannel();
  }
  return rabbitChannel;
}

/**
 * Enqueue a message
 */
export async function enqueue(queueName: string, data: any): Promise<void> {
  const config = getConfig();

  if (config.QUEUE_TYPE === 'sqs') {
    const client = await getSQSClient();
    await client.send(new SendMessageCommand({
      QueueUrl: config.QUEUE_URL!,
      MessageBody: JSON.stringify(data),
    }));
  }
  else if (config.QUEUE_TYPE === 'rabbitmq') {
    const channel = await getRabbitChannel();
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(data)), {
      persistent: true,
    });
  }
  else if (config.QUEUE_TYPE === 'memory') {
    // In-memory queue for development
    console.log(`[Memory Queue] Enqueued to ${queueName}:`, data);
  }
}

/**
 * Dequeue messages (for workers)
 */
export async function dequeue(
  queueName: string,
  maxMessages: number = 1
): Promise<QueueMessage[]> {
  const config = getConfig();

  if (config.QUEUE_TYPE === 'sqs') {
    const client = await getSQSClient();
    const response = await client.send(new ReceiveMessageCommand({
      QueueUrl: config.QUEUE_URL!,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20,
    }));

    return (response.Messages || []).map(msg => ({
      id: msg.MessageId!,
      body: JSON.parse(msg.Body!),
      receiptHandle: msg.ReceiptHandle,
    }));
  }
  else if (config.QUEUE_TYPE === 'rabbitmq') {
    const channel = await getRabbitChannel();
    await channel.assertQueue(queueName, { durable: true });

    const msg = await channel.get(queueName, { noAck: false });
    if (!msg) return [];

    return [{
      id: msg.properties.messageId || '',
      body: JSON.parse(msg.content.toString()),
      receiptHandle: msg.properties.deliveryTag,
    }];
  }

  return [];
}

/**
 * Acknowledge message (delete from queue)
 */
export async function ackMessage(queueName: string, message: QueueMessage): Promise<void> {
  const config = getConfig();

  if (config.QUEUE_TYPE === 'sqs') {
    const client = await getSQSClient();
    await client.send(new DeleteMessageCommand({
      QueueUrl: config.QUEUE_URL!,
      ReceiptHandle: message.receiptHandle,
    }));
  }
  else if (config.QUEUE_TYPE === 'rabbitmq') {
    const channel = await getRabbitChannel();
    channel.ack({ deliveryTag: message.receiptHandle } as any);
  }
}

/**
 * Start consuming queue (for workers)
 */
export async function consume(
  queueName: string,
  handler: (data: any) => Promise<void>
): Promise<void> {
  const config = getConfig();

  console.log(`📨 Starting queue consumer for: ${queueName}`);

  if (config.QUEUE_TYPE === 'rabbitmq') {
    const channel = await getRabbitChannel();
    await channel.assertQueue(queueName, { durable: true });

    channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const data = JSON.parse(msg.content.toString());
        await handler(data);
        channel.ack(msg);
      } catch (error) {
        console.error('Error processing message:', error);
        channel.nack(msg, false, true); // Requeue on error
      }
    });
  }
  else if (config.QUEUE_TYPE === 'sqs') {
    // Poll SQS in a loop
    while (true) {
      try {
        const messages = await dequeue(queueName, 10);

        for (const message of messages) {
          try {
            await handler(message.body);
            await ackMessage(queueName, message);
          } catch (error) {
            console.error('Error processing message:', error);
            // SQS will automatically retry after visibility timeout
          }
        }
      } catch (error) {
        console.error('Error polling queue:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retry
      }
    }
  }
}
```

---

### Database (app/repositories/db.ts)

```typescript
import { Pool } from 'pg';
import { getConfig } from '../config/env';

let pool: Pool;

/**
 * Initialize database connection pool
 */
export function initDb(): Pool {
  if (pool) return pool;

  const config = getConfig();

  pool = new Pool({
    connectionString: config.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });

  return pool;
}

/**
 * Get database pool
 */
export function getDb(): Pool {
  if (!pool) {
    return initDb();
  }
  return pool;
}

/**
 * Execute a query
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const db = getDb();
  const result = await db.query(sql, params);
  return result.rows;
}

/**
 * Execute a query and return first row
 */
export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] || null;
}

/**
 * Transaction helper
 */
export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const db = getDb();
  const client = await db.connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

---

### Repository Example (app/repositories/invoice-repo.ts)

```typescript
import { query, queryOne, transaction } from './db';
import type { Invoice, InvoiceStatus } from '../types/invoice';

/**
 * Create new invoice
 */
export async function createInvoice(data: {
  userId: string;
  vendorId?: number;
  categoryId?: number;
  date: Date;
  amount: number;
  taxAmount?: number;
  currency: string;
  invoiceNumber?: string;
  sourceFileKey: string;
  status: InvoiceStatus;
  source: 'whatsapp' | 'upload';
  confidence?: number;
}): Promise<Invoice> {
  const sql = `
    INSERT INTO invoices (
      user_id, vendor_id, category_id, date, amount, tax_amount,
      currency, invoice_number, source_file_key, status, source,
      parsed_confidence, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
    RETURNING *
  `;

  const invoice = await queryOne<Invoice>(sql, [
    data.userId,
    data.vendorId,
    data.categoryId,
    data.date,
    data.amount,
    data.taxAmount,
    data.currency,
    data.invoiceNumber,
    data.sourceFileKey,
    data.status,
    data.source,
    data.confidence,
  ]);

  if (!invoice) {
    throw new Error('Failed to create invoice');
  }

  return invoice;
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: number): Promise<Invoice | null> {
  const sql = `
    SELECT i.*,
           v.name as vendor_name,
           c.name as category_name
    FROM invoices i
    LEFT JOIN vendors v ON i.vendor_id = v.id
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.id = $1
  `;

  return await queryOne<Invoice>(sql, [id]);
}

/**
 * List invoices with filters
 */
export async function listInvoices(filters: {
  userId?: string;
  vendorId?: number;
  categoryId?: number;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  status?: InvoiceStatus;
  limit?: number;
  offset?: number;
}): Promise<Invoice[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramCount = 0;

  if (filters.userId) {
    conditions.push(`i.user_id = $${++paramCount}`);
    params.push(filters.userId);
  }

  if (filters.vendorId) {
    conditions.push(`i.vendor_id = $${++paramCount}`);
    params.push(filters.vendorId);
  }

  if (filters.categoryId) {
    conditions.push(`i.category_id = $${++paramCount}`);
    params.push(filters.categoryId);
  }

  if (filters.startDate) {
    conditions.push(`i.date >= $${++paramCount}`);
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    conditions.push(`i.date <= $${++paramCount}`);
    params.push(filters.endDate);
  }

  if (filters.minAmount) {
    conditions.push(`i.amount >= $${++paramCount}`);
    params.push(filters.minAmount);
  }

  if (filters.maxAmount) {
    conditions.push(`i.amount <= $${++paramCount}`);
    params.push(filters.maxAmount);
  }

  if (filters.status) {
    conditions.push(`i.status = $${++paramCount}`);
    params.push(filters.status);
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const sql = `
    SELECT i.*,
           v.name as vendor_name,
           c.name as category_name
    FROM invoices i
    LEFT JOIN vendors v ON i.vendor_id = v.id
    LEFT JOIN categories c ON i.category_id = c.id
    ${whereClause}
    ORDER BY i.date DESC, i.created_at DESC
    LIMIT $${++paramCount} OFFSET $${++paramCount}
  `;

  params.push(filters.limit || 50);
  params.push(filters.offset || 0);

  return await query<Invoice>(sql, params);
}

/**
 * Update invoice
 */
export async function updateInvoice(
  id: number,
  data: Partial<Invoice>
): Promise<Invoice | null> {
  const fields: string[] = [];
  const params: any[] = [];
  let paramCount = 0;

  if (data.vendorId !== undefined) {
    fields.push(`vendor_id = $${++paramCount}`);
    params.push(data.vendorId);
  }

  if (data.categoryId !== undefined) {
    fields.push(`category_id = $${++paramCount}`);
    params.push(data.categoryId);
  }

  if (data.amount !== undefined) {
    fields.push(`amount = $${++paramCount}`);
    params.push(data.amount);
  }

  if (data.status !== undefined) {
    fields.push(`status = $${++paramCount}`);
    params.push(data.status);
  }

  // Add more fields as needed...

  fields.push(`updated_at = NOW()`);

  if (fields.length === 1) {
    // Only updated_at, nothing to update
    return await getInvoiceById(id);
  }

  const sql = `
    UPDATE invoices
    SET ${fields.join(', ')}
    WHERE id = $${++paramCount}
    RETURNING *
  `;

  params.push(id);

  return await queryOne<Invoice>(sql, params);
}

/**
 * Delete invoice (soft delete)
 */
export async function deleteInvoice(id: number): Promise<boolean> {
  const sql = `
    UPDATE invoices
    SET status = 'deleted', updated_at = NOW()
    WHERE id = $1
    RETURNING id
  `;

  const result = await queryOne(sql, [id]);
  return result !== null;
}
```

---

### Service Example (app/services/invoice-service.ts)

```typescript
import * as invoiceRepo from '../repositories/invoice-repo';
import * as storage from '../lib/storage';
import * as queue from '../lib/queue';
import * as whatsapp from '../lib/whatsapp';
import type { Invoice } from '../types/invoice';

/**
 * Process uploaded invoice
 */
export async function processInvoice(data: {
  userId: string;
  file: Buffer;
  fileName: string;
  contentType: string;
  source: 'whatsapp' | 'upload';
  phoneNumber?: string;
}): Promise<{ success: boolean; invoiceId?: number; message: string }> {
  try {
    // 1. Upload file to storage
    const fileKey = storage.generateInvoiceKey(data.userId, data.fileName);
    await storage.uploadFile(fileKey, data.file, data.contentType);

    // 2. Create invoice record
    const invoice = await invoiceRepo.createInvoice({
      userId: data.userId,
      date: new Date(),
      amount: 0, // Will be updated after OCR
      currency: 'USD',
      sourceFileKey: fileKey,
      status: 'pending_ocr',
      source: data.source,
    });

    // 3. Queue OCR processing
    await queue.enqueue('ocr-jobs', {
      invoiceId: invoice.id,
      fileKey,
      contentType: data.contentType,
    });

    // 4. Send confirmation
    if (data.phoneNumber) {
      await whatsapp.sendMessage(
        data.phoneNumber,
        '✅ Invoice received! Processing now...'
      );
    }

    return {
      success: true,
      invoiceId: invoice.id,
      message: 'Invoice uploaded and queued for processing',
    };
  } catch (error) {
    console.error('Error processing invoice:', error);

    if (data.phoneNumber) {
      await whatsapp.sendMessage(
        data.phoneNumber,
        '❌ Error processing invoice. Please try again.'
      );
    }

    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get invoices with filters
 */
export async function getInvoices(filters: {
  userId: string;
  vendorId?: number;
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<{ invoices: Invoice[]; total: number; page: number; pages: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const offset = (page - 1) * limit;

  const invoices = await invoiceRepo.listInvoices({
    userId: filters.userId,
    vendorId: filters.vendorId,
    categoryId: filters.categoryId,
    startDate: filters.startDate ? new Date(filters.startDate) : undefined,
    endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    limit,
    offset,
  });

  // Get total count (you'd add a separate repo function for this)
  const total = invoices.length; // Simplified
  const pages = Math.ceil(total / limit);

  return { invoices, total, page, pages };
}

/**
 * Get invoice by ID
 */
export async function getInvoiceById(id: number): Promise<Invoice | null> {
  return await invoiceRepo.getInvoiceById(id);
}

/**
 * Update invoice
 */
export async function updateInvoice(
  id: number,
  data: Partial<Invoice>
): Promise<Invoice | null> {
  return await invoiceRepo.updateInvoice(id, data);
}

/**
 * Delete invoice
 */
export async function deleteInvoice(id: number): Promise<boolean> {
  const invoice = await invoiceRepo.getInvoiceById(id);

  if (!invoice) {
    return false;
  }

  // Delete file from storage
  await storage.deleteFile(invoice.sourceFileKey);

  // Soft delete in database
  return await invoiceRepo.deleteInvoice(id);
}
```

---

### Route Example (app/api/routes/invoices.ts)

```typescript
import { FastifyInstance } from 'fastify';
import * as invoiceService from '../../services/invoice-service';
import { z } from 'zod';

const createInvoiceSchema = z.object({
  file: z.any(), // File upload
  source: z.enum(['whatsapp', 'upload']),
});

const listInvoicesSchema = z.object({
  vendorId: z.string().optional(),
  categoryId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export async function invoiceRoutes(app: FastifyInstance) {
  // List invoices
  app.get('/', async (request, reply) => {
    const query = listInvoicesSchema.parse(request.query);
    const userId = (request as any).user.id; // From auth middleware

    const result = await invoiceService.getInvoices({
      userId,
      vendorId: query.vendorId ? parseInt(query.vendorId) : undefined,
      categoryId: query.categoryId ? parseInt(query.categoryId) : undefined,
      startDate: query.startDate,
      endDate: query.endDate,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 50,
    });

    return result;
  });

  // Get single invoice
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const invoice = await invoiceService.getInvoiceById(parseInt(id));

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    return invoice;
  });

  // Create invoice (manual upload)
  app.post('/', async (request, reply) => {
    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const userId = (request as any).user.id;
    const buffer = await data.toBuffer();

    const result = await invoiceService.processInvoice({
      userId,
      file: buffer,
      fileName: data.filename,
      contentType: data.mimetype,
      source: 'upload',
    });

    if (!result.success) {
      return reply.code(500).send({ error: result.message });
    }

    return result;
  });

  // Update invoice
  app.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as Partial<any>;

    const invoice = await invoiceService.updateInvoice(parseInt(id), data);

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    return invoice;
  });

  // Delete invoice
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = await invoiceService.deleteInvoice(parseInt(id));

    if (!success) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    return { success: true };
  });
}
```

---

## Key Principles

1. **Functions over classes** - Everything is just functions
2. **Simple imports** - Direct function imports, no DI container
3. **Configuration-based** - Use env vars to switch providers
4. **Single responsibility** - Each file has one clear purpose
5. **Testable** - Easy to mock functions in tests

---

## Benefits for Solo Developer

✅ **Fast to build** - Less boilerplate, more features
✅ **Easy to understand** - No design patterns to remember
✅ **Simple debugging** - Clear function call chains
✅ **Flexible** - Easy to change structure as you learn
✅ **Still cloud-agnostic** - Config determines providers

---

## Next Steps

1. Set up project structure
2. Implement core libraries (storage, queue, db)
3. Build repositories
4. Build services
5. Add routes
6. Create frontend
7. Deploy

Simple, pragmatic, gets the job done. 🎯
