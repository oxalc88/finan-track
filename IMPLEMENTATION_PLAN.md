# Invoice Processing App - Implementation Plan

## Overview
This document breaks down the PRD requirements into individual, actionable tasks that serve as implementation checkpoints. Each task is designed to be independently verifiable and represents a concrete milestone.

---

## Phase 1: Project Foundation & Configuration

### 1.1 Project Setup
- [ ] Initialize Cloudflare Workers project structure
- [ ] Set up TypeScript configuration with strict mode
- [ ] Configure Wrangler for Workers deployment
- [ ] Set up ESLint and Prettier for code quality
- [ ] Create `.gitignore` with appropriate exclusions

### 1.2 Tailwind & Theme Configuration
- [ ] Install and configure Tailwind CSS for Pages frontend
- [ ] Create `theme.config.json` for customizable color schemes
- [ ] Implement theme loader utility that reads from config
- [ ] Define base color tokens (primary, secondary, accent, neutral, error, success)
- [ ] Create CSS custom properties for theme colors
- [ ] Document theme customization process in README

### 1.3 Development Environment
- [ ] Set up local development workflow with Wrangler dev
- [ ] Configure environment variables structure (.dev.vars template)
- [ ] Create development scripts in package.json
- [ ] Set up module aliasing for clean imports

---

## Phase 2: Database Schema & Data Models

### 2.1 D1 Database Setup
- [ ] Create D1 database schema SQL migration files
- [ ] Define `invoices` table schema
- [ ] Define `vendors` table schema
- [ ] Define `categories` table schema
- [ ] Define `credit_cards` table schema
- [ ] Define `payments` table schema
- [ ] Create indexes for query optimization

### 2.2 TypeScript Models & Types
- [ ] Create TypeScript interfaces for all database entities
- [ ] Define request/response DTOs for API endpoints
- [ ] Create validation schemas using Zod or similar
- [ ] Define enums for status fields (invoice status, payment status)
- [ ] Create type guards and validators

### 2.3 Database Utilities
- [ ] Create D1 connection wrapper/helper
- [ ] Implement query builder utilities
- [ ] Create migration runner script
- [ ] Build seed data script for development/testing

---

## Phase 3: R2 Media Storage

### 3.1 R2 Configuration
- [ ] Define R2 bucket structure and naming conventions
- [ ] Create R2 storage service module
- [ ] Implement file upload handler
- [ ] Implement file retrieval with signed URLs
- [ ] Create thumbnail generation utility

### 3.2 Media Management
- [ ] Implement idempotent file storage (dedupe by hash)
- [ ] Create file metadata tracking
- [ ] Build cleanup/retention policy for old files
- [ ] Implement error handling for storage failures

---

## Phase 4: WhatsApp Integration (Kapso)

### 4.1 Webhook Handler
- [ ] Create Worker endpoint for Kapso webhooks
- [ ] Implement webhook signature verification
- [ ] Create message parser for incoming WhatsApp messages
- [ ] Handle media attachments (images, PDFs)
- [ ] Implement acknowledgment response to Kapso

### 4.2 Outbound Messaging
- [ ] Create Kapso API client wrapper
- [ ] Implement template message sender
- [ ] Create confirmation message templates
- [ ] Create error notification templates
- [ ] Implement alert message templates for payments

### 4.3 Message Flow
- [ ] Build message routing logic (commands vs. attachments)
- [ ] Implement conversation state tracking
- [ ] Create user registration/identification system
- [ ] Handle unsupported message types gracefully

---

## Phase 5: OCR & Invoice Processing

### 5.1 Queue Infrastructure
- [ ] Set up Cloudflare Queue for OCR jobs
- [ ] Create queue producer in webhook handler
- [ ] Implement queue consumer Worker
- [ ] Configure retry logic and DLQ

### 5.2 OCR Processing
- [ ] Integrate OCR service (Cloudflare AI, external API, or custom)
- [ ] Implement text extraction from images
- [ ] Implement text extraction from PDFs
- [ ] Create OCR result caching mechanism

### 5.3 Invoice Parsing
- [ ] Build invoice data extraction logic (regex, patterns)
- [ ] Implement vendor recognition/matching
- [ ] Extract key fields: date, amount, tax, invoice number
- [ ] Calculate confidence scores for parsed data
- [ ] Implement fallback/manual review flagging for low confidence

### 5.4 Data Normalization
- [ ] Normalize currency formats
- [ ] Normalize date formats
- [ ] Implement vendor alias matching
- [ ] Auto-categorize based on vendor/patterns
- [ ] Create idempotency checks before D1 write

---

## Phase 6: API Layer (Workers)

