# Application & Infrastructure Separation - Final Architecture

## Overview

This project is split into **two independent folders**:

```
finan-track/
├── app/              ← APPLICATION CODE (we'll build this now)
│   └── ...           Cloud-agnostic, works anywhere
│
└── infra/            ← INFRASTRUCTURE (set up later with Terraform)
    └── terraform/    Provisions cloud resources
```

**Key principle:** The application **never knows** about infrastructure. Infrastructure **provisions** resources and provides connection strings to the application via environment variables.

---

## Application Folder (`app/`)

**What it contains:** Pure business logic, APIs, workers, frontend - all cloud-agnostic.

```
app/
├── api/              # REST API (Fastify)
│   ├── routes/       # HTTP endpoints
│   ├── middleware/   # Auth, validation, logging
│   └── server.ts     # Server entry point
│
├── services/         # Business logic (pure functions)
│   ├── invoice-service.ts
│   ├── analytics-service.ts
│   ├── payment-service.ts
│   └── ...
│
├── repositories/     # Data access layer
│   ├── invoice-repo.ts
│   ├── vendor-repo.ts
│   ├── db.ts         # Database client wrapper
│   └── ...
│
├── jobs/             # Background workers
│   ├── ocr-worker.ts
│   ├── reminder-worker.ts
│   └── worker.ts     # Worker entry point
│
├── lib/              # External service clients
│   ├── storage.ts    # S3-compatible (S3/R2/MinIO)
│   ├── queue.ts      # Queue abstraction (SQS/RabbitMQ/Cloudflare)
│   ├── whatsapp.ts   # Kapso client
│   ├── cache.ts      # Redis/KV
│   └── ocr.ts        # OCR service client
│
├── types/            # TypeScript types
│   ├── invoice.ts
│   ├── vendor.ts
│   └── ...
│
├── utils/            # Helper functions
│   ├── date.ts
│   ├── money.ts
│   ├── validation.ts
│   └── card-cycles.ts
│
├── config/           # Configuration management
│   ├── env.ts        # Environment validation (Zod)
│   └── index.ts
│
└── frontend/         # Dashboard (React + Vite + Tailwind)
    ├── src/
    ├── public/
    └── package.json
```

**How it works:**
- Uses environment variables for all connections
- No cloud-specific SDKs in business logic
- Can run locally, in Docker, Lambda, Workers, or ECS
- Same code, different deployment

---

## Infrastructure Folder (`infra/`)

**What it contains:** Terraform modules to provision cloud resources.

```
infra/
└── terraform/
    ├── modules/              # Reusable Terraform modules
    │   ├── database/         # PostgreSQL/D1 setup
    │   │   ├── main.tf
    │   │   ├── variables.tf
    │   │   └── outputs.tf
    │   ├── storage/          # S3/R2/MinIO bucket
    │   ├── queue/            # SQS/RabbitMQ/Cloudflare Queues
    │   ├── compute/          # Lambda/Workers/ECS
    │   ├── cache/            # Redis/Upstash
    │   └── networking/       # VPC, subnets (if needed)
    │
    ├── providers/            # Provider-specific configs
    │   ├── aws/              # AWS-specific resources
    │   │   ├── main.tf       # Use modules + AWS glue
    │   │   ├── lambda.tf
    │   │   ├── rds.tf
    │   │   ├── s3.tf
    │   │   └── sqs.tf
    │   ├── cloudflare/       # Cloudflare-specific
    │   │   ├── main.tf
    │   │   ├── workers.tf
    │   │   ├── d1.tf
    │   │   ├── r2.tf
    │   │   └── queues.tf
    │   └── hetzner/          # Hetzner + Docker
    │       ├── main.tf
    │       ├── server.tf     # Provision VPS
    │       └── docker.tf     # Docker Compose setup
    │
    ├── environments/         # Environment-specific configs
    │   ├── dev/
    │   │   ├── main.tf
    │   │   ├── terraform.tfvars
    │   │   └── backend.tf
    │   ├── staging/
    │   └── production/
    │
    └── scripts/
        ├── init.sh
        └── deploy.sh
```

