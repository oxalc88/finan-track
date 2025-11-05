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

# Install linting & formatting
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D eslint-plugin-complexity

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

### 1.4 ESLint Configuration (Complexity Management)

**Create `.eslintrc.js`:**
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // Prettier
    'prettier/prettier': 'error',

    // Complexity Management
    'complexity': ['error', 10], // Max cyclomatic complexity
    'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-depth': ['error', 4], // Max nesting depth
    'max-params': ['error', 4], // Max function parameters
    'max-nested-callbacks': ['error', 3],

    // Code Quality
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',
    'no-duplicate-imports': 'error',

    // TypeScript Specific
    '@typescript-eslint/explicit-function-return-type': ['error', {
      allowExpressions: true,
      allowTypedFunctionExpressions: true,
    }],
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/no-floating-promises': 'error',

    // Prevent Complex Code
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/prefer-reduce-type-parameter': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
  },
  ignorePatterns: ['dist', 'node_modules', 'app/frontend'],
};
```

**What these rules enforce:**
- **Max complexity: 10** - Forces you to break down complex functions
- **Max 50 lines per function** - Keeps functions small and focused
- **Max 4 parameters** - Encourages using objects for complex inputs
- **Max nesting depth: 4** - Prevents deeply nested if/loops
- **Explicit return types** - Makes code self-documenting
- **No unused variables** - Keeps code clean

**Example of what gets flagged:**

```typescript
// ❌ BAD - Too complex (complexity > 10)
function processData(data: any) {
  if (data) {
    if (data.type === 'A') {
      if (data.valid) {
        if (data.amount > 0) {
          if (data.status === 'active') {
            // ... lots of nested logic
          }
        }
      }
    }
  }
}

// ✅ GOOD - Simple, single responsibility
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
  if (!isValidData(data)) {
    return;
  }

  // Process valid data
}
```

---

### 1.5 Prettier Configuration

**Create `.prettierrc.json`:**
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

---

### 1.6 Package.json Scripts

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

    "lint": "eslint app --ext .ts",
    "lint:fix": "eslint app --ext .ts --fix",
    "format": "prettier --write \"app/**/*.ts\"",
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
- `npm run check` - Run all checks before committing
- `npm run lint` - Check code quality and complexity

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

**Create `.vscode/settings.json`** (recommended):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

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
2. ✅ Run `npm run typecheck` with no errors
3. ✅ Run `npm run lint` with no errors
4. ✅ Start Docker services: `npm run dev:all`
5. ✅ Start API server: `npm run dev`
6. ✅ Access health check: `curl http://localhost:3000/health`

---

## Complexity Management Examples

The ESLint rules will catch:

```typescript
// ❌ Function too complex (complexity > 10)
function bad(x: number): number {
  if (x > 0) {
    if (x < 10) {
      if (x % 2 === 0) {
        if (x > 5) {
          // ...more nesting
        }
      }
    }
  }
  return x;
}

// ✅ Simple, testable
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

---

## Next Steps

**Phase 2:** Implement core libraries (storage, queue, database) and repositories.
