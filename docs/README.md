# Documentation Index

Welcome to the **finan-track** documentation. This directory contains all project documentation organized by category.

> **Heads-up (2026-04):** the backend has been replaced with the
> Hono + SQLite stack from the app-finance merge. Many architecture
> documents below still describe the original Fastify/PostgreSQL
> design. The current source of truth is
> [MERGE_PLAN.md](./MERGE_PLAN.md) and the top-level
> [`README.md`](../README.md).

---

## 📚 Documentation Structure

### 🏗️ [Architecture](./architecture/)
Documentation about the system architecture and design decisions.

- **[LAYERED_ARCHITECTURE.md](./architecture/LAYERED_ARCHITECTURE.md)** - Main architecture overview (START HERE)
  - Layered functional architecture principles
  - Directory structure and organization
  - Code patterns and conventions
  - Cloud-agnostic design philosophy

- **[ARCHITECTURE_COMPARISON.md](./architecture/ARCHITECTURE_COMPARISON.md)** - Why we chose this architecture
  - Comparison of different architectural approaches
  - Trade-offs and benefits
  - Decision rationale

- **[APP_INFRA_SEPARATION.md](./architecture/APP_INFRA_SEPARATION.md)** - Application vs infrastructure separation
  - How application and infrastructure are decoupled
  - Environment variable bridge pattern
  - Multi-cloud deployment approach

---

### 🚀 [Deployment](./deployment/)
Guides for deploying the application to various platforms.

- **[DEPLOYMENT.md](./deployment/DEPLOYMENT.md)** - Complete deployment options overview
  - Free tier options (Railway, Cloudflare)
  - Low-cost options (Hetzner VPS ~$5/mo)
  - Serverless options
  - Cost comparisons and recommendations

- **[HETZNER_DEPLOY.md](./deployment/HETZNER_DEPLOY.md)** - Hetzner VPS deployment guide
  - Step-by-step VPS provisioning
  - Automated setup script usage
  - Manual deployment instructions
  - Domain & SSL configuration
  - Backup & restore procedures
  - Troubleshooting guide

---

### 📖 [Guides](./guides/)
Integration guides and reference documentation.

- **[WHATSAPP_INTEGRATION.md](./guides/WHATSAPP_INTEGRATION.md)** - WhatsApp integration via Kapso.ai
  - Kapso.ai setup and configuration
  - Webhook implementation
  - Invoice processing workflow
  - Testing and debugging

- **[DATABASE_SCHEMA.md](./guides/DATABASE_SCHEMA.md)** - Database schema reference
  - Complete table definitions
  - Relationships and indexes
  - Migration strategy
  - Data model explanations

---

## 🎯 Quick Navigation

### New to the Project?
1. Start with [LAYERED_ARCHITECTURE.md](./architecture/LAYERED_ARCHITECTURE.md) to understand the codebase structure
2. Read [ARCHITECTURE_COMPARISON.md](./architecture/ARCHITECTURE_COMPARISON.md) to understand design decisions
3. Check [DATABASE_SCHEMA.md](./guides/DATABASE_SCHEMA.md) to understand the data model

### Ready to Deploy?
1. Review [DEPLOYMENT.md](./deployment/DEPLOYMENT.md) to choose your deployment option
2. For Hetzner VPS, follow [HETZNER_DEPLOY.md](./deployment/HETZNER_DEPLOY.md)
3. Configure WhatsApp using [WHATSAPP_INTEGRATION.md](./guides/WHATSAPP_INTEGRATION.md)

### Working on the Code?
- See [CLAUDE.md](../CLAUDE.md) in the root for development guidelines
- Check [LAYERED_ARCHITECTURE.md](./architecture/LAYERED_ARCHITECTURE.md) for code patterns
- Reference [DATABASE_SCHEMA.md](./guides/DATABASE_SCHEMA.md) for database operations

---

## 📂 Other Important Files

Located in the project root:

- **[README.md](../README.md)** - Project overview and getting started
- **[CLAUDE.md](../CLAUDE.md)** - Development guidelines and project instructions for Claude Code
- **[.env.example](../.env.example)** - Environment variable reference

---

## 🔍 Documentation Categories Explained

### Architecture
Documents that explain **how the system is designed** and **why** certain decisions were made. These are long-lived documents that rarely change.

### Deployment
Step-by-step guides for **deploying the application** to different environments. These are practical, action-oriented documents.

### Guides
Reference documentation and integration guides for **specific features or components**. These help you implement or understand particular functionality.

---

## 📝 Contributing to Documentation

When adding new documentation:

1. **Choose the right category:**
   - Architecture = Design decisions and system structure
   - Deployment = Deployment and infrastructure guides
   - Guides = Feature guides, integrations, references

2. **Follow naming conventions:**
   - Use UPPERCASE for file names (e.g., `MY_GUIDE.md`)
   - Be descriptive (e.g., `AWS_LAMBDA_DEPLOY.md` not `DEPLOY.md`)

3. **Update this index:**
   - Add your new document to the appropriate section
   - Include a brief description

4. **Keep it current:**
   - Remove outdated documentation
   - Update existing docs when features change
   - Archive completed implementation guides

---

## ❓ Getting Help

- **Questions about code?** See [CLAUDE.md](../CLAUDE.md)
- **Questions about deployment?** Check [deployment/](./deployment/)
- **Questions about architecture?** Read [architecture/](./architecture/)
- **Questions about integrations?** See [guides/](./guides/)

---

Last updated: 2025
