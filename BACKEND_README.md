# Backend Implementation - OCR & Financial Dashboard API

## Overview

This is the backend implementation for the finan-track application, featuring:

- **OCR Invoice Processing**: Upload invoices via WhatsApp → OCR extraction → Structured data
- **Financial Dashboard API**: Complete REST API for accounts, investments, debts, credit cards, transactions, and alerts
- **Cloud-Agnostic Architecture**: Works with AWS, Cloudflare, or local infrastructure

## What's Been Implemented

### ✅ Database Schema
- 10 database tables covering all financial entities
- Migrations with proper indexing and relationships
- Support for users, accounts, investments, debts, credit cards, categories, invoices, invoice items, transactions, and alerts

### ✅ Configuration & Infrastructure
- Environment validation with Zod
- Cloud-agnostic configuration system
- Database connection pooling (PostgreSQL)
- Structured logging with Pino

### ✅ Libraries (Cloud-Agnostic)
- **Storage**: S3-compatible (AWS S3, Cloudflare R2, MinIO)
- **OCR**: Tesseract.js (local, no API keys needed)
- Extensible for AWS Textract and Cloudflare AI

### ✅ Repositories (Data Access Layer)
- Invoice repository with full CRUD operations
- Transaction repository with analytics
- Pagination, filtering, and sorting support
- Type-safe database queries

### ✅ Services (Business Logic)
- **OCR Service**: Upload → Process → Extract invoice data
- Automatic invoice processing workflow
- Error handling and retry capabilities

### ✅ API Routes
- **Invoice API**: Upload, list, get, delete, reprocess
- **Transaction API**: Create, list, get, delete, analytics
- Cash flow summary and category breakdown endpoints
- Multipart file upload support

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment

Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your database URL and storage configuration.

### 3. Start Local Services (Optional)

If using local PostgreSQL and MinIO:

```bash
npm run docker:up
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Start the Server

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm run start
```

## API Endpoints

### Invoices

```bash
# Upload invoice for OCR processing
POST /api/invoices/upload
Content-Type: multipart/form-data
Body: { user_id: "uuid", file: <invoice-image> }

# Get invoice with items
GET /api/invoices/:id

# List invoices
GET /api/invoices?user_id=uuid&status=completed&page=1&limit=20

# Delete invoice
DELETE /api/invoices/:id

# Reprocess invoice
POST /api/invoices/:id/reprocess
```

### Transactions

```bash
# Create transaction
POST /api/transactions
Body: {
  user_id: "uuid",
  type: "expense",
  amount: 125.50,
  transaction_date: "2024-01-15",
  category_id: "uuid",
  description: "Grocery shopping"
}

# List transactions
GET /api/transactions?user_id=uuid&start_date=2024-01-01&end_date=2024-01-31

# Get cash flow summary
GET /api/transactions/analytics/cash-flow?user_id=uuid&start_date=2024-01-01&end_date=2024-12-31&group_by=month

# Get category breakdown
GET /api/transactions/analytics/categories?user_id=uuid&start_date=2024-01-01&end_date=2024-12-31&type=expense
```

## OCR Workflow

1. **Upload**: User sends invoice image via WhatsApp (Kapso.ai webhook)
2. **Store**: File uploaded to S3-compatible storage
3. **Record**: Invoice record created in database (status: `pending`)
4. **Process**: OCR runs asynchronously (Tesseract.js)
5. **Extract**: Vendor, amount, date, items extracted from image
6. **Update**: Invoice marked as `completed` with extracted data
7. **Notify**: User receives structured invoice data

## Code Quality

Run checks before committing:

```bash
# Type check
npm run typecheck

# Lint and format
npm run format

# Run all checks
npm run check
```

## Architecture

This backend follows a **layered functional architecture**:

```
Routes (HTTP) → Services (Business Logic) → Repositories (Data) → Libraries (External Services)
```

- **No classes** - Everything uses pure functions
- **Cloud-agnostic** - Switch providers via environment variables
- **Type-safe** - Full TypeScript coverage
- **Simple** - Direct imports, no DI container

## What's Next?

### To Complete the Backend:

1. **Add remaining repositories**: accounts, investments, debts, credit_cards, alerts
2. **Add dashboard service**: Aggregate data for dashboard summary
3. **Add WhatsApp webhook**: Handle incoming messages from Kapso.ai
4. **Add authentication**: JWT or session-based auth
5. **Add background worker**: Process OCR jobs from a queue
6. **Add tests**: Unit and integration tests

### Frontend Integration:

The frontend dashboard should consume these APIs to display:
- Financial overview (cash, investments, debts, net worth)
- Transaction history
- OCR-processed invoices
- Cash flow charts
- Category breakdowns

## Testing the API

### Upload an Invoice

```bash
curl -X POST http://localhost:3000/api/invoices/upload \
  -F "user_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "file=@/path/to/invoice.jpg"
```

### Get Invoices

```bash
curl "http://localhost:3000/api/invoices?user_id=123e4567-e89b-12d3-a456-426614174000"
```

### Create Transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "123e4567-e89b-12d3-a456-426614174000",
    "type": "expense",
    "amount": 50.00,
    "transaction_date": "2024-01-15",
    "description": "Lunch"
  }'
```

## Environment Variables

Key configuration:

- `DATABASE_URL`: PostgreSQL connection string
- `STORAGE_ENDPOINT`: S3 endpoint (for MinIO: `http://localhost:9000`)
- `STORAGE_BUCKET`: Bucket name for invoice files
- `OCR_PROVIDER`: `tesseract`, `textract`, or `cloudflare-ai`

See `.env.example` for all options.

## Troubleshooting

### OCR Not Working

1. Check Tesseract.js is installed: `npm list tesseract.js`
2. Check file upload size limits (default: 10MB)
3. Check logs for OCR errors
4. Try reprocessing: `POST /api/invoices/:id/reprocess`

### Database Connection Failed

1. Ensure PostgreSQL is running: `docker compose ps`
2. Check `DATABASE_URL` in `.env`
3. Run migrations: `npm run migrate`

### Storage Upload Failed

1. Check MinIO/S3 is accessible
2. Verify `STORAGE_*` credentials in `.env`
3. Ensure bucket exists and is writable

## Support

For questions or issues, refer to:
- `LAYERED_ARCHITECTURE.md` - Architecture overview
- `CLAUDE.md` - Development guidelines
- `DATABASE_SCHEMA.md` - Database design
