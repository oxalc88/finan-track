# Architecture Comparison: Choosing the Right Approach

## TL;DR - Recommendations

| Your Situation | Recommended Architecture |
|----------------|-------------------------|
| Solo developer, MVP | **Layered Functional** ⭐ |
| 2-3 developers, 6-month timeline | **Layered Functional** |
| 5+ developers, complex domain | Feature-Based or Hexagonal |
| Prototype/validation | Minimal |
| Enterprise, multiple teams | Hexagonal |

---

## Side-by-Side Comparison

### File Count & Complexity

**Invoice Feature Implementation**

#### Layered Functional (Recommended for Solo Dev)
```
app/
├── api/routes/invoices.ts          (50 lines - routes only)
├── services/invoice-service.ts     (150 lines - business logic)
├── repositories/invoice-repo.ts    (200 lines - data access)
├── lib/storage.ts                  (100 lines - shared)
├── lib/queue.ts                    (100 lines - shared)
└── types/invoice.ts                (50 lines - types)

Total: 6 files, ~650 lines
```

#### Hexagonal Architecture
```
app/
├── core/
│   ├── domain/entities/Invoice.ts          (100 lines)
│   ├── usecases/ProcessInvoice.usecase.ts (80 lines)
│   ├── usecases/GetInvoices.usecase.ts    (50 lines)
│   ├── usecases/UpdateInvoice.usecase.ts  (40 lines)
│   └── interfaces/
│       ├── IStoragePort.ts                 (30 lines)
│       ├── IDatabasePort.ts                (40 lines)
│       └── IQueuePort.ts                   (25 lines)
├── adapters/
│   ├── storage/
│   │   ├── S3Adapter.ts                    (120 lines)
│   │   ├── R2Adapter.ts                    (120 lines)
│   │   └── MinIOAdapter.ts                 (120 lines)
│   ├── database/
│   │   ├── PostgresAdapter.ts              (200 lines)
│   │   └── D1Adapter.ts                    (200 lines)
│   └── queue/
│       ├── SQSAdapter.ts                   (100 lines)
│       ├── RabbitMQAdapter.ts              (100 lines)
│       └── CloudflareQueuesAdapter.ts      (100 lines)
├── services/InvoiceService.ts              (150 lines)
├── api/
│   ├── controllers/InvoiceController.ts    (100 lines)
│   └── routes/invoices.routes.ts           (40 lines)
└── shared/config/container.ts              (200 lines)

Total: 23 files, ~1,815 lines
```

**Difference:** Hexagonal = **3x more code** for same feature

---

## Code Examples: Same Feature, Different Styles

### Processing an Invoice Upload

#### Layered Functional (Simple)

```typescript
// app/services/invoice-service.ts
import * as storage from '@lib/storage';
import * as queue from '@lib/queue';
import * as invoiceRepo from '@repos/invoice-repo';

export async function processInvoice(data: {
  userId: string;
  file: Buffer;
  fileName: string;
}): Promise<{ success: boolean; invoiceId?: number }> {
  // 1. Upload to storage
  const key = await storage.uploadFile(
    storage.generateInvoiceKey(data.userId, data.fileName),
    data.file
  );

  // 2. Save to database
  const invoice = await invoiceRepo.createInvoice({
    userId: data.userId,
    sourceFileKey: key,
    status: 'pending_ocr',
  });

  // 3. Queue OCR job
  await queue.enqueue('ocr-jobs', {
    invoiceId: invoice.id,
    fileKey: key,
  });

  return { success: true, invoiceId: invoice.id };
}

// app/api/routes/invoices.ts
import * as invoiceService from '@services/invoice-service';

app.post('/invoices', async (req, reply) => {
  const file = await req.file();
  const buffer = await file.toBuffer();

  const result = await invoiceService.processInvoice({
    userId: req.user.id,
    file: buffer,
    fileName: file.filename,
  });

  return result;
});
```

**Lines of code:** ~40 lines total
**Dependencies:** Direct function imports
**Testability:** Mock functions with Vitest

---

#### Hexagonal Architecture (Complex)

