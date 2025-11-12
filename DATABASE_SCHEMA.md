# Database Schema Design

## Overview
This schema supports the financial dashboard with OCR invoice processing capabilities.

## Tables

### Core User & Authentication
- **users** - User accounts and profiles

### Financial Entities
- **accounts** - Bank accounts, savings accounts, cash accounts
- **investments** - Investment holdings (stocks, bonds, real estate, crypto)
- **debts** - Short-term and long-term debts
- **credit_cards** - Credit card tracking with payment due dates

### Transaction & Cash Flow
- **categories** - Transaction categorization (income, expense types)
- **transactions** - Financial transactions for cash flow tracking
- **invoices** - OCR-processed invoices and receipts
- **invoice_items** - Line items extracted from invoices

### Notifications
- **alerts** - Bill reminders, payment confirmations, warnings

## Detailed Schema

### users
```sql
- id: uuid PRIMARY KEY
- email: varchar(255) UNIQUE NOT NULL
- name: varchar(255) NOT NULL
- phone: varchar(50) (for WhatsApp integration)
- created_at: timestamp
- updated_at: timestamp
```

### accounts
```sql
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id)
- name: varchar(255) NOT NULL
- type: enum('checking', 'savings', 'cash', 'other')
- balance: decimal(15,2) NOT NULL DEFAULT 0
- currency: varchar(3) DEFAULT 'USD'
- institution: varchar(255)
- account_number: varchar(100) (encrypted/masked)
- is_active: boolean DEFAULT true
- created_at: timestamp
- updated_at: timestamp
```

### investments
```sql
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id)
- type: enum('stocks', 'bonds', 'real_estate', 'crypto', 'other')
- name: varchar(255) NOT NULL
- symbol: varchar(20) (for stocks/crypto)
- quantity: decimal(15,4)
- purchase_price: decimal(15,2)
- current_value: decimal(15,2) NOT NULL
- currency: varchar(3) DEFAULT 'USD'
- purchase_date: date
- notes: text
- is_active: boolean DEFAULT true
- created_at: timestamp
- updated_at: timestamp
```

### debts
```sql
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id)
- name: varchar(255) NOT NULL
- type: enum('short_term', 'long_term')
- category: enum('loan', 'mortgage', 'student_loan', 'personal_loan', 'other')
- principal_amount: decimal(15,2) NOT NULL
- current_balance: decimal(15,2) NOT NULL
- interest_rate: decimal(5,2)
- minimum_payment: decimal(10,2)
- due_date: date
- lender: varchar(255)
- is_active: boolean DEFAULT true
- created_at: timestamp
- updated_at: timestamp
```

### credit_cards
```sql
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id)
- name: varchar(255) NOT NULL
- last_four: varchar(4)
- issuer: varchar(255)
- current_balance: decimal(15,2) NOT NULL DEFAULT 0
- credit_limit: decimal(15,2) NOT NULL
- available_credit: decimal(15,2) GENERATED ALWAYS AS (credit_limit - current_balance) STORED
- minimum_payment: decimal(10,2)
- due_date: date
- statement_closing_date: date
- apr: decimal(5,2)
- utilization_percentage: decimal(5,2) GENERATED ALWAYS AS ((current_balance / NULLIF(credit_limit, 0)) * 100) STORED
- is_active: boolean DEFAULT true
- created_at: timestamp
- updated_at: timestamp
```

### categories
```sql
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id) (NULL for system categories)
- name: varchar(100) NOT NULL
- type: enum('income', 'expense')
- color: varchar(7) (hex color for UI)
- icon: varchar(50)
- parent_id: uuid REFERENCES categories(id) (for subcategories)
- is_system: boolean DEFAULT false
- created_at: timestamp
- updated_at: timestamp
```

### transactions
```sql
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id)
- account_id: uuid REFERENCES accounts(id)
- category_id: uuid REFERENCES categories(id)
- invoice_id: uuid REFERENCES invoices(id) (nullable, links to OCR invoice)
- type: enum('income', 'expense', 'transfer')
- amount: decimal(15,2) NOT NULL
- currency: varchar(3) DEFAULT 'USD'
- description: text
- transaction_date: date NOT NULL
- notes: text
- created_at: timestamp
- updated_at: timestamp
```

### invoices
```sql
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id)
- file_key: varchar(500) NOT NULL (S3/R2 storage key)
- file_url: varchar(1000)
- file_type: varchar(50) (image/pdf)
- ocr_status: enum('pending', 'processing', 'completed', 'failed') DEFAULT 'pending'
- vendor_name: varchar(255)
- invoice_number: varchar(100)
- invoice_date: date
- due_date: date
- subtotal: decimal(15,2)
- tax: decimal(15,2)
- total: decimal(15,2)
- currency: varchar(3) DEFAULT 'USD'
- raw_ocr_text: text
- ocr_data: jsonb (full OCR response)
- confidence_score: decimal(5,2)
- error_message: text
- processed_at: timestamp
- created_at: timestamp
- updated_at: timestamp
```

### invoice_items
```sql
- id: uuid PRIMARY KEY
- invoice_id: uuid REFERENCES invoices(id) ON DELETE CASCADE
- description: text
- quantity: decimal(10,2)
- unit_price: decimal(15,2)
- amount: decimal(15,2)
- line_number: integer
- created_at: timestamp
```

### alerts
```sql
- id: uuid PRIMARY KEY
- user_id: uuid REFERENCES users(id)
- type: enum('bill_reminder', 'payment_confirmation', 'credit_warning', 'low_balance', 'other')
- priority: enum('low', 'medium', 'high') DEFAULT 'medium'
- title: varchar(255) NOT NULL
- message: text NOT NULL
- related_entity_type: varchar(50) (e.g., 'credit_card', 'debt', 'account')
- related_entity_id: uuid
- is_read: boolean DEFAULT false
- scheduled_for: timestamp
- created_at: timestamp
- updated_at: timestamp
```

## Indexes

### Performance Indexes
```sql
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_debts_user_id ON debts(user_id);
CREATE INDEX idx_credit_cards_user_id ON credit_cards(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(ocr_status);
CREATE INDEX idx_alerts_user_id_read ON alerts(user_id, is_read);
```

## Notes

- All monetary values use `decimal(15,2)` for precision
- All tables include `created_at` and `updated_at` timestamps
- User isolation via `user_id` foreign keys
- Soft deletes via `is_active` flags where applicable
- Generated columns for credit card utilization
- JSONB for flexible OCR data storage
- Proper indexes for common queries
