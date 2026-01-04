# Invoice Processing & Financial Tracking App

A cloud-agnostic invoice processing and financial tracking application with WhatsApp integration via Kapso.ai. Built with a **layered functional architecture** for simplicity and maintainability.

## Overview

This application automates invoice ingestion from WhatsApp, extracts structured data using OCR, and provides a comprehensive financial dashboard for tracking expenses, managing credit cards, and optimizing payment schedules.

**Key Design Principles:**
- 🎯 **Cloud-agnostic** - Deploy to AWS, Cloudflare, Docker, or any platform
- 🏗️ **Layered architecture** - Simple, functional, pragmatic
- 📦 **Infrastructure as Code** - Terraform for all infrastructure
- 🧩 **Clean separation** - Application code and infrastructure are independent
- ⚡ **Solo-dev friendly** - No classes, no over-abstraction

## Architecture

### Application Stack
- **Language**: TypeScript (functional style, no classes)
- **API**: Fastify
- **Database**: PostgreSQL (or any SQL database)
- **Storage**: S3-compatible (AWS S3, Cloudflare R2, MinIO)
- **Queue**: SQS, RabbitMQ, or Cloudflare Queues
- **Frontend**: React + Vite + Tailwind CSS
- **WhatsApp**: Kapso.ai integration

### Deployment Options
- **AWS**: Lambda + RDS + S3 + SQS
- **Cloudflare**: Workers + D1 + R2 + Queues
- **Docker**: Containers + PostgreSQL + MinIO + RabbitMQ
- **Hybrid**: Mix and match based on needs

## Features

- 📸 **WhatsApp Invoice Ingestion**: Send invoice photos/PDFs via WhatsApp
- 🤖 **Automated OCR**: Extract data from invoices automatically
- 📊 **Financial Dashboard**: View KPIs, trends, and spending analytics
- 💳 **Credit Card Tracking**: Manage closure dates and optimize card usage
- 🔔 **Smart Alerts**: Payment reminders and card recommendations
- 🎨 **Customizable Themes**: Easily change colors via configuration

## Project Structure

**Monorepo organization with clear separation of concerns:**

```
finan-track/
│
├── .env.example               # Development environment variables
├── env.production.example     # Production environment template
├── docker-compose.yml         # Development infrastructure (Postgres, MinIO, etc.)
├── docker-compose.prod.yml    # Production full stack deployment
├── package.json               # Monorepo workspace configuration
│
├── backend/                   # 📦 BACKEND SERVICE
│   ├── api/                  # HTTP routes and middleware (Fastify)
│   ├── services/             # Business logic (pure functions)
│   ├── repositories/         # Data access layer (PostgreSQL)
│   ├── migrations/           # Database migrations
│   ├── jobs/                 # Background workers
│   ├── lib/                  # External service clients (cloud-agnostic)
│   ├── types/                # TypeScript types
│   ├── utils/                # Helper functions
│   ├── config/               # Configuration management (Zod schemas)
│   ├── Dockerfile            # Backend container build
│   └── package.json          # Backend dependencies
│
├── frontend/                  # 🎨 FRONTEND SERVICE
│   ├── src/                  # React components and pages
│   ├── tests/                # Playwright tests
│   ├── screenshots/          # Dashboard screenshots
│   ├── theme.config.json     # Theme configuration
│   ├── Dockerfile            # Frontend container build (nginx)
│   └── package.json          # Frontend dependencies
│
├── docs/                      # 📚 DOCUMENTATION
│   ├── architecture/         # Architecture design docs
│   ├── deployment/           # Deployment guides
│   └── guides/               # Integration guides
│
└── scripts/                   # 🔧 UTILITY SCRIPTS
    └── setup-hetzner.sh      # Automated VPS deployment
```

**Key principle:** Application and infrastructure are **completely independent**.

- **Application** = Cloud-agnostic code (same code runs anywhere)
- **Infrastructure** = Terraform provisions resources (DB, storage, queues)
- **Bridge** = Environment variables (infra outputs → app inputs)

See [docs/APP_INFRA_SEPARATION.md](./docs/APP_INFRA_SEPARATION.md) for detailed explanation.

## Theme Customization

The application uses a configurable theme system powered by Tailwind CSS. All colors can be customized by editing `frontend/theme.config.json`.

### Changing Colors

1. Open `frontend/theme.config.json`
2. Modify the color scales for your desired palette:

```json
{
  "colors": {
    "primary": {
      "500": "#3b82f6",  // Main brand color
      "600": "#2563eb",  // Darker variant
      ...
    }
  }
}
```

### Color Scales

Each color family (primary, secondary, accent, etc.) follows Tailwind's scale convention:
- **50-100**: Very light shades (backgrounds, subtle highlights)
- **200-400**: Light-medium shades (borders, muted states)
- **500-600**: Base colors (primary actions, headings)
- **700-800**: Dark shades (hover states, emphasis)
- **900-950**: Very dark shades (text, strong contrast)

### Available Color Families

- `primary`: Main brand color (buttons, links, highlights)
- `secondary`: Secondary UI elements (secondary buttons, badges)
- `accent`: Accent elements (special highlights, CTAs)
- `success`: Success states (confirmations, positive feedback)
- `warning`: Warning states (alerts, cautions)
- `error`: Error states (errors, validation messages)
- `neutral`: Text and neutral UI elements

### Applying Theme Changes

The theme is loaded at build time and generates CSS custom properties. After modifying `frontend/theme.config.json`:

1. Rebuild the frontend: `cd frontend && npm run build`
2. The new colors will be applied throughout the application

## Documentation

