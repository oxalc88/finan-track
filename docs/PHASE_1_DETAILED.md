# Phase 1: Project Foundation - Cloud-Agnostic Architecture (Detailed Guide)

## Overview
Phase 1 sets up a **modular, cloud-agnostic foundation** using Hexagonal Architecture (Ports & Adapters pattern). The same business logic will run on AWS Lambda, Cloudflare Workers, Docker containers, or any other platform.

---

## 1.1 Project Structure Setup

### Goal
Create a clean separation between application code and infrastructure code, with a modular architecture that supports multiple deployment targets.

### Directory Structure

```
finan-track/
│
├── app/                                # APPLICATION CODE (cloud-agnostic)
│   │
│   ├── core/                          # Core Domain (business logic)
│   │   ├── domain/                    # Domain entities
│   │   │   ├── entities/
│   │   │   │   ├── Invoice.ts
│   │   │   │   ├── Vendor.ts
│   │   │   │   ├── Category.ts
│   │   │   │   ├── CreditCard.ts
│   │   │   │   └── Payment.ts
│   │   │   ├── value-objects/
│   │   │   │   ├── Money.ts
│   │   │   │   ├── DateRange.ts
│   │   │   │   └── CardCycle.ts
│   │   │   └── events/
│   │   │       ├── InvoiceCreated.ts
│   │   │       └── PaymentDue.ts
│   │   │
│   │   ├── usecases/                  # Business use cases
│   │   │   ├── invoice/
│   │   │   │   ├── ProcessInvoice.usecase.ts
│   │   │   │   ├── CreateInvoice.usecase.ts
│   │   │   │   ├── GetInvoices.usecase.ts
│   │   │   │   └── UpdateInvoice.usecase.ts
│   │   │   ├── analytics/
│   │   │   │   ├── GetSummary.usecase.ts
│   │   │   │   └── GetTrends.usecase.ts
│   │   │   └── card/
│   │   │       └── RecommendCard.usecase.ts
│   │   │
│   │   └── interfaces/                # Port definitions (contracts)
│   │       ├── IStoragePort.ts
│   │       ├── IDatabasePort.ts
│   │       ├── IQueuePort.ts
│   │       ├── IMessagingPort.ts
│   │       ├── IOCRPort.ts
│   │       ├── ICachePort.ts
│   │       └── ILoggerPort.ts
│   │
│   ├── adapters/                      # Adapter implementations
│   │   ├── storage/
│   │   │   ├── S3Adapter.ts           # AWS S3
│   │   │   ├── R2Adapter.ts           # Cloudflare R2
│   │   │   ├── MinIOAdapter.ts        # Self-hosted S3
│   │   │   └── LocalStorageAdapter.ts # Development
│   │   ├── database/
│   │   │   ├── PostgresAdapter.ts     # PostgreSQL
│   │   │   ├── D1Adapter.ts           # Cloudflare D1
│   │   │   └── InMemoryAdapter.ts     # Testing
│   │   ├── queue/
│   │   │   ├── SQSAdapter.ts          # AWS SQS
│   │   │   ├── CloudflareQueuesAdapter.ts
│   │   │   ├── RabbitMQAdapter.ts     # Docker/self-hosted
│   │   │   └── InMemoryQueueAdapter.ts
│   │   ├── messaging/
│   │   │   ├── KapsoAdapter.ts        # Kapso.ai
│   │   │   └── TwilioAdapter.ts       # Alternative
│   │   ├── ocr/
│   │   │   ├── TextractAdapter.ts     # AWS Textract
│   │   │   ├── CloudflareAIAdapter.ts
│   │   │   └── TesseractAdapter.ts    # Open source
│   │   └── cache/
│   │       ├── RedisAdapter.ts
│   │       ├── KVAdapter.ts           # Cloudflare KV
│   │       └── InMemoryAdapter.ts
│   │
│   ├── services/                      # Application services
│   │   ├── invoice/
│   │   │   └── InvoiceService.ts
│   │   ├── webhook/
│   │   │   └── WebhookService.ts
│   │   ├── analytics/
│   │   │   └── AnalyticsService.ts
│   │   └── notifications/
│   │       └── NotificationService.ts
│   │
│   ├── api/                           # API layer
│   │   ├── rest/
│   │   │   ├── routes/
│   │   │   │   ├── invoices.routes.ts
│   │   │   │   ├── vendors.routes.ts
│   │   │   │   ├── categories.routes.ts
│   │   │   │   ├── cards.routes.ts
│   │   │   │   ├── analytics.routes.ts
│   │   │   │   └── payments.routes.ts
│   │   │   ├── controllers/
│   │   │   │   ├── InvoiceController.ts
│   │   │   │   └── ...
│   │   │   └── server.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── logging.middleware.ts
│   │   └── validators/
│   │       └── schemas/
│   │           ├── invoice.schema.ts
│   │           └── ...
│   │
│   ├── frontend/                      # Web dashboard
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── lib/
│   │   │   └── styles/
│   │   ├── public/
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── shared/                        # Shared utilities
│       ├── types/
│       │   ├── dto/
│       │   └── common/
│       ├── utils/
│       │   ├── date.utils.ts
│       │   ├── money.utils.ts
│       │   └── validation.utils.ts
│       ├── config/
│       │   ├── container.ts           # DI container
│       │   ├── env.ts                 # Environment config
│       │   └── adapters.config.ts     # Adapter registration
│       └── constants/
│
├── infra/                             # INFRASTRUCTURE CODE
│   │
│   ├── terraform/
│   │   ├── modules/                   # Reusable Terraform modules
│   │   │   ├── database/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── outputs.tf
│   │   │   ├── storage/
│   │   │   ├── queue/
│   │   │   ├── compute/
│   │   │   └── networking/
│   │   │
│   │   ├── environments/              # Environment-specific configs
│   │   │   ├── dev/
│   │   │   │   ├── main.tf
│   │   │   │   ├── variables.tf
│   │   │   │   └── terraform.tfvars
│   │   │   ├── staging/
│   │   │   └── production/
│   │   │
│   │   └── providers/                 # Provider-specific configs
│   │       ├── aws/
│   │       │   ├── main.tf
│   │       │   ├── lambda.tf
│   │       │   ├── rds.tf
│   │       │   ├── s3.tf
│   │       │   └── sqs.tf
│   │       ├── cloudflare/
│   │       │   ├── main.tf
│   │       │   ├── workers.tf
│   │       │   ├── d1.tf
│   │       │   ├── r2.tf
│   │       │   └── queues.tf
│   │       └── hetzner/
│   │           ├── main.tf
│   │           └── server.tf
│   │
│   └── scripts/
│       ├── init-db.sh
│       ├── deploy.sh
│       └── rollback.sh
│
├── deployments/                       # DEPLOYMENT CONFIGURATIONS
│   │
│   ├── docker/
│   │   ├── api/
│   │   │   └── Dockerfile
│   │   ├── worker/
│   │   │   └── Dockerfile
│   │   ├── frontend/
│   │   │   └── Dockerfile
│   │   ├── docker-compose.yml         # Local development
│   │   ├── docker-compose.prod.yml    # Production
│   │   └── .dockerignore
│   │
│   ├── serverless/
│   │   ├── aws-lambda/
│   │   │   ├── serverless.yml
│   │   │   └── handler.ts
│   │   └── cloudflare-workers/
│   │       ├── wrangler.toml
│   │       └── index.ts
│   │
│   ├── kubernetes/
│   │   ├── base/
│   │   │   ├── api-deployment.yaml
│   │   │   ├── worker-deployment.yaml
│   │   │   ├── frontend-deployment.yaml
│   │   │   └── services.yaml
│   │   └── overlays/
│   │       ├── dev/
│   │       └── prod/
│   │
│   └── scripts/
│       ├── build-docker.sh
│       ├── deploy-lambda.sh
│       └── deploy-workers.sh
│
├── docs/                              # DOCUMENTATION
│   ├── architecture/
│   │   ├── hexagonal-architecture.md
│   │   ├── adapter-pattern.md
│   │   └── deployment-targets.md
│   ├── api/
│   │   └── openapi.yaml
│   └── deployment/
│       ├── docker-deployment.md
│       ├── aws-deployment.md
│       └── cloudflare-deployment.md
│
├── .github/
│   └── workflows/
│       ├── test.yml
│       ├── build.yml
│       ├── deploy-aws.yml
│       ├── deploy-cloudflare.yml
│       └── terraform.yml
│
├── migrations/                        # Database migrations
│   ├── 0001_initial_schema.sql
│   └── ...
│
├── package.json                       # Root package.json (workspaces)
├── pnpm-workspace.yaml               # Workspace configuration
├── tsconfig.json                      # Root TypeScript config
├── .eslintrc.js
├── .prettierrc.json
├── .gitignore
├── theme.config.json
├── .env.example
└── README.md
```