```typescript
// app/core/interfaces/IStoragePort.ts
export interface IStoragePort {
  upload(key: string, data: Buffer): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

// app/core/interfaces/IDatabasePort.ts
export interface IDatabasePort {
  invoices: {
    create(data: CreateInvoiceData): Promise<Invoice>;
    findById(id: number): Promise<Invoice | null>;
  };
}

// app/core/interfaces/IQueuePort.ts
export interface IQueuePort {
  enqueue(queue: string, data: any): Promise<void>;
}

// app/core/usecases/ProcessInvoice.usecase.ts
import { injectable, inject } from 'tsyringe';
import { IStoragePort } from '../interfaces/IStoragePort';
import { IDatabasePort } from '../interfaces/IDatabasePort';
import { IQueuePort } from '../interfaces/IQueuePort';

@injectable()
export class ProcessInvoiceUseCase {
  constructor(
    @inject('StoragePort') private storage: IStoragePort,
    @inject('DatabasePort') private database: IDatabasePort,
    @inject('QueuePort') private queue: IQueuePort
  ) {}

  async execute(input: ProcessInvoiceInput): Promise<ProcessInvoiceOutput> {
    const key = this.generateKey(input.userId, input.fileName);
    await this.storage.upload(key, input.file);

    const invoice = await this.database.invoices.create({
      userId: input.userId,
      sourceFileKey: key,
      status: 'pending_ocr',
    });

    await this.queue.enqueue('ocr-jobs', {
      invoiceId: invoice.id,
      fileKey: key,
    });

    return { success: true, invoiceId: invoice.id };
  }

  private generateKey(userId: string, fileName: string): string {
    return `invoices/${userId}/${Date.now()}-${fileName}`;
  }
}

// app/adapters/storage/S3Adapter.ts
import { S3Client } from '@aws-sdk/client-s3';
import { injectable } from 'tsyringe';
import { IStoragePort } from '@core/interfaces/IStoragePort';

@injectable()
export class S3Adapter implements IStoragePort {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({...});
  }

  async upload(key: string, data: Buffer): Promise<string> {
    // Implementation
  }

  async download(key: string): Promise<Buffer> {
    // Implementation
  }

  async delete(key: string): Promise<void> {
    // Implementation
  }
}

// app/shared/config/container.ts
import 'reflect-metadata';
import { container } from 'tsyringe';

export async function registerAdapters() {
  const config = loadConfig();

  switch (config.STORAGE_ADAPTER) {
    case 's3':
      container.register('StoragePort', { useClass: S3Adapter });
      break;
    case 'r2':
      container.register('StoragePort', { useClass: R2Adapter });
      break;
  }

  // Register other adapters...
}

// app/api/controllers/InvoiceController.ts
import { container } from 'tsyringe';
import { ProcessInvoiceUseCase } from '@core/usecases/ProcessInvoice.usecase';

export class InvoiceController {
  async create(req: Request, reply: Reply): Promise<void> {
    const useCase = container.resolve(ProcessInvoiceUseCase);
    const file = await req.file();

    const result = await useCase.execute({
      userId: req.user.id,
      file: await file.toBuffer(),
      fileName: file.filename,
    });

    reply.send(result);
  }
}

// app/api/routes/invoices.routes.ts
import { InvoiceController } from '../controllers/InvoiceController';

const controller = new InvoiceController();

app.post('/invoices', (req, reply) => controller.create(req, reply));
```

**Lines of code:** ~200+ lines total
**Dependencies:** DI container, interfaces, adapters, use cases
**Testability:** Mock interfaces (complex setup)

---

## Pros & Cons

### Layered Functional ⭐

**Pros:**
- ✅ **Fast to build** - 3x less code
- ✅ **Easy to understand** - Clear function flow
- ✅ **Simple debugging** - Direct function calls
- ✅ **Quick to change** - Edit one file
- ✅ **Still cloud-agnostic** - Via configuration
- ✅ **Testable** - Mock functions easily
- ✅ **Perfect for solo dev** - Less cognitive load

**Cons:**
- ❌ Services can grow large (but manageable with complexity rules)
- ❌ Slightly harder to swap entire providers (but you rarely need to)
- ❌ Less "textbook perfect" architecture