**How it works:**
1. Choose provider: `cd infra/terraform/providers/aws` (or cloudflare, hetzner)
2. Run Terraform: `terraform apply`
3. Get outputs: Database URL, bucket name, queue URL, etc.
4. Set environment variables for the application
5. Deploy application code

---

## Deployment Configurations (`deployments/`)

**Optional:** Deployment-specific configs (separate from infrastructure).

```
deployments/
├── docker/
│   ├── Dockerfile        # Multi-stage Docker build
│   ├── docker-compose.yml          # Local development
│   └── docker-compose.prod.yml     # Production (Hetzner)
│
├── aws/
│   ├── lambda/
│   │   ├── serverless.yml          # Serverless Framework config
│   │   └── handler.ts              # Lambda entry point
│   └── ecs/
│       ├── task-definition.json
│       └── service.json
│
└── cloudflare/
    └── wrangler.toml                # Workers config
```

---

## How It All Works Together

### For AWS Lambda

**Infrastructure (later):**
```bash
cd infra/terraform/providers/aws
terraform apply
# Outputs: RDS_URL, S3_BUCKET, SQS_URL
```

**Application:**
```bash
# Set environment variables from Terraform outputs
export DATABASE_URL="postgresql://..."  # From Terraform
export STORAGE_ENDPOINT="https://s3.amazonaws.com"
export STORAGE_BUCKET="my-bucket"       # From Terraform
export QUEUE_TYPE="sqs"
export QUEUE_URL="https://sqs..."       # From Terraform

# Deploy
cd deployments/aws/lambda
serverless deploy
```

**Application code doesn't change!** Same code runs on Lambda because it's cloud-agnostic.

---

### For Cloudflare Workers

**Infrastructure (later):**
```bash
cd infra/terraform/providers/cloudflare
terraform apply
# Outputs: D1_DATABASE_ID, R2_BUCKET, QUEUE_ID
```

**Application:**
```bash
# Wrangler uses bindings (no env vars needed)
cd deployments/cloudflare
wrangler deploy
```

**Application code doesn't change!** Same services, different adapters via env.

---

### For Hetzner + Docker

**Infrastructure (later):**
```bash
cd infra/terraform/providers/hetzner
terraform apply
# Provisions: VPS, PostgreSQL, MinIO, RabbitMQ via Docker Compose
# Outputs: SERVER_IP, DATABASE_URL, etc.
```

**Application:**
```bash
# SSH to server (provisioned by Terraform)
ssh root@<SERVER_IP>

# Pull and run Docker Compose
docker-compose -f deployments/docker/docker-compose.prod.yml up -d
```

**Application code doesn't change!** Same code runs in Docker containers.

---

## Environment Variables - The Bridge

**The application only needs these:**

```bash
# Database
DATABASE_URL=postgresql://...

# Storage (S3-compatible)
STORAGE_ENDPOINT=https://...
STORAGE_BUCKET=my-bucket
STORAGE_ACCESS_KEY=...
STORAGE_SECRET_KEY=...

# Queue
QUEUE_TYPE=sqs|rabbitmq|cloudflare
QUEUE_URL=https://...

# WhatsApp
KAPSO_API_KEY=...
KAPSO_WEBHOOK_SECRET=...

# Cache
CACHE_TYPE=redis|memory
REDIS_URL=redis://...
```

**Where do these come from?**
- Infrastructure creates resources (Terraform)
- Terraform outputs connection strings
- You set these as environment variables
- Application uses them

**Example Terraform output:**
```hcl
# infra/terraform/providers/aws/outputs.tf
output "database_url" {
  value = aws_db_instance.postgres.endpoint
}

output "s3_bucket" {
  value = aws_s3_bucket.invoices.bucket
}

output "sqs_url" {
  value = aws_sqs_queue.ocr_jobs.url
}
```