### Commands to Create Structure

```bash
# Application code
mkdir -p app/{core/{domain/{entities,value-objects,events},usecases/{invoice,analytics,card},interfaces},adapters/{storage,database,queue,messaging,ocr,cache},services/{invoice,webhook,analytics,notifications},api/{rest/{routes,controllers},middleware,validators/schemas},frontend/src/{components,pages,lib,styles},shared/{types/{dto,common},utils,config,constants}}

# Infrastructure code
mkdir -p infra/{terraform/{modules/{database,storage,queue,compute,networking},environments/{dev,staging,production},providers/{aws,cloudflare,hetzner}},scripts}

# Deployment configurations
mkdir -p deployments/{docker/{api,worker,frontend},serverless/{aws-lambda,cloudflare-workers},kubernetes/{base,overlays/{dev,prod}},scripts}

# Documentation
mkdir -p docs/{architecture,api,deployment}

# CI/CD
mkdir -p .github/workflows

# Migrations
mkdir -p migrations
```

---

## 1.2 TypeScript & Build Configuration

### Root `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "incremental": true,

    // Path aliases for clean imports
    "baseUrl": ".",
    "paths": {
      "@core/*": ["app/core/*"],
      "@adapters/*": ["app/adapters/*"],
      "@services/*": ["app/services/*"],
      "@api/*": ["app/api/*"],
      "@shared/*": ["app/shared/*"]
    },

    // Decorators for DI
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "exclude": ["node_modules", "dist", "build"]
}
```

### App-specific `tsconfig.json`

```json
// app/tsconfig.json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "."
  },
  "include": ["./**/*"],
  "references": [
    { "path": "./core" },
    { "path": "./adapters" },
    { "path": "./services" },
    { "path": "./api" }
  ]
}
```

### Build Configuration (esbuild)

```typescript
// build.config.ts
import { build } from 'esbuild';

