# Quick Start Guide

This guide helps you jump into implementation quickly by providing phase-specific starting points.

## Before You Begin

1. Read the [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) to understand the full scope
2. Review the [README.md](./README.md) for architecture overview
3. Ensure you have the prerequisites installed (Node.js 18+, Wrangler CLI)

## Phase-by-Phase Quickstart

### Phase 1: Project Foundation (Start Here)

**Goal**: Set up the monorepo structure with Workers and Pages

**Tasks**:
1. Initialize the workspace:
   ```bash
   npm init -y
   npm install -D wrangler typescript @cloudflare/workers-types
   ```

2. Create directory structure:
   ```bash
   mkdir -p workers/{webhook,api,ocr-processor,cron}
   mkdir -p frontend/src/{components,pages,lib,styles}
   mkdir -p shared/{types,validators,utils}
   mkdir -p migrations
   ```

3. Initialize TypeScript:
   ```bash
   npx tsc --init
   ```
   Set `strict: true`, `target: "ES2022"`, `module: "ESNext"`

4. Create `wrangler.toml` in each worker directory

**Checkpoint**: Run `wrangler dev` in any worker directory successfully

---

### Phase 2: Database Schema

**Goal**: Define D1 schema and create TypeScript types

**Start with**:
1. Create `migrations/0001_initial_schema.sql`:
   ```sql
   CREATE TABLE invoices (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     vendor_id INTEGER,
     date TEXT NOT NULL,
     amount REAL NOT NULL,
     -- ... other fields
   );
   ```

2. Create `shared/types/entities.ts`:
   ```typescript
   export interface Invoice {
     id: number;
     vendorId: number;
     date: string;
     amount: number;
     // ...
   }
   ```

3. Apply migration:
   ```bash
   wrangler d1 execute <DB_NAME> --file=migrations/0001_initial_schema.sql
   ```

**Checkpoint**: Query tables successfully with `wrangler d1 execute`

---

### Phase 3: R2 Storage

**Goal**: Implement file upload and retrieval

**Start with**:
1. Bind R2 bucket in `wrangler.toml`:
   ```toml
   [[r2_buckets]]
   binding = "INVOICES_BUCKET"
   bucket_name = "invoices"
   ```

2. Create `shared/utils/storage.ts`:
   ```typescript
   export async function uploadFile(
     bucket: R2Bucket,
     key: string,
     file: ArrayBuffer
   ): Promise<void> {
     await bucket.put(key, file);
   }
   ```

**Checkpoint**: Upload and retrieve a test file

---

### Phase 4: WhatsApp Integration

**Goal**: Receive webhook POSTs from Kapso

**Start with**:
1. Create `workers/webhook/src/index.ts`:
   ```typescript
   export default {
     async fetch(request: Request, env: Env): Promise<Response> {
       if (request.method !== 'POST') {
         return new Response('Method not allowed', { status: 405 });
       }

       const payload = await request.json();
       // Verify signature
       // Process message

       return new Response('OK', { status: 200 });
     }
   };
   ```

2. Deploy and register webhook URL with Kapso

**Checkpoint**: Receive and log a WhatsApp message

---

### Phase 5: OCR Processing

**Goal**: Process invoices asynchronously via Queues

**Start with**:
1. Add queue binding to webhook worker's `wrangler.toml`:
   ```toml
   [[queues.producers]]
   queue = "ocr-jobs"
   binding = "OCR_QUEUE"
   ```

2. Create queue consumer in `workers/ocr-processor/src/index.ts`:
   ```typescript
   export default {
     async queue(batch: MessageBatch, env: Env): Promise<void> {
       for (const message of batch.messages) {
         // Fetch file from R2
         // Run OCR
         // Parse data
         // Write to D1
         message.ack();
       }
     }
   };
   ```

**Checkpoint**: End-to-end flow from webhook to D1 record

---

### Phase 6: API Layer

**Goal**: Expose REST endpoints for dashboard

**Start with**:
1. Create `workers/api/src/index.ts` with Hono or itty-router:
   ```typescript
   import { Hono } from 'hono';

   const app = new Hono();

   app.get('/api/invoices', async (c) => {
     const results = await c.env.DB.prepare(
       'SELECT * FROM invoices ORDER BY date DESC LIMIT 50'
     ).all();
     return c.json(results);
   });

   export default app;
   ```

**Checkpoint**: All CRUD endpoints return valid JSON

---

### Phase 7: Dashboard Frontend

**Goal**: Build responsive UI with Tailwind

**Start with**:
1. Initialize Vite + React (or your framework):
   ```bash
   cd frontend
   npm create vite@latest . -- --template react-ts
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```

