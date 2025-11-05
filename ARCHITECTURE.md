# Invoice Processing App - Cloud-Agnostic Architecture

## Overview
This document outlines the restructured, cloud-agnostic implementation plan using modular architecture with the Hexagonal (Ports & Adapters) pattern. The application can run on AWS Lambda, Cloudflare Workers, Docker containers, or any other platform.

---

## Project Structure

```
finan-track/
├── app/                          # Application code (cloud-agnostic)
│   ├── core/                     # Core business logic
│   │   ├── domain/              # Domain models and entities
│   │   ├── usecases/            # Business use cases
│   │   └── interfaces/          # Port definitions (contracts)
│   ├── adapters/                # Adapter implementations
│   │   ├── storage/             # Storage adapters (S3, R2, MinIO)
│   │   ├── database/            # Database adapters (Postgres, D1, MySQL)
│   │   ├── queue/               # Queue adapters (SQS, Cloudflare Queues, RabbitMQ)
│   │   ├── messaging/           # WhatsApp adapters (Kapso)
│   │   └── ocr/                 # OCR service adapters
│   ├── services/                # Application services
│   │   ├── invoice/             # Invoice processing service
│   │   ├── webhook/             # Webhook handler service
│   │   ├── analytics/           # Analytics service
│   │   └── notifications/       # Notification service
│   ├── api/                     # API layer
│   │   ├── rest/                # REST API handlers
│   │   ├── middleware/          # API middleware
│   │   └── validators/          # Request/response validation
│   ├── frontend/                # Web dashboard
│   │   ├── src/
│   │   └── public/
│   └── shared/                  # Shared utilities
│       ├── types/
│       ├── utils/
│       └── config/
│
├── infra/                       # Infrastructure as Code
│   ├── terraform/               # Terraform modules
│   │   ├── modules/
│   │   │   ├── database/
│   │   │   ├── storage/
│   │   │   ├── queue/
│   │   │   ├── compute/
│   │   │   └── networking/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   └── providers/
│   │       ├── aws/
│   │       ├── cloudflare/
│   │       └── hetzner/
│   └── scripts/                 # Helper scripts
│
├── deployments/                 # Deployment configurations
│   ├── docker/
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.worker
│   │   ├── docker-compose.yml
│   │   └── docker-compose.prod.yml
│   ├── kubernetes/
│   │   ├── base/
│   │   └── overlays/
│   ├── serverless/
│   │   ├── aws-lambda/
│   │   │   └── serverless.yml
│   │   └── cloudflare-workers/
│   │       └── wrangler.toml
│   └── scripts/
│
├── docs/                        # Documentation
│   ├── architecture/
│   ├── api/
│   └── deployment/
│
├── .github/                     # CI/CD
│   └── workflows/
│
├── theme.config.json            # Theme configuration
├── package.json
├── tsconfig.json
└── README.md
```

---

## Architecture Principles

