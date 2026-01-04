/**
 * Dashboard service - Aggregates all financial data for the dashboard
 */

import * as accountRepo from '../repositories/account-repository.js';
import * as alertRepo from '../repositories/alert-repository.js';
import * as creditCardRepo from '../repositories/credit-card-repository.js';
import * as debtRepo from '../repositories/debt-repository.js';
import * as investmentRepo from '../repositories/investment-repository.js';
import * as transactionRepo from '../repositories/transaction-repository.js';
import type {
  AccountSummary,
  CreditCardSummary,
  DashboardSummary,
  DebtSummary,
  InvestmentSummary,
} from '../types/index.js';

/**
 * Get complete dashboard summary for a user
 */
export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  // Fetch all data in parallel for better performance
  const [
    cashBalance,
    totalInvestments,
    totalDebt,
    accounts,
    investmentsSummary,
    debtsSummary,
    creditCards,
    recentTransactions,
    upcomingAlerts,
  ] = await Promise.all([
    accountRepo.getTotalCashBalance(userId),
    investmentRepo.getTotalInvestmentValue(userId),
    debtRepo.getTotalDebt(userId),
    accountRepo.listAccountsByUser(userId),
    investmentRepo.getInvestmentsSummaryByType(userId),
    debtRepo.getDebtsSummaryByType(userId),
    creditCardRepo.listCreditCardsByUser(userId),
    transactionRepo.listTransactions({
      user_id: userId,
      limit: 10,
      sort_by: 'transaction_date',
      sort_order: 'desc',
    }),
    alertRepo.getUnreadAlerts(userId),
  ]);

  // Calculate net worth
  const netWorth = cashBalance + totalInvestments - totalDebt;

  // Transform accounts to summary format
  const accountsSummary: AccountSummary[] = accounts.map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: account.balance,
    currency: account.currency,
  }));

  // Transform investments summary
  const investmentsSummaryFormatted: InvestmentSummary[] = investmentsSummary.map((inv) => ({
    type: inv.type,
    total_value: inv.total_value,
    gain_loss: inv.gain_loss,
    gain_loss_percentage: inv.gain_loss_percentage,
  }));

  // Transform debts summary
  const debtsSummaryFormatted: DebtSummary[] = debtsSummary.map((debt) => ({
    type: debt.type,
    total_balance: debt.total_balance,
    count: debt.count,
  }));

  // Transform credit cards to summary format
  const creditCardsSummary: CreditCardSummary[] = creditCards.map((card) => ({
    id: card.id,
    name: card.name,
    current_balance: card.current_balance,
    credit_limit: card.credit_limit,
    utilization_percentage: card.utilization_percentage,
    due_date: card.due_date,
    minimum_payment: card.minimum_payment,
  }));

  return {
    cash_balance: cashBalance,
    total_investments: totalInvestments,
    total_debt: totalDebt,
    net_worth: netWorth,
    accounts: accountsSummary,
    investments: investmentsSummaryFormatted,
    debts: debtsSummaryFormatted,
    credit_cards: creditCardsSummary,
    recent_transactions: recentTransactions.transactions,
    upcoming_alerts: upcomingAlerts,
  };
}

/**
 * Get cash flow insights for a user
 */
export async function getCashFlowInsights(params: {
  userId: string;
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'week' | 'month' | 'year';
}) {
  const [cashFlow, categoryBreakdown] = await Promise.all([
    transactionRepo.getCashFlowSummary({
      user_id: params.userId,
      start_date: params.startDate,
      end_date: params.endDate,
      group_by: params.groupBy ?? 'month',
    }),
    transactionRepo.getCategoryBreakdown({
      user_id: params.userId,
      start_date: params.startDate,
      end_date: params.endDate,
      type: 'expense',
    }),
  ]);

  // Calculate total for percentage
  const totalExpenses = categoryBreakdown.reduce((sum, cat) => sum + cat.amount, 0);

  // Add percentage to each category
  const categoryBreakdownWithPercentage = categoryBreakdown.map((cat) => ({
    category_id: cat.category_id,
    category_name: cat.category_name,
    amount: cat.amount,
    percentage: totalExpenses > 0 ? (cat.amount / totalExpenses) * 100 : 0,
    transaction_count: cat.transaction_count,
  }));

  return {
    cash_flow: cashFlow,
    expense_breakdown: categoryBreakdownWithPercentage,
  };
}

/**
 * Get upcoming financial obligations (bills, payments, etc.)
 */
export async function getUpcomingObligations(userId: string) {
  const [upcomingDebts, upcomingCreditCards] = await Promise.all([
    debtRepo.getUpcomingDebtPayments(userId),
    creditCardRepo.getUpcomingCreditCardPayments(userId),
  ]);

  return {
    upcoming_debts: upcomingDebts,
    upcoming_credit_cards: upcomingCreditCards,
  };
}

/**
 * Get financial warnings (overdue payments, high utilization, etc.)
 */
export async function getFinancialWarnings(userId: string) {
  const [overdueDebts, overdueCreditCards, highUtilizationCards] = await Promise.all([
    debtRepo.getOverdueDebts(userId),
    creditCardRepo.getOverdueCreditCards(userId),
    creditCardRepo.getHighUtilizationCards(userId),
  ]);

  return {
    overdue_debts: overdueDebts,
    overdue_credit_cards: overdueCreditCards,
    high_utilization_cards: highUtilizationCards,
  };
}

/**
 * Get investment performance summary
 */
export async function getInvestmentPerformance(userId: string) {
  const [performance, summaryByType] = await Promise.all([
    investmentRepo.getInvestmentPerformance(userId),
    investmentRepo.getInvestmentsSummaryByType(userId),
  ]);

  return {
    overall: performance,
    by_type: summaryByType,
  };
}

/**
 * Get credit card recommendations
 */
export async function getCreditCardRecommendation(userId: string) {
  const [bestCard, summary, highUtilization] = await Promise.all([
    creditCardRepo.getBestCardToUse(userId),
    creditCardRepo.getCreditCardSummary(userId),
    creditCardRepo.getHighUtilizationCards(userId),
  ]);

  return {
    recommended_card: bestCard,
    summary,
    high_utilization_warnings: highUtilization,
  };
}

/**
 * Get account balances summary
 */
export async function getAccountsSummary(userId: string) {
  const [accounts, summaryByType] = await Promise.all([
    accountRepo.listAccountsByUser(userId),
    accountRepo.getAccountsSummaryByType(userId),
  ]);

  return {
    accounts,
    summary_by_type: summaryByType,
  };
}
