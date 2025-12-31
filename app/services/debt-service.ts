/**
 * Debt service - Business logic for debt management
 */

import * as debtRepo from '../repositories/debt-repository.js';
import type { CreateDebtInput, DebtTermType } from '../types/index.js';

/**
 * Create a new debt
 */
export async function createDebt(data: CreateDebtInput) {
  // Validate that current balance doesn't exceed principal
  if (data.current_balance > data.principal_amount) {
    throw new Error('Current balance cannot exceed principal amount');
  }

  return debtRepo.createDebt(data);
}

/**
 * Get debt by ID
 */
export async function getDebtById(id: string) {
  const debt = await debtRepo.getDebtById(id);

  if (!debt) {
    throw new Error('Debt not found');
  }

  return debt;
}

/**
 * List debts for a user
 */
export async function listUserDebts(
  userId: string,
  type?: DebtTermType,
  activeOnly = true
) {
  return debtRepo.listDebtsByUser(userId, { type, activeOnly });
}

/**
 * Update debt
 */
export async function updateDebt(
  id: string,
  data: Partial<Omit<any, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const debt = await debtRepo.updateDebt(id, data);

  if (!debt) {
    throw new Error('Debt not found');
  }

  return debt;
}

/**
 * Make payment on debt
 */
export async function makePayment(id: string, amount: number) {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  const debt = await debtRepo.makeDebtPayment(id, amount);

  if (!debt) {
    throw new Error('Debt not found');
  }

  return debt;
}

/**
 * Deactivate debt (mark as paid off)
 */
export async function deactivateDebt(id: string) {
  const debt = await debtRepo.deactivateDebt(id);

  if (!debt) {
    throw new Error('Debt not found');
  }

  return debt;
}

/**
 * Delete debt (hard delete)
 */
export async function deleteDebt(id: string) {
  await debtRepo.deleteDebt(id);
}

/**
 * Get total debt for user
 */
export async function getUserTotalDebt(userId: string) {
  return debtRepo.getTotalDebt(userId);
}

/**
 * Get upcoming debt payments
 */
export async function getUpcomingPayments(userId: string) {
  return debtRepo.getUpcomingDebtPayments(userId);
}

/**
 * Get overdue debts
 */
export async function getOverdueDebts(userId: string) {
  return debtRepo.getOverdueDebts(userId);
}

/**
 * Get debt summary by type
 */
export async function getDebtSummary(userId: string) {
  const [total, summaryByType, upcoming, overdue] = await Promise.all([
    debtRepo.getTotalDebt(userId),
    debtRepo.getDebtsSummaryByType(userId),
    debtRepo.getUpcomingDebtPayments(userId),
    debtRepo.getOverdueDebts(userId),
  ]);

  return {
    total_debt: total,
    by_type: summaryByType,
    upcoming_payments: upcoming,
    overdue_payments: overdue,
  };
}
