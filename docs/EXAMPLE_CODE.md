# Example Code: Hexagonal Architecture in Practice

This document shows concrete examples of how the adapter pattern works in the cloud-agnostic architecture.

---

## Port Definition (Interface)

```typescript
// app/core/interfaces/IStoragePort.ts

/**
 * Storage Port - defines the contract for file storage
 * This interface is used by business logic, independent of implementation
 */
export interface IStoragePort {
  /**
   * Upload a file to storage
   * @param key - Unique identifier for the file
   * @param data - File data as Buffer or Stream
   * @param metadata - Optional metadata (content type, etc.)
   * @returns Promise<string> - URL or key of uploaded file
   */
  upload(
    key: string,
    data: Buffer | ReadableStream,
    metadata?: StorageMetadata
  ): Promise<string>;

  /**
   * Download a file from storage
   * @param key - File identifier
   * @returns Promise<Buffer> - File data
   */
  download(key: string): Promise<Buffer>;

  /**
   * Delete a file from storage
   * @param key - File identifier
   */
  delete(key: string): Promise<void>;

  /**
   * Generate a signed URL for temporary access
   * @param key - File identifier
   * @param expiresIn - Expiration time in seconds
   * @returns Promise<string> - Signed URL
   */
  getSignedUrl(key: string, expiresIn: number): Promise<string>;

  /**
   * Check if a file exists
   * @param key - File identifier
   * @returns Promise<boolean>
   */
  exists(key: string): Promise<boolean>;
}

export interface StorageMetadata {
  contentType?: string;
  contentLength?: number;
  cacheControl?: string;
  customMetadata?: Record<string, string>;
}
```

---

## Adapter Implementations

### AWS S3 Adapter

```typescript
// app/adapters/storage/S3Adapter.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { injectable } from 'tsyringe';
import { IStoragePort, StorageMetadata } from '@core/interfaces/IStoragePort';

@injectable()
export class S3Adapter implements IStoragePort {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.STORAGE_BUCKET!;
  }

  async upload(key: string, data: Buffer, metadata?: StorageMetadata): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: metadata?.contentType,
      Metadata: metadata?.customMetadata,
    });

    await this.client.send(command);
    return `s3://${this.bucket}/${key}`;
  }

  async download(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const response = await this.client.send(command);
    const stream = response.Body as ReadableStream;
    const chunks: Uint8Array[] = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.client.send(command);
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return await getSignedUrl(this.client, command, { expiresIn });
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.download(key);
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

### Cloudflare R2 Adapter

```typescript
// app/adapters/storage/R2Adapter.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { injectable } from 'tsyringe';
import { IStoragePort, StorageMetadata } from '@core/interfaces/IStoragePort';

@injectable()
export class R2Adapter implements IStoragePort {
  private client: S3Client;
  private bucket: string;

  constructor() {
    // R2 is S3-compatible
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
    });
    this.bucket = process.env.STORAGE_BUCKET!;
  }

  // Implementation is identical to S3Adapter because R2 is S3-compatible
  async upload(key: string, data: Buffer, metadata?: StorageMetadata): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: metadata?.contentType,
      Metadata: metadata?.customMetadata,
    });

    await this.client.send(command);
    return `r2://${this.bucket}/${key}`;
  }

  // ... same implementation as S3Adapter for other methods
}
```

### MinIO Adapter (Docker/Self-hosted)

```typescript
// app/adapters/storage/MinIOAdapter.ts

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { injectable } from 'tsyringe';
import { IStoragePort, StorageMetadata } from '@core/interfaces/IStoragePort';

@injectable()
export class MinIOAdapter implements IStoragePort {
  private client: S3Client;
  private bucket: string;

  constructor() {
    // MinIO is also S3-compatible
    this.client = new S3Client({
      region: 'us-east-1', // MinIO doesn't care about region
      endpoint: process.env.STORAGE_ENDPOINT || 'http://localhost:9000',
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.STORAGE_SECRET_KEY || 'minioadmin',
      },
      forcePathStyle: true, // Required for MinIO
    });
    this.bucket = process.env.STORAGE_BUCKET!;
  }

  // Implementation is identical to S3Adapter
  async upload(key: string, data: Buffer, metadata?: StorageMetadata): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: metadata?.contentType,
    });

    await this.client.send(command);
    return `minio://${this.bucket}/${key}`;
  }

  // ... same implementation
}
```

---

## Use Case Using the Port

```typescript
// app/core/usecases/invoice/ProcessInvoice.usecase.ts

