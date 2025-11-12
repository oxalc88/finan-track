# Phase 1: Project Foundation - Layered Functional Architecture

## Overview
Set up a pragmatic, functional codebase optimized for solo development. No classes, no over-abstraction, just clean TypeScript functions.

---

## Tasks Breakdown

### 1.1 Project Initialization

**Goal:** Bootstrap the project with proper tooling

**Commands:**
```bash
# Initialize project
npm init -y

# Install core dependencies
npm install fastify @fastify/multipart pg zod

# Install AWS SDK for S3-compatible storage
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Install queue libraries
npm install amqplib @aws-sdk/client-sqs

# Install dev dependencies
npm install -D typescript tsx @types/node @types/pg

# Install linting & formatting (Ultracite)
npx ultracite init  # This installs Ultracite automatically

# Install testing
npm install -D vitest @vitest/coverage-v8

# Install build tools
npm install -D esbuild
```

---

### 1.2 Directory Structure

**Create folders:**
```bash
mkdir -p app/{api/{routes,middleware},services,repositories,jobs,lib,types,utils,config,frontend}
mkdir -p infra/terraform/{modules,providers,environments}
mkdir -p deployments/{docker,aws,cloudflare}
mkdir -p migrations
mkdir -p scripts
mkdir -p tests/{unit,integration,e2e}
mkdir -p docs
```

**Result:**
```
finan-track/
├── app/
│   ├── api/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── server.ts
│   ├── services/
│   ├── repositories/
│   ├── jobs/
│   ├── lib/
│   ├── types/
│   ├── utils/
│   └── config/
├── infra/
├── deployments/
├── migrations/
├── scripts/
└── tests/
```

---

### 1.3 TypeScript Configuration

**Create `tsconfig.json`:**
```json
{
  "compilerOptions": {
    // Target & Module
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "node",

    // Emit
    "outDir": "./dist",
    "rootDir": "./",
    "declaration": true,
    "sourceMap": true,
    "removeComments": true,

    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,

    // Type Checking (Strict)
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,

    // Other
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    // Path Mapping (Clean Imports)
    "baseUrl": ".",
    "paths": {
      "@app/*": ["app/*"],
      "@api/*": ["app/api/*"],
      "@services/*": ["app/services/*"],
      "@repos/*": ["app/repositories/*"],
      "@lib/*": ["app/lib/*"],
      "@types/*": ["app/types/*"],
      "@utils/*": ["app/utils/*"],
      "@config/*": ["app/config/*"]
    }
  },
  "include": ["app/**/*", "tests/**/*", "scripts/**/*"],
  "exclude": ["node_modules", "dist", "app/frontend"]
}
```

**Why these settings?**
- `strict: true` - Catches bugs at compile time
- `noUnusedLocals` - Prevents dead code
- `noImplicitReturns` - Every code path must return
- Path aliases - Clean imports throughout the codebase

---

### 1.4 Ultracite Setup (Linting & Formatting)

**What is Ultracite?**
Ultracite is a **zero-configuration** linter and formatter built on Biome (Rust-based, super fast). It replaces both ESLint and Prettier with a single tool optimized for TypeScript and AI-assisted development.

**Why Ultracite?**
- ✅ **Zero configuration** - Works out of the box
- ✅ **Super fast** - 50-100x faster than ESLint (built in Rust)
- ✅ **One tool** - Replaces ESLint + Prettier
- ✅ **AI-optimized** - Works great with Claude Code, Copilot, Cursor
- ✅ **Complexity management built-in** - No manual rules needed
- ✅ **Format on save** - Never blocks your workflow

**Installation:**
```bash
npx ultracite init
```

This automatically:
- Installs Ultracite
- Creates `biome.jsonc` config
- Sets up VS Code integration
- Enables format-on-save

**What Ultracite Enforces (Automatically):**
- ✅ Code formatting (like Prettier)
- ✅ Type safety (strict TypeScript rules)
- ✅ Complexity limits (prevents complex code)
- ✅ Import organization (sorted, no unused)
- ✅ Accessibility (a11y rules for React)
- ✅ Best practices (TypeScript, React, Next.js)

**Example of what Ultracite catches:**

