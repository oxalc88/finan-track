# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**finan-track** is a cloud-agnostic invoice processing and financial tracking application with WhatsApp integration via Kapso.ai. The architecture follows a **layered functional style** optimized for solo development—no classes, no over-abstraction, just clean TypeScript functions.

### Key Principles
- **Cloud-agnostic**: Same code runs on AWS, Cloudflare, Docker, or any platform
- **Layered architecture**: Simple functional layers (routes → services → repositories → libraries)
- **Configuration-driven**: Switch providers (S3/R2/MinIO, SQS/RabbitMQ) via environment variables
- **Pragmatic over dogmatic**: Use the simplest solution that works

## Architecture

### Layered Functional Structure

```
Routes (HTTP) → Services (Business Logic) → Repositories (Data) → Libraries (External Services)
```

**Key architectural files to read**:
- `docs/architecture/LAYERED_ARCHITECTURE.md` - Main architecture overview (START HERE)
- `docs/architecture/ARCHITECTURE_COMPARISON.md` - Why we chose this architecture
- `docs/architecture/APP_INFRA_SEPARATION.md` - Application vs infrastructure separation

### Directory Structure

```
backend/
├── api/                    # HTTP routes and middleware (Fastify)
├── services/               # Business logic (pure functions)
├── repositories/           # Data access layer (PostgreSQL)
├── migrations/             # Database migrations
├── lib/                    # External service clients (cloud-agnostic)
│   ├── storage.ts         # S3/R2/MinIO client
│   ├── queue.ts           # SQS/RabbitMQ client
│   ├── whatsapp.ts        # Kapso.ai client
│   └── ocr.ts             # OCR service client
├── types/                  # TypeScript types
├── utils/                  # Helper functions
└── config/                 # Configuration management (Zod schemas)

frontend/                   # Dashboard UI (React + Vite + Tailwind)
├── src/                    # React components and pages
├── tests/                  # Playwright tests
└── screenshots/            # Dashboard screenshots

docs/                       # Documentation
├── architecture/           # System design docs
├── deployment/             # Deployment guides
└── guides/                 # Integration guides

scripts/                    # Utility scripts
```

### Technology Stack

- **API**: Fastify
- **Database**: PostgreSQL (cloud-agnostic, works anywhere)
- **Storage**: S3-compatible (AWS S3, Cloudflare R2, MinIO)
- **Queue**: SQS, RabbitMQ, or Cloudflare Queues
- **Cache**: Redis or memory
- **WhatsApp**: Kapso.ai integration
- **Frontend**: React + Vite + Tailwind CSS + Tan Stack Query
- **Language**: TypeScript (functional style, no classes)

## Development Commands

### Local Development

```bash
# Start all services (PostgreSQL, MinIO, RabbitMQ, Redis) in Docker
npm run dev:all

# Start API server with hot reload
npm run dev

# Start background worker
npm run dev:worker

# Start frontend (in app/frontend/)
cd app/frontend && npm run dev
```

### Code Quality

```bash
# Format and auto-fix with Ultracite (replaces ESLint + Prettier)
npm run format

# Check code quality and complexity
npm run lint

# TypeScript type checking
npm run typecheck

# Run all checks (typecheck + lint + test)
npm run check
```

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm run start

# Start production worker
npm run start:worker
```

### Database

```bash
# Run database migrations
npm run migrate

# Seed database with test data
npm run seed
```

### Docker

```bash
# Start all local services
npm run docker:up

# Stop all services
npm run docker:down

# Build Docker image
npm run docker:build
```

## Code Patterns

### Functional Style - No Classes

All code uses **pure functions** instead of classes. This makes the codebase simpler, more testable, and easier to understand.

#### Configuration (app/config/env.ts)

- Use **Zod** for environment variable validation
- Export `loadConfig()` to initialize and `getConfig()` to access
- Fail fast with descriptive errors if config is invalid

#### Libraries (app/lib/*.ts)

- Use **singleton pattern** with module-level variables (e.g., `let s3Client: S3Client`)
- Provide `init*()` function to initialize and `get*()` function to access
- Support multiple providers via configuration (e.g., `QUEUE_TYPE=sqs|rabbitmq|memory`)

**Example structure**:
```typescript
let client: Client;

export function initClient(): Client {
  if (client) return client;
  // Initialize client
  return client;
}

function getClient(): Client {
  if (!client) initClient();
  return client;
}