import { injectable, inject } from 'tsyringe';
import { IStoragePort } from '@core/interfaces/IStoragePort';
import { IDatabasePort } from '@core/interfaces/IDatabasePort';
import { IQueuePort } from '@core/interfaces/IQueuePort';
import { IMessagingPort } from '@core/interfaces/IMessagingPort';
import { Invoice } from '@core/domain/entities/Invoice';

export interface ProcessInvoiceInput {
  userId: string;
  file: Buffer;
  fileName: string;
  contentType: string;
  source: 'whatsapp' | 'upload';
  phoneNumber?: string;
}

export interface ProcessInvoiceOutput {
  success: boolean;
  invoiceId?: string;
  message: string;
}

/**
 * Process Invoice Use Case
 *
 * This use case handles the complete invoice processing flow:
 * 1. Upload file to storage
 * 2. Save metadata to database
 * 3. Enqueue OCR job
 * 4. Send confirmation message
 *
 * NOTE: This code has ZERO knowledge of:
 * - Whether storage is S3, R2, or MinIO
 * - Whether database is Postgres or D1
 * - Whether queue is SQS or RabbitMQ
 * - Whether messaging is Kapso or Twilio
 *
 * It only knows the INTERFACES (contracts)
 */
@injectable()
export class ProcessInvoiceUseCase {
  constructor(
    @inject('StoragePort') private storage: IStoragePort,
    @inject('DatabasePort') private database: IDatabasePort,
    @inject('QueuePort') private queue: IQueuePort,
    @inject('MessagingPort') private messaging: IMessagingPort
  ) {}