```typescript
// ❌ Ultracite error - Too complex, too nested
function processData(data: any) {
  if (data) {
    if (data.type === 'A') {
      if (data.valid) {
        if (data.amount > 0) {
          if (data.status === 'active') {
            // ... deeply nested logic
          }
        }
      }
    }
  }
}

// ✅ Ultracite approves - Simple, clear
function isValidData(data: Data): boolean {
  return (
    data !== null &&
    data.type === 'A' &&
    data.valid &&
    data.amount > 0 &&
    data.status === 'active'
  );
}

function processData(data: Data): void {
  if (!isValidData(data)) return;
  // Process valid data
}
```

**biome.jsonc** (created automatically):
```jsonc
{
  "$schema": "https://biomejs.dev/schemas/1.8.3/schema.json",
  "extends": ["ultracite"],

  // Optional: Customize if needed (but defaults are great!)
  "files": {
    "ignore": ["node_modules", "dist", "build", ".next"]
  }
}
```

**No other configuration needed!** Ultracite works perfectly out of the box.

See [docs/ULTRACITE_SETUP.md](./ULTRACITE_SETUP.md) for detailed guide.

---

### 1.5 Package.json Scripts

**Update `package.json`:**
```json
{
  "name": "finan-track",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch app/api/server.ts",
    "dev:worker": "tsx watch app/jobs/worker.ts",
    "dev:all": "docker-compose -f deployments/docker/docker-compose.yml up",

    "build": "tsc && esbuild app/api/server.ts --bundle --platform=node --outfile=dist/server.js",
    "build:worker": "esbuild app/jobs/worker.ts --bundle --platform=node --outfile=dist/worker.js",

    "start": "node dist/server.js",
    "start:worker": "node dist/worker.js",

    "format": "ultracite fix",
    "lint": "ultracite check",
    "typecheck": "tsc --noEmit",

    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",

    "migrate": "node scripts/migrate.js",
    "seed": "node scripts/seed.js",

    "docker:build": "docker build -f deployments/docker/Dockerfile -t finan-track .",
    "docker:up": "docker-compose -f deployments/docker/docker-compose.yml up",
    "docker:down": "docker-compose -f deployments/docker/docker-compose.yml down",

    "check": "npm run typecheck && npm run lint && npm run test"
  }
}
```

**Key scripts:**
- `npm run dev` - Start API in watch mode
- `npm run dev:all` - Start everything (DB, queue, API, worker) in Docker
- `npm run check` - Run all checks (typecheck + lint + test)
- `npm run format` - Format and auto-fix code with Ultracite
- `npm run lint` - Check code quality and complexity with Ultracite

---

### 1.7 Environment Configuration

**Create `.env.example`:**
```bash
# ============================================
# Application
# ============================================
NODE_ENV=development
PORT=3000
LOG_LEVEL=info

# ============================================
# Database
# ============================================
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invoices

# ============================================
# Storage (S3-compatible)
# ============================================
# Works with AWS S3, Cloudflare R2, MinIO
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_BUCKET=invoices
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin

# For AWS S3, use:
# STORAGE_ENDPOINT=https://s3.amazonaws.com
# STORAGE_REGION=us-east-1

# For Cloudflare R2, use:
# STORAGE_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
# STORAGE_REGION=auto

# ============================================
# Queue
# ============================================
QUEUE_TYPE=rabbitmq  # rabbitmq | sqs | memory
QUEUE_URL=amqp://guest:guest@localhost:5672

# For AWS SQS, use:
# QUEUE_TYPE=sqs
# QUEUE_URL=https://sqs.us-east-1.amazonaws.com/123456789/ocr-jobs

# ============================================
# Cache
# ============================================
CACHE_TYPE=redis  # redis | memory
REDIS_URL=redis://localhost:6379

# ============================================
# WhatsApp (Kapso)
# ============================================
KAPSO_API_KEY=your_api_key_here
KAPSO_WEBHOOK_SECRET=your_webhook_secret_here
KAPSO_API_URL=https://api.kapso.ai

# ============================================
# OCR
# ============================================
OCR_PROVIDER=tesseract  # tesseract | textract | cloudflare-ai
OCR_API_KEY=  # Only needed for textract/cloudflare-ai

# For AWS Textract:
# OCR_PROVIDER=textract
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
```

---

### 1.8 Docker Compose (Local Development)