- **[docs/README.md](./docs/README.md)** - Documentation index (start here)
- **[docs/architecture/LAYERED_ARCHITECTURE.md](./docs/architecture/LAYERED_ARCHITECTURE.md)** - Main architecture overview
- **[docs/architecture/ARCHITECTURE_COMPARISON.md](./docs/architecture/ARCHITECTURE_COMPARISON.md)** - Why we chose this architecture
- **[docs/architecture/APP_INFRA_SEPARATION.md](./docs/architecture/APP_INFRA_SEPARATION.md)** - Application vs infrastructure separation
- **[docs/deployment/DEPLOYMENT.md](./docs/deployment/DEPLOYMENT.md)** - Deployment options overview
- **[docs/deployment/HETZNER_DEPLOY.md](./docs/deployment/HETZNER_DEPLOY.md)** - Hetzner VPS deployment guide
- **[CLAUDE.md](./CLAUDE.md)** - Development guidelines and code patterns

## Development Workflow

### Prerequisites

- Node.js 18+ and npm/pnpm
- Docker & Docker Compose (for local development)
- Kapso.ai account (for WhatsApp integration)

### Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd finan-track
npm install

# 2. Copy environment template
cp .env.example .env
# Edit .env with your values

# 3. Start local infrastructure (PostgreSQL, MinIO, RabbitMQ, Redis)
npm run dev:all
# This starts Docker Compose with all services

# 4. Run migrations
npm run migrate

# 5. Start API server (in another terminal)
npm run dev

# 6. Start frontend (in another terminal)
npm run dev:frontend
```

### Available Commands

```bash
# Development
npm run dev              # Start API server with hot reload
npm run dev:worker       # Start background worker
npm run dev:all          # Start all services in Docker

# Code Quality
npm run format           # Format and auto-fix with Ultracite
npm run lint             # Check code quality and complexity
npm run typecheck        # TypeScript type checking
npm run check            # Run all checks (typecheck + lint + test)

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Generate coverage report

# Build
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed database with test data
```

### Environment Variables

See `.env.example` for all available options. Key variables:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/invoices

# Storage (works with S3, R2, MinIO)
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=invoices

# Queue
QUEUE_TYPE=rabbitmq
QUEUE_URL=amqp://guest:guest@localhost:5672

# WhatsApp
KAPSO_API_KEY=your_key_here
KAPSO_WEBHOOK_SECRET=your_secret_here
```

## License

[Choose appropriate license]

## Contributors

[Your name/team]

---

## Code Quality & Complexity Management

This project uses **Ultracite** - a zero-config linter and formatter built on Biome (Rust-based, super fast).

### Why Ultracite?
- ✅ **Zero configuration** - Works out of the box
- ✅ **50-100x faster** than ESLint (built in Rust)
- ✅ **Replaces ESLint + Prettier** - One tool for both
- ✅ **AI-optimized** - Works great with Claude Code, Copilot, Cursor
- ✅ **Complexity management built-in** - No manual rules needed

### What it enforces:
- Complexity limits (prevents deeply nested code)
- Type safety (no implicit any, explicit return types)
- Import organization (auto-sorted, no unused)
- Code formatting (consistent style)
- Accessibility (a11y rules for React)

**Setup:** Just run `npx ultracite init` - that's it!

See [docs/ULTRACITE_SETUP.md](./docs/ULTRACITE_SETUP.md) for detailed guide.

---

## Why This Architecture?

We chose **layered functional architecture** because it's:

- ✅ **Simple and pragmatic** - Perfect for solo developers
- ✅ **Easy to understand** and maintain
- ✅ **Cloud-agnostic** via configuration
- ✅ **Fully testable** with simple mocks
- ✅ **Fast to build** - Focus on features, not abstractions

See [docs/ARCHITECTURE_COMPARISON.md](./docs/ARCHITECTURE_COMPARISON.md) for details.

### Cloud-Agnostic Without Over-Engineering

**How it works:**
- Storage library uses S3-compatible client → works with S3, R2, MinIO
- Database uses standard PostgreSQL → works anywhere
- Queue library uses factory pattern → SQS, RabbitMQ, or Cloudflare Queues
- Change `.env` file → switch providers instantly

**No classes, no DI container, no complex abstractions.** Just clean functions and configuration.

---

## Application & Infrastructure Separation

**Two-phase approach:**

### Phase 1: Build Application (Now) ✅
- Develop locally with Docker Compose (PostgreSQL, MinIO, RabbitMQ)
- No cloud provider needed
- Application code is completely cloud-agnostic
- Uses environment variables for all connections

### Phase 2: Set Up Infrastructure (Later) ⏳
- Choose provider: AWS, Cloudflare, or Hetzner
- Use Terraform to provision resources
- Terraform outputs connection strings
- Set environment variables from Terraform outputs
- Deploy same application code - no changes needed!

**Example:**
```bash
# Development (local)
DATABASE_URL=postgresql://localhost:5432/invoices
STORAGE_ENDPOINT=http://localhost:9000  # MinIO
QUEUE_TYPE=rabbitmq

# Production AWS (from Terraform outputs)
DATABASE_URL=postgresql://rds-endpoint/invoices
STORAGE_ENDPOINT=https://s3.amazonaws.com
QUEUE_TYPE=sqs

# Production Cloudflare (from Terraform outputs)
DATABASE_URL=postgresql://neon.tech/invoices
STORAGE_ENDPOINT=https://account.r2.cloudflarestorage.com
QUEUE_TYPE=cloudflare
```

**Same application code, different environment variables!**

See [docs/APP_INFRA_SEPARATION.md](./docs/APP_INFRA_SEPARATION.md) for complete guide.

---

**Current focus:** Building the **application** (`app/` folder). Infrastructure will be set up later with Terraform (`infra/` folder).