const targets = {
  // For Node.js (AWS Lambda, Docker)
  node: {
    platform: 'node',
    target: 'node18',
    format: 'esm',
  },

  // For Edge Runtime (Cloudflare Workers)
  edge: {
    platform: 'browser',
    target: 'es2022',
    format: 'esm',
  },
};

// Build for specific target
const target = process.env.BUILD_TARGET || 'node';

build({
  entryPoints: ['app/api/rest/server.ts'],
  bundle: true,
  outfile: `dist/${target}/server.js`,
  ...targets[target],
  external: target === 'node' ? ['pg', 'aws-sdk'] : [],
});
```

---

## 1.3 Dependency Injection & Configuration

### Why DI?

Dependency Injection allows us to swap adapters at runtime without changing business logic:

```typescript
// Business logic doesn't know if it's using S3, R2, or MinIO
class ProcessInvoiceUseCase {
  constructor(
    @inject('StoragePort') private storage: IStoragePort,
    @inject('DatabasePort') private db: IDatabasePort,
    @inject('QueuePort') private queue: IQueuePort
  ) {}

  async execute(file: File) {
    // This code works with ANY adapter implementation
    const key = await this.storage.upload(file);
    await this.queue.enqueue({ key, action: 'ocr' });
    return { success: true };
  }
}
```

### DI Container Setup

```typescript
// app/shared/config/container.ts
import 'reflect-metadata';
import { container } from 'tsyringe';
import { loadConfig } from './env';

// Load configuration
const config = loadConfig();