export async function doSomething(): Promise<Result> {
  const c = getClient();
  // Use client
}
```

#### Repositories (app/repositories/*.ts)

- Use **named functions** for data access (no classes)
- Import `query`, `queryOne`, `transaction` from `./db.ts`
- Return domain types (from `app/types/`)
- Keep SQL queries clean and well-formatted

**Naming convention**:
- `createX(data)` - Insert new record
- `getXById(id)` - Get by ID
- `listXs(filters)` - List with filters
- `updateX(id, data)` - Update record
- `deleteX(id)` - Delete record (prefer soft delete)

#### Services (app/services/*.ts)

- Contains **business logic** (orchestrates repositories and libraries)
- Pure functions that accept data and return results
- Handle errors gracefully (try/catch with meaningful messages)
- No direct database access—use repositories

**Example structure**:
```typescript
import * as repo from '../repositories/some-repo';
import * as lib from '../lib/some-lib';

export async function doBusinessLogic(input: Input): Promise<Output> {
  // 1. Validate input
  // 2. Call repositories and libraries
  // 3. Apply business rules
  // 4. Return result
}
```

#### Routes (app/api/routes/*.ts)

- Use **Fastify route handlers**
- Keep routes thin—delegate to services
- Use Zod for request validation
- Return structured JSON responses

**Example structure**:
```typescript
import { FastifyInstance } from 'fastify';
import * as service from '../../services/some-service';

export async function routes(app: FastifyInstance) {
  app.get('/:id', async (request, reply) => {
    const { id } = request.params;
    const result = await service.get(id);
    return result;
  });
}
```

### Cloud-Agnostic Libraries

The `app/lib/` directory contains **cloud-agnostic clients** that work with multiple providers by checking environment variables.

**Example: Storage** (`app/lib/storage.ts`)
- Uses AWS SDK S3 client
- Works with AWS S3, Cloudflare R2, MinIO
- Configured via `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, etc.

**Example: Queue** (`app/lib/queue.ts`)
- Supports SQS, RabbitMQ, in-memory queue
- Provider determined by `QUEUE_TYPE` env var
- Exposes unified API: `enqueue()`, `dequeue()`, `consume()`

**Example: Database** (`app/repositories/db.ts`)
- Uses PostgreSQL client (pg)
- Works with AWS RDS, Neon, local PostgreSQL
- Configured via `DATABASE_URL`

### No Dependency Injection Container

This project uses **simple imports** instead of a DI container. Functions are imported directly where needed.

```typescript
// ✅ Good - Direct imports
import * as storage from '../lib/storage';
import * as queue from '../lib/queue';

export async function processFile() {
  await storage.uploadFile('key', buffer);
  await queue.enqueue('jobs', { id: 123 });
}
```

```typescript
// ❌ Avoid - DI container
const container = new Container();
container.bind('storage').to(StorageService);
// ... unnecessary complexity
```

### Error Handling

- Use **try/catch** in services and routes
- Return structured errors: `{ success: boolean, error?: string }`
- Log errors with context using the logger
- Never silently swallow exceptions

## Testing Approach

- Write **unit tests** for services and utils (pure functions are easy to test)
- Write **integration tests** for repositories (use test database)
- Mock libraries in tests (e.g., mock `storage.uploadFile()`)
- Use Vitest for testing (fast, modern, TypeScript-first)

## Linting and Formatting

This project uses **Ultracite** (not ESLint + Prettier).

### What is Ultracite?
- **Zero-configuration** linter and formatter built on Biome (Rust-based)
- Replaces ESLint + Prettier with a single tool
- 50-100x faster than ESLint
- Enforces complexity limits, type safety, import organization automatically

### Key Commands
```bash
# Format and auto-fix all issues
npm run format

# Check for issues (no auto-fix)
npm run lint
```

### What Ultracite Enforces
- Complexity limits (prevents deeply nested code)
- Type safety (no implicit any, explicit return types)
- Import organization (auto-sorted, no unused)
- Code formatting (consistent style)
- Accessibility (a11y rules for React)

**Important**: When making changes, run `npm run check` before committing. This runs typecheck + lint + tests.

## Theme Customization

The frontend uses a **configurable theme system** powered by Tailwind CSS. Colors can be customized by editing `theme.config.json`.

### Color Families
- `primary` - Main brand color
- `secondary` - Secondary UI elements
- `accent` - Accent highlights
- `success`, `warning`, `error` - State colors
- `neutral` - Text and neutral elements

### Applying Changes
After modifying `theme.config.json`, rebuild the frontend:
```bash
cd app/frontend && npm run build
```