2. Configure Tailwind to read `theme.config.json`:
   ```javascript
   // tailwind.config.js
   const theme = require('../theme.config.json');

   module.exports = {
     content: ['./src/**/*.{js,jsx,ts,tsx}'],
     theme: {
       extend: {
         colors: theme.colors,
       },
     },
   };
   ```

3. Create layout and first page:
   ```tsx
   // src/pages/Dashboard.tsx
   export function Dashboard() {
     return (
       <div className="bg-neutral-50 min-h-screen">
         <h1 className="text-primary-600">Dashboard</h1>
       </div>
     );
   }
   ```

**Checkpoint**: Pages deployed and accessible

---

### Phase 8: Credit Card Tracking

**Goal**: Implement card cycle calculations

**Start with**:
1. Create `shared/utils/card-cycles.ts`:
   ```typescript
   export function getNextClosureDate(
     closureDay: number,
     referenceDate: Date = new Date()
   ): Date {
     // Calculate next closure based on current date
   }

   export function getDaysUntilClosure(closureDay: number): number {
     // Calculate days remaining
   }
   ```

2. Add recommendation logic:
   ```typescript
   export function recommendCard(
     cards: CreditCard[],
     currentDate: Date
   ): CreditCard {
     // Return card with most days until closure
   }
   ```

**Checkpoint**: Recommendation logic returns correct card

---

### Phase 9: Alerts & Notifications

**Goal**: Send scheduled reminders

**Start with**:
1. Create `workers/cron/src/index.ts`:
   ```typescript
   export default {
     async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
       // Query upcoming payments
       const payments = await env.DB.prepare(
         'SELECT * FROM payments WHERE due_date <= date("now", "+7 days")'
       ).all();

       // Send WhatsApp alerts via Kapso
       for (const payment of payments.results) {
         await sendKapsoMessage(env, payment);
       }
     }
   };
   ```

2. Configure cron trigger in `wrangler.toml`:
   ```toml
   [triggers]
   crons = ["0 9 * * *"]  # Daily at 9 AM
   ```

**Checkpoint**: Cron executes and sends test message

---

### Phase 10: Testing

**Goal**: Add test coverage

**Start with**:
1. Install Vitest:
   ```bash
   npm install -D vitest @cloudflare/vitest-pool-workers
   ```

2. Create test files alongside source:
   ```typescript
   // shared/utils/card-cycles.test.ts
   import { describe, it, expect } from 'vitest';
   import { getNextClosureDate } from './card-cycles';

   describe('getNextClosureDate', () => {
     it('calculates next closure correctly', () => {
       // Test cases
     });
   });
   ```

**Checkpoint**: All tests pass with `npm test`

---

## Development Tips

### Monorepo Structure
Use a workspace manager (npm workspaces, pnpm, or Turborepo) to link shared packages:

```json
{
  "workspaces": [
    "workers/*",
    "frontend",
    "shared"
  ]
}
```

### Local Development
- Use `wrangler dev --local` for Workers
- Use `wrangler pages dev frontend/dist` for Pages
- Use `miniflare` for full local stack

### Environment Variables
Keep `.dev.vars` in each worker directory:
```
KAPSO_API_KEY=test_key_here
```

### Debugging
- Workers: `console.log()` appears in `wrangler dev` output
- Use `wrangler tail` for live production logs
- Enable source maps in `tsconfig.json`

## Common Patterns

### Error Handling in Workers
```typescript
try {
  // Worker logic
} catch (error) {
  console.error('Worker error:', error);
  return new Response('Internal Server Error', { status: 500 });
}
```

### D1 Query Pattern
```typescript
const stmt = env.DB.prepare('SELECT * FROM invoices WHERE id = ?');
const result = await stmt.bind(invoiceId).first();
```

### R2 Upload Pattern
```typescript
const key = `invoices/${Date.now()}-${filename}`;
await env.BUCKET.put(key, fileBuffer, {
  httpMetadata: { contentType: 'image/jpeg' }
});
```

## Next Steps After Scaffolding

1. **Set up CI/CD**: GitHub Actions for automated deployments
2. **Add monitoring**: Sentry, LogPush, or Analytics Engine
3. **Implement auth**: Cloudflare Access or custom JWT
4. **Add tests**: Unit tests for utilities, integration tests for Workers

## Getting Help

- Cloudflare Docs: https://developers.cloudflare.com/
- Kapso Docs: https://docs.kapso.ai/
- Discord: Cloudflare Developers Discord

---

**Remember**: Complete each phase's checkpoint before moving to the next. This ensures a solid foundation and makes debugging easier.