// Register adapters based on environment
export function registerAdapters() {
  // Storage adapter
  switch (config.storageAdapter) {
    case 's3':
      const { S3Adapter } = await import('@adapters/storage/S3Adapter');
      container.register('StoragePort', { useClass: S3Adapter });
      break;
    case 'r2':
      const { R2Adapter } = await import('@adapters/storage/R2Adapter');
      container.register('StoragePort', { useClass: R2Adapter });
      break;
    case 'minio':
      const { MinIOAdapter } = await import('@adapters/storage/MinIOAdapter');
      container.register('StoragePort', { useClass: MinIOAdapter });
      break;
  }

  // Database adapter
  switch (config.databaseAdapter) {
    case 'postgres':
      const { PostgresAdapter } = await import('@adapters/database/PostgresAdapter');
      container.register('DatabasePort', { useClass: PostgresAdapter });
      break;
    case 'd1':
      const { D1Adapter } = await import('@adapters/database/D1Adapter');
      container.register('DatabasePort', { useClass: D1Adapter });
      break;
  }

  // Queue adapter
  switch (config.queueAdapter) {
    case 'sqs':
      const { SQSAdapter } = await import('@adapters/queue/SQSAdapter');
      container.register('QueuePort', { useClass: SQSAdapter });
      break;
    case 'rabbitmq':
      const { RabbitMQAdapter } = await import('@adapters/queue/RabbitMQAdapter');
      container.register('QueuePort', { useClass: RabbitMQAdapter });
      break;
  }

  // ... register all other adapters
}
```

### Environment Configuration

```typescript
// app/shared/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DEPLOYMENT_TARGET: z.enum(['aws', 'cloudflare', 'docker']),

  // Adapter selection
  STORAGE_ADAPTER: z.enum(['s3', 'r2', 'minio', 'local']),
  DATABASE_ADAPTER: z.enum(['postgres', 'd1', 'memory']),
  QUEUE_ADAPTER: z.enum(['sqs', 'cloudflare', 'rabbitmq', 'memory']),
  CACHE_ADAPTER: z.enum(['redis', 'kv', 'memory']),
  OCR_ADAPTER: z.enum(['textract', 'cloudflare-ai', 'tesseract']),
  MESSAGING_ADAPTER: z.enum(['kapso', 'twilio']),

  // Database
  DATABASE_URL: z.string().url().optional(),

  // Storage
  STORAGE_ENDPOINT: z.string().url().optional(),
  STORAGE_BUCKET: z.string(),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),

  // Queue
  QUEUE_URL: z.string().optional(),

  // Messaging
  KAPSO_API_KEY: z.string(),
  KAPSO_WEBHOOK_SECRET: z.string(),

  // Cache
  CACHE_URL: z.string().optional(),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(): AppConfig {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment configuration:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}
```

### `.env.example`

```bash
# Runtime Configuration
NODE_ENV=development
DEPLOYMENT_TARGET=docker

# Adapter Selection
STORAGE_ADAPTER=minio
DATABASE_ADAPTER=postgres
QUEUE_ADAPTER=rabbitmq
CACHE_ADAPTER=redis
OCR_ADAPTER=tesseract
MESSAGING_ADAPTER=kapso

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/invoices

# Storage (MinIO for local development)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=invoices
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin

# Queue (RabbitMQ for local development)
QUEUE_URL=amqp://localhost:5672

# Cache (Redis for local development)
CACHE_URL=redis://localhost:6379

# Messaging (Kapso)
KAPSO_API_KEY=sk_test_...
KAPSO_WEBHOOK_SECRET=whsec_...

# OCR (Tesseract for local development)
TESSERACT_PATH=/usr/bin/tesseract

# API
API_PORT=3000
API_HOST=0.0.0.0
```

---

## 1.4 Tailwind & Theme System

### Frontend `tailwind.config.js`

```javascript
const fs = require('fs');
const path = require('path');

// Load theme configuration
const themeConfig = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../theme.config.json'), 'utf-8')
);

