import type { Account, CashFlowData, ConciliationMatch, ConciliationRow, CreditCard, DiscrepancyRow, DocumentPipelineRow, ExpenseCategory, QueryResult } from './domain.js';

export type { Account, CashFlowData, ConciliationMatch, ConciliationRow, CreditCard, DiscrepancyRow, DocumentPipelineRow, ExpenseCategory, QueryResult };

export interface DashboardData {
  overview: {
    cashBalance: number;
    totalDebt: number;
    netWorth: number;
    changes: {
      cashBalance: number;
      totalDebt: number;
      netWorth: number;
    };
  };
  accounts: Account[];
  creditCards: CreditCard[];
  cashFlow: CashFlowData[];
  expenseCategories: ExpenseCategory[];
}
