/**
 * Investment service - Business logic for investment management
 */

import * as investmentRepo from '../repositories/investment-repository.js';
import type { CreateInvestmentInput, InvestmentType } from '../types/index.js';

/**
 * Create a new investment
 */
export async function createInvestment(data: CreateInvestmentInput) {
  return investmentRepo.createInvestment(data);
}

/**
 * Get investment by ID
 */
export async function getInvestmentById(id: string) {
  const investment = await investmentRepo.getInvestmentById(id);

  if (!investment) {
    throw new Error('Investment not found');
  }

  return investment;
}

/**
 * List investments for a user
 */
export async function listUserInvestments(
  userId: string,
  type?: InvestmentType,
  activeOnly = true
) {
  return investmentRepo.listInvestmentsByUser(userId, { type, activeOnly });
}

/**
 * Update investment
 */
export async function updateInvestment(
  id: string,
  data: Partial<Omit<any, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const investment = await investmentRepo.updateInvestment(id, data);

  if (!investment) {
    throw new Error('Investment not found');
  }

  return investment;
}

/**
 * Update investment value
 */
export async function updateInvestmentValue(id: string, currentValue: number) {
  if (currentValue < 0) {
    throw new Error('Investment value cannot be negative');
  }

  const investment = await investmentRepo.updateInvestmentValue(id, currentValue);

  if (!investment) {
    throw new Error('Investment not found');
  }

  return investment;
}

/**
 * Deactivate investment (soft delete)
 */
export async function deactivateInvestment(id: string) {
  const investment = await investmentRepo.deactivateInvestment(id);

  if (!investment) {
    throw new Error('Investment not found');
  }

  return investment;
}

/**
 * Delete investment (hard delete)
 */
export async function deleteInvestment(id: string) {
  await investmentRepo.deleteInvestment(id);
}

/**
 * Get total investment value for user
 */
export async function getUserInvestmentValue(userId: string) {
  return investmentRepo.getTotalInvestmentValue(userId);
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