module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
  theme: {
    extend: {
      colors: themeConfig.colors,
      fontFamily: themeConfig.typography?.fontFamily || {},
      borderRadius: themeConfig.borderRadius || {},
    },
  },
  plugins: [],
};
```

---

## 1.5 Development Environment

### Docker Compose for Local Development

```yaml
# deployments/docker/docker-compose.yml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: invoices
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../../migrations:/docker-entrypoint-initdb.d

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  # RabbitMQ (Message queue)
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: dev
      RABBITMQ_DEFAULT_PASS: dev123

  # Redis (Cache)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # API Service
  api:
    build:
      context: ../..
      dockerfile: deployments/docker/api/Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DEPLOYMENT_TARGET: docker
      DATABASE_URL: postgresql://dev:dev123@postgres:5432/invoices
      STORAGE_ENDPOINT: http://minio:9000
      QUEUE_URL: amqp://dev:dev123@rabbitmq:5672
      CACHE_URL: redis://redis:6379
    depends_on:
      - postgres
      - minio
      - rabbitmq
      - redis
    volumes:
      - ../../app:/app/app:ro
      - /app/node_modules

  # Worker Service (OCR processing)
  worker:
    build:
      context: ../..
      dockerfile: deployments/docker/worker/Dockerfile
    environment:
      NODE_ENV: development
      DEPLOYMENT_TARGET: docker
      DATABASE_URL: postgresql://dev:dev123@postgres:5432/invoices
      STORAGE_ENDPOINT: http://minio:9000
      QUEUE_URL: amqp://dev:dev123@rabbitmq:5672
    depends_on:
      - postgres
      - minio
      - rabbitmq
    volumes:
      - ../../app:/app/app:ro

  # Frontend
  frontend:
    build:
      context: ../..
      dockerfile: deployments/docker/frontend/Dockerfile
      target: development
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3000
    volumes:
      - ../../app/frontend:/app:ro
      - /app/node_modules

volumes:
  postgres_data:
  minio_data:
  redis_data:
```

### Root `package.json` with Workspaces

```json
{
  "name": "finan-track",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "app/core",
    "app/adapters",
    "app/services",
    "app/api",
    "app/frontend",
    "app/shared"
  ],
  "scripts": {
    "dev": "docker-compose -f deployments/docker/docker-compose.yml up",
    "dev:api": "tsx watch app/api/rest/server.ts",
    "dev:worker": "tsx watch app/services/worker/index.ts",
    "dev:frontend": "cd app/frontend && vite",

    "build": "pnpm -r build",
    "build:api": "esbuild app/api/rest/server.ts --bundle --platform=node --outfile=dist/api.js",
    "build:worker": "esbuild app/services/worker/index.ts --bundle --platform=node --outfile=dist/worker.js",
    "build:frontend": "cd app/frontend && vite build",

    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",

    "lint": "eslint app --ext .ts,.tsx",
    "format": "prettier --write \"app/**/*.{ts,tsx,json,md}\"",
    "typecheck": "tsc --noEmit",

    "deploy:docker": "docker-compose -f deployments/docker/docker-compose.prod.yml up -d",
    "deploy:aws": "sh deployments/scripts/deploy-lambda.sh",
    "deploy:cloudflare": "sh deployments/scripts/deploy-workers.sh",

    "tf:init": "cd infra/terraform && terraform init",
    "tf:plan": "cd infra/terraform && terraform plan",
    "tf:apply": "cd infra/terraform && terraform apply"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "esbuild": "^0.19.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "dependencies": {
    "reflect-metadata": "^0.2.0",
    "tsyringe": "^4.8.0",
    "zod": "^3.22.0"
  }
}
```

---

## Checkpoint: Phase 1 Complete

After completing Phase 1, you should be able to:

1. ✅ **Project structure** exists with proper separation
2. ✅ **Run `pnpm install`** successfully
3. ✅ **TypeScript compiles** without errors (`pnpm typecheck`)
4. ✅ **Linting passes** (`pnpm lint`)
5. ✅ **Docker Compose starts** all services (`pnpm dev`)
6. ✅ **Environment configuration** validates correctly
7. ✅ **DI container** initializes and registers adapters
8. ✅ **Theme system** loads configuration

---

## Summary

Phase 1 establishes:

- **Clean architecture** with clear boundaries
- **Cloud-agnostic design** that works anywhere
- **Flexible deployment** (Docker, Lambda, Workers)
- **Infrastructure separation** (app vs infra)
- **Type safety** with TypeScript
- **Configuration management** with environment variables
- **Dependency injection** for adapter swapping
- **Local development** environment with Docker Compose

**Next**: Phase 2 will implement the core domain logic and port definitions, which will be completely independent of any specific cloud provider!
