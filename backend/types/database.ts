/**
 * Database entity types
 * These types match the PostgreSQL schema exactly
 */

// Enum types
export type AccountType = 'checking' | 'savings' | 'cash' | 'other';

export type InvestmentType = 'stocks' | 'bonds' | 'real_estate' | 'crypto' | 'other';

export type DebtTermType = 'short_term' | 'long_term';

export type DebtCategory = 'loan' | 'mortgage' | 'student_loan' | 'personal_loan' | 'other';

export type CategoryType = 'income' | 'expense';

export type OcrStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type AlertType =
  | 'bill_reminder'
  | 'payment_confirmation'
  | 'credit_warning'
  | 'low_balance'
  | 'other';

export type AlertPriority = 'low' | 'medium' | 'high';

// Entity interfaces
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  institution: string | null;
  account_number: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Investment {
  id: string;
  user_id: string;
  type: InvestmentType;
  name: string;
  symbol: string | null;
  quantity: number | null;
  purchase_price: number | null;
  current_value: number;
  currency: string;
  purchase_date: Date | null;
  notes: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  type: DebtTermType;
  category: DebtCategory;
  principal_amount: number;
  current_balance: number;
  interest_rate: number | null;
  minimum_payment: number | null;
  due_date: Date | null;
  lender: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreditCard {
  id: string;
  user_id: string;
  name: string;
  last_four: string | null;
  issuer: string | null;
  current_balance: number;
  credit_limit: number;
  available_credit: number;
  minimum_payment: number | null;
  due_date: Date | null;
  statement_closing_date: Date | null;
  apr: number | null;
  utilization_percentage: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  type: CategoryType;
  color: string | null;
  icon: string | null;
  parent_id: string | null;
  is_system: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Invoice {
  id: string;
  user_id: string;
  file_key: string;
  file_url: string | null;
  file_type: string | null;
  ocr_status: OcrStatus;
  vendor_name: string | null;
  invoice_number: string | null;
  invoice_date: Date | null;
  due_date: Date | null;
  subtotal: number | null;
  tax: number | null;
  total: number | null;
  currency: string | null;
  raw_ocr_text: string | null;
  ocr_data: Record<string, unknown> | null;
  confidence_score: number | null;
  error_message: string | null;
  processed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string | null;
  quantity: number | null;
  unit_price: number | null;
  amount: number | null;
  line_number: number | null;
  created_at: Date;
}

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string | null;
  category_id: string | null;
  invoice_id: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  description: string | null;
  transaction_date: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  priority: AlertPriority;
  title: string;
  message: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  scheduled_for: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Input types for creating entities (without generated/auto fields)
export interface CreateUserInput {
  email: string;
  name: string;
  phone?: string | null;
}

export interface CreateAccountInput {
  user_id: string;
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
  institution?: string | null;
  account_number?: string | null;
}

export interface CreateInvestmentInput {
  user_id: string;
  type: InvestmentType;
  name: string;
  symbol?: string | null;
  quantity?: number | null;
  purchase_price?: number | null;
  current_value: number;
  currency?: string;
  purchase_date?: Date | null;
  notes?: string | null;
}

export interface CreateDebtInput {
  user_id: string;
  name: string;
  type: DebtTermType;
  category: DebtCategory;
  principal_amount: number;
  current_balance: number;
  interest_rate?: number | null;
  minimum_payment?: number | null;
  due_date?: Date | null;
  lender?: string | null;
}

export interface CreateCreditCardInput {
  user_id: string;
  name: string;
  last_four?: string | null;
  issuer?: string | null;
  current_balance?: number;
  credit_limit: number;
  minimum_payment?: number | null;
  due_date?: Date | null;
  statement_closing_date?: Date | null;
  apr?: number | null;
}

export interface CreateCategoryInput {
  user_id?: string | null;
  name: string;
  type: CategoryType;
  color?: string | null;
  icon?: string | null;
  parent_id?: string | null;
}

export interface CreateInvoiceInput {
  user_id: string;
  file_key: string;
  file_url?: string | null;
  file_type?: string | null;
}

export interface CreateInvoiceItemInput {
  invoice_id: string;
  description?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  amount?: number | null;
  line_number?: number | null;
}

export interface CreateTransactionInput {
  user_id: string;
  account_id?: string | null;
  category_id?: string | null;
  invoice_id?: string | null;
  type: TransactionType;
  amount: number;
  currency?: string;
  description?: string | null;
  transaction_date: Date;
  notes?: string | null;
}

export interface CreateAlertInput {
  user_id: string;
  type: AlertType;
  priority?: AlertPriority;
  title: string;
  message: string;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  scheduled_for?: Date | null;
}

// Update types (all fields optional except id)
export interface UpdateAccountInput {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
  institution?: string | null;
  account_number?: string | null;
  is_active?: boolean;
}

export interface UpdateInvoiceInput {
  ocr_status?: OcrStatus;
  vendor_name?: string | null;
  invoice_number?: string | null;
  invoice_date?: Date | null;
  due_date?: Date | null;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  currency?: string | null;
  raw_ocr_text?: string | null;
  ocr_data?: Record<string, unknown> | null;
  confidence_score?: number | null;
  error_message?: string | null;
  processed_at?: Date | null;
}

export interface UpdateCreditCardInput {
  name?: string;
  last_four?: string | null;
  issuer?: string | null;
  current_balance?: number;
  credit_limit?: number;
  minimum_payment?: number | null;
  due_date?: Date | null;
  statement_closing_date?: Date | null;
  apr?: number | null;
  is_active?: boolean;
}