## Environment Variables

All configuration is done via environment variables. See `.env.example` for all available options.

### Key Variables

**Database**:
- `DATABASE_URL` - PostgreSQL connection string

**Storage** (S3-compatible):
- `STORAGE_ENDPOINT` - S3 endpoint (e.g., `http://localhost:9000` for MinIO)
- `STORAGE_BUCKET` - Bucket name
- `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY` - Credentials

**Queue**:
- `QUEUE_TYPE` - `sqs`, `rabbitmq`, or `memory`
- `QUEUE_URL` - Queue connection string

**WhatsApp**:
- `KAPSO_API_KEY` - Kapso.ai API key
- `KAPSO_WEBHOOK_SECRET` - Webhook secret

**OCR**:
- `OCR_PROVIDER` - `tesseract`, `textract`, or `cloudflare-ai`

### Switching Providers

To switch from local MinIO to AWS S3, just update env vars:
```bash
# Local (MinIO)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=invoices

# Production (AWS S3)
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_BUCKET=my-prod-bucket
```

**No code changes needed!** The application is fully cloud-agnostic.

## Working with the Codebase

### Before Starting a Feature
1. Read `LAYERED_ARCHITECTURE.md` to understand the structure
2. Find similar features in the codebase (e.g., study existing services/repositories)
3. Follow the same patterns and conventions

### When Writing Code
- Keep functions **small and focused** (single responsibility)
- Use **TypeScript types** everywhere (no `any`)
- Write **descriptive function and variable names**
- Add **JSDoc comments** for public functions
- Prefer **early returns** over nested conditionals

### When Adding Dependencies
- Check if a simpler solution exists first
- Prefer **lightweight, focused libraries** over heavy frameworks
- Document why the dependency is needed

### When Stuck
Follow the "3 attempts rule":
1. Try to implement the feature
2. If blocked, research 2-3 alternative approaches
3. Try the most promising approach
4. If still stuck, document the issue and ask for help

Never make more than 3 attempts without stopping to reassess.

## Infrastructure vs Application

This repository separates **application code** (`app/`) from **infrastructure** (`infra/`).

- **Application** = Cloud-agnostic code (same code runs anywhere)
- **Infrastructure** = Terraform provisions resources (DB, storage, queues)
- **Bridge** = Environment variables (infra outputs → app inputs)

### Current Phase
**Phase 1**: Building the application locally using Docker Compose

**Phase 2** (later): Set up cloud infrastructure with Terraform

See `docs/APP_INFRA_SEPARATION.md` for details.

## Important Reminders

### DO
- ✅ Use functions, not classes
- ✅ Keep it simple and pragmatic
- ✅ Follow existing patterns in the codebase
- ✅ Write tests for new features
- ✅ Run `npm run check` before committing
- ✅ Use early returns to reduce nesting
- ✅ Make libraries cloud-agnostic via configuration

### DON'T
- ❌ Don't create classes (use functions)
- ❌ Don't over-abstract (keep it simple)
- ❌ Don't add DI containers (use direct imports)
- ❌ Don't hardcode provider-specific logic (use env vars)
- ❌ Don't bypass `npm run check` (it catches bugs)
- ❌ Don't nest code deeply (Ultracite will complain)

## Quick Reference

### File Locations
- Configuration: `backend/config/env.ts`
- Database connection: `backend/repositories/db.ts`
- Cloud-agnostic libraries: `backend/lib/*.ts`
- Business logic: `backend/services/*.ts`
- Data access: `backend/repositories/*.ts`
- HTTP routes: `backend/api/routes/*.ts`
- Types: `backend/types/*.ts`
- Frontend: `frontend/src/`

### Common Tasks
- Add new route: Create file in `backend/api/routes/`, register in `backend/api/server.ts`
- Add new service: Create file in `backend/services/`, import in routes
- Add new repository: Create file in `backend/repositories/`, import in services
- Add new type: Create file in `backend/types/`, export from `backend/types/index.ts`
- Add migration: Create `.sql` file in `backend/migrations/`
- Add frontend component: Create file in `frontend/src/components/`

### Documentation
- All docs: `docs/README.md` (index with navigation)
- Architecture: `docs/architecture/LAYERED_ARCHITECTURE.md`
- Architecture comparison: `docs/architecture/ARCHITECTURE_COMPARISON.md`
- App/infra separation: `docs/architecture/APP_INFRA_SEPARATION.md`
- Deployment guides: `docs/deployment/`
- Integration guides: `docs/guides/`
