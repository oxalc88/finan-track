/**
 * API request and response types
 */

import type { Invoice, InvoiceItem, Transaction, Alert } from './database.js';

// Standard API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Invoice API types
export interface UploadInvoiceRequest {
  user_id: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}

export interface ListInvoicesParams extends PaginationParams {
  status?: string;
  start_date?: string;
  end_date?: string;
  vendor_name?: string;
}

// Transaction API types
export interface CreateTransactionRequest {
  account_id?: string;
  category_id?: string;
  invoice_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency?: string;
  description?: string;
  transaction_date: string;
  notes?: string;
}

export interface ListTransactionsParams extends PaginationParams {
  account_id?: string;
  category_id?: string;
  type?: string;
  start_date?: string;
  end_date?: string;
}

// Dashboard summary types
export interface DashboardSummary {
  cash_balance: number;
  total_investments: number;
  total_debt: number;
  net_worth: number;
  accounts: AccountSummary[];
  investments: InvestmentSummary[];
  debts: DebtSummary[];
  credit_cards: CreditCardSummary[];
  recent_transactions: Transaction[];
  upcoming_alerts: Alert[];
}

export interface AccountSummary {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
}

export interface InvestmentSummary {
  type: string;
  total_value: number;
  gain_loss: number;
  gain_loss_percentage: number;
}

export interface DebtSummary {
  type: 'short_term' | 'long_term';
  total_balance: number;
  count: number;
}

export interface CreditCardSummary {
  id: string;
  name: string;
  current_balance: number;
  credit_limit: number;
  utilization_percentage: number;
  due_date: Date | null;
  minimum_payment: number | null;
}

// Cash flow types
export interface CashFlowData {
  period: string; // e.g., '2024-01', '2024-02'
  income: number;
  expenses: number;
  net: number;
}

export interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  amount: number;
  percentage: number;
  transaction_count: number;
}