### 6.1 Invoice APIs
- [ ] GET /api/invoices - List invoices with filters
- [ ] GET /api/invoices/:id - Get single invoice detail
- [ ] POST /api/invoices - Create invoice manually
- [ ] PATCH /api/invoices/:id - Update invoice
- [ ] DELETE /api/invoices/:id - Soft delete invoice
- [ ] GET /api/invoices/:id/file - Retrieve original file

### 6.2 Vendor APIs
- [ ] GET /api/vendors - List all vendors
- [ ] GET /api/vendors/:id - Get vendor detail
- [ ] POST /api/vendors - Create new vendor
- [ ] PATCH /api/vendors/:id - Update vendor
- [ ] GET /api/vendors/:id/invoices - List vendor's invoices

### 6.3 Category APIs
- [ ] GET /api/categories - List all categories
- [ ] POST /api/categories - Create category
- [ ] PATCH /api/categories/:id - Update category
- [ ] GET /api/categories/:id/stats - Category spending stats

### 6.4 Credit Card APIs
- [ ] GET /api/cards - List all cards
- [ ] GET /api/cards/:id - Get card detail
- [ ] POST /api/cards - Add new card
- [ ] PATCH /api/cards/:id - Update card details
- [ ] GET /api/cards/recommend - Get recommended card for current date

### 6.5 Analytics APIs
- [ ] GET /api/analytics/summary - Monthly/yearly totals
- [ ] GET /api/analytics/trends - Spending trends over time
- [ ] GET /api/analytics/by-category - Category breakdown
- [ ] GET /api/analytics/by-vendor - Vendor breakdown
- [ ] GET /api/analytics/by-card - Card usage stats

### 6.6 Payment APIs
- [ ] GET /api/payments - List payments with filters
- [ ] GET /api/payments/upcoming - Upcoming due payments
- [ ] POST /api/payments - Record payment
- [ ] PATCH /api/payments/:id - Update payment status

---

## Phase 7: Dashboard Frontend (Pages)

### 7.1 Project Setup
- [ ] Initialize React/Vue/Svelte project for Pages
- [ ] Configure Tailwind CSS with theme integration
- [ ] Set up routing (React Router, Vue Router, etc.)
- [ ] Configure API client with base URL
- [ ] Implement authentication/session handling

### 7.2 Layout & Navigation
- [ ] Create responsive app shell layout
- [ ] Build navigation menu component
- [ ] Implement mobile hamburger menu
- [ ] Create breadcrumb navigation
- [ ] Build footer component

### 7.3 Dashboard Home
- [ ] Create KPI cards (total spent, avg invoice, monthly trend)
- [ ] Implement month/year selector
- [ ] Build spending trend chart (line/area chart)
- [ ] Create category breakdown chart (pie/donut chart)
- [ ] Display recent invoices list

### 7.4 Invoice Management
- [ ] Create invoice list page with filters
- [ ] Implement search by vendor, amount, date
- [ ] Build invoice detail modal/page
- [ ] Display original invoice image/PDF
- [ ] Create invoice edit form
- [ ] Implement manual invoice creation form

### 7.5 Vendor Management
- [ ] Create vendor list page
- [ ] Build vendor detail view with invoice history
- [ ] Implement vendor create/edit forms
- [ ] Display vendor spending stats

### 7.6 Category Management
- [ ] Create category list with spending totals
- [ ] Build category detail view
- [ ] Implement category creation/edit
- [ ] Display category spending trends

### 7.7 Credit Card Management
- [ ] Create card list with utilization display
- [ ] Build card detail page with payment schedule
- [ ] Implement card create/edit forms
- [ ] Display closure and due date indicators
- [ ] Show "recommended card" widget

### 7.8 Payment Tracking
- [ ] Create payment calendar view
- [ ] Build upcoming payments list
- [ ] Implement payment status updates
- [ ] Display payment history per card

### 7.9 Charts & Visualizations
- [ ] Integrate charting library (Chart.js, Recharts, etc.)
- [ ] Create reusable chart components
- [ ] Implement responsive chart sizing
- [ ] Add chart data loading states
- [ ] Support theme colors in charts

### 7.10 UI/UX Polish
- [ ] Implement loading skeletons
- [ ] Add error boundaries and error states
- [ ] Create toast notifications
- [ ] Implement form validation with error messages
- [ ] Add confirmation dialogs for destructive actions
- [ ] Ensure accessibility (ARIA labels, keyboard nav)

---

## Phase 8: Credit Card Tracking Logic