**Best for:**
- Solo developers
- MVPs and startups
- Teams < 5 people
- Time-sensitive projects

---

### Hexagonal Architecture

**Pros:**
- ✅ Perfect abstraction boundaries
- ✅ Theoretically swappable adapters
- ✅ Textbook clean architecture
- ✅ Good for multiple teams
- ✅ Excellent for complex domains

**Cons:**
- ❌ **3x more code** for same functionality
- ❌ **Slower to build** - More files, more boilerplate
- ❌ **Higher complexity** - Interfaces, DI, adapters
- ❌ **Harder to debug** - More indirection
- ❌ **Over-engineering for simple CRUD**
- ❌ **Steep learning curve**

**Best for:**
- Enterprise applications
- Teams > 10 people
- Complex business domains (banking, healthcare)
- Projects with 2+ year timelines

---

## Real-World Scenario

### Switching from MinIO to S3

**Layered Functional:**
```typescript
// app/lib/storage.ts - Change one line

// Before (MinIO)
s3Client = new S3Client({
  endpoint: 'http://localhost:9000',
  forcePathStyle: true,
});

// After (AWS S3)
s3Client = new S3Client({
  endpoint: 'https://s3.amazonaws.com',
  forcePathStyle: false,
});
```

Or just change `.env`:
```bash
# Before
STORAGE_ENDPOINT=http://localhost:9000

# After
STORAGE_ENDPOINT=https://s3.amazonaws.com
```

**Time to switch:** 1 minute

---

**Hexagonal:**
```typescript
// app/shared/config/container.ts - Change registration

// Before
container.register('StoragePort', { useClass: MinIOAdapter });

// After
container.register('StoragePort', { useClass: S3Adapter });
```

Or change `.env`:
```bash
# Before
STORAGE_ADAPTER=minio

# After
STORAGE_ADAPTER=s3
```

**Time to switch:** 1 minute

**Conclusion:** Both are equally cloud-agnostic! Hexagonal adds complexity without real benefit here.

---

## When Hexagonal Actually Helps

Hexagonal is valuable when:

1. **Multiple implementations in production simultaneously**
   ```typescript
   // Route USA traffic to S3, EU traffic to R2
   if (user.region === 'EU') {
     container.register('StoragePort', R2Adapter);
   } else {
     container.register('StoragePort', S3Adapter);
   }
   ```

2. **Complex business rules tested in isolation**
   ```typescript
   // Test payment logic without touching databases
   const mockPaymentGateway = createMock<IPaymentPort>();
   const useCase = new ProcessPaymentUseCase(mockPaymentGateway);
   ```

3. **Multiple teams working on different adapters**
   - Team A builds core domain
   - Team B builds AWS adapters
   - Team C builds Azure adapters

**For your invoice app:** None of these apply → Layered is better.

---

## Decision Matrix

| Criteria | Layered | Hexagonal |
|----------|---------|-----------|
| Team size: 1-2 | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Team size: 3-5 | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Team size: 10+ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Time to MVP | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Maintainability | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Testability | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Cloud agnostic | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Learning curve | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Debugging | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| CRUD apps | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Complex domains | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## Final Recommendation

For your invoice processing app as a solo developer:

**Go with Layered Functional Architecture.**

You get:
- ✅ Cloud-agnostic (via config)
- ✅ Infrastructure separation (via Terraform)
- ✅ Clean code (via complexity rules)
- ✅ Fast development
- ✅ Easy maintenance
- ✅ Production-ready

**Save hexagonal for when:**
- You have 5+ developers
- You need multiple provider implementations running simultaneously
- Your domain is genuinely complex (not just CRUD)

---

## Migration Path

**Start simple, evolve as needed:**

1. **Day 1-30:** Layered functional (fast MVP)
2. **Month 2-6:** Add features, keep it simple
3. **Month 6+:** If team grows or complexity demands it, refactor to hexagonal

**Pro tip:** It's easier to go from Layered → Hexagonal than Hexagonal → Layered.

Start simple. Add complexity only when needed. 🎯