### 1. Hexagonal Architecture (Ports & Adapters)

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│                   (REST, GraphQL, etc.)                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Application Services                      │
│            (Invoice, Webhook, Analytics, etc.)               │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                      Core Domain                             │
│        (Business Logic, Use Cases, Domain Models)            │
│                                                               │
│  Ports (Interfaces):                                         │
│  - IStoragePort                                              │
│  - IDatabasePort                                             │
│  - IQueuePort                                                │
│  - IMessagingPort                                            │
│  - IOCRPort                                                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                       Adapters                               │
│                                                               │
│  Storage:    │  Database:  │  Queue:      │  Messaging:     │
│  - S3        │  - Postgres │  - SQS       │  - Kapso        │
│  - R2        │  - D1       │  - RabbitMQ  │  - Twilio       │
│  - MinIO     │  - MySQL    │  - Queues    │                 │
└───────────────────────────────────────────────────────────────┘
```

### 2. Cloud-Agnostic Design

**Same code, different adapters:**
- Business logic doesn't know about AWS, Cloudflare, or Hetzner
- Runtime configuration determines which adapters to use
- Easy to test with mock adapters
- Can migrate between clouds with minimal code changes

### 3. Deployment Flexibility

**Can deploy as:**
- **AWS Lambda**: Serverless functions with API Gateway
- **Cloudflare Workers**: Edge computing with Workers
- **Docker Containers**: On Hetzner, DigitalOcean, or any VPS
- **Kubernetes**: Full orchestration on any cloud
- **Hybrid**: Mix and match (e.g., API on Lambda, workers on Docker)

---

## Phase 1: Project Foundation & Configuration (REVISED)

### 1.1 Project Structure Setup
- [ ] Create app/ directory structure with core, adapters, services
- [ ] Create infra/ directory with Terraform modules structure
- [ ] Create deployments/ directory for Docker and serverless configs
- [ ] Initialize Git with proper .gitignore for multi-cloud setup
- [ ] Set up monorepo with workspaces (pnpm/npm workspaces)

### 1.2 TypeScript & Build Configuration
- [ ] Configure TypeScript with path aliases for clean imports
- [ ] Set up tsconfig for different targets (Node, Browser, Edge)
- [ ] Configure build tools (esbuild/webpack) for different runtimes
- [ ] Set up ESLint and Prettier for code quality
- [ ] Create build scripts for all deployment targets

### 1.3 Dependency Injection & Configuration
- [ ] Set up DI container (tsyringe, inversify, or custom)
- [ ] Create environment-based configuration loader
- [ ] Define adapter registration system
- [ ] Create runtime detection (Lambda, Workers, Docker)
- [ ] Implement configuration validation with Zod

### 1.4 Tailwind & Theme System
- [ ] Install and configure Tailwind CSS
- [ ] Set up theme.config.json loading system
- [ ] Create CSS custom properties generator
- [ ] Configure theme for SSR/SSG compatibility
- [ ] Document theme customization process

### 1.5 Development Environment
- [ ] Set up local Docker Compose environment
- [ ] Create development scripts for all services
- [ ] Configure hot reload for development
- [ ] Set up local PostgreSQL, MinIO, RabbitMQ
- [ ] Create .env.example with all required variables

---

## Phase 2: Core Domain & Interfaces (REVISED)

### 2.1 Domain Models
- [ ] Define Invoice entity with business rules
- [ ] Define Vendor entity
- [ ] Define Category entity
- [ ] Define CreditCard entity with cycle logic
- [ ] Define Payment entity
- [ ] Create value objects (Money, Date ranges, etc.)
- [ ] Define domain events (InvoiceCreated, PaymentDue, etc.)

### 2.2 Port Definitions (Interfaces)
- [ ] Define IStoragePort interface (upload, download, delete, getSignedUrl)
- [ ] Define IDatabasePort interface (CRUD operations, transactions)
- [ ] Define IQueuePort interface (enqueue, consume, ack)
- [ ] Define IMessagingPort interface (send message, send template)
- [ ] Define IOCRPort interface (extractText, parseInvoice)
- [ ] Define ICachePort interface (get, set, delete)
- [ ] Define ILoggerPort interface (log, error, warn)

### 2.3 Use Cases
- [ ] ProcessInvoiceUseCase (from webhook to storage)
- [ ] ExtractInvoiceDataUseCase (OCR and parsing)
- [ ] CreateInvoiceUseCase (manual creation)
- [ ] GetInvoicesUseCase (with filters and pagination)
- [ ] UpdateInvoiceUseCase
- [ ] DeleteInvoiceUseCase
- [ ] GetAnalyticsUseCase
- [ ] RecommendCardUseCase (best card for date)
- [ ] SendPaymentReminderUseCase
- [ ] GenerateMonthlyReportUseCase

### 2.4 Data Transfer Objects
- [ ] Create DTOs for all API requests/responses
- [ ] Create Zod schemas for validation
- [ ] Define mapping functions (Entity ↔ DTO)
- [ ] Create builder patterns for complex DTOs

---

## Phase 3: Adapter Implementations

### 3.1 Storage Adapters
- [ ] **S3Adapter** (AWS S3)
  - Upload, download, signed URLs
  - Error handling and retries
- [ ] **R2Adapter** (Cloudflare R2)
  - S3-compatible API implementation
- [ ] **MinIOAdapter** (Self-hosted S3-compatible)
  - For Docker/Hetzner deployments
- [ ] **LocalStorageAdapter** (filesystem)
  - For local development and testing

### 3.2 Database Adapters
- [ ] **PostgresAdapter** (PostgreSQL)
  - Connection pooling
  - Query builder integration (Kysely/Drizzle)
  - Transaction support
  - Migration runner
- [ ] **D1Adapter** (Cloudflare D1)
  - SQLite dialect with D1 client
- [ ] **InMemoryAdapter** (for testing)

### 3.3 Queue Adapters
- [ ] **SQSAdapter** (AWS SQS)
  - Send, receive, delete messages
  - Batch operations
- [ ] **CloudflareQueuesAdapter** (Cloudflare Queues)
- [ ] **RabbitMQAdapter** (RabbitMQ)
  - For Docker deployments
- [ ] **InMemoryQueueAdapter** (for testing)

### 3.4 Messaging Adapters
- [ ] **KapsoAdapter** (Kapso.ai WhatsApp)
  - Webhook verification
  - Send messages and templates
  - Media handling
- [ ] **TwilioAdapter** (alternative WhatsApp provider)

### 3.5 OCR Adapters
- [ ] **CloudflareAIAdapter** (Cloudflare AI)
- [ ] **AWSTextractAdapter** (AWS Textract)
- [ ] **TesseractAdapter** (open-source OCR)
  - For self-hosted deployments
- [ ] **GoogleVisionAdapter** (Google Cloud Vision)

### 3.6 Cache Adapters
- [ ] **RedisAdapter** (Redis/Upstash)
- [ ] **CloudflareKVAdapter** (Cloudflare KV)
- [ ] **InMemoryCacheAdapter** (for development)

---

## Phase 4: Application Services

### 4.1 Invoice Processing Service
- [ ] Webhook ingestion handler
- [ ] File validation and storage
- [ ] Queue job creation
- [ ] OCR result processing
- [ ] Invoice data normalization
- [ ] Database persistence
- [ ] Confirmation notification

### 4.2 Analytics Service
- [ ] Calculate monthly/yearly totals
- [ ] Generate spending trends
- [ ] Category breakdowns
- [ ] Vendor analytics
- [ ] Card usage statistics
- [ ] Caching strategy for expensive queries

### 4.3 Credit Card Service
- [ ] Cycle calculations (closure/due dates)
- [ ] Card recommendation algorithm
- [ ] Payment tracking
- [ ] Utilization monitoring

### 4.4 Notification Service
- [ ] Payment reminder scheduler
- [ ] Card recommendation notifications
- [ ] Monthly reports
- [ ] Error alerts
- [ ] Template management

---

## Phase 5: REST API Layer

### 5.1 API Framework Setup
- [ ] Choose framework (Express, Fastify, Hono)
- [ ] Set up routing
- [ ] Implement middleware (auth, logging, error handling)
- [ ] Request validation middleware
- [ ] Response formatting
- [ ] CORS configuration

### 5.2 Invoice Endpoints
- [ ] GET /api/invoices (list with filters)
- [ ] GET /api/invoices/:id
- [ ] POST /api/invoices
- [ ] PATCH /api/invoices/:id
- [ ] DELETE /api/invoices/:id
- [ ] GET /api/invoices/:id/file

### 5.3 Vendor Endpoints
- [ ] GET /api/vendors
- [ ] GET /api/vendors/:id
- [ ] POST /api/vendors
- [ ] PATCH /api/vendors/:id
- [ ] GET /api/vendors/:id/invoices

### 5.4 Category Endpoints
- [ ] GET /api/categories
- [ ] POST /api/categories
- [ ] PATCH /api/categories/:id
- [ ] GET /api/categories/:id/stats

### 5.5 Card Endpoints
- [ ] GET /api/cards
- [ ] GET /api/cards/:id
- [ ] POST /api/cards
- [ ] PATCH /api/cards/:id
- [ ] GET /api/cards/recommend

### 5.6 Analytics Endpoints
- [ ] GET /api/analytics/summary
- [ ] GET /api/analytics/trends
- [ ] GET /api/analytics/by-category
- [ ] GET /api/analytics/by-vendor
- [ ] GET /api/analytics/by-card

### 5.7 Payment Endpoints
- [ ] GET /api/payments
- [ ] GET /api/payments/upcoming
- [ ] POST /api/payments
- [ ] PATCH /api/payments/:id

---

## Phase 6: Frontend Dashboard

### 6.1 Project Setup
- [ ] Initialize Vite/Next.js project
- [ ] Configure Tailwind with theme system
- [ ] Set up routing
- [ ] Configure API client (fetch wrapper)
- [ ] Set up state management (Zustand/Context)

### 6.2 Components (Same as before)
- Layout, navigation, dashboard, charts, forms...

### 6.3 Pages
- Dashboard home, invoices, vendors, categories, cards, payments...

---

## Phase 7: Deployment Configurations

### 7.1 Docker Deployment
- [ ] Create Dockerfile for API service
- [ ] Create Dockerfile for worker service
- [ ] Create Dockerfile for frontend (Nginx)
- [ ] Create docker-compose.yml for local development
- [ ] Create docker-compose.prod.yml for production
- [ ] Configure health checks
- [ ] Set up multi-stage builds

### 7.2 AWS Lambda Deployment
- [ ] Create serverless.yml configuration
- [ ] Configure API Gateway
- [ ] Set up Lambda layers for dependencies
- [ ] Configure SQS triggers for workers
- [ ] Set up EventBridge for cron jobs
- [ ] Configure environment variables

### 7.3 Cloudflare Workers Deployment
- [ ] Create wrangler.toml configurations
- [ ] Set up Workers bindings (D1, R2, Queues)
- [ ] Configure Routes
- [ ] Set up Cron Triggers
- [ ] Configure environment variables

### 7.4 Kubernetes Deployment
- [ ] Create Kubernetes manifests
- [ ] Set up Deployments
- [ ] Configure Services
- [ ] Set up Ingress
- [ ] Create ConfigMaps and Secrets
- [ ] Set up HorizontalPodAutoscaler

---

## Phase 8: Infrastructure as Code

### 8.1 Terraform Structure
- [ ] Create provider configurations (AWS, Cloudflare, Hetzner)
- [ ] Create reusable modules
- [ ] Set up remote state backend
- [ ] Create environment-specific configurations
- [ ] Document variable inputs/outputs

### 8.2 Database Module
- [ ] RDS PostgreSQL for AWS
- [ ] Cloudflare D1 for Workers
- [ ] Managed PostgreSQL for Hetzner
- [ ] Backup configurations
- [ ] Security groups/firewall rules

### 8.3 Storage Module
- [ ] S3 bucket configuration (AWS)
- [ ] R2 bucket configuration (Cloudflare)
- [ ] MinIO/S3-compatible setup (Hetzner)
- [ ] Lifecycle policies
- [ ] Access policies

### 8.4 Queue Module
- [ ] SQS queue setup (AWS)
- [ ] Cloudflare Queue configuration
- [ ] RabbitMQ deployment (Docker/Hetzner)
- [ ] Dead letter queues
- [ ] Monitoring alarms

### 8.5 Compute Module
- [ ] Lambda functions (AWS)
- [ ] Workers deployment (Cloudflare)
- [ ] Container deployment (Hetzner)
- [ ] Auto-scaling configuration
- [ ] Load balancer setup

### 8.6 Networking Module
- [ ] VPC setup (AWS)
- [ ] Subnets and routing
- [ ] Security groups
- [ ] NAT gateway
- [ ] DNS configuration

### 8.7 Monitoring Module
- [ ] CloudWatch (AWS)
- [ ] Analytics (Cloudflare)
- [ ] Prometheus/Grafana (Docker)
- [ ] Log aggregation
- [ ] Alerting rules

---

## Phase 9: Testing

### 9.1 Unit Tests
- [ ] Test core domain logic
- [ ] Test use cases with mock adapters
- [ ] Test utilities and helpers
- [ ] Test validators

### 9.2 Integration Tests
- [ ] Test adapters with real services (in Docker)
- [ ] Test API endpoints
- [ ] Test service layer
- [ ] Test database operations

### 9.3 End-to-End Tests
- [ ] Test complete workflows
- [ ] Test webhook to database flow
- [ ] Test payment reminder flow
- [ ] Test frontend to API integration

---

## Phase 10: CI/CD

### 10.1 GitHub Actions
- [ ] Lint and type-check on PR
- [ ] Run tests on PR
- [ ] Build Docker images on merge
- [ ] Deploy to staging automatically
- [ ] Deploy to production with approval
- [ ] Run Terraform plan on PR
- [ ] Apply Terraform on merge

### 10.2 Deployment Pipelines
- [ ] AWS Lambda deployment pipeline
- [ ] Cloudflare Workers deployment pipeline
- [ ] Docker image build and push
- [ ] Kubernetes deployment
- [ ] Database migration runner

---

## Technology Stack

### Application
- **Language**: TypeScript
- **Runtime**: Node.js (v18+)
- **API Framework**: Fastify (fast, works everywhere)
- **Database Client**: Kysely (type-safe SQL query builder)
- **Validation**: Zod
- **DI Container**: tsyringe
- **Testing**: Vitest
- **Frontend**: React + Vite + Tailwind

### Infrastructure
- **IaC**: Terraform
- **Containerization**: Docker
- **Orchestration**: Kubernetes (optional)
- **CI/CD**: GitHub Actions

### Cloud Services (Adapter-based)

| Service | AWS | Cloudflare | Docker/Hetzner |
|---------|-----|------------|----------------|
| **Compute** | Lambda | Workers | Docker containers |
| **Database** | RDS Postgres | D1 | PostgreSQL |
| **Storage** | S3 | R2 | MinIO |
| **Queue** | SQS | Queues | RabbitMQ |
| **Cache** | ElastiCache | KV | Redis |
| **CDN** | CloudFront | Cloudflare | Nginx |
| **Monitoring** | CloudWatch | Analytics | Prometheus |

---

## Configuration System

### Environment Variables

```bash
# Runtime
NODE_ENV=production
DEPLOYMENT_TARGET=aws  # aws | cloudflare | docker