**Create `deployments/docker/docker-compose.yml`:**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: finan-postgres
    environment:
      POSTGRES_DB: invoices
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../../migrations:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio:latest
    container_name: finan-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

  # RabbitMQ (Message Queue)
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: finan-rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 30s
      timeout: 10s
      retries: 5

  # Redis (Cache)
  redis:
    image: redis:7-alpine
    container_name: finan-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  minio_data:
  rabbitmq_data:
  redis_data:
```

**Usage:**
```bash
# Start all services
docker-compose -f deployments/docker/docker-compose.yml up -d

# View logs
docker-compose -f deployments/docker/docker-compose.yml logs -f

# Stop all services
docker-compose -f deployments/docker/docker-compose.yml down

# Stop and remove volumes (fresh start)
docker-compose -f deployments/docker/docker-compose.yml down -v
```

**Access:**
- PostgreSQL: `localhost:5432`
- MinIO Console: `http://localhost:9001` (user: minioadmin, pass: minioadmin)
- RabbitMQ Management: `http://localhost:15672` (user: guest, pass: guest)
- Redis: `localhost:6379`

---

### 1.9 Git Configuration

**Create `.gitignore`:**
```
# Dependencies
node_modules/

# Build output
dist/
build/
.output/

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
!.vscode/settings.json
.idea/
*.swp
*.swo
*~
.DS_Store

# Testing
coverage/

# Temporary
.temp/
tmp/

# Database
*.db
*.sqlite
*.sqlite3

# OS
Thumbs.db
```

**Create `.vscode/settings.json`** (Ultracite integration):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

**Note:** Install the Biome VS Code extension: `biomejs.biome`

---

### 1.10 Initial File Templates

**Create `app/config/env.ts`:**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  STORAGE_ENDPOINT: z.string(),
  STORAGE_BUCKET: z.string(),
  QUEUE_TYPE: z.enum(['sqs', 'rabbitmq', 'memory']),
  KAPSO_API_KEY: z.string(),
});

export type Env = z.infer<typeof envSchema>;

let config: Env | null = null;

export function loadConfig(): Env {
  if (config) return config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  config = result.data;
  console.info('✅ Configuration loaded');
  return config;
}

export function getConfig(): Env {
  if (!config) {
    throw new Error('Config not loaded. Call loadConfig() first.');
  }
  return config;
}
```

**Create `app/api/server.ts`:**
```typescript
import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { loadConfig } from '@config/env';
import { initDb } from '@repos/db';
import { initStorage } from '@lib/storage';

async function start(): Promise<void> {
  // Load configuration
  const config = loadConfig();

  // Initialize connections
  initDb();
  initStorage();

  // Create Fastify instance
  const app = Fastify({
    logger: {
      level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    },
  });

  // Register plugins
  await app.register(multipart);

  // Health check
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Start server
  const port = parseInt(config.PORT, 10);
  await app.listen({ port, host: '0.0.0.0' });

  console.info(`🚀 Server running on http://localhost:${port}`);
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
```

---

## Checkpoint: Phase 1 Complete

After Phase 1, you should be able to:

1. ✅ Run `npm install` successfully
2. ✅ Run `npx ultracite init` (sets up linting/formatting)
3. ✅ Run `npm run typecheck` with no errors
4. ✅ Run `npm run lint` with no errors
5. ✅ Start Docker services: `npm run dev:all`
6. ✅ Start API server: `npm run dev`
7. ✅ Access health check: `curl http://localhost:3000/health`
8. ✅ Code formats automatically on save in VS Code

---

## Complexity Management Examples

Ultracite automatically catches these issues:

```typescript
// ❌ Ultracite error - Too complex, too nested
function bad(x: number): number {
  if (x > 0) {
    if (x < 10) {
      if (x % 2 === 0) {
        if (x > 5) {
          // ...deeply nested logic
        }
      }
    }
  }
  return x;
}

// ✅ Ultracite approves - Simple, testable
function isEvenBetween5And10(x: number): boolean {
  return x > 5 && x < 10 && x % 2 === 0;
}

function good(x: number): number {
  if (!isEvenBetween5And10(x)) {
    return x;
  }
  // Process
  return x * 2;
}
```

**What Ultracite enforces:**
- Complexity limits (prevents deeply nested code)
- Type safety (no implicit any, explicit return types)
- Import organization (auto-sorted, no unused imports)
- Code formatting (consistent style)
- Accessibility (a11y rules for React)

All with **zero configuration**!

---

## Next Steps

**Phase 2:** Implement core libraries (storage, queue, database) and repositories.
