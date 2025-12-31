/**
 * Credit card service - Business logic for credit card management
 */

import * as alertRepo from '../repositories/alert-repository.js';
import * as creditCardRepo from '../repositories/credit-card-repository.js';
import type { CreateCreditCardInput, UpdateCreditCardInput } from '../types/index.js';

/**
 * Create a new credit card
 */
export async function createCreditCard(data: CreateCreditCardInput) {
  // Validate credit limit
  if (data.credit_limit <= 0) {
    throw new Error('Credit limit must be positive');
  }

  // Validate balance doesn't exceed limit
  const balance = data.current_balance ?? 0;
  if (balance > data.credit_limit) {
    throw new Error('Current balance cannot exceed credit limit');
  }

  return creditCardRepo.createCreditCard(data);
}

/**
 * Get credit card by ID
 */
export async function getCreditCardById(id: string) {
  const card = await creditCardRepo.getCreditCardById(id);

  if (!card) {
    throw new Error('Credit card not found');
  }

  return card;
}

/**
 * List credit cards for a user
 */
export async function listUserCreditCards(userId: string, activeOnly = true) {
  return creditCardRepo.listCreditCardsByUser(userId, activeOnly);
}

/**
 * Update credit card
 */
export async function updateCreditCard(id: string, data: UpdateCreditCardInput) {
  const card = await creditCardRepo.updateCreditCard(id, data);

  if (!card) {
    throw new Error('Credit card not found');
  }

  // Check for high utilization and create alert if needed
  if (card.utilization_percentage > 70 && card.is_active) {
    await alertRepo.createCreditWarningAlert({
      userId: card.user_id,
      title: 'High Credit Utilization',
      message: `Your ${card.name} is at ${card.utilization_percentage.toFixed(1)}% utilization. Consider paying down the balance.`,
      relatedEntityId: card.id,
    });
  }

  return card;
}

/**
 * Make payment on credit card
 */
export async function makePayment(id: string, amount: number) {
  if (amount <= 0) {
    throw new Error('Payment amount must be positive');
  }

  const card = await creditCardRepo.makeCreditCardPayment(id, amount);

  if (!card) {
    throw new Error('Credit card not found');
  }

  return card;
}

/**
 * Deactivate credit card (soft delete)
 */
export async function deactivateCreditCard(id: string) {
  const card = await creditCardRepo.deactivateCreditCard(id);

  if (!card) {
    throw new Error('Credit card not found');
  }

  return card;
}

/**
 * Delete credit card (hard delete)
 */
export async function deleteCreditCard(id: string) {
  await creditCardRepo.deleteCreditCard(id);
}

/**
 * Get upcoming credit card payments
 */
export async function getUpcomingPayments(userId: string) {
  return creditCardRepo.getUpcomingCreditCardPayments(userId);
}

/**
 * Get overdue credit cards
 */
export async function getOverdueCards(userId: string) {
  return creditCardRepo.getOverdueCreditCards(userId);
}

/**
 * Get high utilization cards
 */
export async function getHighUtilizationCards(userId: string) {
  return creditCardRepo.getHighUtilizationCards(userId);
}

/**
 * Get best card to use recommendation
 */
export async function getBestCardRecommendation(userId: string) {
  return creditCardRepo.getBestCardToUse(userId);
}

/**
 * Get credit card summary
 */
export async function getCreditCardSummary(userId: string) {
  const [summary, upcoming, overdue, highUtilization, recommended] = await Promise.all([
    creditCardRepo.getCreditCardSummary(userId),
    creditCardRepo.getUpcomingCreditCardPayments(userId),
    creditCardRepo.getOverdueCreditCards(userId),
    creditCardRepo.getHighUtilizationCards(userId),
    creditCardRepo.getBestCardToUse(userId),
  ]);

  return {
    summary,
    upcoming_payments: upcoming,
    overdue_cards: overdue,
    high_utilization_cards: highUtilization,
    recommended_card: recommended,
  };
}