  async execute(input: ProcessInvoiceInput): Promise<ProcessInvoiceOutput> {
    try {
      // 1. Generate unique key for file
      const timestamp = Date.now();
      const key = `invoices/${input.userId}/${timestamp}-${input.fileName}`;

      // 2. Upload file to storage (could be S3, R2, MinIO, etc.)
      await this.storage.upload(key, input.file, {
        contentType: input.contentType,
        customMetadata: {
          userId: input.userId,
          source: input.source,
        },
      });

      // 3. Create invoice record in database
      const invoice = await this.database.invoices.create({
        userId: input.userId,
        sourceFileKey: key,
        status: 'pending_ocr',
        source: input.source,
        uploadedAt: new Date(),
      });

      // 4. Enqueue OCR processing job
      await this.queue.enqueue('ocr-jobs', {
        invoiceId: invoice.id,
        fileKey: key,
        contentType: input.contentType,
      });

      // 5. Send confirmation message
      if (input.phoneNumber) {
        await this.messaging.send({
          to: input.phoneNumber,
          message: `✅ Invoice received! We're processing it now. You'll be notified when it's ready.`,
        });
      }

      return {
        success: true,
        invoiceId: invoice.id,
        message: 'Invoice uploaded and queued for processing',
      };
    } catch (error) {
      console.error('Error processing invoice:', error);

      // Send error notification
      if (input.phoneNumber) {
        await this.messaging.send({
          to: input.phoneNumber,
          message: `❌ Sorry, there was an error processing your invoice. Please try again.`,
        });
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
```

---

## Dependency Injection Container

```typescript
// app/shared/config/container.ts

import 'reflect-metadata';
import { container } from 'tsyringe';
import { IStoragePort } from '@core/interfaces/IStoragePort';
import { IDatabasePort } from '@core/interfaces/IDatabasePort';
import { IQueuePort } from '@core/interfaces/IQueuePort';
import { IMessagingPort } from '@core/interfaces/IMessagingPort';
import { loadConfig } from './env';

/**
 * Register adapters based on environment configuration
 * This is where we map interfaces to concrete implementations
 */
export async function registerAdapters() {
  const config = loadConfig();

  // Storage Adapter Registration
  switch (config.STORAGE_ADAPTER) {
    case 's3':
      const { S3Adapter } = await import('@adapters/storage/S3Adapter');
      container.register<IStoragePort>('StoragePort', { useClass: S3Adapter });
      console.log('📦 Registered S3 storage adapter');
      break;

    case 'r2':
      const { R2Adapter } = await import('@adapters/storage/R2Adapter');
      container.register<IStoragePort>('StoragePort', { useClass: R2Adapter });
      console.log('📦 Registered R2 storage adapter');
      break;

    case 'minio':
      const { MinIOAdapter } = await import('@adapters/storage/MinIOAdapter');
      container.register<IStoragePort>('StoragePort', { useClass: MinIOAdapter });
      console.log('📦 Registered MinIO storage adapter');
      break;

    case 'local':
      const { LocalStorageAdapter } = await import('@adapters/storage/LocalStorageAdapter');
      container.register<IStoragePort>('StoragePort', { useClass: LocalStorageAdapter });
      console.log('📦 Registered Local storage adapter');
      break;

    default:
      throw new Error(`Unknown storage adapter: ${config.STORAGE_ADAPTER}`);
  }

  // Database Adapter Registration
  switch (config.DATABASE_ADAPTER) {
    case 'postgres':
      const { PostgresAdapter } = await import('@adapters/database/PostgresAdapter');
      container.register<IDatabasePort>('DatabasePort', { useClass: PostgresAdapter });
      console.log('🗄️  Registered PostgreSQL adapter');
      break;

    case 'd1':
      const { D1Adapter } = await import('@adapters/database/D1Adapter');
      container.register<IDatabasePort>('DatabasePort', { useClass: D1Adapter });
      console.log('🗄️  Registered D1 adapter');
      break;

    case 'memory':
      const { InMemoryAdapter } = await import('@adapters/database/InMemoryAdapter');
      container.register<IDatabasePort>('DatabasePort', { useClass: InMemoryAdapter });
      console.log('🗄️  Registered In-Memory adapter (testing)');
      break;

    default:
      throw new Error(`Unknown database adapter: ${config.DATABASE_ADAPTER}`);
  }

  // Queue Adapter Registration
  switch (config.QUEUE_ADAPTER) {
    case 'sqs':
      const { SQSAdapter } = await import('@adapters/queue/SQSAdapter');
      container.register<IQueuePort>('QueuePort', { useClass: SQSAdapter });
      console.log('📨 Registered SQS queue adapter');
      break;

    case 'rabbitmq':
      const { RabbitMQAdapter } = await import('@adapters/queue/RabbitMQAdapter');
      container.register<IQueuePort>('QueuePort', { useClass: RabbitMQAdapter });
      console.log('📨 Registered RabbitMQ adapter');
      break;

    case 'cloudflare':
      const { CloudflareQueuesAdapter } = await import('@adapters/queue/CloudflareQueuesAdapter');
      container.register<IQueuePort>('QueuePort', { useClass: CloudflareQueuesAdapter });
      console.log('📨 Registered Cloudflare Queues adapter');
      break;

    case 'memory':
      const { InMemoryQueueAdapter } = await import('@adapters/queue/InMemoryQueueAdapter');
      container.register<IQueuePort>('QueuePort', { useClass: InMemoryQueueAdapter });
      console.log('📨 Registered In-Memory queue adapter (testing)');
      break;

    default:
      throw new Error(`Unknown queue adapter: ${config.QUEUE_ADAPTER}`);
  }

  // Messaging Adapter Registration
  switch (config.MESSAGING_ADAPTER) {
    case 'kapso':
      const { KapsoAdapter } = await import('@adapters/messaging/KapsoAdapter');
      container.register<IMessagingPort>('MessagingPort', { useClass: KapsoAdapter });
      console.log('💬 Registered Kapso messaging adapter');
      break;

    case 'twilio':
      const { TwilioAdapter } = await import('@adapters/messaging/TwilioAdapter');
      container.register<IMessagingPort>('MessagingPort', { useClass: TwilioAdapter });
      console.log('💬 Registered Twilio messaging adapter');
      break;

    default:
      throw new Error(`Unknown messaging adapter: ${config.MESSAGING_ADAPTER}`);
  }

  console.log('✅ All adapters registered successfully');
}

/**
 * Initialize the application container
 */
export async function initializeContainer() {
  await registerAdapters();
  return container;
}
```

---

## API Server Entry Point

```typescript
// app/api/rest/server.ts

import 'reflect-metadata';
import Fastify from 'fastify';
import { initializeContainer } from '@shared/config/container';
import { invoiceRoutes } from './routes/invoices.routes';
import { vendorRoutes } from './routes/vendors.routes';
import { analyticsRoutes } from './routes/analytics.routes';

async function startServer() {
  // 1. Initialize DI container and register adapters
  await initializeContainer();

  // 2. Create Fastify instance
  const app = Fastify({
    logger: true,
  });

  // 3. Register routes
  app.register(invoiceRoutes, { prefix: '/api/invoices' });
  app.register(vendorRoutes, { prefix: '/api/vendors' });
  app.register(analyticsRoutes, { prefix: '/api/analytics' });

  // 4. Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // 5. Start server
  const port = parseInt(process.env.API_PORT || '3000', 10);
  const host = process.env.API_HOST || '0.0.0.0';

  await app.listen({ port, host });
  console.log(`🚀 Server listening on http://${host}:${port}`);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

---

## Different Deployment Configurations

### For AWS Lambda

```typescript
// deployments/serverless/aws-lambda/handler.ts

import 'reflect-metadata';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { initializeContainer } from '@shared/config/container';
import { ProcessInvoiceUseCase } from '@core/usecases/invoice/ProcessInvoice.usecase';

// Initialize container once (outside handler for reuse across warm starts)
let containerInitialized = false;

export const processInvoice: APIGatewayProxyHandler = async (event) => {
  // Initialize container on cold start
  if (!containerInitialized) {
    await initializeContainer();
    containerInitialized = true;
  }

  // Resolve use case from container
  const { container } = await import('tsyringe');
  const useCase = container.resolve(ProcessInvoiceUseCase);

  // Parse input
  const input = JSON.parse(event.body || '{}');

  // Execute use case
  const result = await useCase.execute(input);

  return {
    statusCode: result.success ? 200 : 500,
    body: JSON.stringify(result),
  };
};
```

### For Cloudflare Workers

```typescript
// deployments/serverless/cloudflare-workers/index.ts

import 'reflect-metadata';
import { container } from 'tsyringe';
import { initializeContainer } from '@shared/config/container';
import { ProcessInvoiceUseCase } from '@core/usecases/invoice/ProcessInvoice.usecase';

// Cloudflare Workers don't have a separate initialization phase
// We need to be careful about global state

export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // Register adapters with Cloudflare-specific bindings
    // env.DB, env.BUCKET, env.QUEUE are provided by Cloudflare

    // Custom registration for Cloudflare
    container.register('DatabasePort', {
      useValue: new D1Adapter(env.DB),
    });
    container.register('StoragePort', {
      useValue: new R2Adapter(env.BUCKET),
    });
    container.register('QueuePort', {
      useValue: new CloudflareQueuesAdapter(env.QUEUE),
    });

    // Resolve use case
    const useCase = container.resolve(ProcessInvoiceUseCase);

    // Parse request
    const input = await request.json();

    // Execute
    const result = await useCase.execute(input);

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
```

### For Docker

```typescript
// Just run the regular server.ts file
// The environment variables determine which adapters to use

// .env for Docker deployment
DEPLOYMENT_TARGET=docker
STORAGE_ADAPTER=minio
DATABASE_ADAPTER=postgres
QUEUE_ADAPTER=rabbitmq
CACHE_ADAPTER=redis
```

---

## Summary: How It All Works Together

1. **Business Logic** (Use Cases) depends only on **Interfaces** (Ports)
2. **Adapters** implement the **Interfaces** for specific technologies
3. **DI Container** wires up Adapters based on **Environment Configuration**
4. **Different Deployments** use different Adapters but **same business logic**

### Example Flow:

```
User uploads invoice via WhatsApp
    ↓
Kapso sends webhook
    ↓
ProcessInvoiceUseCase.execute()
    ↓
Uses IStoragePort.upload() ← Could be S3, R2, or MinIO
    ↓
Uses IDatabasePort.create() ← Could be Postgres or D1
    ↓
Uses IQueuePort.enqueue() ← Could be SQS or RabbitMQ
    ↓
Uses IMessagingPort.send() ← Could be Kapso or Twilio
```

**The use case doesn't know or care which implementations are used!**

This is the power of hexagonal architecture. 🎯