### 8.1 Card Cycle Calculations
- [ ] Implement closure date calculator
- [ ] Implement due date calculator
- [ ] Calculate grace period for payments
- [ ] Build "days until closure" utility
- [ ] Build "days until due" utility

### 8.2 Card Recommendation Engine
- [ ] Create algorithm for best card selection
- [ ] Consider closure proximity in recommendations
- [ ] Factor in card utilization limits
- [ ] Build recommendation explanation text

### 8.3 Payment Status Management
- [ ] Implement automatic status transitions
- [ ] Mark overdue payments
- [ ] Calculate payment reminders schedule
- [ ] Track payment confirmation

---

## Phase 9: Alerts & Notifications (Cron)

### 9.1 Cron Trigger Setup
- [ ] Configure Cron Triggers in wrangler.toml
- [ ] Create daily job for payment checks
- [ ] Create weekly job for cycle calculations
- [ ] Implement job execution logging

### 9.2 Payment Reminders
- [ ] Build payment due date checker
- [ ] Implement 7-day advance reminder
- [ ] Implement 3-day advance reminder
- [ ] Implement due date reminder
- [ ] Send reminders via Kapso WhatsApp

### 9.3 Card Recommendation Notifications
- [ ] Calculate optimal card for current cycle
- [ ] Send proactive card suggestions via WhatsApp
- [ ] Include closure date context in message

### 9.4 Summary Reports
- [ ] Generate monthly spending summary
- [ ] Send end-of-month report via WhatsApp
- [ ] Include top vendors and categories

---

## Phase 10: Testing & Quality Assurance

### 10.1 Unit Tests
- [ ] Write tests for utility functions
- [ ] Test data validation logic
- [ ] Test parsing and normalization functions
- [ ] Test calculation functions (dates, amounts)

### 10.2 Integration Tests
- [ ] Test webhook handler end-to-end
- [ ] Test OCR queue processing flow
- [ ] Test API endpoints with mock D1
- [ ] Test Cron job execution

### 10.3 Error Handling & Resilience
- [ ] Implement global error handler in Workers
- [ ] Add retry logic for external API calls
- [ ] Implement circuit breaker for unstable services
- [ ] Log errors to external service (if needed)

### 10.4 Security Hardening
- [ ] Validate all webhook signatures
- [ ] Sanitize user inputs
- [ ] Implement rate limiting on API endpoints
- [ ] Use least-privilege bindings
- [ ] Review secrets management
- [ ] Test for injection vulnerabilities

### 10.5 Performance Optimization
- [ ] Add caching for frequent queries
- [ ] Optimize D1 queries with proper indexes
- [ ] Minimize Worker execution time
- [ ] Optimize R2 access patterns
- [ ] Minimize frontend bundle size

---

## Phase 11: Documentation & Deployment Prep

### 11.1 Documentation
- [ ] Write README with project overview
- [ ] Document API endpoints (OpenAPI/Swagger)
- [ ] Create theme customization guide
- [ ] Document environment variables
- [ ] Write troubleshooting guide

### 11.2 Deployment Checklist
- [ ] Create production environment configuration
- [ ] Document deployment steps
- [ ] Create rollback procedures
- [ ] Set up monitoring and alerting
- [ ] Prepare for infrastructure setup handoff

---

## Implementation Notes

### Technology Stack
- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2
- **Queue**: Cloudflare Queues
- **Scheduling**: Cloudflare Cron Triggers
- **Frontend**: Cloudflare Pages + React/Vue/Svelte
- **Styling**: Tailwind CSS
- **WhatsApp**: Kapso.ai
- **Validation**: Zod
- **Charts**: Chart.js or Recharts

### Theme Configuration Structure
```json
{
  "colors": {
    "primary": {
      "50": "#...",
      "100": "#...",
      ...
      "900": "#..."
    },
    "secondary": { ... },
    "accent": { ... },
    "neutral": { ... },
    "success": { ... },
    "error": { ... },
    "warning": { ... }
  }
}
```

### Success Criteria per Phase
- **Phase 1-2**: Project runs locally, DB schema applied
- **Phase 3**: Files upload to R2 successfully
- **Phase 4**: WhatsApp messages trigger webhook
- **Phase 5**: Invoice images get parsed into D1
- **Phase 6**: All API endpoints return valid responses
- **Phase 7**: Dashboard displays data from APIs
- **Phase 8**: Card recommendation logic works
- **Phase 9**: Cron jobs execute on schedule
- **Phase 10**: Tests pass, security review complete
- **Phase 11**: Ready for infrastructure deployment

---

## Next Steps
1. Review and approve this plan
2. Begin Phase 1: Project Foundation
3. Complete each checkpoint sequentially
4. Validate functionality at each phase boundary
