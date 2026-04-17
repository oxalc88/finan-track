export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'savings' | 'investment';
  balance: number;
  currency: string;
}

export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  creditLimit: number;
  minimumPayment: number;
  dueDate: string;
  utilizationPercentage: number;
}

export interface CashFlowData {
  month: string;
  income: number;
  expenses: number;
}

export interface ExpenseCategory {
  category: string;
  amount: number;
  percentage: number;
}

export interface DocumentPipelineRow {
  id: string;
  receivedAt: string;
  channel: string;
  type: string;
  entity: string;
  status: 'pending' | 'processing' | 'processed' | 'failed';
  fileUrl?: string;
}

export interface ConciliationRow {
  id: string;
  period: string;
  entityName: string;
  productName: string;
  status: 'pending' | 'matched' | 'discrepancy';
  totalTransactions: number;
}

export interface ConciliationMatch {
  id: string;
  description: string;
  statementAmount: number;
  systemAmount: number;
  date: string;
}

export interface DiscrepancyRow {
  id: string;
  description: string;
  statementAmount: number;
  systemAmount: number;
  difference: number;
  date: string;
  status: 'pending' | 'resolved' | 'ignored';
}

export interface QueryResult {
  answer: string;
  sql?: string;
  data?: Record<string, unknown>[];
}