# Database
DATABASE_ADAPTER=postgres  # postgres | d1
DATABASE_URL=postgresql://...

# Storage
STORAGE_ADAPTER=s3  # s3 | r2 | minio
STORAGE_ENDPOINT=https://...
STORAGE_BUCKET=invoices

# Queue
QUEUE_ADAPTER=sqs  # sqs | cloudflare | rabbitmq
QUEUE_URL=https://...

# Messaging
MESSAGING_ADAPTER=kapso
KAPSO_API_KEY=sk_...
KAPSO_WEBHOOK_SECRET=whsec_...

# OCR
OCR_ADAPTER=textract  # textract | cloudflare-ai | tesseract
OCR_API_KEY=...

# Cache
CACHE_ADAPTER=redis  # redis | kv | memory
CACHE_URL=redis://...
```

### Adapter Registration

```typescript
// app/shared/config/container.ts
import { container } from 'tsyringe';

// Register adapters based on environment
switch (process.env.STORAGE_ADAPTER) {
  case 's3':
    container.register<IStoragePort>('StoragePort', S3Adapter);
    break;
  case 'r2':
    container.register<IStoragePort>('StoragePort', R2Adapter);
    break;
  case 'minio':
    container.register<IStoragePort>('StoragePort', MinIOAdapter);
    break;
}

// Same pattern for all other adapters...
```

---

## Migration Path

### Starting Simple (Docker on Hetzner)
1. Deploy everything in Docker Compose
2. Use PostgreSQL, MinIO, RabbitMQ
3. Single VPS, low cost
4. Good for MVP/testing

### Scaling to Serverless (AWS/Cloudflare)
1. Switch adapters via environment variables
2. Deploy functions to Lambda/Workers
3. Use managed services (RDS, S3, SQS)
4. Pay per use, infinite scale

### Hybrid Approach
1. API on serverless (Lambda/Workers)
2. Heavy processing on Docker (OCR workers)
3. Database on managed service (RDS)
4. Best of both worlds

---

## Next Steps

1. **Review architecture**: Does this structure work for your needs?
2. **Choose initial deployment target**: Docker, AWS, or Cloudflare?
3. **Start Phase 1**: Set up project structure
4. **Implement core domain**: Business logic first, adapters later
5. **Add adapters incrementally**: Start with one cloud, add others as needed

This architecture gives you **maximum flexibility** while keeping **business logic clean and testable**. You can start simple and scale up, or switch clouds entirely without rewriting core logic.