Then:
```bash
export DATABASE_URL=$(terraform output -raw database_url)
```

---

## Application Libraries - How They Stay Cloud-Agnostic

### Storage (`app/lib/storage.ts`)

```typescript
// One S3-compatible client works for S3, R2, MinIO!
const client = new S3Client({
  endpoint: process.env.STORAGE_ENDPOINT,  // Different per provider
  region: process.env.STORAGE_REGION,
  credentials: { ... }
});

export async function uploadFile(key: string, data: Buffer) {
  await client.send(new PutObjectCommand({ ... }));
}
```

**No provider-specific code!** Just configuration.

### Queue (`app/lib/queue.ts`)

```typescript
// Factory pattern based on env var
export async function enqueue(queueName: string, data: any) {
  const queueType = process.env.QUEUE_TYPE;

  if (queueType === 'sqs') {
    // Use SQS
  } else if (queueType === 'rabbitmq') {
    // Use RabbitMQ
  } else if (queueType === 'cloudflare') {
    // Use Cloudflare Queues
  }
}
```

**Simple factory, no complex abstractions.**

### Database (`app/repositories/db.ts`)

```typescript
// PostgreSQL works everywhere (RDS, Neon, local)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function query(sql: string, params?: any[]) {
  return pool.query(sql, params);
}
```

**Standard PostgreSQL client, works on any provider.**

---

## Development Workflow

### Phase 1: Build Application (Now)

```bash
# 1. Set up project
npm install
npx ultracite init

# 2. Start local infrastructure (Docker)
docker-compose up  # PostgreSQL, MinIO, RabbitMQ, Redis

# 3. Set local environment variables
export DATABASE_URL="postgresql://localhost:5432/invoices"
export STORAGE_ENDPOINT="http://localhost:9000"
export QUEUE_TYPE="rabbitmq"

# 4. Develop!
npm run dev
```

**No cloud provider needed yet!** Everything runs locally.

### Phase 2: Set Up Infrastructure (Later)

```bash
# Choose your provider
cd infra/terraform/providers/aws  # or cloudflare, hetzner

# Provision resources
terraform init
terraform plan
terraform apply

# Copy outputs to .env
terraform output > ../../.env.production
```

### Phase 3: Deploy Application

```bash
# Set production environment variables from Terraform
source .env.production

# Deploy based on provider
# AWS:
cd deployments/aws/lambda && serverless deploy

# Cloudflare:
cd deployments/cloudflare && wrangler deploy

# Hetzner:
scp docker-compose.prod.yml server:/app
ssh server 'cd /app && docker-compose up -d'
```

---

## Key Advantages

✅ **Clean separation:** App and infra are completely independent

✅ **Develop locally:** No cloud accounts needed for development

✅ **Cloud-agnostic:** Same app code runs anywhere

✅ **Infrastructure as Code:** All resources versioned in Git

✅ **Flexibility:** Start on Docker, move to Lambda later - no app changes

✅ **Solo-friendly:** Simple, pragmatic, no over-engineering

✅ **Cost-effective:** Choose cheapest option per environment
  - Dev: Local Docker (free)
  - Staging: Hetzner Docker ($5/month)
  - Production: AWS/Cloudflare (as needed)

---

## Summary

**What we're building NOW (application):**
```
app/
├── api/           # REST API
├── services/      # Business logic
├── repositories/  # Database access
├── jobs/          # Workers
├── lib/           # Cloud clients
└── frontend/      # UI
```

**What we'll do LATER (infrastructure):**
```
infra/terraform/
├── providers/
│   ├── aws/       # For Lambda/ECS
│   ├── cloudflare/# For Workers
│   └── hetzner/   # For Docker
```

**Application never imports from infrastructure.**
**Infrastructure outputs → Environment variables → Application.**

Perfect for solo development! 🎯

---

## Next Step: Start Building the Application

Ready to start Phase 1 of the **application** implementation?
